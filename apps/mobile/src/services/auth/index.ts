/**
 * Auth Service
 *
 * Centralizes all Supabase authentication operations.
 * Each function guards against supabase === null.
 *
 * Error mapping: Supabase errors → AuthError with user-friendly messages.
 */

import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { router } from 'expo-router';
import { supabase } from '@/services/supabase';
import { database, syncBeforeSignOut, resetSyncState } from '@/services/database';
import { mmkvStorage } from '@/services/storage';
import { useAuthStore, type User } from '@/stores/auth';
import { AuthError } from '@/utils/errors';
import { validateEmail, validatePassword } from '@/utils/validators';
import User_Model from '@/services/database/local/models/User';

// ============================================================================
// Error mapping
// ============================================================================

export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_TAKEN'
  | 'NETWORK_ERROR'
  | 'RATE_LIMIT'
  | 'AUTH_UNAVAILABLE'
  | 'AUTH_ERROR';

function mapSupabaseError(error: { message: string; status?: number }): AuthError {
  const msg = error.message.toLowerCase();

  if (msg.includes('invalid login credentials') || msg.includes('invalid_credentials')) {
    return new AuthError(
      'Incorrect email or password',
      error.message,
      'INVALID_CREDENTIALS' satisfies AuthErrorCode
    );
  }
  if (msg.includes('user already registered') || msg.includes('already been registered')) {
    return new AuthError(
      'An account with this email already exists',
      error.message,
      'EMAIL_TAKEN' satisfies AuthErrorCode
    );
  }
  if (error.status === 429 || msg.includes('rate limit') || msg.includes('too many')) {
    return new AuthError(
      'Too many attempts. Please wait.',
      error.message,
      'RATE_LIMIT' satisfies AuthErrorCode
    );
  }
  if (
    msg.includes('network') ||
    msg.includes('fetch') ||
    msg.includes('timeout') ||
    msg.includes('failed to fetch')
  ) {
    return new AuthError(
      'Unable to connect. Check your internet.',
      error.message,
      'NETWORK_ERROR' satisfies AuthErrorCode
    );
  }

  return new AuthError(
    'Something went wrong. Please try again.',
    error.message,
    'AUTH_ERROR' satisfies AuthErrorCode
  );
}

function requireSupabase() {
  if (!supabase) {
    throw new AuthError(
      'Authentication is not available',
      'Supabase client is null — missing env vars',
      'AUTH_UNAVAILABLE' satisfies AuthErrorCode
    );
  }
  return supabase;
}

// ============================================================================
// Local user record
// ============================================================================

/**
 * Ensure a WatermelonDB users record exists with id = auth.uid().
 * Critical for sync: the local record ID must match Supabase auth.uid()
 * so pull_changes/push_changes can find the right user.
 */
export async function ensureLocalUserRecord(userId: string, email: string): Promise<void> {
  const usersCollection = database.get<User_Model>('users');
  try {
    await usersCollection.find(userId);
    // Record already exists — nothing to do
  } catch {
    // Record doesn't exist — create with auth.uid() as ID
    await database.write(async () => {
      await usersCollection.create((user) => {
        user._raw.id = userId;
        user.email = email;
        user.preferredUnit = 'kg';
      });
    });
    if (__DEV__) console.warn('Created local user record for', userId);
  }
}

// ============================================================================
// Auth operations
// ============================================================================

export function mapUser(supabaseUser: {
  id: string;
  email?: string;
  email_confirmed_at?: string | null;
}): User {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? '',
    emailVerified: !!supabaseUser.email_confirmed_at,
  };
}

export async function signIn(email: string, password: string): Promise<User> {
  const sb = requireSupabase();
  validateEmail(email);
  validatePassword(password);

  const { data, error } = await sb.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) throw mapSupabaseError(error);

  const user = mapUser(data.user);
  useAuthStore.getState().setUser(user);
  // No ensureLocalUserRecord() here — sync pull brings the user record from Supabase.
  // Creating it locally before pull causes a diagnostic conflict on re-login.
  return user;
}

