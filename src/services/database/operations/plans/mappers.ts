/**
 * Workout Plans - Model-to-Plain Mappers
 *
 * Convert WatermelonDB model instances to plain serializable objects.
 */

import type WorkoutPlanModel from '../../local/models/WorkoutPlan';
import type PlanDayModel from '../../local/models/PlanDay';
import type PlanDayExerciseModel from '../../local/models/PlanDayExercise';
import type { WorkoutPlan, PlanDay, PlanDayExercise } from './types';

export function planToPlain(plan: WorkoutPlanModel): WorkoutPlan {
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

export function planDayToPlain(day: PlanDayModel): PlanDay {
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

export function planDayExerciseToPlain(pde: PlanDayExerciseModel): PlanDayExercise {
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
