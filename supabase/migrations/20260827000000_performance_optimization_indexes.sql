-- Performance Optimization Indexes

-- 1. Foreign Keys & Joins Optimization
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_plan_id ON public.payment_transactions(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON public.projects(created_by);
CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON public.lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_exercises_lesson_id ON public.exercises(lesson_id);
CREATE INDEX IF NOT EXISTS idx_exercise_submissions_exercise_id ON public.exercise_submissions(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_submissions_student_id ON public.exercise_submissions(student_id);

-- 2. Filters & Ordering Optimization
-- Homepage / Portfolio filtering
CREATE INDEX IF NOT EXISTS idx_projects_published_featured ON public.projects(is_published, is_featured);
CREATE INDEX IF NOT EXISTS idx_courses_published ON public.courses(is_published);
-- Course lesson sequencing
CREATE INDEX IF NOT EXISTS idx_lessons_course_order ON public.lessons(course_id, order_index);
-- Testimonials sorting
CREATE INDEX IF NOT EXISTS idx_testimonials_created_at ON public.testimonials(created_at DESC);

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
