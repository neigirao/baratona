
-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  display_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Platform roles
CREATE TABLE IF NOT EXISTS public.platform_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.platform_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read platform_roles" ON public.platform_roles FOR SELECT USING (true);

-- Events
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text DEFAULT '',
  city text DEFAULT 'Rio de Janeiro',
  visibility text NOT NULL DEFAULT 'public',
  event_type text NOT NULL DEFAULT 'open_baratona',
  status text NOT NULL DEFAULT 'draft',
  owner_user_id uuid NOT NULL,
  owner_name text DEFAULT 'Organizador',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public events visible to all" ON public.events FOR SELECT USING (visibility = 'public' OR owner_user_id = auth.uid());
CREATE POLICY "Authenticated users can create events" ON public.events FOR INSERT WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "Owner can update event" ON public.events FOR UPDATE USING (auth.uid() = owner_user_id);

-- Event members
CREATE TABLE IF NOT EXISTS public.event_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'participant',
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);
ALTER TABLE public.event_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members visible to event members" ON public.event_members FOR SELECT USING (true);
CREATE POLICY "Authenticated can join events" ON public.event_members FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Event invites
CREATE TABLE IF NOT EXISTS public.event_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  max_uses integer DEFAULT 50,
  used_count integer DEFAULT 0,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.event_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read invites" ON public.event_invites FOR SELECT USING (true);
CREATE POLICY "Owner can create invites" ON public.event_invites FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND owner_user_id = auth.uid())
);

-- Event bars
CREATE TABLE IF NOT EXISTS public.event_bars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text NOT NULL DEFAULT '',
  latitude double precision,
  longitude double precision,
  bar_order integer NOT NULL DEFAULT 1,
  scheduled_time time DEFAULT '18:00',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.event_bars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view event_bars" ON public.event_bars FOR SELECT USING (true);
CREATE POLICY "Owner can manage bars" ON public.event_bars FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND owner_user_id = auth.uid())
);
CREATE POLICY "Owner can update bars" ON public.event_bars FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND owner_user_id = auth.uid())
);
CREATE POLICY "Owner can delete bars" ON public.event_bars FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND owner_user_id = auth.uid())
);

-- Event app config
CREATE TABLE IF NOT EXISTS public.event_app_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL UNIQUE REFERENCES public.events(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'at_bar',
  current_bar_id uuid REFERENCES public.event_bars(id),
  origin_bar_id uuid REFERENCES public.event_bars(id),
  destination_bar_id uuid REFERENCES public.event_bars(id),
  global_delay_minutes integer NOT NULL DEFAULT 0,
  broadcast_msg text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.event_app_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view event_app_config" ON public.event_app_config FOR SELECT USING (true);
CREATE POLICY "Owner can insert config" ON public.event_app_config FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND owner_user_id = auth.uid())
);
CREATE POLICY "Owner can update config" ON public.event_app_config FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND owner_user_id = auth.uid())
);

-- Event checkins
CREATE TABLE IF NOT EXISTS public.event_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  bar_id uuid NOT NULL REFERENCES public.event_bars(id) ON DELETE CASCADE,
  checked_in_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id, bar_id)
);
ALTER TABLE public.event_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view event_checkins" ON public.event_checkins FOR SELECT USING (true);
CREATE POLICY "Authenticated can checkin" ON public.event_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User can delete own checkin" ON public.event_checkins FOR DELETE USING (auth.uid() = user_id);

-- Event consumption
CREATE TABLE IF NOT EXISTS public.event_consumption (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  bar_id uuid REFERENCES public.event_bars(id) ON DELETE CASCADE,
  type text NOT NULL,
  subtype text,
  count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id, type, bar_id, subtype)
);
ALTER TABLE public.event_consumption ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view event_consumption" ON public.event_consumption FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert consumption" ON public.event_consumption FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User can update own consumption" ON public.event_consumption FOR UPDATE USING (auth.uid() = user_id);

-- Event votes
CREATE TABLE IF NOT EXISTS public.event_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  bar_id uuid NOT NULL REFERENCES public.event_bars(id) ON DELETE CASCADE,
  drink_score integer NOT NULL,
  food_score integer NOT NULL,
  vibe_score integer NOT NULL,
  service_score integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id, bar_id)
);
ALTER TABLE public.event_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view event_votes" ON public.event_votes FOR SELECT USING (true);
CREATE POLICY "Authenticated can vote" ON public.event_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User can update own vote" ON public.event_votes FOR UPDATE USING (auth.uid() = user_id);

-- Event achievements
CREATE TABLE IF NOT EXISTS public.event_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  achievement_key text NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id, achievement_key)
);
ALTER TABLE public.event_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view event_achievements" ON public.event_achievements FOR SELECT USING (true);
CREATE POLICY "Authenticated can unlock" ON public.event_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable realtime on key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_app_config;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_checkins;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_consumption;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_votes;

-- Updated at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_event_app_config_updated_at BEFORE UPDATE ON public.event_app_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_event_consumption_updated_at BEFORE UPDATE ON public.event_consumption
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
