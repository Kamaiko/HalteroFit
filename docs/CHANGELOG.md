# Changelog

This document tracks completed development milestones and major changes across all phases. Entries are organized in reverse chronological order (newest first).

## 📑 Table of Contents

- [2026-01-27 - Exercise Detail Screen Polish](#2026-01-27---exercise-detail-screen-polish-)
- [2026-01-27 - DayDetailsScreen Complete](#2026-01-27---daydetailsscreen-complete-)
- [2026-01-26 - Exercise Architecture Refactor](#2026-01-26---exercise-architecture-refactor-)
- [2026-01-17 - SDK 54 Migration](#2026-01-17---sdk-54-migration-)
- [2026-01-13 - Reanimated 4 & React Lock](#2026-01-13---reanimated-4--react-lock-)
- [2026-01-12 - SDK 53 Stabilization](#2026-01-12---sdk-53-stabilization-)
- [2025-11-06 - Phase 0.6 Complete](#2025-11-06---phase-06-complete-)
- [2025-11-04 - Phase 0.5 Complete](#2025-11-04---phase-05-complete-)

---

## 2026-01-27 - Exercise Detail Screen Polish ✅

**Status**: Complete
**Scope**: UI/UX improvement for exercise detail screen

### Changes

- **Edge-to-edge GIF**: GIF section now extends to true screen edge (under status bar)
- **Safe area handling**: Replaced SafeAreaView with useSafeAreaInsets for precise control
- **Scroll fade effect**: Overlay fades in over GIF when scrolling for smooth transition
- **Back button positioning**: Respects safe area insets dynamically

**Technical Details:**

- Used `react-native-reanimated` for performant scroll-based animation
- Overlay fade-in strategy (vs fade-out) ensures uniform coverage of GIF + background
- `scrollEventThrottle={16}` for 60fps smooth animation

**Files Changed:**

- Modified: src/app/exercise/[id].tsx

---

## 2026-01-27 - DayDetailsScreen Complete ✅

**Status**: Complete
**Task**: 2.1.2 - DayDetailsScreen implementation
**Phase**: 2 - Plans & Routines

<details>
<summary>📋 Changes (Click to expand)</summary>

### Day Details Tab

- [x] Created WorkoutDayDetailsContent component
- [x] Created DayExerciseCard with thumbnail, muscle info, sets/reps display
- [x] Implemented "Add Exercise" button → exercise-picker navigation
- [x] Added useFocusEffect for data refresh on return

### Drag-to-Reorder

- [x] Integrated react-native-draggable-flatlist
- [x] Added 6-dot drag handle (subtle, dark gray)
- [x] Created reorderPlanDayExercises() for batch order updates
- [x] Implemented reorderExercisesOptimistic() with instant UI feedback

### Swipe-to-Delete

- [x] Added ReanimatedSwipeable with Edit/Delete actions
- [x] Created deleteExerciseOptimistic() with LayoutAnimation
- [x] Optimistic count update for immediate feedback

### UI Polish

- [x] Improved Start Workout button (full-width, height: 56)
- [x] Added paddingBottom: 160 for over-scroll past floating button
- [x] Created stripStepPrefix utility for instruction cleanup

</details>

**Key Achievements:**

- **Drag-to-reorder** with optimistic updates and database persistence
- **Swipe-to-delete** with smooth LayoutAnimation transitions
- **Exercise picker integration** with multi-select and sequential add
- **79 tests passing** - All unit/integration tests green

**Files Changed:**

- Created: WorkoutDayDetailsContent.tsx, DayExerciseCard.tsx
- Modified: workout.tsx, useWorkoutScreen.ts, plans.ts, strings.ts
- Added: reorderPlanDayExercises(), stripStepPrefix()

---

## 2026-01-26 - Exercise Architecture Refactor ✅

**Status**: Complete
**Reason**: Full-screen navigation + React best practices + code reuse optimization

<details>
<summary>📋 Changes (Click to expand)</summary>

### Navigation Architecture

- [x] Moved exercise-browser to root-level route (full-screen, no tabs)
- [x] Moved exercise-picker to root-level route (full-screen, no tabs)
- [x] Moved exercise/[id] detail to root-level route (full-screen, floating back button)
- [x] Updated \_layout.tsx with new Stack.Screen routes
- [x] Deleted deprecated files: (tabs)/exercises/list.tsx, (tabs)/exercises/[id].tsx, (tabs)/exercises/picker.tsx

### Shared Components

- [x] Created ExerciseListView shared component (90% code reuse between browser/picker)
- [x] Refactored ExerciseCard with browse/select modes
- [x] Exported components via barrel file (src/components/exercises/index.ts)

### React Best Practices Applied

- [x] Fixed stale closure in useExerciseSearch with useRef pattern
- [x] Added useCallback for clearSearch in ExerciseListView
- [x] Memoized floatingContent with useMemo in exercise-picker
- [x] Converted activeTab from state to constant in exercise detail
- [x] Created shared capitalizeWords utility in src/utils/strings.ts

### Performance Optimizations

- [x] memo() on ExerciseCard, ExerciseListView, LoadingFooter
- [x] useMemo for computed values (displayName, muscleText, checkboxStyle)
- [x] useCallback for all handlers
- [x] useRef to avoid callback recreation in useExerciseSearch

</details>

**Key Achievements:**

- **90% code reuse** between exercise browser and exercise picker via ExerciseListView
- **Zero ESLint warnings** on exhaustive-deps (proper ref pattern)
- **Full-screen UX** for all exercise screens (no tab bar interference)
- **Floating back button** stays visible while scrolling in exercise detail
- **79 tests passing** - All unit/integration tests green

**Files Changed:**

- Created: ExerciseListView.tsx, exercise-browser.tsx, exercise/[id].tsx, strings.ts
- Refactored: exercise-picker.tsx, ExerciseCard.tsx, useExerciseSearch.ts
- Updated: \_layout.tsx, exercises/index.tsx, utils/index.ts, BACKLOG.md
- Deleted: (tabs)/exercises/list.tsx, (tabs)/exercises/[id].tsx, (tabs)/exercises/picker.tsx

---

## 2026-01-17 - SDK 54 Migration ✅

**Status**: Complete
**Reason**: Upgrade to latest stable Expo SDK for improved performance and features

<details>
<summary>📋 Changes (Click to expand)</summary>

### SDK Upgrade

- [x] Upgraded Expo SDK from 53 to 54.0.31
- [x] Upgraded React Native from 0.79.7 to 0.81.5
- [x] Upgraded React from 19.0.0 to 19.1.0

### Dependency Updates

All SDK-coupled packages automatically updated via `npx expo install --fix`:

- `expo-router` 5.x → 6.x
- `expo-image` 2.x → 3.x
- `@shopify/flash-list` 1.8.3 → 2.0.2 (New Architecture optimized)
- `@sentry/react-native` 6.x → 7.x
- `@shopify/react-native-skia` 2.4.14 → 2.2.12 (SDK 54 compatible)
- All other `expo-*` packages to SDK 54 versions

### Jest Downgrade

- [x] Downgraded Jest from 30.x to 29.7.0 (SDK 54 requirement)
- [x] Downgraded `@types/jest` from 30.x to 29.5.14
- [x] Updated `jest-expo` from 53.x to 54.x

### Config Simplification

- [x] Moved all plugins to `app.json` (expo-router, @sentry/react-native, expo-asset)
- [x] Deleted `app.config.ts` (no longer needed without custom plugins)
- [x] Deleted `plugins/withNdkVersion.js` (obsolete - EAS Build used instead)

</details>

**Key Achievements:**

- **React Native 0.81** with improved New Architecture performance
- **SDK 54 features**: Precompiled XCFrameworks (faster iOS builds), Android 16 target
- **FlashList 2.0** optimized for New Architecture
- **69 tests passing** - All unit/integration tests green

---

## 2026-01-13 - Reanimated 4 & React Lock ✅

**Status**: Complete
**Reason**: Reanimated 4 compatibility + React version mismatch prevention

<details>
<summary>📋 Changes (Click to expand)</summary>

### Reanimated 4 Upgrade

- [x] Upgraded `react-native-reanimated` from 3.17.4 to 4.1.0
- [x] Updated `babel.config.js` - Changed plugin from `reanimated/plugin` to `worklets/plugin`
- [x] Locked `react-native-worklets` to 0.5.x (Reanimated 4 requirement)

### React Ecosystem Lock

- [x] Pinned `react` to 19.0.0 (must match react-native-renderer)
- [x] Pinned `react-test-renderer` to 19.0.0
- [x] Blocked ALL React updates in Dependabot (patch/minor/major)

### Enhanced NDK Config Plugin (Later Removed)

- [x] ~~`plugins/withNdkVersion.js` now modifies 3 files~~ (Removed in SDK 54 - EAS Build used instead)
  1. ~~`build.gradle` - Sets `ext.ndkVersion` BEFORE expo-root-project plugin~~
  2. ~~`gradle.properties` - Sets `android.ndkVersion` as backup~~
  3. ~~`app/build.gradle` - Uses `findProperty()` with fallback~~

### Dependabot Hardening

- [x] Blocked ALL updates for `react-native-worklets` (0.5.x required by Reanimated 4)
- [x] Blocked ALL updates for `react` and `react-test-renderer`
- [x] Reverted Dependabot's worklets 0.7.1 bump (incompatible)

</details>

**Key Achievements:**

- **Reanimated 4** brings performance improvements and new worklets architecture
- **React lock** prevents version mismatch errors (react vs react-native-renderer)
- **Worklets lock** prevents "Expected version in inclusive range 0.5.x" errors
- **69 tests passing** - All unit/integration tests green

---

## 2026-01-12 - SDK 53 Stabilization ✅

**Status**: Complete
**Reason**: SDK 54 caused NDK 27 STL linking errors on Windows

<details>
<summary>📋 Changes (Click to expand)</summary>

### NDK Config Plugin (Later Removed in SDK 54)

- [x] ~~Created `plugins/withNdkVersion.js`~~ (Removed - EAS Build used instead)
- [x] ~~Configured in `app.config.ts`~~ (Removed - plugins now in app.json)

### Expo Configuration Architecture (Simplified in SDK 54)

- [x] `app.json` - All config including plugins
- [x] ~~`app.config.ts` - Extends app.json + defines plugins~~ (Removed)

### Dependency Cleanup

Removed 3 unused packages:

- `react-native-skia` (ghost duplicate of @shopify/react-native-skia)
- `simple-statistics` (premature - Phase 4+)
- `react-refresh` (auto-installed by Expo)

Kept (required by dependencies):

- `react-native-worklets` - required by NativeWind babel preset
- `react-native-nitro-modules` - required by react-native-mmkv
- `react-native-css-interop` - transitive via NativeWind

### NPM Configuration

- [x] `.npmrc` - Added `legacy-peer-deps=true` for CI compatibility
- [x] `package.json` overrides - React version alignment for peer deps

### Dependabot v3.1

- [x] Locked all SDK 53-coupled packages (expo-_, react-native-_, etc.)
- [x] Auto-merge groups for safe dev dependencies
- [x] Prevents accidental SDK-breaking updates

</details>

**Key Achievements:**

- ~~**NDK plugin** ensures Android builds work on Windows after every prebuild~~ (Removed in SDK 54)
- **Simplified config** - All config in app.json only
- **Dependabot lockdown** - Weekly merges won't break SDK compatibility
- **69 tests passing** - All unit/integration tests green

**Prebuild Frequency:**

- Weekly Dependabot merges: NO prebuild required
- SDK upgrade: YES, prebuild required
- Native package added: YES, prebuild required

---

## 2025-11-06 - Phase 0.6: UI/UX Foundation ✅

**Status**: Complete
**Stack**: React Native Reusables + @expo/vector-icons + NativeWind v4 + Reanimated v4

<details>
<summary>📋 Completed Tasks (8/8 - Click to expand)</summary>

### 0.6.1: Component Library Setup

- [x] Install React Native Reusables + Dependencies (M - 2h) _2025-01-30_

- [x] Configure @expo/vector-icons (S - 30min) _2025-01-30_

- [x] Validate Dark Theme Configuration (M - 1h) _2025-01-30_

### 0.6.2: Core Components Installation

- [x] Install Phase 1 Components (Auth) (M - 1.5h) _2025-01-30_

### 0.6.3: Foundation Infrastructure

- [x] Setup Environment Variables (S - 10min) _2025-02-01_

- [x] Bulk Import ExerciseDB Library (1,500+ exercises) (L - 4h) _2025-11-06_

- [x] Design Brainstorming: Fitness Components (M - 2-3h) _2025-01-30_

- [x] Fix nutrition*phase schema mismatch (XS - 1h) 🔥 \_2025-11-04*

</details>

**Key Achievements:**

- **Schema fix**: Removed nutrition_phase columns from Supabase (users + workouts tables)
- **ExerciseDB Import**: 1,500+ exercises seeded to Supabase with GitHub dataset
- **UI components** ready for Phase 1 Auth screens
- **Design system** documented with comprehensive UX patterns

**Deferred Tasks:**

- Navigation Components (Sheet/Tabs) - Not needed for Phase 1
- Core TypeScript Types - Just-in-time approach (YAGNI)

---

## 2025-11-04 - Phase 0.5: Architecture & Foundation ✅

**Status**: Complete
**Stack**: Development Build + WatermelonDB + MMKV + Victory Native + Supabase Sync

<details>
<summary>📋 Completed Tasks (21/21 - Click to expand)</summary>

### 0.5.1: Initial Setup & Analysis

- [x] Setup database with Supabase sync (M - 4h)

- [x] Complete modular architecture refactor (M - 3h)

- [x] Technical audit and corrections planning (M - 2h)

- [x] Setup professional dev tools (S - 30min)

- [x] Setup Jest testing infrastructure (S - 1h)

### 0.5.2: Development Build Migration

- [x] Setup EAS Build Account & CLI (S - 30min)

- [x] Create eas.json Configuration (S - 30min)

- [x] Install Native Packages & Build Development Build (L - 2-3h)

- [x] Create WatermelonDB Models & Schema (L - 2h)

- [x] Phase 1 Critical Fixes (Post-Analysis) (M - 1.5h)

- [x] Migrate Database Operations to WatermelonDB (L - 1.5h)

- [x] Migrate Storage to MMKV (M - 1h)

- [x] Migrate Charts to Victory Native (M - 1h)

- [x] Create Supabase Schema & Sync Functions (L - 1.5h) _2025-01-31_

- [x] Verify Development Build Launch (S - 15min) _2025-01-31_

### 0.5.3: Critical Corrections - Blockers

- [x] User ID Persistence with Zustand Persist (M - 2.5h)

- [x] Zustand Persist for Workout Store (S - 1h)

- [x] Error Handling Layer (M - 3h)

- [x] Configure Sentry for error monitoring (M - 2h)

### 0.5.4: Infrastructure Completion

- [x] Configure FlashList for optimized lists (S - 1h)

- [x] Configure expo-image with caching (S - 1h) _2025-01-31_

</details>

**Key Achievements:**

- **Development Build** migration complete - avoided 40-60% code rewrite later
- **WatermelonDB ↔ Supabase** bidirectional sync protocol implemented
- **MMKV** encrypted storage (10-30x faster than AsyncStorage)
- **Victory Native** charts with Skia-based 60fps animations
- **expo-image** with memory-disk caching configured

**Deferred Tasks:**

- Repository Pattern (defer to Phase 1-2)
- Sync Conflict Detection (defer until multi-device needed)
- Database Indexes (defer until performance issue)
- Chart Abstraction (Victory Native already sufficient)
- Domain vs DB Types (just-in-time approach)

---

**Next Milestone**: Phase 1 - Authentication & Foundation
