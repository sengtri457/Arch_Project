# Roadmap Status

Last updated: 2026-08-24

## Shipped

- Phase A - Security hardening: lessons lockdown + get_lesson_video RPC, subscription expiry (+ daily pg_cron), env-driven test bypass (NEXT_PUBLIC_BYPASS_EMAILS), Bakong credential hardening, API rate limits, contact spam protection, terms/privacy pages.
- Bunny Stream integration: signed HLS delivery with directory tokens, secure per-lesson video endpoint, MP4 escape hatch, optional IP locking.
- Phase B - Product completion:
  - Course landing pages (/courses/[slug]) with public curriculum preview RPC
  - Transactional email via Resend (receipts, enrollment, certificates)
  - SEO pack (sitemap, robots, OG image, metadata layouts, JSON-LD)
  - App-level error / not-found / loading pages
  - Account settings with Supabase Storage avatar uploads
  - Admin Users tab (role management) and logout
  - Certificate print-to-PDF (A4 landscape)
  - Lab-gated certificates: watch 100% + every lab instructor-graded
  - Submission detail page with attempt history, queue navigation, revision requests

## Candidate future work

- Khmer localization (i18n)
- Video drop-off analytics in admin
- Automated Bunny uploads via Management API
- Category taxonomy table when landing-page-per-category is needed
- Email/password auth option alongside Google OAuth
