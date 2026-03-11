/**
 * DayExerciseCard - Exercise card for Day Details view
 *
 * Shows exercise name, thumbnail, and target sets/reps.
 * Supports swipe-to-reveal for edit and delete actions.
 * Accepts an optional drag handle via prop to include inside the swipeable.
 *
 * Delete animation is manual (shared values) for precise sequencing.
 * Sequence: slide left (200ms) → height collapse (200ms @ 150ms delay).
 */

import { Colors, DURATION_STANDARD, DURATION_FAST, ICON_SIZE_SM } from '@/constants';
import { Ionicons } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { DayExercise } from '@/services/database/operations/plans';
import React, { memo, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { type LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import { SwipeableContext } from './SwipeableContext';
import { SwipeActions } from './SwipeActions';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { ExerciseThumbnail } from './ExerciseThumbnail';
import type { ReactNode } from 'react';

// Sentinel: shared value not animating — height follows natural layout
const ANIM_HEIGHT_AUTO = -1;

export type { DayExercise };

export interface DayExerciseCardProps {
  exercise: DayExercise;
  /** Drag handle node to render inside the swipeable row */
  dragHandle?: ReactNode;
  onImagePress: (exercise: DayExercise) => void;
  onEdit?: (exercise: DayExercise) => void;
  onDelete?: (exercise: DayExercise) => void;
  isDeleting?: boolean;
  onDeleteAnimationComplete?: () => void;
}

export const DayExerciseCard = memo(function DayExerciseCard({
  exercise,
  dragHandle,
  onImagePress,
  onEdit,
  onDelete,
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
  const animHeight = useSharedValue(ANIM_HEIGHT_AUTO);
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

    // Step 1: Slide card off-screen to the left
    translateX.value = withTiming(-500, { duration: DURATION_STANDARD });

    // Step 2: Collapse height + margin (delayed for sequential feel)
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
  }, [isDeleting, cardHeight, onDeleteAnimationComplete]);

  const deletingStyle = useAnimatedStyle(() => {
    if (animHeight.value === ANIM_HEIGHT_AUTO) {
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
    return <SwipeActions onEdit={handleEdit} onDelete={handleDelete} />;
  }, [handleEdit, handleDelete]);

  const muscleText = exercise.exercise.target_muscles.join(', ') || 'No muscle info';

  return (
    <Animated.View style={deletingStyle} onLayout={handleLayout}>
      <ReanimatedSwipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        overshootRight={false}
        friction={1.2}
        rightThreshold={40}
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
          className="mr-4 mb-2 flex-row items-center rounded-xl bg-background-surface py-3 pr-4"
          style={styles.cardContent}
        >
          {/* Drag handle (passed from DragSortableItem) */}
          {dragHandle}

          <ExerciseThumbnail
            imageUrl={exercise.exercise.gif_url}
            targetMuscles={exercise.exercise.target_muscles}
            exerciseId={exercise.exercise.id}
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

// ── Styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  cardContent: {
    paddingLeft: 4, // Tight left padding — drag handle has its own hit area padding
  },
});
