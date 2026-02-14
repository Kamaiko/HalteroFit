/**
 * Workout Write Operations (Create, Update, Delete, Sync)
 */

import { Q } from '@nozbe/watermelondb';
import { database } from '../../local';
import WorkoutModel from '../../local/models/Workout';
import WorkoutExerciseModel from '../../local/models/WorkoutExercise';
import ExerciseSetModel from '../../local/models/ExerciseSet';
import type {
  Workout,
  CreateWorkout,
  UpdateWorkout,
  WorkoutExercise,
  ExerciseSet,
  WorkoutWithDetails,
} from '../../remote/types';
import { requireAuth, validateUserIdMatch, validateOwnership } from '../../utils/requireAuth';
import { withDatabaseError } from '../../utils/withDatabaseError';
import { workoutToPlain, workoutExerciseToPlain, exerciseSetToPlain } from './mappers';
import { getWorkoutWithDetails } from './queries';

// ============================================================================
// CREATE
// ============================================================================

/**
 * Start a new workout
 * Saves to local DB immediately
 *
 * @throws {AuthError} If user is not authenticated or user ID mismatch
 * @throws {DatabaseError} If database operation fails
 */
export async function createWorkout(data: CreateWorkout): Promise<Workout> {
  return withDatabaseError(
    async () => {
      const currentUser = requireAuth('create workouts');
      validateUserIdMatch(data.user_id, currentUser.id);

      const workout = await database.write(async () => {
        return await database.get<WorkoutModel>('workouts').create((workout) => {
          workout.userId = data.user_id;
          workout.startedAt = new Date(data.started_at);
          if (data.completed_at) workout.completedAt = new Date(data.completed_at);
          if (data.duration_seconds) workout.durationSeconds = data.duration_seconds;
          if (data.title) workout.title = data.title;
          if (data.notes) workout.notes = data.notes;
        });
      });

      return workoutToPlain(workout);
    },
    'Unable to save workout. Please try again.',
    'Failed to create workout'
  );
}

/**
 * Add exercise to workout
 *
 * @throws {AuthError} If user is not authenticated
 * @throws {DatabaseError} If database operation fails
 */
export async function addExerciseToWorkout(
  workoutId: string,
  exerciseId: string,
  orderIndex: number,
  supersetGroup?: string
): Promise<WorkoutExercise> {
  return withDatabaseError(
    async () => {
      requireAuth('add exercises');

      const workoutExercise = await database.write(async () => {
        return await database.get<WorkoutExerciseModel>('workout_exercises').create((we) => {
          we.workoutId = workoutId;
          we.exerciseId = exerciseId;
          we.orderIndex = orderIndex;
          if (supersetGroup) we.supersetGroup = supersetGroup;
        });
      });

      return workoutExerciseToPlain(workoutExercise);
    },
    'Unable to add exercise. Please try again.',
    'Failed to add exercise to workout'
  );
}

/**
 * Log a set
 *
 * @throws {AuthError} If user is not authenticated
 * @throws {DatabaseError} If database operation fails
 */
export async function logSet(
  workoutExerciseId: string,
  setNumber: number,
  data: {
    weight?: number;
    weight_unit?: 'kg' | 'lbs';
    reps?: number;
    rpe?: number;
    rir?: number;
    is_warmup?: boolean;
  }
): Promise<ExerciseSet> {
  return withDatabaseError(
    async () => {
      requireAuth('log sets');

      const exerciseSet = await database.write(async () => {
        return await database.get<ExerciseSetModel>('exercise_sets').create((set) => {
          set.workoutExerciseId = workoutExerciseId;
          set.setNumber = setNumber;
          if (data.weight !== undefined) set.weight = data.weight;
          if (data.weight_unit) set.weightUnit = data.weight_unit;
          if (data.reps !== undefined) set.reps = data.reps;
          if (data.rpe !== undefined) set.rpe = data.rpe;
          if (data.rir !== undefined) set.rir = data.rir;
          set.isWarmup = data.is_warmup ?? false;
          set.isFailure = false;
          set.completedAt = new Date();
        });
      });

      return exerciseSetToPlain(exerciseSet);
    },
    'Unable to log set. Please try again.',
    'Failed to log set'
  );
}

// ============================================================================
// UPDATE
// ============================================================================

/**
 * Update workout
 *
 * @throws {AuthError} If user is not authenticated
 * @throws {DatabaseError} If workout not found or database operation fails
 */
export async function updateWorkout(id: string, updates: UpdateWorkout): Promise<Workout> {
  return withDatabaseError(
    async () => {
      const currentUser = requireAuth('update workouts');

      const workout = await database.write(async () => {
        const workout = await database.get<WorkoutModel>('workouts').find(id);

        validateOwnership(workout.userId, currentUser.id, 'update this workout');

        await workout.update((w) => {
          if (updates.completed_at !== undefined) w.completedAt = new Date(updates.completed_at);
          if (updates.duration_seconds !== undefined) w.durationSeconds = updates.duration_seconds;
          if (updates.title !== undefined) w.title = updates.title;
          if (updates.notes !== undefined) w.notes = updates.notes;
        });
        return workout;
      });

      return workoutToPlain(workout);
    },
    'Unable to update workout. Please try again.',
    `Failed to update workout ${id}`
  );
}

/**
 * Complete workout
 *
 * @throws {AuthError} If user is not authenticated
 * @throws {DatabaseError} If workout not found or database operation fails
 */
export async function completeWorkout(id: string): Promise<Workout> {
  return withDatabaseError(
    async () => {
      const workout = await database.get<WorkoutModel>('workouts').find(id);
      const now = Date.now();
      const duration = Math.floor((now - workout.startedAt.getTime()) / 1000);

      return updateWorkout(id, {
        completed_at: now,
        duration_seconds: duration,
      });
    },
    'Unable to complete workout. Please try again.',
    `Failed to complete workout ${id}`
  );
}

// ============================================================================
// DELETE
// ============================================================================

/**
 * Delete workout (cascades to exercises and sets via WatermelonDB relations)
 *
 * @throws {AuthError} If user is not authenticated
 * @throws {DatabaseError} If workout not found or database operation fails
 */
export async function deleteWorkout(id: string): Promise<void> {
  return withDatabaseError(
    async () => {
      const currentUser = requireAuth('delete workouts');

      await database.write(async () => {
        const workout = await database.get<WorkoutModel>('workouts').find(id);

        validateOwnership(workout.userId, currentUser.id, 'delete this workout');

        await workout.markAsDeleted(); // Soft delete for sync
      });
    },
    'Unable to delete workout. Please try again.',
    `Failed to delete workout ${id}`
  );
}

// ============================================================================
// SYNC Helpers
// ============================================================================

/**
 * Get unsynced workouts (for Supabase sync)
 *
 * @throws {DatabaseError} If database operation fails
 */
export async function getUnsyncedWorkouts(): Promise<WorkoutWithDetails[]> {
  return withDatabaseError(
    async () => {
      const workouts = await database
        .get<WorkoutModel>('workouts')
        .query(Q.where('_status', Q.notEq('deleted')))
        .fetch();

      return Promise.all(workouts.map((w) => getWorkoutWithDetails(w.id)));
    },
    'Unable to get unsynced workouts. Please try again.',
    'Failed to get unsynced workouts'
  );
}
