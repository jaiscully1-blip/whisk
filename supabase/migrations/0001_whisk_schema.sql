-- =====================================================================
-- Whisk — schema, Row Level Security, server functions, storage
-- Run once in Supabase → SQL Editor (or `supabase db push`).
-- Rule of thumb: every table has RLS ON. Users can only touch rows where
-- user_id = auth.uid(). XP, coins, purchases and challenge rewards change
-- ONLY through SECURITY DEFINER functions below, never by direct writes.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- profiles (one per auth user) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) between 1 and 40),
  theme_pref text not null default 'day' check (theme_pref in ('day', 'night')),
  xp integer not null default 0 check (xp >= 0),
  coins integer not null default 0 check (coins >= 0),
  first_login_at timestamptz,
  last_login_at timestamptz,
  last_seen_at timestamptz,
  login_count integer not null default 0,
  last_meal_at timestamptz,
  last_back_popup_at timestamptz,
  last_late_popup_date date,
  streak_days integer not null default 0,
  streak_last_date date,
  created_at timestamptz not null default now()
);

-- ---------- pantry & shopping ----------
create table if not exists public.pantry_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  category text not null default 'Other' check (category in ('Proteins','Produce','Dairy & Eggs','Carbs & Grains','Canned & Jarred','Sauces & Oils','Spices & Seasonings','Frozen','Baking','Other')),
  quantity text check (quantity is null or char_length(quantity) <= 30),
  status text not null default 'stocked' check (status in ('stocked', 'low', 'out')),
  expires_on date,
  added_at timestamptz not null default now()
);
create index if not exists pantry_user_idx on public.pantry_items (user_id);

create table if not exists public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  category text not null default 'Other',
  checked boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists shopping_user_idx on public.shopping_items (user_id);

-- ---------- recipes & meals ----------
create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  cuisine text check (cuisine is null or char_length(cuisine) <= 40),
  data jsonb not null check (pg_column_size(data) < 24000),
  created_at timestamptz not null default now()
);
create index if not exists recipes_user_idx on public.recipes (user_id);

-- ---------- game catalog (read-only to players) ----------
create table if not exists public.challenge_meals (
  id serial primary key,
  name text not null unique,
  cuisine text,
  minutes integer not null check (minutes > 0),
  technique smallint not null check (technique between 1 and 5),
  prep smallint not null check (prep between 1 and 5),
  steps smallint not null check (steps between 1 and 40),
  precision_level smallint not null check (precision_level between 1 and 5)
);

create table if not exists public.items (
  id text primary key,
  slot text not null check (slot in ('top', 'hat', 'glasses', 'shoes', 'acc')),
  name text not null,
  rarity text not null check (rarity in ('common', 'rare', 'epic', 'exotic', 'mythic')),
  price integer not null check (price > 0),
  sort smallint not null default 0,
  active boolean not null default true
);

-- ---------- per-player game state ----------
create table if not exists public.weekly_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  week_start date not null,
  slot smallint not null check (slot between 1 and 3),
  meal_id integer not null references public.challenge_meals (id),
  coins integer not null check (coins between 100 and 1000),
  completed_at timestamptz,
  unique (user_id, week_start, slot)
);

create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  recipe_id uuid references public.recipes (id) on delete set null,
  challenge_id uuid references public.weekly_challenges (id) on delete set null,
  title text not null check (char_length(title) between 1 and 120),
  cuisine text check (cuisine is null or char_length(cuisine) <= 40),
  notes text check (notes is null or char_length(notes) <= 500),
  photo_path text not null,
  cooked_at timestamptz not null default now()
);
create index if not exists meals_user_idx on public.meals (user_id, cooked_at desc);

create table if not exists public.xp_events (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  amount integer not null,
  created_at timestamptz not null default now()
);
create index if not exists xp_events_user_kind_idx on public.xp_events (user_id, kind, created_at desc);

