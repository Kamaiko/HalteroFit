/**
 * Supabase Client Configuration
 *
 * Initializes Supabase client with auth session persistence via MMKV.
 * Returns null when credentials are missing (preview builds, offline-only mode).
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { mmkvStorage } from '@/services/storage/mmkvStorage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          storage: {
            getItem: (key: string) => mmkvStorage.get(key) ?? null,
            setItem: (key: string, value: string) => mmkvStorage.set(key, value),
            removeItem: (key: string) => mmkvStorage.delete(key),
          },
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;

if (!supabase) {
  console.warn('Supabase not configured — auth/sync unavailable.');
}
