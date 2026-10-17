-- Use-It-Up Week: a head-to-head challenge. Two players race to rescue food that is about to expire.
--  • Same ingredients: one shared list (items both players have, plus up to 5 items each player chooses to add).
--    Score = 1 point per item used, 2 points for items expiring within 2 days of the start. Most points wins.
--  • Different ingredients: each player is scored on their own list. Score = % of their own starting items rescued.
--  • 7 days, or until both players finish. Winner gets 500 coins, the other 0. There is always one winner (see _uiu_settle).
--  • Food past its use-by date never scores. Players never see each other's pantry: only the shared list they both agreed
--    to, scores, and item counts. Everything is checked on the server; players have no direct access to these tables.
-- Safe to run more than once.

create table if not exists public.uiu_matches (
  code text primary key check (code ~ '^[A-Z0-9]{6}$'),
  mode text not null check (mode in ('same', 'different')),
  host uuid not null references auth.users (id) on delete cascade,
  guest uuid references auth.users (id) on delete cascade,
  host_picks text[] not null default '{}',
  status text not null default 'open' check (status in ('open', 'live', 'done', 'cancelled')),
  created_at timestamptz not null default now(),
  started_at timestamptz,
  ends_at timestamptz,
  host_finished_at timestamptz,
  guest_finished_at timestamptz,
  winner uuid references auth.users (id) on delete set null,
  coins_awarded int not null default 0,
  rematch_code text,
  check (guest is null or guest <> host)
);
create index if not exists uiu_matches_host_idx on public.uiu_matches (host, created_at desc);
create index if not exists uiu_matches_guest_idx on public.uiu_matches (guest, created_at desc);

-- The items each match is scored on. user_id is null for the shared list (same-ingredients mode).
create table if not exists public.uiu_items (
  id bigserial primary key,
  code text not null references public.uiu_matches (code) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  expires_on date not null,
  pts int not null default 1 check (pts in (1, 2))
);
create unique index if not exists uiu_items_uniq on public.uiu_items (code, coalesce(user_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name));

