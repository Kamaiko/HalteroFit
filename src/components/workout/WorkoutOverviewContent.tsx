/**
 * WorkoutOverviewContent - Overview tab content for workout screen
 *
 * Displays list of workout days with drag-to-reorder and add day functionality.
 */

import DraggableFlatList, {
  type RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { memo, useCallback } from 'react';
import { Pressable, View } from 'react-native';

import { EmptyState } from '@/components/ui';
import { Ionicons } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants';
import type { PlanDay } from '@/services/database/operations/plans';

import { DayCard } from './DayCard';

export interface WorkoutOverviewContentProps {
  planDays: PlanDay[];
  exerciseCounts: Record<string, number>;
  dominantMuscleGroups: Record<string, string | null>;
  selectedDayId?: string;
  onDayPress: (day: PlanDay) => void;
  onDayMenuPress: (day: PlanDay) => void;
  onAddDayPress: () => void;
  onReorder: (reorderedDays: PlanDay[]) => void;
}

export const WorkoutOverviewContent = memo(function WorkoutOverviewContent({
  planDays,
  exerciseCounts,
  dominantMuscleGroups,
  selectedDayId,
  onDayPress,
  onDayMenuPress,
  onAddDayPress,
  onReorder,
}: WorkoutOverviewContentProps) {
  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<PlanDay>) => (
      <ScaleDecorator>
        <DayCard
          day={item}
          exerciseCount={exerciseCounts[item.id] ?? 0}
          dominantMuscleGroupId={dominantMuscleGroups[item.id] ?? null}
          isSelected={selectedDayId === item.id}
          onPress={onDayPress}
          onMenuPress={onDayMenuPress}
          drag={drag}
          isActive={isActive}
        />
      </ScaleDecorator>
    ),
    [exerciseCounts, dominantMuscleGroups, selectedDayId, onDayPress, onDayMenuPress]
  );

  const keyExtractor = useCallback((item: PlanDay) => item.id, []);

  if (planDays.length === 0) {
    return (
      <EmptyState
        icon="calendar-outline"
        title="No workout days yet"
        subtitle="Add your first workout day to get started"
        action={{ label: '+ Add a day', onPress: onAddDayPress }}
      />
    );
  }

  return (
    <View className="flex-1">
      <DraggableFlatList
        data={planDays}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onDragEnd={({ data }) => onReorder(data)}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
        ListFooterComponent={
          <Pressable onPress={onAddDayPress} className="flex-row items-center mx-4 ml-16 py-3">
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
    </View>
  );
});
