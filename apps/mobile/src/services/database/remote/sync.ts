/**
 * WatermelonDB Sync Service - Official Protocol
 *
 * Architecture:
 * - Uses WatermelonDB's built-in synchronize() function
 * - Bidirectional sync: pull (download) + push (upload)
 * - Automatic conflict resolution (last write wins)
 * - Batch operations for performance
 *
 * References:
 * - DATABASE.md § Supabase Sync
 * - WatermelonDB Sync Docs: https://watermelondb.dev/docs/Sync/Frontend
 */

/* eslint-disable no-console -- console.error kept for sync diagnostics (always useful); console.log guarded by __DEV__ */

import { synchronize, hasUnsyncedChanges } from '@nozbe/watermelondb/sync';
import type { RawRecord } from '@nozbe/watermelondb/RawRecord';
import SyncLogger from '@nozbe/watermelondb/sync/SyncLogger';
import { database } from '../local';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/stores/auth/authStore';
import { useSyncStore } from '@/stores/sync/syncStore';
import { SyncError } from '@/utils/errors';
import type { SyncableTableName } from './types';

// ============================================================================
// Constants
// ============================================================================

const AUTO_SYNC_DEBOUNCE_MS = 2000;
const SIGN_OUT_SYNC_TIMEOUT_MS = 10_000;

/** All tables included in WatermelonDB↔Supabase sync */
const SYNCABLE_TABLES: SyncableTableName[] = [
  'users',
  'workouts',
  'workout_exercises',
  'exercise_sets',
  'workout_plans',
  'plan_days',
  'plan_day_exercises',
];

// ============================================================================
// Types
// ============================================================================

export interface SyncResult {
  success: boolean;
  timestamp: number;
  pulledRecords: number;
  pushedRecords: number;
  errors: string[];
}

export interface SyncStatus {
  lastSyncedAt: number | null;
  hasUnsyncedChanges: boolean;
  isSyncing: boolean;
  isOnline: boolean;
}

// ============================================================================
// Module State (implementation details for waitForInitialSync)
// ============================================================================

let initialSyncResolvers: Array<() => void> = [];
let pendingTimeouts: Array<ReturnType<typeof setTimeout>> = [];

/**
 * Wait for the first sync after sign-in to complete.
 * Resolves immediately if initial sync already ran.
 * Used by useWorkoutScreen to avoid creating default plans
 * before pulling existing data from the server.
 */
export function waitForInitialSync(): Promise<void> {
  if (useSyncStore.getState().initialSyncCompleted) return Promise.resolve();
  return new Promise((resolve) => {
    initialSyncResolvers.push(resolve);
    // Fallback: if sync never runs (mock auth, offline, no Supabase), don't block forever
    const timeoutId = setTimeout(resolve, SIGN_OUT_SYNC_TIMEOUT_MS);
    pendingTimeouts.push(timeoutId);
  });
}

/** Resolve all pending waitForInitialSync() callers and mark initial sync as done. */
export function resolveInitialSync(): void {
  if (useSyncStore.getState().initialSyncCompleted) return;
  useSyncStore.getState().markInitialSyncCompleted();
  for (const resolve of initialSyncResolvers) resolve();
  initialSyncResolvers = [];
  for (const id of pendingTimeouts) clearTimeout(id);
  pendingTimeouts = [];
}

/** Reset sync state on sign-out (DB gets wiped, need fresh initial sync) */
export function resetSyncState(): void {
  useSyncStore.getState().reset();
  initialSyncResolvers = [];
  for (const id of pendingTimeouts) clearTimeout(id);
  pendingTimeouts = [];
}

// ============================================================================
// Main Sync Function (WatermelonDB Protocol)
// ============================================================================

/**
 * Synchronize local database with Supabase backend.
 * Returns early if not authenticated or Supabase is unavailable.
 *
 * @throws {SyncError} If sync fails after auth/config checks pass
 */
