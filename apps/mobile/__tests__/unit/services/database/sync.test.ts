/**
 * Sync Service - Unit Tests
 *
 * Tests sync orchestration logic: guards, pre-sign-out sync, auto-sync teardown,
 * and ensureLocalUserRecord idempotency.
 *
 * Does NOT test WatermelonDB's synchronize() internals (requires real SQLite)
 * or MMKV read/write (framework glue).
 */

// ============================================================================
// Module mocks (hoisted by Jest before imports)
// ============================================================================

jest.mock('@/services/supabase', () => ({
  supabase: { rpc: jest.fn() },
}));

jest.mock('@/services/storage', () => ({
  mmkvStorage: {
    getNumber: jest.fn(),
    setNumber: jest.fn(),
    set: jest.fn(),
    get: jest.fn(),
    clearAll: jest.fn(),
    delete: jest.fn(),
  },
  zustandMMKVStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

jest.mock('@nozbe/watermelondb/sync', () => ({
  synchronize: jest.fn(() => Promise.resolve()),
  hasUnsyncedChanges: jest.fn(() => Promise.resolve(false)),
}));

jest.mock('@nozbe/watermelondb/sync/SyncLogger', () => {
  return jest.fn().mockImplementation(() => ({
    newLog: jest.fn(() => ({})),
    formattedLogs: [],
  }));
});

// @/services/database/local — used by sync.ts directly for setupAutoSync
jest.mock('@/services/database/local', () => ({
  database: {
    withChangesForTables: jest.fn(() => ({
      subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
    })),
  },
}));

// @/services/database — used by auth/index.ts (ensureLocalUserRecord) for write + get
jest.mock('@/services/database', () => ({
  database: {
    withChangesForTables: jest.fn(() => ({
      subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
    })),
    write: jest.fn((fn: () => Promise<void>) => fn()),
    get: jest.fn(() => ({
      find: jest.fn(() => Promise.resolve({})),
      create: jest.fn(() => Promise.resolve()),
    })),
  },
  syncBeforeSignOut: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('@/services/database/local/models/User', () => ({}));

// Auth service peer deps
jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'halterofit://reset-password'),
}));
jest.mock('expo-auth-session/build/QueryParams', () => ({
  getQueryParams: jest.fn(() => ({ params: {}, errorCode: null })),
}));
jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
}));

// ============================================================================
// Imports (AFTER mocks)
// ============================================================================

import {
  sync,
  syncBeforeSignOut,
  setupAutoSync,
  waitForInitialSync,
  resetSyncState,
} from '@/services/database/remote/sync';
import { ensureLocalUserRecord } from '@/services/auth';
import { database as authDatabase } from '@/services/database';
import { database as localDatabase } from '@/services/database/local';
import { useAuthStore } from '@/stores/auth/authStore';
import { useSyncStore } from '@/stores/sync/syncStore';
import { synchronize, hasUnsyncedChanges } from '@nozbe/watermelondb/sync';

// Stable references to mock functions (resolved after module eval, no TDZ issue)
const mockSynchronize = synchronize as jest.Mock;
const mockHasUnsyncedChanges = hasUnsyncedChanges as jest.Mock;
const mockAuthDbWrite = authDatabase.write as jest.Mock;
const mockAuthDbGet = authDatabase.get as jest.Mock;
const mockLocalDbWithChanges = localDatabase.withChangesForTables as jest.Mock;

// ============================================================================
// Helpers
// ============================================================================

function setAuthUser(id: string | null) {
  if (id) {
    useAuthStore.getState().setUser({ id, email: 'test@example.com', emailVerified: true });
  } else {
    useAuthStore.getState().setUser(null);
  }
}

function getSupabaseModule() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@/services/supabase') as { supabase: { rpc: jest.Mock } | null };
}

// ============================================================================
// Setup
// ============================================================================

beforeEach(() => {
  jest.clearAllMocks();

  // Restore implementations that clearAllMocks wipes
  mockSynchronize.mockResolvedValue(undefined);
  mockHasUnsyncedChanges.mockResolvedValue(false);
  mockAuthDbWrite.mockImplementation((fn: () => Promise<void>) => fn());

  // Restore the collection factory returned by get()
  const mockFind = jest.fn(() => Promise.resolve({}));
  const mockCreate = jest.fn(() => Promise.resolve());
  mockAuthDbGet.mockReturnValue({ find: mockFind, create: mockCreate });

  // Restore local database observable subscription chain
  const mockUnsubscribe = jest.fn();
  const mockSubscribe = jest.fn(() => ({ unsubscribe: mockUnsubscribe }));
  mockLocalDbWithChanges.mockReturnValue({ subscribe: mockSubscribe });

  // Reset auth + sync stores
  useAuthStore.getState().setUser(null);
  resetSyncState();

  // Ensure supabase is non-null (in case a previous test set it to null)
  const supabaseModule = getSupabaseModule();
  if (!supabaseModule.supabase) {
    supabaseModule.supabase = { rpc: jest.fn() };
  }
});

// ============================================================================
// sync() — guard tests
// ============================================================================

