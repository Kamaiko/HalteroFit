/**
 * Workout Store Persistence Validation
 *
 * Manual test to verify Zustand persist middleware works correctly.
 *
 * Test Steps:
 * 1. Run app in dev mode
 * 2. Open this file and execute test scenarios in console
 * 3. Verify workout session persists across app restarts/crashes
 *
 * Usage in app console:
 *   import { useWorkoutStore } from '@/stores/workout';
 *   const { startWorkout, endWorkout } = useWorkoutStore.getState();
 *
 * Test Scenario 1: Start workout and verify persistence
 *   startWorkout('workout-123');
 *   console.log('Workout started:', useWorkoutStore.getState());
 *   // Kill app, reopen, check:
 *   console.log('After restart:', useWorkoutStore.getState());
 *   // Expected: isWorkoutActive=true, workout persists ✅
 *
 * Test Scenario 2: End workout and verify cleanup
 *   useWorkoutStore.getState().endWorkout();
 *   console.log('After endWorkout:', useWorkoutStore.getState());
 *   // Expected: isWorkoutActive=false, all state cleared ✅
 *
 * Test Scenario 3: Crash recovery simulation
 *   startWorkout('crash-test-456');
 *   // Force close app (swipe away)
 *   // Reopen app
 *   console.log('Crash recovery:', useWorkoutStore.getState());
 *   // Expected: Workout session restored with message ✅
 *
 * MMKV Storage Key: 'workout-storage'
 * To inspect MMKV directly:
 *   import { mmkvStorage } from '@/services/storage';
 *   console.log(mmkvStorage.get('workout-storage'));
 */

import { useWorkoutStore } from './workoutStore';

// Type-safe test helpers
export const workoutStoreTestHelpers = {
  /**
   * Simulate starting workout
   */
  simulateStart: (workoutId?: string) => {
    useWorkoutStore.getState().startWorkout(workoutId || 'test-workout-123');
    console.log('Simulated workout start:', useWorkoutStore.getState());
  },

  /**
   * Simulate ending workout
   */
  simulateEnd: () => {
    useWorkoutStore.getState().endWorkout();
    console.log('Simulated workout end:', useWorkoutStore.getState());
  },

  /**
   * Check current workout state
   */
  checkState: () => {
    const state = useWorkoutStore.getState();
    console.log('Current workout state:', {
      isWorkoutActive: state.isWorkoutActive,
      workoutStartTime: state.workoutStartTime,
      currentWorkoutId: state.currentWorkoutId,
      duration:
        state.workoutStartTime &&
        Math.floor((Date.now() - new Date(state.workoutStartTime).getTime()) / 1000) + 's',
    });
    return state;
  },

  /**
   * Verify persistence (run after app restart)
   */
  verifyPersistence: () => {
    const state = useWorkoutStore.getState();
    const isPersisted = state.isWorkoutActive && state.currentWorkoutId !== null;
    console.log(isPersisted ? 'Persistence working!' : 'Persistence failed', state);
    return isPersisted;
  },

  /**
   * Verify crash recovery
   */
  verifyCrashRecovery: () => {
    const state = useWorkoutStore.getState();
    if (state.isWorkoutActive && state.workoutStartTime) {
      const elapsed = Math.floor(
        (Date.now() - new Date(state.workoutStartTime).getTime()) / 1000 / 60
      );
      console.log(`Crash recovery successful! Workout restored (${elapsed} min elapsed)`);
      return true;
    }
    console.log('No workout to recover');
    return false;
  },
};

// Export for console usage
if (typeof window !== 'undefined') {
  // @ts-ignore - Dev tool
  window.workoutTest = workoutStoreTestHelpers;
  console.log('Workout test helpers available: window.workoutTest');
}
