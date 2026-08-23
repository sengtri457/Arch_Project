-- Supabase Postgres Migration Schema
-- Target: ArchTipsBox LMS backend setup
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles (extends Supabase's built-in auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'instructor', 'admin')) DEFAULT 'student',
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Subscription Plans
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    plan_id SERIAL PRIMARY KEY,
    plan_code TEXT UNIQUE NOT NULL, -- 'FREE', 'STUDENT_PRO', 'MENTORSHIP'
    name TEXT NOT NULL,
    price_usd NUMERIC(10,2) NOT NULL,
    billing_interval TEXT NOT NULL, -- 'monthly', 'yearly'
    features_json JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true
);

-- Seed default plans
INSERT INTO public.subscription_plans (plan_code, name, price_usd, billing_interval, features_json) VALUES
('FREE', 'Free tier access', 0.00, 'monthly', '{"downloads": false, "courses": ["preview"]}'),
('STUDENT_PRO', 'Student Pro Plan', 15.00, 'monthly', '{"downloads": true, "courses": ["all"]}'),
('MENTORSHIP', 'Mentorship Plan', 99.00, 'monthly', '{"downloads": true, "courses": ["all"], "mentorship": true}')
ON CONFLICT (plan_code) DO NOTHING;

-- 3. Payments & Bakong KHQR Transactions
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_id INT NOT NULL REFERENCES public.subscription_plans(plan_id),
    payment_method TEXT NOT NULL, -- 'bakong_khqr', 'stripe', 'aba_pay'
    bill_number TEXT UNIQUE NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD', -- 'USD' or 'KHR'
    khqr_payload TEXT,
    external_tx_hash TEXT,
    payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'completed', 'failed', 'expired')),
    created_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    subscription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_id INT NOT NULL REFERENCES public.subscription_plans(plan_id),
    status TEXT NOT NULL, -- 'active', 'canceled', 'past_due', 'expired'
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    last_transaction_id UUID REFERENCES public.payment_transactions(transaction_id)
);

