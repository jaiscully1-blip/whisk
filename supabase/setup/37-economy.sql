-- 0044: The new economy (from the Yoke XP and coins sheet, v2). Run after 0043. Safe to run more than once.
-- Every XP and coin amount lives in public.economy_rules, so tuning later is one UPDATE, not a new migration:
--   update economy_rules set xp = 120 where rule = 'cook_1';
-- Cooking is tiered per rolling 24 hours: 1st meal 100 XP + 400 coins, 2nd 50 + 250, 3rd 30 + 150.

create table if not exists public.economy_rules (
  rule text primary key,
  xp int not null default 0,
  coins int not null default 0,
  daily_cap int
);
alter table public.economy_rules enable row level security;
revoke all on public.economy_rules from anon, authenticated;

insert into public.economy_rules (rule, xp, coins, daily_cap) values
  ('cook_1', 100, 400, 3), ('cook_2', 50, 250, 3), ('cook_3', 30, 150, 3),
  ('cuisine_stamp', 40, 100, null),
  ('streak', 20, 0, 1),
  ('country_challenge', 200, 0, null),
  ('challenge', 50, 0, 1),
  ('country_done', 250, 2000, null),
  ('pantry_add', 1, 0, 10),
  ('recipe_save', 0, 0, 10),
  ('kitchen_place', 1, 0, 10),
  ('kitchen_full', 15, 50, 1),
  ('quest', 40, 100, 1),
  ('bingo', 150, 500, 1),
  ('calorie_goal', 15, 100, 1),
  ('quiz', 15, 0, 5)
on conflict (rule) do update set xp = excluded.xp, coins = excluded.coins, daily_cap = excluded.daily_cap;

-- Pays XP and coins for one action from economy_rules (falls back to the amount given if a rule is missing).
create or replace function public._pay(p_user uuid, p_kind text, p_amount int, p_daily_cap int)
returns table (o_xp int, o_coins int) language plpgsql security definer set search_path = public, pg_temp as $$
declare r economy_rules%rowtype; v_rule text := p_kind; n int; x int := p_amount; c int := 0; cap int := p_daily_cap;
begin
  if p_kind = 'cook' then
    select count(*) into n from xp_events where user_id = p_user and kind = 'cook' and created_at > now() - interval '24 hours';
    v_rule := 'cook_' || least(n + 1, 3);
  end if;
  select * into r from economy_rules where rule = v_rule;
  if found then x := r.xp; c := r.coins; cap := r.daily_cap; end if;
  if cap is not null then
    select count(*) into n from xp_events where user_id = p_user and kind = p_kind and created_at > now() - interval '24 hours';
    if n >= cap then return query select 0, 0; return; end if;
  end if;
  insert into xp_events (user_id, kind, amount) values (p_user, p_kind, x);
  update profiles set xp = xp + x, coins = coins + c where id = p_user;
  return query select x, c;
end $$;

-- Old callers keep working: same signature, now rule-driven (and it pays the rule's coins too).
create or replace function public._award_xp(p_user uuid, p_kind text, p_amount int, p_daily_cap int)
returns int language sql security definer set search_path = public, pg_temp as $$
  select o_xp from public._pay(p_user, p_kind, p_amount, p_daily_cap)
$$;
revoke execute on function public._pay(uuid, text, int, int), public._award_xp(uuid, text, int, int) from public, anon, authenticated;

-- one country challenge tier (200 XP), whatever the generator says
create or replace function public._cc_flat_xp() returns trigger language plpgsql as $$
begin new.xp := 200; return new; end $$;
drop trigger if exists country_challenges_flat on public.country_challenges;
create trigger country_challenges_flat before insert on public.country_challenges for each row execute function public._cc_flat_xp();
update public.country_challenges set xp = 200 where completed_at is null and xp <> 200;

-- the 5th dish from a country: coins and XP now come from the rules
create or replace function public._award_stamp() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.country is null then return null; end if;
  if public._country_complete(new.user_id, new.country) then
    insert into country_done (user_id, country, meal_id) values (new.user_id, new.country, new.id) on conflict do nothing;
    if found then perform _award_xp(new.user_id, 'country_done', 250, null); end if;
  end if;
  return null;
end $$;

-- weekly challenge coins: 150 (easiest) to 800 (hardest)
create or replace function public.score_to_coins(s int)
returns int language sql immutable set search_path = '' as $$
  select (150 + round((case
    when s < 35 then greatest(100, least(300, 100 + (round(greatest(0, s - 14) / 20.0 * 200 / 50) * 50)::int))
    when s < 65 then greatest(400, least(700, 400 + (round((s - 35) / 29.0 * 300 / 50) * 50)::int))
    when s < 80 then greatest(800, least(950, 800 + (round((s - 65) / 14.0 * 150 / 50) * 50)::int))
    else 1000 end - 100) * 650 / 900.0 / 50) * 50)::int
$$;
update public.weekly_challenges w set coins = public.score_to_coins(r.score) from public.web_recipes r where r.id = w.recipe_id and w.completed_at is null;

-- streak milestones: 3, 7, 14, 30, 60, 100 days (paid out automatically when you cook)
create or replace function public._streak_reward(p_days int) returns int language sql immutable as $$
  select case p_days when 3 then 100 when 7 then 300 when 14 then 600 when 30 then 1500 when 60 then 3000 when 100 then 6000 end
$$;

-- daily calorie reward: log your meals today (any amount). 15 XP + 100 coins, once a day.
create or replace function public.claim_calorie_reward()
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); today date; tz text; g int; tot int; pay record;
begin
  if uid is null then raise exception 'not signed in'; end if;
  today := _user_today(uid); tz := _user_tz(uid);
  select calorie_goal into g from profiles where id = uid for update;
  if g is null then raise exception 'set a goal first'; end if;
  select coalesce(sum(calories), 0) into tot from meals where user_id = uid and (cooked_at at time zone tz)::date = today;
  if tot <= 0 then raise exception 'log a meal first'; end if;
  insert into calorie_claims (user_id, day, kcal) values (uid, today, tot) on conflict do nothing;
  if not found then raise exception 'already claimed today'; end if;
  select * into pay from _pay(uid, 'calorie_goal', 15, 1);
  return jsonb_build_object('coins', pay.o_coins, 'xp', pay.o_xp);
