/**
 * WorkoutScreen - Main workout tab showing active plan
 *
 * @see docs/reference/jefit/screenshots/03-plans/
 */

import { FlashList } from '@shopify/flash-list';
import { useCallback } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { ScreenContainer } from '@/components/layout';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Ionicons } from '@/components/ui/icon';
import { SimpleTabs } from '@/components/ui/simple-tabs';
import { Text } from '@/components/ui/text';
import { DayCard, PlanHeader } from '@/components/workout';
import { Colors } from '@/constants';
import { useWorkoutScreen } from '@/hooks/workout';
import type { PlanDay } from '@/services/database/operations/plans';

export default function WorkoutScreen() {
  const {
    user,
    activePlan,
    planDays,
    selectedDay,
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
    keyExtractor,
  } = useWorkoutScreen();

  const renderDayItem = useCallback(
    ({ item }: { item: PlanDay }) => (
      <DayCard
        day={item}
        exerciseCount={exerciseCounts[item.id] ?? 0}
        isSelected={selectedDay?.id === item.id}
        onPress={handleDayPress}
        onMenuPress={handleDayMenuPress}
      />
    ),
    [exerciseCounts, selectedDay?.id, handleDayPress, handleDayMenuPress]
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

      <SimpleTabs
        tabs={['Overview', 'Day Details']}
        activeIndex={activeTabIndex}
        onChange={setActiveTabIndex}
      />

      {activeTabIndex === 0 ? (
        <View className="flex-1">
          {planDays.length === 0 ? (
            <View className="flex-1 items-center justify-center p-8">
              <Ionicons name="calendar-outline" size={48} color={Colors.foreground.tertiary} />
              <Text className="text-lg font-semibold text-foreground mt-4">
                No workout days yet
              </Text>
              <Text className="text-sm text-foreground-secondary text-center mt-2">
                Add your first workout day to get started
              </Text>
              <Button className="mt-6" onPress={handleAddDayPress}>
                <Text className="text-white font-medium">+ Add a day</Text>
              </Button>
            </View>
          ) : (
            <FlashList
              data={planDays}
              renderItem={renderDayItem}
              keyExtractor={keyExtractor}
              ListHeaderComponent={<View style={{ height: 12 }} />}
              ListFooterComponent={
                <Pressable onPress={handleAddDayPress} className="flex-row items-center mx-4 py-3">
                  <View
                    className="w-8 h-8 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: Colors.primary.DEFAULT }}
                  >
                    <Ionicons name="add" size={20} color="white" />
                  </View>
                  <Text className="text-primary font-medium">Add a day</Text>
                </Pressable>
              }
            />
          )}
        </View>
      ) : (
        <View className="flex-1">
          {!selectedDay ? (
            <View className="flex-1 items-center justify-center p-8">
              <Ionicons name="list-outline" size={48} color={Colors.foreground.tertiary} />
              <Text className="text-lg font-semibold text-foreground mt-4">
                Select a workout day
              </Text>
              <Text className="text-sm text-foreground-secondary text-center mt-2">
                Tap on a day in Overview to see its exercises
              </Text>
            </View>
          ) : (
            <View className="flex-1 p-4">
              <View className="flex-row items-center justify-between mb-4">
                <View>
                  <Text className="text-lg font-semibold text-foreground">{selectedDay.name}</Text>
                  <Text className="text-sm text-foreground-secondary">
                    {exerciseCounts[selectedDay.id] ?? 0} exercises
                  </Text>
                </View>
              </View>

              <View className="flex-1 items-center justify-center">
                <Pressable
                  onPress={() => console.log('Add exercise')}
                  className="bg-background-surface border border-background-elevated rounded-xl p-4 w-full"
                >
                  <View className="flex-row items-center">
                    <View
                      className="w-12 h-12 rounded-full items-center justify-center mr-3"
                      style={{ backgroundColor: Colors.primary.DEFAULT + '20' }}
                    >
                      <Ionicons name="add" size={24} color={Colors.primary.DEFAULT} />
                    </View>
                    <View>
                      <Text className="text-base font-medium text-foreground">Add Exercise</Text>
                      <Text className="text-sm text-foreground-secondary">
                        sets x reps • interval
                      </Text>
                    </View>
                  </View>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      )}

      {canStartWorkout && (
        <View className="absolute bottom-6 right-4">
          <Button
            className="rounded-full px-6 py-3 shadow-lg"
            style={{ backgroundColor: Colors.primary.DEFAULT }}
            onPress={() => console.log('Start workout')}
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
