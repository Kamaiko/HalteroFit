/**
 * useWorkoutScreen - Compositor hook for WorkoutScreen
 *
 * Composes observable data subscriptions with extracted sub-hooks:
 * - Plan observation (existing observable)
 * - Plan days + exercise counts (new observables)
 * - Selected day exercises (new observable - hybrid)
 * - Day menu actions (useDayMenu)
 * - Add day dialog (useAddDayDialog)
 * - Exercise delete/reorder (useExerciseActions)
 */

import { type RefObject, useCallback, useEffect, useMemo, useState } from 'react';

import { type BottomSheetRef } from '@/components/ui/bottom-sheet';
import { DEFAULT_FIRST_DAY_NAME, DEFAULT_FIRST_DAY_OF_WEEK, DEFAULT_PLAN_NAME } from '@/constants';
import { useErrorHandler } from '@/hooks/ui/useErrorHandler';
import {
  createPlan,
  createPlanDay,
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
import { useAuthStore } from '@/stores/auth/authStore';

import { useAddDayDialog } from './useAddDayDialog';
import { useDayMenu } from './useDayMenu';
import { useExerciseActions } from './useExerciseActions';

export interface UseWorkoutScreenReturn {
  // State
  user: { id: string; email: string } | null;
  activePlan: WorkoutPlan | null;
  planDays: PlanDay[];
  selectedDay: PlanDay | null;
  selectedDayExercises: PlanDayWithExercises | null;
  loadingExercises: boolean;
  loading: boolean;
  activeTabIndex: number;
  exerciseCounts: Record<string, number>;
  dominantMuscleGroups: Record<string, string | null>;
  canStartWorkout: boolean;

  // Menu state
  menuDay: PlanDay | null;
  showDeleteConfirm: boolean;
  isDeleting: boolean;
  menuSheetRef: RefObject<BottomSheetRef | null>;

  // Handlers
  setActiveTabIndex: (index: number) => void;
  setShowDeleteConfirm: (show: boolean) => void;
  handleDayPress: (day: PlanDay) => void;
  handleDayMenuPress: (day: PlanDay) => void;
  handleEditDay: () => void;
  handleDeleteDayPress: () => void;
  handleConfirmDelete: () => Promise<void>;
  handleAddDayPress: () => void;
  showAddDayDialog: boolean;
  addDayName: string;
  setAddDayName: (name: string) => void;
  isAddingDay: boolean;
  handleConfirmAddDay: () => Promise<void>;
  handleCancelAddDay: () => void;
  addDayAlert: { title: string; description?: string } | null;
  clearAddDayAlert: () => void;
  deletingExerciseId: string | null;
  deleteExerciseOptimistic: (exerciseId: string) => void;
  handleDeleteAnimationComplete: () => void;
  reorderExercisesOptimistic: (
    reorderedExercises: PlanDayWithExercises['exercises']
  ) => Promise<void>;
  reorderDaysOptimistic: (reorderedDays: PlanDay[]) => Promise<void>;

  // Render helpers
  keyExtractor: (item: PlanDay) => string;
}

export function useWorkoutScreen(): UseWorkoutScreenReturn {
  const user = useAuthStore((state) => state.user);
  const { handleError } = useErrorHandler();

  // ── Plan observation ────────────────────────────────────────────────
  const [activePlan, setActivePlan] = useState<WorkoutPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingDefaultPlan, setCreatingDefaultPlan] = useState(false);

  // Create default plan if none exists
  const createDefaultPlanFn = useCallback(async () => {
    if (!user?.id || creatingDefaultPlan) return;

    setCreatingDefaultPlan(true);
    try {
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
      setCreatingDefaultPlan(false);
      setLoading(false);
    }
  }, [user?.id, creatingDefaultPlan, handleError]);

  // Subscribe to active plan
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const subscription = observeActivePlan(user.id).subscribe({
      next: (plan) => {
        setActivePlan(plan);
        if (!plan && !creatingDefaultPlan) {
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
  }, [user?.id, creatingDefaultPlan, handleError, createDefaultPlanFn]);

  // ── Plan days observation (reactive) ────────────────────────────────
  const [planDays, setPlanDays] = useState<PlanDay[]>([]);

  useEffect(() => {
    if (!activePlan?.id) {
      setPlanDays([]);
      return;
    }

    const subscription = observePlanDays(activePlan.id).subscribe({
      next: (days) => {
        setPlanDays(days);
      },
      error: (error) => {
        handleError(error, 'observePlanDays');
      },
    });

    return () => subscription.unsubscribe();
  }, [activePlan?.id, handleError]);

  // ── Exercise counts observation (reactive) ──────────────────────────
  const [exerciseCounts, setExerciseCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const dayIds = planDays.map((d) => d.id);
    if (dayIds.length === 0) {
      setExerciseCounts({});
      return;
    }

    const subscription = observeExerciseCountsByDays(dayIds).subscribe({
      next: (counts) => {
        setExerciseCounts(counts);
      },
      error: (error) => {
        handleError(error, 'observeExerciseCountsByDays');
      },
    });

    return () => subscription.unsubscribe();
  }, [planDays, handleError]);

  // ── Dominant muscle groups observation (reactive) ──────────────────
  const [dominantMuscleGroups, setDominantMuscleGroups] = useState<Record<string, string | null>>(
    {}
  );

  useEffect(() => {
    const dayIds = planDays.map((d) => d.id);
    if (dayIds.length === 0) {
      setDominantMuscleGroups({});
      return;
    }

    const subscription = observeDominantMuscleByDays(dayIds).subscribe({
      next: (groups) => {
        setDominantMuscleGroups(groups);
      },
      error: (error) => {
        handleError(error, 'observeDominantMuscleByDays');
      },
    });

    return () => subscription.unsubscribe();
  }, [planDays, handleError]);

  // ── Day selection ───────────────────────────────────────────────────
  const [selectedDay, setSelectedDay] = useState<PlanDay | null>(null);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  // Auto-select first day when planDays load (if nothing selected)
  useEffect(() => {
    if (planDays.length > 0 && !selectedDay) {
      setSelectedDay(planDays[0] ?? null);
    }
  }, [planDays, selectedDay]);

  const handleDayPress = useCallback((day: PlanDay) => {
    setSelectedDay(day);
    setActiveTabIndex(1);
  }, []);

  // ── Selected day exercises observation (reactive - hybrid) ──────────
  const [selectedDayExercises, setSelectedDayExercises] = useState<PlanDayWithExercises | null>(
    null
  );
  const [loadingExercises, setLoadingExercises] = useState(false);

  useEffect(() => {
    if (!selectedDay?.id) {
      setSelectedDayExercises(null);
      return;
    }

    let isFirstEmission = true;
    setLoadingExercises(true);

    const subscription = observePlanDayWithExercises(selectedDay.id).subscribe({
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
  }, [selectedDay?.id, handleError]);

  // ── Extracted sub-hooks ─────────────────────────────────────────────
  const handleDayDeleted = useCallback(
    (dayId: string) => {
      if (selectedDay?.id === dayId) {
        setSelectedDay(null);
        setActiveTabIndex(0);
      }
    },
    [selectedDay?.id]
  );

  const handleDayAdded = useCallback((day: PlanDay) => {
    setSelectedDay(day);
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
    selectedDayId: selectedDay?.id,
  });

  // ── Day reorder ────────────────────────────────────────────────────
  const reorderDaysOptimistic = useCallback(
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

  // ── Derived state ───────────────────────────────────────────────────
  const canStartWorkout = useMemo(() => {
    if (!selectedDay) return false;
    const count = exerciseCounts[selectedDay.id] ?? 0;
    return count > 0;
  }, [selectedDay, exerciseCounts]);

  const keyExtractor = useCallback((item: PlanDay) => item.id, []);

  // ── Return composed state ───────────────────────────────────────────
  return {
    user,
    activePlan,
    planDays,
    selectedDay,
    selectedDayExercises,
    loadingExercises,
    loading,
    activeTabIndex,
    exerciseCounts,
    dominantMuscleGroups,
    canStartWorkout,

    // Day menu
    ...dayMenu,

    // Tab control
    setActiveTabIndex,

    // Day selection
    handleDayPress,

    // Add day dialog
    ...addDay,
    addDayAlert: addDay.alert,
    clearAddDayAlert: addDay.clearAlert,

    // Exercise actions
    ...exerciseActions,

    // Day reorder
    reorderDaysOptimistic,

    // Render helpers
    keyExtractor,
  };
}