end $$;

create or replace function public.claim_daily_quest()
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid uuid := auth.uid();
  d date := _user_today(uid);
  q daily_quests%rowtype; prog int; gained int; pay record;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select * into q from daily_quests where user_id = uid and day = d for update;
  if not found then raise exception 'no quest today'; end if;
  if q.claimed_at is not null then raise exception 'already claimed'; end if;
  select count(*) into prog from xp_events e where e.user_id = uid and e.kind = q.kind and e.created_at >= d::timestamp at time zone _user_tz(uid);
  if prog < q.target then raise exception 'quest not finished'; end if;
  update daily_quests set claimed_at = now() where user_id = uid and day = d;
  select * into pay from _pay(uid, 'quest', 40, 1); gained := pay.o_xp;
  return jsonb_build_object('xp', gained, 'coins', pay.o_coins);
end $$;

create or replace function public.claim_bingo()
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid uuid := auth.uid();
  wk date := _bingo_round_start(_user_today(uid));
  b weekly_bingo%rowtype; gained int; pay record;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select * into b from weekly_bingo where user_id = uid and week_start = wk for update;
  if not found then raise exception 'no card this round'; end if;
  if b.claimed_at is not null then raise exception 'already claimed'; end if;
  if _bingo_lines(_bingo_marks(uid, wk, b.cells)) < 1 then raise exception 'no bingo yet'; end if;
  update weekly_bingo set claimed_at = now() where user_id = uid and week_start = wk;
  select * into pay from _pay(uid, 'bingo', 150, 1); gained := pay.o_xp;
  return jsonb_build_object('xp', gained, 'coins', pay.o_coins);
end $$;

