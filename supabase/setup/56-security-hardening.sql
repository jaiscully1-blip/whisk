-- 0063: Security hardening (Oct 22 review). Safe to run more than once. Run after 0062.
--  1. Reset game can't be used to farm coins. Coins survive a reset, so everything that pays "once" now remembers it
--     in reward_ledger (never cleared by a reset): each country's completion bonus, each cuisine stamp. A reset also
--     keeps this week's challenges, today's quest and this round's bingo (already-claimed stays claimed) and the XP
--     history the daily caps count. And a reset is allowed once every 7 days.
--  2. Push notifications only go to real browser push services (Apple, Google, Mozilla, Microsoft). Before, a phone could
--     register any web address and the server would send requests to it.
--  3. Defense in depth: no player role can TRUNCATE a table; functions that need a signed-in player can't be called
--     signed out; the old, unused coin-order functions can't be called at all.

-- 1. what has already paid out once, kept through resets (players can't read or write it)
create table if not exists public.reward_ledger (
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('country', 'cuisine')),
  key text not null,
  at timestamptz not null default now(),
  primary key (user_id, kind, key)
);
alter table public.reward_ledger enable row level security;
revoke all on public.reward_ledger from public, anon, authenticated;
insert into public.reward_ledger (user_id, kind, key) select user_id, 'country', country from public.country_done on conflict do nothing;
insert into public.reward_ledger (user_id, kind, key) select distinct user_id, 'cuisine', lower(cuisine) from public.meals where cuisine is not null on conflict do nothing;
alter table public.profiles add column if not exists last_reset_at timestamptz;

-- the 5th dish from a country pays once per player, ever
create or replace function public._award_stamp() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.country is null then return null; end if;
  if public._country_complete(new.user_id, new.country) then
    insert into reward_ledger (user_id, kind, key) values (new.user_id, 'country', new.country) on conflict do nothing;
    if found then
      insert into country_done (user_id, country, meal_id) values (new.user_id, new.country, new.id) on conflict do nothing;
      if found then perform _award_xp(new.user_id, 'country_done', 250, null); end if;
    else
      insert into country_done (user_id, country, meal_id) values (new.user_id, new.country, null) on conflict do nothing;   -- shows as done again, pays nothing
    end if;
  end if;
  return null;
end $$;

-- each new cuisine stamp pays once per player, ever (log_meal checks the ledger too)
create or replace function public._ledger_cuisine() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.cuisine is not null then insert into reward_ledger (user_id, kind, key) values (new.user_id, 'cuisine', lower(new.cuisine)) on conflict do nothing; end if;
  return null;
