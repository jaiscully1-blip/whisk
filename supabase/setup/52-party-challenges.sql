-- 0059: This week's challenges are played together, inside a party. Safe to run more than once. Run after 0058.
--  • Each party gets 3 dishes a week (a small, a medium and a big one), the same for every member, picked once by the server.
--  • Everyone in the party sees who has cooked each one. Cooking it earns the same coins and XP as before
--    (coins by difficulty, +50 XP, one challenge dish a day for you, wherever you play).
--  • You can claim a dish you already cooked this week (any plate, with a photo) from the party.

create table if not exists public.party_challenges (
  group_id uuid not null references public.chat_groups (id) on delete cascade,
  week_start date not null,
  slot smallint not null check (slot between 1 and 3),
  recipe_id text not null references public.web_recipes (id) on delete cascade,
  coins int not null,
  primary key (group_id, week_start, slot)
);
create table if not exists public.party_challenge_done (
  group_id uuid not null,
  week_start date not null,
  slot smallint not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  meal_id uuid references public.meals (id) on delete set null,
  completed_at timestamptz not null default now(),
  primary key (group_id, week_start, slot, user_id),
  foreign key (group_id, week_start, slot) references public.party_challenges (group_id, week_start, slot) on delete cascade
);
alter table public.party_challenges enable row level security;
alter table public.party_challenge_done enable row level security;
revoke all on public.party_challenges, public.party_challenge_done from anon, authenticated;

-- the party's three dishes this week (picked on first look), who has cooked each, and a plate of yours that counts
create or replace function public.get_party_challenges(p_group uuid) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); wk date; big_lo int := case when random() < 0.6 then 80 else 65 end;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from chat_groups g where g.id = p_group and g.party) or not _in_chat(p_group, uid) then raise exception 'not in that party'; end if;
  wk := date_trunc('week', _user_today(uid))::date;
  perform pg_advisory_xact_lock(hashtext(p_group::text || wk::text));
  if not exists (select 1 from party_challenges c where c.group_id = p_group and c.week_start = wk) then
    insert into party_challenges (group_id, week_start, slot, recipe_id, coins)
    select p_group, wk, t.slot, t.id, score_to_coins(t.score) from (
      (select 1::smallint as slot, w.id, w.score from web_recipes w where w.active and w.score < 35 order by random() limit 1)
      union all (select 2::smallint, w.id, w.score from web_recipes w where w.active and w.score >= 35 and w.score < 65 order by random() limit 1)
      union all (select 3::smallint, w.id, w.score from web_recipes w where w.active and w.score >= 65 order by (w.score >= big_lo) desc, random() limit 1)
    ) t;
  end if;
  return jsonb_build_object('week_start', wk, 'week_end', wk + 7, 'items', coalesce((select jsonb_agg(q.item order by q.slot) from (
    select pc.slot, jsonb_build_object('slot', pc.slot, 'recipe_id', pc.recipe_id, 'title', r.title, 'cuisine', r.cuisine, 'minutes', r.minutes, 'score', r.score, 'coins', pc.coins,
      'done', coalesce((select jsonb_agg(jsonb_build_object('code', _my_code(d.user_id), 'name', _chat_name(d.user_id), 'me', d.user_id = uid, 'at', d.completed_at,
          'seat', (select count(*) from chat_members c1, chat_members c2 where c1.group_id = p_group and c2.group_id = p_group and c2.user_id = d.user_id and (c1.joined_at, c1.user_id) < (c2.joined_at, c2.user_id))) order by d.completed_at)
        from party_challenge_done d where d.group_id = pc.group_id and d.week_start = pc.week_start and d.slot = pc.slot and _in_chat(p_group, d.user_id)), '[]'::jsonb),
      'my_meal', (select m.id from meals m where m.user_id = uid and m.web_recipe_id = pc.recipe_id and m.cooked_at >= (wk::timestamp at time zone _user_tz(uid))
        and not exists (select 1 from party_challenge_done d where d.group_id = pc.group_id and d.week_start = pc.week_start and d.slot = pc.slot and d.user_id = uid)
        order by m.cooked_at desc limit 1)) as item
    from party_challenges pc join web_recipes r on r.id = pc.recipe_id
    where pc.group_id = p_group and pc.week_start = wk) q), '[]'::jsonb));
end $$;

-- count a plate you cooked this week toward one of the party's dishes (pays the coins and XP; one challenge dish a day)
create or replace function public.claim_party_challenge(p_group uuid, p_slot int, p_meal uuid default null) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); wk date; pc party_challenges%rowtype; m meals%rowtype; xp int := 0;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from chat_groups g where g.id = p_group and g.party) or not _in_chat(p_group, uid) then raise exception 'not in that party'; end if;
  wk := date_trunc('week', _user_today(uid))::date;
  select * into pc from party_challenges c where c.group_id = p_group and c.week_start = wk and c.slot = p_slot;
  if not found then raise exception 'no such challenge'; end if;
  if exists (select 1 from party_challenge_done d where d.group_id = p_group and d.week_start = wk and d.slot = p_slot and d.user_id = uid) then raise exception 'already done'; end if;
  select * into m from meals x where x.user_id = uid and x.web_recipe_id = pc.recipe_id and x.cooked_at >= (wk::timestamp at time zone _user_tz(uid)) and (p_meal is null or x.id = p_meal) order by x.cooked_at desc limit 1;
  if not found then raise exception 'cook it first'; end if;
  if exists (select 1 from xp_events e where e.user_id = uid and e.kind = 'challenge' and e.created_at > now() - interval '24 hours') then raise exception 'one challenge a day'; end if;
  insert into party_challenge_done (group_id, week_start, slot, user_id, meal_id) values (p_group, wk, pc.slot, uid, m.id);
  update profiles set coins = coins + pc.coins where id = uid;
  xp := _award_xp(uid, 'challenge', 50, 1);
  update meals set xp_earned = coalesce(xp_earned, 0) + xp, coins_earned = coalesce(coins_earned, 0) + pc.coins where id = m.id;
  return jsonb_build_object('coins', pc.coins, 'xp', xp, 'slot', pc.slot);
end $$;

revoke execute on function public.get_party_challenges(uuid), public.claim_party_challenge(uuid, int, uuid) from public, anon;
grant execute on function public.get_party_challenges(uuid), public.claim_party_challenge(uuid, int, uuid) to authenticated;
