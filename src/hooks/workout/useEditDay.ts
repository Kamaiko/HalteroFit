/**
 * useEditDay - Hook for Edit Day screen state and logic
 *
 * Manages a local draft of the day's exercises. All mutations happen in memory
 * and are only persisted to WatermelonDB when the user taps "Save".
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { router } from 'expo-router';
import type { DayExercise } from '@/components/workout/DayExerciseCard';
import type { PickedExercise } from '@/stores/exercises/exercisePickerStore';
import { useExercisePickerStore } from '@/stores/exercises/exercisePickerStore';
import {
  DEFAULT_TARGET_SETS,
  DEFAULT_TARGET_REPS,
  MAX_EXERCISES_PER_DAY,
  MAX_DAY_NAME_LENGTH,
} from '@/constants';
import { useAlertState, type AlertState } from '@/hooks/ui/useAlertState';
import { ValidationError } from '@/utils/errors';

/** Prefix for temporary exercise IDs (not yet persisted to DB) */
const TEMP_EXERCISE_ID_PREFIX = 'temp_';

import {
  getPlanDayWithExercises,
  savePlanDayEdits,
  deletePlanDay,
} from '@/services/database/operations/plans';

// Newly added exercises that don't have a DB record yet
interface PendingExercise {
  tempId: string;
  exercise: PickedExercise;
}

export interface UseEditDayReturn {
  // State
  dayName: string;
  exercises: DayExercise[];
  loading: boolean;
  isDirty: boolean;
  isSaving: boolean;

  // Day name
  setDayName: (name: string) => void;

  // Exercise operations (local only)
  removeExercise: (exerciseId: string) => void;
  reorderExercises: (reordered: DayExercise[]) => void;

  // Persistence
  handleSave: () => Promise<void>;

  // Delete day
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (show: boolean) => void;
  handleDeleteDay: () => Promise<void>;
  isDeleting: boolean;

  // Discard / navigation guard
  showDiscardConfirm: boolean;
  setShowDiscardConfirm: (show: boolean) => void;
  handleConfirmDiscard: () => void;

  // Navigation
  handleBack: () => void;

  // Add exercises
  navigateToExercisePicker: () => void;
  consumePickerResult: () => void;

  // Navigate to exercise detail
  navigateToExerciseDetail: (exercise: DayExercise) => void;

  // Alert dialog state
  alert: AlertState | null;
  clearAlert: () => void;
}

