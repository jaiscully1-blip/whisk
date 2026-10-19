-- Shop: an Appliances section (faucets, modern sink, microwave, coffee maker, smart rice cooker and kettle).
insert into public.kitchen_items (id, name, kind, price, country, sort) values
  ('faucet', 'Classic kitchen faucet', 'gear', 400, null, 60),
  ('kettle_m', 'Smart glow kettle', 'gear', 1000, null, 61),
  ('microwave', 'Microwave', 'gear', 1200, null, 62),
  ('coffee_maker', 'Coffee maker', 'gear', 1400, null, 63),
  ('rice_cooker_m', 'Smart rice cooker', 'gear', 1500, null, 64),
  ('faucet_modern', 'Modern pull-down faucet', 'gear', 1800, null, 65),
  ('sink_modern', 'Modern sink & faucet', 'gear', 3500, null, 66)
on conflict (id) do update set name = excluded.name, kind = excluded.kind, price = excluded.price, country = excluded.country, sort = excluded.sort, active = true;
