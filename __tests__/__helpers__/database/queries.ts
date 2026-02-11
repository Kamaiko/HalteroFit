/**
 * Database Query Helpers
 *
 * Reusable query utilities for WatermelonDB collections.
 * Provides common query patterns to reduce test boilerplate.
 *
 * @module test-helpers/database/queries
 */

import { Database, Model } from '@nozbe/watermelondb';
import type { Clause } from '@nozbe/watermelondb/QueryDescription';

/**
 * Fetches all records from a collection.
 *
 * @param {Database} database - WatermelonDB instance
 * @param {string} tableName - Collection name (e.g., 'workouts')
 * @returns {Promise<Model[]>} All records in the collection
 *
 * @example
 * ```typescript
 * const workouts = await getAllRecords(database, 'workouts');
 * expect(workouts).toHaveLength(5);
 * ```
 */
export async function getAllRecords(database: Database, tableName: string): Promise<Model[]> {
  const collection = database.get(tableName);
  return await collection.query().fetch();
}

/**
 * Fetches a single record by ID.
 *
 * @param {Database} database - WatermelonDB instance
 * @param {string} tableName - Collection name
 * @param {string} id - Record ID
 * @returns {Promise<Model>} Record with the specified ID
 * @throws {Error} If record not found
 *
 * @example
 * ```typescript
 * const workout = await getRecordById(database, 'workouts', 'workout-1');
 * expect(workout.title).toBe('Leg Day');
 * ```
 */
export async function getRecordById(
  database: Database,
  tableName: string,
  id: string
): Promise<Model> {
  const collection = database.get(tableName);
  return await collection.find(id);
}

/**
 * Counts records in a collection matching optional query.
 *
 * @param {Database} database - WatermelonDB instance
 * @param {string} tableName - Collection name
 * @param {Clause[]} queryConditions - Optional WatermelonDB query conditions
 * @returns {Promise<number>} Number of matching records
 *
 * @example
 * ```typescript
 * const count = await countRecords(database, 'workouts');
 * expect(count).toBe(10);
 *
 * const completedCount = await countRecords(database, 'workouts', [
 *   Q.where('status', 'completed')
 * ]);
 * expect(completedCount).toBe(5);
 * ```
 */
export async function countRecords(
  database: Database,
  tableName: string,
  queryConditions: Clause[] = []
): Promise<number> {
  const collection = database.get(tableName);
  return await collection.query(...queryConditions).fetchCount();
}

/**
 * Checks if a record exists by ID.
 *
 * @param {Database} database - WatermelonDB instance
 * @param {string} tableName - Collection name
 * @param {string} id - Record ID
 * @returns {Promise<boolean>} True if record exists, false otherwise
 *
 * @example
 * ```typescript
 * const exists = await recordExists(database, 'workouts', 'workout-1');
 * expect(exists).toBe(true);
 * ```
 */
export async function recordExists(
  database: Database,
  tableName: string,
  id: string
): Promise<boolean> {
  try {
    await getRecordById(database, tableName, id);
    return true;
  } catch {
    return false;
  }
}
