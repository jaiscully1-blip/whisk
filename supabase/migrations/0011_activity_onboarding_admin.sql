-- Whisk 0011 — activity log (what players tap and choose), first-run tutorial flag, admin dashboard access.
-- Activity is only recorded for players who allowed "Usage data" in the cookie & privacy popup (the app checks
-- consent before sending, and log_events checks it again here). Safe to re-run.

alter table public.profiles add column if not exists onboarded_at timestamptz;
alter table public.profiles add column if not exists is_admin boolean not null default false;   -- set by hand in SQL, never by the app

-- ---------- activity log ----------
create table if not exists public.app_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  at timestamptz not null default now(),
  kind text not null check (kind ~ '^[a-z_]{2,24}$'),          -- tap, select, search, view, …
  page text check (page is null or length(page) <= 40),
  target text check (target is null or length(target) <= 120),  -- button label / field name / dish
  value text check (value is null or length(value) <= 200),     -- chosen option, search text
  device text check (device is null or length(device) <= 60)
);
create index if not exists app_events_user_at on public.app_events (user_id, at desc);
create index if not exists app_events_at on public.app_events (at desc);
alter table public.app_events enable row level security;
drop policy if exists app_events_select_own on public.app_events;
create policy app_events_select_own on public.app_events for select to authenticated using (user_id = (select auth.uid()));
revoke insert, update, delete on public.app_events from authenticated, anon;
grant select on public.app_events to authenticated;

-- Up to 50 events per call, 600 per player per 10 minutes. Silently ignores players who said no to usage data.
create or replace function public.log_events(p_events jsonb, p_device text default null)
returns int language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); n int; recent int;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if jsonb_typeof(p_events) <> 'array' then raise exception 'bad events'; end if;
  if jsonb_array_length(p_events) > 50 then raise exception 'too many events'; end if;
  if not coalesce((select (consent ->> 'usage')::boolean from profiles where id = uid), false) then return 0; end if;
  select count(*) into recent from app_events where user_id = uid and at > now() - interval '10 minutes';
  if recent >= 600 then return 0; end if;
  insert into app_events (user_id, at, kind, page, target, value, device)
  select uid,
         least(now(), greatest(now() - interval '1 day', coalesce((e ->> 'at')::timestamptz, now()))),
         left(lower(regexp_replace(coalesce(e ->> 'kind', 'tap'), '[^a-z_]', '', 'g')), 24),
         left(e ->> 'page', 40), left(e ->> 'target', 120), left(e ->> 'value', 200), left(p_device, 60)
  from jsonb_array_elements(p_events) e
  where length(regexp_replace(coalesce(e ->> 'kind', 'tap'), '[^a-z_]', '', 'g')) >= 2;
  get diagnostics n = row_count;
  return n;
end $$;

-- Privacy popup gains a "Usage data" choice; replaces set_privacy from 0009 with one more argument.
drop function if exists public.set_privacy(boolean, boolean, text);
create or replace function public.set_privacy(p_preferences boolean, p_local_time boolean, p_time_zone text default null, p_usage boolean default false)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); tz text;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if p_local_time and p_time_zone is not null then
    if length(p_time_zone) > 64 or not exists (select 1 from pg_timezone_names where name = p_time_zone) then raise exception 'unknown time zone'; end if;
    tz := p_time_zone;
  end if;
  update profiles set
    consent = jsonb_build_object('v', 2, 'essential', true, 'preferences', coalesce(p_preferences, false), 'local_time', coalesce(p_local_time, false), 'usage', coalesce(p_usage, false), 'at', now()),
    time_zone = case when p_local_time then coalesce(tz, time_zone) else null end
  where id = uid;
  update profiles set first_open_date = coalesce(first_open_date, (coalesce(first_login_at, now()) at time zone coalesce(time_zone, 'UTC'))::date) where id = uid;
  -- Saying no to usage data also deletes what was recorded before.
  if not coalesce(p_usage, false) then delete from app_events where user_id = uid; end if;
  return (select jsonb_build_object('time_zone', time_zone, 'first_open_date', first_open_date, 'today', _user_today(uid)) from profiles where id = uid);
