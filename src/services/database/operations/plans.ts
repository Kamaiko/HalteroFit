/**
 * Workout Plans CRUD Operations - WatermelonDB Implementation
 *
 * Dual API Architecture:
 * - Promise-based functions for imperative code (actions)
 * - Observable-based functions for reactive UI (hooks)
 *
 * All operations are LOCAL FIRST (instant), sync happens separately
 */

import { DEFAULT_TARGET_SETS, DEFAULT_TARGET_REPS } from '@/constants';
import { Q } from '@nozbe/watermelondb';
import { Observable, combineLatest, of, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { database } from '../local';
import WorkoutPlanModel from '../local/models/WorkoutPlan';
import PlanDayModel from '../local/models/PlanDay';
import PlanDayExerciseModel from '../local/models/PlanDayExercise';
import ExerciseModel from '../local/models/Exercise';
import { useAuthStore } from '@/stores/auth/authStore';
import { DatabaseError, AuthError } from '@/utils/errors';

// ============================================================================
// Types
// ============================================================================

export interface WorkoutPlan {
  id: string;
  user_id: string;
  name: string;
  is_active: boolean;
  cover_image_url?: string;
  created_at: number;
  updated_at: number;
}

export interface PlanDay {
  id: string;
  plan_id: string;
  name: string;
  day_of_week?: string;
  order_index: number;
  created_at: number;
  updated_at: number;
}

export interface PlanDayExercise {
  id: string;
  plan_day_id: string;
  exercise_id: string;
  order_index: number;
  target_sets: number;
  target_reps: number;
  rest_timer_seconds?: number;
  notes?: string;
  created_at: number;
  updated_at: number;
}

export interface PlanWithDays extends WorkoutPlan {
  days: PlanDay[];
}

export interface PlanDayWithExercises extends PlanDay {
  exercises: (PlanDayExercise & {
    exercise: {
      id: string;
      name: string;
      body_parts: string[];
      target_muscles: string[];
      equipments: string[];
      gif_url?: string;
    };
  })[];
}

export interface CreatePlan {
  user_id: string;
  name: string;
  is_active?: boolean;
  cover_image_url?: string;
}

export interface UpdatePlan {
  name?: string;
  is_active?: boolean;
  cover_image_url?: string;
}

export interface CreatePlanDay {
  plan_id: string;
  name: string;
  day_of_week?: string;
  order_index: number;
}

export interface UpdatePlanDay {
  name?: string;
  day_of_week?: string;
  order_index?: number;
}

export interface AddExerciseToPlanDay {
  plan_day_id: string;
  exercise_id: string;
  order_index: number;
  target_sets?: number;
  target_reps?: number;
  rest_timer_seconds?: number;
  notes?: string;
}

// ============================================================================
// Helper: Convert WatermelonDB Models to Plain Objects
// ============================================================================

function planToPlain(plan: WorkoutPlanModel): WorkoutPlan {
  return {
    id: plan.id,
    user_id: plan.userId,
    name: plan.name,
    is_active: plan.isActive,
    cover_image_url: plan.coverImageUrl ?? undefined,
    created_at: plan.createdAt.getTime(),
    updated_at: plan.updatedAt.getTime(),
  };
}

function planDayToPlain(day: PlanDayModel): PlanDay {
  return {
    id: day.id,
    plan_id: day.planId,
    name: day.name,
    day_of_week: day.dayOfWeek ?? undefined,
    order_index: day.orderIndex,
    created_at: day.createdAt.getTime(),
    updated_at: day.updatedAt.getTime(),
  };
}

function planDayExerciseToPlain(pde: PlanDayExerciseModel): PlanDayExercise {
  return {
    id: pde.id,
    plan_day_id: pde.planDayId,
    exercise_id: pde.exerciseId,
    order_index: pde.orderIndex,
    target_sets: pde.targetSets,
    target_reps: pde.targetReps,
    rest_timer_seconds: pde.restTimerSeconds ?? undefined,
    notes: pde.notes ?? undefined,
    created_at: pde.createdAt.getTime(),
    updated_at: pde.updatedAt.getTime(),
  };
}

// ============================================================================
// CREATE Operations
// ============================================================================

/**
 * Create a new workout plan
 *
 * @throws {AuthError} If user is not authenticated or user ID mismatch
 * @throws {DatabaseError} If database operation fails
 */
export async function createPlan(data: CreatePlan): Promise<WorkoutPlan> {
  try {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser?.id) {
      throw new AuthError(
        'Please sign in to create workout plans',
        'User not authenticated - no user.id in authStore'
      );
    }

    if (data.user_id !== currentUser.id) {
      throw new AuthError(
        'Authentication error. Please sign out and sign in again.',
        `User ID mismatch - Expected: ${currentUser.id}, Received: ${data.user_id}`
      );
    }

    const plan = await database.write(async () => {
      // If setting as active, deactivate other plans first
      if (data.is_active) {
        const activePlans = await database
          .get<WorkoutPlanModel>('workout_plans')
          .query(Q.where('user_id', data.user_id), Q.where('is_active', true))
          .fetch();

        for (const activePlan of activePlans) {
          await activePlan.update((p) => {
            p.isActive = false;
          });
        }
      }

      return await database.get<WorkoutPlanModel>('workout_plans').create((plan) => {
        plan.userId = data.user_id;
        plan.name = data.name;
        plan.isActive = data.is_active ?? false;
        if (data.cover_image_url) plan.coverImageUrl = data.cover_image_url;
      });
    });

    return planToPlain(plan);
  } catch (error) {
    if (error instanceof AuthError || error instanceof DatabaseError) {
      throw error;
    }

    throw new DatabaseError(
      'Unable to create workout plan. Please try again.',
      `Failed to create plan: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Create a new day in a plan
 *
 * @throws {AuthError} If user is not authenticated
 * @throws {DatabaseError} If database operation fails
 */
export async function createPlanDay(data: CreatePlanDay): Promise<PlanDay> {
  try {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser?.id) {
      throw new AuthError(
        'Please sign in to add days to plans',
        'User not authenticated - no user.id in authStore'
      );
    }

    const planDay = await database.write(async () => {
      // Verify user owns this plan
      const plan = await database.get<WorkoutPlanModel>('workout_plans').find(data.plan_id);
      if (plan.userId !== currentUser.id) {
        throw new AuthError(
          'You do not have permission to modify this plan',
          `User ${currentUser.id} attempted to modify plan owned by ${plan.userId}`
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
  } catch (error) {
    if (error instanceof AuthError || error instanceof DatabaseError) {
      throw error;
    }

    throw new DatabaseError(
      'Unable to add day to plan. Please try again.',
      `Failed to create plan day: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Add an exercise to a plan day
 *
 * @throws {AuthError} If user is not authenticated
 * @throws {DatabaseError} If database operation fails
 */
export async function addExerciseToPlanDay(data: AddExerciseToPlanDay): Promise<PlanDayExercise> {
  try {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser?.id) {
      throw new AuthError(
        'Please sign in to add exercises',
        'User not authenticated - no user.id in authStore'
      );
    }

    const planDayExercise = await database.write(async () => {
      // Verify user owns the plan that contains this day
      const planDay = await database.get<PlanDayModel>('plan_days').find(data.plan_day_id);
      const plan = await database.get<WorkoutPlanModel>('workout_plans').find(planDay.planId);

      if (plan.userId !== currentUser.id) {
        throw new AuthError(
          'You do not have permission to modify this plan',
          `User ${currentUser.id} attempted to modify plan owned by ${plan.userId}`
        );
      }

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
  } catch (error) {
    if (error instanceof AuthError || error instanceof DatabaseError) {
      throw error;
    }

    throw new DatabaseError(
      'Unable to add exercise. Please try again.',
      `Failed to add exercise to plan day: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// ============================================================================
// READ Operations (Dual API - Promise + Observable)
// ============================================================================

/**
 * Get plan by ID (Promise)
 */
export async function getPlanById(id: string): Promise<WorkoutPlan> {
  try {
    const plan = await database.get<WorkoutPlanModel>('workout_plans').find(id);
    return planToPlain(plan);
  } catch (error) {
    throw new DatabaseError(
      'Unable to load workout plan. Please try again.',
      `Failed to get plan by ID ${id}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Observe plan by ID (Observable)
 */
export function observePlan(id: string): Observable<WorkoutPlan> {
  return database.get<WorkoutPlanModel>('workout_plans').findAndObserve(id).pipe(map(planToPlain));
}

/**
 * Get all plans for user (Promise)
 */
export async function getUserPlans(userId: string): Promise<WorkoutPlan[]> {
  try {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser?.id) {
      throw new AuthError(
        'Please sign in to view plans',
        'User not authenticated - no user.id in authStore'
      );
    }

    if (userId !== currentUser.id) {
      throw new AuthError(
        'Authentication error. Please sign out and sign in again.',
        `User ID mismatch - Expected: ${currentUser.id}, Received: ${userId}`
      );
    }

    const plans = await database
      .get<WorkoutPlanModel>('workout_plans')
      .query(Q.where('user_id', userId), Q.sortBy('created_at', Q.desc))
      .fetch();

    return plans.map(planToPlain);
  } catch (error) {
    if (error instanceof AuthError || error instanceof DatabaseError) {
      throw error;
    }

    throw new DatabaseError(
      'Unable to load plans. Please try again.',
      `Failed to get user plans: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Observe all plans for user (Observable)
 */
export function observeUserPlans(userId: string): Observable<WorkoutPlan[]> {
  return database
    .get<WorkoutPlanModel>('workout_plans')
    .query(Q.where('user_id', userId), Q.sortBy('created_at', Q.desc))
    .observe()
    .pipe(map((plans) => plans.map(planToPlain)));
}

/**
 * Get active plan for user (Promise)
 */
export async function getActivePlan(userId: string): Promise<WorkoutPlan | null> {
  try {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser?.id) {
      throw new AuthError(
        'Please sign in to view active plan',
        'User not authenticated - no user.id in authStore'
      );
    }

    if (userId !== currentUser.id) {
      throw new AuthError(
        'Authentication error. Please sign out and sign in again.',
        `User ID mismatch - Expected: ${currentUser.id}, Received: ${userId}`
      );
    }

    const plans = await database
      .get<WorkoutPlanModel>('workout_plans')
      .query(Q.where('user_id', userId), Q.where('is_active', true), Q.take(1))
      .fetch();

    return plans.length > 0 && plans[0] ? planToPlain(plans[0]) : null;
  } catch (error) {
    if (error instanceof AuthError || error instanceof DatabaseError) {
      throw error;
    }

    throw new DatabaseError(
      'Unable to load active plan. Please try again.',
      `Failed to get active plan: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Observe active plan for user (Observable)
 */
export function observeActivePlan(userId: string): Observable<WorkoutPlan | null> {
  return database
    .get<WorkoutPlanModel>('workout_plans')
    .query(Q.where('user_id', userId), Q.where('is_active', true), Q.take(1))
    .observe()
    .pipe(map((plans) => (plans.length > 0 && plans[0] ? planToPlain(plans[0]) : null)));
}

/**
 * Observe plan days for a given plan (Observable)
 * Emits whenever days are added, removed, or reordered.
 */
export function observePlanDays(planId: string): Observable<PlanDay[]> {
  return database
    .get<PlanDayModel>('plan_days')
    .query(Q.where('plan_id', planId), Q.sortBy('order_index', Q.asc))
    .observe()
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
    .pipe(
      map((exercises) => {
        const counts: Record<string, number> = {};
        for (const id of planDayIds) counts[id] = 0;
        for (const e of exercises) counts[e.planDayId] = (counts[e.planDayId] ?? 0) + 1;
        return counts;
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
            return {
              ...planDayExerciseToPlain(pde),
              exercise: {
                id: exercise.id,
                name: exercise.name,
                body_parts: exercise.bodyParts,
                target_muscles: exercise.targetMuscles,
                equipments: exercise.equipments,
                gif_url: exercise.gifUrl ?? undefined,
              },
            };
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
 * Get plan with all its days (Promise)
 */
export async function getPlanWithDays(planId: string): Promise<PlanWithDays> {
  try {
    const plan = await database.get<WorkoutPlanModel>('workout_plans').find(planId);
    const days = await database
      .get<PlanDayModel>('plan_days')
      .query(Q.where('plan_id', planId), Q.sortBy('order_index', Q.asc))
      .fetch();

    return {
      ...planToPlain(plan),
      days: days.map(planDayToPlain),
    };
  } catch (error) {
    throw new DatabaseError(
      'Unable to load plan details. Please try again.',
      `Failed to get plan with days for ID ${planId}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Get exercise count for a plan day (Promise)
 */
export async function getExerciseCountByDay(planDayId: string): Promise<number> {
  try {
    const count = await database
      .get<PlanDayExerciseModel>('plan_day_exercises')
      .query(Q.where('plan_day_id', planDayId))
      .fetchCount();
    return count;
  } catch (error) {
    throw new DatabaseError(
      'Unable to count exercises. Please try again.',
      `Failed to count exercises for day ${planDayId}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Get exercise counts for multiple plan days (Promise)
 * Returns a map of day_id -> count
 */
export async function getExerciseCountsByDays(
  planDayIds: string[]
): Promise<Record<string, number>> {
  try {
    const counts: Record<string, number> = {};

    // Initialize all to 0
    for (const id of planDayIds) {
      counts[id] = 0;
    }

    // Batch query all exercises for these days
    if (planDayIds.length > 0) {
      const exercises = await database
        .get<PlanDayExerciseModel>('plan_day_exercises')
        .query(Q.where('plan_day_id', Q.oneOf(planDayIds)))
        .fetch();

      // Count per day
      for (const exercise of exercises) {
        counts[exercise.planDayId] = (counts[exercise.planDayId] ?? 0) + 1;
      }
    }

    return counts;
  } catch (error) {
    throw new DatabaseError(
      'Unable to count exercises. Please try again.',
      `Failed to count exercises for days: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Get plan day with all its exercises (Promise)
 */
export async function getPlanDayWithExercises(planDayId: string): Promise<PlanDayWithExercises> {
  try {
    const planDay = await database.get<PlanDayModel>('plan_days').find(planDayId);
    const planDayExercises = await database
      .get<PlanDayExerciseModel>('plan_day_exercises')
      .query(Q.where('plan_day_id', planDayId), Q.sortBy('order_index', Q.asc))
      .fetch();

    const exercisesWithDetails = await Promise.all(
      planDayExercises.map(async (pde) => {
        const exercise = await database.get<ExerciseModel>('exercises').find(pde.exerciseId);

        return {
          ...planDayExerciseToPlain(pde),
          exercise: {
            id: exercise.id,
            name: exercise.name,
            body_parts: exercise.bodyParts,
            target_muscles: exercise.targetMuscles,
            equipments: exercise.equipments,
            gif_url: exercise.gifUrl ?? undefined,
          },
        };
      })
    );

    return {
      ...planDayToPlain(planDay),
      exercises: exercisesWithDetails,
    };
  } catch (error) {
    throw new DatabaseError(
      'Unable to load day details. Please try again.',
      `Failed to get plan day with exercises for ID ${planDayId}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// ============================================================================
// UPDATE Operations
// ============================================================================

/**
 * Update workout plan
 */
export async function updatePlan(id: string, updates: UpdatePlan): Promise<WorkoutPlan> {
  try {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser?.id) {
      throw new AuthError(
        'Please sign in to update plans',
        'User not authenticated - no user.id in authStore'
      );
    }

    const plan = await database.write(async () => {
      const plan = await database.get<WorkoutPlanModel>('workout_plans').find(id);

      if (plan.userId !== currentUser.id) {
        throw new AuthError(
          'You do not have permission to update this plan',
          `User ${currentUser.id} attempted to update plan owned by ${plan.userId}`
        );
      }

      // If setting as active, deactivate other plans first
      if (updates.is_active) {
        const activePlans = await database
          .get<WorkoutPlanModel>('workout_plans')
          .query(
            Q.where('user_id', plan.userId),
            Q.where('is_active', true),
            Q.where('id', Q.notEq(id))
          )
          .fetch();

        for (const activePlan of activePlans) {
          await activePlan.update((p) => {
            p.isActive = false;
          });
        }
      }

      await plan.update((p) => {
        if (updates.name !== undefined) p.name = updates.name;
        if (updates.is_active !== undefined) p.isActive = updates.is_active;
        if (updates.cover_image_url !== undefined) p.coverImageUrl = updates.cover_image_url;
      });

      return plan;
    });

    return planToPlain(plan);
  } catch (error) {
    if (error instanceof AuthError || error instanceof DatabaseError) {
      throw error;
    }

    throw new DatabaseError(
      'Unable to update plan. Please try again.',
      `Failed to update plan ${id}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Update plan day
 */
export async function updatePlanDay(id: string, updates: UpdatePlanDay): Promise<PlanDay> {
  try {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser?.id) {
      throw new AuthError(
        'Please sign in to update plan days',
        'User not authenticated - no user.id in authStore'
      );
    }

    const planDay = await database.write(async () => {
      const planDay = await database.get<PlanDayModel>('plan_days').find(id);
      const plan = await database.get<WorkoutPlanModel>('workout_plans').find(planDay.planId);

      if (plan.userId !== currentUser.id) {
        throw new AuthError(
          'You do not have permission to update this plan',
          `User ${currentUser.id} attempted to update plan owned by ${plan.userId}`
        );
      }

      await planDay.update((d) => {
        if (updates.name !== undefined) d.name = updates.name;
        if (updates.day_of_week !== undefined) d.dayOfWeek = updates.day_of_week;
        if (updates.order_index !== undefined) d.orderIndex = updates.order_index;
      });

      return planDay;
    });

    return planDayToPlain(planDay);
  } catch (error) {
    if (error instanceof AuthError || error instanceof DatabaseError) {
      throw error;
    }

    throw new DatabaseError(
      'Unable to update day. Please try again.',
      `Failed to update plan day ${id}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

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
  try {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser?.id) {
      throw new AuthError(
        'Please sign in to update exercises',
        'User not authenticated - no user.id in authStore'
      );
    }

    const planDayExercise = await database.write(async () => {
      const pde = await database.get<PlanDayExerciseModel>('plan_day_exercises').find(id);
      const planDay = await database.get<PlanDayModel>('plan_days').find(pde.planDayId);
      const plan = await database.get<WorkoutPlanModel>('workout_plans').find(planDay.planId);

      if (plan.userId !== currentUser.id) {
        throw new AuthError(
          'You do not have permission to update this plan',
          `User ${currentUser.id} attempted to update plan owned by ${plan.userId}`
        );
      }

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
  } catch (error) {
    if (error instanceof AuthError || error instanceof DatabaseError) {
      throw error;
    }

    throw new DatabaseError(
      'Unable to update exercise. Please try again.',
      `Failed to update plan day exercise ${id}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Reorder exercises within a plan day (batch update)
 * @param exercises Array of {id, order_index} to update
 */
export async function reorderPlanDayExercises(
  exercises: Array<{ id: string; order_index: number }>
): Promise<void> {
  if (exercises.length === 0) return;

  try {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser?.id) {
      throw new AuthError(
        'Please sign in to reorder exercises',
        'User not authenticated - no user.id in authStore'
      );
    }

    await database.write(async () => {
      // Verify ownership via first exercise
      const firstExercise = exercises[0];
      if (!firstExercise) return; // Already checked above, but TypeScript needs this

      const firstPde = await database
        .get<PlanDayExerciseModel>('plan_day_exercises')
        .find(firstExercise.id);
      const planDay = await database.get<PlanDayModel>('plan_days').find(firstPde.planDayId);
      const plan = await database.get<WorkoutPlanModel>('workout_plans').find(planDay.planId);

      if (plan.userId !== currentUser.id) {
        throw new AuthError(
          'You do not have permission to reorder these exercises',
          `User ${currentUser.id} attempted to reorder exercises in plan owned by ${plan.userId}`
        );
      }

      // Batch update all exercises
      for (const { id, order_index } of exercises) {
        const pde = await database.get<PlanDayExerciseModel>('plan_day_exercises').find(id);
        await pde.update((e) => {
          e.orderIndex = order_index;
        });
      }
    });
  } catch (error) {
    if (error instanceof AuthError || error instanceof DatabaseError) {
      throw error;
    }

    throw new DatabaseError(
      'Unable to reorder exercises. Please try again.',
      `Failed to reorder exercises: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// ============================================================================
// DELETE Operations
// ============================================================================

/**
 * Delete workout plan (cascades to days and exercises via WatermelonDB)
 */
export async function deletePlan(id: string): Promise<void> {
  try {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser?.id) {
      throw new AuthError(
        'Please sign in to delete plans',
        'User not authenticated - no user.id in authStore'
      );
    }

    await database.write(async () => {
      const plan = await database.get<WorkoutPlanModel>('workout_plans').find(id);

      if (plan.userId !== currentUser.id) {
        throw new AuthError(
          'You do not have permission to delete this plan',
          `User ${currentUser.id} attempted to delete plan owned by ${plan.userId}`
        );
      }

      // Delete all plan days and their exercises first
      const days = await database
        .get<PlanDayModel>('plan_days')
        .query(Q.where('plan_id', id))
        .fetch();

      for (const day of days) {
        const exercises = await database
          .get<PlanDayExerciseModel>('plan_day_exercises')
          .query(Q.where('plan_day_id', day.id))
          .fetch();

        for (const exercise of exercises) {
          await exercise.markAsDeleted();
        }
        await day.markAsDeleted();
      }

      await plan.markAsDeleted();
    });
  } catch (error) {
    if (error instanceof AuthError || error instanceof DatabaseError) {
      throw error;
    }

    throw new DatabaseError(
      'Unable to delete plan. Please try again.',
      `Failed to delete plan ${id}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Delete plan day
 */
export async function deletePlanDay(id: string): Promise<void> {
  try {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser?.id) {
      throw new AuthError(
        'Please sign in to delete days',
        'User not authenticated - no user.id in authStore'
      );
    }

    await database.write(async () => {
      const planDay = await database.get<PlanDayModel>('plan_days').find(id);
      const plan = await database.get<WorkoutPlanModel>('workout_plans').find(planDay.planId);

      if (plan.userId !== currentUser.id) {
        throw new AuthError(
          'You do not have permission to delete this day',
          `User ${currentUser.id} attempted to delete day in plan owned by ${plan.userId}`
        );
      }

      // Delete all exercises in this day first
      const exercises = await database
        .get<PlanDayExerciseModel>('plan_day_exercises')
        .query(Q.where('plan_day_id', id))
        .fetch();

      for (const exercise of exercises) {
        await exercise.markAsDeleted();
      }

      await planDay.markAsDeleted();
    });
  } catch (error) {
    if (error instanceof AuthError || error instanceof DatabaseError) {
      throw error;
    }

    throw new DatabaseError(
      'Unable to delete day. Please try again.',
      `Failed to delete plan day ${id}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Remove exercise from plan day
 */
export async function removeExerciseFromPlanDay(id: string): Promise<void> {
  try {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser?.id) {
      throw new AuthError(
        'Please sign in to remove exercises',
        'User not authenticated - no user.id in authStore'
      );
    }

    await database.write(async () => {
      const pde = await database.get<PlanDayExerciseModel>('plan_day_exercises').find(id);
      const planDay = await database.get<PlanDayModel>('plan_days').find(pde.planDayId);
      const plan = await database.get<WorkoutPlanModel>('workout_plans').find(planDay.planId);

      if (plan.userId !== currentUser.id) {
        throw new AuthError(
          'You do not have permission to remove this exercise',
          `User ${currentUser.id} attempted to remove exercise from plan owned by ${plan.userId}`
        );
      }

      await pde.markAsDeleted();
    });
  } catch (error) {
    if (error instanceof AuthError || error instanceof DatabaseError) {
      throw error;
    }

    throw new DatabaseError(
      'Unable to remove exercise. Please try again.',
      `Failed to remove exercise from plan day ${id}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
