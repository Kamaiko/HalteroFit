# ADR-007: NativeWind v4 Styling

**Status:** Accepted
**Date:** 2025-10
**Category:** UI

## Context

React Native's default `StyleSheet.create()` API produces verbose, co-located style objects that are hard to scan and slow to iterate on during rapid UI development. A solo developer building an MVP needs a styling approach that minimizes context-switching between layout logic and style definitions. Tailwind CSS has become the dominant utility-first approach for web; NativeWind v4 brings that same model to React Native with full CSS interop support in the new architecture.

## Decision

Use NativeWind v4 (Tailwind CSS for React Native) as the primary styling system, with `StyleSheet.create()` only for cases where CSS interop is not supported.

## Consequences

### Benefits

- Utility-first classes keep styles inline with markup, reducing the cognitive overhead of jumping between component and stylesheet definitions
- Tailwind's design token system (spacing scale, color palette, typography) enforces consistency without manual coordination
- Industry-standard approach with extensive documentation and community resources
- NativeWind v4's CSS interop means `Animated.View` and most core RN components accept `className` directly, with no extra wrapper needed

### Trade-offs

- Adds approximately 50KB to the bundle size
- Not all React Native components support `className` (notably `expo-image` and `GestureHandlerRootView` require inline `style` for layout props); always verify interop support before converting
- Developers unfamiliar with Tailwind face an initial learning curve on class names

## References

- Related: [ADR-008](008-react-native-reusables.md) (component library built on NativeWind v4), [ADR-009](009-single-dark-mode.md) (dark theme configured in tailwind.config.ts)
- Implementation: `tailwind.config.ts`, `src/constants/colors.ts`
- Docs: https://www.nativewind.dev/