create table if not exists public.inventory (
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id text not null references public.items (id),
  acquired_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

create table if not exists public.loadouts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  top_id text references public.items (id),
  hat_id text references public.items (id),
  glasses_id text references public.items (id),
  shoes_id text references public.items (id),
  acc_id text references public.items (id),
  updated_at timestamptz not null default now()
);

create table if not exists public.login_events (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  at timestamptz not null default now(),
  user_agent text check (user_agent is null or char_length(user_agent) <= 300)
);
create index if not exists login_events_user_idx on public.login_events (user_id, at desc);

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.profiles          enable row level security;
alter table public.pantry_items      enable row level security;
alter table public.shopping_items    enable row level security;
alter table public.recipes           enable row level security;
alter table public.challenge_meals   enable row level security;
alter table public.items             enable row level security;
alter table public.weekly_challenges enable row level security;
alter table public.meals             enable row level security;
alter table public.xp_events         enable row level security;
alter table public.inventory         enable row level security;
alter table public.loadouts          enable row level security;
alter table public.login_events      enable row level security;

-- Nobody signed out gets anything.
revoke all on all tables in schema public from anon;

-- profiles: read your own; update only display_name + theme_pref (column grants below)
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated using (id = (select auth.uid()));
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
revoke insert, update, delete on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, theme_pref) on public.profiles to authenticated;

