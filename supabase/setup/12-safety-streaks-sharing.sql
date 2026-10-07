-- 0019: Never show me (allergies), vacation mode, streak repair, a shared shopping-list link, delete my data.
-- Safe to run more than once. Run after 0018.

-- ---------------------------------------------------------------------------------------------------------------
-- Profile columns
--   never_show: ingredients (or allergen groups) the player never wants to see in a recipe. The app hides any recipe
--               whose ingredient list mentions one (lib/recipes/never.js). Up to 40 entries, 40 chars each.
--   vacation_since: the player's own date vacation mode was turned on (null = off).
--   repair_streak / repair_day: a streak that broke after ONE missed day; cooking a second meal on repair_day
--               (the first day back) brings it back.
alter table public.profiles add column if not exists never_show text[] not null default '{}';
alter table public.profiles add column if not exists vacation_since date;
alter table public.profiles add column if not exists repair_streak int;
alter table public.profiles add column if not exists repair_day date;

create or replace function public.set_never_show(p_items text[]) returns text[] language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); clean text[];
begin
  if uid is null then raise exception 'not signed in'; end if;
  select coalesce(array_agg(distinct v order by v), '{}') into clean
  from (select left(lower(trim(x)), 40) v from unnest(coalesce(p_items, '{}')) x) t where v <> '';
  if cardinality(clean) > 40 then raise exception 'too many'; end if;
  update profiles set never_show = clean where id = uid;
  return clean;
end $$;

-- Vacation: while it's on, the days away don't count. Turning it off (or cooking) moves the streak's last day
-- forward by the days away (at most 30), so the streak carries on as if no time passed.
create or replace function public._end_vacation(uid uuid) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare p profiles%rowtype; away int;
begin
  select * into p from profiles where id = uid for update;
  if p.vacation_since is null then return; end if;
  away := least(30, greatest(0, _user_today(uid) - p.vacation_since));
  update profiles set vacation_since = null,
    streak_last_date = case when streak_last_date is not null then streak_last_date + away end
  where id = uid;
end $$;

create or replace function public.set_vacation(p_on boolean) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  if p_on then update profiles set vacation_since = coalesce(vacation_since, _user_today(uid)) where id = uid;
  else perform _end_vacation(uid); end if;
  return (select jsonb_build_object('vacation_since', vacation_since, 'streak_days', streak_days) from profiles where id = uid);
end $$;

-- log_meal (from 0015) plus: vacation ends when you cook; streak repair.
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
  returning id into v_meal;
  if r.id is not null then insert into saved_recipes (user_id, recipe_id) values (uid, r.id) on conflict do nothing; end if;

  xp_gain := xp_gain + _award_xp(uid, 'cook', 20, 3);
  if not exists (select 1 from meals m where m.user_id = uid and lower(m.cuisine) = lower(coalesce(r.cuisine, dsh.cuisine)) and m.id <> v_meal) then
    xp_gain := xp_gain + _award_xp(uid, 'cuisine_stamp', 40, null);
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
  -- Streak repair: exactly one missed day and no freeze left → today's first meal starts at 1 but remembers the old
  -- streak; a second meal today brings it back (+1 for today).
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
      coin_gain := ch.coins; completed := true;
      xp_gain := xp_gain + _award_xp(uid, 'challenge', 100, 3);
    end if;
  end if;

  select s.country into v_stamp from passport_stamps s where s.user_id = uid and s.meal_id = v_meal;
  if v_stamp is not null then coin_gain := coin_gain + 5000; end if;

  return jsonb_build_object('stamp', v_stamp, 'meal_id', v_meal, 'xp', xp_gain, 'coins', coin_gain, 'challenge_completed', completed,
    'streak', new_streak, 'used_freeze', used_freeze, 'repair_ready', repair_ready, 'repaired', repaired);
end $$;

-- ---------------------------------------------------------------------------------------------------------------
-- Shared shopping list: one secret link per player. Whoever has the link can see the list and tick items off,
-- without the app or an account. The owner can turn the link off (and make a new one) any time.
create table if not exists public.list_shares (
  user_id uuid primary key references auth.users (id) on delete cascade,
  token text not null unique check (token ~ '^[a-f0-9]{32}$'),
  created_at timestamptz not null default now()
);
alter table public.list_shares enable row level security;
drop policy if exists list_shares_own on public.list_shares;
create policy list_shares_own on public.list_shares for select to authenticated using (user_id = (select auth.uid()));

create or replace function public.share_my_list(p_new boolean default false) returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); t text;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if p_new then delete from list_shares where user_id = uid; end if;
  select token into t from list_shares where user_id = uid;
  if t is null then
    t := replace(gen_random_uuid()::text, '-', '');
    insert into list_shares (user_id, token) values (uid, t);
  end if;
  return t;
end $$;

create or replace function public.stop_sharing_list() returns void language sql security definer set search_path = public, pg_temp as $$
  delete from list_shares where user_id = auth.uid();
$$;

-- For the link page (no account). Only the item names, aisles and ticks; nothing about the owner.
create or replace function public.get_shared_list(p_token text) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare owner uuid;
begin
  if p_token !~ '^[a-f0-9]{32}$' then return null; end if;
  select user_id into owner from list_shares where token = p_token;
  if owner is null then return null; end if;
  return jsonb_build_object('items', coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'category', s.category, 'checked', s.checked) order by s.created_at)
    from shopping_items s where s.user_id = owner), '[]'::jsonb));
end $$;

create or replace function public.tick_shared_item(p_token text, p_item uuid, p_checked boolean) returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare owner uuid;
begin
  if p_token !~ '^[a-f0-9]{32}$' then return false; end if;
  select user_id into owner from list_shares where token = p_token;
  if owner is null then return false; end if;
  update shopping_items set checked = coalesce(p_checked, false) where id = p_item and user_id = owner;
  return found;
end $$;

-- ---------------------------------------------------------------------------------------------------------------
-- Delete my data: removes the player's account and everything tied to it (every table cascades from auth.users).
-- The app deletes the player's photos through Storage first (Supabase doesn't allow deleting files from SQL).
create or replace function public.delete_my_account() returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  delete from auth.users where id = uid;
end $$;

revoke execute on function public.set_never_show(text[]), public.set_vacation(boolean), public.share_my_list(boolean), public.stop_sharing_list(), public.delete_my_account() from public, anon;
grant execute on function public.set_never_show(text[]), public.set_vacation(boolean), public.share_my_list(boolean), public.stop_sharing_list(), public.delete_my_account() to authenticated;
revoke execute on function public.get_shared_list(text), public.tick_shared_item(text, uuid, boolean) from public;
grant execute on function public.get_shared_list(text), public.tick_shared_item(text, uuid, boolean) to anon, authenticated;
revoke execute on function public._end_vacation(uuid) from public, anon, authenticated;
