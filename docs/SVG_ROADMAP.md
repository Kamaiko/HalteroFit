# SVG Icon System — Roadmap

> Deferred items from the MuscleGroupIcon implementation.
> These build on the SVG body-crop icon system in `src/components/exercises/`.

---

## ~~1. Exercise GIF Placeholder~~ — Done

Replaced barbell-outline placeholders with `MuscleGroupIcon` (light variant) in `ExerciseCard`, `ExerciseThumbnail`, and `ExerciseGifHeader`. Added `getDominantMuscleGroupId()` mapping in `src/utils/muscles.ts`.

## ~~2. Workout Day Icon~~ — Done

Added `observeDominantMuscleByDays()` Observable in `day-operations.ts` that computes the most frequent muscle group per day. Wired through `useWorkoutScreen` → `WorkoutOverviewContent` → `DayCard` with `MuscleGroupIcon` (dark variant). Tie-breaking: first-listed exercise's muscle wins (by `order_index`).

## ~~3. Code Cleanup Audit~~ — Done

- Replaced hardcoded `size={24}` with `ICON_SIZE_MD` in `ExerciseThumbnail`, `DayCard`, `EditDayExerciseCard`
- Replaced hardcoded `'#3f3f3f'` with `Colors.muscle.dimBody` in `body-highlighter/index.tsx`
- Added `TARGET_MUSCLE_TO_GROUP_ID` mapping for ExerciseDB muscles → muscle group IDs

## 4. Abductors / Adductors

- Only 6 exercises each in the dataset (12 total out of 1500)
- Not viable as separate categories
- Users find them via Show All
- Revisit if dataset grows significantly
