# Post-MVP Backlog - Halterofit

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

**Estimated effort:** ~20-25h (polish items only)

---

**For MVP Roadmap**, see [TASKS.md](./TASKS.md)
