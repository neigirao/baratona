CREATE OR REPLACE FUNCTION public.get_bar_favorite_counts(_event_id uuid)
RETURNS TABLE (bar_id uuid, fav_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT bar_id, COUNT(*)::bigint AS fav_count
  FROM public.event_bar_favorites
  WHERE event_id = _event_id
  GROUP BY bar_id;
$$;

CREATE INDEX IF NOT EXISTS idx_event_bar_favorites_user
  ON public.event_bar_favorites(user_id);