# Launch Whisk: Supabase → localhost → Vercel

About 20 minutes. Do the steps in order. **Never paste keys into chat, screenshots or code.** They only go in Vercel's Environment Variables and your local `.env.local`.

---

## 1. Supabase (database + login)

1. Open your **whisk** project at supabase.com.
2. **Run the SQL.** Left menu → **SQL Editor** → **New query**.
   - Open `supabase/migrations/0001_whisk_schema.sql` from the repo on GitHub, copy all of it, paste, click **Run**. You should see "Success. No rows returned".
   - New query again → paste all of `supabase/migrations/0002_whisk_seed.sql` → **Run**. This adds the 105 shop items and 26 challenge meals.
   - Check: **Table Editor** shows `items` with 105 rows.
3. **Email confirmation.** **Authentication → Sign In / Providers → Email**: make sure **Confirm email** is ON (it's on by default).
4. **Passwords.** **Authentication → Policies / Passwords** (the name varies): minimum length **8**. If you see **Leaked password protection**, turn it on.
5. **Make confirm links work on any device.** **Authentication → Emails → Templates → Confirm signup**. Replace the link in the template with:
   ```
   <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Confirm your email</a>
   ```
   Save. (Without this step the link still works, but only in the same browser you signed up in.)
6. **URLs.** **Authentication → URL Configuration**:
   - **Site URL:** `http://localhost:3000` for now (change it to your Vercel URL in step 3.5).
   - **Redirect URLs:** add `http://localhost:3000/**`. After deploying, also add `https://YOUR-APP.vercel.app/**`.
7. **Keys.** **Project Settings → API Keys** (or **API**). You need:
   - **Project URL** (`https://xxxx.supabase.co`)
   - **anon / publishable key**. This one is safe in the browser because Row Level Security protects every row.
   - Do **not** use the `service_role` / secret key anywhere. Whisk doesn't need it.

---

## 2. Run it on your computer (localhost)

You need **Node.js 20 or newer** (nodejs.org → LTS) and **Git**.

```bash
git clone https://github.com/jaiscully1-blip/whisk.git
cd whisk
npm install
cp .env.example .env.local        # Windows: copy .env.example .env.local
```

Open `.env.local` in a text editor and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your anon/publishable key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ANTHROPIC_API_KEY=sk-ant-...      # from console.anthropic.com
```

Leave the Upstash lines empty on localhost. Then:

```bash
npm run dev
```

Open **http://localhost:3000** → **Create account** → confirm the email → you land on Home with 1,500 welcome coins.

`.env.local` is in `.gitignore`, so it can't be committed by accident.

---

## 3. Deploy on Vercel

1. vercel.com → **Add New… → Project** → **Import** `jaiscully1-blip/whisk`. Framework: **Next.js** (auto-detected).
2. Before clicking Deploy, open **Environment Variables** and add these for **Production, Preview and Development**:

   | Name | Value | Notes |
   |---|---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | your Project URL | public |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon/publishable key | public |
   | `NEXT_PUBLIC_SITE_URL` | `https://YOUR-APP.vercel.app` | set after first deploy if you don't know it yet |
   | `ANTHROPIC_API_KEY` | `sk-ant-…` | **server only**. Tick **Sensitive**. No `NEXT_PUBLIC_` prefix, so it never reaches the browser. |
   | `ANTHROPIC_MODEL` | `claude-sonnet-5-5` | optional |

3. Click **Deploy**.
4. **Rate limiting across all servers (do this before sharing the link).** In your Vercel project → **Storage** (or **Marketplace**) → **Upstash for Redis** → create a free database → **Connect** it to the whisk project. It adds the Redis env vars automatically; Whisk accepts both `UPSTASH_REDIS_REST_*` and `KV_REST_API_*`. Then **Redeploy**.
5. **Point Supabase at the live site.** Supabase → Authentication → URL Configuration → **Site URL** = `https://YOUR-APP.vercel.app`, and add `https://YOUR-APP.vercel.app/**` to Redirect URLs. In Vercel set `NEXT_PUBLIC_SITE_URL` to the same address → **Redeploy**.
6. Open the live URL, create an account, confirm the email, and check the pantry, recipes, a challenge, the shop and the Me tab.

---

## 4. After launch

- Every push to `main` redeploys automatically and runs **Build, test & scan** in GitHub Actions (npm audit, OSV-Scanner, database security tests, build). A red ❌ there means don't ship until it's fixed.
- Changing the shop or challenge meals: edit `lib/whisk3d/engine.js` or `lib/catalog/meals.js`, run `npm run seed:sql`, then run the new `0002_whisk_seed.sql` in Supabase.
- Watch Anthropic usage at console.anthropic.com. Each player gets at most 20 recipe requests a day.
