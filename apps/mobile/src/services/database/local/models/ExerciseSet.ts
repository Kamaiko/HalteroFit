/**
 * ExerciseSet Model
 *
 * Represents a single set of an exercise (actual performance data).
 * Contains weight, reps, RPE, RIR for analytics and plateau detection.
 */

import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import type WorkoutExercise from './WorkoutExercise';

export default class ExerciseSet extends Model {
  static table = 'exercise_sets';

  static associations = {
    workout_exercises: { type: 'belongs_to' as const, key: 'workout_exercise_id' },
  };

  @field('workout_exercise_id') workoutExerciseId!: string;
  @relation('workout_exercises', 'workout_exercise_id') workoutExercise!: WorkoutExercise;

  @field('set_number') setNumber!: number;
  @field('weight') weight?: number;
  @field('weight_unit') weightUnit?: string; // 'kg' | 'lbs'
  @field('reps') reps?: number;
  @field('duration_seconds') durationSeconds?: number;
  @field('distance_meters') distanceMeters?: number;
  @field('rpe') rpe?: number; // Rate of Perceived Exertion (1-10)
  @field('rir') rir?: number; // Reps in Reserve (0-5+)
  @field('rest_time_seconds') restTimeSeconds?: number;
  @date('completed_at') completedAt?: Date;
  @field('notes') notes?: string;
  @field('is_warmup') isWarmup!: boolean;
  @field('is_failure') isFailure!: boolean; // Took set to muscular failure

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  // Computed: Estimated 1RM using Epley formula adjusted by RIR
  get estimated1RM(): number | null {
    if (!this.weight || !this.reps) return null;

    // Epley formula: 1RM = weight × (1 + reps/30)
    const baseRM = this.weight * (1 + this.reps / 30);

    // Adjust for RIR (if user left reps in reserve, they could have done more)
    if (this.rir !== undefined && this.rir > 0) {
      const adjustedReps = this.reps + this.rir;
      return this.weight * (1 + adjustedReps / 30);
    }

    return baseRM;
  }

  // Computed: Total volume (weight × reps)
  get volume(): number | null {
    if (!this.weight || !this.reps) return null;
    return this.weight * this.reps;
  }
}
