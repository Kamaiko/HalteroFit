/**
 * Database Service - Main Export
 *
 * WatermelonDB-based offline-first storage with reactive queries
 *
 * ARCHITECTURE:
 * - local/ - WatermelonDB (schema, models, migrations)
 * - remote/ - Supabase sync protocol
 * - operations/ - Business logic (CRUD operations)
 *
 * USAGE:
 * import { createWorkout, observeUserWorkouts } from '@/services/database';
 * import { createPlan, getExercises } from '@/services/database';
 */

// WatermelonDB database instance
export { database } from './local';

// All operations (workouts, plans, exercises)
export * from './operations';

// Sync operations
export {
  sync,
  getSyncStatus,
  setupAutoSync,
  manualSync,
  checkUnsyncedChanges,
} from './remote/sync';
export type { SyncStatus, SyncResult } from './remote/sync';