export function useEditDay(dayId: string): UseEditDayReturn {
  // ── State ──────────────────────────────────────────────────────────────
  const [dayName, setDayName] = useState('');
  const [exercises, setExercises] = useState<DayExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const { alert, setAlert, clearAlert } = useAlertState();

  // Track initial state for dirty detection
  const initialNameRef = useRef('');
  const initialExerciseIdsRef = useRef<string[]>([]);

  // Track removals and additions for save
  const removedIdsRef = useRef<Set<string>>(new Set());
  const pendingAddsRef = useRef<PendingExercise[]>([]);

  // ── Load initial data ──────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getPlanDayWithExercises(dayId);
        if (cancelled) return;

        setDayName(data.name);
        setExercises(data.exercises);
        initialNameRef.current = data.name;
        initialExerciseIdsRef.current = data.exercises.map((e) => e.id);
      } catch (error) {
        console.error('Failed to load day data:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [dayId]);

  // ── Dirty detection ────────────────────────────────────────────────────
  const isDirty = useMemo(() => {
    if (dayName !== initialNameRef.current) return true;

    const currentIds = exercises.map((e) => e.id);
    const initialIds = initialExerciseIdsRef.current;

    if (currentIds.length !== initialIds.length) return true;
    return currentIds.some((id, i) => id !== initialIds[i]);
  }, [dayName, exercises]);

  // ── Exercise operations (local only) ───────────────────────────────────
  const removeExercise = useCallback((exerciseId: string) => {
    setExercises((prev) => prev.filter((e) => e.id !== exerciseId));

    // Track if it's an existing DB record (not a pending add)
    const isPending = exerciseId.startsWith(TEMP_EXERCISE_ID_PREFIX);
    if (!isPending) {
      removedIdsRef.current.add(exerciseId);
    } else {
      pendingAddsRef.current = pendingAddsRef.current.filter((p) => p.tempId !== exerciseId);
    }
  }, []);

  const reorderExercises = useCallback((reordered: DayExercise[]) => {
    setExercises(reordered);
  }, []);

  // ── Exercise picker integration ────────────────────────────────────────
  const navigateToExercisePicker = useCallback(() => {
    const existingIds = exercises.map((e) => e.exercise_id).join(',');
    router.push({
      pathname: '/exercise/picker',
      params: { dayId, mode: 'pick', existingExerciseIds: existingIds },
    });
  }, [dayId, exercises]);

  const consumePickerResult = useCallback(() => {
    const result = useExercisePickerStore.getState().result;
    if (!result || result.length === 0) return;

    // Picker already validated (duplicates + limits). Defense-in-depth limit check.
    if (exercises.length + result.length > MAX_EXERCISES_PER_DAY) {
      useExercisePickerStore.getState().clearResult();
      return;
    }

    // Convert picked exercises to DayExercise format with temp IDs
    const newExercises: DayExercise[] = result.map((picked, index) => {
      const tempId = `${TEMP_EXERCISE_ID_PREFIX}${Date.now()}_${index}`;

      // Track pending add
      pendingAddsRef.current.push({ tempId, exercise: picked });

      return {
        id: tempId,
        plan_day_id: dayId,
        exercise_id: picked.id,
        order_index: exercises.length + index,
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
    });

    setExercises((prev) => [...prev, ...newExercises]);
    useExercisePickerStore.getState().clearResult();
  }, [dayId, exercises]);

  // ── Navigate to exercise detail ────────────────────────────────────────
  const navigateToExerciseDetail = useCallback((exercise: DayExercise) => {
    router.push({
      pathname: '/exercise/[id]',
      params: { id: exercise.exercise.id },
    });
  }, []);

  // ── Save ───────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (isSaving) return;

    // Validate day name
    const trimmedName = dayName.trim();
    if (trimmedName.length === 0) {
      setDayName(initialNameRef.current);
    }

    const nameToSave = trimmedName || initialNameRef.current;

    // Validate name length before saving
    if (nameToSave.length > MAX_DAY_NAME_LENGTH) {
      setAlert({
        title: 'Name Too Long',
        description: `Day name cannot exceed ${MAX_DAY_NAME_LENGTH} characters (currently ${nameToSave.length}).`,
      });
      return;
    }

    setIsSaving(true);

    try {
      // Build added exercises list from pending adds
      const addedExercises = pendingAddsRef.current
        .map((pending) => {
          const currentIndex = exercises.findIndex((e) => e.id === pending.tempId);
          if (currentIndex === -1) return null; // Was removed after adding
          return {
            exercise_id: pending.exercise.id,
            order_index: currentIndex,
          };
        })
        .filter((e): e is NonNullable<typeof e> => e !== null);

      // Build reorder list from existing (non-temp) exercises
      const reorderedExercises = exercises
        .filter((e) => !e.id.startsWith(TEMP_EXERCISE_ID_PREFIX))
        .map((e) => ({
          id: e.id,
          order_index: exercises.indexOf(e),
        }));

      // Save all changes in a single transaction
      await savePlanDayEdits({
        dayId,
        name: nameToSave !== initialNameRef.current ? nameToSave : undefined,
        removedExerciseIds: Array.from(removedIdsRef.current),
        addedExercises,
        reorderedExercises,
      });

      router.back();
    } catch (error) {
      if (error instanceof ValidationError) {
        setAlert({ title: 'Error', description: error.userMessage });
      } else {
        console.error('Failed to save day changes:', error);
        setAlert({ title: 'Error', description: 'Failed to save changes. Please try again.' });
      }
    } finally {
      setIsSaving(false);
    }
  }, [dayId, dayName, exercises, isSaving, setAlert]);

  // ── Delete day ─────────────────────────────────────────────────────────
  const handleDeleteDay = useCallback(async () => {
    if (isDeleting) return;
    setIsDeleting(true);

    try {
      await deletePlanDay(dayId);
      router.back();
    } catch (error) {
      console.error('Failed to delete day:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [dayId, isDeleting]);

  // ── Discard ────────────────────────────────────────────────────────────
  const handleConfirmDiscard = useCallback(() => {
    setShowDiscardConfirm(false);
    router.back();
  }, []);

  // ── Back navigation ────────────────────────────────────────────────────
  const handleBack = useCallback(() => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      router.back();
    }
  }, [isDirty]);

  return {
    dayName,
    exercises,
    loading,
    isDirty,
    isSaving,
    setDayName,
    removeExercise,
    reorderExercises,
    handleSave,
    showDeleteConfirm,
    setShowDeleteConfirm,
    handleDeleteDay,
    isDeleting,
    showDiscardConfirm,
    setShowDiscardConfirm,
    handleConfirmDiscard,
    handleBack,
    navigateToExercisePicker,
    consumePickerResult,
    navigateToExerciseDetail,
    alert,
    clearAlert,
  };
}
