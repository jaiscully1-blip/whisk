-- 0062: Remember each player's best streak. Safe to run more than once.
--  • best_streak: the longest streak they've had (raised automatically whenever the streak goes up).
--  • streak_prev_best: their best before the current streak started (so the app can say "tied best" / "new best").
alter table public.profiles add column if not exists best_streak int not null default 0;
alter table public.profiles add column if not exists streak_prev_best int not null default 0;
update public.profiles set best_streak = greatest(best_streak, streak_days);

create or replace function public.track_best_streak() returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' and new.streak_days is distinct from old.streak_days and new.streak_days <= 1 then
    new.streak_prev_best := greatest(coalesce(old.best_streak, 0), coalesce(old.streak_days, 0));   -- a new streak is starting
  end if;
  new.best_streak := greatest(coalesce(new.best_streak, 0), coalesce(new.streak_days, 0));
  return new;
end $$;
drop trigger if exists profiles_best_streak on public.profiles;
create trigger profiles_best_streak before insert or update on public.profiles for each row execute function public.track_best_streak();
