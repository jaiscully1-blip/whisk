-- 0042: Parties and the shared party globe. Safe to run more than once. Run after 0041.
--  • A party is a group chat marked as a party (start_party). It has everything a chat has, plus a shared globe.
--  • The party globe: each month, every dish a member cooks from a country counts for them. Whoever has cooked a country
--    the most times this month owns it and it shows in their colour (a tie goes to whoever cooked it first). Cook a
--    country more times than its owner to take it. Most countries at the end of the month wins. It starts fresh each month.
--  • Who's online: the app pings every couple of minutes while it's open (profiles.active_at); friends seen in the last
--    5 minutes show as online.

alter table public.profiles add column if not exists active_at timestamptz;
alter table public.chat_groups add column if not exists party boolean not null default false;

create or replace function public.ping() returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is null then return; end if;
  update profiles set active_at = now() where id = auth.uid() and (active_at is null or active_at < now() - interval '60 seconds');
end $$;

create or replace function public.get_friends() returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  return jsonb_build_object(
    'code', _my_code(uid),
    'friends', coalesce((select jsonb_agg(jsonb_build_object('code', _my_code(f.friend_id), 'name', coalesce(nullif(trim(p.display_name), ''), 'Chef'),
        'online', coalesce(p.active_at > now() - interval '5 minutes', false)) order by p.display_name)
      from friends f join profiles p on p.id = f.friend_id where f.user_id = uid), '[]'::jsonb),
    'requests', coalesce((select jsonb_agg(jsonb_build_object('code', _my_code(r.from_id), 'name', coalesce(nullif(trim(p.display_name), ''), 'Chef')) order by r.created_at)
      from friend_requests r join profiles p on p.id = r.from_id where r.to_id = uid), '[]'::jsonb),
    'sent', (select count(*) from friend_requests where from_id = uid));
end $$;

-- start a party with some of your friends (it's a group chat with a shared globe)
create or replace function public.start_party(p_name text, p_codes text[] default '{}') returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare gid uuid;
begin
  gid := create_chat(coalesce(nullif(btrim(p_name), ''), 'Party'), p_codes);
  update chat_groups set party = true where id = gid;
  return gid;
end $$;

-- your parties, newest activity first
create or replace function public.get_parties() returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', g.id, 'name', g.name,
      'members', (select count(*) from chat_members where group_id = g.id)) order by g.last_at desc)
    from chat_members me join chat_groups g on g.id = me.group_id where me.user_id = uid and g.party), '[]'::jsonb);
end $$;

-- one party's globe for this month: who owns which country, and the standings
create or replace function public.get_party_globe(p_group uuid) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); g chat_groups%rowtype; m0 timestamptz := date_trunc('month', now()); res jsonb;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if not _in_chat(p_group, uid) then raise exception 'not in that party'; end if;
  select * into g from chat_groups where id = p_group;
  with mem as (
    select cm.user_id, row_number() over (order by cm.joined_at, cm.user_id) - 1 as seat from chat_members cm where cm.group_id = p_group
  ), cooks as (
    select m.user_id, upper(m.country) as iso, count(*) as n, min(m.cooked_at) as first_at
    from meals m join mem on mem.user_id = m.user_id
    where m.country is not null and m.country ~ '^[A-Za-z]{2}$' and m.cooked_at >= m0
    group by m.user_id, upper(m.country)
  ), ranked as (
    select c.*, row_number() over (partition by c.iso order by c.n desc, c.first_at) as rk,
      coalesce(lead(c.n) over (partition by c.iso order by c.n desc, c.first_at), 0) as next_n
    from cooks c
  ), owned as (select * from ranked where rk = 1)
  select jsonb_build_object(
    'group', jsonb_build_object('id', g.id, 'name', g.name, 'party', g.party),
    'month_start', m0, 'month_end', m0 + interval '1 month',
    'members', coalesce((select jsonb_agg(jsonb_build_object('code', _my_code(mem.user_id), 'name', _chat_name(mem.user_id), 'me', mem.user_id = uid, 'seat', mem.seat,
        'countries', (select count(*) from owned o where o.user_id = mem.user_id),
        'cooked', coalesce((select sum(n) from cooks c where c.user_id = mem.user_id), 0)) order by mem.seat) from mem), '[]'::jsonb),
    'countries', coalesce((select jsonb_agg(jsonb_build_object('iso', o.iso, 'seat', mem.seat, 'n', o.n, 'next', o.next_n,
        'mine', (select coalesce(sum(c.n), 0) from cooks c where c.iso = o.iso and c.user_id = uid)))
      from owned o join mem on mem.user_id = o.user_id), '[]'::jsonb)
  ) into res;
  return res;
end $$;

grant execute on function public.ping() to authenticated;
grant execute on function public.start_party(text, text[]) to authenticated;
grant execute on function public.get_parties() to authenticated;
grant execute on function public.get_party_globe(uuid) to authenticated;