end $$;

-- ---------- first-run tutorial ----------
create or replace function public.set_onboarded(p_done boolean default true)
returns timestamptz language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); t timestamptz;
begin
  if uid is null then raise exception 'not signed in'; end if;
  update profiles set onboarded_at = case when p_done then coalesce(onboarded_at, now()) else null end where id = uid returning onboarded_at into t;
  return t;
end $$;

-- ---------- admin dashboard (only profiles.is_admin = true) ----------
create or replace function public._is_admin() returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false)
$$;

create or replace function public.admin_overview(p_days int default 7)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare d int := least(greatest(coalesce(p_days, 7), 1), 90); since timestamptz := now() - make_interval(days => d);
begin
  if not _is_admin() then raise exception 'not allowed'; end if;
  return jsonb_build_object(
    'days', d,
    'players', (select count(*) from profiles),
    'new_players', (select count(*) from profiles where first_login_at >= since),
    'active_players', (select count(distinct user_id) from app_events where at >= since),
    'events', (select count(*) from app_events where at >= since),
    'meals', (select count(*) from meals where cooked_at >= since),
    'by_kind', coalesce((select jsonb_agg(x order by x.n desc) from (select kind, count(*) n from app_events where at >= since group by kind) x), '[]'),
    'by_page', coalesce((select jsonb_agg(x order by x.n desc) from (select page, count(*) n from app_events where at >= since and page is not null group by page) x), '[]'),
    'top_taps', coalesce((select jsonb_agg(x order by x.n desc) from (select page, target, count(*) n from app_events where at >= since and kind = 'tap' and target is not null group by page, target order by count(*) desc limit 25) x), '[]'),
    'top_searches', coalesce((select jsonb_agg(x order by x.n desc) from (select lower(value) q, count(*) n from app_events where at >= since and kind = 'search' and value is not null group by lower(value) order by count(*) desc limit 25) x), '[]'),
    'per_day', coalesce((select jsonb_agg(x order by x.d) from (select (at at time zone 'UTC')::date as d, count(*) n, count(distinct user_id) players from app_events where at >= since group by 1) x), '[]')
  );
end $$;

create or replace function public.admin_events(p_limit int default 100, p_before bigint default null, p_player text default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not _is_admin() then raise exception 'not allowed'; end if;
  return coalesce((select jsonb_agg(x order by x.id desc) from (
    select e.id, e.at, e.kind, e.page, e.target, e.value, e.device, coalesce(nullif(p.display_name, ''), left(e.user_id::text, 8)) as player
    from app_events e join profiles p on p.id = e.user_id
    where (p_before is null or e.id < p_before)
      and (p_player is null or p.display_name ilike '%' || p_player || '%' or e.user_id::text like p_player || '%')
    order by e.id desc limit least(greatest(coalesce(p_limit, 100), 1), 500)) x), '[]');
end $$;

revoke execute on function public.log_events(jsonb, text) from public, anon;
revoke execute on function public.set_privacy(boolean, boolean, text, boolean) from public, anon;
revoke execute on function public.set_onboarded(boolean) from public, anon;
revoke execute on function public._is_admin() from public, anon, authenticated;
revoke execute on function public.admin_overview(int) from public, anon;
revoke execute on function public.admin_events(int, bigint, text) from public, anon;
grant execute on function public.log_events(jsonb, text) to authenticated;
grant execute on function public.set_privacy(boolean, boolean, text, boolean) to authenticated;
grant execute on function public.set_onboarded(boolean) to authenticated;
grant execute on function public.admin_overview(int) to authenticated;
grant execute on function public.admin_events(int, bigint, text) to authenticated;
