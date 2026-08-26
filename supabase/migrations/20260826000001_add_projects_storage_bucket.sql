-- Migration to add a public 'projects' bucket with permissions for authenticated users (admins/instructors)
INSERT INTO storage.buckets (id, name, public)
VALUES ('projects', 'projects', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND policyname='Project images are public') THEN
    EXECUTE 'CREATE POLICY "Project images are public" ON storage.objects FOR SELECT USING (bucket_id = ''projects'')';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND policyname='Admins upload project images') THEN
    EXECUTE 'CREATE POLICY "Admins upload project images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = ''projects'')';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND policyname='Admins update project images') THEN
    EXECUTE 'CREATE POLICY "Admins update project images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = ''projects'') WITH CHECK (bucket_id = ''projects'')';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND policyname='Admins delete project images') THEN
    EXECUTE 'CREATE POLICY "Admins delete project images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = ''projects'')';
  END IF;
END $$;
