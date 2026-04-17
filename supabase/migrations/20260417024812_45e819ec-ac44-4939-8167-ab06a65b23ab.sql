-- Allow single-score "petisco" votes for special circuits
-- Make the 4 standard score columns nullable and add a dish_score column
ALTER TABLE public.event_votes
  ALTER COLUMN drink_score DROP NOT NULL,
  ALTER COLUMN food_score DROP NOT NULL,
  ALTER COLUMN vibe_score DROP NOT NULL,
  ALTER COLUMN service_score DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS dish_score integer;

-- Ensure at least one score is provided
ALTER TABLE public.event_votes
  DROP CONSTRAINT IF EXISTS event_votes_has_score;
ALTER TABLE public.event_votes
  ADD CONSTRAINT event_votes_has_score
  CHECK (
    dish_score IS NOT NULL
    OR (drink_score IS NOT NULL AND food_score IS NOT NULL AND vibe_score IS NOT NULL AND service_score IS NOT NULL)
  );

-- One vote per user per bar per event (allows update via upsert)
ALTER TABLE public.event_votes
  DROP CONSTRAINT IF EXISTS event_votes_user_bar_unique;
ALTER TABLE public.event_votes
  ADD CONSTRAINT event_votes_user_bar_unique UNIQUE (event_id, user_id, bar_id);
