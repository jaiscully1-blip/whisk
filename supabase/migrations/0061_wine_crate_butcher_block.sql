-- 0061: Two new Kitchen shop things that are light to draw: a wine crate (takes the fruit bowl's spot) and a butcher block with bread.
-- Safe to run more than once.
insert into public.kitchen_items (id, name, kind, price, country, sort) values
  ('wine_crate', 'Wine crate', 'decor', 400, null, 11),
  ('butcher_block', 'Butcher block & bread', 'gear', 500, null, 11)
on conflict (id) do update set name = excluded.name, kind = excluded.kind, price = excluded.price, sort = excluded.sort;
