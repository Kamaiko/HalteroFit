# ADR-005: Supabase Backend

**Status:** Accepted
**Date:** 2025-10
**Category:** Data

## Context

Halterofit is a solo developer project with no dedicated backend engineer. Writing and maintaining a custom API server, auth system, and file storage layer would consume development time that needs to go toward the fitness features themselves. A Backend-as-a-Service that provides auth, database, storage, and real-time subscriptions out of the box was needed — one that also integrates naturally with WatermelonDB's sync protocol.

## Decision

Use Supabase as the cloud backend for authentication, PostgreSQL database, file storage, and real-time events.

## Consequences

### Benefits

- No backend server code to write or maintain; auth, RLS, storage, and real-time are provided as managed services
- Row Level Security (RLS) policies enforce data isolation at the database level (`auth.uid() = user_id`), reducing the risk of accidental data leakage
- Generous free tier (500MB database, 50,000 monthly active users) covers the entire MVP phase at zero cost
- PostgreSQL is a standard open-source database; data is portable if Supabase is ever replaced

### Trade-offs

- Vendor lock-in on Supabase-specific features (RLS syntax, `supabase.rpc()`, storage API); migrating away would require rewriting auth and sync layers
- Supabase outages affect cloud sync (local-first architecture means the app continues to work offline, but sync is unavailable)

## References

- Related: [ADR-003](003-watermelondb-offline-first.md) (sync target), [ADR-006](006-rest-api-strategy.md) (API client)
- Docs: https://supabase.com/docs
