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
import { AlertDialog } from '@/components/ui/alert-dialog';
import { Colors } from '@/constants';
import { useExercisePicker } from '@/hooks/exercises';
import type { Exercise } from '@/services/database/operations';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ExercisePickerScreen() {
  const params = useLocalSearchParams<{
    dayId?: string;
    dayName?: string;
    mode?: 'add' | 'pick';
    existingExerciseIds?: string;
  }>();
  const { dayId, dayName, mode = 'add', existingExerciseIds: existingExerciseIdsParam } = params;
  const insets = useSafeAreaInsets();

  const {
    exercises,
    search,
    setSearch,
    loading,
    loadingMore,
    totalCount,
    loadMore,
    selectedIds,
    hasSelection,
    isButtonDisabled,
    buttonText,
    alert,
    clearAlert,
    handleExercisePress,
    handleExerciseImagePress,
    handleBack,
    handleAddExercises,
  } = useExercisePicker({ dayId, mode, existingExerciseIdsParam });

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
        onOpenChange={clearAlert}
        title={alert?.title ?? ''}
        description={alert?.description}
      />
    </>
  );
}
