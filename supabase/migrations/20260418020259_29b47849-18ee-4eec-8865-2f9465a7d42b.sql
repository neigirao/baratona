-- Tighten event_invites SELECT: only owner can list invites
DROP POLICY IF EXISTS "Anyone can read invites" ON public.event_invites;

CREATE POLICY "Owner can read invites"
ON public.event_invites
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.events
  WHERE events.id = event_invites.event_id
    AND events.owner_user_id = auth.uid()
));

CREATE POLICY "Owner can delete invites"
ON public.event_invites
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.events
  WHERE events.id = event_invites.event_id
    AND events.owner_user_id = auth.uid()
));

-- RPC: redeem invite code, add as event member, increment used_count
CREATE OR REPLACE FUNCTION public.redeem_event_invite(_code text, _display_name text)
RETURNS TABLE(event_id uuid, slug text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite public.event_invites%ROWTYPE;
  v_event public.events%ROWTYPE;
  v_user uuid;
BEGIN
  v_user := auth.uid();
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT * INTO v_invite
  FROM public.event_invites
  WHERE upper(code) = upper(_code)
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invite_not_found';
  END IF;

  IF v_invite.expires_at IS NOT NULL AND v_invite.expires_at < now() THEN
    RAISE EXCEPTION 'invite_expired';
  END IF;

  IF v_invite.max_uses IS NOT NULL AND COALESCE(v_invite.used_count, 0) >= v_invite.max_uses THEN
    RAISE EXCEPTION 'invite_exhausted';
  END IF;

  SELECT * INTO v_event FROM public.events WHERE id = v_invite.event_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'event_not_found';
  END IF;

  -- Add as member (idempotent)
  INSERT INTO public.event_members (event_id, user_id, role, display_name)
  VALUES (v_invite.event_id, v_user, 'participant', NULLIF(_display_name, ''))
  ON CONFLICT DO NOTHING;

  -- Increment used_count
  UPDATE public.event_invites
  SET used_count = COALESCE(used_count, 0) + 1
  WHERE id = v_invite.id;

  event_id := v_event.id;
  slug := v_event.slug;
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_event_invite(text, text) TO authenticated;