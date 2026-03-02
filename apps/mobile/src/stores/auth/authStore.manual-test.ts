/**
 * Auth Store Persistence Validation
 *
 * Manual test to verify Zustand persist middleware works correctly.
 *
 * Test Steps:
 * 1. Run app in dev mode
 * 2. Open this file and execute test scenarios in console
 * 3. Verify user persists across app restarts
 *
 * Usage in app console:
 *   import { useAuthStore } from '@/stores/auth';
 *   const { setUser, user, isAuthenticated } = useAuthStore.getState();
 *
 * Test Scenario 1: Set user and verify persistence
 *   setUser({ id: 'test-123', email: 'test@example.com' });
 *   console.log('User set:', useAuthStore.getState().user);
 *   // Close app, reopen, check:
 *   console.log('User after restart:', useAuthStore.getState().user);
 *   // Expected: User persists ✅
 *
 * Test Scenario 2: Sign out and verify cleanup
 *   useAuthStore.getState().signOut();
 *   console.log('After signOut:', useAuthStore.getState());
 *   // Expected: user=null, isAuthenticated=false ✅
 *
 * Test Scenario 3: Verify isLoading NOT persisted
 *   // isLoading should always start as true on app launch
 *   // Then set to false after rehydration
 *   console.log('isLoading on startup:', useAuthStore.getState().isLoading);
 *   // Expected: false (after rehydration) ✅
 *
 * MMKV Storage Key: 'auth-storage'
 * To inspect MMKV directly:
 *   import { mmkvStorage } from '@/services/storage';
 *   console.log(mmkvStorage.get('auth-storage'));
 */

import { useAuthStore } from './authStore';

// Type-safe test helpers
export const authStoreTestHelpers = {
  /**
   * Simulate login
   */
  simulateLogin: () => {
    useAuthStore.getState().setUser({
      id: 'test-user-123',
      email: 'test@halterofit.com',
    });
    console.log('Simulated login:', useAuthStore.getState().user);
  },

  /**
   * Simulate logout
   */
  simulateLogout: async () => {
    await useAuthStore.getState().signOut();
    console.log('Simulated logout:', useAuthStore.getState());
  },

  /**
   * Check current auth state
   */
  checkState: () => {
    const state = useAuthStore.getState();
    console.log('Current auth state:', {
      user: state.user,
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
    });
    return state;
  },

  /**
   * Verify persistence (run after app restart)
   */
  verifyPersistence: () => {
    const state = useAuthStore.getState();
    const isPersisted = state.user !== null && state.isAuthenticated;
    console.log(isPersisted ? 'Persistence working!' : 'Persistence failed', state);
    return isPersisted;
  },
};

// Export for console usage
if (typeof window !== 'undefined') {
  // @ts-ignore - Dev tool
  window.authTest = authStoreTestHelpers;
  console.log('Auth test helpers available: window.authTest');
}
