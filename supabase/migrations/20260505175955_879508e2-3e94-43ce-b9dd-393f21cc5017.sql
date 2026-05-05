
CREATE OR REPLACE FUNCTION public.admin_list_users(_search text DEFAULT NULL, _limit int DEFAULT 100, _offset int DEFAULT 0)
RETURNS TABLE(
  user_id uuid,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  roles text[],
  events_owned bigint,
  events_joined bigint
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_platform_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT
    u.id AS user_id,
    u.email::text,
    p.display_name,
    p.avatar_url,
    u.created_at,
    u.last_sign_in_at,
    COALESCE(ARRAY_AGG(DISTINCT pr.role) FILTER (WHERE pr.role IS NOT NULL), '{}') AS roles,
    COALESCE((SELECT COUNT(*) FROM public.events e WHERE e.owner_user_id = u.id), 0) AS events_owned,
    COALESCE((SELECT COUNT(*) FROM public.event_members em WHERE em.user_id = u.id), 0) AS events_joined
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  LEFT JOIN public.platform_roles pr ON pr.user_id = u.id
  WHERE
    _search IS NULL OR _search = ''
    OR u.email ILIKE '%' || _search || '%'
    OR p.display_name ILIKE '%' || _search || '%'
    OR u.id::text = _search
  GROUP BY u.id, u.email, p.display_name, p.avatar_url, u.created_at, u.last_sign_in_at
  ORDER BY u.created_at DESC
  LIMIT _limit OFFSET _offset;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_list_users(text, int, int) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users(text, int, int) TO authenticated;
