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
import { AlertDialog } from '@/components/ui/alert-dialog';
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
import { Colors, DEFAULT_PLAN_NAME, ICON_SIZE_SM, START_BUTTON_HEIGHT } from '@/constants';
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
    dominantMuscleGroups,
    canStartWorkout,
    setActiveTabIndex,
    handleDayPress,
    menuSheetRef,
    reorderDaysOptimistic,
    dayMenu,
    addDay,
    exerciseActions,
  } = useWorkoutScreen();

  const handleAddExercisePress = useCallback(() => {
    if (!selectedDay) return;
    router.push({
      pathname: '/exercise/picker',
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
      router.push({ pathname: '/plans/edit-day', params: { dayId: selectedDay.id } });
    },
    [selectedDay]
  );

  const handleDeleteExercise = useCallback(
    (exercise: DayExercise) => {
      exerciseActions.deleteExerciseOptimistic(exercise.id);
    },
    [exerciseActions]
  );

  // Render scene for swipeable tabs
  const renderScene = useCallback(
    ({ route }: { route: TabRoute }) => {
      if (route.key === 'tab-0') {
        return (
          <WorkoutOverviewContent
            planDays={planDays}
            exerciseCounts={exerciseCounts}
            dominantMuscleGroups={dominantMuscleGroups}
            selectedDayId={selectedDay?.id}
            onDayPress={handleDayPress}
            onDayMenuPress={dayMenu.handleDayMenuPress}
            onAddDayPress={addDay.handleAddDayPress}
            onReorder={reorderDaysOptimistic}
          />
        );
      }

      if (route.key === 'tab-1') {
        const dayExercises = selectedDayExercises?.exercises ?? [];
        return (
          <WorkoutDayDetailsContent
            selectedDay={selectedDay}
            exercises={dayExercises}
            loading={loadingExercises}
            onAddExercisePress={handleAddExercisePress}
            onImagePress={handleExercisePress}
            onEditExercise={handleEditExercise}
            onDeleteExercise={handleDeleteExercise}
            onReorder={exerciseActions.reorderExercisesOptimistic}
            deletingExerciseId={exerciseActions.deletingExerciseId}
            onDeleteAnimationComplete={exerciseActions.handleDeleteAnimationComplete}
          />
        );
      }

      return null;
    },
    [
      planDays,
      exerciseCounts,
      dominantMuscleGroups,
      selectedDay,
      handleDayPress,
      dayMenu,
      addDay,
      selectedDayExercises,
      loadingExercises,
      handleAddExercisePress,
      handleExercisePress,
      handleEditExercise,
      handleDeleteExercise,
      exerciseActions,
      reorderDaysOptimistic,
    ]
  );

  if (loading) {
    return (
      <ScreenContainer contentClassName="items-center justify-center" edges={[]}>
        <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
        <Text className="text-foreground-secondary mt-4">Loading workout...</Text>
      </ScreenContainer>
    );
  }

  if (!user?.id) {
    return (
      <ScreenContainer contentClassName="items-center justify-center p-6" edges={[]}>
        <Text className="text-xl font-bold text-foreground mb-2">Sign In Required</Text>
        <Text className="text-base text-foreground-secondary text-center">
          Please sign in to access your workout plans
        </Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={[]}>
      <PlanHeader
        planName={activePlan?.name ?? DEFAULT_PLAN_NAME}
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

      <BottomSheet ref={menuSheetRef} title={dayMenu.menuDay?.name ?? 'Options'}>
        <View className="gap-2 pb-6">
          <Pressable
            onPress={dayMenu.handleEditDay}
            className="flex-row items-center px-4 py-3 active:opacity-60"
          >
            <Ionicons name="pencil-outline" size={ICON_SIZE_SM} color={Colors.foreground.DEFAULT} />
            <Text className="text-foreground text-base ml-3">Edit</Text>
          </Pressable>
          <Pressable
            onPress={dayMenu.handleDeleteDayPress}
            className="flex-row items-center px-4 py-3 active:opacity-60"
          >
            <Ionicons name="trash-outline" size={ICON_SIZE_SM} color={Colors.destructive} />
            <Text className="text-destructive text-base ml-3">Delete</Text>
          </Pressable>
        </View>
      </BottomSheet>

      <ConfirmDialog
        open={dayMenu.showDeleteConfirm}
        onOpenChange={dayMenu.setShowDeleteConfirm}
        title="Delete this workout day?"
        confirmLabel="Confirm"
        onConfirm={dayMenu.handleConfirmDelete}
        loading={dayMenu.isDeleting}
      />

      <InputDialog
        open={addDay.showAddDayDialog}
        onClose={addDay.handleCancelAddDay}
        title="Add a Day"
        placeholder="New day"
        value={addDay.addDayName}
        onChangeText={addDay.setAddDayName}
        onConfirm={addDay.handleConfirmAddDay}
        loading={addDay.isAddingDay}
      />

      <AlertDialog
        open={!!addDay.alert}
        onOpenChange={addDay.clearAlert}
        title={addDay.alert?.title ?? ''}
        description={addDay.alert?.description}
      />
    </ScreenContainer>
  );
}
