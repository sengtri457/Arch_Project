-- ============================================================================
-- Migration: Add Course Modules Hierarchy
-- Target: Archviz Portfolio LMS backend
-- ============================================================================

-- 1. Create course_modules table
CREATE TABLE IF NOT EXISTS public.course_modules (
    module_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(course_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    order_index INT NOT NULL DEFAULT 1,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add module_id foreign key to lessons table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'lessons' AND column_name = 'module_id'
    ) THEN
        ALTER TABLE public.lessons ADD COLUMN module_id UUID REFERENCES public.course_modules(module_id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Enable RLS on course_modules
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published course modules" ON public.course_modules;
CREATE POLICY "Public can view published course modules" ON public.course_modules
    FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Admins and instructors manage course modules" ON public.course_modules;
CREATE POLICY "Admins and instructors manage course modules" ON public.course_modules
    FOR ALL USING (public.is_instructor_or_admin(auth.uid()));

-- 4. RPC Function to fetch modules and nested lessons for a course
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
          'downloadable_asset_url', l.downloadable_asset_url
        ) ORDER BY l.order_index ASC
      ) FILTER (WHERE l.lesson_id IS NOT NULL),
      '[]'::jsonb
    ) AS lessons
  FROM public.course_modules m
  JOIN public.courses c ON c.course_id = m.course_id
  LEFT JOIN public.lessons l ON l.module_id = m.module_id
  WHERE c.slug = p_slug AND c.is_published = true AND m.is_published = true
  GROUP BY m.module_id, m.course_id, m.title, m.description, m.cover_image_url, m.order_index
  ORDER BY m.order_index ASC;
$$;

REVOKE EXECUTE ON FUNCTION public.get_course_modules(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_course_modules(text) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
