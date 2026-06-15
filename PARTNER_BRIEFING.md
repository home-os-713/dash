# Homeowner Dashboard — Partner Briefing

> **Live app:** https://homeowner-dashboard-woad.vercel.app
> **GitHub repo:** https://github.com/home-os-713/dash
> **Supabase:** https://supabase.com/dashboard/project/feorwntlkwhwrsehmjmd

---

## What we built

A property management web app for STR hosts. Users sign up, add their properties, track bills and finances across their portfolio, and see what needs attention. Auth is handled by Supabase; all data persists across sessions and devices.

### Page inventory

| Route | What it is |
|---|---|
| **`/dashboard`** | **Main product.** Investor-first **portfolio overview** headline (total value, equity, net monthly cash flow, blended return as stat tiles → links to analytics; bills/autopay demoted to a small strip). Real properties from Supabase, falls back to demo data when none exist. Multi-property. Add property modal with address lookup. (Round 16) |
| **`/dashboard/[id]`** | Property detail — bills, **in-place per-property analytics** (cap rate, cash-on-cash, NOI, cash flow, equity + projected equity chart, same engine as /analytics), utility chart. Full-width banner (map removed). UUID IDs load real data; demo slugs ("phoenix", "pvr") load mock. (Round 16) |
| **`/dashboard/inbox`** | Cross-property action hub — urgent items, already-handled receipts, AI-parsed emails (currently mock). |
| **`/dashboard/assistant`** | **AI "Ask your portfolio" chat.** Natural-language questions about your real properties/finances; Claude answers grounded in your Supabase data and cites the numbers used. **Replies render as clean Markdown** (Round 16). Requires `ANTHROPIC_API_KEY` — shows a clean "connect AI" state without it. May propose actions (Approve card) but never executes them in v1. |
| **`/dashboard/[id]/financials`** | P&L drill-down — categorized expenses, mortgage detail, equity. |
| **`/dashboard/[id]/bookings`** | Per-stay economics — gross → fees → taxes → net, bar chart. |
| **`/dashboard/analytics`** | **Investment intelligence.** ONE unified view (Round 16 removed the Owner/Investor toggle): headline stats + investor ratios + real-data projections (adjustable, labeled assumptions) + recharts visuals + per-property table + AI narrative insights (rule-based without a key, Claude with `ANTHROPIC_API_KEY`). Linked from the dashboard. |
| **`/legacy/dashboard`** | Old single-property dashboard. Real Supabase data, vanilla CSS. Kept for reference — not linked from the main app. |
| **`/legacy/homeos`** | Original partner design prototype. Mock data, Tailwind + recharts. Kept for reference — not linked from the main app. |

Both legacy pages are accessible by URL but intentionally buried. Do not delete them without partner alignment.

---

## Tech stack

| Layer | Tool | Notes |
|---|---|---|
| **Framework** | Next.js 16 (TypeScript, App Router) | All pages, routing, and API routes in one repo |
| **Auth + DB** | Supabase (PostgreSQL) | Email/password auth, row-level security, shared instance (localhost + prod point to the same DB) |
| **Deployment** | Vercel | Auto-deploys on push to `main` (~1 min). Hobby plan — Jaime's account |
| **Styling** | Tailwind CSS v4 + shadcn/ui | Used in `/dashboard` (main product). DO NOT mix with legacy vanilla CSS |
| **Charts** | recharts | AreaChart (utility spend), BarChart (bookings) |
| **Icons** | lucide-react | Throughout `/dashboard` |
| **Drag-and-drop** | @dnd-kit/core + @dnd-kit/sortable | Portfolio page property reordering |
| **AI** | @anthropic-ai/sdk | Server-only `ANTHROPIC_API_KEY`. Powers (1) AI insights on `/dashboard/analytics` (degrades to rule-based without it) and (2) the `/dashboard/assistant` "Ask your portfolio" chat — Claude grounded in real Supabase data, prompt-cached, streaming (degrades to "connect AI" state without it) |
| **Markdown** | react-markdown + remark-gfm | Renders the assistant's streamed Markdown replies cleanly (`components/Markdown.tsx`); only on `/dashboard/assistant` (Round 16) |
| **Legacy styling** | Vanilla CSS (`globals.css`) | Used in `/legacy/dashboard` only — do not touch |

---

## Getting started locally

> **If you already have a local clone from the old repo (`jaimegarciae/homeowner-dashboard`), update your remote:**
> ```bash
> git remote set-url origin https://github.com/home-os-713/dash.git
> ```

