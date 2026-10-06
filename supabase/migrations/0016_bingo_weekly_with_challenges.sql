-- 0016: Cuisine bingo resets with the weekly challenges. Safe to run more than once.
--  • A bingo card now runs the same week as the challenges: Monday to Sunday on the player's own calendar
--    (it used to run in 5-day rounds). Meals from any day this week count, and both reset together on Monday.
--  • Switching over mid-round: if you already claimed a bingo on the card that overlaps this week, the new card
--    starts claimed, so nobody gets paid twice for the same days.

-- Monday of the player's week (same as the challenges' week_start). Name kept so nothing else has to change.
create or replace function public._bingo_round_start(p_day date default (now() at time zone 'utc')::date)
returns date language sql immutable set search_path = '' as $$
  select date_trunc('week', p_day)::date
$$;

create or replace function public._bingo_marks(p_user uuid, p_week date, p_cells text[])
returns boolean[] language sql stable security definer set search_path = public, pg_temp as $$
  select array_agg(exists (
      select 1 from meals m where m.user_id = p_user and m.cooked_at >= p_week::timestamp at time zone _user_tz(p_user)
        and m.cooked_at < (p_week + 7)::timestamp at time zone _user_tz(p_user) and _cuisine_match(m.cuisine, c.cell)
    ) order by c.i)
  from unnest(p_cells) with ordinality as c(cell, i)
$$;

create or replace function public.get_bingo()
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid uuid := auth.uid();
  wk date := _bingo_round_start(_user_today(uid));
  b weekly_bingo%rowtype; marks boolean[];
begin
  if uid is null then raise exception 'not signed in'; end if;
  select * into b from weekly_bingo where user_id = uid and week_start = wk;
  if not found then
    insert into weekly_bingo (user_id, week_start, cells, claimed_at)
    select uid, wk, array_agg(c order by random()),
      (select max(o.claimed_at) from weekly_bingo o where o.user_id = uid and o.week_start > wk - 5 and o.week_start < wk + 7)
    from (
      select c from unnest(array['American','Mexican','Italian','Chinese','Japanese','Korean','Thai','Indian','Vietnamese','Mediterranean',
        'Middle Eastern','French','Greek','Spanish','Caribbean','Cajun','Southern','Brazilian','Ethiopian','British']) as c
      order by random() limit 16) s
    on conflict do nothing;
    select * into b from weekly_bingo where user_id = uid and week_start = wk;
  end if;
  marks := _bingo_marks(uid, wk, b.cells);
  return jsonb_build_object('week_start', wk, 'ends', wk + 7, 'cells', to_jsonb(b.cells), 'marks', to_jsonb(marks), 'lines', _bingo_lines(marks), 'claimed', b.claimed_at is not null);
end $$;

revoke execute on function public._bingo_round_start(date) from public, anon;
revoke execute on function public._bingo_marks(uuid, date, text[]) from public, anon, authenticated;
revoke execute on function public.get_bingo() from public, anon;
grant execute on function public._bingo_round_start(date) to authenticated;
grant execute on function public.get_bingo() to authenticated;
