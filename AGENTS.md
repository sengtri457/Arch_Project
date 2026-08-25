# AGENTS.md

Archtipsbox: archviz portfolio + paid course platform. Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4, shadcn/ui, Supabase backend, Bunny Stream HLS video, Bakong KHQR payments. Originally v0.app-generated; deployed on Vercel.

## Commands (pnpm only - packageManager pins pnpm@10.10.0)

    pnpm dev          # next dev
    pnpm build        # next build + prune >25MB from out/
    pnpm typecheck    # tsc --noEmit   -> must exit 0
    pnpm lint         # eslint .       -> must exit 0

`next.config.mjs` ignores TS/ESLint errors during `build`, so a passing build proves nothing. Always verify with `pnpm typecheck && pnpm lint`. Both are green as of 2026-08 - keep them that way.

## Gotchas

- `/public` is gitignored (.gitignore line 12). Persistent assets belong in `app/` (favicon = `app/icon.png`) or cloud URLs (`lib/utils.ts getMediaUrl`, base `https://public.archtipsbox.com`).
- Path alias `@/*` maps to the repo root.
- Env vars per `.env.example`; `.env` is loaded locally and by `scratch/` scripts. Server-only secrets: SUPABASE_SERVICE_ROLE_KEY, BAKONG_*, BUNNY_STREAM_TOKEN_SECURITY_KEY, RESEND_API_KEY.
- `scripts/remove-large-files.js` prunes >25MB files from `out/` after build (legacy Cloudflare limit).
- ESLint flat config (`eslint.config.mjs`) scopes `scripts/`, `.agents/`, `supabase/functions/`, `scratch/` out of linting; some React-compiler opinion rules run as warnings by design.

## Architecture

- Routes: portfolio (`/`, `/projects/[id]`), LMS landing + classroom (`/courses/[slug]`, `/courses/[slug]/[lessonId]`), dashboard, certificates, pricing/checkout, account settings, terms/privacy, admin portal with tabs incl. Users management and Submissions detail page at `/admin/submissions/[id]`.
- `middleware.ts`: session guard for `/dashboard*` + `/admin*`; admins bounce from /dashboard to /admin; non-admins bounce from /admin to /.
- **Data layer**: `lib/supabase/db.ts` is the single access layer; catalog queries fall back to mocks in `lib/*-data.ts` when Supabase is empty/unreachable. Keep this pattern for new entities.
- **Video security**: lessons table exposes metadata columns only (column grants); playback URL minted per-request by `/api/lessons/[lessonId]/video` after the `get_lesson_video` SECURITY DEFINER RPC verifies access inside Postgres. Bunny signing in `lib/bunny.ts` (HS256 directory tokens for HLS; MP4 escape hatch via BUNNY_STREAM_FORMAT=mp4). Changing either file requires re-verifying the full purchase->playback flow.
- **Certificates** require 100% watch AND every lab instructor-graded (`exercise_submissions.status='graded'`). Gate lives in `/api/certificates/generate`; classroom auto-retries once per visit when videos are done.
- **Payments**: Bakong KHQR. Fulfillment exists in BOTH `/api/checkout/status` (polling) and the Deno webhook - keep them in parity when editing (promo counting, emails, role upgrade).
- Course access order (`db.checkCourseAccess`): bypass emails (env) -> admin/instructor role -> active enrollment -> unexpired subscription plan hierarchy.

## Supabase workflow

No local CLI config. Schema changes are raw SQL pasted into the remote SQL editor:

- `supabase/migrations/schema.sql` + dated migrations are the source of truth; seed via `supabase/seed.sql` + `database_seed_instructions.md`.
- End DDL with `NOTIFY pgrst, 'reload schema';`.
- RPCs added so far: `get_course_curriculum(slug)` public metadata preview; `get_lesson_video(uuid)` gated video URL; `ensure_lesson_exercise(uuid,text)` student-safe lab autorescue.
- Avatars bucket policies live in migration `20260824000001`.

## Conventions

- shadcn/ui ("new-york") primitives in `components/ui`; add via CLI.
- Most `components/` are client components; server components mainly under `app/`.
- Tailwind v4 CSS-first config in `app/globals.css`; Poppins via next/font.
- react-icons must render through `components/render-icon.tsx` (upstream IconType typing breaks JSX under React 19 types).
- `scratch/` holds ad-hoc DB inspection scripts using the service-role key from `.env`; not part of the app.
- Frontend contracts + DB shape docs live in `structure/` (partially pre-Supabase; trust code first).
