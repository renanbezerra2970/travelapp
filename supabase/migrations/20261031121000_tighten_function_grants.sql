revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.is_trip_member(uuid) from public, anon;
revoke execute on function public.shares_trip_with(uuid) from public, anon;
grant execute on function public.is_trip_member(uuid) to authenticated;
grant execute on function public.shares_trip_with(uuid) to authenticated;
