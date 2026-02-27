# ADR-017: TypeScript Strict Mode

**Status:** Accepted
**Date:** 2025-10
**Category:** Platform

## Context

React Native's JavaScript runtime provides no type safety at execution time — type errors surface as crashes or silent misbehavior in production. On a solo-developer project without a second reviewer, the compiler is the primary quality gate. Disabling or weakening TypeScript's strict checks trades short-term convenience for a growing class of bugs that only appear at runtime, on a device, often in a user's hands. Given WatermelonDB's observable/reactive model and Zustand's generic store pattern, precise types also significantly reduce the chance of incorrect state shapes propagating through the app.

## Decision

Enable TypeScript strict mode (`"strict": true` in `tsconfig.json`) across the entire codebase. The `any` type is disallowed by project convention. All service functions, hooks, and components carry explicit return types where inference is ambiguous.

## Consequences

### Benefits

- Catches null-dereference, unchecked union, and incorrect argument errors at compile time instead of runtime
- Substantially improves IDE experience — autocomplete, go-to-definition, and safe refactoring work reliably with precise types
- Types serve as inline documentation: function signatures communicate intent without prose comments
- Aligns with React Native and Expo community standards, making the codebase approachable for future contributors
- Encourages the `Result`-based validator pattern (used throughout `src/utils/validators/`) rather than implicit `undefined` returns

### Trade-offs

- Initial setup cost is higher — some third-party libraries have incomplete or incorrect type definitions requiring workarounds
- `ReturnType<typeof fn>` is preferred over hand-written return-type interfaces to avoid duplication and maintenance drift
- Strict null checks occasionally require extra local variable extraction to preserve type narrowing inside callbacks (a TypeScript closure narrowing limitation)

## References

- Related: [ADR-019](019-eslint-prettier.md) (ESLint — enforces the `no-explicit-any` rule at the linter level)
- Implementation: `tsconfig.json`
- Docs: https://www.typescriptlang.org/tsconfig#strict
