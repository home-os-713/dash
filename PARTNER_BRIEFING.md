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
| **`/dashboard`** | **Main product.** Portfolio overview — real properties from Supabase, falls back to demo data when none exist. Multi-property. Add property modal with address lookup. |
| **`/dashboard/[id]`** | Property detail — bills, financial summary, utility chart, bookings preview. UUID IDs load real data; demo slugs ("phoenix", "pvr") load mock. |
| **`/dashboard/inbox`** | Cross-property action hub — urgent items, already-handled receipts, AI-parsed emails (currently mock). |
| **`/dashboard/[id]/financials`** | P&L drill-down — categorized expenses, mortgage detail, equity. |
| **`/dashboard/[id]/bookings`** | Per-stay economics — gross → fees → taxes → net, bar chart. |
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
| **Legacy styling** | Vanilla CSS (`globals.css`) | Used in `/legacy/dashboard` only — do not touch |

---

## Getting started locally

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
             mort_orig, mort_rate, rent, rent_bills, income, occupancy, sort_order, updated_at)
bills       (id, property_id, name, amount, due_date, paid, category, autopay,
             status, status_label, source)
bookings    (id, property_id, platform, guest, check_in, check_out, nights,
             gross, platform_fee, cleaning_fee, taxes, net, status, created_at)
utility_months (id, property_id, month, electric, water, gas, solar, budget)
action_items   (id, property_id, kind, priority, label, detail, category,
                due_in, amount, cta_label, created_at)
```

Multi-property is live — users can add as many properties as they want.

| Migration | Status | What it does |
|---|---|---|
| `supabase/001_multi_property.sql` | ✅ Applied | Multi-property schema, RLS policies |
| `supabase/002_sort_order.sql` | ⚠️ Run when ready | Adds `sort_order` to `properties` for drag-to-reorder persistence |

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
- ✅ Rentcast response cached 30 days in production; dev mock in local to avoid burning free tier
- ✅ Property detail (`/dashboard/[id]`) loads real data from Supabase
- ✅ **Edit property details modal** — name, address, location, type, value, income
- ✅ **Edit mortgage modal** — balance, original amount, monthly payment, rate
- ✅ **Add bill modal** — name, amount, due date, category, autopay toggle, status
- ✅ Property detail visual overhaul — equity donut ring, mortgage progress bar, spending breakdown bars, KPI grid (HomeOS dark palette)
- ✅ Demo mode — falls back to mock data when user has no real properties
- ✅ **Drag-to-reorder properties** on portfolio page — grip handle top-left of each card, 2-column grid preserved, persists to `sort_order` in Supabase (requires migration 002)
- ✅ Legacy pages moved to `/legacy/*`, main nav cleaned up

### Open — next logical steps (in order)
1. **Run migration 002** — `supabase/002_sort_order.sql` to persist drag-to-reorder order across sessions.
2. **Email parsing for bill ingestion** — Gmail OAuth + Claude API extraction → writes to `bills` table. Highest-value integration (replaces manual bill entry).
3. **Bookings + utility data ingestion** — currently mock on the detail page. Needs Airbnb/VRBO sync or manual entry.
4. **Decommission `/legacy/*`** — once `/dashboard` is validated with real data, delete the legacy pages.

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
