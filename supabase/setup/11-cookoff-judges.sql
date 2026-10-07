-- 0018: Cook Off judges. Safe to run more than once. Run after 0017.
-- Players can invite people just to vote (judges): they open the invite link, start Whisk if they're new, join the
-- game as a judge at any point before voting ends, vote for one plate, and that's it. Judges don't cook, don't need
-- a pantry and don't win coins; their vote counts like anyone's. Up to 50 judges a game.

alter table public.cookoff_players add column if not exists role text not null default 'cook' check (role in ('cook', 'judge'));

create or replace function public.join_cookoff_judge(p_code text) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); g cookoff_games%rowtype; s int; nm text;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select * into g from cookoff_games where code = upper(trim(p_code)) for update;
  if not found or g.status = 'cancelled' then raise exception 'no game with that code'; end if;
  perform _cookoff_tick(g.id); select * into g from cookoff_games where id = g.id;
  if exists (select 1 from cookoff_players where game_id = g.id and user_id = uid) then return _cookoff_view(g.id); end if;
  if g.status = 'done' then raise exception 'that Cook Off is over'; end if;
  if (select count(*) from cookoff_players where game_id = g.id and role = 'judge') >= 50 then raise exception 'that game has enough judges'; end if;
  select coalesce(max(seat), 0) + 1 into s from cookoff_players where game_id = g.id;
  select nullif(trim(display_name), '') into nm from profiles where id = uid;
  insert into cookoff_players (game_id, user_id, seat, name, role) values (g.id, uid, s, left(coalesce(nm, 'Judge ' || s), 40), 'judge');
  return _cookoff_view(g.id);
end $$;

-- Cooking ends when every COOK has a plate in (judges don't cook).
create or replace function public._cookoff_tick(p_game uuid) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare g cookoff_games%rowtype; n int; sub int; voted int;
begin
  select * into g from cookoff_games where id = p_game;
  if g.status = 'lobby' and g.created_at < now() - interval '6 hours' then update cookoff_games set status = 'cancelled' where id = p_game; return; end if;
  if g.status = 'cooking' then
    select count(*), count(photo_path) into n, sub from cookoff_players where game_id = p_game and role = 'cook';
    if now() >= g.ends_at or (sub = n and n > 0) then
      update cookoff_games set status = 'voting', ends_at = least(ends_at, now()), vote_ends_at = least(ends_at, now()) + interval '90 seconds' where id = p_game;
      if sub = 0 then perform _cookoff_finish(p_game); end if;
    end if;
  elsif g.status = 'voting' then
    select count(*), count(voted_seat) into n, voted from cookoff_players where game_id = p_game;
    select count(photo_path) into sub from cookoff_players where game_id = p_game;
    if now() >= g.vote_ends_at or voted = n or (sub <= 1 and not exists (select 1 from cookoff_players where game_id = p_game and role = 'judge')) then perform _cookoff_finish(p_game); end if;
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
        'seat', p.seat, 'name', p.name, 'me', p.user_id = uid, 'host', p.user_id = g.host, 'role', p.role,
        'ready', p.recipe_id is not null, 'done', p.photo_path is not null,
        'recipe_id', case when showall or p.user_id = uid then p.recipe_id end,
        'photo', case when showall or p.user_id = uid then p.photo_path end,
        'votes', case when g.status = 'done' then p.votes end, 'voted', p.voted_seat is not null,
        'my_vote', case when p.user_id = uid then p.voted_seat end,
        'winner', case when g.status = 'done' then p.winner end, 'reward', case when g.status = 'done' and p.user_id = uid then p.reward end
      ) order by p.seat) from cookoff_players p where p.game_id = p_game), '[]'::jsonb));
end $$;

-- Judges never get a recipe.
create or replace function public.set_cookoff_recipe(p_code text, p_candidates text[]) returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare g cookoff_games%rowtype; pick text; cur text; rl text;
begin
  g := _cookoff_mine(p_code);
  if g.status <> 'cooking' then raise exception 'not cooking'; end if;
  select recipe_id, role into cur, rl from cookoff_players where game_id = g.id and user_id = auth.uid();
  if rl = 'judge' then raise exception 'judges don''t cook'; end if;
  if cur is not null then return cur; end if;
  select w.id into pick from web_recipes w where w.active and w.id = any (p_candidates[1:400]) and w.minutes <= g.minutes order by random() limit 1;
  if pick is null then raise exception 'no recipe from your pantry fits the time'; end if;
  update cookoff_players set recipe_id = pick where game_id = g.id and user_id = auth.uid();
  return pick;
end $$;

revoke execute on function public.join_cookoff_judge(text) from public, anon;
grant execute on function public.join_cookoff_judge(text) to authenticated;
revoke execute on function public._cookoff_tick(uuid), public._cookoff_view(uuid) from public, anon, authenticated;
