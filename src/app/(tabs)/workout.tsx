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
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Ionicons } from '@/components/ui/icon';
import { Tabs, type TabRoute } from '@/components/ui';
import { Text } from '@/components/ui/text';
import {
  PlanHeader,
  WorkoutOverviewContent,
  WorkoutDayDetailsContent,
  type DayExercise,
} from '@/components/workout';
import { Colors } from '@/constants';
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
  } = useWorkoutScreen();

  const handleAddExercisePress = useCallback(() => {
    if (!selectedDay) return;
    router.push({
      pathname: '/exercise-picker',
      params: { dayId: selectedDay.id, dayName: selectedDay.name },
    });
  }, [selectedDay]);

  const handleExercisePress = useCallback((_exercise: DayExercise) => {
    // TODO: Navigate to edit exercise screen
  }, []);

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
            onExercisePress={handleExercisePress}
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
        <View className="absolute bottom-6 right-4">
          <Button
            className="rounded-full px-6 py-3 shadow-lg"
            style={{ backgroundColor: Colors.primary.DEFAULT }}
            onPress={() => {
              // TODO: Navigate to active workout session
            }}
          >
            <Text className="text-white font-semibold text-base">Start Workout</Text>
          </Button>
        </View>
      )}

      <BottomSheet ref={menuSheetRef} title={menuDay?.name ?? 'Options'}>
        <View className="px-4 pb-6">
          <Pressable
            onPress={handleEditDay}
            className="flex-row items-center py-4 border-b border-background-elevated"
          >
            <Ionicons name="pencil-outline" size={24} color={Colors.foreground.DEFAULT} />
            <Text className="text-foreground text-base ml-4">Edit</Text>
          </Pressable>
          <Pressable onPress={handleDeleteDayPress} className="flex-row items-center py-4">
            <Ionicons name="trash-outline" size={24} color={Colors.danger} />
            <Text className="text-base ml-4" style={{ color: Colors.danger }}>
              Delete
            </Text>
          </Pressable>
        </View>
      </BottomSheet>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Workout Day?"
        description={`Are you sure you want to delete "${menuDay?.name}"? This will also remove all exercises in this day.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </ScreenContainer>
  );
}
