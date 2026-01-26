/**
 * DayCard - Card component for a workout plan day
 *
 * Displays:
 * - Selection indicator (blue bar on left)
 * - Muscle group placeholder icon
 * - Day name
 * - Estimated time & exercise count
 * - Last performed date
 * - Menu button (...)
 * - Navigation arrow
 *
 * @see docs/reference/jefit/screenshots/03-plans/14-workout-overview-full.png
 */

import { memo, useCallback } from 'react';
import { Pressable, View } from 'react-native';

import { Ionicons, MaterialIcons } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants';
import type { PlanDay } from '@/services/database/operations/plans';

interface DayCardProps {
  day: PlanDay;
  exerciseCount: number;
  lastPerformed?: number; // timestamp
  isSelected: boolean;
  onPress: (day: PlanDay) => void;
  onMenuPress: (day: PlanDay) => void;
}

/**
 * Format relative time (e.g., "1d ago", "3d ago", "Not Started")
 */
function formatLastPerformed(timestamp?: number): string {
  if (!timestamp) return 'Not Started';

  const now = Date.now();
  const diff = now - timestamp;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return '1d ago';
  return `${days}d ago`;
}

/**
 * Estimate workout time based on exercise count
 * Rough estimate: ~5 min per exercise (including rest)
 */
function estimateTime(exerciseCount: number): string {
  if (exerciseCount === 0) return '0m';

  const minutes = exerciseCount * 5;
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h${remainingMinutes}m` : `${hours}h`;
}

export const DayCard = memo(function DayCard({
  day,
  exerciseCount,
  lastPerformed,
  isSelected,
  onPress,
  onMenuPress,
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
      style={{ minHeight: 80 }}
      accessibilityRole="button"
      accessibilityLabel={`${day.name}, ${exerciseCount} exercises`}
    >
      {/* Selection indicator - blue bar */}
      <View
        className="w-1 self-stretch"
        style={{
          backgroundColor: isSelected ? Colors.primary.DEFAULT : 'transparent',
        }}
      />

      {/* Icon placeholder */}
      <View
        className="w-14 h-14 items-center justify-center ml-3 rounded-lg"
        style={{ backgroundColor: Colors.background.elevated }}
      >
        <MaterialIcons name="fitness-center" size={24} color={Colors.foreground.secondary} />
      </View>

      {/* Content */}
      <View className="flex-1 py-3 px-3">
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

        {/* Last performed */}
        <View className="flex-row items-center mt-1">
          <Ionicons name="calendar-outline" size={14} color={Colors.foreground.tertiary} />
          <Text className="text-xs text-foreground-tertiary ml-1">
            {formatLastPerformed(lastPerformed)}
          </Text>
        </View>
      </View>

      {/* Menu button */}
      <Pressable
        onPress={handleMenuPress}
        className="p-3"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="button"
        accessibilityLabel="Day options menu"
      >
        <MaterialIcons name="more-horiz" size={24} color={Colors.foreground.secondary} />
      </Pressable>

      {/* Navigation arrow */}
      <View className="pr-3">
        <Ionicons name="chevron-forward" size={20} color={Colors.foreground.tertiary} />
      </View>
    </Pressable>
  );
});
