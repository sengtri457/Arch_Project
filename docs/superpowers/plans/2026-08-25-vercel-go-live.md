# Vercel Go-Live Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Archtipsbox to Vercel production behind the existing domain via a staged cutover, with three launch-blocker code fixes applied first.

**Architecture:** Three small code fixes (KHQR amount rounding, canonical link origin, webhook HMAC hardening) verified by typecheck/lint, followed by operator tasks: Vercel env setup, Supabase Auth URL config, Edge Function secret rotation, staged DNS flip with rollback.

**Tech Stack:** Next.js 16 App Router, @supabase/supabase-js + @supabase/ssr, bakong-khqr, Deno Edge Functions, Vercel, Bunny Stream (unchanged).

**Spec:** `docs/superpowers/specs/2026-08-25-vercel-go-live-design.md`

## Global Constraints

- Package manager is **pnpm only** (`packageManager` pins pnpm@10.10.0).
- Verification for every code task: `pnpm typecheck && pnpm lint` must both exit 0. There is no unit-test framework in this repo (no test script in package.json); AGENTS.md defines typecheck+lint as the gate.
- `NEXT_PUBLIC_BYPASS_EMAILS` stays EMPTY/unset in every environment.
- Server-only secrets (`SUPABASE_SERVICE_ROLE_KEY`, `BAKONG_*`, `BUNNY_STREAM_TOKEN_SECURITY_KEY`, `RESEND_API_KEY`) must never get a `NEXT_PUBLIC_` prefix and must never be committed.
- Replace every occurrence of `<final-domain>` in this plan with the user's actual domain before executing operator tasks.
- Commits happen only if the user approves committing during execution; otherwise leave changes uncommitted.
- `supabase/functions/` is outside ESLint scope (flat config), so Task 3's verification is inspection + successful Edge Function deploy, not lint.

---

### Task 1: Round checkout amount to cents after promo discount

**Files:**
- Modify: `app/api/checkout/route.ts` (promo block ends at line ~121)

**Interfaces:**
- Consumes: existing `checkoutAmount` number mutated by promo logic above.
- Produces: `checkoutAmount` guaranteed to have at most 2 decimal places when passed to `new IndividualInfo(... { amount: checkoutAmount ... })` later in the same function.

- [ ] **Step 1: Insert the clamp**

In `app/api/checkout/route.ts`, locate the end of the promo-code block (immediately after the closing brace of `if (promoCode) { ... }`, currently line ~121, just before the `// 5. Generate unique bill number` comment). Insert:

```ts
    // Clamp to whole cents so KHQR never encodes >2-decimal amounts
    checkoutAmount = Math.round(checkoutAmount * 100) / 100
```

The surrounding code must look like:

```ts
      }
    }

    // Clamp to whole cents so KHQR never encodes >2-decimal amounts
    checkoutAmount = Math.round(checkoutAmount * 100) / 100

    // 5. Generate unique bill number
    const billNumber = `BILL-${Date.now()}-${Math.floor(Math.random() * 1000)}`
```

- [ ] **Step 2: Verify placement and types**

Run: `pnpm typecheck && pnpm lint`
Expected: both exit 0.

Run: `rg -n "Math.round\(checkoutAmount" app/api/checkout/route.ts`
Expected: exactly one match between the promo block and the bill-number generation.

- [ ] **Step 3: Commit (only if user approved committing)**

```bash
git add app/api/checkout/route.ts
git commit -m "fix(checkout): clamp KHQR amount to whole cents after promo"
```

---

### Task 2: Canonical origin for receipt + certificate email links

**Files:**
- Modify: `app/api/checkout/status/route.ts:166`
- Modify: `app/api/certificates/generate/route.ts:175`

**Interfaces:**
- Consumes: env var `NEXT_PUBLIC_SITE_URL` (optional string, no trailing slash guaranteed by normalization).
- Produces: local `const origin: string` used downstream for `${origin}/dashboard`, `${origin}/courses/${slug}`, `${origin}/certificates/${id}` links. Downstream usage unchanged.

- [ ] **Step 1: Edit checkout status route**

In `app/api/checkout/status/route.ts`, replace line ~166:

```ts
        const origin = new URL(request.url).origin
```

with:

```ts
        const origin =
          process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
          new URL(request.url).origin
```

(Keep its indentation inside the `try` block around the email section.)

- [ ] **Step 2: Edit certificate route**

In `app/api/certificates/generate/route.ts`, replace line ~175:

```ts
      const origin = new URL(request.url).origin
```

with:

```ts
      const origin =
        process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
        new URL(request.url).origin
```

- [ ] **Step 3: Verify both files**

Run: `pnpm typecheck && pnpm lint`
Expected: both exit 0.

Run: `rg -n "NEXT_PUBLIC_SITE_URL\?\.replace" app/api`
Expected: two matches — one in `checkout/status/route.ts`, one in `certificates/generate/route.ts`.

