# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Email/password authentication with Supabase (sign-in, sign-up, sign-out, password reset, email verification)
- Official branding on auth screens (wordmark + BrandIcon component)
- Auth error mapping with user-friendly messages (INVALID_CREDENTIALS, EMAIL_TAKEN, NETWORK_ERROR, etc.)
- Email verification banner for unverified users
- Settings screen with sign-out button
- Auth service unit tests (error mapping, signOut resilience, createSessionFromUrl)
- WatermelonDB↔Supabase bidirectional sync (7 tables)
- Postgres RPC functions: `pull_changes()` / `push_changes()` (SECURITY DEFINER)
- Auto-sync on data changes (2s debounce)
- Best-effort sync before sign-out (10s timeout)
- `waitForInitialSync()` gate to prevent duplicate plan creation
- Exercise re-seeding on sign-in after DB wipe

### Changed

- RLS policies optimized: `auth.uid()` → `(select auth.uid())`
- Dropped unused indexes on exercises table (local-only data)
- Dropped exercise FK constraints (exercises not synced to Supabase)
- Reduced dev log noise (debounced "Data changed" log, formattedLogs error-only)

### Fixed

- Security leak, race condition, and mock-auth gate in auth flow
- Mock auth gated behind `EXPO_PUBLIC_ENABLE_MOCK_AUTH` env var
- Exercises marked dirty after seeding (false hasUnsyncedChanges)
- User record conflict on re-login (ensureLocalUserRecord race)
- Duplicate default plans on sign-out → sign-in
- Day Details showing 0 exercises after sign-out → sign-in

## [0.11.0] - 2026-03-02

### Added

- pnpm workspace + Turborepo monorepo (apps/mobile active, apps/web stub, packages/)
- apps/mobile/.claude/CLAUDE.md and apps/web/.claude/CLAUDE.md per-app Claude instructions
- CI: pnpm-aware workflows, Expo-compatible dep-check.yml, per-app .prettierignore files

### Changed

- Mobile source code moved to apps/mobile/ (import paths unchanged via tsconfig aliases)
- Dependabot ignore list expanded: react-test-renderer, nativewind, tailwindcss

### Fixed

- metro.config.js watchFolders was replacing (now extends) Expo defaults
- react-native-safe-area-context pinned to Expo SDK 54 compatible ~5.6.0
- icon.tsx TypeScript error (AnyIconName union → per-pack if/else branches)
- dep-check.yml npm → pnpm commands
- 8 ESLint no-console warnings (exercises.ts disable, authStore/workoutStore → console.warn)

## [0.10.0] - 2026-02-21

### Changed

- Consolidated test suite from 139 tests to 53 tests across 7 suites via impact×probability audit
- Replaced duplicate assertions with `it.each` and shared patterns across 7 test files
- Updated ARCHITECTURE.md and TESTING.md to remove ghost entries and align with actual test coverage

### Added

- 5 high-value gap tests covering reorder+add, batch add, and duplicate rejection scenarios

### Removed

- `errors.test.ts` (16 framework glue tests — testing ORM internals, not behavior)
- `formatters.test.ts` (9 cosmetic tests with no risk-based value)
- 66 zero-value tests from 7 remaining files

## [0.9.0] - 2026-02-15

### Added

- Split "Back" muscle group into "Lats" and "Upper Back" — two distinct SVG crop regions
- Cardio group icon: cardiovascular-dominant workout days now show a heart icon
- Implied secondary slug rules (declarative, no vendored data changes):
  - Upper Back ↔ Lats bidirectional — compensates for 0% ExerciseDB cross-reference
  - Upper Back → Trapezius auto-injection as secondary
  - Trapezius → Neck auto-injection when traps is primary
  - Chain prevention: snapshot iteration stops upper-back → traps from cascading to neck
- Multi-slug mapping: generic "Back" secondary now highlights both upper-back and lats (11 exercises)
- 10 new muscle mapping tests covering multi-slug, implied secondaries, chain prevention, and dedup (39 total, was 29)

### Changed

- Renamed "Shoulders" muscle group to "Delts" — consistent with ExerciseDB naming
- Reordered MuscleGroupIcon 5×3 grid to logical body-region grouping (upper → core → lower)
- Fine-tuned SVG viewBox positioning for abs, lats, chest, hamstrings, traps, and show-all icons
- Added neck region to traps `highlightSlugs` for anatomically complete trapezius rendering

## [0.8.0] - 2026-01-27

### Changed

- Exercise detail GIF section now extends edge-to-edge to the true screen edge (under status bar)
- Replaced `SafeAreaView` with `useSafeAreaInsets` for precise safe area control
- Back button positioning now respects safe area insets dynamically
- Scroll overlay fades in over the GIF when scrolling using Reanimated (`scrollEventThrottle={16}` for 60fps)

## [0.7.0] - 2026-01-27

### Added

- `WorkoutDayDetailsContent` component and `DayExerciseCard` (thumbnail, muscle info, sets/reps display)
- "Add Exercise" button with exercise-picker navigation from the day details screen
- Drag-to-reorder with `react-native-draggable-flatlist`: 6-dot drag handle, `reorderPlanDayExercises()` for batch order persistence, and optimistic UI feedback
- Swipe-to-delete with `ReanimatedSwipeable`: `deleteExerciseOptimistic()` with `LayoutAnimation`, optimistic count update
- `useFocusEffect` for data refresh on return to the screen
- `stripStepPrefix` utility for cleaning up instruction text

