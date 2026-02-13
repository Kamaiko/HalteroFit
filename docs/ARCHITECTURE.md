# Architecture

This document explains how Halterofit's codebase is organized. It covers folder structure, architectural patterns, and the separation of concerns between different layers (navigation, components, services, state management).

## Table of Contents

- [Overview](#overview)
- [Detailed Structure](#detailed-structure)
  - [1. `/app` - Navigation (Expo Router)](#1-app---navigation-expo-router)
  - [2. `/components` - UI Components](#2-components---ui-components)
  - [3. `/hooks` - Custom React Hooks](#3-hooks---custom-react-hooks)
  - [4. `/services` - Business Logic](#4-services---business-logic)
  - [5. `/stores` - Global State (Zustand)](#5-stores---global-state-zustand)
  - [6. `/types` - TypeScript Types](#6-types---typescript-types)
  - [7. `/utils` - Pure Utility Functions](#7-utils---pure-utility-functions)
  - [8. `/lib` - UI Utility Helpers](#8-lib---ui-utility-helpers)
  - [9. `/tests` - Test Infrastructure](#9-tests--test-infrastructure)
  - [10. `/constants` - App Constants](#10-constants---app-constants)
- [Data Flow](#data-flow)
  - [Offline-First Sync Flow](#3-offline-first-sync-flow)

---

## Overview

Halterofit uses a **scalable modular architecture** inspired by React Native/Expo best practices:

```
src/
├── app/              # Screens & Navigation (Expo Router)
├── components/       # UI Components (by feature: ui/, exercises/, workout/, charts/, layout/)
├── hooks/            # Business Logic Hooks (exercises/, workout/, ui/)
├── services/         # Database, Storage, Auth, Supabase
├── stores/           # Global State - Zustand + MMKV (auth/, exercises/, workout/)
├── constants/        # Colors, Layout, Animation, Workout limits
├── utils/            # Errors, Validators, Strings, Sentry
├── types/            # Shared types (placeholder)
└── lib/              # UI utility (cn() helper for NativeWind)
```

### Architectural Principles

1. **Separation of Concerns**: Each layer has a clear responsibility
2. **Feature Organization**: Components/hooks organized by feature
3. **Colocation**: Types colocated with their implementation
4. **Barrel Exports**: index.ts for clean imports
5. **Type Safety**: TypeScript strict mode everywhere

---

## Detailed Structure

### 1. `/app` - Navigation (Expo Router)

**Purpose**: File-based routing, screens, layouts

```
app/
├── (tabs)/                  # Main tab navigation
│   ├── exercises/           # Exercises tab (nested routes)
│   │   ├── _layout.tsx      # Stack navigator for exercises
│   │   └── index.tsx        # Muscle selector grid
│   ├── _layout.tsx          # Tab bar configuration
│   ├── index.tsx            # Home/Dashboard
│   ├── workout.tsx          # Workout plan management
│   ├── stats.tsx            # Statistics (placeholder)
│   └── settings.tsx         # Settings (placeholder)
├── exercise/                # Exercise full-screen routes
│   ├── _layout.tsx          # Stack navigator (headerShown: false)
│   ├── [id].tsx             # Exercise detail (/exercise/123)
│   ├── browser.tsx          # Browse exercises by muscle (/exercise/browser)
│   └── picker.tsx           # Pick exercises for plan day (/exercise/picker)
├── plans/                   # Plan full-screen routes
│   ├── _layout.tsx          # Stack navigator (header for index, hidden for edit-day)
│   ├── index.tsx            # Plan list (/plans)
│   └── edit-day.tsx         # Edit plan day exercises (/plans/edit-day)
├── _layout.tsx              # Global layout + DB init + Sentry
├── +not-found.tsx           # 404 page
└── index.tsx                # Root redirect
```

**Conventions**:

- Screens suffixed with `.tsx`
- Layouts named `_layout.tsx`
- Use `(groups)` for route organization without URL segments
- Keep screens thin — delegate business logic to hooks in `src/hooks/`
- **Route grouping**: `(tabs)/feature/` for tab screens, `feature/` for full-screen routes grouped by domain
- **Naming**: `exercises/` (plural = collection tab), `exercise/` (singular = resource routes)

---

### 2. `/components` - UI Components

**Purpose**: Reusable React components organized by feature and source

```
components/
├── ui/                  # ShadCN primitives + project-custom components
│   ├── alert-dialog.tsx # AlertDialog (ShadCN, used by dialogs)
│   ├── bottom-sheet.tsx # BottomSheet (custom, Gorhom)
│   ├── button.tsx       # Button (ShadCN)
│   ├── cached-image.tsx # CachedImage (custom, expo-image)
│   ├── card.tsx         # Card (ShadCN)
│   ├── confirm-dialog.tsx # ConfirmDialog (custom, wraps Dialog)
│   ├── dialog.tsx       # Dialog (custom, base shell)
│   ├── icon.tsx         # Ionicons wrapper (custom)
│   ├── index.ts         # Barrel: custom components only
│   ├── input.tsx        # Input (ShadCN)
│   ├── input-dialog.tsx # InputDialog (custom, wraps Dialog)
│   ├── label.tsx        # Label (ShadCN)
│   ├── tabs.tsx         # Tabs (custom, react-native-pager-view)
│   └── text.tsx         # Text (ShadCN)
├── exercises/           # Exercise-specific components
│   ├── ExerciseCard.tsx
│   ├── ExerciseGifHeader.tsx
│   ├── ExerciseListView.tsx
│   └── index.ts
├── workout/             # Workout plan components
│   ├── DayCard.tsx
│   ├── DayExerciseCard.tsx
│   ├── DragHandle.tsx
│   ├── EditDayExerciseCard.tsx
│   ├── ExerciseThumbnail.tsx
│   ├── PlanHeader.tsx
│   ├── SwipeableContext.ts
│   ├── WorkoutDayDetailsContent.tsx
│   ├── WorkoutList.tsx         # Phase 2 (not yet used)
│   ├── WorkoutListItem.tsx     # Phase 2 (not yet used)
│   ├── WorkoutOverviewContent.tsx
│   └── index.ts
├── charts/              # Victory Native chart components
│   ├── BarChart.tsx
│   ├── LineChart.tsx
│   └── index.ts
└── layout/              # Screen layout components
    ├── ErrorFallbackScreen.tsx
    ├── ScreenContainer.tsx
    └── index.ts
```

**Barrel Convention for `ui/`:**

The `ui/index.ts` barrel exports only **project-custom** components (CachedImage, Tabs, BottomSheet, dialogs). ShadCN primitives (button, text, card, input, label, alert-dialog, icon) are imported directly from their files:

```tsx
import { CachedImage, Tabs, BottomSheet } from '@/components/ui'; // Custom
import { Button } from '@/components/ui/button'; // ShadCN
```

**Conventions**:

- `ui/` files: lowercase (ShadCN convention)
- All other component files: PascalCase
- NativeWind v4 (Tailwind) for styling
- Icons via `@/components/ui/icon` (Ionicons wrapper)
- Named exports: `export function ComponentName() {}`

---

### 3. `/hooks` - Custom React Hooks

**Purpose**: Encapsulate business logic and state management for screens

Each screen with non-trivial logic has a matching hook. Hooks can compose other hooks for complex screens.

```
hooks/
├── exercises/
│   ├── useExerciseDetail.ts    # Data loading for exercise/[id].tsx
│   ├── useExercisePicker.ts    # Selection + validation for exercise-picker.tsx
│   ├── useExerciseSearch.ts    # Search + pagination for exercise-browser.tsx
│   └── index.ts
├── workout/
│   ├── useWorkoutScreen.ts     # Main hook for workout.tsx (composes sub-hooks)
│   ├── useEditDay.ts           # Edit day logic for edit-day.tsx
│   ├── useAddDayDialog.ts      # Add day dialog state (sub-hook)
│   ├── useDayMenu.ts           # Day context menu actions (sub-hook)
│   ├── useExerciseActions.ts   # Exercise reorder/delete (sub-hook)
│   └── index.ts
└── ui/
    ├── useAlertState.ts        # Alert dialog state pattern
    ├── useErrorHandler.ts      # Centralized error → alert conversion
    └── index.ts
```

**Hook Composition Pattern:**

`useWorkoutScreen` composes `useAddDayDialog` + `useDayMenu` + `useExerciseActions` — each sub-hook handles one concern, the parent wires them together.

**Conventions**:

- Prefix with `use`: `useExerciseSearch()`
- Return objects: `{ data, loading, error, handleAction }`
- Import via barrel: `import { useEditDay } from '@/hooks/workout'`

---

### 4. `/services` - Business Logic Layer

**Purpose**: Database operations, external services, storage

```
services/
├── database/
│   ├── local/                  # WatermelonDB (SQLite local storage)
│   │   ├── schema.ts           # Database schema (v8)
│   │   ├── migrations.ts       # Schema migrations (v1-v8)
│   │   ├── models/             # WatermelonDB model classes
│   │   │   ├── User.ts
│   │   │   ├── Exercise.ts
│   │   │   ├── Workout.ts
│   │   │   ├── WorkoutExercise.ts
│   │   │   ├── ExerciseSet.ts
│   │   │   ├── WorkoutPlan.ts
│   │   │   ├── PlanDay.ts
│   │   │   └── PlanDayExercise.ts
│   │   └── index.ts            # Database instance + model exports
│   │
│   ├── remote/                 # Supabase sync protocol
│   │   ├── sync.ts             # WatermelonDB sync (Phase 2)
│   │   └── types.ts            # Database types (Exercise, Workout, Plan, etc.)
│   │
│   ├── operations/             # Business logic (CRUD)
│   │   ├── workouts.ts         # 17 functions (Promise + Observable)
│   │   ├── plans.ts            # 26 functions (Promise + Observable)
│   │   ├── exercises.ts        # 6 functions (read-only, no auth)
│   │   └── index.ts            # Barrel (re-exports all operations)
│   │
│   ├── seed/                   # Exercise library seeding
│   │   ├── exercises.ts        # Seed 1,300+ exercises from JSON
│   │   └── index.ts
│   │
│   ├── utils/                  # Database operation helpers
│   │   ├── requireAuth.ts      # Auth guards (requireAuth, validateOwnership)
│   │   ├── withDatabaseError.ts # Error wrapper for DB operations
│   │   └── index.ts
│   │
│   └── index.ts                # Public API barrel
│
├── storage/                    # MMKV encrypted storage
│   ├── mmkvStorage.ts          # Core MMKV interface
│   ├── storage.ts              # Async wrapper (for Supabase client)
│   ├── zustandStorage.ts       # Zustand persist adapter
│   └── index.ts
│
├── supabase/                   # Supabase client
│   ├── client.ts
│   └── index.ts
│
└── auth/                       # Auth services (Phase 1 - in progress)
    └── index.ts
```

**Database Operation Patterns:**

All write operations follow: `requireAuth()` + `withDatabaseError()` + ownership validation.
Exercise operations are read-only (seed data, no auth needed).
Each domain provides both Promise-based (imperative) and Observable (reactive) APIs.

**Import Convention:**

```typescript
import { createPlan, observeActivePlan } from '@/services/database/operations';
import { mmkvStorage } from '@/services/storage';
import { supabase } from '@/services/supabase';
```

---

### 5. `/stores` - Global State (Zustand)

**Purpose**: Application-wide state management with MMKV persistence

```
stores/
├── auth/
│   ├── authStore.ts              # Auth session (user, isAuthenticated)
│   ├── authStore.manual-test.ts  # Dev tool: MMKV persistence validation
│   └── index.ts
├── exercises/
│   ├── exercisePickerStore.ts    # Exercise picker selection state
│   └── index.ts
├── workout/
│   ├── workoutStore.ts           # Active workout state
│   ├── workoutStore.manual-test.ts # Dev tool: MMKV persistence validation
│   └── index.ts
└── index.ts                      # Barrel exports all stores
```

**Conventions**:

- Zustand with `persist()` middleware + MMKV storage adapter
- Export hook + types: `export { useAuthStore } from './authStore'`
- Import directly: `import { useAuthStore } from '@/stores/auth'`
- **Persistence strategy**:
  - Simple state (auth, preferences) → Zustand `persist()` + MMKV
  - Complex/relational data → WatermelonDB (via services layer)

---

### 6. `/types` - TypeScript Types

**Purpose**: Shared type definitions for cross-module use

```
types/
└── index.ts          # Placeholder (JIT approach)
```

Currently empty. Types are colocated with their implementation:

- Database types → `services/database/remote/types.ts`
- Exercise types → `services/database/operations/exercises.ts`
- Plan types → `services/database/operations/plans.ts`
- Component props → same file as the component

Shared types will be added here when needed (e.g., types used across 3+ modules).

---

### 7. `/utils` - Pure Utility Functions

**Purpose**: Pure functions, error classes, validation

```
utils/
├── errors.ts              # Error hierarchy (AppError → Database/Auth/Validation/SyncError)
├── sentry.ts              # Sentry initialization and helpers
├── strings.ts             # capitalizeWords, stripStepPrefix
├── calculations/          # Placeholder (Phase 5+: 1RM, volume, plates)
│   └── index.ts
├── formatters/            # Placeholder (Phase 2+: weight, date, duration)
│   └── index.ts
├── validators/            # Input validation
│   ├── plans.ts           # Plan/day name validators (result-based + throwing)
│   └── index.ts
└── index.ts               # Barrel exports
```

**Import Convention:**

```typescript
import { capitalizeWords } from '@/utils'; // Generic utilities via barrel
import { DatabaseError } from '@/utils/errors'; // Domain-specific via direct import
import { validatePlanName } from '@/utils/validators'; // Domain-specific via direct import
```

---

### 8. `/lib` - UI Utility Helpers

**Purpose**: UI-specific utility functions (React Native Reusables convention)

```
lib/
└── utils.ts  # cn() helper (clsx + tailwind-merge)
```

**Conventions**:

- UI/styling utilities only
- Follows React Native Reusables (shadcn/ui) patterns
- For business logic utilities → use `/utils` instead

**Example**:

```typescript
// lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines and merges Tailwind CSS classes intelligently
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Usage in components:
<Button className={cn("px-4 py-2", isActive && "bg-primary")} />
```

**Why separate from `/utils`?**

- `lib/` = UI/styling helpers (shadcn/ui convention)
- `utils/` = Business logic (calculations, formatters, validators)

---

### 9. `/__tests__` & `/e2e` - Testing Infrastructure

**Purpose**: Centralized test infrastructure, E2E automation

```
__tests__/                      # All tests centralized (renamed from tests/)
├── unit/                       # Unit tests (colocated by feature)
│   ├── services/
│   │   ├── database/
│   │   │   ├── workouts.test.ts
│   │   │   ├── exercises.test.ts
│   │   │   └── sets.test.ts
│   │   └── auth/
│   └── utils/
│       └── formatters.test.ts
│
├── integration/                # Integration tests (Phase 1+)
│   ├── database/               # Database sync integration tests
│   ├── workflows/              # Multi-service workflow tests
│   └── features/               # Cross-component feature tests
│
├── __helpers__/                # Reusable test utilities
│   └── database/
│       ├── test-database.ts    # LokiJS setup/teardown
│       ├── factories.ts        # createTestWorkout, createTestExercise
│       ├── queries.ts          # getAllRecords, countRecords
│       ├── time.ts             # wait, dateInPast, dateInFuture
│       └── assertions.ts       # assertDatesApproximatelyEqual
│
└── fixtures/                   # Static test data (JSON)
    └── database/
        ├── workouts.json       # Sample workout data
        └── exercises.json      # Sample exercise data

.maestro/                       # E2E tests (Maestro)
├── flows/                      # Test flows
│   ├── auth/                   # Authentication flows
│   └── workout/                # Workout flows
├── config.yaml                 # Global Maestro configuration
└── README.md                   # E2E testing guide
```

**Conventions**:

- **Unit tests**: `__tests__/unit/**/*.test.ts` (centralized, not colocated)
- **E2E tests**: `.maestro/**/*.yaml` (Maestro flows, root level)
- **Helpers import**: `@test-helpers/database/*` (NEVER relative imports)
- **Export pattern**: Named exports only
- **Pre-commit**: Tests MUST pass before commit
- See: [docs/TESTING.md](TESTING.md) for complete testing guide

**Test Helpers:**

| Helper             | Purpose               | Example Usage                         |
| ------------------ | --------------------- | ------------------------------------- |
| `test-database.ts` | LokiJS setup/teardown | `createTestDatabase()`                |
| `factories.ts`     | Create test data      | `createTestWorkout(database)`         |
| `queries.ts`       | Query utilities       | `getAllRecords(database, 'workouts')` |
| `time.ts`          | Time utilities        | `dateInPast(7, 'days')`               |
| `assertions.ts`    | Custom assertions     | `assertDatesApproximatelyEqual()`     |

**Mocks Location**: `__mocks__/` (root, NOT in **tests**/)

| What                      | Where                    | Why                 |
| ------------------------- | ------------------------ | ------------------- |
| **External dependencies** | `__mocks__/` (root)      | Jest auto-discovery |
| **Internal test utils**   | `__tests__/__helpers__/` | Custom test logic   |
| **Static test data**      | `__tests__/fixtures/`    | JSON fixtures       |
| **E2E tests**             | `.maestro/flows/`        | Maestro YAML flows  |

**Why root for mocks?** Jest convention - auto-discovers mocks adjacent to `node_modules`.

**See**: [TESTING.md](./TESTING.md) for current test coverage and strategy

---

### 10. `/constants` - App Constants

**Purpose**: Configuration values, colors, sizes, limits

```
constants/
├── animation.ts      # Duration constants (DURATION_INSTANT/FAST/STANDARD/MODERATE)
├── colors.ts         # Color palette (must match tailwind.config.ts)
├── database.ts       # DEFAULT_PAGE_SIZE, SEARCH_DEBOUNCE_MS
├── layout.ts         # ICON_SIZE_*, THUMBNAIL_*, TAB_BAR_*, CHART_*
├── workout.ts        # MAX_EXERCISES_PER_DAY, MAX_DAYS_PER_PLAN, defaults
└── index.ts          # Barrel exports
```

**Convention:** Always import via barrel: `import { Colors, ICON_SIZE_MD } from '@/constants'`

---

## Data Flow

### 1. User Action Flow

```
UI Component → Hook → Service → Database/API
     ↓           ↓        ↓          ↓
   Props    State Logic  CRUD    SQLite/Supabase
```

---

### 2. State Management Layers

```
┌─────────────────────────────────────────┐
│  UI State (React State)                 │  ← Ephemeral
│  - Form inputs, UI toggles             │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│  Global State (Zustand)                 │  ← In-memory
│  - Auth user, active workout           │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│  Local Database (WatermelonDB)          │  ← Persistent
│  - Workouts, exercises, sets           │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│  Cloud Sync (Supabase)                  │  ← Backup/Sync
│  - Background sync, multi-device       │
└─────────────────────────────────────────┘
```

**When to use each layer:**

- **React State**: Component-specific UI (modals, dropdowns)
- **Zustand**: Cross-component state (auth, active workout)
- **WatermelonDB**: Persisted data (all workouts, exercises)
- **Supabase**: Cloud backup & multi-device sync

---

### 3. Offline-First Sync Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER ACTION                               │
│                    (Create/Update/Delete)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     WATERMELONDB (Local)                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │  SQLite DB  │ ←→ │  _status    │    │  _changed fields    │  │
│  │  (instant)  │    │  created    │    │  tracks dirty cols  │  │
│  │             │    │  updated    │    │                     │  │
│  │             │    │  deleted    │    │                     │  │
│  └─────────────┘    └─────────────┘    └─────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ (when online)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SYNC PROTOCOL                               │
│  ┌────────────────────────┐    ┌────────────────────────────┐   │
│  │      PULL (fetch)      │    │      PUSH (upload)         │   │
│  │  GET changes since     │    │  POST local changes        │   │
│  │  last_pulled_at        │    │  (created/updated/deleted) │   │
│  └────────────────────────┘    └────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SUPABASE (Cloud)                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │ PostgreSQL  │    │     RLS     │    │   pull_changes()    │  │
│  │  (backup)   │    │  (security) │    │   push_changes()    │  │
│  └─────────────┘    └─────────────┘    └─────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Sync Behavior:**

| Scenario       | Behavior                                                                 |
| -------------- | ------------------------------------------------------------------------ |
| **Offline**    | All writes go to SQLite, marked with `_status: 'created'` or `'updated'` |
| **Online**     | Background sync every 5 min + manual trigger                             |
| **Conflict**   | Last-write-wins (server timestamp)                                       |
| **First sync** | Full pull, then incremental                                              |

**Implementation:** [src/services/database/remote/sync.ts](../src/services/database/remote/sync.ts)

---