export async function signUp(email: string, password: string): Promise<User> {
  const sb = requireSupabase();
  validateEmail(email);
  validatePassword(password);

  const { data, error } = await sb.auth.signUp({
    email: email.trim(),
    password,
  });

  if (error) throw mapSupabaseError(error);
  if (!data.user) {
    throw new AuthError(
      'Unable to create account. Please try again.',
      'signUp returned null user',
      'AUTH_ERROR'
    );
  }

  const user = mapUser(data.user);
  useAuthStore.getState().setUser(user);
  await ensureLocalUserRecord(user.id, user.email);
  return user;
}

export async function signOut(): Promise<void> {
  // 0. Best-effort sync before wipe (Jefit-style: data should already be in cloud)
  const synced = await syncBeforeSignOut();
  if (!synced && __DEV__) {
    console.warn('signOut: pre-wipe sync failed — unsynced data may be lost');
  }

  // 1. Invalidate remote session
  try {
    await supabase?.auth.signOut();
  } catch (error) {
    if (__DEV__) console.warn('signOut: Supabase signOut failed', error);
  }

  // 2. Wipe local database + reset sync state (requires fresh initial sync on next sign-in)
  resetSyncState();
  try {
    await database.write(() => database.unsafeResetDatabase());
  } catch (error) {
    if (__DEV__) console.warn('signOut: DB reset failed', error);
  }

  // 3. Wipe MMKV storage
  try {
    mmkvStorage.clearAll();
  } catch (error) {
    if (__DEV__) console.warn('signOut: MMKV clearAll failed', error);
  }

  // 4. Clear in-memory state (always runs)
  useAuthStore.getState().setUser(null);
}

export async function resetPassword(email: string): Promise<void> {
  const sb = requireSupabase();
  validateEmail(email);

  const redirectTo = makeRedirectUri({ path: 'reset-password' });

  // Always resolves — no email enumeration
  await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo });
}

export async function updatePassword(newPassword: string): Promise<void> {
  const sb = requireSupabase();
  validatePassword(newPassword);

  const { error } = await sb.auth.updateUser({ password: newPassword });
  if (error) throw mapSupabaseError(error);
}

export async function createSessionFromUrl(url: string) {
  const sb = requireSupabase();
  const { params, errorCode } = QueryParams.getQueryParams(url);

  if (errorCode) {
    throw new AuthError(
      'Invalid reset link. Please request a new one.',
      `Deep link error: ${errorCode}`,
      'AUTH_ERROR'
    );
  }

  const { access_token, refresh_token } = params;
  if (!access_token) return null;

  const { data, error } = await sb.auth.setSession({
    access_token,
    refresh_token: refresh_token ?? '',
  });

  if (error) throw mapSupabaseError(error);
  return data.session;
}

export async function resendVerificationEmail(): Promise<void> {
  const sb = requireSupabase();
  const user = useAuthStore.getState().user;
  if (!user?.email) return;

  const { error } = await sb.auth.resend({
    type: 'signup',
    email: user.email,
  });

  if (error) throw mapSupabaseError(error);
}

/**
 * Subscribe to Supabase auth state changes.
 * Returns unsubscribe function for cleanup.
 */
export function setupAuthListener(): () => void {
  const sb = requireSupabase();

  const {
    data: { subscription },
  } = sb.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
      if (session?.user) {
        // Set immediately from cached session (fast, no loading flash)
        useAuthStore.getState().setUser(mapUser(session.user));
        // Refresh from server — email verification status may differ from cached JWT
        // (per Supabase docs: dispatch after callback via setTimeout)
        setTimeout(() => {
          sb.auth.getUser().then(({ data }) => {
            if (data.user) {
              useAuthStore.getState().setUser(mapUser(data.user));
            }
          });
        }, 0);
      } else if (event === 'INITIAL_SESSION') {
        // No session at startup → clear any stale persisted state
        useAuthStore.getState().setUser(null);
      }
    } else if (event === 'SIGNED_OUT') {
      useAuthStore.getState().setUser(null);
    } else if (event === 'PASSWORD_RECOVERY') {
      router.replace('/reset-password');
    }
  });

  return () => subscription.unsubscribe();
}
