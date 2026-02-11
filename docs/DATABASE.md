# Database

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

### Core Tables (Logged Workouts)

| Table             | Purpose                            | Relationships                           |
| ----------------- | ---------------------------------- | --------------------------------------- |
| users             | User profiles and preferences      | → workouts, workout_plans               |
| exercises         | Exercise library (ExerciseDB)      | ← workout_exercises, plan_day_exercises |
| workouts          | Logged workout sessions            | → workout_exercises, ← workout_plans    |
| workout_exercises | Links workouts to exercises        | → exercise_sets                         |
| exercise_sets     | Individual sets within an exercise | (leaf)                                  |

### Workout Plans Tables (v8)

| Table              | Purpose                             | Relationships        |
| ------------------ | ----------------------------------- | -------------------- |
| workout_plans      | Reusable workout templates/routines | → plan_days, ← users |
| plan_days          | Days within a plan (e.g., "Day 1")  | → plan_day_exercises |
| plan_day_exercises | Exercise templates in a day         | ← exercises          |

**Schema SSoT:** `src/services/database/local/schema.ts`

**Cascade Behavior:**

- Deleting a workout cascades to workout_exercises and exercise_sets
- Deleting a workout_plan cascades to plan_days and plan_day_exercises
- Exercises cannot be deleted if referenced by workout_exercises or plan_day_exercises

---

## ExerciseDB Dataset

### Overview

| Attribute | Value                                 |
| --------- | ------------------------------------- |
| Source    | ExerciseDB (Kaggle/GitHub)            |
| Exercises | 1,500+                                |
| Format    | Bundled JSON, seeded on first launch  |
| Content   | GIF URLs, instructions, muscle groups |
| Location  | `assets/data/exercises.json`          |

### Seeding Mechanism

Exercises are loaded into WatermelonDB on first app launch via `initializeExercises()` in the root layout.

**Files:**

- Data: `assets/data/exercises.json`
- Seeding service: `src/services/database/seed/exercises.ts`
- Model: `src/services/database/local/models/Exercise.ts`

**Version tracking:** MMKV stores `exercise_seed_version`. Incrementing `SEED_VERSION` in the seeding service forces a re-import on next app launch.

### Updating the Dataset

**Option 1: Manual download (recommended)**

1. Download from [Kaggle ExerciseDB](https://www.kaggle.com/datasets/exercisedb/fitness-exercises-dataset)
2. Extract and replace `assets/data/exercises.json`
3. Increment `SEED_VERSION` in `src/services/database/seed/exercises.ts`

**Option 2: Kaggle CLI**

```bash
set KAGGLE_API_TOKEN=<your-token>
kaggle datasets download -d exercisedb/fitness-exercises-dataset -p assets/data --unzip --force
```

### Known Limitations

**Broken GIF URLs:** Some exercises have GIF URLs that return 404. This is a CDN issue on ExerciseDB's side, not a dataset age issue. The app displays a placeholder icon when images fail to load.

**Static data:** ExerciseDB updates infrequently. The Kaggle dataset (Dec 2025) is identical to earlier versions.

---

## Working with Database

### Code Location

All database code resides in `src/services/database/`:

| Directory     | Purpose                     |
| ------------- | --------------------------- |
| `local/`      | Schema, models, migrations  |
| `operations/` | Business logic (CRUD)       |
| `remote/`     | Supabase sync, remote types |

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
   - File: `src/services/database/local/schema.ts`
   - Increment version number

3. **Add WatermelonDB migration** (if existing data)
   - File: `src/services/database/local/migrations.ts`

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

| Component           | Location                                    |
| ------------------- | ------------------------------------------- |
| WatermelonDB Schema | `src/services/database/local/schema.ts`     |
| WatermelonDB Models | `src/services/database/local/models/`       |
| Migrations (local)  | `src/services/database/local/migrations.ts` |
| Migrations (cloud)  | `supabase/migrations/`                      |
| Operations (CRUD)   | `src/services/database/operations/`         |

### External Documentation

- [WatermelonDB Docs](https://nozbe.github.io/WatermelonDB/)
- [WatermelonDB Sync Protocol](https://nozbe.github.io/WatermelonDB/Advanced/Sync.html)
- [Supabase PostgreSQL](https://supabase.com/docs/guides/database)
- [Supabase Row-Level Security](https://supabase.com/docs/guides/auth/row-level-security)
