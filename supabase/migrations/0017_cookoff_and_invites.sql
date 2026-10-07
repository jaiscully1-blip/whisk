-- 0017: Cook Off (a live party game) + Invite a friend. Safe to run more than once.
--
-- COOK OFF. Someone makes a game and gets a 6-letter code; friends type the code to join (their Whisk name shows).
-- Only cooks with a stocked pantry (5+ items) can make or join a game. The host picks the time (15/30/45/60 min) and
-- presses Start. Everyone's screen spins the recipe wheel; each player lands on a random recipe their own pantry can
-- make in that time. Same clock for all. Cook it, snap the photo before time's up. Then everyone votes for the best
-- plate (not their own). Everyone who finished gets 200 coins, the winner(s) 800 more (max 3 paid games a day).
-- All of it happens in these functions: players can't touch the tables directly.
--
-- INVITE A FRIEND. Each player has an invite code. A brand-new player (game started in the last 3 days) can enter one
-- friend's code. When the two of them both finish the same Cook Off, each gets 1,000 coins, once. A player can earn
-- invite coins for up to 10 friends. No time limit.

create table if not exists public.cookoff_games (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  host uuid not null references auth.users (id) on delete cascade,
  minutes int not null check (minutes in (15, 30, 45, 60)),
  status text not null default 'lobby' check (status in ('lobby', 'cooking', 'voting', 'done', 'cancelled')),
  created_at timestamptz not null default now(),
  started_at timestamptz, ends_at timestamptz, vote_ends_at timestamptz, finished_at timestamptz
);
create index if not exists cookoff_games_host on public.cookoff_games (host, status);

create table if not exists public.cookoff_players (
  game_id uuid not null references public.cookoff_games (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  seat int not null,
  name text not null check (char_length(name) between 1 and 40),
  joined_at timestamptz not null default now(),
  recipe_id text references public.web_recipes (id),
  photo_path text, submitted_at timestamptz,
  voted_seat int, votes int not null default 0,
  reward int not null default 0, winner boolean not null default false,
  primary key (game_id, user_id),
  unique (game_id, seat)
);
create index if not exists cookoff_players_user on public.cookoff_players (user_id);

create table if not exists public.referrals (
  invitee uuid primary key references auth.users (id) on delete cascade,
  inviter uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  paid_at timestamptz, game_id uuid,
  check (invitee <> inviter)
);
create index if not exists referrals_inviter on public.referrals (inviter);
alter table public.profiles add column if not exists ref_code text unique check (ref_code is null or ref_code ~ '^[A-HJ-NP-Z2-9]{6}$');

alter table public.cookoff_games enable row level security;
alter table public.cookoff_players enable row level security;
alter table public.referrals enable row level security;
revoke all on public.cookoff_games, public.cookoff_players, public.referrals from anon, authenticated;

create or replace function public._code6() returns text language sql volatile set search_path = public, pg_temp as $$
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1), '') from generate_series(1, 6)
$$;
create or replace function public._stocked(p_user uuid) returns int language sql stable security definer set search_path = public, pg_temp as $$
  select count(*)::int from pantry_items where user_id = p_user and status <> 'out'
$$;

-- Pays out once: finishers, winners, and invite rewards. Called when voting ends.
create or replace function public._cookoff_finish(p_game uuid) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare g cookoff_games%rowtype; top int; pl record; paid_today int; ref record; paid_by_inviter int;
begin
  select * into g from cookoff_games where id = p_game for update;
  if g.status = 'done' or g.status = 'cancelled' then return; end if;
  update cookoff_games set status = 'done', finished_at = now() where id = p_game;
  select max(votes) into top from cookoff_players where game_id = p_game and photo_path is not null;
  for pl in select * from cookoff_players where game_id = p_game and photo_path is not null loop
    select count(*) into paid_today from cookoff_players cp join cookoff_games cg on cg.id = cp.game_id
      where cp.user_id = pl.user_id and cp.reward > 0 and cg.finished_at >= (_user_today(pl.user_id)::timestamp at time zone _user_tz(pl.user_id));
    if paid_today < 3 then
      update cookoff_players set reward = 200 + case when top > 0 and pl.votes = top then 800 else 0 end, winner = (top > 0 and pl.votes = top)
        where game_id = p_game and user_id = pl.user_id;
      update profiles set coins = coins + 200 + case when top > 0 and pl.votes = top then 800 else 0 end where id = pl.user_id;
    else
      update cookoff_players set winner = (top > 0 and pl.votes = top) where game_id = p_game and user_id = pl.user_id;
    end if;
  end loop;
  -- invite a friend: both finished this game → 1,000 each, once (inviter: up to 10 friends)
  for ref in select r.* from referrals r
      join cookoff_players a on a.game_id = p_game and a.user_id = r.inviter and a.photo_path is not null
      join cookoff_players b on b.game_id = p_game and b.user_id = r.invitee and b.photo_path is not null
      where r.paid_at is null loop
    select count(*) into paid_by_inviter from referrals where inviter = ref.inviter and paid_at is not null;
    if paid_by_inviter < 10 then
      update referrals set paid_at = now(), game_id = p_game where invitee = ref.invitee and paid_at is null;
      update profiles set coins = coins + 1000 where id in (ref.inviter, ref.invitee);
    end if;
  end loop;
