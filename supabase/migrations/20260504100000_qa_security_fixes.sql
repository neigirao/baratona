-- QA Sprint Imediato: 4 correções críticas de segurança
-- 1. create_baratona_from_favorites: verificar acesso ao evento de origem
-- 2. get_user_bar_catalog: restringir ao próprio usuário
-- 3. profiles: exigir autenticação na leitura
-- 4. DELETE policies ausentes em event_members, event_votes, event_achievements, event_consumption

-- ============================================================
-- 1. create_baratona_from_favorites: adicionar can_access_event
--    Sem este check, qualquer autenticado pode copiar bares de
--    eventos privados que não pertencem a ele.
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_baratona_from_favorites(
  _source_event_id uuid,
  _name text,
  _bar_ids uuid[]
)
RETURNS TABLE(event_id uuid, slug text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user uuid;
  v_new_event_id uuid;
  v_slug text;
  v_base_slug text;
  v_suffix int := 0;
  v_count int;
  v_bar record;
  v_order int := 1;
  v_city text;
BEGIN
  v_user := auth.uid();
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- Verify caller has access to the source event (public or member or owner)
  IF NOT public.can_access_event(_source_event_id) THEN
    RAISE EXCEPTION 'access_denied';
  END IF;

  IF _bar_ids IS NULL OR array_length(_bar_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'no_bars_selected';
  END IF;

  v_count := array_length(_bar_ids, 1);
  IF v_count < 3 THEN RAISE EXCEPTION 'too_few_bars'; END IF;
  IF v_count > 15 THEN RAISE EXCEPTION 'too_many_bars'; END IF;

  -- Generate unique slug from name
  v_base_slug := lower(regexp_replace(unaccent(coalesce(NULLIF(_name, ''), 'minha-baratona')), '[^a-z0-9]+', '-', 'g'));
  v_base_slug := trim(both '-' from v_base_slug);
  IF v_base_slug = '' THEN v_base_slug := 'minha-baratona'; END IF;
  v_slug := v_base_slug;
  WHILE EXISTS (SELECT 1 FROM public.events e WHERE e.slug = v_slug) LOOP
    v_suffix := v_suffix + 1;
    v_slug := v_base_slug || '-' || v_suffix::text;
  END LOOP;

  SELECT e.city INTO v_city FROM public.events e WHERE e.id = _source_event_id;

  -- Create new private event
  INSERT INTO public.events (name, slug, owner_user_id, visibility, event_type, status, city)
  VALUES (
    coalesce(NULLIF(_name, ''), 'Minha Baratona'),
    v_slug, v_user, 'private', 'open_baratona', 'draft', v_city
  )
  RETURNING id INTO v_new_event_id;

  -- Copy selected bars preserving input order
  FOR v_bar IN
    SELECT eb.*, ord.idx
    FROM public.event_bars eb
    JOIN unnest(_bar_ids) WITH ORDINALITY AS ord(bar_id, idx) ON ord.bar_id = eb.id
    WHERE eb.event_id = _source_event_id
    ORDER BY ord.idx
  LOOP
    INSERT INTO public.event_bars (
      event_id, name, address, neighborhood, latitude, longitude,
      featured_dish, dish_description, dish_image_url, phone, instagram,
      bar_order, scheduled_time
    ) VALUES (
      v_new_event_id, v_bar.name, v_bar.address, v_bar.neighborhood, v_bar.latitude, v_bar.longitude,
      v_bar.featured_dish, v_bar.dish_description, v_bar.dish_image_url, v_bar.phone, v_bar.instagram,
      v_order, v_bar.scheduled_time
    );
    v_order := v_order + 1;
  END LOOP;

  -- Create app config
  INSERT INTO public.event_app_config (event_id, status)
  VALUES (v_new_event_id, 'at_bar');

  -- Add owner as organizer member
  INSERT INTO public.event_members (event_id, user_id, role)
  VALUES (v_new_event_id, v_user, 'organizer')
  ON CONFLICT DO NOTHING;

  event_id := v_new_event_id;
  slug := v_slug;
  RETURN NEXT;
END;
$$;

-- ============================================================
-- 2. get_user_bar_catalog: restringir ao próprio usuário
--    Sem este fix, qualquer autenticado pode chamar com uuid
--    de outro usuário e enumerar todos os seus bares.
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
    AND _user_id = auth.uid()          -- caller may only see own catalog
  ORDER BY lower(trim(eb.name)), eb.name;
$$;

-- ============================================================
-- 3. profiles: exigir autenticação (era USING (true) = público)
--    Impede enumeração de usuários por visitantes anônimos.
--    display_name e avatar_url são não-sensíveis, mas exigir
--    autenticação reduz a superfície de ataque.
-- ============================================================
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

CREATE POLICY "Authenticated can view profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- 4. DELETE policies ausentes
-- ============================================================

-- event_members: membro pode sair; owner pode remover qualquer membro
CREATE POLICY "event_members_delete"
  ON public.event_members
  FOR DELETE
  USING (
    auth.uid() = user_id
    OR public.can_manage_event(event_id)
  );

-- event_votes: usuário pode retratar o próprio voto
CREATE POLICY "event_votes_delete_self"
  ON public.event_votes
  FOR DELETE
  USING (auth.uid() = user_id);

-- event_achievements: apenas owner/super_admin pode remover achievement
CREATE POLICY "event_achievements_delete_owner"
  ON public.event_achievements
  FOR DELETE
  USING (public.can_manage_event(event_id));

-- event_consumption: usuário pode remover próprio lançamento; owner remove qualquer
CREATE POLICY "event_consumption_delete"
  ON public.event_consumption
  FOR DELETE
  USING (
    auth.uid() = user_id
    OR public.can_manage_event(event_id)
  );
