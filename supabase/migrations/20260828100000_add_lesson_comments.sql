-- Migration: Lesson Comments / Discussion System
-- Relates to lesson_id and profiles. Supports replies (parent_id) and Cascade deletes.

-- 1. Create Lesson Comments table
CREATE TABLE IF NOT EXISTS public.lesson_comments (
    comment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES public.lessons(lesson_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES public.lesson_comments(comment_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.lesson_comments ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for lesson_comments
DROP POLICY IF EXISTS "Anyone can view lesson comments" ON public.lesson_comments;
CREATE POLICY "Anyone can view lesson comments" ON public.lesson_comments
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Students can insert own comments" ON public.lesson_comments;
CREATE POLICY "Students can insert own comments" ON public.lesson_comments
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own comments" ON public.lesson_comments;
CREATE POLICY "Users can update own comments" ON public.lesson_comments
    FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own comments" ON public.lesson_comments;
CREATE POLICY "Users can delete own comments" ON public.lesson_comments
    FOR DELETE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins and instructors can manage all comments" ON public.lesson_comments;
CREATE POLICY "Admins and instructors can manage all comments" ON public.lesson_comments
    FOR ALL TO authenticated USING (public.is_instructor_or_admin(auth.uid()));

-- 4. Enable authenticated users to select from profiles for displaying comment/rating authors
DROP POLICY IF EXISTS "Allow select for authenticated users" ON public.profiles;
CREATE POLICY "Allow select for authenticated users" ON public.profiles
    FOR SELECT TO authenticated USING (true);

-- 5. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
