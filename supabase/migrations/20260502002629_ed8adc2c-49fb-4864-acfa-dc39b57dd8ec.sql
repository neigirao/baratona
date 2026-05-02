CREATE OR REPLACE FUNCTION public.create_baratona_from_favorites(_source_event_id uuid, _name text, _bar_ids uuid[])
 RETURNS TABLE(event_id uuid, slug text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  IF _bar_ids IS NULL OR array_length(_bar_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'no_bars_selected';
  END IF;

  v_count := array_length(_bar_ids, 1);
  IF v_count < 3 THEN
    RAISE EXCEPTION 'too_few_bars';
  END IF;
  IF v_count > 15 THEN
    RAISE EXCEPTION 'too_many_bars';
  END IF;

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
    v_slug,
    v_user,
    'private',
    'open_baratona',
    'draft',
    v_city
  )
  RETURNING id INTO v_new_event_id;

  -- Copy selected bars preserving order from input array
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
$function$;