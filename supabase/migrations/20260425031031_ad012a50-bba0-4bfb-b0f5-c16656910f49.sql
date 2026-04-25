-- 1. platform_roles: somente o próprio usuário pode ler seus papéis
DROP POLICY IF EXISTS "Anyone can read platform_roles" ON public.platform_roles;
CREATE POLICY "Users can read own platform roles"
  ON public.platform_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. event_members: somente autenticados (RPC pública get_public_events_with_counts já cobre contagens)
DROP POLICY IF EXISTS "Members visible to event members" ON public.event_members;
CREATE POLICY "Authenticated can view members"
  ON public.event_members
  FOR SELECT
  TO authenticated
  USING (true);

-- 3. event_bar_favorites: somente autenticados (contagens via get_bar_favorite_counts SECURITY DEFINER)
DROP POLICY IF EXISTS "Anyone can view favorites" ON public.event_bar_favorites;
CREATE POLICY "Authenticated can view favorites"
  ON public.event_bar_favorites
  FOR SELECT
  TO authenticated
  USING (true);

-- 4. event_checkins: somente autenticados
DROP POLICY IF EXISTS "Anyone can view event_checkins" ON public.event_checkins;
CREATE POLICY "Authenticated can view checkins"
  ON public.event_checkins
  FOR SELECT
  TO authenticated
  USING (true);

-- 5. event_consumption: somente autenticados
DROP POLICY IF EXISTS "Anyone can view event_consumption" ON public.event_consumption;
CREATE POLICY "Authenticated can view consumption"
  ON public.event_consumption
  FOR SELECT
  TO authenticated
  USING (true);

-- 6. event_votes: somente autenticados
DROP POLICY IF EXISTS "Anyone can view event_votes" ON public.event_votes;
CREATE POLICY "Authenticated can view event_votes"
  ON public.event_votes
  FOR SELECT
  TO authenticated
  USING (true);

-- 7. event_achievements: somente autenticados
DROP POLICY IF EXISTS "Anyone can view event_achievements" ON public.event_achievements;
CREATE POLICY "Authenticated can view event_achievements"
  ON public.event_achievements
  FOR SELECT
  TO authenticated
  USING (true);

-- Função pública para contagem de membros (para rodapés/cards anônimos), caso queiram contar fora da RPC já existente
CREATE OR REPLACE FUNCTION public.get_event_member_count(_event_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::bigint FROM public.event_members WHERE event_id = _event_id;
$$;