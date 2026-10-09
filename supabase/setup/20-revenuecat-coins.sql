-- Whisk setup 20: coin packs through RevenueCat (web now: Apple Pay / Google Pay / card on RevenueCat's checkout,
-- which uses your Stripe account; later in the phone app: Apple and Google in-app purchase, same crediting).
--  • coin_pack_products: which RevenueCat product ids give which coin pack (web and App Store ids both map here).
--  • coin_purchases: one row per store transaction, so a purchase is credited exactly once and can be taken back
--    on a refund. Players can read only their own.
--  • rc_credit / rc_refund: called only by Whisk's RevenueCat webhook route; locked by a secret whose SHA-256 is
--    stored in private.app_secrets (see setup 20b). No service-role key anywhere.
-- Safe to run more than once.

create table if not exists public.coin_pack_products (
  product_id text primary key check (product_id ~ '^[A-Za-z0-9._-]{1,100}$'),
  pack_id text not null references public.coin_packs (id)
);
-- Web products use the pack id itself. App Store / Google Play ids are reserved for the phone app.
insert into public.coin_pack_products (product_id, pack_id) values
  ('coins-1000', 'coins-1000'), ('coins-3000', 'coins-3000'), ('coins-10000', 'coins-10000'), ('coins-15000', 'coins-15000'),
  ('whisk.coins1000', 'coins-1000'), ('whisk.coins3000', 'coins-3000'), ('whisk.coins10000', 'coins-10000'), ('whisk.coins15000', 'coins-15000')
on conflict (product_id) do update set pack_id = excluded.pack_id;
alter table public.coin_pack_products enable row level security;
revoke all on public.coin_pack_products from anon, authenticated;   -- server-side mapping only

create table if not exists public.coin_purchases (
  transaction_id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id text not null,
  pack_id text not null references public.coin_packs (id),
  coins integer not null check (coins > 0),
  store text not null,
  sandbox boolean not null default false,
  usd numeric(10, 2),
  status text not null default 'paid' check (status in ('paid', 'refunded')),
  created_at timestamptz not null default now(),
  refunded_at timestamptz
);
create index if not exists coin_purchases_user_idx on public.coin_purchases (user_id, created_at desc);
alter table public.coin_purchases enable row level security;
drop policy if exists coin_purchases_select on public.coin_purchases;
create policy coin_purchases_select on public.coin_purchases for select to authenticated using (user_id = auth.uid());
revoke all on public.coin_purchases from anon, authenticated;
grant select on public.coin_purchases to authenticated;   -- written only by the functions below

create or replace function public._rc_secret_ok(p_secret text) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select p_secret is not null and length(p_secret) >= 24 and exists (
    select 1 from private.app_secrets where name = 'revenuecat_webhook' and sha256_hex = encode(sha256(convert_to(p_secret, 'UTF8')), 'hex'));
$$;
revoke execute on function public._rc_secret_ok(text) from public, anon, authenticated;

-- A paid purchase: credit the pack's coins (times the quantity, max 10) once per store transaction.
create or replace function public.rc_credit(p_secret text, p_user uuid, p_txn text, p_product text, p_store text,
  p_sandbox boolean, p_usd numeric, p_quantity integer default 1)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare pk coin_packs%rowtype; q integer := least(greatest(coalesce(p_quantity, 1), 1), 10); n integer;
begin
  if not public._rc_secret_ok(p_secret) then raise exception 'forbidden'; end if;
  if p_txn is null or p_txn !~ '^[A-Za-z0-9._:-]{1,200}$' then raise exception 'bad transaction id'; end if;
  select c.* into pk from coin_pack_products m join coin_packs c on c.id = m.pack_id where m.product_id = p_product;
  if not found then raise exception 'unknown product'; end if;
  if not exists (select 1 from profiles where id = p_user) then raise exception 'unknown player'; end if;
  n := pk.coins * q;
  insert into coin_purchases (transaction_id, user_id, product_id, pack_id, coins, store, sandbox, usd)
  values (p_txn, p_user, p_product, pk.id, n, left(coalesce(p_store, 'UNKNOWN'), 30), coalesce(p_sandbox, false), p_usd)
  on conflict (transaction_id) do nothing;
  if not found then return jsonb_build_object('credited', false, 'reason', 'already credited'); end if;
  update profiles set coins = coins + n where id = p_user;
  return jsonb_build_object('credited', true, 'coins', n);
end $$;

-- A refunded purchase: take its coins back (never below zero), once.
create or replace function public.rc_refund(p_secret text, p_txn text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare u uuid; n integer;
begin
  if not public._rc_secret_ok(p_secret) then raise exception 'forbidden'; end if;
  update coin_purchases set status = 'refunded', refunded_at = now() where transaction_id = p_txn and status = 'paid'
  returning user_id, coins into u, n;
  if not found then return jsonb_build_object('refunded', false); end if;
  update profiles set coins = greatest(0, coins - n) where id = u;
  return jsonb_build_object('refunded', true, 'coins', n);
end $$;

revoke execute on function public.rc_credit(text, uuid, text, text, text, boolean, numeric, integer), public.rc_refund(text, text) from public;
grant execute on function public.rc_credit(text, uuid, text, text, text, boolean, numeric, integer), public.rc_refund(text, text) to anon, authenticated;   -- the secret is the lock
