/**
 * useExercisePicker - Business logic hook for ExercisePickerScreen
 *
 * Handles multi-select exercise picking with two modes:
 * - 'add': Saves exercises directly to DB (plan_day_exercises)
 * - 'pick': Returns exercises via Zustand store (for Edit Day draft state)
 *
 * Validates duplicates and MAX_EXERCISES_PER_DAY limits before committing.
 */

import { useCallback, useState } from 'react';
import { router } from 'expo-router';

import { useAlertState } from '@/hooks/ui/useAlertState';
import { useErrorHandler } from '@/hooks/ui/useErrorHandler';
import { useExerciseSearch } from '@/hooks/exercises/useExerciseSearch';
import type { Exercise } from '@/services/database/operations';
import {
  addExercisesToPlanDay,
  checkExerciseAdditions,
  getExerciseIdsAndCountByDay,
} from '@/services/database/operations/plans';
import {
  useExercisePickerStore,
  type PickedExercise,
} from '@/stores/exercises/exercisePickerStore';
import { isOperationalError } from '@/utils/errors';

// ============================================================================
// Types
// ============================================================================

export interface UseExercisePickerOptions {
  dayId?: string;
  mode?: 'add' | 'pick';
  existingExerciseIdsParam?: string;
}

/** Inferred from the hook return — no manual maintenance needed. */
export type UseExercisePickerReturn = ReturnType<typeof useExercisePicker>;

// ============================================================================
// Hook
// ============================================================================

export function useExercisePicker({
  dayId,
  mode = 'add',
  existingExerciseIdsParam,
}: UseExercisePickerOptions) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState(false);
  const { alert, setAlert, clearAlert } = useAlertState();
  const { handleError } = useErrorHandler();

  const { exercises, search, setSearch, loading, loadingMore, totalCount, loadMore } =
    useExerciseSearch();

  // ── Navigation ─────────────────────────────────────────────────────────

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleExerciseImagePress = useCallback((exercise: Exercise) => {
    router.push({ pathname: '/exercise/[id]', params: { id: exercise.id } });
  }, []);

  // ── Selection toggle ───────────────────────────────────────────────────

  const handleExercisePress = useCallback((exercise: Exercise) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(exercise.id)) {
        next.delete(exercise.id);
      } else {
        next.add(exercise.id);
      }
      return next;
    });
  }, []);

  // ── Add exercises (validation + persist) ───────────────────────────────

  const handleAddExercises = useCallback(async () => {
    const targetDayId = dayId;
    if (selectedIds.size === 0 || !targetDayId || isAdding) return;

    setIsAdding(true);
    try {
      // Resolve existing exercises (DB query for mode='add', route params for mode='pick')
      let existingExerciseIds: Set<string>;
      let currentCount: number;

      if (mode === 'pick') {
        const ids = existingExerciseIdsParam
          ? existingExerciseIdsParam.split(',').filter(Boolean)
          : [];
        existingExerciseIds = new Set(ids);
        currentCount = ids.length;
      } else {
        const result = await getExerciseIdsAndCountByDay(targetDayId);
        existingExerciseIds = new Set(result.exerciseIds);
        currentCount = result.count;
      }

      const selectedExerciseIds = Array.from(selectedIds);

      // Check duplicates and limit via centralized validator
      const additionError = checkExerciseAdditions({
        currentCount,
        existingExerciseIds,
        newExerciseIds: selectedExerciseIds,
      });

      if (additionError !== null) {
        if (additionError.type === 'duplicates') {
          setAlert({
            title: 'Already Added',
            description: `${additionError.duplicateIds.length} exercise${additionError.duplicateIds.length !== 1 ? 's' : ''} deselected.`,
          });
          setSelectedIds((prev) => {
            const next = new Set(prev);
            for (const id of additionError.duplicateIds) next.delete(id);
            return next;
          });
        } else {
          setAlert({ title: 'Limit Reached', description: additionError.message });
        }
        return;
      }

      // Execute action based on mode
      if (mode === 'pick') {
        const picked: PickedExercise[] = exercises
          .filter((e) => selectedIds.has(e.id))
          .map((e) => ({
            id: e.id,
            name: e.name,
            body_parts: e.body_parts,
            target_muscles: e.target_muscles,
            equipments: e.equipments,
            gif_url: e.gif_url,
          }));

        useExercisePickerStore.getState().setResult(picked);
        router.back();
        return;
      }

      // mode='add': save directly to DB
      await addExercisesToPlanDay(
        targetDayId,
        selectedExerciseIds.map((exerciseId, i) => ({
          exercise_id: exerciseId,
          order_index: currentCount + i,
        }))
      );

      router.back();
    } catch (error) {
      if (isOperationalError(error)) {
        setAlert({ title: 'Error', description: error.userMessage });
      } else {
        handleError(error, 'addExercises');
      }
    } finally {
      setIsAdding(false);
    }
  }, [
    selectedIds,
    dayId,
    isAdding,
    mode,
    exercises,
    existingExerciseIdsParam,
    setAlert,
    handleError,
  ]);

  // ── Derived state ──────────────────────────────────────────────────────

  const selectedCount = selectedIds.size;
  const hasSelection = selectedCount > 0;
  const isButtonDisabled = !hasSelection || isAdding;
  const buttonText = isAdding
    ? 'Adding...'
    : `Add ${selectedCount} exercise${selectedCount !== 1 ? 's' : ''}`;

  return {
    exercises,
    search,
    setSearch,
    loading,
    loadingMore,
    totalCount,
    loadMore,
    selectedIds,
    selectedCount,
    hasSelection,
    isAdding,
    isButtonDisabled,
    buttonText,
    alert,
    clearAlert,
    handleExercisePress,
    handleExerciseImagePress,
    handleBack,
    handleAddExercises,
  };
}
