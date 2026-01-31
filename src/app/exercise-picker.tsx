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
import { Colors, MAX_EXERCISES_PER_DAY } from '@/constants';
import { useExerciseSearch } from '@/hooks/exercises';
import type { Exercise } from '@/services/database/operations';
import { addExercisesToPlanDay } from '@/services/database/operations/plans';
import { ValidationError } from '@/utils/errors';
import { useExercisePickerStore, type PickedExercise } from '@/stores/exercisePickerStore';
import { database } from '@/services/database/local';
import PlanDayExerciseModel from '@/services/database/local/models/PlanDayExercise';
import { Q } from '@nozbe/watermelondb';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
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

      // Default mode: save directly to DB in a single batch transaction
      // Pre-flight: check for duplicates before calling batch operation
      const existingExercises = await database
        .get<PlanDayExerciseModel>('plan_day_exercises')
        .query(Q.where('plan_day_id', targetDayId))
        .fetch();
      const existingExerciseIds = new Set(existingExercises.map((e) => e.exerciseId));

      const selectedExerciseIds = Array.from(selectedIds);
      const duplicates = selectedExerciseIds.filter((id) => existingExerciseIds.has(id));

      if (duplicates.length > 0) {
        const duplicateNames = exercises
          .filter((e) => duplicates.includes(e.id))
          .map((e) => e.name);
        Alert.alert('Duplicate Exercises', `Already in this day: ${duplicateNames.join(', ')}`);
        // Deselect duplicates
        setSelectedIds((prev) => {
          const next = new Set(prev);
          for (const id of duplicates) next.delete(id);
          return next;
        });
        return;
      }

      // Check limit
      const currentCount = existingExercises.length;
      if (currentCount + selectedExerciseIds.length > MAX_EXERCISES_PER_DAY) {
        const available = MAX_EXERCISES_PER_DAY - currentCount;
        Alert.alert(
          'Exercise Limit',
          available <= 0
            ? `This day already has ${MAX_EXERCISES_PER_DAY} exercises (maximum).`
            : `Can only add ${available} more exercise${available !== 1 ? 's' : ''} to this day (${currentCount}/${MAX_EXERCISES_PER_DAY}).`
        );
        return;
      }

      // Batch add all exercises in a single transaction
      await addExercisesToPlanDay(
        targetDayId,
        selectedExerciseIds.map((exerciseId, i) => ({
          exercise_id: exerciseId,
          order_index: currentCount + i,
        }))
      );

      router.back();
    } catch (error) {
      if (error instanceof ValidationError) {
        Alert.alert('Error', error.userMessage);
      } else {
        console.error('Failed to add exercises:', error);
        Alert.alert('Error', 'Failed to add exercises. Please try again.');
      }
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
  const hasSelection = selectedCount > 0;
  const isButtonDisabled = !hasSelection || isAdding;
  const buttonText = isAdding
    ? 'Adding...'
    : `Add ${selectedCount} exercise${selectedCount !== 1 ? 's' : ''}`;

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
            backgroundColor: !hasSelection ? Colors.background.surface : Colors.primary.DEFAULT,
            minHeight: 56,
            borderRadius: 12,
            opacity: !hasSelection ? 0.85 : 1,
          }}
          onPress={handleAddExercises}
          disabled={isButtonDisabled}
        >
          <Text
            className="font-semibold text-base"
            style={{ color: !hasSelection ? Colors.foreground.tertiary : 'white' }}
          >
            {buttonText}
          </Text>
        </Button>
      </View>
    ),
    [insets.bottom, isButtonDisabled, hasSelection, handleAddExercises, selectedCount, buttonText]
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
