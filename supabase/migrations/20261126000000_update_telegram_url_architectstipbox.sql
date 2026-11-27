-- Migration: Update legacy Telegram links to https://t.me/architectstipbox in exercise_submissions
-- Run this entire file in: Supabase Dashboard > SQL Editor > New query
-- Safe to re-run (idempotent).

UPDATE public.exercise_submissions
SET submission_files_json = (
  SELECT jsonb_agg(
    CASE
      WHEN elem->>'url' IN (
        'Submitted via Telegram',
        'https://t.me/sxngtri',
        'https://t.me/bunsambath10',
        'https://t.me/archtipsbox'
      )
        THEN jsonb_set(elem, '{url}', '"https://t.me/architectstipbox"')
      ELSE elem
    END
  )
  FROM jsonb_array_elements(submission_files_json) AS elem
)
WHERE jsonb_typeof(submission_files_json) = 'array'
  AND (
    submission_files_json @> '[{"url": "Submitted via Telegram"}]'
    OR submission_files_json @> '[{"url": "https://t.me/sxngtri"}]'
    OR submission_files_json @> '[{"url": "https://t.me/bunsambath10"}]'
    OR submission_files_json @> '[{"url": "https://t.me/archtipsbox"}]'
  );
