# Launch Whisk: Supabase → localhost → Vercel

About 20 minutes. Do the steps in order. **Never paste keys into chat, screenshots or code.** They only go in Vercel's Environment Variables and your local `.env.local`.

---

## 1. Supabase (database + login)

1. Open your **whisk** project at supabase.com.
2. **Run the SQL.** Left menu → **SQL Editor** → **New query**.
   - **Shortcut (already ran 0001 + 0002):** run the files in `supabase/setup/` in number order, each in its own new query: `1-…` to `4-…`, then `5-check.sql` (every column should say **true**), then `6-one-phone-play.sql`, `7a-…`, `7b-…`, `7c-…` and `7d-check.sql` (every column **true**). Then `9-bingo-weekly.sql` (bingo resets with the challenges) , `10-cookoff-and-invites.sql` (Cook Off + Invite a friend) and `11-cookoff-judges.sql` (judges who only vote). (`8-…` is only for Apple Pay, see 3c.)
   - Open `supabase/migrations/0001_whisk_schema.sql` from the repo on GitHub, copy all of it, paste, click **Run**. You should see "Success. No rows returned".
   - New query again → paste all of `supabase/migrations/0002_whisk_seed.sql` → **Run**. This adds the 105 shop items and 26 challenge meals.
   - New query again → paste all of `supabase/migrations/0003_whisk_features.sql` → **Run**. This adds daily quests, cuisine bingo, streak freezes, the weekly goal, takeout price and meal nutrition. (Already ran 0001 and 0002? Just run 0003. It is safe to run more than once.)
   - New query → paste all of `supabase/migrations/0004_whisk_web_recipes.sql` → **Run**. This adds real web recipes, defrost tracking, meal ratings, pantry-based challenges, the new popup timing and remembered inputs.
   - New query → paste all of `supabase/migrations/0005_web_recipes_seed.sql` → **Run**. This loads the 40 real recipes. Run 0004 before 0005.
   - New query → paste all of `supabase/migrations/0006_whisk_coins_reset.sql` → **Run**. This adds coin packs, Bitcoin payments, the July 18 gift and the two-step reset.
   - New query → paste all of `supabase/migrations/0007_bingo_five_days.sql` → **Run**. Cuisine bingo now resets every 5 days.
   - New query → paste all of `supabase/migrations/0008_passport_countries.sql` → **Run**. Meals remember their country for the 193-country passport. (Run it after 0005, which seeds each recipe's country.)
   - New query → paste all of `supabase/migrations/0009_local_calendar.sql` → **Run**. Days, streaks and daily rewards follow each player's own time zone (after they allow it in the cookie popup).
   - New query → paste all of `supabase/migrations/0010_hockey_helmet.sql` → **Run**. The Chef Hat in the shop becomes a Hockey Helmet.
   - New query → paste all of `supabase/migrations/0011_activity_onboarding_admin.sql` → **Run**. Adds the activity log (only for players who allow "Help improve Whisk"), the first-run tour flag and the backend dashboard.
   - New query → paste all of `supabase/migrations/0012_dishes_and_stamp_coins.sql` → **Run**. Adds the list of 1,787 dishes from all 193 countries (so any dish can be logged toward its country's stamp) and pays 5,000 coins per passport stamp.
   - Make yourself an admin so you can open **/admin** (the backend dashboard). In a new query, with your email:
     `update public.profiles set is_admin = true where id = (select id from auth.users where email = 'YOUR-EMAIL');`
   - Check: **Table Editor** shows `items` with 105 rows.
3. **One phone, no account (the only way in).**
   - Run `supabase/setup/6-one-phone-play.sql` (reset no longer needs a password).
   - **Authentication → Sign In / Providers** → turn on **Allow anonymous sign-ins** → Save. "Start playing" makes a private game for that phone; Row Level Security still keeps every player's data to themselves. Supabase limits new games to 30 an hour per network by default.
   - Admin: open the live app on your phone → **Start playing** → **Me → Settings** shows your **Player ID**. In SQL Editor: `update public.profiles set is_admin = true where id = 'PASTE-PLAYER-ID' returning id, is_admin;`
   - Google sign-in, email templates and passwords aren't used. You can leave those settings alone.
4. **Email confirmation (not used any more; leave as is).** **Authentication → Sign In / Providers → Email**: make sure **Confirm email** is ON (it's on by default).
4. **Passwords.** **Authentication → Policies / Passwords** (the name varies): minimum length **8**. If you see **Leaked password protection**, turn it on.
5. **Make confirm links work on any device.** **Authentication → Emails → Templates → Confirm signup**. Replace the link in the template with:
   ```
   <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Confirm your email</a>
   ```
   Save. (Without this step the link still works, but only in the same browser you signed up in.)
   Then open the **Magic Link** template and add this line so the reset code shows up in the email:
   ```
   <p>Your Whisk code: <b>{{ .Token }}</b></p>
   ```
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
YOUTUBE_API_KEY=...               # free, see 3b (optional)
# ANTHROPIC_API_KEY=               # leave empty: costs money (only receipt photos use it)
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
   | `YOUTUBE_API_KEY` | from Google Cloud (see 3b) | **server only**, free. Tick **Sensitive**. Optional: without it the YouTube button opens a YouTube search. |
   | `ANTHROPIC_API_KEY` | leave it out for now | Costs money per use. The only thing that uses it is reading receipt photos; without it, receipt scanning says it isn't set up and everything else works. Dish search does **not** use it. |

3. Click **Deploy**.
4. **Rate limiting across all servers (do this before sharing the link).** In your Vercel project → **Storage** (or **Marketplace**) → **Upstash for Redis** → create a free database → **Connect** it to the whisk project. It adds the Redis env vars automatically; Whisk accepts both `UPSTASH_REDIS_REST_*` and `KV_REST_API_*`. Then **Redeploy**.
5. **Point Supabase at the live site.** Supabase → Authentication → URL Configuration → **Site URL** = `https://YOUR-APP.vercel.app`, and add `https://YOUR-APP.vercel.app/**` to Redirect URLs. In Vercel set `NEXT_PUBLIC_SITE_URL` to the same address → **Redeploy**.
6. Open the live URL, create an account, confirm the email, and check the pantry, Cook, a challenge, the shop and the Me tab.

---

## 3b. YouTube button (free)

Dish search is free: it uses Whisk's own dish list (all 193 countries) and Wikipedia. To make each dish's YouTube button open the most-watched video that's really about that dish (greyed out when there isn't one):

1. console.cloud.google.com → create a project (free, no card needed for this API) → **APIs & Services → Library** → **YouTube Data API v3** → **Enable**.
2. **APIs & Services → Credentials → Create credentials → API key**. Click the key → **API restrictions → Restrict key → YouTube Data API v3** → Save.
3. Vercel → Environment Variables → `YOUTUBE_API_KEY` = that key (Sensitive) → **Redeploy**.

Free quota is 10,000 units a day; a dish nobody has opened yet costs 101, so about 99 new dishes a day. Every answer is cached for a week and shared by all players. When the quota runs out, the button falls back to a YouTube search link until midnight Pacific; nothing is ever billed.

## 3c. Coin packs with Apple Pay (Stripe) — optional, do it when you want to sell coins

Players pay with **Apple Pay** (iPhone/Safari), Google Pay or a card on Stripe's own checkout page. No monthly fee; Stripe keeps about 2.9% + 30¢ of each sale. Until this is set up, the Get coins buttons say "isn't set up yet" and nothing breaks.

1. stripe.com → create an account → finish **Activate payments** (business details + your bank account for payouts).
2. **Settings → Payment methods**: make sure **Apple Pay** and **Google Pay** are on (they are by default for Checkout).
3. **Developers → API keys**: copy the **Secret key** (`sk_live_…`). Vercel → Environment Variables → `STRIPE_SECRET_KEY` (Sensitive).
4. **Developers → Webhooks → Add endpoint**: URL `https://YOUR-APP.vercel.app/api/coins/webhook`, events **checkout.session.completed** and **checkout.session.async_payment_succeeded** → Add. Open it and reveal the **Signing secret** (`whsec_…`):
   - Vercel → `STRIPE_WEBHOOK_SECRET` = that value (Sensitive) → **Redeploy**.
   - Supabase SQL Editor → run `supabase/setup/8-apple-pay-secret.sql` with the secret pasted in place of the placeholder.
5. Test with Stripe's **Test mode** keys first (`sk_test_…` + the test webhook's `whsec_…`) and card 4242 4242 4242 4242, then switch both to live.

Selling coins to kids: the Get coins sheet says "Ask a parent before buying". Stripe's own rules apply to refunds and disputes.

## 4. After launch

- Every push to `main` redeploys automatically and runs **Build, test & scan** in GitHub Actions (npm audit, OSV-Scanner, database security tests, build). A red ❌ there means don't ship until it's fixed.
- Changing the shop or challenge meals: edit `lib/whisk3d/engine.js` or `lib/catalog/meals.js`, run `npm run seed:sql`, then run the new `0002_whisk_seed.sql` in Supabase.
- Watch Anthropic usage at console.anthropic.com. It is only used to read receipt photos (max 20 scans per player per day). Recipes come from `lib/recipes/web.json`; add more real ones there and run `npm run seed:recipes`, then run the new `0005_web_recipes_seed.sql`.
