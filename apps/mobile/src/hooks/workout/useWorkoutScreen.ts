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

import { DEFAULT_FIRST_DAY_NAME, DEFAULT_FIRST_DAY_OF_WEEK, DEFAULT_PLAN_NAME } from '@/constants';
import { useErrorHandler } from '@/hooks/ui/useErrorHandler';
import { useObservable } from '@/hooks/ui/useObservable';
import {
  createPlan,
  createPlanDay,
  getActivePlan,
  observeActivePlan,
  observeDominantMuscleByDays,
  observeExerciseCountsByDays,
  observePlanDayWithExercises,
  observePlanDays,
  reorderPlanDays,
  type PlanDay,
  type PlanDayWithExercises,
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

  // ── Accordion state (replaces tab selection) ──────────────────────
  const [expandedDayId, setExpandedDayId] = useState<string | null>(null);

  const handleDayPress = useCallback((day: PlanDay) => {
    // Clear stale exercises immediately when switching to a different day
    // (prevents 1-frame flash of old exercises on the new card)
    setExpandedDayId((prev) => {
      if (prev !== null && prev !== day.id) {
        setSelectedDayExercises(null);
        setLoadingExercises(true);
      }
      return prev === day.id ? null : day.id;
    });
  }, []);

  // ── Expanded day exercises observation (reactive - hybrid) ──────────
  const [selectedDayExercises, setSelectedDayExercises] = useState<PlanDayWithExercises | null>(
    null
  );
  const [loadingExercises, setLoadingExercises] = useState(false);

  useEffect(() => {
    if (!expandedDayId) {
      setSelectedDayExercises(null);
      return;
    }

    let isFirstEmission = true;
    setLoadingExercises(true);

    const subscription = observePlanDayWithExercises(expandedDayId).subscribe({
      next: (dayWithExercises) => {
        setSelectedDayExercises(dayWithExercises);
        if (isFirstEmission) {
          setLoadingExercises(false);
          isFirstEmission = false;
        }
      },
      error: (error) => {
        handleError(error, 'observePlanDayWithExercises');
        setLoadingExercises(false);
      },
    });

    return () => subscription.unsubscribe();
  }, [expandedDayId, handleError]);

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

  const handleMoveDayUp = useCallback(
    async (day: PlanDay) => {
      const index = planDays.findIndex((d) => d.id === day.id);
      if (index <= 0) return;
      const reordered = [...planDays];
      const prev = reordered[index - 1];
      const curr = reordered[index];
      if (!prev || !curr) return;
      reordered[index - 1] = curr;
      reordered[index] = prev;
      await reorderDays(reordered);
    },
    [planDays, reorderDays]
  );

  const handleMoveDayDown = useCallback(
    async (day: PlanDay) => {
      const index = planDays.findIndex((d) => d.id === day.id);
      if (index < 0 || index >= planDays.length - 1) return;
      const reordered = [...planDays];
      const curr = reordered[index];
      const next = reordered[index + 1];
      if (!curr || !next) return;
      reordered[index] = next;
      reordered[index + 1] = curr;
      await reorderDays(reordered);
    },
    [planDays, reorderDays]
  );

  // ── Return composed state ───────────────────────────────────────────
  const { alert: addDayAlert, clearAlert: clearAddDayAlert, ...addDayRest } = addDay;

  return {
    user,
    activePlan,
    planDays,
    selectedDayExercises,
    loadingExercises,
    loading,
    expandedDayId,
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
