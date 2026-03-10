/**
 * TimelineDayCard - Accordion day card for the workout timeline
 *
 * Handles both collapsed and expanded states in a single component.
 * Collapsed: muscle icon + day name/stats + menu
 * Expanded: header + exercise list + add exercise button
 *
 * @see docs/_local/mockups/timeline-FINAL-v3.html
 */

import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  type AnimatedRef,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { MuscleGroupIcon } from '@/components/exercises/MuscleGroupIcon';
import { BrandIcon } from '@/components/ui/brand-icon';
import { Ionicons } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import {
  BORDER_RADIUS_LG,
  Colors,
  DEFAULT_TARGET_SETS,
  DURATION_FAST,
  DURATION_INSTANT,
  ICON_SIZE_XS,
  ICON_SIZE_LG,
  ICON_SIZE_3XL,
} from '@/constants';
import { useDragSort } from '@/hooks/workout/useDragSort';
import type { PlanDay, PlanDayWithExercises } from '@/services/database/operations/plans';

import { DayExerciseCard, type DayExercise } from './DayExerciseCard';
import { DragSortableItem } from './DragSortableItem';
import { SwipeableContext, type SwipeableContextValue } from './SwipeableContext';

// ── Constants ───────────────────────────────────────────────────────────
const MUSCLE_ICON_SIZE = ICON_SIZE_3XL; // 64px
const CARD_BORDER_RADIUS = 14;
const COLLAPSED_BG = Colors.background.surface;
const EXPANDED_BORDER_COLOR = Colors.border.light;

// ── Props ───────────────────────────────────────────────────────────────
interface TimelineDayCardProps {
  day: PlanDay;
  exerciseCount: number;
  dominantMuscleGroupId?: string | null;
  isExpanded: boolean;
  exercises: DayExercise[];
  isActiveWorkout?: boolean;

  onPress: (day: PlanDay) => void;
  onMenuPress: (day: PlanDay) => void;
  onStartWorkout?: () => void;
  onAddExercisePress: () => void;
  onExerciseImagePress: (exercise: DayExercise) => void;
  onDeleteExercise?: (exercise: DayExercise) => void;

  deletingExerciseId?: string | null;
  onDeleteAnimationComplete?: () => void;

  // Drag-to-reorder (passed from parent ScrollView)
  scrollRef: AnimatedRef<Animated.ScrollView>;
  scrollY: SharedValue<number>;
  scrollViewBounds: SharedValue<{ top: number; bottom: number }>;
  onReorderExercises: (reordered: PlanDayWithExercises['exercises']) => Promise<void>;
  onScrollEnabledChange: (enabled: boolean) => void;
}

// ── Component ───────────────────────────────────────────────────────────

