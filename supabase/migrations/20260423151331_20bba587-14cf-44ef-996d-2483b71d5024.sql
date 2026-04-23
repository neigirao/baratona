-- Sprint S1: Security hardening + N+1 elimination

-- ========== 1) has_platform_role helper (security definer) ==========
CREATE OR REPLACE FUNCTION public.has_platform_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- ========== 2) Restrict app_config (legacy /nei singleton) ==========
DROP POLICY IF EXISTS "Anyone can update app_config" ON public.app_config;
DROP POLICY IF EXISTS "Anyone can insert app_config" ON public.app_config;

CREATE POLICY "Super admin can update app_config"
  ON public.app_config FOR UPDATE
  USING (public.has_platform_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admin can insert app_config"
  ON public.app_config FOR INSERT
  WITH CHECK (public.has_platform_role(auth.uid(), 'super_admin'));

-- ========== 3) Restrict votes update (prevent overwriting others' votes) ==========
DROP POLICY IF EXISTS "Anyone can update votes" ON public.votes;

-- Votes in the legacy event remain insert-only; participants cannot edit after submission.
-- (No UPDATE policy = no one can update.)

-- ========== 4) Restrict participants modifications ==========
-- Participants can be created (legacy onboarding) but not modified by anyone except super_admin
-- (no UPDATE/DELETE policies exist; keeping INSERT public for legacy flow)

-- ========== 5) RPC: get public events with bar/member counts in one query ==========
CREATE OR REPLACE FUNCTION public.get_public_events_with_counts()
RETURNS TABLE (
  id uuid,
  slug text,
  name text,
  description text,
  city text,
  visibility text,
  event_type text,
  status text,
  owner_user_id uuid,
  owner_name text,
  created_at timestamptz,
  updated_at timestamptz,
  event_date date,
  start_date date,
  end_date date,
  cover_image_url text,
  external_source_url text,
  bar_count bigint,
  member_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    e.id, e.slug, e.name, e.description, e.city, e.visibility, e.event_type,
    e.status, e.owner_user_id, e.owner_name, e.created_at, e.updated_at,
    e.event_date, e.start_date, e.end_date, e.cover_image_url, e.external_source_url,
    COALESCE((SELECT COUNT(*) FROM public.event_bars eb WHERE eb.event_id = e.id), 0) AS bar_count,
    COALESCE((SELECT COUNT(*) FROM public.event_members em WHERE em.event_id = e.id), 0) AS member_count
  FROM public.events e
  WHERE e.visibility = 'public'
  ORDER BY e.created_at DESC;
$$;

-- ========== 6) Indexes for performance ==========
CREATE INDEX IF NOT EXISTS idx_event_bars_event_id ON public.event_bars(event_id);
CREATE INDEX IF NOT EXISTS idx_event_members_event_id ON public.event_members(event_id);
CREATE INDEX IF NOT EXISTS idx_event_checkins_event_id ON public.event_checkins(event_id);
CREATE INDEX IF NOT EXISTS idx_event_consumption_event_id_user ON public.event_consumption(event_id, user_id);
CREATE INDEX IF NOT EXISTS idx_event_votes_event_bar ON public.event_votes(event_id, bar_id);
CREATE INDEX IF NOT EXISTS idx_event_bar_favorites_event_bar ON public.event_bar_favorites(event_id, bar_id);
CREATE INDEX IF NOT EXISTS idx_events_visibility ON public.events(visibility);