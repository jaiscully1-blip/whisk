-- Profile pictures: one public square photo per player, stored as avatars/<their 6-letter code>.jpg.
-- Only the owner can add, replace or delete theirs (the file name has to be their own code); anyone can see it.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 524288, array['image/jpeg'])
on conflict (id) do update set public = true, file_size_limit = 524288, allowed_mime_types = array['image/jpeg'];

create or replace function public.my_avatar_name() returns text language sql security definer set search_path = public, pg_temp as $$
  select public._my_code(auth.uid()) || '.jpg'
$$;
revoke execute on function public.my_avatar_name() from public, anon;
grant execute on function public.my_avatar_name() to authenticated;

drop policy if exists avatars_select on storage.objects;
drop policy if exists avatars_insert on storage.objects;
drop policy if exists avatars_update on storage.objects;
drop policy if exists avatars_delete on storage.objects;
create policy avatars_select on storage.objects for select to authenticated using (bucket_id = 'avatars');
create policy avatars_insert on storage.objects for insert to authenticated with check (bucket_id = 'avatars' and name = public.my_avatar_name());
create policy avatars_update on storage.objects for update to authenticated using (bucket_id = 'avatars' and name = public.my_avatar_name()) with check (bucket_id = 'avatars' and name = public.my_avatar_name());
create policy avatars_delete on storage.objects for delete to authenticated using (bucket_id = 'avatars' and name = public.my_avatar_name());
