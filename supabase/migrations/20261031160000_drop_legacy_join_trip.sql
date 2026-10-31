-- Entrada só por convite pessoal (Edge Function invites); o código de viagem antigo deixa de valer
drop function if exists public.join_trip(text);
update public.trips set invite_code = replace(gen_random_uuid()::text, '-', '');
