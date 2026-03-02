/**
 * Zustand MMKV Storage Adapter
 *
 * Adapts MMKV storage to work with Zustand's persist middleware.
 * Provides StateStorage interface required by Zustand.
 *
 * Usage:
 *   import { persist, createJSONStorage } from 'zustand/middleware';
 *   import { zustandMMKVStorage } from '@/services/storage';
 *
 *   const useStore = create(
 *     persist(
 *       (set) => ({ ... }),
 *       {
 *         name: 'my-store',
 *         storage: createJSONStorage(() => zustandMMKVStorage),
 *       }
 *     )
 *   );
 *
 * Benefits vs AsyncStorage:
 * - 10-30x faster (synchronous operations)
 * - Native encryption
 * - Better performance for store persistence
 */

import { StateStorage } from 'zustand/middleware';
import { mmkvStorage } from './mmkvStorage';

/**
 * Zustand StateStorage adapter for MMKV
 *
 * Implements the StateStorage interface expected by Zustand's persist middleware:
 * - getItem(name: string): string | null | Promise<string | null>
 * - setItem(name: string, value: string): void | Promise<void>
 * - removeItem(name: string): void | Promise<void>
 */
export const zustandMMKVStorage: StateStorage = {
  /**
   * Get item from storage
   * Zustand expects string | null | Promise<string | null>
   */
  getItem: (name: string): string | null => {
    const value = mmkvStorage.get(name);
    return value ?? null;
  },

  /**
   * Set item in storage
   * Zustand passes serialized JSON string
   */
  setItem: (name: string, value: string): void => {
    mmkvStorage.set(name, value);
  },

  /**
   * Remove item from storage
   */
  removeItem: (name: string): void => {
    mmkvStorage.delete(name);
  },
};
