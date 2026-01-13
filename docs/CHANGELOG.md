# Changelog

This document tracks completed development milestones and major changes across all phases. Entries are organized in reverse chronological order (newest first).

## 📑 Table of Contents

- [2026-01-13 - Reanimated 4 & React Lock](#2026-01-13---reanimated-4--react-lock-)
- [2026-01-12 - SDK 53 Stabilization](#2026-01-12---sdk-53-stabilization-)
- [2025-11-06 - Phase 0.6 Complete](#2025-11-06---phase-06-complete-)
- [2025-11-04 - Phase 0.5 Complete](#2025-11-04---phase-05-complete-)

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

### Enhanced NDK Config Plugin

- [x] `plugins/withNdkVersion.js` now modifies 3 files:
  1. `build.gradle` - Sets `ext.ndkVersion` BEFORE expo-root-project plugin
  2. `gradle.properties` - Sets `android.ndkVersion` as backup
  3. `app/build.gradle` - Uses `findProperty()` with fallback

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

### NDK Config Plugin

- [x] Created `plugins/withNdkVersion.js` - Forces NDK 26.1.10909125 on every prebuild
- [x] Configured in `app.config.ts` - Plugin persists NDK version automatically

### Expo Configuration Architecture

- [x] `app.json` - Base static config (no plugins)
- [x] `app.config.ts` - Extends app.json + defines plugins
- [x] Clean inheritance via `...config` spread

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

- **NDK plugin** ensures Android builds work on Windows after every prebuild
- **Clean config architecture** - No duplication between app.json/app.config.ts
- **Dependabot lockdown** - Weekly merges won't break SDK 53 compatibility
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
