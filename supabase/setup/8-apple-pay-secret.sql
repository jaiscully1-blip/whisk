-- Whisk setup step 8 (only when you turn on coin packs): lets the Stripe webhook credit coins.
-- 1. Replace PASTE-YOUR-whsec-SECRET-HERE below with the Signing secret of your Stripe webhook (starts with whsec_).
-- 2. Run it in Supabase → SQL Editor. Only a one-way fingerprint (SHA-256) of the secret is stored, never the secret itself.
-- Never paste the secret into chat. It goes only here and in Vercel (STRIPE_WEBHOOK_SECRET).
insert into private.app_secrets (name, sha256_hex)
values ('payments_webhook', encode(sha256(convert_to('PASTE-YOUR-whsec-SECRET-HERE', 'UTF8')), 'hex'))
on conflict (name) do update set sha256_hex = excluded.sha256_hex;
