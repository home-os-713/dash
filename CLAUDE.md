@AGENTS.md

# Homeowner Dashboard — Project Context

## Session model
This project uses a **coordination + dispatch** model:

- **Coordination session** (primary) — pulls latest, reviews partner changes, dispatches task sessions, merges PRs, keeps docs current. Does not do deep feature work.
- **Task sessions** (spawned) — focused on one workstream (e.g. Zillow integration, DB schema, UI). Retain task-specific context for follow-ups. Always start by reading context files, always end by committing doc updates.
- **Partner sessions** — same rules as task sessions. Partner's Claude sessions should read and write the context docs.

Parallel task sessions are encouraged — they don't share context so they don't interfere with each other.

## Session checklist

**Start of every session:**
1. `git pull origin main` — get latest from both collaborators
2. Read `CLAUDE.md`, `DECISION_LOG.md`, `PARTNER_BRIEFING.md`
3. Summarise current state before doing anything

**End of every session:**
1. Update relevant context docs with any decisions, new pages, new deps, or lessons learned
2. Commit and push the doc updates alongside the code changes
3. If it was a task session, flag anything the coordination session needs to know

## Starting a new session
Read these files before writing any code:
1. `CLAUDE.md` (this file) — stack, structure, gotchas
2. `DECISION_LOG.md` — product strategy and *why* things are built the way they are
3. `PARTNER_BRIEFING.md` — current page inventory and collaboration norms

These three files are the source of truth. If something isn't in them, ask before assuming.

## Keeping context up to date (mandatory)
**Every commit that adds a page, changes the stack, or makes a product/architecture decision must also update the relevant context files.** This is not optional — stale docs break the next session for both collaborators and any AI assistant picking up the work.

- New page or route → update `CLAUDE.md` (project structure) and `PARTNER_BRIEFING.md` (page inventory)
- New dependency → update `CLAUDE.md` (stack section)
- Product/strategy decision → add a round to `DECISION_LOG.md`
- DB schema change → update `CLAUDE.md` (database schema section)
- New gotcha or lesson learned → update `CLAUDE.md` (key decisions & gotchas)

## What this is
A personal property management web app. Users sign up, add their property details (mortgage, bills, rental income), and track finances over time. Started as a single HTML prototype (`homeowner_dash.html`) and converted to a full-stack Next.js app with auth, a real database, and a live deployment.

## Live URLs
- **Production:** https://homeowner-dashboard-woad.vercel.app
- **Local dev:** http://localhost:3000
- **GitHub repo:** https://github.com/home-os-713/dash
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
1. Clone the repo: `git clone https://github.com/home-os-713/dash.git`
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
- **Tailwind CSS v4** + **shadcn/ui** + **recharts** + **lucide-react** — used in `/dashboard` (main product)
- **Fraunces** (display serif) + **Inter** (UI/body sans) via `next/font/google` — loaded in `app/layout.tsx`, mapped onto Tailwind's `font-serif`/`font-sans` tokens in `globals.css` `@theme`. `font-serif` → Fraunces, default body + `font-sans` → Inter. (Round 10)
- **@dnd-kit/core** + **@dnd-kit/sortable** + **@dnd-kit/utilities** — drag-to-reorder on portfolio page

