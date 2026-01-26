# Tasks

Actionable tasks with Kanban tracking. For strategic overview, see [ROADMAP.md](./ROADMAP.md).

**Last Updated:** 2026-01-26

## Table of Contents

1. [Kanban](#kanban)
2. [Phase 1: Exercise Library](#phase-1-exercise-library)
3. [Phase 2: Plans & Routines](#phase-2-plans--routines)
4. [Phase 3: Active Workout Tracking](#phase-3-active-workout-tracking)
5. [Phase 4: Auth & Settings](#phase-4-auth--settings)
6. [Phase 5: Polish & Deployment](#phase-5-polish--deployment)

## Kanban

| TODO (Top 5)                              | DOING | DONE (Last 5)                        |
| ----------------------------------------- | ----- | ------------------------------------ |
| **2.1.2** DayDetailsScreen `[M]` 🔴       |       | **2.1.1** WorkoutOverviewScreen      |
| **2.1.3** AllPlansScreen `[M]`            |       | **1.1.3** Exercise detail screen     |
| **2.1.4** EditDayScreen `[M]`             |       | **1.1.2** ExerciseListScreen         |
| **2.1.5** CreateEditPlanScreen `[S]`      |       | **1.1.1** ExerciseSelectorScreen     |
| **2.1.6** AddDayDialog `[S]`              |       | **1.0.1** Wireframes documentation   |

**Recent Milestones**: See [CHANGELOG.md](./CHANGELOG.md) for completed phases

---

## Phase 1: Exercise Library ✅

**Status:** Complete
**Timeline:** Weeks 7-8
**Goal:** Browse and search 1,300+ exercises from ExerciseDB

<details>
<summary><b>1.0: Documentation & Wireframes</b> • 1 task ✅</summary>

- [x] **1.0.1** Create wireframes documentation from Jefit analysis (L - 6h)
      Deliverables: [WIREFRAMES.md](./WIREFRAMES.md) (620 lines), 35 screenshots
      Files: docs/WIREFRAMES.md, docs/reference/jefit/screenshots/

</details>

<details>
<summary><b>1.1: Exercise Screens</b> • 3 tasks ✅</summary>

- [x] **1.1.1** Create ExerciseSelectorScreen (M - 3h) `[src/app/(tabs)/exercises/index.tsx]`
      Muscle group grid with "Show All" button
      Files: src/app/(tabs)/exercises/index.tsx

- [x] **1.1.2** Create ExerciseListScreen (L - 4h) `[src/app/(tabs)/exercises/list.tsx]`
      Search bar, filter chips, FlashList of 1,300+ exercises
      Files: src/app/(tabs)/exercises/list.tsx

- [x] **1.1.3** Create ExerciseDetailScreen (M - 3h) `[src/app/(tabs)/exercises/[id].tsx]`
      Exercise GIF, description, muscles, equipment
      Files: src/app/(tabs)/exercises/[id].tsx

</details>

---

## Phase 2: Plans & Routines

**Status:** 🔄 In Progress
**Timeline:** Weeks 9-11
**Est. Time:** ~25h (3 weeks)
**Goal:** Create, edit, and manage workout plans with days and exercises
**Dependencies:** Phase 1 (Exercise Library)
**Reference:** [WIREFRAMES.md § 3. Workout Tab](./WIREFRAMES.md#3-workout-tab)
**Audit:** [PHASE2_AUDIT.md](./PHASE2_AUDIT.md)

### 2.1: Workout Tab Screens

- [x] **2.1.1** WorkoutOverviewScreen (M - 4h) `[src/app/(tabs)/workout.tsx]` ✅ DONE
      Plan header, Overview/Day Details tabs, DayCard list
      Delete day, "Add a day" button, menu bottom sheet
      **Components:** PlanHeader, DayCard (src/components/workout/)
      **Hook:** useWorkoutScreen (src/hooks/workout/) - extracted for testability
      **Note:** SwipeableTabs disabled (PagerView crash), using SimpleTabs

- [ ] **2.1.2** DayDetailsScreen (M - 3h) 🔴 NEXT
      Exercise list for selected day
      "Add Exercise" button → Exercise picker
      **Ready:** Exercise count query implemented ✅

- [ ] **2.1.3** AllPlansScreen (M - 3h) `[src/app/plans/index.tsx]`
      Grid of PlanCards (2 columns)
      "Create Plan" button, plan selection
      **Status:** Placeholder created

- [ ] **2.1.4** EditDayScreen (M - 3h) `[src/app/plans/[id]/day/[dayId]/edit.tsx]`
      Edit day name, reorder exercises
      Configure sets/reps per exercise
      "Delete this day" button

- [ ] **2.1.5** CreateEditPlanScreen (S - 2h)
      Plan name, description, cover image
      Create new / Edit existing

- [ ] **2.1.6** AddDayDialog (S - 1h)
      Day name input
      Day of week selector (optional)

### 2.2: Plan Operations (Existing)

- [x] **2.2.1** Plan CRUD operations ✅ `[src/services/database/operations/plans.ts]`
      createPlan(), getPlanWithDays(), observeActivePlan()
      **Note:** updatePlan(), deletePlan() may need verification

- [x] **2.2.2** Day CRUD operations ✅
      createPlanDay(), deletePlanDay()
      **Note:** updatePlanDay(), reorderDays() pending

- [x] **2.2.3** PlanDayExercise operations (M - 2h) ✅ PARTIAL
      addExerciseToDay(), removeExerciseFromDay() - existing
      getExerciseCountByDay(), getExerciseCountsByDays() ✅
      **Tests:** 10 unit tests in plans.test.ts

### 2.3: UI Components

- [x] **2.3.1** PlanHeader component ✅ `[src/components/workout/PlanHeader.tsx]`
      Gradient/image background, plan name, "All Plans" button

- [x] **2.3.2** DayCard component ✅ `[src/components/workout/DayCard.tsx]`
      Selection indicator, stats, menu button, navigation arrow

- [ ] **2.3.3** PlanCard component (S - 1.5h) `[src/components/plans/PlanCard.tsx]`
      For AllPlansScreen grid

---

## Phase 3: Active Workout Tracking

**Status:** ⬜ Pending
**Timeline:** Weeks 12-14
**Est. Time:** ~27h (3 weeks)
**Goal:** Start workout → Swipe exercises → Log sets → Rest timer
**Dependencies:** Phase 2 (Plans & Routines)
**Reference:** [WIREFRAMES.md § 4. Active Workout](./WIREFRAMES.md#4-active-workout)

### 3.1: Workout Screens

- [ ] **3.1.1** Create ActiveWorkoutScreen (L - 5h) `[src/app/workout/active.tsx]`
      Exercise GIF, progress dots, sets table
      Swipe left/right for exercise navigation
      **Ref:** WIREFRAMES.md § 4.1 Active Workout Screen

- [ ] **3.1.2** Create WorkoutSummaryScreen (M - 3h) `[src/app/workout/summary.tsx]`
      "Workout Complete!" title, stats (duration, volume)
      Exercise list with logged sets
      "End & Save Workout" button
      **Ref:** WIREFRAMES.md § 4.3 Workout Summary Screen

### 3.2: Set Logging

- [ ] **3.2.1** Create SetRow component (M - 3h) `[src/components/workout/SetRow.tsx]`
      Set #, weight input, reps input, checkmark
      Tap checkmark → log set

- [ ] **3.2.2** Implement auto-fill from last workout (M - 2h)
      Query last workout with same exercise
      Pre-fill weight/reps

- [ ] **3.2.3** Implement swipe gesture between exercises (M - 3h)
      Horizontal pan gesture with spring animations
      Progress indicator (1/5, 2/5, etc.)

### 3.3: Rest Timer

- [ ] **3.3.1** Create RestTimerWidget (L - 4h) `[src/components/workout/RestTimerWidget.tsx]`
      Circular progress, countdown, +15s/-15s buttons
      Expandable view with configuration
      **Ref:** WIREFRAMES.md § 4.2 Rest Timer Widget

- [ ] **3.3.2** Configure notifications (S - 1.5h)
      Request permissions, setup channels
      Local notification when timer complete

### 3.4: Workout Flow

- [ ] **3.4.1** Implement workout start flow (M - 2h)
      Create workout record from plan
      Initialize exercise queue

- [ ] **3.4.2** Implement workout completion flow (M - 2h)
      Calculate duration, volume, records
      Save to WatermelonDB, sync to Supabase

- [ ] **3.4.3** Implement discard workout dialog (S - 1h)
      Confirmation dialog, clear workout state
      **Ref:** WIREFRAMES.md § 4.4 Discard Workout Dialog

---

## Phase 4: Auth & Settings

**Status:** ⬜ Pending
**Timeline:** Weeks 15-16
**Est. Time:** ~20h (2 weeks)
**Goal:** Login/Register + Profile + Settings + Cloud sync
**Dependencies:** None (can run in parallel with Phase 3)
**Reference:** [WIREFRAMES.md § 6. Settings](./WIREFRAMES.md#6-settings)

### 4.1: Auth Screens

- [ ] **4.1.1** Create LoginScreen (M - 2h) `[src/app/(auth)/login.tsx]`
      Email/password inputs, login button, error handling
      Links: "Forgot password", "Create account"

- [ ] **4.1.2** Create RegisterScreen (M - 2h) `[src/app/(auth)/register.tsx]`
      Email/password/confirm inputs, validation
      Terms acceptance checkbox

- [ ] **4.1.3** Implement password reset flow (M - 2h) `[src/app/(auth)/reset-password.tsx]`
      Request reset screen, deep link handler

- [ ] **4.1.4** Setup protected routes (S - 1.5h) `[src/app/_layout.tsx]`
      Redirect unauthenticated → login
      Loading screen during auth check

### 4.2: Auth Service

- [ ] **4.2.1** Implement Supabase Auth integration (M - 3h) `[src/services/auth/]`
      signIn(), signUp(), signOut(), refreshSession()
      Session management with MMKV

- [ ] **4.2.2** Create auth test infrastructure (S - 2h) `[__tests__/__helpers__/auth/]`
      Factories, mocks, test utilities

- [ ] **4.2.3** Write auth service tests (M - 3h)
      Coverage target: 90%+

### 4.3: Settings & Profile

- [ ] **4.3.1** Create SettingsScreen (M - 2h) `[src/app/settings/index.tsx]`
      Profile card, Dark Mode, Units (kg/lbs), Rest Timer default
      **Ref:** WIREFRAMES.md § 6.1 Settings Screen

- [ ] **4.3.2** Create ProfileScreen (S - 1.5h) `[src/app/settings/profile.tsx]`
      Name, gender, date of birth
      **Ref:** WIREFRAMES.md § 6.2 Profile Screen

- [ ] **4.3.3** Implement logout (S - 1h)
      Clear session, redirect to login

---

## Phase 5: Polish & Deployment

**Status:** ⬜ Pending
**Timeline:** Week 17
**Est. Time:** ~9h (1 week)
**Goal:** Production-ready MVP

- [ ] **5.1.1** Performance optimization (M - 3h)
      Bundle analysis, lazy loading, cold start optimization
      Target: <10MB bundle, <2s cold start

- [ ] **5.1.2** Verify Sentry monitoring (S - 1h)
      Test error reporting, setup alerts

- [ ] **5.1.3** Create EAS production build (M - 2h)
      Android + iOS builds, test on physical devices

- [ ] **5.1.4** Setup TestFlight/Play Store internal testing (M - 2h)
      Submit builds, add internal testers

- [ ] **5.1.5** Create beta testing guide (S - 1h) `[docs/BETA_TESTING_GUIDE.md]`
      Installation instructions, what to test, bug reporting
