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
import { addExerciseToPlanDay, getExerciseCountByDay } from '@/services/database/operations/plans';
import { useExercisePickerStore, type PickedExercise } from '@/stores/exercisePickerStore';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ExercisePickerScreen() {
  const params = useLocalSearchParams<{
    dayId?: string;
    dayName?: string;
    mode?: 'add' | 'pick';
  }>();
  const { dayId, dayName, mode = 'add' } = params;
  const insets = useSafeAreaInsets();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState(false);

  const { exercises, search, setSearch, loading, loadingMore, totalCount, loadMore } =
    useExerciseSearch();

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleExerciseImagePress = useCallback((exercise: Exercise) => {
    router.push({ pathname: '/exercise/[id]', params: { id: exercise.id } });
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

  const handleAddExercises = useCallback(async () => {
    const targetDayId = dayId;
    if (selectedIds.size === 0 || !targetDayId || isAdding) return;

    setIsAdding(true);
    try {
      if (mode === 'pick') {
        // Return selected exercises to calling screen via store
        const picked: PickedExercise[] = exercises
          .filter((e) => selectedIds.has(e.id))
          .map((e) => ({
            id: e.id,
            name: e.name,
            body_parts: e.body_parts,
            target_muscles: e.target_muscles,
            equipments: e.equipments,
            gif_url: e.gif_url,
          }));

        useExercisePickerStore.getState().setResult(picked);
        router.back();
        return;
      }

      // Default mode: save directly to DB
      const currentCount = await getExerciseCountByDay(targetDayId);
      const selectedExerciseIds = Array.from(selectedIds);

      // Add each exercise sequentially
      for (const [i, exerciseId] of selectedExerciseIds.entries()) {
        await addExerciseToPlanDay({
          plan_day_id: targetDayId,
          exercise_id: exerciseId,
          order_index: currentCount + i,
          target_sets: 3,
          target_reps: 10,
        });
      }

      router.back();
    } catch (error) {
      console.error('Failed to add exercises:', error);
    } finally {
      setIsAdding(false);
    }
  }, [selectedIds, dayId, isAdding, mode, exercises]);

  const renderItem = useCallback(
    ({ item }: { item: Exercise }) => (
      <ExerciseCard
        exercise={item}
        mode="select"
        selected={selectedIds.has(item.id)}
        onPress={handleExercisePress}
        onImagePress={handleExerciseImagePress}
      />
    ),
    [selectedIds, handleExercisePress, handleExerciseImagePress]
  );

  const selectedCount = selectedIds.size;
  const isButtonDisabled = selectedCount === 0 || isAdding;

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
            opacity: isButtonDisabled ? 0.85 : 1,
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
