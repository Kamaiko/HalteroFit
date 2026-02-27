# ADR-002: Three-Tier Testing Strategy

**Status:** Accepted
**Date:** 2025-10
**Category:** Platform

## Context

WatermelonDB's sync protocol relies on `_changed` and `_status` columns that only exist in real SQLite — the in-memory LokiJS adapter used in Jest does not replicate them. This means no single test environment covers all layers: fast unit feedback requires an in-memory adapter, while sync correctness requires a real device. A deliberate three-tier strategy is needed to match the right tool to each layer of risk.

## Decision

Adopt a three-tier testing strategy: Jest with LokiJS for unit tests, manual E2E on a real device for Phase 1, and Maestro automated flows from Phase 3 onward.

## Consequences

### Benefits

- Jest + LokiJS runs in under 10 seconds, giving fast feedback on hooks, validators, and service logic
- Manual E2E validates the WatermelonDB sync protocol against real SQLite before committing to automation
- Maestro covers critical user flows (auth, workout logging) automatically once the app stabilizes in Phase 3
- Risk-based density keeps the test suite lean: high-risk data paths get thorough coverage, framework glue is skipped

### Trade-offs

- The sync protocol (`_changed`, `_status` columns) cannot be validated in Jest; it requires a real device or simulator
- Manual E2E is not repeatable under CI — gaps exist until Maestro is introduced in Phase 3
- Maintaining two distinct test environments (LokiJS and real SQLite) adds setup complexity

## References

- Related: [ADR-003](003-watermelondb-offline-first.md) (source of the SQLite constraint)
- Docs: [../TESTING.md](../TESTING.md)
