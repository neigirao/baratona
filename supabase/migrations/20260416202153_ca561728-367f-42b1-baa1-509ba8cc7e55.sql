-- 1. Ampliar tabela events
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS external_source_url text;

-- 2. Ampliar tabela event_bars
ALTER TABLE public.event_bars
  ADD COLUMN IF NOT EXISTS featured_dish text,
  ADD COLUMN IF NOT EXISTS dish_description text,
  ADD COLUMN IF NOT EXISTS dish_image_url text,
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS neighborhood text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS instagram text;

-- scheduled_time já é nullable, garantir
ALTER TABLE public.event_bars ALTER COLUMN scheduled_time DROP NOT NULL;

-- Constraint única para idempotência do scrape
CREATE UNIQUE INDEX IF NOT EXISTS event_bars_event_external_unique
  ON public.event_bars(event_id, external_id)
  WHERE external_id IS NOT NULL;

-- 3. Seed do evento Comida di Buteco (apenas se houver super_admin)
DO $$
DECLARE
  v_owner uuid;
  v_event_id uuid;
BEGIN
  SELECT user_id INTO v_owner
  FROM public.platform_roles
  WHERE role = 'super_admin'
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_owner IS NULL THEN
    RAISE NOTICE 'Nenhum super_admin encontrado. Pulando seed do Comida di Buteco.';
    RETURN;
  END IF;

  -- Inserir evento se não existir
  INSERT INTO public.events (
    slug, name, description, city, visibility, event_type,
    owner_user_id, owner_name, status,
    start_date, end_date, cover_image_url, external_source_url
  )
  VALUES (
    'comida-di-buteco-rj-2026',
    'Comida di Buteco RJ 2026',
    'O maior concurso de petiscos de boteco do Brasil chega ao Rio de Janeiro. Visite os butecos participantes, prove os petiscos exclusivos e vote no seu favorito.',
    'Rio de Janeiro',
    'public',
    'special_circuit',
    v_owner,
    'Comida di Buteco',
    'published',
    NULL, NULL,
    NULL,
    'https://comidadibuteco.com.br/butecos/rio-de-janeiro/'
  )
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_event_id;

  -- Garantir event_app_config para o evento (se foi criado agora)
  IF v_event_id IS NOT NULL THEN
    INSERT INTO public.event_app_config (event_id, status, global_delay_minutes)
    VALUES (v_event_id, 'at_bar', 0)
    ON CONFLICT DO NOTHING;

    -- Owner como membro
    INSERT INTO public.event_members (event_id, user_id, role, display_name)
    VALUES (v_event_id, v_owner, 'event_owner', 'Comida di Buteco')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;