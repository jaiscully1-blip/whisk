# Whisk security review

Last reviewed: Oct 3, 2026. Checked against the **OWASP Top 10 (2021)**. OWASP published a 2025 edition; its two new themes (software supply chain, mishandling exceptional conditions) are covered under A06/A08 and A09 below.

## What's in place

| # | OWASP risk | How Whisk handles it | Verified by |
|---|---|---|---|
| A01 | Broken access control | Row Level Security on **every** table; each policy is `user_id = auth.uid()` for SELECT/INSERT/UPDATE/DELETE. Coins, XP, purchases, challenge rewards and meal logs change only through `SECURITY DEFINER` functions with pinned `search_path`. Players can't write `xp`/`coins` (column-level grants). Storage photos are private and folder-scoped per user. Middleware blocks signed-out users from app routes. | `supabase/tests/rls.test.mjs`: 51 checks incl. cross-user reads/writes, minting coins, buying unowned items, stealing challenges, uploading into other folders |
| A02 | Cryptographic failures | HTTPS only (HSTS 2 years + preload). Passwords handled by Supabase Auth (bcrypt). No secrets in the browser bundle. Photos stripped of EXIF/GPS by re-encoding before upload. | Response headers checked locally |
| A03 | Injection | All DB access through Supabase query builder / RPC (parameterized). The one dynamic SQL (`equip_item`) whitelists the slot name and uses `format('%I')` + `USING`. React escapes all rendered text. AI prompt treats pantry/notes as data; AI output is validated with zod before use and rendered as text. | RLS test: SQL-injection slot name rejected |
| A04 | Insecure design | Economy rules live in the database (server), not the client: price checks + balance deduction in one transaction with a row lock; challenge pays once; XP has daily caps; meal XP requires a photo the user actually uploaded. | RLS tests |
| A05 | Security misconfiguration | Nonce-based CSP with `strict-dynamic`, `frame-ancestors 'none'`, `object-src 'none'`; X-Frame-Options DENY; nosniff; Referrer-Policy; Permissions-Policy; `X-Powered-By` removed. Authenticated pages and all API responses send `Cache-Control: private, no-store`. Anon role has no table access. | Headers checked locally; browser loaded pages with zero CSP violations |
| A06 | Vulnerable components | Exact-pinned versions; Next.js on the 15.5 security-backport line; patched PostCSS via `overrides`. `npm audit`: **0 vulnerabilities**. OSV-Scanner + `npm audit` run on every push and weekly in GitHub Actions. | `npm audit`, `.github/workflows/security.yml` |
| A07 | Auth failures | Supabase Auth with **email confirmation required**; min 8-char passwords; generic login error (no account enumeration); sign-out is POST-only; session cookies refreshed in middleware. Turn on leaked-password protection in Supabase (see LAUNCH.md). | Manual |
| A08 | Software & data integrity | Lockfile committed; CI uses `npm ci`. AI responses are schema-validated (zod) and bounded in size before anyone sees or saves them. Recipe JSON size capped in DB. | Code review |
| A09 | Logging & monitoring | Logins recorded (`login_events`), XP ledger (`xp_events`), Supabase auth logs, Vercel function logs. AI errors logged server-side without user data. Errors shown to users are generic. | Code review |
| A10 | SSRF | The server makes exactly one outbound call (Anthropic API) to a fixed host. No user-supplied URLs are fetched. Video links are search links built from the recipe title, opened by the user's browser. | Code review |

## Rate limiting
- **100 requests / minute / IP** on every `/api/*` route (middleware). Production uses Upstash Redis so the limit holds across all Vercel instances; without Upstash it falls back to per-instance memory (fine for localhost, **not** for production).
- **20 AI recipe requests / user / day** (cost control).
- Supabase applies its own auth rate limits (signups, logins, emails).

## Secrets
| Name | Where | Exposed to browser? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel + `.env.local` | Yes, by design. Safe because RLS protects every row. |
| `ANTHROPIC_API_KEY` | Vercel (server) + `.env.local` | **No.** Only read in `app/api/recipes/route.js` (server). |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Vercel (server) | **No.** |
| Supabase **service_role** key | **Not used anywhere.** Never add it to the app. | — |

`.env*` files are in `.gitignore`. There are no keys in the code; `.env.example` holds placeholders only.

## Known limits / to do
- Photo content isn't verified (someone could upload any picture for XP). Daily XP caps limit the abuse. Image moderation can come later.
- Meal times and "late night" popups use the device clock (cosmetic only; no rewards depend on it).
- Add Sentry or similar for error alerting once there are real users.
