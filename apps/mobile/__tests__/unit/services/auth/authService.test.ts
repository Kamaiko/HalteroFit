/**
 * Auth Service - Unit Tests
 *
 * Tests auth orchestration: signIn, signOut, resetPassword, supabase null guard.
 * Validators are tested separately — service tests focus on Supabase integration
 * and the signOut wipe sequence.
 */

jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'halterofit://reset-password'),
}));
jest.mock('expo-auth-session/build/QueryParams', () => ({
  getQueryParams: jest.fn(() => ({ params: {}, errorCode: null })),
}));
jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
}));
jest.mock('@/services/supabase', () => ({
  supabase: jest.requireMock('@supabase/supabase-js').createClient(),
}));
jest.mock('@/services/database/local/models/User', () => ({}));
jest.mock('@/services/database', () => {
  const unsafeResetDatabase = jest.fn(() => Promise.resolve());
  return {
    database: {
      write: jest.fn((fn: () => Promise<void>) => fn()),
      unsafeResetDatabase,
      get: jest.fn(() => ({
        find: jest.fn(() => Promise.resolve({})),
        create: jest.fn(() => Promise.resolve()),
      })),
    },
    syncBeforeSignOut: jest.fn(() => Promise.resolve(true)),
    resetSyncState: jest.fn(),
  };
});

import { signIn, signUp, signOut, resetPassword, createSessionFromUrl } from '@/services/auth';
import { database } from '@/services/database';
import { useAuthStore } from '@/stores/auth/authStore';
import { AuthError } from '@/utils/errors';

const mockSupabase = jest.requireMock('@supabase/supabase-js').createClient();
const mockGetQueryParams = jest.requireMock('expo-auth-session/build/QueryParams')
  .getQueryParams as jest.Mock;
const mockWrite = database.write as jest.Mock;
const mockUnsafeResetDatabase = database.unsafeResetDatabase as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  // Restore implementations cleared by clearAllMocks
  mockWrite.mockImplementation((fn: () => Promise<void>) => fn());
  mockUnsafeResetDatabase.mockResolvedValue(undefined);
  mockSupabase.auth.signOut.mockResolvedValue({ error: null });
  useAuthStore.getState().setUser(null);
});

describe('signIn', () => {
  it('returns user and updates store on success', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: {
        user: { id: 'u1', email: 'a@b.com', email_confirmed_at: '2024-01-01' },
      },
      error: null,
    });

    const user = await signIn('a@b.com', 'password123');

    expect(user).toEqual({ id: 'u1', email: 'a@b.com', emailVerified: true });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('throws AuthError with INVALID_CREDENTIALS code on bad login', async () => {
    expect.assertions(3);
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Invalid login credentials', status: 400 },
    });

    try {
      await signIn('a@b.com', 'wrongpass1');
    } catch (err) {
      expect(err).toBeInstanceOf(AuthError);
      expect((err as AuthError).code).toBe('INVALID_CREDENTIALS');
      expect((err as AuthError).userMessage).toBe('Incorrect email or password');
    }
  });
});

describe('signUp', () => {
  it('creates user, updates store, and ensures local user record', async () => {
    mockSupabase.auth.signUp.mockResolvedValueOnce({
      data: {
        user: { id: 'new-user', email: 'new@test.com', email_confirmed_at: null },
      },
      error: null,
    });

    // ensureLocalUserRecord calls find (throws → not found) then create
    const mockCreate = jest.fn(() => Promise.resolve());
    const mockFind = jest.fn().mockRejectedValueOnce(new Error('Record not found'));
    (database.get as jest.Mock).mockReturnValueOnce({ find: mockFind, create: mockCreate });

    const user = await signUp('new@test.com', 'password123');

    expect(user).toEqual({ id: 'new-user', email: 'new@test.com', emailVerified: false });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user?.id).toBe('new-user');
    // ensureLocalUserRecord should have written to the database
    expect(mockWrite).toHaveBeenCalled();
  });
});

