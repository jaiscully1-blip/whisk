-- Whisk check after steps 6 and 7: paste into a new query → Run. Every column should say true.
select
  position('amr' in pg_get_functiondef('public.reset_game'::regproc)) = 0                                   as "step 6 (one-phone reset)",
  (select count(*) from public.web_recipes where jsonb_array_length(coalesce(data -> 'ingredients', '[]')) > 0) = 100 as "step 7 (100 full recipes)",
  exists (select 1 from public.items where id = 'top-airline-pilot-coat' and active)                         as "step 7 (pilot coat in shop)",
  not exists (select 1 from public.items where id = 'top-white-chef-coat' and active)                       as "step 7 (chef coat free)";
