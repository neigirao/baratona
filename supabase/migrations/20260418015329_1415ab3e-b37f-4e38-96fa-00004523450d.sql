-- Seed Comida di Buteco RJ 2026 event with placeholder owner
INSERT INTO public.events (slug, name, description, city, visibility, event_type, status, owner_user_id, owner_name, external_source_url, cover_image_url, start_date, end_date, event_date)
VALUES (
  'comida-di-buteco-rj-2026',
  'Comida di Buteco RJ 2026',
  'O maior concurso de petiscos do Brasil chega ao Rio de Janeiro. Visite os butecos participantes, prove os petiscos em concurso e vote no seu favorito.',
  'Rio de Janeiro',
  'public',
  'special_circuit',
  'active',
  '00000000-0000-0000-0000-000000000000',
  'Comida di Buteco',
  'https://comidadibuteco.com.br/butecos/rio-de-janeiro/',
  'https://comidadibuteco.com.br/wp-content/uploads/2024/03/logo-cdb-2024.png',
  '2026-04-01',
  '2026-05-03',
  '2026-04-01'
)
ON CONFLICT (slug) DO NOTHING;

-- Auto-create event_app_config for it
INSERT INTO public.event_app_config (event_id, status)
SELECT id, 'at_bar' FROM public.events WHERE slug = 'comida-di-buteco-rj-2026'
ON CONFLICT (event_id) DO NOTHING;