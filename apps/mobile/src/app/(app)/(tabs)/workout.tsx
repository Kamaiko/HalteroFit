/**
 * WorkoutScreen - Main workout tab showing active plan as vertical timeline accordion
 *
 * @see docs/_local/mockups/timeline-FINAL-v3.html
 */

import { router } from 'expo-router';
import { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  type ListRenderItemInfo,
  Pressable,
  View,
} from 'react-native';

import { ScreenContainer } from '@/components/layout';
import { EmptyState } from '@/components/ui';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Ionicons } from '@/components/ui/icon';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { InputDialog } from '@/components/ui/input-dialog';
import { Text } from '@/components/ui/text';
import { CompactHeader, TimelineDayCard, AddDayPill, type DayExercise } from '@/components/workout';
import { Colors, DEFAULT_PLAN_NAME, ICON_SIZE_SM, TAB_BAR_HEIGHT } from '@/constants';
import { useWorkoutScreen } from '@/hooks/workout';
import type { PlanDay } from '@/services/database/operations/plans';

export default function WorkoutScreen() {
  const {
    user,
    activePlan,
    planDays,
    selectedDayExercises,
    loadingExercises,
    loading,
    expandedDayId,
    exerciseCounts,
    dominantMuscleGroups,
    menuDay,
    showDeleteConfirm,
    isDeleting,
    menuSheetRef,
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
    addDayAlert,
    clearAddDayAlert,
    deletingExerciseId,
    deleteExerciseOptimistic,
    handleDeleteAnimationComplete,
    handleMoveDayUp,
    handleMoveDayDown,
  } = useWorkoutScreen();

  // ── Callbacks ────────────────────────────────────────────────────────
  const handleExercisePress = useCallback((exercise: DayExercise) => {
    router.push({
      pathname: '/exercise/[id]',
      params: { id: exercise.exercise.id },
    });
  }, []);

  const handleDeleteExercise = useCallback(
    (exercise: DayExercise) => {
      deleteExerciseOptimistic(exercise.id);
    },
    [deleteExerciseOptimistic]
  );

  const totalExercises = useMemo(
    () => Object.values(exerciseCounts).reduce((sum, c) => sum + c, 0),
    [exerciseCounts]
  );

  const renderTimelineItem = useCallback(
    ({ item: day }: ListRenderItemInfo<PlanDay>) => {
      const isExpanded = day.id === expandedDayId;
      return (
        <TimelineDayCard
          day={day}
          exerciseCount={exerciseCounts[day.id] ?? 0}
          dominantMuscleGroupId={dominantMuscleGroups[day.id]}
          isExpanded={isExpanded}
          exercises={isExpanded ? (selectedDayExercises?.exercises ?? []) : []}
          loadingExercises={isExpanded && loadingExercises}
          onPress={handleDayPress}
          onMenuPress={handleDayMenuPress}
          onStartWorkout={() => {
            // TODO(3.1.3): Navigate to active workout session
          }}
          onAddExercisePress={() => {
            router.push({
              pathname: '/exercise/picker',
              params: { dayId: day.id, dayName: day.name },
            });
          }}
          onExerciseImagePress={handleExercisePress}
          onDeleteExercise={handleDeleteExercise}
          deletingExerciseId={deletingExerciseId}
          onDeleteAnimationComplete={handleDeleteAnimationComplete}
        />
      );
    },
    [
      expandedDayId,
      exerciseCounts,
      dominantMuscleGroups,
      selectedDayExercises,
      loadingExercises,
      handleDayPress,
      handleDayMenuPress,
      handleExercisePress,
      handleDeleteExercise,
      deletingExerciseId,
      handleDeleteAnimationComplete,
    ]
  );

  const keyExtractor = useCallback((item: PlanDay) => item.id, []);

  // ── Loading / auth guard ─────────────────────────────────────────────
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
      <CompactHeader
        planName={activePlan?.name ?? DEFAULT_PLAN_NAME}
        dayCount={planDays.length}
        exerciseCount={totalExercises}
      />

      {planDays.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title="No workout days yet"
          subtitle="Add your first workout day to get started"
          action={{ label: '+ Add a day', onPress: handleAddDayPress }}
        />
      ) : (
        <FlatList
          data={planDays}
          renderItem={renderTimelineItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: TAB_BAR_HEIGHT + 16 }}
          ListFooterComponent={<AddDayPill onPress={handleAddDayPress} />}
        />
      )}

      <BottomSheet ref={menuSheetRef} title={menuDay?.name ?? 'Options'}>
        <View className="gap-2 pb-6">
          {menuDay && planDays.length > 1 && (
            <>
              {planDays[0]?.id !== menuDay.id && (
                <Pressable
                  onPress={() => {
                    menuSheetRef.current?.close();
                    handleMoveDayUp(menuDay);
                  }}
                  className="flex-row items-center px-4 py-3 active:opacity-60"
                >
                  <Ionicons name="arrow-up" size={ICON_SIZE_SM} color={Colors.foreground.DEFAULT} />
                  <Text className="text-foreground text-base ml-3">Move Up</Text>
                </Pressable>
              )}
              {planDays[planDays.length - 1]?.id !== menuDay.id && (
                <Pressable
                  onPress={() => {
                    menuSheetRef.current?.close();
                    handleMoveDayDown(menuDay);
                  }}
                  className="flex-row items-center px-4 py-3 active:opacity-60"
                >
                  <Ionicons
                    name="arrow-down"
                    size={ICON_SIZE_SM}
                    color={Colors.foreground.DEFAULT}
                  />
                  <Text className="text-foreground text-base ml-3">Move Down</Text>
                </Pressable>
              )}
            </>
          )}
          <Pressable
            onPress={handleEditDay}
            className="flex-row items-center px-4 py-3 active:opacity-60"
          >
            <Ionicons name="pencil-outline" size={ICON_SIZE_SM} color={Colors.foreground.DEFAULT} />
            <Text className="text-foreground text-base ml-3">Edit</Text>
          </Pressable>
          <Pressable
            onPress={handleDeleteDayPress}
            className="flex-row items-center px-4 py-3 active:opacity-60"
          >
            <Ionicons name="trash-outline" size={ICON_SIZE_SM} color={Colors.destructive} />
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

      <AlertDialog
        open={!!addDayAlert}
        onOpenChange={clearAddDayAlert}
        title={addDayAlert?.title ?? ''}
        description={addDayAlert?.description}
      />
    </ScreenContainer>
  );
}
