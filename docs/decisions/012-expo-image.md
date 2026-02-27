# ADR-012: expo-image with CachedImage Wrapper

**Status:** Accepted
**Date:** 2025-10
**Category:** Performance

## Context

Each exercise in the library is accompanied by an animated GIF demonstrating proper form. With 1,300+ exercises, the exercise browser renders a high volume of these GIFs as users scroll. React Native's built-in `Image` component has no disk cache — every GIF re-fetches from the network on each mount, which violates the PRD's <200ms image load requirement and causes visible stutter on low-end devices. The app must also work fully offline, so images viewed once must be available without a connection.

## Decision

Use `expo-image` as the image rendering primitive, wrapped in a project-specific `CachedImage` component (`src/components/ui/cached-image.tsx`) that enforces consistent cache policy and sizing across the app.

## Consequences

### Benefits

- Satisfies the PRD <200ms image load requirement for previously-seen images via memory + disk cache
- 10-30x faster than React Native's `Image` component on repeated renders (cache hit path)
- `cachePolicy="memory-disk"` provides offline access to any GIF the user has viewed
- The `CachedImage` wrapper centralizes cache policy — changing strategy app-wide requires one file edit
- Blurhash placeholder support eliminates layout shift while GIFs load

### Trade-offs

- Adds ~100KB to the JavaScript bundle
- `expo-image` does not support NativeWind `className` for layout props (width, height, flex) — these must use inline `style`; converting them to `className` results in zero-size rendering

## References

- Related: [ADR-011](011-flashlist.md) (FlashList — pairs for the exercise browser screen)
- Implementation: `src/components/ui/cached-image.tsx`
- Docs: https://docs.expo.dev/versions/latest/sdk/image/
