/**
 * useDragSort - Drag-to-reorder logic for exercise cards
 *
 * Pure gesture-handler + reanimated approach (no DraggableFlatList).
 * All drag state lives in shared values on the UI thread.
 * JS thread is only touched on drop (runOnJS → DB persist).
 *
 * Usage: instantiate in TimelineDayCard, pass return value to DragSortableItem wrappers.
 */

import type { DayExercise } from '@/services/database/operations/plans';
import * as Haptics from 'expo-haptics';
import { useCallback, useRef } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { Gesture, type GestureType } from 'react-native-gesture-handler';
import Animated, {
  type AnimatedRef,
  runOnJS,
  runOnUI,
  scrollTo,
  useAnimatedReaction,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

// ── Constants ───────────────────────────────────────────────────────────
const AUTO_SCROLL_EDGE = 80; // px from viewport edge to trigger auto-scroll
const AUTO_SCROLL_MAX_SPEED = 8; // max px per reaction tick
const DRAG_ACTIVATE_DELAY = 150; // ms long-press before pan activates

// ── Types ───────────────────────────────────────────────────────────────

export interface UseDragSortReturn {
  /** Create the Pan gesture for a given item index */
  gestureFactory: (index: number) => GestureType;
  /** Register item layout measurement */
  onItemLayout: (index: number, event: LayoutChangeEvent) => void;
  /** Whether a drag is active (to disable parent scroll + close swipeables) */
  isDragging: SharedValue<boolean>;
  /** Index of the currently dragged item (-1 = none) */
  activeIndex: SharedValue<number>;
  /** TranslateY of the dragged item (follows finger) */
  dragTranslateY: SharedValue<number>;
  /** Per-item translateY offsets for sibling reflow */
  translations: SharedValue<number[]>;
}

interface UseDragSortParams {
  items: DayExercise[];
  onReorder: (reordered: DayExercise[]) => void;
  onDragStart?: () => void;
  scrollRef: AnimatedRef<Animated.ScrollView>;
  scrollY: SharedValue<number>;
  /** Screen-space bounds of the ScrollView viewport [topY, bottomY] */
  scrollViewBounds: SharedValue<{ top: number; bottom: number }>;
}

export function useDragSort({
  items,
  onReorder,
  onDragStart,
  scrollRef,
  scrollY,
  scrollViewBounds,
}: UseDragSortParams): UseDragSortReturn {
  const count = items.length;

  // ── Shared values (UI thread) ───────────────────────────────────────
  const activeIndex = useSharedValue(-1);
  const isDragging = useSharedValue(false);
  const dragTranslateY = useSharedValue(0);
  // Finger's absolute Y on screen (for auto-scroll edge detection)
  const dragAbsoluteY = useSharedValue(0);
  // Scroll offset at drag start (for compensating auto-scroll movement)
  const scrollYAtStart = useSharedValue(0);

  // currentOrder[visualSlot] = originalIndex
  const currentOrder = useSharedValue<number[]>([]);
  // translations[originalIndex] = translateY offset from natural position
  const translations = useSharedValue<number[]>([]);
  // Uniform item height (measured from first item)
  const itemHeight = useSharedValue(0);

  // Y offsets from onLayout (JS-side only)
  const itemOffsetsRef = useRef<number[]>([]);

  // ── JS-side callbacks (called via runOnJS) ────────────────────────────

  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleDragStart = useCallback(() => {
    onDragStart?.();
  }, [onDragStart]);

  const handleReorder = useCallback(
    (orderedIndices: number[]) => {
      const reordered = orderedIndices.map((origIndex) => items[origIndex]!);
      onReorder(reordered);
    },
    [items, onReorder]
  );

  // ── Auto-scroll ─────────────────────────────────────────────────────
  // Uses finger's absolute screen Y to detect proximity to ScrollView edges
  useAnimatedReaction(
    () => ({
      active: activeIndex.value,
      absY: dragAbsoluteY.value,
    }),
    ({ active, absY }) => {
      if (active < 0 || !scrollRef) return;

      const { top, bottom } = scrollViewBounds.value;
      const distFromTop = absY - top;
      const distFromBottom = bottom - absY;

      let speed = 0;
      if (distFromTop < AUTO_SCROLL_EDGE && distFromTop >= 0) {
        speed = -AUTO_SCROLL_MAX_SPEED * (1 - distFromTop / AUTO_SCROLL_EDGE);
      } else if (distFromBottom < AUTO_SCROLL_EDGE && distFromBottom >= 0) {
        speed = AUTO_SCROLL_MAX_SPEED * (1 - distFromBottom / AUTO_SCROLL_EDGE);
      }

      if (speed !== 0) {
        scrollTo(scrollRef, 0, scrollY.value + speed, false);
      }
    }
  );

  // ── Gesture factory ─────────────────────────────────────────────────
  const gestureFactory = useCallback(
    (index: number): GestureType => {
      return Gesture.Pan()
        .activateAfterLongPress(DRAG_ACTIVATE_DELAY)
        .onStart((e) => {
          // Initialize order [0, 1, 2, ...] and translations [0, 0, 0, ...]
          const order: number[] = [];
          const trans: number[] = [];
          for (let i = 0; i < count; i++) {
            order.push(i);
            trans.push(0);
          }
          currentOrder.value = order;
          translations.value = trans;

          activeIndex.value = index;
          isDragging.value = true;
          dragAbsoluteY.value = e.absoluteY;
          dragTranslateY.value = 0;
          scrollYAtStart.value = scrollY.value;

          runOnJS(triggerHaptic)();
          runOnJS(handleDragStart)();
        })
        .onUpdate((e) => {
          // Compensate for scroll changes during drag so the card stays under the finger
          const scrollDelta = scrollY.value - scrollYAtStart.value;
          dragTranslateY.value = e.translationY + scrollDelta;
          dragAbsoluteY.value = e.absoluteY;

          if (itemHeight.value === 0) return;

          // Which visual slot is the dragged item currently in?
          const draggedSlot = currentOrder.value.indexOf(index);
          // Where should it go based on finger movement?
          const totalDisplacement = e.translationY + scrollDelta;
          const targetSlot = Math.round(index + totalDisplacement / itemHeight.value);
          const clampedTarget = Math.max(0, Math.min(count - 1, targetSlot));

          if (clampedTarget !== draggedSlot) {
            // Reorder: move dragged item from draggedSlot to clampedTarget
            const newOrder = [...currentOrder.value];
            newOrder.splice(draggedSlot, 1);
            newOrder.splice(clampedTarget, 0, index);
            currentOrder.value = newOrder;

            // Recompute sibling translations
            const newTrans = [...translations.value];
            for (let slot = 0; slot < count; slot++) {
              const origIdx = newOrder[slot]!;
              if (origIdx === index) {
                newTrans[origIdx] = 0; // dragged item uses dragTranslateY
              } else {
                newTrans[origIdx] = (slot - origIdx) * itemHeight.value;
              }
            }
            translations.value = newTrans;
          }
        })
        .onEnd(() => {
          // Snapshot final order for persistence
          const finalOrder = [...currentOrder.value];
          runOnJS(handleReorder)(finalOrder);
        })
        .onFinalize(() => {
          // Reset all drag state
          activeIndex.value = -1;
          isDragging.value = false;
          dragTranslateY.value = 0;
          dragAbsoluteY.value = 0;
          scrollYAtStart.value = 0;

          const resetTrans: number[] = [];
          for (let i = 0; i < count; i++) {
            resetTrans.push(0);
          }
          translations.value = resetTrans;
        });
    },
    [
      count,
      activeIndex,
      isDragging,
      dragAbsoluteY,
      dragTranslateY,
      currentOrder,
      translations,
      itemHeight,
      scrollY,
      scrollYAtStart,
      triggerHaptic,
      handleDragStart,
      handleReorder,
    ]
  );

  // ── Layout measurement ──────────────────────────────────────────────
  // Track whether we've already set the uniform height (JS-side flag)
  const heightMeasured = useRef(false);

  const onItemLayout = useCallback(
    (index: number, event: LayoutChangeEvent) => {
      const { y, height } = event.nativeEvent.layout;
      itemOffsetsRef.current[index] = y;

      // Use first measured height as the uniform item height.
      // runOnUI avoids React Compiler's immutability check on shared values.
      if (!heightMeasured.current && height > 0) {
        heightMeasured.current = true;
        const h = height;
        const sv = itemHeight;
        runOnUI(() => {
          sv.value = h;
        })();
      }
    },
    [itemHeight]
  );

  return {
    gestureFactory,
    onItemLayout,
    isDragging,
    activeIndex,
    dragTranslateY,
    translations,
  };
}