## Project structure
```
app/
  dashboard/page.tsx             # Portfolio overview — real properties from Supabase, falls back to mock
  dashboard/[id]/page.tsx        # Property detail — UUID id → real data, "phoenix"/"pvr" → mock demo
  dashboard/[id]/financials/page.tsx
  dashboard/[id]/bookings/page.tsx
  dashboard/inbox/page.tsx
  legacy/dashboard/page.tsx      # Original single-property dashboard — kept for reference only
  legacy/homeos/page.tsx         # Partner's prototype page — kept for reference only
  login/page.tsx
  signup/page.tsx
  auth/callback/             # Handles Supabase email confirmation code exchange
  api/
    property-lookup/route.ts # Rentcast API proxy — fetches estimated property value by address
    globals.css              # All styles for /dashboard — DO NOT refactor to Tailwind
proxy.ts                     # Auth guard (Next.js 16: proxy.ts, export proxy, not middleware)
lib/
  types.ts                   # DashboardState, Bill types for /dashboard
  v0/
    mockData.ts              # All mock data + helpers for /v0 demo mode — DO NOT delete
    db.ts                    # DbProperty, DbBill types + Supabase query helpers for /v0
  utils.ts                   # cn() helper for Tailwind class merging
  supabase/
    client.ts                # Browser Supabase client (use in 'use client' components)
    server.ts                # Server Supabase client (use in route handlers / server components)
supabase/
  001_multi_property.sql     # Run this in Supabase SQL Editor to enable multi-property
  002_sort_order.sql         # Adds sort_order column to properties for drag-to-reorder
components/
  ui/card.tsx  ui/badge.tsx  # shadcn components used by /v0 and /homeos
  ThemeToggle.tsx            # light/dark switch — rendered in every page header (defaults to light)
  PropertyHeader.tsx  MetricsGrid.tsx  MortgageCard.tsx  EquityCard.tsx
  BillsList.tsx  RentalCard.tsx  SpendingChart.tsx  Modal.tsx   # /dashboard only
```

## Database schema (Supabase project: feorwntlkwhwrsehmjmd)
```sql
-- Core tables (extended for multi-property)
properties (id, user_id, name, address, location, type, prop_val, mort_pay, mort_bal, mort_orig, mort_rate, rent, rent_bills, income, occupancy, sort_order, updated_at)
bills (id, property_id, name, amount, due_date, paid, category, autopay, status, status_label, source)

-- v0 tables (added in migration 001)
bookings (id, property_id, platform, guest, check_in, check_out, nights, gross, platform_fee, cleaning_fee, taxes, net, status, created_at)
utility_months (id, property_id, month, electric, water, gas, solar, budget)
action_items (id, property_id, kind, priority, label, detail, category, due_in, amount, cta_label, created_at)
```
Row-level security is enabled — users can only access their own rows.
**Multi-property is now supported** — unique constraint on user_id was dropped in migration 001.
Migration SQL is at `supabase/001_multi_property.sql` — run in Supabase → SQL Editor before using /v0 with real data.

## Auth flow
1. User signs up → `emailRedirectTo` is set to `window.location.origin + /auth/callback` (works on both localhost and prod)
2. Email link → `/auth/callback` → exchanges code for session → redirects to `/dashboard`
3. `proxy.ts` enforces auth on all routes except `/login` and `/signup`
4. Supabase URL Configuration (Authentication → URL Configuration):
   - **Site URL:** `https://homeowner-dashboard-woad.vercel.app`
   - **Redirect URLs:** `http://localhost:3000/auth/callback`, `https://homeowner-dashboard-woad.vercel.app/auth/callback`
   - **When adding a new deploy URL, always add it to Supabase redirect URLs or auth will break**

