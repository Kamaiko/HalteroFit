-- Sync RPC Functions: WatermelonDB↔Supabase Protocol
-- Date: 2026-03-08
--
-- Two functions implementing the WatermelonDB sync protocol:
-- - pull_changes: Returns server changes since last sync (7 syncable tables)
-- - push_changes: Applies client changes to server (upsert + soft delete)
--
-- Both use SECURITY DEFINER to bypass RLS (ownership enforced in function body).
-- exercises table excluded — static bundled data, read-only.

-- ============================================================
-- DROP existing functions (safe re-deploy if signature changed)
-- ============================================================

DROP FUNCTION IF EXISTS public.pull_changes;
DROP FUNCTION IF EXISTS public.push_changes;

-- ============================================================
-- PULL CHANGES
-- ============================================================

CREATE OR REPLACE FUNCTION public.pull_changes(last_pulled_at BIGINT DEFAULT 0)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _uid UUID := auth.uid();
  _ts  BIGINT := (EXTRACT(EPOCH FROM pg_catalog.now()) * 1000)::BIGINT;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN jsonb_build_object(
    'changes', jsonb_build_object(

      -- 1. users (direct ownership: id = auth.uid)
      'users', jsonb_build_object(
        'created', COALESCE((
          SELECT jsonb_agg(to_jsonb(r) - '_changed' - '_status')
          FROM public.users r
          WHERE r.id = _uid AND r._status IS NULL
            AND r._changed > last_pulled_at AND r.created_at > last_pulled_at
        ), '[]'::jsonb),
        'updated', COALESCE((
          SELECT jsonb_agg(to_jsonb(r) - '_changed' - '_status')
          FROM public.users r
          WHERE r.id = _uid AND r._status IS NULL
            AND r._changed > last_pulled_at AND r.created_at <= last_pulled_at
        ), '[]'::jsonb),
        'deleted', COALESCE((
          SELECT jsonb_agg(r.id)
          FROM public.users r
          WHERE r.id = _uid AND r._status = 'deleted'
            AND r._changed > last_pulled_at
        ), '[]'::jsonb)
      ),

      -- 2. workout_plans (direct ownership: user_id)
      'workout_plans', jsonb_build_object(
        'created', COALESCE((
          SELECT jsonb_agg(to_jsonb(r) - '_changed' - '_status')
          FROM public.workout_plans r
          WHERE r.user_id = _uid AND r._status IS NULL
            AND r._changed > last_pulled_at AND r.created_at > last_pulled_at
        ), '[]'::jsonb),
        'updated', COALESCE((
          SELECT jsonb_agg(to_jsonb(r) - '_changed' - '_status')
          FROM public.workout_plans r
          WHERE r.user_id = _uid AND r._status IS NULL
            AND r._changed > last_pulled_at AND r.created_at <= last_pulled_at
        ), '[]'::jsonb),
        'deleted', COALESCE((
          SELECT jsonb_agg(r.id)
          FROM public.workout_plans r
          WHERE r.user_id = _uid AND r._status = 'deleted'
            AND r._changed > last_pulled_at
        ), '[]'::jsonb)
      ),

      -- 3. workouts (direct ownership: user_id)
      'workouts', jsonb_build_object(
        'created', COALESCE((
          SELECT jsonb_agg(to_jsonb(r) - '_changed' - '_status')
          FROM public.workouts r
          WHERE r.user_id = _uid AND r._status IS NULL
            AND r._changed > last_pulled_at AND r.created_at > last_pulled_at
        ), '[]'::jsonb),
        'updated', COALESCE((
          SELECT jsonb_agg(to_jsonb(r) - '_changed' - '_status')
          FROM public.workouts r
          WHERE r.user_id = _uid AND r._status IS NULL
            AND r._changed > last_pulled_at AND r.created_at <= last_pulled_at
        ), '[]'::jsonb),
        'deleted', COALESCE((
          SELECT jsonb_agg(r.id)
          FROM public.workouts r
          WHERE r.user_id = _uid AND r._status = 'deleted'
            AND r._changed > last_pulled_at
        ), '[]'::jsonb)
      ),

      -- 4. plan_days (inherited via workout_plans)
      'plan_days', jsonb_build_object(
        'created', COALESCE((
          SELECT jsonb_agg(to_jsonb(r) - '_changed' - '_status')
          FROM public.plan_days r
          JOIN public.workout_plans wp ON wp.id = r.plan_id
          WHERE wp.user_id = _uid AND r._status IS NULL
            AND r._changed > last_pulled_at AND r.created_at > last_pulled_at
        ), '[]'::jsonb),
        'updated', COALESCE((
          SELECT jsonb_agg(to_jsonb(r) - '_changed' - '_status')
          FROM public.plan_days r
          JOIN public.workout_plans wp ON wp.id = r.plan_id
          WHERE wp.user_id = _uid AND r._status IS NULL
            AND r._changed > last_pulled_at AND r.created_at <= last_pulled_at
        ), '[]'::jsonb),
        'deleted', COALESCE((
          SELECT jsonb_agg(r.id)
          FROM public.plan_days r
          JOIN public.workout_plans wp ON wp.id = r.plan_id
          WHERE wp.user_id = _uid AND r._status = 'deleted'
            AND r._changed > last_pulled_at
        ), '[]'::jsonb)
      ),

      -- 5. workout_exercises (inherited via workouts)
      'workout_exercises', jsonb_build_object(
        'created', COALESCE((
          SELECT jsonb_agg(to_jsonb(r) - '_changed' - '_status')
          FROM public.workout_exercises r
          JOIN public.workouts w ON w.id = r.workout_id
          WHERE w.user_id = _uid AND r._status IS NULL
            AND r._changed > last_pulled_at AND r.created_at > last_pulled_at
        ), '[]'::jsonb),
        'updated', COALESCE((
          SELECT jsonb_agg(to_jsonb(r) - '_changed' - '_status')
          FROM public.workout_exercises r
          JOIN public.workouts w ON w.id = r.workout_id
          WHERE w.user_id = _uid AND r._status IS NULL
            AND r._changed > last_pulled_at AND r.created_at <= last_pulled_at
        ), '[]'::jsonb),
        'deleted', COALESCE((
          SELECT jsonb_agg(r.id)
          FROM public.workout_exercises r
          JOIN public.workouts w ON w.id = r.workout_id
          WHERE w.user_id = _uid AND r._status = 'deleted'
            AND r._changed > last_pulled_at
        ), '[]'::jsonb)
      ),

      -- 6. plan_day_exercises (inherited via plan_days → workout_plans)
      'plan_day_exercises', jsonb_build_object(
        'created', COALESCE((
          SELECT jsonb_agg(to_jsonb(r) - '_changed' - '_status')
          FROM public.plan_day_exercises r
          JOIN public.plan_days pd ON pd.id = r.plan_day_id
          JOIN public.workout_plans wp ON wp.id = pd.plan_id
          WHERE wp.user_id = _uid AND r._status IS NULL
            AND r._changed > last_pulled_at AND r.created_at > last_pulled_at
        ), '[]'::jsonb),
        'updated', COALESCE((
          SELECT jsonb_agg(to_jsonb(r) - '_changed' - '_status')
          FROM public.plan_day_exercises r
          JOIN public.plan_days pd ON pd.id = r.plan_day_id
          JOIN public.workout_plans wp ON wp.id = pd.plan_id
          WHERE wp.user_id = _uid AND r._status IS NULL
            AND r._changed > last_pulled_at AND r.created_at <= last_pulled_at
        ), '[]'::jsonb),
        'deleted', COALESCE((
          SELECT jsonb_agg(r.id)
          FROM public.plan_day_exercises r
          JOIN public.plan_days pd ON pd.id = r.plan_day_id
          JOIN public.workout_plans wp ON wp.id = pd.plan_id
          WHERE wp.user_id = _uid AND r._status = 'deleted'
            AND r._changed > last_pulled_at
        ), '[]'::jsonb)
      ),

      -- 7. exercise_sets (inherited via workout_exercises → workouts)
      'exercise_sets', jsonb_build_object(
        'created', COALESCE((
          SELECT jsonb_agg(to_jsonb(r) - '_changed' - '_status')
          FROM public.exercise_sets r
          JOIN public.workout_exercises we ON we.id = r.workout_exercise_id
          JOIN public.workouts w ON w.id = we.workout_id
          WHERE w.user_id = _uid AND r._status IS NULL
            AND r._changed > last_pulled_at AND r.created_at > last_pulled_at
        ), '[]'::jsonb),
        'updated', COALESCE((
          SELECT jsonb_agg(to_jsonb(r) - '_changed' - '_status')
          FROM public.exercise_sets r
          JOIN public.workout_exercises we ON we.id = r.workout_exercise_id
          JOIN public.workouts w ON w.id = we.workout_id
          WHERE w.user_id = _uid AND r._status IS NULL
            AND r._changed > last_pulled_at AND r.created_at <= last_pulled_at
        ), '[]'::jsonb),
        'deleted', COALESCE((
          SELECT jsonb_agg(r.id)
          FROM public.exercise_sets r
          JOIN public.workout_exercises we ON we.id = r.workout_exercise_id
          JOIN public.workouts w ON w.id = we.workout_id
          WHERE w.user_id = _uid AND r._status = 'deleted'
            AND r._changed > last_pulled_at
        ), '[]'::jsonb)
      )

    ),
    'timestamp', _ts
  );
