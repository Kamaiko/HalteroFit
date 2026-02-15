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
import { MAX_EXERCISES_PER_DAY, MAX_DAY_NAME_LENGTH } from '@/constants';
import { useAlertState, type AlertState } from '@/hooks/ui/useAlertState';
import { useErrorHandler } from '@/hooks/ui/useErrorHandler';
import { isOperationalError } from '@/utils/errors';
import {
  getPlanDayWithExercises,
  savePlanDayEdits,
  deletePlanDay,
} from '@/services/database/operations/plans';
import {
  isTempExerciseId,
  generateTempExerciseId,
  createDayExerciseFromPicked,
  buildSavePayload,
} from './editDayHelpers';

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
  const { handleError } = useErrorHandler();

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
        if (!cancelled) handleError(error, 'loadDayData');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [dayId, handleError]);

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

    if (!isTempExerciseId(exerciseId)) {
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

    const newExercises: DayExercise[] = result.map((picked, index) => {
      const tempId = generateTempExerciseId(index);
      pendingAddsRef.current.push({ tempId, exercise: picked });
      return createDayExerciseFromPicked(picked, dayId, exercises.length + index, tempId);
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
      const payload = buildSavePayload({
        dayId,
        dayName,
        initialName: initialNameRef.current,
        exercises,
        pendingAdds: pendingAddsRef.current,
        removedIds: removedIdsRef.current,
      });

      await savePlanDayEdits(payload);
      router.back();
    } catch (error) {
      if (isOperationalError(error)) {
        setAlert({ title: 'Error', description: error.userMessage });
      } else {
        handleError(error, 'saveDayEdits');
      }
    } finally {
      setIsSaving(false);
    }
  }, [dayId, dayName, exercises, isSaving, setAlert, handleError]);

  // ── Delete day ─────────────────────────────────────────────────────────
  const handleDeleteDay = useCallback(async () => {
    if (isDeleting) return;
    setIsDeleting(true);

    try {
      await deletePlanDay(dayId);
      router.back();
    } catch (error) {
      if (isOperationalError(error)) {
        setAlert({ title: 'Error', description: error.userMessage });
      } else {
        handleError(error, 'deleteDay');
      }
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [dayId, isDeleting, setAlert, handleError]);

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
