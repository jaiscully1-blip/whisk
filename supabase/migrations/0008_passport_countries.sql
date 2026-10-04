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
