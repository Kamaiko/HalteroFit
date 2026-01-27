/**
 * useWorkoutScreen - Custom hook for WorkoutScreen logic
 *
 * Extracts all state management and business logic from the WorkoutScreen
 * component for better testability and separation of concerns.
 */

import { type RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutAnimation, Platform, UIManager } from 'react-native';

import { type BottomSheetRef } from '@/components/ui/bottom-sheet';
import { useErrorHandler } from '@/hooks/ui/useErrorHandler';
import {
  createPlan,
  createPlanDay,
  deletePlanDay,
  getExerciseCountsByDays,
  getPlanDayWithExercises,
  getPlanWithDays,
  observeActivePlan,
  removeExerciseFromPlanDay,
  reorderPlanDayExercises,
  type PlanDay,
  type PlanDayWithExercises,
  type WorkoutPlan,
} from '@/services/database/operations/plans';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { useAuthStore } from '@/stores/auth/authStore';

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
  refetchDays: () => void;
  deleteExerciseOptimistic: (exerciseId: string) => Promise<void>;
  reorderExercisesOptimistic: (
    reorderedExercises: PlanDayWithExercises['exercises']
  ) => Promise<void>;

  // Render helpers
  keyExtractor: (item: PlanDay) => string;
}

export function useWorkoutScreen(): UseWorkoutScreenReturn {
  const user = useAuthStore((state) => state.user);
  const { handleError } = useErrorHandler();

  // State
  const [activePlan, setActivePlan] = useState<WorkoutPlan | null>(null);
  const [planDays, setPlanDays] = useState<PlanDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<PlanDay | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingDefaultPlan, setCreatingDefaultPlan] = useState(false);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  // Menu state
  const [menuDay, setMenuDay] = useState<PlanDay | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuSheetRef = useRef<BottomSheetRef>(null);

  // Exercise counts per day (fetched from database)
  const [exerciseCounts, setExerciseCounts] = useState<Record<string, number>>({});

  // Selected day exercises
  const [selectedDayExercises, setSelectedDayExercises] = useState<PlanDayWithExercises | null>(
    null
  );
  const [loadingExercises, setLoadingExercises] = useState(false);

  // FIXME: refetchTrigger is a workaround because we don't use observables for days/counts.
  // Ideally, we'd use observePlanDays() + observeExerciseCounts() for automatic updates
  // when data changes from other screens. Current approach requires manual refetch.
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // Force refetch of plan days and exercise counts
  const refetchDays = useCallback(() => {
    setRefetchTrigger((prev) => prev + 1);
  }, []);

  // Create default "New Workout" plan
  const createDefaultPlanFn = useCallback(async () => {
    if (!user?.id || creatingDefaultPlan) return;

    setCreatingDefaultPlan(true);
    try {
      const newPlan = await createPlan({
        user_id: user.id,
        name: 'New Workout',
        is_active: true,
      });

      // Create default first day
      await createPlanDay({
        plan_id: newPlan.id,
        name: 'Workout Day #1',
        day_of_week: 'MON',
        order_index: 0,
      });

      // Plan will be picked up by the observer
    } catch (error) {
      handleError(error, 'createDefaultPlan');
    } finally {
      setCreatingDefaultPlan(false);
      setLoading(false);
    }
  }, [user?.id, creatingDefaultPlan, handleError]);

  // Subscribe to active plan changes
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const subscription = observeActivePlan(user.id).subscribe({
      next: (plan) => {
        setActivePlan(plan);
        if (!plan && !creatingDefaultPlan) {
          // No active plan, create default
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

  // Fetch plan days when active plan changes or refetch is triggered
  useEffect(() => {
    if (!activePlan?.id) {
      setPlanDays([]);
      setSelectedDay(null);
      return;
    }

    const fetchDays = async () => {
      try {
        const planWithDays = await getPlanWithDays(activePlan.id);
        setPlanDays(planWithDays.days);

        // Auto-select first day if none selected
        const firstDay = planWithDays.days[0];
        if (firstDay && !selectedDay) {
          setSelectedDay(firstDay);
        }

        // Fetch actual exercise counts
        const dayIds = planWithDays.days.map((d) => d.id);
        const counts = await getExerciseCountsByDays(dayIds);
        setExerciseCounts(counts);
      } catch (error) {
        handleError(error, 'fetchPlanDays');
      }
    };

    fetchDays();
  }, [activePlan?.id, refetchTrigger, handleError]);

  // Load exercises when selected day changes
  useEffect(() => {
    if (!selectedDay?.id) {
      setSelectedDayExercises(null);
      return;
    }

    const fetchExercises = async () => {
      setLoadingExercises(true);
      try {
        const dayWithExercises = await getPlanDayWithExercises(selectedDay.id);
        setSelectedDayExercises(dayWithExercises);
      } catch (error) {
        handleError(error, 'fetchDayExercises');
      } finally {
        setLoadingExercises(false);
      }
    };

    fetchExercises();
  }, [selectedDay?.id, refetchTrigger, handleError]);

  // Handle day selection
  const handleDayPress = useCallback((day: PlanDay) => {
    setSelectedDay(day);
    setActiveTabIndex(1); // Switch to Day Details tab
  }, []);

  // Handle day menu press
  const handleDayMenuPress = useCallback((day: PlanDay) => {
    setMenuDay(day);
    menuSheetRef.current?.open();
  }, []);

  // Menu actions
  const handleEditDay = useCallback(() => {
    menuSheetRef.current?.close();
    // TODO: Navigate to edit day screen (Task 2.1.4)
    console.log('Edit day:', menuDay?.id);
  }, [menuDay]);

  const handleDeleteDayPress = useCallback(() => {
    menuSheetRef.current?.close();
    setShowDeleteConfirm(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!menuDay) return;

    setIsDeleting(true);
    try {
      await deletePlanDay(menuDay.id);

      // FIXME: Manual state update after delete. If we used observables for planDays,
      // this would be automatic. Current approach risks state getting out of sync.
      setPlanDays((days) => days.filter((d) => d.id !== menuDay.id));

      // Clear selection if deleted day was selected
      if (selectedDay?.id === menuDay.id) {
        setSelectedDay(null);
        setActiveTabIndex(0); // Go back to Overview
      }

      setShowDeleteConfirm(false);
      setMenuDay(null);
    } catch (error) {
      handleError(error, 'deletePlanDay');
    } finally {
      setIsDeleting(false);
    }
  }, [menuDay, selectedDay, handleError]);

  // Handle Add Day press
  const handleAddDayPress = useCallback(() => {
    // TODO: Open Add Day dialog (Task 2.1.6)
    console.log('Add day pressed');
  }, []);

  // Delete exercise with optimistic update and animation
  const deleteExerciseOptimistic = useCallback(
    async (exerciseId: string) => {
      if (!selectedDayExercises) return;

      // Configure layout animation for smooth transition
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

      // Optimistic update: remove from local state immediately
      setSelectedDayExercises((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          exercises: prev.exercises.filter((e) => e.id !== exerciseId),
        };
      });

      // Update exercise count optimistically
      if (selectedDay) {
        setExerciseCounts((prev) => ({
          ...prev,
          [selectedDay.id]: Math.max(0, (prev[selectedDay.id] ?? 0) - 1),
        }));
      }

      // Delete from database in background
      try {
        await removeExerciseFromPlanDay(exerciseId);
      } catch (error) {
        // Revert on error by refetching
        handleError(error, 'deleteExercise');
        refetchDays();
      }
    },
    [selectedDayExercises, selectedDay, handleError, refetchDays]
  );

  // Reorder exercises with optimistic update
  const reorderExercisesOptimistic = useCallback(
    async (reorderedExercises: PlanDayWithExercises['exercises']) => {
      if (!selectedDayExercises) return;

      // Optimistic update: update local state immediately
      setSelectedDayExercises((prev) => {
        if (!prev) return prev;
        return { ...prev, exercises: reorderedExercises };
      });

      // Persist to database in background
      try {
        const updates = reorderedExercises.map((exercise, index) => ({
          id: exercise.id,
          order_index: index,
        }));
        await reorderPlanDayExercises(updates);
      } catch (error) {
        // Revert on error by refetching
        handleError(error, 'reorderExercises');
        refetchDays();
      }
    },
    [selectedDayExercises, handleError, refetchDays]
  );

  // Check if Start Workout should be visible
  const canStartWorkout = useMemo(() => {
    if (!selectedDay) return false;
    const count = exerciseCounts[selectedDay.id] ?? 0;
    return count > 0;
  }, [selectedDay, exerciseCounts]);

  const keyExtractor = useCallback((item: PlanDay) => item.id, []);

  return {
    // State
    user,
    activePlan,
    planDays,
    selectedDay,
    selectedDayExercises,
    loadingExercises,
    loading,
    activeTabIndex,
    exerciseCounts,
    canStartWorkout,

    // Menu state
    menuDay,
    showDeleteConfirm,
    isDeleting,
    menuSheetRef,

    // Handlers
    setActiveTabIndex,
    setShowDeleteConfirm,
    handleDayPress,
    handleDayMenuPress,
    handleEditDay,
    handleDeleteDayPress,
    handleConfirmDelete,
    handleAddDayPress,
    refetchDays,
    deleteExerciseOptimistic,
    reorderExercisesOptimistic,

    // Render helpers
    keyExtractor,
  };
}
