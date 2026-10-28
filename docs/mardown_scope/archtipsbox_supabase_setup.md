# ArchTipsBox — Supabase Setup Guide

This is the Supabase-specific companion to `archtipsbox_scaling_and_lms_implementation_plan-v3.md`. It covers project setup, the Postgres schema (converted from the T-SQL version), auth, storage, and row-level security, so the backend lines up with the scaling plan.

Supabase gives you Postgres, auth, file storage, and realtime in one place, which covers most of what the plan needs without running a separate ASP.NET Core API for everything.

---

## 1. Create the Project

1. Go to [supabase.com](https://supabase.com/) and create a new project.
2. Pick a region close to your users. For a Cambodia/SEA audience, Singapore is usually the best fit.
3. Save the **Project URL**, **anon key**, and **service_role key** somewhere safe. The service_role key is only ever used server-side (in edge functions or your backend), never in the frontend.

---

## 2. Auth: Google Sign-In

Supabase Auth handles the Google OAuth flow for you, so you don't need to verify tokens by hand.

1. In the Supabase dashboard, go to **Authentication → Providers → Google**.
2. Create OAuth credentials in the [Google Cloud Console](https://console.cloud.google.com/), and add Supabase's callback URL as an authorized redirect URI:
   `https://<your-project-ref>.supabase.co/auth/v1/callback`
3. Paste the Google Client ID and Client Secret into the Supabase provider settings and enable it.
4. On the frontend, call `supabase.auth.signInWithOAuth({ provider: 'google' })`. Supabase handles the redirect, token exchange, and session for you.

Supabase Auth already gives you a `auth.users` table with the Google identity attached. You don't need to build your own token verification, that part from the original plan (checking against Google's public keys by hand) is no longer needed. You just extend `auth.users` with a `profiles` table for your app-specific fields (role, avatar, etc.).

---

## 3. Database Schema (Postgres)

This is the same data model as the SQL Server version in the main plan, converted to Postgres and adjusted to work with Supabase Auth (`auth.users` instead of a custom `Users` table).

```SQL
-- Enable UUID generation
create extension if not exists "pgcrypto";

-- 1. Profiles (extends Supabase's built-in auth.users)
create table profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text not null,
    role text not null check (role in ('student', 'instructor', 'admin')) default 'student',
    avatar_url text,
    is_active boolean default true,
    created_at timestamptz default now()
);

-- 2. Subscription Plans
create table subscription_plans (
    plan_id serial primary key,
    plan_code text unique not null, -- 'FREE', 'STUDENT_PRO', 'MENTORSHIP'
    name text not null,
    price_usd numeric(10,2) not null,
    billing_interval text not null, -- 'monthly', 'yearly'
    features_json jsonb not null default '{}',
    is_active boolean default true
);

-- 3. Payments & Bakong KHQR Transactions
create table payment_transactions (
    transaction_id uuid primary key default gen_random_uuid(),
    user_id uuid not null references profiles(id),
    plan_id int not null references subscription_plans(plan_id),
    payment_method text not null, -- 'bakong_khqr', 'stripe', 'aba_pay'
    bill_number text unique not null,
    amount numeric(12,2) not null,
    currency text not null default 'USD', -- 'USD' or 'KHR'
    khqr_payload text,
    external_tx_hash text,
    payment_status text not null check (payment_status in ('pending', 'completed', 'failed', 'expired')),
    created_at timestamptz default now(),
    completed_at timestamptz
);

create table user_subscriptions (
    subscription_id uuid primary key default gen_random_uuid(),
    user_id uuid not null references profiles(id),
    plan_id int not null references subscription_plans(plan_id),
    status text not null, -- 'active', 'canceled', 'past_due', 'expired'
    current_period_start timestamptz not null,
    current_period_end timestamptz not null,
    last_transaction_id uuid references payment_transactions(transaction_id)
);

-- 4. Projects & Showcase CMS
create table projects (
    project_id uuid primary key default gen_random_uuid(),
    title text not null,
    slug text unique not null,
    description text,
    software_used text, -- 'SketchUp, D5 Render, Photoshop'
    category text, -- 'Interior', 'Exterior', 'Commercial', 'Landscape'
    cover_image_url text not null,
    gallery_images_json jsonb default '[]',
    before_after_render_json jsonb, -- { "raw": "url1", "final": "url2" }
    downloadable_asset_url text,
    required_plan_id int references subscription_plans(plan_id), -- null = public
    is_featured boolean default false,
    is_published boolean default true,
    created_by uuid not null references profiles(id),
    created_at timestamptz default now()
);

-- 5. Courses, Lessons, Exercises
create table courses (
    course_id uuid primary key default gen_random_uuid(),
    title text not null,
    slug text unique not null,
    description text,
    thumbnail_url text,
    required_plan_id int references subscription_plans(plan_id),
    difficulty text check (difficulty in ('beginner', 'intermediate', 'advanced')),
    software_used text,
    is_published boolean default false,
    created_at timestamptz default now()
);

create table lessons (
    lesson_id uuid primary key default gen_random_uuid(),
    course_id uuid not null references courses(course_id) on delete cascade,
    title text not null,
    video_source_type text not null, -- 'bunny_stream', 'cloudflare_stream', 'vimeo', 'youtube'
    video_external_id text not null,
    duration_minutes int not null,
    downloadable_asset_url text,
    order_index int not null,
    is_preview boolean default false
);

create table exercises (
    exercise_id uuid primary key default gen_random_uuid(),
    lesson_id uuid not null references lessons(lesson_id) on delete cascade,
    title text not null,
    brief_prompt text not null,
    starter_asset_url text,
    max_score int default 100
);

create table exercise_submissions (
    submission_id uuid primary key default gen_random_uuid(),
    exercise_id uuid not null references exercises(exercise_id),
    student_id uuid not null references profiles(id),
    submission_files_json jsonb not null default '[]',
    status text not null check (status in ('submitted', 'in_review', 'graded', 'revision_requested')),
    score int,
    instructor_feedback text,
    submitted_at timestamptz default now(),
    reviewed_at timestamptz
);

-- 6. Course Enrollment & Watch History (admin-visible student history)
create table course_enrollments (
    enrollment_id uuid primary key default gen_random_uuid(),
    student_id uuid not null references profiles(id),
    course_id uuid not null references courses(course_id),
    enrolled_at timestamptz default now(),
    status text not null check (status in ('active', 'completed', 'dropped')) default 'active',
    last_accessed_at timestamptz,
    completed_at timestamptz,
    unique (student_id, course_id) -- one enrollment row per student per course
);

create table lesson_progress (
    progress_id uuid primary key default gen_random_uuid(),
    student_id uuid not null references profiles(id),
    lesson_id uuid not null references lessons(lesson_id),
    course_id uuid not null references courses(course_id), -- denormalized, makes admin queries simpler
    watched_seconds int not null default 0,
    is_completed boolean not null default false,
    last_watched_at timestamptz default now(),
    completed_at timestamptz,
    unique (student_id, lesson_id) -- one progress row per student per lesson
);
```

`course_enrollments` tracks which courses a student is signed up for and whether they finished. `lesson_progress` tracks it at the lesson level: how far they got, whether it's marked complete, and when they last watched. Together, this is what powers a "student history" view in the admin panel, without this, there's no way to see any of that.

### Auto-create a profile on signup

Since `auth.users` is managed by Supabase, use a trigger to create a matching row in `profiles` whenever someone signs in with Google for the first time:

```SQL
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---

## 4. Row-Level Security (RLS)

Supabase enables RLS per table, and it's the main way you control who can read or write what. Turn it on for every table above, then add policies. A few examples to start from:

```SQL
alter table profiles enable row level security;
alter table projects enable row level security;
alter table courses enable row level security;
alter table lessons enable row level security;
alter table exercise_submissions enable row level security;
alter table course_enrollments enable row level security;
alter table lesson_progress enable row level security;

-- Anyone can read their own profile; admins can read all
create policy "Users read own profile"
  on profiles for select
  using (auth.uid() = id);

-- Published projects are public; unpublished ones are admin/instructor only
create policy "Public can view published projects"
  on projects for select
  using (is_published = true);

create policy "Admins manage projects"
  on projects for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'instructor'))
  );

