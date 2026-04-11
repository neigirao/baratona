-- Platform v1: multi-event core

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.platform_roles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  role text not null check (role in ('super_admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  city text not null default 'Rio de Janeiro',
  visibility text not null default 'public' check (visibility in ('public','private')),
  event_type text not null default 'open_baratona' check (event_type in ('open_baratona','special_circuit')),
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft','published','finished')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.event_members (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('event_owner','participant')),
  created_at timestamptz not null default now(),
  unique(event_id, user_id)
);

create table if not exists public.event_invites (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  invite_code text not null unique,
  max_uses int,
  uses int not null default 0,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.platform_roles enable row level security;
alter table public.events enable row level security;
alter table public.event_members enable row level security;
alter table public.event_invites enable row level security;

-- profiles
create policy if not exists "profiles_select_all" on public.profiles for select using (true);
create policy if not exists "profiles_upsert_self" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);

-- platform_roles
create policy if not exists "platform_roles_self_select" on public.platform_roles for select using (auth.uid() = user_id);

-- events
create policy if not exists "events_public_select" on public.events
for select using (
  visibility = 'public'
  or owner_user_id = auth.uid()
  or exists (
    select 1 from public.event_members em
    where em.event_id = events.id and em.user_id = auth.uid()
  )
  or exists (
    select 1 from public.platform_roles pr
    where pr.user_id = auth.uid() and pr.role = 'super_admin'
  )
);

create policy if not exists "events_insert_owner" on public.events
for insert with check (owner_user_id = auth.uid());

create policy if not exists "events_update_owner_or_super_admin" on public.events
for update using (
  owner_user_id = auth.uid()
  or exists (
    select 1 from public.platform_roles pr
    where pr.user_id = auth.uid() and pr.role = 'super_admin'
  )
);

create policy if not exists "events_delete_owner_or_super_admin" on public.events
for delete using (
  owner_user_id = auth.uid()
  or exists (
    select 1 from public.platform_roles pr
    where pr.user_id = auth.uid() and pr.role = 'super_admin'
  )
);

-- event_members
create policy if not exists "event_members_select_participants" on public.event_members
for select using (
  user_id = auth.uid()
  or exists (
    select 1 from public.events e where e.id = event_id and e.owner_user_id = auth.uid()
  )
);

create policy if not exists "event_members_insert_owner" on public.event_members
for insert with check (
  exists (
    select 1 from public.events e where e.id = event_id and e.owner_user_id = auth.uid()
  )
);

-- event_invites
create policy if not exists "event_invites_owner_manage" on public.event_invites
for all using (
  exists (
    select 1 from public.events e where e.id = event_id and e.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.events e where e.id = event_id and e.owner_user_id = auth.uid()
  )
);

-- helper trigger for updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
before update on public.events
for each row execute function public.set_updated_at();
