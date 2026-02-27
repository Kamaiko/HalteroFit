# ADR-004: MMKV Encrypted Storage

**Status:** Accepted
**Date:** 2025-10
**Category:** Data

## Context

The app needs to persist small, sensitive values — auth tokens, user preferences, session flags — that must be read synchronously at startup without delaying the UI. React Native's built-in AsyncStorage is asynchronous and unencrypted, making it unsuitable for auth tokens and noticeably slower for preference reads that happen on every app launch. A native key-value store with synchronous access and hardware-backed encryption is needed.

## Decision

Use `react-native-mmkv` (v4, Nitro Modules) for all key-value storage, including auth tokens and user preferences.

## Consequences

### Benefits

- 10-30x faster than AsyncStorage for read and write operations
- Native encryption is provided by default (no additional configuration required)
- Synchronous API means preference and token reads happen instantly at startup, with no `await` or loading state
- Type-safe wrapper in `mmkvStorage` (`getString`, `getNumber`, `getBoolean`) prevents accidental type coercion

### Trade-offs

- Requires a Development Build (incompatible with Expo Go — see ADR-001)
- Key-value only: not suitable for structured relational data (WatermelonDB handles that — see ADR-003)
- v4 uses the Nitro Modules API (`createMMKV()` factory) rather than the older `new MMKV()` constructor; documentation examples for older versions do not apply

## References

- Related: [ADR-001](001-expo-dev-build.md), [ADR-003](003-watermelondb-offline-first.md)
- Implementation: `src/services/storage/mmkvStorage.ts`, `src/services/storage/zustandStorage.ts`
- Docs: https://github.com/mrousavy/react-native-mmkv