end $$;

-- Moves a game along by the clock (anyone looking at it nudges it; there's no background job).
create or replace function public._cookoff_tick(p_game uuid) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare g cookoff_games%rowtype; n int; sub int; voted int;
begin
  select * into g from cookoff_games where id = p_game;
  if g.status = 'lobby' and g.created_at < now() - interval '6 hours' then update cookoff_games set status = 'cancelled' where id = p_game; return; end if;
  if g.status = 'cooking' then
    select count(*), count(photo_path) into n, sub from cookoff_players where game_id = p_game;
    if now() >= g.ends_at or (sub = n and n > 0) then
      update cookoff_games set status = 'voting', ends_at = least(ends_at, now()), vote_ends_at = least(ends_at, now()) + interval '90 seconds' where id = p_game;
      if sub = 0 then perform _cookoff_finish(p_game); end if;
    end if;
  elsif g.status = 'voting' then
    select count(*), count(voted_seat) into n, voted from cookoff_players where game_id = p_game;
    select count(photo_path) into sub from cookoff_players where game_id = p_game;
    if now() >= g.vote_ends_at or voted = n or sub <= 1 then perform _cookoff_finish(p_game); end if;
  end if;
end $$;

create or replace function public._cookoff_view(p_game uuid) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); g cookoff_games%rowtype; showall boolean;
begin
  select * into g from cookoff_games where id = p_game;
  showall := g.status in ('voting', 'done');
  return jsonb_build_object(
    'code', g.code, 'minutes', g.minutes, 'status', g.status, 'is_host', g.host = uid, 'now', now(),
    'started_at', g.started_at, 'ends_at', g.ends_at, 'vote_ends_at', g.vote_ends_at,
    'players', coalesce((select jsonb_agg(jsonb_build_object(
        'seat', p.seat, 'name', p.name, 'me', p.user_id = uid, 'host', p.user_id = g.host,
        'ready', p.recipe_id is not null, 'done', p.photo_path is not null,
        'recipe_id', case when showall or p.user_id = uid then p.recipe_id end,
        'photo', case when showall or p.user_id = uid then p.photo_path end,
        'votes', case when g.status = 'done' then p.votes end, 'voted', p.voted_seat is not null,
        'my_vote', case when p.user_id = uid then p.voted_seat end,
        'winner', case when g.status = 'done' then p.winner end, 'reward', case when g.status = 'done' and p.user_id = uid then p.reward end
      ) order by p.seat) from cookoff_players p where p.game_id = p_game), '[]'::jsonb));
end $$;

create or replace function public._cookoff_mine(p_code text, lock boolean default false) returns cookoff_games language plpgsql security definer set search_path = public, pg_temp as $$
declare g cookoff_games%rowtype;
begin
  select * into g from cookoff_games where code = upper(trim(p_code));
  if not found then raise exception 'no game with that code'; end if;
  if not exists (select 1 from cookoff_players where game_id = g.id and user_id = auth.uid()) then raise exception 'not in this game'; end if;
  return g;
end $$;

