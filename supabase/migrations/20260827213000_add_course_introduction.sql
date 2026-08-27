-- Migration to add introduction_url to courses table
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS introduction_url TEXT;