create or replace function public.log_meal(p_recipe_id text, p_photo_path text, p_challenge_id uuid default null, p_notes text default null, p_dish text default null, p_country text default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid uuid := auth.uid();
  r web_recipes%rowtype;
  dsh dishes%rowtype;
  v_meal uuid; v_country text; v_done text;
  xp_gain int := 0; coin_gain int := 0; completed boolean := false; cook_xp int;
  pay record; lucky boolean := false; mile record; mile_coins int := 0; cdx int; cdc int;
  ch weekly_challenges%rowtype;
  cc country_challenges%rowtype;
  today date := _user_today(uid);
  wk date := date_trunc('week', _user_today(uid))::date;
  p profiles%rowtype;
  new_streak int; used_freeze boolean := false;
  repair_ready int; repaired boolean := false;
  n jsonb;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if p_recipe_id is not null then
    select * into r from web_recipes w where w.id = p_recipe_id and w.active;
    if not found then raise exception 'unknown recipe'; end if;
  else
    select * into dsh from dishes d where d.country = p_country and lower(d.name) = lower(trim(p_dish));
    if not found then raise exception 'unknown dish'; end if;
  end if;
  if p_photo_path is null or split_part(p_photo_path, '/', 1) <> uid::text
     or not exists (select 1 from storage.objects o where o.bucket_id = 'meal-photos' and o.name = p_photo_path) then
    raise exception 'photo not found';
  end if;
  n := r.data -> 'nutrition';

  insert into meals (user_id, web_recipe_id, country, title, cuisine, notes, photo_path, calories, protein_g, carbs_g, fat_g)
  values (uid, r.id, dsh.country, left(coalesce(r.title, dsh.name), 120), left(coalesce(r.cuisine, dsh.cuisine), 40), left(p_notes, 500), p_photo_path,
          case when jsonb_typeof(n) = 'object' then least(5000, (n ->> 'calories')::int) end, case when jsonb_typeof(n) = 'object' then least(500, (n ->> 'protein_g')::int) end,
          case when jsonb_typeof(n) = 'object' then least(800, (n ->> 'carbs_g')::int) end, case when jsonb_typeof(n) = 'object' then least(400, (n ->> 'fat_g')::int) end)
  returning id, country into v_meal, v_country;
  if r.id is not null then insert into saved_recipes (user_id, recipe_id) values (uid, r.id) on conflict do nothing; end if;

  -- every cooked meal: +100 XP and 500 coins (up to 3 meals a day, each with a photo)
  select * into pay from _pay(uid, 'cook', 100, 3);
  cook_xp := pay.o_xp; xp_gain := xp_gain + pay.o_xp; coin_gain := coin_gain + pay.o_coins;
  -- lucky meal: about 1 in 8 cooked meals pays 300 extra (free coins only)
  if cook_xp > 0 and random() < 0.125 then
    update profiles set coins = coins + 300 where id = uid; coin_gain := coin_gain + 300; lucky := true;
  end if;
  if not exists (select 1 from meals m where m.user_id = uid and lower(m.cuisine) = lower(coalesce(r.cuisine, dsh.cuisine)) and m.id <> v_meal) then
    select * into pay from _pay(uid, 'cuisine_stamp', 40, null);
    xp_gain := xp_gain + pay.o_xp; coin_gain := coin_gain + pay.o_coins;
  end if;
  -- a country challenge for this recipe
  if r.id is not null then
    select * into cc from country_challenges h where h.user_id = uid and h.recipe_id = r.id and h.completed_at is null for update;
    if found then
      update country_challenges set completed_at = now() where id = cc.id;
      xp_gain := xp_gain + _award_xp(uid, 'country_challenge', cc.xp, null);
    end if;
  end if;

  perform _end_vacation(uid);   -- cooking means you're back
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
  if p.streak_last_date = today - 2 and not used_freeze and p.streak_days > 1 then
    update profiles set repair_streak = p.streak_days, repair_day = today where id = uid;
    repair_ready := p.streak_days;
  elsif p.streak_last_date = today and p.repair_day = today and coalesce(p.repair_streak, 0) > 0 then
    new_streak := p.repair_streak + 1; repaired := true;
    update profiles set repair_streak = null, repair_day = null where id = uid;
  end if;
  update profiles set last_meal_at = now(), streak_days = new_streak, streak_last_date = today,
    streak_freezes = streak_freezes - (case when used_freeze then 1 else 0 end)
  where id = uid;
  if p.streak_last_date is distinct from today then xp_gain := xp_gain + _award_xp(uid, 'streak', 20, 1); end if;
  -- streak milestones pay out by themselves now
  for mile in select d from unnest(array[3, 7, 14, 30, 60, 100]) d
              where d <= new_streak and not exists (select 1 from streak_milestones s where s.user_id = uid and s.days = d) loop
    insert into streak_milestones (user_id, days) values (uid, mile.d) on conflict do nothing;
    if found then update profiles set coins = coins + _streak_reward(mile.d) where id = uid; coin_gain := coin_gain + _streak_reward(mile.d); mile_coins := mile_coins + _streak_reward(mile.d); end if;
  end loop;

  if p_challenge_id is not null then
    select * into ch from weekly_challenges w where w.id = p_challenge_id and w.user_id = uid for update;
    if found and ch.completed_at is null and ch.week_start = wk and r.id is not null and ch.recipe_id = r.id
       and not exists (select 1 from xp_events e where e.user_id = uid and e.kind = 'challenge' and e.created_at > now() - interval '24 hours') then   -- one challenge dish a day
      update weekly_challenges set completed_at = now() where id = ch.id;
      update meals set challenge_id = ch.id where id = v_meal;
      update profiles set coins = coins + ch.coins where id = uid;
      coin_gain := coin_gain + ch.coins; completed := true;
      xp_gain := xp_gain + _award_xp(uid, 'challenge', 50, 1);
    end if;
  end if;

  select d.country into v_done from country_done d where d.user_id = uid and d.meal_id = v_meal;
  if v_done is not null then
    select coalesce(xp, 0), coalesce(coins, 0) into cdx, cdc from economy_rules where rule = 'country_done';
    coin_gain := coin_gain + coalesce(cdc, 0); xp_gain := xp_gain + coalesce(cdx, 0);
  end if;

  return jsonb_build_object('country_done', v_done, 'country', v_country, 'meal_id', v_meal, 'xp', xp_gain, 'coins', coin_gain, 'challenge_completed', completed,
    'streak', new_streak, 'lucky', lucky, 'streak_coins', mile_coins, 'used_freeze', used_freeze, 'repair_ready', repair_ready, 'repaired', repaired);
end $$;

revoke all on function public.claim_daily_quest(), public.claim_bingo(), public.claim_calorie_reward() from public, anon;
grant execute on function public.claim_daily_quest(), public.claim_bingo(), public.claim_calorie_reward() to authenticated;
revoke all on function public.log_meal(text, text, uuid, text, text, text) from public, anon;
grant execute on function public.log_meal(text, text, uuid, text, text, text) to authenticated;
notify pgrst, 'reload schema';
