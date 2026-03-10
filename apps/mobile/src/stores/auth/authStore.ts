/**
 * Authentication Store
 *
 * Manages user authentication state with MMKV persistence.
 * Connected to Supabase auth.
 *
 * Persistence Strategy:
 * - Uses Zustand persist middleware with MMKV backend
 * - Persists: user, isAuthenticated (session state)
 * - Ephemeral: isLoading (always recalculate on rehydration)
 * - Error handling via onRehydrateStorage hook
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandMMKVStorage } from '@/services/storage';

export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => Promise<void>;
}

const DEV_MOCK_USER: User = {
  id: 'dev-user-123',
  email: 'dev@halterofit.local',
  emailVerified: true,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: user !== null,
          isLoading: false,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      signOut: async () => {
        // Lazy require to break circular dependency (authStore ↔ authService)
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { signOut } = require('@/services/auth') as typeof import('@/services/auth');
        await signOut();
      },
    }),
    {
      name: 'auth-storage', // MMKV key
      storage: createJSONStorage(() => zustandMMKVStorage),
      // Only persist session state, not loading state
      // Never persist mock user — prevents dev-user-123 leaking into preview/prod builds
      partialize: (state) => ({
        user: state.user?.id === DEV_MOCK_USER.id ? null : state.user,
        isAuthenticated: state.user?.id === DEV_MOCK_USER.id ? false : state.isAuthenticated,
      }),
      // Handle rehydration errors gracefully
      onRehydrateStorage: (state) => (_hydratedState, error) => {
        if (error) {
          if (__DEV__) console.error('Auth rehydration failed:', error);
          state.setUser(null);
          return;
        }
        state.setLoading(false);
      },
    }
  )
);

/**
 * Enable development mode with mock user
 * Call this once at app startup for UI testing without real auth
 */
export function enableDevMode(): void {
  useAuthStore.getState().setUser(DEV_MOCK_USER);
  if (__DEV__) {
    console.warn('Dev mode enabled - using mock user');
  }
}
