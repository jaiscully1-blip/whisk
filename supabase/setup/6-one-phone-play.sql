-- Whisk setup step 6: 0013_one_phone_play.sql
-- Paste ALL of this into Supabase → SQL Editor → New query → Run. Safe to run more than once.

-- 0013: one phone, no account. Players start with "Start playing" (Supabase anonymous sign-in: no email, no password),
-- so there's no password or email code to confirm a reset with any more. Reset is your own game on your own phone:
-- the app asks you to type RESET, and the database only lets you reset your own rows. Safe to run more than once.
create or replace function public.reset_game()
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  delete from pantry_items where user_id = uid;
  delete from shopping_items where user_id = uid;
  delete from saved_recipes where user_id = uid;
  delete from meals where user_id = uid;
  delete from weekly_challenges where user_id = uid;
  delete from daily_quests where user_id = uid;
  delete from weekly_bingo where user_id = uid;
  delete from xp_events where user_id = uid;
  -- Shop items, outfit and coins are kept: coins can be bought with real money.
  update profiles set xp = 0, streak_days = 0, streak_last_date = null, streak_freezes = 1, streak_freeze_week = null,
    last_meal_at = null, last_back_popup_at = null, ui_state = null where id = uid;
end $$;
revoke all on function public.reset_game() from public, anon;
grant execute on function public.reset_game() to authenticated;
