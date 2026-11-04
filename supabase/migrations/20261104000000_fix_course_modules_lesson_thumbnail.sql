-- Migration: Include thumbnail_url in get_course_modules RPC lessons JSON
-- This ensures lessons in module/chapter sidebar and player correctly receive their thumbnail

CREATE OR REPLACE FUNCTION public.get_course_modules(p_slug text)
RETURNS TABLE (
    module_id uuid,
    course_id uuid,
    module_title text,
    module_description text,
    module_cover_image text,
    module_order_index int,
    lessons jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    m.module_id,
    m.course_id,
    m.title AS module_title,
    m.description AS module_description,
    m.cover_image_url AS module_cover_image,
    m.order_index AS module_order_index,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'lesson_id', l.lesson_id,
          'title', l.title,
          'duration_minutes', l.duration_minutes,
          'order_index', l.order_index,
          'is_preview', COALESCE(l.is_preview, false),
          'downloadable_asset_url', l.downloadable_asset_url,
          'video_external_id', l.video_external_id,
          'video_source_type', l.video_source_type,
          'video_url', l.video_external_id,
          'thumbnail_url', l.thumbnail_url,
          'cover_image', l.thumbnail_url
        ) ORDER BY l.order_index ASC
      ) FILTER (WHERE l.lesson_id IS NOT NULL),
      '[]'::jsonb
    ) AS lessons
  FROM public.course_modules m
  JOIN public.courses c ON c.course_id = m.course_id
  LEFT JOIN public.lessons l ON (
    l.module_id = m.module_id 
    OR (
      l.module_id IS NULL 
      AND l.course_id = m.course_id 
      AND m.order_index = (
        SELECT MIN(cm.order_index) 
        FROM public.course_modules cm 
        WHERE cm.course_id = m.course_id AND cm.is_published = true
      )
    )
  )
  WHERE (c.slug = p_slug OR c.course_id::text = p_slug) AND c.is_published = true AND m.is_published = true
  GROUP BY m.module_id, m.course_id, m.title, m.description, m.cover_image_url, m.order_index
  ORDER BY m.order_index ASC;
$$;

REVOKE EXECUTE ON FUNCTION public.get_course_modules(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_course_modules(text) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
