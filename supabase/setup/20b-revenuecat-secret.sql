-- Whisk setup 20b (when you turn on coin packs): lets the RevenueCat webhook credit coins.
-- 1. Replace PASTE-YOUR-WEBHOOK-SECRET-HERE below with the same long random value you put in Vercel as
--    REVENUECAT_WEBHOOK_AUTH (without the word "Bearer").
-- 2. Run it in Supabase → SQL Editor. Only a one-way fingerprint (SHA-256) of the secret is stored, never the secret.
-- Never paste the secret into chat.
insert into private.app_secrets (name, sha256_hex)
values ('revenuecat_webhook', encode(sha256(convert_to('PASTE-YOUR-WEBHOOK-SECRET-HERE', 'UTF8')), 'hex'))
on conflict (name) do update set sha256_hex = excluded.sha256_hex;
