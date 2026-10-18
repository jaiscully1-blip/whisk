-- 0047: Streak freezes and Revive. Run after 0046. Safe to run more than once.
--  • Everyone gets 1 free streak freeze (no weekly refill). It saves ONE missed day. After it is used, freezes cost 1,500 coins
--    (you can hold up to 3), and the app pops up an offer to buy one.
--  • Lose your streak and the app offers a Revive ($0.99): brings the streak back and adds a fresh freeze.
--    The Revive is paid through RevenueCat like coin packs; the webhook grants a revive token, then the player uses it.
--  • The old "cook twice tomorrow to repair" is replaced by Revive.

alter table public.profiles add column if not exists streak_lost int, add column if not exists streak_lost_day date,
  add column if not exists revive_tokens int not null default 0 check (revive_tokens >= 0);

create table if not exists public.revive_purchases (
  transaction_id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id text not null,
  store text not null,
  sandbox boolean not null default false,
  usd numeric(10, 2),
  status text not null default 'paid' check (status in ('paid', 'refunded')),
  created_at timestamptz not null default now()
);
alter table public.revive_purchases enable row level security;
revoke all on public.revive_purchases from anon, authenticated;

-- a streak that will still count (a freeze covers the single missed day)
create or replace function public._live_streak(p_user uuid) returns int language sql stable security definer set search_path = public, pg_temp as $$
  select case when p.vacation_since is not null or p.streak_last_date >= _user_today(p_user) - 1
                or (p.streak_last_date = _user_today(p_user) - 2 and p.streak_freezes > 0) then coalesce(p.streak_days, 0) else 0 end
  from profiles p where p.id = p_user
$$;

-- How long the streak was that you lost (null if you haven't lost one)
create or replace function public._lost_streak(p_user uuid) returns int language sql stable security definer set search_path = public, pg_temp as $$
  select case
    when p.vacation_since is not null then null
    when p.streak_last_date = _user_today(p_user) and coalesce(p.streak_lost, 0) > 1 and p.streak_lost_day = _user_today(p_user) then p.streak_lost
    when p.streak_last_date < _user_today(p_user) - 1 and not (p.streak_last_date = _user_today(p_user) - 2 and p.streak_freezes > 0) and coalesce(p.streak_days, 0) > 1 then p.streak_days
    when coalesce(p.streak_lost, 0) > 1 and p.streak_lost_day >= _user_today(p_user) - 1 and p.streak_last_date >= _user_today(p_user) - 1 then p.streak_lost
  end
  from profiles p where p.id = p_user
$$;

create or replace function public.get_streak()
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); s int; fr int; rv int; done int[]; ms jsonb;
begin
  if uid is null then raise exception 'not signed in'; end if;
  s := _live_streak(uid);
  select streak_freezes, revive_tokens into fr, rv from profiles where id = uid;
  select coalesce(array_agg(days), '{}') into done from streak_milestones where user_id = uid;
  select jsonb_agg(jsonb_build_object('days', d, 'coins', _streak_reward(d), 'claimed', d = any (done), 'ready', s >= d and not (d = any (done))) order by d)
    into ms from unnest(array[3, 7, 14, 30, 60, 100]) d;
  return jsonb_build_object('streak', s, 'freezes', coalesce(fr, 0), 'milestones', ms, 'lost', _lost_streak(uid), 'revives', coalesce(rv, 0), 'freeze_price', 1500, 'freeze_max', 3);
end $$;

-- Buy one streak freeze with coins (up to 3 held)
create or replace function public.buy_streak_freeze()
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); p profiles%rowtype;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select * into p from profiles where id = uid for update;
  if p.streak_freezes >= 3 then raise exception 'You can hold 3 freezes.'; end if;
  if p.coins < 1500 then raise exception 'You need 1,500 coins.'; end if;
  update profiles set coins = coins - 1500, streak_freezes = streak_freezes + 1 where id = uid;
  return jsonb_build_object('freezes', p.streak_freezes + 1, 'coins', p.coins - 1500);
end $$;

-- Use a paid Revive: the lost streak comes back and you get a fresh freeze.
create or replace function public.use_revive()
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); p profiles%rowtype; n int; today date := _user_today(uid); back int;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select * into p from profiles where id = uid for update;
  if p.revive_tokens < 1 then raise exception 'No revive to use.'; end if;
  n := _lost_streak(uid);
  if n is null then raise exception 'Your streak is safe. Nothing to revive.'; end if;
  if p.streak_last_date = today then back := n + 1;       -- you already cooked today after losing it
  else back := n; end if;
  update profiles set revive_tokens = revive_tokens - 1, streak_freezes = least(3, streak_freezes + 1), streak_days = back,
    streak_last_date = case when p.streak_last_date = today then today else today - 1 end, streak_lost = null, streak_lost_day = null
  where id = uid;
  return jsonb_build_object('streak', back);
