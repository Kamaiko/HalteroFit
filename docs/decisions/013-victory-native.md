# ADR-013: Victory Native (Skia-Based) for Charts

**Status:** Accepted
**Date:** 2025-10
**Category:** Performance

## Context

Progress tracking is a core value proposition of the app — users need to see strength trends, volume over time, and personal records. Chart libraries that render via the React Native bridge (SVG-based or canvas-based through JS) struggle to maintain 60fps when rendering 1,000+ data points, and gesture support (pinch-to-zoom, crosshair scrubbing) is either absent or sluggish. The app targets users who track long-term progress, so historical datasets will grow significantly.

## Decision

Use Victory Native v41, which renders via React Native Skia directly on the UI thread, bypassing the JS bridge entirely for drawing operations.

## Consequences

### Benefits

- Sustained 60fps rendering with 1,000+ data points — achieved by running draw calls on the UI thread via Skia
- Advanced interaction gestures (zoom, pan, crosshair) work smoothly without JS thread involvement
- Fully themeable: integrates cleanly with the app's dark-only design system (`Colors.*` tokens)
- Consistent API with the wider Victory charting ecosystem

### Trade-offs

- Requires an EAS Development Build — Victory Native v41 cannot run in Expo Go due to its native Skia dependency
- Adds ~200KB to the JavaScript bundle (largest single chart library cost in the stack)
- Victory Native v41 has a distinct API from Victory Native v40 and the web Victory library; documentation can be sparse for newer features

## References

- Related: [ADR-001](001-expo-dev-build.md) (Development Build — prerequisite)
- Implementation: `src/components/charts/`
- Docs: https://commerce.nearform.com/open-source/victory-native/
