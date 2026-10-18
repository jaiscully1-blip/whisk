-- 0046: 12 more kitchen finishes, all real materials, from 2,500 to 12,000 coins. Run after 0045. Safe to run more than once.
-- Countertops: soapstone, travertine, slate, quartzite, glazed lava stone, onyx. Cabinets: cane, reeded wood, zebrawood,
-- frosted glass. Appliances: pewter, enamel.
insert into public.kitchen_items (id, name, kind, price, country, sort) values
  ('fin_soapstone', 'Soapstone countertops', 'finish', 2500, null, 54), ('fin_travertine', 'Travertine countertops', 'finish', 3000, null, 55),
  ('fin_pewter', 'Pewter appliances', 'finish', 3000, null, 56), ('fin_slate', 'Slate countertops', 'finish', 3500, null, 57),
  ('fin_cane', 'Cane (rattan) cabinets', 'finish', 3500, null, 58), ('fin_reeded', 'Reeded wood cabinets', 'finish', 4500, null, 59),
  ('fin_frosted', 'Frosted glass cabinets', 'finish', 5000, null, 60), ('fin_zebrano', 'Zebrawood cabinets', 'finish', 5500, null, 61),
  ('fin_quartzite', 'Quartzite countertops', 'finish', 6500, null, 62), ('fin_lava', 'Glazed lava stone countertops', 'finish', 7500, null, 63),
  ('fin_enamel', 'Enamel appliances', 'finish', 8000, null, 64), ('fin_onyx', 'Onyx countertops', 'finish', 12000, null, 65)
on conflict (id) do update set name = excluded.name, kind = excluded.kind, price = excluded.price, country = excluded.country, sort = excluded.sort, active = true;

-- a kitchen can only use finishes you own (now every finish in the shop, not just the first four)
create or replace function public._kitchen_layouts_guard() returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'INSERT' and (select count(*) from kitchen_layouts where user_id = new.user_id) >= 12 then
    raise exception 'You can keep 12 kitchens. Delete one to make another.';
  end if;
  if exists (
    select 1 from jsonb_array_elements(new.pieces) p
    where (case
      when (p ->> 'mid') like 'x:%' then substr(p ->> 'mid', 3)
      when (p ->> 'mid') in (select id from kitchen_items where kind = 'appliance' and active) then p ->> 'mid'
      else null end) is not null
      and not exists (select 1 from kitchen_owned o where o.user_id = new.user_id and o.item_id = (case when (p ->> 'mid') like 'x:%' then substr(p ->> 'mid', 3) else p ->> 'mid' end))
  ) or exists (
    select 1 from jsonb_array_elements(new.pieces) p, lateral (values (p -> 'fin' ->> 'tex'), (p -> 'tfin' ->> 'tex')) t(tex)
    where t.tex in (select substr(id, 5) from kitchen_items where kind = 'finish')
      and not exists (select 1 from kitchen_owned o where o.user_id = new.user_id and o.item_id = 'fin_' || t.tex)
  ) then
    raise exception 'That kitchen uses something you don''t own yet.';
  end if;
  new.updated_at := now();
  return new;
end $$;
notify pgrst, 'reload schema';