create or replace function public.create_cookoff(p_minutes int) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); c text; gid uuid; nm text;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if p_minutes not in (15, 30, 45, 60) then raise exception 'pick 15, 30, 45 or 60 minutes'; end if;
  if _stocked(uid) < 5 then raise exception 'stock your pantry first (5 items)'; end if;
  update cookoff_games set status = 'cancelled' where host = uid and status = 'lobby';   -- one open lobby per host
  for i in 1..20 loop c := _code6(); exit when not exists (select 1 from cookoff_games where code = c); end loop;
  insert into cookoff_games (code, host, minutes) values (c, uid, p_minutes) returning id into gid;
  select coalesce(nullif(trim(display_name), ''), 'Cook 1') into nm from profiles where id = uid;
  insert into cookoff_players (game_id, user_id, seat, name) values (gid, uid, 1, left(coalesce(nm, 'Cook 1'), 40));
  return _cookoff_view(gid);
end $$;

create or replace function public.join_cookoff(p_code text) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); g cookoff_games%rowtype; s int; nm text;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select * into g from cookoff_games where code = upper(trim(p_code)) for update;
  if not found or g.status = 'cancelled' then raise exception 'no game with that code'; end if;
  if exists (select 1 from cookoff_players where game_id = g.id and user_id = uid) then perform _cookoff_tick(g.id); return _cookoff_view(g.id); end if;
  if g.status <> 'lobby' then raise exception 'that game already started'; end if;
  if _stocked(uid) < 5 then raise exception 'stock your pantry first (5 items)'; end if;
  if (select count(*) from cookoff_players where game_id = g.id) >= 200 then raise exception 'that game is full'; end if;
  select coalesce(max(seat), 0) + 1 into s from cookoff_players where game_id = g.id;
  select nullif(trim(display_name), '') into nm from profiles where id = uid;
  insert into cookoff_players (game_id, user_id, seat, name) values (g.id, uid, s, left(coalesce(nm, 'Cook ' || s), 40));
  return _cookoff_view(g.id);
end $$;

create or replace function public.get_cookoff(p_code text) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare g cookoff_games%rowtype;
begin
  g := _cookoff_mine(p_code); perform _cookoff_tick(g.id); return _cookoff_view(g.id);
end $$;

create or replace function public.leave_cookoff(p_code text) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare g cookoff_games%rowtype;
begin
  g := _cookoff_mine(p_code);
  if g.status <> 'lobby' then return; end if;   -- once cooking starts you stay on the board
  if g.host = auth.uid() then update cookoff_games set status = 'cancelled' where id = g.id;
  else delete from cookoff_players where game_id = g.id and user_id = auth.uid(); end if;
end $$;

-- The spin lasts 8 seconds on every screen, then the shared clock starts.
create or replace function public.start_cookoff(p_code text) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare g cookoff_games%rowtype;
begin
  g := _cookoff_mine(p_code);
  if g.host <> auth.uid() then raise exception 'only the host can start'; end if;
  if g.status <> 'lobby' then raise exception 'already started'; end if;
  update cookoff_games set status = 'cooking', started_at = now(), ends_at = now() + interval '8 seconds' + make_interval(mins => g.minutes) where id = g.id;
  return _cookoff_view(g.id);
end $$;

-- The player's phone sends the recipes its pantry can make; the server picks one at random (once) that fits the time.
create or replace function public.set_cookoff_recipe(p_code text, p_candidates text[]) returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare g cookoff_games%rowtype; pick text; cur text;
begin
  g := _cookoff_mine(p_code);
  if g.status <> 'cooking' then raise exception 'not cooking'; end if;
  select recipe_id into cur from cookoff_players where game_id = g.id and user_id = auth.uid();
  if cur is not null then return cur; end if;
  select w.id into pick from web_recipes w where w.active and w.id = any (p_candidates[1:400]) and w.minutes <= g.minutes order by random() limit 1;
  if pick is null then raise exception 'no recipe from your pantry fits the time'; end if;
  update cookoff_players set recipe_id = pick where game_id = g.id and user_id = auth.uid();
  return pick;
end $$;

create or replace function public.submit_cookoff(p_code text, p_photo_path text) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); g cookoff_games%rowtype;
begin
  g := _cookoff_mine(p_code);
  if g.status <> 'cooking' or now() > g.ends_at + interval '30 seconds' then raise exception 'time is up'; end if;
  if p_photo_path is null or split_part(p_photo_path, '/', 1) <> uid::text
     or not exists (select 1 from storage.objects o where o.bucket_id = 'meal-photos' and o.name = p_photo_path) then raise exception 'photo not found'; end if;
  update cookoff_players set photo_path = p_photo_path, submitted_at = now() where game_id = g.id and user_id = uid and recipe_id is not null;
  if not found then raise exception 'spin first'; end if;
  perform _cookoff_tick(g.id);
  return _cookoff_view(g.id);
