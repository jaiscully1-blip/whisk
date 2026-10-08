-- 0024: Dream kitchen + world map. Safe to run more than once. Run after 0023.
--  • The outfit shop is replaced by a Kitchen shop: coins buy countertop gear, appliances, decorations, finishes.
--    Bought things go into your kitchen (the layout on display). Country things unlock when you complete a country.
--  • Countries: cook 1 dish from a country = Bronze, 3 = Silver, 5 = Gold (complete). Completing one pays 3,000 coins
--    and 300 XP, paints it on your globe, and unlocks its shop items. (This replaces the passport's 10-meal stamp.)
--  • Country challenges: cook a named recipe from a country you've started for bonus XP (250; 400 once it's Gold).

-- ---------- Kitchen shop ----------
create table if not exists public.kitchen_items (
  id text primary key check (id ~ '^[a-z0-9_]{2,40}$'),
  name text not null check (char_length(name) between 1 and 60),
  kind text not null check (kind in ('gear', 'appliance', 'decor', 'finish')),
  price int not null check (price between 0 and 1000000),
  country text check (country is null or country ~ '^[A-Z]{2}$'),
  sort int not null default 0,
  active boolean not null default true
);
alter table public.kitchen_items enable row level security;
revoke all on public.kitchen_items from anon, authenticated;
grant select on public.kitchen_items to authenticated;
drop policy if exists kitchen_items_read on public.kitchen_items;
create policy kitchen_items_read on public.kitchen_items for select to authenticated using (active);

create table if not exists public.kitchen_owned (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  item_id text not null references public.kitchen_items (id),
  bought_at timestamptz not null default now(),
  primary key (user_id, item_id)
);
alter table public.kitchen_owned enable row level security;
revoke all on public.kitchen_owned from anon, authenticated;
grant select on public.kitchen_owned to authenticated;
drop policy if exists kitchen_owned_read_own on public.kitchen_owned;
create policy kitchen_owned_read_own on public.kitchen_owned for select to authenticated using (user_id = (select auth.uid()));

