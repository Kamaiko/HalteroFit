/**
 * Exercise Browser Screen
 *
 * Full-screen exercise browsing. Tap an exercise to view details.
 * Displayed outside tabs (covers entire screen including tab bar).
 *
 * Navigation: Exercises tab (muscle selector) → this screen → exercise detail
 */

import { ExerciseCard, ExerciseListView } from '@/components/exercises';
import { useExerciseSearch, type ExerciseFilterOptions } from '@/hooks/exercises';
import type { Exercise } from '@/services/database/operations';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ExerciseBrowserScreen() {
  const params = useLocalSearchParams<{
    filterType?: string;
    filterValue?: string;
    filterLabel?: string;
  }>();
  const { filterType, filterValue, filterLabel } = params;
  const insets = useSafeAreaInsets();

  // Build initial filters from URL params
  const initialFilters = useMemo((): ExerciseFilterOptions | undefined => {
    if (filterType === 'bodyPart' && filterValue) {
      return { bodyPart: filterValue };
    }
    if (filterType === 'targetMuscle' && filterValue) {
      return { targetMuscle: filterValue };
    }
    return undefined;
  }, [filterType, filterValue]);

  const { exercises, search, setSearch, loading, loadingMore, totalCount, loadMore } =
    useExerciseSearch({ initialFilters });

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleExercisePress = useCallback((exercise: Exercise) => {
    router.push({
      pathname: '/exercise/[id]',
      params: { id: exercise.id },
    });
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Exercise }) => (
      <ExerciseCard exercise={item} mode="browse" onPress={handleExercisePress} />
    ),
    [handleExercisePress]
  );

  // Determine title based on filter
  const title = filterLabel || 'All Exercises';

  return (
    <ExerciseListView
      title={title}
      onBack={handleBack}
      search={search}
      onSearchChange={setSearch}
      exercises={exercises}
      totalCount={totalCount}
      loading={loading}
      loadingMore={loadingMore}
      onLoadMore={loadMore}
      renderItem={renderItem}
      contentPaddingBottom={16 + insets.bottom}
    />
  );
}
