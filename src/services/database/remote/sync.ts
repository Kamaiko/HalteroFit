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
 * - WatermelonDB Sync Docs: https://nozbe.github.io/WatermelonDB/Advanced/Sync.html
 */

import { synchronize, hasUnsyncedChanges } from '@nozbe/watermelondb/sync';
import type { RawRecord } from '@nozbe/watermelondb/RawRecord';
import SyncLogger from '@nozbe/watermelondb/sync/SyncLogger';
import { database } from '../local';
import { supabase } from '@/services/supabase';
import { DatabaseError } from '@/utils/errors';

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
  isOnline: boolean;
}

// ============================================================================
// Main Sync Function (WatermelonDB Protocol)
// ============================================================================

/**
 * Synchronize local database with Supabase backend
 * Uses WatermelonDB's official sync protocol
 *
 * @throws {DatabaseError} If sync fails
 */
export async function sync(): Promise<SyncResult> {
  const logger = new SyncLogger(10);
  const result: SyncResult = {
    success: false,
    timestamp: Date.now(),
    pulledRecords: 0,
    pushedRecords: 0,
    errors: [],
  };

  try {
    await synchronize({
      database,

      // Pull changes from server
      pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
        if (__DEV__) console.log('Pulling changes since:', new Date(lastPulledAt || 0));

        const { data, error } = await supabase.rpc('pull_changes', {
          last_pulled_at: lastPulledAt || 0,
        });

        if (error) {
          console.error('Pull error:', error);
          throw new DatabaseError(
            'Failed to download data from server',
            `Supabase RPC error: ${error.message}`
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
      pushChanges: async ({ changes, lastPulledAt }) => {
        // Count records to push
        let pushCount = 0;
        for (const table of Object.keys(changes)) {
          const tableChanges = changes[table as keyof typeof changes] as {
            created?: RawRecord[];
            updated?: RawRecord[];
            deleted?: string[];
          };
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

        const { error } = await supabase.rpc('push_changes', {
          changes: changes,
        });

        if (error) {
          console.error('Push error:', error);
          throw new DatabaseError(
            'Failed to upload data to server',
            `Supabase RPC error: ${error.message}`
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
    if (__DEV__) {
      console.log('Sync completed successfully');
      console.log('Sync stats:', {
        pulled: result.pulledRecords,
        pushed: result.pushedRecords,
      });
    }

    // Log detailed sync info (for debugging)
    if (__DEV__) {
      console.log('Sync logs:', logger.formattedLogs);
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    result.errors.push(errorMessage);

    console.error('Sync failed:', errorMessage);

    if (error instanceof DatabaseError) {
      throw error;
    }

    throw new DatabaseError(
      'Sync failed. Your data is safe locally.',
      `Sync error: ${errorMessage}`
    );
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
  // TODO: Store lastSyncedAt in MMKV (Phase 1)

  const hasUnsynced = await checkUnsyncedChanges();

  return {
    lastSyncedAt: null, // Will implement in Phase 1
    hasUnsyncedChanges: hasUnsynced,
    isOnline: true, // Will implement connectivity check later
  };
}

// ============================================================================
// Auto-Sync Helper
// ============================================================================

/**
 * Setup automatic sync on data changes
 * Call this once during app initialization
 */
export function setupAutoSync() {
  // Debounced sync (wait 2s after last change before syncing)
  let syncTimeout: ReturnType<typeof setTimeout> | null = null;

  const debouncedSync = () => {
    if (syncTimeout) clearTimeout(syncTimeout);

    syncTimeout = setTimeout(async () => {
      try {
        await sync();
      } catch (error) {
        if (__DEV__) console.log('Auto-sync failed (will retry later):', error);
      }
    }, 2000); // 2 second debounce
  };

  // Listen to changes in critical tables
  database
    .withChangesForTables(['workouts', 'workout_exercises', 'exercise_sets'])
    .subscribe(() => {
      if (__DEV__) console.log('Data changed, scheduling sync...');
      debouncedSync();
    });

  if (__DEV__) console.log('Auto-sync enabled');
}

/**
 * Manual sync trigger (for pull-to-refresh)
 */
export async function manualSync(): Promise<SyncResult> {
  if (__DEV__) console.log('Manual sync triggered');
  return await sync();
}
