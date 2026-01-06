# Roadmap

Strategic overview of development phases and execution sequence. This roadmap defines the path to MVP completion through five sequential phases. For current progress and actionable tasks, see [TASKS.md](./TASKS.md).

## 📋 Table of Contents

- [Phase 1: Authentication & Foundation](#phase-1-authentication--foundation)
- [Phase 2: Workout Plans & Navigation](#phase-2-workout-plans--navigation)
- [Phase 3: Active Workout Tracking](#phase-3-active-workout-tracking)
- [Phase 4: Profile & Settings](#phase-4-profile--settings)
- [Phase 5: Polish & Deployment](#phase-5-polish--deployment)
- [Critical Path](#critical-path)
- [Post-MVP Direction](#post-mvp-direction)
- [References](#references)

## Phase 1: Authentication & Foundation

**Estimated effort:** 31 hours

Establish user authentication and testing foundation for secure, reliable user access.

**Deliverables:**

- Email/password authentication (login, register, password reset)
- Protected routes with navigation guards
- Auth test coverage (90% target for critical security path)
- Database reliability enhancements (cascading delete, sync retry with exponential backoff)

**Dependencies:** Phase 0.6 complete (UI components ready)

---

## Phase 2: Workout Plans & Navigation

**Estimated effort:** 40 hours

Build Jefit-style plan management system with comprehensive exercise library integration.

**Deliverables:**

- Bottom tab navigation (Workout, Profile tabs)
- Plan CRUD operations with "All Plans" modal
- Exercise selector with real-time search (1,300+ ExerciseDB exercises)
- Workout day creation and editing interface
- Template plan seeding

**Dependencies:** Phase 1 complete (auth required)

---

## Phase 3: Active Workout Tracking

**Estimated effort:** 27 hours

Implement live workout logging with swipe navigation and intelligent rest timer.

**Deliverables:**

- Active workout screen with swipeable exercise cards
- Set logging interface (weight, reps, warmup "W" marker)
- Auto-fill from last workout for progressive overload
- Rest timer with local notifications (works in background/killed state)
- Workout history and completion flow

**Dependencies:** Phase 2 complete (plans required)

---

## Phase 4: Profile & Settings

**Estimated effort:** 11 hours

User profile management and GDPR compliance implementation.

**Deliverables:**

- Profile screen with workout statistics
- Settings screen (units: kg/lbs toggle)
- Account deletion with cascade (GDPR compliance)
- Data export to JSON (GDPR compliance)
- Logout functionality

**Dependencies:** None (parallel to Phase 3)

---

## Phase 5: Polish & Deployment

**Estimated effort:** 9 hours

Production readiness, optimization, and app store submission.

**Deliverables:**

- Performance optimization (target: <10MB bundle, <2s cold start)
- Sentry monitoring verification
- EAS production builds (iOS + Android)
- TestFlight and Play Store internal testing setup
- Beta testing documentation

**Dependencies:** Phases 1-4 complete (all MVP features)

---

## Critical Path

**Sequential dependencies:**

Phase 1 (Auth) → Phase 2 (Plans) → Phase 3 (Active Workout) → Phase 5 (Deploy)

**Parallel track:**

Phase 4 (Profile & Settings) can run parallel to Phase 3

**Total MVP effort:** 118 hours

## Post-MVP Direction

Following MVP launch, development will focus on analytics and progression tracking features deferred from initial release. See BACKLOG.md for detailed Post-MVP roadmap including:

- Analytics and progression tracking (volume charts, PR tracking, 1RM estimation)
- UX enhancements (plate calculator, set history display, notes support)
- Advanced features (custom exercises, superset support, RPE/RIR tracking)

## References

- TASKS.md - Current phase progress and actionable task tracking
- PRD.md - Product vision, user stories, and success metrics
- CHANGELOG.md - Completed milestones and release history
- BACKLOG.md - Post-MVP feature prioritization
