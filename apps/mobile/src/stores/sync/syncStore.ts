/**
 * Sync State Store
 *
 * Observable sync state for UI binding (sync spinner, status display).
 * Replaces module-level variables in sync.ts for testability.
 *
 * Persistence: lastSyncedAt is persisted via MMKV (same key as before).
 * isSyncing and initialSyncCompleted are ephemeral (reset on app restart).
 */

import { create } from 'zustand';
import { mmkvStorage } from '@/services/storage';

const MMKV_LAST_SYNCED_KEY = 'sync:lastSyncedAt';

function readLastSyncedAt(): number | null {
  try {
    return mmkvStorage.getNumber(MMKV_LAST_SYNCED_KEY) ?? null;
  } catch {
    return null;
  }
}

export interface SyncState {
  isSyncing: boolean;
  initialSyncCompleted: boolean;
  lastSyncedAt: number | null;

  // Actions
  setIsSyncing: (value: boolean) => void;
  markInitialSyncCompleted: () => void;
  setLastSyncedAt: (timestamp: number) => void;
  reset: () => void;
}

export const useSyncStore = create<SyncState>()((set) => ({
  isSyncing: false,
  initialSyncCompleted: false,
  lastSyncedAt: readLastSyncedAt(),

  setIsSyncing: (isSyncing) => set({ isSyncing }),

  markInitialSyncCompleted: () => set({ initialSyncCompleted: true }),

  setLastSyncedAt: (timestamp) => {
    try {
      mmkvStorage.setNumber(MMKV_LAST_SYNCED_KEY, timestamp);
    } catch {
      if (__DEV__) console.warn('Failed to persist lastSyncedAt');
    }
    set({ lastSyncedAt: timestamp });
  },

  reset: () => {
    set({
      isSyncing: false,
      initialSyncCompleted: false,
    });
  },
}));