export async function sync(): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    timestamp: Date.now(),
    pulledRecords: 0,
    pushedRecords: 0,
    errors: [],
  };

  // Guard: must be authenticated
  const user = useAuthStore.getState().user;
  if (!user?.id) {
    if (__DEV__) console.log('Sync skipped — not authenticated');
    return result;
  }

  // Guard: Supabase must be configured
  if (!supabase) {
    if (__DEV__) console.log('Sync skipped — Supabase not configured');
    return result;
  }

  // Guard: must have active Supabase session (JWT)
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    if (__DEV__) console.log('Sync skipped — no active session');
    return result;
  }

  if (useSyncStore.getState().isSyncing) {
    if (__DEV__) console.log('Sync skipped — already in progress');
    return result;
  }

  useSyncStore.getState().setIsSyncing(true);
  const logger = new SyncLogger(10);
  const sb = supabase; // Capture non-null ref for closures

  try {
    await synchronize({
      database,

      // Pull changes from server
      pullChanges: async ({ lastPulledAt }) => {
        if (__DEV__) console.log('Pulling changes since:', new Date(lastPulledAt || 0));

        const { data, error } = await sb!.rpc('pull_changes', {
          last_pulled_at: lastPulledAt || 0,
        });

        if (error) {
          console.error('Pull error:', error);
          throw new SyncError(
            'Failed to download data from server',
            `Supabase RPC error: ${error.message}`,
            true // retryable
          );
        }

        // Count pulled records
        let pulledCount = 0;
        for (const table in data.changes) {
          const tableChanges = data.changes[table];
          pulledCount +=
            (tableChanges.created?.length || 0) +
            (tableChanges.updated?.length || 0) +
            (tableChanges.deleted?.length || 0);
        }
        result.pulledRecords = pulledCount;

        if (__DEV__) console.log('Pulled', pulledCount, 'changes');

        return {
          changes: data.changes,
          timestamp: data.timestamp,
        };
      },

      // Push local changes to server
      pushChanges: async ({ changes }) => {
        // Filter to syncable tables only — WatermelonDB sends ALL dirty tables
        // (exercises have non-UUID IDs and are static local data, must be excluded)
        const syncableChanges: Record<string, unknown> = {};
        for (const table of SYNCABLE_TABLES) {
          if (changes[table as keyof typeof changes]) {
            syncableChanges[table] = changes[table as keyof typeof changes];
          }
        }

        // Count records to push (from filtered set only)
        let pushCount = 0;
        for (const table of SYNCABLE_TABLES) {
          const tableChanges = syncableChanges[table] as
            | { created?: RawRecord[]; updated?: RawRecord[]; deleted?: string[] }
            | undefined;
          if (!tableChanges) continue;
          pushCount +=
            (tableChanges.created?.length || 0) +
            (tableChanges.updated?.length || 0) +
            (tableChanges.deleted?.length || 0);
        }

        if (pushCount === 0) {
          if (__DEV__) console.log('No changes to push');
          return;
        }

        if (__DEV__) console.log('Pushing', pushCount, 'changes');

        const { error } = await sb!.rpc('push_changes', {
          changes: syncableChanges,
        });

        if (error) {
          console.error('Push error:', error);
          throw new SyncError(
            'Failed to upload data to server',
            `Supabase RPC error: ${error.message}`,
            true // retryable
          );
        }

        result.pushedRecords = pushCount;
        if (__DEV__) console.log('Pushed', pushCount, 'changes');
      },

      // Migration support (for schema version changes)
      migrationsEnabledAtVersion: 1,

      // Logging (for debugging)
      log: logger.newLog(),
    });

    result.success = true;
    result.timestamp = Date.now();
    useSyncStore.getState().setLastSyncedAt(result.timestamp);

    // Unblock waitForInitialSync() callers (e.g. useWorkoutScreen default plan creation)
    resolveInitialSync();

    if (__DEV__) {
      console.log('Sync completed successfully');
      console.log('Sync stats:', {
        pulled: result.pulledRecords,
        pushed: result.pushedRecords,
      });
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    result.errors.push(errorMessage);
    console.error('Sync failed:', errorMessage);
    if (__DEV__) console.error('Sync logs:', logger.formattedLogs);

    if (error instanceof SyncError) {
      throw error;
    }

    throw new SyncError(
      'Sync failed. Your data is safe locally.',
      `Sync error: ${errorMessage}`,
      true
    );
  } finally {
    useSyncStore.getState().setIsSyncing(false);
  }
}