end $$;
drop trigger if exists meals_ledger_cuisine on public.meals;
create trigger meals_ledger_cuisine after insert on public.meals for each row execute function public._ledger_cuisine();
revoke execute on function public._ledger_cuisine(), public._award_stamp() from public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.log_meal(p_recipe_id text, p_photo_path text, p_challenge_id uuid DEFAULT NULL::uuid, p_notes text DEFAULT NULL::text, p_dish text DEFAULT NULL::text, p_country text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
  lost_n int; left_fr int;
  n jsonb;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if (select count(*) from meals m where m.user_id = uid and (m.cooked_at at time zone _user_tz(uid))::date = today) >= 10 then raise exception 'daily meal limit'; end if;
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
  if cook_xp > 0 and random() < coalesce(nullif(current_setting('yoke.lucky', true), '')::float, 0.125) then
    update profiles set coins = coins + 300 where id = uid; coin_gain := coin_gain + 300; lucky := true;
  end if;
  if not exists (select 1 from meals m where m.user_id = uid and lower(m.cuisine) = lower(coalesce(r.cuisine, dsh.cuisine)) and m.id <> v_meal)
     and not exists (select 1 from reward_ledger l where l.user_id = uid and l.kind = 'cuisine' and l.key = lower(coalesce(r.cuisine, dsh.cuisine))) then   -- paid once, even after a reset
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
  -- One free streak freeze (not weekly). It saves exactly one missed day; after that, freezes are bought with coins.
  used_freeze := coalesce(p.streak_last_date = today - 2, false) and p.streak_freezes > 0;
  new_streak := case
    when p.streak_last_date = today then p.streak_days
    when p.streak_last_date = today - 1 then p.streak_days + 1
    when used_freeze then p.streak_days + 1
    else 1 end;
  -- Streak lost: remember how long it was, so a Revive can bring it back.
  if p.streak_last_date < today - 1 and not used_freeze and coalesce(p.streak_days, 0) > 1 then
    update profiles set streak_lost = p.streak_days, streak_lost_day = today where id = uid;
    lost_n := p.streak_days;
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

  update meals set xp_earned = xp_gain, coins_earned = coin_gain where id = v_meal;   -- what this meal paid, so deleting it can take it back
  return jsonb_build_object('country_done', v_done, 'country', v_country, 'meal_id', v_meal, 'xp', xp_gain, 'coins', coin_gain, 'challenge_completed', completed,
    'streak', new_streak, 'lucky', lucky, 'streak_coins', mile_coins, 'used_freeze', used_freeze, 'freezes_left', (select streak_freezes from profiles where id = uid), 'lost_streak', lost_n);
end $function$;

create or replace function public.reset_game() returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); last timestamptz;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select last_reset_at into last from profiles where id = uid for update;
  if last is not null and last > now() - interval '7 days' then raise exception 'you can reset once a week'; end if;
  delete from pantry_items where user_id = uid;
  delete from shopping_items where user_id = uid;
  delete from saved_recipes where user_id = uid;
  delete from my_recipes where user_id = uid;
  delete from country_challenges where user_id = uid;
  delete from country_done where user_id = uid;
  delete from meals where user_id = uid;
  delete from weekly_challenges where user_id = uid and week_start < date_trunc('week', _user_today(uid))::date;   -- this week's stay (paid once)
  delete from daily_quests where user_id = uid and day < _user_today(uid);                                        -- today's stays
  delete from weekly_bingo where user_id = uid and week_start < _bingo_round_start(_user_today(uid));               -- this round's stays
  delete from xp_events where user_id = uid and created_at < now() - interval '2 days';                             -- recent ones keep the daily caps
  delete from kitchen_layouts where user_id = uid;
  update profiles set xp = 0, streak_days = 0, streak_last_date = null, streak_freezes = 1, streak_freeze_week = null, streak_lost = null, streak_lost_day = null,
    last_meal_at = null, last_back_popup_at = null, ui_state = null, last_reset_at = now() where id = uid;
end $$;

-- 2. push subscriptions: real push services only, sane sizes
create or replace function public._push_endpoint_ok(p text) returns boolean language sql immutable set search_path = '' as $$
  select coalesce(char_length(p) <= 1000 and p ~ '^https://((fcm|android)\.googleapis\.com|([a-z0-9-]+\.)*push\.services\.mozilla\.com|([a-z0-9-]+\.)*push\.apple\.com|([a-z0-9-]+\.)*notify\.windows\.com)/', false)
$$;
create or replace function public.save_push(p_endpoint text, p_p256dh text, p_auth text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  if not _push_endpoint_ok(p_endpoint) then raise exception 'not a push service'; end if;
  if char_length(coalesce(p_p256dh, '')) not between 40 and 200 or char_length(coalesce(p_auth, '')) not between 8 and 100 then raise exception 'bad push keys'; end if;
  insert into push_subs (endpoint, user_id, p256dh, auth) values (p_endpoint, uid, p_p256dh, p_auth)
  on conflict (endpoint) do update set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth, created_at = now();
  delete from push_subs where user_id = uid and endpoint not in (select endpoint from push_subs where user_id = uid order by created_at desc limit 5);
end $$;
delete from public.push_subs where not public._push_endpoint_ok(endpoint);

-- 3. defense in depth
do $$ declare t record; begin
  for t in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind in ('r', 'v', 'm', 'p') loop
    execute format('revoke truncate on public.%I from anon, authenticated', t.relname);
  end loop;
end $$;
revoke execute on function public.start_party(text, text[]), public.get_parties(), public.get_party_globe(uuid), public.ping(),
  public._chat_photo_visible(text), public._cookoff_photo_visible(text), public._feed_photo_visible(text) from public, anon;
do $$ begin
  revoke execute on function public.credit_coin_order(uuid, text, numeric, text) from public, anon, authenticated;
exception when undefined_function then null; end $$;
do $$ declare f record; begin
  for f in select p.oid::regprocedure sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'create_coin_order' loop
    execute format('revoke execute on function %s from public, anon, authenticated', f.sig);
  end loop;
end $$;