```bash
# 1. Clone
git clone https://github.com/home-os-713/dash.git
cd homeowner-dashboard

# 2. Install
npm install

# 3. Create .env.local (get keys from Jaime)
NEXT_PUBLIC_SUPABASE_URL=https://feorwntlkwhwrsehmjmd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<get from Jaime>
RENTCAST_API_KEY=<get from Jaime or sign up free at rentcast.io>
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<get from Jaime — Google Cloud key, public/client-safe>
ANTHROPIC_API_KEY=<get from Jaime or console.anthropic.com — powers the AI assistant; server-only>

# 4. Run locally
npm run dev   # → http://localhost:3000

# 5. Deploy
git push origin main   # → Vercel auto-deploys ✓
```

> **Note:** localhost and production share the same Supabase database.

---

## Database schema

```sql
properties  (id, user_id, name, address, location, type, prop_val, mort_pay, mort_bal,
             mort_orig, mort_rate, rent, rent_bills, income, occupancy, sort_order,
             lat, lng, updated_at)
bills       (id, property_id, name, amount, due_date, paid, category, autopay,
             status, status_label, source)
bookings    (id, property_id, platform, guest, check_in, check_out, nights,
             gross, platform_fee, cleaning_fee, taxes, net, status, created_at)
utility_months (id, property_id, month, electric, water, gas, solar, budget)
action_items   (id, property_id, kind, priority, label, detail, category,
                due_in, amount, cta_label, created_at)
-- App-level Rentcast cache (migration 003), keyed by normalized address. Shared
-- across all users; survives delete/re-add of a property. NOT user-private.
rentcast_cache (address PK, estimated_value, price_range_low, price_range_high,
                rent_estimate, rent_range_low, rent_range_high, city, state, zip_code,
                bedrooms, bathrooms, square_footage, year_built, property_type, fetched_at)
```

Multi-property is live — users can add as many properties as they want.

| Migration | Status | What it does |
|---|---|---|
| `supabase/001_multi_property.sql` | ✅ Applied | Multi-property schema, RLS policies |
| `supabase/002_sort_order.sql` | ⚠️ Run when ready | Adds `sort_order` to `properties` for drag-to-reorder persistence |
| `supabase/003_rentcast_cache.sql` | ⛔ **MUST RUN** | App-level `rentcast_cache` table + `lat`/`lng` cols on `properties`. **Adding a property writes lat/lng, so property creation FAILS until this is applied** (shared DB → affects local + prod). |

---

## How deployments work

| Trigger | What deploys | URL |
|---|---|---|
| Push to `main` | **Production** | homeowner-dashboard-woad.vercel.app |
| Push to any other branch | **Preview** | Auto-generated URL per branch |

Preview URLs use the same Supabase DB as production — data you create on a preview shows up in production too.

---

## Current state & what's next

### Done
- ✅ Multi-property DB schema (migration 001 applied)
- ✅ `/dashboard` loads real properties from Supabase
- ✅ Add property modal with Rentcast address lookup (requires `RENTCAST_API_KEY`)
- ✅ **Google Places address autocomplete** on the add-property modal + **pin map** on property detail (requires `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`; degrades gracefully without it)
- ✅ **App-level Rentcast cache** (`rentcast_cache`, migration 003) — keyed by normalized address, shared across users, survives delete/re-add of a property → repeat lookups cost **0 API calls**. Dev mock in local to avoid burning free tier (50 req/mo, 3 calls each)
- ✅ **Rentcast auto-fill fires on address-*select*** (not per keystroke) to conserve quota; auto-fills value + rent + location, never clobbers manual edits
- ✅ **Rentcast estimate display** on property detail — beds/baths/sqft/year/type + value & rent **ranges**, shown as a labeled reference and as a fallback when the user hasn't entered their own value/rent
- ✅ Coordinates from autocomplete saved to `properties.lat/lng` → map skips per-view geocoding
- ✅ Property detail (`/dashboard/[id]`) loads real data from Supabase
- ✅ **Edit property details modal** — name, address, location, type, value, income
- ✅ **Edit mortgage modal** — balance, original amount, monthly payment, rate
- ✅ **Add bill modal** — name, amount, due date, category, autopay toggle, status
- ✅ Property detail visual overhaul — equity donut ring, mortgage progress bar, spending breakdown bars, KPI grid (HomeOS dark palette)
- ✅ Demo mode — falls back to mock data when user has no real properties
- ✅ **Drag-to-reorder properties** on portfolio page — grip handle top-left of each card, 2-column grid preserved, persists to `sort_order` in Supabase (requires migration 002)
- ✅ Legacy pages moved to `/legacy/*`, main nav cleaned up
- ✅ **Analytics / investment intelligence** (`/dashboard/analytics`) — Owner ↔ Investor toggle, real-data projections with adjustable labeled assumptions, recharts visuals, AI narrative insights (rule-based without a key, Claude with `ANTHROPIC_API_KEY`). Built by a dispatched product-engineer session
- ✅ **AI "Ask your portfolio" assistant** (`/dashboard/assistant`) — Claude answers natural-language questions grounded in your real Supabase portfolio, cites the numbers, proposes (but never executes) actions. Needs `ANTHROPIC_API_KEY`; degrades to a clean "connect AI" state without it. Exploration of lean/free OOTB data APIs (FRED, Census, HUD, Plaid, …) + the staged paid path is in `docs/AI_EXPERIENCE_EXPLORATION.md`
- 🔀 Both above merged together on branch `feature/intelligence` (analytics + assistant), pending integration pass + test
- ✅ **Investor-first polish pass (Round 16, branch `feature/intelligence-polish`)** — (1) analytics collapsed to ONE unified view (no Owner/Investor toggle); (2) assistant replies render as clean Markdown + tuned system prompt; (3) property detail "financial summary" replaced with in-place per-property analytics (shared engine); (4) PropertyMap removed from detail page, banner full-width; (5) dashboard headline redesigned into a scannable portfolio overview (value/equity/cash flow/return tiles), bills demoted. All numbers flow through `lib/v0/analytics.ts`. Build green.

