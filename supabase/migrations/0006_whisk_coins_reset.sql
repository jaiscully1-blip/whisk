-- Whisk 0006: July 18 coin gift, renamed shop items, coin packs (Bitcoin via BTCPay), two-step game reset.
-- Safe to run more than once. Run after 0001–0005.

-- ---------- renamed items (ids stay the same, so owners keep them) ----------
update public.items set name = '50 lb Dumbbell' where id = 'acc-watch';
update public.items set name = 'Basketball Backpack' where id = 'acc-crystal-backpack';

-- ---------- July 18: Whisk Wrapped + 5,000 free coins, once a year ----------
create or replace function public.record_login(p_local_date date, p_local_hour int, p_user_agent text default null, p_device text default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid uuid := auth.uid();
  p profiles%rowtype;
  new_session boolean;
  pops text[] := array[]::text[];
  night_date date;
  gift int := 0;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if p_local_hour is null or p_local_hour < 0 or p_local_hour > 23 then raise exception 'bad hour'; end if;
  if p_local_date is null or abs(p_local_date - current_date) > 2 then raise exception 'bad date'; end if;
  select * into p from profiles where id = uid for update;

  new_session := p.last_seen_at is null or p.last_seen_at < now() - interval '30 minutes';
  if new_session then
    insert into login_events (user_id, user_agent) values (uid, left(p_user_agent, 300));
    update profiles set login_count = login_count + 1, last_login_at = now(), first_login_at = coalesce(first_login_at, now()) where id = uid;
  end if;
  update profiles set last_seen_at = now(), last_device = left(nullif(trim(p_device), ''), 60) where id = uid;

  if p.last_meal_at is not null and p.last_meal_at < now() - interval '76 hours'
     and (p.last_back_popup_at is null or p.last_back_popup_at < p.last_meal_at) then
    pops := array_append(pops, 'back');
    update profiles set last_back_popup_at = now() where id = uid;
  elsif p_local_hour >= 21 or p_local_hour < 4 then
    night_date := case when p_local_hour < 4 then p_local_date - 1 else p_local_date end;
    if p.last_late_popup_date is null or p.last_late_popup_date <> night_date then
      pops := array_append(pops, 'late');
      update profiles set last_late_popup_date = night_date where id = uid;
    end if;
  end if;

  -- July 18 (the player's date, checked against the server's within ±2 days above): Wrapped + 5,000 coins, once a year
  if extract(month from p_local_date) = 7 and extract(day from p_local_date) = 18
     and p.last_wrapped_year is distinct from extract(year from p_local_date)::int then
    pops := array_append(pops, 'wrapped');
    gift := 5000;
    update profiles set last_wrapped_year = extract(year from p_local_date)::int, coins = coins + gift where id = uid;
  end if;

  return jsonb_build_object('popups', to_jsonb(pops), 'popup', pops[1], 'new_session', new_session,
    'last_device', p.last_device, 'last_seen_at', p.last_seen_at, 'gift_coins', gift);
end $$;

-- ---------- coin packs (prices in USD, paid in Bitcoin through BTCPay) ----------
create table if not exists public.coin_packs (
  id text primary key, coins integer not null check (coins > 0), usd numeric(8, 2) not null check (usd > 0), sort smallint not null default 0, active boolean not null default true
);
insert into public.coin_packs (id, coins, usd, sort) values
  ('coins-1000', 1000, 2.00, 1), ('coins-3000', 3000, 5.00, 2), ('coins-10000', 10000, 10.00, 3), ('coins-15000', 15000, 20.00, 4)
on conflict (id) do update set coins = excluded.coins, usd = excluded.usd, sort = excluded.sort, active = true;
alter table public.coin_packs enable row level security;
drop policy if exists coin_packs_read on public.coin_packs;
create policy coin_packs_read on public.coin_packs for select to authenticated using (active);
revoke all on public.coin_packs from anon, authenticated;
grant select on public.coin_packs to authenticated;

create table if not exists public.coin_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  pack_id text not null references public.coin_packs (id),
  coins integer not null, usd numeric(8, 2) not null,
  status text not null default 'pending' check (status in ('pending', 'paid')),
  invoice_id text unique,
  created_at timestamptz not null default now(), paid_at timestamptz
);
create index if not exists coin_orders_user_idx on public.coin_orders (user_id, created_at desc);
alter table public.coin_orders enable row level security;
drop policy if exists coin_orders_select on public.coin_orders;
create policy coin_orders_select on public.coin_orders for select to authenticated using (user_id = auth.uid());
revoke all on public.coin_orders from anon, authenticated;
grant select on public.coin_orders to authenticated;   -- created and paid only through the functions below

-- A secret only the payment webhook knows (stored as a SHA-256 hash; set it once, see LAUNCH.md).
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table if not exists private.app_secrets (name text primary key, sha256_hex text not null);

create or replace function public.create_coin_order(p_pack_id text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); pk coin_packs%rowtype; oid uuid;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select * into pk from coin_packs where id = p_pack_id and active;
  if not found then raise exception 'unknown pack'; end if;
  if (select count(*) from coin_orders where user_id = uid and status = 'pending' and created_at > now() - interval '1 hour') >= 10 then raise exception 'too many open orders'; end if;
  insert into coin_orders (user_id, pack_id, coins, usd) values (uid, pk.id, pk.coins, pk.usd) returning id into oid;
  return jsonb_build_object('order_id', oid, 'coins', pk.coins, 'usd', pk.usd);
end $$;

-- Called only by the BTCPay webhook route after it verified the signature AND re-checked the invoice with BTCPay.
create or replace function public.credit_coin_order(p_order_id uuid, p_invoice_id text, p_paid_usd numeric, p_secret text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare o coin_orders%rowtype; want text;
begin
  select sha256_hex into want from private.app_secrets where name = 'payments_webhook';
  if want is null or p_secret is null or encode(sha256(convert_to(p_secret, 'UTF8')), 'hex') <> want then raise exception 'forbidden'; end if;
  select * into o from coin_orders where id = p_order_id for update;
  if not found then raise exception 'unknown order'; end if;
  if o.status = 'paid' then return jsonb_build_object('credited', false, 'reason', 'already paid'); end if;
  if p_paid_usd is null or p_paid_usd < o.usd then raise exception 'underpaid'; end if;
  update coin_orders set status = 'paid', paid_at = now(), invoice_id = left(p_invoice_id, 100) where id = o.id;
  update profiles set coins = coins + o.coins where id = o.user_id;
  return jsonb_build_object('credited', true, 'coins', o.coins);
end $$;

-- ---------- reset game: needs a fresh email code (second factor) from the last 10 minutes ----------
create or replace function public.reset_game()
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); amr jsonb := coalesce(auth.jwt() -> 'amr', '[]'::jsonb); ok boolean;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select exists (select 1 from jsonb_array_elements(amr) a where a ->> 'method' in ('otp', 'magiclink')
                 and (a ->> 'timestamp')::bigint > extract(epoch from now() - interval '10 minutes')) into ok;
  if not ok then raise exception 'confirm with the code we emailed you first'; end if;
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

revoke all on function public.record_login(date, int, text, text) from public, anon;
revoke all on function public.create_coin_order(text) from public, anon;
revoke all on function public.reset_game() from public, anon;
revoke all on function public.credit_coin_order(uuid, text, numeric, text) from public;
grant execute on function public.record_login(date, int, text, text) to authenticated;
grant execute on function public.create_coin_order(text) to authenticated;
grant execute on function public.reset_game() to authenticated;
grant execute on function public.credit_coin_order(uuid, text, numeric, text) to anon, authenticated;   -- guarded by the webhook secret
