-- Whisk setup step 1 of 4: 0003_whisk_features.sql, 0004_whisk_web_recipes.sql
-- Paste ALL of this into Supabase → SQL Editor → New query → Run. Safe to run more than once.

-- ======================= 0003_whisk_features.sql =======================
-- =====================================================================
-- Whisk 0003 — daily quest, streak freeze, cuisine bingo, weekly goal,
-- takeout-savings setting, nutrition on meals. Safe to re-run.
-- =====================================================================

-- ---------- profile settings ----------
alter table public.profiles add column if not exists weekly_goal smallint not null default 4 check (weekly_goal between 1 and 14);
alter table public.profiles add column if not exists takeout_price numeric(6, 2) not null default 15 check (takeout_price between 0 and 200);
alter table public.profiles add column if not exists streak_freezes smallint not null default 1 check (streak_freezes between 0 and 3);
alter table public.profiles add column if not exists streak_freeze_week date;
grant update (display_name, theme_pref, weekly_goal, takeout_price) on public.profiles to authenticated;

-- ---------- nutrition per logged meal (per serving, estimated) ----------
alter table public.meals add column if not exists calories integer check (calories is null or calories between 0 and 5000);
alter table public.meals add column if not exists protein_g integer check (protein_g is null or protein_g between 0 and 500);
alter table public.meals add column if not exists carbs_g integer check (carbs_g is null or carbs_g between 0 and 800);
alter table public.meals add column if not exists fat_g integer check (fat_g is null or fat_g between 0 and 400);

-- ---------- daily quest ----------
create table if not exists public.daily_quests (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  kind text not null check (kind in ('pantry_add', 'cook', 'recipe_save')),
  target smallint not null check (target between 1 and 10),
  claimed_at timestamptz,
  primary key (user_id, day)
);
alter table public.daily_quests enable row level security;
drop policy if exists daily_quests_select_own on public.daily_quests;
create policy daily_quests_select_own on public.daily_quests for select to authenticated using (user_id = (select auth.uid()));
revoke insert, update, delete on public.daily_quests from authenticated, anon;
grant select on public.daily_quests to authenticated;

-- ---------- weekly cuisine bingo (4x4) ----------
create table if not exists public.weekly_bingo (
  user_id uuid not null references auth.users (id) on delete cascade,
  week_start date not null,
  cells text[] not null check (array_length(cells, 1) = 16),
  claimed_at timestamptz,
  primary key (user_id, week_start)
);
alter table public.weekly_bingo enable row level security;
drop policy if exists weekly_bingo_select_own on public.weekly_bingo;
create policy weekly_bingo_select_own on public.weekly_bingo for select to authenticated using (user_id = (select auth.uid()));
revoke insert, update, delete on public.weekly_bingo from authenticated, anon;
grant select on public.weekly_bingo to authenticated;

create or replace function public._cuisine_match(meal_cuisine text, cell text)
returns boolean language sql immutable set search_path = '' as $$
  select meal_cuisine is not null and length(trim(meal_cuisine)) > 0 and (
    lower(meal_cuisine) like '%' || lower(cell) || '%' or lower(cell) like '%' || lower(meal_cuisine) || '%')
$$;

