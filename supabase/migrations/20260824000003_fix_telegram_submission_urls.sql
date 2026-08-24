-- ============================================================================
-- FIX: Repair legacy Telegram submission placeholders
-- Run this entire file in: Supabase Dashboard > SQL Editor > New query
-- Safe to re-run (idempotent).
--
-- What it does:
--   Older submissions stored the literal text 'Submitted via Telegram' in the
--   url field of submission_files_json, which can never be a clickable link.
--   This replaces just that placeholder with the real instructor chat URL.
-- ============================================================================

UPDATE public.exercise_submissions
SET submission_files_json = (
  SELECT jsonb_agg(
    CASE
      WHEN elem->>'url' = 'Submitted via Telegram'
        THEN jsonb_set(elem, '{url}', '"https://t.me/sxngtri"')
      ELSE elem
    END
  )
  FROM jsonb_array_elements(submission_files_json) AS elem
)
WHERE submission_files_json @> '[{"url": "Submitted via Telegram"}]';
