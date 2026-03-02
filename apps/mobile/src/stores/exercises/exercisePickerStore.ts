/**
 * Exercise Picker Store
 *
 * Ephemeral Zustand store for passing selected exercises from the exercise picker
 * back to the calling screen (e.g., Edit Day) without URL params.
 *
 * Flow: Edit Day → exercise/picker (mode=pick) → store.setResult() → router.back()
 *       → Edit Day reads result on focus → store.clearResult()
 */

import { create } from 'zustand';

export interface PickedExercise {
  id: string;
  name: string;
  body_parts: string[];
  target_muscles: string[];
  equipments: string[];
  gif_url?: string;
}

interface ExercisePickerStore {
  result: PickedExercise[] | null;
  setResult: (exercises: PickedExercise[]) => void;
  clearResult: () => void;
}

export const useExercisePickerStore = create<ExercisePickerStore>()((set) => ({
  result: null,
  setResult: (exercises) => set({ result: exercises }),
  clearResult: () => set({ result: null }),
}));
