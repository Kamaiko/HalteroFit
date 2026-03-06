/**
 * Supabase Client Configuration
 *
 * Initializes Supabase client with auth session persistence via MMKV.
 */

import { createClient } from '@supabase/supabase-js';
import { mmkvStorage } from '@/services/storage/mmkvStorage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase credentials — auth/sync features unavailable.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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
});
