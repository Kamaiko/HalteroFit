# ADR-011: FlashList + DraggableFlatList for Lists

**Status:** Accepted
**Date:** 2025-10
**Category:** Performance

## Context

Halterofit's exercise library contains 1,300+ entries, each with a thumbnail GIF and metadata. React Native's built-in `FlatList` uses a fixed-size pool of DOM nodes that degrades significantly as scroll distance grows, causing frame drops and OOM crashes on mid-range Android devices. Gym users scroll through the exercise list frequently between sets — jank at that moment is unacceptable. Separately, workout plan editing requires drag-to-reorder for days and exercises, which FlashList does not support.

## Decision

Use FlashList (Shopify) for read-only, performance-critical lists (exercise library, workout history). Use DraggableFlatList (`react-native-draggable-flatlist`) for lists that require drag-to-reorder (plan days, day exercises). No bare `FlatList` is used anywhere in the codebase.

## Consequences

### Benefits

- FlashList: 54% FPS improvement over FlatList under sustained scrolling, 82% CPU reduction via cell recycling, 10x faster virtualization — critical for the 1,300+ exercise library on low-end devices
- FlashList eliminates blank-cell flashes common with FlatList on fast scrolls
- DraggableFlatList provides native drag-to-reorder with haptic feedback, long-press activation, and smooth `ScaleDecorator` animations
- Clear separation: FlashList for read performance, DraggableFlatList for interactivity

### Trade-offs

- FlashList adds ~50KB to the JavaScript bundle; every list must provide an `estimatedItemSize` prop
- DraggableFlatList wraps FlatList internally, so reorderable lists do not benefit from FlashList's cell-recycling — acceptable because reorderable lists are small (≤20 items per plan day or overview)
- Two list primitives to maintain instead of one

## References

- Related: [ADR-012](012-expo-image.md) (image caching — pairs with FlashList for fast exercise browsing)
- Docs: https://shopify.github.io/flash-list/, https://github.com/computerjazz/react-native-draggable-flatlist
