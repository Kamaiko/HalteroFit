/**
 * Workout Model-to-Plain Mappers
 *
 * Convert WatermelonDB model instances to plain serializable objects.
 */

import type WorkoutModel from '../../local/models/Workout';
import type WorkoutExerciseModel from '../../local/models/WorkoutExercise';
import type ExerciseSetModel from '../../local/models/ExerciseSet';
import type ExerciseModel from '../../local/models/Exercise';
import type { Workout, WorkoutExercise, ExerciseSet } from '../../remote/types';

export function workoutToPlain(workout: WorkoutModel): Workout {
  return {
    id: workout.id,
    user_id: workout.userId,
    started_at: workout.startedAt.getTime(),
    completed_at: workout.completedAt?.getTime(),
    duration_seconds: workout.durationSeconds ?? undefined,
    title: workout.title ?? undefined,
    notes: workout.notes ?? undefined,
    created_at: workout.createdAt.getTime(),
    updated_at: workout.updatedAt.getTime(),
  };
}

export function workoutExerciseToPlain(we: WorkoutExerciseModel): WorkoutExercise {
  return {
    id: we.id,
    workout_id: we.workoutId,
    exercise_id: we.exerciseId,
    order_index: we.orderIndex,
    superset_group: we.supersetGroup ?? undefined,
    notes: we.notes ?? undefined,
    target_sets: we.targetSets ?? undefined,
    target_reps: we.targetReps ?? undefined,
    created_at: we.createdAt.getTime(),
    updated_at: we.updatedAt.getTime(),
  };
}

export function exerciseSetToPlain(set: ExerciseSetModel): ExerciseSet {
  return {
    id: set.id,
    workout_exercise_id: set.workoutExerciseId,
    set_number: set.setNumber,
    weight: set.weight ?? undefined,
    weight_unit: set.weightUnit as 'kg' | 'lbs' | undefined,
    reps: set.reps ?? undefined,
    duration_seconds: set.durationSeconds ?? undefined,
    distance_meters: set.distanceMeters ?? undefined,
    rpe: set.rpe ?? undefined,
    rir: set.rir ?? undefined,
    rest_time_seconds: set.restTimeSeconds ?? undefined,
    completed_at: set.completedAt?.getTime(),
    notes: set.notes ?? undefined,
    is_warmup: set.isWarmup,
    is_failure: set.isFailure,
    created_at: set.createdAt.getTime(),
    updated_at: set.updatedAt.getTime(),
  };
}

export function exerciseDetailToPlain(exercise: ExerciseModel) {
  return {
    id: exercise.id,
    exercisedb_id: exercise.exercisedbId,
    name: exercise.name,
    body_parts: exercise.bodyParts,
    target_muscles: exercise.targetMuscles,
    secondary_muscles: exercise.secondaryMuscles,
    equipments: exercise.equipments,
    instructions: exercise.instructions,
    gif_url: exercise.gifUrl,
    created_at: exercise.createdAt.getTime(),
    updated_at: exercise.updatedAt.getTime(),
  };
}
