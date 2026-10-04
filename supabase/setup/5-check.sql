-- Whisk setup check: paste into a new query → Run. Every column should say true.
select
  exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'items')                as "0001-0002 base",
  exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'meals' and column_name = 'calories') as "step 1 (0003-0004)",
  (select count(*) from public.web_recipes) >= 100                                                                                  as "step 2 (recipes)",
  exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'app_events')           as "step 3 (0006-0011)",
  (select count(distinct country) from public.dishes) = 193                                                                         as "step 4 (dishes)",
  (select name from public.items where id = 'hat-chef-hat') = 'Hockey Helmet'                                                       as "helmet in shop";