insert into public.kitchen_items (id, name, kind, price, country, sort) values
  ('cutting_board', 'Wood cutting board', 'gear', 300, null, 10), ('fruit_bowl', 'Fruit bowl', 'decor', 400, null, 11),
  ('cookbooks', 'Cookbook stand', 'decor', 500, null, 12), ('toaster', 'Toaster', 'gear', 600, null, 13),
  ('herb_pots', 'Herb garden', 'decor', 600, null, 14), ('kettle', 'Electric kettle', 'gear', 700, null, 15),
  ('dish_stack', 'Dishware stack', 'gear', 700, null, 16), ('knife_block', 'Knife block', 'gear', 800, null, 17),
  ('cast_iron', 'Cast-iron skillet', 'gear', 900, null, 18), ('plant', 'Monstera plant', 'decor', 900, null, 19),
  ('rice_cooker', 'Rice cooker', 'gear', 1000, null, 20), ('blender', 'Blender', 'gear', 1200, null, 21),
  ('air_fryer', 'Air fryer', 'gear', 1500, null, 22), ('dutch_oven', 'Dutch oven', 'gear', 1800, null, 23),
  ('pot_rack', 'Pots & pans set', 'gear', 2000, null, 24), ('stand_mixer', 'Stand mixer', 'gear', 2500, null, 25),
  ('neon', 'Neon "EAT" sign', 'decor', 3000, null, 26), ('espresso', 'Espresso machine', 'gear', 4000, null, 27),
  ('ice_cream', 'Ice cream machine', 'gear', 6000, null, 28), ('choc_fountain', 'Chocolate fountain', 'gear', 7000, null, 29),
  ('pizza_oven', 'Pizza oven', 'gear', 8000, null, 30), ('gold_whisk', 'Golden whisk trophy', 'decor', 15000, null, 31),
  ('robot_arm', 'Robot chef arm', 'gear', 25000, null, 32),
  ('dishwasher', 'Dishwasher', 'appliance', 2500, null, 40), ('range', 'Gas range stove', 'appliance', 3000, null, 41),
  ('walloven', 'Double wall oven', 'appliance', 6000, null, 42), ('prorange', 'Pro 6-burner range', 'appliance', 12000, null, 43),
  ('smartfridge', 'Smart fridge with screen', 'appliance', 15000, null, 44),
  ('fin_terrazzo', 'Terrazzo countertops', 'finish', 4000, null, 50), ('fin_lacquer', 'Lacquered cabinets', 'finish', 5000, null, 51),
  ('fin_copper', 'Copper appliances', 'finish', 7000, null, 52), ('fin_goldmarble', 'Gold-veined marble', 'finish', 9000, null, 53),
  ('us_waffle', 'Waffle maker', 'gear', 1500, 'US', 100), ('us_smoker', 'BBQ smoker', 'gear', 4000, 'US', 101),
  ('mx_molcajete', 'Molcajete', 'gear', 1500, 'MX', 102), ('mx_press', 'Tortilla press', 'gear', 2000, 'MX', 103),
  ('it_moka', 'Moka pot', 'gear', 1500, 'IT', 104), ('it_pasta', 'Pasta machine', 'gear', 2500, 'IT', 105),
  ('cn_steamer', 'Bamboo steamer', 'gear', 1500, 'CN', 106), ('cn_wok', 'Carbon-steel wok', 'gear', 2000, 'CN', 107),
  ('in_dabba', 'Masala dabba spice box', 'gear', 1500, 'IN', 108), ('in_cooker', 'Pressure cooker', 'gear', 2500, 'IN', 109),
  ('gr_briki', 'Briki coffee pot', 'gear', 1500, 'GR', 110), ('gr_amphora', 'Olive oil amphora', 'decor', 2000, 'GR', 111),
  ('jp_cat', 'Lucky cat', 'decor', 1500, 'JP', 112), ('jp_knife', 'Japanese knife set', 'gear', 3000, 'JP', 113),
  ('kr_onggi', 'Onggi kimchi jars', 'gear', 2000, 'KR', 114), ('kr_grill', 'Tabletop BBQ grill', 'gear', 3000, 'KR', 115),
  ('th_basket', 'Sticky rice basket', 'gear', 1500, 'TH', 116), ('th_mortar', 'Granite mortar & pestle', 'gear', 1500, 'TH', 117),
  ('lb_mezze', 'Mezze plate set', 'gear', 1500, 'LB', 118), ('lb_dallah', 'Brass coffee dallah', 'decor', 2000, 'LB', 119),
  ('et_jebena', 'Jebena coffee pot', 'gear', 1500, 'ET', 120), ('et_mesob', 'Mesob basket table', 'decor', 3000, 'ET', 121),
  ('fr_baguette', 'Baguette basket', 'decor', 1000, 'FR', 122), ('fr_copper', 'Copper pot set', 'gear', 4000, 'FR', 123),
  ('gb_tin', 'Biscuit tin', 'decor', 1000, 'GB', 124), ('gb_teaset', 'Tea set', 'gear', 2000, 'GB', 125),
  ('br_pot', 'Clay feijoada pot', 'gear', 1500, 'BR', 126), ('br_grill', 'Churrasco grill', 'gear', 4000, 'BR', 127),
  ('vn_phin', 'Phin coffee filter', 'gear', 1000, 'VN', 128), ('vn_lantern', 'Hoi An lantern', 'decor', 2000, 'VN', 129),
  ('jm_dutchpot', 'Dutch pot', 'gear', 1500, 'JM', 130), ('jm_drum', 'Steel drum', 'decor', 3000, 'JM', 131),
  ('es_paella', 'Paella pan', 'gear', 2500, 'ES', 132), ('es_tiles', 'Azulejo tile panel', 'decor', 3000, 'ES', 133),
  ('tr_cezve', 'Copper cezve', 'gear', 1500, 'TR', 134), ('tr_tea', 'Turkish tea set', 'gear', 2000, 'TR', 135),
  ('eg_idra', 'Ful pot', 'gear', 1500, 'EG', 136), ('eg_fanous', 'Fanous lantern', 'decor', 2000, 'EG', 137),
  ('tn_tagine', 'Tagine', 'gear', 2000, 'TN', 138), ('tn_couscous', 'Couscoussier', 'gear', 2500, 'TN', 139),
  ('cu_cafetera', 'Cafetera', 'gear', 1500, 'CU', 140)
on conflict (id) do update set name = excluded.name, kind = excluded.kind, price = excluded.price, country = excluded.country, sort = excluded.sort, active = true;

