/**
 * Plan-level CRUD Operations
 *
 * Create, read, observe, update, and delete workout plans.
 */

import { type Model, Q } from '@nozbe/watermelondb';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { validatePlanName } from '@/utils/validators';
import { database } from '../../local';
import WorkoutPlanModel from '../../local/models/WorkoutPlan';
import PlanDayModel from '../../local/models/PlanDay';
import PlanDayExerciseModel from '../../local/models/PlanDayExercise';
import { requireAuth, validateUserIdMatch, validateOwnership } from '../../utils/requireAuth';
import { withDatabaseError } from '../../utils/withDatabaseError';
import type { WorkoutPlan, PlanWithDays, CreatePlan, UpdatePlan } from './types';
import { planToPlain, planDayToPlain } from './mappers';

// ============================================================================
// CREATE
// ============================================================================

/**
 * Create a new workout plan
 *
 * @throws {AuthError} If user is not authenticated or user ID mismatch
 * @throws {DatabaseError} If database operation fails
 */
export async function createPlan(data: CreatePlan): Promise<WorkoutPlan> {
  return withDatabaseError(
    async () => {
      const currentUser = requireAuth('create workout plans');
      validateUserIdMatch(data.user_id, currentUser.id);

      const plan = await database.write(async () => {
        const allOperations: Model[] = [];

        // If setting as active, deactivate other plans first
        if (data.is_active) {
          const activePlans = await database
            .get<WorkoutPlanModel>('workout_plans')
            .query(Q.where('user_id', data.user_id), Q.where('is_active', true))
            .fetch();

          allOperations.push(
            ...activePlans.map((p) =>
              p.prepareUpdate((rec) => {
                rec.isActive = false;
              })
            )
          );
        }

        const newPlan = database.get<WorkoutPlanModel>('workout_plans').prepareCreate((p) => {
          p.userId = data.user_id;
          p.name = data.name;
          p.isActive = data.is_active ?? false;
          if (data.cover_image_url) p.coverImageUrl = data.cover_image_url;
        });
        allOperations.push(newPlan);

        await database.batch(...allOperations);
        return newPlan;
      });

      return planToPlain(plan);
    },
    'Unable to create workout plan. Please try again.',
    'Failed to create plan'
  );
}

// ============================================================================
// READ (Dual API - Promise + Observable)
// ============================================================================

/**
 * Get plan by ID (Promise)
 */
export async function getPlanById(id: string): Promise<WorkoutPlan> {
  return withDatabaseError(
    async () => {
      const plan = await database.get<WorkoutPlanModel>('workout_plans').find(id);
      return planToPlain(plan);
    },
    'Unable to load workout plan. Please try again.',
    `Failed to get plan by ID ${id}`
  );
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
  return withDatabaseError(
    async () => {
      const currentUser = requireAuth('view plans');
      validateUserIdMatch(userId, currentUser.id);

      const plans = await database
        .get<WorkoutPlanModel>('workout_plans')
        .query(Q.where('user_id', userId), Q.sortBy('created_at', Q.desc))
        .fetch();

      return plans.map(planToPlain);
    },
    'Unable to load plans. Please try again.',
    'Failed to get user plans'
  );
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
  return withDatabaseError(
    async () => {
      const currentUser = requireAuth('view active plan');
      validateUserIdMatch(userId, currentUser.id);

      const plans = await database
        .get<WorkoutPlanModel>('workout_plans')
        .query(Q.where('user_id', userId), Q.where('is_active', true), Q.take(1))
        .fetch();

      return plans.length > 0 && plans[0] ? planToPlain(plans[0]) : null;
    },
    'Unable to load active plan. Please try again.',
    'Failed to get active plan'
  );
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
 * Get plan with all its days (Promise)
 */
export async function getPlanWithDays(planId: string): Promise<PlanWithDays> {
  return withDatabaseError(
    async () => {
      const plan = await database.get<WorkoutPlanModel>('workout_plans').find(planId);
      const days = await database
        .get<PlanDayModel>('plan_days')
        .query(Q.where('plan_id', planId), Q.sortBy('order_index', Q.asc))
        .fetch();

      return {
        ...planToPlain(plan),
        days: days.map(planDayToPlain),
      };
    },
    'Unable to load plan details. Please try again.',
    `Failed to get plan with days for ID ${planId}`
  );
}

// ============================================================================
// UPDATE
// ============================================================================

/**
 * Update workout plan
 */
export async function updatePlan(id: string, updates: UpdatePlan): Promise<WorkoutPlan> {
  return withDatabaseError(
    async () => {
      const currentUser = requireAuth('update plans');

      const plan = await database.write(async () => {
        const plan = await database.get<WorkoutPlanModel>('workout_plans').find(id);

        validateOwnership(plan.userId, currentUser.id, 'update this plan');

        // Validate name length if being updated
        if (updates.name !== undefined) {
          validatePlanName(updates.name, `plan ${id}`);
        }

        // If setting as active, deactivate other plans first
        let deactivations: Model[] = [];
        if (updates.is_active) {
          const activePlans = await database
            .get<WorkoutPlanModel>('workout_plans')
            .query(
              Q.where('user_id', plan.userId),
              Q.where('is_active', true),
              Q.where('id', Q.notEq(id))
            )
            .fetch();

          deactivations = activePlans.map((p) =>
            p.prepareUpdate((rec) => {
              rec.isActive = false;
            })
          );
        }

        const mainUpdate = plan.prepareUpdate((p) => {
          if (updates.name !== undefined) p.name = updates.name;
          if (updates.is_active !== undefined) p.isActive = updates.is_active;
          if (updates.cover_image_url !== undefined) p.coverImageUrl = updates.cover_image_url;
        });

        await database.batch(...deactivations, mainUpdate);
        return plan;
      });

      return planToPlain(plan);
    },
    'Unable to update plan. Please try again.',
    `Failed to update plan ${id}`
  );
}

// ============================================================================
// DELETE
// ============================================================================

/**
 * Delete workout plan (cascades to days and exercises via WatermelonDB)
 */
export async function deletePlan(id: string): Promise<void> {
  return withDatabaseError(
    async () => {
      const currentUser = requireAuth('delete plans');

      await database.write(async () => {
        const plan = await database.get<WorkoutPlanModel>('workout_plans').find(id);

        validateOwnership(plan.userId, currentUser.id, 'delete this plan');

        // Collect all deletions (exercises + days + plan) into a single batch
        const allDeletions: Model[] = [];

        const days = await database
          .get<PlanDayModel>('plan_days')
          .query(Q.where('plan_id', id))
          .fetch();

        for (const day of days) {
          const exercises = await database
            .get<PlanDayExerciseModel>('plan_day_exercises')
            .query(Q.where('plan_day_id', day.id))
            .fetch();

          allDeletions.push(...exercises.map((e) => e.prepareMarkAsDeleted()));
          allDeletions.push(day.prepareMarkAsDeleted());
        }

        allDeletions.push(plan.prepareMarkAsDeleted());
        await database.batch(...allDeletions);
      });
    },
    'Unable to delete plan. Please try again.',
    `Failed to delete plan ${id}`
  );
}
