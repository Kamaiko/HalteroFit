/**
 * WorkoutDayDetailsContent - Day Details tab content for workout screen
 *
 * Displays exercises for the selected day with add exercise functionality.
 * Supports drag-to-reorder via react-native-draggable-flatlist.
 *
 * Performance: openSwipeableId is managed via React Context to avoid
 * re-rendering all cards when any single swipeable opens/closes.
 */

import DraggableFlatList, {
  type RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { memo, useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { EmptyState } from '@/components/ui';
import { Ionicons } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants';
import type { PlanDay } from '@/services/database/operations/plans';

import { DayExerciseCard, type DayExercise } from './DayExerciseCard';
import { SwipeableContext, type SwipeableContextValue } from './SwipeableContext';

export interface WorkoutDayDetailsContentProps {
  selectedDay: PlanDay | null;
  exercises: DayExercise[];
  loading: boolean;
  onAddExercisePress: () => void;
  onImagePress: (exercise: DayExercise) => void;
  onEditExercise?: (exercise: DayExercise) => void;
  onDeleteExercise?: (exercise: DayExercise) => void;
  onReorder?: (exercises: DayExercise[]) => void;
  deletingExerciseId?: string | null;
  onDeleteAnimationComplete?: () => void;
}

export const WorkoutDayDetailsContent = memo(function WorkoutDayDetailsContent({
  selectedDay,
  exercises,
  loading,
  onAddExercisePress,
  onImagePress,
  onEditExercise,
  onDeleteExercise,
  onReorder,
  deletingExerciseId,
  onDeleteAnimationComplete,
}: WorkoutDayDetailsContentProps) {
  // Track which swipeable card is open (only one at a time)
  const [openSwipeableId, setOpenSwipeableId] = useState<string | null>(null);

  // Stable context value — only changes when openSwipeableId changes
  const swipeableContextValue = useMemo<SwipeableContextValue>(
    () => ({ openId: openSwipeableId, setOpenId: setOpenSwipeableId }),
    [openSwipeableId]
  );

  // Close open swipeable before navigating to add exercise
  const handleAddExercisePress = useCallback(() => {
    setOpenSwipeableId(null);
    onAddExercisePress();
  }, [onAddExercisePress]);

  // Render item for draggable list — NO dependency on openSwipeableId
  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<DayExercise>) => (
      <ScaleDecorator>
        <DayExerciseCard
          exercise={item}
          onImagePress={onImagePress}
          onEdit={onEditExercise}
          onDelete={onDeleteExercise}
          drag={drag}
          isActive={isActive}
          isDeleting={item.id === deletingExerciseId}
          onDeleteAnimationComplete={onDeleteAnimationComplete}
        />
      </ScaleDecorator>
    ),
    [onImagePress, onEditExercise, onDeleteExercise, deletingExerciseId, onDeleteAnimationComplete]
  );

  const keyExtractor = useCallback((item: DayExercise) => item.id, []);
  if (!selectedDay) {
    return (
      <EmptyState
        icon="list-outline"
        title="Select a workout day"
        subtitle="Tap on a day in Overview to see its exercises"
      />
    );
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
      </View>
    );
  }

  return (
    <SwipeableContext.Provider value={swipeableContextValue}>
      <View className="flex-1">
        {/* Day header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-background-elevated">
          <View>
            <Text className="text-lg font-semibold text-foreground">{selectedDay.name}</Text>
            <Text className="text-sm text-foreground-secondary">
              {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* Exercise list with drag-to-reorder */}
        <DraggableFlatList
          data={exercises}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          onDragEnd={({ data }) => onReorder?.(data)}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 160 }}
          ListFooterComponent={
            <Pressable
              onPress={handleAddExercisePress}
              className="mx-4 mb-2 flex-row items-center rounded-xl px-4 py-2"
            >
              <View style={{ width: 20 }} />
              <View
                className="mr-3 h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: Colors.primary.DEFAULT + '20' }}
              >
                <Ionicons name="add" size={22} color={Colors.primary.DEFAULT} />
              </View>
              <Text className="text-base font-medium text-foreground">Add Exercise</Text>
            </Pressable>
          }
          ListEmptyComponent={null}
        />
      </View>
    </SwipeableContext.Provider>
  );
});
