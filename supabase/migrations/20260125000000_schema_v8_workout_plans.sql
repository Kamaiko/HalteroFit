-- Schema v8: Workout Plans & Templates
-- Date: 2026-01-25
--
-- Adds workout plan/template system:
-- - workout_plans: Reusable workout templates
-- - plan_days: Days within a plan (e.g., "Day 1 Chest", "Day 2 Back")
-- - plan_day_exercises: Exercises template for each day
-- - workouts.plan_id, plan_day_id: Link logged workouts to source plan
-- - users.default_rest_timer_seconds: Global rest timer preference

-- ============================================================
-- NEW COLUMNS ON EXISTING TABLES
-- ============================================================

-- Users: global rest timer preference
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS default_rest_timer_seconds INTEGER DEFAULT 90;

-- Workouts: link to source plan (nullable - workout can be created without plan)
ALTER TABLE public.workouts
  ADD COLUMN IF NOT EXISTS plan_id UUID,
  ADD COLUMN IF NOT EXISTS plan_day_id UUID;

-- ============================================================
-- NEW TABLES
-- ============================================================

-- Workout Plans (templates/routines)
CREATE TABLE public.workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  cover_image_url TEXT,

  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM pg_catalog.now()) * 1000)::BIGINT,
  updated_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM pg_catalog.now()) * 1000)::BIGINT,
  _changed BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM pg_catalog.now()) * 1000)::BIGINT,
  _status TEXT CHECK (_status IS NULL OR _status = 'deleted')
);

-- Plan Days (days within a plan)
CREATE TABLE public.plan_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.workout_plans(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  day_of_week TEXT, -- 'MON', 'TUE', etc. (optional)
  order_index INTEGER NOT NULL,

  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM pg_catalog.now()) * 1000)::BIGINT,
  updated_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM pg_catalog.now()) * 1000)::BIGINT,
  _changed BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM pg_catalog.now()) * 1000)::BIGINT,
  _status TEXT CHECK (_status IS NULL OR _status = 'deleted')
);

-- Plan Day Exercises (exercise templates within a day)
CREATE TABLE public.plan_day_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_day_id UUID NOT NULL REFERENCES public.plan_days(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,

  order_index INTEGER NOT NULL,
  target_sets INTEGER NOT NULL DEFAULT 3,
  target_reps INTEGER NOT NULL DEFAULT 10,
  rest_timer_seconds INTEGER, -- Overrides user default if set
  notes TEXT,

  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM pg_catalog.now()) * 1000)::BIGINT,
  updated_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM pg_catalog.now()) * 1000)::BIGINT,
  _changed BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM pg_catalog.now()) * 1000)::BIGINT,
  _status TEXT CHECK (_status IS NULL OR _status = 'deleted')
);

-- ============================================================
-- FOREIGN KEYS FOR WORKOUTS (after tables exist)
-- ============================================================

ALTER TABLE public.workouts
  ADD CONSTRAINT fk_workouts_plan_id
    FOREIGN KEY (plan_id) REFERENCES public.workout_plans(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_workouts_plan_day_id
    FOREIGN KEY (plan_day_id) REFERENCES public.plan_days(id) ON DELETE SET NULL;

-- ============================================================
-- INDEXES
-- ============================================================

-- Workout Plans
CREATE INDEX idx_workout_plans_user_id ON public.workout_plans(user_id);
CREATE INDEX idx_workout_plans_is_active ON public.workout_plans(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_workout_plans_changed ON public.workout_plans(user_id, _changed) WHERE _status IS NULL;

-- Plan Days
CREATE INDEX idx_plan_days_plan_id ON public.plan_days(plan_id);
CREATE INDEX idx_plan_days_order ON public.plan_days(plan_id, order_index);
CREATE INDEX idx_plan_days_changed ON public.plan_days(_changed) WHERE _status IS NULL;

-- Plan Day Exercises
CREATE INDEX idx_plan_day_exercises_plan_day_id ON public.plan_day_exercises(plan_day_id);
CREATE INDEX idx_plan_day_exercises_exercise_id ON public.plan_day_exercises(exercise_id);
CREATE INDEX idx_plan_day_exercises_order ON public.plan_day_exercises(plan_day_id, order_index);
CREATE INDEX idx_plan_day_exercises_changed ON public.plan_day_exercises(_changed) WHERE _status IS NULL;

-- Workouts plan references
CREATE INDEX idx_workouts_plan_id ON public.workouts(plan_id) WHERE plan_id IS NOT NULL;
CREATE INDEX idx_workouts_plan_day_id ON public.workouts(plan_day_id) WHERE plan_day_id IS NOT NULL;

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE TRIGGER workout_plans_changed BEFORE UPDATE ON public.workout_plans
  FOR EACH ROW EXECUTE FUNCTION update_changed_timestamp();

CREATE TRIGGER plan_days_changed BEFORE UPDATE ON public.plan_days
  FOR EACH ROW EXECUTE FUNCTION update_changed_timestamp();

CREATE TRIGGER plan_day_exercises_changed BEFORE UPDATE ON public.plan_day_exercises
  FOR EACH ROW EXECUTE FUNCTION update_changed_timestamp();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_day_exercises ENABLE ROW LEVEL SECURITY;

-- Workout Plans: own data
CREATE POLICY "Users manage own workout plans" ON public.workout_plans FOR ALL
  USING (auth.uid() = user_id);

-- Plan Days: inherited from workout_plans
CREATE POLICY "Users manage own plan days" ON public.plan_days FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.workout_plans
    WHERE workout_plans.id = plan_days.plan_id
    AND workout_plans.user_id = auth.uid()
  ));

-- Plan Day Exercises: inherited from plan_days → workout_plans
CREATE POLICY "Users manage own plan day exercises" ON public.plan_day_exercises FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.plan_days pd
    JOIN public.workout_plans wp ON wp.id = pd.plan_id
    WHERE pd.id = plan_day_exercises.plan_day_id
    AND wp.user_id = auth.uid()
  ));
