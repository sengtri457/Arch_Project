# Vercel Go-Live Design (Staged Cutover)

Date: 2026-08-25
Status: Approved

## Context

Archtipsbox (Next.js 16 App Router + Supabase + Bunny Stream + Bakong KHQR) moves from
development to production hosting on Vercel with an existing domain that currently serves a
live website. Decisions gathered during brainstorming:

- Domain currently hosts a **live website** -> DNS cutover needs a rollback path.
- Bakong credentials are **production-grade and previously tested** end-to-end.
- The Deno Edge Function (`supabase/functions/bakong-webhook`) is **deployed and registered**
  with the payment provider, so fulfillment has TWO live paths that must stay idempotent:
  1. Client polling `/api/checkout/status` (Bakong OpenAPI `check_transaction_by_md5`).
  2. Provider webhook -> Supabase Edge Function `bakong-webhook`.
- Chosen approach: **staged cutover** - verify on `*.vercel.app` first, then flip DNS.
- All three launch-blocker code fixes are in scope.

## Section 1 - Code fixes (before first deploy)

### 1.1 KHQR amount rounding

`app/api/checkout/route.ts` (~line 115): percentage promo discounts produce amounts such as
`47.4925`. Unrounded cents can be rejected by banking apps and break amount verification.

Fix: after the promo-discount block, clamp to cents:

```ts
checkoutAmount = Math.round(checkoutAmount * 100) / 100
```

### 1.2 Canonical email/certificate links

`app/api/checkout/status/route.ts` (line ~166) and
`app/api/certificates/generate/route.ts` (line ~175) derive link origins from
`new URL(request.url).origin`, which is non-deterministic across Vercel environments.

Fix: prefer the canonical origin, fall back to request origin:

```ts
const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || new URL(request.url).origin
```

### 1.3 Webhook secret hardening

`supabase/functions/bakong-webhook/index.ts` (line ~64): the branch
`if (webhookSecret !== "development" && !verified)` lets any request bypass HMAC
verification when the secret equals `"development"`. Remove the escape hatch so signature
verification is unconditional; deploy a strong random `BAKONG_WEBHOOK_SECRET`.

## Section 2 - Environment matrix

| Location | Variables | Notes |
|---|---|---|
| Vercel (Production + Preview scopes) | Everything from `.env.example`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL=https://<final-domain>`, `NEXT_PUBLIC_USE_LOCAL_MEDIA=false`, `RESEND_API_KEY`, `EMAIL_FROM`, `SUPABASE_SERVICE_ROLE_KEY`, `BAKONG_ACCOUNT_ID/ACCOUNT_TYPE/MERCHANT_ID/MERCHANT_NAME/MERCHANT_CITY/WEBHOOK_SECRET/API_URL/ACCESS_TOKEN`, `BUNNY_STREAM_*` | `NEXT_PUBLIC_BYPASS_EMAILS` stays EMPTY in every scope. Server-only secrets must never be NEXT_PUBLIC-prefixed. |
| Supabase Edge Function secrets (dashboard or CLI) | `BAKONG_WEBHOOK_SECRET` (strong random), `SITE_URL=https://<final-domain>`, `RESEND_API_KEY`, `EMAIL_FROM` | Separate runtime; Vercel env vars do NOT reach Edge Functions. |

## Section 3 - Supabase dashboard changes

No schema or SQL changes required.

1. Auth -> URL Configuration: Site URL = `https://<final-domain>`.
2. Redirect URLs allow-list: add `https://<final-domain>/auth/callback` (+ www variant if www is served). Keep existing entries until cutover succeeds, then prune stale ones.
   - Login redirect target is `${window.location.origin}/auth/callback` (`components/auth-provider.tsx:79`).
3. Email templates inherit Site URL automatically; verify rendered links after saving.

## Section 4 - DNS runbook

1. T-24h before flip: lower TTL on existing A/CNAME records to 300s.
2. In Vercel Domains add apex + www; record the exact DNS values Vercel requests.
3. Flip window (low traffic): replace only the web A/CNAME records with Vercel values.
   MX/TXT/SPF/DKIM records remain untouched (email unaffected).
4. SSL certificates auto-provision after propagation.
5. Rollback = restore previous A/CNAME values.

## Section 5 - Verification gates

Gate 0 (pre-deploy, local):
- `pnpm typecheck && pnpm lint` both exit 0 (Vercel build ignores TS/ESLint errors, so build success alone proves nothing).

Gate 1 (on `*.vercel.app`, prod env vars attached):
- Signup -> confirmation email link opens correct host -> login succeeds.
- Checkout creates `payment_transactions` row -> scan real QR at smallest viable amount ->
  polling confirms `completed` -> enrollment/subscription active -> profile role upgraded ->
  promo counted exactly once -> receipt email links point at canonical domain.
- Lesson playback via `/api/lessons/[lessonId]/video` returns signed HLS URL that plays.
- Certificate generation passes the 100%-watch + all-labs-graded gate.
- `/dashboard` vs `/admin` middleware guards bounce correctly.
- sitemap.xml / robots.txt show final domain.

Gate 2 (post-flip, final domain):
- Repeat auth + checkout smoke test against the apex domain.
- Watch Vercel function logs and Supabase logs for 24h (checkout errors, webhook 401s,
  Bakong token failures).

## Known accepted risks (documented, not fixed now)

- In-memory rate limiting (`lib/rate-limit.ts`) is per serverless instance; revisit with
  Upstash Redis if abuse appears.
- Promo redemption increment is not atomic; webhook + polling racing on the same bill can
  double-count redemptions (enrollment/subscription are protected by upserts). Low impact;
  consider an RPC with atomic increment later.
- `images.unoptimized: true` disables Next image optimization on Vercel (existing choice).

## Out of scope

- Custom Supabase project domain, log drains/Sentry, Upstash Redis, DB schema changes.
