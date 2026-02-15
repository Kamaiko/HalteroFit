/**
 * useExerciseDetail - Data loading hook for ExerciseDetailScreen
 *
 * Loads a single exercise by ID from WatermelonDB.
 * Manages loading/error states and back navigation.
 */

import { useCallback, useEffect, useState } from 'react';
import { router } from 'expo-router';

import { useErrorHandler } from '@/hooks/ui/useErrorHandler';
import { getExerciseById, type Exercise } from '@/services/database/operations';
import { isOperationalError } from '@/utils/errors';

export interface UseExerciseDetailReturn {
  exercise: Exercise | null;
  loading: boolean;
  error: string | null;
  handleBack: () => void;
}

export function useExerciseDetail(id?: string): UseExerciseDetailReturn {
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { handleError } = useErrorHandler();

  useEffect(() => {
    let cancelled = false;

    async function loadExercise() {
      if (!id) {
        setError('Exercise ID not provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await getExerciseById(id);
        if (cancelled) return;
        setExercise(data);
      } catch (err) {
        if (cancelled) return;
        const message = isOperationalError(err)
          ? err.userMessage
          : 'Unable to load exercise details';
        setError(message);
        handleError(err, 'loadExerciseDetail');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadExercise();
    return () => {
      cancelled = true;
    };
  }, [id, handleError]);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  return { exercise, loading, error, handleBack };
}
