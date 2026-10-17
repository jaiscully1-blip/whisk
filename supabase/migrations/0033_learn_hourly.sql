-- Learn quiz, once an hour: after you finish a quiz the next one unlocks 1 hour later (the app shows a countdown).
-- Safe to run more than once.

alter table public.profiles add column if not exists learn_next timestamptz;

-- Start (or resume today's unfinished) quiz. Returns the questions WITHOUT answers.
create or replace function public.quiz_start()
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); lvl text; today date; att public.quiz_attempts; ids int[]; recent int[]; paid int; nxt timestamptz;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select skill_level into lvl from profiles where id = uid;
  if lvl is null or lvl not in ('beginner','novice','advanced_beginner') then raise exception 'learning is off for your level'; end if;
  today := _user_today(uid);
  select learn_next into nxt from profiles where id = uid;
  if nxt is not null and nxt > now() and not exists (select 1 from quiz_attempts where user_id = uid and graded_at is null) then
    raise exception 'quiz cooldown %', ceil(extract(epoch from (nxt - now())))::int;
  end if;
  select * into att from quiz_attempts where user_id = uid and graded_at is null and day = today order by created_at desc limit 1;
  if not found then
    select coalesce(array_agg(x), '{}') into recent from (select unnest(qids) x from quiz_attempts where user_id = uid order by created_at desc limit 10) r;
    select array_agg(id) into ids from (select id from lesson_questions where not (id = any(recent)) order by random() limit 3) s;
    if ids is null or array_length(ids, 1) < 3 then
      select array_agg(id) into ids from (select id from lesson_questions order by random() limit 3) s;
    end if;
    insert into quiz_attempts (user_id, qids, day) values (uid, ids, today) returning * into att;
  end if;
  select count(*) into paid from quiz_attempts where user_id = uid and day = today and coins > 0;
  return jsonb_build_object(
    'attempt', att.id,
    'paid_left', greatest(0, 5 - paid),
    'questions', (select jsonb_agg(jsonb_build_object('id', q.id, 'q', q.prompt, 'options', q.options) order by array_position(att.qids, q.id)) from lesson_questions q where q.id = any(att.qids)));
end $$;

-- Grade once. Returns what was right and why. 100 coins for 3/3 (5 paying quizzes a day at most).
create or replace function public.quiz_submit(p_attempt uuid, p_picks int[])
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); att public.quiz_attempts; today date; n smallint := 0; i int; paid int; gain int := 0; p profiles; res jsonb := '[]'::jsonb; q public.lesson_questions;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select * into att from quiz_attempts where id = p_attempt and user_id = uid for update;
  if not found then raise exception 'no such quiz'; end if;
  if att.graded_at is not null then raise exception 'already answered'; end if;
  if p_picks is null or array_length(p_picks, 1) is distinct from 3 then raise exception 'answer all three'; end if;
  for i in 1..3 loop
    if p_picks[i] is null or p_picks[i] not between 0 and 3 then raise exception 'bad answer'; end if;
    select * into q from lesson_questions where id = att.qids[i];
    if q.answer = p_picks[i] then n := n + 1; end if;
    res := res || jsonb_build_array(jsonb_build_object('id', q.id, 'answer', q.answer, 'picked', p_picks[i], 'why', q.why));
  end loop;
  today := _user_today(uid);
  select count(*) into paid from quiz_attempts where user_id = uid and day = today and coins > 0;
  if n = 3 and paid < 5 then gain := 100; end if;
  update quiz_attempts set picks = p_picks, correct = n, coins = gain, graded_at = now(), day = today where id = att.id;
  update profiles set
    coins = coins + gain,
    learn_streak = case when learn_last = today then learn_streak when learn_last = today - 1 then learn_streak + 1 else 1 end,
    learn_best = greatest(learn_best, case when learn_last = today then learn_streak when learn_last = today - 1 then learn_streak + 1 else 1 end),
    learn_last = today,
    learn_next = now() + interval '1 hour'
  where id = uid returning * into p;
  perform _award_xp(uid, 'quiz', 10, 5);
  return jsonb_build_object('correct', n, 'perfect', n = 3, 'coins', gain, 'streak', p.learn_streak, 'best', p.learn_best, 'next', p.learn_next, 'results', res);
end $$;

revoke execute on function public.quiz_start() from public, anon;
revoke execute on function public.quiz_submit(uuid, int[]) from public, anon;
grant execute on function public.quiz_start() to authenticated;
grant execute on function public.quiz_submit(uuid, int[]) to authenticated;
