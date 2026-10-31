-- Fotos do dia: até 20 por viajante por dia da viagem. Arquivos no bucket privado trip-photos
-- em {trip_id}/{user_id}/{day}/{arquivo}.jpg; metadados aqui (base para o vídeo e os shorts).
create table public.trip_photos (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  day text not null check (day ~ '^\d{2}/\d{2}$'),
  path text not null unique,
  caption text check (char_length(caption) <= 280),
  taken_at timestamptz,
  lat double precision,
  lng double precision,
  width int,
  height int,
  favorite boolean not null default false,
  created_at timestamptz not null default now()
);
create index trip_photos_trip_day_idx on public.trip_photos(trip_id, day);
alter table public.trip_photos enable row level security;

create or replace function public.enforce_photo_limit()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.trip_photos where trip_id = new.trip_id and user_id = new.user_id and day = new.day) >= 20 then
    raise exception 'limite de 20 fotos por dia atingido';
  end if;
  return new;
end $$;
revoke execute on function public.enforce_photo_limit() from public, anon, authenticated;
create trigger trip_photos_limit before insert on public.trip_photos for each row execute function public.enforce_photo_limit();

create policy "photos: members or admin read" on public.trip_photos for select to authenticated
  using (public.is_trip_member(trip_id) or public.is_admin());
create policy "photos: insert own" on public.trip_photos for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_trip_member(trip_id));
create policy "photos: update own" on public.trip_photos for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "photos: delete own or admin" on public.trip_photos for delete to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

alter publication supabase_realtime add table public.trip_photos;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('trip-photos', 'trip-photos', false, 12582912, array['image/jpeg','image/png','image/webp','image/heic'])
on conflict (id) do nothing;

create policy "trip-photos: members or admin read" on storage.objects for select to authenticated
  using (bucket_id = 'trip-photos' and (public.is_trip_member(((storage.foldername(name))[1])::uuid) or public.is_admin()));
create policy "trip-photos: upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'trip-photos'
    and (storage.foldername(name))[2] = (select auth.uid())::text
    and public.is_trip_member(((storage.foldername(name))[1])::uuid));
create policy "trip-photos: delete own or admin" on storage.objects for delete to authenticated
  using (bucket_id = 'trip-photos' and ((storage.foldername(name))[2] = (select auth.uid())::text or public.is_admin()));