## Key decisions & gotchas
- **Theme = light "Warm Editorial" (current)**: `/dashboard`, all its sub-pages, AND `login`/`signup` use the light theme (see DECISION_LOG Rounds 8–9). Tokens: page bg `#FAF9F6`, cards `#fff`, text `#2B2B28`, accent olive `#5A6247` (hover `#4A5239`), warm hairline borders (`#EAE8E1`/`#E2DFD6`/`#D8D5CB`). **Do NOT reintroduce `#2B2B2B`/`#353530`/`#4B5436`/`#C7BBA3`, the legacy `#1a1a18`/`#888780`, or `text-white` on light surfaces** — all retired. Status colors use `-600/-500` shades for contrast on white. (recharts tooltip keeps `#2B2B2B` text on `#fff` bg — intentional, dark-on-light tooltip.)
- **Dark mode (Round 11)**: the whole warm-neutral palette is routed through **semantic CSS-variable tokens** defined in `globals.css` `@theme` + `:root`/`.dark` — `paper`/`surface`/`ink`/`ink2`/`muted`/`faint`/`faint2`/`line`/`line2`/`line3`/`subtle`/`accent`/`accentfg`/`accentdark`/`accentlight`/`tint`. Tailwind utilities are now semantic (`bg-surface`, `text-ink`, `border-line`, `text-accentfg`, `bg-accent`, etc.) — **stop hardcoding `[#hex]` palette values; use the tokens** so both themes stay in sync. **Light values are identical to the old hexes** (light mode is unchanged). A `.dark` class on `<html>` swaps everything. **Defaults to light** — the inline no-flash script in `app/layout.tsx` applies dark pre-paint only when `localStorage.theme === 'dark'` (dark is opt-in, not system-following, so first load is the familiar light theme). `components/ThemeToggle.tsx` is a **header control rendered in every page header** (portfolio, inbox, property detail, financials, bookings) that flips + persists the choice. Status text shades are re-tuned lighter inside `.dark`. recharts internals (grid/axis) are retargeted via `.dark .recharts-*` rules; SVG `<text>` fills + tooltip `contentStyle` use `var(--…)` inline. All dark pairs verified AA (ink 14.5, muted 6.7, faint 5.2, forest 7.6, ochre 8.1, brick 4.5 on surface). `<html>` carries `suppressHydrationWarning` because the pre-paint script mutates its class.
- **Earthy status palette (Round 10)**: the semantic green/amber/red Tailwind tokens are remapped in `globals.css` `@theme` to muted editorial tones — `emerald` → forest (`#7E9F88`/`#5C7E68`/`#3F6A4E`), `amber` → ochre (`#C39A55`/`#A9792F`/`#855A20`), `red` → brick (`#C2675A`/`#A8463B`/`#97362D`) at shades 400/500/600. So existing `text-emerald-600`/`bg-amber-500/15`/`border-red-500` classes inherit the new tones with zero per-file churn. Text shades (600) verified AA on white (forest 6.2:1, ochre 6.0:1, brick 5.8:1). The utility AreaChart series (electric/water/gas) and equity donut were recolored to ochre/slate-teal (`#5E7C88`)/clay (`#B0654A`) + brand olive to match. **Don't reintroduce bright `emerald-`/`amber-`/`red-` hexes or `#f59e0b`/`#3b82f6`/`#f97316`/`#10b981`.**
- **Muted text ramp is AA-tuned (Round 9)**: for *text*, use `#57554F` (secondary, 7.5:1), `#6E6B64` (muted, 5.3:1), `#78756E` (faint-but-legible, 4.6:1). `#8A8780` (3.6:1) and `#A8A59E` (2.5:1) FAIL WCAG AA for small text — use them ONLY for decorative bits (status dots, dividers, icon glyphs), never labels/values. Numeric displays carry `.tnum` (tabular figures). Keyboard focus is a global `:focus-visible` olive ring in `globals.css` — never add `focus:outline-none` without a `:focus-visible` replacement.
- **Polish utilities in `globals.css`**: `.shadow-soft` (layered card shadow), `.card-lift` (hover lift on interactive cards), `.animate-rise` + `.stagger` (entrance fade/rise, staggered children), `.animate-modal`/`.animate-overlay` (modal pop-in). All respect `prefers-reduced-motion`. The shadcn `<Card>` (`components/ui/card.tsx`) ships `shadow-soft` by default. Reuse these instead of hand-rolling shadows/animations.
- **CSS split**: `app/legacy/dashboard` uses vanilla CSS classes in `globals.css` (the `.dash`/`.card`/`.metric` rules). `/dashboard` (main product) uses Tailwind v4 + shadcn. Don't mix them; don't refactor the legacy vanilla rules to Tailwind.
- **Charts**: `/dashboard` uses inline SVG — no chart library. `/v0` uses recharts (AreaChart, BarChart).
- **Analytics section**: Removed from the prototype intentionally — keeping the dashboard lean. Revisit once real data sources are connected.
- **State management**: `useReducer` in `app/dashboard/page.tsx`. Each save dispatches to local state AND upserts to Supabase immediately — no separate save button.
- **`proxy.ts`**: Next.js 16 renamed `middleware.ts` → `proxy.ts` and the export `middleware` → `proxy`. Don't revert or rename.
- **Email redirect**: `signup/page.tsx` uses `window.location.origin` for the confirmation redirect — this is intentional so it works on both localhost and production without hardcoding.
- **Vercel Hobby plan**: Jaime's account. Partners collaborate via GitHub — push access to the repo triggers deploys. Vercel Pro needed for shared team dashboards.
- **Shared DB**: localhost and production both point to the same Supabase instance — data created locally shows up in production and vice versa.
- **Multi-property**: The `user_id` unique constraint was dropped in migration 001. `/dashboard` still uses the oldest property per user (`.order('updated_at', ascending: true).limit(1)`). New properties created via `/v0` get fresh rows.
- **UUID routing in /v0**: `app/v0/[id]/page.tsx` uses a UUID regex to detect real DB IDs vs. demo IDs ("phoenix"/"pvr"). UUID → Supabase query; demo slug → mock data. This lets the demo keep working even after real data is added.
- **Rentcast (Zillow replacement)**: Zillow's public API shut down in 2021. `/api/property-lookup` proxies to Rentcast API for property value estimates. Requires `RENTCAST_API_KEY` (server-only env var). Without the key the lookup button returns a 503 and the user fills in value manually.
- **Mock data preservation**: `lib/v0/mockData.ts` must not be deleted — it powers the demo mode for users with no real properties and the /inbox and /financials pages which aren't yet wired to real data.
- **Drag-to-reorder**: Portfolio page uses `@dnd-kit` with `rectSortingStrategy` (handles 2-column grid). Grip handle appears on hover at card top-left. Order persists to `sort_order` column in Supabase. `listUserProperties` gracefully falls back to `updated_at` ordering if `sort_order` column doesn't exist yet (migration 002 not yet run).
- **Rentcast caching**: `/api/property-lookup` returns a dev mock in `NODE_ENV !== 'production'` to avoid burning free-tier credits during development. In production, responses are cached for 30 days via `unstable_cache`.
- **RealPropertyDetail**: Fully redesigned — equity SVG donut, mortgage progress bar, spending breakdown bars, bills list with Add bill modal, Edit property and Edit mortgage modals. All saves are optimistic (local state updated immediately, Supabase updated in background).
- **After every change session**: provide user a summary + localhost link to the relevant page. This is a collaboration norm.

## Environment variables
```
NEXT_PUBLIC_SUPABASE_URL=https://feorwntlkwhwrsehmjmd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<get from Supabase dashboard → Settings → API → anon public>
RENTCAST_API_KEY=<get from https://app.rentcast.io → API Keys; free tier = 50 req/mo>
```
Never commit `.env.local`. Set all three in Vercel → Project → Settings → Environment Variables.
`RENTCAST_API_KEY` is server-only (no `NEXT_PUBLIC_` prefix) — kept out of client bundles.

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
- **Merge /dashboard and /homeos into one page** — take the best UI/features from /homeos and the real Supabase data layer from /dashboard. Once merged, /homeos can be deleted. Requires agreeing on styling direction (Tailwind vs vanilla CSS) and extending the DB schema for multi-property support.
- **Vercel Pro** — if partner needs shared Vercel dashboard access

## Reasoning history
@DECISION_LOG.md — strategy and design iteration log for `/v0`. Read before extending or redesigning `/v0`.
