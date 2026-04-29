@AGENTS.md

# Homeowner Dashboard — Project Context

## What this is
A personal property management web app. Users sign up, add their property details (mortgage, bills, rental income), and track finances over time. Started as a single HTML prototype (`homeowner_dash.html`) and converted to a full-stack Next.js app with auth, a real database, and a live deployment.

## Live URLs
- **Production:** https://homeowner-dashboard-woad.vercel.app
- **Local dev:** http://localhost:3000
- **GitHub repo:** https://github.com/jaimegarciae/homeowner-dashboard
- **Supabase project:** https://supabase.com/dashboard/project/feorwntlkwhwrsehmjmd
- **Vercel dashboard:** https://vercel.com (Jaime's Hobby account)

## Current status
All four phases of the initial build are complete and verified working:
- ✅ Phase 1 — GitHub repo initialized, prototype committed
- ✅ Phase 2 — Prototype converted to Next.js with React components
- ✅ Phase 3 — Supabase auth + PostgreSQL data persistence wired up
- ✅ Phase 4 — Deployed to Vercel, end-to-end tested on production

The app is fully live: sign-up → email confirmation → dashboard → edit values → persists across sessions and devices.

## Getting started (new collaborator)
1. Clone the repo: `git clone https://github.com/jaimegarciae/homeowner-dashboard.git`
2. Install deps: `npm install`
3. Create `.env.local` in the project root:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://feorwntlkwhwrsehmjmd.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<get this from Jaime or Supabase dashboard → Settings → API>
   ```
4. Run locally: `npm run dev` → http://localhost:3000
5. Push to `main` → Vercel auto-deploys to production (~1 min)

## How to continue iterating
1. Make changes locally, run `npm run dev` to verify
2. Push to `main` → Vercel auto-deploys within ~1 minute
3. If you change the DB schema, run the SQL in Supabase → SQL Editor and update the schema section below
4. If you add a new environment variable, add it to `.env.local` locally AND in Vercel → Project → Settings → Environment Variables

## Stack
- **Next.js 16** (App Router, TypeScript) — full-stack framework
- **Supabase** — auth (email/password) + PostgreSQL database
- **Vercel** — deployment (auto-deploys on push to `main`)
- **Vanilla CSS** in `app/globals.css` — used in `/dashboard`. DO NOT refactor to Tailwind
- **Tailwind CSS v4** + **shadcn/ui** + **recharts** + **lucide-react** — used in `/homeos` (partner's prototype page)

## Project structure
```
app/
  dashboard/page.tsx   # Main dashboard — state management + all Supabase reads/writes
  homeos/page.tsx      # Partner's prototype page — multi-property vision, all mock data, Tailwind + recharts
  login/page.tsx       # Email/password sign-in
  signup/page.tsx      # Registration + email confirmation flow
  auth/callback/       # Handles Supabase email confirmation code exchange
  globals.css          # All styles for /dashboard — DO NOT refactor to Tailwind
proxy.ts               # Auth guard — redirects unauthenticated users to /login
lib/
  types.ts             # Shared types: DashboardState, Bill, DEFAULT_STATE, fmt()
  utils.ts             # cn() helper for Tailwind class merging (used by /homeos)
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
  ui/
    card.tsx           # shadcn Card component (used by /homeos)
    badge.tsx          # shadcn Badge component (used by /homeos)
```

## Database schema (Supabase project: feorwntlkwhwrsehmjmd)
```sql
properties (id, user_id, name, address, prop_val, mort_pay, mort_bal, mort_orig, rent, rent_bills, updated_at)
bills (id, property_id, name, amount, due_date, paid)
```
Row-level security is enabled — users can only access their own rows.
One property per user for now. Multi-property support is a future consideration.

## Auth flow
1. User signs up → `emailRedirectTo` is set to `window.location.origin + /auth/callback` (works on both localhost and prod)
2. Email link → `/auth/callback` → exchanges code for session → redirects to `/dashboard`
3. `proxy.ts` enforces auth on all routes except `/login` and `/signup`
4. Supabase URL Configuration (Authentication → URL Configuration):
   - **Site URL:** `https://homeowner-dashboard-woad.vercel.app`
   - **Redirect URLs:** `http://localhost:3000/auth/callback`, `https://homeowner-dashboard-woad.vercel.app/auth/callback`
   - **When adding a new deploy URL, always add it to Supabase redirect URLs or auth will break**

## Key decisions & gotchas
- **CSS split**: `/dashboard` uses vanilla CSS in `globals.css` (warm whites, no dark mode) — keep as-is. `/homeos` uses Tailwind v4. Don't mix them.
- **Charts**: `/dashboard` uses inline SVG — no chart library. `/homeos` uses recharts (AreaChart, BarChart).
- **Analytics section**: Removed from the prototype intentionally — keeping the dashboard lean. Revisit once real data sources are connected.
- **State management**: `useReducer` in `app/dashboard/page.tsx`. Each save dispatches to local state AND upserts to Supabase immediately — no separate save button.
- **`proxy.ts`**: Next.js 16 renamed `middleware.ts` → `proxy.ts` and the export `middleware` → `proxy`. Don't revert or rename.
- **Email redirect**: `signup/page.tsx` uses `window.location.origin` for the confirmation redirect — this is intentional so it works on both localhost and production without hardcoding.
- **Vercel Hobby plan**: Jaime's account. Partners collaborate via GitHub — push access to the repo triggers deploys. Vercel Pro needed for shared team dashboards.
- **Shared DB**: localhost and production both point to the same Supabase instance — data created locally shows up in production and vice versa.

## Environment variables
```
NEXT_PUBLIC_SUPABASE_URL=https://feorwntlkwhwrsehmjmd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<get from Supabase dashboard → Settings → API → anon public>
```
Never commit `.env.local`. The same vars are set in Vercel → Project → Settings → Environment Variables.

## Running locally
```bash
npm install
npm run dev   # http://localhost:3000
```

## Deploying
Push to `main` → Vercel auto-deploys. No manual steps needed.
After adding a new custom domain or Vercel preview URL, add `/auth/callback` for that URL in Supabase → Authentication → URL Configuration → Redirect URLs.

## Planned features / integrations
- **Google + Apple Sign-In** — OAuth via Supabase (Auth → Providers); Apple requires Apple Developer account
- **Zillow API** — auto-fill estimated property value and neighborhood comps
- **Utility provider APIs** — pull electricity, water/sewer, gas bills automatically
- **Google Calendar / iCal** — surface bill due dates as reminders
- **Mortgage servicer APIs** — pull live balance, payment history, escrow
- **Email integration (Gmail/Outlook)** — scan property-related emails (utility bills, HOA notices, contractor quotes, mortgage statements) and extract action items + due dates. Gmail API fetches emails → Claude API parses unstructured content into structured data (amount, due date, action required) → writes to Supabase. Implement as a Next.js API route or Supabase edge function.
- **Analytics & insights section** — re-add once real data sources feed it
- **Multi-property support** — current model is one property per user. `/homeos` prototypes this with mock data (2 properties: Phoenix AZ + Puerto Vallarta MX)
- **Connect /homeos to real data** — currently all hardcoded mock data; needs Supabase integration once DB schema supports multi-property
- **Vercel Pro** — if partner needs shared Vercel dashboard access
