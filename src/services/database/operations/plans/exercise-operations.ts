/**
 * Exercise-in-Day Operations
 *
 * Add, update, reorder, and remove exercises within plan days.
 */

import { DEFAULT_TARGET_SETS, DEFAULT_TARGET_REPS, MAX_EXERCISES_PER_DAY } from '@/constants';
import { ValidationError } from '@/utils/errors';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../local';
import WorkoutPlanModel from '../../local/models/WorkoutPlan';
import PlanDayModel from '../../local/models/PlanDay';
import PlanDayExerciseModel from '../../local/models/PlanDayExercise';
import { requireAuth, validateOwnership } from '../../utils/requireAuth';
import { withDatabaseError } from '../../utils/withDatabaseError';
import type { PlanDayExercise, AddExerciseToPlanDay } from './types';
import { planDayExerciseToPlain } from './mappers';

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate that exercises can be added to a plan day.
 *
 * Checks max exercise limit and duplicates (against existing + within batch).
 * Designed to be called inside a database.write() transaction — does not
 * perform any database queries itself.
 *
 * @throws {ValidationError} If limit exceeded or duplicates found
 */
export function validateExerciseAdditions(params: {
  currentCount: number;
  existingExerciseIds: Set<string>;
  newExerciseIds: string[];
  dayId: string;
}): void {
  const { currentCount, existingExerciseIds, newExerciseIds, dayId } = params;

  // Check limit
  if (currentCount + newExerciseIds.length > MAX_EXERCISES_PER_DAY) {
    const available = MAX_EXERCISES_PER_DAY - currentCount;
    throw new ValidationError(
      available <= 0
        ? `This day already has ${MAX_EXERCISES_PER_DAY} exercises (maximum)`
        : `Can only add ${available} more exercise${available !== 1 ? 's' : ''} to this day (${currentCount}/${MAX_EXERCISES_PER_DAY})`,
      `Day ${dayId} has ${currentCount} exercises, tried to add ${newExerciseIds.length} (max: ${MAX_EXERCISES_PER_DAY})`
    );
  }

  // Check duplicates (against existing + within batch)
  const seen = new Set<string>();
  const duplicates: string[] = [];

  for (const exerciseId of newExerciseIds) {
    if (existingExerciseIds.has(exerciseId) || seen.has(exerciseId)) {
      duplicates.push(exerciseId);
    }
    seen.add(exerciseId);
  }

  if (duplicates.length > 0) {
    throw new ValidationError(
      duplicates.length === 1
        ? 'This exercise is already in this workout day'
        : `${duplicates.length} exercises are already in this workout day`,
      `Duplicate exercise IDs in day ${dayId}: ${duplicates.join(', ')}`
    );
  }
}

// ============================================================================
// CREATE
// ============================================================================

/**
 * Add an exercise to a plan day
 *
 * @throws {AuthError} If user is not authenticated
 * @throws {DatabaseError} If database operation fails
 */
export async function addExerciseToPlanDay(data: AddExerciseToPlanDay): Promise<PlanDayExercise> {
  return withDatabaseError(
    async () => {
      const currentUser = requireAuth('add exercises');

      const planDayExercise = await database.write(async () => {
        // Verify user owns the plan that contains this day
        const planDay = await database.get<PlanDayModel>('plan_days').find(data.plan_day_id);
        const plan = await database.get<WorkoutPlanModel>('workout_plans').find(planDay.planId);

        validateOwnership(plan.userId, currentUser.id, 'modify this plan');

        // Fetch existing exercises (one query for both limit + duplicate checks)
        const existingExercises = await database
          .get<PlanDayExerciseModel>('plan_day_exercises')
          .query(Q.where('plan_day_id', data.plan_day_id))
          .fetch();

        validateExerciseAdditions({
          currentCount: existingExercises.length,
          existingExerciseIds: new Set(existingExercises.map((e) => e.exerciseId)),
          newExerciseIds: [data.exercise_id],
          dayId: data.plan_day_id,
        });

        return await database.get<PlanDayExerciseModel>('plan_day_exercises').create((pde) => {
          pde.planDayId = data.plan_day_id;
          pde.exerciseId = data.exercise_id;
          pde.orderIndex = data.order_index;
          pde.targetSets = data.target_sets ?? DEFAULT_TARGET_SETS;
          pde.targetReps = data.target_reps ?? DEFAULT_TARGET_REPS;
          if (data.rest_timer_seconds) pde.restTimerSeconds = data.rest_timer_seconds;
          if (data.notes) pde.notes = data.notes;
        });
      });

      return planDayExerciseToPlain(planDayExercise);
    },
    'Unable to add exercise. Please try again.',
    'Failed to add exercise to plan day'
  );
}

/**
 * Add multiple exercises to a plan day in a single transaction.
 *
 * Validates max exercise limit and duplicate exercises before creating.
 * All exercises are created within one database.write() for performance.
 *
 * @throws {AuthError} If user is not authenticated
 * @throws {ValidationError} If limit exceeded or duplicates found
 * @throws {DatabaseError} If database operation fails
 */
