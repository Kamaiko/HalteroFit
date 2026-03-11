/**
 * useWorkoutScreen - Compositor hook for WorkoutScreen
 *
 * Composes observable data subscriptions with extracted sub-hooks:
 * - Plan observation (existing observable)
 * - Plan days + exercise counts (new observables)
 * - Expanded day exercises observation (reactive - hybrid)
 * - Day menu actions (useDayMenu)
 * - Add day dialog (useAddDayDialog)
 * - Exercise delete/reorder (useExerciseActions)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  DEFAULT_FIRST_DAY_NAME,
  DEFAULT_FIRST_DAY_OF_WEEK,
  DEFAULT_PLAN_NAME,
  DURATION_FAST,
} from '@/constants';
import { useErrorHandler } from '@/hooks/ui/useErrorHandler';
import { useObservable } from '@/hooks/ui/useObservable';
import {
  createPlan,
  createPlanDay,
  getActivePlan,
  observeActivePlan,
  observeDominantMuscleByDays,
  observeExerciseCountsByDays,
  observeExercisesByDays,
  observePlanDays,
  reorderPlanDays,
  type DayExercise,
  type PlanDay,
  type WorkoutPlan,
} from '@/services/database/operations/plans';
import { waitForInitialSync } from '@/services/database';
import { useAuthStore } from '@/stores/auth/authStore';

import { useAddDayDialog } from './useAddDayDialog';
import { useDayMenu } from './useDayMenu';
import { useExerciseActions } from './useExerciseActions';

/** Inferred from the hook return — no manual maintenance needed. */
export type UseWorkoutScreenReturn = ReturnType<typeof useWorkoutScreen>;

