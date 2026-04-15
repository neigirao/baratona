-- Add event_date to events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS event_date date;

-- Enable realtime for event tables (only those not already added)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'event_checkins') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.event_checkins;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'event_consumption') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.event_consumption;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'event_votes') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.event_votes;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'event_achievements') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.event_achievements;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'event_bars') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.event_bars;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'event_members') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.event_members;
  END IF;
END$$;