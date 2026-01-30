/**
 * DayExerciseCard - Exercise card for Day Details view
 *
 * Shows exercise name, thumbnail, and target sets/reps.
 * Supports swipe-to-reveal for edit and delete actions.
 *
 * Delete animation is manual (shared values) because DraggableFlatList
 * ignores Reanimated's declarative `exiting` and `layout` props.
 * Sequence: slide left (200ms) → height collapse (200ms @ 150ms delay).
 */

import { Colors } from '@/constants';
import { Ionicons } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { PlanDayWithExercises } from '@/services/database/operations/plans';
import { capitalizeWords } from '@/utils';
import { Image } from 'expo-image';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { type LayoutChangeEvent, Pressable, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
  FadeIn,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

export type DayExercise = PlanDayWithExercises['exercises'][number];

export interface DayExerciseCardProps {
  exercise: DayExercise;
  onPress: (exercise: DayExercise) => void;
  onEdit?: (exercise: DayExercise) => void;
  onDelete?: (exercise: DayExercise) => void;
  drag?: () => void;
  isActive?: boolean;
  isDeleting?: boolean;
  onDeleteAnimationComplete?: () => void;
}

export const DayExerciseCard = memo(function DayExerciseCard({
  exercise,
  onPress,
  onEdit,
  onDelete,
  drag,
  isActive,
  isDeleting,
  onDeleteAnimationComplete,
}: DayExerciseCardProps) {
  const [imageError, setImageError] = useState(false);
  const swipeableRef = useRef<React.ComponentRef<typeof ReanimatedSwipeable>>(null);

  // Measured card height for collapse animation
  const [cardHeight, setCardHeight] = useState(0);

  // Shared values for manual delete animation
  const translateX = useSharedValue(0);
  const animHeight = useSharedValue(-1); // -1 = auto (not animating)
  const animMargin = useSharedValue(8); // mb-2 = 8px

  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      if (cardHeight === 0) {
        setCardHeight(e.nativeEvent.layout.height);
      }
    },
    [cardHeight]
  );

  // Trigger delete animation when isDeleting becomes true
  useEffect(() => {
    if (!isDeleting || cardHeight === 0) return;

    // Phase 1: Slide card off-screen to the left
    translateX.value = withTiming(-500, { duration: 200 });

    // Phase 2: Collapse height + margin (delayed for sequential feel)
    animHeight.value = cardHeight;
    animHeight.value = withDelay(150, withTiming(0, { duration: 200 }));
    animMargin.value = withDelay(
      150,
      withTiming(0, { duration: 200 }, (finished) => {
        if (finished && onDeleteAnimationComplete) {
          runOnJS(onDeleteAnimationComplete)();
        }
      })
    );
  }, [isDeleting, cardHeight, onDeleteAnimationComplete, translateX, animHeight, animMargin]);

  const deletingStyle = useAnimatedStyle(() => {
    if (animHeight.value === -1) {
      return { transform: [{ translateX: translateX.value }] };
    }
    return {
      transform: [{ translateX: translateX.value }],
      height: animHeight.value,
      marginBottom: animMargin.value,
      overflow: 'hidden' as const,
    };
  });

  const handlePress = useCallback(() => {
    onPress(exercise);
  }, [exercise, onPress]);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const handleEdit = useCallback(() => {
    swipeableRef.current?.close();
    onEdit?.(exercise);
  }, [exercise, onEdit]);

  const handleDelete = useCallback(() => {
    onDelete?.(exercise);
  }, [exercise, onDelete]);

  // Render right swipe actions (Edit + Delete buttons)
  const renderRightActions = useCallback(() => {
    return (
      <View className="mb-2 mr-4 flex-row items-stretch overflow-hidden rounded-xl">
        {/* Edit button - flat left edge to connect with card */}
        <Pressable
          onPress={handleEdit}
          className="w-16 items-center justify-center"
          style={{ backgroundColor: Colors.background.elevated }}
        >
          <Ionicons name="pencil-outline" size={24} color={Colors.foreground.DEFAULT} />
        </Pressable>
        {/* Delete button */}
        <Pressable
          onPress={handleDelete}
          className="w-16 items-center justify-center"
          style={{ backgroundColor: Colors.destructive }}
        >
          <Ionicons name="trash-outline" size={24} color="white" />
        </Pressable>
      </View>
    );
  }, [handleEdit, handleDelete]);

  const showPlaceholder = !exercise.exercise.gif_url || imageError;
  const muscleText =
    exercise.exercise.target_muscles.map(capitalizeWords).join(', ') || 'No muscle info';

  return (
    <Animated.View entering={FadeIn.duration(200)} style={deletingStyle} onLayout={handleLayout}>
      <ReanimatedSwipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        overshootRight={false}
        friction={2}
      >
        <Pressable
          className="mx-4 mb-2 flex-row items-center rounded-xl bg-background-surface px-4 py-3"
          onPress={handlePress}
          style={isActive ? { transform: [{ scale: 1.02 }], opacity: 0.9 } : undefined}
        >
          {/* Drag Handle */}
          {drag && (
            <Pressable
              onLongPress={drag}
              delayLongPress={100}
              style={{ marginLeft: -8, marginRight: 4, paddingVertical: 8, paddingHorizontal: 4 }}
            >
              <View className="items-center justify-center" style={{ width: 10, height: 16 }}>
                {/* 6-dot grid: 2 columns x 3 rows */}
                <View className="flex-row" style={{ gap: 2 }}>
                  <View
                    className="rounded-full"
                    style={{ width: 3, height: 3, backgroundColor: Colors.background.elevated }}
                  />
                  <View
                    className="rounded-full"
                    style={{ width: 3, height: 3, backgroundColor: Colors.background.elevated }}
                  />
                </View>
                <View className="flex-row" style={{ gap: 2, marginTop: 2 }}>
                  <View
                    className="rounded-full"
                    style={{ width: 3, height: 3, backgroundColor: Colors.background.elevated }}
                  />
                  <View
                    className="rounded-full"
                    style={{ width: 3, height: 3, backgroundColor: Colors.background.elevated }}
                  />
                </View>
                <View className="flex-row" style={{ gap: 2, marginTop: 2 }}>
                  <View
                    className="rounded-full"
                    style={{ width: 3, height: 3, backgroundColor: Colors.background.elevated }}
                  />
                  <View
                    className="rounded-full"
                    style={{ width: 3, height: 3, backgroundColor: Colors.background.elevated }}
                  />
                </View>
              </View>
            </Pressable>
          )}

          {/* Thumbnail */}
          <View
            className="mr-3 h-14 w-14 items-center justify-center overflow-hidden rounded-lg"
            style={{ backgroundColor: Colors.surface.white }}
          >
            {showPlaceholder ? (
              <View className="h-14 w-14 items-center justify-center bg-white">
                <Ionicons name="barbell-outline" size={24} color={Colors.foreground.secondary} />
              </View>
            ) : (
              <Image
                source={{ uri: exercise.exercise.gif_url }}
                style={{ width: 56, height: 56 }}
                contentFit="cover"
                autoplay={false}
                cachePolicy="memory-disk"
                transition={200}
                onError={handleImageError}
              />
            )}
          </View>

          {/* Info */}
          <View className="flex-1">
            <Text className="font-medium text-foreground" numberOfLines={1}>
              {capitalizeWords(exercise.exercise.name)}
            </Text>
            <Text className="mt-0.5 text-sm text-foreground-secondary" numberOfLines={1}>
              {muscleText}
            </Text>
            <Text className="mt-0.5 text-sm text-primary">
              {exercise.target_sets} sets × {exercise.target_reps} reps
            </Text>
          </View>
        </Pressable>
      </ReanimatedSwipeable>
    </Animated.View>
  );
});
