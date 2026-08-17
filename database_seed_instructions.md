# Database Seeding & Permissions Guide

Use the SQL scripts below to set up your Supabase database catalog and configure permissions for the visual classroom system.

---

## 🛠️ Step 1: Configure Row-Level Security (RLS)
Run this block to allow students to read course syllabi (lessons list) and homework exercises publicly, while keeping classroom locks secure.

```sql
-- 1. Make syllabus/lessons list publicly readable
DROP POLICY IF EXISTS "Students can view lessons of enrolled/purchased courses" ON public.lessons;
CREATE POLICY "Allow public read access to lessons" ON public.lessons
    FOR SELECT USING (true);

-- 2. Make homework exercises publicly readable
DROP POLICY IF EXISTS "Anyone can view exercises" ON public.exercises;
DROP POLICY IF EXISTS "Admins manage exercises" ON public.exercises;

CREATE POLICY "Anyone can view exercises" ON public.exercises
    FOR SELECT USING (true);

CREATE POLICY "Admins manage exercises" ON public.exercises
    FOR ALL USING (public.is_instructor_or_admin(auth.uid()));

-- 3. Add price column to courses table
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2) NOT NULL DEFAULT 49.99;
```

---

## 🚀 Step 2: Seed InDesign & Photoshop Masterclasses
Run this script to inject the new courses, lessons, and assignment templates into your database:

```sql
-- 1. Insert InDesign Masterclass
INSERT INTO public.courses (course_id, title, slug, description, difficulty, software_used, thumbnail_url, price, is_published)
VALUES (
  'e6c66d93-3d02-466d-a77b-6c6a46cd4cf7',
  'InDesign Masterclass',
  'indesign-masterclass',
  'Create professional architectural presentations, portfolios, and layout designs using Adobe InDesign.',
  'intermediate',
  'Adobe InDesign',
  '/08-KALMET OFFICE BUIDLING (Institutional)/Render image/Scene 1.jpg',
  49.99,
  true
)
ON CONFLICT (course_id) DO NOTHING;

-- 2. Insert Photoshop Masterclass
INSERT INTO public.courses (course_id, title, slug, description, difficulty, software_used, thumbnail_url, price, is_published)
VALUES (
  'fa919c63-4712-4fb3-81b4-25e2e8b2cc1c',
  'Photoshop Masterclass',
  'photoshop-masterclass',
  'Elevate your renders with advanced post-production techniques. Learn compositing, color grading, and mood enhancements.',
  'advanced',
  'Adobe Photoshop',
  '/13-WESTLINE UNIVERSITY (Institutional)/LIGHTROOM/Scene 1_1_upscale01.jpg',
  49.99,
  true
)
ON CONFLICT (course_id) DO NOTHING;

-- 3. Insert lessons for InDesign Masterclass
INSERT INTO public.lessons (lesson_id, course_id, title, video_source_type, video_external_id, duration_minutes, order_index, is_preview)
VALUES 
(
  '48a30129-234b-4b2a-8d19-450f612d4cf7',
  'e6c66d93-3d02-466d-a77b-6c6a46cd4cf7',
  '01. Introduction to InDesign Grids and Document Setup',
  'youtube',
  'https://www.w3schools.com/html/movie.mp4',
  10,
  1,
  true
),
(
  'b99a6cf7-7756-42d4-bb34-8c6a0c021c32',
  'e6c66d93-3d02-466d-a77b-6c6a46cd4cf7',
  '02. Portfolio Layout & Typographic Hierarchy',
  'youtube',
  'https://www.w3schools.com/html/movie.mp4',
  15,
  2,
  false
)
ON CONFLICT (lesson_id) DO NOTHING;

-- 4. Insert lessons for Photoshop Masterclass
INSERT INTO public.lessons (lesson_id, course_id, title, video_source_type, video_external_id, duration_minutes, order_index, is_preview)
VALUES 
(
  'cdcf219d-778e-4a4b-ba2d-45f8e6c62c93',
  'fa919c63-4712-4fb3-81b4-25e2e8b2cc1c',
  '01. Post-production Workspace & Layer Structures',
  'youtube',
  'https://www.w3schools.com/html/movie.mp4',
  12,
  1,
  true
),
(
  '01ab78c3-4d4b-4cde-8219-c6e6a4b3d029',
  'fa919c63-4712-4fb3-81b4-25e2e8b2cc1c',
  '02. Non-Destructive Color Adjustments & Filters',
  'youtube',
  'https://www.w3schools.com/html/movie.mp4',
  18,
  2,
  false
)
ON CONFLICT (lesson_id) DO NOTHING;

-- 5. Insert Exercises for newly created lessons
INSERT INTO public.exercises (exercise_id, lesson_id, title, brief_prompt, max_score)
VALUES
(
  'e6a30129-234b-4b2a-8d19-450f612d4cf7',
  '48a30129-234b-4b2a-8d19-450f612d4cf7',
  'Practice Task: Document Setup',
  'Set up a 12-page presentation document using a multi-column grid, and upload your InDesign package link.',
  100
),
(
  'eb9a6cf7-7756-42d4-bb34-8c6a0c021c32',
  'b99a6cf7-7756-42d4-bb34-8c6a0c021c32',
  'Practice Task: Portfolio Layout',
  'Design a 2-page landscape spread displaying your projects, paste your OneDrive or Google Drive layout links.',
  100
),
(
  'ecdf219d-778e-4a4b-ba2d-45f8e6c62c93',
  'cdcf219d-778e-4a4b-ba2d-45f8e6c62c93',
  'Practice Task: Workspace & Layers',
  'Configure adjustment layers, masking channels, and sky replacement layers, and submit your PSD cloud link.',
  100
),
(
  'e1ab78c3-4d4b-4cde-8219-c6e6a4b3d029',
  '01ab78c3-4d4b-4cde-8219-c6e6a4b3d029',
  'Practice Task: Color Adjustments',
  'Apply camera raw filters, look-up tables (LUTs), and vignette lighting setups, and submit your final render output image link.',
  100
)
ON CONFLICT (exercise_id) DO NOTHING;
```
