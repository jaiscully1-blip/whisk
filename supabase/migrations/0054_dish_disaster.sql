-- Shop: the Dish disaster (50,000 coins): one purchase puts a heap of dishes in the sink, on the table/island and on a counter.
insert into public.kitchen_items (id, name, kind, price, country, sort) values
  ('mess', 'Dish disaster', 'decor', 50000, null, 90)
on conflict (id) do update set name = excluded.name, kind = excluded.kind, price = excluded.price, country = excluded.country, sort = excluded.sort, active = true;

-- the three heaps (x:mess_sink / x:mess_table / x:mess_counter) count as owning the one 'mess' item
create or replace function public._kitchen_layouts_guard() returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'INSERT' and (select count(*) from kitchen_layouts where user_id = new.user_id) >= 12 then
    raise exception 'You can keep 12 kitchens. Delete one to make another.';
  end if;
  if exists (
    select 1 from jsonb_array_elements(new.pieces) p
    where (case
      when (p ->> 'mid') like 'x:mess\_%' then 'mess'
      when (p ->> 'mid') like 'x:%' then substr(p ->> 'mid', 3)
      when (p ->> 'mid') in (select id from kitchen_items where kind = 'appliance' and active) then p ->> 'mid'
      else null end) is not null
      and not exists (select 1 from kitchen_owned o where o.user_id = new.user_id and o.item_id = (case when (p ->> 'mid') like 'x:mess\_%' then 'mess' when (p ->> 'mid') like 'x:%' then substr(p ->> 'mid', 3) else p ->> 'mid' end))
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