end $$;

-- RevenueCat webhook: a paid Revive grants one token (once per transaction); a refund takes it back.
create or replace function public.rc_grant_revive(p_secret text, p_user uuid, p_txn text, p_product text, p_store text, p_sandbox boolean, p_usd numeric)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public._rc_secret_ok(p_secret) then raise exception 'forbidden'; end if;
  if p_txn is null or p_txn !~ '^[A-Za-z0-9._:-]{1,200}$' then raise exception 'bad transaction id'; end if;
  if p_product not in ('streak-revive', 'yoke.streakrevive') then raise exception 'unknown product'; end if;
  if not exists (select 1 from profiles where id = p_user) then raise exception 'unknown player'; end if;
  insert into revive_purchases (transaction_id, user_id, product_id, store, sandbox, usd)
  values (p_txn, p_user, p_product, left(coalesce(p_store, 'UNKNOWN'), 30), coalesce(p_sandbox, false), p_usd) on conflict (transaction_id) do nothing;
  if not found then return jsonb_build_object('credited', false, 'reason', 'already credited'); end if;
  update profiles set revive_tokens = revive_tokens + 1 where id = p_user;
  return jsonb_build_object('credited', true);
end $$;

create or replace function public.rc_refund(p_secret text, p_txn text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare u uuid; n integer;
begin
  if not public._rc_secret_ok(p_secret) then raise exception 'forbidden'; end if;
  update coin_purchases set status = 'refunded', refunded_at = now() where transaction_id = p_txn and status = 'paid'
  returning user_id, coins into u, n;
  if found then
    update profiles set coins = greatest(0, coins - n) where id = u;
    return jsonb_build_object('refunded', true, 'coins', n);
  end if;
  update revive_purchases set status = 'refunded' where transaction_id = p_txn and status = 'paid' returning user_id into u;
  if found then
    update profiles set revive_tokens = greatest(0, revive_tokens - 1) where id = u;
    return jsonb_build_object('refunded', true, 'revive', true);
  end if;
  return jsonb_build_object('refunded', false);
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
  lost_n int; left_fr int;
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
  if cook_xp > 0 and random() < coalesce(nullif(current_setting('yoke.lucky', true), '')::float, 0.125) then
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

  return jsonb_build_object('country_done', v_done, 'country', v_country, 'meal_id', v_meal, 'xp', xp_gain, 'coins', coin_gain, 'challenge_completed', completed,
    'streak', new_streak, 'lucky', lucky, 'streak_coins', mile_coins, 'used_freeze', used_freeze, 'freezes_left', (select streak_freezes from profiles where id = uid), 'lost_streak', lost_n);
end $$;

revoke all on function public._lost_streak(uuid) from public, anon, authenticated;
revoke all on function public.get_streak(), public.buy_streak_freeze(), public.use_revive() from public, anon;
grant execute on function public.get_streak(), public.buy_streak_freeze(), public.use_revive() to authenticated;
revoke execute on function public.rc_grant_revive(text, uuid, text, text, text, boolean, numeric) from public;
grant execute on function public.rc_grant_revive(text, uuid, text, text, text, boolean, numeric) to anon, authenticated;   -- the secret is the lock
revoke execute on function public.rc_refund(text, text) from public;
grant execute on function public.rc_refund(text, text) to anon, authenticated;
revoke all on function public.log_meal(text, text, uuid, text, text, text) from public, anon;
grant execute on function public.log_meal(text, text, uuid, text, text, text) to authenticated;

-- Reset game also clears the lost-streak note (a paid Revive is kept)
create or replace function public.reset_game()
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  delete from pantry_items where user_id = uid;
  delete from shopping_items where user_id = uid;
  delete from saved_recipes where user_id = uid;
  delete from my_recipes where user_id = uid;
  delete from country_challenges where user_id = uid;
  delete from country_done where user_id = uid;
  delete from meals where user_id = uid;
  delete from weekly_challenges where user_id = uid;
  delete from daily_quests where user_id = uid;
  delete from weekly_bingo where user_id = uid;
  delete from xp_events where user_id = uid;
  delete from kitchen_layouts where user_id = uid;
  update profiles set xp = 0, streak_days = 0, streak_last_date = null, streak_freezes = 1, streak_freeze_week = null, streak_lost = null, streak_lost_day = null,
    last_meal_at = null, last_back_popup_at = null, ui_state = null where id = uid;
end $$;
revoke all on function public.reset_game() from public, anon;
grant execute on function public.reset_game() to authenticated;
notify pgrst, 'reload schema';
