-- Whisk setup step 3 of 4: 0006_whisk_coins_reset.sql, 0007_bingo_five_days.sql, 0008_passport_countries.sql, 0009_local_calendar.sql, 0010_hockey_helmet.sql, 0011_activity_onboarding_admin.sql
-- Paste ALL of this into Supabase → SQL Editor → New query → Run. Safe to run more than once.

-- ======================= 0006_whisk_coins_reset.sql =======================
-- Whisk 0006: July 18 coin gift, renamed shop items, coin packs (Bitcoin via BTCPay), two-step game reset.
-- Safe to run more than once. Run after 0001–0005.

-- ---------- renamed items (ids stay the same, so owners keep them) ----------
update public.items set name = '50 lb Dumbbell' where id = 'acc-watch';
update public.items set name = 'Basketball Backpack' where id = 'acc-crystal-backpack';

-- ---------- July 18: Whisk Wrapped + 5,000 free coins, once a year ----------
create or replace function public.record_login(p_local_date date, p_local_hour int, p_user_agent text default null, p_device text default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid uuid := auth.uid();
  p profiles%rowtype;
  new_session boolean;
  pops text[] := array[]::text[];
  night_date date;
  gift int := 0;
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

  if p.last_meal_at is not null and p.last_meal_at < now() - interval '76 hours'
     and (p.last_back_popup_at is null or p.last_back_popup_at < p.last_meal_at) then
    pops := array_append(pops, 'back');
    update profiles set last_back_popup_at = now() where id = uid;
  elsif p_local_hour >= 21 or p_local_hour < 4 then
    night_date := case when p_local_hour < 4 then p_local_date - 1 else p_local_date end;
    if p.last_late_popup_date is null or p.last_late_popup_date <> night_date then
      pops := array_append(pops, 'late');
      update profiles set last_late_popup_date = night_date where id = uid;
    end if;
  end if;

  -- July 18 (the player's date, checked against the server's within ±2 days above): Wrapped + 5,000 coins, once a year
  if extract(month from p_local_date) = 7 and extract(day from p_local_date) = 18
     and p.last_wrapped_year is distinct from extract(year from p_local_date)::int then
    pops := array_append(pops, 'wrapped');
    gift := 5000;
    update profiles set last_wrapped_year = extract(year from p_local_date)::int, coins = coins + gift where id = uid;
  end if;

  return jsonb_build_object('popups', to_jsonb(pops), 'popup', pops[1], 'new_session', new_session,
    'last_device', p.last_device, 'last_seen_at', p.last_seen_at, 'gift_coins', gift);
end $$;

-- ---------- coin packs (prices in USD, paid in Bitcoin through BTCPay) ----------
create table if not exists public.coin_packs (
  id text primary key, coins integer not null check (coins > 0), usd numeric(8, 2) not null check (usd > 0), sort smallint not null default 0, active boolean not null default true
);
insert into public.coin_packs (id, coins, usd, sort) values
  ('coins-1000', 1000, 2.00, 1), ('coins-3000', 3000, 5.00, 2), ('coins-10000', 10000, 10.00, 3), ('coins-15000', 15000, 20.00, 4)
on conflict (id) do update set coins = excluded.coins, usd = excluded.usd, sort = excluded.sort, active = true;
alter table public.coin_packs enable row level security;
drop policy if exists coin_packs_read on public.coin_packs;
create policy coin_packs_read on public.coin_packs for select to authenticated using (active);
revoke all on public.coin_packs from anon, authenticated;
grant select on public.coin_packs to authenticated;

create table if not exists public.coin_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  pack_id text not null references public.coin_packs (id),
  coins integer not null, usd numeric(8, 2) not null,
  status text not null default 'pending' check (status in ('pending', 'paid')),
  invoice_id text unique,
  created_at timestamptz not null default now(), paid_at timestamptz
);
create index if not exists coin_orders_user_idx on public.coin_orders (user_id, created_at desc);
alter table public.coin_orders enable row level security;
drop policy if exists coin_orders_select on public.coin_orders;
create policy coin_orders_select on public.coin_orders for select to authenticated using (user_id = auth.uid());
revoke all on public.coin_orders from anon, authenticated;
grant select on public.coin_orders to authenticated;   -- created and paid only through the functions below

-- A secret only the payment webhook knows (stored as a SHA-256 hash; set it once, see LAUNCH.md).
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table if not exists private.app_secrets (name text primary key, sha256_hex text not null);

create or replace function public.create_coin_order(p_pack_id text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); pk coin_packs%rowtype; oid uuid;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select * into pk from coin_packs where id = p_pack_id and active;
  if not found then raise exception 'unknown pack'; end if;
  if (select count(*) from coin_orders where user_id = uid and status = 'pending' and created_at > now() - interval '1 hour') >= 10 then raise exception 'too many open orders'; end if;
  insert into coin_orders (user_id, pack_id, coins, usd) values (uid, pk.id, pk.coins, pk.usd) returning id into oid;
  return jsonb_build_object('order_id', oid, 'coins', pk.coins, 'usd', pk.usd);
end $$;

