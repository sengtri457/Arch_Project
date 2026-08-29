-- Migration: Update legacy Telegram links from sxngtri to bunsambath10 in exercise_submissions
-- Run this entire file in: Supabase Dashboard > SQL Editor > New query
-- Safe to re-run (idempotent).

UPDATE public.exercise_submissions
SET submission_files_json = (
  SELECT jsonb_agg(
    CASE
      WHEN elem->>'url' = 'https://t.me/sxngtri'
        THEN jsonb_set(elem, '{url}', '"https://t.me/bunsambath10"')
      ELSE elem
    END
  )
  FROM jsonb_array_elements(submission_files_json) AS elem
)
WHERE submission_files_json @> '[{"url": "https://t.me/sxngtri"}]';
