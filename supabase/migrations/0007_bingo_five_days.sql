-- Whisk 0007 — cuisine bingo runs in 5-day rounds instead of weeks.
-- Rounds are counted from a fixed day (Mon 5 Jan 2026, UTC), so everyone's card changes on the same day.
-- weekly_bingo.week_start now holds the first day of the round.

create or replace function public._bingo_round_start(p_day date default (now() at time zone 'utc')::date)
returns date language sql immutable set search_path = '' as $$
  select date '2026-01-05' + (floor((p_day - date '2026-01-05') / 5.0) * 5)::int
$$;

create or replace function public._bingo_marks(p_user uuid, p_week date, p_cells text[])
returns boolean[] language sql stable security definer set search_path = public, pg_temp as $$
  select array_agg(exists (
      select 1 from meals m where m.user_id = p_user and m.cooked_at >= p_week::timestamp at time zone 'utc'
        and m.cooked_at < (p_week + 5)::timestamp at time zone 'utc' and _cuisine_match(m.cuisine, c.cell)
    ) order by c.i)
  from unnest(p_cells) with ordinality as c(cell, i)
$$;

create or replace function public.get_bingo()
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid uuid := auth.uid();
  wk date := _bingo_round_start((now() at time zone 'utc')::date);
  b weekly_bingo%rowtype; marks boolean[];
begin
  if uid is null then raise exception 'not signed in'; end if;
  select * into b from weekly_bingo where user_id = uid and week_start = wk;
  if not found then
    insert into weekly_bingo (user_id, week_start, cells)
    select uid, wk, array_agg(c order by random()) from (
      select c from unnest(array['American','Mexican','Italian','Chinese','Japanese','Korean','Thai','Indian','Vietnamese','Mediterranean',
        'Middle Eastern','French','Greek','Spanish','Caribbean','Cajun','Southern','Brazilian','Ethiopian','British']) as c
      order by random() limit 16) s
    on conflict do nothing;
    select * into b from weekly_bingo where user_id = uid and week_start = wk;
  end if;
  marks := _bingo_marks(uid, wk, b.cells);
  return jsonb_build_object('week_start', wk, 'ends', wk + 5, 'cells', to_jsonb(b.cells), 'marks', to_jsonb(marks), 'lines', _bingo_lines(marks), 'claimed', b.claimed_at is not null);
end $$;

create or replace function public.claim_bingo()
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid uuid := auth.uid();
  wk date := _bingo_round_start((now() at time zone 'utc')::date);
  b weekly_bingo%rowtype; gained int;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select * into b from weekly_bingo where user_id = uid and week_start = wk for update;
  if not found then raise exception 'no card this round'; end if;
  if b.claimed_at is not null then raise exception 'already claimed'; end if;
  if _bingo_lines(_bingo_marks(uid, wk, b.cells)) < 1 then raise exception 'no bingo yet'; end if;
  update weekly_bingo set claimed_at = now() where user_id = uid and week_start = wk;
  gained := _award_xp(uid, 'bingo', 200, 1);
  return jsonb_build_object('xp', gained);
end $$;

revoke execute on function public._bingo_round_start(date) from public, anon;
revoke execute on function public._bingo_marks(uuid, date, text[]) from public, anon, authenticated;
revoke execute on function public.get_bingo() from public, anon;
revoke execute on function public.claim_bingo() from public, anon;
grant execute on function public._bingo_round_start(date) to authenticated;
grant execute on function public.get_bingo() to authenticated;
grant execute on function public.claim_bingo() to authenticated;
