# ADR-010: Expo Vector Icons

**Status:** Accepted
**Date:** 2025-10
**Category:** UI

## Context

A fitness tracker needs a wide range of icons — navigation, actions, exercise categories, status indicators — and sourcing custom SVGs for each would be slow and inconsistent. Icon libraries exist across the React Native ecosystem, but they vary in quality, bundle impact, and Expo compatibility. A standard solution that ships with the Expo SDK avoids native module complications and ensures the icon set is available without extra EAS Build steps.

## Decision

Use `@expo/vector-icons` for all iconography throughout the app.

## Consequences

### Benefits

- Over 10,000 icons across popular packs (MaterialIcons, Ionicons, FontAwesome, and others), covering virtually all UI needs without custom assets
- Included by default in the Expo SDK — no additional installation, native configuration, or EAS Build required
- Icons render as native font glyphs, which produces crisper results at small sizes compared to rasterized SVGs
- `ICON_SIZE_*` constants in `src/constants/layout.ts` keep icon dimensions consistent across the app

### Trade-offs

- Loading all icon font files adds approximately 500KB to the bundle; unused packs can be excluded to reduce this if bundle size becomes a concern
- Font-based icons are monochrome by default; multi-color or animated icons require a different approach (custom SVG or Lottie)

## References

- Related: [ADR-007](007-nativewind-v4.md)
- Implementation: `src/constants/layout.ts` (`ICON_SIZE_*` constants)
- Docs: https://docs.expo.dev/guides/icons/
