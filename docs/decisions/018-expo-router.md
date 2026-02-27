# ADR-018: Expo Router for File-Based Navigation

**Status:** Accepted
**Date:** 2025-10
**Category:** Platform

## Context

React Native navigation has historically required explicit route registration, manual type declarations for navigation params, and bespoke deep-link configuration — all of which add boilerplate that must stay synchronized with the actual screen files. As the app grows to include exercise detail routes, plan editing flows, and auth guards, maintaining that synchronization manually becomes a source of bugs. Expo Router, which wraps React Navigation with a file-system convention, eliminates the registration step and generates type-safe route helpers automatically.

## Decision

Use Expo Router (v6) for all navigation in the app. Screens are files under `src/app/`; route groups (`(app)/`, `(auth)/`, `(tabs)/`) implement auth guards and tab layout without explicit registration. Deep linking is configured automatically by the router based on the file structure.

## Consequences

### Benefits

- File-based routing eliminates the disconnect between screen files and navigation config — adding a file creates a route
- Type-safe navigation params are generated automatically; `router.push('/exercise/123')` and typed params catch route errors at compile time
- Deep linking and Universal Links work out of the box without a separate linking configuration object
- Auth guard pattern (route groups with `_layout.tsx` redirects) is straightforward and co-located with the routes it protects
- Built on React Navigation under the hood — all React Navigation primitives (Stack, Tabs, Modal) are available when needed

### Trade-offs

- Expo Router's file-system conventions add a learning curve compared to configuring React Navigation directly, particularly for nested navigators and route groups
- Some advanced React Navigation patterns (custom navigators, deeply nested `NavigationContainer` configurations) require workarounds within the file-based model
- Tightly coupled to the Expo ecosystem — migrating to bare React Native would require replacing the router entirely

## References

- Related: [ADR-001](001-expo-dev-build.md) (Expo SDK — Expo Router is an Expo-first solution)
- Implementation: `src/app/`
- Docs: https://docs.expo.dev/router/introduction/