-- Called only by the BTCPay webhook route after it verified the signature AND re-checked the invoice with BTCPay.
create or replace function public.credit_coin_order(p_order_id uuid, p_invoice_id text, p_paid_usd numeric, p_secret text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare o coin_orders%rowtype; want text;
begin
  select sha256_hex into want from private.app_secrets where name = 'payments_webhook';
  if want is null or p_secret is null or encode(sha256(convert_to(p_secret, 'UTF8')), 'hex') <> want then raise exception 'forbidden'; end if;
  select * into o from coin_orders where id = p_order_id for update;
  if not found then raise exception 'unknown order'; end if;
  if o.status = 'paid' then return jsonb_build_object('credited', false, 'reason', 'already paid'); end if;
  if p_paid_usd is null or p_paid_usd < o.usd then raise exception 'underpaid'; end if;
  update coin_orders set status = 'paid', paid_at = now(), invoice_id = left(p_invoice_id, 100) where id = o.id;
  update profiles set coins = coins + o.coins where id = o.user_id;
  return jsonb_build_object('credited', true, 'coins', o.coins);
end $$;

-- ---------- reset game: needs a fresh email code (second factor) from the last 10 minutes ----------
create or replace function public.reset_game()
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); amr jsonb := coalesce(auth.jwt() -> 'amr', '[]'::jsonb); ok boolean;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select exists (select 1 from jsonb_array_elements(amr) a where a ->> 'method' in ('otp', 'magiclink')
                 and (a ->> 'timestamp')::bigint > extract(epoch from now() - interval '10 minutes')) into ok;
  if not ok then raise exception 'confirm with the code we emailed you first'; end if;
  delete from pantry_items where user_id = uid;
  delete from shopping_items where user_id = uid;
  delete from saved_recipes where user_id = uid;
  delete from meals where user_id = uid;
  delete from weekly_challenges where user_id = uid;
  delete from daily_quests where user_id = uid;
  delete from weekly_bingo where user_id = uid;
  delete from xp_events where user_id = uid;
  -- Shop items, outfit and coins are kept: coins can be bought with real money.
  update profiles set xp = 0, streak_days = 0, streak_last_date = null, streak_freezes = 1, streak_freeze_week = null,
    last_meal_at = null, last_back_popup_at = null, ui_state = null where id = uid;
end $$;

revoke all on function public.record_login(date, int, text, text) from public, anon;
revoke all on function public.create_coin_order(text) from public, anon;
revoke all on function public.reset_game() from public, anon;
revoke all on function public.credit_coin_order(uuid, text, numeric, text) from public;
grant execute on function public.record_login(date, int, text, text) to authenticated;
grant execute on function public.create_coin_order(text) to authenticated;
grant execute on function public.reset_game() to authenticated;
grant execute on function public.credit_coin_order(uuid, text, numeric, text) to anon, authenticated;   -- guarded by the webhook secret

-- ======================= 0007_bingo_five_days.sql =======================
-- Whisk 0007 — cuisine bingo runs in 5-day rounds instead of weeks.
-- Rounds are counted from a fixed day (Mon 5 Jan 2026, UTC), so everyone's card changes on the same day.
-- weekly_bingo.week_start now holds the first day of the round.

create or replace function public._bingo_round_start(p_day date default (now() at time zone 'utc')::date)
returns date language sql immutable set search_path = '' as $$
  select date '2026-01-05' + (floor((p_day - date '2026-01-05') / 5.0) * 5)::int
$$;

create or replace function public._bingo_marks(p_user uuid, p_week date, p_cells text[])
returns boolean[] language sql stable security definer set search_path = public, pg_temp as $$
  select array_agg(exists (
      select 1 from meals m where m.user_id = p_user and m.cooked_at >= p_week::timestamp at time zone 'utc'
        and m.cooked_at < (p_week + 5)::timestamp at time zone 'utc' and _cuisine_match(m.cuisine, c.cell)
    ) order by c.i)
  from unnest(p_cells) with ordinality as c(cell, i)
$$;

create or replace function public.get_bingo()
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid uuid := auth.uid();
  wk date := _bingo_round_start((now() at time zone 'utc')::date);
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
  wk date := _bingo_round_start((now() at time zone 'utc')::date);
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

revoke execute on function public._bingo_round_start(date) from public, anon;
revoke execute on function public._bingo_marks(uuid, date, text[]) from public, anon, authenticated;
revoke execute on function public.get_bingo() from public, anon;
revoke execute on function public.claim_bingo() from public, anon;
grant execute on function public._bingo_round_start(date) to authenticated;
grant execute on function public.get_bingo() to authenticated;
grant execute on function public.claim_bingo() to authenticated;

-- ======================= 0008_passport_countries.sql =======================
-- Whisk 0008 — the passport becomes a stamp album of all 193 UN member states.
-- Each web recipe carries the country it comes from (data->>'country', ISO 3166 alpha-2, from 0005).
-- Every logged meal remembers that country, so the album can count meals per country.
-- Safe to re-run.

alter table public.meals add column if not exists country text;
do $$ begin
  alter table public.meals add constraint meals_country_iso2 check (country is null or country ~ '^[A-Z]{2}$');
exception when duplicate_object then null; end $$;

-- The country always comes from the recipe on the server, never from the player.
create or replace function public._meal_country() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  new.country := case when new.web_recipe_id is null then null
    else (select nullif(w.data ->> 'country', '') from web_recipes w where w.id = new.web_recipe_id) end;
  return new;
end $$;
revoke execute on function public._meal_country() from public, anon, authenticated;

drop trigger if exists meals_country on public.meals;
create trigger meals_country before insert or update of web_recipe_id, country on public.meals
  for each row execute function public._meal_country();

-- Meals logged before this migration
update public.meals m set web_recipe_id = m.web_recipe_id where m.web_recipe_id is not null and m.country is null;

-- ======================= 0009_local_calendar.sql =======================
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

-- ======================= 0010_hockey_helmet.sql =======================
-- Whisk 0010 — the shop's Chef Hat becomes a Hockey Helmet. Same item id, so anyone who bought it keeps it.
update public.items set name = 'Hockey Helmet' where id = 'hat-chef-hat';

-- ======================= 0011_activity_onboarding_admin.sql =======================
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

