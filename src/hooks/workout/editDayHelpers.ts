/**
 * Pure helper functions for the Edit Day hook.
 * Extracted for testability and readability.
 */

import type { DayExercise } from '@/components/workout/DayExerciseCard';
import type { PickedExercise } from '@/stores/exercises/exercisePickerStore';
import { DEFAULT_TARGET_SETS, DEFAULT_TARGET_REPS } from '@/constants';

/** Prefix for temporary exercise IDs (not yet persisted to DB) */
export const TEMP_EXERCISE_ID_PREFIX = 'temp_';

export function isTempExerciseId(id: string): boolean {
  return id.startsWith(TEMP_EXERCISE_ID_PREFIX);
}

export function generateTempExerciseId(index: number): string {
  return `${TEMP_EXERCISE_ID_PREFIX}${Date.now()}_${index}`;
}

/**
 * Convert a picked exercise from the picker into a DayExercise for the draft list.
 */
export function createDayExerciseFromPicked(
  picked: PickedExercise,
  dayId: string,
  orderIndex: number,
  tempId: string
): DayExercise {
  return {
    id: tempId,
    plan_day_id: dayId,
    exercise_id: picked.id,
    order_index: orderIndex,
    target_sets: DEFAULT_TARGET_SETS,
    target_reps: DEFAULT_TARGET_REPS,
    rest_timer_seconds: undefined,
    notes: undefined,
    created_at: Date.now(),
    updated_at: Date.now(),
    exercise: {
      id: picked.id,
      name: picked.name,
      body_parts: picked.body_parts,
      target_muscles: picked.target_muscles,
      equipments: picked.equipments,
      gif_url: picked.gif_url,
    },
  };
}

/** Input for buildSavePayload — matches the refs/state tracked by useEditDay */
interface SavePayloadInput {
  dayId: string;
  dayName: string;
  initialName: string;
  exercises: DayExercise[];
  pendingAdds: ReadonlyArray<{ tempId: string; exercise: PickedExercise }>;
  removedIds: ReadonlySet<string>;
}

/**
 * Build the save payload for savePlanDayEdits from the current draft state.
 * Pure function — no side effects, easily testable.
 */
export function buildSavePayload(input: SavePayloadInput) {
  const nameToSave = input.dayName.trim() || input.initialName;

  const addedExercises = input.pendingAdds
    .map((pending) => {
      const currentIndex = input.exercises.findIndex((e) => e.id === pending.tempId);
      if (currentIndex === -1) return null; // Was removed after adding
      return {
        exercise_id: pending.exercise.id,
        order_index: currentIndex,
      };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);

  const reorderedExercises = input.exercises
    .filter((e) => !isTempExerciseId(e.id))
    .map((e, _i, arr) => ({
      id: e.id,
      order_index: input.exercises.indexOf(e),
    }));

  return {
    dayId: input.dayId,
    name: nameToSave !== input.initialName ? nameToSave : undefined,
    removedExerciseIds: Array.from(input.removedIds),
    addedExercises,
    reorderedExercises,
  };
}
