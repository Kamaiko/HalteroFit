/**
 * ExpandedDayHeader - Sticky header for expanded day in workout timeline
 *
 * Rendered as a direct ScrollView child so `stickyHeaderIndices` can pin it.
 * Contains the header row with animated icon collapse, pill slide-in, menu, and day info.
 */

import { memo, useCallback, useEffect } from 'react';
import { type LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  type SharedValue,
  runOnJS,
  runOnUI,
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
// NOTE: Pill collapse animation mirrored in TimelineDayCard (ghost pill)
const PILL_WIDTH = 110;
const PILL_MARGIN_LEFT = 8;
const CARD_BORDER_RADIUS = 14;
const COLLAPSED_BG = Colors.background.surface;
const EXPANDED_BORDER_COLOR = Colors.border.light;

// ── Props ───────────────────────────────────────────────────────────────
interface ExpandedDayHeaderProps {
  day: PlanDay;
  exerciseCount: number;
  dominantMuscleGroupId?: string | null;
  isActiveWorkout?: boolean;
  onPress: (day: PlanDay) => void;
  onMenuPress: (day: PlanDay) => void;
  onStartWorkout?: () => void;
  scrollY: SharedValue<number>;
}

// ── Component ───────────────────────────────────────────────────────────

export const ExpandedDayHeader = memo(function ExpandedDayHeader({
  day,
  exerciseCount,
  dominantMuscleGroupId,
  isActiveWorkout,
  onPress,
  onMenuPress,
  onStartWorkout,
  scrollY,
}: ExpandedDayHeaderProps) {
  // ── Shared values for animations ──
  // Start as false, delay by one frame via requestAnimationFrame so the UI thread
  // paints the initial state (icon visible) before the collapse animation starts.
  // Without this, useAnimatedStyle's withTiming for the "false" state overlaps
  // with the immediate "true" transition, causing everything to snap.
  const isExpandedSV = useSharedValue(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      isExpandedSV.value = true;
    }, 50);
    return () => clearTimeout(timer);
  }, [isExpandedSV]);

  const pillVisible = exerciseCount > 0 && !isActiveWorkout;
  const pillVisibleSV = useSharedValue(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      pillVisibleSV.value = pillVisible;
    }, 50);
    return () => clearTimeout(timer);
  }, [pillVisible, pillVisibleSV]);

  // ── Sticky detection ──
  // nativeEvent.layout.y gives position within ScrollView content
  const headerOffsetY = useSharedValue(-1);

  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const y = e.nativeEvent.layout.y;
      const sv = headerOffsetY;
      runOnUI(() => {
        // Only set once — position in ScrollView content is stable
        if (sv.value < 0) {
          sv.value = y;
        }
      })();
    },
    [headerOffsetY]
  );

  // ── Muscle icon animation ──
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

  // ── Start Workout pill animation ──
  const pillAnimStyle = useAnimatedStyle(() => {
    const visible = pillVisibleSV.value;
    return {
      opacity: visible
        ? withDelay(DURATION_FAST, withTiming(1, { duration: DURATION_FAST }))
        : withTiming(0, { duration: DURATION_INSTANT }),
      transform: [
        {
          translateX: visible
            ? withDelay(DURATION_FAST, withTiming(0, { duration: DURATION_FAST }))
            : withTiming(20, { duration: DURATION_INSTANT }),
        },
      ],
      width: visible
        ? withDelay(DURATION_FAST, withTiming(PILL_WIDTH, { duration: DURATION_FAST }))
        : withTiming(0, { duration: DURATION_FAST }),
      marginLeft: visible
        ? withDelay(DURATION_FAST, withTiming(PILL_MARGIN_LEFT, { duration: DURATION_FAST }))
        : withTiming(0, { duration: DURATION_FAST }),
      overflow: 'hidden' as const,
    };
  });

  // ── Sticky style (shadow + full border radius when pinned) ──
  const stickyCardStyle = useAnimatedStyle(() => {
    const isSticky = headerOffsetY.value >= 0 && scrollY.value >= headerOffsetY.value - 4;
    if (isSticky) {
      return {
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        borderBottomWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,
      };
    }
    return {
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      borderBottomWidth: 0,
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    };
  });

  // ── Callbacks ──
  const handlePress = useCallback(() => {
    onPress(day);
  }, [day, onPress]);

  // Use RNGH Tap gesture instead of Pressable — native stickyHeaderIndices
  // intercepts touch events before they reach Pressable when the header is pinned.
  const tapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(handlePress)();
  });

  const handleMenuPress = useCallback(() => {
    onMenuPress(day);
  }, [day, onMenuPress]);

  // ── Stats text ──
  const setsDisplay = exerciseCount * DEFAULT_TARGET_SETS;
  const statsText = `${setsDisplay} sets · ${exerciseCount} exercise${exerciseCount !== 1 ? 's' : ''}`;

  return (
    <View style={styles.wrapper} onLayout={handleLayout}>
      <GestureDetector gesture={tapGesture}>
        <Animated.View
          style={[styles.card, isActiveWorkout && styles.cardActiveWorkout, stickyCardStyle]}
          accessibilityRole="button"
          accessibilityLabel={`${day.name}, ${exerciseCount} exercises`}
          accessibilityState={{ expanded: true }}
        >
          {isActiveWorkout && <View style={styles.accentBar} />}

          <Animated.View style={styles.headerRow}>
            {/* Muscle icon — animated width/margin */}
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
            <Animated.View className="flex-1 justify-center">
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

            {/* Start Workout pill — always mounted, animated width/opacity */}
            <Animated.View style={pillAnimStyle}>
              <Pressable
                onPress={onStartWorkout}
                style={styles.startPill}
                className="active:opacity-80"
                accessibilityRole="button"
                accessibilityLabel="Start workout"
                disabled={!pillVisible}
                accessibilityElementsHidden={!pillVisible}
              >
                <Text style={styles.startPillText} numberOfLines={1}>
                  Start Workout
                </Text>
              </Pressable>
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
});

// ── Styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    backgroundColor: Colors.background.DEFAULT,
  },
  card: {
    backgroundColor: COLLAPSED_BG,
    borderRadius: CARD_BORDER_RADIUS,
    borderWidth: 1,
    borderColor: EXPANDED_BORDER_COLOR,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
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
    paddingLeft: 18,
    paddingRight: 14,
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
  startPill: {
    backgroundColor: Colors.primary.DEFAULT,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    flexShrink: 0,
  },
  startPillText: {
    color: Colors.primary.foreground,
    fontSize: 12,
    fontWeight: '700',
  },
});
