@AGENTS.md

# Homeowner Dashboard — Project Context

## What this is
A personal property management web app. Users sign up, add their property details (mortgage, bills, rental income), and track finances over time. Started as a single HTML prototype (`homeowner_dash.html`) and converted to a full-stack Next.js app with auth, a real database, and a live deployment.

## Current status
All four phases of the initial build are complete:
- ✅ Phase 1 — GitHub repo initialized, prototype committed
- ✅ Phase 2 — Prototype converted to Next.js with React components
- ✅ Phase 3 — Supabase auth + PostgreSQL data persistence wired up
- ✅ Phase 4 — Deployed to Vercel (auto-deploys on push to `main`)

The app is live and working end-to-end: sign-up → email confirmation → dashboard → edit values → persist across refresh.

## How to continue iterating
1. Make changes locally, run `npm run dev` to verify
2. Push to `main` → Vercel auto-deploys within ~1 minute
3. If you change the DB schema, run the SQL in Supabase → SQL Editor and update the schema section below
4. If you add a new Vercel env var, also add it locally in `.env.local`

## Stack
- **Next.js 16** (App Router, TypeScript) — full-stack framework
- **Supabase** — auth (email/password) + PostgreSQL database
- **Vercel** — deployment (auto-deploys on push to `main`)
- **Vanilla CSS** in `app/globals.css` — copied directly from the prototype, no Tailwind

## Project structure
```
app/
  dashboard/page.tsx   # Main dashboard — state management + all Supabase reads/writes
  login/page.tsx       # Email/password sign-in
  signup/page.tsx      # Registration + email confirmation flow
  auth/callback/       # Handles Supabase email confirmation code exchange
  globals.css          # All styles — DO NOT refactor to Tailwind
proxy.ts               # Auth guard — redirects unauthenticated users to /login
lib/
  types.ts             # Shared types: DashboardState, Bill, DEFAULT_STATE, fmt()
  supabase/
    client.ts          # Browser Supabase client (use in 'use client' components)
    server.ts          # Server Supabase client (use in server components/routes)
components/
  PropertyHeader.tsx   # Property name, address, edit modal
  MetricsGrid.tsx      # 4 overview metric cards
  MortgageCard.tsx     # Mortgage details + progress bar
  EquityCard.tsx       # SVG donut chart
  BillsList.tsx        # Bills list + add bill modal
  RentalCard.tsx       # Rental income breakdown
  SpendingChart.tsx    # Horizontal bar chart
  Modal.tsx            # Reusable modal wrapper
```

## Database schema (Supabase project: feorwntlkwhwrsehmjmd)
```sql
properties (id, user_id, name, address, prop_val, mort_pay, mort_bal, mort_orig, rent, rent_bills, updated_at)
bills (id, property_id, name, amount, due_date, paid)
```
Row-level security is enabled — users can only access their own rows.
One property per user for now. Multi-property support is a future consideration.

## Auth flow
1. User signs up → Supabase sends confirmation email
2. Email link → `/auth/callback` → exchanges code for session → redirects to `/dashboard`
3. `proxy.ts` enforces auth on all routes except `/login` and `/signup`
4. Supabase URL Configuration (Authentication → URL Configuration):
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`, `<vercel-production-url>/auth/callback`
   - **When adding a new deploy URL, always add it to Supabase redirect URLs or auth will break**

## Key decisions & gotchas
- **CSS**: Keep as-is in `globals.css`. Warm whites, subtle borders, no dark mode. Don't introduce Tailwind.
- **Charts**: Inline SVG — no chart library. EquityCard and SpendingChart compute values inline.
- **Analytics section**: Removed from the prototype intentionally — keeping the dashboard lean. Revisit once real data sources are connected.
- **State management**: `useReducer` in `app/dashboard/page.tsx`. Each save dispatches to local state AND upserts to Supabase immediately — no separate save button.
- **`proxy.ts`**: Next.js 16 renamed `middleware.ts` → `proxy.ts` and the export `middleware` → `proxy`. Don't revert or rename.
- **Vercel Hobby plan**: Jaime's account. Partners collaborate via GitHub — push access to the repo is enough to trigger deploys. Vercel Pro needed for shared team dashboards.

## Environment variables
```
NEXT_PUBLIC_SUPABASE_URL=https://feorwntlkwhwrsehmjmd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key — in .env.local locally, in Vercel dashboard for prod>
```
Never commit `.env.local`.

## Running locally
```bash
npm install
npm run dev   # http://localhost:3000
```

## Deploying
Push to `main` → Vercel auto-deploys. No manual steps needed.
After adding a new custom domain or Vercel preview URL, add it to Supabase → Authentication → URL Configuration → Redirect URLs.

## Planned features / integrations
- **Google + Apple Sign-In** — OAuth via Supabase (Auth → Providers); Apple requires Apple Developer account
- **Zillow API** — auto-fill estimated property value and neighborhood comps
- **Utility provider APIs** — pull electricity, water/sewer, gas bills automatically
- **Google Calendar / iCal** — surface bill due dates as reminders
- **Mortgage servicer APIs** — pull live balance, payment history, escrow
- **Analytics & insights section** — re-add once real data sources feed it
- **Multi-property support** — current model is one property per user
