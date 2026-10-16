-- Baste setup 21: the app is now called Baste (it used to be Whisk).
--  • The "cook it before it goes bad" notification now says Baste.
--  • The App Store / Google Play coin products are named baste.coins… (the old whisk.coins… ids keep working).
-- Safe to run more than once. Nothing else in your database changes: tables, saved games and settings are untouched.

create or replace function public.push_due(p_secret text) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare out jsonb := '[]'::jsonb; p record; today date; names text[]; msg jsonb;
begin
  if not _push_ok(p_secret) then raise exception 'forbidden'; end if;
  for p in
    select pr.id, pr.notify_hour, case when exists (select 1 from pg_timezone_names z where z.name = pr.time_zone) then pr.time_zone else 'UTC' end tz from profiles pr
    where pr.notify_hour is not null and exists (select 1 from push_subs s where s.user_id = pr.id)
  loop
    if extract(hour from now() at time zone p.tz)::int <> p.notify_hour then continue; end if;
    today := (now() at time zone p.tz)::date;
    if exists (select 1 from profiles where id = p.id and notify_last = today) then continue; end if;
    msg := null;
    select array_agg(name order by expires_on, name) into names from pantry_items
      where user_id = p.id and status <> 'out' and expires_on between today and today + 1;
    if names is not null then
      msg := jsonb_build_object('title', case when cardinality(names) = 1 then names[1] || ' expires ' || case when (select min(expires_on) from pantry_items where user_id = p.id and name = names[1] and status <> 'out') = today then 'today' else 'tomorrow' end
                                         else names[1] || ' and ' || case when cardinality(names) = 2 then names[2] else (cardinality(names) - 1) || ' more go off soon' end end,
                                'body', 'Cook it before it goes bad: Baste has recipes that use it.', 'url', '/home?n=1');
    else
      select array_agg(name order by name) into names from pantry_items
        where user_id = p.id and status <> 'out' and thaw_started_at is null
          and (category = 'Frozen' or name ~* '\mfrozen\M')
          and name ~* '\m(chicken|beef|pork|lamb|turkey|sausages?|bacon|shrimp|prawns?|fish|salmon|tuna|cod|tilapia|steaks?|ground|meat|wings|ribs|chops?|meatballs?|ham|duck)\M';
      if names is not null then
        msg := jsonb_build_object('title', 'Defrost the ' || lower(btrim(regexp_replace(regexp_replace(names[1], '\mfrozen\M', '', 'gi'), '\s+', ' ', 'g'))) || ' tonight',
                                  'body', 'Move it to the fridge now and it’s ready to cook tomorrow.', 'url', '/pantry?n=1');
      end if;
    end if;
    if msg is null then continue; end if;
    update profiles set notify_last = today where id = p.id;
    out := out || coalesce((select jsonb_agg(msg || jsonb_build_object('endpoint', s.endpoint, 'p256dh', s.p256dh, 'auth', s.auth)) from push_subs s where s.user_id = p.id), '[]'::jsonb);
  end loop;
  return out;
end $$;

insert into public.coin_pack_products (product_id, pack_id) values
  ('baste.coins1000', 'coins-1000'), ('baste.coins3000', 'coins-3000'), ('baste.coins10000', 'coins-10000'), ('baste.coins15000', 'coins-15000')
on conflict (product_id) do update set pack_id = excluded.pack_id;
