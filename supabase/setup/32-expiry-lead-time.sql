-- 0039: how early the "going off soon" notification warns you.
-- Pick 0 (the day it expires), 1 (default, same as before), 2 or 3 days ahead. Safe to run more than once. Run after 0031.
-- Still at most one notification a day, at the hour you picked, only when something is actually about to go off.
alter table public.profiles add column if not exists expiry_days smallint not null default 1 check (expiry_days between 0 and 3);

create or replace function public.set_expiry_days(p_days int) returns smallint language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  if p_days is null or p_days < 0 or p_days > 3 then raise exception 'pick 0 to 3 days'; end if;
  update profiles set expiry_days = p_days where id = uid;
  return p_days;
end $$;
revoke execute on function public.set_expiry_days(int) from public, anon;
grant execute on function public.set_expiry_days(int) to authenticated;

create or replace function public.push_due(p_secret text) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare out jsonb := '[]'::jsonb; p record; today date; names text[]; dates date[]; msg jsonb; n int; first_when text;
begin
  if not _push_ok(p_secret) then raise exception 'forbidden'; end if;
  for p in
    select pr.id, pr.notify_hour, pr.expiry_days, case when exists (select 1 from pg_timezone_names z where z.name = pr.time_zone) then pr.time_zone else 'UTC' end tz from profiles pr
    where pr.notify_hour is not null and exists (select 1 from push_subs s where s.user_id = pr.id)
  loop
    if extract(hour from now() at time zone p.tz)::int <> p.notify_hour then continue; end if;
    today := (now() at time zone p.tz)::date;
    if exists (select 1 from profiles where id = p.id and notify_last = today) then continue; end if;
    msg := null;
    select array_agg(name order by expires_on, name), array_agg(expires_on order by expires_on, name) into names, dates from (
      select distinct on (lower(name)) name, expires_on from pantry_items
      where user_id = p.id and status <> 'out' and expires_on between today and today + p.expiry_days
      order by lower(name), expires_on) q;
    if names is not null then
      n := cardinality(names);
      first_when := case when dates[1] = today then 'today' when dates[1] = today + 1 then 'tomorrow' else 'in ' || (dates[1] - today) || ' days' end;
      msg := jsonb_build_object('title', case when n = 1 then names[1] || ' expires ' || first_when
                                         when n = 2 then names[1] || ' and ' || names[2] || ' go off ' || case when dates[2] = dates[1] then first_when when dates[2] = today + 1 then 'by tomorrow' else 'within ' || (dates[2] - today) || ' days' end
                                         else names[1] || ' and ' || (n - 1) || ' more go off soon' end,
                                'body', 'Cook it before it goes bad: Yoke has recipes that use it.', 'url', '/home?n=1');
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
revoke execute on function public.push_due(text) from public;
grant execute on function public.push_due(text) to anon, authenticated;   -- the secret is the lock

notify pgrst, 'reload schema';
