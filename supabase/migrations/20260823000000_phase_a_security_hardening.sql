-- ============================================================================
-- PHASE A SECURITY HARDENING
-- Run this entire file in: Supabase Dashboard > SQL Editor > New query
-- Safe to re-run (idempotent). Finishes with NOTIFY pgrst, 'reload schema'.
--
-- What it does:
--   1. Stops anonymous/public reading of the lessons table (paid video URLs
--      were world-readable). Authenticated users keep metadata-only access.
--   2. Adds get_lesson_video(p_lesson_id) - a SECURITY DEFINER RPC that hands
--      out the playable video URL ONLY after verifying, inside Postgres:
--        preview flag -> admin/instructor role -> active enrollment ->
--        active unexpired subscription with sufficient plan level
--   3. Expires subscriptions whose current_period_end has passed, and
--      schedules a daily pg_cron job to keep expiring them automatically.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Lock down lessons table
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public read access to lessons" ON public.lessons;
DROP POLICY IF EXISTS "Students can view lessons of enrolled/purchased courses" ON public.lessons;

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view lesson metadata"
  ON public.lessons
  FOR SELECT
  TO authenticated
  USING (true);

REVOKE SELECT ON public.lessons FROM anon;
REVOKE SELECT ON public.lessons FROM authenticated;
GRANT SELECT (lesson_id, course_id, title, duration_minutes, order_index, is_preview)
  ON public.lessons TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. Secure video delivery RPC
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_lesson_video(p_lesson_id uuid)
RETURNS TABLE (video_source text, video_url text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  l            public.lessons%ROWTYPE;
  v_role       text;
  v_enrollment text;
  v_course     record;
  v_required   int;
  v_sub        record;
BEGIN
  SELECT * INTO l FROM public.lessons WHERE lesson_id = p_lesson_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF l.video_external_id IS NULL OR l.video_external_id = '' THEN
    RETURN;
  END IF;

  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  IF COALESCE(l.is_preview, false) THEN
    video_source := l.video_source_type;
    video_url    := l.video_external_id;
    RETURN NEXT;
    RETURN;
  END IF;

  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  IF v_role IN ('admin', 'instructor') THEN
    video_source := l.video_source_type;
    video_url    := l.video_external_id;
    RETURN NEXT;
    RETURN;
  END IF;

  SELECT status INTO v_enrollment
  FROM public.course_enrollments
  WHERE student_id = auth.uid() AND course_id = l.course_id;
  IF v_enrollment = 'active' THEN
    video_source := l.video_source_type;
    video_url    := l.video_external_id;
    RETURN NEXT;
    RETURN;
  END IF;

  SELECT required_plan_id, slug INTO v_course
  FROM public.courses
  WHERE course_id = l.course_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_required := v_course.required_plan_id;
  IF v_required IS NULL THEN
    IF v_course.slug = 'photoshop-masterclass' THEN
      v_required := 3;
    ELSIF v_course.slug IN ('d5-masterclass', 'enscape-masterclass', 'indesign-masterclass') THEN
      v_required := 2;
    ELSE
      RETURN;
    END IF;
  END IF;

  SELECT plan_id, current_period_end INTO v_sub
  FROM public.user_subscriptions
  WHERE user_id = auth.uid() AND status = 'active';

  IF v_sub.plan_id IS NOT NULL
     AND v_sub.current_period_end > now()
     AND v_sub.plan_id >= v_required THEN
    video_source := l.video_source_type;
    video_url    := l.video_external_id;
    RETURN NEXT;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_lesson_video(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_lesson_video(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. Expire stale subscriptions + daily cron
-- ---------------------------------------------------------------------------
UPDATE public.user_subscriptions
SET status = 'expired'
WHERE status = 'active'
  AND current_period_end < now();

CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'expire-subscriptions-daily'
  ) THEN
    PERFORM cron.schedule(
      'expire-subscriptions-daily',
      '0 3 * * *',
      $cron$UPDATE public.user_subscriptions SET status = 'expired' WHERE status = 'active' AND current_period_end < now()$cron$
    );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