export function useWorkoutScreen() {
  const user = useAuthStore((state) => state.user);
  const { handleError } = useErrorHandler();

  // ── Plan observation ────────────────────────────────────────────────
  const [activePlan, setActivePlan] = useState<WorkoutPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const creatingDefaultPlanRef = useRef(false);

  // Create default plan if none exists (waits for initial sync to avoid duplicates)
  const createDefaultPlanFn = useCallback(async () => {
    if (!user?.id || creatingDefaultPlanRef.current) return;

    creatingDefaultPlanRef.current = true;
    try {
      // Wait for initial sync to pull existing plans from server before creating a default.
      // Without this, sign-out → sign-in creates a duplicate plan (race condition).
      await waitForInitialSync();

      // Re-check: sync may have pulled an existing plan while we were waiting
      const existingPlan = await getActivePlan(user.id);
      if (existingPlan) {
        return; // Observable will pick up the pulled plan reactively
      }

      const newPlan = await createPlan({
        user_id: user.id,
        name: DEFAULT_PLAN_NAME,
        is_active: true,
      });

      await createPlanDay({
        plan_id: newPlan.id,
        name: DEFAULT_FIRST_DAY_NAME,
        day_of_week: DEFAULT_FIRST_DAY_OF_WEEK,
        order_index: 0,
      });
    } catch (error) {
      handleError(error, 'createDefaultPlan');
    } finally {
      creatingDefaultPlanRef.current = false;
      setLoading(false);
    }
  }, [user?.id, handleError]);

  // Subscribe to active plan
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const subscription = observeActivePlan(user.id).subscribe({
      next: (plan) => {
        setActivePlan(plan);
        if (!plan && !creatingDefaultPlanRef.current) {
          createDefaultPlanFn();
        } else {
          setLoading(false);
        }
      },
      error: (error) => {
        handleError(error, 'observeActivePlan');
        setLoading(false);
      },
    });

    return () => subscription.unsubscribe();
  }, [user?.id, handleError, createDefaultPlanFn]);

  // ── Plan days observation (reactive) ────────────────────────────────
  const planDaysObs = useMemo(
    () => (activePlan?.id ? observePlanDays(activePlan.id) : undefined),
    [activePlan?.id]
  );
  const planDays = useObservable(planDaysObs, [] as PlanDay[], (err) =>
    handleError(err, 'observePlanDays')
  );

  // Stable day IDs key — prevents cascading re-subscriptions when planDays
  // emits a new array reference but the actual IDs haven't changed
  const dayIdsKey = useMemo(() => planDays.map((d) => d.id).join(','), [planDays]);

  // ── Exercise counts observation (reactive) ──────────────────────────
  const countsObs = useMemo(() => {
    if (!dayIdsKey) return undefined;
    return observeExerciseCountsByDays(dayIdsKey.split(','));
  }, [dayIdsKey]);
  const exerciseCounts = useObservable(countsObs, {} as Record<string, number>, (err) =>
    handleError(err, 'observeExerciseCountsByDays')
  );

  // ── Dominant muscle groups observation (reactive) ──────────────────
  const musclesObs = useMemo(() => {
    if (!dayIdsKey) return undefined;
    return observeDominantMuscleByDays(dayIdsKey.split(','));
  }, [dayIdsKey]);
  const dominantMuscleGroups = useObservable(
    musclesObs,
    {} as Record<string, string | null>,
    (err) => handleError(err, 'observeDominantMuscleByDays')
  );

  // ── All exercises observation (preloaded for all days) ─────────────
  const exercisesObs = useMemo(() => {
    if (!dayIdsKey) return undefined;
    return observeExercisesByDays(dayIdsKey.split(','));
  }, [dayIdsKey]);
  const allExercises = useObservable(exercisesObs, {} as Record<string, DayExercise[]>, (err) =>
    handleError(err, 'observeExercisesByDays')
  );

  // ── Accordion state (replaces tab selection) ──────────────────────
  const [expandedDayId, setExpandedDayId] = useState<string | null>(null);
  const [collapsingDayId, setCollapsingDayId] = useState<string | null>(null);

  const handleDayPress = useCallback((day: PlanDay) => {
    setExpandedDayId((prev) => {
      if (prev && prev === day.id) {
        setCollapsingDayId(prev);
      }
      return prev === day.id ? null : day.id;
    });
  }, []);

  // Clear collapsingDayId after the reverse animation completes
  useEffect(() => {
    if (!collapsingDayId) return;
    const timer = setTimeout(() => setCollapsingDayId(null), DURATION_FAST * 3);
    return () => clearTimeout(timer);
  }, [collapsingDayId]);

  // ── Extracted sub-hooks ─────────────────────────────────────────────
  const handleDayDeleted = useCallback(
    (dayId: string) => {
      if (expandedDayId === dayId) {
        setExpandedDayId(null);
      }
    },
    [expandedDayId]
  );

  const handleDayAdded = useCallback((day: PlanDay) => {
    setExpandedDayId(day.id);
  }, []);

  const dayMenu = useDayMenu({
    onDayDeleted: handleDayDeleted,
  });

  const addDay = useAddDayDialog({
    activePlanId: activePlan?.id,
    planDaysCount: planDays.length,
    onDayAdded: handleDayAdded,
  });

  const exerciseActions = useExerciseActions({
    selectedDayId: expandedDayId ?? undefined,
  });

  // ── Day reorder (via menu buttons) ─────────────────────────────────
  const reorderDays = useCallback(
    async (reorderedDays: PlanDay[]) => {
      try {
        const updates = reorderedDays.map((day, index) => ({
          id: day.id,
          order_index: index,
        }));
        await reorderPlanDays(updates);
      } catch (error) {
        handleError(error, 'reorderDays');
      }
    },
    [handleError]
  );

  const handleMoveDay = useCallback(
    async (day: PlanDay, direction: 'up' | 'down') => {
      const index = planDays.findIndex((d) => d.id === day.id);
      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      if (index < 0 || swapIndex < 0 || swapIndex >= planDays.length) return;

      const reordered = [...planDays];
      const a = reordered[index];
      const b = reordered[swapIndex];
      if (!a || !b) return;
      reordered[index] = b;
      reordered[swapIndex] = a;
      await reorderDays(reordered);
    },
    [planDays, reorderDays]
  );

  const handleMoveDayUp = useCallback((day: PlanDay) => handleMoveDay(day, 'up'), [handleMoveDay]);

  const handleMoveDayDown = useCallback(
    (day: PlanDay) => handleMoveDay(day, 'down'),
    [handleMoveDay]
  );

  // ── Return composed state ───────────────────────────────────────────
  const { alert: addDayAlert, clearAlert: clearAddDayAlert, ...addDayRest } = addDay;

  return {
    user,
    activePlan,
    planDays,
    allExercises,
    loading,
    expandedDayId,
    collapsingDayId,
    exerciseCounts,
    dominantMuscleGroups,
    handleDayPress,
    handleMoveDayUp,
    handleMoveDayDown,

    // Sub-hook spreads
    ...dayMenu,
    ...addDayRest,
    addDayAlert,
    clearAddDayAlert,
    ...exerciseActions,
  };
}
