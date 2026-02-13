/**
 * WorkoutList - Optimized FlashList Wrapper for Workouts
 *
 * Performance-optimized list component using FlashList for recycling.
 * Configured specifically for workout items with proper memoization.
 *
 * Configuration:
 * - estimatedItemSize: 88px (based on WorkoutListItem height)
 * - Memoized renderItem and keyExtractor
 * - Supports empty state
 * - Supports loading state
 *
 * Usage:
 *   <WorkoutList
 *     workouts={workouts}
 *     onWorkoutPress={(workout) => router.push(`/workout/${workout.id}`)}
 *     emptyMessage="No workouts yet"
 *   />
 *
 * Future enhancements (Phase 2):
 * - Swipe actions (Repeat, Delete)
 * - Pull-to-refresh
 * - Pagination with WatermelonDB .observe()
 * - Filters (date range, nutrition phase)
 */

import { useCallback } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import type { Workout } from '@/services/database/remote/types';
import { WorkoutListItem } from './WorkoutListItem';

interface WorkoutListProps {
  /**
   * Array of workouts to display
   */
  workouts: Workout[];

  /**
   * Callback when a workout is pressed
   * Optional - list items are not pressable if omitted
   */
  onWorkoutPress?: (workout: Workout) => void;

  /**
   * Loading state (shows spinner)
   */
  loading?: boolean;

  /**
   * Empty state message
   * Default: "No workouts yet. Start your first workout!"
   */
  emptyMessage?: string;
}

/**
 * Empty state component
 */
function EmptyState({ message }: { message: string }) {
  return (
    <View className="flex-1 items-center justify-center p-8 min-h-[400px]">
      <Text className="text-6xl mb-4">💪</Text>
      <Text className="text-lg font-semibold text-foreground text-center mb-2">{message}</Text>
      <Text className="text-sm text-foreground-secondary text-center">
        Track your progress and reach your goals
      </Text>
    </View>
  );
}

/**
 * Loading state component
 */
function LoadingState() {
  return (
    <View className="flex-1 items-center justify-center p-8 min-h-[400px]">
      <ActivityIndicator size="large" color="#8A2BE2" />
      <Text className="text-sm text-foreground-secondary mt-4">Loading workouts...</Text>
    </View>
  );
}

/**
 * WorkoutList Component
 *
 * Optimized FlashList wrapper for displaying workout history.
 * Uses FlashList for efficient recycling with 100+ items.
 */
export function WorkoutList({
  workouts,
  onWorkoutPress,
  loading = false,
  emptyMessage = 'No workouts yet. Start your first workout!',
}: WorkoutListProps) {
  /**
   * Memoized renderItem to prevent re-creation on every render
   * CRITICAL for FlashList performance
   */
  const renderItem = useCallback(
    ({ item }: { item: Workout }) => {
      return <WorkoutListItem item={item} onPress={onWorkoutPress} />;
    },
    [onWorkoutPress]
  );

  /**
   * Memoized keyExtractor to prevent re-creation on every render
   * CRITICAL for FlashList performance
   */
  const keyExtractor = useCallback((item: Workout) => item.id, []);

  // Loading state
  if (loading) {
    return <LoadingState />;
  }

  // Empty state
  if (workouts.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <FlashList
      data={workouts}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      showsVerticalScrollIndicator={false}
      // FIXME: Remove @ts-expect-error when @shopify/flash-list types include estimatedItemSize
      // See: https://shopify.github.io/flash-list/docs/usage#estimateditemsize
      // @ts-expect-error FlashList v2.0.2 supports this prop but types are incomplete
      estimatedItemSize={88}
      // NOTE: contentContainerStyle doesn't work reliably with FlashList
      // Use wrapper View or ListHeaderComponent/ListFooterComponent instead
      ListFooterComponent={<View className="h-4" />}
    />
  );
}
