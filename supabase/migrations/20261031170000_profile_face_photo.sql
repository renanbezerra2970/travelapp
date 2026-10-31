-- Foto do rosto no lugar do emoji. Arquivo em avatars/{user_id}/{versão}.jpg (bucket privado:
-- só quem viaja junto, o próprio usuário e o admin enxergam).
alter table public.profiles add column avatar_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 3145728, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "avatars: self, trip mates or admin read" on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or public.shares_trip_with(((storage.foldername(name))[1])::uuid)
    or public.is_admin()));
create policy "avatars: upload own" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars: delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