- [ ] **Step 4: Commit (only if user approved committing)**

```bash
git add app/api/checkout/status/route.ts app/api/certificates/generate/route.ts
git commit -m "fix(emails): prefer NEXT_PUBLIC_SITE_URL origin for payment/certificate links"
```

---

### Task 3: Remove webhook signature bypass in Bakong Edge Function

**Files:**
- Modify: `supabase/functions/bakong-webhook/index.ts:63-73`

**Interfaces:**
- Consumes: `webhookSecret = Deno.env.get("BAKONG_WEBHOOK_SECRET")` (unchanged).
- Produces: unconditional HMAC rejection — any invalid signature returns 401 regardless of secret value.

- [ ] **Step 1: Delete the escape hatch**

Replace lines ~63-73 of `supabase/functions/bakong-webhook/index.ts`:

```ts
    // For testing/development, you can relax verification checks if webhookSecret is set to 'development'
    if (webhookSecret !== "development" && !verified) {
      console.warn("Invalid webhook signature verified.");
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized Signature" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
```

with:

```ts
    if (!verified) {
      console.warn("Invalid webhook signature.");
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized Signature" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
```

- [ ] **Step 2: Confirm no bypass remains**

Run: `rg -n "development" supabase/functions/bakong-webhook/index.ts`
Expected: no matches.

- [ ] **Step 3: Deploy the updated function (operator action)**

Either:
```bash
supabase functions deploy bakong-webhook --project-ref <project-ref>
```
or paste the updated function body into Dashboard -> Edge Functions -> bakong-webhook and save.

Before/at this step, set the Edge Function secrets (Dashboard -> Edge Functions -> Secrets, or CLI):
```
BAKONG_WEBHOOK_SECRET=<long random string, e.g. openssl rand -hex 32>
SITE_URL=https://<final-domain>
RESEND_API_KEY=<existing key>
EMAIL_FROM=Archtipsbox <noreply@<final-domain>>
```

- [ ] **Step 4: Commit repo change (only if user approved committing)**

```bash
git add supabase/functions/bakong-webhook/index.ts
git commit -m "fix(webhook): require valid HMAC signature unconditionally"
```

Note: this file is outside ESLint scope; `pnpm lint` will not check it. Repo-wide gates still run in Task 4 Step 2.

---

### Task 4: Vercel project + environment variables (operator)

**Files:**
- None (dashboard/CLI operations).

**Interfaces:**
- Consumes: values from `.env.example` and the user's real credentials from local `.env`.
- Produces: a deployed Vercel project reachable at `https://<project>.vercel.app` with Production + Preview env scopes fully populated.

- [ ] **Step 1: Run final local gates**

Run: `pnpm typecheck && pnpm lint`
Expected: both exit 0 (Vercel build ignores TS/ESLint errors, so these local runs are mandatory).

- [ ] **Step 2: Import repo into Vercel**

Vercel dashboard -> Add New Project -> import the Git repository. Framework preset auto-detects Next.js; build command `pnpm build`, output default (serverless, NOT static export).

- [ ] **Step 3: Set environment variables (Production AND Preview scopes)**

| Key | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | existing value from `.env` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | existing anon key |
| `NEXT_PUBLIC_SITE_URL` | `https://<final-domain>` |
| `NEXT_PUBLIC_USE_LOCAL_MEDIA` | `false` |
| `NEXT_PUBLIC_BYPASS_EMAILS` | **leave unset entirely** |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key |
| `RESEND_API_KEY` | Resend API key |
| `EMAIL_FROM` | `Archtipsbox <noreply@<final-domain>>` |
| `BAKONG_ACCOUNT_ID` / `BAKONG_ACCOUNT_TYPE` | merchant values |
| `BAKONG_MERCHANT_ID` / `BAKONG_MERCHANT_NAME` / `BAKONG_MERCHANT_CITY` | merchant values |
| `BAKONG_WEBHOOK_SECRET` | same strong random value as Edge Function secret |
| `BAKONG_API_URL` | e.g. `https://api-bakong.nbc.gov.kh` |
| `BAKONG_ACCESS_TOKEN` | current valid developer token |
| `BUNNY_STREAM_PULL_ZONE_HOST` | pull zone host |
| `BUNNY_STREAM_TOKEN_SECURITY_KEY` | token auth key |
| `BUNNY_STREAM_FORMAT` | `hls` |
| `BUNNY_STREAM_TTL_SECONDS` | `7200` |
| `BUNNY_STREAM_BIND_TOKEN_IP` | keep matching pull-zone IP-validation setting |

- [ ] **Step 4: Trigger deploy and confirm it goes green**

Deploy from main. Expected: deployment succeeds; open the `*.vercel.app` URL and homepage renders with data (Supabase catalog or mock fallback).

