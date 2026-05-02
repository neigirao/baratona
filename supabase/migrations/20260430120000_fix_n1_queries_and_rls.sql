-- Fix N+1 queries: RPCs for owner and joined event listings with counts
-- Also fixes RLS for private event member inserts

-- RPC: events owned by a user, with bar_count and member_count
create or replace function get_events_by_owner(_owner_id uuid)
returns table (
  id uuid,
  slug text,
  name text,
  description text,
  city text,
  visibility text,
  event_type text,
  owner_user_id uuid,
  owner_name text,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  event_date date,
  start_date date,
  end_date date,
  cover_image_url text,
  external_source_url text,
  bar_count bigint,
  member_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    e.*,
    coalesce(b.bar_count, 0) as bar_count,
    coalesce(m.member_count, 0) as member_count
  from events e
  left join (
    select event_id, count(*) as bar_count
    from event_bars
    group by event_id
  ) b on b.event_id = e.id
  left join (
    select event_id, count(*) as member_count
    from event_members
    group by event_id
  ) m on m.event_id = e.id
  where e.owner_user_id = _owner_id
  order by e.created_at desc;
$$;

-- RPC: events joined by a user (via event_members), with bar_count and member_count
create or replace function get_events_joined_by_user(_user_id uuid)
returns table (
  id uuid,
  slug text,
  name text,
  description text,
  city text,
  visibility text,
  event_type text,
  owner_user_id uuid,
  owner_name text,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  event_date date,
  start_date date,
  end_date date,
  cover_image_url text,
  external_source_url text,
  bar_count bigint,
  member_count bigint,
  member_role text,
  member_joined_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    e.*,
    coalesce(b.bar_count, 0) as bar_count,
    coalesce(m_all.member_count, 0) as member_count,
    em.role as member_role,
    em.created_at as member_joined_at
  from event_members em
  join events e on e.id = em.event_id
  left join (
    select event_id, count(*) as bar_count
    from event_bars
    group by event_id
  ) b on b.event_id = e.id
  left join (
    select event_id, count(*) as member_count
    from event_members
    group by event_id
  ) m_all on m_all.event_id = e.id
  where em.user_id = _user_id
  order by em.created_at desc;
$$;

-- Fix RLS: block insert into event_members for private events without a valid invite
-- Drop old permissive insert policy if it exists
drop policy if exists "event_members_insert_self" on public.event_members;

-- New policy: allow insert only if:
--   1) event is public, OR
--   2) user is the event owner, OR
--   3) user is super_admin, OR
--   4) a valid (non-expired, not exhausted) invite exists
create policy "event_members_insert_with_access" on public.event_members
for insert with check (
  auth.uid() = user_id
  and (
    exists (
      select 1 from public.events ev
      where ev.id = event_members.event_id
        and (
          ev.visibility = 'public'
          or ev.owner_user_id = auth.uid()
          or exists (
            select 1 from public.platform_roles pr
            where pr.user_id = auth.uid() and pr.role = 'super_admin'
          )
          or exists (
            select 1 from public.event_invites ei
            where ei.event_id = event_members.event_id
              and (ei.expires_at is null or ei.expires_at > now())
              and (ei.max_uses is null or ei.uses < ei.max_uses)
          )
        )
    )
  )
);
