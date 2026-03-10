/**
 * TimelineDayCard - Accordion day card for the workout timeline
 *
 * Handles both collapsed and expanded states in a single component.
 * Collapsed: drag handle + muscle icon + day name/stats + menu
 * Expanded: header + exercise list (DraggableFlatList) + add exercise button
 *
 * @see docs/_local/mockups/timeline-FINAL-v3.html
 */

import DraggableFlatList, {
  type RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { memo, useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { MuscleGroupIcon } from '@/components/exercises/MuscleGroupIcon';
import { BrandIcon } from '@/components/ui/brand-icon';
import { Ionicons, MaterialIcons } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import {
  Colors,
  CARD_ACTIVE_STYLE,
  DEFAULT_TARGET_SETS,
  DURATION_FAST,
  DURATION_STANDARD,
  ICON_SIZE_XS,
  ICON_SIZE_MD,
  ICON_SIZE_LG,
  ICON_SIZE_3XL,
} from '@/constants';
import type { PlanDay } from '@/services/database/operations/plans';

import { DayExerciseCard, type DayExercise } from './DayExerciseCard';
import { DragHandle } from './DragHandle';
import { SwipeableContext, type SwipeableContextValue } from './SwipeableContext';

// ── Constants ───────────────────────────────────────────────────────────
const MUSCLE_ICON_SIZE = ICON_SIZE_3XL; // 64px
const CARD_BORDER_RADIUS = 14;
const COLLAPSED_BG = '#1A1A1A';
const EXPANDED_BORDER_COLOR = '#4A5568';
const STAGGER_DELAY = 40;
const MAX_STAGGER = 300;

// ── Props ───────────────────────────────────────────────────────────────
interface TimelineDayCardProps {
  day: PlanDay;
  exerciseCount: number;
  dominantMuscleGroupId?: string | null;
  isExpanded: boolean;
  exercises: DayExercise[];
  loadingExercises: boolean;
  showDragHandle: boolean;
  isActiveWorkout?: boolean;

  onPress: (day: PlanDay) => void;
  onMenuPress: (day: PlanDay) => void;
  onStartWorkout?: () => void;
  onAddExercisePress: () => void;
  onExerciseImagePress: (exercise: DayExercise) => void;
  onEditExercise?: (exercise: DayExercise) => void;
  onDeleteExercise?: (exercise: DayExercise) => void;
  onReorderExercises?: (exercises: DayExercise[]) => void;

  drag?: () => void;
  isActive?: boolean;
  deletingExerciseId?: string | null;
  onDeleteAnimationComplete?: () => void;
}

// ── Helpers ─────────────────────────────────────────────────────────────

// ── Component ───────────────────────────────────────────────────────────

export const TimelineDayCard = memo(function TimelineDayCard({
  day,
  exerciseCount,
  dominantMuscleGroupId,
  isExpanded,
  exercises,
  loadingExercises,
  showDragHandle,
  isActiveWorkout,
  onPress,
  onMenuPress,
  onStartWorkout,
  onAddExercisePress,
  onExerciseImagePress,
  onEditExercise,
  onDeleteExercise,
  onReorderExercises,
  drag,
  isActive,
  deletingExerciseId,
  onDeleteAnimationComplete,
}: TimelineDayCardProps) {
  // ── Swipeable context for exercise cards ────────────────────────────
  const [openSwipeableId, setOpenSwipeableId] = useState<string | null>(null);
  const swipeableCtx = useMemo<SwipeableContextValue>(
    () => ({ openId: openSwipeableId, setOpenId: setOpenSwipeableId }),
    [openSwipeableId]
  );

  // ── Callbacks ──────────────────────────────────────────────────────
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

  // ── Animated styles ────────────────────────────────────────────────
  const muscleIconStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isExpanded ? 0 : 1, { duration: DURATION_FAST }),
    width: withTiming(isExpanded ? 0 : MUSCLE_ICON_SIZE, { duration: DURATION_FAST }),
    overflow: 'hidden' as const,
  }));

  const dragHandleOpacity = useAnimatedStyle(() => ({
    opacity: withTiming(showDragHandle ? 1 : 0, { duration: DURATION_FAST }),
  }));

  // ── Stats text (stable — uses exerciseCount from observable, no flicker) ──
  const setsDisplay = exerciseCount * DEFAULT_TARGET_SETS;
  const statsText = `${setsDisplay} sets · ${exerciseCount} exercise${exerciseCount !== 1 ? 's' : ''}`;

  // ── Exercise list renderItem ───────────────────────────────────────
  const renderExerciseItem = useCallback(
    ({
      item,
      drag: exerciseDrag,
      isActive: exerciseIsActive,
      getIndex,
    }: RenderItemParams<DayExercise>) => {
      const index = getIndex() ?? 0;
      const staggerDelay = Math.min(index * STAGGER_DELAY, MAX_STAGGER);
      return (
        <ScaleDecorator>
          <Animated.View entering={FadeInDown.duration(DURATION_STANDARD).delay(staggerDelay)}>
            <DayExerciseCard
              exercise={item}
              onImagePress={onExerciseImagePress}
              onEdit={onEditExercise}
              onDelete={onDeleteExercise}
              drag={exerciseDrag}
              isActive={exerciseIsActive}
              isDeleting={item.id === deletingExerciseId}
              onDeleteAnimationComplete={onDeleteAnimationComplete}
            />
          </Animated.View>
        </ScaleDecorator>
      );
    },
    [
      onExerciseImagePress,
      onEditExercise,
      onDeleteExercise,
      deletingExerciseId,
      onDeleteAnimationComplete,
    ]
  );

  const exerciseKeyExtractor = useCallback((item: DayExercise) => item.id, []);

  // ── Card style ─────────────────────────────────────────────────────
  const cardStyle = [
    styles.card,
    isExpanded && styles.cardExpanded,
    isActiveWorkout && styles.cardActiveWorkout,
    isActive ? CARD_ACTIVE_STYLE : undefined,
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
        <View style={styles.headerRow}>
          {/* Drag handle — always rendered, opacity controlled */}
          <Animated.View style={[styles.dragHandleWrapper, dragHandleOpacity]}>
            <DragHandle onDrag={showDragHandle ? drag : undefined} />
          </Animated.View>

          {/* Muscle icon — fades out when expanded */}
          <Animated.View style={[styles.muscleIconWrapper, muscleIconStyle]}>
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
          <View
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
          </View>

          {/* Menu "..." — always visible, fixed position */}
          <Pressable
            onPress={handleMenuPress}
            className="p-2 active:opacity-60"
            accessibilityRole="button"
            accessibilityLabel="Day options menu"
          >
            <MaterialIcons
              name="more-horiz"
              size={ICON_SIZE_MD}
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
        </View>
      </Pressable>

      {/* ── Expanded exercise list ─────────────────────────────────── */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          {loadingExercises ? (
            <View className="items-center py-6">
              <ActivityIndicator size="small" color={Colors.primary.DEFAULT} />
            </View>
          ) : (
            <SwipeableContext.Provider value={swipeableCtx}>
              <DraggableFlatList
                data={exercises}
                renderItem={renderExerciseItem}
                keyExtractor={exerciseKeyExtractor}
                onDragEnd={({ data }) => onReorderExercises?.(data)}
                scrollEnabled={false}
                contentContainerStyle={styles.exerciseListContent}
              />
            </SwipeableContext.Provider>
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
    paddingRight: 8,
    minHeight: 95,
  },
  dragHandleWrapper: {
    marginLeft: 8,
    marginRight: 4,
  },
  muscleIconWrapper: {
    height: MUSCLE_ICON_SIZE,
    borderRadius: 12,
    backgroundColor: '#2A2A2A',
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
    color: '#FFFFFF',
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
  exerciseListContent: {
    paddingTop: 4,
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
    borderColor: '#2D3748',
    borderRadius: 10,
  },
});
