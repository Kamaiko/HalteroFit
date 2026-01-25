/**
 * WorkoutPlan Model
 *
 * Represents a reusable workout plan/template.
 * Contains multiple plan_days, each with exercises.
 */

import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation, children } from '@nozbe/watermelondb/decorators';
import type User from './User';
import type PlanDay from './PlanDay';

export default class WorkoutPlan extends Model {
  static table = 'workout_plans';

  static associations = {
    users: { type: 'belongs_to' as const, key: 'user_id' },
    plan_days: { type: 'has_many' as const, foreignKey: 'plan_id' },
    workouts: { type: 'has_many' as const, foreignKey: 'plan_id' },
  };

  @field('user_id') userId!: string;
  @relation('users', 'user_id') user!: User;
  @children('plan_days') planDays!: PlanDay[];

  @field('name') name!: string;
  @field('is_active') isActive!: boolean;
  @field('cover_image_url') coverImageUrl?: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
