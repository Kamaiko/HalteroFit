/**
 * Day-level CRUD Operations
 *
 * Create, read, observe, update, reorder, and delete plan days.
 * Includes the batch savePlanDayEdits transaction.
 */

import {
  DEFAULT_TARGET_SETS,
  DEFAULT_TARGET_REPS,
  MAX_EXERCISES_PER_DAY,
  MAX_DAYS_PER_PLAN,
} from '@/constants';
import { validateDayName } from '@/utils/validators';
import { ValidationError } from '@/utils/errors';
import { type Model, Q } from '@nozbe/watermelondb';
import { Observable, combineLatest, of, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { database } from '../../local';
import WorkoutPlanModel from '../../local/models/WorkoutPlan';
import PlanDayModel from '../../local/models/PlanDay';
import PlanDayExerciseModel from '../../local/models/PlanDayExercise';
import ExerciseModel from '../../local/models/Exercise';
import { requireAuth, validateOwnership } from '../../utils/requireAuth';
import { withDatabaseError } from '../../utils/withDatabaseError';
import type { PlanDay, PlanDayWithExercises, CreatePlanDay, UpdatePlanDay } from './types';
import {
  planDayToPlain,
  planDayExerciseToPlain,
  planDayExerciseWithDetailToPlain,
  countExercisesByDay,
  computeDominantMuscleGroup,
} from './mappers';

// ============================================================================
// CREATE
// ============================================================================

/**
 * Create a new day in a plan
 *
 * @throws {AuthError} If user is not authenticated
 * @throws {DatabaseError} If database operation fails
 */
export async function createPlanDay(data: CreatePlanDay): Promise<PlanDay> {
  return withDatabaseError(
    async () => {
      const currentUser = requireAuth('add days to plans');

      const planDay = await database.write(async () => {
        // Verify user owns this plan
        const plan = await database.get<WorkoutPlanModel>('workout_plans').find(data.plan_id);
        validateOwnership(plan.userId, currentUser.id, 'modify this plan');

        // Check max days limit
        const existingDays = await database
          .get<PlanDayModel>('plan_days')
          .query(Q.where('plan_id', data.plan_id))
          .fetchCount();

        if (existingDays >= MAX_DAYS_PER_PLAN) {
          throw new ValidationError(
            `Cannot add more than ${MAX_DAYS_PER_PLAN} days to a workout plan`,
            `Plan ${data.plan_id} already has ${existingDays} days (max: ${MAX_DAYS_PER_PLAN})`
          );
        }

        return await database.get<PlanDayModel>('plan_days').create((day) => {
          day.planId = data.plan_id;
          day.name = data.name;
          if (data.day_of_week) day.dayOfWeek = data.day_of_week;
          day.orderIndex = data.order_index;
        });
      });

      return planDayToPlain(planDay);
    },
    'Unable to add day to plan. Please try again.',
    'Failed to create plan day'
  );
}

// ============================================================================
// BATCH: Save All Edit-Day Changes
// ============================================================================

/**
 * Save all edit-day changes in a single transaction.
 *
 * Performs name update, removals, additions, and reorders atomically.
 * Much faster than calling individual operations sequentially.
 *
 * @throws {AuthError} If user is not authenticated
 * @throws {ValidationError} If name too long or exercise limit exceeded
 * @throws {DatabaseError} If database operation fails
 */
export async function savePlanDayEdits(data: {
  dayId: string;
  name?: string;
  removedExerciseIds: string[];
  addedExercises: Array<{ exercise_id: string; order_index: number }>;
  reorderedExercises: Array<{ id: string; order_index: number }>;
}): Promise<void> {
  return withDatabaseError(
    async () => {
      const currentUser = requireAuth('save changes');

      await database.write(async () => {
        // Verify user owns the plan that contains this day
        const planDay = await database.get<PlanDayModel>('plan_days').find(data.dayId);
        const plan = await database.get<WorkoutPlanModel>('workout_plans').find(planDay.planId);

        validateOwnership(plan.userId, currentUser.id, 'modify this plan');

        // Collect all operations, then execute in a single database.batch()
        // This triggers only 1 adapter operation and 1 observable emission
        const allOperations: Model[] = [];

        // 1. Update day name if provided
        if (data.name !== undefined) {
          const trimmedName = data.name.trim();
          validateDayName(data.name, `day ${data.dayId}`);
          allOperations.push(
            planDay.prepareUpdate((d) => {
              d.name = trimmedName;
            })
          );
        }

        // 2. Prepare deletions
        const preparedDeletions = await Promise.all(
          data.removedExerciseIds.map(async (removeId) => {
            const pde = await database
              .get<PlanDayExerciseModel>('plan_day_exercises')
              .find(removeId);
            return pde.prepareMarkAsDeleted();
          })
        );
        allOperations.push(...preparedDeletions);

        // 3. Prepare additions (with duplicate + limit check)
        if (data.addedExercises.length > 0) {
          // Get current exercises (accounting for prepared deletions)
          const currentExercises = await database
            .get<PlanDayExerciseModel>('plan_day_exercises')
            .query(Q.where('plan_day_id', data.dayId))
            .fetch();

          // Subtract the ones we're about to delete
          const deletedIds = new Set(data.removedExerciseIds);
          const remainingExercises = currentExercises.filter((e) => !deletedIds.has(e.id));
          const currentCount = remainingExercises.length;
          const existingExerciseIds = new Set(remainingExercises.map((e) => e.exerciseId));

          // Check limit
          if (currentCount + data.addedExercises.length > MAX_EXERCISES_PER_DAY) {
            const available = MAX_EXERCISES_PER_DAY - currentCount;
            throw new ValidationError(
              available <= 0
                ? `This day already has ${MAX_EXERCISES_PER_DAY} exercises (maximum)`
                : `Can only add ${available} more exercise${available !== 1 ? 's' : ''} (${currentCount}/${MAX_EXERCISES_PER_DAY})`,
              `Day ${data.dayId} has ${currentCount} exercises after removals, tried to add ${data.addedExercises.length}`
            );
          }

          // Check duplicates
          for (const ex of data.addedExercises) {
            if (existingExerciseIds.has(ex.exercise_id)) {
              throw new ValidationError(
                'One or more exercises are already in this workout day',
                `Duplicate exercise ${ex.exercise_id} in day ${data.dayId}`
              );
            }
          }

          // Prepare creates
          const preparedCreates = data.addedExercises.map((ex) =>
            database.get<PlanDayExerciseModel>('plan_day_exercises').prepareCreate((pde) => {
              pde.planDayId = data.dayId;
              pde.exerciseId = ex.exercise_id;
              pde.orderIndex = ex.order_index;
              pde.targetSets = DEFAULT_TARGET_SETS;
              pde.targetReps = DEFAULT_TARGET_REPS;
            })
          );
          allOperations.push(...preparedCreates);
        }

        // 4. Prepare reorders
        const preparedReorders = await Promise.all(
          data.reorderedExercises.map(async ({ id, order_index }) => {
            const pde = await database.get<PlanDayExerciseModel>('plan_day_exercises').find(id);
            return pde.prepareUpdate((e) => {
              e.orderIndex = order_index;
            });
          })
        );
        allOperations.push(...preparedReorders);

        // Execute ALL operations in a single batch
        if (allOperations.length > 0) {
          await database.batch(...allOperations);
        }
      });
    },
    'Unable to save changes. Please try again.',
    `Failed to save plan day edits for ${data.dayId}`
  );
}

// ============================================================================
// READ (Dual API - Promise + Observable)
// ============================================================================

/**
 * Observe plan days for a given plan (Observable)
 * Emits whenever days are added, removed, reordered, or renamed.
 */
export function observePlanDays(planId: string): Observable<PlanDay[]> {
  return database
    .get<PlanDayModel>('plan_days')
    .query(Q.where('plan_id', planId), Q.sortBy('order_index', Q.asc))
    .observeWithColumns(['name', 'order_index'])
    .pipe(map((days) => days.map(planDayToPlain)));
}

/**
 * Observe exercise counts for multiple plan days (Observable)
 * Emits whenever exercises are added or removed from any of the given days.
 */
export function observeExerciseCountsByDays(
  planDayIds: string[]
): Observable<Record<string, number>> {
  if (planDayIds.length === 0) return of({});

  return database
    .get<PlanDayExerciseModel>('plan_day_exercises')
    .query(Q.where('plan_day_id', Q.oneOf(planDayIds)))
    .observe()
    .pipe(map((exercises) => countExercisesByDay(exercises, planDayIds)));
}

/**
 * Observe the dominant muscle group for multiple plan days (Observable).
 * Returns the most frequently targeted muscle group ID per day.
 *
 * Exercises are sorted by order_index, so on a tie the muscle group
 * whose first exercise appears earliest in the day wins.
 */
export function observeDominantMuscleByDays(
  planDayIds: string[]
): Observable<Record<string, string | null>> {
  if (planDayIds.length === 0) return of({});

  return database
    .get<PlanDayExerciseModel>('plan_day_exercises')
    .query(Q.where('plan_day_id', Q.oneOf(planDayIds)), Q.sortBy('order_index', Q.asc))
    .observe()
    .pipe(
      switchMap((dayExercises) => {
        if (dayExercises.length === 0) {
          const empty: Record<string, string | null> = {};
          for (const id of planDayIds) empty[id] = null;
          return of(empty);
        }

        // Collect unique exercise IDs and fetch their target muscles
        const exerciseIds = [...new Set(dayExercises.map((de) => de.exerciseId))];

        return from(
          Promise.all(exerciseIds.map((id) => database.get<ExerciseModel>('exercises').find(id)))
        ).pipe(
          map((exercises) => {
            const exerciseMap = new Map(exercises.map((e) => [e.id, e.targetMuscles]));

            // Accumulate target muscles per day (in order_index order)
            const musclesByDay = new Map<string, string[]>();
            for (const id of planDayIds) musclesByDay.set(id, []);

            for (const de of dayExercises) {
              const targets = exerciseMap.get(de.exerciseId) ?? [];
              musclesByDay.get(de.planDayId)?.push(...targets);
            }

            // Compute dominant group per day
            const result: Record<string, string | null> = {};
            for (const [dayId, muscles] of musclesByDay) {
              result[dayId] = computeDominantMuscleGroup(muscles);
            }
            return result;
          })
        );
      })
    );
}

/**
 * Observe plan day with its exercises (Observable - hybrid)
 *
 * Subscribes to planDay + plan_day_exercises tables (2 subscriptions).
 * Exercise reference data (name, muscles, gif) is looked up via cached find()
 * since it's static seed data that doesn't change during normal use.
 */
export function observePlanDayWithExercises(planDayId: string): Observable<PlanDayWithExercises> {
  return combineLatest([
    database.get<PlanDayModel>('plan_days').findAndObserve(planDayId),
    database
      .get<PlanDayExerciseModel>('plan_day_exercises')
      .query(Q.where('plan_day_id', planDayId), Q.sortBy('order_index', Q.asc))
      .observe(),
  ]).pipe(
    switchMap(([planDay, planDayExercises]) => {
      if (planDayExercises.length === 0) {
        return of<PlanDayWithExercises>({
          ...planDayToPlain(planDay),
          exercises: [],
        });
      }

      return from(
        Promise.all(
          planDayExercises.map(async (pde) => {
            const exercise = await database.get<ExerciseModel>('exercises').find(pde.exerciseId);
            return planDayExerciseWithDetailToPlain(pde, exercise);
          })
        )
      ).pipe(
        map((exercises) => ({
          ...planDayToPlain(planDay),
          exercises,
        }))
      );
    })
  );
}

/**
 * Get plan day with all its exercises (Promise)
 */
export async function getPlanDayWithExercises(planDayId: string): Promise<PlanDayWithExercises> {
  return withDatabaseError(
    async () => {
      const planDay = await database.get<PlanDayModel>('plan_days').find(planDayId);
      const planDayExercises = await database
        .get<PlanDayExerciseModel>('plan_day_exercises')
        .query(Q.where('plan_day_id', planDayId), Q.sortBy('order_index', Q.asc))
        .fetch();

      const exercisesWithDetails = await Promise.all(
        planDayExercises.map(async (pde) => {
          const exercise = await database.get<ExerciseModel>('exercises').find(pde.exerciseId);
          return planDayExerciseWithDetailToPlain(pde, exercise);
        })
      );

      return {
        ...planDayToPlain(planDay),
        exercises: exercisesWithDetails,
      };
    },
    'Unable to load day details. Please try again.',
    `Failed to get plan day with exercises for ID ${planDayId}`
  );
}

/**
 * Get exercise count for a plan day (Promise)
 */
export async function getExerciseCountByDay(planDayId: string): Promise<number> {
  return withDatabaseError(
    async () => {
      const count = await database
        .get<PlanDayExerciseModel>('plan_day_exercises')
        .query(Q.where('plan_day_id', planDayId))
        .fetchCount();
      return count;
    },
    'Unable to count exercises. Please try again.',
    `Failed to count exercises for day ${planDayId}`
  );
}

/**
 * Get exercise IDs and count for a plan day (Promise)
 * Used by exercise picker to check duplicates and limits.
 */
export async function getExerciseIdsAndCountByDay(
  planDayId: string
): Promise<{ exerciseIds: string[]; count: number }> {
  return withDatabaseError(
    async () => {
      const exercises = await database
        .get<PlanDayExerciseModel>('plan_day_exercises')
        .query(Q.where('plan_day_id', planDayId))
        .fetch();
      const exerciseIds = exercises.map((e) => e.exerciseId);
      return { exerciseIds, count: exerciseIds.length };
    },
    'Unable to load exercises. Please try again.',
    `Failed to get exercise IDs for day ${planDayId}`
  );
}

/**
 * Get exercise counts for multiple plan days (Promise)
 * Returns a map of day_id -> count
 */
export async function getExerciseCountsByDays(
  planDayIds: string[]
): Promise<Record<string, number>> {
  if (planDayIds.length === 0) return {};

  return withDatabaseError(
    async () => {
      const exercises = await database
        .get<PlanDayExerciseModel>('plan_day_exercises')
        .query(Q.where('plan_day_id', Q.oneOf(planDayIds)))
        .fetch();

      return countExercisesByDay(exercises, planDayIds);
    },
    'Unable to count exercises. Please try again.',
    'Failed to count exercises for days'
  );
}

// ============================================================================
// UPDATE
// ============================================================================

/**
 * Update plan day
 */
export async function updatePlanDay(id: string, updates: UpdatePlanDay): Promise<PlanDay> {
  return withDatabaseError(
    async () => {
      const currentUser = requireAuth('update plan days');

      const planDay = await database.write(async () => {
        const planDay = await database.get<PlanDayModel>('plan_days').find(id);
        const plan = await database.get<WorkoutPlanModel>('workout_plans').find(planDay.planId);

        validateOwnership(plan.userId, currentUser.id, 'update this plan');

        // Validate name length if being updated
        if (updates.name !== undefined) {
          validateDayName(updates.name, `plan day ${id}`);
        }

        await planDay.update((d) => {
          if (updates.name !== undefined) d.name = updates.name;
          if (updates.day_of_week !== undefined) d.dayOfWeek = updates.day_of_week;
          if (updates.order_index !== undefined) d.orderIndex = updates.order_index;
        });

        return planDay;
      });

      return planDayToPlain(planDay);
    },
    'Unable to update day. Please try again.',
    `Failed to update plan day ${id}`
  );
}

/**
 * Reorder plan days by updating order_index for each day.
 */
export async function reorderPlanDays(
  days: Array<{ id: string; order_index: number }>
): Promise<void> {
  if (days.length === 0) return;

  return withDatabaseError(
    async () => {
      const currentUser = requireAuth('reorder days');

      await database.write(async () => {
        // Verify ownership: day → plan → user
        const planDay = await database.get<PlanDayModel>('plan_days').find(days[0]!.id);
        const plan = await database.get<WorkoutPlanModel>('workout_plans').find(planDay.planId);

        validateOwnership(plan.userId, currentUser.id, 'reorder these days');

        // Prepare all updates, then execute in a single batch (1 adapter op, 1 emission)
        const preparedUpdates = await Promise.all(
          days.map(async ({ id, order_index }) => {
            const day = await database.get<PlanDayModel>('plan_days').find(id);
            return day.prepareUpdate((d) => {
              d.orderIndex = order_index;
            });
          })
        );
        await database.batch(...preparedUpdates);
      });
    },
    'Unable to reorder days. Please try again.',
    'Failed to reorder days'
  );
}

// ============================================================================
// DELETE
// ============================================================================

/**
 * Delete plan day
 */
export async function deletePlanDay(id: string): Promise<void> {
  return withDatabaseError(
    async () => {
      const currentUser = requireAuth('delete days');

      await database.write(async () => {
        const planDay = await database.get<PlanDayModel>('plan_days').find(id);
        const plan = await database.get<WorkoutPlanModel>('workout_plans').find(planDay.planId);

        validateOwnership(plan.userId, currentUser.id, 'delete this day');

        // Collect all deletions (exercises + day) into a single batch
        const exercises = await database
          .get<PlanDayExerciseModel>('plan_day_exercises')
          .query(Q.where('plan_day_id', id))
          .fetch();

        await database.batch(
          ...exercises.map((e) => e.prepareMarkAsDeleted()),
          planDay.prepareMarkAsDeleted()
        );
      });
    },
    'Unable to delete day. Please try again.',
    `Failed to delete plan day ${id}`
  );
}