-- 4. Projects & Showcase CMS
CREATE TABLE IF NOT EXISTS public.projects (
    project_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    software_used TEXT, -- 'SketchUp, D5 Render, Photoshop'
    category TEXT, -- 'Interior', 'Exterior', 'Commercial', 'Landscape'
    cover_image_url TEXT NOT NULL,
    gallery_images_json JSONB DEFAULT '[]',
    before_after_render_json JSONB, -- { "raw": "url1", "final": "url2" }
    downloadable_asset_url TEXT,
    required_plan_id INT REFERENCES public.subscription_plans(plan_id), -- null = public
    is_featured BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    year TEXT,
    location TEXT,
    price TEXT,
    client TEXT,
    scope TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Courses, Lessons, Exercises
CREATE TABLE IF NOT EXISTS public.courses (
    course_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    required_plan_id INT REFERENCES public.subscription_plans(plan_id),
    difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    software_used TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 49.99,
    category TEXT,
    duration TEXT,
    features JSONB DEFAULT '[]',
    instructor TEXT DEFAULT 'Bun Sambath',
    students INT DEFAULT 0,
    lessons INT DEFAULT 0,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lessons (
    lesson_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(course_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    video_source_type TEXT NOT NULL, -- 'bunny_stream', 'cloudflare_stream', 'vimeo', 'youtube'
    video_external_id TEXT NOT NULL,
    duration_minutes INT NOT NULL,
    downloadable_asset_url TEXT,
    order_index INT NOT NULL,
    is_preview BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.exercises (
    exercise_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES public.lessons(lesson_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    brief_prompt TEXT NOT NULL,
    starter_asset_url TEXT,
    max_score INT DEFAULT 100
);

CREATE TABLE IF NOT EXISTS public.exercise_submissions (
    submission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id UUID NOT NULL REFERENCES public.exercises(exercise_id),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    submission_files_json JSONB NOT NULL DEFAULT '[]',
    status TEXT NOT NULL CHECK (status IN ('submitted', 'in_review', 'graded', 'revision_requested')),
    score INT,
    instructor_feedback TEXT,
    submitted_at TIMESTAMPTZ DEFAULT now(),
    reviewed_at TIMESTAMPTZ
);

-- 6. Course Enrollment & Watch History
CREATE TABLE IF NOT EXISTS public.course_enrollments (
    enrollment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(course_id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT now(),
    status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'dropped')) DEFAULT 'active',
    last_accessed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    UNIQUE (student_id, course_id)
);

CREATE TABLE IF NOT EXISTS public.lesson_progress (
    progress_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES public.lessons(lesson_id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(course_id) ON DELETE CASCADE,
    watched_seconds INT NOT NULL DEFAULT 0,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    last_watched_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    UNIQUE (student_id, lesson_id)
);

-- 7. Trigger to auto-create user profile from Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'New Student'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    'student'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 8. Enable Row-Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- 8.5 Helper Functions for RLS to prevent infinite recursion
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_instructor_or_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role IN ('admin', 'instructor')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 9. Setup RLS Policies

-- Subscription plans: read by all
DROP POLICY IF EXISTS "Allow public read access to plans" ON public.subscription_plans;
CREATE POLICY "Allow public read access to plans" ON public.subscription_plans
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage plans" ON public.subscription_plans;
CREATE POLICY "Admins manage plans" ON public.subscription_plans
    FOR ALL USING (public.is_admin(auth.uid()));

-- Profiles: Users can read/write their own profile; admins do all
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins manage profiles" ON public.profiles;
CREATE POLICY "Admins manage profiles" ON public.profiles
    FOR ALL USING (public.is_admin(auth.uid()));

-- Projects
DROP POLICY IF EXISTS "Public can view published projects" ON public.projects;
CREATE POLICY "Public can view published projects" ON public.projects
    FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Admins and instructors manage projects" ON public.projects;
CREATE POLICY "Admins and instructors manage projects" ON public.projects
    FOR ALL USING (public.is_instructor_or_admin(auth.uid()));

-- Courses
DROP POLICY IF EXISTS "Public can view published courses" ON public.courses;
CREATE POLICY "Public can view published courses" ON public.courses
    FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Admins and instructors manage courses" ON public.courses;
CREATE POLICY "Admins and instructors manage courses" ON public.courses
    FOR ALL USING (public.is_instructor_or_admin(auth.uid()));

-- Lessons
DROP POLICY IF EXISTS "Allow public read access to lessons" ON public.lessons;
CREATE POLICY "Allow public read access to lessons" ON public.lessons
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins and instructors manage lessons" ON public.lessons;
CREATE POLICY "Admins and instructors manage lessons" ON public.lessons
    FOR ALL USING (public.is_instructor_or_admin(auth.uid()));

-- Submissions
DROP POLICY IF EXISTS "Students view own submissions" ON public.exercise_submissions;
CREATE POLICY "Students view own submissions" ON public.exercise_submissions
    FOR SELECT USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Students insert own submissions" ON public.exercise_submissions;
CREATE POLICY "Students insert own submissions" ON public.exercise_submissions
    FOR INSERT WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "Instructors and admins view all submissions" ON public.exercise_submissions;
CREATE POLICY "Instructors and admins view all submissions" ON public.exercise_submissions
    FOR SELECT USING (public.is_instructor_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Instructors and admins grade submissions" ON public.exercise_submissions;
CREATE POLICY "Instructors and admins grade submissions" ON public.exercise_submissions
    FOR UPDATE USING (public.is_instructor_or_admin(auth.uid()));

-- Enrollments
DROP POLICY IF EXISTS "Students view own enrollments" ON public.course_enrollments;
CREATE POLICY "Students view own enrollments" ON public.course_enrollments
    FOR SELECT USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Students create own enrollments" ON public.course_enrollments;
CREATE POLICY "Students create own enrollments" ON public.course_enrollments
    FOR INSERT WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "Admins view all enrollments" ON public.course_enrollments;
CREATE POLICY "Admins view all enrollments" ON public.course_enrollments
    FOR SELECT USING (public.is_instructor_or_admin(auth.uid()));

-- Lesson Progress
DROP POLICY IF EXISTS "Students manage own lesson progress" ON public.lesson_progress;
CREATE POLICY "Students manage own lesson progress" ON public.lesson_progress
    FOR ALL USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "Admins view all lesson progress" ON public.lesson_progress;
CREATE POLICY "Admins view all lesson progress" ON public.lesson_progress
    FOR SELECT USING (public.is_instructor_or_admin(auth.uid()));

-- 10. Admin view for Student Course History
CREATE OR REPLACE VIEW public.student_course_history AS
SELECT
    e.student_id,
    p.full_name,
    e.course_id,
    c.title AS course_title,
    e.status AS enrollment_status,
    e.enrolled_at,
    e.last_accessed_at,
    COUNT(lp.lesson_id) FILTER (WHERE lp.lesson_id IS NOT NULL) AS lessons_started,
    COUNT(lp.lesson_id) FILTER (WHERE lp.is_completed) AS lessons_completed,
    (SELECT COUNT(*) FROM public.lessons WHERE course_id = e.course_id) AS total_lessons
FROM public.course_enrollments e
JOIN public.profiles p ON p.id = e.student_id
JOIN public.courses c ON c.course_id = e.course_id
LEFT JOIN public.lesson_progress lp ON lp.student_id = e.student_id AND lp.course_id = e.course_id
GROUP BY e.student_id, p.full_name, e.course_id, c.title, e.status, e.enrolled_at, e.last_accessed_at;

-- Certificates Schema and RLS Policies (Phase 2 Addition)
CREATE TABLE IF NOT EXISTS public.certificates (
    certificate_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(course_id) ON DELETE CASCADE,
    certificate_number TEXT UNIQUE NOT NULL, -- e.g. AVA-2026-XXXX-YYYY
    issued_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (student_id, course_id)
);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view certificates" ON public.certificates;
CREATE POLICY "Anyone can view certificates" ON public.certificates
    FOR SELECT USING (true);


-- 11. Promo Codes Schema (Phase 4 Addition)a
CREATE TABLE IF NOT EXISTS public.promo_codes (
    code TEXT PRIMARY KEY,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(10,2) NOT NULL,
    max_redemptions INT, -- NULL = unlimited
    redemptions_count INT DEFAULT 0,
    expires_at TIMESTAMPTZ, -- NULL = never expires
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Select policy: Anyone can check active codes during checkouts
DROP POLICY IF EXISTS "Anyone can view active promo codes" ON public.promo_codes;
CREATE POLICY "Anyone can view active promo codes" ON public.promo_codes
    FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Manage policy: Admins manage all promocodes
DROP POLICY IF EXISTS "Admins manage promo codes" ON public.promo_codes;
CREATE POLICY "Admins manage promo codes" ON public.promo_codes
    FOR ALL USING (public.is_admin(auth.uid()));

-- Link transactions table to promocodes
ALTER TABLE public.payment_transactions 
ADD COLUMN IF NOT EXISTS promo_code TEXT REFERENCES public.promo_codes(code) ON DELETE SET NULL;


-- 12. Testimonials Table (Phase 5 Addition)
CREATE TABLE IF NOT EXISTS public.testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    organization TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Select policy: Anyone can view testimonials
DROP POLICY IF EXISTS "Anyone can view testimonials" ON public.testimonials;
CREATE POLICY "Anyone can view testimonials" ON public.testimonials
    FOR SELECT USING (true);

-- Manage policy: Admins manage testimonials
DROP POLICY IF EXISTS "Admins manage testimonials" ON public.testimonials;
CREATE POLICY "Admins manage testimonials" ON public.testimonials
    FOR ALL USING (public.is_admin(auth.uid()));


-- 13. Contact Inquiries Table (Phase 6 Addition)
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    company TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Insert policy: Anyone can submit contact messages
DROP POLICY IF EXISTS "Anyone can insert contact messages" ON public.contact_messages;
CREATE POLICY "Anyone can insert contact messages" ON public.contact_messages
    FOR INSERT WITH CHECK (true);

-- Manage policy: Only admins can view/manage contact messages
DROP POLICY IF EXISTS "Admins manage contact messages" ON public.contact_messages;
CREATE POLICY "Admins manage contact messages" ON public.contact_messages
    FOR ALL USING (public.is_instructor_or_admin(auth.uid()));


