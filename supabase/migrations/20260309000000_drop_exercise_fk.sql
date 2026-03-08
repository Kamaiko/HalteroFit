-- Drop FK constraints on exercise_id
-- Date: 2026-03-09
--
-- Exercises are static bundled data seeded locally on each client.
-- They are NOT synced to Supabase (excluded from pull_changes/push_changes).
-- The FK constraints block sync pushes because the exercises table on
-- Supabase is empty. Dropping FKs allows workout_exercises and
-- plan_day_exercises to reference exercise UUIDs without server-side validation.
--
-- exercise_id values are deterministic UUID v5 (same ExerciseDB ID → same UUID
-- on every client), so cross-device consistency is maintained.

ALTER TABLE public.workout_exercises
  DROP CONSTRAINT IF EXISTS workout_exercises_exercise_id_fkey;

ALTER TABLE public.plan_day_exercises
  DROP CONSTRAINT IF EXISTS plan_day_exercises_exercise_id_fkey;