-- Students can only see their own submissions; instructors see all for their courses
create policy "Students view own submissions"
  on exercise_submissions for select
  using (student_id = auth.uid());

create policy "Students insert own submissions"
  on exercise_submissions for insert
  with check (student_id = auth.uid());

create policy "Instructors and admins view all submissions"
  on exercise_submissions for select
  using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'instructor'))
  );
```

Lock down `lessons` and course content behind subscription checks too, for example, only returning rows where `required_plan_id` matches an active subscription for that user, or where `is_preview = true`.

For enrollment and progress, students should only see and write their own rows, while admins and instructors need read access to everyone's:

```SQL
-- Students manage their own enrollments
create policy "Students view own enrollments"
  on course_enrollments for select
  using (student_id = auth.uid());

create policy "Students create own enrollments"
  on course_enrollments for insert
  with check (student_id = auth.uid());

-- Students update their own watch progress (the frontend pings this as they watch)
create policy "Students manage own lesson progress"
  on lesson_progress for all
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

-- Admins and instructors see everyone's history
create policy "Admins view all enrollments"
  on course_enrollments for select
  using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'instructor'))
  );

create policy "Admins view all lesson progress"
  on lesson_progress for select
  using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'instructor'))
  );
```

### A view for the admin panel

This gives you a ready-to-query per-student, per-course summary, so the admin UI doesn't have to compute completion percentages on the frontend:

```SQL
create view student_course_history as
select
    e.student_id,
    p.full_name,
    e.course_id,
    c.title as course_title,
    e.status as enrollment_status,
    e.enrolled_at,
    e.last_accessed_at,
    count(lp.lesson_id) filter (where lp.lesson_id is not null) as lessons_started,
    count(lp.lesson_id) filter (where lp.is_completed) as lessons_completed,
    (select count(*) from lessons where course_id = e.course_id) as total_lessons
