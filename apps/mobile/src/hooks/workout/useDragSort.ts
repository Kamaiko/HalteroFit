/**
 * useDragSort - Drag-to-reorder logic for exercise cards
 *
 * Pure gesture-handler + reanimated approach (no DraggableFlatList).
 * All drag state lives in shared values on the UI thread.
 * JS thread is only touched on drop (runOnJS → DB persist).
 *
 * Usage: instantiate in TimelineDayCard, pass return value to DragSortableItem wrappers.
 */

import { DURATION_STANDARD } from '@/constants';
import type { DayExercise } from '@/services/database/operations/plans';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef } from 'react';
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
  withTiming,
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
  /** True when translations are being reset after reorder — skip animation */
  isResetting: SharedValue<boolean>;
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
  // Raw gesture translationY (without scroll compensation)
  const dragGestureY = useSharedValue(0);
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
  // True during settle animation after drop — prevents onFinalize from resetting
  const isSettling = useSharedValue(false);
  // True when translations are being reset after reorder — DragSortableItem skips animation
  const isResetting = useSharedValue(false);

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

  // ── Auto-scroll + drag compensation ────────────────────────────────
  // Continuous feedback loop: scrollTo → scrollY changes → reaction re-fires.
  // Also updates dragTranslateY and sibling reflow during auto-scroll
  // (when the finger is still but the content is scrolling).
  useAnimatedReaction(
    () => ({
      active: activeIndex.value,
      absY: dragAbsoluteY.value,
      sy: scrollY.value, // feedback loop: each scrollTo re-triggers this reaction
    }),
    ({ active, absY, sy }) => {
      if (active < 0) return;

      // Keep drag position compensated for scroll changes during auto-scroll
      const scrollDelta = sy - scrollYAtStart.value;
      dragTranslateY.value = dragGestureY.value + scrollDelta;

      // Recompute target slot during auto-scroll (same logic as onUpdate)
      if (itemHeight.value > 0) {
        const totalDisplacement = dragGestureY.value + scrollDelta;
        const draggedSlot = currentOrder.value.indexOf(active);
        const targetSlot = Math.round(active + totalDisplacement / itemHeight.value);
        const clampedTarget = Math.max(0, Math.min(count - 1, targetSlot));

        if (clampedTarget !== draggedSlot) {
          const newOrder = [...currentOrder.value];
          newOrder.splice(draggedSlot, 1);
          newOrder.splice(clampedTarget, 0, active);
          currentOrder.value = newOrder;

          const newTrans = [...translations.value];
          for (let slot = 0; slot < count; slot++) {
            const origIdx = newOrder[slot]!;
            if (origIdx === active) {
              newTrans[origIdx] = 0;
            } else {
              newTrans[origIdx] = (slot - origIdx) * itemHeight.value;
            }
          }
          translations.value = newTrans;
        }
      }

      // Auto-scroll when finger is near viewport edges
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
        scrollTo(scrollRef, 0, Math.max(0, sy + speed), false);
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
          // NOTE: for-loops required — Array.from/fill crash in worklets (UI thread)
          const order: number[] = [];
          const trans: number[] = [];
          for (let i = 0; i < count; i++) {
            order.push(i);
            trans.push(0);
          }
          currentOrder.value = order;
          translations.value = trans;

          isSettling.value = false;
          isResetting.value = false;
          activeIndex.value = index;
          isDragging.value = true;
          dragAbsoluteY.value = e.absoluteY;
          dragGestureY.value = 0;
          dragTranslateY.value = 0;
          scrollYAtStart.value = scrollY.value;

          runOnJS(triggerHaptic)();
          runOnJS(handleDragStart)();
        })
        .onUpdate((e) => {
          // Store raw gesture value for auto-scroll compensation
          dragGestureY.value = e.translationY;
          dragAbsoluteY.value = e.absoluteY;

          // Compensate for scroll changes during drag so the card stays under the finger
          const scrollDelta = scrollY.value - scrollYAtStart.value;
          dragTranslateY.value = e.translationY + scrollDelta;

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
          const finalOrder = [...currentOrder.value];
          const activeIdx = activeIndex.value;
          const targetSlot = currentOrder.value.indexOf(activeIdx);
          const targetTranslateY = (targetSlot - activeIdx) * itemHeight.value;

          isSettling.value = true;

          // Animate dropped card to target slot (card stays "active" during settle)
          dragTranslateY.value = withTiming(
            targetTranslateY,
            { duration: DURATION_STANDARD },
            (finished) => {
              isSettling.value = false;

              // Set dropped card translation for seamless deactivation.
              // Keep sibling translations as-is — they stay visually displaced
              // until React re-renders with the new order, at which point the
              // useEffect resets all translations instantly (isResetting = true).
              const newTrans = [...translations.value];
              newTrans[activeIdx] = targetTranslateY;
              translations.value = newTrans;

              // Deactivate — card switches to translations[activeIdx] = targetY (no snap)
              activeIndex.value = -1;
              isDragging.value = false;
              dragGestureY.value = 0;
              dragTranslateY.value = 0;
              dragAbsoluteY.value = 0;
              scrollYAtStart.value = 0;

              // Persist — triggers React re-render; useEffect handles stale translation cleanup
              if (finished) {
                runOnJS(handleReorder)(finalOrder);
              }
            }
          );
        })
        .onFinalize(() => {
          // Only reset if onEnd didn't already handle it (cancelled or settling)
          if (activeIndex.value >= 0 && !isSettling.value) {
            activeIndex.value = -1;
            isDragging.value = false;
            dragGestureY.value = 0;
            dragTranslateY.value = 0;
            dragAbsoluteY.value = 0;
            scrollYAtStart.value = 0;

            const resetTrans: number[] = [];
            for (let i = 0; i < count; i++) {
              resetTrans.push(0);
            }
            translations.value = resetTrans;
          }
        });
    },
    [
      count,
      activeIndex,
      isDragging,
      dragAbsoluteY,
      dragGestureY,
      dragTranslateY,
      currentOrder,
      translations,
      itemHeight,
      isSettling,
      isResetting,
      scrollY,
      scrollYAtStart,
      triggerHaptic,
      handleDragStart,
      handleReorder,
    ]
  );

  // ── Reset stale translations on items reorder ─────────────────────
  // After handleReorder → React re-render, the swap pair may have stale
  // translations for 1-2 frames. Reset instantly via isResetting flag.
  const prevItemsRef = useRef(items);
  useEffect(() => {
    if (prevItemsRef.current !== items) {
      prevItemsRef.current = items;
      const c = items.length;
      const sv = translations;
      const rv = isResetting;
      runOnUI(() => {
        rv.value = true;
        const reset: number[] = [];
        for (let i = 0; i < c; i++) reset.push(0);
        sv.value = reset;
      })();
    }
  }, [items, translations, isResetting]);

  // ── Layout measurement ──────────────────────────────────────────────
  // Track whether we've already set the uniform height (JS-side flag)
  const heightMeasured = useRef(false);

  const onItemLayout = useCallback(
    (index: number, event: LayoutChangeEvent) => {
      const { height } = event.nativeEvent.layout;

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
    isResetting,
  };
}
