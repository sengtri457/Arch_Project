-- ============================================================================
-- PHASE B FIX: Student-safe lab autorescue RPC
-- Run this entire file in: Supabase Dashboard > SQL Editor > New query
-- Safe to re-run (idempotent).
--
-- What it does:
--   Students previously tried to INSERT into exercises directly from the
--   browser, which RLS correctly blocks (writes are instructor/admin only).
--   ensure_lesson_exercise(p_lesson_id) lets any AUTHENTICATED user obtain the
--   lesson's practice lab - returning the existing row or creating a standard
--   default once - while keeping direct table writes locked down.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.ensure_lesson_exercise(p_lesson_id uuid, p_title text DEFAULT 'Practice Task')
RETURNS public.exercises
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing public.exercises%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.lessons WHERE lesson_id = p_lesson_id) THEN
    RAISE EXCEPTION 'Lesson not found';
  END IF;

  SELECT * INTO existing
  FROM public.exercises
  WHERE lesson_id = p_lesson_id
  ORDER BY exercise_id
  LIMIT 1;

  IF FOUND THEN
    RETURN existing;
  END IF;

  INSERT INTO public.exercises (lesson_id, title, brief_prompt, max_score)
  VALUES (
    p_lesson_id,
    p_title,
    'Recreate the rendering setup shown in the visualization video and submit your workspace or output render image link.',
    100
  )
  RETURNING * INTO existing;

  RETURN existing;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.ensure_lesson_exercise(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_lesson_exercise(uuid, text) TO authenticated;

NOTIFY pgrst, 'reload schema';
