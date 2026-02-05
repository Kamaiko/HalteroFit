/**
 * useExerciseSearch - Shared hook for exercise search/filter/pagination
 *
 * Used by: Exercise List, Exercise Picker
 */

import { getExercises, getExerciseCount, type Exercise } from '@/services/database/operations';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_PAGE_SIZE, SEARCH_DEBOUNCE_MS } from '@/constants';

const BATCH_SIZE = DEFAULT_PAGE_SIZE;

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
  error: string | null;
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
  const [error, setError] = useState<string | null>(null);

  // Use ref to track exercises length without causing callback recreation
  const exercisesLengthRef = useRef(0);
  exercisesLengthRef.current = exercises.length;

  // Refs to hold latest function versions (avoids stale closure in effects)
  // See: https://typeofnan.dev/you-probably-shouldnt-ignore-react-hooks-exhaustive-deps-warnings/
  // NOTE: Initialized with no-op functions instead of null! for type safety
  const loadExercisesRef = useRef<(reset?: boolean) => Promise<void>>(async () => {});
  const loadCountRef = useRef<() => Promise<void>>(async () => {});

  // Memoize filter options (simpler than useCallback for a value)
  const filterOptions = useMemo(
    (): ExerciseFilterOptions => initialFilters ?? {},
    [initialFilters]
  );

  const loadCount = useCallback(async () => {
    try {
      const count = await getExerciseCount({
        search: search.trim() || undefined,
        ...filterOptions,
      });
      setTotalCount(count);
    } catch (err) {
      console.error('Failed to load exercise count:', err);
    }
  }, [search, filterOptions]);

  const loadExercises = useCallback(
    async (reset = false) => {
      try {
        setError(null);
        if (reset) {
          setLoading(true);
          setHasMore(true);
        } else {
          setLoadingMore(true);
        }

        // Use ref to avoid callback recreation when exercises change
        const offset = reset ? 0 : exercisesLengthRef.current;
        const results = await getExercises({
          search: search.trim() || undefined,
          ...filterOptions,
          limit: BATCH_SIZE,
          offset,
        });

        if (reset) {
          setExercises(results);
        } else {
          setExercises((prev) => [...prev, ...results]);
        }

        setHasMore(results.length === BATCH_SIZE);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load exercises';
        setError(message);
        console.error('Failed to load exercises:', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [search, filterOptions] // No exercises.length - using ref instead
  );

  // Keep refs updated with latest function versions
  loadExercisesRef.current = loadExercises;
  loadCountRef.current = loadCount;

  // Track if component has mounted (to skip search effect on initial render)
  const isMountedRef = useRef(false);

  // Initial load when filters change
  useEffect(() => {
    loadExercisesRef.current(true);
    loadCountRef.current();
  }, [initialFilters?.bodyPart, initialFilters?.targetMuscle]);

  // Search with debounce - skip on mount to avoid double load with filter effect
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }

    const timer = setTimeout(() => {
      loadExercisesRef.current(true);
      loadCountRef.current();
    }, SEARCH_DEBOUNCE_MS);

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
    error,
    loadMore,
    refresh,
  };
}
