# ADR-014: Zustand for Global State Management

**Status:** Accepted
**Date:** 2025-10
**Category:** State

## Context

The app needs to share a small amount of state across unrelated components — primarily the authenticated user session and the currently-active workout (for a future active-session overlay). React's built-in Context API incurs unnecessary re-renders at scale, while Redux carries significant boilerplate and a ~20KB runtime cost that is disproportionate for a solo-developer MVP. The majority of persistent, relational data already lives in WatermelonDB; global state management only needs to cover ephemeral in-memory state with optional persistence.

## Decision

Use Zustand for all global state. Auth state and workout session state are each maintained in a dedicated Zustand store, persisted to MMKV via the `zustandStorage` adapter (`src/services/storage/zustandStorage.ts`).

## Consequences

### Benefits

- Minimal runtime footprint (~1KB vs Redux at ~20KB) — appropriate for MVP scope
- Excellent TypeScript support with no ceremony: store shape and actions are typed by inference
- No Provider wrapping required — stores are accessed as plain React hooks anywhere in the tree
- `persist()` middleware paired with the MMKV adapter gives instant synchronous rehydration on app launch
- Simple enough for a solo developer to hold the entire state model in their head

### Trade-offs

- Smaller ecosystem than Redux — fewer middleware options, less community tooling (devtools are basic compared to Redux DevTools)
- No built-in support for derived/computed state (selectors must be written manually or via `zustand/middleware`)
- If global state needs grow substantially post-MVP, migration cost to a more structured solution exists

## References

- Related: [ADR-004](004-mmkv-encrypted-storage.md) (MMKV — provides the persistence layer for Zustand stores)
- Implementation: `src/stores/`, `src/services/storage/zustandStorage.ts`
- Docs: https://docs.pmnd.rs/zustand
