# ADR-015: ExerciseDB Dataset for Exercise Library Content

**Status:** Accepted
**Date:** 2025-10
**Category:** Data

## Context

A fitness tracker without a comprehensive exercise library provides poor out-of-the-box value — users expect to find their exercises immediately without manual entry. Building a proprietary database of 1,000+ exercises with animated GIFs, muscle targeting data, and instructions would require significant content production effort that is outside scope for an MVP. A curated, freely-available dataset removes this bottleneck and lets the product focus on tracking mechanics.

## Decision

Seed the Supabase exercise table from the open-source ExerciseDB dataset (available on GitHub), which contains 1,500+ exercises with professional animated GIFs, step-by-step instructions, primary/secondary muscle targeting, and equipment categorization. The seed is a one-time operation; at runtime the app queries the local WatermelonDB copy seeded from Supabase.

## Consequences

### Benefits

- 1,500+ exercises immediately available at launch with no content production effort
- Professional animated GIFs for every exercise satisfy the PRD requirement for visual form guidance
- Pre-categorized by muscle group, equipment, and body part — enables the muscle-group browser without additional processing
- One-time seed to Supabase means subsequent app installs pull data via the normal WatermelonDB sync, not a separate pipeline
- Local-first architecture means all exercise queries run against SQLite — zero latency after initial sync

### Trade-offs

- License compliance is required before any commercial distribution; the ExerciseDB dataset's license terms must be reviewed and honored (attribution or usage restrictions may apply)
- Dataset quality is community-maintained — some exercises may have inaccurate muscle targeting or suboptimal instructions; curation effort may be needed over time
- GIF hosting relies on ExerciseDB's CDN URLs embedded in the data; long-term availability is not guaranteed and may require migration to self-hosted storage

## References

- Related: [ADR-003](003-watermelondb-offline-first.md) (WatermelonDB — local storage that serves exercise queries at runtime)
- Related: [ADR-005](005-supabase-backend.md) (Supabase — hosts the seeded dataset and serves it during sync)
- Implementation: `src/services/database/seed/`
- Docs: https://v2.exercisedb.io/docs
