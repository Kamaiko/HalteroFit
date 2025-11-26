# Database Guide - Halterofit

This document covers Halterofit's hybrid database architecture (WatermelonDB + Supabase), schema organization, and practical guidance for working with local and cloud data storage.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Schema Overview](#schema-overview)
- [ExerciseDB Dataset](#exercisedb-dataset)
- [Working with Database](#working-with-database)
- [Schema Evolution](#schema-evolution)
- [Performance Guidelines](#performance-guidelines)
- [References](#references)

## Architecture Overview

### Hybrid Approach

Halterofit uses a two-tier database architecture combining local-first storage with cloud synchronization:

**Local Tier (WatermelonDB)**

- SQLite database via WatermelonDB
- Instant reads/writes without network dependency
- Reactive queries with automatic UI updates
- Runs on user device (offline-capable)

**Cloud Tier (Supabase)**

- PostgreSQL backend with Row-Level Security (RLS)
- Cross-device data synchronization
- Automatic conflict resolution (last-write-wins)
- Backup and data persistence

**Storage (MMKV)**

- Encrypted local storage for auth tokens and preferences
- High-performance key-value storage optimized for mobile

### Sync Strategy

**How it works:**

1. User performs action (create workout, log set) → WatermelonDB writes locally (instant)
2. WatermelonDB marks record as changed
3. When internet available → automatic background sync to Supabase
4. Conflicts resolved via timestamp comparison (last write wins)
5. Remote changes pulled back to local database

**User experience:** All operations work offline. Sync happens transparently in background when connection available.

### Technology Stack

| Component         | Technology          | Purpose                                          |
| ----------------- | ------------------- | ------------------------------------------------ |
| Local Database    | WatermelonDB        | Offline-first reactive database (SQLite wrapper) |
| Cloud Database    | Supabase PostgreSQL | Remote storage + sync + RLS                      |
| Encrypted Storage | MMKV                | Auth tokens, user preferences                    |
| Sync Protocol     | WatermelonDB Sync   | Bidirectional sync with conflict resolution      |

---

## Schema Overview

### Current Version

**WatermelonDB Schema:** v7
**Supabase Migrations:** v5, v6, v7
**ExerciseDB Dataset:** GitHub static import (1,500+ exercises)

### Tables

#### 1. **users**

**Purpose:** User profiles and preferences

**Key Fields:**

- `id` - Auth user reference (UUID)
- `email` - User email address
- `preferred_unit` - Weight preference (kg or lbs)

**Relationships:**

- One user → many workouts

---

#### 2. **exercises** (ExerciseDB)

**Purpose:** Exercise library (1,500+ exercises from GitHub dataset, read-only)

**Key Fields:**

- `id` - Internal UUID
- `exercisedb_id` - GitHub dataset ID (e.g., "trmte8s")
- `name` - Exercise name (e.g., "barbell bench press")
- `body_parts` - Anatomical regions (JSONB array: `["chest"]`)
- `target_muscles` - Primary muscles (JSONB array: `["pectorals"]`)
- `secondary_muscles` - Supporting muscles (JSONB array: `["triceps", "anterior deltoid"]`)
- `equipments` - Required equipment (JSONB array: `["barbell"]`)
- `instructions` - Step-by-step guide (JSONB array)
- `gif_url` - Animated demonstration URL

**Relationships:**

- Exercises are public (no user ownership)
- Referenced by workout_exercises via foreign key

**Note:** This table is populated once from GitHub ExerciseDB dataset and treated as read-only.

---

#### 3. **workouts**

**Purpose:** Workout sessions (start time, completion, duration, notes)

**Key Fields:**

- `id` - Workout UUID
- `user_id` - Owner (foreign key to users)
- `started_at` - Unix timestamp (ms) when workout started
- `completed_at` - Unix timestamp when completed (null = in progress)
- `duration_seconds` - Calculated duration
- `title` - Optional workout name (e.g., "Push Day A")
- `notes` - Optional workout notes

**Relationships:**

- Belongs to one user
- Has many workout_exercises (join table)

**Cascade:** ON DELETE CASCADE - deleting workout deletes all associated workout_exercises and sets

---

#### 4. **workout_exercises** (Join Table)

**Purpose:** Links workouts to exercises (many-to-many with order)

**Key Fields:**

- `id` - Record UUID
- `workout_id` - Foreign key to workouts
- `exercise_id` - Foreign key to exercises
- `order_index` - Display order (1, 2, 3...)
- `superset_group` - Optional superset grouping (e.g., "A", "B")

**Relationships:**

- Belongs to one workout
- References one exercise
- Has many exercise_sets

**Cascade:**

- ON DELETE CASCADE (workout deleted → this deleted)
- ON DELETE RESTRICT (exercise deletion blocked if referenced)

---

#### 5. **exercise_sets**

**Purpose:** Individual sets within a workout exercise

**Key Fields:**

- `id` - Set UUID
- `workout_exercise_id` - Foreign key to workout_exercises
- `set_number` - Set order within exercise (1, 2, 3...)
- `weight` - Weight lifted (decimal for precision)
- `weight_unit` - "kg" or "lbs"
- `reps` - Repetitions completed
- `duration_seconds` - For timed exercises (plank, cardio)
- `distance_meters` - For cardio tracking
- `rpe` - Rate of Perceived Exertion (1-10, optional - not MVP focus)
- `rir` - Reps in Reserve (0-5, optional - not MVP focus)
- `rest_time_seconds` - Rest period after set
- `is_warmup` - Warmup set flag (excluded from analytics)
- `is_failure` - Taken to failure flag
- `notes` - Optional set notes
- `completed_at` - Timestamp when set completed

**Relationships:**

- Belongs to one workout_exercise

**Cascade:** ON DELETE CASCADE (workout_exercise deleted → sets deleted)

**Note on RPE/RIR:** These fields exist in schema for future use but are not part of MVP scope.

---

### Sync Metadata Fields

All tables (except users) include WatermelonDB sync fields:

- `created_at` - Record creation timestamp (Unix ms)
- `updated_at` - Last update timestamp (Unix ms)
- `_changed` - Last change timestamp for sync protocol
- `_status` - Sync status ("synced", "created", "updated", "deleted")

These fields are managed automatically by WatermelonDB and Supabase triggers.

---

## ExerciseDB Dataset

### Source

Halterofit uses the **GitHub ExerciseDB static dataset** as the primary exercise data source.

- **Dataset:** 1,500+ exercises with animated GIFs
- **Format:** Static JSON file (not an API)
- **Import:** One-time seeding to Supabase, synced to local devices
- **GitHub Repo:** https://github.com/ExerciseDB/exercisedb-api
- **Backup:** `docs/archives/exercisedb-full-dataset.json` (1.3MB)

### Field Mapping

| GitHub Field       | Halterofit Field    | Type       | Notes                       |
| ------------------ | ------------------- | ---------- | --------------------------- |
| `exerciseId`       | `exercisedb_id`     | string     | Unique ID (e.g., "trmte8s") |
| `name`             | `name`              | string     | Exercise name               |
| `bodyParts`        | `body_parts`        | JSON array | Anatomical regions          |
| `targetMuscles`    | `target_muscles`    | JSON array | Primary muscles             |
| `secondaryMuscles` | `secondary_muscles` | JSON array | Supporting muscles          |
| `equipments`       | `equipments`        | JSON array | Required equipment          |
| `instructions`     | `instructions`      | JSON array | Step-by-step guide          |
| `gifUrl`           | `gif_url`           | string     | Animated demo URL           |

### Dataset Version

**Current Version:** v7 (GitHub dataset with animated GIFs)

**Import Method:**

- One-time seeding to Supabase during setup
- Automatic sync to local devices on first app launch
- Contains 1,500+ exercises with animated demonstrations

---

## Working with Database

### Basic Patterns

**All database code resides in:** `src/services/database/`

#### Create Workout

```typescript
import { database } from '@/services/database/watermelon';

const workout = await database.write(async () => {
  return await database.collections.get('workouts').create((w) => {
    w.userId = userId;
    w.startedAt = Date.now();
  });
});
```

**Full implementation:** `src/services/database/operations/workouts.ts`

#### Query Recent Workouts (Reactive)

```typescript
import { Q } from '@nozbe/watermelondb';

const workouts = database.collections
  .get('workouts')
  .query(Q.where('user_id', userId), Q.sortBy('started_at', Q.desc))
  .observe(); // Reactive - UI auto-updates
```

**Full implementation:** `src/services/database/operations/workouts.ts`

#### Search Exercises

```typescript
const results = await database.collections
  .get('exercises')
  .query(Q.where('name', Q.like(`%${searchTerm}%`)))
  .fetch();
```

**Full implementation:** `src/services/database/operations/exercises.ts`

### Sync Behavior

**Automatic Sync Triggers:**

- App launch (if internet available)
- Network connection restored
- Manual sync via pull-to-refresh (if implemented)

**Sync Protocol Implementation:** `src/services/database/watermelon/sync.ts`

**Conflict Resolution:** Last-write-wins based on `_changed` timestamp

### Data Access Layers

Halterofit uses a modular database service structure:

```
src/services/database/
├── watermelon/
│   ├── index.ts           # Database instance
│   ├── schema.ts          # WatermelonDB schema (SSoT)
│   ├── migrations.ts      # Schema migrations
│   ├── sync.ts            # Sync protocol
│   └── models/            # WatermelonDB models
│       ├── Exercise.ts
│       ├── Workout.ts
│       ├── WorkoutExercise.ts
│       └── ExerciseSet.ts
├── operations/            # Business logic (CRUD operations)
│   ├── workouts.ts
│   ├── exercises.ts
│   └── sets.ts
└── local/                 # Local database utilities
    └── index.ts
```

**Pattern:** UI components → operations layer → WatermelonDB models

---

## Schema Evolution

### Migration Workflow

When changing database schema, follow this 6-step process:

**1. Create Supabase Migration**

```bash
supabase migration new add_field_name
```

**2. Edit Migration SQL**

- File: `supabase/migrations/<timestamp>_add_field_name.sql`
- Add column, index, or constraint

**3. Apply to Supabase**

- Via SQL Editor: Copy-paste SQL and run
- Or via CLI: `supabase db push`

**4. Update WatermelonDB Schema**

- File: `src/services/database/watermelon/schema.ts`
- Add column to appropriate table
- Match data types: TEXT → 'string', BIGINT → 'number', JSONB → 'string'

**5. Increment Schema Version**

```typescript
export const schema = appSchema({
  version: 8, // Increment from 7 to 8
  tables: [...]
});
```

**Warning:** Pre-commit hook blocks commits if schema version not incremented

**6. Create WatermelonDB Migration** (if users have existing data)

- File: `src/services/database/watermelon/migrations.ts`
- Use `addColumns()` to add new fields
- See [WatermelonDB Migrations Guide](https://nozbe.github.io/WatermelonDB/Advanced/Migrations.html)

### Type Mapping

| Supabase (PostgreSQL) | WatermelonDB (SQLite) | TypeScript     |
| --------------------- | --------------------- | -------------- |
| TEXT                  | 'string'              | string         |
| BIGINT                | 'number'              | number         |
| INTEGER               | 'number'              | number         |
| NUMERIC               | 'number'              | number         |
| BOOLEAN               | 'boolean'             | boolean        |
| JSONB                 | 'string'              | any[] (parsed) |
| UUID                  | 'string'              | string         |

### Schema Versioning

**Current Version:** v7 (GitHub ExerciseDB dataset with animated GIFs)

Schema versions track structural changes to database tables and fields. The current schema aligns with the GitHub ExerciseDB dataset format, including animated GIF demonstrations for all exercises.

---

## Performance Guidelines

### Optimization Strategies

**1. Use Reactive Queries**

- `.observe()` returns Observable that auto-updates UI
- No manual refetching required
- Example: `workouts.query().observe()` instead of `.fetch()`

**2. Batch Database Writes**

- Group multiple operations in single `database.write()` call
- Reduces transaction overhead
- Example: Create workout + exercises + sets in one write block

**3. Lazy Loading**

- Only fetch related data when needed
- Avoid eager loading all relationships upfront
- Example: Fetch workout first, then exercises on-demand

**4. Index Frequently Queried Columns**

- Ensure indexed columns for common queries
- Current indexes: `user_id`, `started_at`, `exercisedb_id`, `name`
- Add indexes via Supabase migrations as needed

**5. Pagination for Large Lists**

- Use `Q.take(20)` for initial load
- Implement infinite scroll for additional items
- Example: Load 20 workouts, fetch next 20 on scroll

**6. Offline-First Pattern**

- Never block UI on network requests
- Write to local database immediately
- Sync in background when connection available

### Expected Performance

Typical operation times on modern devices:

- Log single set: Instant (local SQLite write)
- Load workout history: Fast with pagination (<100ms for 20 items)
- Search exercises: Real-time local search across 1,500+ exercises
- Cloud sync: Background operation, non-blocking to UI
- Workout duplication: Instant local operation

**Note:** Actual performance varies by device hardware and data volume. All operations are optimized for offline-first usage with local database priority.

---

## References

### Schema Files (Single Source of Truth)

**WatermelonDB:**

- Schema definition: `src/services/database/watermelon/schema.ts`
- Schema migrations: `src/services/database/watermelon/migrations.ts`
- Models: `src/services/database/watermelon/models/`
  - `Exercise.ts` - Exercise model with ExerciseDB fields
  - `Workout.ts` - Workout model with computed properties
  - `WorkoutExercise.ts` - Join table model
  - `ExerciseSet.ts` - Set model with volume calculations

**Supabase:**

- Migrations directory: `supabase/migrations/`
- Current migrations:
  - `20251105000000_consolidated_schema_v5.sql` - Initial consolidated schema
  - `20251106000000_schema_v6_v7_github_dataset.sql` - GitHub dataset alignment

### External Documentation

- [WatermelonDB Docs](https://nozbe.github.io/WatermelonDB/)
- [WatermelonDB Sync Protocol](https://nozbe.github.io/WatermelonDB/Advanced/Sync.html)
- [Supabase PostgreSQL](https://supabase.com/docs/guides/database)
- [Supabase Row-Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [GitHub ExerciseDB](https://github.com/ExerciseDB/exercisedb-api)

---

## Migration Rollback (Emergency Only)

### When to Rollback

Use rollback procedures only in emergency situations where a migration causes production-breaking issues that prevent users from using the app.

### Supabase Cloud Rollback

**Steps:**

1. **Identify problematic migration:**

   ```bash
   supabase migration list
   ```

2. **Create reverse migration:**

   ```bash
   supabase migration new rollback_vX
   ```

3. **Write SQL to undo changes:**

   ```sql
   -- Example: Undo column addition
   ALTER TABLE workouts DROP COLUMN IF EXISTS problematic_column;

   -- Example: Restore deleted column
   ALTER TABLE workouts ADD COLUMN restored_column TEXT;

   -- Example: Revert type change
   ALTER TABLE workouts ALTER COLUMN duration TYPE INTEGER USING duration::integer;
   ```

4. **Apply rollback:**

   ```bash
   supabase db push
   ```

5. **Deploy hotfix app version if schema incompatible with current app**

**Example Rollback Scenario:**

```sql
-- Original migration (v8): Added wrong column type
ALTER TABLE workouts ADD COLUMN duration INTEGER;

-- Users can't save workouts → Production DOWN 🔥

-- Rollback migration (v9): Remove problematic column
ALTER TABLE workouts DROP COLUMN duration;

-- Then create new migration (v10) with correct implementation
ALTER TABLE workouts ADD COLUMN duration_seconds INTEGER;
```

### WatermelonDB Local Rollback

**❌ NOT POSSIBLE** - Local SQLite databases on user devices cannot be rolled back remotely.

**Mitigation Strategies:**

1. **Version Checking:**
   - WatermelonDB sync protocol has built-in version checking
   - Old app versions continue working with previous schema
   - Sync protocol handles graceful degradation

2. **Thorough Testing:**
   - Test all migrations with `supabase db reset` before committing
   - Manual E2E testing on development build before deployment
   - Phased rollout (beta users first)

3. **Worst Case Recovery:**
   - Users uninstall/reinstall app (loses local data but recovers functionality)
   - Cloud data preserved in Supabase (re-syncs after reinstall)

### Prevention Best Practices

- **Validate Before Commit:** Run `supabase db reset` to test migration from scratch
- **Schema Version Hook:** `.husky/check-schema-version.sh` validates version incremented
- **Code Review:** Review all migrations before merge
- **Backward Compatibility:** Design migrations to be backward-compatible when possible
- **Staging Environment:** Test migrations in staging before production (Phase 2+)

---

**Schema Version:** v7 (GitHub ExerciseDB dataset with animated GIFs)
