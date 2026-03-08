/**
 * Database Types
 *
 * Type-safe interfaces matching SQLite schema (v8)
 * These match Supabase schema for sync compatibility
 */

// ============================================================================
// Core Tables
// ============================================================================

export interface User {
  id: string;
  email: string;
  preferred_unit: 'kg' | 'lbs';
  default_rest_timer_seconds?: number;
  created_at: number;
  updated_at: number;
}

export interface Exercise {
  id: string;

  // GitHub ExerciseDB dataset fields (8 total)
  exercisedb_id: string;
  name: string;
  body_parts: string[];
  target_muscles: string[];
  secondary_muscles: string[];
  equipments: string[];
  instructions: string[];
  gif_url?: string;

  created_at: number;
  updated_at: number;
}

export interface Workout {
  id: string;
  user_id: string;
  plan_id?: string;
  plan_day_id?: string;
  started_at: number; // Unix timestamp (ms)
  completed_at?: number;
  duration_seconds?: number;
  title?: string;
  notes?: string;
  created_at: number;
  updated_at: number;
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  order_index: number; // 1, 2, 3...
  superset_group?: string; // 'A', 'B', etc.
  notes?: string;
  target_sets?: number;
  target_reps?: number;
  created_at: number;
  updated_at: number;
}

export interface ExerciseSet {
  id: string;
  workout_exercise_id: string;
  set_number: number;
  weight?: number;
  weight_unit?: 'kg' | 'lbs';
  reps?: number;
  duration_seconds?: number;
  distance_meters?: number;
  rpe?: number; // 1-10
  rir?: number; // 0-5
  rest_time_seconds?: number;
  completed_at?: number;
  notes?: string;
  is_warmup: boolean;
  is_failure: boolean;
  created_at: number;
  updated_at: number;
}

// ============================================================================
// Workout Plans (v8)
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

// ============================================================================
// Sync Types
// ============================================================================

/** Tables included in WatermelonDB↔Supabase sync (exercises excluded — static data) */
export type SyncableTableName =
  | 'users'
  | 'workouts'
  | 'workout_exercises'
  | 'exercise_sets'
  | 'workout_plans'
  | 'plan_days'
  | 'plan_day_exercises';

// ============================================================================
// Helper Types for Queries
// ============================================================================

/**
 * Full workout with exercises and sets
 * Used for display and sync
 */
export interface WorkoutWithDetails extends Workout {
  exercises: Array<WorkoutExerciseWithDetails>;
}

export interface WorkoutExerciseWithDetails extends WorkoutExercise {
  exercise: Exercise;
  sets: ExerciseSet[];
}

/**
 * Create types (without auto-generated fields)
 */
export type CreateWorkout = Omit<Workout, 'id' | 'created_at' | 'updated_at'>;
export type CreateWorkoutExercise = Omit<WorkoutExercise, 'id' | 'created_at' | 'updated_at'>;
export type CreateExerciseSet = Omit<ExerciseSet, 'id' | 'created_at' | 'updated_at'>;
export type CreateWorkoutPlan = Omit<WorkoutPlan, 'id' | 'created_at' | 'updated_at'>;
export type CreatePlanDay = Omit<PlanDay, 'id' | 'created_at' | 'updated_at'>;
export type CreatePlanDayExercise = Omit<PlanDayExercise, 'id' | 'created_at' | 'updated_at'>;

/**
 * Update types (optional fields only)
 */
export type UpdateWorkout = Partial<Omit<Workout, 'id' | 'user_id' | 'created_at'>>;
export type UpdateExerciseSet = Partial<
  Omit<ExerciseSet, 'id' | 'workout_exercise_id' | 'created_at'>
>;
export type UpdateWorkoutPlan = Partial<Omit<WorkoutPlan, 'id' | 'user_id' | 'created_at'>>;
export type UpdatePlanDay = Partial<Omit<PlanDay, 'id' | 'plan_id' | 'created_at'>>;
export type UpdatePlanDayExercise = Partial<
  Omit<PlanDayExercise, 'id' | 'plan_day_id' | 'created_at'>
>;
