-- Migration: Student Showcase Posts & Ratings System

-- 1. Create Student Showcase Posts table
CREATE TABLE IF NOT EXISTS public.student_work_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    student_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    student_name TEXT NOT NULL,
    media_urls JSONB DEFAULT '[]', -- JSON array of strings
    cover_image_url TEXT NOT NULL,
    architecture_field TEXT, -- e.g. Residential, Commercial, Interior, Landscape, etc.
    software_used TEXT, -- e.g. SketchUp, D5 Render, Photoshop
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Student Showcase Ratings table
CREATE TABLE IF NOT EXISTS public.student_work_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.student_work_posts(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT, -- Optional text commentary review
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(post_id, student_id)
);

-- 3. Register the 'student-showcase' storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-showcase', 'student-showcase', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Set storage bucket security policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND policyname='Showcase images are public') THEN
    EXECUTE 'CREATE POLICY "Showcase images are public" ON storage.objects FOR SELECT USING (bucket_id = ''student-showcase'')';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND policyname='Admins upload showcase images') THEN
    EXECUTE 'CREATE POLICY "Admins upload showcase images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = ''student-showcase'')';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND policyname='Admins update showcase images') THEN
    EXECUTE 'CREATE POLICY "Admins update showcase images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = ''student-showcase'') WITH CHECK (bucket_id = ''student-showcase'')';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND policyname='Admins delete showcase images') THEN
    EXECUTE 'CREATE POLICY "Admins delete showcase images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = ''student-showcase'')';
  END IF;
END $$;

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.student_work_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_work_ratings ENABLE ROW LEVEL SECURITY;

-- 6. Setup RLS policies for student_work_posts
DROP POLICY IF EXISTS "Public can view published student work" ON public.student_work_posts;
CREATE POLICY "Public can view published student work" ON public.student_work_posts
    FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Admins and instructors manage student work" ON public.student_work_posts;
CREATE POLICY "Admins and instructors manage student work" ON public.student_work_posts
    FOR ALL USING (public.is_instructor_or_admin(auth.uid()));

-- 7. Setup RLS policies for student_work_ratings
DROP POLICY IF EXISTS "Anyone can view ratings" ON public.student_work_ratings;
CREATE POLICY "Anyone can view ratings" ON public.student_work_ratings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Students can manage own ratings" ON public.student_work_ratings;
CREATE POLICY "Students can manage own ratings" ON public.student_work_ratings
    FOR ALL USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all ratings" ON public.student_work_ratings;
CREATE POLICY "Admins can manage all ratings" ON public.student_work_ratings
    FOR ALL USING (public.is_instructor_or_admin(auth.uid()));
