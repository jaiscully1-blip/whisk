-- 0020: Friends and the plate feed. Safe to run more than once. Run after 0019.
--  • Friends: add someone with their 6-letter code (the same code as Invite a friend). They get a request and say
--    yes or no. Friends are always both ways; either one can remove the other.
--  • Plates are private by default. A player can share a plate; only their friends see it (and they do).
--  • Anyone who can see a plate can love it (once). Anyone can report a plate they can see: it disappears for them
--    right away, and for everyone after reports from 2 different players (admins see the reports).
-- Everything goes through the functions below; the tables can't be read or written directly.

alter table public.meals add column if not exists shared_at timestamptz;     -- null = private (the default)
alter table public.meals add column if not exists hidden_at timestamptz;     -- set by reports

create table if not exists public.friends (
  user_id uuid not null references auth.users (id) on delete cascade,
  friend_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);
create table if not exists public.friend_requests (
  from_id uuid not null references auth.users (id) on delete cascade,
  to_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (from_id, to_id),
  check (from_id <> to_id)
);
create index if not exists friend_requests_to_idx on public.friend_requests (to_id);
create table if not exists public.meal_loves (
  meal_id uuid not null references public.meals (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (meal_id, user_id)
);
create table if not exists public.meal_reports (
  meal_id uuid not null references public.meals (id) on delete cascade,
  reporter uuid not null references auth.users (id) on delete cascade,
  reason text not null default 'other' check (reason in ('not_food', 'rude', 'spam', 'other')),
  created_at timestamptz not null default now(),
  primary key (meal_id, reporter)
);
create index if not exists meals_shared_idx on public.meals (user_id, shared_at desc) where shared_at is not null;
alter table public.friends enable row level security;
alter table public.friend_requests enable row level security;
alter table public.meal_loves enable row level security;
alter table public.meal_reports enable row level security;
-- no policies: only the functions below (security definer) touch these tables
revoke all on public.friends, public.friend_requests, public.meal_loves, public.meal_reports from anon, authenticated;

-- the player's own 6-letter code (made the first time it's needed; same as the invite code)
create or replace function public._my_code(uid uuid) returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare c text;
begin
  select ref_code into c from profiles where id = uid;
  if c is null then
    for i in 1..20 loop c := _code6(); exit when not exists (select 1 from profiles where ref_code = c); end loop;
    update profiles set ref_code = c where id = uid;
  end if;
  return c;
end $$;

create or replace function public._are_friends(a uuid, b uuid) returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from friends where user_id = a and friend_id = b);
$$;

-- what a viewer may see: their own shared plates and their friends' shared plates, not hidden, not reported by them
create or replace function public._plate_visible(viewer uuid, m meals) returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select m.shared_at is not null and m.hidden_at is null and viewer is not null
    and (m.user_id = viewer or _are_friends(viewer, m.user_id))
    and not exists (select 1 from meal_reports r where r.meal_id = m.id and r.reporter = viewer);
$$;

create or replace function public.get_friends() returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  return jsonb_build_object(
    'code', _my_code(uid),
    'friends', coalesce((select jsonb_agg(jsonb_build_object('code', _my_code(f.friend_id), 'name', coalesce(nullif(trim(p.display_name), ''), 'Chef')) order by p.display_name)
      from friends f join profiles p on p.id = f.friend_id where f.user_id = uid), '[]'::jsonb),
    'requests', coalesce((select jsonb_agg(jsonb_build_object('code', _my_code(r.from_id), 'name', coalesce(nullif(trim(p.display_name), ''), 'Chef')) order by r.created_at)
      from friend_requests r join profiles p on p.id = r.from_id where r.to_id = uid), '[]'::jsonb),
    'sent', (select count(*) from friend_requests where from_id = uid));
end $$;

create or replace function public.add_friend(p_code text) returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); other uuid;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select id into other from profiles where ref_code = upper(trim(p_code));
  if other is null then raise exception 'no player with that code'; end if;
  if other = uid then raise exception 'that''s your own code'; end if;
  if _are_friends(uid, other) then return 'friends'; end if;
  if exists (select 1 from friend_requests where from_id = other and to_id = uid) then   -- they asked you first: done
    delete from friend_requests where (from_id = other and to_id = uid) or (from_id = uid and to_id = other);
    insert into friends (user_id, friend_id) values (uid, other), (other, uid) on conflict do nothing;
    return 'friends';
  end if;
  if (select count(*) from friend_requests where from_id = uid and created_at > now() - interval '1 day') >= 20 then raise exception 'too many requests today'; end if;
  if (select count(*) from friends where user_id = uid) >= 200 then raise exception 'friend list is full'; end if;
  insert into friend_requests (from_id, to_id) values (uid, other) on conflict do nothing;
  return 'requested';
end $$;

create or replace function public.answer_friend(p_code text, p_accept boolean) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); other uuid;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select id into other from profiles where ref_code = upper(trim(p_code));
  if other is null or not exists (select 1 from friend_requests where from_id = other and to_id = uid) then raise exception 'no request from that player'; end if;
  delete from friend_requests where (from_id = other and to_id = uid) or (from_id = uid and to_id = other);
  if p_accept then insert into friends (user_id, friend_id) values (uid, other), (other, uid) on conflict do nothing; end if;
end $$;