create table if not exists public.uiu_dishes (
  id bigserial primary key,
  code text not null references public.uiu_matches (code) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  meal_id uuid not null references public.meals (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (code, meal_id)
);
create table if not exists public.uiu_used (
  code text not null references public.uiu_matches (code) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id bigint not null references public.uiu_items (id) on delete cascade,
  dish_id bigint not null references public.uiu_dishes (id) on delete cascade,
  primary key (code, user_id, item_id)
);
alter table public.uiu_matches enable row level security;
alter table public.uiu_items enable row level security;
alter table public.uiu_dishes enable row level security;
alter table public.uiu_used enable row level security;
revoke all on public.uiu_matches, public.uiu_items, public.uiu_dishes, public.uiu_used from anon, authenticated;
revoke all on sequence public.uiu_items_id_seq, public.uiu_dishes_id_seq from anon, authenticated;

-- ---------- helpers (not callable by players) ----------
create or replace function public._uiu_tz(p_user uuid) returns text language sql stable security definer set search_path = public, pg_temp as $$
  select case when exists (select 1 from pg_timezone_names z where z.name = p.time_zone) then p.time_zone else 'UTC' end from profiles p where p.id = p_user
$$;

-- A player's own items that expire from today to 7 days from now (and are not used up).
create or replace function public._uiu_expiring(p_user uuid) returns table (name text, expires_on date)
language sql stable security definer set search_path = public, pg_temp as $$
  select distinct on (lower(pi.name)) pi.name, pi.expires_on from pantry_items pi
  where pi.user_id = p_user and pi.status <> 'out' and pi.expires_on is not null
    and pi.expires_on >= _user_today(p_user) and pi.expires_on <= _user_today(p_user) + 7
  order by lower(pi.name), pi.expires_on
$$;

-- Score for one player: points (same mode) or percent rescued (different mode), dishes, and when the last dish went in.
create or replace function public._uiu_score(p_code text, p_user uuid)
returns table (score numeric, dishes int, last_dish timestamptz, list_n int)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare m uiu_matches; pts numeric; n int; used int;
begin
  select * into m from uiu_matches where code = p_code;
  select count(*)::int, max(created_at) into dishes, last_dish from uiu_dishes where code = p_code and user_id = p_user;
  if m.mode = 'same' then
    select coalesce(sum(i.pts), 0) into pts from uiu_used u join uiu_items i on i.id = u.item_id where u.code = p_code and u.user_id = p_user;
    select count(*)::int into n from uiu_items where code = p_code;
    score := pts;
  else
    select count(*)::int into n from uiu_items where code = p_code and user_id = p_user;
    select count(*)::int into used from uiu_used where code = p_code and user_id = p_user;
    score := case when n > 0 then round(100.0 * used / n, 2) else 0 end;
  end if;
  list_n := n;
  return next;
end $$;

-- Close the match and pay the winner, once. Winner order: score, then most dishes, then who submitted their last dish first.
-- If everything is still equal, whoever finished first wins, then the host, so there is always exactly one winner.
-- Nobody wins coins if neither player submitted a dish (otherwise two accounts could trade 500 coins for nothing).
create or replace function public._uiu_settle(p_code text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare m uiu_matches; h record; g record; win uuid; hw boolean;
begin
  select * into m from uiu_matches where code = p_code for update;
  if m.status <> 'live' then return; end if;
  if not (now() >= m.ends_at or (m.host_finished_at is not null and m.guest_finished_at is not null)) then return; end if;
  select * into h from _uiu_score(p_code, m.host);
  select * into g from _uiu_score(p_code, m.guest);
  if h.score <> g.score then hw := h.score > g.score;
  elsif h.dishes <> g.dishes then hw := h.dishes > g.dishes;
  elsif h.last_dish is distinct from g.last_dish then hw := coalesce(h.last_dish, 'infinity'::timestamptz) < coalesce(g.last_dish, 'infinity'::timestamptz);
  elsif m.host_finished_at is distinct from m.guest_finished_at then hw := coalesce(m.host_finished_at, 'infinity'::timestamptz) < coalesce(m.guest_finished_at, 'infinity'::timestamptz);
  else hw := true; end if;
  win := case when hw then m.host else m.guest end;
  update uiu_matches set status = 'done', winner = win, coins_awarded = case when h.dishes + g.dishes > 0 and (case when hw then h.dishes else g.dishes end) > 0 then 500 else 0 end where code = p_code returning * into m;
  if m.coins_awarded > 0 then update profiles set coins = coins + 500 where id = win; end if;
end $$;

-- ---------- what players can call ----------
create or replace function public.create_uiu(p_mode text, p_picks text[] default '{}')
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); c text; tries int := 0; picks text[] := '{}'; p text;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if p_mode not in ('same', 'different') then raise exception 'pick a mode'; end if;
  if (select count(*) from uiu_matches where host = uid and status = 'open' and created_at > now() - interval '48 hours') >= 3 then raise exception 'you already have 3 open challenges. Cancel one first'; end if;
  if p_mode = 'same' then
    if coalesce(cardinality(p_picks), 0) > 5 then raise exception 'pick up to 5 items'; end if;
    foreach p in array coalesce(p_picks, '{}') loop
      if not exists (select 1 from _uiu_expiring(uid) e where lower(e.name) = lower(p)) then raise exception '% is not one of your expiring items', p; end if;
      picks := picks || (select e.name from _uiu_expiring(uid) e where lower(e.name) = lower(p) limit 1);
    end loop;
  end if;
  loop
    c := (select string_agg(substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 1 + floor(random() * 31)::int, 1), '') from generate_series(1, 6));
    begin
      insert into uiu_matches (code, mode, host, host_picks) values (c, p_mode, uid, picks);
      return c;
    exception when unique_violation then
      tries := tries + 1; if tries > 8 then raise exception 'try again'; end if;
    end;
  end loop;
end $$;

