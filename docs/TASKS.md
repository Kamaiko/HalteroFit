# Tasks - Halterofit

Actionable tasks with Kanban tracking. For strategic overview and phase sequence, see ROADMAP.md.

## Table of Contents

1. [Kanban](#kanban)
2. [Phase 1: Authentication & Foundation](#phase-1-authentication--foundation)
3. [Phase 2: Workout Plans & Navigation](#phase-2-workout-plans--navigation)
4. [Phase 3: Active Workout Tracking](#phase-3-active-workout-tracking)
5. [Phase 4: Profile & Settings](#phase-4-profile--settings)
6. [Phase 5: Polish & Deployment](#phase-5-polish--deployment)

## Kanban

| TODO (Top 5)                                              | DOING | DONE (Last 5) |
| --------------------------------------------------------- | ----- | ------------- |
| **1.0.1** Jefit screenshots `[M]` 🟠 (NOTE: User pending) |       |               |
| **1.0.5** Typography/Spacing `[S]`                        |       |               |
| **1.0.2** Login wireframe `[S]`                           |       |               |
| **1.1.1** Login screen `[M]`                              |       |               |
| **1.1.2** Register screen `[M]`                           |       |               |

**Phases Overview**: See [ROADMAP.md](./ROADMAP.md) for strategic timeline and dependencies
**Recent Milestones**: See [CHANGELOG.md](./CHANGELOG.md) for completed phases and release notes

## Phase 1: Authentication & Foundation

**Timeline:** Weeks 9-12
**Est. Time:** ~40h (4 weeks) [+9h with UI design]
**Goal:** Login/Register screens + UI Design Foundation + Auth testing + Database sync reliability
**Dependencies:** Phase 0.6 (UI components + schema)
**Details:** [PHASE1_PLAN.md](./PHASE1_PLAN.md) (architecture, acceptance criteria)

<details>
<summary><b>1.0: UI Design Foundation</b> • 5 tasks</summary>

→ **Purpose:** Design wireframes and finalize design system before implementation

- [ ] **1.0.1** Analyze Jefit screenshots & document navigation flow (M - 3h)
  - NOTE: Screenshots to be provided by user (in progress)
  - Once received: Document exact navigation structure, page layouts, component hierarchy
  - Deliverables: Navigation flow diagram (textual), page list with responsibilities
  - Files: Update docs/DESIGN_SYSTEM.md § Navigation Patterns
  - Blocks: 1.0.2, 1.0.3, 1.0.4

- [ ] **1.0.2** Design Login screen wireframe (S - 1.5h)
  - Email/password inputs layout, error display, links placement
  - Component hierarchy: KeyboardAvoidingView > Container > Form > Inputs/Buttons
  - Dark theme colors from DESIGN_SYSTEM.md (#0A0A0A bg, #4299e1 primary)
  - Deliverables: Textual wireframe (component tree + spacing)
  - Files: Create docs/wireframes/login.md (or add to PHASE1_PLAN.md § Wireframes)
  - Blocks: 1.1.1 (Create login screen UI)

- [ ] **1.0.3** Design Register screen wireframe (S - 1.5h)
  - Email/password/confirm inputs, terms checkbox, validation errors
  - ScrollView for keyboard handling, multiple error display pattern
  - Deliverables: Textual wireframe
  - Files: docs/wireframes/register.md
  - Blocks: 1.1.2 (Create register screen UI)

- [ ] **1.0.4** Design Home/Dashboard wireframe (M - 2h)
  - Bottom Tab Navigation structure (5 tabs like Jefit), welcome message, "Start Workout" CTA
  - Tab bar design: icons, labels, active/inactive states
  - Empty state vs populated state
  - Deliverables: Textual wireframe + tab structure
  - Files: docs/wireframes/home.md
  - Blocks: Phase 2 (Workout navigation)

- [ ] **1.0.5** Finalize Typography & Spacing in DESIGN_SYSTEM.md (S - 2h)
  - Validate suggested values: Font (SF/Roboto), Scale (12-48px), Line heights (1.2/1.5)
  - Spacing: Base 4px, Scale 4-64px, Component padding (16/24px)
  - Document in DESIGN_SYSTEM.md (replace "To be defined" sections)
  - Test values on one screen (Login) to ensure readability
  - Files: docs/DESIGN_SYSTEM.md § Typography, § Spacing
  - Blocks: 1.1.1, 1.1.2 (need typography/spacing for implementation)

</details>

<details>
<summary><b>1.1: Auth UI & Screens</b> • 5 tasks</summary>

→ **Implementation Guide:** [PHASE1_PLAN.md § Task Details A](./PHASE1_PLAN.md#task-details-a-auth-ui--screens)

- [ ] **1.1.1** Create login screen UI (M - 2h) `[src/app/(auth)/login.tsx]`
  - Email/password inputs with validation
  - Login button with loading state
  - Links: "Forgot password" (→1.1.3), "Create account" (→1.1.2)
  - Error handling with Alert component
  - Uses: Button, Input, Label, Alert (React Native Reusables)
  - Blocked by: 1.0.2 (Login wireframe), 1.0.5 (Typography/Spacing)

- [ ] **1.1.2** Create register screen UI (M - 2h) `[src/app/(auth)/register.tsx]`
  - Email/password inputs with confirmation field
  - Validation: email format, password ≥8 chars, terms acceptance
  - Register button with loading state + link to login
  - Error display with Alert component
  - Uses: Button, Input, Label, Alert (React Native Reusables)
  - Blocked by: 1.0.3 (Register wireframe), 1.0.5 (Typography/Spacing)

- [ ] **1.1.3** Implement password reset flow (M - 2h) `[src/app/(auth)/reset-password.tsx]`
  - Request reset screen (email input) + deep link handler
  - Supabase password reset email integration
  - New password form with success/error states

- [ ] **1.1.4** Setup protected routes & navigation guards (S - 1.5h) `[src/app/_layout.tsx]`
  - Redirect: unauthenticated → login, authenticated → Workout tab
  - Loading screen during auth check
  - Deep linking support for auth flows

- [ ] **1.1.5** Implement Supabase Auth integration (M - 3h) `[src/services/auth/]`
  - Core functions: signIn(), signUp(), signOut(), refreshSession()
  - Session management (JWT tokens in MMKV via storage abstraction)
  - Error handling with user-friendly messages
  - Auth state persistence across app restarts

</details>

<details>
<summary><b>1.2: Testing Infrastructure</b> • 8 tasks</summary>

**Goal:** Achieve 90% auth test coverage to prevent security vulnerabilities and user lockout issues.

→ **Implementation Guide:** [PHASE1_PLAN.md § Task Details B](./PHASE1_PLAN.md#task-details-b-testing-infrastructure)

- [ ] **1.2.1** Create auth test infrastructure (factories, mocks, helpers) (S - 2h) 🔥 HIGH
  - Reusable test utilities for auth testing
  - Deliverables: `__tests__/__helpers__/auth/` (factories.ts, mocks.ts)
  - Provides: createTestAuthUser(), createTestSession(), mock Supabase, mock MMKV
  - Blocks: 1.2.2, 1.2.3, 1.2.4, 1.2.5, 1.2.6

- [ ] **1.2.2** Write auth service tests (login, register, reset password) (M - 4h) 🔥 CRITICAL
  - Coverage target: 90%+ (auth is critical path)
  - Test cases: valid/invalid credentials, network errors, rate limiting, duplicate email, weak password, token expiry
  - Blocked by: 1.1.5 (auth service), 1.2.1 (test infrastructure)

- [ ] **1.2.3** Write auth store tests (Zustand persist, rehydration) (S - 2h) 🟠 HIGH
  - Test cases: setUser(), signOut(), MMKV persist, rehydration on app start, corrupted JSON handling, loading state transitions
  - Blocked by: 1.2.1 (MMKV mock)

- [ ] **1.2.4** Write auth validation tests (database services) (S - 2h) 🔥 CRITICAL
  - Security tests: unauthenticated access, user ID mismatch, ownership validation, authorization bypass attempts
  - Blocked by: 1.2.1 (auth factories)

- [ ] **1.2.5** Write sync error handling tests (M - 4h) 🟠 MEDIUM
  - Test cases: network failures (timeout, 500, DNS), conflict resolution (last-write-wins), partial sync failures, auto-sync debouncing
  - Blocked by: 1.2.1 (network mocks)

- [ ] **1.2.6** Write MMKV storage edge case tests (S - 2h) 🟢 MEDIUM
  - Test cases: storage full, invalid JSON, encryption failures
  - Blocked by: 1.2.1 (MMKV mock)

- [ ] **1.2.7** Add CI coverage threshold (XS - 30min) 🔥 HIGH
  - Update jest.config.js → coverageThreshold (global: 70%, auth services: 90%, database: 80%)
  - Update `.github/workflows/ci.yml` to fail on threshold miss
  - Blocked by: None (can set immediately)

- [ ] **1.2.8** Setup Maestro E2E + Auth tests (L - 4h) `[.maestro/auth/]`
  - Install Maestro CLI + create `.maestro/auth/` directory
  - Write test flows: auth-login.yaml, auth-register.yaml, auth-password-reset.yaml
  - Document execution in [TESTING.md](./TESTING.md)
  - Run tests on Development Build to verify

</details>

<details>
<summary><b>1.3: Database Enhancements</b> • 3 tasks</summary>

**Goal:** Improve database reliability and prevent data loss/corruption.

→ **Implementation Guide:** [PHASE1_PLAN.md § Task Details C](./PHASE1_PLAN.md#task-details-c-database-enhancements)

- [ ] **1.3.1** Implement cascading delete logic (workout → exercises → sets) (S - 2h) 🟠 HIGH
  - Issue: deleteWorkout() only marks workout as deleted, leaves orphaned child records
  - Fix: Manually cascade through relations before marking deleted
  - File: [workouts.ts:664-698](../src/services/database/operations/workouts.ts#L664-L698)
  - Testing: Verify child records also deleted after sync

- [ ] **1.3.2** Enhance User model with relations & helper methods (M - 3h) 🟠 HIGH
  - Add: `workouts` relation (has_many), `getActiveWorkout()`, `getWorkoutCount()`
  - File: [User.ts](../src/services/database/local/models/User.ts)
  - Testing: Unit tests for helpers

- [ ] **1.3.3** Add sync retry with exponential backoff (L - 5h) 🟠 HIGH
  - Add: syncWithRetry(maxRetries = 3) with exponential backoff (1s, 2s, 4s)
  - Features: Auto-retry failed syncs, prevent server overload, persist failed syncs to offline queue (MMKV)
  - File: [sync.ts](../src/services/database/remote/sync.ts)
  - Testing: Manual E2E (network failure scenarios)

</details>

## Phase 2: Workout Plans & Navigation

**Timeline:** Weeks 11-14
**Est. Time:** ~40h (4 weeks)
**Goal:** Jefit-style navigation with Find/Planned tabs + Plan management
**Dependencies:** Phase 1 (Auth for user-specific plans), Phase 0.6.8 (ExerciseDB)

- [ ] 2.1 **Implement Sync Conflict Detection** (L - 8h) `[JUST-IN-TIME]` `[src/services/database/remote/sync.ts]`
  - Must complete before multi-device sync becomes active
  - Implement conflict resolution strategy (last-write-wins with timestamp)
  - Add `_status` field handling (created, updated, deleted)
  - Test with simulated conflicts (multiple devices)
  - WatermelonDB sync protocol validation
  - **Trigger:** Before activating multi-device sync in production

- [ ] 2.2 **Install Navigation Components** (S - 1h) `[JUST-IN-TIME]` `[src/components/ui/]`
  - Install Sheet/Tabs components from React Native Reusables
  - Required for workout navigation (Phase 2)
  - Components: BottomSheet, Tabs, Modal
  - Configure with NativeWind theme
  - Test basic Sheet/Tabs functionality
  - **Trigger:** Start of Phase 2 development

- [ ] 2.3 **Create bottom tab navigation** (M - 2h) `[src/app/(tabs)/_layout.tsx]`
  - 2 main tabs: Workout, Profile
  - Tab icons (from @expo/vector-icons)
  - Active/inactive states
  - Dark theme styling
  - Tab bar positioned at bottom

- [ ] 2.4 **Create Workout sub-tabs** (M - 3h) `[src/app/(tabs)/workout/_layout.tsx]`
  - 2 sub-tabs: Find, Planned
  - Horizontal tab bar (top of screen)
  - Sub-tab switching animations
  - Default to "Planned" tab on first load
  - Settings icon (gear) in header → Phase 4.3

- [ ] 2.5 **Create "All Plans" modal** (M - 2h) `[src/components/workout/AllPlansModal.tsx]`
  - Modal triggered by "All Plans" button (top-right)
  - List of saved plans (FlashList)
  - Each item: Plan name, days count, last modified date
  - Tap to activate plan → switches to "Planned" tab
  - Empty state: "No saved plans yet"
  - Close button

- [ ] 2.6 **Create "Find" tab UI** (M - 3h) `[src/app/(tabs)/workout/find.tsx]`
  - Browse pre-made workout plans
  - Plan cards: Name, image, description, days count, difficulty
  - Tap plan → View plan details
  - "Save Plan" button → Adds to "All Plans" (2.5)
  - FlashList for performance
  - Search/filter (optional for MVP, defer if time constraint)

- [ ] 2.7 **Seed 1-2 workout plan templates** (S - 1h) `[scripts/seed-plans.ts]`
  - Create 1-2 example plans (e.g., "PPL 5x/week", "Upper/Lower 4x/week")
  - Insert to Supabase workout_plans table
  - Mark as is_template = true (public templates)
  - Include exercises from ExerciseDB (requires 0.6.8 complete)
  - Sync to WatermelonDB

- [ ] 2.8 **Implement "Create Plan" flow** (L - 4h) `[src/app/(tabs)/workout/create-plan.tsx]`
  - Button in "Planned" tab header (top-right)
  - On tap: Create new plan with name "New Workout"
  - Initialize with 1 day: "MON Workout Day #1"
  - Redirect to "Planned" tab showing new plan
  - Replace current active plan display
  - Store plan in WatermelonDB + Supabase

- [ ] 2.9 **Implement Plan CRUD operations** (M - 2h) `[src/services/database/plans.ts]`
  - Rename plan (tap plan name in header)
  - Delete plan (confirmation dialog)
  - Activate plan (switch active plan)
  - Duplicate plan (optional for MVP)
  - WatermelonDB + Supabase sync

- [ ] **2.10** Create Workout Day card component (M - 3h) `[src/components/workout/WorkoutDayCard.tsx]`
  - Card design from emptyPlan.jpeg/FullPlan.jpeg
  - Left: Muscle group icon (auto-generated from exercises)
  - Center: Day name, Est. time, exercises count, last completed date
  - Right: 3-dots menu (rename, delete), chevron (view details)
  - Blue border for current day
  - Drag handle for reordering (optional for MVP)

- [ ] 2.11 **Implement "Add a day" functionality** (M - 2h) `[src/components/workout/AddDayButton.tsx]`
  - Button below last workout day card
  - On tap: Create new day "Workout Day #N" (N = count + 1)
  - Auto-scroll to new day
  - Update plan in WatermelonDB + Supabase

- [ ] 2.12 **Implement Workout Day CRUD** (M - 2h) `[src/components/workout/WorkoutDayMenu.tsx]`
  - 3-dots menu opens bottom sheet
  - Options: Rename, Delete (with confirmation)
  - Rename: Inline text input or modal
  - Delete: Remove day from plan, shift remaining days
  - Update plan in WatermelonDB + Supabase

- [ ] 2.13 **Create exercise selector modal** (L - 4h) `[src/components/workout/ExerciseSelector.tsx]`
      **Tech**: WatermelonDB reactive queries + FlashList + expo-image (all installed ✓)
  - Modal with search bar (auto-focused)
  - **Real-time search** (300ms debounce) on 1,300+ ExerciseDB exercises:
    ```typescript
    exercises.query(Q.where('name', Q.like(`%${term}%`))).observeWithColumns(['name', 'body_parts', 'equipments']);
    ```
  - Filter by body_parts, equipments (bottom sheet with JSON array queries)
  - Exercise cards: Name, GIF thumbnail (expo-image cached), body parts, equipments
  - FlashList for performance (estimatedItemSize: 80)
  - Tap exercise → Add to workout day
  - Close modal after adding

  **Jefit Pattern**: Real-time search with instant results (confirmed via research)

- [ ] 2.14 **Add exercises to workout days** (M - 3h) `[src/app/(tabs)/workout/day-details/[dayId].tsx]`
  - "Day Details" tab/screen showing exercises for selected day
  - Exercise list (FlashList): Name, sets, reps, rest time
  - "Add Exercise" button → Opens 2.13 selector
  - Drag to reorder exercises (optional for MVP)
  - Tap exercise → Edit sets/reps (modal or inline)
  - Delete exercise (swipe or 3-dots menu)
  - Save changes to WatermelonDB + Supabase

## Phase 3: Active Workout Tracking

**Timeline:** Weeks 15-17
**Est. Time:** ~27h (3 weeks)
**Goal:** Start workout → Swipe exercises → Log sets → Rest timer
**Dependencies:** Phase 2 (workout plans + exercises)

- [ ] 3.1 **Create active workout screen UI** (L - 4h) `[src/app/(tabs)/workout/active.tsx]`
  - Full-screen view (hide tabs while workout active)
  - Header: Workout name, duration timer, "End Workout" button
  - Exercise cards (swipeable, one visible at a time)
  - Footer: Rest timer display, set logging interface
  - Skeleton state while loading

- [ ] 3.2 **Implement swipe gesture between exercises** (M - 3h) `[src/components/workout/ExerciseSwiper.tsx]`
      **Tech**: react-native-gesture-handler + react-native-reanimated v4 (both installed ✓)
  - Horizontal Pan gesture (swipe left/right to navigate exercises)
  - **Spring animations** (per DESIGN_SYSTEM.md):
    ```typescript
    withSpring(targetValue, { damping: 20, stiffness: 90 });
    ```
  - Timing: 200-300ms transitions
  - Exercise indicator (1/5, 2/5, etc.) with animated progress
  - Edge case: Disable swipe during set input (prevent accidental navigation)
  - Haptic feedback on exercise change (`Haptics.impactAsync()`)

  **Jefit Pattern**: Swipe left/right navigation confirmed (research: "seamless exercise selection by swiping")

- [ ] 3.3 **Create set logging interface** (L - 4h) `[src/components/workout/SetLogger.tsx]`
  - Set list: Display all sets for current exercise
  - Each set row: Set # (or "W" for warmup), Weight input, Reps input, Checkmark
  - Warmup toggle: Tap set # to toggle "W" marker
  - Quick weight buttons: +5kg, +2.5kg, -2.5kg, -5kg (or lbs)
  - Tap checkmark → Save set to WatermelonDB
  - Visual: Completed sets grayed out, current set highlighted

- [ ] 3.4 **Auto-fill weight/reps from last workout** (M - 2h) `[logic layer]`
  - Query WatermelonDB for last completed workout with same exercise
  - Pre-fill weight and reps for all sets
  - User can edit before saving
  - Handle first-time exercise (no history): Empty fields
  - Display "Last workout: 100kg × 8 reps" as hint

- [ ] 3.5 **Implement rest timer with notifications** (M - 4h) `[src/components/workout/RestTimer.tsx]`
      **Tech**: expo-notifications (already installed ✓)
  - Auto-start after set logged (default 90s, adjustable in settings)
  - Circular progress indicator (Reanimated v4)
  - Countdown timer (MM:SS format)
  - Controls: +15s, -15s, Skip, Restart
  - Audio + haptic feedback at 0:00
  - **Local scheduled notification** when timer complete (works even if app killed)
    - Use `Notifications.scheduleNotificationAsync()` with trigger delay
    - Background/killed state support (Android/iOS)

  **Jefit Learning**: Recent Jefit versions had negative UX feedback - timer "too dominant", blocks set selection. **Design balance**: Timer visible but NOT blocking UI interactions

- [ ] 3.6 **Configure notification permissions & channels** (S - 1h) `[src/services/notifications/]`
      **Tech**: expo-notifications (already installed ✓)
  - Request notification permissions on first timer use
  - Setup notification channels (Android): "Rest Timer" channel
  - Configure notification behavior (sound, vibration, priority)
  - Handle notification tap → navigate to active workout screen
  - Test notifications in background/killed states (physical device)

- [ ] 3.7 **Implement workout completion flow** (M - 2h) `[workout end logic]`
  - "End Workout" button (confirmation dialog)
  - Calculate total duration, volume, exercises completed
  - Set completed_at timestamp
  - Save to WatermelonDB, sync to Supabase
  - Navigate to workout summary screen (simple version, no analytics)
  - Clear active workout state

- [ ] 3.8 **Create workout history screen** (M - 3h) `[src/app/(tabs)/workout/history.tsx]`
  - List of past workouts (FlashList, paginated 20/page)
  - Each item: Date, duration, exercises count, volume
  - Tap → View workout detail (exercises, sets, reps logged)
  - Swipe actions: "Repeat" (start new workout from this template), "Delete"
  - Empty state: "No workouts logged yet"

- [ ] 3.9 **Add Maestro E2E workout tests** (L - 3h) `[.maestro/workout/]`
  - Write workout-start.yaml (start workout from plan)
  - Write workout-log-set.yaml (log set, verify saved)
  - Write workout-swipe.yaml (swipe between exercises)
  - Write workout-rest-timer.yaml (rest timer flow)
  - Write workout-complete.yaml (end workout, verify history)
  - Run tests on Development Build to verify

## Phase 4: Profile & Settings

**Timeline:** Week 18
**Est. Time:** ~11h (1-2 weeks)
**Goal:** Profile screen, settings, GDPR compliance

- [ ] 4.1 **Create Profile screen UI** (M - 2h) `[src/app/(tabs)/profile.tsx]`
  - Avatar (initials, no image upload for MVP)
  - Username/email display
  - Stats: Total workouts, total volume, streak
  - Buttons: Settings, Logout
  - Dark theme styling

- [ ] 4.2 **Implement logout functionality** (S - 1h) `[auth service]`
  - "Logout" button in Profile screen
  - Clear Supabase session
  - Clear MMKV auth tokens
  - Clear WatermelonDB user data (optional for MVP)
  - Redirect to login screen

- [ ] 4.3 **Create Settings screen** (M - 2h) `[src/app/(tabs)/profile/settings.tsx]`
  - Accessible from gear icon (top-right header)
  - Units section: kg/lbs toggle
  - Account section: Export data, Delete account
  - Save preferences to Supabase + MMKV
  - Dark theme styling

- [ ] 4.4 **Implement account deletion (GDPR)** (M - 3h) `[GDPR compliance]`
  - "Delete Account" button in Settings (destructive style)
  - Confirmation dialog: "This will permanently delete all your data"
  - Cascade delete: Supabase foreign keys delete all workouts, plans, sets
  - Clear WatermelonDB local database
  - Clear MMKV storage
  - Logout and redirect to login

- [ ] 4.5 **Implement data export (GDPR)** (M - 3h) `[GDPR compliance]`
  - "Export My Data" button in Settings
  - Generate JSON file: Profile, plans, workouts, exercises, sets
  - Include metadata: export_date, user_id, total_workouts
  - Share via system share sheet (email, cloud storage)
  - Show success message with file path

## Phase 5: Polish & Deployment

**Timeline:** Week 19
**Est. Time:** ~9h (1 week)
**Goal:** Production-ready MVP

- [ ] 5.1 **Verify Sentry monitoring** (S - 1h) `[already setup in 0.5.5]`
  - **Note:** DSN should be configured in Phase 1 (not Phase 5) to catch errors early. This task verifies production monitoring works correctly.
  - Test error reporting (throw test error)
  - Verify crash reports appear in Sentry dashboard
  - Verify performance monitoring (slow query simulation)
  - Setup alerts: Crash rate >0.5%, error rate >5%
  - Confirm production-only tracking (disabled in dev)

- [ ] 5.2 **Performance optimization** (M - 3h) `[bundle + cold start]`
  - Run react-native-bundle-visualizer
  - Identify large dependencies, remove unused
  - Code splitting for heavy features (charts defer to Post-MVP)
  - Optimize WatermelonDB initial queries
  - Lazy load screens with React.lazy()
  - Target: <10MB bundle, <2s cold start

- [ ] 5.3 **Create EAS production build** (M - 2h) `[EAS Build]`
  - Create production profile in eas.json
  - Configure environment variables for production
  - Build Android: eas build --platform android --profile production
  - Build iOS: eas build --platform ios --profile production
  - Test builds on physical devices

- [ ] 5.4 **Setup TestFlight/Play Store internal testing** (M - 2h)
  - iOS: Submit to TestFlight via eas submit
  - Android: Submit to Play Store Internal Testing
  - Add 5-10 internal testers (friends, colleagues)
  - Document installation instructions

- [ ] 5.5 **Create beta testing guide** (S - 1h) `[docs/BETA_TESTING_GUIDE.md]`
  - Installation instructions (TestFlight/Play Store links)
  - What to test (critical user flows)
  - How to report bugs (email, form, GitHub issues)
  - Known limitations
  - Expected timeline for fixes