from course_enrollments e
join profiles p on p.id = e.student_id
join courses c on c.course_id = e.course_id
left join lesson_progress lp on lp.student_id = e.student_id and lp.course_id = e.course_id
group by e.student_id, p.full_name, e.course_id, c.title, e.status, e.enrolled_at, e.last_accessed_at;
```

Apply the same admin-only RLS logic to this view (or query it through a security-definer function) so students can't read other students' rows through it.

---

## 5. Storage: Assets, Images, and Course Files

Supabase Storage handles the images and downloadable files. Video itself should still go through Bunny.net or Cloudflare Stream as covered in the main plan; Supabase Storage isn't built for protected video streaming with watermarking and signed short-lived URLs.

Buckets to set up:

| Bucket                 | Purpose                               | Public?                     |
| :--------------------- | :------------------------------------ | :-------------------------- |
| `project-covers`       | Cover images for the project showcase | Public                      |
| `project-galleries`    | Before/after and gallery renders      | Public                      |
| `course-thumbnails`    | Course cover art                      | Public                      |
| `downloadable-assets`  | `.skp`, `.d5a`, HDRI, texture packs   | Private, gated by plan      |
| `exercise-submissions` | Student uploads                       | Private, gated by ownership |
| `avatars`              | User profile pictures                 | Public                      |

For the private buckets, use Supabase's signed URLs (`createSignedUrl`) so a download link only works for a short window and only for someone who actually has access, similar in spirit to the signed streaming tokens described for video in the main plan.

---

## 6. Bakong KHQR Webhook via Edge Functions

Supabase Edge Functions (Deno-based) are a good fit for the Bakong webhook endpoint, since it needs to run server-side and touch the service_role key.

1. `supabase functions new bakong-webhook`
2. In the function, verify the incoming signature/hash from the payment provider before trusting the payload.
3. On success, insert into `payment_transactions` and update `user_subscriptions` using the service_role client (this bypasses RLS, which is expected for a trusted server-side webhook).
4. Deploy with `supabase functions deploy bakong-webhook` and set the URL as your webhook endpoint with the Bakong integration provider.

Keep the KHQR generation logic in a separate function (or the same one, different route) so the frontend can call it to get a QR code before payment, and the webhook function only handles the confirmation side.

---

## 7. Realtime for Payment Status

Instead of polling for payment status like the original plan describes, you can use Supabase Realtime to push the update straight to the checkout page:

```JavaScript
supabase
  .channel('payment-status')
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'payment_transactions', filter: `transaction_id=eq.${transactionId}` },
    (payload) => {
      if (payload.new.payment_status === 'completed') {
        // unlock the paywall in the UI
      }
    }
  )
  .subscribe();
```

This removes the need for 3-second polling from the frontend entirely.

---

## 8. Environment Variables

Keep these separated between frontend and server-side/edge function contexts:

**Frontend (safe to expose):**

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

**Server-side / Edge Functions only (never expose):**

- `SUPABASE_SERVICE_ROLE_KEY`
- `BAKONG_WEBHOOK_SECRET`
- `BUNNY_STREAM_API_KEY` / `CLOUDFLARE_STREAM_API_TOKEN`

---

## 9. Where This Fits in the Roadmap

Matching the 12-week plan from the main document:

- **Weeks 1–2:** Set up the Supabase project, enable Google OAuth, run the schema migration above, turn on RLS.
- **Weeks 3–4:** Set up storage buckets, wire up Bunny/Cloudflare for video (outside Supabase).
- **Weeks 5–6:** Build the Bakong edge functions, connect Realtime for payment status.
- **Weeks 7–10:** Build the CMS and student dashboard against this schema.
- **Weeks 11–12:** Review RLS policies and storage permissions as part of the security audit before launch.