// ============================================================================
// Sync Status Helpers
// ============================================================================

/**
 * Check if there are unsynced changes locally
 */
export async function checkUnsyncedChanges(): Promise<boolean> {
  try {
    return await hasUnsyncedChanges({ database });
  } catch (error) {
    console.error('Error checking unsynced changes:', error);
    return false;
  }
}

/**
 * Get sync status (for UI display)
 */
export async function getSyncStatus(): Promise<SyncStatus> {
  const hasUnsynced = await checkUnsyncedChanges();
  const { lastSyncedAt, isSyncing: syncing } = useSyncStore.getState();

  return {
    lastSyncedAt,
    hasUnsyncedChanges: hasUnsynced,
    isSyncing: syncing,
    isOnline: true, // TODO: NetInfo integration (future)
  };
}

// ============================================================================
// Auto-Sync
// ============================================================================

/**
 * Setup automatic sync on data changes.
 * Watches all 7 syncable tables with 2s debounce.
 *
 * @returns Teardown function to unsubscribe
 */
export function setupAutoSync(): () => void {
  let syncTimeout: ReturnType<typeof setTimeout> | null = null;
  let isSyncScheduled = false;

  const debouncedSync = () => {
    if (syncTimeout) clearTimeout(syncTimeout);

    syncTimeout = setTimeout(async () => {
      isSyncScheduled = false;
      try {
        await sync();
      } catch (error) {
        if (__DEV__) console.log('Auto-sync failed (will retry on next change):', error);
      }
    }, AUTO_SYNC_DEBOUNCE_MS);
  };

  const subscription = database.withChangesForTables(SYNCABLE_TABLES).subscribe(() => {
    if (!isSyncScheduled && __DEV__) {
      isSyncScheduled = true;
      console.log('Data changed, scheduling sync...');
    }
    debouncedSync();
  });

  if (__DEV__) console.log('Auto-sync enabled for tables:', SYNCABLE_TABLES);

  return () => {
    if (syncTimeout) clearTimeout(syncTimeout);
    subscription.unsubscribe();
    if (__DEV__) console.log('Auto-sync disabled');
  };
}

// ============================================================================
// Manual & Pre-SignOut Sync
// ============================================================================

/**
 * Manual sync trigger (for pull-to-refresh)
 */
export async function manualSync(): Promise<SyncResult> {
  if (__DEV__) console.log('Manual sync triggered');
  return await sync();
}

/**
 * Best-effort sync before sign-out.
 * Attempts to push unsynced changes with a timeout.
 * Never throws — returns false if sync fails.
 */
export async function syncBeforeSignOut(): Promise<boolean> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    const hasChanges = await checkUnsyncedChanges();
    if (!hasChanges) {
      if (__DEV__) console.log('No unsynced changes before sign-out');
      return true;
    }

    if (__DEV__) console.log('Syncing before sign-out...');

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new Error('Pre-signout sync timeout')),
        SIGN_OUT_SYNC_TIMEOUT_MS
      );
    });
    await Promise.race([sync(), timeoutPromise]);

    if (__DEV__) console.log('Pre-signout sync succeeded');
    return true;
  } catch (error) {
    if (__DEV__) console.warn('Pre-signout sync failed:', error);
    return false;
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
}
