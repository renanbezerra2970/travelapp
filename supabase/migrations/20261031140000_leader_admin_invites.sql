-- Login sem e-mail: o líder (ou o admin) cria o viajante, envia um link pessoal e a pessoa define a senha.
alter table public.profiles add column username text unique;
alter table public.profiles add column is_admin boolean not null default false;

create table public.invites (
  token text primary key default replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
  trip_id uuid references public.trips(id) on delete cascade,
  display_name text not null,
  username text not null,
  role text not null default 'member' check (role in ('owner','member','admin')),
  user_id uuid references auth.users(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  expires_at timestamptz not null default now() + interval '30 days'
);
create index invites_trip_idx on public.invites(trip_id);
alter table public.invites enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = (select auth.uid())), false);
$$;
create or replace function public.is_trip_owner(p_trip uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.trip_members m where m.trip_id = p_trip and m.user_id = (select auth.uid()) and m.role = 'owner');
$$;
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.is_trip_owner(uuid) from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_trip_owner(uuid) to authenticated;

create policy "invites: owner/admin read" on public.invites for select to authenticated
  using (public.is_admin() or (trip_id is not null and public.is_trip_owner(trip_id)));

drop policy "trips: members read" on public.trips;
create policy "trips: members or admin read" on public.trips for select to authenticated
  using (public.is_trip_member(id) or public.is_admin());

drop policy "members: read same trip" on public.trip_members;
create policy "members: read same trip or admin" on public.trip_members for select to authenticated
  using (public.is_trip_member(trip_id) or public.is_admin());
create policy "members: owner/admin remove" on public.trip_members for delete to authenticated
  using (public.is_admin() or (public.is_trip_owner(trip_id) and user_id <> (select auth.uid())));

drop policy "profiles: self or trip mates" on public.profiles;
create policy "profiles: self, trip mates or admin" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.shares_trip_with(id) or public.is_admin());

create or replace function public.protect_profile()
returns trigger language plpgsql set search_path = '' as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.is_admin := old.is_admin;
    new.username := old.username;
  end if;
  return new;
end $$;
create trigger protect_profile before update on public.profiles for each row execute function public.protect_profile();

drop policy "locations: members read" on public.member_locations;
create policy "locations: members or admin read" on public.member_locations for select to authenticated
  using (public.is_trip_member(trip_id) or public.is_admin());

drop policy "checkins: members read" on public.poi_checkins;
create policy "checkins: members or admin read" on public.poi_checkins for select to authenticated
  using (public.is_trip_member(trip_id) or public.is_admin());

-- Convites iniciais (Renan admin, David líder) foram criados direto no banco; os tokens não ficam no repositório.
