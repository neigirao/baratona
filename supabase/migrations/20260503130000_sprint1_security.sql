-- Sprint 1 Security: Tighten RLS + composite indexes + atomic bar reorder RPC
-- Replaces the permissive USING(true) policies added in 20260425031031
-- with can_access_event(event_id) which was defined in 20260411131500.

-- ============================================================
-- 1. event_members — restrict SELECT to members of the event
-- ============================================================
DROP POLICY IF EXISTS "Authenticated can view members" ON public.event_members;
CREATE POLICY "Members visible to event members"
  ON public.event_members
  FOR SELECT
  TO authenticated
  USING (public.can_access_event(event_id));

-- ============================================================
-- 2. event_bar_favorites — restrict SELECT to event members
-- ============================================================
DROP POLICY IF EXISTS "Authenticated can view favorites" ON public.event_bar_favorites;
CREATE POLICY "Favorites visible to event members"
  ON public.event_bar_favorites
  FOR SELECT
  TO authenticated
  USING (public.can_access_event(event_id));

-- ============================================================
-- 3. event_checkins — restore can_access_event (was reverted in 20260425031031)
-- ============================================================
DROP POLICY IF EXISTS "Authenticated can view checkins" ON public.event_checkins;
-- event_checkins_select was created IF NOT EXISTS in 20260411131500,
-- so it may or may not still exist depending on execution order.
DROP POLICY IF EXISTS "event_checkins_select" ON public.event_checkins;
CREATE POLICY "event_checkins_select"
  ON public.event_checkins
  FOR SELECT
  USING (public.can_access_event(event_id));

-- ============================================================
-- 4. event_consumption — restore can_access_event
-- ============================================================
DROP POLICY IF EXISTS "Authenticated can view consumption" ON public.event_consumption;
DROP POLICY IF EXISTS "event_consumption_select" ON public.event_consumption;
CREATE POLICY "event_consumption_select"
  ON public.event_consumption
  FOR SELECT
  USING (public.can_access_event(event_id));

-- ============================================================
-- 5. event_votes — restore can_access_event
-- ============================================================
DROP POLICY IF EXISTS "Authenticated can view event_votes" ON public.event_votes;
DROP POLICY IF EXISTS "event_votes_select" ON public.event_votes;
CREATE POLICY "event_votes_select"
  ON public.event_votes
  FOR SELECT
  USING (public.can_access_event(event_id));

-- ============================================================
-- 6. event_achievements — restore can_access_event
-- ============================================================
DROP POLICY IF EXISTS "Authenticated can view event_achievements" ON public.event_achievements;
DROP POLICY IF EXISTS "event_achievements_select" ON public.event_achievements;
CREATE POLICY "event_achievements_select"
  ON public.event_achievements
  FOR SELECT
  USING (public.can_access_event(event_id));

-- ============================================================
-- 7. Composite indexes for hot RLS paths
-- ============================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_members_event_user
  ON public.event_members (event_id, user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_checkins_event_user
  ON public.event_checkins (event_id, user_id);

-- ============================================================
-- 8. Atomic bar reorder RPC
-- Receives a JSON array of {"id": uuid, "order": int} objects
-- and updates all rows in a single transaction.
-- ============================================================
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
BEGIN
  -- Caller must be able to manage the event
  IF NOT public.can_manage_event(_event_id) THEN
    RAISE EXCEPTION 'not_authorized';
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

-- Grant execute to authenticated users (RLS checked inside function)
GRANT EXECUTE ON FUNCTION public.reorder_event_bars(uuid, jsonb) TO authenticated;

-- ============================================================
-- 9. RPC: user bar catalog with SQL-side deduplication
-- Replaces JS in-memory dedup in getUserBarCatalogApi.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_bar_catalog(_user_id uuid)
RETURNS TABLE (
  name text,
  address text,
  neighborhood text,
  scheduled_time text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT ON (lower(trim(eb.name)))
    eb.name,
    coalesce(eb.address, '') AS address,
    eb.neighborhood,
    eb.scheduled_time
  FROM public.event_bars eb
  JOIN public.events e ON e.id = eb.event_id
  WHERE e.owner_user_id = _user_id
  ORDER BY lower(trim(eb.name)), eb.name;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_bar_catalog(uuid) TO authenticated;