export const TimelineDayCard = memo(function TimelineDayCard({
  day,
  exerciseCount,
  dominantMuscleGroupId,
  isExpanded,
  exercises,
  isActiveWorkout,
  onPress,
  onMenuPress,
  onStartWorkout,
  onAddExercisePress,
  onExerciseImagePress,
  onDeleteExercise,
  deletingExerciseId,
  onDeleteAnimationComplete,
  scrollRef,
  scrollY,
  scrollViewBounds,
  onReorderExercises,
  onScrollEnabledChange,
}: TimelineDayCardProps) {
  // ── Shared value for icon animation ──
  // Prevents useAnimatedStyle from replaying animations on every re-render
  // (e.g., when returning to the tab triggers a re-render but isExpanded hasn't changed)
  const isExpandedSV = useSharedValue(isExpanded);
  useEffect(() => {
    isExpandedSV.value = isExpanded;
  }, [isExpanded, isExpandedSV]);

  // ── Deferred exercise rendering ──
  // Defer mounting 16+ DayExerciseCards until AFTER the icon width collapse
  // (DURATION_FAST) so the expand animation plays smoothly without JS thread
  // being blocked by card initialization (3 shared values + ReanimatedSwipeable
  // + GIF decode per card). The extra frame (setTimeout 0) after the icon
  // collapse ensures text reflow completes before heavy mounting begins.
  // Reset happens in cleanup (not sync in effect body) to satisfy React Compiler lint.
  const [exercisesReady, setExercisesReady] = useState(false);

  useEffect(() => {
    if (!isExpanded) return;
    const timer = setTimeout(() => setExercisesReady(true), DURATION_FAST + 16);
    return () => {
      clearTimeout(timer);
      setExercisesReady(false);
    };
  }, [isExpanded]);

  // ── Muscle icon animation ──
  // All icon properties animated via shared value (no React state, no LinearTransition).
  // Expand: opacity+translateX fade out (DURATION_FAST), THEN width+margin collapse (delayed).
  // Collapse: width+margin restore immediately, THEN opacity+translateX fade in (delayed).
  // Using shared value ensures animations only trigger when isExpanded actually changes,
  // not on re-renders from tab switches or other state changes.
  const iconAnimStyle = useAnimatedStyle(() => {
    const expanded = isExpandedSV.value;
    return {
      opacity: expanded
        ? withTiming(0, { duration: DURATION_FAST })
        : withDelay(DURATION_INSTANT, withTiming(1, { duration: DURATION_FAST })),
      transform: [
        {
          translateX: expanded
            ? withTiming(-MUSCLE_ICON_SIZE, { duration: DURATION_FAST })
            : withDelay(DURATION_INSTANT, withTiming(0, { duration: DURATION_FAST })),
        },
      ],
      width: expanded
        ? withDelay(DURATION_FAST, withTiming(0, { duration: DURATION_FAST }))
        : withTiming(MUSCLE_ICON_SIZE, { duration: DURATION_FAST }),
      marginRight: expanded
        ? withDelay(DURATION_FAST, withTiming(0, { duration: DURATION_FAST }))
        : withTiming(12, { duration: DURATION_FAST }),
      overflow: 'hidden' as const,
    };
  });

  // ── Swipeable context for exercise cards ────────────────────────────
  const [openSwipeableId, setOpenSwipeableId] = useState<string | null>(null);
  const swipeableCtx = useMemo<SwipeableContextValue>(
    () => ({ openId: openSwipeableId, setOpenId: setOpenSwipeableId }),
    [openSwipeableId]
  );

  // ── Drag-to-reorder ────────────────────────────────────────────────
  const handleDragStart = useCallback(() => {
    setOpenSwipeableId(null); // Close any open swipeable when drag starts
    onScrollEnabledChange(false); // Disable parent scroll during drag
  }, [onScrollEnabledChange]);

  const handleReorderComplete = useCallback(
    (reordered: DayExercise[]) => {
      onScrollEnabledChange(true); // Re-enable scroll after drop
      onReorderExercises(reordered);
    },
    [onReorderExercises, onScrollEnabledChange]
  );

  const dragSort = useDragSort({
    items: exercises,
    onReorder: handleReorderComplete,
    onDragStart: handleDragStart,
    scrollRef,
    scrollY,
    scrollViewBounds,
  });

  const handlePress = useCallback(() => {
    onPress(day);
  }, [day, onPress]);

  const handleMenuPress = useCallback(() => {
    onMenuPress(day);
  }, [day, onMenuPress]);

  const handleAddExercisePress = useCallback(() => {
    setOpenSwipeableId(null);
    onAddExercisePress();
  }, [onAddExercisePress]);

  // ── Stats text ────────────────────────────────────────────────────
  const setsDisplay = exerciseCount * DEFAULT_TARGET_SETS;
  const statsText = `${setsDisplay} sets · ${exerciseCount} exercise${exerciseCount !== 1 ? 's' : ''}`;

  // ── Card style ─────────────────────────────────────────────────────
  const cardStyle = [
    styles.card,
    isExpanded && styles.cardExpanded,
    isActiveWorkout && styles.cardActiveWorkout,
  ];

  return (
    <View style={styles.cardWrapper}>
      <Pressable
        onPress={handlePress}
        style={cardStyle}
        accessibilityRole="button"
        accessibilityLabel={`${day.name}, ${exerciseCount} exercises`}
        accessibilityState={{ expanded: isExpanded }}
      >
        {/* Active workout accent bar (Phase 3 prep) */}
        {isActiveWorkout && <View style={styles.accentBar} />}

        {/* ── Header row ─────────────────────────────────────────── */}
        <Animated.View style={styles.headerRow}>
          {/* Muscle icon — animated width/margin replaces LinearTransition reflow */}
          <Animated.View style={[styles.muscleIconWrapper, iconAnimStyle]}>
            {dominantMuscleGroupId ? (
              <MuscleGroupIcon
                muscleGroupId={dominantMuscleGroupId}
                size={MUSCLE_ICON_SIZE}
                variant="dark"
              />
            ) : (
              <View style={styles.muscleIconFallback}>
                <BrandIcon size={ICON_SIZE_LG} color={Colors.foreground.secondary} />
              </View>
            )}
          </Animated.View>

          {/* Day info */}
          <Animated.View
            className="flex-1 justify-center"
            style={isExpanded ? undefined : styles.infoCollapsed}
          >
            <Text className="text-base font-bold text-foreground" numberOfLines={1}>
              {day.name}
            </Text>
            <View className="flex-row items-center mt-0.5">
              <Ionicons
                name="barbell-outline"
                size={ICON_SIZE_XS}
                color={Colors.foreground.tertiary}
              />
              <Text className="text-xs ml-1" style={{ color: Colors.foreground.tertiary }}>
                {statsText}
              </Text>
            </View>
          </Animated.View>

          {/* Menu "..." — always visible, fixed position */}
          <Pressable
            onPress={handleMenuPress}
            className="p-2 active:opacity-60"
            accessibilityRole="button"
            accessibilityLabel="Day options menu"
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={ICON_SIZE_XS}
              color={Colors.foreground.secondary}
            />
          </Pressable>

          {/* Start Workout pill (expanded only, when has exercises) */}
          {isExpanded && exerciseCount > 0 && !isActiveWorkout && (
            <Pressable
              onPress={onStartWorkout}
              style={styles.startPill}
              className="active:opacity-80"
              accessibilityRole="button"
              accessibilityLabel="Start workout"
            >
              <Text style={styles.startPillText}>Start Workout</Text>
            </Pressable>
          )}
        </Animated.View>
      </Pressable>

      {/* ── Expanded exercise list ─────────────────────────────────── */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          {exercisesReady ? (
            <SwipeableContext.Provider value={swipeableCtx}>
              <View style={styles.exerciseList}>
                {exercises.map((exercise, index) => (
                  <Animated.View
                    key={exercise.id}
                    entering={FadeInDown.delay(index * 20).duration(DURATION_FAST)}
                  >
                    <DragSortableItem index={index} dragSort={dragSort}>
                      <DayExerciseCard
                        exercise={exercise}
                        onImagePress={onExerciseImagePress}
                        onDelete={onDeleteExercise}
                        isDeleting={exercise.id === deletingExerciseId}
                        onDeleteAnimationComplete={onDeleteAnimationComplete}
                      />
                    </DragSortableItem>
                  </Animated.View>
                ))}
              </View>
            </SwipeableContext.Provider>
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
      )}
    </View>
  );
});

// ── Styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  cardWrapper: {
    marginHorizontal: 16,
    marginBottom: 10,
  },
  card: {
    backgroundColor: COLLAPSED_BG,
    borderRadius: CARD_BORDER_RADIUS,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  cardExpanded: {
    borderColor: EXPANDED_BORDER_COLOR,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  cardActiveWorkout: {
    borderColor: Colors.primary.DEFAULT,
    borderWidth: 1.5,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: Colors.primary.DEFAULT,
    zIndex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 8,
    minHeight: 95,
  },
  muscleIconWrapper: {
    width: MUSCLE_ICON_SIZE,
    height: MUSCLE_ICON_SIZE,
    borderRadius: BORDER_RADIUS_LG,
    backgroundColor: Colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  muscleIconFallback: {
    width: MUSCLE_ICON_SIZE,
    height: MUSCLE_ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCollapsed: {
    paddingRight: 8,
  },
  startPill: {
    backgroundColor: Colors.primary.DEFAULT,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    marginRight: 4,
  },
  startPillText: {
    color: Colors.primary.foreground,
    fontSize: 12,
    fontWeight: '700',
  },
  expandedContent: {
    backgroundColor: COLLAPSED_BG,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: EXPANDED_BORDER_COLOR,
    borderBottomLeftRadius: CARD_BORDER_RADIUS,
    borderBottomRightRadius: CARD_BORDER_RADIUS,
  },
  exerciseList: {
    paddingTop: 4,
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
