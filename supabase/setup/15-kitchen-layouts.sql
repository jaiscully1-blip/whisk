-- 0022: Kitchen layouts. Safe to run more than once. Run after 0021.
--  • Players design kitchens (fridges, pantries, cabinets, drawers…) in a 3D floor-plan mini game.
--    They can keep up to 12, but only one is "on display": that's the one the Pantry page shows.
--  • Each pantry item can remember where it lives ("Fridge · left door · top shelf").
--  • Putting an item in its place gives a little XP (+3, up to 10 a day), and a bonus once the whole pantry is put away.

create table if not exists public.kitchen_layouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null default 'My kitchen' check (char_length(name) between 1 and 40),
  pieces jsonb not null default '[]'::jsonb
    check (jsonb_typeof(pieces) = 'array' and jsonb_array_length(pieces) <= 60 and pg_column_size(pieces) < 24000),
  is_display boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists kitchen_layouts_user_idx on public.kitchen_layouts (user_id);
-- only one kitchen on display per player
create unique index if not exists kitchen_layouts_one_display on public.kitchen_layouts (user_id) where is_display;

alter table public.kitchen_layouts enable row level security;
revoke all on public.kitchen_layouts from anon;
drop policy if exists kitchen_layouts_select_own on public.kitchen_layouts;
create policy kitchen_layouts_select_own on public.kitchen_layouts for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists kitchen_layouts_insert_own on public.kitchen_layouts;
create policy kitchen_layouts_insert_own on public.kitchen_layouts for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists kitchen_layouts_update_own on public.kitchen_layouts;
create policy kitchen_layouts_update_own on public.kitchen_layouts for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists kitchen_layouts_delete_own on public.kitchen_layouts;
create policy kitchen_layouts_delete_own on public.kitchen_layouts for delete to authenticated using (user_id = (select auth.uid()));
revoke all on public.kitchen_layouts from authenticated;
grant select, delete on public.kitchen_layouts to authenticated;
grant insert (name, pieces, is_display) on public.kitchen_layouts to authenticated;
grant update (name, pieces, is_display) on public.kitchen_layouts to authenticated;

-- at most 12 kitchens each; updated_at keeps itself current
create or replace function public._kitchen_layouts_guard() returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'INSERT' and (select count(*) from kitchen_layouts where user_id = new.user_id) >= 12 then
    raise exception 'You can keep 12 kitchens. Delete one to make another.';
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists kitchen_layouts_guard on public.kitchen_layouts;
create trigger kitchen_layouts_guard before insert or update on public.kitchen_layouts for each row execute function public._kitchen_layouts_guard();

-- Put one of your kitchens on display (and take the old one down) in one step.
create or replace function public.show_kitchen(p_id uuid) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from kitchen_layouts where id = p_id and user_id = uid) then raise exception 'That kitchen isn''t yours.'; end if;
  update kitchen_layouts set is_display = false where user_id = uid and is_display and id <> p_id;
  update kitchen_layouts set is_display = true where id = p_id and not is_display;
end $$;

-- Where an item lives: "<piece id>|<compartment>|<spot>", e.g. "k3f9a|0|2". Null = not put away yet.
alter table public.pantry_items add column if not exists spot text
  constraint pantry_items_spot_ok check (spot is null or spot ~ '^[A-Za-z0-9_-]{1,24}\|[0-9]{1,2}\|[0-9]{1,2}$');

-- Put an item away (or take it out with p_spot = null). Returns the XP earned and how many items are still to put away.
create or replace function public.place_item(p_item uuid, p_spot text) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); was text; got int := 0; left_n int;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select spot into was from pantry_items where id = p_item and user_id = uid for update;
  if not found then raise exception 'That item isn''t in your pantry.'; end if;
  update pantry_items set spot = p_spot where id = p_item;
  select count(*)::int into left_n from pantry_items where user_id = uid and status <> 'out' and spot is null;
  if was is null and p_spot is not null then
    got := _award_xp(uid, 'kitchen_place', 3, 10);
    if left_n = 0 then got := got + _award_xp(uid, 'kitchen_full', 20, 1); end if;
  end if;
  return jsonb_build_object('xp', got, 'left', left_n);
end $$;

revoke all on function public.show_kitchen(uuid), public.place_item(uuid, text) from public, anon;
grant execute on function public.show_kitchen(uuid), public.place_item(uuid, text) to authenticated;
revoke all on function public._kitchen_layouts_guard() from public, anon, authenticated;

-- Reset game: kitchens go too (pantry items already do).
create or replace function public.reset_game()
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  delete from pantry_items where user_id = uid;
  delete from shopping_items where user_id = uid;
  delete from saved_recipes where user_id = uid;
  delete from meals where user_id = uid;
  delete from weekly_challenges where user_id = uid;
  delete from daily_quests where user_id = uid;
  delete from weekly_bingo where user_id = uid;
  delete from xp_events where user_id = uid;
  delete from kitchen_layouts where user_id = uid;
  -- Shop items, outfit and coins are kept: coins can be bought with real money.
  update profiles set xp = 0, streak_days = 0, streak_last_date = null, streak_freezes = 1, streak_freeze_week = null,
    last_meal_at = null, last_back_popup_at = null, ui_state = null where id = uid;
end $$;
revoke all on function public.reset_game() from public, anon;
grant execute on function public.reset_game() to authenticated;
