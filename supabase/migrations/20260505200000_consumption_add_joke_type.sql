-- Allow 'joke' as a valid consumption type so the counter can be persisted
ALTER TABLE public.event_consumption
  DROP CONSTRAINT IF EXISTS event_consumption_type_check;

ALTER TABLE public.event_consumption
  ADD CONSTRAINT event_consumption_type_check
  CHECK (type IN ('drink', 'food', 'joke'));
