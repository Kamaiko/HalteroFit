/**
 * WorkoutListItem - Memoized List Item Component
 *
 * Optimized for FlashList recycling performance.
 * IMPORTANT: No 'key' prop - FlashList handles recycling.
 *
 * Design:
 * - Title + nutrition phase icon
 * - Date + duration
 * - Stats (sets, exercises)
 * - Estimated height: ~88px (matches estimatedItemSize)
 */

import { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { Workout } from '@/services/database/remote/types';

interface WorkoutListItemProps {
  item: Workout;
  onPress?: (workout: Workout) => void;
}

/**
 * Format date to readable string
 * Example: "Jan 30, 2025"
 */
function formatWorkoutDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format duration from seconds to readable string
 * Example: "1h 23m" or "45m"
 */
function formatDuration(seconds?: number): string {
  if (!seconds) return 'Not completed';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * WorkoutListItem Component (Memoized)
 *
 * IMPORTANT: Memoized with memo() to prevent unnecessary re-renders
 * when FlashList recycles items. This is critical for performance.
 */
const WorkoutListItem = memo<WorkoutListItemProps>(({ item, onPress }) => {
  const handlePress = () => {
    onPress?.(item);
  };

  const dateStr = formatWorkoutDate(item.started_at);
  const durationStr = formatDuration(item.duration_seconds);
  const isCompleted = !!item.completed_at;

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={!onPress}
      activeOpacity={0.7}
      className="bg-background-surface border border-background-elevated rounded-2xl p-4 mb-3 mx-4"
    >
      {/* Title + Nutrition Icon */}
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-base font-semibold text-foreground flex-1" numberOfLines={1}>
          {item.title || 'Untitled Workout'}
        </Text>
      </View>

      {/* Date + Duration */}
      <View className="flex-row items-center mb-1">
        <Text className="text-sm text-foreground-secondary">
          {dateStr} • {durationStr}
        </Text>
      </View>

      {/* Status (if not completed) */}
      {!isCompleted && (
        <View className="mt-1">
          <Text className="text-xs text-primary font-medium">In Progress</Text>
        </View>
      )}

      {/* Notes (if present) */}
      {item.notes && (
        <Text className="text-xs text-foreground-tertiary mt-2" numberOfLines={1}>
          {item.notes}
        </Text>
      )}
    </TouchableOpacity>
  );
});

WorkoutListItem.displayName = 'WorkoutListItem';

export { WorkoutListItem };
