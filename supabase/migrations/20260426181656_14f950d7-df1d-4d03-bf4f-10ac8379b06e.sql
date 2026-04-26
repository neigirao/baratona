-- =========================================================
-- 1) Estender RLS para super_admin em events / event_bars /
--    event_app_config / event_invites
-- =========================================================

-- events: UPDATE
DROP POLICY IF EXISTS "Owner can update event" ON public.events;
CREATE POLICY "Owner or super_admin can update event"
  ON public.events
  FOR UPDATE
  USING (
    auth.uid() = owner_user_id
    OR public.has_platform_role(auth.uid(), 'super_admin')
  );

-- event_bars: INSERT / UPDATE / DELETE
DROP POLICY IF EXISTS "Owner can manage bars" ON public.event_bars;
CREATE POLICY "Owner or super_admin can insert bars"
  ON public.event_bars
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_bars.event_id
        AND events.owner_user_id = auth.uid()
    )
    OR public.has_platform_role(auth.uid(), 'super_admin')
  );

DROP POLICY IF EXISTS "Owner can update bars" ON public.event_bars;
CREATE POLICY "Owner or super_admin can update bars"
  ON public.event_bars
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_bars.event_id
        AND events.owner_user_id = auth.uid()
    )
    OR public.has_platform_role(auth.uid(), 'super_admin')
  );

DROP POLICY IF EXISTS "Owner can delete bars" ON public.event_bars;
CREATE POLICY "Owner or super_admin can delete bars"
  ON public.event_bars
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_bars.event_id
        AND events.owner_user_id = auth.uid()
    )
    OR public.has_platform_role(auth.uid(), 'super_admin')
  );

-- event_app_config: INSERT / UPDATE
DROP POLICY IF EXISTS "Owner can insert config" ON public.event_app_config;
CREATE POLICY "Owner or super_admin can insert config"
  ON public.event_app_config
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_app_config.event_id
        AND events.owner_user_id = auth.uid()
    )
    OR public.has_platform_role(auth.uid(), 'super_admin')
  );

DROP POLICY IF EXISTS "Owner can update config" ON public.event_app_config;
CREATE POLICY "Owner or super_admin can update config"
  ON public.event_app_config
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_app_config.event_id
        AND events.owner_user_id = auth.uid()
    )
    OR public.has_platform_role(auth.uid(), 'super_admin')
  );

-- event_invites: INSERT / SELECT / DELETE
DROP POLICY IF EXISTS "Owner can create invites" ON public.event_invites;
CREATE POLICY "Owner or super_admin can create invites"
  ON public.event_invites
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_invites.event_id
        AND events.owner_user_id = auth.uid()
    )
    OR public.has_platform_role(auth.uid(), 'super_admin')
  );

DROP POLICY IF EXISTS "Owner can read invites" ON public.event_invites;
CREATE POLICY "Owner or super_admin can read invites"
  ON public.event_invites
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_invites.event_id
        AND events.owner_user_id = auth.uid()
    )
    OR public.has_platform_role(auth.uid(), 'super_admin')
  );

DROP POLICY IF EXISTS "Owner can delete invites" ON public.event_invites;
CREATE POLICY "Owner or super_admin can delete invites"
  ON public.event_invites
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_invites.event_id
        AND events.owner_user_id = auth.uid()
    )
    OR public.has_platform_role(auth.uid(), 'super_admin')
  );

-- platform_roles: super_admin pode ler todos os papéis (para listagem)
CREATE POLICY "Super admin can read all platform roles"
  ON public.platform_roles
  FOR SELECT
  TO authenticated
  USING (public.has_platform_role(auth.uid(), 'super_admin'));

-- =========================================================
-- 2) RPCs administrativas (SECURITY DEFINER + checagem de role)
-- =========================================================

