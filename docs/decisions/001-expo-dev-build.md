# ADR-001: Expo SDK 54 + Development Build

**Status:** Accepted
**Date:** 2025-10
**Category:** Platform

## Context

Halterofit requires native modules (WatermelonDB, MMKV, Victory Native) that are incompatible with the standard Expo Go sandbox. Starting with Expo Go and migrating later would mean restructuring the entire build pipeline mid-project — a multi-day disruption for a solo developer. Choosing the right build environment on day one is a prerequisite for every other technical decision in the stack.

## Decision

Use Expo SDK 54 with an EAS Development Build from day one, rather than starting with Expo Go and migrating later.

## Consequences

### Benefits

- Expo managed workflow reduces boilerplate and keeps native layer upgrades simple
- Development Build unlocks native modules required by the stack (WatermelonDB, MMKV, Victory Native)
- Hot reload and fast refresh continue to work normally; native rebuilds are only needed when native modules change
- Avoids a costly Expo Go to Development Build migration later in the project lifecycle

### Trade-offs

- Initial setup takes 3-4 hours versus 5 minutes with Expo Go
- Every team member (or CI job) must build and install the dev client before they can run the app
- EAS Build minutes are consumed for each native rebuild

## References

- Related: [ADR-003](003-watermelondb-offline-first.md) (WatermelonDB requires native build), [ADR-004](004-mmkv-encrypted-storage.md) (MMKV requires native build)
- Docs: https://docs.expo.dev/develop/development-builds/introduction/
