/**
 * useExerciseActions - Exercise deletion animation and reorder logic
 *
 * Manages optimistic exercise deletion (two-phase: animate → remove)
 * and drag-to-reorder persistence.
 * Extracted from useWorkoutScreen for single-responsibility.
 */

import { useCallback, useState } from 'react';

import { useErrorHandler } from '@/hooks/ui/useErrorHandler';
import {
  removeExerciseFromPlanDay,
  reorderPlanDayExercises,
  type PlanDayWithExercises,
} from '@/services/database/operations/plans';

export interface UseExerciseActionsReturn {
  deletingExerciseId: string | null;
  deleteExerciseOptimistic: (exerciseId: string) => void;
  handleDeleteAnimationComplete: () => void;
  reorderExercisesOptimistic: (
    reorderedExercises: PlanDayWithExercises['exercises']
  ) => Promise<void>;
}

export function useExerciseActions(params: {
  selectedDayId: string | undefined;
}): UseExerciseActionsReturn {
  const { handleError } = useErrorHandler();
  const { selectedDayId } = params;

  const [deletingExerciseId, setDeletingExerciseId] = useState<string | null>(null);

  // Phase 1: Mark exercise as deleting (triggers slide + collapse animation ONLY)
  // DB mutation is deferred to Phase 2 so the card stays mounted during animation.
  const deleteExerciseOptimistic = useCallback(
    (exerciseId: string) => {
      if (deletingExerciseId) return;
      setDeletingExerciseId(exerciseId);
    },
    [deletingExerciseId]
  );

  // Phase 2: Animation finished — now perform the actual DB deletion.
  // The observable will auto-remove the exercise from the list (already invisible).
  const handleDeleteAnimationComplete = useCallback(async () => {
    const exerciseId = deletingExerciseId;
    setDeletingExerciseId(null);
    if (!exerciseId) return;

    try {
      await removeExerciseFromPlanDay(exerciseId);
    } catch (error) {
      handleError(error, 'deleteExercise');
      // On failure, the exercise reappears via observable (DB unchanged)
    }
  }, [deletingExerciseId, handleError]);

  // Reorder exercises with optimistic update
  const reorderExercisesOptimistic = useCallback(
    async (reorderedExercises: PlanDayWithExercises['exercises']) => {
      if (!selectedDayId) return;

      // Persist to database — observable will auto-sync the order
      try {
        const updates = reorderedExercises.map((exercise, index) => ({
          id: exercise.id,
          order_index: index,
        }));
        await reorderPlanDayExercises(updates);
      } catch (error) {
        handleError(error, 'reorderExercises');
      }
    },
    [selectedDayId, handleError]
  );

  return {
    deletingExerciseId,
    deleteExerciseOptimistic,
    handleDeleteAnimationComplete,
    reorderExercisesOptimistic,
  };
}