CREATE OR REPLACE FUNCTION public.admin_update_event_owner(
  _event_id uuid,
  _new_owner uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_platform_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  UPDATE public.events
     SET owner_user_id = _new_owner,
         updated_at = now()
   WHERE id = _event_id;
END
$$;

CREATE OR REPLACE FUNCTION public.admin_set_platform_role(
  _user_id uuid,
  _role text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_platform_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  INSERT INTO public.platform_roles (user_id, role)
  VALUES (_user_id, _role)
  ON CONFLICT DO NOTHING;
END
$$;

CREATE OR REPLACE FUNCTION public.admin_remove_platform_role(
  _user_id uuid,
  _role text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_platform_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  -- Não permitir remover a si mesmo se for o último super_admin
  IF _user_id = auth.uid() AND _role = 'super_admin' THEN
    IF (SELECT COUNT(*) FROM public.platform_roles WHERE role = 'super_admin') <= 1 THEN
      RAISE EXCEPTION 'cannot_remove_last_super_admin';
    END IF;
  END IF;
  DELETE FROM public.platform_roles
   WHERE user_id = _user_id AND role = _role;
END
$$;

CREATE OR REPLACE FUNCTION public.admin_list_all_events()
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
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_platform_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN QUERY
  SELECT
    e.id, e.slug, e.name, e.description, e.city, e.visibility, e.event_type,
    e.status, e.owner_user_id, e.owner_name, e.created_at, e.updated_at,
    e.event_date, e.start_date, e.end_date, e.cover_image_url, e.external_source_url,
    COALESCE((SELECT COUNT(*) FROM public.event_bars eb WHERE eb.event_id = e.id), 0) AS bar_count,
    COALESCE((SELECT COUNT(*) FROM public.event_members em WHERE em.event_id = e.id), 0) AS member_count
  FROM public.events e
  ORDER BY e.created_at DESC;
END
$$;

CREATE OR REPLACE FUNCTION public.admin_list_platform_roles()
RETURNS TABLE (
  user_id uuid,
  role text,
  created_at timestamptz,
  display_name text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_platform_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN QUERY
  SELECT pr.user_id, pr.role, pr.created_at, p.display_name
    FROM public.platform_roles pr
    LEFT JOIN public.profiles p ON p.user_id = pr.user_id
   ORDER BY pr.created_at DESC;
END
$$;

-- =========================================================
-- 3) Storage buckets para capas de evento e fotos de bares
-- =========================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('event-covers', 'event-covers', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('bar-dishes', 'bar-dishes', true)
ON CONFLICT (id) DO NOTHING;

-- Leitura pública
CREATE POLICY "Public read event-covers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-covers');

CREATE POLICY "Public read bar-dishes"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'bar-dishes');

-- Upload: usuários autenticados podem subir nos seus próprios eventos.
-- Convenção de path: <event_id>/<filename>. Validamos via existência do evento
-- com o usuário como owner OU via super_admin.
CREATE POLICY "Owner or super_admin can upload event-covers"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'event-covers'
    AND (
      public.has_platform_role(auth.uid(), 'super_admin')
      OR EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id::text = (storage.foldername(name))[1]
          AND e.owner_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Owner or super_admin can update event-covers"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'event-covers'
    AND (
      public.has_platform_role(auth.uid(), 'super_admin')
      OR EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id::text = (storage.foldername(name))[1]
          AND e.owner_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Owner or super_admin can delete event-covers"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'event-covers'
    AND (
      public.has_platform_role(auth.uid(), 'super_admin')
      OR EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id::text = (storage.foldername(name))[1]
          AND e.owner_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Owner or super_admin can upload bar-dishes"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'bar-dishes'
    AND (
      public.has_platform_role(auth.uid(), 'super_admin')
      OR EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id::text = (storage.foldername(name))[1]
          AND e.owner_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Owner or super_admin can update bar-dishes"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'bar-dishes'
    AND (
      public.has_platform_role(auth.uid(), 'super_admin')
      OR EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id::text = (storage.foldername(name))[1]
          AND e.owner_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Owner or super_admin can delete bar-dishes"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'bar-dishes'
    AND (
      public.has_platform_role(auth.uid(), 'super_admin')
      OR EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id::text = (storage.foldername(name))[1]
          AND e.owner_user_id = auth.uid()
      )
    )
  );