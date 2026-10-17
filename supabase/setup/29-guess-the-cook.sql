-- Guess the Cook: a daily friends game. You see a friend's shared plate with the name hidden and guess which friend cooked it.
--  • 5 plates a day (your own calendar day). 5 coins for each right guess, +20 for 5 out of 5. At most 45 coins a day.
--  • Only plates your friends chose to share, never your own, never reported ones. A plate is guessed once.
--  • You need at least 2 friends (with 1 friend the answer would be obvious).
--  • Nothing here is bought and nothing here touches Cook Off scoring. Coins are only earned.
-- Safe to run more than once.

create table if not exists public.cook_guesses (
  user_id uuid not null references auth.users (id) on delete cascade,
  meal_id uuid not null references public.meals (id) on delete cascade,
  guess_id uuid not null,
  correct boolean not null,
  day date not null,
  at timestamptz not null default now(),
  primary key (user_id, meal_id)
);
create index if not exists cook_guesses_user_day_idx on public.cook_guesses (user_id, day);
alter table public.cook_guesses enable row level security;
revoke all on public.cook_guesses from anon, authenticated;

-- Today's round for the signed-in player: the next plate to guess, or why there isn't one.
create or replace function public.get_guess_round()
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); today date; played int; right_n int; nf int; m meals; opts jsonb; run int := 0; r record;
begin
  if uid is null then raise exception 'not signed in'; end if;
  today := _user_today(uid);
  select count(*), count(*) filter (where correct) into played, right_n from cook_guesses where user_id = uid and day = today;
  for r in select correct from cook_guesses where user_id = uid order by at desc loop
    exit when not r.correct; run := run + 1;
  end loop;
  select count(*) into nf from friends where user_id = uid;
  if nf < 2 then return jsonb_build_object('state', 'need_friends', 'friends', nf, 'played', played, 'correct', right_n, 'run', run); end if;
  if played >= 5 then return jsonb_build_object('state', 'done', 'played', played, 'correct', right_n, 'run', run, 'perfect', right_n = 5); end if;
  select * into m from meals mm
    where mm.user_id in (select friend_id from friends where user_id = uid) and _plate_visible(uid, mm)
      and not exists (select 1 from cook_guesses g where g.user_id = uid and g.meal_id = mm.id)
    order by random() limit 1;
  if not found then return jsonb_build_object('state', 'no_plates', 'played', played, 'correct', right_n, 'run', run); end if;
  select coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name) order by random()), '[]'::jsonb) into opts from (
    select p.id, coalesce(nullif(trim(p.display_name), ''), 'Chef') as name from profiles p where p.id = m.user_id
    union all
    (select p.id, coalesce(nullif(trim(p.display_name), ''), 'Chef') from profiles p
      where p.id in (select friend_id from friends where user_id = uid) and p.id <> m.user_id order by random() limit 3)) t;
  return jsonb_build_object('state', 'play', 'played', played, 'correct', right_n, 'run', run, 'left', 5 - played,
    'plate', jsonb_build_object('id', m.id, 'title', m.title, 'cuisine', m.cuisine, 'photo', m.photo_path), 'options', opts);
end $$;

create or replace function public.guess_cook(p_meal uuid, p_guess uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); today date; m meals; played int; right_n int; ok boolean; gain int := 0; perfect boolean := false; cname text; run int := 0; r record;
begin
  if uid is null then raise exception 'not signed in'; end if;
  today := _user_today(uid);
  perform 1 from profiles where id = uid for update;     -- one guess at a time per player
  select * into m from meals where id = p_meal;
  if not found or m.user_id = uid or not _plate_visible(uid, m) or not _are_friends(uid, m.user_id) then raise exception 'that plate isn''t available'; end if;
  if not _are_friends(uid, p_guess) then raise exception 'pick one of your friends'; end if;
  if exists (select 1 from cook_guesses where user_id = uid and meal_id = p_meal) then raise exception 'you already guessed that plate'; end if;
  select count(*) into played from cook_guesses where user_id = uid and day = today;
  if played >= 5 then raise exception 'that''s today''s five. Come back tomorrow'; end if;
  ok := (p_guess = m.user_id);
  insert into cook_guesses (user_id, meal_id, guess_id, correct, day) values (uid, p_meal, p_guess, ok, today);
  select count(*) filter (where correct) into right_n from cook_guesses where user_id = uid and day = today;
  played := played + 1;
  if ok then gain := 5; end if;
  if played = 5 and right_n = 5 then gain := gain + 20; perfect := true; end if;
  if gain > 0 then update profiles set coins = coins + gain where id = uid; end if;
  select coalesce(nullif(trim(display_name), ''), 'Chef') into cname from profiles where id = m.user_id;
  for r in select correct from cook_guesses where user_id = uid order by at desc, meal_id loop
    exit when not r.correct; run := run + 1;
  end loop;
  return jsonb_build_object('correct', ok, 'cook_id', m.user_id, 'cook_name', cname, 'coins', gain, 'played', played, 'right', right_n, 'perfect', perfect, 'run', run);
end $$;

-- This week's best guessers among you and your friends (week starts Monday, your calendar). Names and counts only.
create or replace function public.guess_board()
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); wk date;
begin
  if uid is null then raise exception 'not signed in'; end if;
  wk := _user_today(uid) - ((extract(isodow from _user_today(uid))::int) - 1);
  return coalesce((select jsonb_agg(x order by (x ->> 'right')::int desc, (x ->> 'played')::int asc, x ->> 'name') from (
    select jsonb_build_object('name', coalesce(nullif(trim(p.display_name), ''), 'Chef'), 'me', p.id = uid,
      'right', (select count(*) from cook_guesses g where g.user_id = p.id and g.correct and g.day >= wk),
      'played', (select count(*) from cook_guesses g where g.user_id = p.id and g.day >= wk)) x
    from profiles p where p.id = uid or p.id in (select friend_id from friends where user_id = uid)) t), '[]'::jsonb);
end $$;

revoke execute on function public.get_guess_round() from public, anon;
revoke execute on function public.guess_cook(uuid, uuid) from public, anon;
revoke execute on function public.guess_board() from public, anon;
grant execute on function public.get_guess_round() to authenticated;
grant execute on function public.guess_cook(uuid, uuid) to authenticated;
grant execute on function public.guess_board() to authenticated;
