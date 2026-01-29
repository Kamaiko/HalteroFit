/**
 * WorkoutDayDetailsContent - Day Details tab content for workout screen
 *
 * Displays exercises for the selected day with add exercise functionality.
 * Supports drag-to-reorder via react-native-draggable-flatlist.
 */

import DraggableFlatList, {
  type RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { memo, useCallback } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { Ionicons } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants';
import type { PlanDay } from '@/services/database/operations/plans';

import { DayExerciseCard, type DayExercise } from './DayExerciseCard';

export interface WorkoutDayDetailsContentProps {
  selectedDay: PlanDay | null;
  exercises: DayExercise[];
  loading: boolean;
  onAddExercisePress: () => void;
  onExercisePress: (exercise: DayExercise) => void;
  onEditExercise?: (exercise: DayExercise) => void;
  onDeleteExercise?: (exercise: DayExercise) => void;
  onReorder?: (exercises: DayExercise[]) => void;
}

export const WorkoutDayDetailsContent = memo(function WorkoutDayDetailsContent({
  selectedDay,
  exercises,
  loading,
  onAddExercisePress,
  onExercisePress,
  onEditExercise,
  onDeleteExercise,
  onReorder,
}: WorkoutDayDetailsContentProps) {
  // Render item for draggable list
  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<DayExercise>) => (
      <ScaleDecorator>
        <DayExerciseCard
          exercise={item}
          onPress={() => onExercisePress(item)}
          onEdit={onEditExercise}
          onDelete={onDeleteExercise}
          drag={drag}
          isActive={isActive}
        />
      </ScaleDecorator>
    ),
    [onExercisePress, onEditExercise, onDeleteExercise]
  );

  const keyExtractor = useCallback((item: DayExercise) => item.id, []);
  if (!selectedDay) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Ionicons name="list-outline" size={48} color={Colors.foreground.tertiary} />
        <Text className="text-lg font-semibold text-foreground mt-4">Select a workout day</Text>
        <Text className="text-sm text-foreground-secondary text-center mt-2">
          Tap on a day in Overview to see its exercises
        </Text>
      </View>
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
            onPress={onAddExercisePress}
            className="mx-4 mb-2 flex-row items-center rounded-xl bg-background-surface px-4 py-3"
          >
            {/* Spacer to align with exercise cards that have drag handle */}
            <View className="w-4" />
            <View
              className="mr-3 h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: Colors.primary.DEFAULT + '20' }}
            >
              <Ionicons name="add" size={24} color={Colors.primary.DEFAULT} />
            </View>
            <View>
              <Text className="text-base font-medium text-foreground">Add Exercise</Text>
              <Text className="text-sm text-foreground-secondary">sets x reps - interval</Text>
            </View>
          </Pressable>
        }
        ListEmptyComponent={null}
      />
    </View>
  );
});
