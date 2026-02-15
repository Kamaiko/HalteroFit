# SVG Icon System — Roadmap

> Deferred items from the MuscleGroupIcon implementation.
> These build on the SVG body-crop icon system in `src/components/exercises/`.

---

## 1. Exercise GIF Placeholder

Replace the current exercise GIF loading placeholder with the light variant SVG icon matching the exercise's primary target muscle.

```tsx
<MuscleGroupIcon muscleGroupId={targetMuscleId} variant="light" />
```

- Requires mapping from exercise `targetMuscle` to `muscleGroupId`
- See `MuscleGroupIcon` variant prop (already implemented)

## 2. Workout Day Icon

Replace workout day icons with the SVG of the primary muscle group most frequently targeted during that day's exercises.

- Requires aggregating target muscles across all exercises in a day
- Pick the most common one as the icon

## 3. Code Cleanup Audit

- Scan for hardcoded values (colors, sizes, durations)
- Ensure constants are in proper files under `src/constants/`
- Extract hooks where applicable
- Analyze logic improvement opportunities (even if it implies a larger refactor)

## 4. Abductors / Adductors

- Only 6 exercises each in the dataset (12 total out of 1500)
- Not viable as separate categories
- Users find them via Show All
- Revisit if dataset grows significantly
