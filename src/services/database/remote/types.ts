/**
 * Database Types
 *
 * Type-safe interfaces matching SQLite schema
 * These will also match Supabase schema for easy sync
 */

// ============================================================================
// Core Tables
// ============================================================================

export interface User {
  id: string;
  email: string;
  preferred_unit: 'kg' | 'lbs';
  // TODO: Missing v8 field: default_rest_timer_seconds (number, optional) — added in schema.ts v8
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
  started_at: number; // Unix timestamp
  completed_at?: number;
  duration_seconds?: number;
  title?: string;
  notes?: string;
  // TODO: Missing v8 fields: plan_id (string, optional), plan_day_id (string, optional) — added in schema.ts v8
  // synced removed - internal WatermelonDB sync tracking
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
  // synced removed - internal WatermelonDB sync tracking
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
  // synced removed - internal WatermelonDB sync tracking
  created_at: number;
  updated_at: number;
}

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

/**
 * Update types (optional fields only)
 */
export type UpdateWorkout = Partial<Omit<Workout, 'id' | 'user_id' | 'created_at'>>;
export type UpdateExerciseSet = Partial<
  Omit<ExerciseSet, 'id' | 'workout_exercise_id' | 'created_at'>
>;
