# Tasks

Actionable tasks with Kanban tracking. For strategic overview, see [ROADMAP.md](./ROADMAP.md).

**Last Updated:** 2026-01-29

## Table of Contents

1. [Kanban](#kanban)
2. [Phase 1: Exercise Library](#phase-1-exercise-library)
3. [Phase 2: Plans & Routines](#phase-2-plans--routines)
4. [Phase 3: Active Workout Tracking](#phase-3-active-workout-tracking)
5. [Phase 4: Auth, Settings & Progress](#phase-4-auth-settings--progress)
6. [Phase 5: Home Dashboard & Polish](#phase-5-home-dashboard--polish)
7. [Phase 6: Post-MVP Analytics & Enhancements](#phase-6-post-mvp-analytics--enhancements)

## Kanban

| TODO (Top 5)                              | DOING                                    | DONE (Last 5)                        |
| ----------------------------------------- | ---------------------------------------- | ------------------------------------ |
| **2.1.3** AllPlansScreen `[M]` 🔴         | **UX** Popup/BottomSheet visual rework   | **2.1.6** AddDayDialog               |
| **2.1.4** EditDayScreen `[M]`             |                                          | **2.1.2** DayDetailsScreen           |
| **2.1.5** CreateEditPlanScreen `[S]`      |                                          | **1.2.3** ExerciseCard component     |
| **2.3.3** PlanCard component `[S]`        |                                          | **1.2.2** useExerciseSearch hook     |
|                                           |                                          | **2.1.1** WorkoutOverviewScreen      |

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

- [x] **1.1.2** Create ExerciseBrowserScreen (L - 4h) `[src/app/exercise-browser.tsx]`
      Full-screen browser with search, FlashList of 1,300+ exercises
      Files: src/app/exercise-browser.tsx, src/components/exercises/ExerciseListView.tsx
      **Refactored 2026-01-26:** Moved to root-level route (full-screen, no tabs)

- [x] **1.1.3** Create ExerciseDetailScreen (M - 3h) `[src/app/exercise/[id].tsx]`
      Full-screen detail with floating back button, GIF, instructions
      Files: src/app/exercise/[id].tsx
      **Refactored 2026-01-26:** Moved to root-level route (full-screen, no tabs)

</details>

<details>
<summary><b>1.2: Shared Components & Hooks</b> • 3 tasks ✅ (added 2026-01-26)</summary>

- [x] **1.2.1** Create ExerciseListView shared component (M - 2h)
      Reusable list UI for browser and picker (90% code reuse)
      Files: src/components/exercises/ExerciseListView.tsx

- [x] **1.2.2** Create useExerciseSearch hook (M - 2h)
      Search, filter, pagination with proper React patterns
      Files: src/hooks/exercises/useExerciseSearch.ts
      **Applied:** Ref pattern for stale closure prevention

- [x] **1.2.3** Create ExerciseCard component (S - 1h)
      Reusable card with browse/select modes
      Files: src/components/exercises/ExerciseCard.tsx

</details>

---

## Phase 2: Plans & Routines

**Status:** 🔄 In Progress
**Timeline:** Weeks 9-11
**Est. Time:** ~25h (3 weeks)
**Goal:** Create, edit, and manage workout plans with days and exercises
**Dependencies:** Phase 1 (Exercise Library)
**Reference:** [WIREFRAMES.md § 3. Workout Tab](./WIREFRAMES.md#3-workout-tab)

### 2.1: Workout Tab Screens

- [x] **2.1.1** WorkoutOverviewScreen (M - 4h) `[src/app/(tabs)/workout.tsx]` ✅ DONE
      Plan header, Overview/Day Details tabs, DayCard list
      Delete day, "Add a day" button, menu bottom sheet
      **Components:** PlanHeader, DayCard (src/components/workout/)
      **Hook:** useWorkoutScreen (src/hooks/workout/)

- [x] **2.1.2** DayDetailsScreen (M - 3h) ✅ DONE
      Exercise list with drag-to-reorder (react-native-draggable-flatlist)
      Swipe-to-reveal Edit/Delete actions
      "Add Exercise" button → exercise-picker with multi-select
      **Components:** WorkoutDayDetailsContent, DayExerciseCard
      **Hook:** reorderExercisesOptimistic, deleteExerciseOptimistic
      **Utility:** stripStepPrefix (instruction cleanup)

- [ ] **2.1.3** AllPlansScreen (M - 3h) `[src/app/plans/index.tsx]` 🔴 NEXT
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

- [x] **2.1.6** AddDayDialog (S - 1h) ✅ `[src/components/ui/dialog.tsx, input-dialog.tsx]`
      Day name input (day of week selector deferred to BACKLOG.md)

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
**Timeline:** Weeks 12-15
**Est. Time:** ~75h (4 weeks)
**Goal:** Start workout → Swipe exercises → Log sets → Rest timer → Summary
**Dependencies:** Phase 2 (Plans & Routines)
**Reference:** [WIREFRAMES.md § 4. Active Workout](./WIREFRAMES.md#4-active-workout)

### 3.1: Workout Session State & Flow

> The backbone: start, persist, recover, end, and discard a workout session.

- [ ] **3.1.1** Extend workoutStore for active session state `[M]` 🔴
      Add currentExerciseIndex, exerciseIds[], restTimerState, elapsed timer.
      Actions: setExerciseIndex, nextExercise, prevExercise, startRestTimer, skipRest.
      Persist critical state to MMKV for crash recovery.
      Files: src/stores/workout/workoutStore.ts

- [ ] **3.1.2** Create useStartWorkout hook `[S]`
      Orchestrates: createWorkout() → populate workout_exercises from plan day →
      hydrate workoutStore → navigate to ActiveWorkoutScreen.
      Files: src/hooks/workout/useStartWorkout.ts
      Deps: 3.1.1

- [ ] **3.1.3** Wire "Start Workout" button on WorkoutScreen `[XS]`
      Connect existing button to useStartWorkout hook, navigate to /workout/active.
      Files: src/app/(tabs)/workout.tsx
      Deps: 3.1.2, 3.2.1

- [ ] **3.1.4** Implement workout resume on app restart `[S]`
      On app mount, check workoutStore.isWorkoutActive → show banner or auto-navigate.
      Files: src/app/_layout.tsx, src/stores/workout/workoutStore.ts
      Deps: 3.1.1, 3.2.1

- [ ] **3.1.5** Implement discard workout flow `[S]`
      ConfirmDialog → deleteWorkout() → workoutStore.endWorkout() → navigate back.
      Files: src/hooks/workout/useDiscardWorkout.ts
      Deps: 3.1.1
      Ref: WIREFRAMES.md § 4.4

- [ ] **3.1.6** Write unit tests for workoutStore extensions `[S]`
      Test: state transitions, exercise navigation bounds, rest timer state machine, crash recovery.
      Files: __tests__/stores/workoutStore.test.ts
      Deps: 3.1.1

### 3.2: Active Workout Screen & Exercise Navigation

> Full-screen workout UI with horizontal swipe between exercises.

- [ ] **3.2.1** Create ActiveWorkoutScreen layout `[M]` 🔴
      Full-screen route (no tabs). Header with back arrow + menu.
      Exercise GIF, exercise name, "PLAY VIDEO" link.
      Sets table area (placeholder). Footer bar (placeholder).
      Back button → discard confirm. Prevent swipe-back gesture.
      Files: src/app/workout/active.tsx, src/app/workout/_layout.tsx
      Deps: 3.1.1

- [ ] **3.2.2** Create useActiveWorkout hook `[M]`
      Reads workoutStore + DB for current exercise details (name, gif_url, target_sets/reps).
      Provides: currentExercise, exerciseCount, sets, navigation handlers.
      Files: src/hooks/workout/useActiveWorkout.ts
      Deps: 3.1.1, 3.1.2

- [ ] **3.2.3** Implement horizontal swipe navigation `[M]` 🔴
      react-native-gesture-handler PanGesture + reanimated spring animation.
      Swipe left/right changes currentExerciseIndex. Clamp to bounds.
      Files: src/components/workout/ExerciseSwiper.tsx
      Deps: 3.2.1, 3.2.2

- [ ] **3.2.4** Create ExerciseProgressDots component `[S]`
      Horizontal row of dots, active dot larger/filled. Tappable to jump.
      Scrollable if >8 exercises.
      Files: src/components/workout/ExerciseProgressDots.tsx

- [ ] **3.2.5** Create WorkoutHeader component `[S]`
      Back arrow (discard confirm), elapsed timer (MM:SS), menu icon.
      Files: src/components/workout/WorkoutHeader.tsx
      Deps: 3.1.1

### 3.3: Set Logging UI & Logic

> SetRow component, add/delete sets, checkmark to log, auto-fill from history.

- [ ] **3.3.1** Create SetRow component `[M]`
      Row: Set # | Weight input (numeric) | Reps input (numeric) | Checkmark button.
      States: empty (outline circle), logged (green checkmark).
      Tap weight/reps to edit. "Per DB" label for dumbbell exercises.
      Files: src/components/workout/SetRow.tsx

- [ ] **3.3.2** Create SetsTable component `[S]`
      Column headers: Set | Lbs | Reps | ✓. Maps sets → SetRow list.
      "+" row to add set. "Delete" to remove last unlogged set.
      Files: src/components/workout/SetsTable.tsx
      Deps: 3.3.1

- [ ] **3.3.3** Implement set logging logic hook `[M]` 🔴
      useSetLogging: local set array (optimistic), addSet(), deleteLastSet(),
      logSet(index) → DB write + trigger rest timer. Initialize from target_sets.
      Files: src/hooks/workout/useSetLogging.ts
      Deps: 3.1.1, 3.3.1

- [ ] **3.3.4** Implement auto-fill from last workout `[M]`
      New DB query: getLastSetsForExercise(exerciseId, userId).
      Pre-fill weight/reps in useSetLogging when exercise loads.
      Files: src/services/database/operations/workouts.ts, src/hooks/workout/useSetLogging.ts
      Deps: 3.3.3

- [ ] **3.3.5** Auto-advance after last set of exercise `[S]`
      When final set logged + rest timer completes → auto-swipe to next exercise.
      Files: src/hooks/workout/useSetLogging.ts, src/hooks/workout/useActiveWorkout.ts
      Deps: 3.3.3, 3.2.3, 3.4.1

- [ ] **3.3.6** Write unit tests for set logging `[S]`
      Test: add/delete set, log set state transition, auto-fill values, set numbering.
      Files: __tests__/hooks/useSetLogging.test.ts
      Deps: 3.3.3

### 3.4: Rest Timer System

> Timer logic, expandable widget UI, per-exercise configuration.

- [ ] **3.4.1** Create useRestTimer hook `[M]` 🔴
      State machine: idle → running → completed.
      Manages remainingSeconds, defaultSeconds (cascade: exercise → user → 90s fallback).
      Actions: start, pause, skip, adjustTime(±15s), setDefault.
      On complete → trigger notification + sound + vibration callbacks.
      Files: src/hooks/workout/useRestTimer.ts
      Deps: 3.1.1

- [ ] **3.4.2** Create RestTimerWidget component `[M]`
      Collapsed (footer): [Book] [Clock MM:SS] [Log Set / Skip Rest].
      Expanded: circular countdown, -15s/+15s, reset, play/pause, default config.
      Files: src/components/workout/RestTimerWidget.tsx
      Deps: 3.4.1
      Ref: WIREFRAMES.md § 4.2

- [ ] **3.4.3** Create CircularProgress component `[S]`
      SVG circle with animated arc (reanimated). Center: remaining time MM:SS.
      Props: progress (0-1), size, strokeWidth, color.
      Files: src/components/workout/CircularProgress.tsx

- [ ] **3.4.4** Create WorkoutFooter component `[S]`
      Fixed bottom bar: [Book icon] [RestTimerWidget collapsed] [Primary action].
      "Log Set" when idle, "Skip Rest" when running.
      Files: src/components/workout/WorkoutFooter.tsx
      Deps: 3.4.1, 3.4.2, 3.3.3

- [ ] **3.4.5** Write unit tests for rest timer `[S]`
      Test: state transitions, ±15s adjustments, per-exercise defaults, bounds.
      Files: __tests__/hooks/useRestTimer.test.ts
      Deps: 3.4.1

### 3.5: Notifications & Sound

> Background timer alerts: push notifications, sound playback, haptic vibration.

- [ ] **3.5.1** Install and configure expo-notifications `[S]`
      npx expo install expo-notifications. Configure Android channel ("Rest Timer", HIGH).
      Request permissions on first timer use. Add to app.json plugins.
      Files: src/services/notifications/setup.ts, app.json

- [ ] **3.5.2** Implement scheduled local notification for rest timer `[S]`
      scheduleRestTimerNotification(seconds), cancelRestTimerNotification().
      Title: "Rest Complete", Body: "Time for your next set!".
      Reschedule on ±15s. Cancel on skip/discard.
      Files: src/services/notifications/restTimer.ts
      Deps: 3.5.1, 3.4.1

- [ ] **3.5.3** Install expo-av and add timer complete sound `[S]`
      npx expo install expo-av. Bundle short alert sound.
      playTimerSound() utility. Respect device silent mode.
      Files: src/services/audio/timerSound.ts, assets/sounds/timer-complete.mp3
      Deps: 3.5.1

- [ ] **3.5.4** Add haptic vibration on timer complete `[XS]`
      expo-haptics (already installed). Short double-vibration pattern.
      Files: src/hooks/workout/useRestTimer.ts
      Deps: 3.4.1

- [ ] **3.5.5** Wire notification + sound + vibration into rest timer flow `[S]`
      start() → schedule notification. Complete → play sound + vibrate + notification.
      skip/discard → cancel all.
      Files: src/hooks/workout/useRestTimer.ts, src/services/notifications/restTimer.ts
      Deps: 3.5.2, 3.5.3, 3.5.4

### 3.6: Workout Summary & Completion

> Summary screen after completing all exercises, save or discard.

- [ ] **3.6.1** Create workout completion flow hook `[S]`
      completeWorkout() → calculates duration/volume/set count → navigate to summary.
      Files: src/hooks/workout/useCompleteWorkout.ts
      Deps: 3.1.1

- [ ] **3.6.2** Create WorkoutSummaryScreen `[M]` 🔴
      "Workout Complete!" title. Editable workout name. Stats row: Duration | Volume | Sets.
      Exercise list with logged sets (weight x reps, 1RM).
      Footer: [Trash] [End & Save Workout].
      Files: src/app/workout/summary/[id].tsx
      Deps: 3.6.1
      Ref: WIREFRAMES.md § 4.3

- [ ] **3.6.3** Create ExerciseSummaryCard component `[S]`
      GIF thumbnail + name. Table: Set | Weight x Reps | 1RM (Epley formula).
      Reusable for future workout history screen.
      Files: src/components/workout/ExerciseSummaryCard.tsx

- [ ] **3.6.4** Create SummaryStatsRow component `[XS]`
      Horizontal stat cards: Duration (MM:SS), Volume (lbs/kg), Records (placeholder).
      Files: src/components/workout/SummaryStatsRow.tsx

- [ ] **3.6.5** Implement "End & Save" + discard from summary `[S]`
      "End & Save" → workoutStore.endWorkout() → navigate to Workout tab.
      Trash → ConfirmDialog → deleteWorkout() → navigate back.
      Files: src/app/workout/summary/[id].tsx
      Deps: 3.6.2, 3.1.5

- [ ] **3.6.6** Write unit tests for workout completion `[S]`
      Test: volume calculation, duration, 1RM formula, state cleanup.
      Files: __tests__/hooks/useCompleteWorkout.test.ts
      Deps: 3.6.1

### 3.7: Exercise History

> Enable the History tab on Exercise Detail to show all logged sets for an exercise, grouped by workout date.

- [ ] **3.7.1** Create getExerciseHistory DB query `[M]` 🔴
      Query exercise_sets → workout_exercises → workouts for a given exercise_id.
      Return sets grouped by workout date (reverse chronological): set_number, weight, reps.
      Add calculateOneRepMax() utility (Epley formula).
      Files: src/services/database/operations/workouts.ts, src/utils/calculations/oneRepMax.ts

- [ ] **3.7.2** Create useExerciseHistory hook `[S]`
      Calls getExerciseHistory(exerciseId). Returns grouped data with loading/error states.
      Files: src/hooks/exercises/useExerciseHistory.ts

- [ ] **3.7.3** Create ExerciseHistoryTab component `[M]` 🟠
      Date-grouped sections: formatted date header ("Jan 15, 2026") + Set/Weight x Reps/1RM rows.
      "..." menu per date (placeholder for future edit/delete).
      Empty state: "No history yet."
      Files: src/components/exercises/ExerciseHistoryTab.tsx
      Deps: 3.7.2

- [ ] **3.7.4** Enable History tab in ExerciseDetailScreen `[S]`
      Set history.disabled = false. Render ExerciseHistoryTab when selected.
      Chart tab remains disabled (Phase 6).
      Files: src/app/exercise/[id].tsx
      Deps: 3.7.3

---

## Phase 4: Auth, Settings & Progress

**Status:** ⬜ Pending
**Timeline:** Weeks 15-18
**Est. Time:** ~45h (3-4 weeks)
**Goal:** Authentication, user profile, settings, and basic Progress tab
**Dependencies:** Phase 1 (Exercise Library); can start parallel to Phase 3
**Reference:** [WIREFRAMES.md § 6. Settings](./WIREFRAMES.md#6-settings)

### 4.1: Auth Screens

> Login, Register, Password Reset UI with form validation.

- [ ] **4.1.1** Create auth route group layout `[S]` 🔴
      Expo Router (auth)/_layout.tsx with Stack navigator.
      Shared styling: centered content, app logo header, safe area.
      Files: src/app/(auth)/_layout.tsx

- [ ] **4.1.2** Create LoginScreen `[M]` 🔴
      Email + password inputs with validation.
      "Log In" button with loading state. Error toast.
      Links: "Forgot password?" → reset, "Create account" → register.
      Files: src/app/(auth)/login.tsx
      Deps: 4.1.1

- [ ] **4.1.3** Create RegisterScreen `[M]`
      Email, password, confirm password. Password strength indicator.
      "Create Account" button with loading state.
      Files: src/app/(auth)/register.tsx
      Deps: 4.1.1

- [ ] **4.1.4** Create ResetPasswordScreen `[S]`
      Email input, "Send Reset Link" button.
      Success state + deep link handler for callback.
      Files: src/app/(auth)/reset-password.tsx
      Deps: 4.1.1

- [ ] **4.1.5** Setup protected route guard `[M]` 🔴
      Root _layout.tsx: check authStore.isAuthenticated.
      Redirect to /(auth)/login if not authenticated.
      Splash screen during initial auth check. Persist session via MMKV.
      Files: src/app/_layout.tsx, src/stores/auth/authStore.ts

### 4.2: Auth Service & Testing

> Supabase Auth integration, session management, test infrastructure.

- [ ] **4.2.1** Implement Supabase Auth service `[M]` 🔴
      signIn(), signUp(), signOut(), resetPassword(), refreshSession().
      onAuthStateChange() listener. Session persistence to MMKV.
      Files: src/services/auth/supabaseAuth.ts

- [ ] **4.2.2** Wire authStore to Supabase Auth service `[S]`
      Update authStore actions to call service. Hydrate from MMKV on launch.
      Sign-out cleanup: clear MMKV, reset stores.
      Files: src/stores/auth/authStore.ts
      Deps: 4.2.1

- [ ] **4.2.3** Create auth test infrastructure `[S]`
      Mock Supabase client, auth factories (mockUser, mockSession).
      Files: __tests__/__helpers__/auth/

- [ ] **4.2.4** Write auth service unit tests `[M]`
      Test: signIn/signUp/signOut flows, session refresh, MMKV persistence.
      Coverage target: 90%+.
      Files: __tests__/services/auth/supabaseAuth.test.ts
      Deps: 4.2.1, 4.2.3

### 4.3: Settings & Profile

> Settings screen, rest timer config, profile page, unit system, logout.

- [ ] **4.3.1** Create SettingsScreen `[M]` 🔴
      Profile card (avatar, name, email) → tap to Profile page.
      Sections: Unit System (kg/lbs), Rest Timer → RestTimerSettingsPage.
      Account: Logout button with confirm dialog.
      Accessible from Progress tab gear icon.
      Files: src/app/settings/index.tsx
      Deps: 4.2.2

- [ ] **4.3.2** Create RestTimerSettingsPage `[S]`
      Alarm type: Sound / Vibration / Both. Default rest time: numeric (default 90s).
      "Keep Screen On" toggle. Save to users.default_rest_timer_seconds.
      Files: src/app/settings/rest-timer.tsx
      Deps: 4.3.1

- [ ] **4.3.3** Create ProfileScreen `[M]`
      Fields: Display Name, Gender (picker), Date of Birth (date picker).
      Save to users table. Schema migration: add display_name, gender, date_of_birth.
      Files: src/app/settings/profile.tsx, src/services/database/local/schema.ts
      Deps: 4.3.1

- [ ] **4.3.4** Implement unit system persistence `[S]`
      Toggle kg/lbs in Settings. Save to users.preferred_unit.
      Cache in MMKV. Apply across all weight displays.
      Files: src/stores/settings/settingsStore.ts
      Deps: 4.3.1

- [ ] **4.3.5** Implement logout flow `[S]`
      ConfirmDialog → clear Supabase session, MMKV, stores → redirect to login.
      Files: src/app/settings/index.tsx
      Deps: 4.2.2, 4.3.1

### 4.4: Progress Tab (Basic)

> Overview sub-tab with stats + calendar, basic Body sub-tab with body stats.

- [ ] **4.4.1** Create Progress tab with sub-tabs `[M]` 🔴
      Replace stats.tsx placeholder with Overview | Body sub-tabs.
      Gear icon in header → navigate to Settings.
      Files: src/app/(tabs)/stats.tsx
      Deps: 4.3.1

- [ ] **4.4.2** Create monthly calendar widget `[M]`
      Current month calendar. Workout days = highlighted circle.
      Query: getWorkoutDatesForMonth(). Navigate months with arrows.
      Files: src/components/progress/MonthlyCalendar.tsx
      Deps: 4.4.1

- [ ] **4.4.3** Create workout stats queries `[S]`
      getTotalWorkoutCount(), getCurrentStreak() (consecutive days).
      Files: src/services/database/operations/workouts.ts

- [ ] **4.4.4** Create Body sub-tab (basic) `[M]`
      Body Stats widget card: latest weight + body fat %.
      Tap → Body Stats page. Empty state when no data.
      Files: src/components/progress/BodyStatsCard.tsx
      Deps: 4.4.1, 4.4.5

- [ ] **4.4.5** Create body_stats schema and page `[L]`
      New body_stats table: user_id, date, weight, body_fat_pct, waist, chest, arms,
      forearms, shoulders, hips, upper_leg, lower_leg, neck, height.
      Schema migration. Form page with save/update. History list.
      Files: src/services/database/local/schema.ts, src/app/body-stats/index.tsx
      Deps: 4.3.3

- [ ] **4.4.6** Write Progress tab unit tests `[S]`
      Test: streak calculation, workout date queries, body stats CRUD.
      Files: __tests__/services/database/operations/
      Deps: 4.4.3, 4.4.5

---

## Phase 5: Home Dashboard & Polish

**Status:** ⬜ Pending
**Timeline:** Weeks 19-20
**Est. Time:** ~22h (2 weeks)
**Goal:** Functional Home dashboard + production-ready MVP
**Dependencies:** Phases 3 and 4 complete

### 5.1: Home Dashboard

> Replace Home placeholder with real data: weekly stats, compact calendar, quick actions.

- [ ] **5.1.1** Create useHomeDashboard hook `[M]` 🔴
      This week's workout count, total volume, total sets.
      Compare to last week for trend indicators (up/down/same).
      Files: src/hooks/home/useHomeDashboard.ts

- [ ] **5.1.2** Wire real data into Home stat cards `[S]`
      Replace hardcoded value={0} with live data. Add trend arrow icons.
      Files: src/app/(tabs)/index.tsx
      Deps: 5.1.1

- [ ] **5.1.3** Add compact monthly calendar to Home `[S]`
      Reuse MonthlyCalendar from Phase 4.4.2 (current month, no navigation).
      Files: src/app/(tabs)/index.tsx
      Deps: 4.4.2

- [ ] **5.1.4** Add quick action shortcuts `[S]`
      "Start Workout" → active plan's first day.
      "Browse Exercises" → Exercises tab. "View Progress" → Progress tab.
      Files: src/app/(tabs)/index.tsx

- [ ] **5.1.5** Personalize welcome header `[XS]`
      User's display name + time-of-day greeting.
      Files: src/app/(tabs)/index.tsx
      Deps: 4.3.3

### 5.2: Polish & Deployment

> Performance, monitoring, production builds, beta distribution.

- [ ] **5.2.1** Performance optimization `[M]` 🔴
      Bundle analysis. Lazy load heavy screens.
      Optimize FlashList, verify image caching.
      Target: <10MB bundle, <2s cold start.
      Files: src/app/_layout.tsx, metro.config.js

- [ ] **5.2.2** Verify Sentry error monitoring `[S]`
      Trigger test error, confirm in dashboard. Setup alerts.
      Files: app.json

- [ ] **5.2.3** Create EAS production build profiles `[M]`
      Android AAB + iOS Archive. Test on physical devices.
      Validate offline-first, DB persistence.
      Files: eas.json

- [ ] **5.2.4** Setup TestFlight & Play Store internal testing `[M]`
      Submit builds, add testers, configure metadata.
      Files: eas.json

- [ ] **5.2.5** Create beta testing guide `[S]`
      Installation instructions, test checklist, bug reporting template.
      Files: docs/BETA_TESTING_GUIDE.md

---

## Phase 6: Post-MVP Analytics & Enhancements

**Status:** ⬜ Planned (Post-MVP)
**Timeline:** Post-launch
**Est. Time:** ~80h (estimated)
**Goal:** Advanced analytics, muscle visualization, UX polish
**Dependencies:** MVP complete (Phases 1-5)

### 6.1: Exercise Analytics

> Chart tab on Exercise Detail: 1RM/Volume line charts with time filters.

- [ ] **6.1.1** Create exercise progression data service `[M]`
      getExerciseProgression(exerciseId, timeRange): returns date, estimated1RM, totalVolume.
      Time filters: 14D, 1M, 3M, 6M, 12M, All.
      Files: src/services/database/operations/analytics.ts

- [ ] **6.1.2** Create ExerciseChartTab component `[L]`
      Victory Native line chart. Toggle 1RM / Volume. Time filter pills.
      Min/Max stats below chart.
      Files: src/components/exercises/ExerciseChartTab.tsx

- [ ] **6.1.3** Enable Chart tab in ExerciseDetailScreen `[S]`
      Set chart.disabled = false, render ExerciseChartTab.
      Files: src/app/exercise/[id].tsx
      Deps: 6.1.2

### 6.2: Workout History & Calendar

> Full workout history, workout log detail, full-screen scrollable calendar.

- [ ] **6.2.1** Create Workout History list screen `[M]`
      Reverse chronological list: date, title, duration, volume.
      Infinite scroll. Tap → Workout Log detail.
      Files: src/app/history/index.tsx

- [ ] **6.2.2** Create Workout Log detail screen `[M]`
      Past workout detail: exercises with logged sets.
      Reuse ExerciseSummaryCard from Phase 3.6.3.
      Sub-tabs: Logs | Body Stats.
      Files: src/app/history/[id].tsx
      Deps: 6.2.1

- [ ] **6.2.3** Create Full Calendar screen `[L]`
      Infinite scroll past months. Workout days = blue dot.
      Tap day → Workout Log. Smooth scroll performance.
      Files: src/app/calendar/index.tsx
      Deps: 6.2.2

### 6.3: Muscle Visualization

> 11 muscle group icons + anatomy body diagrams (front/back).

- [ ] **6.3.1** Create 11 muscle group icon set `[L]`
      SVG icons: chest, back, shoulders, biceps, triceps, forearms, abs, quads, hamstrings, glutes, calves.
      Integrate into Exercises tab grid + DayCard in Workout Overview.
      Files: assets/icons/muscles/, src/components/exercises/MuscleGroupIcon.tsx

- [ ] **6.3.2** Research and implement anatomy body diagram `[XL]`
      Front + back body outlines. Primary muscles (dark) + secondary (pale).
      Evaluate: react-native-svg custom paths vs pre-rendered overlays vs external library.
      Files: src/components/exercises/AnatomyDiagram.tsx

- [ ] **6.3.3** Integrate anatomy into Exercise Detail and Workout Summary `[S]`
      Add body diagram to Guide tab + Workout Summary screen.
      Files: src/app/exercise/[id].tsx, src/app/workout/summary/[id].tsx
      Deps: 6.3.2

### 6.4: Progress Enhancements

> Charts, progress photos, advanced body stats, muscle recovery.

- [ ] **6.4.1** Create Progress Charts (volume/strength) `[L]`
      Victory Native: weekly volume, strength over time.
      Filter by exercise, muscle group, or overall.
      Files: src/app/progress/charts.tsx

- [ ] **6.4.2** Create Progress Photos feature `[L]`
      Camera/gallery picker. Date-tagged. Before/after comparison.
      New progress_photos table (schema migration).
      Files: src/app/progress/photos.tsx

- [ ] **6.4.3** Create Muscle Recovery page `[M]`
      Recovery status per muscle group based on last workout.
      Color-coded: green (recovered) → yellow → red (recently trained).
      Heuristic: 48-72h recovery window.
      Files: src/app/progress/recovery.tsx

### 6.5: UX Polish

> Dark/light mode, PR tracking, weekly notifications.

- [ ] **6.5.1** Implement Dark/Light mode toggle `[M]`
      Pill toggle in Settings. NativeWind class switching. MMKV persist.
      System default option.
      Files: src/app/settings/index.tsx, tailwind.config.ts

- [ ] **6.5.2** Create Personal Records tracking `[L]`
      PRs per exercise: heaviest weight, most reps, highest 1RM.
      New personal_records table. Celebration animation on new PR.
      Files: src/services/database/operations/personalRecords.ts

- [ ] **6.5.3** Implement weekly summary notifications `[M]`
      Scheduled weekly push: workouts count, volume trend, streak.
      Configurable day/time in Settings.
      Files: src/services/notifications/weeklySummary.ts
