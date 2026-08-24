-- ============================================================================
-- PHASE B - BATCH 4: Avatar storage bucket + owner-scoped policies
-- Run this entire file in: Supabase Dashboard > SQL Editor > New query
-- Safe to re-run (idempotent).
--
-- What it does:
--   Creates a PUBLIC 'avatars' storage bucket where each authenticated user can
--   upload/update/delete files ONLY inside their own folder (avatars/{uid}/...).
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND policyname='Avatar images are public') THEN
    EXECUTE 'CREATE POLICY "Avatar images are public" ON storage.objects FOR SELECT USING (bucket_id = ''avatars'')';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND policyname='Users upload own avatar') THEN
    EXECUTE 'CREATE POLICY "Users upload own avatar" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = ''avatars'' AND (storage.foldername(name))[1] = auth.uid()::text)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND policyname='Users update own avatar') THEN
    EXECUTE 'CREATE POLICY "Users update own avatar" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = ''avatars'' AND (storage.foldername(name))[1] = auth.uid()::text) WITH CHECK (bucket_id = ''avatars'' AND (storage.foldername(name))[1] = auth.uid()::text)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND policyname='Users delete own avatar') THEN
    EXECUTE 'CREATE POLICY "Users delete own avatar" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = ''avatars'' AND (storage.foldername(name))[1] = auth.uid()::text)';
  END IF;
END $$;