-- ---------- log_meal v2: nutrition + weekly streak freeze ----------
drop function if exists public.log_meal(text, text, uuid, uuid, text, text);
create or replace function public.log_meal(
  p_title text, p_photo_path text, p_recipe_id uuid default null, p_challenge_id uuid default null,
  p_cuisine text default null, p_notes text default null,
  p_calories int default null, p_protein int default null, p_carbs int default null, p_fat int default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid uuid := auth.uid();
  v_meal uuid;
  xp_gain int := 0; coin_gain int := 0; completed boolean := false;
  ch weekly_challenges%rowtype;
  today date := (now() at time zone 'utc')::date;
  wk date := date_trunc('week', now() at time zone 'utc')::date;
  p profiles%rowtype;
  new_streak int; used_freeze boolean := false;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if p_title is null or char_length(trim(p_title)) = 0 or char_length(p_title) > 120 then raise exception 'title required'; end if;
  if p_photo_path is null or split_part(p_photo_path, '/', 1) <> uid::text
     or not exists (select 1 from storage.objects o where o.bucket_id = 'meal-photos' and o.name = p_photo_path) then
    raise exception 'photo not found';
  end if;
  if p_recipe_id is not null and not exists (select 1 from recipes r where r.id = p_recipe_id and r.user_id = uid) then p_recipe_id := null; end if;

  insert into meals (user_id, recipe_id, challenge_id, title, cuisine, notes, photo_path, calories, protein_g, carbs_g, fat_g)
  values (uid, p_recipe_id, null, left(trim(p_title), 120), left(p_cuisine, 40), left(p_notes, 500), p_photo_path,
          case when p_calories between 0 and 5000 then p_calories end, case when p_protein between 0 and 500 then p_protein end,
          case when p_carbs between 0 and 800 then p_carbs end, case when p_fat between 0 and 400 then p_fat end)
  returning id into v_meal;

  xp_gain := xp_gain + _award_xp(uid, 'cook', 50, 3);
  if p_cuisine is not null and not exists (select 1 from meals m where m.user_id = uid and lower(m.cuisine) = lower(p_cuisine) and m.id <> v_meal) then
    xp_gain := xp_gain + _award_xp(uid, 'cuisine_stamp', 40, null);
  end if;

  select * into p from profiles where id = uid for update;
  if p.streak_freeze_week is null or p.streak_freeze_week < wk then
    update profiles set streak_freezes = 1, streak_freeze_week = wk where id = uid;
    p.streak_freezes := 1;
  end if;
  used_freeze := coalesce(p.streak_last_date = today - 2, false) and p.streak_freezes > 0;
  new_streak := case
    when p.streak_last_date = today then p.streak_days
    when p.streak_last_date = today - 1 then p.streak_days + 1
    when used_freeze then p.streak_days + 1
    else 1 end;
  update profiles set last_meal_at = now(), streak_days = new_streak, streak_last_date = today,
    streak_freezes = streak_freezes - (case when used_freeze then 1 else 0 end)
  where id = uid;
  if p.streak_last_date is distinct from today then xp_gain := xp_gain + _award_xp(uid, 'streak', 10, 1); end if;

  if p_challenge_id is not null then
    select * into ch from weekly_challenges w where w.id = p_challenge_id and w.user_id = uid for update;
    if found and ch.completed_at is null and ch.week_start = wk then
      update weekly_challenges set completed_at = now() where id = ch.id;
      update meals set challenge_id = ch.id where id = v_meal;
      update profiles set coins = coins + ch.coins where id = uid;
      coin_gain := ch.coins; completed := true;
      xp_gain := xp_gain + _award_xp(uid, 'challenge', 100, 3);
    end if;
  end if;

  return jsonb_build_object('xp', xp_gain, 'coins', coin_gain, 'challenge_completed', completed, 'streak', new_streak, 'used_freeze', used_freeze);
end $$;

-- ---------- daily quest functions ----------
create or replace function public.get_daily_quest()
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid uuid := auth.uid();
  d date := (now() at time zone 'utc')::date;
  q daily_quests%rowtype;
  k text; t int; prog int;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select * into q from daily_quests where user_id = uid and day = d;
  if not found then
    select x.k, x.t into k, t from (values ('pantry_add', 3), ('cook', 1), ('recipe_save', 1)) as x(k, t) order by random() limit 1;
    insert into daily_quests (user_id, day, kind, target) values (uid, d, k, t) on conflict do nothing;
    select * into q from daily_quests where user_id = uid and day = d;
  end if;
  select count(*) into prog from xp_events e where e.user_id = uid and e.kind = q.kind and e.created_at >= d::timestamp at time zone 'utc';
  return jsonb_build_object('kind', q.kind, 'target', q.target, 'progress', least(prog, q.target), 'claimed', q.claimed_at is not null,
    'label', case q.kind when 'pantry_add' then 'Add 3 items to your pantry' when 'cook' then 'Cook a meal and snap a photo' else 'Save a recipe to your cookbook' end);
end $$;

create or replace function public.claim_daily_quest()
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid uuid := auth.uid();
  d date := (now() at time zone 'utc')::date;
  q daily_quests%rowtype; prog int; gained int;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select * into q from daily_quests where user_id = uid and day = d for update;
  if not found then raise exception 'no quest today'; end if;
  if q.claimed_at is not null then raise exception 'already claimed'; end if;
  select count(*) into prog from xp_events e where e.user_id = uid and e.kind = q.kind and e.created_at >= d::timestamp at time zone 'utc';
  if prog < q.target then raise exception 'quest not finished'; end if;
  update daily_quests set claimed_at = now() where user_id = uid and day = d;
  gained := _award_xp(uid, 'quest', 30, 1);
  return jsonb_build_object('xp', gained);
end $$;

-- ---------- bingo functions ----------
create or replace function public._bingo_marks(p_user uuid, p_week date, p_cells text[])
returns boolean[] language sql stable security definer set search_path = public, pg_temp as $$
  select array_agg(exists (
      select 1 from meals m where m.user_id = p_user and m.cooked_at >= p_week::timestamp at time zone 'utc'
        and m.cooked_at < (p_week + 7)::timestamp at time zone 'utc' and _cuisine_match(m.cuisine, c.cell)
    ) order by c.i)
  from unnest(p_cells) with ordinality as c(cell, i)
$$;

create or replace function public._bingo_lines(m boolean[])
returns int language sql immutable set search_path = '' as $$
  select count(*)::int from (values
    (array[1,2,3,4]), (array[5,6,7,8]), (array[9,10,11,12]), (array[13,14,15,16]),
    (array[1,5,9,13]), (array[2,6,10,14]), (array[3,7,11,15]), (array[4,8,12,16]),
    (array[1,6,11,16]), (array[4,7,10,13])) as l(idx)
  where m[idx[1]] and m[idx[2]] and m[idx[3]] and m[idx[4]]
$$;

create or replace function public.get_bingo()
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid uuid := auth.uid();
  wk date := date_trunc('week', now() at time zone 'utc')::date;
  b weekly_bingo%rowtype; marks boolean[];
begin
  if uid is null then raise exception 'not signed in'; end if;
  select * into b from weekly_bingo where user_id = uid and week_start = wk;
  if not found then
    insert into weekly_bingo (user_id, week_start, cells)
    select uid, wk, array_agg(c order by random()) from (
      select c from unnest(array['American','Mexican','Italian','Chinese','Japanese','Korean','Thai','Indian','Vietnamese','Mediterranean',
        'Middle Eastern','French','Greek','Spanish','Caribbean','Cajun','Southern','Brazilian','Ethiopian','British']) as c
      order by random() limit 16) s
    on conflict do nothing;
    select * into b from weekly_bingo where user_id = uid and week_start = wk;
  end if;
  marks := _bingo_marks(uid, wk, b.cells);
  return jsonb_build_object('week_start', wk, 'cells', to_jsonb(b.cells), 'marks', to_jsonb(marks), 'lines', _bingo_lines(marks), 'claimed', b.claimed_at is not null);
end $$;

create or replace function public.claim_bingo()
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid uuid := auth.uid();
  wk date := date_trunc('week', now() at time zone 'utc')::date;
  b weekly_bingo%rowtype; gained int;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select * into b from weekly_bingo where user_id = uid and week_start = wk for update;
  if not found then raise exception 'no card this week'; end if;
  if b.claimed_at is not null then raise exception 'already claimed'; end if;
  if _bingo_lines(_bingo_marks(uid, wk, b.cells)) < 1 then raise exception 'no bingo yet'; end if;
  update weekly_bingo set claimed_at = now() where user_id = uid and week_start = wk;
  gained := _award_xp(uid, 'bingo', 200, 1);
  return jsonb_build_object('xp', gained);
end $$;

-- ---------- lock down ----------
revoke execute on all functions in schema public from public, anon;
revoke execute on function public._bingo_marks(uuid, date, text[]) from authenticated;
revoke execute on function public._award_xp(uuid, text, int, int) from authenticated;
revoke execute on function public._handle_new_user() from authenticated;
revoke execute on function public._xp_on_pantry_insert() from authenticated;
revoke execute on function public._xp_on_recipe_insert() from authenticated;
grant execute on function public.log_meal(text, text, uuid, uuid, text, text, int, int, int, int) to authenticated;
grant execute on function public.get_daily_quest() to authenticated;
grant execute on function public.claim_daily_quest() to authenticated;
grant execute on function public.get_bingo() to authenticated;
grant execute on function public.claim_bingo() to authenticated;
grant execute on function public._cuisine_match(text, text) to authenticated;
grant execute on function public._bingo_lines(boolean[]) to authenticated;

-- ======================= 0004_whisk_web_recipes.sql =======================
-- Whisk 0004: real web recipes, defrosting, ratings, pantry-based challenges,
-- new popup timing (76 h back, July 18 Wrapped), last device + remembered inputs.
-- Safe to run more than once. Run AFTER 0001–0003, then run 0005 (the recipe data).

-- ---------- real recipes from the web (read-only catalog) ----------
create table if not exists public.web_recipes (
  id text primary key check (char_length(id) between 1 and 80),
  title text not null check (char_length(title) between 1 and 160),
  cuisine text not null check (char_length(cuisine) <= 40),
  source text not null check (char_length(source) <= 80),
  url text not null check (url like 'https://%' and char_length(url) <= 400),
  minutes integer not null check (minutes > 0),
  servings integer,
  technique smallint not null check (technique between 1 and 5),
  prep smallint not null check (prep between 1 and 5),
  precision_level smallint not null check (precision_level between 1 and 5),
  step_count smallint not null check (step_count between 1 and 40),
  score integer not null check (score between 0 and 100),
  key_canon text[] not null,
  data jsonb not null check (pg_column_size(data) < 24000),
  active boolean not null default true
);
alter table public.web_recipes enable row level security;
drop policy if exists web_recipes_read on public.web_recipes;
create policy web_recipes_read on public.web_recipes for select to authenticated using (active);
revoke all on public.web_recipes from anon, authenticated;
grant select on public.web_recipes to authenticated;

-- ---------- saved recipes with your rating ----------
create table if not exists public.saved_recipes (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  recipe_id text not null references public.web_recipes (id) on delete cascade,
  rating text check (rating is null or rating in ('up', 'down')),
  saved_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);
alter table public.saved_recipes enable row level security;
drop policy if exists saved_select on public.saved_recipes;
drop policy if exists saved_delete on public.saved_recipes;
create policy saved_select on public.saved_recipes for select to authenticated using (user_id = auth.uid());
create policy saved_delete on public.saved_recipes for delete to authenticated using (user_id = auth.uid());
revoke all on public.saved_recipes from anon, authenticated;
grant select, delete on public.saved_recipes to authenticated;   -- saving/rating goes through functions (XP)

-- ---------- columns ----------
alter table public.pantry_items add column if not exists thaw_started_at timestamptz;
alter table public.meals add column if not exists web_recipe_id text references public.web_recipes (id) on delete set null;
alter table public.meals add column if not exists rating text check (rating is null or rating in ('up', 'down'));
alter table public.weekly_challenges add column if not exists recipe_id text references public.web_recipes (id) on delete cascade;
alter table public.weekly_challenges alter column meal_id drop not null;
alter table public.profiles add column if not exists last_device text check (last_device is null or char_length(last_device) <= 60);
alter table public.profiles add column if not exists last_wrapped_year integer;
alter table public.profiles add column if not exists ui_state jsonb check (ui_state is null or pg_column_size(ui_state) < 16000);
revoke update on public.profiles from authenticated;
grant update (display_name, theme_pref, weekly_goal, takeout_price, ui_state) on public.profiles to authenticated;

-- ---------- opening the app: popups + last device ----------
drop function if exists public.record_login(date, int, text);
create or replace function public.record_login(p_local_date date, p_local_hour int, p_user_agent text default null, p_device text default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid uuid := auth.uid();
  p profiles%rowtype;
  new_session boolean;
  pops text[] := array[]::text[];
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
  update profiles set last_seen_at = now(), last_device = left(nullif(trim(p_device), ''), 60) where id = uid;

  -- "We're so back!": opened 76+ hours after the last logged meal, once per gap
  if p.last_meal_at is not null and p.last_meal_at < now() - interval '76 hours'
     and (p.last_back_popup_at is null or p.last_back_popup_at < p.last_meal_at) then
    pops := array_append(pops, 'back');
    update profiles set last_back_popup_at = now() where id = uid;
  -- "Late night snack...": opened 21:00–03:59 local, once per night
  elsif p_local_hour >= 21 or p_local_hour < 4 then
    night_date := case when p_local_hour < 4 then p_local_date - 1 else p_local_date end;
    if p.last_late_popup_date is null or p.last_late_popup_date <> night_date then
      pops := array_append(pops, 'late');
      update profiles set last_late_popup_date = night_date where id = uid;
    end if;
  end if;

  -- Whisk Wrapped: July 18, once a year, for everyone
  if extract(month from p_local_date) = 7 and extract(day from p_local_date) = 18
     and p.last_wrapped_year is distinct from extract(year from p_local_date)::int then
    pops := array_append(pops, 'wrapped');
    update profiles set last_wrapped_year = extract(year from p_local_date)::int where id = uid;
  end if;

  return jsonb_build_object('popups', to_jsonb(pops), 'popup', pops[1], 'new_session', new_session,
    'last_device', p.last_device, 'last_seen_at', p.last_seen_at);
end $$;

-- ---------- save a recipe (+5 XP, 10/day) and rate it ----------
create or replace function public.save_recipe(p_recipe_id text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); xp int := 0;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from web_recipes w where w.id = p_recipe_id and w.active) then raise exception 'unknown recipe'; end if;
  insert into saved_recipes (user_id, recipe_id) values (uid, p_recipe_id) on conflict do nothing;
  if found then xp := _award_xp(uid, 'recipe_save', 5, 10); end if;
  return jsonb_build_object('xp', xp);
end $$;

create or replace function public.rate_meal(p_meal_id uuid, p_rating text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); m meals%rowtype;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if p_rating is not null and p_rating not in ('up', 'down') then raise exception 'bad rating'; end if;
  select * into m from meals where id = p_meal_id and user_id = uid;
  if not found then raise exception 'meal not found'; end if;
  update meals set rating = p_rating where id = m.id;
  if m.web_recipe_id is not null then
    insert into saved_recipes (user_id, recipe_id, rating) values (uid, m.web_recipe_id, p_rating)
    on conflict (user_id, recipe_id) do update set rating = excluded.rating;
  end if;
end $$;

-- ---------- weekly challenges: picked from recipes your pantry can make ----------
drop function if exists public.get_weekly_challenges();
create or replace function public.get_weekly_challenges()
returns table (id uuid, slot smallint, coins int, completed_at timestamptz, recipe_id text, title text, cuisine text, minutes int, score int, week_start date)
language plpgsql security definer set search_path = public, pg_temp as $$
#variable_conflict use_column
declare uid uuid := auth.uid(); wk date := date_trunc('week', now() at time zone 'utc')::date;
begin
  if uid is null then raise exception 'not signed in'; end if;
  return query
    select w.id, w.slot, w.coins, w.completed_at, r.id, r.title, r.cuisine, r.minutes, r.score, w.week_start
    from weekly_challenges w join web_recipes r on r.id = w.recipe_id
    where w.user_id = uid and w.week_start = wk order by w.slot;
end $$;

-- The app proposes up to 3 recipes the pantry can make (one per difficulty if possible).
-- Only works once per week; coins always come from the recipe's difficulty, never from the client.
create or replace function public.set_weekly_challenges(p_recipe_ids text[])
returns int language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); wk date := date_trunc('week', now() at time zone 'utc')::date; n int;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if p_recipe_ids is null or cardinality(p_recipe_ids) = 0 or cardinality(p_recipe_ids) > 3 then raise exception 'pick 1 to 3 recipes'; end if;
  if exists (select 1 from weekly_challenges w where w.user_id = uid and w.week_start = wk) then return 0; end if;
  insert into weekly_challenges (user_id, week_start, slot, recipe_id, coins)
  select uid, wk, (row_number() over (order by r.score))::smallint, r.id, score_to_coins(r.score)
  from (select distinct on (w.id) w.id, w.score from web_recipes w where w.id = any (p_recipe_ids) and w.active) r;
  get diagnostics n = row_count;
  return n;
