-- Sprint 9–18 fix #10: Add pre-validation to reorder_event_bars()
-- Ensures all supplied bar IDs actually belong to the given event before updating,
-- preventing silent cross-event bar reorders from a tampered payload.

CREATE OR REPLACE FUNCTION public.reorder_event_bars(
  _event_id uuid,
  _bar_orders jsonb   -- e.g. [{"id":"<uuid>","order":1}, ...]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item jsonb;
  foreign_count int;
BEGIN
  -- Caller must be able to manage the event
  IF NOT public.can_manage_event(_event_id) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  -- Verify every supplied bar ID belongs to _event_id
  SELECT COUNT(*) INTO foreign_count
  FROM jsonb_array_elements(_bar_orders) AS elem
  WHERE NOT EXISTS (
    SELECT 1 FROM public.event_bars
    WHERE id = (elem->>'id')::uuid
      AND event_id = _event_id
  );

  IF foreign_count > 0 THEN
    RAISE EXCEPTION 'invalid_bar_ids: % bar(s) do not belong to event %', foreign_count, _event_id;
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(_bar_orders)
  LOOP
    UPDATE public.event_bars
    SET bar_order = (item->>'order')::int
    WHERE id = (item->>'id')::uuid
      AND event_id = _event_id;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reorder_event_bars(uuid, jsonb) TO authenticated;
