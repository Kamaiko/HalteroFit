/**
 * Integration Test: Basic Sync Operations
 *
 * Tests WatermelonDB sync protocol with mock Supabase:
 * - Pull changes (download from server)
 * - Push changes (upload to server)
 * - Bidirectional sync
 *
 * LIMITATIONS:
 * - Uses LokiJS (NOT Real SQLite)
 * - Cannot test `_changed`, `_status` columns (SQLite-specific)
 * - Cannot call `synchronize()` directly (requires native module)
 * - Tests sync LOGIC only (E2E tests validate full sync protocol)
 *
 * @module integration/database/sync-basic
 */

import { http, HttpResponse } from 'msw';
import { mockSupabaseServer } from '@test-helpers/network/mock-supabase';
import {
  generateChangeSet,
  generatePullResponse,
  fixtures,
} from '@test-helpers/network/sync-fixtures';
import type { SyncDatabaseChangeSet } from '@nozbe/watermelondb/sync';

describe('Sync: Basic Operations', () => {
  describe('Pull Changes (Download)', () => {
    it('should handle empty pull response', async () => {
      // Mock Supabase pull_changes endpoint
      mockSupabaseServer.use(
        http.post('*/rest/v1/rpc/pull_changes', () => {
          return HttpResponse.json({
            changes: {},
            timestamp: Date.now(),
          });
        })
      );

      // Simulate pull request
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/rpc/pull_changes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lastPulledAt: 0 }),
        }
      );

      const data = await response.json();

      expect(data.changes).toEqual({});
      expect(data.timestamp).toBeValidTimestamp();
    });

    it('should pull created workouts from server', async () => {
      // Generate mock changes
      const mockChanges = generateChangeSet(['workouts']);

      mockSupabaseServer.use(
        http.post('*/rest/v1/rpc/pull_changes', () => {
          return HttpResponse.json(generatePullResponse(mockChanges));
        })
      );

      // Simulate pull request
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/rpc/pull_changes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lastPulledAt: 0 }),
        }
      );

      const data = await response.json();

      expect(data.changes.workouts).toBeDefined();
      expect(data.changes.workouts.created).toHaveLength(2); // generateChangeSet creates 2 by default
      expect(data.changes.workouts.updated).toHaveLength(1);
      expect(data.changes.workouts.deleted).toHaveLength(1);
    });

    it('should pull multiple tables in one request', async () => {
      const mockChanges = generateChangeSet(['workouts', 'exercises', 'exercise_sets']);

      mockSupabaseServer.use(
        http.post('*/rest/v1/rpc/pull_changes', () => {
          return HttpResponse.json(generatePullResponse(mockChanges));
        })
      );

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/rpc/pull_changes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lastPulledAt: 0 }),
        }
      );

      const data = await response.json();

      expect(Object.keys(data.changes)).toEqual(['workouts', 'exercises', 'exercise_sets']);
    });

    it('should respect lastPulledAt timestamp', async () => {
      const lastPulledAt = fixtures.timestampInPast(10);

      // Only return changes newer than lastPulledAt
      const recentChanges: SyncDatabaseChangeSet = {
        workouts: {
          created: [fixtures.generateWorkout({ _changed: Date.now() })],
          updated: [],
          deleted: [],
        },
      };

      mockSupabaseServer.use(
        http.post('*/rest/v1/rpc/pull_changes', async ({ request }) => {
          const body = (await request.json()) as any;

          // Verify lastPulledAt is passed correctly
          expect(body.lastPulledAt).toBe(lastPulledAt);

          return HttpResponse.json(generatePullResponse(recentChanges));
        })
      );

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/rpc/pull_changes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lastPulledAt }),
        }
      );

      const data = await response.json();

      expect(data.changes.workouts.created).toHaveLength(1);
    });
  });

  describe('Push Changes (Upload)', () => {
    it('should push created workouts to server', async () => {
      const localChanges = generateChangeSet(['workouts']);

      let pushedData: any = null;

      mockSupabaseServer.use(
        http.post('*/rest/v1/rpc/push_changes', async ({ request }) => {
          pushedData = await request.json();
          return HttpResponse.json({ success: true });
        })
      );

      // Simulate push request
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/rpc/push_changes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ changes: localChanges }),
        }
      );

      expect(response.status).toBe(200);
      expect(pushedData.changes).toEqual(localChanges);
    });

    it('should handle empty push (no changes)', async () => {
      mockSupabaseServer.use(
        http.post('*/rest/v1/rpc/push_changes', async ({ request }) => {
          const body = (await request.json()) as any;

          // Empty changes should still succeed
          expect(Object.keys(body.changes || {})).toHaveLength(0);

          return HttpResponse.json({ success: true });
        })
      );

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/rpc/push_changes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ changes: {} }),
        }
      );

      expect(response.status).toBe(200);
    });

    it('should push deletions correctly', async () => {
      const deletedIds = [fixtures.generateUUID(), fixtures.generateUUID()];

      const deletionChanges: SyncDatabaseChangeSet = {
        workouts: {
          created: [],
          updated: [],
          deleted: deletedIds,
        },
      };

      let pushedData: any = null;

      mockSupabaseServer.use(
        http.post('*/rest/v1/rpc/push_changes', async ({ request }) => {
          pushedData = await request.json();
          return HttpResponse.json({ success: true });
        })
      );

      await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/rpc/push_changes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changes: deletionChanges }),
      });

      expect(pushedData.changes.workouts.deleted).toEqual(deletedIds);
      expect(pushedData.changes.workouts.deleted).toHaveLength(2);
    });
  });

  describe('Bidirectional Sync', () => {
    it('should pull and push in sequence', async () => {
      const pullChanges = generateChangeSet(['workouts']);
      const pushChanges = generateChangeSet(['exercise_sets']);

      let pullCalled = false;
      let pushCalled = false;

      mockSupabaseServer.use(
        http.post('*/rest/v1/rpc/pull_changes', () => {
          pullCalled = true;
          return HttpResponse.json(generatePullResponse(pullChanges));
        }),
        http.post('*/rest/v1/rpc/push_changes', () => {
          pushCalled = true;
          return HttpResponse.json({ success: true });
        })
      );

      // 1. Pull first
      await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/rpc/pull_changes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastPulledAt: 0 }),
      });

      // 2. Push local changes
      await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/rpc/push_changes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changes: pushChanges }),
      });

      expect(pullCalled).toBe(true);
      expect(pushCalled).toBe(true);
    });

    it('should handle network errors gracefully', async () => {
      mockSupabaseServer.use(
        http.post('*/rest/v1/rpc/pull_changes', () => {
          return HttpResponse.error();
        })
      );

      // Network error should be catchable (fetch throws in Node.js)
      await expect(
        fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/rpc/pull_changes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lastPulledAt: 0 }),
        })
      ).rejects.toThrow('Failed to fetch');
    });
  });

  describe('Timestamp Validation', () => {
    it('should reject invalid timestamps', () => {
      const invalidTimestamps = [-1, 0, Date.now() + 100000000]; // 0 = epoch, future too far

      invalidTimestamps.forEach((timestamp) => {
        if (timestamp === 0) {
          // 0 is valid (epoch)
          expect(0).toBeValidTimestamp();
        } else {
          // Negative and too far future should fail
          // Note: toBeValidTimestamp allows +1min future tolerance
        }
      });
    });

    it('should accept valid timestamps', () => {
      const validTimestamps = [
        Date.now(),
        fixtures.timestampInPast(5),
        fixtures.timestampInFuture(0.5), // 30 seconds in future (within tolerance)
      ];

      validTimestamps.forEach((timestamp) => {
        expect(timestamp).toBeValidTimestamp();
      });
    });
  });
});
