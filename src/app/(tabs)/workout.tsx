/**
 * WorkoutScreen - Main workout tab showing active plan
 *
 * @see docs/reference/jefit/screenshots/03-plans/
 */

import { router } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { ScreenContainer } from '@/components/layout';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Ionicons } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { InputDialog } from '@/components/ui/input-dialog';
import { Tabs, type TabRoute } from '@/components/ui';
import { Text } from '@/components/ui/text';
import {
  PlanHeader,
  WorkoutOverviewContent,
  WorkoutDayDetailsContent,
  type DayExercise,
} from '@/components/workout';
import { Colors, START_BUTTON_HEIGHT } from '@/constants';
import { useWorkoutScreen } from '@/hooks/workout';

export default function WorkoutScreen() {
  const {
    user,
    activePlan,
    planDays,
    selectedDay,
    selectedDayExercises,
    loadingExercises,
    loading,
    activeTabIndex,
    exerciseCounts,
    canStartWorkout,
    menuDay,
    showDeleteConfirm,
    isDeleting,
    menuSheetRef,
    setActiveTabIndex,
    setShowDeleteConfirm,
    handleDayPress,
    handleDayMenuPress,
    handleEditDay,
    handleDeleteDayPress,
    handleConfirmDelete,
    handleAddDayPress,
    showAddDayDialog,
    addDayName,
    setAddDayName,
    isAddingDay,
    handleConfirmAddDay,
    handleCancelAddDay,
    deletingExerciseId,
    deleteExerciseOptimistic,
    handleDeleteAnimationComplete,
    reorderExercisesOptimistic,
    reorderDaysOptimistic,
  } = useWorkoutScreen();

  const handleAddExercisePress = useCallback(() => {
    if (!selectedDay) return;
    router.push({
      pathname: '/exercise-picker',
      params: { dayId: selectedDay.id, dayName: selectedDay.name },
    });
  }, [selectedDay]);

  const handleExercisePress = useCallback((exercise: DayExercise) => {
    router.push({
      pathname: '/exercise/[id]',
      params: { id: exercise.exercise.id },
    });
  }, []);

  const handleEditExercise = useCallback(
    (_exercise: DayExercise) => {
      if (!selectedDay) return;
      router.push({ pathname: '/edit-day', params: { dayId: selectedDay.id } });
    },
    [selectedDay]
  );

  const handleDeleteExercise = useCallback(
    (exercise: DayExercise) => {
      deleteExerciseOptimistic(exercise.id);
    },
    [deleteExerciseOptimistic]
  );

  const dayExercises = selectedDayExercises?.exercises ?? [];

  // Render scene for swipeable tabs
  const renderScene = useCallback(
    ({ route }: { route: TabRoute }) => {
      if (route.key === 'tab-0') {
        return (
          <WorkoutOverviewContent
            planDays={planDays}
            exerciseCounts={exerciseCounts}
            selectedDayId={selectedDay?.id}
            onDayPress={handleDayPress}
            onDayMenuPress={handleDayMenuPress}
            onAddDayPress={handleAddDayPress}
            onReorder={reorderDaysOptimistic}
          />
        );
      }

      if (route.key === 'tab-1') {
        return (
          <WorkoutDayDetailsContent
            selectedDay={selectedDay}
            exercises={dayExercises}
            loading={loadingExercises}
            onAddExercisePress={handleAddExercisePress}
            onImagePress={handleExercisePress}
            onEditExercise={handleEditExercise}
            onDeleteExercise={handleDeleteExercise}
            onReorder={reorderExercisesOptimistic}
            deletingExerciseId={deletingExerciseId}
            onDeleteAnimationComplete={handleDeleteAnimationComplete}
          />
        );
      }

      return null;
    },
    [
      planDays,
      exerciseCounts,
      selectedDay,
      handleDayPress,
      handleDayMenuPress,
      handleAddDayPress,
      dayExercises,
      loadingExercises,
      handleAddExercisePress,
      handleExercisePress,
      handleEditExercise,
      handleDeleteExercise,
      reorderExercisesOptimistic,
      reorderDaysOptimistic,
      deletingExerciseId,
      handleDeleteAnimationComplete,
    ]
  );

  if (loading) {
    return (
      <ScreenContainer contentClassName="items-center justify-center">
        <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
        <Text className="text-foreground-secondary mt-4">Loading workout...</Text>
      </ScreenContainer>
    );
  }

  if (!user?.id) {
    return (
      <ScreenContainer contentClassName="items-center justify-center p-6">
        <Text className="text-xl font-bold text-foreground mb-2">Sign In Required</Text>
        <Text className="text-base text-foreground-secondary text-center">
          Please sign in to access your workout plans
        </Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <PlanHeader
        planName={activePlan?.name ?? 'New Workout'}
        coverImageUrl={activePlan?.cover_image_url}
      />

      <Tabs
        tabs={['Overview', 'Day Details']}
        activeIndex={activeTabIndex}
        onChange={setActiveTabIndex}
        renderScene={renderScene}
      />

      {canStartWorkout && (
        <View className="absolute bottom-6 left-4 right-4">
          <Button
            className="rounded-xl shadow-lg items-center justify-center"
            style={{ backgroundColor: Colors.primary.DEFAULT, height: START_BUTTON_HEIGHT }}
            onPress={() => {
              // TODO: Navigate to active workout session
            }}
          >
            <Text className="text-white font-bold text-lg">Start Workout</Text>
          </Button>
        </View>
      )}

      <BottomSheet ref={menuSheetRef} title={menuDay?.name ?? 'Options'}>
        <View className="gap-2 pb-6">
          <Pressable
            onPress={handleEditDay}
            className="flex-row items-center px-4 py-3 active:opacity-60"
          >
            <Ionicons name="pencil-outline" size={20} color={Colors.foreground.DEFAULT} />
            <Text className="text-foreground text-base ml-3">Edit</Text>
          </Pressable>
          <Pressable
            onPress={handleDeleteDayPress}
            className="flex-row items-center px-4 py-3 active:opacity-60"
          >
            <Ionicons name="trash-outline" size={20} color={Colors.destructive} />
            <Text className="text-destructive text-base ml-3">Delete</Text>
          </Pressable>
        </View>
      </BottomSheet>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete this workout day?"
        confirmLabel="Confirm"
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
      />

      <InputDialog
        open={showAddDayDialog}
        onClose={handleCancelAddDay}
        title="Add a Day"
        placeholder="New day"
        value={addDayName}
        onChangeText={setAddDayName}
        onConfirm={handleConfirmAddDay}
        loading={isAddingDay}
      />
    </ScreenContainer>
  );
}
