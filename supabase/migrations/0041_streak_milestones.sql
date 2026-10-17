-- 0041: Streak milestones. Keep a cooking streak going and claim a one-time coin reward at 3, 7, 14, 30, 60 and 100 days.
-- Uses the streak that already exists (log_meal, weekly freeze, repair, vacation). Safe to run more than once. Run after 0040.

create table if not exists public.streak_milestones (
  user_id uuid not null references auth.users (id) on delete cascade,
  days int not null,
  claimed_at timestamptz not null default now(),
  primary key (user_id, days)
);
alter table public.streak_milestones enable row level security;
revoke all on public.streak_milestones from anon, authenticated;
drop policy if exists streak_milestones_own on public.streak_milestones;
create policy streak_milestones_own on public.streak_milestones for select to authenticated using (user_id = auth.uid());

create or replace function public._streak_reward(p_days int) returns int language sql immutable as $$
  select case p_days when 3 then 200 when 7 then 500 when 14 then 1000 when 30 then 2500 when 60 then 5000 when 100 then 10000 end
$$;

-- The streak that counts right now: broken (0) if you missed more than the freeze/repair window, unless on vacation.
create or replace function public._live_streak(p_user uuid) returns int language sql stable security definer set search_path = public, pg_temp as $$
  select case when p.vacation_since is not null or p.streak_last_date >= _user_today(p_user) - 1 then coalesce(p.streak_days, 0) else 0 end
  from profiles p where p.id = p_user
$$;

create or replace function public.get_streak()
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); s int; fr int; done int[]; ms jsonb;
begin
  if uid is null then raise exception 'not signed in'; end if;
  s := _live_streak(uid);
  select streak_freezes into fr from profiles where id = uid;
  select coalesce(array_agg(days), '{}') into done from streak_milestones where user_id = uid;
  select jsonb_agg(jsonb_build_object('days', d, 'coins', _streak_reward(d), 'claimed', d = any (done), 'ready', s >= d and not (d = any (done))) order by d)
    into ms from unnest(array[3, 7, 14, 30, 60, 100]) d;
  return jsonb_build_object('streak', s, 'freezes', coalesce(fr, 0), 'milestones', ms);
end $$;

create or replace function public.claim_streak_milestone(p_days int)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); c int := _streak_reward(p_days);
begin
  if uid is null then raise exception 'not signed in'; end if;
  if c is null then raise exception 'not a milestone'; end if;
  perform 1 from profiles where id = uid for update;
  if _live_streak(uid) < p_days then raise exception 'streak not long enough'; end if;
  insert into streak_milestones (user_id, days) values (uid, p_days) on conflict do nothing;
  if not found then raise exception 'already claimed'; end if;
  update profiles set coins = coins + c where id = uid;
  return jsonb_build_object('coins', c, 'days', p_days);
end $$;

revoke all on function public._streak_reward(int), public._live_streak(uuid) from public, anon, authenticated;
revoke all on function public.get_streak(), public.claim_streak_milestone(int) from public, anon;
grant execute on function public.get_streak(), public.claim_streak_milestone(int) to authenticated;
notify pgrst, 'reload schema';
