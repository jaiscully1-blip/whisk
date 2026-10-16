-- Feta setup 22: stock levels. A pantry item is now Full, Good, Low or Out.
--  • "Full" is the old "stocked" value (nothing is renamed, so saved games keep working); "Good" is new, between Full and Low.
--  • Cooking a recipe drops what it used one level (done by the app); Reup puts a Low or Out item on your shopping list.
-- Safe to run more than once. Existing pantry items are untouched.
alter table public.pantry_items drop constraint if exists pantry_items_status_check;
alter table public.pantry_items add constraint pantry_items_status_check check (status in ('stocked', 'good', 'low', 'out'));
