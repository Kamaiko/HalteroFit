# Database - Halterofit

This document provides an overview of Halterofit's hybrid database architecture and practical guidance for working with data storage.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tables Overview](#tables-overview)
- [ExerciseDB Dataset](#exercisedb-dataset)
- [Working with Database](#working-with-database)
- [Schema Evolution](#schema-evolution)
- [Performance Guidelines](#performance-guidelines)
- [References](#references)

---

## Architecture Overview

**For complete architecture details:** See [ARCHITECTURE.md § Data Flow](./ARCHITECTURE.md#data-flow)

| Layer   | Technology            | Purpose                              |
| ------- | --------------------- | ------------------------------------ |
| Local   | WatermelonDB (SQLite) | Offline-first, reactive queries      |
| Cloud   | Supabase PostgreSQL   | Sync + RLS + Backup                  |
| Storage | MMKV                  | Auth tokens, preferences (encrypted) |

**Sync Protocol:** Local-first → Background sync when online → Last-write-wins conflict resolution

---

## Tables Overview

| Table             | Purpose                            | Relationships       |
| ----------------- | ---------------------------------- | ------------------- |
| users             | User profiles and preferences      | → workouts          |
| exercises         | Exercise library (ExerciseDB)      | ← workout_exercises |
| workouts          | Workout sessions                   | → workout_exercises |
| workout_exercises | Links workouts to exercises        | → exercise_sets     |
| exercise_sets     | Individual sets within an exercise | (leaf)              |

**Schema SSoT:** `src/services/database/watermelon/schema.ts`

**Cascade Behavior:**

- Deleting a workout cascades to workout_exercises and exercise_sets
- Exercises cannot be deleted if referenced by workout_exercises

---

## ExerciseDB Dataset

**Source:** GitHub ExerciseDB static dataset

| Attribute | Value                                        |
| --------- | -------------------------------------------- |
| Exercises | 1,500+                                       |
| Format    | Static JSON (one-time import)                |
| Content   | Animated GIFs, instructions, muscle groups   |
| Backup    | `docs/archives/exercisedb-full-dataset.json` |

**Field mapping:** See `src/services/database/watermelon/models/Exercise.ts`

---

## Working with Database

### Code Location

All database code resides in `src/services/database/`:

| Directory     | Purpose                  |
| ------------- | ------------------------ |
| `watermelon/` | Schema, models, sync     |
| `operations/` | Business logic (CRUD)    |
| `local/`      | Local database utilities |

### Patterns

- **Reactive queries:** Use `.observe()` for auto-updating UI
- **Batch writes:** Group operations in single `database.write()` call
- **Offline-first:** Write locally, sync in background
- **Lazy loading:** Fetch related data on-demand, not upfront

### Sync Behavior

| Trigger          | Action                               |
| ---------------- | ------------------------------------ |
| App launch       | Sync if internet available           |
| Network restored | Background sync                      |
| Conflict         | Last-write-wins (based on timestamp) |

**Implementation:** `src/services/database/remote/sync.ts`

---

## Schema Evolution

### Migration Workflow

**When changing database schema:**

1. **Create Supabase migration**

   ```bash
   supabase migration new <name>
   ```

2. **Update WatermelonDB schema**
   - File: `src/services/database/watermelon/schema.ts`
   - Increment version number

3. **Add WatermelonDB migration** (if existing data)
   - File: `src/services/database/watermelon/migrations.ts`

4. **Test migration**
   ```bash
   supabase db reset
   ```

**Warning:** Pre-commit hook validates schema version increment

### Type Mapping

| Supabase (PostgreSQL) | WatermelonDB (SQLite) | TypeScript     |
| --------------------- | --------------------- | -------------- |
| TEXT, UUID            | 'string'              | string         |
| BIGINT, INTEGER       | 'number'              | number         |
| BOOLEAN               | 'boolean'             | boolean        |
| JSONB                 | 'string'              | any[] (parsed) |

---

## Performance Guidelines

| Pattern          | Description                               |
| ---------------- | ----------------------------------------- |
| Reactive queries | Use `.observe()` instead of `.fetch()`    |
| Batch writes     | Group operations in single transaction    |
| Pagination       | Use `Q.take(20)` for large lists          |
| Never block UI   | All network operations in background      |
| Index usage      | Ensure indexes on `user_id`, `started_at` |

---

## References

### Schema (Single Source of Truth)

| Component           | Location                                         |
| ------------------- | ------------------------------------------------ |
| WatermelonDB Schema | `src/services/database/watermelon/schema.ts`     |
| WatermelonDB Models | `src/services/database/watermelon/models/`       |
| Migrations (local)  | `src/services/database/watermelon/migrations.ts` |
| Migrations (cloud)  | `supabase/migrations/`                           |

### External Documentation

- [WatermelonDB Docs](https://nozbe.github.io/WatermelonDB/)
- [WatermelonDB Sync Protocol](https://nozbe.github.io/WatermelonDB/Advanced/Sync.html)
- [Supabase PostgreSQL](https://supabase.com/docs/guides/database)
- [Supabase Row-Level Security](https://supabase.com/docs/guides/auth/row-level-security)
