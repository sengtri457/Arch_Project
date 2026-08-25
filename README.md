# Archtipsbox

Architectural visualization portfolio + paid course platform ("Archtipsbox Academy").

Next.js 16 App Router · React 19 · TypeScript strict · Tailwind v4 · shadcn/ui · Supabase (Postgres/RLS, Auth, Storage, Edge Functions) · Bunny Stream HLS · Bakong KHQR payments.

## Commands (pnpm only - `packageManager` is pinned)

    pnpm dev          # next dev
    pnpm build        # next build (+ prune >25MB files from out/)
    pnpm lint         # eslint .        -> must exit 0
    pnpm typecheck    # tsc --noEmit    -> must exit 0

`next.config.mjs` ignores TS/ESLint errors during build, so **verify changes with `pnpm typecheck` and `pnpm lint`, not the build**.

## Environment

Copy `.env.example` to `.env`. Highlights:

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` - required
- `SUPABASE_SERVICE_ROLE_KEY` - server-only, used by checkout/certificates/admin APIs
- `BAKONG_ACCOUNT_ID` / `BAKONG_MERCHANT_NAME` / `BAKONG_MERCHANT_CITY` - KHQR merchant identity
- `BAKONG_API_URL` / `BAKONG_ACCESS_TOKEN` - payment status polling
- `BAKONG_WEBHOOK_SECRET` - HMAC for the Deno webhook
- `BUNNY_STREAM_PULL_ZONE_HOST` / `BUNNY_STREAM_TOKEN_SECURITY_KEY` - signed HLS delivery
- `BUNNY_STREAM_FORMAT=hls` | `mp4`, `BUNNY_STREAM_TTL_SECONDS`, `BUNNY_STREAM_BIND_TOKEN_IP`
- `RESEND_API_KEY` / `EMAIL_FROM` - transactional email (skipped silently when unset)
- `NEXT_PUBLIC_BYPASS_EMAILS` - comma list of test accounts that skip purchase (never set in prod)
- `NEXT_PUBLIC_SITE_URL` - canonical origin for sitemap/robots/OG

## Architecture map

- `app/` routes: portfolio (`/`, `/projects/[id]`), LMS (`/courses/[slug]` landing, `/courses/[slug]/[lessonId]` classroom, `/dashboard`, `/certificates/[id]`), commerce (`/pricing`, `/checkout`), legal (`/terms`, `/privacy`), account, admin portal.
- `app/api/`: `checkout` + `checkout/status` (Bakong), `certificates/generate`, `contact`, `admin/lessons`, `lessons/[lessonId]/video`.
- `middleware.ts` guards `/dashboard*` and `/admin*` via Supabase session + `profiles.role`.
- `lib/supabase/db.ts` - single data-access layer. Every catalog query falls back to mock data in `lib/*-data.ts` when Supabase is empty/unreachable.
- `lib/bunny.ts` - Bunny CDN token signer (HS256, directory tokens for HLS, optional IP locking).
- `lib/email.ts` - Resend REST sender + branded templates.
- `lib/rate-limit.ts` - in-memory sliding window used by all API routes.
- `supabase/migrations/*.sql` - schema + RLS + RPCs, applied by pasting into the Supabase SQL Editor (no local CLI config). Always end DDL with `NOTIFY pgrst, 'reload schema';`.
- `supabase/functions/bakong-webhook/` - Deno Edge Function fulfilling paid orders (deploy: `supabase functions deploy bakong-webhook`).

## Security model (paid content)

1. Lessons table exposes metadata only (column grants); video URLs never leave Postgres through bulk reads.
2. Playback URL is minted per-request by `/api/lessons/[lessonId]/video` after the `get_lesson_video` RPC verifies preview/admin/enrollment/unexpired-subscription inside the database.
3. Bunny tokens are short-lived directory tokens covering playlist + segments; optional IP locking via `BUNNY_STREAM_BIND_TOKEN_IP`.
4. Certificates require 100% watch progress AND every course lab instructor-graded (`exercise_submissions.status = 'graded'`).
5. Test bypass accounts are configured per-environment via `NEXT_PUBLIC_BYPASS_EMAILS`.

## Conventions

- shadcn/ui primitives live in `components/ui`; add new ones with the shadcn CLI.
- Most components under `components/` are client components; server components live mainly in `app/`.
- Path alias `@/*` maps to the repo root.
- `/public` is gitignored - persistent binary assets belong in `app/` (e.g. `app/icon.png`) or cloud storage.
- Backend/frontend contracts and DB shapes are documented in `structure/`.
