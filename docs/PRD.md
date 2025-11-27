# Product Requirements Document: Halterofit

This document defines the scope, features, user stories, and success metrics for the Halterofit MVP. Use this as the authoritative reference for product requirements and design decisions.

## 📑 Table of Contents

- [Product overview](#product-overview)
- [Goals](#goals)
- [User persona](#user-persona)
- [User stories](#user-stories)
- [User flows](#user-flows)
- [Success metrics](#success-metrics)

---

## Product overview

Halterofit is a mobile fitness tracker built for anyone who takes their training seriously enough to track it. The app guarantees zero data loss through offline-first architecture—every set you log is saved instantly to your device, syncs to cloud when connection available.

Fast set logging minimizes interruption during workouts. A comprehensive 1,300+ exercise library eliminates tedious manual entry. Reusable workout templates maintain consistency across training cycles. Complete workout history enables progression tracking over weeks, months, and years.

Halterofit works the way your training does: reliably, consistently, without compromise.

---

## Goals

### Product objectives

Halterofit MVP delivers a reliable, fast, and straightforward workout tracking experience. The goal is to build a fitness app that users trust as their primary training log through solid execution of core features: quick workout logging, comprehensive exercise library, and dependable data persistence. Success means achieving strong user retention and establishing a foundation for sustainable growth.

**Business outcomes:**

- Validate product-market fit with 500+ active users within 6 months
- Establish reliable technical foundation that scales to 10,000+ users
- Create monetization pathway through freemium model ($6.99/month premium tier)

**User outcomes:**

- Users can log entire workouts offline without fear of data loss
- Workout logging is faster than competing apps (target: 1-2 taps per set)
- Users have immediate access to workout history for progressive overload decisions
- Exercise selection is effortless through comprehensive 1,300+ exercise library

**Success indicators:**

- 60%+ retention at 4 weeks (users establish consistent training habit)
- 80%+ workout completion rate (users finish what they start)
- Zero data loss incidents (architectural promise fulfilled)

### Non-goals (deferred to post-MVP)

**Analytics features (Post-MVP+):**

- Volume charts, progression tracking, 1RM estimation, plateau detection, personal records tracking
- Advanced analytics: RIR/RPE-adjusted 1RM, Mann-Kendall plateau detection, acute/chronic load ratios
- Context-aware performance interpretation, fatigue modeling, overtraining detection

**UX enhancements (post-MVP):**

- Plate calculator, set history display (last 3-5 sets), notes per workout/exercise/set
- Onboarding flow, profile image upload, biometric authentication
- RPE/RIR tracking, custom exercise creation

**Out of scope:**

- AI-based recommendations, energy readiness scores (require wearable integration)
- Social features, workout sharing, community elements
- Nutrition tracking, meal planning, video form analysis
- Third-party fitness tracker integrations

---

## User persona

### Dedicated Lifter

**Demographics:**

- Age: 18-55 years old
- Gender: All genders
- Experience: Beginner to advanced lifters
- Training frequency: 2-6 workouts per week
- Primary goal: Progressive overload and consistent improvement

**Behaviors:**

- Tracks workouts with varying levels of detail (weight, reps, sometimes notes)
- May follow structured programs or train more flexibly
- Uses phone during rest periods (email, social media, workout tracking)
- Reviews past workouts to ensure progressive overload
- Values reliability and simplicity over complex features

**Pain points:**

- Current apps have unreliable offline mode (data loss when connectivity drops)
- Excessive tapping required to log sets (7+ taps in some apps)
- Exercise libraries are incomplete or require tedious custom entry
- Workout templates are difficult to create and manage
- No quick access to exercise history during workouts
- Analytics are too basic or overly complex without useful insights

**Needs from the product:**

- Quick set logging (1-2 taps maximum) with auto-filled values
- Reliable offline-first data capture with guaranteed zero data loss
- Comprehensive exercise library (1,300+ exercises) with search and filters
- Easy workout template creation and reuse
- Simple progression tracking
- Exercise history accessible during active workouts

---

## User stories

### Authentication and account management

**US-001: User registration**

- As a new user, I want to create an account with email and password so that my workout data is saved and accessible across devices.
- Acceptance: Registration validates email format, requires password ≥8 characters, sends verification email, creates user with default preferences

**US-002: User login**

- As a returning user, I want to log in with my credentials so that I can access my workout history.
- Acceptance: Session persists across app restarts for 30 days, clear error messages on failed login

**US-003: Password reset**

- As a user who forgot my password, I want to reset it via email so that I can regain access to my account.
- Acceptance: Reset link sent via email, expires after 1 hour, clear success message displayed

**US-004: Account deletion**

- As a user concerned about privacy, I want to permanently delete my account and all associated data.
- Acceptance: Confirmation dialog warns of permanent deletion, cascades to all tables, user logged out

**US-005: Data export**

- As a user, I want to export all my workout data as a file for backup or analysis purposes.
- Acceptance: Export generates structured JSON file, includes profile/workouts/exercises/sets, share via system share sheet

### Workout logging

**US-006: Start workout**

- As a user, I want to start a new workout so that I can begin logging my training session.
- Acceptance: Creates workout with timestamp, workout duration timer starts, saves to database without internet

**US-007: Repeat last workout**

- As a user, I want to quickly load my previous workout with all exercises pre-populated so that I can save time.
- Acceptance: Fetches most recent workout, creates new workout with same exercises and order, pre-fills target sets/reps

**US-008: Log a set**

- As a user, I want to log a set with weight and reps in 1-2 taps so that I can quickly return to my workout.
- Acceptance: Weight/reps pre-filled from last set, quick adjustment buttons available, set saves instantly, rest timer auto-starts

**US-009: Use rest timer**

- As a user, I want an automatic rest timer that runs in the background and notifies me when rest is complete.
- Acceptance: Timer continues when app minimized, push notification sent when complete, quick actions available

**US-010: Add exercise to workout**

- As a user, I want to add exercises to my active workout by searching the exercise library.
- Acceptance: Real-time search filters locally, recently used exercises at top, favorited exercises marked

**US-011: Complete workout**

- As a user, I want to finish my workout and review a summary of my session.
- Acceptance: Sets completed_at timestamp, summary shows duration/exercises/sets/volume, saves immediately

**US-012: View workout history**

- As a user, I want to see a list of my past workouts sorted by date so that I can review my training consistency.
- Acceptance: Workouts in reverse chronological order, pagination loads 20 at a time, swipe actions available

**US-013: Edit past workout**

- As a user, I want to edit a previously logged workout to correct mistakes or add missing sets.
- Acceptance: Edit mode allows modifying sets/adding/removing exercises, changes save immediately, shows last edited timestamp

### Exercise library

**US-014: Search exercises**

- As a user, I want to search for exercises by name or muscle group so that I can quickly find what I need.
- Acceptance: Real-time filtering with debounce, searches name and muscle groups, fuzzy matching tolerates typos

**US-015: Filter exercises**

- As a user, I want to filter exercises by muscle group, equipment, and difficulty to narrow down options.
- Acceptance: Multiple selection for muscle groups and equipment, active filters show count badge, filters apply immediately

**US-016: View exercise details**

- As a user, I want to view detailed information about an exercise including instructions and demonstration.
- Acceptance: Shows GIF demonstration, target muscles, equipment, instructions, personal history if previously logged

**US-017: Create custom exercise**

- As a user, I want to create my own exercises for movements not in the library so that I can track specialized training.
- Acceptance: Form includes name/type/category/muscle groups/equipment/instructions, custom exercises appear in search alongside library exercises

**US-018: Favorite exercises**

- As a user, I want to mark exercises as favorites so that I can quickly access my most-used movements.
- Acceptance: Star icon toggles favorite state, favorites stored locally and synced, favorited exercises appear at top of selector

### Workout planning

**US-019: Create workout template**

- As a user, I want to save current workout as a reusable template so that I can maintain consistency week-to-week.
- Acceptance: Template stores exercise order/target sets/reps/superset grouping, user can name and save template

**US-020: Start from template**

- As a user, I want to start a workout from a saved template with all exercises pre-populated.
- Acceptance: Template loads with all exercises, user can modify before starting, maintains template structure

**US-021: Edit template**

- As a user, I want to modify my saved templates to adjust my training program.
- Acceptance: Can add/remove/reorder exercises, adjust target sets/reps, changes save to template

### Settings and preferences

**US-022: Configure unit preferences**

- As a user, I want to set my preferred units (kg/lbs) so that all data displays in my preferred system.
- Acceptance: Toggle between kg/lbs, converts all existing data for display, preference syncs across devices

**US-023: Configure rest timer defaults**

- As a user, I want to set default rest timer durations for different exercise types.
- Acceptance: Settings for compound/isolation/cardio exercises, option to use historical average

**US-024: Manage data and privacy**

- As a user, I want control over my data including export and deletion.
- Acceptance: Export data as JSON, delete account with confirmation, privacy policy and terms accessible

---

## User flows

### Entry points

**Unauthenticated users:**

- App launch → Login screen
- "Create account" link → Registration screen
- "Forgot password" link → Password reset flow

**Authenticated users:**

- App launch → Workout tab (Planned sub-tab)
- Bottom tab navigation: Workout | Profile
- Workout sub-tabs: Find | Planned
  - **Find**: Browse pre-made workout plan templates
  - **Planned**: Active plan with workout days, "Start Workout" buttons

### Flow 1: Log a workout

**Scenario:** User arrives at gym and wants to log leg day workout.

1. User opens app → Workout tab displays active plan with "Start Workout" button
2. User taps "Start Workout" → App loads workout from active plan
3. Active workout screen displays first exercise (Squat) with last workout's sets pre-filled
4. User performs set, taps checkmark → Set logged with auto-filled weight × reps
5. Rest timer auto-starts (3 minutes for compound exercise)
6. User adjusts weight using "+5kg" button for next set
7. User completes all exercises, taps "End Workout"
8. Summary screen shows duration, volume, time
9. Workout saves to local database, automatically syncs when connection available

**Success criteria:**

- Total interaction time to log 5-exercise, 20-set workout: <3 minutes
- Zero data loss even if offline entire workout
- Rest timer continues during phone lock or app switching

### Flow 2: Find and add new exercise

**Scenario:** User wants to add Romanian Deadlifts but cannot remember exact name.

1. During active workout, user taps "Add Exercise" button
2. Exercise selector modal opens with search bar focused
3. User types "romanian" → Real-time results filter to matching exercises
4. Results show "Romanian Deadlift (Barbell)" with GIF thumbnail
5. User taps exercise → Exercise added to workout
6. Set logging interface appears with empty weight/reps
7. User logs first set → Future workouts will auto-fill from this baseline

**Success criteria:**

- Search returns results quickly for 1,300+ exercise database
- Exercise GIFs load from cache instantly
- No network requests during search (all data local)

### Flow 3: Browse workout history

**Scenario:** User wants to review recent training consistency.

1. User navigates to Profile tab → Workout History section
2. List displays recent workouts with date, duration, volume, exercise count
3. User taps workout → Detail screen shows exercises and sets performed
4. User reviews performance and identifies areas for improvement

**Success criteria:**

- Workout history loads quickly
- Basic stats (volume, duration) are accurate and clearly displayed
- User can view last 30 days of workouts easily

---

## Success metrics

### User engagement

**Workout completion:**

- Workout completion rate: Target 80%+ (started → completed)
- Average sets per workout: Target 15-25 sets (typical training session)
- Session duration: Target 60-90 minutes (actual workout time)

**Retention:**

- Week 1 retention: Target 70% (user logs 3+ workouts in first week)
- Week 4 retention: Target 60% (user establishes habit, logs 12+ workouts)
- Month 3 retention: Target 40% (product-market fit indicator)

**Feature adoption:**

- Rest timer usage: Target 70%+ of workouts use timer
- Workout template usage: Target 60%+ of users create and use templates
- Exercise search usage: Target 80%+ of users search library

### Business metrics

**Growth (MVP Phase - 6 months):**

- Total registered users: Target 2,000 users
- Weekly active users: Target 500 users (25% of registered base)
- Monthly active users: Target 800 users (40% of registered base)

**Engagement quality:**

- Average lifetime workouts per user: Target 50+ workouts (12+ weeks of consistent training)
- Data export requests: <5% (low indicates users trust app, not migrating away)

**Monetization readiness (Post-MVP):**

- Users hitting 30-day history limit: Target 40% (indicates need for Pro upgrade)
- Template usage: Target 30% (Pro feature candidate)

### Technical performance

**Performance:**

- Cold start time: <2 seconds (app launch → first interactive screen)
- Set logging latency: <100ms (tap checkmark → set saved to database)

**Reliability:**

- Crash rate: <0.5% crash-free sessions (industry standard: 99.5%+)
- Data loss incidents: 0% (zero tolerance due to offline-first architecture)
- Sync success rate: >99% (failed syncs retry with exponential backoff)
