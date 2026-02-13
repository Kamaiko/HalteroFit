/**
 * Workout Store
 *
 * Manages current workout session state with MMKV persistence.
 * Ensures workout progress survives app crashes and restarts.
 *
 * Persistence Strategy:
 * - Uses Zustand persist middleware with MMKV backend
 * - Persists: isWorkoutActive, workoutStartTime, currentWorkoutId
 * - Enables crash recovery (user can continue workout after app restart)
 * - Error handling via onRehydrateStorage hook
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandMMKVStorage } from '@/services/storage';

export interface WorkoutState {
  isWorkoutActive: boolean;
  workoutStartTime: Date | null;
  currentWorkoutId: string | null;

  // Actions
  startWorkout: (workoutId?: string) => void;
  endWorkout: () => void;
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set) => ({
      isWorkoutActive: false,
      workoutStartTime: null,
      currentWorkoutId: null,

      startWorkout: (workoutId?: string) =>
        set({
          isWorkoutActive: true,
          workoutStartTime: new Date(),
          currentWorkoutId: workoutId || null,
        }),

      endWorkout: () =>
        set({
          isWorkoutActive: false,
          workoutStartTime: null,
          currentWorkoutId: null,
        }),
    }),
    {
      name: 'workout-storage', // MMKV key
      storage: createJSONStorage(() => zustandMMKVStorage),
      // Persist all workout session state
      partialize: (state) => ({
        isWorkoutActive: state.isWorkoutActive,
        workoutStartTime: state.workoutStartTime,
        currentWorkoutId: state.currentWorkoutId,
      }),
      // Handle rehydration errors gracefully
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Workout rehydration failed:', error);
          // Reset to safe initial state on error
          return {
            isWorkoutActive: false,
            workoutStartTime: null,
            currentWorkoutId: null,
          };
        }
        // Successfully rehydrated
        if (state && state.isWorkoutActive) {
          console.log('Workout session restored:', {
            started: state.workoutStartTime,
            id: state.currentWorkoutId,
          });
        }
      },
    }
  )
);
