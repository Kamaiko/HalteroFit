# ADR-006: REST API Strategy

**Status:** Accepted
**Date:** 2025-10
**Category:** Data

## Context

The app needs a way to communicate between the WatermelonDB sync engine and the Supabase backend. WatermelonDB's sync protocol is built around simple pull and push RPC calls rather than a query language, which makes it a poor fit for GraphQL's strengths. The `supabase-js` client already ships with first-class support for REST and RPC calls, so introducing a GraphQL layer would add schema maintenance and resolver complexity for no architectural gain.

## Decision

Use REST API calls via the `supabase-js` client for all remote data operations, including WatermelonDB sync via `supabase.rpc()`.

## Consequences

### Benefits

- `supabase-js` has native, first-class support for all Supabase services (auth, database, storage, RPC) with no additional setup
- REST + RPC is the right fit for WatermelonDB's pull/push sync pattern, which does not benefit from GraphQL's selective field querying
- Simpler than GraphQL: no schema definition, no resolvers, no codegen step to maintain

### Trade-offs

- REST may overfetch fields compared to GraphQL's precise selection sets, though this is acceptable at mobile-app data volumes
- `supabase.rpc()` calls are tightly coupled to Supabase's PostgREST layer; abstracting them would require a wrapper if the backend ever changes

## References

- Related: [ADR-003](003-watermelondb-offline-first.md), [ADR-005](005-supabase-backend.md)
- Implementation: `src/services/database/remote/sync.ts`
- Docs: https://supabase.com/docs/reference/javascript/rpc
