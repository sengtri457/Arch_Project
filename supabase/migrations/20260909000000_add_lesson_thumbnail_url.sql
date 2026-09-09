-- Migration: Add thumbnail_url to lessons table and update get_course_curriculum RPC
-- Run this in Supabase Dashboard > SQL Editor > New query

ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Update get_course_curriculum RPC to return thumbnail_url and support both slug and course_id
DROP FUNCTION IF EXISTS public.get_course_curriculum(text);

CREATE OR REPLACE FUNCTION public.get_course_curriculum(p_slug text)
RETURNS TABLE (
  lesson_id uuid, 
  order_index int, 
  title text, 
  duration_minutes int, 
  is_preview boolean,
  thumbnail_url text
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
    l.thumbnail_url
  FROM public.lessons l
  JOIN public.courses c ON c.course_id = l.course_id
  WHERE (c.slug = p_slug OR c.course_id::text = p_slug) AND c.is_published = true
  ORDER BY l.order_index ASC;
$$;

REVOKE EXECUTE ON FUNCTION public.get_course_curriculum(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_course_curriculum(text) TO anon, authenticated;

-- Seed thumbnail_url for the existing 10 D5 Masterclass lessons
UPDATE public.lessons
SET thumbnail_url = '/assets/images/D5_class_img/M' || order_index || '.jpg'
WHERE course_id = 'd4a1b756-12d4-4047-93bd-8b58b94cb146'
  AND order_index BETWEEN 1 AND 10;

NOTIFY pgrst, 'reload schema';
