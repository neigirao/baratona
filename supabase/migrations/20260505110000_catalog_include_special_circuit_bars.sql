-- Expande get_user_bar_catalog para incluir bares de circuitos especiais
-- além dos bares já usados em eventos próprios do usuário.
CREATE OR REPLACE FUNCTION public.get_user_bar_catalog(_user_id uuid)
RETURNS TABLE(name text, address text, neighborhood text, scheduled_time text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT DISTINCT ON (lower(trim(eb.name)))
    eb.name,
    coalesce(eb.address, '') AS address,
    eb.neighborhood,
    eb.scheduled_time
  FROM public.event_bars eb
  JOIN public.events e ON e.id = eb.event_id
  WHERE
    -- bares dos próprios eventos do usuário
    (e.owner_user_id = _user_id AND _user_id = auth.uid())
    -- OU bares de qualquer circuito especial (público por natureza)
    OR e.event_type = 'special_circuit'
  ORDER BY lower(trim(eb.name)), eb.name;
$$;
