/**
 * User Model
 *
 * Represents authenticated users with preferences and settings.
 * Minimal data stored locally - full profile in Supabase.
 */

import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class User extends Model {
  static table = 'users';

  @field('email') email!: string;
  @field('preferred_unit') preferredUnit!: string; // 'kg' or 'lbs'
  @field('default_rest_timer_seconds') defaultRestTimerSeconds?: number; // Global rest timer default (fallback: 90s)

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  // Get effective rest timer (user default or 90s fallback)
  get effectiveRestTimer(): number {
    return this.defaultRestTimerSeconds ?? 90;
  }
}
