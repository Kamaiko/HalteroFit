/**
 * Workout Read Operations (Dual API - Promise + Observable)
 */

import { Q } from '@nozbe/watermelondb';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { database } from '../../local';
import WorkoutModel from '../../local/models/Workout';
import type WorkoutExerciseModel from '../../local/models/WorkoutExercise';
import type ExerciseSetModel from '../../local/models/ExerciseSet';
import type { Workout, WorkoutWithDetails } from '../../remote/types';
import { requireAuth, validateUserIdMatch } from '../../utils/requireAuth';
import { withDatabaseError } from '../../utils/withDatabaseError';
import {
  workoutToPlain,
  workoutExerciseToPlain,
  exerciseSetToPlain,
  exerciseDetailToPlain,
} from './mappers';

/**
 * Get workout by ID (Promise - one-time fetch)
 *
 * @throws {DatabaseError} If workout not found or database operation fails
 */
export async function getWorkoutById(id: string): Promise<Workout> {
  return withDatabaseError(
    async () => {
      const workout = await database.get<WorkoutModel>('workouts').find(id);
      return workoutToPlain(workout);
    },
    'Unable to load workout. Please try again.',
    `Failed to get workout by ID ${id}`
  );
}

/**
 * Observe workout by ID (Observable - reactive stream)
 */
export function observeWorkout(id: string): Observable<Workout> {
  return database.get<WorkoutModel>('workouts').findAndObserve(id).pipe(map(workoutToPlain));
}

/**
 * Get all workouts for user (Promise - one-time fetch)
 * Ordered by most recent first
 *
 * @throws {AuthError} If user is not authenticated
 * @throws {DatabaseError} If database operation fails
 */
export async function getUserWorkouts(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<Workout[]> {
  return withDatabaseError(
    async () => {
      const currentUser = requireAuth('view workouts');
      validateUserIdMatch(userId, currentUser.id);

      const workouts = await database
        .get<WorkoutModel>('workouts')
        .query(
          Q.where('user_id', userId),
          Q.sortBy('started_at', Q.desc),
          Q.take(limit),
          Q.skip(offset)
        )
        .fetch();

      return workouts.map(workoutToPlain);
    },
    'Unable to load workouts. Please try again.',
    'Failed to get user workouts'
  );
}

/**
 * Observe all workouts for user (Observable - reactive stream)
 */
export function observeUserWorkouts(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Observable<Workout[]> {
  return database
    .get<WorkoutModel>('workouts')
    .query(
      Q.where('user_id', userId),
      Q.sortBy('started_at', Q.desc),
      Q.take(limit),
      Q.skip(offset)
    )
    .observe()
    .pipe(map((workouts) => workouts.map(workoutToPlain)));
}

/**
 * Get active workout (not completed) (Promise)
 *
 * @throws {AuthError} If user is not authenticated
 * @throws {DatabaseError} If database operation fails
 */
export async function getActiveWorkout(userId: string): Promise<Workout | null> {
  return withDatabaseError(
    async () => {
      const currentUser = requireAuth('view active workout');
      validateUserIdMatch(userId, currentUser.id);

      const workouts = await database
        .get<WorkoutModel>('workouts')
        .query(
          Q.where('user_id', userId),
          Q.where('completed_at', null),
          Q.sortBy('started_at', Q.desc),
          Q.take(1)
        )
        .fetch();

      return workouts.length > 0 && workouts[0] ? workoutToPlain(workouts[0]) : null;
    },
    'Unable to load active workout. Please try again.',
    'Failed to get active workout'
  );
}

/**
 * Observe active workout (Observable)
 */
export function observeActiveWorkout(userId: string): Observable<Workout | null> {
  return database
    .get<WorkoutModel>('workouts')
    .query(
      Q.where('user_id', userId),
      Q.where('completed_at', null),
      Q.sortBy('started_at', Q.desc),
      Q.take(1)
    )
    .observe()
    .pipe(
      map((workouts) => (workouts.length > 0 && workouts[0] ? workoutToPlain(workouts[0]) : null))
    );
}

/**
 * Get workout with all exercises and sets (Promise)
 *
 * @throws {DatabaseError} If workout not found or database operation fails
 */
export async function getWorkoutWithDetails(workoutId: string): Promise<WorkoutWithDetails> {
  return withDatabaseError(
    async () => {
      const workout = await database.get<WorkoutModel>('workouts').find(workoutId);
      const workoutExercises = workout.workoutExercises;

      const exercisesWithDetails = await Promise.all(
        workoutExercises.map(async (we: WorkoutExerciseModel) => {
          const exercise = we.exercise;
          const sets = we.exerciseSets;

          return {
            ...workoutExerciseToPlain(we),
            exercise: exerciseDetailToPlain(exercise),
            sets: sets.map((set: ExerciseSetModel) => exerciseSetToPlain(set)),
          };
        })
      );

      return {
        ...workoutToPlain(workout),
        exercises: exercisesWithDetails,
      };
    },
    'Unable to load workout details. Please try again.',
    `Failed to get workout with details for ID ${workoutId}`
  );
}

/**
 * Observe workout with details (Observable)
 */
export function observeWorkoutWithDetails(workoutId: string): Observable<WorkoutWithDetails> {
  return database
    .get<WorkoutModel>('workouts')
    .findAndObserve(workoutId)
    .pipe(
      switchMap(async () => {
        return await getWorkoutWithDetails(workoutId);
      })
    );
}

/**
 * Get last workout (for "Repeat Last Workout" feature)
 * Promise only - this is typically a one-time fetch
 *
 * @throws {AuthError} If user is not authenticated
 * @throws {DatabaseError} If database operation fails
 */
export async function getLastCompletedWorkout(userId: string): Promise<WorkoutWithDetails | null> {
  return withDatabaseError(
    async () => {
      const currentUser = requireAuth('view workout history');
      validateUserIdMatch(userId, currentUser.id);

      const workouts = await database
        .get<WorkoutModel>('workouts')
        .query(
          Q.where('user_id', userId),
          Q.where('completed_at', Q.notEq(null)),
          Q.sortBy('completed_at', Q.desc),
          Q.take(1)
        )
        .fetch();

      if (workouts.length === 0 || !workouts[0]) return null;

      return getWorkoutWithDetails(workouts[0].id);
    },
    'Unable to load last workout. Please try again.',
    'Failed to get last completed workout'
  );
}
