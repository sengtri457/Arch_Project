-- Migration: Add email column to profiles, create pending_enrollments table and triggers for manual access control.
-- Target: ArchTipsBox LMS backend setup

-- 1. Add email column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Backfill existing user emails from auth.users (if any)
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- 3. Create Pending Enrollments table
CREATE TABLE IF NOT EXISTS public.pending_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    course_id UUID NOT NULL REFERENCES public.courses(course_id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (email, course_id)
);

-- 4. Enable RLS for pending_enrollments
ALTER TABLE public.pending_enrollments ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policy: Admins/Instructors can manage all pending enrollments
DROP POLICY IF EXISTS "Admins manage pending enrollments" ON public.pending_enrollments;
CREATE POLICY "Admins manage pending enrollments" ON public.pending_enrollments
    FOR ALL USING (public.is_admin(auth.uid()));

-- 6. Trigger: When inserting into pending_enrollments, check if profile exists and enroll immediately
CREATE OR REPLACE FUNCTION public.process_pending_enrollment()
RETURNS TRIGGER AS $$
DECLARE
  v_student_id UUID;
BEGIN
  -- Look up student profile ID by email
  SELECT id INTO v_student_id FROM public.profiles WHERE LOWER(email) = LOWER(NEW.email);
  
  IF v_student_id IS NOT NULL THEN
    -- Student exists, insert into course_enrollments
    INSERT INTO public.course_enrollments (student_id, course_id, status)
    VALUES (v_student_id, NEW.course_id, 'active')
    ON CONFLICT (student_id, course_id) DO NOTHING;
    
    NEW.status := 'completed';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_pending_enrollment_insert ON public.pending_enrollments;
CREATE TRIGGER on_pending_enrollment_insert
  BEFORE INSERT ON public.pending_enrollments
  FOR EACH ROW EXECUTE PROCEDURE public.process_pending_enrollment();

-- 7. Update handle_new_user trigger to copy email and process any pending enrollments
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  r RECORD;
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, full_name, avatar_url, role, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'New Student'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    'student',
    NEW.email
  );

  -- Process any pending enrollments for this new email
  FOR r IN 
    SELECT id, course_id 
    FROM public.pending_enrollments 
    WHERE LOWER(email) = LOWER(NEW.email) AND status = 'pending'
  LOOP
    -- Enroll student
    INSERT INTO public.course_enrollments (student_id, course_id, status)
    VALUES (NEW.id, r.course_id, 'active')
    ON CONFLICT (student_id, course_id) DO NOTHING;
    
    -- Mark pending enrollment as completed
    UPDATE public.pending_enrollments
    SET status = 'completed', updated_at = now()
    WHERE id = r.id;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Notify pgrst to reload the schema cache so client knows about new column / table
NOTIFY pgrst, 'reload schema';
