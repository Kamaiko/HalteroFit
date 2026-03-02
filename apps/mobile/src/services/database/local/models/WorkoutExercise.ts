/**
 * WorkoutExercise Model
 *
 * Junction table linking workouts to exercises with ordering and context.
 * Enables supersets, exercise ordering, and per-exercise notes.
 */

import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation, children } from '@nozbe/watermelondb/decorators';
import type Workout from './Workout';
import type Exercise from './Exercise';
import type ExerciseSet from './ExerciseSet';

export default class WorkoutExercise extends Model {
  static table = 'workout_exercises';

  static associations = {
    workouts: { type: 'belongs_to' as const, key: 'workout_id' },
    exercises: { type: 'belongs_to' as const, key: 'exercise_id' },
    exercise_sets: { type: 'has_many' as const, foreignKey: 'workout_exercise_id' },
  };

  @field('workout_id') workoutId!: string;
  @relation('workouts', 'workout_id') workout!: Workout;

  @field('exercise_id') exerciseId!: string;
  @relation('exercises', 'exercise_id') exercise!: Exercise;

  @children('exercise_sets') exerciseSets!: ExerciseSet[];

  @field('order_index') orderIndex!: number;
  @field('superset_group') supersetGroup?: string;
  @field('notes') notes?: string;
  @field('target_sets') targetSets?: number;
  @field('target_reps') targetReps?: number;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  // Computed: is this exercise part of a superset?
  get isSuperset(): boolean {
    return !!this.supersetGroup;
  }
}
