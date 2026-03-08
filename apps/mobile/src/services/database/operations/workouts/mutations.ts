/**
 * Workout Write Operations
 */

import { database } from '../../local';
import WorkoutModel from '../../local/models/Workout';
import type { Workout, CreateWorkout } from '../../remote/types';
import { requireAuth, validateUserIdMatch } from '../../utils/requireAuth';
import { withDatabaseError } from '../../utils/withDatabaseError';
import { workoutToPlain } from './mappers';

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
