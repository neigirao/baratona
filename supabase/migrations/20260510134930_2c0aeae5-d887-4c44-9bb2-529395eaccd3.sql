
-- Harden legacy read-only tables: FORCE RLS + explicit restrictive deny policies for writes.
-- Defense in depth: even if a permissive policy is added by mistake, restrictive ones block writes.

ALTER TABLE public.achievements  FORCE ROW LEVEL SECURITY;
ALTER TABLE public.bars          FORCE ROW LEVEL SECURITY;
ALTER TABLE public.checkins      FORCE ROW LEVEL SECURITY;
ALTER TABLE public.consumption   FORCE ROW LEVEL SECURITY;
ALTER TABLE public.participants  FORCE ROW LEVEL SECURITY;
ALTER TABLE public.votes         FORCE ROW LEVEL SECURITY;

-- Helper: drop-if-exists then create restrictive deny policies for INSERT/UPDATE/DELETE.
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['achievements','bars','checkins','consumption','participants','votes']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'legacy_readonly_block_insert', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'legacy_readonly_block_update', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'legacy_readonly_block_delete', t);

    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR INSERT TO public WITH CHECK (false)',
      'legacy_readonly_block_insert', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR UPDATE TO public USING (false) WITH CHECK (false)',
      'legacy_readonly_block_update', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR DELETE TO public USING (false)',
      'legacy_readonly_block_delete', t);
  END LOOP;
END $$;

-- app_config: keep super_admin writes, but harden by also FORCING RLS so table owner
-- cannot bypass policies. Service role retains access via BYPASSRLS attribute.
ALTER TABLE public.app_config FORCE ROW LEVEL SECURITY;

-- Add a restrictive policy ensuring DELETE remains forbidden for everyone in app_config.
DROP POLICY IF EXISTS app_config_block_delete ON public.app_config;
CREATE POLICY app_config_block_delete ON public.app_config
  AS RESTRICTIVE FOR DELETE TO public USING (false);

-- Restrictive guard on app_config writes: only super_admins may pass (in addition to existing permissive policies).
DROP POLICY IF EXISTS app_config_restrict_writes_insert ON public.app_config;
CREATE POLICY app_config_restrict_writes_insert ON public.app_config
  AS RESTRICTIVE FOR INSERT TO public
  WITH CHECK (public.has_platform_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS app_config_restrict_writes_update ON public.app_config;
CREATE POLICY app_config_restrict_writes_update ON public.app_config
  AS RESTRICTIVE FOR UPDATE TO public
  USING (public.has_platform_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_platform_role(auth.uid(), 'super_admin'));