end $$;

-- ---------- log a cooked meal (v3): recipe is required, title/cuisine/nutrition come from it ----------
drop function if exists public.log_meal(text, text, uuid, uuid, text, text, int, int, int, int);
create or replace function public.log_meal(p_recipe_id text, p_photo_path text, p_challenge_id uuid default null, p_notes text default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid uuid := auth.uid();
  r web_recipes%rowtype;
  v_meal uuid;
  xp_gain int := 0; coin_gain int := 0; completed boolean := false;
  ch weekly_challenges%rowtype;
  today date := (now() at time zone 'utc')::date;
  wk date := date_trunc('week', now() at time zone 'utc')::date;
  p profiles%rowtype;
  new_streak int; used_freeze boolean := false;
  n jsonb;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select * into r from web_recipes w where w.id = p_recipe_id and w.active;
  if not found then raise exception 'unknown recipe'; end if;
  if p_photo_path is null or split_part(p_photo_path, '/', 1) <> uid::text
     or not exists (select 1 from storage.objects o where o.bucket_id = 'meal-photos' and o.name = p_photo_path) then
    raise exception 'photo not found';
  end if;
  n := r.data -> 'nutrition';

  insert into meals (user_id, web_recipe_id, title, cuisine, notes, photo_path, calories, protein_g, carbs_g, fat_g)
  values (uid, r.id, left(r.title, 120), left(r.cuisine, 40), left(p_notes, 500), p_photo_path,
          case when jsonb_typeof(n) = 'object' then least(5000, (n ->> 'calories')::int) end, case when jsonb_typeof(n) = 'object' then least(500, (n ->> 'protein_g')::int) end,
          case when jsonb_typeof(n) = 'object' then least(800, (n ->> 'carbs_g')::int) end, case when jsonb_typeof(n) = 'object' then least(400, (n ->> 'fat_g')::int) end)
  returning id into v_meal;
  insert into saved_recipes (user_id, recipe_id) values (uid, r.id) on conflict do nothing;

  xp_gain := xp_gain + _award_xp(uid, 'cook', 50, 3);
  if not exists (select 1 from meals m where m.user_id = uid and lower(m.cuisine) = lower(r.cuisine) and m.id <> v_meal) then
    xp_gain := xp_gain + _award_xp(uid, 'cuisine_stamp', 40, null);
  end if;

  select * into p from profiles where id = uid for update;
  if p.streak_freeze_week is null or p.streak_freeze_week < wk then
    update profiles set streak_freezes = 1, streak_freeze_week = wk where id = uid;
    p.streak_freezes := 1;
  end if;
  used_freeze := coalesce(p.streak_last_date = today - 2, false) and p.streak_freezes > 0;
  new_streak := case
    when p.streak_last_date = today then p.streak_days
    when p.streak_last_date = today - 1 then p.streak_days + 1
    when used_freeze then p.streak_days + 1
    else 1 end;
  update profiles set last_meal_at = now(), streak_days = new_streak, streak_last_date = today,
    streak_freezes = streak_freezes - (case when used_freeze then 1 else 0 end)
  where id = uid;
  if p.streak_last_date is distinct from today then xp_gain := xp_gain + _award_xp(uid, 'streak', 10, 1); end if;

  if p_challenge_id is not null then
    select * into ch from weekly_challenges w where w.id = p_challenge_id and w.user_id = uid for update;
    if found and ch.completed_at is null and ch.week_start = wk and ch.recipe_id = r.id then
      update weekly_challenges set completed_at = now() where id = ch.id;
      update meals set challenge_id = ch.id where id = v_meal;
      update profiles set coins = coins + ch.coins where id = uid;
      coin_gain := ch.coins; completed := true;
      xp_gain := xp_gain + _award_xp(uid, 'challenge', 100, 3);
    end if;
  end if;

  return jsonb_build_object('meal_id', v_meal, 'xp', xp_gain, 'coins', coin_gain, 'challenge_completed', completed, 'streak', new_streak, 'used_freeze', used_freeze);
end $$;

-- ---------- grants ----------
revoke all on function public.record_login(date, int, text, text) from public, anon;
revoke all on function public.save_recipe(text) from public, anon;
revoke all on function public.rate_meal(uuid, text) from public, anon;
revoke all on function public.get_weekly_challenges() from public, anon;
revoke all on function public.set_weekly_challenges(text[]) from public, anon;
revoke all on function public.log_meal(text, text, uuid, text) from public, anon;
grant execute on function public.record_login(date, int, text, text) to authenticated;
grant execute on function public.save_recipe(text) to authenticated;
grant execute on function public.rate_meal(uuid, text) to authenticated;
grant execute on function public.get_weekly_challenges() to authenticated;
grant execute on function public.set_weekly_challenges(text[]) to authenticated;
grant execute on function public.log_meal(text, text, uuid, text) to authenticated;

