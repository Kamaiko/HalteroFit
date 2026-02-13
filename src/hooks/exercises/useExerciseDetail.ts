/**
 * useExerciseDetail - Data loading hook for ExerciseDetailScreen
 *
 * Loads a single exercise by ID from WatermelonDB.
 * Manages loading/error states and back navigation.
 */

import { useCallback, useEffect, useState } from 'react';
import { router } from 'expo-router';

import { getExerciseById, type Exercise } from '@/services/database/operations';

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

  useEffect(() => {
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
        setExercise(data);
      } catch (err) {
        console.error('Failed to load exercise:', err);
        setError('Unable to load exercise details');
      } finally {
        setLoading(false);
      }
    }

    loadExercise();
  }, [id]);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  return { exercise, loading, error, handleBack };
}