### Open — next logical steps (in order)
1. **⛔ Run migration 003** — `supabase/003_rentcast_cache.sql`. Required before adding properties (writes `lat`/`lng`) and before the Rentcast cache works. Also run migration 002 if not yet applied.
2. **Reorderable detail-view widget grid (NEW — follow-up idea from Jaime, 2026-06-09):** turn `/dashboard/[id]` into a grid of widgets (KPIs, Rentcast estimate, location map, equity, mortgage, bills, spending, financial summary) that the **user can drag to reorder to their preference** — like the portfolio page already does with `@dnd-kit`. The location map is currently a small fixed widget pending this. Would let owners surface what matters most to them per property. Scope: persist a `widget_order` (per user or per property) similar to `sort_order`.
3. **Email parsing for bill ingestion** — Gmail OAuth + Claude API extraction → writes to `bills` table. Highest-value integration (replaces manual bill entry).
4. **Bookings + utility data ingestion** — currently mock on the detail page. Needs Airbnb/VRBO sync or manual entry.
5. **Decommission `/legacy/*`** — once `/dashboard` is validated with real data, delete the legacy pages.

### Roadmap (further out)
- Google / Apple Sign-In via Supabase OAuth
- Utility provider API integrations
- Bill audit logic (compare MoM, detect anomalies)
- Recommendations engine (rule-based → Claude-driven)
- Pricing validation ($29/mo ≤3 properties, $49/mo unlimited)

---

## Product positioning

> *Every property bill, every property, in one place — paid on time, no thinking.*

**Why this framing:** Earlier "we save you money" hero didn't land — savings claims with mock data felt vague. The simpler promise — one inbox for every bill across every property, autopay status front-and-center — communicates value in 5 seconds without requiring belief in a future-tense claim.

**Competitive gap:** Stessa is free but passive (no bill pay, no autopay). PMS tools (Hostfully, Hospitable) sit alongside the bill stack, not on top. Doxo/Prism aren't property-aware. No one does bill-by-property aggregation + status for owner-operators with 2–10 properties.

**Target user:** STR hosts with 2–10 properties. High WTP (business expense), already paying for software.

Full strategy reasoning (5 rounds of devil's-advocate iteration) is in `DECISION_LOG.md`.

---

## Collaboration norms

- **Work in branches, not directly on `main`** — open a PR so the other person can review before merging.
- **Update the context docs on every meaningful commit — this is mandatory.** `CLAUDE.md` for stack/structure, `DECISION_LOG.md` for strategy/design decisions, this file for page inventory. Stale docs break the next session.
- **`.env.local` is never committed** — get keys from Jaime. Vercel has them set for all environments.

---

## Key context files

| File | What it covers |
|---|---|
| `CLAUDE.md` | Full technical context — stack, file structure, DB schema, gotchas |
| `DECISION_LOG.md` | Strategy reasoning — 6 rounds of iteration, what was tried, what was dropped and why |
| `PARTNER_BRIEFING.md` | This file — current state TL;DR for collaborators |
| `supabase/001_multi_property.sql` | DB migration — already applied to shared instance |