-- the outfit shop is gone (what players bought stays theirs, it just isn't sold any more)
update public.items set active = false where active;

-- ---------- Countries ----------
create table if not exists public.country_done (
  user_id uuid not null references auth.users (id) on delete cascade,
  country text not null check (country ~ '^[A-Z]{2}$'),
  meal_id uuid,
  done_at timestamptz not null default now(),
  primary key (user_id, country)
);
alter table public.country_done enable row level security;
revoke all on public.country_done from anon, authenticated;
grant select on public.country_done to authenticated;
drop policy if exists country_done_read_own on public.country_done;
create policy country_done_read_own on public.country_done for select to authenticated using (user_id = (select auth.uid()));

create or replace function public._country_complete(p_user uuid, p_country text) returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select (select count(*) from meals m where m.user_id = p_user and m.country = p_country) >= 5
$$;
revoke all on function public._country_complete(uuid, text) from public, anon, authenticated;

-- The 5th dish from a country completes it: 3,000 coins + 300 XP, once per country. (Replaces the 10-meal stamp.)
create or replace function public._award_stamp() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.country is null then return null; end if;
  if public._country_complete(new.user_id, new.country) then
    insert into country_done (user_id, country, meal_id) values (new.user_id, new.country, new.id) on conflict do nothing;
    if found then
      update profiles set coins = coins + 3000 where id = new.user_id;
      perform _award_xp(new.user_id, 'country_done', 300, null);
    end if;
  end if;
  return null;
end $$;
revoke execute on function public._award_stamp() from public, anon, authenticated;
drop trigger if exists meals_stamp on public.meals;
create trigger meals_stamp after insert on public.meals for each row execute function public._award_stamp();

create table if not exists public.country_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  country text not null check (country ~ '^[A-Z]{2}$'),
  recipe_id text not null references public.web_recipes (id),
  xp int not null check (xp between 0 and 1000),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, recipe_id)
);
create index if not exists country_challenges_user_idx on public.country_challenges (user_id);
alter table public.country_challenges enable row level security;
revoke all on public.country_challenges from anon, authenticated;
grant select on public.country_challenges to authenticated;
drop policy if exists country_challenges_read_own on public.country_challenges;
create policy country_challenges_read_own on public.country_challenges for select to authenticated using (user_id = (select auth.uid()));

-- Your world: dishes per country (tier = 1 Bronze, 3 Silver, 5 Gold), and open country challenges
-- (one per started country at 250 XP; two per completed country at 400 XP), topped up here.
create or replace function public.get_world() returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); c record; want int; have int; rid text;
begin
  if uid is null then raise exception 'not signed in'; end if;
  for c in select m.country, count(*)::int n from meals m where m.user_id = uid and m.country is not null group by m.country loop
    want := case when c.n >= 5 then 2 else 1 end;
    select count(*) into have from country_challenges h where h.user_id = uid and h.country = c.country and h.completed_at is null;
    while have < want loop
      select w.id into rid from web_recipes w
      where w.active and w.data ->> 'country' = c.country
        and not exists (select 1 from meals m where m.user_id = uid and m.web_recipe_id = w.id)
        and not exists (select 1 from country_challenges h where h.user_id = uid and h.recipe_id = w.id)
      order by random() limit 1;
      exit when rid is null;
      insert into country_challenges (user_id, country, recipe_id, xp) values (uid, c.country, rid, case when c.n >= 5 then 400 else 250 end);
      have := have + 1; rid := null;
    end loop;
  end loop;
  return jsonb_build_object(
    'countries', coalesce((select jsonb_agg(jsonb_build_object('country', x.country, 'n', x.n, 'done', exists (select 1 from country_done d where d.user_id = uid and d.country = x.country)) order by x.n desc, x.country)
      from (select m.country, count(*)::int n from meals m where m.user_id = uid and m.country is not null group by m.country) x), '[]'::jsonb),
    'challenges', coalesce((select jsonb_agg(jsonb_build_object('id', h.id, 'country', h.country, 'recipe_id', h.recipe_id, 'title', w.title, 'xp', h.xp) order by h.created_at)
      from country_challenges h join web_recipes w on w.id = h.recipe_id where h.user_id = uid and h.completed_at is null), '[]'::jsonb),
    'recipes', (select count(distinct m.web_recipe_id) from meals m where m.user_id = uid and m.web_recipe_id is not null),
    'owned', coalesce((select jsonb_agg(o.item_id order by o.bought_at) from kitchen_owned o where o.user_id = uid), '[]'::jsonb)
  );
end $$;

create or replace function public.buy_kitchen_item(p_item text) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); it kitchen_items%rowtype; left_coins int;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select * into it from kitchen_items where id = p_item and active;
  if not found then raise exception 'That isn''t in the shop.'; end if;
  if exists (select 1 from kitchen_owned where user_id = uid and item_id = p_item) then raise exception 'You already have that.'; end if;
  if it.country is not null and not exists (select 1 from country_done where user_id = uid and country = it.country) then
    raise exception 'Complete that country first (cook 5 of its dishes).';
  end if;
  update profiles set coins = coins - it.price where id = uid and coins >= it.price returning coins into left_coins;
  if not found then raise exception 'Not enough coins yet.'; end if;
  insert into kitchen_owned (user_id, item_id) values (uid, p_item);
  return jsonb_build_object('coins', left_coins, 'item', p_item);
end $$;

