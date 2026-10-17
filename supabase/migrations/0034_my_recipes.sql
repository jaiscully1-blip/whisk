-- My recipes: recipes a player typed in or imported from a photo of a recipe card or page.
-- Private to the player (RLS on auth.uid()); size-limited; at most 100 per player; wiped by Reset game and Delete my data.
-- Safe to run more than once.

create table if not exists public.my_recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  servings int check (servings between 1 and 100),
  minutes int check (minutes between 1 and 1440),
  ingredients jsonb not null check (jsonb_typeof(ingredients) = 'array' and jsonb_array_length(ingredients) between 1 and 80),
  steps jsonb not null check (jsonb_typeof(steps) = 'array' and jsonb_array_length(steps) between 1 and 60),
  created_at timestamptz not null default now(),
  check (octet_length(ingredients::text) < 12000 and octet_length(steps::text) < 20000)
);
create index if not exists my_recipes_user_idx on public.my_recipes (user_id, created_at desc);
alter table public.my_recipes enable row level security;
drop policy if exists my_recipes_select on public.my_recipes;
drop policy if exists my_recipes_insert on public.my_recipes;
drop policy if exists my_recipes_update on public.my_recipes;
drop policy if exists my_recipes_delete on public.my_recipes;
create policy my_recipes_select on public.my_recipes for select to authenticated using (user_id = (select auth.uid()));
create policy my_recipes_insert on public.my_recipes for insert to authenticated with check (user_id = (select auth.uid()));
create policy my_recipes_update on public.my_recipes for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy my_recipes_delete on public.my_recipes for delete to authenticated using (user_id = (select auth.uid()));
revoke all on public.my_recipes from anon, authenticated;
grant select, delete on public.my_recipes to authenticated;
grant insert (title, servings, minutes, ingredients, steps) on public.my_recipes to authenticated;
grant update (title, servings, minutes, ingredients, steps) on public.my_recipes to authenticated;

create or replace function public._my_recipes_cap() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if (select count(*) from my_recipes where user_id = new.user_id) >= 100 then raise exception 'You can keep up to 100 of your own recipes. Delete one to add another.'; end if;
  return new;
end $$;
drop trigger if exists my_recipes_cap on public.my_recipes;
create trigger my_recipes_cap before insert on public.my_recipes for each row execute function public._my_recipes_cap();
revoke execute on function public._my_recipes_cap() from public, anon, authenticated;

-- Reset game also clears your own recipes.
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
  -- Kitchen things you bought and coins are kept: coins can be bought with real money.
  update profiles set xp = 0, streak_days = 0, streak_last_date = null, streak_freezes = 1, streak_freeze_week = null,
    last_meal_at = null, last_back_popup_at = null, ui_state = null where id = uid;
end $$;
revoke all on function public.reset_game() from public, anon;
grant execute on function public.reset_game() to authenticated;
