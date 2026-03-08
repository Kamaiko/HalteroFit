/**
 * WatermelonDB ID Generator
 *
 * Configures WatermelonDB to use UUID v4 for all record IDs.
 * Must be imported before any database operations (imported in ./index.ts).
 *
 * Also exports exerciseUuid() for deterministic UUID v5 generation
 * from ExerciseDB dataset IDs — ensures the same exercise gets the
 * same UUID on every client and in Supabase.
 */

import { randomUUID } from 'expo-crypto';
import { v5 as uuidv5 } from 'uuid';
import { setGenerator } from '@nozbe/watermelondb/utils/common/randomId';

// All WatermelonDB records use UUID v4 via expo-crypto (Hermes-compatible)
setGenerator(() => randomUUID());

/**
 * Fixed namespace for exercise UUID v5 generation.
 * NEVER change this — it would break all existing exercise references.
 */
const EXERCISE_NAMESPACE = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

/**
 * Generate a deterministic UUID from an ExerciseDB dataset ID.
 * Same input always produces the same UUID (uuid v5, name-based).
 *
 * @example exerciseUuid('SVlvfXsNwMGAw89t') → '3a1b2c3d-...' (stable)
 */
export function exerciseUuid(exerciseDbId: string): string {
  return uuidv5(exerciseDbId, EXERCISE_NAMESPACE);
}
