const fs = require('fs');
const path = require('path');

const tempDir = path.join(__dirname, '../supabase/.temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Convert TS files to temporary CommonJS JS files by extracting the export const declarations
function convertTsToJs(srcPath, destPath, exportName) {
  const content = fs.readFileSync(srcPath, 'utf8');
  const index = content.indexOf(`export const ${exportName}`);
  if (index === -1) {
    throw new Error(`Could not find export const ${exportName} in ${srcPath}`);
  }
  let arrayContent = content.substring(index);
  // Replace "export const name: Type[] =" with "const name ="
  arrayContent = arrayContent.replace(/export\s+const\s+(\w+)(:\s*[\w<>|\[\]]+)?\s*=/g, 'const $1 =');
  // Append explicit module exports
  arrayContent += `\nmodule.exports.${exportName} = ${exportName};`;
  fs.writeFileSync(destPath, arrayContent, 'utf8');
}

// Helper to escape strings for SQL
function sqlEscape(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

// Helper to serialize objects to JSON and escape for SQL JSONB
function jsonEscape(obj) {
  if (obj === null || obj === undefined) return 'NULL';
  return `'${JSON.stringify(obj).replace(/'/g, "''")}'`;
}

try {
  console.log('Converting TS files to temporary JS files...');
  convertTsToJs(path.join(__dirname, '../lib/courses-data.ts'), path.join(tempDir, 'courses-data.js'), 'courses');
  convertTsToJs(path.join(__dirname, '../lib/projects-data.ts'), path.join(tempDir, 'projects-data.js'), 'projects');
  convertTsToJs(path.join(__dirname, '../lib/testimonials-data.ts'), path.join(tempDir, 'testimonials-data.js'), 'testimonials');

  console.log('Loading data...');
  const { courses } = require(path.join(tempDir, 'courses-data.js'));
  const { projects } = require(path.join(tempDir, 'projects-data.js'));
  const { testimonials } = require(path.join(tempDir, 'testimonials-data.js'));

  let sql = `-- Supabase Database Seeding File
-- Generated automatically from static TypeScript data files
-- Date: ${new Date().toISOString()}

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
`;

  const courseUuids = {
    'd5-masterclass': 'd5c66d93-3d02-466d-a77b-6c6a46cd4cf7',
    'enscape-masterclass': 'eb919c63-4712-4fb3-81b4-25e2e8b2cc1c',
    'indesign-masterclass': 'e6c66d93-3d02-466d-a77b-6c6a46cd4cf7',
    'photoshop-masterclass': 'fa919c63-4712-4fb3-81b4-25e2e8b2cc1c'
  };

  const planIds = {
    'd5-masterclass': 2,
    'enscape-masterclass': 2,
    'indesign-masterclass': 2,
    'photoshop-masterclass': 3
  };

  const difficulties = {
    'd5-masterclass': 'intermediate',
    'enscape-masterclass': 'beginner',
    'indesign-masterclass': 'beginner',
    'photoshop-masterclass': 'advanced'
  };

  courses.forEach(course => {
    const courseId = courseUuids[course.id] || `gen_random_uuid()`;
    const difficulty = difficulties[course.id] || 'beginner';
    const planId = planIds[course.id] || 2;
    const softwareUsed = course.category === 'Rendering' 
      ? (course.id.includes('d5') ? 'D5 Render' : 'Enscape')
      : (course.id.includes('indesign') ? 'Adobe InDesign' : 'Adobe Photoshop');
    const priceNum = parseFloat(course.price.replace(/[^0-9.]/g, '')) || 49.99;

    sql += `\n-- Course: ${course.title}
INSERT INTO public.courses (course_id, title, slug, description, thumbnail_url, required_plan_id, difficulty, software_used, price, category, duration, features, instructor, students, lessons, is_published)
VALUES (
  ${sqlEscape(courseId)},
  ${sqlEscape(course.title)},
  ${sqlEscape(course.id)},
  ${sqlEscape(course.description)},
  ${sqlEscape(course.image)},
  ${planId},
  ${sqlEscape(difficulty)},
  ${sqlEscape(softwareUsed)},
  ${priceNum},
  ${sqlEscape(course.category)},
  ${sqlEscape(course.duration)},
  ${jsonEscape(course.features)},
  ${sqlEscape(course.instructor)},
  ${course.students},
  ${course.lessons},
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
`;
  });

  sql += `\n-- 4. Seed Lessons & Exercises for Courses\n`;

  // Define structured lessons and exercises based on database_seed_instructions.md & dummies
  const allLessons = [
    // InDesign Masterclass
    {
      lesson_id: '48a30129-234b-4b2a-8d19-450f612d4cf7',
      course_id: courseUuids['indesign-masterclass'],
      title: '01. Introduction to InDesign Grids and Document Setup',
      video_source_type: 'youtube',
      video_external_id: 'https://www.w3schools.com/html/movie.mp4',
      duration_minutes: 10,
      order_index: 1,
      is_preview: true,
      exercise: {
        exercise_id: 'e6a30129-234b-4b2a-8d19-450f612d4cf7',
        title: 'Practice Task: Document Setup',
        brief_prompt: 'Set up a 12-page presentation document using a multi-column grid, and upload your InDesign package link.',
        max_score: 100
      }
    },
    {
      lesson_id: 'b99a6cf7-7756-42d4-bb34-8c6a0c021c32',
      course_id: courseUuids['indesign-masterclass'],
      title: '02. Portfolio Layout & Typographic Hierarchy',
      video_source_type: 'youtube',
      video_external_id: 'https://www.w3schools.com/html/movie.mp4',
      duration_minutes: 15,
      order_index: 2,
      is_preview: false,
      exercise: {
        exercise_id: 'eb9a6cf7-7756-42d4-bb34-8c6a0c021c32',
        title: 'Practice Task: Portfolio Layout',
        brief_prompt: 'Design a 2-page landscape spread displaying your projects, paste your OneDrive or Google Drive layout links.',
        max_score: 100
      }
    },
    // Photoshop Masterclass
    {
      lesson_id: 'cdcf219d-778e-4a4b-ba2d-45f8e6c62c93',
      course_id: courseUuids['photoshop-masterclass'],
      title: '01. Post-production Workspace & Layer Structures',
      video_source_type: 'youtube',
      video_external_id: 'https://www.w3schools.com/html/movie.mp4',
      duration_minutes: 12,
      order_index: 1,
      is_preview: true,
      exercise: {
        exercise_id: 'ecdf219d-778e-4a4b-ba2d-45f8e6c62c93',
        title: 'Practice Task: Workspace & Layers',
        brief_prompt: 'Configure adjustment layers, masking channels, and sky replacement layers, and submit your PSD cloud link.',
        max_score: 100
      }
    },
    {
      lesson_id: '01ab78c3-4d4b-4cde-8219-c6e6a4b3d029',
      course_id: courseUuids['photoshop-masterclass'],
      title: '02. Non-Destructive Color Adjustments & Filters',
      video_source_type: 'youtube',
      video_external_id: 'https://www.w3schools.com/html/movie.mp4',
      duration_minutes: 18,
      order_index: 2,
      is_preview: false,
      exercise: {
        exercise_id: 'e1ab78c3-4d4b-4cde-8219-c6e6a4b3d029',
        title: 'Practice Task: Color Adjustments',
        brief_prompt: 'Apply camera raw filters, look-up tables (LUTs), and vignette lighting setups, and submit your final render output image link.',
        max_score: 100
      }
    },
    // D5 Masterclass
    {
      lesson_id: 'd5d30129-234b-4b2a-8d19-450f612d4cf7',
      course_id: courseUuids['d5-masterclass'],
      title: '01. Getting Started with D5 Render Interface',
      video_source_type: 'youtube',
      video_external_id: 'https://www.w3schools.com/html/movie.mp4',
      duration_minutes: 15,
      order_index: 1,
      is_preview: true,
      exercise: {
        exercise_id: 'd5e30129-234b-4b2a-8d19-450f612d4cf7',
        title: 'Practice Task: Interface & Import',
        brief_prompt: 'Import your SketchUp model into D5, configure the base camera view, and export a preview rendering.',
        max_score: 100
      }
    },
    {
      lesson_id: 'd59a6cf7-7756-42d4-bb34-8c6a0c021c32',
      course_id: courseUuids['d5-masterclass'],
      title: '02. Advanced Lighting & Environmental Controls',
      video_source_type: 'youtube',
      video_external_id: 'https://www.w3schools.com/html/movie.mp4',
      duration_minutes: 20,
      order_index: 2,
      is_preview: false,
      exercise: {
        exercise_id: 'd5ea6cf7-7756-42d4-bb34-8c6a0c021c32',
        title: 'Practice Task: Custom Lighting Setup',
        brief_prompt: 'Create a sunset lighting setup using HDRI and custom artificial lights. Submit the final rendering.',
        max_score: 100
      }
    },
    // Enscape Masterclass
    {
      lesson_id: 'ebd30129-234b-4b2a-8d19-450f612d4cf7',
      course_id: courseUuids['enscape-masterclass'],
      title: '01. Introduction to Enscape Real-Time Workflow',
      video_source_type: 'youtube',
      video_external_id: 'https://www.w3schools.com/html/movie.mp4',
      duration_minutes: 12,
      order_index: 1,
      is_preview: true,
      exercise: {
        exercise_id: 'ebe30129-234b-4b2a-8d19-450f612d4cf7',
        title: 'Practice Task: Live Link Setup',
        brief_prompt: 'Establish the live link between SketchUp and Enscape, set up two scenes, and take screenshots of the output.',
        max_score: 100
      }
    },
    {
      lesson_id: 'eb9a6cf7-7756-42d4-bb34-8c6a0c021c32',
      course_id: courseUuids['enscape-masterclass'],
      title: '02. Material Configuration & Asset Placement',
      video_source_type: 'youtube',
      video_external_id: 'https://www.w3schools.com/html/movie.mp4',
      duration_minutes: 18,
      order_index: 2,
      is_preview: false,
      exercise: {
        exercise_id: 'ebea6cf7-7756-42d4-bb34-8c6a0c021c32',
        title: 'Practice Task: Materials & Assets',
        brief_prompt: 'Configure bump maps, roughness, and glass reflections. Populate the scene with library assets and export a render.',
        max_score: 100
      }
    }
  ];

  const courseUuidToSlug = {};
  for (const [slug, uuid] of Object.entries(courseUuids)) {
    courseUuidToSlug[uuid] = slug;
  }

  allLessons.forEach(lesson => {
    const courseSlug = courseUuidToSlug[lesson.course_id];
    const courseIdExpr = courseSlug 
      ? `(SELECT course_id FROM public.courses WHERE slug = ${sqlEscape(courseSlug)})`
      : sqlEscape(lesson.course_id);

    sql += `\n-- Lesson: ${lesson.title}
INSERT INTO public.lessons (lesson_id, course_id, title, video_source_type, video_external_id, duration_minutes, order_index, is_preview)
VALUES (
  ${sqlEscape(lesson.lesson_id)},
  ${courseIdExpr},
  ${sqlEscape(lesson.title)},
  ${sqlEscape(lesson.video_source_type)},
  ${sqlEscape(lesson.video_external_id)},
  ${lesson.duration_minutes},
  ${lesson.order_index},
  ${lesson.is_preview}
)
ON CONFLICT (lesson_id) DO UPDATE SET
  title = EXCLUDED.title,
  video_source_type = EXCLUDED.video_source_type,
  video_external_id = EXCLUDED.video_external_id,
  duration_minutes = EXCLUDED.duration_minutes,
  order_index = EXCLUDED.order_index,
  is_preview = EXCLUDED.is_preview;
`;

    if (lesson.exercise) {
      sql += `INSERT INTO public.exercises (exercise_id, lesson_id, title, brief_prompt, max_score)
VALUES (
  ${sqlEscape(lesson.exercise.exercise_id)},
  ${sqlEscape(lesson.lesson_id)},
  ${sqlEscape(lesson.exercise.title)},
  ${sqlEscape(lesson.exercise.brief_prompt)},
  ${lesson.exercise.max_score}
)
ON CONFLICT (exercise_id) DO UPDATE SET
  title = EXCLUDED.title,
  brief_prompt = EXCLUDED.brief_prompt,
  max_score = EXCLUDED.max_score;
`;
    }
  });

  sql += `\n-- 5. Seed Projects\n`;

  // We make the first 8 projects featured to fit WorksGallery expectations
  projects.forEach((proj, idx) => {
    const isFeatured = idx < 8;
    const softwareUsed = Array.isArray(proj.details.software) 
      ? proj.details.software.join(', ')
      : 'SketchUp, D5 Render, Photoshop';

    sql += `\n-- Project: ${proj.title}
INSERT INTO public.projects (
  title, slug, description, software_used, category, cover_image_url, gallery_images_json, 
  is_featured, is_published, created_by, year, location, price, client, scope,
  features_json, challenges_json, solutions_json
) VALUES (
  ${sqlEscape(proj.title)},
  ${sqlEscape(proj.id)},
  ${sqlEscape(proj.description)},
  ${sqlEscape(softwareUsed)},
  ${sqlEscape(proj.category)},
  ${sqlEscape(proj.image)},
  ${jsonEscape(proj.images)},
  ${isFeatured},
  true,
  '00000000-0000-0000-0000-000000000000',
  ${sqlEscape(proj.year)},
  ${sqlEscape(proj.location)},
  ${sqlEscape(proj.price)},
  ${sqlEscape(proj.details.client)},
  ${sqlEscape(proj.details.scope)},
  ${jsonEscape(proj.details.features || [])},
  ${jsonEscape(proj.details.challenges || [])},
  ${jsonEscape(proj.details.solutions || [])}
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
`;
  });

  sql += `\n-- 6. Seed Testimonials\n`;

  testimonials.forEach(t => {
    sql += `INSERT INTO public.testimonials (name, role, organization, text)
VALUES (
  ${sqlEscape(t.name)},
  ${sqlEscape(t.role)},
  ${sqlEscape(t.organization)},
  ${sqlEscape(t.text)}
)
ON CONFLICT DO NOTHING;
`;
  });

  sql += `\n-- Notify schema reload\nNOTIFY pgrst, 'reload schema';\n`;

  fs.writeFileSync(path.join(__dirname, '../supabase/seed.sql'), sql, 'utf8');
  console.log('Seeding SQL successfully written to supabase/seed.sql!');

} catch (err) {
  console.error('Error during seed generation:', err);
  process.exit(1);
} finally {
  // Clean up temp files
  try {
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir);
      for (const file of files) {
        fs.unlinkSync(path.join(tempDir, file));
      }
      fs.rmdirSync(tempDir);
    }
  } catch (cleanErr) {
    console.warn('Failed to clean up temp files:', cleanErr);
  }
}
