-- Platform v1 runtime tables for full event operation

create table if not exists public.event_bars (
  id bigserial primary key,
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  address text not null,
  latitude double precision,
  longitude double precision,
  bar_order int not null,
  scheduled_time time not null,
  unique(event_id, bar_order)
);

create table if not exists public.event_app_config (
  id bigserial primary key,
  event_id uuid not null unique references public.events(id) on delete cascade,
  status text not null default 'at_bar' check (status in ('at_bar','in_transit','finished')),
  current_bar_id bigint references public.event_bars(id) on delete set null,
  origin_bar_id bigint references public.event_bars(id) on delete set null,
  destination_bar_id bigint references public.event_bars(id) on delete set null,
  global_delay_minutes int not null default 0,
  broadcast_msg text,
  updated_at timestamptz not null default now()
);

create table if not exists public.event_checkins (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  bar_id bigint not null references public.event_bars(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  unique(event_id, bar_id, user_id)
);

create table if not exists public.event_consumption (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  bar_id bigint references public.event_bars(id) on delete set null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('drink','food')),
  subtype text,
  count int not null default 0,
  updated_at timestamptz not null default now(),
  unique(event_id, bar_id, user_id, type, subtype)
);

create table if not exists public.event_votes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  bar_id bigint not null references public.event_bars(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  drink_score int not null check (drink_score between 1 and 5),
  food_score int not null check (food_score between 1 and 5),
  vibe_score int not null check (vibe_score between 1 and 5),
  service_score int not null check (service_score between 1 and 5),
  created_at timestamptz not null default now(),
  unique(event_id, bar_id, user_id)
);

create table if not exists public.event_achievements (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  achievement_key text not null,
  unlocked_at timestamptz not null default now(),
  unique(event_id, user_id, achievement_key)
);

alter table public.event_bars enable row level security;
alter table public.event_app_config enable row level security;
alter table public.event_checkins enable row level security;
alter table public.event_consumption enable row level security;
alter table public.event_votes enable row level security;
alter table public.event_achievements enable row level security;

create or replace function public.can_access_event(target_event_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.events e
    where e.id = target_event_id
      and (
        e.visibility = 'public'
        or e.owner_user_id = auth.uid()
        or exists (
          select 1 from public.event_members em
          where em.event_id = e.id and em.user_id = auth.uid()
        )
        or exists (
          select 1 from public.platform_roles pr
          where pr.user_id = auth.uid() and pr.role = 'super_admin'
        )
      )
  );
$$;

create or replace function public.can_manage_event(target_event_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.events e
    where e.id = target_event_id
      and (
        e.owner_user_id = auth.uid()
        or exists (
          select 1 from public.platform_roles pr
          where pr.user_id = auth.uid() and pr.role = 'super_admin'
        )
      )
  );
$$;

create policy if not exists "event_bars_select" on public.event_bars
for select using (public.can_access_event(event_id));
create policy if not exists "event_bars_manage" on public.event_bars
for all using (public.can_manage_event(event_id)) with check (public.can_manage_event(event_id));

create policy if not exists "event_app_config_select" on public.event_app_config
for select using (public.can_access_event(event_id));
create policy if not exists "event_app_config_manage" on public.event_app_config
for all using (public.can_manage_event(event_id)) with check (public.can_manage_event(event_id));

create policy if not exists "event_checkins_select" on public.event_checkins
for select using (public.can_access_event(event_id));
create policy if not exists "event_checkins_insert_member" on public.event_checkins
for insert with check (
  public.can_access_event(event_id) and auth.uid() = user_id
);
create policy if not exists "event_checkins_manage_owner" on public.event_checkins
for update using (public.can_manage_event(event_id));

create policy if not exists "event_consumption_select" on public.event_consumption
for select using (public.can_access_event(event_id));
create policy if not exists "event_consumption_insert_member" on public.event_consumption
for insert with check (public.can_access_event(event_id) and auth.uid() = user_id);
create policy if not exists "event_consumption_update_owner_or_self" on public.event_consumption
for update using (public.can_manage_event(event_id) or auth.uid() = user_id);

create policy if not exists "event_votes_select" on public.event_votes
for select using (public.can_access_event(event_id));
create policy if not exists "event_votes_insert_self" on public.event_votes
for insert with check (public.can_access_event(event_id) and auth.uid() = user_id);
create policy if not exists "event_votes_update_self" on public.event_votes
for update using (auth.uid() = user_id);

create policy if not exists "event_achievements_select" on public.event_achievements
for select using (public.can_access_event(event_id));
create policy if not exists "event_achievements_manage_owner" on public.event_achievements
for all using (public.can_manage_event(event_id)) with check (public.can_manage_event(event_id));

drop trigger if exists event_app_config_set_updated_at on public.event_app_config;
create trigger event_app_config_set_updated_at
before update on public.event_app_config
for each row execute function public.set_updated_at();

drop trigger if exists event_consumption_set_updated_at on public.event_consumption;
create trigger event_consumption_set_updated_at
before update on public.event_consumption
for each row execute function public.set_updated_at();
