/**
 * DragSortableItem - Wrapper that adds drag-to-reorder to an exercise card
 *
 * Renders a DragHandle on the left + children on the right.
 * The handle is wrapped in a GestureDetector (Pan.activateAfterLongPress).
 * Animated style provides: translateY (reflow), scale + shadow (active drag).
 */

import { DURATION_FAST, DURATION_STANDARD } from '@/constants';
import type { ReactNode } from 'react';
import { memo, useCallback } from 'react';
import type { LayoutChangeEvent } from 'react-native';
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
  children: ReactNode;
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

  return (
    <Animated.View style={animatedStyle} onLayout={handleLayout}>
      <Animated.View className="flex-row items-center">
        <GestureDetector gesture={gesture}>
          <Animated.View>
            <DragHandle />
          </Animated.View>
        </GestureDetector>
        <Animated.View className="flex-1">{children}</Animated.View>
      </Animated.View>
    </Animated.View>
  );
});