### Changed

- Start Workout button updated to full-width with height 56
- Added `paddingBottom: 160` for over-scroll clearance past the floating button

## [0.6.0] - 2026-01-26

### Added

- `ExerciseListView` shared component — 90% code reuse between exercise browser and picker
- `exercise-browser.tsx` and `exercise/[id].tsx` as root-level full-screen routes (no tab bar)
- `capitalizeWords` shared utility in `src/utils/strings.ts`
- Barrel export file for exercise components (`src/components/exercises/index.ts`)

### Changed

- Moved exercise browser, exercise picker, and exercise detail to root-level routes (full-screen, floating back button)
- Refactored `ExerciseCard` to support browse and select modes
- Fixed stale closure in `useExerciseSearch` with `useRef` pattern — resolves exhaustive-deps ESLint warnings
- Applied `memo()` to `ExerciseCard`, `ExerciseListView`, and `LoadingFooter`; `useMemo`/`useCallback` for computed values and handlers
- Updated `_layout.tsx` with new `Stack.Screen` routes

### Removed

- Deleted tab-scoped exercise screens: `(tabs)/exercises/list.tsx`, `(tabs)/exercises/[id].tsx`, `(tabs)/exercises/picker.tsx`

## [0.5.0] - 2026-01-17

### Changed

- Upgraded Expo SDK from 53 to 54.0.31
- Upgraded React Native from 0.79.7 to 0.81.5
- Upgraded React from 19.0.0 to 19.1.0
- Updated `expo-router` 5.x → 6.x, `expo-image` 2.x → 3.x, `@sentry/react-native` 6.x → 7.x
- Updated `@shopify/flash-list` 1.8.3 → 2.0.2 (New Architecture optimized)
- Updated `@shopify/react-native-skia` to SDK 54 compatible version (2.2.12)
- Downgraded Jest from 30.x to 29.7.0 and `@types/jest` to 29.5.14 (SDK 54 requirement)
- Updated `jest-expo` from 53.x to 54.x
- Moved all Expo plugins to `app.json`; removed `app.config.ts`

### Removed

- Deleted `app.config.ts` (plugins now declared directly in `app.json`)
- Deleted `plugins/withNdkVersion.js` (obsolete — EAS Build handles NDK version)

## [0.4.0] - 2026-01-13

### Changed

- Upgraded `react-native-reanimated` from 3.17.4 to 4.1.0
- Updated `babel.config.js` plugin from `reanimated/plugin` to `worklets/plugin` (Reanimated 4 requirement)
- Pinned `react` and `react-test-renderer` to 19.0.0 to prevent renderer version mismatch
- Locked `react-native-worklets` to 0.5.x; blocked all Dependabot updates for worklets, react, and react-test-renderer

### Removed

- Reverted Dependabot's worklets 0.7.1 bump (incompatible with Reanimated 4)

## [0.3.0] - 2026-01-12

### Changed

- Added `.npmrc` with `legacy-peer-deps=true` for CI compatibility
- Added `package.json` overrides for React version alignment across peer deps
- Configured Dependabot to lock all SDK 53-coupled packages and enable auto-merge for safe dev dependencies

### Removed

- Removed `react-native-skia` (ghost duplicate of `@shopify/react-native-skia`)
- Removed `simple-statistics` (premature — deferred to Phase 4+)
- Removed `react-refresh` (auto-installed by Expo, not needed as an explicit dependency)

## [0.2.0] - 2025-11-06

### Added

- Installed React Native Reusables component library with `@expo/vector-icons`
- Configured dark theme with NativeWind v4
- Installed Phase 1 auth UI components
- Bulk-imported ExerciseDB library (1,500+ exercises) into Supabase via GitHub dataset
- Documented design system with comprehensive UX patterns

### Fixed

- Removed `nutrition_phase` columns from Supabase `users` and `workouts` tables (schema mismatch)

## [0.1.0] - 2025-11-04

### Added

- WatermelonDB local database with bidirectional Supabase sync protocol
- MMKV encrypted storage (replaces AsyncStorage — 10–30× faster)
- Victory Native charts with Skia-based 60fps animations
- `expo-image` configured with memory and disk caching
- EAS Build setup with `eas.json` configuration
- WatermelonDB models and schema
- Zustand persist for user ID and workout store
- Error handling layer with Sentry integration for error monitoring
- FlashList configured for optimized list rendering
- Jest testing infrastructure

[Unreleased]: https://github.com/ppmusic/halterofit/compare/v0.11.0...HEAD
[0.11.0]: https://github.com/ppmusic/halterofit/compare/v0.10.0...v0.11.0
[0.10.0]: https://github.com/ppmusic/halterofit/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/ppmusic/halterofit/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/ppmusic/halterofit/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/ppmusic/halterofit/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/ppmusic/halterofit/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/ppmusic/halterofit/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/ppmusic/halterofit/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/ppmusic/halterofit/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/ppmusic/halterofit/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/ppmusic/halterofit/releases/tag/v0.1.0