-- Before joining: what mode is it, and who made it. (Needed so a joiner in same mode can choose their items.)
create or replace function public.peek_uiu(p_code text)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); m uiu_matches;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if p_code !~ '^[A-Za-z0-9]{6}$' then raise exception 'codes are 6 characters'; end if;
  select * into m from uiu_matches where code = upper(p_code);
  if not found or m.status <> 'open' or m.created_at < now() - interval '48 hours' then raise exception 'that code isn''t open'; end if;
  if m.host = uid then raise exception 'that''s your own code. Send it to a friend'; end if;
  return jsonb_build_object('mode', m.mode, 'host', (select coalesce(display_name, 'A friend') from profiles where id = m.host));
end $$;

create or replace function public.join_uiu(p_code text, p_picks text[] default '{}')
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); m uiu_matches; p text; picks text[] := '{}'; nm text; d date; today_g date; n int; side uuid;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if p_code !~ '^[A-Za-z0-9]{6}$' then raise exception 'codes are 6 characters'; end if;
  select * into m from uiu_matches where code = upper(p_code) for update;
  if not found or m.status <> 'open' or m.created_at < now() - interval '48 hours' then raise exception 'that code isn''t open'; end if;
  if m.host = uid then raise exception 'that''s your own code. Send it to a friend'; end if;
  today_g := _user_today(uid);
  if m.mode = 'same' then
    if coalesce(cardinality(p_picks), 0) > 5 then raise exception 'pick up to 5 items'; end if;
    foreach p in array coalesce(p_picks, '{}') loop
      if not exists (select 1 from _uiu_expiring(uid) e where lower(e.name) = lower(p)) then raise exception '% is not one of your expiring items', p; end if;
    end loop;
    -- shared list = items both players have + the host's picks + the joiner's picks (names only; the earlier date wins)
    insert into uiu_items (code, user_id, name, expires_on, pts)
    select m.code, null, x.name, x.d, case when x.d <= today_g + 2 then 2 else 1 end
    from (
      select s.nm as name, min(s.d) as d from (
        select e.name nm, e.expires_on d from _uiu_expiring(uid) e where exists (select 1 from _uiu_expiring(m.host) h where lower(h.name) = lower(e.name))
        union all select e.name, e.expires_on from _uiu_expiring(m.host) e where exists (select 1 from _uiu_expiring(uid) h where lower(h.name) = lower(e.name))
        union all select e.name, e.expires_on from _uiu_expiring(m.host) e where lower(e.name) = any (select lower(unnest(m.host_picks)))
        union all select e.name, e.expires_on from _uiu_expiring(uid) e where lower(e.name) = any (select lower(unnest(coalesce(p_picks, '{}'))))
      ) s group by lower(s.nm), s.nm
    ) x
    on conflict do nothing;
    select count(*) into n from uiu_items where code = m.code;
    if n < 3 then raise exception 'you need at least 3 shared items to start (you have %). Pick more of your expiring items', n; end if;
  else
    foreach side in array array[m.host, uid] loop
      insert into uiu_items (code, user_id, name, expires_on, pts)
      select m.code, side, e.name, e.expires_on, 1 from _uiu_expiring(side) e on conflict do nothing;
      select count(*) into n from uiu_items where code = m.code and user_id = side;
      if n < 3 then   -- fill up to 3 from their own pantry, soonest-expiring first (even past 7 days; never already-expired food)
        insert into uiu_items (code, user_id, name, expires_on, pts)
        select m.code, side, f.name, f.expires_on, 1 from (
          select distinct on (lower(pi.name)) pi.name, pi.expires_on from pantry_items pi
          where pi.user_id = side and pi.status <> 'out' and pi.expires_on is not null and pi.expires_on >= _user_today(side)
            and not exists (select 1 from uiu_items i where i.code = m.code and i.user_id = side and lower(i.name) = lower(pi.name))
          order by lower(pi.name), pi.expires_on
        ) f order by f.expires_on limit (3 - n) on conflict do nothing;
        select count(*) into n from uiu_items where code = m.code and user_id = side;
      end if;
      if n < 3 then raise exception '% need at least 3 items with use-by dates in the pantry', case when side = uid then 'you' else 'your friend does' end; end if;
    end loop;
  end if;
  update uiu_matches set guest = uid, status = 'live', started_at = now() + interval '4 seconds', ends_at = now() + interval '4 seconds' + interval '7 days' where code = m.code;
  return m.code;