create or replace function public.remove_friend(p_code text) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); other uuid;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select id into other from profiles where ref_code = upper(trim(p_code));
  delete from friends where (user_id = uid and friend_id = other) or (user_id = other and friend_id = uid);
end $$;

create or replace function public.set_meal_shared(p_meal uuid, p_shared boolean) returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  update meals set shared_at = case when p_shared then coalesce(shared_at, now()) end where id = p_meal and user_id = uid and photo_path is not null;
  return found;
end $$;

-- The feed, newest first, 20 at a time (pass the last cooked time to get older ones).
create or replace function public.get_feed(p_before timestamptz default null) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  return coalesce((select jsonb_agg(x order by (x ->> 'at') desc) from (
    select jsonb_build_object('id', m.id, 'mine', m.user_id = uid, 'name', coalesce(nullif(trim(p.display_name), ''), 'Chef'),
      'title', m.title, 'cuisine', m.cuisine, 'photo', m.photo_path, 'at', m.shared_at,
      'loves', (select count(*) from meal_loves l where l.meal_id = m.id), 'loved', exists (select 1 from meal_loves l where l.meal_id = m.id and l.user_id = uid)) x
    from meals m join profiles p on p.id = m.user_id
    where (m.user_id = uid or m.user_id in (select friend_id from friends where user_id = uid))
      and _plate_visible(uid, m) and (p_before is null or m.shared_at < p_before)
    order by m.shared_at desc limit 20) t), '[]'::jsonb);
end $$;

create or replace function public.love_meal(p_meal uuid, p_on boolean) returns int language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); m meals%rowtype;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select * into m from meals where id = p_meal;
  if not found or not _plate_visible(uid, m) then raise exception 'not found'; end if;
  if p_on then insert into meal_loves (meal_id, user_id) values (p_meal, uid) on conflict do nothing;
  else delete from meal_loves where meal_id = p_meal and user_id = uid; end if;
  return (select count(*) from meal_loves where meal_id = p_meal);
end $$;

create or replace function public.report_meal(p_meal uuid, p_reason text) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); m meals%rowtype;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select * into m from meals where id = p_meal;
  if not found or not _plate_visible(uid, m) then raise exception 'not found'; end if;
  if m.user_id = uid then raise exception 'that''s your own plate'; end if;
  insert into meal_reports (meal_id, reporter, reason) values (p_meal, uid, case when p_reason in ('not_food', 'rude', 'spam') then p_reason else 'other' end) on conflict do nothing;
  if (select count(distinct reporter) from meal_reports where meal_id = p_meal) >= 2 then update meals set hidden_at = now() where id = p_meal; end if;
end $$;

-- admins: reported plates, newest first
create or replace function public.admin_reports() returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not coalesce((select is_admin from profiles where id = auth.uid()), false) then raise exception 'admins only'; end if;
  return coalesce((select jsonb_agg(x order by (x ->> 'last') desc) from (
    select jsonb_build_object('meal', m.id, 'title', m.title, 'name', coalesce(p.display_name, 'Chef'), 'photo', m.photo_path, 'hidden', m.hidden_at is not null,
      'reports', count(r.*), 'reasons', jsonb_agg(distinct r.reason), 'last', max(r.created_at)) x
    from meal_reports r join meals m on m.id = r.meal_id join profiles p on p.id = m.user_id group by m.id, p.display_name order by max(r.created_at) desc limit 100) t), '[]'::jsonb);
end $$;

-- admins: hide a reported plate for everyone, or put it back
create or replace function public.admin_set_hidden(p_meal uuid, p_hidden boolean) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not coalesce((select is_admin from profiles where id = auth.uid()), false) then raise exception 'admins only'; end if;
  update meals set hidden_at = case when p_hidden then coalesce(hidden_at, now()) end where id = p_meal;
  if not p_hidden then delete from meal_reports where meal_id = p_meal; end if;
end $$;

-- friends can open the photo of a plate they can see
-- (admins can also open photos that were reported, to check them)
create or replace function public._feed_photo_visible(p_name text) returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from meals m where m.photo_path = p_name and _plate_visible(auth.uid(), m))
    or (coalesce((select is_admin from profiles where id = auth.uid()), false)
        and exists (select 1 from meals m join meal_reports r on r.meal_id = m.id where m.photo_path = p_name));
$$;
drop policy if exists feed_photos_select on storage.objects;
create policy feed_photos_select on storage.objects for select to authenticated using (bucket_id = 'meal-photos' and public._feed_photo_visible(name));

revoke execute on function public.get_friends(), public.add_friend(text), public.answer_friend(text, boolean), public.remove_friend(text), public.set_meal_shared(uuid, boolean),
  public.get_feed(timestamptz), public.love_meal(uuid, boolean), public.report_meal(uuid, text), public.admin_reports(), public.admin_set_hidden(uuid, boolean) from public, anon;
grant execute on function public.get_friends(), public.add_friend(text), public.answer_friend(text, boolean), public.remove_friend(text), public.set_meal_shared(uuid, boolean),
  public.get_feed(timestamptz), public.love_meal(uuid, boolean), public.report_meal(uuid, text), public.admin_reports(), public.admin_set_hidden(uuid, boolean) to authenticated;
revoke execute on function public._my_code(uuid), public._are_friends(uuid, uuid), public._plate_visible(uuid, meals) from public, anon, authenticated;
grant execute on function public._feed_photo_visible(text) to authenticated;
