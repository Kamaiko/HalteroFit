/**
 * DragSortableItem - Wrapper that adds drag-to-reorder to an exercise card
 *
 * Passes a drag handle via render prop so the child can place it inside
 * its own layout (e.g., inside a swipeable row).
 * Animated style provides: translateY (reflow), scale + shadow (active drag).
 */

import { DURATION_FAST, DURATION_STANDARD } from '@/constants';
import type { ReactNode } from 'react';
import { memo, useCallback } from 'react';
import { type LayoutChangeEvent, StyleSheet } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { DragHandle } from './DragHandle';
import type { UseDragSortReturn } from '@/hooks/workout/useDragSort';

// ── Constants ───────────────────────────────────────────────────────────
const DRAG_SCALE = 1.03;
const DRAG_SHADOW_OPACITY = 0.15;
const DRAG_SHADOW_RADIUS = 8;
const DRAG_ELEVATION = 8;

// ── Props ───────────────────────────────────────────────────────────────
interface DragSortableItemProps {
  index: number;
  dragSort: UseDragSortReturn;
  /** Render prop: receives the drag handle node to place inside your layout */
  children: (dragHandle: ReactNode) => ReactNode;
}

// ── Component ───────────────────────────────────────────────────────────
export const DragSortableItem = memo(function DragSortableItem({
  index,
  dragSort,
  children,
}: DragSortableItemProps) {
  const { gestureFactory, onItemLayout, activeIndex, dragTranslateY, translations } = dragSort;

  const gesture = gestureFactory(index);

  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      onItemLayout(index, e);
    },
    [index, onItemLayout]
  );

  const animatedStyle = useAnimatedStyle(() => {
    const isActive = activeIndex.value === index;

    if (isActive) {
      return {
        zIndex: 999,
        transform: [
          { scale: withTiming(DRAG_SCALE, { duration: DURATION_FAST }) },
          { translateY: dragTranslateY.value },
        ],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: withTiming(DRAG_SHADOW_OPACITY, { duration: DURATION_FAST }),
        shadowRadius: DRAG_SHADOW_RADIUS,
        elevation: DRAG_ELEVATION,
      };
    }

    // Non-dragged: apply sibling reflow translation
    const ty = translations.value[index] ?? 0;
    return {
      zIndex: 0,
      transform: [
        { scale: withTiming(1, { duration: DURATION_FAST }) },
        { translateY: withTiming(ty, { duration: DURATION_STANDARD }) },
      ],
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: withTiming(0, { duration: DURATION_FAST }),
      shadowRadius: 0,
      elevation: 0,
    };
  });

  // Build the drag handle element for the child to place in its layout
  const dragHandle = (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={handleOffset}
        accessibilityLabel="Reorder exercise"
        accessibilityHint="Long press then drag to reorder"
      >
        <DragHandle />
      </Animated.View>
    </GestureDetector>
  );

  return (
    <Animated.View style={animatedStyle} onLayout={handleLayout}>
      {children(dragHandle)}
    </Animated.View>
  );
});

// Nudge the handle right (away from card edge) and up to align with thumbnail center.
const handleOffset = StyleSheet.create({
  wrapper: { marginTop: -7, marginRight: 6 },
}).wrapper;
