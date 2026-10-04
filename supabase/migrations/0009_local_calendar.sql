-- Whisk 0009 — days follow the player's real calendar, where they live.
-- The app sends the device's time zone (IANA name, e.g. America/New_York) once the player agrees to it in the
-- cookie & privacy popup. Every "today" (streaks, daily quest, weekly challenges, bingo rounds) is then the
-- player's local date. Opening and closing the app any number of times never changes the day.
-- Without a time zone the player's day is UTC, as before. Safe to re-run.

alter table public.profiles add column if not exists time_zone text;
alter table public.profiles add column if not exists consent jsonb;
alter table public.profiles add column if not exists first_open_date date;

create or replace function public._user_tz(p_user uuid) returns text
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce((select p.time_zone from profiles p where p.id = p_user), 'UTC')
$$;
create or replace function public._user_today(p_user uuid) returns date
language sql stable security definer set search_path = public, pg_temp as $$
  select (now() at time zone _user_tz(p_user))::date
$$;
revoke execute on function public._user_tz(uuid) from public, anon, authenticated;
revoke execute on function public._user_today(uuid) from public, anon, authenticated;

-- The player's privacy choices from the popup. p_local_time = true stores the device time zone.
create or replace function public.set_privacy(p_preferences boolean, p_local_time boolean, p_time_zone text default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); tz text;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if p_local_time and p_time_zone is not null then
    if length(p_time_zone) > 64 or not exists (select 1 from pg_timezone_names where name = p_time_zone) then raise exception 'unknown time zone'; end if;
    tz := p_time_zone;
  end if;
  update profiles set
    consent = jsonb_build_object('v', 1, 'essential', true, 'preferences', coalesce(p_preferences, false), 'local_time', coalesce(p_local_time, false), 'at', now()),
    time_zone = case when p_local_time then coalesce(tz, time_zone) else null end
  where id = uid;
  -- Day 1 is the first day the player opened the app, on their own calendar.
  update profiles set first_open_date = coalesce(first_open_date, (coalesce(first_login_at, now()) at time zone coalesce(time_zone, 'UTC'))::date) where id = uid;
  return (select jsonb_build_object('time_zone', time_zone, 'first_open_date', first_open_date, 'today', _user_today(uid)) from profiles where id = uid);
end $$;
revoke execute on function public.set_privacy(boolean, boolean, text) from public, anon;
grant execute on function public.set_privacy(boolean, boolean, text) to authenticated;

-- Same rules as before, now on the player's own calendar day.
create or replace function public.get_daily_quest()
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid uuid := auth.uid();
  d date := _user_today(uid);
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
  select count(*) into prog from xp_events e where e.user_id = uid and e.kind = q.kind and e.created_at >= d::timestamp at time zone _user_tz(uid);
  return jsonb_build_object('kind', q.kind, 'target', q.target, 'progress', least(prog, q.target), 'claimed', q.claimed_at is not null,
    'label', case q.kind when 'pantry_add' then 'Add 3 items to your pantry' when 'cook' then 'Cook a meal and snap a photo' else 'Save a recipe to your cookbook' end);
end $$;

create or replace function public.claim_daily_quest()
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid uuid := auth.uid();
  d date := _user_today(uid);
  q daily_quests%rowtype; prog int; gained int;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select * into q from daily_quests where user_id = uid and day = d for update;
  if not found then raise exception 'no quest today'; end if;
  if q.claimed_at is not null then raise exception 'already claimed'; end if;
  select count(*) into prog from xp_events e where e.user_id = uid and e.kind = q.kind and e.created_at >= d::timestamp at time zone _user_tz(uid);
  if prog < q.target then raise exception 'quest not finished'; end if;
  update daily_quests set claimed_at = now() where user_id = uid and day = d;
  gained := _award_xp(uid, 'quest', 30, 1);
  return jsonb_build_object('xp', gained);
end $$;

create or replace function public.get_weekly_challenges()
returns table (id uuid, slot smallint, coins int, completed_at timestamptz, recipe_id text, title text, cuisine text, minutes int, score int, week_start date)
language plpgsql security definer set search_path = public, pg_temp as $$
#variable_conflict use_column
declare uid uuid := auth.uid(); wk date := date_trunc('week', _user_today(uid))::date;
begin
  if uid is null then raise exception 'not signed in'; end if;
  return query
    select w.id, w.slot, w.coins, w.completed_at, r.id, r.title, r.cuisine, r.minutes, r.score, w.week_start
    from weekly_challenges w join web_recipes r on r.id = w.recipe_id
    where w.user_id = uid and w.week_start = wk order by w.slot;
end $$;

create or replace function public.set_weekly_challenges(p_recipe_ids text[])
returns int language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); wk date := date_trunc('week', _user_today(uid))::date; n int;
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

create or replace function public.log_meal(p_recipe_id text, p_photo_path text, p_challenge_id uuid default null, p_notes text default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid uuid := auth.uid();
  r web_recipes%rowtype;
  v_meal uuid;
  xp_gain int := 0; coin_gain int := 0; completed boolean := false;
  ch weekly_challenges%rowtype;
  today date := _user_today(uid);
  wk date := date_trunc('week', _user_today(uid))::date;
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

create or replace function public._bingo_marks(p_user uuid, p_week date, p_cells text[])
returns boolean[] language sql stable security definer set search_path = public, pg_temp as $$
  select array_agg(exists (
      select 1 from meals m where m.user_id = p_user and m.cooked_at >= p_week::timestamp at time zone _user_tz(p_user)
        and m.cooked_at < (p_week + 5)::timestamp at time zone _user_tz(p_user) and _cuisine_match(m.cuisine, c.cell)
    ) order by c.i)
  from unnest(p_cells) with ordinality as c(cell, i)
$$;

create or replace function public.get_bingo()
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid uuid := auth.uid();
  wk date := _bingo_round_start(_user_today(uid));
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
  return jsonb_build_object('week_start', wk, 'ends', wk + 5, 'cells', to_jsonb(b.cells), 'marks', to_jsonb(marks), 'lines', _bingo_lines(marks), 'claimed', b.claimed_at is not null);
end $$;

create or replace function public.claim_bingo()
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid uuid := auth.uid();
  wk date := _bingo_round_start(_user_today(uid));
  b weekly_bingo%rowtype; gained int;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select * into b from weekly_bingo where user_id = uid and week_start = wk for update;
  if not found then raise exception 'no card this round'; end if;
  if b.claimed_at is not null then raise exception 'already claimed'; end if;
  if _bingo_lines(_bingo_marks(uid, wk, b.cells)) < 1 then raise exception 'no bingo yet'; end if;
  update weekly_bingo set claimed_at = now() where user_id = uid and week_start = wk;
  gained := _award_xp(uid, 'bingo', 200, 1);
  return jsonb_build_object('xp', gained);
end $$;

revoke execute on function public._bingo_marks(uuid, date, text[]) from public, anon, authenticated;
grant execute on function public.get_daily_quest() to authenticated;
grant execute on function public.claim_daily_quest() to authenticated;
grant execute on function public.get_weekly_challenges() to authenticated;
grant execute on function public.set_weekly_challenges(text[]) to authenticated;
grant execute on function public.log_meal(text, text, uuid, text) to authenticated;
grant execute on function public.get_bingo() to authenticated;
grant execute on function public.claim_bingo() to authenticated;
