-- 0021: Push notifications, only useful ones, at most one a day at the hour the player picks. Safe to run more
-- than once. Run after 0020.
--  • "Chicken expires tomorrow"   (pantry items going off today or tomorrow)
--  • "Defrost the beef tonight"   (frozen meat that isn't thawing yet)
--  • "Ana started a Cook Off"     (a friend makes a game; sent right away, only to friends who turned this on)
-- Nothing is sent on days with nothing useful to say. Notifications are off until the player turns them on.
-- Sending is done by the app's server: it proves itself with a secret (stored here only as a SHA-256 fingerprint,
-- like the payments secret; see setup/14 for the one-time steps).

alter table public.profiles add column if not exists notify_hour smallint check (notify_hour is null or notify_hour between 0 and 23);
alter table public.profiles add column if not exists notify_last date;
alter table public.cookoff_games add column if not exists pushed_at timestamptz;

create table if not exists public.push_subs (
  endpoint text primary key check (endpoint ~ '^https://' and char_length(endpoint) <= 1000),
  user_id uuid not null references auth.users (id) on delete cascade,
  p256dh text not null check (char_length(p256dh) <= 200),
  auth text not null check (char_length(auth) <= 100),
  created_at timestamptz not null default now()
);
create index if not exists push_subs_user_idx on public.push_subs (user_id);
alter table public.push_subs enable row level security;
revoke all on public.push_subs from anon, authenticated;

create or replace function public.save_push(p_endpoint text, p_p256dh text, p_auth text) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  insert into push_subs (endpoint, user_id, p256dh, auth) values (p_endpoint, uid, p_p256dh, p_auth)
  on conflict (endpoint) do update set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth, created_at = now();
  delete from push_subs where user_id = uid and endpoint not in (select endpoint from push_subs where user_id = uid order by created_at desc limit 5);
end $$;

create or replace function public.set_notify_hour(p_hour int) returns smallint language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  if p_hour is not null and (p_hour < 0 or p_hour > 23) then raise exception 'pick an hour from 0 to 23'; end if;
  update profiles set notify_hour = p_hour where id = uid;
  if p_hour is null then delete from push_subs where user_id = uid; end if;
  return p_hour;
end $$;

create or replace function public._push_ok(p_secret text) returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select p_secret is not null and exists (select 1 from private.app_secrets where name = 'push_sender' and sha256_hex = encode(sha256(convert_to(p_secret, 'UTF8')), 'hex'));
$$;

-- Called every hour by the app's server. Returns one message per phone for players whose picked hour it is now
-- (in their own time zone), who haven't had one today, and who have something useful waiting; marks them done.
create or replace function public.push_due(p_secret text) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare out jsonb := '[]'::jsonb; p record; today date; names text[]; msg jsonb;
begin
  if not _push_ok(p_secret) then raise exception 'forbidden'; end if;
  for p in
    select pr.id, pr.notify_hour, case when exists (select 1 from pg_timezone_names z where z.name = pr.time_zone) then pr.time_zone else 'UTC' end tz from profiles pr
    where pr.notify_hour is not null and exists (select 1 from push_subs s where s.user_id = pr.id)
  loop
    if extract(hour from now() at time zone p.tz)::int <> p.notify_hour then continue; end if;
    today := (now() at time zone p.tz)::date;
    if exists (select 1 from profiles where id = p.id and notify_last = today) then continue; end if;
    msg := null;
    select array_agg(name order by expires_on, name) into names from pantry_items
      where user_id = p.id and status <> 'out' and expires_on between today and today + 1;
    if names is not null then
      msg := jsonb_build_object('title', case when cardinality(names) = 1 then names[1] || ' expires ' || case when (select min(expires_on) from pantry_items where user_id = p.id and name = names[1] and status <> 'out') = today then 'today' else 'tomorrow' end
                                         else names[1] || ' and ' || case when cardinality(names) = 2 then names[2] else (cardinality(names) - 1) || ' more go off soon' end end,
                                'body', 'Cook it before it goes bad: Whisk has recipes that use it.', 'url', '/home?n=1');
    else
      select array_agg(name order by name) into names from pantry_items
        where user_id = p.id and status <> 'out' and thaw_started_at is null
          and (category = 'Frozen' or name ~* '\mfrozen\M')
          and name ~* '\m(chicken|beef|pork|lamb|turkey|sausages?|bacon|shrimp|prawns?|fish|salmon|tuna|cod|tilapia|steaks?|ground|meat|wings|ribs|chops?|meatballs?|ham|duck)\M';
      if names is not null then
        msg := jsonb_build_object('title', 'Defrost the ' || lower(btrim(regexp_replace(regexp_replace(names[1], '\mfrozen\M', '', 'gi'), '\s+', ' ', 'g'))) || ' tonight',
                                  'body', 'Move it to the fridge now and it’s ready to cook tomorrow.', 'url', '/pantry?n=1');
      end if;
    end if;
    if msg is null then continue; end if;
    update profiles set notify_last = today where id = p.id;
    out := out || coalesce((select jsonb_agg(msg || jsonb_build_object('endpoint', s.endpoint, 'p256dh', s.p256dh, 'auth', s.auth)) from push_subs s where s.user_id = p.id), '[]'::jsonb);
  end loop;
  return out;
end $$;

-- Right after a player makes a Cook Off: one message to each friend who has notifications on. Once per game.
create or replace function public.push_cookoff(p_secret text, p_host uuid, p_code text) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare g cookoff_games%rowtype; nm text;
begin
  if not _push_ok(p_secret) then raise exception 'forbidden'; end if;
  select * into g from cookoff_games where code = upper(trim(p_code)) and host = p_host and status = 'lobby' and created_at > now() - interval '15 minutes' and pushed_at is null for update;
  if not found then return '[]'::jsonb; end if;
  update cookoff_games set pushed_at = now() where id = g.id;
  select coalesce(nullif(trim(display_name), ''), 'A friend') into nm from profiles where id = p_host;
  return coalesce((select jsonb_agg(jsonb_build_object('title', nm || ' started a Cook Off', 'body', 'Join with code ' || g.code || ' before it starts.',
      'url', '/compete/cookoff?code=' || g.code || '&as=cook', 'endpoint', s.endpoint, 'p256dh', s.p256dh, 'auth', s.auth))
    from friends f join profiles pr on pr.id = f.friend_id join push_subs s on s.user_id = f.friend_id
    where f.user_id = p_host and pr.notify_hour is not null), '[]'::jsonb);
end $$;

-- the push service said a phone is gone: forget it
create or replace function public.push_gone(p_secret text, p_endpoints text[]) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not _push_ok(p_secret) then raise exception 'forbidden'; end if;
  delete from push_subs where endpoint = any (p_endpoints);
end $$;

revoke execute on function public.save_push(text, text, text), public.set_notify_hour(int) from public, anon;
grant execute on function public.save_push(text, text, text), public.set_notify_hour(int) to authenticated;
revoke execute on function public.push_due(text), public.push_cookoff(text, uuid, text), public.push_gone(text, text[]) from public;
grant execute on function public.push_due(text), public.push_cookoff(text, uuid, text), public.push_gone(text, text[]) to anon, authenticated;   -- the secret is the lock
revoke execute on function public._push_ok(text) from public, anon, authenticated;
