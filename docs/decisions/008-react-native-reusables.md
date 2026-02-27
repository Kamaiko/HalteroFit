# ADR-008: React Native Reusables

**Status:** Accepted
**Date:** 2025-10
**Category:** UI

## Context

Building accessible, consistent UI primitives (buttons, inputs, cards, dialogs) from scratch is time-consuming and error-prone, especially around accessibility props and focus management. The web ecosystem has largely solved this with headless component libraries like shadcn/ui, which provides copy-owned source components rather than an opaque dependency. React Native Reusables is a direct port of that model to React Native, and it already uses NativeWind v4 — the styling system already chosen for this project.

## Decision

Use React Native Reusables (the shadcn/ui port for React Native) as the component library foundation. Components are copied into the project source for full customization rather than consumed from a versioned package.

## Consequences

### Benefits

- Pre-built accessible components (Button, Input, Card, Form, Dialog) cover the majority of MVP UI needs without custom work
- Built entirely with NativeWind v4, which is already in the stack — no additional styling system to reconcile
- Source code lives in the project (`src/components/ui/`), giving complete control over customization without waiting for upstream releases
- Class Variance Authority (CVA) provides type-safe variant APIs (e.g., `variant="destructive"`) that catch misuse at compile time

### Trade-offs

- Copying source into the project means upstream bug fixes and improvements must be manually applied
- Adds approximately 50KB to the bundle
- React Native Reusables has a smaller community and less documentation than its web counterpart (shadcn/ui)

## References

- Related: [ADR-007](007-nativewind-v4.md) (required foundation)
- Implementation: `src/components/ui/`
- Docs: https://rnr-docs.vercel.app/
