# ADR-003: WatermelonDB Offline-First

**Status:** Accepted
**Date:** 2025-10
**Category:** Data

## Context

Halterofit is used in gym environments where network connectivity is unreliable or absent. The PRD lists offline-first as a top-priority requirement: every core feature must work without any internet connection, with data syncing to the cloud only when a connection is available. A standard REST-only or cloud-first database would fail this requirement at the architecture level, not just at the UX level.

## Decision

Use WatermelonDB as the primary local database, with Supabase as the remote sync target via WatermelonDB's built-in pull/push sync protocol.

## Consequences

### Benefits

- All reads and writes go to local SQLite first, making every feature work completely offline
- Reactive queries via `.observe()` automatically update the UI when underlying data changes, with no manual invalidation
- Built-in sync protocol handles conflict resolution (last-write-wins) without custom merge logic
- Optimized for scale: benchmarked to handle 2,000+ workout records without degradation

### Trade-offs

- Requires a Development Build (incompatible with Expo Go — see ADR-001)
- The sync protocol uses `_changed` and `_status` columns that only exist in real SQLite, making it impossible to integration-test in Jest (see ADR-002)
- WatermelonDB's Model and decorator API has a learning curve compared to plain SQLite or AsyncStorage

## References

- Related: [ADR-001](001-expo-dev-build.md), [ADR-005](005-supabase-backend.md), [ADR-006](006-rest-api-strategy.md)
- Implementation: `src/services/database/local/models/`, `src/services/database/local/`
- Docs: https://nozbe.github.io/WatermelonDB/
