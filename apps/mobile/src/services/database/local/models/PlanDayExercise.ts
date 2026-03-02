/**
 * PlanDayExercise Model
 *
 * Represents an exercise template within a plan day.
 * Defines target sets, reps, and optional rest timer.
 */

import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import type PlanDay from './PlanDay';
import type Exercise from './Exercise';

export default class PlanDayExercise extends Model {
  static table = 'plan_day_exercises';

  static associations = {
    plan_days: { type: 'belongs_to' as const, key: 'plan_day_id' },
    exercises: { type: 'belongs_to' as const, key: 'exercise_id' },
  };

  @field('plan_day_id') planDayId!: string;
  @relation('plan_days', 'plan_day_id') planDay!: PlanDay;

  @field('exercise_id') exerciseId!: string;
  @relation('exercises', 'exercise_id') exercise!: Exercise;

  @field('order_index') orderIndex!: number;
  @field('target_sets') targetSets!: number;
  @field('target_reps') targetReps!: number;
  @field('rest_timer_seconds') restTimerSeconds?: number;
  @field('notes') notes?: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
