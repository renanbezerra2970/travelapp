-- "Vi" (estive lá / vi a obra) e "Aprendi" (li a história) contam pontos separados no ranking
alter table public.poi_checkins add column kind text not null default 'seen' check (kind in ('seen','learned'));
alter table public.poi_checkins drop constraint poi_checkins_pkey;
alter table public.poi_checkins add primary key (trip_id, user_id, poi_id, kind);
alter table public.poi_checkins add column xp int not null default 0 check (xp between 0 and 200);
create index poi_checkins_trip_idx on public.poi_checkins(trip_id);