end $$;

create or replace function public.get_uiu(p_code text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); m uiu_matches; opp uuid; me record; th record; oj jsonb; today date; items jsonb; chk jsonb; lastr text;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select * into m from uiu_matches where code = upper(p_code);
  if not found or (m.host <> uid and m.guest is distinct from uid) then raise exception 'not in this challenge'; end if;
  if m.status = 'live' then perform _uiu_settle(m.code); select * into m from uiu_matches where code = m.code; end if;
  opp := case when m.host = uid then m.guest else m.host end;
  today := _user_today(uid);
  select * into me from _uiu_score(m.code, uid);
  items := coalesce((select jsonb_agg(jsonb_build_object('id', i.id, 'name', i.name, 'expires_on', i.expires_on, 'pts', i.pts,
      'used', exists (select 1 from uiu_used u where u.item_id = i.id and u.user_id = uid), 'expired', i.expires_on < today) order by i.expires_on, i.name)
    from uiu_items i where i.code = m.code and (i.user_id is null or i.user_id = uid)), '[]'::jsonb);
  if opp is not null then
    select * into th from _uiu_score(m.code, opp);
    oj := jsonb_build_object('name', (select coalesce(display_name, 'Your friend') from profiles where id = opp), 'score', th.score, 'dishes', th.dishes, 'items_total', th.list_n,
        'finished', case when m.host = uid then m.guest_finished_at else m.host_finished_at end is not null);
  end if;
  return jsonb_build_object(
    'code', m.code, 'mode', m.mode, 'status', m.status, 'host', m.host = uid,
    'started_at', m.started_at, 'ends_at', m.ends_at, 'now', now(),
    'items', items,
    'me', jsonb_build_object('name', (select coalesce(display_name, 'You') from profiles where id = uid), 'score', me.score, 'dishes', me.dishes, 'items_total', me.list_n,
        'finished', case when m.host = uid then m.host_finished_at else m.guest_finished_at end is not null),
    'opponent', oj,
    'winner', case when m.status = 'done' then case when m.winner = uid then 'me' else 'them' end end,
    'coins', m.coins_awarded, 'rematch_code', m.rematch_code);
end $$;

create or replace function public.submit_uiu_dish(p_code text, p_meal_id uuid, p_items text[])
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); m uiu_matches; meal meals; tz text; cooked date; did bigint; n int := 0; pts int := 0; late text[] := '{}'; nm text; it uiu_items; sc record;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select * into m from uiu_matches where code = upper(p_code) for update;
  if not found or (m.host <> uid and m.guest is distinct from uid) then raise exception 'not in this challenge'; end if;
  if m.status <> 'live' then raise exception 'this challenge is not running'; end if;
  perform _uiu_settle(m.code); select * into m from uiu_matches where code = m.code;
  if m.status <> 'live' then raise exception 'this challenge has ended'; end if;
  if now() < m.started_at then raise exception 'the week hasn''t started yet'; end if;
  if (case when m.host = uid then m.host_finished_at else m.guest_finished_at end) is not null then raise exception 'you already finished'; end if;
  if coalesce(cardinality(p_items), 0) not between 1 and 12 then raise exception 'pick the items this dish used'; end if;
  select * into meal from meals where id = p_meal_id and user_id = uid;
  if not found then raise exception 'that meal isn''t yours'; end if;
  if meal.cooked_at < m.started_at or meal.cooked_at > now() then raise exception 'only meals cooked during the challenge count'; end if;
  if exists (select 1 from uiu_dishes where code = m.code and meal_id = p_meal_id) then raise exception 'that meal is already in'; end if;
  tz := _uiu_tz(uid); cooked := (meal.cooked_at at time zone tz)::date;
  insert into uiu_dishes (code, user_id, meal_id) values (m.code, uid, p_meal_id) returning id into did;
  foreach nm in array p_items loop
    select * into it from uiu_items i where i.code = m.code and (i.user_id is null or i.user_id = uid) and lower(i.name) = lower(nm) limit 1;
    if not found then raise exception '% isn''t on your list', nm; end if;
    if it.expires_on < cooked then late := late || it.name; continue; end if;                         -- past its use-by date: never scores
    if exists (select 1 from uiu_used where code = m.code and user_id = uid and item_id = it.id) then continue; end if;   -- each item scores once
    insert into uiu_used (code, user_id, item_id, dish_id) values (m.code, uid, it.id, did);
    n := n + 1; pts := pts + it.pts;
  end loop;
  if n = 0 then raise exception 'none of those items can score (past their use-by date, or already used)'; end if;
  select * into sc from _uiu_score(m.code, uid);
  return jsonb_build_object('items_scored', n, 'points', pts, 'score', sc.score, 'check_these', to_jsonb(late));
