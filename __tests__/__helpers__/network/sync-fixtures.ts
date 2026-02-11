/**
 * Sync Fixtures Generator
 *
 * Generates realistic test data for WatermelonDB sync scenarios:
 * - Basic changes (create, update, delete)
 * - Conflict scenarios
 * - Edge cases (large batches, empty responses)
 *
 * @module sync-fixtures
 */

import type { SyncDatabaseChangeSet, Timestamp } from '@nozbe/watermelondb/sync';
import { randomUUID } from 'crypto';

// ============================================================================
// Types
// ============================================================================

/**
 * Record type for sync changes
 */
export interface SyncRecord {
  id: string;
  created_at: number;
  updated_at: number;
  _changed: number;
  _status: string;
  [key: string]: any;
}

/**
 * Change type enum
 */
export enum ChangeType {
  CREATED = 'created',
  UPDATED = 'updated',
  DELETED = 'deleted',
}

// ============================================================================
// UUID & Timestamp Generators
// ============================================================================

/**
 * Generate valid UUID v4 (using Node.js crypto)
 */
export function generateUUID(): string {
  return randomUUID();
}

/**
 * Generate realistic timestamp (ms since epoch)
 * @param offsetMs - Offset from now in milliseconds (default: 0)
 */
export function generateTimestamp(offsetMs: number = 0): Timestamp {
  return Date.now() + offsetMs;
}

/**
 * Generate timestamp in the past
 * @param minutesAgo - Minutes in the past (default: 5)
 */
export function timestampInPast(minutesAgo: number = 5): Timestamp {
  return Date.now() - minutesAgo * 60 * 1000;
}

/**
 * Generate timestamp in the future
 * @param minutesFromNow - Minutes in the future (default: 5)
 */
export function timestampInFuture(minutesFromNow: number = 5): Timestamp {
  return Date.now() + minutesFromNow * 60 * 1000;
}

// ============================================================================
// Record Generators
// ============================================================================

/**
 * Generate a workout record
 */
export function generateWorkout(overrides: Partial<SyncRecord> = {}): SyncRecord {
  const _now = Date.now();
  return {
    id: generateUUID(),
    user_id: generateUUID(),
    started_at: timestampInPast(10),
    completed_at: timestampInPast(5),
    duration_seconds: 3000,
    title: 'Push Day A',
    notes: 'Test workout',
    created_at: timestampInPast(15),
    updated_at: timestampInPast(5),
    _changed: timestampInPast(5),
    _status: 'synced',
    ...overrides,
  };
}

/**
 * Generate an exercise record
 */
export function generateExercise(overrides: Partial<SyncRecord> = {}): SyncRecord {
  return {
    id: generateUUID(),
    exercisedb_id: `ex_${Math.random().toString(36).substr(2, 9)}`,
    name: 'Barbell Bench Press',
    body_parts: JSON.stringify(['chest']),
    target_muscles: JSON.stringify(['pectorals']),
    secondary_muscles: JSON.stringify(['triceps', 'anterior deltoid']),
    equipments: JSON.stringify(['barbell']),
    instructions: JSON.stringify(['Step 1: ...', 'Step 2: ...']),
    gif_url: 'https://static.exercisedb.dev/media/example.gif',
    created_at: timestampInPast(30),
    updated_at: timestampInPast(30),
    _changed: timestampInPast(30),
    _status: 'synced',
    ...overrides,
  };
}

/**
 * Generate an exercise set record
 */
export function generateExerciseSet(overrides: Partial<SyncRecord> = {}): SyncRecord {
  return {
    id: generateUUID(),
    workout_exercise_id: generateUUID(),
    set_number: 1,
    weight: 100,
    weight_unit: 'kg',
    reps: 8,
    duration_seconds: null,
    distance_meters: null,
    rpe: null,
    rir: 2,
    rest_time_seconds: 120,
    is_warmup: false,
    is_failure: false,
    notes: null,
    completed_at: timestampInPast(5),
    created_at: timestampInPast(10),
    updated_at: timestampInPast(5),
    _changed: timestampInPast(5),
    _status: 'synced',
    ...overrides,
  };
}

// ============================================================================
// Change Generators
// ============================================================================

/**
 * Generate changes for a table
 * @param table - Table name (e.g., 'workouts')
 * @param type - Change type (created, updated, deleted)
 * @param count - Number of records to generate (default: 1)
 */
export function generateChanges(
  table: 'workouts' | 'exercises' | 'exercise_sets' | 'workout_exercises',
  type: ChangeType,
  count: number = 1
): any[] {
  const generator = {
    workouts: generateWorkout,
    exercises: generateExercise,
    exercise_sets: generateExerciseSet,
    workout_exercises: generateWorkout, // Placeholder
  }[table];

  if (type === ChangeType.DELETED) {
    return Array.from({ length: count }, () => generateUUID());
  }

  return Array.from({ length: count }, () => generator());
}

/**
 * Generate SyncDatabaseChangeSet for testing
 * @param tables - Tables to include in changes
 */
