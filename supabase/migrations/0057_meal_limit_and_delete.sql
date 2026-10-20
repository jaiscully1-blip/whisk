-- 0057: At most 10 meals a day, and deleting a meal takes back what it paid. Safe to run more than once. Run after 0056.
--  • log_meal refuses an 11th meal in the player's day ("daily meal limit"). The first 3 a day still pay as before.
--  • Each meal remembers the XP and coins it paid (xp_earned, coins_earned). delete_meal removes the meal and its photo record
--    and takes those back (never below zero). Meals logged before this update paid nothing that can be taken back.

alter table public.meals add column if not exists xp_earned int not null default 0;
alter table public.meals add column if not exists coins_earned int not null default 0;

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

  update meals set xp_earned = xp_gain, coins_earned = coin_gain where id = v_meal;   -- what this meal paid, so deleting it can take it back
  return jsonb_build_object('country_done', v_done, 'country', v_country, 'meal_id', v_meal, 'xp', xp_gain, 'coins', coin_gain, 'challenge_completed', completed,
    'streak', new_streak, 'lucky', lucky, 'streak_coins', mile_coins, 'used_freeze', used_freeze, 'freezes_left', (select streak_freezes from profiles where id = uid), 'lost_streak', lost_n);
end $$;

revoke all on function public.log_meal(text, text, uuid, text, text, text) from public, anon;
grant execute on function public.log_meal(text, text, uuid, text, text, text) to authenticated;

create or replace function public.delete_meal(p_meal uuid) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); m meals%rowtype; p profiles%rowtype;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select * into m from meals where id = p_meal and user_id = uid for update;
  if not found then return jsonb_build_object('deleted', false); end if;
  select * into p from profiles where id = uid for update;
  delete from meals where id = p_meal;
  update profiles set coins = greatest(0, coins - m.coins_earned), xp = greatest(0, xp - m.xp_earned) where id = uid;
  return jsonb_build_object('deleted', true, 'coins', least(m.coins_earned, p.coins), 'xp', least(m.xp_earned, p.xp), 'photo', m.photo_path);
end $$;
revoke execute on function public.delete_meal(uuid) from public, anon;
grant execute on function public.delete_meal(uuid) to authenticated;
