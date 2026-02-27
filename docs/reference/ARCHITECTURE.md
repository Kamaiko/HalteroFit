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
  - [6. `/utils` - Pure Utility Functions](#6-utils---pure-utility-functions)
  - [7. `/lib` - UI Utility Helpers](#7-lib---ui-utility-helpers--vendored-libraries)
  - [8. Tests - Testing Infrastructure](#8-tests---testing-infrastructure)
  - [9. `/constants` - App Constants](#9-constants---app-constants)
- [Data Flow](#data-flow)
  - [Offline-First Sync Flow](#3-offline-first-sync-flow)

---

## Overview

Halterofit uses a **practical modular architecture** inspired by React Native/Expo best practices:

```
src/
├── app/              # Screens & Navigation (Expo Router)
├── components/       # UI Components (by feature: ui/, exercises/, workout/, charts/, layout/)
├── hooks/            # Business Logic Hooks (exercises/, workout/, ui/)
├── services/         # Database, Storage, Auth, Supabase
├── stores/           # Global State - Zustand + MMKV (auth/, exercises/, workout/)
├── constants/        # Colors, Layout, Animation, Workout limits
├── utils/            # Errors, Validators, Muscles, Formatters, Sentry
└── lib/              # UI utilities (cn() helper, body-highlighter)
```

### Architectural Principles

1. **Separation of Concerns**: Each layer has a clear responsibility
2. **Feature Organization**: Components/hooks organized by feature domain
3. **Type Colocation**: Types live with their implementation (`operations/plans/types.ts`, `remote/types.ts`, component props in same file). No shared `/types` directory — add one only when a type is used across 3+ modules.
4. **Barrel Exports**: `index.ts` for clean imports at every level
5. **Type Safety**: TypeScript strict mode everywhere

---

## Detailed Structure

### 1. `/app` - Navigation (Expo Router)

**Purpose**: File-based routing, screens, layouts

```
app/
├── (app)/                   # Protected routes (auth guard)
│   ├── _layout.tsx          # Auth check → redirect to /sign-in if unauthenticated
│   ├── (tabs)/              # Main tab navigation (4 tabs)
│   │   ├── _layout.tsx      # Tab bar configuration
│   │   ├── index.tsx        # Home/Dashboard
│   │   ├── workout.tsx      # Workout plan management
│   │   ├── exercises.tsx    # Muscle selector grid → navigates to exercise/browser
│   │   └── progress.tsx     # Progress tracking (placeholder)
│   ├── exercise/            # Exercise full-screen routes (outside tabs)
│   │   ├── _layout.tsx      # Stack navigator (headerShown: false)
│   │   ├── [id].tsx         # Exercise detail (/exercise/123)
│   │   ├── browser.tsx      # Browse exercises by muscle (/exercise/browser)
│   │   └── picker.tsx       # Pick exercises for plan day (/exercise/picker)
│   ├── plans/               # Plan full-screen routes (outside tabs)
│   │   ├── _layout.tsx      # Stack navigator
│   │   ├── index.tsx        # Plan list (/plans)
│   │   └── edit-day.tsx     # Edit plan day exercises (/plans/edit-day)
│   └── settings.tsx         # Settings (full-screen, navigated from Home)
├── (auth)/                  # Public routes (no auth required)
│   ├── _layout.tsx          # Reverse guard → redirect to / if authenticated
│   └── sign-in.tsx          # Sign-in placeholder (Phase 4)
├── _layout.tsx              # Root layout (DB init, Sentry, providers)
└── +not-found.tsx           # 404 page
```

**Conventions**:

- Screens suffixed with `.tsx`, layouts named `_layout.tsx`
- `(app)/` guards authenticated routes (redirects to /sign-in); `(auth)/` contains public auth screens (redirects authenticated to /)
- Keep screens thin — delegate business logic to hooks in `src/hooks/`
- **Route grouping**: Tab screens are flat files under `(tabs)/`. Feature routes outside tabs (`exercise/`, `plans/`) use their own Stack layout for drill-down navigation (tab bar hidden intentionally).
- **Naming**: `exercises` (plural = collection tab), `exercise/` (singular = resource routes)

---

### 2. `/components` - UI Components

**Purpose**: Reusable React components organized by feature and source

```
components/
├── ui/                      # ShadCN primitives + project-custom components
│   ├── alert-dialog.tsx     # AlertDialog (ShadCN)
│   ├── bottom-sheet.tsx     # BottomSheet (custom, Gorhom)
│   ├── brand-icon.tsx       # BrandIcon SVG (custom)
│   ├── button.tsx           # Button (ShadCN)
│   ├── cached-image.tsx     # CachedImage (custom, expo-image)
│   ├── card.tsx             # Card (ShadCN)
│   ├── chip.tsx             # Chip (custom, tag/filter pill)
│   ├── confirm-dialog.tsx   # ConfirmDialog (custom, wraps Dialog)
│   ├── dialog.tsx           # Dialog (custom, base shell)
│   ├── empty-state.tsx      # EmptyState (custom, icon + message)
│   ├── icon.tsx             # Ionicons wrapper (custom)
│   ├── index.ts             # Barrel: custom components only
│   ├── input.tsx            # Input (ShadCN)
│   ├── input-dialog.tsx     # InputDialog (custom, wraps Dialog)
│   ├── label.tsx            # Label (ShadCN)
│   ├── tabs.tsx             # Tabs (custom, tap-only — swipe deferred)
│   └── text.tsx             # Text (ShadCN)
├── exercises/               # Exercise-specific components
│   ├── ExerciseCard.tsx
│   ├── ExerciseGifHeader.tsx
│   ├── ExerciseListView.tsx
│   ├── MuscleGroupIcon.tsx
│   ├── MuscleHighlighter.tsx
│   ├── muscleGroupIconConfig.ts
│   └── index.ts
├── workout/                 # Workout plan components
│   ├── DayCard.tsx
│   ├── DayExerciseCard.tsx
│   ├── DragHandle.tsx
│   ├── EditDayExerciseCard.tsx
│   ├── ExerciseThumbnail.tsx
│   ├── PlanHeader.tsx
│   ├── SwipeableContext.ts
│   ├── WorkoutDayDetailsContent.tsx
│   ├── WorkoutList.tsx
│   ├── WorkoutListItem.tsx
│   ├── WorkoutOverviewContent.tsx
│   └── index.ts
├── charts/                  # Victory Native chart components
│   ├── BarChart.tsx
│   ├── LineChart.tsx
│   └── index.ts
└── layout/                  # Screen layout components
    ├── ErrorFallbackScreen.tsx
    ├── ScreenContainer.tsx
    └── index.ts
```

**Barrel Convention for `ui/`:**

The `ui/index.ts` barrel exports only **project-custom** components (BrandIcon, CachedImage, Chip, EmptyState, Tabs, BottomSheet, dialogs). ShadCN primitives (button, text, card, input, label, alert-dialog, icon) are imported directly from their files:

```tsx
import { CachedImage, Tabs, BottomSheet, EmptyState } from '@/components/ui'; // Custom
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
│   ├── editDayHelpers.ts       # Pure helper functions for edit-day logic
│   └── index.ts
└── ui/
    ├── useAlertState.ts        # Alert dialog state pattern
    ├── useErrorHandler.ts      # Centralized error → alert conversion
    ├── useObservable.ts        # WatermelonDB observable → React state bridge
    └── index.ts
```

**Conventions**:

- Prefix with `use`: `useExerciseSearch()`
- Return objects: `{ data, loading, error, handleAction }`
- Import via barrel: `import { useEditDay } from '@/hooks/workout'`
- **Sub-hooks**: Internal to their compositor (`useDayMenu` → `useWorkoutScreen`), excluded from barrel exports, flat-spread into parent return
- **Helpers colocation**: Pure helper functions live in the same directory, suffixed `Helpers` (e.g., `editDayHelpers.ts`). No `use` prefix = not a hook.

---

### 4. `/services` - Business Logic Layer

**Purpose**: Database operations, external services, storage

```
services/
├── database/
│   ├── local/                  # WatermelonDB (SQLite local storage)
│   │   ├── schema.ts           # Database schema (v8)
│   │   ├── migrations.ts       # Schema migrations (v1→v8)
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
│   │   ├── sync.ts             # WatermelonDB ↔ Supabase sync
│   │   └── types.ts            # Database types (Exercise, Workout, Plan, etc.)
│   │
│   ├── operations/             # Business logic (CRUD)
│   │   ├── workouts/           # Workout CRUD (split by concern)
│   │   │   ├── queries.ts      # Read operations + observables
│   │   │   ├── mutations.ts    # Write operations
│   │   │   ├── mappers.ts      # DB model → app type mapping
│   │   │   └── index.ts
│   │   ├── plans/              # Plan + day + exercise CRUD
│   │   │   ├── plan-operations.ts     # Plan-level CRUD
│   │   │   ├── day-operations.ts      # Day-level CRUD
│   │   │   ├── exercise-operations.ts # Plan day exercise CRUD
│   │   │   ├── types.ts        # Plan-specific types
│   │   │   ├── mappers.ts      # DB model → app type mapping
│   │   │   └── index.ts
│   │   ├── exercises.ts        # Exercise read-only queries (no auth)
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
│   ├── zustandStorage.ts       # Zustand persist adapter
│   └── index.ts
│
├── supabase/                   # Supabase client
│   ├── client.ts
│   └── index.ts
│
└── auth/                       # Auth services (placeholder — Phase 4)
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

### 6. `/utils` - Pure Utility Functions

**Purpose**: Pure functions, error classes, validation

```
utils/
├── errors.ts              # Error hierarchy (AppError → Database/Auth/Validation/SyncError)
├── sentry.ts              # Sentry initialization and helpers
├── muscles.ts             # Muscle name mapping (ExerciseDB → body-highlighter slugs)
├── formatters/            # Display formatting (dates, durations)
│   └── index.ts
└── validators/            # Input validation
    ├── plans.ts           # Plan/day name validators (result-based + throwing)
    └── index.ts
```

**Import Convention:** Always import from specific submodules:

```typescript
import { AppError, DatabaseError } from '@/utils/errors';
import { validatePlanName } from '@/utils/validators';
import { formatDuration } from '@/utils/formatters';
```

---

### 7. `/lib` - UI Utility Helpers & Vendored Libraries

**Purpose**: UI-specific utilities and vendored/forked libraries

```
lib/
├── utils.ts                     # cn() helper (clsx + tailwind-merge, shadcn/ui convention)
└── body-highlighter/            # Vendored from react-native-body-highlighter
    ├── index.tsx                # BodyHighlighter component + Slug type
    ├── components/
    │   ├── SvgMaleWrapper.tsx
    │   └── SvgFemaleWrapper.tsx
    └── assets/                  # SVG path data (body front/back, male/female)
        ├── bodyFront.ts
        ├── bodyBack.ts
        ├── bodyFemaleFront.ts
        └── bodyFemaleBack.ts
```

**Conventions**:

- `lib/` = UI/styling helpers + vendored libraries (shadcn/ui convention)
- `utils/` = Business logic (formatters, validators, error classes)
- Vendored libraries are forked to remove unnecessary dependencies and integrate with project constants

---

### 8. Tests - Testing Infrastructure

**Purpose**: Centralized test infrastructure, E2E automation

```
__tests__/
├── unit/                       # Unit tests (centralized, not colocated)
│   ├── services/database/
│   │   └── day-operations.test.ts
│   ├── hooks/workout/
│   │   ├── useAddDayDialog.test.ts
│   │   ├── useExerciseActions.test.ts
│   │   ├── useDayMenu.test.ts
│   │   └── editDayHelpers.test.ts
│   └── utils/
│       ├── validators/plans.test.ts
│       └── muscles.test.ts
│
├── __helpers__/                # Reusable test utilities
│   └── database/
│       ├── test-database.ts    # LokiJS setup/teardown
│       ├── factories.ts        # createTestUser, createTestExercise, etc.
│       └── queries.ts          # getAllRecords, getRecordById, countRecords, recordExists
│
.maestro/                       # E2E tests (Maestro, Phase 3+)
├── flows/
│   ├── auth/
│   └── workout/
├── config.yaml
└── README.md
```

**Conventions**:

- **Unit tests**: `__tests__/unit/**/*.test.ts` (centralized, not colocated)
- **E2E tests**: `.maestro/**/*.yaml` (Maestro flows, root level)
- **Helpers import**: `@test-helpers/database/*` (NEVER relative imports)
- **Mocks**: `__mocks__/` at project root (Jest auto-discovers mocks adjacent to `node_modules`)
- See [TESTING.md](../guides/TESTING.md) for full strategy and conventions

---

### 9. `/constants` - App Constants

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
