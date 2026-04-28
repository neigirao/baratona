-- ════════════════════════════════════════════════════════════
-- 1) LOCK TABELAS LEGADAS (read-only via /nei)
-- ════════════════════════════════════════════════════════════

-- participants
DROP POLICY IF EXISTS "Anyone can insert participants" ON public.participants;

-- bars (já não tinha writes)

-- votes
DROP POLICY IF EXISTS "Anyone can insert votes" ON public.votes;

-- consumption
DROP POLICY IF EXISTS "Anyone can insert consumption" ON public.consumption;
DROP POLICY IF EXISTS "Anyone can update consumption" ON public.consumption;

-- checkins
DROP POLICY IF EXISTS "Anyone can insert checkins" ON public.checkins;
DROP POLICY IF EXISTS "Anyone can delete checkins" ON public.checkins;

-- achievements
DROP POLICY IF EXISTS "Anyone can insert achievements" ON public.achievements;

-- app_config: super_admin write policies já existem; manter
-- (já está endurecido)

-- ════════════════════════════════════════════════════════════
-- 2) UNIQUE CONSTRAINTS em event_* (multi-evento)
-- ════════════════════════════════════════════════════════════

ALTER TABLE public.event_votes
  ADD CONSTRAINT event_votes_event_user_bar_key UNIQUE (event_id, user_id, bar_id);

ALTER TABLE public.event_checkins
  ADD CONSTRAINT event_checkins_event_user_bar_key UNIQUE (event_id, user_id, bar_id);

-- event_consumption: subtype pode ser NULL; usar COALESCE via expressão única
CREATE UNIQUE INDEX event_consumption_unique_idx
  ON public.event_consumption (event_id, user_id, type, COALESCE(bar_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(subtype, ''));

ALTER TABLE public.event_members
  ADD CONSTRAINT event_members_event_user_key UNIQUE (event_id, user_id);

ALTER TABLE public.event_bar_favorites
  ADD CONSTRAINT event_bar_favorites_event_user_bar_key UNIQUE (event_id, user_id, bar_id);

ALTER TABLE public.event_app_config
  ADD CONSTRAINT event_app_config_event_key UNIQUE (event_id);

ALTER TABLE public.event_achievements
  ADD CONSTRAINT event_achievements_event_user_key_key UNIQUE (event_id, user_id, achievement_key);

-- ════════════════════════════════════════════════════════════
-- 3) ÍNDICES de performance (event_id já comum em filtros)
-- ════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_event_bars_event_id ON public.event_bars(event_id);
CREATE INDEX IF NOT EXISTS idx_event_votes_event_id ON public.event_votes(event_id);
CREATE INDEX IF NOT EXISTS idx_event_checkins_event_id ON public.event_checkins(event_id);
CREATE INDEX IF NOT EXISTS idx_event_consumption_event_id ON public.event_consumption(event_id);
CREATE INDEX IF NOT EXISTS idx_event_members_event_id ON public.event_members(event_id);
CREATE INDEX IF NOT EXISTS idx_event_bar_favorites_event_id ON public.event_bar_favorites(event_id);
CREATE INDEX IF NOT EXISTS idx_event_invites_event_id ON public.event_invites(event_id);
CREATE INDEX IF NOT EXISTS idx_event_invites_code ON public.event_invites(upper(code));
CREATE INDEX IF NOT EXISTS idx_event_achievements_event_id ON public.event_achievements(event_id);
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);
CREATE INDEX IF NOT EXISTS idx_events_owner ON public.events(owner_user_id);