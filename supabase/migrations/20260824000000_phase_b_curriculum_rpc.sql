-- ============================================================================
-- PHASE B - BATCH 1: Course landing page curriculum RPC
-- Run this entire file in: Supabase Dashboard > SQL Editor > New query
-- Safe to re-run (idempotent). Finishes with NOTIFY pgrst, 'reload schema'.
--
-- What it does:
--   Exposes get_course_curriculum(p_slug) publicly so anonymous visitors on a
--   course landing page can see the syllabus structure (order, title, minutes,
--   preview flag, preview lesson id) WITHOUT any access to locked lesson rows
--   or video URLs. Video delivery remains gated by get_lesson_video.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_course_curriculum(p_slug text)
RETURNS TABLE (lesson_id uuid, order_index int, title text, duration_minutes int, is_preview boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT l.lesson_id, l.order_index, l.title, l.duration_minutes, COALESCE(l.is_preview, false)
  FROM public.lessons l
  JOIN public.courses c ON c.course_id = l.course_id
  WHERE c.slug = p_slug AND c.is_published = true
  ORDER BY l.order_index ASC
$$;

REVOKE EXECUTE ON FUNCTION public.get_course_curriculum(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_course_curriculum(text) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
