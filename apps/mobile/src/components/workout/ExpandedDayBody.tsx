/**
 * ExpandedDayBody - Exercise list for expanded day in workout timeline
 *
 * Rendered as a direct ScrollView child below ExpandedDayHeader.
 * Contains exercise cards with drag-to-reorder, swipe-to-delete, and add exercise button.
 */

import { router } from 'expo-router';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Animated, { type AnimatedRef, FadeInDown, type SharedValue } from 'react-native-reanimated';
import type ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import { Ionicons } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Colors, DURATION_FAST, ICON_SIZE_XS } from '@/constants';
import { useDragSort } from '@/hooks/workout/useDragSort';
import type { PlanDayWithExercises } from '@/services/database/operations/plans';

import { DayExerciseCard, type DayExercise } from './DayExerciseCard';
import { DragSortableItem } from './DragSortableItem';

// ── Constants ───────────────────────────────────────────────────────────
const CARD_BORDER_RADIUS = 14;
const COLLAPSED_BG = Colors.background.surface;
const EXPANDED_BORDER_COLOR = Colors.border.light;

// ── Props ───────────────────────────────────────────────────────────────
interface ExpandedDayBodyProps {
  dayId: string;
  dayName: string;
  exercises: DayExercise[];
  onExerciseImagePress: (exercise: DayExercise) => void;
  onDeleteExercise?: (exercise: DayExercise) => void;
  deletingExerciseId?: string | null;
  onDeleteAnimationComplete?: () => void;
  scrollRef: AnimatedRef<Animated.ScrollView>;
  scrollY: SharedValue<number>;
  scrollViewBounds: SharedValue<{ top: number; bottom: number }>;
  onReorderExercises: (reordered: PlanDayWithExercises['exercises']) => Promise<void>;
}

// ── Component ───────────────────────────────────────────────────────────

export const ExpandedDayBody = memo(function ExpandedDayBody({
  dayId,
  dayName,
  exercises,
  onExerciseImagePress,
  onDeleteExercise,
  deletingExerciseId,
  onDeleteAnimationComplete,
  scrollRef,
  scrollY,
  scrollViewBounds,
  onReorderExercises,
}: ExpandedDayBodyProps) {
  // ── Deferred exercise rendering ──
  const [exercisesReady, setExercisesReady] = useState(false);
  const initialAnimDone = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setExercisesReady(true), DURATION_FAST + 16);
    return () => {
      clearTimeout(timer);
      setExercisesReady(false);
      initialAnimDone.current = false;
    };
  }, []);

  useEffect(() => {
    if (exercisesReady) {
      initialAnimDone.current = true;
    }
  }, [exercisesReady]);

  // ── Swipeable management (ref-based, no context re-renders) ──
  type SwipeableRef = React.ComponentRef<typeof ReanimatedSwipeable>;
  const swipeableRefs = useRef(new Map<string, SwipeableRef>());
  const openIdRef = useRef<string | null>(null);

  const registerSwipeable = useCallback((id: string, ref: SwipeableRef | null) => {
    if (ref) {
      swipeableRefs.current.set(id, ref);
    } else {
      swipeableRefs.current.delete(id);
    }
  }, []);

  const handleSwipeOpen = useCallback((id: string) => {
    const prev = openIdRef.current;
    if (prev && prev !== id) {
      swipeableRefs.current.get(prev)?.close();
    }
    openIdRef.current = id;
  }, []);

  const handleSwipeClose = useCallback((id: string) => {
    if (openIdRef.current === id) {
      openIdRef.current = null;
    }
  }, []);

  const dismissSwipeables = useCallback(() => {
    if (openIdRef.current) {
      swipeableRefs.current.get(openIdRef.current)?.close();
      openIdRef.current = null;
    }
  }, []);

  // ── Drag-to-reorder ──
  const handleDragStart = useCallback(() => {
    dismissSwipeables();
  }, [dismissSwipeables]);

  const handleReorderComplete = useCallback(
    (reordered: DayExercise[]) => {
      onReorderExercises(reordered);
    },
    [onReorderExercises]
  );

  const dragSort = useDragSort({
    items: exercises,
    onReorder: handleReorderComplete,
    onDragStart: handleDragStart,
    scrollRef,
    scrollY,
    scrollViewBounds,
  });

  const handleAddExercisePress = useCallback(() => {
    dismissSwipeables();
    router.push({
      pathname: '/exercise/picker',
      params: { dayId, dayName },
    });
  }, [dayId, dayName, dismissSwipeables]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.body}>
        {exercisesReady ? (
          <View style={styles.exerciseList}>
            {/* eslint-disable react-hooks/refs -- one-way animation flag, safe to read during render */}
            {exercises.map((exercise, index) => (
              <Animated.View
                key={exercise.id}
                entering={
                  initialAnimDone.current
                    ? undefined
                    : FadeInDown.delay(index * 20).duration(DURATION_FAST)
                }
              >
                <DragSortableItem index={index} dragSort={dragSort}>
                  {(dragHandle) => (
                    <DayExerciseCard
                      exercise={exercise}
                      dragHandle={dragHandle}
                      onImagePress={onExerciseImagePress}
                      onDelete={onDeleteExercise}
                      isDeleting={exercise.id === deletingExerciseId}
                      onDeleteAnimationComplete={onDeleteAnimationComplete}
                      onSwipeOpen={handleSwipeOpen}
                      onSwipeClose={handleSwipeClose}
                      onDismissSwipeables={dismissSwipeables}
                      registerSwipeable={registerSwipeable}
                    />
                  )}
                </DragSortableItem>
              </Animated.View>
            ))}
            {/* eslint-enable react-hooks/refs */}
          </View>
        ) : (
          exercises.length > 0 && (
            <View style={styles.loadingPlaceholder}>
              <ActivityIndicator size="small" color={Colors.primary.DEFAULT} />
            </View>
          )
        )}

        {/* + Add Exercise */}
        <Pressable
          onPress={handleAddExercisePress}
          style={styles.addExerciseButton}
          className="active:opacity-60"
          accessibilityRole="button"
          accessibilityLabel="Add exercise"
        >
          <Ionicons name="add" size={ICON_SIZE_XS} color={Colors.foreground.tertiary} />
          <Text className="ml-1 text-sm" style={{ color: Colors.foreground.tertiary }}>
            Add Exercise
          </Text>
        </Pressable>
      </View>
    </View>
  );
});

// ── Styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginBottom: 10,
    marginTop: -16, // Overlap to hide subpixel gap with header
  },
  body: {
    backgroundColor: COLLAPSED_BG,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: EXPANDED_BORDER_COLOR,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: CARD_BORDER_RADIUS,
    borderBottomRightRadius: CARD_BORDER_RADIUS,
    paddingTop: 16,
    overflow: 'hidden',
  },
  exerciseList: {
    paddingTop: 4,
    zIndex: 1,
  },
  loadingPlaceholder: {
    alignItems: 'center' as const,
    paddingVertical: 24,
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.border.DEFAULT,
    borderRadius: 10,
  },
});
