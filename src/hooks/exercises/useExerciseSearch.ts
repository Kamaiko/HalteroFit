/**
 * useExerciseSearch - Shared hook for exercise search/filter/pagination
 *
 * Used by: Exercise List, Exercise Picker
 */

import { getExercises, getExerciseCount, type Exercise } from '@/services/database/operations';
import { useCallback, useEffect, useState } from 'react';

const BATCH_SIZE = 50;

export interface ExerciseFilterOptions {
  bodyPart?: string;
  targetMuscle?: string;
}

export interface UseExerciseSearchOptions {
  initialFilters?: ExerciseFilterOptions;
}

export interface UseExerciseSearchReturn {
  exercises: Exercise[];
  search: string;
  setSearch: (search: string) => void;
  loading: boolean;
  loadingMore: boolean;
  totalCount: number;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
}

export function useExerciseSearch(options: UseExerciseSearchOptions = {}): UseExerciseSearchReturn {
  const { initialFilters } = options;

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const getFilterOptions = useCallback((): ExerciseFilterOptions => {
    return initialFilters ?? {};
  }, [initialFilters]);

  const loadCount = useCallback(async () => {
    try {
      const count = await getExerciseCount({
        search: search.trim() || undefined,
        ...getFilterOptions(),
      });
      setTotalCount(count);
    } catch (error) {
      console.error('Failed to load exercise count:', error);
    }
  }, [search, getFilterOptions]);

  const loadExercises = useCallback(
    async (reset = false) => {
      try {
        if (reset) {
          setLoading(true);
          setHasMore(true);
        } else {
          setLoadingMore(true);
        }

        const offset = reset ? 0 : exercises.length;
        const results = await getExercises({
          search: search.trim() || undefined,
          ...getFilterOptions(),
          limit: BATCH_SIZE,
          offset,
        });

        if (reset) {
          setExercises(results);
        } else {
          setExercises((prev) => [...prev, ...results]);
        }

        setHasMore(results.length === BATCH_SIZE);
      } catch (error) {
        console.error('Failed to load exercises:', error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [search, getFilterOptions, exercises.length]
  );

  // Initial load
  useEffect(() => {
    loadExercises(true);
    loadCount();
  }, [initialFilters?.bodyPart, initialFilters?.targetMuscle]);

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      Promise.all([loadExercises(true), loadCount()]);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      loadExercises(false);
    }
  }, [loadingMore, hasMore, loading, loadExercises]);

  const refresh = useCallback(() => {
    loadExercises(true);
    loadCount();
  }, [loadExercises, loadCount]);

  return {
    exercises,
    search,
    setSearch,
    loading,
    loadingMore,
    totalCount,
    hasMore,
    loadMore,
    refresh,
  };
}
