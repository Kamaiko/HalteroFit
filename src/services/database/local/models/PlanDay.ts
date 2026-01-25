/**
 * PlanDay Model
 *
 * Represents a single day within a workout plan.
 * Contains multiple exercises with target sets/reps.
 */

import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation, children } from '@nozbe/watermelondb/decorators';
import type WorkoutPlan from './WorkoutPlan';
import type PlanDayExercise from './PlanDayExercise';

export default class PlanDay extends Model {
  static table = 'plan_days';

  static associations = {
    workout_plans: { type: 'belongs_to' as const, key: 'plan_id' },
    plan_day_exercises: { type: 'has_many' as const, foreignKey: 'plan_day_id' },
    workouts: { type: 'has_many' as const, foreignKey: 'plan_day_id' },
  };

  @field('plan_id') planId!: string;
  @relation('workout_plans', 'plan_id') plan!: WorkoutPlan;
  @children('plan_day_exercises') exercises!: PlanDayExercise[];

  @field('name') name!: string;
  @field('day_of_week') dayOfWeek?: string; // "MON", "TUE", etc.
  @field('order_index') orderIndex!: number;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
