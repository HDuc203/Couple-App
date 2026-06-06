-- Migration: Add date_key and unique constraint to mood_logs
ALTER TABLE public.mood_logs
  ADD COLUMN IF NOT EXISTS date_key DATE DEFAULT CURRENT_DATE;

-- Update existing date_key values based on created_at
UPDATE public.mood_logs
SET date_key = created_at::date
WHERE date_key IS NULL;

ALTER TABLE public.mood_logs
  ALTER COLUMN date_key SET NOT NULL;

-- Clean up any duplicates so the unique constraint can be applied
DELETE FROM public.mood_logs a USING public.mood_logs b
WHERE a.id < b.id 
  AND a.user_id = b.user_id 
  AND (a.couple_id = b.couple_id OR (a.couple_id IS NULL AND b.couple_id IS NULL))
  AND a.date_key = b.date_key;

-- Add unique constraint
ALTER TABLE public.mood_logs
  DROP CONSTRAINT IF EXISTS mood_logs_user_id_couple_id_date_key_key;

ALTER TABLE public.mood_logs
  ADD CONSTRAINT mood_logs_user_id_couple_id_date_key_key UNIQUE (user_id, couple_id, date_key);
