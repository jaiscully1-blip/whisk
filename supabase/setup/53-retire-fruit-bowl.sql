-- 0060: The fruit bowl leaves the Kitchen shop (it made the Me page lag). Safe to run more than once.
--  • Everyone who bought it gets their 400 coins back, and it comes out of saved kitchens.
update public.profiles p set coins = coins + 400
  from public.kitchen_owned o where o.item_id = 'fruit_bowl' and o.user_id = p.id;
delete from public.kitchen_owned where item_id = 'fruit_bowl';
update public.kitchen_layouts set pieces = (select coalesce(jsonb_agg(x), '[]'::jsonb) from jsonb_array_elements(pieces) x where x->>'mid' <> 'x:fruit_bowl')
  where pieces @> '[{"mid":"x:fruit_bowl"}]';
delete from public.kitchen_items where id = 'fruit_bowl';
