# Post-MVP Backlog

This document lists features deferred from the MVP roadmap. These enhancements will be prioritized post-launch based on user feedback and product-market fit validation.

## 📑 Table of Contents

- [Analytics & Progression](#analytics--progression)
- [UX Enhancements](#ux-enhancements)
- [Advanced Features](#advanced-features)
- [Infrastructure & Polish](#infrastructure--polish)

---

## Analytics & Progression

**Priority:** HIGH (first post-MVP features to implement)

- Volume tracking (weekly/monthly charts with Victory Native)
- Personal records tracking with badges and celebrations
- Strength progression charts (line charts, trend analysis)
- 1RM estimation (Epley formula: weight × (1 + reps/30))
- Plateau detection (Mann-Kendall statistical test with simple-statistics library)
- Workout summaries (post-workout report: duration, volume, PRs)
- Weekly summary notifications (Monday morning push notifications)
- Volume distribution analysis (pie charts by muscle group)

**Estimated effort:** ~35-45h (Phase 4 from original roadmap)

---

## UX Enhancements

**Priority:** MEDIUM

- **Plate calculator** (modal from weight input showing required plates per side)
- **Set history** (last 3-5 sets display below input for progressive overload reference)
- **Notes per workout/exercise/set** (text area for observations)
- **Onboarding flow** (3-4 screens with feature highlights on first launch)
- **Profile image upload** (Supabase Storage integration, expo-image-picker)
- **Superset/circuit support** (exercise grouping with visual indicators)

**Estimated effort:** ~20-25h

---

## Advanced Features

**Priority:** LOW (validate with users first)

- **Custom exercise creation** (user-defined exercises with image upload)
  - Migration path documented in [ADR-017](archives/ADR-017-No-Custom-Exercises-MVP.md)
  - Add `is_custom` and `created_by` fields to exercises table
  - RLS policies for user ownership
  - Sync protocol update for cross-device custom exercises
  - UI: "Create Custom Exercise" button in Exercise Library
  - Form: name, muscle groups, instructions, equipment, image upload (Supabase Storage)
  - **Estimated effort:** ~8-12h (Phase 3+)
- **RPE/RIR tracking** (Rating of Perceived Exertion / Reps In Reserve)
- **Auto-weight suggestions** (rule-based, context-aware recommendations)
- **Load management** (acute/chronic load ratios, overtraining alerts)
- **Context-aware analytics** (nutrition phase tracking: bulk/cut/maintenance)
- **Exercise video demonstrations** (user-recorded, Supabase Storage)
- **Advanced E2E testing** (full Maestro suite covering all user flows)

**Estimated effort:** ~40-50h

---

## Infrastructure & Polish

**Priority:** AS NEEDED

- **Auto-Sync ExerciseDB Updates** (Supabase Edge Function)
  - Automated weekly check for new ExerciseDB exercises
  - Supabase Edge Function calls ExerciseDB API
  - Upserts new exercises into PostgreSQL
  - Users receive updates via WatermelonDB sync (automatic)
  - Eliminates manual quarterly re-imports
  - Rate limit management (free tier: 10,000 req/month)
  - **Estimated effort:** ~6-8h (serverless architecture)
  - **Dependencies:** MVP complete, validated user adoption
- **Task ID Validation Script** (CI Automation)
  - Lightweight bash script to validate task ID format in CI
  - Check regex compliance: `^[0-9]+\.[0-9]+\.[0-9]+$`
  - Verify no duplicate IDs across TASKS.md
  - Non-blocking warnings (doesn't fail CI, just alerts)
  - **Files:** `.github/scripts/validate-task-ids.sh`
  - **Trigger:** Manual run or weekly cron (not on every commit)
  - **Estimated effort:** ~1-2h (simple grep/awk script)
  - **Dependencies:** None (can implement anytime)
- **React Query / TanStack Query** (Server State Caching)
  - Consider for advanced analytics queries (Phase 4+)
  - Useful if implementing web dashboard or complex data fetching
  - Alternative: Continue with direct Supabase calls + Zustand
  - **Estimated effort:** ~4-6h (setup + migration)
  - **Dependencies:** Validated need for advanced caching
- **Multi-language support (i18n)** - Defer until international expansion
- **Social features** (share workouts, follow friends) - Defer until user base >1,000
- **Coach-client relationship** (team accounts) - Defer until B2B validation
- **Performance dashboards** (Sentry Performance monitoring) - Already setup, just add custom metrics
- **Biometric authentication** (Face ID/Touch ID) - Not critical (user logs in once)

**Estimated effort:** ~15-20h (polish items only)

---

**For MVP Roadmap**, see [TASKS.md](./TASKS.md)
