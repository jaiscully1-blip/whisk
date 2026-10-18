-- 0048: New coin pack ladder, priced on Apple's .99 price points. Safe to run more than once. Run after 0047.
--  • Coins per dollar go up on every step: 500 / 3,000 / 7,000 / 15,000 / 40,000 coins for $0.99 / $4.99 / $9.99 / $19.99 / $49.99.
--  • The amounts match the shop: 7,000 is one Epic item, 3,000 is two Commons, 15,000 is an Exotic plus a Rare.
--  • The four old packs are switched off (kept, so old purchases and refunds still work).
--  • RevenueCat product ids: coins-099, coins-499, coins-999, coins-1999, coins-4999 (App Store: yoke.coins099 and so on).
insert into public.coin_packs (id, coins, usd, sort, active) values
  ('coins-099', 500, 0.99, 1, true), ('coins-499', 3000, 4.99, 2, true), ('coins-999', 7000, 9.99, 3, true),
  ('coins-1999', 15000, 19.99, 4, true), ('coins-4999', 40000, 49.99, 5, true)
on conflict (id) do update set coins = excluded.coins, usd = excluded.usd, sort = excluded.sort, active = true;

update public.coin_packs set active = false, sort = sort + 10 where id in ('coins-1000', 'coins-3000', 'coins-10000', 'coins-15000');

insert into public.coin_pack_products (product_id, pack_id) values
  ('coins-099', 'coins-099'), ('coins-499', 'coins-499'), ('coins-999', 'coins-999'), ('coins-1999', 'coins-1999'), ('coins-4999', 'coins-4999'),
  ('yoke.coins099', 'coins-099'), ('yoke.coins499', 'coins-499'), ('yoke.coins999', 'coins-999'), ('yoke.coins1999', 'coins-1999'), ('yoke.coins4999', 'coins-4999')
on conflict (product_id) do update set pack_id = excluded.pack_id;
notify pgrst, 'reload schema';
