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

import {
  Colors,
  CARD_ACTIVE_STYLE,
  DURATION_STANDARD,
  DURATION_FAST,
  ICON_SIZE_MD,
} from '@/constants';
import { Ionicons } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { PlanDayWithExercises } from '@/services/database/operations/plans';
import React, { memo, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { type LayoutChangeEvent, Pressable, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import { SwipeableContext } from './SwipeableContext';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { DragHandle } from './DragHandle';
import { ExerciseThumbnail } from './ExerciseThumbnail';

export type DayExercise = PlanDayWithExercises['exercises'][number];

export interface DayExerciseCardProps {
  exercise: DayExercise;
  onImagePress: (exercise: DayExercise) => void;
  onEdit?: (exercise: DayExercise) => void;
  onDelete?: (exercise: DayExercise) => void;
  drag?: () => void;
  isActive?: boolean;
  isDeleting?: boolean;
  onDeleteAnimationComplete?: () => void;
}

export const DayExerciseCard = memo(function DayExerciseCard({
  exercise,
  onImagePress,
  onEdit,
  onDelete,
  drag,
  isActive,
  isDeleting,
  onDeleteAnimationComplete,
}: DayExerciseCardProps) {
  const { openId: openSwipeableId, setOpenId: setOpenSwipeableId } = useContext(SwipeableContext);
  const swipeableRef = useRef<React.ComponentRef<typeof ReanimatedSwipeable>>(null);
  const isOpen = useRef(false);

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
    translateX.value = withTiming(-500, { duration: DURATION_STANDARD });

    // Phase 2: Collapse height + margin (delayed for sequential feel)
    animHeight.value = cardHeight;
    animHeight.value = withDelay(DURATION_FAST, withTiming(0, { duration: DURATION_STANDARD }));
    animMargin.value = withDelay(
      DURATION_FAST,
      withTiming(0, { duration: DURATION_STANDARD }, (finished) => {
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

  const handleImagePress = useCallback(() => {
    onImagePress(exercise);
  }, [exercise, onImagePress]);

  // Auto-close this swipeable when another card opens or dismiss is triggered
  useEffect(() => {
    if (openSwipeableId !== exercise.id) {
      swipeableRef.current?.close();
    }
  }, [openSwipeableId, exercise.id]);

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
          <Ionicons name="pencil-outline" size={ICON_SIZE_MD} color={Colors.foreground.DEFAULT} />
        </Pressable>
        {/* Delete button */}
        <Pressable
          onPress={handleDelete}
          className="w-16 items-center justify-center"
          style={{ backgroundColor: Colors.destructive }}
        >
          <Ionicons name="trash-outline" size={ICON_SIZE_MD} color={Colors.primary.foreground} />
        </Pressable>
      </View>
    );
  }, [handleEdit, handleDelete]);

  const muscleText = exercise.exercise.target_muscles.join(', ') || 'No muscle info';

  return (
    <Animated.View style={deletingStyle} onLayout={handleLayout}>
      <ReanimatedSwipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        overshootRight={false}
        friction={1.5}
        rightThreshold={30}
        dragOffsetFromLeftEdge={5}
        dragOffsetFromRightEdge={5}
        overshootFriction={8}
        onSwipeableWillOpen={() => {
          isOpen.current = true;
          setOpenSwipeableId(exercise.id);
        }}
        onSwipeableWillClose={() => {
          if (isOpen.current) {
            isOpen.current = false;
            // Only reset if this card is still the tracked open card
            setOpenSwipeableId((prev) => (prev === exercise.id ? null : prev));
          }
        }}
      >
        <Pressable
          onPress={() => {
            if (openSwipeableId) {
              setOpenSwipeableId(null);
            }
          }}
          className="mx-4 mb-2 flex-row items-center rounded-xl bg-background-surface px-4 py-3"
          style={isActive ? CARD_ACTIVE_STYLE : undefined}
        >
          {drag && (
            <View style={{ marginLeft: -8, marginRight: 4 }}>
              <DragHandle onDrag={drag} />
            </View>
          )}

          <ExerciseThumbnail
            imageUrl={exercise.exercise.gif_url}
            targetMuscles={exercise.exercise.target_muscles}
            onPress={handleImagePress}
          />

          {/* Info */}
          <View className="flex-1">
            <Text className="font-medium text-foreground" numberOfLines={1}>
              {exercise.exercise.name}
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
