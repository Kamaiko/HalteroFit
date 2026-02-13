/**
 * Storage Service
 *
 * Unified storage abstraction using MMKV (upgraded from AsyncStorage).
 * Provides async interface for backward compatibility while using
 * synchronous MMKV operations under the hood.
 *
 * Benefits over AsyncStorage:
 * - 10-30x faster (synchronous operations)
 * - Native encryption
 * - Better reliability
 *
 * Usage:
 *   import { storage } from '@/services/storage/storage';
 *
 *   await storage.set('user', JSON.stringify(userData));
 *   const user = await storage.get('user');
 *
 * Migration note:
 * - Existing AsyncStorage data will NOT be migrated
 * - Acceptable for MVP (minimal production data)
 */

import { mmkvStorage } from './mmkvStorage';

export const storage = {
  /**
   * Set a value in storage
   * Async wrapper around synchronous MMKV operation
   */
  async set(key: string, value: string): Promise<void> {
    try {
      mmkvStorage.set(key, value);
    } catch (error) {
      console.error(`Storage.set error for key "${key}":`, error);
      throw error;
    }
  },

  /**
   * Get a value from storage
   * Async wrapper around synchronous MMKV operation
   */
  async get(key: string): Promise<string | null> {
    try {
      const value = mmkvStorage.get(key);
      return value ?? null;
    } catch (error) {
      console.error(`Storage.get error for key "${key}":`, error);
      return null;
    }
  },

  /**
   * Delete a value from storage
   * Async wrapper around synchronous MMKV operation
   */
  async delete(key: string): Promise<void> {
    try {
      mmkvStorage.delete(key);
    } catch (error) {
      console.error(`Storage.delete error for key "${key}":`, error);
      throw error;
    }
  },

  /**
   * Clear all storage
   * Use with caution - deletes everything
   */
  async clear(): Promise<void> {
    try {
      mmkvStorage.clearAll();
    } catch (error) {
      console.error('Storage.clear error:', error);
      throw error;
    }
  },

  /**
   * Get all keys
   */
  async getAllKeys(): Promise<string[]> {
    try {
      return mmkvStorage.getAllKeys();
    } catch (error) {
      console.error('Storage.getAllKeys error:', error);
      return [];
    }
  },
};

/**
 * Helper functions for JSON storage
 */
export const storageHelpers = {
  /**
   * Set a JSON object in storage
   */
  async setJSON<T>(key: string, value: T): Promise<void> {
    await storage.set(key, JSON.stringify(value));
  },

  /**
   * Get a JSON object from storage
   */
  async getJSON<T>(key: string): Promise<T | null> {
    const value = await storage.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  },
};
