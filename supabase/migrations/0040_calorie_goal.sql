-- 0040: Daily calorie goal. Calories come from the recipe you cooked (already saved with each meal); nothing is guessed.
-- Hit your goal (85% to 110% of it) once a day and claim 300 coins and 30 XP. Safe to run more than once. Run after 0039.

alter table public.profiles add column if not exists calorie_goal smallint check (calorie_goal is null or calorie_goal between 1200 and 4000);

create table if not exists public.calorie_claims (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  kcal int not null,
  primary key (user_id, day)
);
alter table public.calorie_claims enable row level security;
revoke all on public.calorie_claims from anon, authenticated;
drop policy if exists calorie_claims_own on public.calorie_claims;
create policy calorie_claims_own on public.calorie_claims for select to authenticated using (user_id = auth.uid());

create or replace function public.set_calorie_goal(p_goal int)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  if p_goal is not null and p_goal not between 1200 and 4000 then raise exception 'goal must be 1200 to 4000'; end if;
  update profiles set calorie_goal = p_goal where id = uid;
end $$;

-- Goal, today's total, whether already claimed, and the last 7 days.
create or replace function public.get_calories()
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); today date; tz text; g int; tot int; days jsonb; claimed boolean;
begin
  if uid is null then raise exception 'not signed in'; end if;
  today := _user_today(uid); tz := _user_tz(uid);
  select calorie_goal into g from profiles where id = uid;
  select coalesce(sum(calories), 0) into tot from meals where user_id = uid and (cooked_at at time zone tz)::date = today;
  select exists (select 1 from calorie_claims where user_id = uid and day = today) into claimed;
  select coalesce(jsonb_agg(jsonb_build_object('day', d::text, 'kcal', coalesce(k.s, 0)) order by d), '[]') into days
    from generate_series(today - 6, today, interval '1 day') d
    left join (select (cooked_at at time zone tz)::date as dd, sum(calories) s from meals where user_id = uid and cooked_at > now() - interval '9 days' group by 1) k on k.dd = d::date;
  return jsonb_build_object('goal', g, 'today', tot, 'claimed', claimed, 'days', days);
end $$;

create or replace function public.claim_calorie_reward()
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); today date; tz text; g int; tot int; xp int;
begin
  if uid is null then raise exception 'not signed in'; end if;
  today := _user_today(uid); tz := _user_tz(uid);
  select calorie_goal into g from profiles where id = uid for update;
  if g is null then raise exception 'set a goal first'; end if;
  select coalesce(sum(calories), 0) into tot from meals where user_id = uid and (cooked_at at time zone tz)::date = today;
  if tot < g * 0.85 or tot > g * 1.10 then raise exception 'not in your goal range yet'; end if;
  insert into calorie_claims (user_id, day, kcal) values (uid, today, tot) on conflict do nothing;
  if not found then raise exception 'already claimed today'; end if;
  update profiles set coins = coins + 300 where id = uid;
  xp := _award_xp(uid, 'calorie_goal', 30, 1);
  return jsonb_build_object('coins', 300, 'xp', xp);
end $$;

revoke all on function public.set_calorie_goal(int), public.get_calories(), public.claim_calorie_reward() from public, anon;
grant execute on function public.set_calorie_goal(int), public.get_calories(), public.claim_calorie_reward() to authenticated;
notify pgrst, 'reload schema';
