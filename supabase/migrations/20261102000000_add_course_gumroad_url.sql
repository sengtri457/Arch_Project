-- Add international gumroad checkout URL column to courses
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS gumroad_url text;
