# Phase 2 Implementation Audit

**Date:** 2026-01-26
**Status:** Task 2.1.1 - ~80% Complete (UI functional, some features pending)

---

## 1. What Was Planned vs What Was Done

### Task 2.1.1: WorkoutOverviewScreen

| Planned Component | Status | Notes |
|-------------------|--------|-------|
| `PlanHeader.tsx` | ✅ Created | Works as designed |
| `DayCard.tsx` | ✅ Created | Works as designed |
| `WorkoutSubTabs.tsx` | ❌ Not created | See "Deviation #1" below |
| `workout.tsx` refactor | ✅ Done | With workaround for tabs |
| `index.ts` barrel export | ✅ Created | |

### Files Created

```
src/components/workout/
├── PlanHeader.tsx      ✅ Complete
├── DayCard.tsx         ✅ Complete
└── index.ts            ✅ Complete

src/app/plans/
├── _layout.tsx         ✅ Placeholder for Task 2.1.3
└── index.tsx           ✅ Placeholder for Task 2.1.3
```

### Files Modified

```
src/app/(tabs)/workout.tsx    - Complete refactor
src/app/_layout.tsx           - Added dev mode banner
src/stores/auth/authStore.ts  - Added enableDevMode()
```

---

## 2. Deviations From Plan

### Deviation #1: SwipeableTabs Replaced with Simple Tabs

**Problem:** `react-native-pager-view` crashed with `IllegalViewOperationException` when used inside the Workout screen structure.

**Workaround:** Replaced `SwipeableTabs` with simple `Pressable`-based tabs and conditional rendering.

**Impact:**
- ❌ No swipe gesture between Overview/Day Details
- ✅ Tap to switch tabs works
- 🔄 Can revisit SwipeableTabs later when root cause is identified

