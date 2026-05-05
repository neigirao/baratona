-- B2: Normalize legacy 'active' status to 'published' before applying constraint
UPDATE public.events SET status = 'published' WHERE status = 'active';

-- B2: Expand events.status CHECK to include 'live' and 'archived'
ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_status_check;

ALTER TABLE public.events
  ADD CONSTRAINT events_status_check
  CHECK (status IN ('draft', 'published', 'live', 'finished', 'archived'));

-- B1: Fix recurring_creators subquery — previous version counted rows instead of distinct owners
CREATE OR REPLACE FUNCTION public.admin_get_platform_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result json;
BEGIN
  SELECT json_build_object(
    'total_events',        (SELECT count(*) FROM events WHERE status != 'archived'),
    'active_events',       (SELECT count(*) FROM events WHERE status = 'published'),
    'finished_events',     (SELECT count(*) FROM events WHERE status = 'finished'),
    'draft_events',        (SELECT count(*) FROM events WHERE status = 'draft'),
    'archived_events',     (SELECT count(*) FROM events WHERE status = 'archived'),
    'circuit_events',      (SELECT count(*) FROM events WHERE event_type = 'special_circuit' AND status != 'archived'),
    'total_users',         (SELECT count(*) FROM profiles),
    'users_last_7d',       (SELECT count(*) FROM profiles WHERE created_at >= now() - interval '7 days'),
    'users_last_30d',      (SELECT count(*) FROM profiles WHERE created_at >= now() - interval '30 days'),
    'total_members',       (SELECT count(*) FROM event_members),
    'total_checkins',      (SELECT count(*) FROM event_checkins),
    'total_consumption',   (SELECT count(*) FROM event_consumption),
    'events_last_7d',      (SELECT count(*) FROM events WHERE created_at >= now() - interval '7 days'),
    'events_last_30d',     (SELECT count(*) FROM events WHERE created_at >= now() - interval '30 days'),
    'recurring_creators',  (SELECT count(*) FROM (
                              SELECT owner_user_id
                              FROM events
                              WHERE status != 'archived'
                              GROUP BY owner_user_id
                              HAVING count(*) > 1
                            ) t),
    'avg_members_per_event', (SELECT round(avg(mc), 1) FROM (
                                SELECT count(*) AS mc FROM event_members GROUP BY event_id
                              ) t),
    'avg_bars_per_event',  (SELECT round(avg(bc), 1) FROM (
                                SELECT count(*) AS bc FROM event_bars GROUP BY event_id
                              ) t),
    'events_by_month',     (SELECT json_agg(row_to_json(m)) FROM (
                                SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month,
                                       count(*) AS total
                                FROM events
                                WHERE created_at >= now() - interval '6 months'
                                GROUP BY 1 ORDER BY 1
                              ) m)
  ) INTO result;
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_platform_stats() TO authenticated;