describe('sync()', () => {
  it('returns success:false when user is not authenticated', async () => {
    setAuthUser(null);

    const result = await sync();

    expect(result.success).toBe(false);
    expect(mockSynchronize).not.toHaveBeenCalled();
  });

  it('returns success:false when supabase is null', async () => {
    setAuthUser('user-1');
    const supabaseModule = getSupabaseModule();
    const original = supabaseModule.supabase;
    supabaseModule.supabase = null;

    try {
      const result = await sync();
      expect(result.success).toBe(false);
      expect(mockSynchronize).not.toHaveBeenCalled();
    } finally {
      supabaseModule.supabase = original;
    }
  });

  it('returns success:false for a concurrent call while sync is in-flight', async () => {
    setAuthUser('user-1');

    // First sync hangs until manually resolved
    let resolveSync!: () => void;
    mockSynchronize.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveSync = resolve;
      })
    );

    // Start first sync without awaiting
    const firstSync = sync();

    // Second call must hit the isSyncing guard before the first one finishes
    const secondResult = await sync();
    expect(secondResult.success).toBe(false);
    expect(mockSynchronize).toHaveBeenCalledTimes(1);

    // Clean up: resolve the hanging first sync
    resolveSync();
    await firstSync;
  });
});

// ============================================================================
// syncBeforeSignOut() — pre-sign-out safety
// ============================================================================

describe('syncBeforeSignOut()', () => {
  it('returns true immediately when there are no unsynced changes', async () => {
    mockHasUnsyncedChanges.mockResolvedValueOnce(false);

    const result = await syncBeforeSignOut();

    expect(result).toBe(true);
    // sync() should not have been triggered — nothing to push
    expect(mockSynchronize).not.toHaveBeenCalled();
  });

  it('returns false when sync throws, and does not propagate the error', async () => {
    setAuthUser('user-1');
    mockHasUnsyncedChanges.mockResolvedValueOnce(true);
    mockSynchronize.mockRejectedValueOnce(new Error('Network failure'));

    const result = await syncBeforeSignOut();

    expect(result).toBe(false);
  });

  it('returns false when sync exceeds the 10-second timeout', async () => {
    jest.useFakeTimers();
    setAuthUser('user-1');
    mockHasUnsyncedChanges.mockResolvedValueOnce(true);

    // Make sync() hang indefinitely
    mockSynchronize.mockReturnValueOnce(new Promise<void>(() => {}));

    const resultPromise = syncBeforeSignOut();

    // Advance past the 10-second guard and flush all pending async work
    await jest.runAllTimersAsync();

    const result = await resultPromise;
    expect(result).toBe(false);

    jest.useRealTimers();
  }, 15_000);
});

// ============================================================================
// setupAutoSync() — teardown / memory leak prevention
// ============================================================================

describe('setupAutoSync()', () => {
  it('returns a teardown function that unsubscribes from database changes', () => {
    const mockUnsubscribe = jest.fn();
    const mockSubscribe = jest.fn(() => ({ unsubscribe: mockUnsubscribe }));
    mockLocalDbWithChanges.mockReturnValueOnce({ subscribe: mockSubscribe });

    const teardown = setupAutoSync();

    expect(typeof teardown).toBe('function');

    teardown();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });
});

// ============================================================================
// ensureLocalUserRecord() — sync correctness + idempotency
// ============================================================================

describe('ensureLocalUserRecord()', () => {
  it('creates a local user record when none exists', async () => {
    // WatermelonDB throws when a record is not found by ID
    const mockFind = jest.fn().mockRejectedValueOnce(new Error('Record not found'));
    const mockCreate = jest.fn(() => Promise.resolve());
    mockAuthDbGet.mockReturnValueOnce({ find: mockFind, create: mockCreate });

    await ensureLocalUserRecord('new-user-id', 'new@example.com');

    expect(mockAuthDbWrite).toHaveBeenCalledTimes(1);
  });

  it('does not write to the database when the record already exists', async () => {
    // find() resolves — record is present
    const mockFind = jest.fn().mockResolvedValueOnce({ id: 'existing-user-id' });
    mockAuthDbGet.mockReturnValueOnce({ find: mockFind, create: jest.fn() });

    await ensureLocalUserRecord('existing-user-id', 'existing@example.com');

    expect(mockAuthDbWrite).not.toHaveBeenCalled();
  });
});

// ============================================================================
// waitForInitialSync() / resetSyncState() — sync gate mechanism
// ============================================================================

describe('waitForInitialSync()', () => {
  it('resolves after a successful sync()', async () => {
    setAuthUser('user-1');

    // Start waiting before sync runs
    const waitPromise = waitForInitialSync();

    // Run sync (mocked synchronize resolves immediately)
    await sync();

    // The wait should now resolve
    await expect(waitPromise).resolves.toBeUndefined();
    expect(useSyncStore.getState().initialSyncCompleted).toBe(true);
  });

  it('resolves immediately when initial sync already completed', async () => {
    setAuthUser('user-1');

    // Run sync first
    await sync();
    expect(useSyncStore.getState().initialSyncCompleted).toBe(true);

    // waitForInitialSync should resolve immediately (no pending promise)
    await expect(waitForInitialSync()).resolves.toBeUndefined();
  });
});

describe('resetSyncState()', () => {
  it('clears initialSyncCompleted so a new waitForInitialSync blocks again', async () => {
    jest.useFakeTimers();
    setAuthUser('user-1');

    // Complete initial sync
    await sync();
    expect(useSyncStore.getState().initialSyncCompleted).toBe(true);

    // Reset (simulates sign-out)
    resetSyncState();
    expect(useSyncStore.getState().initialSyncCompleted).toBe(false);

    // New waitForInitialSync should NOT resolve immediately — it should block
    // until sync runs or timeout fires
    let resolved = false;
    waitForInitialSync().then(() => {
      resolved = true;
    });

    // Tick past microtasks — if it resolved immediately, resolved would be true
    await Promise.resolve();
    expect(resolved).toBe(false);

    // Advance past the 10s timeout fallback to clean up
    await jest.runAllTimersAsync();
    expect(resolved).toBe(true);

    jest.useRealTimers();
  });
});
