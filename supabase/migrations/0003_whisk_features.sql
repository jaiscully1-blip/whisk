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