-- owner-only CRUD tables: pantry, shopping, recipes
do $$
declare t text;
begin
  foreach t in array array['pantry_items', 'shopping_items', 'recipes'] loop
    execute format('drop policy if exists %1$s_select_own on public.%1$s', t);
    execute format('create policy %1$s_select_own on public.%1$s for select to authenticated using (user_id = (select auth.uid()))', t);
    execute format('drop policy if exists %1$s_insert_own on public.%1$s', t);
    execute format('create policy %1$s_insert_own on public.%1$s for insert to authenticated with check (user_id = (select auth.uid()))', t);
    execute format('drop policy if exists %1$s_update_own on public.%1$s', t);
    execute format('create policy %1$s_update_own on public.%1$s for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
    execute format('drop policy if exists %1$s_delete_own on public.%1$s', t);
    execute format('create policy %1$s_delete_own on public.%1$s for delete to authenticated using (user_id = (select auth.uid()))', t);
    execute format('grant select, insert, update, delete on public.%1$s to authenticated', t);
  end loop;
end $$;

-- read-only own rows: meals (insert via log_meal), xp, challenges, inventory, loadouts, logins
do $$
declare t text;
begin
  foreach t in array array['meals', 'xp_events', 'weekly_challenges', 'inventory', 'loadouts', 'login_events'] loop
    execute format('drop policy if exists %1$s_select_own on public.%1$s', t);
    execute format('create policy %1$s_select_own on public.%1$s for select to authenticated using (user_id = (select auth.uid()))', t);
    execute format('revoke insert, update, delete on public.%1$s from authenticated', t);
    execute format('grant select on public.%1$s to authenticated', t);
  end loop;
end $$;
-- players may delete their own meal entries (XP already earned stays)
drop policy if exists meals_delete_own on public.meals;
create policy meals_delete_own on public.meals for delete to authenticated using (user_id = (select auth.uid()));
grant delete on public.meals to authenticated;

-- catalogs: readable by signed-in players, writable by nobody (manage in the dashboard)
drop policy if exists items_read on public.items;
create policy items_read on public.items for select to authenticated using (active);
drop policy if exists challenge_meals_read on public.challenge_meals;
create policy challenge_meals_read on public.challenge_meals for select to authenticated using (true);
revoke insert, update, delete on public.items, public.challenge_meals from authenticated;
grant select on public.items, public.challenge_meals to authenticated;

-- =====================================================================
-- Server functions (SECURITY DEFINER, pinned search_path)
-- =====================================================================

-- difficulty score 0–100 and coin value (one source of truth)
create or replace function public.difficulty_score(p_minutes int, p_technique int, p_prep int, p_steps int, p_precision int)
returns int language sql immutable set search_path = '' as $$
  select round(30.0 * least(p_minutes, 120) / 120 + 30.0 * p_technique / 5 + 15.0 * p_prep / 5 + 15.0 * least(p_steps, 15) / 15 + 10.0 * p_precision / 5)::int
$$;

create or replace function public.score_to_coins(s int)
returns int language sql immutable set search_path = '' as $$
  select case
    when s < 35 then greatest(100, least(300, 100 + (round(greatest(0, s - 14) / 20.0 * 200 / 50) * 50)::int))
    when s < 65 then greatest(400, least(700, 400 + (round((s - 35) / 29.0 * 300 / 50) * 50)::int))
    when s < 80 then greatest(800, least(950, 800 + (round((s - 65) / 14.0 * 150 / 50) * 50)::int))
    else 1000 end
$$;

create or replace view public.challenge_meals_scored with (security_invoker = true) as
  select m.*, public.difficulty_score(m.minutes, m.technique, m.prep, m.steps, m.precision_level) as score,
         public.score_to_coins(public.difficulty_score(m.minutes, m.technique, m.prep, m.steps, m.precision_level)) as coins
  from public.challenge_meals m;
grant select on public.challenge_meals_scored to authenticated;

-- internal: give XP with a daily cap per kind. Not callable by players.
create or replace function public._award_xp(p_user uuid, p_kind text, p_amount int, p_daily_cap int)
returns int language plpgsql security definer set search_path = public, pg_temp as $$
declare n int;
begin
  if p_daily_cap is not null then
    select count(*) into n from xp_events where user_id = p_user and kind = p_kind and created_at > now() - interval '24 hours';
    if n >= p_daily_cap then return 0; end if;
  end if;
  insert into xp_events (user_id, kind, amount) values (p_user, p_kind, p_amount);
  update profiles set xp = xp + p_amount where id = p_user;
  return p_amount;
end $$;

-- new user → profile + empty loadout + welcome coins (enough for one Common item)
create or replace function public._handle_new_user()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into profiles (id, coins) values (new.id, 1500) on conflict (id) do nothing;
  insert into loadouts (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public._handle_new_user();

-- XP for adding pantry items (+5, 20/day) and saving recipes (+5, 10/day)
create or replace function public._xp_on_pantry_insert() returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin perform _award_xp(new.user_id, 'pantry_add', 5, 20); return new; end $$;
drop trigger if exists xp_pantry on public.pantry_items;
create trigger xp_pantry after insert on public.pantry_items for each row execute function public._xp_on_pantry_insert();

create or replace function public._xp_on_recipe_insert() returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin perform _award_xp(new.user_id, 'recipe_save', 5, 10); return new; end $$;
drop trigger if exists xp_recipe on public.recipes;
create trigger xp_recipe after insert on public.recipes for each row execute function public._xp_on_recipe_insert();

-- login tracking + popup decisions. Called once when the app opens.
-- p_local_date / p_local_hour come from the device clock (only used to pick popups).
create or replace function public.record_login(p_local_date date, p_local_hour int, p_user_agent text default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid uuid := auth.uid();
  p profiles%rowtype;
  new_session boolean;
  show_back boolean := false;
  show_late boolean := false;
  night_date date;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if p_local_hour is null or p_local_hour < 0 or p_local_hour > 23 then raise exception 'bad hour'; end if;
  if p_local_date is null or abs(p_local_date - current_date) > 2 then raise exception 'bad date'; end if;
  select * into p from profiles where id = uid for update;

  new_session := p.last_seen_at is null or p.last_seen_at < now() - interval '30 minutes';
  if new_session then
    insert into login_events (user_id, user_agent) values (uid, left(p_user_agent, 300));
    update profiles set login_count = login_count + 1, last_login_at = now(), first_login_at = coalesce(first_login_at, now()) where id = uid;
  end if;
  update profiles set last_seen_at = now() where id = uid;

  -- "We're so back!": had cooked before, nothing logged for > 72h, not shown since that last meal
  if p.last_meal_at is not null and p.last_meal_at < now() - interval '72 hours'
     and (p.last_back_popup_at is null or p.last_back_popup_at < p.last_meal_at) then
    show_back := true;
    update profiles set last_back_popup_at = now() where id = uid;
  end if;

  -- "Late night snack...": 21:00–03:59 local, once per night (a night belongs to the evening's date)
  if not show_back and (p_local_hour >= 21 or p_local_hour < 4) then
    night_date := case when p_local_hour < 4 then p_local_date - 1 else p_local_date end;
    if p.last_late_popup_date is null or p.last_late_popup_date <> night_date then
      show_late := true;
      update profiles set last_late_popup_date = night_date where id = uid;
    end if;
  end if;

  return jsonb_build_object('popup', case when show_back then 'back' when show_late then 'late' else null end, 'new_session', new_session);
end $$;

-- this week's 3 challenges (created on first look each week)
create or replace function public.get_weekly_challenges()
returns table (id uuid, slot smallint, coins int, completed_at timestamptz, meal_name text, cuisine text, minutes int, technique smallint, prep smallint, steps smallint, score int, week_start date)
language plpgsql security definer set search_path = public, pg_temp as $$
#variable_conflict use_column
declare
  uid uuid := auth.uid();
  wk date := date_trunc('week', now() at time zone 'utc')::date;
  m_small int; m_med int; m_big int;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from weekly_challenges w where w.user_id = uid and w.week_start = wk) then
    select s.id into m_small from challenge_meals_scored s where s.score < 35 order by random() limit 1;
    select s.id into m_med   from challenge_meals_scored s where s.score >= 35 and s.score < 65 order by random() limit 1;
    if random() < 0.6 then
      select s.id into m_big from challenge_meals_scored s where s.score >= 80 order by random() limit 1;
    else
      select s.id into m_big from challenge_meals_scored s where s.score >= 65 and s.score < 80 order by random() limit 1;
    end if;
    insert into weekly_challenges (user_id, week_start, slot, meal_id, coins)
    select uid, wk, x.slot, x.meal_id, s.coins
    from (values (1::smallint, m_small), (2::smallint, m_med), (3::smallint, m_big)) as x(slot, meal_id)
    join challenge_meals_scored s on s.id = x.meal_id
    on conflict do nothing;
  end if;
  return query
    select w.id, w.slot, w.coins, w.completed_at, s.name, s.cuisine, s.minutes, s.technique, s.prep, s.steps, s.score, w.week_start
    from weekly_challenges w join challenge_meals_scored s on s.id = w.meal_id
    where w.user_id = uid and w.week_start = wk order by w.slot;
end $$;

-- log a cooked meal (photo required). Awards XP, streak, cuisine stamp, and challenge coins.
create or replace function public.log_meal(p_title text, p_photo_path text, p_recipe_id uuid default null, p_challenge_id uuid default null, p_cuisine text default null, p_notes text default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid uuid := auth.uid();
  v_meal uuid;
  xp_gain int := 0; coin_gain int := 0; completed boolean := false;
  ch weekly_challenges%rowtype;
  today date := (now() at time zone 'utc')::date;
  p profiles%rowtype;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if p_title is null or char_length(trim(p_title)) = 0 or char_length(p_title) > 120 then raise exception 'title required'; end if;
  -- the photo must be one this user uploaded to their own folder
  if p_photo_path is null or split_part(p_photo_path, '/', 1) <> uid::text
     or not exists (select 1 from storage.objects o where o.bucket_id = 'meal-photos' and o.name = p_photo_path) then
    raise exception 'photo not found';
  end if;
  if p_recipe_id is not null and not exists (select 1 from recipes r where r.id = p_recipe_id and r.user_id = uid) then p_recipe_id := null; end if;

  insert into meals (user_id, recipe_id, challenge_id, title, cuisine, notes, photo_path)
  values (uid, p_recipe_id, null, left(trim(p_title), 120), left(p_cuisine, 40), left(p_notes, 500), p_photo_path)
  returning id into v_meal;

  xp_gain := xp_gain + _award_xp(uid, 'cook', 50, 3);
  if p_cuisine is not null and not exists (select 1 from meals m where m.user_id = uid and lower(m.cuisine) = lower(p_cuisine) and m.id <> v_meal) then
    xp_gain := xp_gain + _award_xp(uid, 'cuisine_stamp', 40, null);
  end if;

  select * into p from profiles where id = uid for update;
  update profiles set last_meal_at = now(),
    streak_days = case when streak_last_date = today then streak_days when streak_last_date = today - 1 then streak_days + 1 else 1 end,
    streak_last_date = today
  where id = uid;
  if p.streak_last_date is distinct from today then xp_gain := xp_gain + _award_xp(uid, 'streak', 10, 1); end if;

  if p_challenge_id is not null then
    select * into ch from weekly_challenges w where w.id = p_challenge_id and w.user_id = uid for update;
    if found and ch.completed_at is null and ch.week_start = date_trunc('week', now() at time zone 'utc')::date then
      update weekly_challenges set completed_at = now() where id = ch.id;
      update meals set challenge_id = ch.id where id = v_meal;
      update profiles set coins = coins + ch.coins where id = uid;
      coin_gain := ch.coins; completed := true;
      xp_gain := xp_gain + _award_xp(uid, 'challenge', 100, 3);
    end if;
  end if;

  return jsonb_build_object('xp', xp_gain, 'coins', coin_gain, 'challenge_completed', completed);
end $$;

-- buy a shop item with coins (atomic: lock profile, check balance, deduct, add to inventory)
create or replace function public.buy_item(p_item_id text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); it items%rowtype; bal int;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select * into it from items where id = p_item_id and active;
  if not found then raise exception 'item not found'; end if;
  if exists (select 1 from inventory where user_id = uid and item_id = it.id) then raise exception 'already owned'; end if;
  select coins into bal from profiles where id = uid for update;
  if bal < it.price then raise exception 'not enough coins'; end if;
  update profiles set coins = coins - it.price where id = uid;
  insert into inventory (user_id, item_id) values (uid, it.id);
  return jsonb_build_object('coins', bal - it.price, 'item_id', it.id);
end $$;

-- wear (or take off) an owned item
create or replace function public.equip_item(p_slot text, p_item_id text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  if p_slot not in ('top', 'hat', 'glasses', 'shoes', 'acc') then raise exception 'bad slot'; end if;
  if p_item_id is not null and not exists (
    select 1 from inventory v join items i on i.id = v.item_id where v.user_id = uid and v.item_id = p_item_id and i.slot = p_slot) then
    raise exception 'you do not own that item';
  end if;
  insert into loadouts (user_id) values (uid) on conflict (user_id) do nothing;
  execute format('update public.loadouts set %I = $1, updated_at = now() where user_id = $2', p_slot || '_id') using p_item_id, uid;
end $$;

-- lock functions down: internal ones callable by nobody, RPCs only by signed-in players
revoke execute on all functions in schema public from public, anon;
revoke execute on function public._award_xp(uuid, text, int, int) from authenticated;
revoke execute on function public._handle_new_user() from authenticated;
revoke execute on function public._xp_on_pantry_insert() from authenticated;
revoke execute on function public._xp_on_recipe_insert() from authenticated;
grant execute on function public.record_login(date, int, text) to authenticated;
grant execute on function public.get_weekly_challenges() to authenticated;
grant execute on function public.log_meal(text, text, uuid, uuid, text, text) to authenticated;
grant execute on function public.buy_item(text) to authenticated;
grant execute on function public.equip_item(text, text) to authenticated;
grant execute on function public.difficulty_score(int, int, int, int, int) to authenticated;
grant execute on function public.score_to_coins(int) to authenticated;

-- =====================================================================
-- Storage: private meal photos, each user only sees their own folder
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('meal-photos', 'meal-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists meal_photos_select_own on storage.objects;
create policy meal_photos_select_own on storage.objects for select to authenticated
  using (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists meal_photos_insert_own on storage.objects;
create policy meal_photos_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists meal_photos_delete_own on storage.objects;
create policy meal_photos_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
