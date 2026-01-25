/**
 * Workout Model
 *
 * Represents a single workout session.
 * Related to user, contains multiple workout_exercises.
 * Can be linked to a workout plan/template.
 */

import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation, children } from '@nozbe/watermelondb/decorators';
import type User from './User';
import type WorkoutExercise from './WorkoutExercise';
import type WorkoutPlan from './WorkoutPlan';
import type PlanDay from './PlanDay';

export default class Workout extends Model {
  static table = 'workouts';

  static associations = {
    users: { type: 'belongs_to' as const, key: 'user_id' },
    workout_plans: { type: 'belongs_to' as const, key: 'plan_id' },
    plan_days: { type: 'belongs_to' as const, key: 'plan_day_id' },
    workout_exercises: { type: 'has_many' as const, foreignKey: 'workout_id' },
  };

  @field('user_id') userId!: string;
  @relation('users', 'user_id') user!: User;
  @children('workout_exercises') workoutExercises!: WorkoutExercise[];

  // Plan references (optional - for workouts started from a template)
  @field('plan_id') planId?: string;
  @relation('workout_plans', 'plan_id') plan?: WorkoutPlan;
  @field('plan_day_id') planDayId?: string;
  @relation('plan_days', 'plan_day_id') planDay?: PlanDay;

  @date('started_at') startedAt!: Date;
  @date('completed_at') completedAt?: Date;
  @field('duration_seconds') durationSeconds?: number;
  @field('title') title?: string;
  @field('notes') notes?: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  // Computed property: workout is active if not completed
  get isActive(): boolean {
    return !this.completedAt;
  }

  // Computed property: format duration as HH:MM:SS
  get durationFormatted(): string {
    if (!this.durationSeconds) return '00:00';
    const hours = Math.floor(this.durationSeconds / 3600);
    const minutes = Math.floor((this.durationSeconds % 3600) / 60);
    const seconds = this.durationSeconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}