END;
$$;

-- ============================================================
-- PUSH CHANGES
-- ============================================================

CREATE OR REPLACE FUNCTION public.push_changes(changes JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _uid UUID := auth.uid();
  _ts  BIGINT := (EXTRACT(EPOCH FROM pg_catalog.now()) * 1000)::BIGINT;
  _r   JSONB;
  _id  TEXT;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- ========================================
  -- CREATES & UPDATES (dependency order: parents first)
  -- ========================================

  -- 1. users (created + updated)
  FOR _r IN SELECT * FROM jsonb_array_elements(
    COALESCE(changes->'users'->'created', '[]'::jsonb) ||
    COALESCE(changes->'users'->'updated', '[]'::jsonb)
  )
  LOOP
    IF (_r->>'id')::UUID != _uid THEN
      RAISE EXCEPTION 'Cannot modify another user record';
    END IF;
    INSERT INTO public.users (id, email, preferred_unit, default_rest_timer_seconds, created_at, updated_at, _changed)
    VALUES (
      (_r->>'id')::UUID,
      COALESCE(_r->>'email', ''),
      COALESCE(_r->>'preferred_unit', 'kg'),
      (_r->>'default_rest_timer_seconds')::INTEGER,
      COALESCE((_r->>'created_at')::BIGINT, _ts),
      _ts, _ts
    )
    ON CONFLICT (id) DO UPDATE SET
      email = COALESCE(EXCLUDED.email, public.users.email),
      preferred_unit = COALESCE(EXCLUDED.preferred_unit, public.users.preferred_unit),
      default_rest_timer_seconds = EXCLUDED.default_rest_timer_seconds,
      updated_at = _ts,
      _changed = _ts;
  END LOOP;

  -- 2. workout_plans (created + updated)
  FOR _r IN SELECT * FROM jsonb_array_elements(
    COALESCE(changes->'workout_plans'->'created', '[]'::jsonb) ||
    COALESCE(changes->'workout_plans'->'updated', '[]'::jsonb)
  )
  LOOP
    INSERT INTO public.workout_plans (id, user_id, name, is_active, cover_image_url, created_at, updated_at, _changed)
    VALUES (
      (_r->>'id')::UUID,
      _uid,
      COALESCE(_r->>'name', ''),
      COALESCE((_r->>'is_active')::BOOLEAN, false),
      _r->>'cover_image_url',
      COALESCE((_r->>'created_at')::BIGINT, _ts),
      _ts, _ts
    )
    ON CONFLICT (id) DO UPDATE SET
      name = COALESCE(EXCLUDED.name, public.workout_plans.name),
      is_active = EXCLUDED.is_active,
      cover_image_url = EXCLUDED.cover_image_url,
      updated_at = _ts,
      _changed = _ts;
    -- Verify ownership of existing record
    IF NOT EXISTS (
      SELECT 1 FROM public.workout_plans WHERE id = (_r->>'id')::UUID AND user_id = _uid
    ) THEN
      RAISE EXCEPTION 'Ownership violation on workout_plans %', _r->>'id';
    END IF;
  END LOOP;

  -- 3. workouts (created + updated)
  FOR _r IN SELECT * FROM jsonb_array_elements(
    COALESCE(changes->'workouts'->'created', '[]'::jsonb) ||
    COALESCE(changes->'workouts'->'updated', '[]'::jsonb)
  )
  LOOP
    INSERT INTO public.workouts (id, user_id, plan_id, plan_day_id, started_at, completed_at, duration_seconds, title, notes, created_at, updated_at, _changed)
    VALUES (
      (_r->>'id')::UUID,
      _uid,
      NULLIF(_r->>'plan_id', '')::UUID,
      NULLIF(_r->>'plan_day_id', '')::UUID,
      COALESCE((_r->>'started_at')::BIGINT, _ts),
      (_r->>'completed_at')::BIGINT,
      (_r->>'duration_seconds')::INTEGER,
      _r->>'title',
      _r->>'notes',
      COALESCE((_r->>'created_at')::BIGINT, _ts),
      _ts, _ts
    )
    ON CONFLICT (id) DO UPDATE SET
      plan_id = EXCLUDED.plan_id,
      plan_day_id = EXCLUDED.plan_day_id,
      started_at = EXCLUDED.started_at,
      completed_at = EXCLUDED.completed_at,
      duration_seconds = EXCLUDED.duration_seconds,
      title = EXCLUDED.title,
      notes = EXCLUDED.notes,
      updated_at = _ts,
      _changed = _ts;
    IF NOT EXISTS (
      SELECT 1 FROM public.workouts WHERE id = (_r->>'id')::UUID AND user_id = _uid
    ) THEN
      RAISE EXCEPTION 'Ownership violation on workouts %', _r->>'id';
    END IF;
  END LOOP;

  -- 4. plan_days (created + updated)
  FOR _r IN SELECT * FROM jsonb_array_elements(
    COALESCE(changes->'plan_days'->'created', '[]'::jsonb) ||
    COALESCE(changes->'plan_days'->'updated', '[]'::jsonb)
  )
  LOOP
    -- Verify parent plan belongs to user
    IF NOT EXISTS (
      SELECT 1 FROM public.workout_plans WHERE id = NULLIF(_r->>'plan_id', '')::UUID AND user_id = _uid
    ) THEN
      RAISE EXCEPTION 'Ownership violation on plan_days — parent plan % not owned', _r->>'plan_id';
    END IF;
    INSERT INTO public.plan_days (id, plan_id, name, day_of_week, order_index, created_at, updated_at, _changed)
    VALUES (
      (_r->>'id')::UUID,
      (_r->>'plan_id')::UUID,
      COALESCE(_r->>'name', ''),
      _r->>'day_of_week',
      COALESCE((_r->>'order_index')::INTEGER, 0),
      COALESCE((_r->>'created_at')::BIGINT, _ts),
      _ts, _ts
    )
    ON CONFLICT (id) DO UPDATE SET
      plan_id = EXCLUDED.plan_id,
      name = COALESCE(EXCLUDED.name, public.plan_days.name),
      day_of_week = EXCLUDED.day_of_week,
      order_index = EXCLUDED.order_index,
      updated_at = _ts,
      _changed = _ts;
  END LOOP;

  -- 5. workout_exercises (created + updated)
  FOR _r IN SELECT * FROM jsonb_array_elements(
    COALESCE(changes->'workout_exercises'->'created', '[]'::jsonb) ||
    COALESCE(changes->'workout_exercises'->'updated', '[]'::jsonb)
  )
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.workouts WHERE id = (_r->>'workout_id')::UUID AND user_id = _uid
    ) THEN
      RAISE EXCEPTION 'Ownership violation on workout_exercises — parent workout % not owned', _r->>'workout_id';
    END IF;
    INSERT INTO public.workout_exercises (id, workout_id, exercise_id, order_index, superset_group, notes, target_sets, target_reps, created_at, updated_at, _changed)
    VALUES (
      (_r->>'id')::UUID,
      (_r->>'workout_id')::UUID,
      (_r->>'exercise_id')::UUID,
      COALESCE((_r->>'order_index')::INTEGER, 0),
      _r->>'superset_group',
      _r->>'notes',
      (_r->>'target_sets')::INTEGER,
      (_r->>'target_reps')::INTEGER,
      COALESCE((_r->>'created_at')::BIGINT, _ts),
      _ts, _ts
    )
    ON CONFLICT (id) DO UPDATE SET
      workout_id = EXCLUDED.workout_id,
      exercise_id = EXCLUDED.exercise_id,
      order_index = EXCLUDED.order_index,
      superset_group = EXCLUDED.superset_group,
      notes = EXCLUDED.notes,
      target_sets = EXCLUDED.target_sets,
      target_reps = EXCLUDED.target_reps,
      updated_at = _ts,
      _changed = _ts;
  END LOOP;

  -- 6. plan_day_exercises (created + updated)
  FOR _r IN SELECT * FROM jsonb_array_elements(
    COALESCE(changes->'plan_day_exercises'->'created', '[]'::jsonb) ||
    COALESCE(changes->'plan_day_exercises'->'updated', '[]'::jsonb)
  )
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.plan_days pd
      JOIN public.workout_plans wp ON wp.id = pd.plan_id
      WHERE pd.id = (_r->>'plan_day_id')::UUID AND wp.user_id = _uid
    ) THEN
      RAISE EXCEPTION 'Ownership violation on plan_day_exercises — parent plan_day % not owned', _r->>'plan_day_id';
    END IF;
    INSERT INTO public.plan_day_exercises (id, plan_day_id, exercise_id, order_index, target_sets, target_reps, rest_timer_seconds, notes, created_at, updated_at, _changed)
    VALUES (
      (_r->>'id')::UUID,
      (_r->>'plan_day_id')::UUID,
      (_r->>'exercise_id')::UUID,
      COALESCE((_r->>'order_index')::INTEGER, 0),
      COALESCE((_r->>'target_sets')::INTEGER, 3),
      COALESCE((_r->>'target_reps')::INTEGER, 10),
      (_r->>'rest_timer_seconds')::INTEGER,
      _r->>'notes',
      COALESCE((_r->>'created_at')::BIGINT, _ts),
      _ts, _ts
    )
    ON CONFLICT (id) DO UPDATE SET
      plan_day_id = EXCLUDED.plan_day_id,
      exercise_id = EXCLUDED.exercise_id,
      order_index = EXCLUDED.order_index,
      target_sets = EXCLUDED.target_sets,
      target_reps = EXCLUDED.target_reps,
      rest_timer_seconds = EXCLUDED.rest_timer_seconds,
      notes = EXCLUDED.notes,
      updated_at = _ts,
      _changed = _ts;
  END LOOP;

  -- 7. exercise_sets (created + updated)
  FOR _r IN SELECT * FROM jsonb_array_elements(
    COALESCE(changes->'exercise_sets'->'created', '[]'::jsonb) ||
    COALESCE(changes->'exercise_sets'->'updated', '[]'::jsonb)
  )
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.workout_exercises we
      JOIN public.workouts w ON w.id = we.workout_id
      WHERE we.id = (_r->>'workout_exercise_id')::UUID AND w.user_id = _uid
    ) THEN
      RAISE EXCEPTION 'Ownership violation on exercise_sets — parent workout_exercise % not owned', _r->>'workout_exercise_id';
    END IF;
    INSERT INTO public.exercise_sets (id, workout_exercise_id, set_number, weight, weight_unit, reps, duration_seconds, distance_meters, rpe, rir, rest_time_seconds, is_warmup, is_failure, notes, completed_at, created_at, updated_at, _changed)
    VALUES (
      (_r->>'id')::UUID,
      (_r->>'workout_exercise_id')::UUID,
      COALESCE((_r->>'set_number')::INTEGER, 1),
      (_r->>'weight')::NUMERIC(6,2),
      _r->>'weight_unit',
      (_r->>'reps')::INTEGER,
      (_r->>'duration_seconds')::INTEGER,
      (_r->>'distance_meters')::NUMERIC(10,2),
      (_r->>'rpe')::INTEGER,
      (_r->>'rir')::INTEGER,
      (_r->>'rest_time_seconds')::INTEGER,
      COALESCE((_r->>'is_warmup')::BOOLEAN, false),
      COALESCE((_r->>'is_failure')::BOOLEAN, false),
      _r->>'notes',
      (_r->>'completed_at')::BIGINT,
      COALESCE((_r->>'created_at')::BIGINT, _ts),
      _ts, _ts
    )
    ON CONFLICT (id) DO UPDATE SET
      workout_exercise_id = EXCLUDED.workout_exercise_id,
      set_number = EXCLUDED.set_number,
      weight = EXCLUDED.weight,
      weight_unit = EXCLUDED.weight_unit,
      reps = EXCLUDED.reps,
      duration_seconds = EXCLUDED.duration_seconds,
      distance_meters = EXCLUDED.distance_meters,
      rpe = EXCLUDED.rpe,
      rir = EXCLUDED.rir,
      rest_time_seconds = EXCLUDED.rest_time_seconds,
      is_warmup = EXCLUDED.is_warmup,
      is_failure = EXCLUDED.is_failure,
      notes = EXCLUDED.notes,
      completed_at = EXCLUDED.completed_at,
      updated_at = _ts,
      _changed = _ts;
  END LOOP;

  -- ========================================
  -- DELETES (reverse dependency order: children first)
  -- ========================================

  -- 7. exercise_sets
  FOR _id IN SELECT * FROM jsonb_array_elements_text(
    COALESCE(changes->'exercise_sets'->'deleted', '[]'::jsonb)
  )
  LOOP
    UPDATE public.exercise_sets SET _status = 'deleted', _changed = _ts
    WHERE id = _id::UUID
      AND EXISTS (
        SELECT 1 FROM public.workout_exercises we
        JOIN public.workouts w ON w.id = we.workout_id
        WHERE we.id = exercise_sets.workout_exercise_id AND w.user_id = _uid
      );
  END LOOP;

  -- 6. plan_day_exercises
  FOR _id IN SELECT * FROM jsonb_array_elements_text(
    COALESCE(changes->'plan_day_exercises'->'deleted', '[]'::jsonb)
  )
  LOOP
    UPDATE public.plan_day_exercises SET _status = 'deleted', _changed = _ts
    WHERE id = _id::UUID
      AND EXISTS (
        SELECT 1 FROM public.plan_days pd
        JOIN public.workout_plans wp ON wp.id = pd.plan_id
        WHERE pd.id = plan_day_exercises.plan_day_id AND wp.user_id = _uid
      );
  END LOOP;

  -- 5. workout_exercises
  FOR _id IN SELECT * FROM jsonb_array_elements_text(
    COALESCE(changes->'workout_exercises'->'deleted', '[]'::jsonb)
  )
  LOOP
    UPDATE public.workout_exercises SET _status = 'deleted', _changed = _ts
    WHERE id = _id::UUID
      AND EXISTS (
        SELECT 1 FROM public.workouts w
        WHERE w.id = workout_exercises.workout_id AND w.user_id = _uid
      );
  END LOOP;

  -- 4. plan_days
  FOR _id IN SELECT * FROM jsonb_array_elements_text(
    COALESCE(changes->'plan_days'->'deleted', '[]'::jsonb)
  )
  LOOP
    UPDATE public.plan_days SET _status = 'deleted', _changed = _ts
    WHERE id = _id::UUID
      AND EXISTS (
        SELECT 1 FROM public.workout_plans wp
        WHERE wp.id = plan_days.plan_id AND wp.user_id = _uid
      );
  END LOOP;

  -- 3. workouts
  FOR _id IN SELECT * FROM jsonb_array_elements_text(
    COALESCE(changes->'workouts'->'deleted', '[]'::jsonb)
  )
  LOOP
    UPDATE public.workouts SET _status = 'deleted', _changed = _ts
    WHERE id = _id::UUID AND user_id = _uid;
  END LOOP;

  -- 2. workout_plans
  FOR _id IN SELECT * FROM jsonb_array_elements_text(
    COALESCE(changes->'workout_plans'->'deleted', '[]'::jsonb)
  )
  LOOP
    UPDATE public.workout_plans SET _status = 'deleted', _changed = _ts
    WHERE id = _id::UUID AND user_id = _uid;
  END LOOP;

  -- 1. users
  FOR _id IN SELECT * FROM jsonb_array_elements_text(
    COALESCE(changes->'users'->'deleted', '[]'::jsonb)
  )
  LOOP
    UPDATE public.users SET _status = 'deleted', _changed = _ts
    WHERE id = _id::UUID AND id = _uid;
  END LOOP;

END;
$$;

-- ============================================================
-- GRANTS
-- ============================================================

GRANT EXECUTE ON FUNCTION public.pull_changes(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.push_changes(JSONB) TO authenticated;
