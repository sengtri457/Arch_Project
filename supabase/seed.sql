-- Supabase Database Seeding File
-- Generated automatically from static TypeScript data files
-- Date: 2026-08-26T07:52:49.079Z

-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Seed subscription plans
INSERT INTO public.subscription_plans (plan_id, plan_code, name, price_usd, billing_interval, features_json) VALUES
(1, 'FREE', 'Free tier access', 0.00, 'monthly', '{"downloads": false, "courses": ["preview"]}'),
(2, 'STUDENT_PRO', 'Student Pro Plan', 15.00, 'monthly', '{"downloads": true, "courses": ["all"]}'),
(3, 'MENTORSHIP', 'Mentorship Plan', 99.00, 'monthly', '{"downloads": true, "courses": ["all"], "mentorship": true}')
ON CONFLICT (plan_code) DO UPDATE SET 
  name = EXCLUDED.name,
  price_usd = EXCLUDED.price_usd,
  billing_interval = EXCLUDED.billing_interval,
  features_json = EXCLUDED.features_json;

-- Adjust sequence for plan_id
SELECT setval('public.subscription_plans_plan_id_seq', COALESCE((SELECT MAX(plan_id)+1 FROM public.subscription_plans), 1), false);

-- 2. Seed default admin/instructor user (admin@archtipsbox.com)
-- Password is 'admin123'
INSERT INTO auth.users (id, email, raw_user_meta_data, email_confirmed_at, created_at, updated_at, role, aud, encrypted_password)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'admin@archtipsbox.com',
  '{"full_name": "Admin User", "role": "admin"}',
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated',
  '$2a$10$RuyB/z30G6H4j1rA0b7.i.w9FkZ4UuR0kKk/5F5t1tJ45T.F3y.3m'
)
ON CONFLICT (id) DO NOTHING;

-- Explicitly ensure Admin profile exists and has the admin role
INSERT INTO public.profiles (id, full_name, role, avatar_url, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Admin User',
  'admin',
  '/placeholder-avatar.png',
  true
)
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- 3. Seed Courses

