/**
 * TimelineDayCard - Collapsed day card for the workout timeline
 *
 * Shows muscle icon + day name/stats + menu button.
 * When `wasExpanded` is true (card just collapsed), plays the reverse icon
 * reappear animation. Otherwise renders statically (initial load).
 *
 * @see docs/_local/mockups/timeline-FINAL-v3.html
 */

import { memo, useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
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
import type { PlanDay } from '@/services/database/operations/plans';

// ── Constants ───────────────────────────────────────────────────────────
const MUSCLE_ICON_SIZE = ICON_SIZE_3XL; // 64px
const CARD_BORDER_RADIUS = 14;
const COLLAPSED_BG = Colors.background.surface;

// ── Props ───────────────────────────────────────────────────────────────
interface TimelineDayCardProps {
  day: PlanDay;
  exerciseCount: number;
  dominantMuscleGroupId?: string | null;
  isActiveWorkout?: boolean;
  wasExpanded?: boolean;
  onPress: (day: PlanDay) => void;
  onMenuPress: (day: PlanDay) => void;
}

// ── Component ───────────────────────────────────────────────────────────

export const TimelineDayCard = memo(function TimelineDayCard({
  day,
  exerciseCount,
  dominantMuscleGroupId,
  isActiveWorkout,
  wasExpanded,
  onPress,
  onMenuPress,
}: TimelineDayCardProps) {
  // ── Collapse animation (reverse of expand) ──
  // When wasExpanded=true, start with icon collapsed (isExpandedSV=true),
  // then animate to false → icon reappears. When wasExpanded=false, static.
  const isExpandedSV = useSharedValue(wasExpanded ? true : false);

  useEffect(() => {
    if (!wasExpanded) return;
    const timer = setTimeout(() => {
      isExpandedSV.value = false;
    }, 16);
    return () => clearTimeout(timer);
  }, [wasExpanded, isExpandedSV]);

  const iconAnimStyle = useAnimatedStyle(() => {
    if (!isExpandedSV.value) {
      // Collapsed state — icon visible
      return wasExpanded
        ? {
            opacity: withDelay(DURATION_INSTANT, withTiming(1, { duration: DURATION_FAST })),
            transform: [
              {
                translateX: withDelay(
                  DURATION_INSTANT,
                  withTiming(0, { duration: DURATION_FAST })
                ),
              },
            ],
            width: withTiming(MUSCLE_ICON_SIZE, { duration: DURATION_FAST }),
            marginRight: withTiming(12, { duration: DURATION_FAST }),
            overflow: 'hidden' as const,
          }
        : {
            // Static — no animation
            opacity: 1,
            transform: [{ translateX: 0 }],
            width: MUSCLE_ICON_SIZE,
            marginRight: 12,
            overflow: 'hidden' as const,
          };
    }
    // Expanded state (icon hidden) — only reached when wasExpanded=true on mount
    return {
      opacity: withTiming(0, { duration: DURATION_FAST }),
      transform: [{ translateX: withTiming(-MUSCLE_ICON_SIZE, { duration: DURATION_FAST }) }],
      width: withDelay(DURATION_FAST, withTiming(0, { duration: DURATION_FAST })),
      marginRight: withDelay(DURATION_FAST, withTiming(0, { duration: DURATION_FAST })),
      overflow: 'hidden' as const,
    };
  });

  const handlePress = useCallback(() => {
    onPress(day);
  }, [day, onPress]);

  const handleMenuPress = useCallback(() => {
    onMenuPress(day);
  }, [day, onMenuPress]);

  // ── Stats text ──
  const setsDisplay = exerciseCount * DEFAULT_TARGET_SETS;
  const statsText = `${setsDisplay} sets · ${exerciseCount} exercise${exerciseCount !== 1 ? 's' : ''}`;

  const cardStyle = [styles.card, isActiveWorkout && styles.cardActiveWorkout];

  return (
    <View style={styles.cardWrapper}>
      <Pressable
        onPress={handlePress}
        style={cardStyle}
        accessibilityRole="button"
        accessibilityLabel={`${day.name}, ${exerciseCount} exercises`}
        accessibilityState={{ expanded: false }}
      >
        {isActiveWorkout && <View style={styles.accentBar} />}

        <Animated.View style={styles.headerRow}>
          {/* Muscle icon — animated when wasExpanded, static otherwise */}
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
          <Animated.View className="flex-1 justify-center" style={styles.infoCollapsed}>
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

          {/* Menu "..." */}
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
        </Animated.View>
      </Pressable>
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
});
