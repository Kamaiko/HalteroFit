/**
 * Exercise Model
 *
 * Represents exercises from GitHub ExerciseDB dataset (1,500 exercises).
 * 8 fields: exercisedb_id, name, body_parts, target_muscles,
 *           secondary_muscles, equipments, instructions, gif_url
 * READ-ONLY in MVP - custom exercises deferred to Phase 3+ (ADR-017).
 * Animated GIFs provided by GitHub ExerciseDB CDN.
 */

import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, json } from '@nozbe/watermelondb/decorators';

/**
 * Sanitize string array from any input (handles arrays, JSON strings, or invalid data)
 */
const sanitizeStringArray = (raw: unknown): string[] => {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string') {
    if (raw === '') return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
};

export default class Exercise extends Model {
  static table = 'exercises';

  @field('exercisedb_id') exercisedbId!: string;
  @field('name') name!: string;

  @json('body_parts', sanitizeStringArray) bodyParts!: string[];
  @json('target_muscles', sanitizeStringArray) targetMuscles!: string[];
  @json('secondary_muscles', sanitizeStringArray) secondaryMuscles!: string[];
  @json('equipments', sanitizeStringArray) equipments!: string[];
  @json('instructions', sanitizeStringArray) instructions!: string[];
  @field('gif_url') gifUrl?: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  // ===== Computed properties for convenience =====

  /**
   * Primary muscle (first target muscle)
   * @deprecated Use targetMuscles[0] directly
   */
  get primaryMuscle(): string | undefined {
    return this.targetMuscles[0];
  }

  /**
   * Primary equipment (first equipment)
   */
  get primaryEquipment(): string | undefined {
    return this.equipments[0];
  }

  /**
   * All muscles involved (target + secondary)
   */
  get allMuscles(): string[] {
    return [...this.targetMuscles, ...this.secondaryMuscles];
  }

  // FUTURE: Custom exercises (Phase 3+)
  // If beta users validate need, add:
  // - @field('is_custom') isCustom?: boolean
  // - @field('created_by') createdBy?: string
  // See docs/ADR-017-No-Custom-Exercises-MVP.md
}