end $$;

create or replace function public.vote_cookoff(p_code text, p_seat int) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); g cookoff_games%rowtype; me cookoff_players%rowtype;
begin
  g := _cookoff_mine(p_code); perform _cookoff_tick(g.id);
  select * into g from cookoff_games where id = g.id;
  if g.status <> 'voting' then raise exception 'voting is closed'; end if;
  select * into me from cookoff_players where game_id = g.id and user_id = uid for update;
  if me.voted_seat is not null then raise exception 'you already voted'; end if;
  if me.seat = p_seat then raise exception 'vote for someone else'; end if;
  update cookoff_players set votes = votes + 1 where game_id = g.id and seat = p_seat and photo_path is not null;
  if not found then raise exception 'no plate there'; end if;
  update cookoff_players set voted_seat = p_seat where game_id = g.id and user_id = uid;
  perform _cookoff_tick(g.id);
  return _cookoff_view(g.id);
end $$;

-- Other players' plates are visible to you only in a game you're both in, once voting starts.
create or replace function public._cookoff_photo_visible(p_name text) returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from cookoff_players t join cookoff_games g on g.id = t.game_id and g.status in ('voting', 'done')
                 join cookoff_players me on me.game_id = t.game_id and me.user_id = auth.uid() where t.photo_path = p_name)
$$;
drop policy if exists cookoff_photos_select on storage.objects;
create policy cookoff_photos_select on storage.objects for select to authenticated using (bucket_id = 'meal-photos' and public._cookoff_photo_visible(name));

-- ---------- invite a friend ----------
create or replace function public.get_my_invite() returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); c text; p profiles%rowtype;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select * into p from profiles where id = uid for update;
  c := p.ref_code;
  if c is null then
    for i in 1..20 loop c := _code6(); exit when not exists (select 1 from profiles where ref_code = c); end loop;
    update profiles set ref_code = c where id = uid;
  end if;
  return jsonb_build_object('code', c,
    'earned', (select count(*) from referrals where inviter = uid and paid_at is not null), 'max', 10,
    'waiting', (select count(*) from referrals where inviter = uid and paid_at is null),
    'invited_by', (select pr.display_name from referrals r join profiles pr on pr.id = r.inviter where r.invitee = uid),
    'mine_paid', (select paid_at is not null from referrals where invitee = uid),
    'can_enter', p.created_at > now() - interval '3 days' and not exists (select 1 from referrals where invitee = uid));
end $$;

create or replace function public.claim_invite(p_code text) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); inv uuid; p profiles%rowtype;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select * into p from profiles where id = uid;
  if p.created_at < now() - interval '3 days' then raise exception 'invite codes are for new players'; end if;
  if exists (select 1 from referrals where invitee = uid) then raise exception 'you already used an invite code'; end if;
  select id into inv from profiles where ref_code = upper(trim(p_code));
  if inv is null then raise exception 'no player with that code'; end if;
  if inv = uid then raise exception 'that''s your own code'; end if;
  if (select count(*) from referrals where inviter = inv and paid_at is not null) >= 10 then raise exception 'your friend already earned all 10 invite rewards'; end if;
  insert into referrals (invitee, inviter) values (uid, inv);
  return get_my_invite();
end $$;

revoke execute on function public._code6(), public._stocked(uuid), public._cookoff_finish(uuid), public._cookoff_tick(uuid), public._cookoff_view(uuid), public._cookoff_mine(text, boolean) from public, anon, authenticated;
revoke execute on function public.create_cookoff(int), public.join_cookoff(text), public.get_cookoff(text), public.leave_cookoff(text), public.start_cookoff(text), public.set_cookoff_recipe(text, text[]), public.submit_cookoff(text, text), public.vote_cookoff(text, int), public.get_my_invite(), public.claim_invite(text) from public, anon;
grant execute on function public.create_cookoff(int), public.join_cookoff(text), public.get_cookoff(text), public.leave_cookoff(text), public.start_cookoff(text), public.set_cookoff_recipe(text, text[]), public.submit_cookoff(text, text), public.vote_cookoff(text, int), public.get_my_invite(), public.claim_invite(text) to authenticated;
grant execute on function public._cookoff_photo_visible(text) to authenticated;