---

### Task 5: Supabase Auth URL configuration (operator)

**Files:**
- None (dashboard operations).

**Interfaces:**
- Consumes: login redirect `${window.location.origin}/auth/callback` (`components/auth-provider.tsx:79`); `app/auth/callback/route.ts` exchange handler.
- Produces: allow-list entries that make auth work on both the staging `*.vercel.app` host now and `<final-domain>` after flip.

- [ ] **Step 1: Update URL Configuration**

Supabase Dashboard -> Authentication -> URL Configuration:
- Site URL: `https://<final-domain>`
- Redirect URLs — add all of:
  - `https://<final-domain>/auth/callback`
  - `https://<final-domain-with-www>/auth/callback` (if www will be served)
  - `https://<current-project>.vercel.app/auth/callback` (temporary, for Gate 1 testing; remove after flip)

- [ ] **Step 2: Verify auth emails render correct links**

Trigger a password-reset or signup confirmation to your own address. Expected: emailed link host is the Site URL domain, path `/auth/callback`.

---

### Task 6: Gate 1 — full flow verification on *.vercel.app (operator)

**Files:**
- None (verification only).

**Interfaces:**
- Consumes: Tasks 1-5 complete; Vercel Preview/Production URL live.

- [ ] **Step 1: Auth smoke**

Signup fresh account -> confirm email -> login lands on dashboard. Logout -> login again.

- [ ] **Step 2: Payment smoke (real money, smallest viable amount)**

Create a temporary cheapest course price or use smallest plan -> checkout -> scan KHQR with banking app -> stay on polling screen until it flips to success. Verify in Supabase:
- `payment_transactions`: row `completed` with `external_tx_hash`, amount has <=2 decimals
- `course_enrollments` / `user_subscriptions`: active row for buyer
- `profiles.role` upgraded to `student`
- If promo used: `promo_codes.redemptions_count` incremented exactly once
- Receipt email received; links point at canonical domain (NOT `*.vercel.app` once `NEXT_PUBLIC_SITE_URL` is set)

Also watch Vercel function logs for the `/api/checkout/status` request and Supabase logs for any webhook 401s (401 would mean provider signature mismatch vs new secret).

- [ ] **Step 3: Video + certificate smoke**

Open an enrolled lesson -> HLS playback starts through `/api/lessons/[lessonId]/video`. If test account meets certificate criteria (100% watch + graded labs), trigger `/api/certificates/generate` -> certificate email link resolves.

- [ ] **Step 4: Guard smoke**

While logged out: `/dashboard` redirects to `/login`, `/admin` redirects appropriately. Non-admin logged-in user hitting `/admin` bounces to `/`.

---

### Task 7: DNS cutover + Gate 2 (operator)

**Files:**
- None (registrar/DNS + verification).

**Interfaces:**
- Consumes: Gate 1 passed.
- Produces: production site on `<final-domain>` with old hosting as rollback.

- [ ] **Step 1: T-24h preparation**

At registrar DNS panel: lower TTL on existing web A/CNAME records to 300s.

- [ ] **Step 2: Pre-register domain in Vercel**

Vercel Project -> Settings -> Domains -> add `<final-domain>` and `www.<final-domain>`. Note the exact records Vercel requests (apex A `76.76.21.21`, www CNAME `cname.vercel-dns.com`). Ignore the pending-state warning until flip.

- [ ] **Step 3: Flip during low-traffic window**

Replace ONLY the web A/CNAME records with Vercel's values. Do not touch MX/TXT/SPF/DKIM. Old hosting remains intact and can be restored by reverting these records (rollback).

- [ ] **Step 4: Post-propagation checks**

- `https://<final-domain>` serves the app over valid SSL (auto-provisioned).
- Login + one checkout smoke test against apex domain.
- sitemap.xml and robots.txt show `https://<final-domain>`.
- Supabase Redirect URLs: remove the temporary `*.vercel.app` entry.
- Watch Vercel logs + Supabase logs for 24h (checkout errors, webhook failures, video route errors).

---

## Self-Review

- Spec coverage: Section 1.1 -> Task 1; 1.2 -> Task 2; 1.3 -> Task 3; Section 2 -> Tasks 3/4 (env split Vercel vs Edge Function secrets); Section 3 -> Task 5; Section 4 -> Task 7; Section 5 Gates 0/1/2 -> Tasks 4 Step 1, Task 6, Task 7 Step 4. Accepted risks documented in spec, intentionally not tasked.
- Placeholder scan: `<final-domain>` / `<project-ref>` are deliberate operator-fill values called out in Global Constraints. No TBDs.
- Type consistency: `origin` string semantics identical across Task 2 files; `checkoutAmount` remains `number`; webhook response shape unchanged (401 JSON with corsHeaders).
