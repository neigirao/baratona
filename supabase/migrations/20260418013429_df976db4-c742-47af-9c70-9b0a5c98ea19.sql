-- Add UNIQUE constraints to prevent duplicate checkins and consumption entries

-- Prevent duplicate checkins (same user checking into same bar in same event)
ALTER TABLE public.event_checkins
  DROP CONSTRAINT IF EXISTS event_checkins_unique_user_bar;
ALTER TABLE public.event_checkins
  ADD CONSTRAINT event_checkins_unique_user_bar UNIQUE (event_id, user_id, bar_id);

-- Prevent duplicate consumption entries (same user recording same type/subtype at same bar)
ALTER TABLE public.event_consumption
  DROP CONSTRAINT IF EXISTS event_consumption_unique_entry;
ALTER TABLE public.event_consumption
  ADD CONSTRAINT event_consumption_unique_entry UNIQUE (event_id, user_id, bar_id, type, subtype);