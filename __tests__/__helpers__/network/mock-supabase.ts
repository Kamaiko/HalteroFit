/**
 * Mock Supabase API for Integration Tests
 *
 * Uses msw (Mock Service Worker) to intercept Supabase RPC calls.
 * Simulates pull_changes and push_changes endpoints for WatermelonDB sync.
 *
 * @module mock-supabase
 */

import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { SyncDatabaseChangeSet, Timestamp } from '@nozbe/watermelondb/sync';

// ============================================================================
// Types
// ============================================================================

/**
 * Pull changes request parameters (WatermelonDB sync protocol)
 */
export interface PullChangesRequest {
  lastPulledAt: Timestamp;
  schemaVersion: number;
  migration?: {
    from: number;
    tables: string[];
    columns: { table: string; columns: string[] }[];
  } | null;
}

/**
 * Pull changes response (WatermelonDB sync protocol)
 */
export interface PullChangesResponse {
  changes: SyncDatabaseChangeSet;
  timestamp: Timestamp;
}

/**
 * Push changes request parameters (WatermelonDB sync protocol)
 */
export interface PushChangesRequest {
  changes: SyncDatabaseChangeSet;
  lastPulledAt: Timestamp;
}

// ============================================================================
// Mock Data Store
// ============================================================================

/**
 * In-memory data store for mock sync operations
 * Simulates server-side database state
 */
export class MockSupabaseStore {
  private data: Map<string, Map<string, any>> = new Map();
  private timestamps: Map<string, Timestamp> = new Map();
  private lastSyncTimestamp: Timestamp = Date.now();

  /**
   * Initialize store with tables
   */
  constructor(
    tables: string[] = ['workouts', 'exercises', 'workout_exercises', 'exercise_sets', 'users']
  ) {
    tables.forEach((table) => {
      this.data.set(table, new Map());
    });
  }

  /**
   * Apply changes from push sync
   */
  applyChanges(changes: SyncDatabaseChangeSet): void {
    Object.entries(changes).forEach(([table, tableChanges]) => {
      const tableData = this.data.get(table);
      if (!tableData) return;

      // Type guard: tableChanges is the table change object
      const typedChanges = tableChanges as { created?: any[]; updated?: any[]; deleted?: string[] };

      // Apply creates
      typedChanges.created?.forEach((record: any) => {
        tableData.set(record.id, { ...record, _changed: Date.now(), _status: 'synced' });
      });

      // Apply updates (last write wins based on _changed)
      typedChanges.updated?.forEach((record: any) => {
        const existing = tableData.get(record.id);
        if (!existing || (record._changed && record._changed > existing._changed)) {
          tableData.set(record.id, { ...record, _status: 'synced' });
        }
      });

      // Apply deletes
      typedChanges.deleted?.forEach((id: string) => {
        tableData.delete(id);
      });
    });

    this.lastSyncTimestamp = Date.now();
  }

  /**
   * Get changes since lastPulledAt timestamp
   */
  getChangesSince(lastPulledAt: Timestamp): SyncDatabaseChangeSet {
    const changes: SyncDatabaseChangeSet = {};

    this.data.forEach((tableData, tableName) => {
      const tableChanges = {
        created: [] as any[],
        updated: [] as any[],
        deleted: [] as string[],
      };

      tableData.forEach((record) => {
        if (record._changed > lastPulledAt) {
          // Determine if created or updated based on created_at vs lastPulledAt
          if (record.created_at > lastPulledAt) {
            tableChanges.created.push(record);
          } else {
            tableChanges.updated.push(record);
          }
        }
      });

      if (
        tableChanges.created.length > 0 ||
        tableChanges.updated.length > 0 ||
        tableChanges.deleted.length > 0
      ) {
        // Type assertion needed for indexing
        (changes as Record<string, any>)[tableName] = tableChanges;
      }
    });

    return changes;
  }

  /**
   * Seed data for testing
   */
  seedData(table: string, records: any[]): void {
    const tableData = this.data.get(table);
    if (!tableData) return;

    records.forEach((record) => {
      tableData.set(record.id, {
        ...record,
        _changed: record._changed || Date.now(),
        _status: 'synced',
      });
    });
  }

  /**
   * Reset store to initial state
   */
  reset(): void {
    this.data.forEach((tableData) => tableData.clear());
    this.lastSyncTimestamp = Date.now();
  }

  /**
   * Get current timestamp
   */
  getTimestamp(): Timestamp {
    return this.lastSyncTimestamp;
  }
}

// ============================================================================
// Mock Server Setup
// ============================================================================

// Global mock store instance
export const mockStore = new MockSupabaseStore();

/**
 * Supabase base URL (matches real Supabase project)
 */
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';

/**
 * msw request handlers for Supabase RPC endpoints
 */
export const supabaseHandlers = [
  /**
   * Pull changes handler (GET/POST /rest/v1/rpc/pull_changes)
   * Returns changes since lastPulledAt timestamp
   */
  http.post(`${SUPABASE_URL}/rest/v1/rpc/pull_changes`, async ({ request }) => {
    const body = (await request.json()) as PullChangesRequest;
    const { lastPulledAt, schemaVersion: _schemaVersion, migration: _migration } = body;

    // Get changes since lastPulledAt
    const changes = mockStore.getChangesSince(lastPulledAt || 0);
    const timestamp = mockStore.getTimestamp();

    const response: PullChangesResponse = { changes, timestamp };

    return HttpResponse.json(response, { status: 200 });
  }),

  /**
   * Push changes handler (POST /rest/v1/rpc/push_changes)
   * Accepts local changes and applies them to mock store
   */
  http.post(`${SUPABASE_URL}/rest/v1/rpc/push_changes`, async ({ request }) => {
    const body = (await request.json()) as PushChangesRequest;
    const { changes, lastPulledAt: _lastPulledAt } = body;

    // Apply changes to mock store
    mockStore.applyChanges(changes);

    return HttpResponse.json({ success: true }, { status: 200 });
  }),
];

/**
 * Create and configure msw server
 */
export const mockSupabaseServer = setupServer(...supabaseHandlers);

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Setup msw server for tests (call in beforeAll)
 */
export function setupMockSupabase(): void {
  mockSupabaseServer.listen({ onUnhandledRequest: 'warn' });
}

/**
 * Reset msw handlers and mock store (call in afterEach)
 */
export function resetMockSupabase(): void {
  mockSupabaseServer.resetHandlers();
  mockStore.reset();
}

/**
 * Cleanup msw server (call in afterAll)
 */
export function cleanupMockSupabase(): void {
  mockSupabaseServer.close();
}

/**
 * Seed mock data for testing
 */
export function seedMockData(table: string, records: any[]): void {
  mockStore.seedData(table, records);
}

/**
 * Get mock store instance for advanced scenarios
 */
export function getMockStore(): MockSupabaseStore {
  return mockStore;
}
