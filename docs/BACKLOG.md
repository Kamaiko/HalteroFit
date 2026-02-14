# Backlog

This document lists features deferred from the MVP roadmap. These enhancements will be prioritized post-launch based on user feedback and product-market fit validation.

## 📑 Table of Contents

- [Analytics & Progression](#analytics--progression)
- [UX Enhancements](#ux-enhancements)
- [Advanced Features](#advanced-features)
- [Infrastructure & Polish](#infrastructure--polish)

---

## Analytics & Progression

**Priority:** HIGH (first Post-MVP features to implement)

- Volume tracking (weekly/monthly charts with Victory Native)
- Personal records tracking with badges and celebrations
- Strength progression charts (line charts, trend analysis)
- 1RM estimation (Epley formula: weight × (1 + reps/30))
- Plateau detection (Mann-Kendall statistical test with simple-statistics library)
- Workout summaries (post-workout report: duration, volume, PRs)
- Weekly summary notifications (Monday morning push notifications)
  - **Requires:** `expo-notifications` (~500KB) - Install when implementing
  - Push notifications for weekly summaries, rest reminders, etc.
- Volume distribution analysis (pie charts by muscle group)

**Estimated effort:** ~35-45h (Phase 4 from original roadmap)

### Implementation Details

<details>
<summary><strong>Core Formulas & Code</strong></summary>

**Principle:** Use scientifically validated formulas (no reinventing). Science-based, context-aware analytics. Avoid AI/ML complexity.

#### Core Calculations

| Metric                | Formula                                                  | Implementation                                   |
| --------------------- | -------------------------------------------------------- | ------------------------------------------------ |
| **Personalized 1RM**  | Average of Epley, Brzycki, Lombardi **+ RIR adjustment** | `weight * (1 + reps/30) * (1 + RIR * 0.033)`     |
| **Volume**            | Sets × Reps × Weight (context-aware)                     | Compound: 1.5x multiplier, warmups excluded      |
| **Acute Load**        | Sum of volume (last 7 days)                              | Rolling 7-day window                             |
| **Chronic Load**      | Average volume (last 28 days)                            | 4-week baseline                                  |
| **Fatigue Ratio**     | Acute Load / Chronic Load                                | >1.5 = high fatigue, <0.8 = detraining           |
| **Plateau Detection** | Mann-Kendall + nutrition context                         | `slope < 0.5 && pValue > 0.05 && phase != 'cut'` |

#### Advanced Analytics Implementation

**Personalized 1RM with RIR Adjustment:**

```typescript
// Traditional formula doesn't account for proximity to failure
// 100kg × 8 @ RIR2 > 105kg × 6 @ RIR0 (more strength capacity)
function calculatePersonalized1RM(weight, reps, rir) {
  const epley = weight * (1 + reps / 30);
  const brzycki = weight * (36 / (37 - reps));
  const lombardi = weight * Math.pow(reps, 0.1);
  const baseEstimate = (epley + brzycki + lombardi) / 3;

  // RIR adjustment: each RIR = ~3.3% additional capacity
  const rirAdjustment = 1 + rir * 0.033;
  return baseEstimate * rirAdjustment;
}
```

**Load Management & Fatigue:**

```typescript
function calculateFatigueMetrics(recentWorkouts) {
  const acuteLoad = sumVolume(last7Days);
  const chronicLoad = avgVolume(last28Days);
  const fatigueRatio = acuteLoad / chronicLoad;

  // Ratios from sports science literature
  if (fatigueRatio > 1.5) return { status: 'HIGH_FATIGUE', recommendation: 'Consider deload' };
  if (fatigueRatio < 0.8) return { status: 'DETRAINING', recommendation: 'Increase volume' };
  return { status: 'OPTIMAL', recommendation: 'Continue current training' };
}
```

**Context-Aware Plateau Detection:**

```typescript
function detectPlateauWithContext(exerciseHistory, user) {
  const mannKendall = performMannKendallTest(exerciseHistory, 28); // 4 weeks
  const isStatisticalPlateau = mannKendall.slope < 0.5 && mannKendall.pValue > 0.05;

  // Context matters: exercise order affects performance
  const isFirstExercise = exerciseOrder === 1;
  const isLateExercise = exerciseOrder > 3;

  if (isStatisticalPlateau && isLateExercise) {
    return { isPlateau: false, message: 'Performance drop expected for later exercises - normal fatigue' };
  }

  if (isStatisticalPlateau && isFirstExercise) {
    return { isPlateau: true, message: 'True plateau detected on primary lift. Consider variation or deload.' };
  }

  return { isPlateau: isStatisticalPlateau };
}
```

**Progressive Overload Metrics:**

- Weight progression (increase kg/lbs)
- Volume progression (sets × reps × weight)
- Intensity progression (RPE/RIR improvement, better performance at same RIR)
- Density progression (reduce rest time while maintaining performance)

</details>

### Features to Avoid (Over-Engineering)

| ❌ Avoid                   | Why                          | ✅ Alternative                                            |
| -------------------------- | ---------------------------- | --------------------------------------------------------- |
| "Energy Readiness Score"   | Needs wearables (HRV, sleep) | Fatigue ratio from load management                        |
| "AI/ML Recommendations"    | No training data at launch   | Science-based rules (RIR, load ratios, nutrition context) |
| "Automatic Program Design" | Too complex for MVP          | Template system + suggestions                             |

**Core Features (Science-Based, Not AI):**

- **Personalized 1RM** (RIR-adjusted formulas)
- **Load management** (acute/chronic ratios)
- **Context-aware plateau detection** (Mann-Kendall + nutrition phase)
- **Workout Reports** (performance score, fatigue estimate, recommendations)
- **Weekly Summaries** (volume trends, consistency, deload suggestions)
- **Progressive overload suggestions** (based on RIR, fatigue, nutrition phase)

---

## UX Enhancements

**Priority:** MEDIUM

- **Accessibility labels** (screen reader support)
  - Add `accessibilityRole`, `accessibilityLabel`, `accessibilityHint` to Pressable components
  - Priority components: ExerciseCard, DayExerciseCard, back buttons
  - Enables VoiceOver (iOS) and TalkBack (Android) for visually impaired users
  - **Estimated effort:** ~3-4h (repetitive but straightforward)
- **Light theme support** (toggle in settings, follow system preference option)
  - Current MVP: Dark theme only (brand focus)
  - Requires: Theme context, color palette for light mode, persist preference
  - **Estimated effort:** ~4-6h
- **Anatomy muscle selector** (visual body diagram for exercise filtering)
  - Current MVP: Simple "Show All" muscle list
  - Visual front/back body with tappable muscle groups
  - Highlight selected muscles, show exercise count per muscle
  - **Estimated effort:** ~8-12h (SVG diagrams + interaction logic)
- **Advanced exercise filters** (equipment, difficulty, muscle combinations)
  - Current MVP: Basic muscle filter with "Show All"
  - Multi-select equipment filter (barbell, dumbbell, cable, etc.)
  - Combine muscle + equipment filters
  - **Estimated effort:** ~4-6h
- **Exercise picker filters** (filter by muscle while selecting exercises for workout)
  - Current MVP: Search only in exercise picker
  - Add 2-3 quick filter checkboxes below search bar (e.g., by body part)
  - Reuse existing filter infrastructure from exercise-browser
  - **Estimated effort:** ~2-3h
- **Leftover session handling** (workout abandoned >4h)
  - Current MVP: No timeout handling
  - Detect workouts inactive for 4+ hours
  - Show notification/dialog: "Resume or Discard?"
  - Option to save partial progress or discard
  - Jefit pattern: See [screenshots/05-progress/05-leftover-session.png](reference/jefit/screenshots/05-progress/05-leftover-session.png)
  - **Estimated effort:** ~3-4h
- **Plate calculator** (modal from weight input showing required plates per side)
- **Set history** (last 3-5 sets display below input for progressive overload reference)
- **Notes per workout/exercise/set** (text area for observations)
- **Onboarding flow** (3-4 screens with feature highlights on first launch)
- **Profile image upload** (requires: expo-image-picker, Supabase Storage)
- **Superset/circuit support** (exercise grouping with visual indicators)
- **Form validation with Zod** (runtime schema validation for auth, settings, workout inputs)
- **Rest timer audio cues** (3 beeps countdown before set starts, like Jefit)
  - **Requires:** `expo-audio` - Install when implementing rest timer
  - Beep sounds at 3, 2, 1 seconds before rest ends
  - User can toggle sound on/off in settings
- **DayCard enhancements** (richer workout day information)
  - Last performed date per day (requires workout history query from Phase 3)
  - Estimated workout time (calculate from exercise count × avg set duration)
  - Dynamic muscle group icons based on day's exercises (replace generic fitness icon)
  - **Estimated effort:** ~3-4h (query + UI updates)
  - **Dependencies:** Phase 3 (workout history) for last performed date
- **Swipeable tabs** (restore gesture-based tab switching)
  - Current: SimpleTabs (tap-only)
  - Issue: PagerView crashes with `IllegalViewOperationException` on Android
  - Tried: `collapsable={false}`, `requestAnimationFrame`, `offscreenPageLimit` - none worked
  - **Root cause:** PagerView has known compatibility issues with complex nested views
  - **Solution:** `react-native-tab-view` - maintained by React Navigation team
    - Built on top of react-native-pager-view but with better abstractions
    - Handles edge cases that raw PagerView doesn't (view hierarchy, lazy loading)
    - Well-tested with Expo and React Navigation ecosystem
    - Used internally by @react-navigation/material-top-tabs
  - **Why NOT Expo Native Tabs:**
    - SDK 54+ Native Tabs is for _main app navigation_ (bottom/top tab bar)
    - NOT designed for internal sub-tabs within screens
    - Uses different native primitives (UITabBarController on iOS)
  - **Estimated effort:** ~2-3h

- **Add Day dialog enhancements**
  - "Set a workout day" selector (assign day of week: MON, TUE, etc.)
  - "Set as a rest day" checkbox
  - Schema already supports `day_of_week` column in `plan_days`

**Estimated effort:** ~25-30h

---

## Advanced Features

**Priority:** LOW (validate with users first)

- **AI Coach & Semantic Search** (Supabase Vector + pgvector)
  - Natural language exercise search: "exercice pour mal de dos" → relevant results
  - AI-powered workout suggestions based on user goals and history
  - Intelligent FAQ/support chatbot with RAG (Retrieval Augmented Generation)
  - Personalized exercise recommendations based on preferences
  - **Tech:** Supabase Vector (pgvector extension), OpenAI embeddings API
  - **Trade-offs:** Adds external API dependency (conflicts with offline-first), recurring API costs
  - **Estimated effort:** ~20-30h (embeddings pipeline + UI + LLM integration)
  - **Dependencies:** MVP complete, validated user demand for AI features
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

- **Observable pattern for plan data** (HIGH - Phase 5)
  - Current: Manual refetch triggers in useWorkoutScreen.ts (workaround)
  - Target: Use WatermelonDB observables for planDays and exerciseCounts
  - Benefits: Automatic UI updates when data changes, eliminates state sync bugs
  - Pattern: Similar to existing `observeActivePlan()` implementation
  - **Files:** src/hooks/workout/useWorkoutScreen.ts (lines 87-90, 236-238)
  - **Estimated effort:** ~2-3h (refactoring with testing)
  - **Risk:** Medium - requires careful testing of reactive updates
- **Exercise Dataset Ownership & CDN Reliability** (HIGH - Evaluate post-MVP)
  - Current state: 1,500 exercises from ExerciseDB (bundled JSON + CDN-hosted GIFs)
  - **Data quality issues identified:**
    - Muscle misclassifications (e.g., obliques never listed as primary target, 18+ exercises affected)
    - LLM batch correction planned (~$2 via Claude Batch API for all 1,500 exercises)
  - **CDN dependency risk:** GIFs rely on `static.exercisedb.dev` (Cloudflare R2)
    - If CDN goes down, all exercise GIFs break app-wide
    - Self-hosting options: R2 (~$0.01/month) or own CDN, but AGPL license complicates commercial use
  - **Industry benchmark:** Jefit (1,400), Strong (200), Hevy (400) all own their exercise data — none depend on external APIs
  - ExerciseDB API docs state "not recommended for production integration"
  - **Evaluation criteria:** data quality, GIF availability, license, CDN stability, maintenance cost
  - **Estimated effort:** ~8-16h (research + migration script + validation)
  - **Dependencies:** LLM muscle correction sprint complete first
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
- **Bundle Monitoring Enhancements** (BundleMon)
  - Shell script threshold (3MB) + Expo Atlas (local analysis)
  - BundleMon provides automated historical trend tracking and detailed PR comments
  - Consider when project grows beyond solo dev (5+ active contributors)
  - Consider when bundle size becomes critical performance bottleneck
  - Alternative: Continue with current simple threshold + local Expo Atlas
  - **Estimated effort:** ~2h (setup + configuration)
  - **Dependencies:** Team growth or bundle optimization priority
- **Multi-language support (i18n)** - Defer until international expansion
- **Social features** (share workouts, follow friends) - Defer until user base >1,000
- **Coach-client relationship** (team accounts) - Defer until B2B validation
- **Performance dashboards** (Sentry Performance monitoring) - Already setup, just add custom metrics
- **Biometric authentication** (Face ID/Touch ID) - Not critical (user logs in once)
- **CodeRabbit AI Integration** (Automated Code Review)
  - AI-powered PR reviews for open source contributions
  - Automated code quality checks, best practices enforcement
  - Useful when project scales and becomes easily contributable open source
  - Integration with GitHub Actions for seamless workflow
  - **Estimated effort:** ~2-3h (setup + configuration)
  - **Dependencies:** MVP complete, active open source contributors (3+)
  - **Trigger:** Only after project gains traction and external contributions increase
- **License Change** (If Keeping Project Private)
  - Current LICENSE: MIT (permissive open source)
  - If deciding to keep Halterofit proprietary/private: replace with "All Rights Reserved"
  - Decision point: Before accepting first external contribution or public release
  - **Note:** MIT License currently chosen to enable future open source transition
  - **Estimated effort:** <1h (replace LICENSE file + update README)
  - **Dependencies:** Strategic decision on project direction (private vs open source)
- **Documentation Site** (If Open Source)
  - Publish docs on GitHub Pages, Netlify, or Vercel
  - Framework options: Docusaurus (MDX for React components) or VitePress
  - Convert existing markdown docs to documentation site format
  - Add search, versioning, and better navigation
  - **Estimated effort:** ~4-6h (initial setup + migration)
  - **Dependencies:** Open source decision, stable documentation structure
- **OTA Updates** (expo-updates)
  - Over-the-air JavaScript updates without App Store review
  - Enables hotfixes and quick feature deployments
  - **Requires:** `expo-updates` package + EAS Update configuration
  - **Estimated effort:** ~3-4h (setup + testing)
  - **Dependencies:** Production release, stable update workflow needed

**Estimated effort:** ~25-30h (polish items only)

---

**For MVP Roadmap**, see [TASKS.md](./TASKS.md)
