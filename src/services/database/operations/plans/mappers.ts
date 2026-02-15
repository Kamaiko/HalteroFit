/**
 * Workout Plans - Model-to-Plain Mappers
 *
 * Convert WatermelonDB model instances to plain serializable objects.
 * Includes pure helper functions for aggregating exercise data.
 */

import { getTargetMuscleGroupId } from '@/utils/muscles';
import type WorkoutPlanModel from '../../local/models/WorkoutPlan';
import type PlanDayModel from '../../local/models/PlanDay';
import type PlanDayExerciseModel from '../../local/models/PlanDayExercise';
import type ExerciseModel from '../../local/models/Exercise';
import type { WorkoutPlan, PlanDay, PlanDayExercise, PlanDayWithExercises } from './types';

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

/** Map a PlanDayExercise model + its Exercise model to a plain object with details */
export function planDayExerciseWithDetailToPlain(
  pde: PlanDayExerciseModel,
  exercise: ExerciseModel
): PlanDayWithExercises['exercises'][number] {
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
}

/** Count exercises per day from a flat list of exercise models */
export function countExercisesByDay(
  exercises: PlanDayExerciseModel[],
  planDayIds: string[]
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const id of planDayIds) counts[id] = 0;
  for (const e of exercises) counts[e.planDayId] = (counts[e.planDayId] ?? 0) + 1;
  return counts;
}

/**
 * Find the dominant muscle group ID from a flat list of target muscle names.
 *
 * Counts occurrences of each muscle group ID. On a tie, the group whose
 * first occurrence appears earliest in the array wins (preserves exercise
 * order_index priority via Map insertion order).
 *
 * Returns null if no muscles map to a group ID.
 */
export function computeDominantMuscleGroup(targetMuscles: string[]): string | null {
  const counts = new Map<string, number>();
  for (const muscle of targetMuscles) {
    const groupId = getTargetMuscleGroupId(muscle);
    if (groupId) counts.set(groupId, (counts.get(groupId) ?? 0) + 1);
  }
  if (counts.size === 0) return null;

  let maxGroup: string | null = null;
  let maxCount = 0;
  for (const [group, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      maxGroup = group;
    }
  }
  return maxGroup;
}