-- Your kitchen can only hold shop things you own (gear and decorations as "x:<id>" pieces, shop appliances, shop finishes).
create or replace function public._kitchen_layouts_guard() returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'INSERT' and (select count(*) from kitchen_layouts where user_id = new.user_id) >= 12 then
    raise exception 'You can keep 12 kitchens. Delete one to make another.';
  end if;
  if exists (
    select 1 from jsonb_array_elements(new.pieces) p
    where (case
      when (p ->> 'mid') like 'x:%' then substr(p ->> 'mid', 3)
      when (p ->> 'mid') in (select id from kitchen_items where kind = 'appliance') then p ->> 'mid'
      else null end) is not null
      and not exists (select 1 from kitchen_owned o where o.user_id = new.user_id and o.item_id = (case when (p ->> 'mid') like 'x:%' then substr(p ->> 'mid', 3) else p ->> 'mid' end))
  ) or exists (
    select 1 from jsonb_array_elements(new.pieces) p, lateral (values (p -> 'fin' ->> 'tex'), (p -> 'tfin' ->> 'tex')) t(tex)
    where t.tex in ('terrazzo', 'lacquer', 'copper', 'goldmarble')
      and not exists (select 1 from kitchen_owned o where o.user_id = new.user_id and o.item_id = 'fin_' || t.tex)
  ) then
    raise exception 'That kitchen uses something you don''t own yet.';
  end if;
  new.updated_at := now();
  return new;
end $$;

-- Cooking: +100 XP and 500 coins (3 a day, from 0023), plus country challenges. A completed country is reported back.
create or replace function public.log_meal(p_recipe_id text, p_photo_path text, p_challenge_id uuid default null, p_notes text default null, p_dish text default null, p_country text default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid uuid := auth.uid();
  r web_recipes%rowtype;
  dsh dishes%rowtype;
  v_meal uuid; v_country text; v_done text;
  xp_gain int := 0; coin_gain int := 0; completed boolean := false; cook_xp int;
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
  cook_xp := _award_xp(uid, 'cook', 100, 3);
  xp_gain := xp_gain + cook_xp;
  if cook_xp > 0 then update profiles set coins = coins + 500 where id = uid; coin_gain := coin_gain + 500; end if;
  if not exists (select 1 from meals m where m.user_id = uid and lower(m.cuisine) = lower(coalesce(r.cuisine, dsh.cuisine)) and m.id <> v_meal) then
    xp_gain := xp_gain + _award_xp(uid, 'cuisine_stamp', 40, null);
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
  if p.streak_last_date is distinct from today then xp_gain := xp_gain + _award_xp(uid, 'streak', 10, 1); end if;

  if p_challenge_id is not null then
    select * into ch from weekly_challenges w where w.id = p_challenge_id and w.user_id = uid for update;
    if found and ch.completed_at is null and ch.week_start = wk and r.id is not null and ch.recipe_id = r.id then
      update weekly_challenges set completed_at = now() where id = ch.id;
      update meals set challenge_id = ch.id where id = v_meal;
      update profiles set coins = coins + ch.coins where id = uid;
      coin_gain := coin_gain + ch.coins; completed := true;
      xp_gain := xp_gain + _award_xp(uid, 'challenge', 100, 3);
    end if;
  end if;

  select d.country into v_done from country_done d where d.user_id = uid and d.meal_id = v_meal;
  if v_done is not null then coin_gain := coin_gain + 3000; xp_gain := xp_gain + 300; end if;

  return jsonb_build_object('country_done', v_done, 'country', v_country, 'meal_id', v_meal, 'xp', xp_gain, 'coins', coin_gain, 'challenge_completed', completed,
    'streak', new_streak, 'used_freeze', used_freeze, 'repair_ready', repair_ready, 'repaired', repaired);
end $$;

revoke all on function public.get_world(), public.buy_kitchen_item(text) from public, anon;
grant execute on function public.get_world(), public.buy_kitchen_item(text) to authenticated;

-- Reset game: countries, challenges and kitchen things go too.
create or replace function public.reset_game()
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  delete from pantry_items where user_id = uid;
  delete from shopping_items where user_id = uid;
  delete from saved_recipes where user_id = uid;
  delete from country_challenges where user_id = uid;
  delete from country_done where user_id = uid;
  delete from meals where user_id = uid;
  delete from weekly_challenges where user_id = uid;
  delete from daily_quests where user_id = uid;
  delete from weekly_bingo where user_id = uid;
  delete from xp_events where user_id = uid;
  delete from kitchen_layouts where user_id = uid;
  -- Kitchen things you bought and coins are kept: coins can be bought with real money.
  update profiles set xp = 0, streak_days = 0, streak_last_date = null, streak_freezes = 1, streak_freeze_week = null,
    last_meal_at = null, last_back_popup_at = null, ui_state = null where id = uid;
end $$;
revoke all on function public.reset_game() from public, anon;
grant execute on function public.reset_game() to authenticated;
