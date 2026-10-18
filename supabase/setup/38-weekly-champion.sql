-- 0045: Cook of the week. The player with the most XP in the last full Monday-to-Sunday week (UTC) gets a crown next
-- to their name for the whole of this week. Decided once per week and stored. Run after 0044. Safe to run more than once.

create table if not exists public.weekly_champions (
  week_start date primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  xp int not null
);
alter table public.weekly_champions enable row level security;
revoke all on public.weekly_champions from anon, authenticated;

create or replace function public.get_champion()
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); wk date := date_trunc('week', now() at time zone 'utc')::date; prev date; c weekly_champions%rowtype;
begin
  if uid is null then raise exception 'not signed in'; end if;
  prev := wk - 7;
  select * into c from weekly_champions where week_start = prev;
  if not found then
    insert into weekly_champions (week_start, user_id, xp)
    select prev, e.user_id, sum(e.amount)::int
    from xp_events e
    where e.created_at >= (prev::timestamp at time zone 'utc') and e.created_at < (wk::timestamp at time zone 'utc') and e.amount > 0
    group by e.user_id order by sum(e.amount) desc, min(e.created_at) limit 1
    on conflict do nothing;
    select * into c from weekly_champions where week_start = prev;
  end if;
  if c.user_id is null then return jsonb_build_object('code', null); end if;
  return jsonb_build_object('code', _my_code(c.user_id), 'name', coalesce(nullif(trim((select display_name from profiles where id = c.user_id)), ''), 'Chef'),
    'xp', c.xp, 'week_start', prev, 'me', c.user_id = uid);
end $$;
revoke all on function public.get_champion() from public, anon;
grant execute on function public.get_champion() to authenticated;
notify pgrst, 'reload schema';
