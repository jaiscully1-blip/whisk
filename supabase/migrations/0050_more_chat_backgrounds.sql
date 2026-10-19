-- 13 more chat backgrounds: 4 still, 9 gently moving (CSS only). Cosmetic, per chat, seen only by you.
insert into public.chat_bg_catalog (id, name, price, sort) values
  ('dusk', 'Dusk', 400, 7),
  ('forest', 'Forest mist', 400, 8),
  ('mocha', 'Mocha', 400, 9),
  ('slate', 'Slate grid', 300, 10),
  ('aurora', 'Aurora', 900, 11),
  ('rose', 'Rosé haze', 700, 12),
  ('rain', 'Window rain', 800, 13),
  ('embers', 'Warm embers', 800, 14),
  ('snow', 'Soft snow', 800, 15),
  ('lava', 'Lava lamp', 900, 16),
  ('stars', 'Starfield', 900, 17),
  ('waves', 'Slow waves', 800, 18),
  ('fireflies', 'Fireflies', 900, 19)
on conflict (id) do update set name = excluded.name, price = excluded.price, sort = excluded.sort;