**Code location:** [workout.tsx:264-282](../src/app/(tabs)/workout.tsx#L264-L282)

```tsx
// TODO: Restore SwipeableTabs once PagerView crash is resolved
// See: IllegalViewOperationException with react-native-pager-view
<View className="flex-row border-b...">
  <Pressable onPress={() => setActiveTabIndex(0)}>...
```

### Deviation #2: Dev Mode Authentication

**Problem:** No authentication implemented yet (Phase 4), but screens require a user ID.

**Solution:** Created `enableDevMode()` function with mock user.

**Files affected:**
- `src/stores/auth/authStore.ts` - Added `DEV_MOCK_USER` and `enableDevMode()`
- `src/app/_layout.tsx` - Calls `enableDevMode()` on startup

**Visual indicator:** Orange banner at top of app: "🔧 DEV MODE - Mock User Active"

---

## 3. Features Status

### ✅ Implemented (Working)

| Feature | Location |
|---------|----------|
| Plan header with gradient | PlanHeader.tsx |
| "All Plans" button → navigation | PlanHeader.tsx:31-34 |
| Tab switching (tap) | workout.tsx:264-282 |
| Days list with FlashList | workout.tsx:307-327 |
| Day selection (blue bar) | DayCard.tsx:88-93 |
| Menu button on DayCard | DayCard.tsx:144-156 |
| Day menu bottom sheet | workout.tsx:407-427 |
| Delete day with confirmation | workout.tsx:180-203, 430-440 |
| Empty state for no days | workout.tsx:290-305 |
| "Add a day" button | workout.tsx:314-325 |
| Loading state | workout.tsx:235-241 |
| No user state | workout.tsx:244-253 |

### ⏳ Placeholders (Console.log Only)

| Feature | Location | Future Task |
|---------|----------|-------------|
| Add day action | workout.tsx:206-209 | Task 2.1.6 |
| Edit day action | workout.tsx:169-173 | Task 2.1.4 |
| Add exercise action | workout.tsx:365 | Task 2.1.2 |
| Start workout action | workout.tsx:400 | Task 3.x |

### ❌ Not Implemented Yet

| Feature | Reason | Future Task |
|---------|--------|-------------|
| Swipe between tabs | PagerView crash | TBD |
| Auto-switch to Day Details on select | Needs SwipeableTabs ref | TBD |
| Exercise counts per day | Needs query implementation | Task 2.1.2 |
| Last performed date | Needs workout history | Task 3.x |
| Estimated workout time | Needs exercise data | Task 2.1.2 |

---

## 4. Technical Debt

### High Priority (Fix Soon)

1. **FlashList `estimatedItemSize` warning**
   - Location: workout.tsx:308
   - Issue: Types don't include the prop, but FlashList warns without it
   - Fix: Add `// @ts-expect-error` or update @shopify/flash-list types

2. **Unused `handleTabChange` function**
   - Location: workout.tsx:163-166
   - Issue: Was for SwipeableTabs, now unused
   - Fix: Remove or use for future tab component

### Medium Priority (Clean Later)

3. **Duplicate tab implementation**
   - `SwipeableTabs` exists in `src/components/ui/swipeable-tabs.tsx`
   - Manual tabs in `workout.tsx:264-282`
   - Consider: Extract manual tabs to reusable `SimpleTabs` component

4. **Dev mode in production code**
   - Files: `_layout.tsx`, `authStore.ts`
   - Risk: Easy to forget removing before production
   - Mitigation: Prominent TODO comments and orange banner

### Low Priority (Post-MVP)

5. **DayCard icon is generic**
   - Currently shows `fitness-center` for all days
   - Ideal: Show muscle group icon based on exercises

---

## 5. Dev Mode Explanation

### What Is Dev Mode?

A **development-only** feature that simulates an authenticated user without requiring:
- Supabase connection
- Real user account
- Network connectivity

### How It Works

```typescript
// authStore.ts
const DEV_MOCK_USER: User = {
  id: 'dev-user-123',
  email: 'dev@halterofit.local',
};

export function enableDevMode(): void {
  if (__DEV__) {  // Only works in development builds
    useAuthStore.getState().setUser(DEV_MOCK_USER);
  }
}
```

### Dev Mode vs Test Account

| Aspect | Dev Mode (Current) | Test Account (Phase 4) |
|--------|-------------------|------------------------|
| **Purpose** | UI testing without auth | Integration testing |
| **User ID** | Hardcoded `dev-user-123` | Real Supabase UUID |
| **Data** | Local WatermelonDB only | Syncs to Supabase |
| **Network** | Not required | Required |
| **Production** | Must be removed | Can stay (testing tier) |

### When To Remove

Remove `enableDevMode()` call when:
1. Phase 4 (Auth) is implemented
2. Real login flow works
3. Ready for beta testing

**Location to change:** `src/app/_layout.tsx:38`

---

## 6. Code Quality Issues Found

### workout.tsx (443 lines)

- **Too many responsibilities**: State, effects, handlers, render all in one file
- **Suggestion**: Extract to custom hook `useWorkoutScreen()`
- **ROI**: Medium (improves testability)

### Commented-out code

```tsx
// Line 58: "Note: Programmatic tab switching will be added later"
// Line 154: "Note: Auto-switch to Day Details will be added"
// Line 264: "SwipeableTabs temporarily disabled"
// Line 386: "Exercise list will be implemented in Task 2.1.2"
```

**Verdict**: These are acceptable as they document future work. Consider converting to `// TODO(Task 2.1.x):` format.

---

## 7. Next Steps

### Immediate (Before Moving to 2.1.2)

1. [ ] Clean up unused `handleTabChange` function
2. [ ] Update plan file to mark 2.1.1 progress
3. [ ] Decide: Extract manual tabs to component or keep inline

### Task 2.1.2 Prerequisites

1. Implement exercise count query for DayCard
2. Build Day Details exercise list UI
3. Add exercise to day functionality

### Task 2.1.3 Prerequisites

1. Complete AllPlansScreen placeholder
2. Plan grid layout
3. Plan selection/activation

---

## 8. Files Reference

| File | Lines | Purpose |
|------|-------|---------|
| [workout.tsx](../src/app/(tabs)/workout.tsx) | 430 | Main workout screen |
| [PlanHeader.tsx](../src/components/workout/PlanHeader.tsx) | 93 | Plan header component |
| [DayCard.tsx](../src/components/workout/DayCard.tsx) | 169 | Day card component |
| [authStore.ts](../src/stores/auth/authStore.ts) | 107 | Auth store with dev mode |
| [_layout.tsx](../src/app/_layout.tsx) | 99 | Root layout with dev banner |

---

## 9. Quick Wins & Improvements (ROI Analysis)

### High ROI (Do Soon)

| Improvement | Effort | Impact | Why |
|-------------|--------|--------|-----|
| **Add `getExerciseCountByDay()` query** | 30 min | High | Unblocks DayCard showing real data |
| **Extract SimpleTabs component** | 20 min | Medium | Reusable for other screens (History) |
| **Add day press → auto-switch implemented** | Done ✅ | High | Better UX, was just 1 line change |

### Medium ROI (Nice to Have)

| Improvement | Effort | Impact | Why |
|-------------|--------|--------|-----|
| **Extract `useWorkoutScreen` hook** | 1h | Medium | Better testability, cleaner component |
| **Add lastPerformed to DayCard** | 1h | Medium | Requires workout history query |
| **Investigate PagerView crash** | 2h | Low | SwipeableTabs nice but not critical |

### Low ROI (Defer)

| Improvement | Effort | Impact | Why |
|-------------|--------|--------|-----|
| **Dynamic muscle icons per day** | 2h | Low | Cosmetic, needs exercise → muscle mapping |
| **Animated tab transitions** | 1h | Low | Cosmetic polish |

---

## 10. Recommended Next Actions

1. **Immediate**: Start Task 2.1.2 (DayDetailsScreen)
   - Create `getExerciseCountByDay()` query
   - Add exercise list to Day Details tab

2. **Before moving to 2.1.3**: Verify delete day works correctly

3. **When Phase 4 starts**: Remove `enableDevMode()` call from `_layout.tsx`
