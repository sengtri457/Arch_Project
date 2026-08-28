-- Migration to create the youtube_videos table for public videos and filtering
CREATE TABLE IF NOT EXISTS public.youtube_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'Other',
    published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_featured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.youtube_videos ENABLE ROW LEVEL SECURITY;

-- Enable SELECT for everyone
DROP POLICY IF EXISTS "Anyone can view youtube videos" ON public.youtube_videos;
CREATE POLICY "Anyone can view youtube videos" ON public.youtube_videos
    FOR SELECT USING (true);

-- Enable INSERT, UPDATE, DELETE for Admins
DROP POLICY IF EXISTS "Admins manage youtube videos" ON public.youtube_videos;
CREATE POLICY "Admins manage youtube videos" ON public.youtube_videos
    FOR ALL USING (public.is_admin(auth.uid()));
