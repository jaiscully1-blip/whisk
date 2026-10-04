# Whisk

Track what's in your kitchen, cook what you have, and level up while you do it. Pantry and an aisle-sorted shopping list, receipt and barcode scanning, real recipes from the web matched to your pantry (each links to its source) plus unlimited pantry-based searches, defrost reminders for frozen meat, Fridge Raid, weekly cooking challenges that pay coins, daily quests, cuisine bingo, a cuisine passport, a weekly goal, streak freezes, Whisk Wrapped, a shop with 105 cosmetics, and a 3D Whisk mascot that wears them.

**Stack:** Next.js 15 (App Router) · Supabase (Postgres, Auth, Storage, RLS) · Anthropic Claude API · three.js · Vercel · Upstash Redis (rate limits)

- **Launch steps:** [LAUNCH.md](./LAUNCH.md)
- **Security review (OWASP Top 10, RLS, CSP, rate limits, secrets):** [SECURITY.md](./SECURITY.md)

## Local dev
```bash
npm install
cp .env.example .env.local   # fill in Supabase + Anthropic keys
npm run dev
```

## Layout
- `app/(auth)`: sign up / log in / check email · `app/auth/*`: email confirm + sign out
- `app/(app)`: Home (goal ring, daily quest, savings), Pantry (+ scan, shopping list), Cook, Compete (challenges, bingo, shop), Me (3D closet, passport, macros, settings), `/me/wrapped`
- `app/api/receipt`: Claude reads receipt photos (key kept server-side, output checked with zod) · `app/api/barcode`: Open Food Facts lookup
- `lib/recipes/web.json` + `match.js`: the real recipe catalog and pantry matching; `npm run seed:recipes` regenerates `0005_web_recipes_seed.sql`
- `middleware.js`: session refresh, route protection, nonce CSP, no-store on signed-in pages, 100 req/min/IP on `/api`
- `lib/whisk3d/engine.js`: 3D mascot, poses and all 105 items (also renders shop thumbnails)
- `supabase/migrations`: schema, RLS, server functions, storage policies, seed
- `supabase/tests/rls.test.mjs`: 120 database security and logic checks (runs in CI)
- `e2e/`: local Supabase/Anthropic stand-in plus a Playwright walk through every screen (45 checks)

## Credits

Passport stamp art is [Twemoji](https://github.com/jdecked/twemoji) (graphics licensed CC-BY 4.0), served from `public/stamps/`. Country dishes and symbols: Wikipedia "National dish" and national cuisine pages.

## Backend & live search

- **Activity log:** `app_events` (one row per tap / pick / search / page view), written through `log_events` only for players who said yes to "Help improve Whisk" in the privacy popup. Saying no deletes their rows. Typed text is never recorded, except dish searches.
- **Backend dashboard:** `/admin`, for accounts with `profiles.is_admin = true` (set by hand in SQL). Totals, actions per day, pages, most-pressed buttons, top searches and a live activity feed.
- **Free dish search:** `lib/dishes/data.json` (1,787 dishes, all 193 countries; also in the `dishes` table) searched by `lib/dishes/search.js` — countries in any form ("albanian food"), dishes, sauces, ingredients. Not in the list → Wikipedia (free, food articles only). `/api/dish-info` gives ingredients and the most-watched YouTube video that matches the dish (YouTube Data API free tier, cached a week, greyed out when none). No AI, nothing billed. Any listed dish can be logged; the 10th meal from a country stamps it and pays 5,000 coins (`passport_stamps`, once per country).