export function generateChangeSet(
  tables: Array<'workouts' | 'exercises' | 'exercise_sets' | 'workout_exercises'> = ['workouts']
): SyncDatabaseChangeSet {
  const changes: SyncDatabaseChangeSet = {};

  tables.forEach((table) => {
    // Type assertion needed because SyncDatabaseChangeSet doesn't have index signature
    (changes as Record<string, any>)[table] = {
      created: generateChanges(table, ChangeType.CREATED, 2),
      updated: generateChanges(table, ChangeType.UPDATED, 1),
      deleted: generateChanges(table, ChangeType.DELETED, 1) as string[],
    };
  });

  return changes;
}

// ============================================================================
// Conflict Generators
// ============================================================================

/**
 * Generate a conflict scenario (same record, different timestamps)
 * @param baseRecord - Base record to create conflict from
 * @param localIsNewer - Whether local change is newer than remote (default: true)
 */
export function generateConflict(
  baseRecord: SyncRecord,
  localIsNewer: boolean = true
): { local: SyncRecord; remote: SyncRecord } {
  const _timeDiff = 60 * 1000; // 1 minute difference

  const local = {
    ...baseRecord,
    _changed: localIsNewer ? Date.now() : timestampInPast(2),
    updated_at: localIsNewer ? Date.now() : timestampInPast(2),
    title: 'Local Edit',
  };

  const remote = {
    ...baseRecord,
    _changed: localIsNewer ? timestampInPast(2) : Date.now(),
    updated_at: localIsNewer ? timestampInPast(2) : Date.now(),
    title: 'Remote Edit',
  };

  return { local, remote };
}

/**
 * Generate multi-device conflict scenario
 * @param baseRecord - Base record
 * @param deviceCount - Number of devices modifying the record (default: 2)
 */
export function generateMultiDeviceConflict(
  baseRecord: SyncRecord,
  deviceCount: number = 2
): SyncRecord[] {
  return Array.from({ length: deviceCount }, (_, index) => ({
    ...baseRecord,
    _changed: timestampInPast(deviceCount - index),
    updated_at: timestampInPast(deviceCount - index),
    title: `Device ${index + 1} Edit`,
  }));
}

// ============================================================================
// Sync Response Generators
// ============================================================================

/**
 * Generate pull changes response
 * @param changes - Changes to include
 * @param timestamp - Response timestamp (default: now)
 */
export function generatePullResponse(
  changes: SyncDatabaseChangeSet = generateChangeSet(),
  timestamp: Timestamp = Date.now()
): { changes: SyncDatabaseChangeSet; timestamp: Timestamp } {
  return { changes, timestamp };
}

/**
 * Generate empty pull response (no changes)
 */
export function generateEmptyPullResponse(): {
  changes: SyncDatabaseChangeSet;
  timestamp: Timestamp;
} {
  return {
    changes: {},
    timestamp: Date.now(),
  };
}

/**
 * Generate large batch pull response (for performance testing)
 * @param recordCount - Number of records per table (default: 100)
 */
export function generateLargeBatch(recordCount: number = 100): SyncDatabaseChangeSet {
  return {
    workouts: {
      created: generateChanges('workouts', ChangeType.CREATED, recordCount),
      updated: [],
      deleted: [],
    },
    exercise_sets: {
      created: generateChanges('exercise_sets', ChangeType.CREATED, recordCount * 5),
      updated: [],
      deleted: [],
    },
  };
}

// ============================================================================
// Edge Case Generators
// ============================================================================

/**
 * Generate partial sync scenario (sync interrupted mid-operation)
 */
export function generatePartialSync(tables: string[] = ['workouts', 'exercises']): {
  partialChanges: SyncDatabaseChangeSet;
  remainingChanges: SyncDatabaseChangeSet;
} {
  const all = generateChangeSet(tables as any);
  const partial: SyncDatabaseChangeSet = {};
  const remaining: SyncDatabaseChangeSet = {};

  // Type assertions needed for indexing
  const allRecord = all as Record<string, any>;
  const partialRecord = partial as Record<string, any>;
  const remainingRecord = remaining as Record<string, any>;

  tables.forEach((table, index) => {
    if (index < tables.length / 2) {
      partialRecord[table] = allRecord[table];
    } else {
      remainingRecord[table] = allRecord[table];
    }
  });

  return { partialChanges: partial, remainingChanges: remaining };
}

/**
 * Generate retry queue scenario (failed sync with pending changes)
 */
export function generateRetryQueueData(): {
  failedChanges: SyncDatabaseChangeSet;
  pendingChanges: SyncDatabaseChangeSet;
} {
  return {
    failedChanges: generateChangeSet(['workouts']),
    pendingChanges: generateChangeSet(['exercise_sets']),
  };
}

// ============================================================================
// Exports
// ============================================================================

export const fixtures = {
  // Generators
  generateUUID,
  generateTimestamp,
  timestampInPast,
  timestampInFuture,
  generateWorkout,
  generateExercise,
  generateExerciseSet,
  generateChanges,
  generateChangeSet,
  generateConflict,
  generateMultiDeviceConflict,
  generatePullResponse,
  generateEmptyPullResponse,
  generateLargeBatch,
  generatePartialSync,
  generateRetryQueueData,
};

export default fixtures;
