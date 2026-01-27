/**
 * WorkoutOverviewContent - Overview tab content for workout screen
 *
 * Displays list of workout days with add day functionality.
 */

import { FlashList } from '@shopify/flash-list';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Ionicons } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants';
import type { PlanDay } from '@/services/database/operations/plans';

import { DayCard } from './DayCard';

export interface WorkoutOverviewContentProps {
  planDays: PlanDay[];
  exerciseCounts: Record<string, number>;
  selectedDayId?: string;
  onDayPress: (day: PlanDay) => void;
  onDayMenuPress: (day: PlanDay) => void;
  onAddDayPress: () => void;
}

export const WorkoutOverviewContent = memo(function WorkoutOverviewContent({
  planDays,
  exerciseCounts,
  selectedDayId,
  onDayPress,
  onDayMenuPress,
  onAddDayPress,
}: WorkoutOverviewContentProps) {
  if (planDays.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Ionicons name="calendar-outline" size={48} color={Colors.foreground.tertiary} />
        <Text className="text-lg font-semibold text-foreground mt-4">No workout days yet</Text>
        <Text className="text-sm text-foreground-secondary text-center mt-2">
          Add your first workout day to get started
        </Text>
        <Button className="mt-6" onPress={onAddDayPress}>
          <Text className="text-white font-medium">+ Add a day</Text>
        </Button>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlashList
        data={planDays}
        renderItem={({ item }) => (
          <DayCard
            day={item}
            exerciseCount={exerciseCounts[item.id] ?? 0}
            isSelected={selectedDayId === item.id}
            onPress={onDayPress}
            onMenuPress={onDayMenuPress}
          />
        )}
        keyExtractor={(item) => item.id}
        // @ts-expect-error estimatedItemSize improves performance but FlashList types are outdated
        estimatedItemSize={80}
        ListHeaderComponent={<View style={{ height: 12 }} />}
        ListFooterComponent={
          <Pressable onPress={onAddDayPress} className="flex-row items-center mx-4 py-3">
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
