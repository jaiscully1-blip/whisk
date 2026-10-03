# Whisk

Track what's in your kitchen, cook what you have, and level up while you do it. Pantry and shopping list, AI recipes from your pantry (Claude), Fridge Raid, weekly cooking challenges that pay coins, a shop with 105 cosmetics, and a 3D Whisk mascot that wears them.

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
- `app/(app)`: Home, Pantry (+ shopping list), Cook, Compete (challenges + shop), Me (3D closet + settings)
- `app/api/recipes`: the only server API (Claude, server-side key, zod-validated)
- `middleware.js`: session refresh, route protection, nonce CSP, no-store on signed-in pages, 100 req/min/IP on `/api`
- `lib/whisk3d/engine.js`: 3D mascot, poses and all 105 items (also renders shop thumbnails)
- `supabase/migrations`: schema, RLS, server functions, storage policies, seed
- `supabase/tests/rls.test.mjs`: 51 database security/logic checks (runs in CI)