-- Course: D5 Masterclass
INSERT INTO public.courses (course_id, title, slug, description, thumbnail_url, required_plan_id, difficulty, software_used, price, category, duration, features, instructor, students, lessons, is_published)
VALUES (
  'd5c66d93-3d02-466d-a77b-6c6a46cd4cf7',
  'D5 Masterclass',
  'd5-masterclass',
  'Master the art of real-time rendering with D5 Render. Create stunning photorealistic visualizations with speed and efficiency.',
  '/16-SB TOWER (Commercial)/Render Image/LIGHTROOM/Exterior-1.jpg',
  2,
  'intermediate',
  'D5 Render',
  49.99,
  'Rendering',
  '6 weeks',
  '["Real-time rendering workflow","Advanced lighting and materials","Animation and video production","Environment and landscape creation","Post-processing in D5"]',
  'Bun Sambath',
  1500,
  42,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  thumbnail_url = EXCLUDED.thumbnail_url,
  required_plan_id = EXCLUDED.required_plan_id,
  difficulty = EXCLUDED.difficulty,
  software_used = EXCLUDED.software_used,
  price = EXCLUDED.price,
  category = EXCLUDED.category,
  duration = EXCLUDED.duration,
  features = EXCLUDED.features,
  instructor = EXCLUDED.instructor,
  students = EXCLUDED.students,
  lessons = EXCLUDED.lessons,
  is_published = EXCLUDED.is_published;

-- Course: Enscape Masterclass
INSERT INTO public.courses (course_id, title, slug, description, thumbnail_url, required_plan_id, difficulty, software_used, price, category, duration, features, instructor, students, lessons, is_published)
VALUES (
  'eb919c63-4712-4fb3-81b4-25e2e8b2cc1c',
  'Enscape Masterclass',
  'enscape-masterclass',
  'Learn to create beautiful real-time architectural visualizations directly from your modeling software using Enscape.',
  '/14-WHITE BEACH HOTEL BY SB (Residential)/Render images/LIGHTROOM/seaside building-1.jpg',
  2,
  'beginner',
  'Enscape',
  49.99,
  'Rendering',
  '5 weeks',
  '["Seamless integration workflow","Lighting and atmosphere settings","Asset library management","VR and panorama creation","Video walkthroughs"]',
  'Bun Sambath',
  1200,
  35,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  thumbnail_url = EXCLUDED.thumbnail_url,
  required_plan_id = EXCLUDED.required_plan_id,
  difficulty = EXCLUDED.difficulty,
  software_used = EXCLUDED.software_used,
  price = EXCLUDED.price,
  category = EXCLUDED.category,
  duration = EXCLUDED.duration,
  features = EXCLUDED.features,
  instructor = EXCLUDED.instructor,
  students = EXCLUDED.students,
  lessons = EXCLUDED.lessons,
  is_published = EXCLUDED.is_published;

-- Course: InDesign Masterclass
INSERT INTO public.courses (course_id, title, slug, description, thumbnail_url, required_plan_id, difficulty, software_used, price, category, duration, features, instructor, students, lessons, is_published)
VALUES (
  'e6c66d93-3d02-466d-a77b-6c6a46cd4cf7',
  'InDesign Masterclass',
  'indesign-masterclass',
  'Create professional architectural presentations, portfolios, and layout designs using Adobe InDesign.',
  '/08-KALMET OFFICE BUIDLING (Institutional)/Render image/Scene 1.jpg',
  2,
  'beginner',
  'Adobe InDesign',
  49.99,
  'Post-Production',
  '4 weeks',
  '["Portfolio layout design","Typography and grid systems","Image management and links","Presentation board creation","Print vs. digital workflows"]',
  'Bun Sambath',
  850,
  28,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  thumbnail_url = EXCLUDED.thumbnail_url,
  required_plan_id = EXCLUDED.required_plan_id,
  difficulty = EXCLUDED.difficulty,
  software_used = EXCLUDED.software_used,
  price = EXCLUDED.price,
  category = EXCLUDED.category,
  duration = EXCLUDED.duration,
  features = EXCLUDED.features,
  instructor = EXCLUDED.instructor,
  students = EXCLUDED.students,
  lessons = EXCLUDED.lessons,
  is_published = EXCLUDED.is_published;

-- Course: Photoshop Masterclass
INSERT INTO public.courses (course_id, title, slug, description, thumbnail_url, required_plan_id, difficulty, software_used, price, category, duration, features, instructor, students, lessons, is_published)
VALUES (
  'fa919c63-4712-4fb3-81b4-25e2e8b2cc1c',
  'Photoshop Masterclass',
  'photoshop-masterclass',
  'Elevate your renders with advanced post-production techniques. Learn compositing, color grading, and matte painting.',
  '/13-WESTLINE UNIVERSITY (Institutional)/LIGHTROOM/Scene 1_1_upscale01.jpg',
  3,
  'advanced',
  'Adobe Photoshop',
  49.99,
  'Post-Production',
  '6 weeks',
  '["Advanced compositing","Color grading and mood","Matte painting techniques","Adding people and vegetation","Final image polish"]',
  'Bun Sambath',
  1800,
  45,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  thumbnail_url = EXCLUDED.thumbnail_url,
  required_plan_id = EXCLUDED.required_plan_id,
  difficulty = EXCLUDED.difficulty,
  software_used = EXCLUDED.software_used,
  price = EXCLUDED.price,
  category = EXCLUDED.category,
  duration = EXCLUDED.duration,
  features = EXCLUDED.features,
  instructor = EXCLUDED.instructor,
  students = EXCLUDED.students,
  lessons = EXCLUDED.lessons,
  is_published = EXCLUDED.is_published;

-- 4. Seed Lessons & Exercises for Courses

-- Lesson: 01. Introduction to InDesign Grids and Document Setup
INSERT INTO public.lessons (lesson_id, course_id, title, video_source_type, video_external_id, duration_minutes, order_index, is_preview)
VALUES (
  '48a30129-234b-4b2a-8d19-450f612d4cf7',
  (SELECT course_id FROM public.courses WHERE slug = 'indesign-masterclass'),
  '01. Introduction to InDesign Grids and Document Setup',
  'youtube',
  'https://www.w3schools.com/html/movie.mp4',
  10,
  1,
  true
)
ON CONFLICT (lesson_id) DO UPDATE SET
  title = EXCLUDED.title,
  video_source_type = EXCLUDED.video_source_type,
  video_external_id = EXCLUDED.video_external_id,
  duration_minutes = EXCLUDED.duration_minutes,
  order_index = EXCLUDED.order_index,
  is_preview = EXCLUDED.is_preview;
INSERT INTO public.exercises (exercise_id, lesson_id, title, brief_prompt, max_score)
VALUES (
  'e6a30129-234b-4b2a-8d19-450f612d4cf7',
  '48a30129-234b-4b2a-8d19-450f612d4cf7',
  'Practice Task: Document Setup',
  'Set up a 12-page presentation document using a multi-column grid, and upload your InDesign package link.',
  100
)
ON CONFLICT (exercise_id) DO UPDATE SET
  title = EXCLUDED.title,
  brief_prompt = EXCLUDED.brief_prompt,
  max_score = EXCLUDED.max_score;

-- Lesson: 02. Portfolio Layout & Typographic Hierarchy
INSERT INTO public.lessons (lesson_id, course_id, title, video_source_type, video_external_id, duration_minutes, order_index, is_preview)
VALUES (
  'b99a6cf7-7756-42d4-bb34-8c6a0c021c32',
  (SELECT course_id FROM public.courses WHERE slug = 'indesign-masterclass'),
  '02. Portfolio Layout & Typographic Hierarchy',
  'youtube',
  'https://www.w3schools.com/html/movie.mp4',
  15,
  2,
  false
)
ON CONFLICT (lesson_id) DO UPDATE SET
  title = EXCLUDED.title,
  video_source_type = EXCLUDED.video_source_type,
  video_external_id = EXCLUDED.video_external_id,
  duration_minutes = EXCLUDED.duration_minutes,
  order_index = EXCLUDED.order_index,
  is_preview = EXCLUDED.is_preview;
INSERT INTO public.exercises (exercise_id, lesson_id, title, brief_prompt, max_score)
VALUES (
  'eb9a6cf7-7756-42d4-bb34-8c6a0c021c32',
  'b99a6cf7-7756-42d4-bb34-8c6a0c021c32',
  'Practice Task: Portfolio Layout',
  'Design a 2-page landscape spread displaying your projects, paste your OneDrive or Google Drive layout links.',
  100
)
ON CONFLICT (exercise_id) DO UPDATE SET
  title = EXCLUDED.title,
  brief_prompt = EXCLUDED.brief_prompt,
  max_score = EXCLUDED.max_score;

-- Lesson: 01. Post-production Workspace & Layer Structures
INSERT INTO public.lessons (lesson_id, course_id, title, video_source_type, video_external_id, duration_minutes, order_index, is_preview)
VALUES (
  'cdcf219d-778e-4a4b-ba2d-45f8e6c62c93',
  (SELECT course_id FROM public.courses WHERE slug = 'photoshop-masterclass'),
  '01. Post-production Workspace & Layer Structures',
  'youtube',
  'https://www.w3schools.com/html/movie.mp4',
  12,
  1,
  true
)
ON CONFLICT (lesson_id) DO UPDATE SET
  title = EXCLUDED.title,
  video_source_type = EXCLUDED.video_source_type,
  video_external_id = EXCLUDED.video_external_id,
  duration_minutes = EXCLUDED.duration_minutes,
  order_index = EXCLUDED.order_index,
  is_preview = EXCLUDED.is_preview;
INSERT INTO public.exercises (exercise_id, lesson_id, title, brief_prompt, max_score)
VALUES (
  'ecdf219d-778e-4a4b-ba2d-45f8e6c62c93',
  'cdcf219d-778e-4a4b-ba2d-45f8e6c62c93',
  'Practice Task: Workspace & Layers',
  'Configure adjustment layers, masking channels, and sky replacement layers, and submit your PSD cloud link.',
  100
)
ON CONFLICT (exercise_id) DO UPDATE SET
  title = EXCLUDED.title,
  brief_prompt = EXCLUDED.brief_prompt,
  max_score = EXCLUDED.max_score;

-- Lesson: 02. Non-Destructive Color Adjustments & Filters
INSERT INTO public.lessons (lesson_id, course_id, title, video_source_type, video_external_id, duration_minutes, order_index, is_preview)
VALUES (
  '01ab78c3-4d4b-4cde-8219-c6e6a4b3d029',
  (SELECT course_id FROM public.courses WHERE slug = 'photoshop-masterclass'),
  '02. Non-Destructive Color Adjustments & Filters',
  'youtube',
  'https://www.w3schools.com/html/movie.mp4',
  18,
  2,
  false
)
ON CONFLICT (lesson_id) DO UPDATE SET
  title = EXCLUDED.title,
  video_source_type = EXCLUDED.video_source_type,
  video_external_id = EXCLUDED.video_external_id,
  duration_minutes = EXCLUDED.duration_minutes,
  order_index = EXCLUDED.order_index,
  is_preview = EXCLUDED.is_preview;
INSERT INTO public.exercises (exercise_id, lesson_id, title, brief_prompt, max_score)
VALUES (
  'e1ab78c3-4d4b-4cde-8219-c6e6a4b3d029',
  '01ab78c3-4d4b-4cde-8219-c6e6a4b3d029',
  'Practice Task: Color Adjustments',
  'Apply camera raw filters, look-up tables (LUTs), and vignette lighting setups, and submit your final render output image link.',
  100
)
ON CONFLICT (exercise_id) DO UPDATE SET
  title = EXCLUDED.title,
  brief_prompt = EXCLUDED.brief_prompt,
  max_score = EXCLUDED.max_score;

-- Lesson: 01. Getting Started with D5 Render Interface
INSERT INTO public.lessons (lesson_id, course_id, title, video_source_type, video_external_id, duration_minutes, order_index, is_preview)
VALUES (
  'd5d30129-234b-4b2a-8d19-450f612d4cf7',
  (SELECT course_id FROM public.courses WHERE slug = 'd5-masterclass'),
  '01. Getting Started with D5 Render Interface',
  'youtube',
  'https://www.w3schools.com/html/movie.mp4',
  15,
  1,
  true
)
ON CONFLICT (lesson_id) DO UPDATE SET
  title = EXCLUDED.title,
  video_source_type = EXCLUDED.video_source_type,
  video_external_id = EXCLUDED.video_external_id,
  duration_minutes = EXCLUDED.duration_minutes,
  order_index = EXCLUDED.order_index,
  is_preview = EXCLUDED.is_preview;
INSERT INTO public.exercises (exercise_id, lesson_id, title, brief_prompt, max_score)
VALUES (
  'd5e30129-234b-4b2a-8d19-450f612d4cf7',
  'd5d30129-234b-4b2a-8d19-450f612d4cf7',
  'Practice Task: Interface & Import',
  'Import your SketchUp model into D5, configure the base camera view, and export a preview rendering.',
  100
)
ON CONFLICT (exercise_id) DO UPDATE SET
  title = EXCLUDED.title,
  brief_prompt = EXCLUDED.brief_prompt,
  max_score = EXCLUDED.max_score;

-- Lesson: 02. Advanced Lighting & Environmental Controls
INSERT INTO public.lessons (lesson_id, course_id, title, video_source_type, video_external_id, duration_minutes, order_index, is_preview)
VALUES (
  'd59a6cf7-7756-42d4-bb34-8c6a0c021c32',
  (SELECT course_id FROM public.courses WHERE slug = 'd5-masterclass'),
  '02. Advanced Lighting & Environmental Controls',
  'youtube',
  'https://www.w3schools.com/html/movie.mp4',
  20,
  2,
  false
)
ON CONFLICT (lesson_id) DO UPDATE SET
  title = EXCLUDED.title,
  video_source_type = EXCLUDED.video_source_type,
  video_external_id = EXCLUDED.video_external_id,
  duration_minutes = EXCLUDED.duration_minutes,
  order_index = EXCLUDED.order_index,
  is_preview = EXCLUDED.is_preview;
INSERT INTO public.exercises (exercise_id, lesson_id, title, brief_prompt, max_score)
VALUES (
  'd5ea6cf7-7756-42d4-bb34-8c6a0c021c32',
  'd59a6cf7-7756-42d4-bb34-8c6a0c021c32',
  'Practice Task: Custom Lighting Setup',
  'Create a sunset lighting setup using HDRI and custom artificial lights. Submit the final rendering.',
  100
)
ON CONFLICT (exercise_id) DO UPDATE SET
  title = EXCLUDED.title,
  brief_prompt = EXCLUDED.brief_prompt,
  max_score = EXCLUDED.max_score;

-- Lesson: 01. Introduction to Enscape Real-Time Workflow
INSERT INTO public.lessons (lesson_id, course_id, title, video_source_type, video_external_id, duration_minutes, order_index, is_preview)
VALUES (
  'ebd30129-234b-4b2a-8d19-450f612d4cf7',
  (SELECT course_id FROM public.courses WHERE slug = 'enscape-masterclass'),
  '01. Introduction to Enscape Real-Time Workflow',
  'youtube',
  'https://www.w3schools.com/html/movie.mp4',
  12,
  1,
  true
)
ON CONFLICT (lesson_id) DO UPDATE SET
  title = EXCLUDED.title,
  video_source_type = EXCLUDED.video_source_type,
  video_external_id = EXCLUDED.video_external_id,
  duration_minutes = EXCLUDED.duration_minutes,
  order_index = EXCLUDED.order_index,
  is_preview = EXCLUDED.is_preview;
INSERT INTO public.exercises (exercise_id, lesson_id, title, brief_prompt, max_score)
VALUES (
  'ebe30129-234b-4b2a-8d19-450f612d4cf7',
  'ebd30129-234b-4b2a-8d19-450f612d4cf7',
  'Practice Task: Live Link Setup',
  'Establish the live link between SketchUp and Enscape, set up two scenes, and take screenshots of the output.',
  100
)
ON CONFLICT (exercise_id) DO UPDATE SET
  title = EXCLUDED.title,
  brief_prompt = EXCLUDED.brief_prompt,
  max_score = EXCLUDED.max_score;

-- Lesson: 02. Material Configuration & Asset Placement
INSERT INTO public.lessons (lesson_id, course_id, title, video_source_type, video_external_id, duration_minutes, order_index, is_preview)
VALUES (
  'eb9a6cf7-7756-42d4-bb34-8c6a0c021c32',
  (SELECT course_id FROM public.courses WHERE slug = 'enscape-masterclass'),
  '02. Material Configuration & Asset Placement',
  'youtube',
  'https://www.w3schools.com/html/movie.mp4',
  18,
  2,
  false
)
ON CONFLICT (lesson_id) DO UPDATE SET
  title = EXCLUDED.title,
  video_source_type = EXCLUDED.video_source_type,
  video_external_id = EXCLUDED.video_external_id,
  duration_minutes = EXCLUDED.duration_minutes,
  order_index = EXCLUDED.order_index,
  is_preview = EXCLUDED.is_preview;
INSERT INTO public.exercises (exercise_id, lesson_id, title, brief_prompt, max_score)
VALUES (
  'ebea6cf7-7756-42d4-bb34-8c6a0c021c32',
  'eb9a6cf7-7756-42d4-bb34-8c6a0c021c32',
  'Practice Task: Materials & Assets',
  'Configure bump maps, roughness, and glass reflections. Populate the scene with library assets and export a render.',
  100
)
ON CONFLICT (exercise_id) DO UPDATE SET
  title = EXCLUDED.title,
  brief_prompt = EXCLUDED.brief_prompt,
  max_score = EXCLUDED.max_score;

-- 5. Seed Projects

-- Project: Krohom Bookstore
INSERT INTO public.projects (
  title, slug, description, software_used, category, cover_image_url, gallery_images_json, 
  is_featured, is_published, created_by, year, location, price, client, scope,
  features_json, challenges_json, solutions_json
) VALUES (
  'Krohom Bookstore',
  'krohom-bookstore',
  'A modern bookstore designed to foster community and learning. Featuring contemporary architecture and welcoming spaces for readers of all ages.',
  'D5 Render, Photoshop, Sketchup',
  'Institutional',
  '/24-Krohom bookstore (Institutional)/Lightroom/Exterior-1.jpg',
  '["/24-Krohom bookstore (Institutional)/Lightroom/Exterior-1.jpg","/24-Krohom bookstore (Institutional)/Lightroom/Exterior-2.jpg","/24-Krohom bookstore (Institutional)/Lightroom/Exterior-3.jpg","/24-Krohom bookstore (Institutional)/Lightroom/Exterior-4.jpg","/24-Krohom bookstore (Institutional)/Lightroom/Exterior-5.jpg","/24-Krohom bookstore (Institutional)/Lightroom/Exterior-6.jpg","/24-Krohom bookstore (Institutional)/Lightroom/Exterior-7.jpg","/24-Krohom bookstore (Institutional)/Lightroom/Exterior-8.jpg","/24-Krohom bookstore (Institutional)/Lightroom/Exterior-9.jpg","/24-Krohom bookstore (Institutional)/Lightroom/Exterior-10.jpg"]',
  true,
  true,
  '00000000-0000-0000-0000-000000000000',
  '2024',
  'Phnom Penh, Cambodia',
  '$25,000',
  'Krohom Bookstore',
  'Exterior & Interior Visualization',
  '["Modern educational facilities","Community reading areas","Sustainable design","Natural lighting"]',
  '["Integrating modern design with functional requirements","Optimizing natural light for reading areas"]',
  '["Open plan layout","Skylights and large windows"]'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  software_used = EXCLUDED.software_used,
  category = EXCLUDED.category,
  cover_image_url = EXCLUDED.cover_image_url,
  gallery_images_json = EXCLUDED.gallery_images_json,
  is_featured = EXCLUDED.is_featured,
  year = EXCLUDED.year,
  location = EXCLUDED.location,
  price = EXCLUDED.price,
  client = EXCLUDED.client,
  scope = EXCLUDED.scope,
  features_json = EXCLUDED.features_json,
  challenges_json = EXCLUDED.challenges_json,
  solutions_json = EXCLUDED.solutions_json;

-- Project: Raffle Bookstore
INSERT INTO public.projects (
  title, slug, description, software_used, category, cover_image_url, gallery_images_json, 
  is_featured, is_published, created_by, year, location, price, client, scope,
  features_json, challenges_json, solutions_json
) VALUES (
  'Raffle Bookstore',
  'raffle-bookstore',
  'A prestigious bookstore featuring classic architectural design elements mixed with modern functionality. An inspiring space for literature lovers.',
  'D5 Render, Photoshop, Sketchup',
  'Institutional',
  '/23-Raffle Bookstore(Institutional)/Lightroom/Exterior-1.jpg',
  '["/23-Raffle Bookstore(Institutional)/Lightroom/Exterior-1.jpg","/23-Raffle Bookstore(Institutional)/Lightroom/Exterior-2.jpg","/23-Raffle Bookstore(Institutional)/Lightroom/Exterior-3.jpg","/23-Raffle Bookstore(Institutional)/Lightroom/Exterior-4.jpg","/23-Raffle Bookstore(Institutional)/Lightroom/Exterior-5.jpg","/23-Raffle Bookstore(Institutional)/Lightroom/Exterior-1-2.jpg","/23-Raffle Bookstore(Institutional)/Lightroom/Exterior-2-2.jpg","/23-Raffle Bookstore(Institutional)/Lightroom/Exterior-3-2.jpg","/23-Raffle Bookstore(Institutional)/Lightroom/Exterior-4-2.jpg","/23-Raffle Bookstore(Institutional)/Lightroom/Exterior-5-2.jpg"]',
  true,
  true,
  '00000000-0000-0000-0000-000000000000',
  '2024',
  'Phnom Penh, Cambodia',
  '$28,000',
  'Raffle Bookstore',
  'Exterior & Interior Visualization',
  '["Classic architectural elements","Spacious reading halls","Modern amenities","Elegant facade"]',
  '["Preserving architectural heritage style","Creating functional modern retail space"]',
  '["Blend of classic and modern design","Strategic lighting"]'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  software_used = EXCLUDED.software_used,
  category = EXCLUDED.category,
  cover_image_url = EXCLUDED.cover_image_url,
  gallery_images_json = EXCLUDED.gallery_images_json,
  is_featured = EXCLUDED.is_featured,
  year = EXCLUDED.year,
  location = EXCLUDED.location,
  price = EXCLUDED.price,
  client = EXCLUDED.client,
  scope = EXCLUDED.scope,
  features_json = EXCLUDED.features_json,
  challenges_json = EXCLUDED.challenges_json,
  solutions_json = EXCLUDED.solutions_json;

-- Project: Hill House
INSERT INTO public.projects (
  title, slug, description, software_used, category, cover_image_url, gallery_images_json, 
  is_featured, is_published, created_by, year, location, price, client, scope,
  features_json, challenges_json, solutions_json
) VALUES (
  'Hill House',
  'hill-house',
  'A stunning residential house featuring contemporary architectural design, modern living spaces, and elegant home environments. This residential development showcases sophisticated home architecture with premium finishes, strategic space utilization, and a beautiful design that creates an inspiring living environment.',
  'D5 Render, Photoshop, Sketchup',
  'Residential',
  '/22-Hill House (Residential)/Lightroom/Exterior-1.jpg',
  '["/22-Hill House (Residential)/Lightroom/Exterior-1.jpg","/22-Hill House (Residential)/Lightroom/Exterior-2.jpg","/22-Hill House (Residential)/Lightroom/Exterior-3.jpg","/22-Hill House (Residential)/Lightroom/Exterior-4.jpg","/22-Hill House (Residential)/Lightroom/Exterior-5.jpg","/22-Hill House (Residential)/Lightroom/Exterior-6.jpg","/22-Hill House (Residential)/Lightroom/Exterior-7.jpg","/22-Hill House (Residential)/Lightroom/Exterior-8.jpg","/22-Hill House (Residential)/Lightroom/Exterior-9.jpg","/22-Hill House (Residential)/Lightroom/Exterior-10.jpg"]',
  true,
  true,
  '00000000-0000-0000-0000-000000000000',
  '2024',
  'Phnom Penh, Cambodia',
  '$18,000',
  'Private Client',
  'Exterior Visualization',
  '["Contemporary residential architecture","Modern living spaces","Premium exterior finishes","Elegant home design","Strategic space utilization","Beautiful landscaping","Sustainable design elements"]',
  '["Creating realistic residential building materials and textures","Achieving optimal lighting for different times of day","Showcasing architectural details accurately"]',
  '["High-resolution material mapping and texture studies","Advanced daylight simulation and rendering","Detailed architectural element visualization"]'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  software_used = EXCLUDED.software_used,
  category = EXCLUDED.category,
  cover_image_url = EXCLUDED.cover_image_url,
  gallery_images_json = EXCLUDED.gallery_images_json,
  is_featured = EXCLUDED.is_featured,
  year = EXCLUDED.year,
  location = EXCLUDED.location,
  price = EXCLUDED.price,
  client = EXCLUDED.client,
  scope = EXCLUDED.scope,
  features_json = EXCLUDED.features_json,
  challenges_json = EXCLUDED.challenges_json,
  solutions_json = EXCLUDED.solutions_json;

-- Project: KOH PICH COMMERCIAL COMPLEX
INSERT INTO public.projects (
  title, slug, description, software_used, category, cover_image_url, gallery_images_json, 
  is_featured, is_published, created_by, year, location, price, client, scope,
  features_json, challenges_json, solutions_json
) VALUES (
  'KOH PICH COMMERCIAL COMPLEX',
  'koh-pich-commercial-complex',
  'A prestigious commercial complex featuring contemporary architectural design, modern retail and office spaces, and innovative urban development. This mixed-use development showcases sophisticated commercial architecture with premium finishes, strategic space utilization, and a dynamic urban presence that creates a vibrant commercial hub.',
  'D5 Render, Photoshop, Sketchup',
  'Commercial',
  '/21-KOH PICH COMMERCIAL COMPLEX (Commercial)/LIGHTROOM/Exterior-1.jpg',
  '["/21-KOH PICH COMMERCIAL COMPLEX (Commercial)/LIGHTROOM/Exterior-1.jpg","/21-KOH PICH COMMERCIAL COMPLEX (Commercial)/LIGHTROOM/Exterior-2.jpg","/21-KOH PICH COMMERCIAL COMPLEX (Commercial)/LIGHTROOM/Exterior-3.jpg","/21-KOH PICH COMMERCIAL COMPLEX (Commercial)/LIGHTROOM/Exterior-4.jpg","/21-KOH PICH COMMERCIAL COMPLEX (Commercial)/LIGHTROOM/Exterior-5.jpg","/21-KOH PICH COMMERCIAL COMPLEX (Commercial)/LIGHTROOM/Exterior-6.jpg","/21-KOH PICH COMMERCIAL COMPLEX (Commercial)/LIGHTROOM/Exterior-7.jpg","/21-KOH PICH COMMERCIAL COMPLEX (Commercial)/LIGHTROOM/Exterior-8.jpg","/21-KOH PICH COMMERCIAL COMPLEX (Commercial)/LIGHTROOM/Exterior-9.jpg","/21-KOH PICH COMMERCIAL COMPLEX (Commercial)/LIGHTROOM/Exterior-10.jpg","/21-KOH PICH COMMERCIAL COMPLEX (Commercial)/LIGHTROOM/Exterior-11.jpg","/21-KOH PICH COMMERCIAL COMPLEX (Commercial)/LIGHTROOM/Exterior-12.jpg","/21-KOH PICH COMMERCIAL COMPLEX (Commercial)/LIGHTROOM/Exterior-13.jpg","/21-KOH PICH COMMERCIAL COMPLEX (Commercial)/LIGHTROOM/Exterior-14.jpg"]',
  true,
  true,
  '00000000-0000-0000-0000-000000000000',
  '2024',
  'Phnom Penh, Cambodia',
  '$58,000',
  'KOH PICH Development',
  'Exterior Visualization',
  '["Mixed-use commercial development","Modern retail and office spaces","Premium exterior finishes","Strategic space utilization","Contemporary commercial architecture","Dynamic commercial atmosphere","Sustainable design elements"]',
  '["Creating realistic commercial environments","Showcasing multiple program types effectively","Achieving optimal lighting for commercial spaces"]',
  '["Advanced lighting simulation for commercial environments","Detailed storefront and office space visualization","Comprehensive material studies for commercial spaces"]'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  software_used = EXCLUDED.software_used,
  category = EXCLUDED.category,
  cover_image_url = EXCLUDED.cover_image_url,
  gallery_images_json = EXCLUDED.gallery_images_json,
  is_featured = EXCLUDED.is_featured,
  year = EXCLUDED.year,
  location = EXCLUDED.location,
  price = EXCLUDED.price,
  client = EXCLUDED.client,
  scope = EXCLUDED.scope,
  features_json = EXCLUDED.features_json,
  challenges_json = EXCLUDED.challenges_json,
  solutions_json = EXCLUDED.solutions_json;

-- Project: LOTUS TOWER OFFICE BUILDING
INSERT INTO public.projects (
  title, slug, description, software_used, category, cover_image_url, gallery_images_json, 
  is_featured, is_published, created_by, year, location, price, client, scope,
  features_json, challenges_json, solutions_json
) VALUES (
  'LOTUS TOWER OFFICE BUILDING',
  'lotus-tower-office-building',
  'A prestigious office tower featuring elegant lotus-inspired architectural design, modern workspace environments, and professional office facilities. This landmark building showcases sophisticated vertical architecture with premium finishes, strategic space utilization, and a dynamic urban presence that creates an iconic addition to the city skyline.',
  'D5 Render, Photoshop, Sketchup',
  'Office',
  '/20-LOTUS TOWER OFFICE BUILDING (Office)/Render image/Render image/LIGHTROOM/Exterior-1.jpg',
  '["/20-LOTUS TOWER OFFICE BUILDING (Office)/Render image/Render image/LIGHTROOM/Exterior-1.jpg","/20-LOTUS TOWER OFFICE BUILDING (Office)/Render image/Render image/LIGHTROOM/Exterior-2.jpg","/20-LOTUS TOWER OFFICE BUILDING (Office)/Render image/Render image/LIGHTROOM/Exterior-3.jpg","/20-LOTUS TOWER OFFICE BUILDING (Office)/Render image/Render image/LIGHTROOM/Exterior-4.jpg","/20-LOTUS TOWER OFFICE BUILDING (Office)/Render image/Render image/LIGHTROOM/Exterior-5.jpg"]',
  true,
  true,
  '00000000-0000-0000-0000-000000000000',
  '2024',
  'Phnom Penh, Cambodia',
  '$45,000',
  'LOTUS Development Group',
  'Exterior Visualization',
  '["Lotus-inspired architectural design","Contemporary tower architecture","Modern office spaces","Premium exterior finishes","Iconic urban landmark design","Advanced building systems","Sustainable design elements"]',
  '["Creating realistic lotus-inspired architectural elements","Achieving optimal lighting for different times of day","Showcasing vertical architecture accurately"]',
  '["High-resolution material mapping and texture studies","Advanced daylight simulation and rendering","Detailed architectural element visualization"]'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  software_used = EXCLUDED.software_used,
  category = EXCLUDED.category,
  cover_image_url = EXCLUDED.cover_image_url,
  gallery_images_json = EXCLUDED.gallery_images_json,
  is_featured = EXCLUDED.is_featured,
  year = EXCLUDED.year,
  location = EXCLUDED.location,
  price = EXCLUDED.price,
  client = EXCLUDED.client,
  scope = EXCLUDED.scope,
  features_json = EXCLUDED.features_json,
  challenges_json = EXCLUDED.challenges_json,
  solutions_json = EXCLUDED.solutions_json;

-- Project: NOREA HEAD OFFICE
INSERT INTO public.projects (
  title, slug, description, software_used, category, cover_image_url, gallery_images_json, 
  is_featured, is_published, created_by, year, location, price, client, scope,
  features_json, challenges_json, solutions_json
) VALUES (
  'NOREA HEAD OFFICE',
  'norea-head-office',
  'A prestigious corporate head office featuring contemporary architectural design, modern workspace environments, and professional office facilities. This office building showcases sophisticated corporate architecture with premium finishes, strategic space utilization, and a dynamic professional presence that creates an inspiring workplace environment.',
  'D5 Render, Photoshop, Sketchup',
  'Office',
  '/19-NOREA HEAD OFFICE (Office)/Render image/LIGHTROOM/Exterior-1.jpg',
  '["/19-NOREA HEAD OFFICE (Office)/Render image/LIGHTROOM/Exterior-1.jpg","/19-NOREA HEAD OFFICE (Office)/Render image/LIGHTROOM/Exterior-2.jpg","/19-NOREA HEAD OFFICE (Office)/Render image/LIGHTROOM/Exterior-3.jpg","/19-NOREA HEAD OFFICE (Office)/Render image/LIGHTROOM/Exterior-4.jpg","/19-NOREA HEAD OFFICE (Office)/Render image/LIGHTROOM/Exterior-5.jpg","/19-NOREA HEAD OFFICE (Office)/Render image/LIGHTROOM/Exterior-6.jpg","/19-NOREA HEAD OFFICE (Office)/Render image/LIGHTROOM/Exterior-7.jpg","/19-NOREA HEAD OFFICE (Office)/Render image/LIGHTROOM/Exterior-8.jpg","/19-NOREA HEAD OFFICE (Office)/Render image/LIGHTROOM/Office Exterior OP2-1.jpg","/19-NOREA HEAD OFFICE (Office)/Render image/LIGHTROOM/Office Exterior OP2-2.jpg","/19-NOREA HEAD OFFICE (Office)/Render image/LIGHTROOM/Office Exterior OP2-3.jpg","/19-NOREA HEAD OFFICE (Office)/Render image/LIGHTROOM/Office Exterior OP2-4.jpg","/19-NOREA HEAD OFFICE (Office)/Render image/LIGHTROOM/Office Exterior OP2-5.jpg"]',
  true,
  true,
  '00000000-0000-0000-0000-000000000000',
  '2024',
  'Phnom Penh, Cambodia',
  '$32,000',
  'NOREA Corporation',
  'Exterior Visualization',
  '["Contemporary office architecture","Modern workspace design","Premium exterior finishes","Professional office facilities","Strategic space utilization","Corporate aesthetic","Sustainable design elements"]',
  '["Creating realistic office building materials and textures","Achieving optimal lighting for different times of day","Showcasing architectural details accurately"]',
  '["High-resolution material mapping and texture studies","Advanced daylight simulation and rendering","Detailed architectural element visualization"]'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  software_used = EXCLUDED.software_used,
  category = EXCLUDED.category,
  cover_image_url = EXCLUDED.cover_image_url,
  gallery_images_json = EXCLUDED.gallery_images_json,
  is_featured = EXCLUDED.is_featured,
  year = EXCLUDED.year,
  location = EXCLUDED.location,
  price = EXCLUDED.price,
  client = EXCLUDED.client,
  scope = EXCLUDED.scope,
  features_json = EXCLUDED.features_json,
  challenges_json = EXCLUDED.challenges_json,
  solutions_json = EXCLUDED.solutions_json;

-- Project: THE NES Mall Complex
INSERT INTO public.projects (
  title, slug, description, software_used, category, cover_image_url, gallery_images_json, 
  is_featured, is_published, created_by, year, location, price, client, scope,
  features_json, challenges_json, solutions_json
) VALUES (
  'THE NES Mall Complex',
  'the-nes-mall-complex',
  'A modern shopping mall complex featuring contemporary retail architecture, spacious shopping environments, and dynamic commercial spaces. This retail development showcases innovative mall architecture with premium finishes, strategic tenant layouts, and a vibrant commercial atmosphere that attracts shoppers and visitors.',
  'D5 Render, Photoshop, Sketchup',
  'Commercial',
  '/18-THE NES Mall Complex (Commercial)/Render image/LIGHTROOM/EXTERIOR-1.jpg',
  '["/18-THE NES Mall Complex (Commercial)/Render image/LIGHTROOM/EXTERIOR-1.jpg","/18-THE NES Mall Complex (Commercial)/Render image/LIGHTROOM/EXTERIOR-2.jpg","/18-THE NES Mall Complex (Commercial)/Render image/LIGHTROOM/EXTERIOR-3.jpg","/18-THE NES Mall Complex (Commercial)/Render image/LIGHTROOM/EXTERIOR-4.jpg","/18-THE NES Mall Complex (Commercial)/Render image/LIGHTROOM/EXTERIOR-5.jpg","/18-THE NES Mall Complex (Commercial)/Render image/LIGHTROOM/EXTERIOR-6.jpg","/18-THE NES Mall Complex (Commercial)/Render image/LIGHTROOM/EXTERIOR-7.jpg","/18-THE NES Mall Complex (Commercial)/Render image/LIGHTROOM/EXTERIOR-8.jpg","/18-THE NES Mall Complex (Commercial)/Render image/LIGHTROOM/EXTERIOR-9.jpg","/18-THE NES Mall Complex (Commercial)/Render image/LIGHTROOM/EXTERIOR-10.jpg"]',
  true,
  true,
  '00000000-0000-0000-0000-000000000000',
  '2024',
  'Phnom Penh, Cambodia',
  '$38,000',
  'THE NES Development',
  'Exterior Visualization',
  '["Modern retail architecture","Spacious shopping environments","Premium retail finishes","Strategic tenant layouts","Contemporary mall architecture","Dynamic commercial atmosphere","Elegant facade design"]',
  '["Creating realistic retail environments","Showcasing multiple tenant spaces effectively","Achieving optimal lighting for commercial environments"]',
  '["Advanced lighting simulation for retail environments","Detailed storefront and retail space visualization","Comprehensive material studies for commercial spaces"]'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  software_used = EXCLUDED.software_used,
  category = EXCLUDED.category,
  cover_image_url = EXCLUDED.cover_image_url,
  gallery_images_json = EXCLUDED.gallery_images_json,
  is_featured = EXCLUDED.is_featured,
  year = EXCLUDED.year,
  location = EXCLUDED.location,
  price = EXCLUDED.price,
  client = EXCLUDED.client,
  scope = EXCLUDED.scope,
  features_json = EXCLUDED.features_json,
  challenges_json = EXCLUDED.challenges_json,
  solutions_json = EXCLUDED.solutions_json;

-- Project: GREENBASE Kindergarten
INSERT INTO public.projects (
  title, slug, description, software_used, category, cover_image_url, gallery_images_json, 
  is_featured, is_published, created_by, year, location, price, client, scope,
  features_json, challenges_json, solutions_json
) VALUES (
  'GREENBASE Kindergarten',
  'greenbase-kindergarten',
  'A modern kindergarten facility featuring innovative educational design, child-friendly spaces, and inspiring learning environments. This educational institution showcases contemporary architecture with playful design elements, spacious classrooms, safe outdoor play areas, and a nurturing atmosphere that promotes early childhood development.',
  'D5 Render, Photoshop, Sketchup',
  'Institutional',
  '/17-GREENBASE Kindergarten (Institutional)/Render image/New folder/Scene 1.jpg',
  '["/17-GREENBASE Kindergarten (Institutional)/Render image/New folder/Scene 1.jpg","/17-GREENBASE Kindergarten (Institutional)/Render image/New folder/Scene 2.jpg","/17-GREENBASE Kindergarten (Institutional)/Render image/New folder/Scene 3.jpg","/17-GREENBASE Kindergarten (Institutional)/Render image/New folder/Scene 4.jpg","/17-GREENBASE Kindergarten (Institutional)/Render image/New folder/Scene 5.jpg","/17-GREENBASE Kindergarten (Institutional)/Render image/New folder/Scene 6.jpg","/17-GREENBASE Kindergarten (Institutional)/Render image/New folder/Scene 7.jpg","/17-GREENBASE Kindergarten (Institutional)/Render image/New folder/Scene 8.jpg","/17-GREENBASE Kindergarten (Institutional)/Render image/New folder/Scene 9.jpg","/17-GREENBASE Kindergarten (Institutional)/Render image/New folder/Scene 10.jpg","/17-GREENBASE Kindergarten (Institutional)/Render image/New folder/Scene 11.jpg","/17-GREENBASE Kindergarten (Institutional)/Render image/New folder/Scene 13.jpg","/17-GREENBASE Kindergarten (Institutional)/Render image/New folder/Scene 14.jpg","/17-GREENBASE Kindergarten (Institutional)/Render image/New folder/Scene 15.jpg","/17-GREENBASE Kindergarten (Institutional)/Render image/New folder/Scene 16.jpg","/17-GREENBASE Kindergarten (Institutional)/Render image/New folder/Scene 17.jpg"]',
  true,
  true,
  '00000000-0000-0000-0000-000000000000',
  '2024',
  'Phnom Penh, Cambodia',
  '$22,000',
  'GREENBASE Education',
  'Exterior & Interior Visualization',
  '["Child-friendly design","Spacious classrooms","Safe outdoor play areas","Modern educational facilities","Playful architectural elements","Nurturing learning environment","Sustainable design elements"]',
  '["Creating child-appropriate educational environments","Balancing safety with engaging design","Showcasing playful architectural elements"]',
  '["Age-appropriate space planning","Safe material selection and finishes","Engaging color schemes and design elements"]'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  software_used = EXCLUDED.software_used,
  category = EXCLUDED.category,
  cover_image_url = EXCLUDED.cover_image_url,
  gallery_images_json = EXCLUDED.gallery_images_json,
  is_featured = EXCLUDED.is_featured,
  year = EXCLUDED.year,
  location = EXCLUDED.location,
  price = EXCLUDED.price,
  client = EXCLUDED.client,
  scope = EXCLUDED.scope,
  features_json = EXCLUDED.features_json,
  challenges_json = EXCLUDED.challenges_json,
  solutions_json = EXCLUDED.solutions_json;

-- Project: SB TOWER
INSERT INTO public.projects (
  title, slug, description, software_used, category, cover_image_url, gallery_images_json, 
  is_featured, is_published, created_by, year, location, price, client, scope,
  features_json, challenges_json, solutions_json
) VALUES (
  'SB TOWER',
  'sb-tower',
  'A prestigious office tower featuring contemporary architectural design, modern workspace environments, and innovative urban development. This landmark tower showcases sophisticated vertical architecture with premium finishes, strategic space utilization, and a dynamic urban presence that creates an iconic addition to the city skyline.',
  'D5 Render, Photoshop, Sketchup',
  'Commercial',
  '/16-SB TOWER (Commercial)/Render Image/LIGHTROOM/Exterior-1.jpg',
  '["/16-SB TOWER (Commercial)/Render Image/LIGHTROOM/Exterior-1.jpg","/16-SB TOWER (Commercial)/Render Image/LIGHTROOM/Exterior-2.jpg","/16-SB TOWER (Commercial)/Render Image/LIGHTROOM/Exterior-3.jpg","/16-SB TOWER (Commercial)/Render Image/LIGHTROOM/Exterior-4.jpg","/16-SB TOWER (Commercial)/Render Image/LIGHTROOM/Exterior-5.jpg","/16-SB TOWER (Commercial)/Render Image/LIGHTROOM/Exterior-6.jpg","/16-SB TOWER (Commercial)/Render Image/LIGHTROOM/Exterior-7.jpg","/16-SB TOWER (Commercial)/Render Image/LIGHTROOM/Exterior-8.jpg","/16-SB TOWER (Commercial)/Render Image/LIGHTROOM/Exterior-9.jpg","/16-SB TOWER (Commercial)/Render Image/LIGHTROOM/Exterior-10.jpg","/16-SB TOWER (Commercial)/Render Image/LIGHTROOM/Exterior-11.jpg","/16-SB TOWER (Commercial)/Render Image/LIGHTROOM/Exterior-12.jpg"]',
  false,
  true,
  '00000000-0000-0000-0000-000000000000',
  '2024',
  'Phnom Penh, Cambodia',
  '$52,000',
  'SB Development Group',
  'Exterior & Interior Visualization & Animation',
  '["Contemporary tower architecture","Modern office spaces","Premium exterior finishes","Strategic vertical space utilization","Iconic urban landmark design","Advanced building systems","Sustainable design elements"]',
  '["Creating realistic tower building materials and textures","Achieving optimal lighting for different times of day","Showcasing vertical architecture accurately","Producing photorealistic animations"]',
  '["High-resolution material mapping and texture studies","Advanced daylight simulation and rendering","Detailed architectural element visualization","Dynamic camera movements for cinematic presentations"]'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  software_used = EXCLUDED.software_used,
  category = EXCLUDED.category,
  cover_image_url = EXCLUDED.cover_image_url,
  gallery_images_json = EXCLUDED.gallery_images_json,
  is_featured = EXCLUDED.is_featured,
  year = EXCLUDED.year,
  location = EXCLUDED.location,
  price = EXCLUDED.price,
  client = EXCLUDED.client,
  scope = EXCLUDED.scope,
  features_json = EXCLUDED.features_json,
  challenges_json = EXCLUDED.challenges_json,
  solutions_json = EXCLUDED.solutions_json;

-- Project: APAC BUILDING
INSERT INTO public.projects (
  title, slug, description, software_used, category, cover_image_url, gallery_images_json, 
  is_featured, is_published, created_by, year, location, price, client, scope,
  features_json, challenges_json, solutions_json
) VALUES (
  'APAC BUILDING',
  'apac-building',
  'A prestigious twin tower building featuring contemporary architectural design, modern commercial spaces, and innovative urban development. This landmark development showcases sophisticated twin tower architecture with premium finishes, strategic space utilization, and a dynamic urban presence that creates an iconic addition to the city skyline.',
  'D5 Render, Photoshop, Sketchup',
  'Commercial',
  '/15-APAC BUILDING (Commercial)/Lightroom/TWIN TOWER EXTERIOR-1.jpg',
  '["/15-APAC BUILDING (Commercial)/Lightroom/TWIN TOWER EXTERIOR-1.jpg","/15-APAC BUILDING (Commercial)/Lightroom/TWIN TOWER EXTERIOR-2.jpg","/15-APAC BUILDING (Commercial)/Lightroom/TWIN TOWER EXTERIOR-3.jpg","/15-APAC BUILDING (Commercial)/Lightroom/TWIN TOWER EXTERIOR-4.jpg","/15-APAC BUILDING (Commercial)/Lightroom/TWIN TOWER EXTERIOR-5.jpg","/15-APAC BUILDING (Commercial)/Lightroom/TWIN TOWER EXTERIOR-6.jpg","/15-APAC BUILDING (Commercial)/Lightroom/TWIN TOWER EXTERIOR-7.jpg","/15-APAC BUILDING (Commercial)/Lightroom/TWIN TOWER EXTERIOR-8.jpg","/15-APAC BUILDING (Commercial)/Lightroom/TWIN TOWER EXTERIOR-9.jpg"]',
  false,
  true,
  '00000000-0000-0000-0000-000000000000',
  '2024',
  'Phnom Penh, Cambodia',
  '$55,000',
  'APAC Development',
  'Exterior Visualization',
  '["Twin tower design","Contemporary architecture","Modern commercial spaces","Premium exterior finishes","Iconic urban landmark","Advanced building systems","Sustainable design elements"]',
  '["Creating realistic twin tower materials and textures","Achieving optimal lighting for different times of day","Showcasing architectural symmetry accurately"]',
  '["High-resolution material mapping and texture studies","Advanced daylight simulation and rendering","Detailed architectural element visualization"]'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  software_used = EXCLUDED.software_used,
  category = EXCLUDED.category,
  cover_image_url = EXCLUDED.cover_image_url,
  gallery_images_json = EXCLUDED.gallery_images_json,
  is_featured = EXCLUDED.is_featured,
  year = EXCLUDED.year,
  location = EXCLUDED.location,
  price = EXCLUDED.price,
  client = EXCLUDED.client,
  scope = EXCLUDED.scope,
  features_json = EXCLUDED.features_json,
  challenges_json = EXCLUDED.challenges_json,
  solutions_json = EXCLUDED.solutions_json;

-- Project: WHITE BEACH HOTEL BY SB
INSERT INTO public.projects (
  title, slug, description, software_used, category, cover_image_url, gallery_images_json, 
  is_featured, is_published, created_by, year, location, price, client, scope,
  features_json, challenges_json, solutions_json
) VALUES (
  'WHITE BEACH HOTEL BY SB',
  'white-beach-hotel',
  'A luxurious beachfront hotel featuring elegant architectural design, stunning ocean views, and premium hospitality facilities. This seaside resort showcases contemporary hotel architecture with curved building designs, spacious guest rooms, world-class amenities, and a serene beachfront atmosphere that provides guests with an unforgettable vacation experience.',
  'D5 Render, Photoshop, Sketchup',
  'Residential',
  '/14-WHITE BEACH HOTEL BY SB (Residential)/Render images/LIGHTROOM/seaside building-1.jpg',
  '["/14-WHITE BEACH HOTEL BY SB (Residential)/Render images/LIGHTROOM/seaside building-1.jpg","/14-WHITE BEACH HOTEL BY SB (Residential)/Render images/LIGHTROOM/seaside building-2.jpg","/14-WHITE BEACH HOTEL BY SB (Residential)/Render images/LIGHTROOM/seaside building-3.jpg","/14-WHITE BEACH HOTEL BY SB (Residential)/Render images/LIGHTROOM/seaside building-4.jpg","/14-WHITE BEACH HOTEL BY SB (Residential)/Render images/LIGHTROOM/seaside building-5.jpg","/14-WHITE BEACH HOTEL BY SB (Residential)/Render images/LIGHTROOM/seaside building-6.jpg","/14-WHITE BEACH HOTEL BY SB (Residential)/Render images/LIGHTROOM/seaside building-7.jpg","/14-WHITE BEACH HOTEL BY SB (Residential)/Render images/LIGHTROOM/seaside building-8.jpg"]',
  false,
  true,
  '00000000-0000-0000-0000-000000000000',
  '2024',
  'Cambodia',
  '$48,000',
  'SB Hospitality Group',
  'Exterior & Interior Visualization & Animation',
  '["Elegant curved building design","Stunning ocean views","Spacious guest rooms","World-class amenities","Beachfront location","Premium hospitality facilities","Sustainable design elements"]',
  '["Creating realistic beachfront environments","Showcasing curved architectural elements","Achieving photorealistic water and lighting effects"]',
  '["Advanced 3D modeling for curved structures","Comprehensive material and lighting studies","Dynamic camera movements and cinematic presentations"]'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  software_used = EXCLUDED.software_used,
  category = EXCLUDED.category,
  cover_image_url = EXCLUDED.cover_image_url,
  gallery_images_json = EXCLUDED.gallery_images_json,
  is_featured = EXCLUDED.is_featured,
  year = EXCLUDED.year,
  location = EXCLUDED.location,
  price = EXCLUDED.price,
  client = EXCLUDED.client,
  scope = EXCLUDED.scope,
  features_json = EXCLUDED.features_json,
  challenges_json = EXCLUDED.challenges_json,
  solutions_json = EXCLUDED.solutions_json;

-- Project: WESTLINE UNIVERSITY
INSERT INTO public.projects (
  title, slug, description, software_used, category, cover_image_url, gallery_images_json, 
  is_featured, is_published, created_by, year, location, price, client, scope,
  features_json, challenges_json, solutions_json
) VALUES (
  'WESTLINE UNIVERSITY',
  'westline-university',
  'A prestigious university campus featuring innovative architectural design, modern educational facilities, and inspiring learning environments. This academic institution showcases contemporary campus architecture with spacious classrooms, advanced research facilities, and a dynamic campus atmosphere that promotes academic excellence and student engagement.',
  'D5 Render, Photoshop, Sketchup',
  'Institutional',
  '/13-WESTLINE UNIVERSITY (Institutional)/LIGHTROOM/Scene 1_1_upscale01.jpg',
  '["/13-WESTLINE UNIVERSITY (Institutional)/LIGHTROOM/Scene 1_1_upscale01.jpg","/13-WESTLINE UNIVERSITY (Institutional)/LIGHTROOM/Scene 2_1_upscale01.jpg","/13-WESTLINE UNIVERSITY (Institutional)/LIGHTROOM/Scene 3_1_upscale01.jpg","/13-WESTLINE UNIVERSITY (Institutional)/LIGHTROOM/Scene 4_1_upscale01.jpg","/13-WESTLINE UNIVERSITY (Institutional)/LIGHTROOM/Scene 5.jpg","/13-WESTLINE UNIVERSITY (Institutional)/LIGHTROOM/Scene 6.jpg","/13-WESTLINE UNIVERSITY (Institutional)/LIGHTROOM/Scene 7.jpg"]',
  false,
  true,
  '00000000-0000-0000-0000-000000000000',
  '2024',
  'Phnom Penh, Cambodia',
  '$42,000',
  'WESTLINE University',
  'Exterior & Interior Visualization & Animation',
  '["Modern educational facilities","Spacious classrooms and lecture halls","Advanced research laboratories","Student common areas","Contemporary campus architecture","Sustainable design elements"]',
  '["Creating realistic educational environments","Achieving photorealistic animations and renders","Balancing multiple functional requirements"]',
  '["Advanced 3D modeling and animation techniques","Comprehensive material and lighting studies","Dynamic camera movements and cinematic presentations"]'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  software_used = EXCLUDED.software_used,
  category = EXCLUDED.category,
  cover_image_url = EXCLUDED.cover_image_url,
  gallery_images_json = EXCLUDED.gallery_images_json,
  is_featured = EXCLUDED.is_featured,
  year = EXCLUDED.year,
  location = EXCLUDED.location,
  price = EXCLUDED.price,
  client = EXCLUDED.client,
  scope = EXCLUDED.scope,
  features_json = EXCLUDED.features_json,
  challenges_json = EXCLUDED.challenges_json,
  solutions_json = EXCLUDED.solutions_json;

-- Project: HIGH RISE BUILDING
INSERT INTO public.projects (
  title, slug, description, software_used, category, cover_image_url, gallery_images_json, 
  is_featured, is_published, created_by, year, location, price, client, scope,
  features_json, challenges_json, solutions_json
) VALUES (
  'HIGH RISE BUILDING',
  'high-rise-building',
  'A prestigious high-rise building featuring contemporary architectural design, modern office and residential spaces, and innovative urban development. This landmark tower showcases sophisticated vertical architecture with premium finishes, strategic space utilization, and a dynamic urban presence that creates an iconic addition to the city skyline.',
  'D5 Render, Photoshop, Sketchup',
  'Commercial',
  '/12-HIGH RISE BUILDING (Commercial)/Render image/Scene 1.jpg',
  '["/12-HIGH RISE BUILDING (Commercial)/Render image/Scene 1.jpg"]',
  false,
  true,
  '00000000-0000-0000-0000-000000000000',
  '2024',
  'Phnom Penh, Cambodia',
  '$50,000',
  'High Rise Development Group',
  'Exterior & Interior Visualization & Animation',
  '["Contemporary high-rise architecture","Modern office and residential spaces","Premium exterior finishes","Strategic vertical space utilization","Iconic urban landmark design","Advanced building systems","Sustainable design elements"]',
  '["Creating realistic high-rise building materials and textures","Achieving optimal lighting for different times of day","Showcasing vertical architecture accurately","Producing photorealistic animations"]',
  '["High-resolution material mapping and texture studies","Advanced daylight simulation and rendering","Detailed architectural element visualization","Dynamic camera movements for cinematic presentations"]'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  software_used = EXCLUDED.software_used,
  category = EXCLUDED.category,
  cover_image_url = EXCLUDED.cover_image_url,
  gallery_images_json = EXCLUDED.gallery_images_json,
  is_featured = EXCLUDED.is_featured,
  year = EXCLUDED.year,
  location = EXCLUDED.location,
  price = EXCLUDED.price,
  client = EXCLUDED.client,
  scope = EXCLUDED.scope,
  features_json = EXCLUDED.features_json,
  challenges_json = EXCLUDED.challenges_json,
  solutions_json = EXCLUDED.solutions_json;

-- Project: THE CURVE K SHOPPING MALL
INSERT INTO public.projects (
  title, slug, description, software_used, category, cover_image_url, gallery_images_json, 
  is_featured, is_published, created_by, year, location, price, client, scope,
  features_json, challenges_json, solutions_json
) VALUES (
  'THE CURVE K SHOPPING MALL',
  'the-curve-k-shopping-mall',
  'A prestigious shopping mall featuring innovative curved architectural design, modern retail spaces, and dynamic commercial environments. This retail development showcases contemporary mall architecture with elegant curves, premium shopping experiences, strategic tenant layouts, and a vibrant commercial atmosphere that attracts shoppers and visitors.',
  'D5 Render, Photoshop, Sketchup',
  'Commercial',
  '/11-THE CURVE K SHOPPING MALL (Commercial)/Render Image/Exterior-1.jpg',
  '["/11-THE CURVE K SHOPPING MALL (Commercial)/Render Image/Exterior-1.jpg","/11-THE CURVE K SHOPPING MALL (Commercial)/Render Image/Exterior-2.jpg","/11-THE CURVE K SHOPPING MALL (Commercial)/Render Image/Exterior-3.jpg","/11-THE CURVE K SHOPPING MALL (Commercial)/Render Image/Exterior-4.jpg","/11-THE CURVE K SHOPPING MALL (Commercial)/Render Image/Exterior-5.jpg","/11-THE CURVE K SHOPPING MALL (Commercial)/Render Image/Exterior-6.jpg","/11-THE CURVE K SHOPPING MALL (Commercial)/Render Image/Exterior-7.jpg","/11-THE CURVE K SHOPPING MALL (Commercial)/Render Image/Exterior-8.jpg","/11-THE CURVE K SHOPPING MALL (Commercial)/Render Image/Exterior-9.jpg","/11-THE CURVE K SHOPPING MALL (Commercial)/Render Image/Exterior-10.jpg","/11-THE CURVE K SHOPPING MALL (Commercial)/Render Image/Exterior-11.jpg","/11-THE CURVE K SHOPPING MALL (Commercial)/Render Image/Exterior-12.jpg","/11-THE CURVE K SHOPPING MALL (Commercial)/Render Image/Exterior-13.jpg","/11-THE CURVE K SHOPPING MALL (Commercial)/Render Image/Exterior-14.jpg"]',
  false,
  true,
  '00000000-0000-0000-0000-000000000000',
  '2024',
  'Phnom Penh, Cambodia',
  '$35,000',
  'THE CURVE K Development',
  'Exterior Visualization',
  '["Innovative curved architectural design","Modern retail spaces","Premium shopping environments","Strategic tenant layouts","Contemporary mall architecture","Dynamic commercial atmosphere","Elegant facade design"]',
  '["Creating realistic curved architectural elements","Showcasing multiple retail spaces effectively","Achieving optimal lighting for commercial environments","Capturing the elegant curved facade design"]',
  '["Advanced 3D modeling for curved structures","Comprehensive material and lighting studies","Detailed storefront and retail space visualization","Photorealistic rendering techniques"]'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  software_used = EXCLUDED.software_used,
  category = EXCLUDED.category,
  cover_image_url = EXCLUDED.cover_image_url,
  gallery_images_json = EXCLUDED.gallery_images_json,
  is_featured = EXCLUDED.is_featured,
  year = EXCLUDED.year,
  location = EXCLUDED.location,
  price = EXCLUDED.price,
  client = EXCLUDED.client,
  scope = EXCLUDED.scope,
  features_json = EXCLUDED.features_json,
  challenges_json = EXCLUDED.challenges_json,
  solutions_json = EXCLUDED.solutions_json;

-- Project: RUFER UNIVERSITY
INSERT INTO public.projects (
  title, slug, description, software_used, category, cover_image_url, gallery_images_json, 
  is_featured, is_published, created_by, year, location, price, client, scope,
  features_json, challenges_json, solutions_json
) VALUES (
  'RUFER UNIVERSITY',
  'rufer-university',
  'A prestigious university campus featuring innovative architectural design, modern educational facilities, and inspiring learning environments. This academic institution showcases contemporary campus architecture with curved building designs, spacious classrooms, advanced research facilities, and a dynamic campus atmosphere that promotes academic excellence and student engagement.',
  'D5 Render, Photoshop, Sketchup',
  'Institutional',
  '/10-RUFER UNIVERSITY (Institutional)/Render image/Curve building-1.jpg',
  '["/10-RUFER UNIVERSITY (Institutional)/Render image/Curve building-1.jpg","/10-RUFER UNIVERSITY (Institutional)/Render image/Curve building-2.jpg","/10-RUFER UNIVERSITY (Institutional)/Render image/Curve building-3.jpg","/10-RUFER UNIVERSITY (Institutional)/Render image/Curve building-4.jpg","/10-RUFER UNIVERSITY (Institutional)/Render image/Curve building-5.jpg","/10-RUFER UNIVERSITY (Institutional)/Render image/Curve building-6.jpg","/10-RUFER UNIVERSITY (Institutional)/Render image/Curve building-7.jpg","/10-RUFER UNIVERSITY (Institutional)/Render image/Curve building-8.jpg","/10-RUFER UNIVERSITY (Institutional)/Render image/Curve building-9.jpg","/10-RUFER UNIVERSITY (Institutional)/Render image/Curve building-10.jpg","/10-RUFER UNIVERSITY (Institutional)/Render image/Curve building-11.jpg"]',
  false,
  true,
  '00000000-0000-0000-0000-000000000000',
  '2024',
  'Phnom Penh, Cambodia',
  '$45,000',
  'RUFER University',
  'Exterior & Interior Visualization & Animation',
  '["Innovative curved building design","Modern educational facilities","Spacious classrooms and lecture halls","Advanced research laboratories","Student common areas and cafeterias","Contemporary campus architecture","Sustainable design elements"]',
  '["Creating realistic educational environments","Showcasing curved architectural elements","Achieving photorealistic animations and renders","Balancing multiple functional requirements"]',
  '["Advanced 3D modeling for curved structures","Comprehensive material and lighting studies","Dynamic camera movements and cinematic presentations","Detailed interior and exterior visualization"]'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  software_used = EXCLUDED.software_used,
  category = EXCLUDED.category,
  cover_image_url = EXCLUDED.cover_image_url,
  gallery_images_json = EXCLUDED.gallery_images_json,
  is_featured = EXCLUDED.is_featured,
  year = EXCLUDED.year,
  location = EXCLUDED.location,
  price = EXCLUDED.price,
  client = EXCLUDED.client,
  scope = EXCLUDED.scope,
  features_json = EXCLUDED.features_json,
  challenges_json = EXCLUDED.challenges_json,
  solutions_json = EXCLUDED.solutions_json;

-- Project: HAFFITY SPORT SHOPPING CENTER
INSERT INTO public.projects (
  title, slug, description, software_used, category, cover_image_url, gallery_images_json, 
  is_featured, is_published, created_by, year, location, price, client, scope,
  features_json, challenges_json, solutions_json
) VALUES (
  'HAFFITY SPORT SHOPPING CENTER',
  'haffity-sport-shopping-center',
  'A modern sports shopping center featuring contemporary retail architecture, spacious shopping environments, and dynamic design elements. This commercial development showcases innovative retail spaces with premium finishes, strategic tenant layouts, and a vibrant shopping experience that attracts sports enthusiasts and visitors.',
  'D5 Render, Photoshop, Sketchup',
  'Commercial',
  '/09-HAFFITY SPORT SHOPPING CENTER (Commercial)/Lightroom/Scene 1_upscale01.jpg',
  '["/09-HAFFITY SPORT SHOPPING CENTER (Commercial)/Lightroom/Scene 1_upscale01.jpg","/09-HAFFITY SPORT SHOPPING CENTER (Commercial)/Lightroom/Scene 3_upscale01.jpg","/09-HAFFITY SPORT SHOPPING CENTER (Commercial)/Lightroom/Scene 5_upscale01.jpg","/09-HAFFITY SPORT SHOPPING CENTER (Commercial)/Lightroom/Scene 6_1_upscale01.jpg","/09-HAFFITY SPORT SHOPPING CENTER (Commercial)/Lightroom/Scene 7_upscale01.jpg","/09-HAFFITY SPORT SHOPPING CENTER (Commercial)/Lightroom/Scene 8_upscale01.jpg","/09-HAFFITY SPORT SHOPPING CENTER (Commercial)/Lightroom/Scene 9_upscale01.jpg","/09-HAFFITY SPORT SHOPPING CENTER (Commercial)/Lightroom/Scene 10_upscale01.jpg"]',
  false,
  true,
  '00000000-0000-0000-0000-000000000000',
  '2024',
  'Phnom Penh, Cambodia',
  '$28,000',
  'HAFFITY Group',
  'Exterior & Interior Visualization',
  '["Modern sports retail architecture","Spacious shopping environments","Dynamic design elements","Premium retail finishes","Strategic tenant layouts","Vibrant commercial atmosphere"]',
  '["Creating realistic retail environments and storefronts","Showcasing multiple tenant spaces effectively","Achieving optimal lighting for shopping experiences"]',
  '["Advanced lighting simulation for retail environments","Detailed storefront and interior visualization","Comprehensive material studies for commercial spaces"]'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  software_used = EXCLUDED.software_used,
  category = EXCLUDED.category,
  cover_image_url = EXCLUDED.cover_image_url,
  gallery_images_json = EXCLUDED.gallery_images_json,
  is_featured = EXCLUDED.is_featured,
  year = EXCLUDED.year,
  location = EXCLUDED.location,
  price = EXCLUDED.price,
  client = EXCLUDED.client,
  scope = EXCLUDED.scope,
  features_json = EXCLUDED.features_json,
  challenges_json = EXCLUDED.challenges_json,
  solutions_json = EXCLUDED.solutions_json;

-- Project: KALMET OFFICE BUILDING
INSERT INTO public.projects (
  title, slug, description, software_used, category, cover_image_url, gallery_images_json, 
  is_featured, is_published, created_by, year, location, price, client, scope,
  features_json, challenges_json, solutions_json
) VALUES (
  'KALMET OFFICE BUILDING',
  'kalmet-office-building',
  'A modern office building featuring contemporary architectural design, sleek facades, and professional workspace environments. This commercial development showcases sophisticated corporate architecture with premium finishes, strategic design elements, and a professional aesthetic that creates an inspiring workplace environment.',
  'D5 Render, Photoshop, Sketchup',
  'Institutional',
  '/08-KALMET OFFICE BUIDLING (Institutional)/Render image/Scene 1.jpg',
  '["/08-KALMET OFFICE BUIDLING (Institutional)/Render image/Scene 1.jpg","/08-KALMET OFFICE BUIDLING (Institutional)/Render image/Scene 2.jpg","/08-KALMET OFFICE BUIDLING (Institutional)/Render image/Scene 3.jpg","/08-KALMET OFFICE BUIDLING (Institutional)/Render image/Scene 4.jpg","/08-KALMET OFFICE BUIDLING (Institutional)/Render image/Scene 5.jpg","/08-KALMET OFFICE BUIDLING (Institutional)/Render image/Scene 6.jpg","/08-KALMET OFFICE BUIDLING (Institutional)/Render image/Scene 7.jpg","/08-KALMET OFFICE BUIDLING (Institutional)/Render image/Scene 8.jpg","/08-KALMET OFFICE BUIDLING (Institutional)/Render image/Scene 9.jpg","/08-KALMET OFFICE BUIDLING (Institutional)/Render image/Scene 10.jpg","/08-KALMET OFFICE BUIDLING (Institutional)/Render image/Scene 11.jpg","/08-KALMET OFFICE BUIDLING (Institutional)/Render image/Scene 12.jpg"]',
  false,
  true,
  '00000000-0000-0000-0000-000000000000',
  '2024',
  'Phnom Penh, Cambodia',
  '$25,000',
  'KALMET Group',
  'Exterior & Interior Visualization',
  '["Modern office architecture","Contemporary facade design","Premium exterior finishes","Professional workspace design","Strategic lighting design","Corporate aesthetic"]',
  '["Creating realistic office building materials and textures","Achieving optimal lighting for different times of day","Showcasing architectural details accurately"]',
  '["High-resolution material mapping and texture studies","Advanced daylight simulation and rendering","Detailed architectural element visualization"]'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  software_used = EXCLUDED.software_used,
  category = EXCLUDED.category,
  cover_image_url = EXCLUDED.cover_image_url,
  gallery_images_json = EXCLUDED.gallery_images_json,
  is_featured = EXCLUDED.is_featured,
  year = EXCLUDED.year,
  location = EXCLUDED.location,
  price = EXCLUDED.price,
  client = EXCLUDED.client,
  scope = EXCLUDED.scope,
  features_json = EXCLUDED.features_json,
  challenges_json = EXCLUDED.challenges_json,
  solutions_json = EXCLUDED.solutions_json;

-- Project: LIVERON SPORTCENTER
INSERT INTO public.projects (
  title, slug, description, software_used, category, cover_image_url, gallery_images_json, 
  is_featured, is_published, created_by, year, location, price, client, scope,
  features_json, challenges_json, solutions_json
) VALUES (
  'LIVERON SPORTCENTER',
  'liveron-sportcenter',
  'A modern sports center featuring contemporary architectural design, state-of-the-art sports facilities, and dynamic recreational spaces. This institutional development showcases innovative sports architecture with premium finishes, strategic space utilization, and a vibrant athletic atmosphere that promotes health and wellness.',
  'D5 Render, Photoshop, Sketchup',
  'Institutional',
  '/06-LIVERON SPORTCENTER(Institutional)/RENDER IMAGE/Sport-01-3.jpg',
  '["/06-LIVERON SPORTCENTER(Institutional)/RENDER IMAGE/Sport-01-3.jpg","/06-LIVERON SPORTCENTER(Institutional)/RENDER IMAGE/Sport-9.jpg"]',
  false,
  true,
  '00000000-0000-0000-0000-000000000000',
  '2024',
  'Phnom Penh, Cambodia',
  '$22,000',
  'LIVERON Sports',
  'Exterior Visualization',
  '["Modern sports facilities","Contemporary architectural design","Premium exterior finishes","Dynamic recreational spaces","State-of-the-art equipment areas","Vibrant athletic atmosphere"]',
  '["Creating realistic sports facility environments","Showcasing athletic spaces effectively","Achieving optimal lighting for sports activities"]',
  '["Advanced lighting simulation for sports environments","Detailed facility and space visualization","Comprehensive material studies for institutional spaces"]'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  software_used = EXCLUDED.software_used,
  category = EXCLUDED.category,
  cover_image_url = EXCLUDED.cover_image_url,
  gallery_images_json = EXCLUDED.gallery_images_json,
  is_featured = EXCLUDED.is_featured,
  year = EXCLUDED.year,
  location = EXCLUDED.location,
  price = EXCLUDED.price,
  client = EXCLUDED.client,
  scope = EXCLUDED.scope,
  features_json = EXCLUDED.features_json,
  challenges_json = EXCLUDED.challenges_json,
  solutions_json = EXCLUDED.solutions_json;

-- Project: MIXED USE BUILDING
INSERT INTO public.projects (
  title, slug, description, software_used, category, cover_image_url, gallery_images_json, 
  is_featured, is_published, created_by, year, location, price, client, scope,
  features_json, challenges_json, solutions_json
) VALUES (
  'MIXED USE BUILDING',
  'mixed-use-building-04',
  'A prestigious mixed-use building featuring contemporary architectural design, modern commercial and residential spaces, and innovative urban development. This landmark development showcases sophisticated mixed-use architecture with premium finishes, strategic space utilization, and a dynamic urban presence that creates a vibrant community hub.',
  'D5 Render, Photoshop, Sketchup',
  'Commercial',
  '/04-MIXED USE BUILDING(Commercial)/Compress/LIGHTROOM/Exterior-1.jpg',
  '["/04-MIXED USE BUILDING(Commercial)/Compress/LIGHTROOM/Exterior-1.jpg","/04-MIXED USE BUILDING(Commercial)/Compress/LIGHTROOM/Exterior-2.jpg","/04-MIXED USE BUILDING(Commercial)/Compress/LIGHTROOM/Exterior-3.jpg","/04-MIXED USE BUILDING(Commercial)/Compress/LIGHTROOM/Exterior-4.jpg","/04-MIXED USE BUILDING(Commercial)/Compress/LIGHTROOM/Exterior-5.jpg","/04-MIXED USE BUILDING(Commercial)/Compress/LIGHTROOM/Exterior-6.jpg","/04-MIXED USE BUILDING(Commercial)/Compress/LIGHTROOM/Exterior-7.jpg","/04-MIXED USE BUILDING(Commercial)/Compress/LIGHTROOM/Exterior-8.jpg","/04-MIXED USE BUILDING(Commercial)/Compress/LIGHTROOM/Exterior-9.jpg","/04-MIXED USE BUILDING(Commercial)/Compress/LIGHTROOM/Exterior-10.jpg","/04-MIXED USE BUILDING(Commercial)/Compress/LIGHTROOM/Exterior-11.jpg"]',
  false,
  true,
  '00000000-0000-0000-0000-000000000000',
  '2024',
  'Phnom Penh, Cambodia',
  '$48,000',
  'Mixed Use Development Group',
  'Exterior & Interior Visualization & Animation',
  '["Mixed-use commercial and residential spaces","Contemporary architecture","Modern commercial and living environments","Premium exterior finishes","Strategic space utilization","Iconic urban landmark","Sustainable design elements"]',
  '["Creating realistic mixed-use building materials and textures","Achieving optimal lighting for different program types","Showcasing multiple uses effectively","Producing photorealistic animations"]',
  '["High-resolution material mapping and texture studies","Advanced daylight simulation and rendering","Detailed architectural element visualization","Dynamic camera movements for cinematic presentations"]'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  software_used = EXCLUDED.software_used,
  category = EXCLUDED.category,
  cover_image_url = EXCLUDED.cover_image_url,
  gallery_images_json = EXCLUDED.gallery_images_json,
  is_featured = EXCLUDED.is_featured,
  year = EXCLUDED.year,
  location = EXCLUDED.location,
  price = EXCLUDED.price,
  client = EXCLUDED.client,
  scope = EXCLUDED.scope,
  features_json = EXCLUDED.features_json,
  challenges_json = EXCLUDED.challenges_json,
  solutions_json = EXCLUDED.solutions_json;

-- Project: TRIVIENNA MIXED USE BUILDING
INSERT INTO public.projects (
  title, slug, description, software_used, category, cover_image_url, gallery_images_json, 
  is_featured, is_published, created_by, year, location, price, client, scope,
  features_json, challenges_json, solutions_json
) VALUES (
  'TRIVIENNA MIXED USE BUILDING',
  'trivienna-mixed-use-building',
  'A prestigious mixed-use building featuring contemporary architectural design, modern commercial and residential spaces, and innovative urban development. This landmark development showcases sophisticated mixed-use architecture with premium finishes, strategic space utilization, and a dynamic urban presence that creates a vibrant community hub.',
  'D5 Render, Photoshop, Sketchup',
  'Commercial',
  '/03-TRIVIENNA MIXED USE BUILDING(Commercial)/ANIMATION/Clip 14.mp4',
  '[]',
  false,
  true,
  '00000000-0000-0000-0000-000000000000',
  '2024',
  'Phnom Penh, Cambodia',
  '$45,000',
  'TRIVIENNA Development Group',
  'Exterior & Interior Visualization & Animation',
  '["Mixed-use commercial and residential spaces","Contemporary architecture","Modern commercial and living environments","Premium exterior finishes","Strategic space utilization","Iconic urban landmark","Sustainable design elements"]',
  '["Creating realistic mixed-use building materials and textures","Achieving optimal lighting for different program types","Showcasing multiple uses effectively","Producing photorealistic animations"]',
  '["High-resolution material mapping and texture studies","Advanced daylight simulation and rendering","Detailed architectural element visualization","Dynamic camera movements for cinematic presentations"]'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  software_used = EXCLUDED.software_used,
  category = EXCLUDED.category,
  cover_image_url = EXCLUDED.cover_image_url,
  gallery_images_json = EXCLUDED.gallery_images_json,
  is_featured = EXCLUDED.is_featured,
  year = EXCLUDED.year,
  location = EXCLUDED.location,
  price = EXCLUDED.price,
  client = EXCLUDED.client,
  scope = EXCLUDED.scope,
  features_json = EXCLUDED.features_json,
  challenges_json = EXCLUDED.challenges_json,
  solutions_json = EXCLUDED.solutions_json;

-- Project: The Peak Shopping Mall
INSERT INTO public.projects (
  title, slug, description, software_used, category, cover_image_url, gallery_images_json, 
  is_featured, is_published, created_by, year, location, price, client, scope,
  features_json, challenges_json, solutions_json
) VALUES (
  'The Peak Shopping Mall',
  'the-peak-shopping-mall',
  'A prestigious shopping mall featuring contemporary architectural design, modern retail spaces, and dynamic commercial environments. This retail development showcases innovative mall architecture with premium finishes, strategic tenant layouts, and a vibrant commercial atmosphere that attracts shoppers and visitors.',
  'D5 Render, Photoshop, Sketchup',
  'Commercial',
  '/02-The Peak Shopping Mall (Commercial)/Lightroom/Scene 1.jpg',
  '["/02-The Peak Shopping Mall (Commercial)/Lightroom/Scene 1.jpg","/02-The Peak Shopping Mall (Commercial)/Lightroom/Scene 4.jpg","/02-The Peak Shopping Mall (Commercial)/Lightroom/Scene 5.jpg","/02-The Peak Shopping Mall (Commercial)/Lightroom/Scene 6.jpg","/02-The Peak Shopping Mall (Commercial)/Lightroom/Scene 7.jpg","/02-The Peak Shopping Mall (Commercial)/Lightroom/Scene 9.jpg","/02-The Peak Shopping Mall (Commercial)/Lightroom/Scene 10.jpg","/02-The Peak Shopping Mall (Commercial)/Lightroom/Scene 11.jpg","/02-The Peak Shopping Mall (Commercial)/Lightroom/Scene 12.jpg","/02-The Peak Shopping Mall (Commercial)/Lightroom/Scene 13.jpg","/02-The Peak Shopping Mall (Commercial)/Lightroom/Scene 14.jpg","/02-The Peak Shopping Mall (Commercial)/Lightroom/Scene 15.jpg","/02-The Peak Shopping Mall (Commercial)/Lightroom/URBAN 3BUILDING (1 of 8).jpg","/02-The Peak Shopping Mall (Commercial)/Lightroom/URBAN 3BUILDING (1 of 8)1.jpg"]',
  false,
  true,
  '00000000-0000-0000-0000-000000000000',
  '2024',
  'Phnom Penh, Cambodia',
  '$42,000',
  'The Peak Development',
  'Exterior & Interior Visualization & Animation',
  '["Modern retail architecture","Spacious shopping environments","Premium retail finishes","Strategic tenant layouts","Contemporary mall architecture","Dynamic commercial atmosphere","Elegant facade design"]',
  '["Creating realistic retail environments","Showcasing multiple tenant spaces effectively","Achieving optimal lighting for commercial environments","Producing photorealistic animations"]',
  '["Advanced lighting simulation for retail environments","Detailed storefront and retail space visualization","Comprehensive material studies for commercial spaces","Dynamic camera movements for cinematic presentations"]'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  software_used = EXCLUDED.software_used,
  category = EXCLUDED.category,
  cover_image_url = EXCLUDED.cover_image_url,
  gallery_images_json = EXCLUDED.gallery_images_json,
  is_featured = EXCLUDED.is_featured,
  year = EXCLUDED.year,
  location = EXCLUDED.location,
  price = EXCLUDED.price,
  client = EXCLUDED.client,
  scope = EXCLUDED.scope,
  features_json = EXCLUDED.features_json,
  challenges_json = EXCLUDED.challenges_json,
  solutions_json = EXCLUDED.solutions_json;

-- Project: MCA CONDO COMPLEX
INSERT INTO public.projects (
  title, slug, description, software_used, category, cover_image_url, gallery_images_json, 
  is_featured, is_published, created_by, year, location, price, client, scope,
  features_json, challenges_json, solutions_json
) VALUES (
  'MCA CONDO COMPLEX',
  'mca-condo-complex',
  'A prestigious residential condominium complex featuring contemporary architectural design, modern living spaces, and elegant residential environments. This residential development showcases sophisticated condo architecture with premium finishes, strategic space utilization, and a beautiful design that creates an inspiring living environment.',
  'D5 Render, Photoshop, Sketchup',
  'Residential',
  '/01- MCA CONDO COMPLEX (Residential)/Lightroom/Exterior-1.jpg',
  '["/01- MCA CONDO COMPLEX (Residential)/Lightroom/Exterior-1.jpg","/01- MCA CONDO COMPLEX (Residential)/Lightroom/Exterior-2.jpg","/01- MCA CONDO COMPLEX (Residential)/Lightroom/Exterior-3.jpg","/01- MCA CONDO COMPLEX (Residential)/Lightroom/Exterior-4.jpg","/01- MCA CONDO COMPLEX (Residential)/Lightroom/Exterior-5.jpg"]',
  false,
  true,
  '00000000-0000-0000-0000-000000000000',
  '2024',
  'Phnom Penh, Cambodia',
  '$35,000',
  'MCA Development',
  'Exterior Visualization',
  '["Contemporary residential architecture","Modern living spaces","Premium exterior finishes","Elegant condo design","Strategic space utilization","Beautiful landscaping","Sustainable design elements"]',
  '["Creating realistic residential building materials and textures","Achieving optimal lighting for different times of day","Showcasing architectural details accurately"]',
  '["High-resolution material mapping and texture studies","Advanced daylight simulation and rendering","Detailed architectural element visualization"]'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  software_used = EXCLUDED.software_used,
  category = EXCLUDED.category,
  cover_image_url = EXCLUDED.cover_image_url,
  gallery_images_json = EXCLUDED.gallery_images_json,
  is_featured = EXCLUDED.is_featured,
  year = EXCLUDED.year,
  location = EXCLUDED.location,
  price = EXCLUDED.price,
  client = EXCLUDED.client,
  scope = EXCLUDED.scope,
  features_json = EXCLUDED.features_json,
  challenges_json = EXCLUDED.challenges_json,
  solutions_json = EXCLUDED.solutions_json;

-- 6. Seed Testimonials
INSERT INTO public.testimonials (name, role, organization, text)
VALUES (
  'Srey Pich',
  'Creative Director',
  'Luxe Properties',
  'Archtipsbox transformed our vision into stunning photorealistic renders that helped us secure funding for our luxury development project. Their attention to detail and understanding of architectural aesthetics is unmatched.'
)
ON CONFLICT DO NOTHING;
INSERT INTO public.testimonials (name, role, organization, text)
VALUES (
  'Sopheak Ratha',
  'Principal Architect',
  'Thompson & Associates',
  'Working with ANT has been a game-changer for our client presentations. The quality of their visualizations brings our designs to life in ways that traditional drawings simply cannot achieve.'
)
ON CONFLICT DO NOTHING;
INSERT INTO public.testimonials (name, role, organization, text)
VALUES (
  'Sokunthea Lim',
  'Real Estate Developer',
  'Miller Development Group',
  'The team at Archtipsbox delivered exceptional results on our mixed-use development. Their renders were instrumental in pre-selling 80% of our units before construction even began.'
)
ON CONFLICT DO NOTHING;
INSERT INTO public.testimonials (name, role, organization, text)
VALUES (
  'Vichea Chan',
  'Design Director',
  'Urban Design Studio',
  'ANT''s ability to capture lighting, materials, and atmosphere in their visualizations is extraordinary. They''ve become an essential partner in our design process.'
)
ON CONFLICT DO NOTHING;
INSERT INTO public.testimonials (name, role, organization, text)
VALUES (
  'Srey Neang',
  'Marketing Manager',
  'Coastal Resorts Inc.',
  'The photorealistic quality of ANT''s work has elevated our marketing campaigns significantly. Their renders generate genuine excitement and engagement from potential buyers.'
)
ON CONFLICT DO NOTHING;
INSERT INTO public.testimonials (name, role, organization, text)
VALUES (
  'Ratha Kim',
  'Project Manager',
  'Roberts Construction',
  'Archtipsbox consistently delivers high-quality visualizations on time and within budget. Their professionalism and technical expertise make them our go-to partner for all visualization needs.'
)
ON CONFLICT DO NOTHING;

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
