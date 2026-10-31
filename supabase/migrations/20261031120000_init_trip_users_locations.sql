-- Usuários, viagens, localização ao vivo e capturas de pontos turísticos.
-- Os dados privados da viagem (códigos de reserva, PINs, links do Drive) vivem em trips.private_data,
-- legíveis só por membros. Seed da viagem não fica no repositório.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Viajante',
  avatar text not null default '🧳',
  color text not null default '#E4572E',
  created_at timestamptz not null default now()
);

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  invite_code text unique not null,
  private_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.trip_members (
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  joined_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);
create index trip_members_user_idx on public.trip_members(user_id);

create table public.member_locations (
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  accuracy real,
  heading real,
  is_simulated boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);

create table public.poi_checkins (
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  poi_id text not null,
  created_at timestamptz not null default now(),
  primary key (trip_id, user_id, poi_id)
);

create or replace function public.is_trip_member(p_trip uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.trip_members m where m.trip_id = p_trip and m.user_id = (select auth.uid()));
$$;

create or replace function public.shares_trip_with(p_user uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.trip_members a join public.trip_members b on a.trip_id = b.trip_id
    where a.user_id = (select auth.uid()) and b.user_id = p_user);
$$;

create or replace function public.join_trip(p_code text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_trip uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select id into v_trip from public.trips where upper(invite_code) = upper(trim(p_code));
  if v_trip is null then raise exception 'invalid invite code'; end if;
  insert into public.trip_members(trip_id, user_id) values (v_trip, auth.uid()) on conflict do nothing;
  return v_trip;
end $$;
revoke execute on function public.join_trip(text) from anon, public;
grant execute on function public.join_trip(text) to authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, display_name, avatar, color)
  values (new.id,
    coalesce(nullif(new.raw_user_meta_data->>'display_name',''), split_part(new.email,'@',1)),
    coalesce(nullif(new.raw_user_meta_data->>'avatar',''), '🧳'),
    coalesce(nullif(new.raw_user_meta_data->>'color',''), '#E4572E'));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.member_locations enable row level security;
alter table public.poi_checkins enable row level security;

create policy "profiles: self or trip mates" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.shares_trip_with(id));
create policy "profiles: update self" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "trips: members read" on public.trips for select to authenticated
  using (public.is_trip_member(id));

create policy "members: read same trip" on public.trip_members for select to authenticated
  using (public.is_trip_member(trip_id));
create policy "members: leave" on public.trip_members for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "locations: members read" on public.member_locations for select to authenticated
  using (public.is_trip_member(trip_id));
create policy "locations: insert own" on public.member_locations for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_trip_member(trip_id));
create policy "locations: update own" on public.member_locations for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()) and public.is_trip_member(trip_id));
create policy "locations: delete own" on public.member_locations for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "checkins: members read" on public.poi_checkins for select to authenticated
  using (public.is_trip_member(trip_id));
create policy "checkins: insert own" on public.poi_checkins for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_trip_member(trip_id));
create policy "checkins: delete own" on public.poi_checkins for delete to authenticated
  using (user_id = (select auth.uid()));

alter publication supabase_realtime add table public.member_locations;
alter publication supabase_realtime add table public.poi_checkins;
alter publication supabase_realtime add table public.trip_members;
