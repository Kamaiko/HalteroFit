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
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertDialog } from '@/components/ui/alert-dialog';

export default function ExercisePickerScreen() {
  const params = useLocalSearchParams<{
    dayId?: string;
    dayName?: string;
    mode?: 'add' | 'pick';
    existingExerciseIds?: string;
  }>();
  const { dayId, dayName, mode = 'add', existingExerciseIds: existingExerciseIdsParam } = params;
  const insets = useSafeAreaInsets();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState(false);
  const [alert, setAlert] = useState<{ title: string; description?: string } | null>(null);

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
      // ── Resolve existing exercises (DB query for mode='add', route params for mode='pick')
      let existingExerciseIds: Set<string>;
      let currentCount: number;

      if (mode === 'pick') {
        // Parse existing exercise IDs passed from Edit Day's draft state
        const ids = existingExerciseIdsParam
          ? existingExerciseIdsParam.split(',').filter(Boolean)
          : [];
        existingExerciseIds = new Set(ids);
        currentCount = ids.length;
      } else {
        // Query DB for current state
        const existingExercises = await database
          .get<PlanDayExerciseModel>('plan_day_exercises')
          .query(Q.where('plan_day_id', targetDayId))
          .fetch();
        existingExerciseIds = new Set(existingExercises.map((e) => e.exerciseId));
        currentCount = existingExercises.length;
      }

      const selectedExerciseIds = Array.from(selectedIds);

      // ── Check duplicates
      const duplicates = selectedExerciseIds.filter((id) => existingExerciseIds.has(id));
      if (duplicates.length > 0) {
        setAlert({
          title: 'Already Added',
          description: `${duplicates.length} exercise${duplicates.length !== 1 ? 's' : ''} deselected.`,
        });
        // Deselect duplicates
        setSelectedIds((prev) => {
          const next = new Set(prev);
          for (const id of duplicates) next.delete(id);
          return next;
        });
        return;
      }

      // ── Check limit
      if (currentCount + selectedExerciseIds.length > MAX_EXERCISES_PER_DAY) {
        const available = MAX_EXERCISES_PER_DAY - currentCount;
        setAlert({
          title: 'Limit Reached',
          description:
            available <= 0
              ? `Day is full (${MAX_EXERCISES_PER_DAY} exercises).`
              : `Can only add ${available} more (max ${MAX_EXERCISES_PER_DAY}).`,
        });
        return;
      }

      // ── Execute action based on mode
      if (mode === 'pick') {
        // Return validated exercises to calling screen via store
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

      // mode='add': save directly to DB in a single batch transaction
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
        setAlert({ title: 'Error', description: error.userMessage });
      } else {
        console.error('Failed to add exercises:', error);
        setAlert({ title: 'Error', description: 'Please try again.' });
      }
    } finally {
      setIsAdding(false);
    }
  }, [selectedIds, dayId, isAdding, mode, exercises, existingExerciseIdsParam]);

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
    [insets.bottom, isButtonDisabled, hasSelection, handleAddExercises, buttonText]
  );

  return (
    <>
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

      <AlertDialog
        open={!!alert}
        onOpenChange={() => setAlert(null)}
        title={alert?.title ?? ''}
        description={alert?.description}
      />
    </>
  );
}
