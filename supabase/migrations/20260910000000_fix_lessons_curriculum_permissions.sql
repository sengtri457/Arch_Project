-- Migration: Fix lesson syllabus visibility and column permissions for all courses
-- Run this in Supabase Dashboard > SQL Editor > New query

-- 1. Grant SELECT on non-sensitive lesson metadata columns to authenticated and anon users
-- This allows client-side queries to read syllabus info (order, title, duration, preview flag, thumbnail, resources)
-- while keeping video_external_id and video_source_type protected.
GRANT SELECT (lesson_id, course_id, title, duration_minutes, order_index, is_preview, thumbnail_url, downloadable_asset_url)
  ON public.lessons TO authenticated;

GRANT SELECT (lesson_id, course_id, title, duration_minutes, order_index, is_preview, thumbnail_url)
  ON public.lessons TO anon;

-- 2. Update get_course_curriculum RPC to include downloadable_asset_url and support all courses
DROP FUNCTION IF EXISTS public.get_course_curriculum(text);

CREATE OR REPLACE FUNCTION public.get_course_curriculum(p_slug text)
RETURNS TABLE (
  lesson_id uuid, 
  order_index int, 
  title text, 
  duration_minutes int, 
  is_preview boolean,
  thumbnail_url text,
  downloadable_asset_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    l.lesson_id, 
    l.order_index, 
    l.title, 
    l.duration_minutes, 
    COALESCE(l.is_preview, false),
    l.thumbnail_url,
    l.downloadable_asset_url
  FROM public.lessons l
  JOIN public.courses c ON c.course_id = l.course_id
  WHERE (c.slug = p_slug OR c.course_id::text = p_slug)
  ORDER BY l.order_index ASC;
$$;

REVOKE EXECUTE ON FUNCTION public.get_course_curriculum(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_course_curriculum(text) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
