-- Ensure duration and lessons columns exist on courses table
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS duration TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS lessons INT DEFAULT 0;
