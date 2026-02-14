/**
 * DayCard - Card component for a workout plan day
 *
 * Displays:
 * - Selection indicators (blue left bar + blue border when selected)
 * - Drag handle (long-press to reorder)
 * - Fitness icon placeholder
 * - Day name (vertically centered)
 * - Estimated time & exercise count
 * - Menu button (...)
 *
 * @see docs/reference/jefit/screenshots/03-plans/Jefit_v2_ Overview.png
 */

import { memo, useCallback } from 'react';
import { Pressable, View } from 'react-native';

import { Ionicons, MaterialIcons } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Colors, CARD_ACTIVE_STYLE, MINUTES_PER_EXERCISE } from '@/constants';
import type { PlanDay } from '@/services/database/operations/plans';

import { DragHandle } from './DragHandle';

interface DayCardProps {
  day: PlanDay;
  exerciseCount: number;
  isSelected: boolean;
  onPress: (day: PlanDay) => void;
  onMenuPress: (day: PlanDay) => void;
  drag?: () => void;
  isActive?: boolean;
}

/**
 * Estimate workout time based on exercise count
 */
function estimateTime(exerciseCount: number): string {
  if (exerciseCount === 0) return '0m';

  const minutes = exerciseCount * MINUTES_PER_EXERCISE;
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h${remainingMinutes}m` : `${hours}h`;
}

export const DayCard = memo(function DayCard({
  day,
  exerciseCount,
  isSelected,
  onPress,
  onMenuPress,
  drag,
  isActive,
}: DayCardProps) {
  const handlePress = useCallback(() => {
    onPress(day);
  }, [day, onPress]);

  const handleMenuPress = useCallback(() => {
    onMenuPress(day);
  }, [day, onMenuPress]);

  return (
    <Pressable
      onPress={handlePress}
      className="flex-row items-center bg-background-surface rounded-xl overflow-hidden mb-3 mx-4"
      style={[
        {
          minHeight: 80,
          borderWidth: 2,
          borderColor: isSelected ? Colors.primary.DEFAULT : 'transparent',
        },
        isActive ? CARD_ACTIVE_STYLE : undefined,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${day.name}, ${exerciseCount} exercises`}
    >
      {/* Selection indicator - blue bar (far left edge) */}
      <View
        className="w-1 self-stretch"
        style={{
          backgroundColor: isSelected ? Colors.primary.DEFAULT : 'transparent',
        }}
      />

      {/* Drag handle */}
      <View style={{ marginLeft: 4, marginRight: 4 }}>
        <DragHandle onDrag={drag} />
      </View>

      {/* Icon placeholder */}
      <View
        className="w-14 h-14 items-center justify-center rounded-lg"
        style={{ backgroundColor: Colors.background.elevated }}
      >
        <MaterialIcons name="fitness-center" size={24} color={Colors.foreground.secondary} />
      </View>

      {/* Content - vertically centered */}
      <View className="flex-1 py-3 px-3 justify-center">
        {/* Day name */}
        <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
          {day.name}
        </Text>

        {/* Stats row */}
        <View className="flex-row items-center mt-1">
          <Ionicons name="time-outline" size={14} color={Colors.foreground.tertiary} />
          <Text className="text-sm text-foreground-secondary ml-1">
            Est. {estimateTime(exerciseCount)}
          </Text>
          <Text className="text-sm text-foreground-tertiary mx-2">|</Text>
          <Text className="text-sm text-foreground-secondary">
            {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Menu button */}
      <Pressable
        onPress={handleMenuPress}
        className="p-2 mr-3"
        accessibilityRole="button"
        accessibilityLabel="Day options menu"
      >
        <MaterialIcons name="more-horiz" size={24} color={Colors.foreground.secondary} />
      </Pressable>
    </Pressable>
  );
});
