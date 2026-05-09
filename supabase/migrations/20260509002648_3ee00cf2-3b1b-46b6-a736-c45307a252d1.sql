-- 1) Enums
DO $$ BEGIN CREATE TYPE public.app_role AS ENUM ('super_admin','user'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.event_member_role AS ENUM ('event_owner','organizer','participant'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.event_visibility_t AS ENUM ('public','private'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.event_type_t AS ENUM ('open_baratona','special_circuit'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.event_status_t AS ENUM ('draft','published','active','live','finished','archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.consumption_type_t AS ENUM ('drink','food','joke'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.drink_subtype_t AS ENUM ('cerveja','cachaca','drink','batida'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.van_status_t AS ENUM ('at_bar','in_transit','finished'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Drop dependents
DROP FUNCTION IF EXISTS public.get_public_events_with_counts();
DROP FUNCTION IF EXISTS public.admin_list_all_events();
DROP POLICY IF EXISTS "Public events visible to all" ON public.events;
ALTER TABLE public.consumption DROP CONSTRAINT IF EXISTS consumption_type_check;
ALTER TABLE public.app_config DROP CONSTRAINT IF EXISTS app_config_status_check;
DROP INDEX IF EXISTS public.event_consumption_unique_idx;

-- 3) Convert columns
ALTER TABLE public.platform_roles
  ALTER COLUMN role DROP DEFAULT,
  ALTER COLUMN role TYPE public.app_role USING role::public.app_role,
  ALTER COLUMN role SET DEFAULT 'user'::public.app_role;

ALTER TABLE public.event_members
  ALTER COLUMN role DROP DEFAULT,
  ALTER COLUMN role TYPE public.event_member_role USING role::public.event_member_role,
  ALTER COLUMN role SET DEFAULT 'participant'::public.event_member_role;

ALTER TABLE public.events
  ALTER COLUMN visibility DROP DEFAULT,
  ALTER COLUMN visibility TYPE public.event_visibility_t USING visibility::public.event_visibility_t,
  ALTER COLUMN visibility SET DEFAULT 'public'::public.event_visibility_t,
  ALTER COLUMN event_type DROP DEFAULT,
  ALTER COLUMN event_type TYPE public.event_type_t USING event_type::public.event_type_t,
  ALTER COLUMN event_type SET DEFAULT 'open_baratona'::public.event_type_t,
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE public.event_status_t USING status::public.event_status_t,
  ALTER COLUMN status SET DEFAULT 'draft'::public.event_status_t;

ALTER TABLE public.consumption
  ALTER COLUMN type TYPE public.consumption_type_t USING type::public.consumption_type_t,
  ALTER COLUMN subtype TYPE public.drink_subtype_t USING NULLIF(subtype,'')::public.drink_subtype_t;

ALTER TABLE public.event_consumption
  ALTER COLUMN type TYPE public.consumption_type_t USING type::public.consumption_type_t,
  ALTER COLUMN subtype TYPE public.drink_subtype_t USING NULLIF(subtype,'')::public.drink_subtype_t;

ALTER TABLE public.app_config
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE public.van_status_t USING status::public.van_status_t,
  ALTER COLUMN status SET DEFAULT 'at_bar'::public.van_status_t;

ALTER TABLE public.event_app_config
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE public.van_status_t USING status::public.van_status_t,
  ALTER COLUMN status SET DEFAULT 'at_bar'::public.van_status_t;

-- 4) Recreate dropped objects
CREATE POLICY "Public events visible to all"
  ON public.events
  FOR SELECT
  USING ((visibility = 'public'::public.event_visibility_t) OR (owner_user_id = auth.uid()));

CREATE UNIQUE INDEX event_consumption_unique_idx
  ON public.event_consumption (event_id, user_id, type, bar_id, subtype) NULLS NOT DISTINCT;

-- 5) has_platform_role
CREATE OR REPLACE FUNCTION public.has_platform_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_roles
    WHERE user_id = _user_id AND role::text = _role
  );
$$;

-- 6) is_featured flag
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS events_is_featured_idx ON public.events (is_featured) WHERE is_featured = true;
UPDATE public.events SET is_featured = true WHERE slug = 'comida-di-buteco-rj-2026';

-- 7) RPCs
CREATE OR REPLACE FUNCTION public.get_public_events_with_counts()
 RETURNS TABLE(id uuid, slug text, name text, description text, city text, visibility text, event_type text, status text, owner_user_id uuid, owner_name text, created_at timestamp with time zone, updated_at timestamp with time zone, event_date date, start_date date, end_date date, cover_image_url text, external_source_url text, is_featured boolean, bar_count bigint, member_count bigint)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT
    e.id, e.slug, e.name, e.description, e.city, e.visibility::text, e.event_type::text,
    e.status::text, e.owner_user_id, e.owner_name, e.created_at, e.updated_at,
    e.event_date, e.start_date, e.end_date, e.cover_image_url, e.external_source_url,
    e.is_featured,
    COALESCE((SELECT COUNT(*) FROM public.event_bars eb WHERE eb.event_id = e.id), 0),
    COALESCE((SELECT COUNT(*) FROM public.event_members em WHERE em.event_id = e.id), 0)
  FROM public.events e
  WHERE e.visibility = 'public'
  ORDER BY e.is_featured DESC, e.created_at DESC;
$function$;

CREATE OR REPLACE FUNCTION public.admin_list_all_events()
 RETURNS TABLE(id uuid, slug text, name text, description text, city text, visibility text, event_type text, status text, owner_user_id uuid, owner_name text, created_at timestamp with time zone, updated_at timestamp with time zone, event_date date, start_date date, end_date date, cover_image_url text, external_source_url text, is_featured boolean, bar_count bigint, member_count bigint)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_platform_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN QUERY
  SELECT
    e.id, e.slug, e.name, e.description, e.city, e.visibility::text, e.event_type::text,
    e.status::text, e.owner_user_id, e.owner_name, e.created_at, e.updated_at,
    e.event_date, e.start_date, e.end_date, e.cover_image_url, e.external_source_url,
    e.is_featured,
    COALESCE((SELECT COUNT(*) FROM public.event_bars eb WHERE eb.event_id = e.id), 0),
    COALESCE((SELECT COUNT(*) FROM public.event_members em WHERE em.event_id = e.id), 0)
  FROM public.events e
  ORDER BY e.is_featured DESC, e.created_at DESC;
END
$function$;