-- 0038: game size cap you can change, daily tidy-up of old games, and a "right now" count for the admin page.
-- Safe to run more than once. Run after 0037.
--  • Cook Off holds 8 players by default (was 200). Admins can change it (2 to 50) from the admin page.
--  • Cook Off and Use-It-Up games older than 30 days are deleted by cleanup_old_games(). It is meant to run once a day
--    from Supabase's pg_cron (see the commented line at the bottom: turn pg_cron on under Database > Extensions first).
--  • Supabase Realtime limits on the plan you are on (checked October 2026): Free 200 live connections at once, Pro 500,
--    Team 10,000; 100 / 500 / 2,500 messages a second. Yoke opens one connection per phone only while a chat is open, and
--    every screen still works without it (it just checks every 5 seconds instead), so going over the limit slows things down, not breaks them.

create table if not exists public.app_settings (
  key text primary key check (key in ('cookoff_max_players')),
  value int not null
);
insert into public.app_settings (key, value) values ('cookoff_max_players', 8) on conflict (key) do nothing;
alter table public.app_settings enable row level security;
revoke all on public.app_settings from anon, authenticated;

create or replace function public._setting(p_key text, p_default int) returns int language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce((select value from app_settings where key = p_key), p_default)
$$;
revoke execute on function public._setting(text, int) from public, anon, authenticated;

create or replace function public.join_cookoff(p_code text) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); g cookoff_games%rowtype; s int; nm text;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select * into g from cookoff_games where code = upper(trim(p_code)) for update;
  if not found or g.status = 'cancelled' then raise exception 'no game with that code'; end if;
  if exists (select 1 from cookoff_players where game_id = g.id and user_id = uid) then perform _cookoff_tick(g.id); return _cookoff_view(g.id); end if;
  if g.status <> 'lobby' then raise exception 'that game already started'; end if;
  if _stocked(uid) < 5 then raise exception 'stock your pantry first (5 items)'; end if;
  if (select count(*) from cookoff_players where game_id = g.id) >= _setting('cookoff_max_players', 8) then raise exception 'that game is full'; end if;
  select coalesce(max(seat), 0) + 1 into s from cookoff_players where game_id = g.id;
  select nullif(trim(display_name), '') into nm from profiles where id = uid;
  insert into cookoff_players (game_id, user_id, seat, name) values (g.id, uid, s, left(coalesce(nm, 'Cook ' || s), 40));
  return _cookoff_view(g.id);
end $$;

create or replace function public.admin_set_setting(p_key text, p_value int) returns int language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not coalesce((select is_admin from profiles where id = auth.uid()), false) then raise exception 'admins only'; end if;
  if p_key = 'cookoff_max_players' then
    if p_value is null or p_value < 2 or p_value > 50 then raise exception 'pick a number from 2 to 50'; end if;
  else raise exception 'unknown setting'; end if;
  insert into app_settings (key, value) values (p_key, p_value) on conflict (key) do update set value = excluded.value;
  return p_value;
end $$;

-- what is happening right now (admins only)
create or replace function public.admin_now() returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not coalesce((select is_admin from profiles where id = auth.uid()), false) then raise exception 'admins only'; end if;
  return jsonb_build_object(
    'cookoff_lobbies', (select count(*) from cookoff_games where status = 'lobby' and created_at > now() - interval '6 hours'),
    'cookoff_active', (select count(*) from cookoff_games where status in ('cooking', 'voting')),
    'uiu_open', (select count(*) from uiu_matches where status = 'open' and created_at > now() - interval '48 hours'),
    'uiu_live', (select count(*) from uiu_matches where status = 'live'),
    'chat_groups', (select count(*) from chat_groups),
    'chat_messages_24h', (select count(*) from chat_messages where created_at > now() - interval '24 hours'),
    'players_24h', (select count(*) from profiles where created_at > now() - interval '24 hours'),
    'cookoff_max', _setting('cookoff_max_players', 8));
end $$;

-- the daily tidy-up: finished or abandoned games older than 30 days go, with their players and dishes
create or replace function public.cleanup_old_games() returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare c int; u int;
begin
  delete from cookoff_games where created_at < now() - interval '30 days';
  get diagnostics c = row_count;
  delete from uiu_matches where created_at < now() - interval '30 days';
  get diagnostics u = row_count;
  return jsonb_build_object('cookoff', c, 'uiu', u);
end $$;
revoke execute on function public.cleanup_old_games() from public, anon, authenticated;

revoke execute on function public.admin_set_setting(text, int), public.admin_now() from public, anon;
grant execute on function public.admin_set_setting(text, int), public.admin_now() to authenticated;

-- once a day at 04:15 UTC (needs pg_cron; run this one line yourself in the SQL editor after turning pg_cron on):
-- select cron.schedule('yoke-cleanup', '15 4 * * *', $$select public.cleanup_old_games()$$);
