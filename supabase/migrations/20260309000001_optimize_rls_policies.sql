-- Optimize RLS policies + drop unused exercises indexes
-- Date: 2026-03-09
--
-- 1. Replace auth.uid() with (select auth.uid()) in all RLS policies.
--    PostgreSQL re-evaluates auth.uid() per row; wrapping in a subselect
--    lets the planner cache it once per query. Supabase recommends this pattern.
--    Ref: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
--
-- 2. Drop all indexes on the exercises table. Exercises are static local-only
--    data (bundled JSON, seeded into WatermelonDB on each client). The Supabase
--    exercises table is empty — these indexes serve no purpose.

-- ============================================================================
-- 1. RLS Policy Optimization: auth.uid() → (select auth.uid())
-- ============================================================================

-- 1a. Direct ownership policies (3 tables)

DROP POLICY IF EXISTS "Users see own profile" ON public.users;
CREATE POLICY "Users see own profile" ON public.users FOR ALL
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users see own workouts" ON public.workouts;
CREATE POLICY "Users see own workouts" ON public.workouts FOR ALL
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users manage own workout plans" ON public.workout_plans;
CREATE POLICY "Users manage own workout plans" ON public.workout_plans FOR ALL
  USING ((select auth.uid()) = user_id);

-- 1b. Inherited ownership policies (4 tables — auth.uid() inside EXISTS subquery)

DROP POLICY IF EXISTS "Users see own workout exercises" ON public.workout_exercises;
CREATE POLICY "Users see own workout exercises" ON public.workout_exercises FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.workouts
    WHERE workouts.id = workout_exercises.workout_id
    AND workouts.user_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Users see own exercise sets" ON public.exercise_sets;
CREATE POLICY "Users see own exercise sets" ON public.exercise_sets FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.workout_exercises we
    JOIN public.workouts w ON w.id = we.workout_id
    WHERE we.id = exercise_sets.workout_exercise_id
    AND w.user_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Users manage own plan days" ON public.plan_days;
CREATE POLICY "Users manage own plan days" ON public.plan_days FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.workout_plans
    WHERE workout_plans.id = plan_days.plan_id
    AND workout_plans.user_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Users manage own plan day exercises" ON public.plan_day_exercises;
CREATE POLICY "Users manage own plan day exercises" ON public.plan_day_exercises FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.plan_days pd
    JOIN public.workout_plans wp ON wp.id = pd.plan_id
    WHERE pd.id = plan_day_exercises.plan_day_id
    AND wp.user_id = (select auth.uid())
  ));

-- ============================================================================
-- 2. Drop unused indexes on exercises table (local-only, Supabase table empty)
-- ============================================================================

DROP INDEX IF EXISTS public.idx_exercises_name;
DROP INDEX IF EXISTS public.idx_exercises_exercisedb_id;
DROP INDEX IF EXISTS public.idx_exercises_body_parts;
DROP INDEX IF EXISTS public.idx_exercises_target_muscles;
DROP INDEX IF EXISTS public.idx_exercises_equipments;
DROP INDEX IF EXISTS public.idx_exercises_changed;
