@AGENTS.md

# Homeowner Dashboard — Project Context

## What this is
A personal property management web app. Users sign up, add their property details (mortgage, bills, rental income), and track finances over time. Started as a single HTML prototype (`homeowner_dash.html`) and converted to a full-stack Next.js app.

## Stack
- **Next.js 16** (App Router, TypeScript) — full-stack framework
- **Supabase** — auth (email/password) + PostgreSQL database
- **Vercel** — deployment (auto-deploys on push to `main`)
- **Vanilla CSS** in `app/globals.css` — copied directly from the prototype, no Tailwind

## Project structure
```
app/
  dashboard/page.tsx   # Main dashboard (client component, loads/saves Supabase data)
  login/page.tsx       # Email/password sign-in
  signup/page.tsx      # Registration + email confirmation flow
  auth/callback/       # Handles Supabase email confirmation code exchange
  globals.css          # All styles — DO NOT refactor to Tailwind
proxy.ts               # Auth guard — redirects unauthenticated users to /login
lib/
  types.ts             # Shared types (DashboardState, Bill, DEFAULT_STATE, fmt())
  supabase/
    client.ts          # Browser Supabase client (use in client components)
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

## Database schema (Supabase)
```sql
properties (id, user_id, name, address, prop_val, mort_pay, mort_bal, mort_orig, rent, rent_bills, updated_at)
bills (id, property_id, name, amount, due_date, paid)
```
Row-level security is enabled — users can only access their own rows.

## Auth flow
1. User signs up → Supabase sends confirmation email
2. Email link → `/auth/callback` → exchanges code for session → redirects to `/dashboard`
3. `proxy.ts` enforces auth on all routes except `/login` and `/signup`
4. Supabase URL config: Site URL = `http://localhost:3000`, redirect URL = `http://localhost:3000/auth/callback`
   - When deploying, add the Vercel production URL to both fields in Supabase → Authentication → URL Configuration

## Key decisions & notes
- **CSS**: Keep as-is in `globals.css`. The design is intentional — warm whites, subtle borders, no dark mode. Don't introduce Tailwind.
- **Charts**: Inline SVG — no chart library dependency. The SVG charts in EquityCard and SpendingChart are static/calculated inline.
- **Analytics section removed**: Was in the prototype, stripped out to keep the dashboard lean. Will revisit when real data sources are connected.
- **State management**: `useReducer` in `app/dashboard/page.tsx`. Each save action dispatches to local state AND upserts to Supabase immediately.
- **`proxy.ts`**: Next.js 16 renamed `middleware.ts` to `proxy.ts` and the export from `middleware` to `proxy`. Don't revert this.
- **One property per user**: Current data model assumes one property per user. Bills belong to that property via `property_id`. Multi-property support is a future consideration.

## Planned features / integrations
- **Zillow API** — auto-fill estimated property value and neighborhood comps
- **Utility provider APIs** — pull electricity, water/sewer, gas bills automatically
- **Google Calendar / iCal** — surface bill due dates as reminders
- **Mortgage servicer APIs** — pull live balance, payment history, escrow
- **Google Sign-In + Apple Sign-In** — OAuth via Supabase (Auth → Providers)
- **Analytics & insights section** — re-add once real data sources feed it

## Environment variables
```
NEXT_PUBLIC_SUPABASE_URL=https://feorwntlkwhwrsehmjmd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```
Never commit `.env.local`. Add these in Vercel dashboard under Project → Settings → Environment Variables.

## Running locally
```bash
npm install
npm run dev   # http://localhost:3000
```

## Deploying
Push to `main` → Vercel auto-deploys. After any deploy, make sure the Vercel production URL is in Supabase → Authentication → URL Configuration → Redirect URLs.
