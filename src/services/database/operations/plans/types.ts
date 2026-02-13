/**
 * Workout Plans - Type Definitions
 *
 * Plain object interfaces for plans, days, and day-exercises.
 * These are the "public" types consumed by hooks and components.
 */

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
