# ADR-011: FlashList for All Lists

**Status:** Accepted
**Date:** 2025-10
**Category:** Performance

## Context

Halterofit's exercise library contains 1,300+ entries, each with a thumbnail GIF and metadata. React Native's built-in `FlatList` uses a fixed-size pool of DOM nodes that degrades significantly as scroll distance grows, causing frame drops and OOM crashes on mid-range Android devices. Gym users scroll through the exercise list frequently between sets — jank at that moment is unacceptable.

## Decision

Use FlashList (Shopify) for every scrollable list in the app, including the exercise library, workout history, and plan day views. `FlatList` is not used anywhere in the codebase.

## Consequences

### Benefits

- 54% FPS improvement over FlatList under sustained scrolling
- 82% CPU reduction due to cell recycling (reuses rendered cells instead of mounting new ones)
- 10x faster virtualization — critical for the 1,300+ exercise library on low-end devices
- Eliminates blank-cell flashes common with FlatList on fast scrolls

### Trade-offs

- Adds ~50KB to the JavaScript bundle
- Every list must provide an `estimatedItemSize` prop; omitting it triggers a runtime warning and degrades performance back toward FlatList levels
- Slightly stricter key requirements than FlatList (items must have stable identities)

## References

- Related: [ADR-012](012-expo-image.md) (image caching — pairs with FlashList for fast exercise browsing)
- Docs: https://shopify.github.io/flash-list/
