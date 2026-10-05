-- 0015: shop + XP tweaks. Safe to run more than once.
--  • The White Chef Coat is free now: Whisk wears it whenever no top is picked (like the classic toque).
--    It leaves the shop; anyone who bought it gets their 1,500 coins back, once.
--  • New in its shop spot: the Airline Pilot Coat (1,500 coins).
--  • Cooking a recipe and sending the photo gives +20 XP (was 50). Saving a recipe stays +5 XP.

insert into public.items (id, slot, name, rarity, price, sort) values ('top-airline-pilot-coat', 'top', 'Airline Pilot Coat', 'common', 1500, 0)
on conflict (id) do update set slot = excluded.slot, name = excluded.name, rarity = excluded.rarity, price = excluded.price, sort = excluded.sort, active = true;

with refund as (
  delete from public.inventory where item_id = 'top-white-chef-coat' returning user_id
)
update public.profiles p set coins = p.coins + 1500 from refund r where p.id = r.user_id;
update public.loadouts set top_id = null, updated_at = now() where top_id = 'top-white-chef-coat';
update public.items set active = false where id = 'top-white-chef-coat';

create or replace function public.log_meal(p_recipe_id text, p_photo_path text, p_challenge_id uuid default null, p_notes text default null, p_dish text default null, p_country text default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid uuid := auth.uid();
  r web_recipes%rowtype;
  dsh dishes%rowtype;
  v_stamp text;
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
  if p_recipe_id is not null then
    select * into r from web_recipes w where w.id = p_recipe_id and w.active;
    if not found then raise exception 'unknown recipe'; end if;
  else
    -- a dish from Whisk's list of 193 countries (the server can't be told a made-up dish or country)
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
  returning id into v_meal;
  if r.id is not null then insert into saved_recipes (user_id, recipe_id) values (uid, r.id) on conflict do nothing; end if;

  xp_gain := xp_gain + _award_xp(uid, 'cook', 20, 3);   -- cooking it and sending the photo: +20 XP
  if not exists (select 1 from meals m where m.user_id = uid and lower(m.cuisine) = lower(coalesce(r.cuisine, dsh.cuisine)) and m.id <> v_meal) then
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
    if found and ch.completed_at is null and ch.week_start = wk and r.id is not null and ch.recipe_id = r.id then
      update weekly_challenges set completed_at = now() where id = ch.id;
      update meals set challenge_id = ch.id where id = v_meal;
      update profiles set coins = coins + ch.coins where id = uid;
      coin_gain := ch.coins; completed := true;
      xp_gain := xp_gain + _award_xp(uid, 'challenge', 100, 3);
    end if;
  end if;

  -- 10th meal from a country: the stamp trigger already paid 5,000 coins; tell the app so it can celebrate
  select s.country into v_stamp from passport_stamps s where s.user_id = uid and s.meal_id = v_meal;
  if v_stamp is not null then coin_gain := coin_gain + 5000; end if;

  return jsonb_build_object('stamp', v_stamp, 'meal_id', v_meal, 'xp', xp_gain, 'coins', coin_gain, 'challenge_completed', completed, 'streak', new_streak, 'used_freeze', used_freeze);
end $$;