describe('error mapping (via signIn)', () => {
  it('maps "user already registered" to EMAIL_TAKEN', async () => {
    expect.assertions(3);
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'User already registered', status: 400 },
    });

    try {
      await signIn('a@b.com', 'password123');
    } catch (err) {
      expect(err).toBeInstanceOf(AuthError);
      expect((err as AuthError).code).toBe('EMAIL_TAKEN');
      expect((err as AuthError).userMessage).toBe('An account with this email already exists');
    }
  });

  it('maps status 429 to RATE_LIMIT', async () => {
    expect.assertions(3);
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Request limit exceeded', status: 429 },
    });

    try {
      await signIn('a@b.com', 'password123');
    } catch (err) {
      expect(err).toBeInstanceOf(AuthError);
      expect((err as AuthError).code).toBe('RATE_LIMIT');
      expect((err as AuthError).userMessage).toBe('Too many attempts. Please wait.');
    }
  });

  it('maps fetch failure to NETWORK_ERROR', async () => {
    expect.assertions(3);
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Failed to fetch', status: 0 },
    });

    try {
      await signIn('a@b.com', 'password123');
    } catch (err) {
      expect(err).toBeInstanceOf(AuthError);
      expect((err as AuthError).code).toBe('NETWORK_ERROR');
      expect((err as AuthError).userMessage).toBe('Unable to connect. Check your internet.');
    }
  });

  it('maps unknown errors to AUTH_ERROR fallback', async () => {
    expect.assertions(3);
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Something unexpected', status: 500 },
    });

    try {
      await signIn('a@b.com', 'password123');
    } catch (err) {
      expect(err).toBeInstanceOf(AuthError);
      expect((err as AuthError).code).toBe('AUTH_ERROR');
      expect((err as AuthError).userMessage).toBe('Something went wrong. Please try again.');
    }
  });
});

describe('signOut', () => {
  it('clears all 4 layers: Supabase, DB, MMKV, store', async () => {
    useAuthStore.getState().setUser({ id: 'u1', email: 'a@b.com', emailVerified: true });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    await signOut();

    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    expect(mockWrite).toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('continues even if DB reset fails', async () => {
    useAuthStore.getState().setUser({ id: 'u1', email: 'a@b.com', emailVerified: true });
    mockUnsafeResetDatabase.mockRejectedValueOnce(new Error('DB locked'));

    await signOut();

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('continues even if Supabase signOut fails', async () => {
    useAuthStore.getState().setUser({ id: 'u1', email: 'a@b.com', emailVerified: true });
    mockSupabase.auth.signOut.mockRejectedValueOnce(new Error('Network error'));

    await signOut();

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});

describe('supabase null guard', () => {
  it('throws AUTH_UNAVAILABLE when supabase is null', async () => {
    expect.assertions(2);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const supabaseModule = require('@/services/supabase') as { supabase: unknown };
    const originalSupabase = supabaseModule.supabase;
    supabaseModule.supabase = null;

    try {
      await signIn('a@b.com', 'password123');
    } catch (err) {
      expect(err).toBeInstanceOf(AuthError);
      expect((err as AuthError).code).toBe('AUTH_UNAVAILABLE');
    } finally {
      supabaseModule.supabase = originalSupabase;
    }
  });
});

describe('resetPassword', () => {
  it('always resolves (no email enumeration)', async () => {
    mockSupabase.auth.resetPasswordForEmail.mockResolvedValueOnce({
      data: {},
      error: null,
    });

    await expect(resetPassword('a@b.com')).resolves.toBeUndefined();
    expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('a@b.com', {
      redirectTo: 'halterofit://reset-password',
    });
  });
});

describe('createSessionFromUrl', () => {
  it('throws AUTH_ERROR when errorCode is present', async () => {
    expect.assertions(3);
    mockGetQueryParams.mockReturnValueOnce({ params: {}, errorCode: 'access_denied' });

    try {
      await createSessionFromUrl('halterofit://reset-password?error_code=access_denied');
    } catch (err) {
      expect(err).toBeInstanceOf(AuthError);
      expect((err as AuthError).code).toBe('AUTH_ERROR');
      expect((err as AuthError).userMessage).toBe('Invalid reset link. Please request a new one.');
    }
  });

  it('returns null when access_token is missing', async () => {
    mockGetQueryParams.mockReturnValueOnce({ params: {}, errorCode: null });

    const result = await createSessionFromUrl('halterofit://reset-password');

    expect(result).toBeNull();
    expect(mockSupabase.auth.setSession).not.toHaveBeenCalled();
  });
});