end $$;

create or replace function public.finish_uiu(p_code text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); m uiu_matches;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select * into m from uiu_matches where code = upper(p_code) for update;
  if not found or (m.host <> uid and m.guest is distinct from uid) then raise exception 'not in this challenge'; end if;
  if m.status <> 'live' then return; end if;
  if m.host = uid then update uiu_matches set host_finished_at = coalesce(host_finished_at, now()) where code = m.code;
  else update uiu_matches set guest_finished_at = coalesce(guest_finished_at, now()) where code = m.code; end if;
  perform _uiu_settle(m.code);
end $$;

create or replace function public.cancel_uiu(p_code text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update uiu_matches set status = 'cancelled' where code = upper(p_code) and host = auth.uid() and status = 'open';
end $$;

-- One-tap rematch: makes a new open challenge in the same mode. The other player's results screen then shows "Join rematch".
create or replace function public.rematch_uiu(p_code text)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); m uiu_matches; c text;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select * into m from uiu_matches where code = upper(p_code) for update;
  if not found or (m.host <> uid and m.guest is distinct from uid) then raise exception 'not in this challenge'; end if;
  if m.status <> 'done' then raise exception 'the challenge isn''t finished yet'; end if;
  if m.rematch_code is not null then
    if exists (select 1 from uiu_matches r where r.code = m.rematch_code and r.host = uid) then return m.rematch_code; end if;
    return m.rematch_code;   -- the other player already started it: join that one
  end if;
  c := create_uiu(m.mode, '{}');
  update uiu_matches set rematch_code = c where code = m.code;
  return c;
end $$;

-- The player's challenges (for the card on Cook Off): latest few, with the friend's name only.
create or replace function public.my_uiu()
returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(jsonb_agg(x order by x->>'created_at' desc), '[]'::jsonb) from (
    select jsonb_build_object('code', m.code, 'mode', m.mode, 'status', m.status, 'created_at', m.created_at,
      'with', (select p.display_name from profiles p where p.id = case when m.host = auth.uid() then m.guest else m.host end)) x
    from uiu_matches m where (m.host = auth.uid() or m.guest = auth.uid()) and m.status in ('open', 'live')
      and m.created_at > now() - interval '9 days' order by m.created_at desc limit 5) s
$$;

revoke execute on function public._uiu_tz(uuid), public._uiu_expiring(uuid), public._uiu_score(text, uuid), public._uiu_settle(text) from public, anon, authenticated;
revoke execute on function public.create_uiu(text, text[]), public.peek_uiu(text), public.join_uiu(text, text[]), public.get_uiu(text), public.submit_uiu_dish(text, uuid, text[]),
  public.finish_uiu(text), public.cancel_uiu(text), public.rematch_uiu(text), public.my_uiu() from public, anon;
grant execute on function public.create_uiu(text, text[]), public.peek_uiu(text), public.join_uiu(text, text[]), public.get_uiu(text), public.submit_uiu_dish(text, uuid, text[]),
  public.finish_uiu(text), public.cancel_uiu(text), public.rematch_uiu(text), public.my_uiu() to authenticated;
