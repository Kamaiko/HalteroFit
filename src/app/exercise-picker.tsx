/**
 * Exercise Picker Screen
 *
 * Full-screen multi-select exercise picker for adding exercises to a workout day.
 * Displayed outside tabs (covers entire screen including tab bar).
 *
 * @see docs/reference/jefit/screenshots/02-exercises/06-exercise-picker.png
 */

import { ExerciseCard, ExerciseListView } from '@/components/exercises';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants';
import { useExerciseSearch } from '@/hooks/exercises';
import type { Exercise } from '@/services/database/operations';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ExercisePickerScreen() {
  const params = useLocalSearchParams<{ dayId?: string; dayName?: string }>();
  const { dayId, dayName } = params;
  const insets = useSafeAreaInsets();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { exercises, search, setSearch, loading, loadingMore, totalCount, loadMore } =
    useExerciseSearch();

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleExercisePress = useCallback((exercise: Exercise) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(exercise.id)) {
        next.delete(exercise.id);
      } else {
        next.add(exercise.id);
      }
      return next;
    });
  }, []);

  const handleAddExercises = useCallback(() => {
    if (selectedIds.size === 0 || !dayId) return;

    const selectedExerciseIds = Array.from(selectedIds);
    // TODO: Call addExerciseToPlanDay for each selected exercise
    console.log('Adding exercises to day:', dayId, selectedExerciseIds);
    // Go back to previous screen
    router.back();
  }, [selectedIds, dayId]);

  const renderItem = useCallback(
    ({ item }: { item: Exercise }) => (
      <ExerciseCard
        exercise={item}
        mode="select"
        selected={selectedIds.has(item.id)}
        onPress={handleExercisePress}
      />
    ),
    [selectedIds, handleExercisePress]
  );

  const selectedCount = selectedIds.size;
  const isButtonDisabled = selectedCount === 0;

  // Floating Add Button - memoized to avoid recreation on every render
  const floatingContent = useMemo(
    () => (
      <View
        style={{
          position: 'absolute',
          bottom: Math.max(insets.bottom, 16) + 24,
          left: 16,
          right: 16,
        }}
      >
        <Button
          className="w-full items-center justify-center"
          style={{
            backgroundColor: isButtonDisabled ? Colors.background.surface : Colors.primary.DEFAULT,
            minHeight: 56,
            borderRadius: 12,
            opacity: 1,
          }}
          onPress={handleAddExercises}
          disabled={isButtonDisabled}
        >
          <Text
            className="font-semibold text-base"
            style={{ color: isButtonDisabled ? Colors.foreground.tertiary : 'white' }}
          >
            Add {selectedCount} exercise{selectedCount !== 1 ? 's' : ''}
          </Text>
        </Button>
      </View>
    ),
    [insets.bottom, isButtonDisabled, handleAddExercises, selectedCount]
  );

  return (
    <ExerciseListView
      title="Add Exercises"
      subtitle={dayName}
      onBack={handleBack}
      search={search}
      onSearchChange={setSearch}
      exercises={exercises}
      totalCount={totalCount}
      loading={loading}
      loadingMore={loadingMore}
      onLoadMore={loadMore}
      renderItem={renderItem}
      extraData={selectedIds}
      contentPaddingBottom={100 + insets.bottom}
      floatingContent={floatingContent}
    />
  );
}
