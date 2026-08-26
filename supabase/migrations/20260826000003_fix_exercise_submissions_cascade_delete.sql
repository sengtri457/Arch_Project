-- Fix course deletion by cascading delete to exercise submissions
ALTER TABLE public.exercise_submissions
DROP CONSTRAINT IF EXISTS exercise_submissions_exercise_id_fkey,
ADD CONSTRAINT exercise_submissions_exercise_id_fkey
  FOREIGN KEY (exercise_id)
  REFERENCES public.exercises(exercise_id)
  ON DELETE CASCADE;