export async function addExercisesToPlanDay(
  planDayId: string,
  exercises: Array<{
    exercise_id: string;
    order_index: number;
    target_sets?: number;
    target_reps?: number;
    rest_timer_seconds?: number;
    notes?: string;
  }>
): Promise<PlanDayExercise[]> {
  if (exercises.length === 0) return [];

  return withDatabaseError(
    async () => {
      const currentUser = requireAuth('add exercises');

      const results = await database.write(async () => {
        // Verify user owns the plan that contains this day
        const planDay = await database.get<PlanDayModel>('plan_days').find(planDayId);
        const plan = await database.get<WorkoutPlanModel>('workout_plans').find(planDay.planId);

        validateOwnership(plan.userId, currentUser.id, 'modify this plan');

        // Fetch existing exercises (one query for both limit + duplicate checks)
        const existingExercises = await database
          .get<PlanDayExerciseModel>('plan_day_exercises')
          .query(Q.where('plan_day_id', planDayId))
          .fetch();

        validateExerciseAdditions({
          currentCount: existingExercises.length,
          existingExerciseIds: new Set(existingExercises.map((e) => e.exerciseId)),
          newExerciseIds: exercises.map((e) => e.exercise_id),
          dayId: planDayId,
        });

        // Prepare all creates, then execute in a single batch (1 adapter op, 1 emission)
        const created = exercises.map((ex) =>
          database.get<PlanDayExerciseModel>('plan_day_exercises').prepareCreate((rec) => {
            rec.planDayId = planDayId;
            rec.exerciseId = ex.exercise_id;
            rec.orderIndex = ex.order_index;
            rec.targetSets = ex.target_sets ?? DEFAULT_TARGET_SETS;
            rec.targetReps = ex.target_reps ?? DEFAULT_TARGET_REPS;
            if (ex.rest_timer_seconds) rec.restTimerSeconds = ex.rest_timer_seconds;
            if (ex.notes) rec.notes = ex.notes;
          })
        );

        await database.batch(...created);
        return created;
      });

      return results.map(planDayExerciseToPlain);
    },
    'Unable to add exercises. Please try again.',
    'Failed to batch add exercises to plan day'
  );
}

// ============================================================================
// UPDATE
// ============================================================================

/**
 * Update plan day exercise (target sets/reps, rest timer, notes)
 */
export async function updatePlanDayExercise(
  id: string,
  updates: {
    target_sets?: number;
    target_reps?: number;
    rest_timer_seconds?: number;
    notes?: string;
  }
): Promise<PlanDayExercise> {
  return withDatabaseError(
    async () => {
      const currentUser = requireAuth('update exercises');

      const planDayExercise = await database.write(async () => {
        const pde = await database.get<PlanDayExerciseModel>('plan_day_exercises').find(id);
        const planDay = await database.get<PlanDayModel>('plan_days').find(pde.planDayId);
        const plan = await database.get<WorkoutPlanModel>('workout_plans').find(planDay.planId);

        validateOwnership(plan.userId, currentUser.id, 'update this plan');

        await pde.update((e) => {
          if (updates.target_sets !== undefined) e.targetSets = updates.target_sets;
          if (updates.target_reps !== undefined) e.targetReps = updates.target_reps;
          if (updates.rest_timer_seconds !== undefined)
            e.restTimerSeconds = updates.rest_timer_seconds;
          if (updates.notes !== undefined) e.notes = updates.notes;
        });

        return pde;
      });

      return planDayExerciseToPlain(planDayExercise);
    },
    'Unable to update exercise. Please try again.',
    `Failed to update plan day exercise ${id}`
  );
}

/**
 * Reorder exercises within a plan day (batch update)
 * @param exercises Array of {id, order_index} to update
 */
export async function reorderPlanDayExercises(
  exercises: Array<{ id: string; order_index: number }>
): Promise<void> {
  if (exercises.length === 0) return;

  return withDatabaseError(
    async () => {
      const currentUser = requireAuth('reorder exercises');

      await database.write(async () => {
        // Verify ownership via first exercise
        const firstExercise = exercises[0];
        if (!firstExercise) return; // Already checked above, but TypeScript needs this

        const firstPde = await database
          .get<PlanDayExerciseModel>('plan_day_exercises')
          .find(firstExercise.id);
        const planDay = await database.get<PlanDayModel>('plan_days').find(firstPde.planDayId);
        const plan = await database.get<WorkoutPlanModel>('workout_plans').find(planDay.planId);

        validateOwnership(plan.userId, currentUser.id, 'reorder these exercises');

        // Prepare all updates, then execute in a single batch (1 adapter op, 1 emission)
        const preparedUpdates = await Promise.all(
          exercises.map(async ({ id, order_index }) => {
            const pde = await database.get<PlanDayExerciseModel>('plan_day_exercises').find(id);
            return pde.prepareUpdate((e) => {
              e.orderIndex = order_index;
            });
          })
        );
        await database.batch(...preparedUpdates);
      });
    },
    'Unable to reorder exercises. Please try again.',
    'Failed to reorder exercises'
  );
}

// ============================================================================
// DELETE
// ============================================================================

/**
 * Remove exercise from plan day
 */
export async function removeExerciseFromPlanDay(id: string): Promise<void> {
  return withDatabaseError(
    async () => {
      const currentUser = requireAuth('remove exercises');

      await database.write(async () => {
        const pde = await database.get<PlanDayExerciseModel>('plan_day_exercises').find(id);
        const planDay = await database.get<PlanDayModel>('plan_days').find(pde.planDayId);
        const plan = await database.get<WorkoutPlanModel>('workout_plans').find(planDay.planId);

        validateOwnership(plan.userId, currentUser.id, 'remove this exercise');

        await pde.markAsDeleted();
      });
    },
    'Unable to remove exercise. Please try again.',
    `Failed to remove exercise from plan day ${id}`
  );
}
