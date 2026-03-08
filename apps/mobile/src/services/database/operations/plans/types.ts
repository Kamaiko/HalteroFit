/**
 * Workout Plans - Type Definitions
 *
 * Base entity types re-exported from remote/types.ts (single source of truth).
 * Composite and operation types are defined here for the plans domain.
 */

export type { WorkoutPlan, PlanDay, PlanDayExercise } from '../../remote/types';
import type { WorkoutPlan, PlanDay, PlanDayExercise } from '../../remote/types';

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

/** Single exercise entry within a PlanDayWithExercises */
export type DayExercise = PlanDayWithExercises['exercises'][number];

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
