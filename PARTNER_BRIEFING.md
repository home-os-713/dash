# Homeowner Dashboard — Partner Briefing

> **Live app:** https://homeowner-dashboard-woad.vercel.app
> **GitHub repo:** https://github.com/jaimegarciae/homeowner-dashboard
> **Supabase:** https://supabase.com/dashboard/project/feorwntlkwhwrsehmjmd

---

## What we built

A personal property management web app. Homeowners sign up, enter their property details (mortgage, equity, bills, rental income), and track their finances over time. Each user has their own account and their data persists across sessions and devices.

There are currently three pages:
- **`/dashboard`** — the original live product. Supabase-backed, vanilla CSS, all real data. Kept as reference.
- **`/homeos`** — initial design prototype. Mock data, Tailwind + shadcn + recharts. Kept as reference.
- **`/v0`** — the merged direction. Portfolio overview → property detail → financials drill-down. Tailwind + shadcn + recharts. Currently all hardcoded; needs DB schema change before real data wires in.

---

## Tech Stack TL;DR

| Layer | Tool | What it does |
|---|---|---|
| **Framework** | Next.js 16 (TypeScript) | The skeleton of the app — handles all pages, routing, and server logic in one repo |
| **UI** | React | The dashboard is split into reusable components (MortgageCard, BillsList, etc.) — like Android Views/Composables |
| **Auth + DB** | Supabase (PostgreSQL) | Manages user accounts, sign-up/login, and stores all property + bills data. Row-level security means users only ever see their own data |
| **Deployment** | Vercel | Hosting — connected to GitHub. Every push to `main` auto-deploys to production in ~1 minute. No servers to manage |
| **Version control** | GitHub | Single source of truth for code. Push access = ability to deploy |
| **Styling** | Vanilla CSS | Used in `/dashboard` — copied from the original prototype, clean design |
| **Styling** | Tailwind CSS v4 + shadcn/ui | Used in `/homeos` — partner's prototype page |
| **Charts** | Inline SVG | Used in `/dashboard` — zero dependencies |
| **Charts** | recharts | Used in `/homeos` — area and bar charts for utilities + finances |
| **Icons** | lucide-react | Used in `/homeos` |

---

## Getting started locally

```bash
# 1. Clone the repo
git clone https://github.com/jaimegarciae/homeowner-dashboard.git
cd homeowner-dashboard

# 2. Install dependencies
npm install

# 3. Create .env.local with Supabase credentials (get from Jaime)
NEXT_PUBLIC_SUPABASE_URL=https://feorwntlkwhwrsehmjmd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<get from Jaime>

# 4. Run locally
npm run dev   # → http://localhost:3000

# 5. Deploy
git push origin main   # → Vercel auto-deploys ✓
```

> **Note:** localhost and production share the same Supabase database — data you create locally shows up on the live site and vice versa.

---

## How deployments work

There are two types of Vercel deployments, and they happen automatically:

| Trigger | What deploys | URL |
|---|---|---|
| Push to `main` | **Production** | homeowner-dashboard-woad.vercel.app |
| Push to any other branch | **Preview** | A unique auto-generated URL per branch |

**Preview deployments** are how we review each other's work before it goes live. When you open a PR on GitHub, Vercel posts the preview URL as a check — click it to see the branch running on a real server without touching production.

A few gotchas:
- Preview URLs are **publicly accessible** — anyone with the link can view them
- They use the **same Supabase database as production** — changes you make on a preview (adding bills, editing property data) will show up in production too. Keep that in mind during testing.
- The preview URL updates automatically every time you push a new commit to that branch

---

## Roadmap & Action Items

### Auth
- [ ] **Google Sign-In** — OAuth via Supabase (Auth → Providers → Google)
- [ ] **Apple Sign-In** — OAuth via Supabase (requires Apple Developer account)

### Data integrations *(to replace manual input)*
- [ ] **Zillow API** — auto-fill estimated property value and neighborhood comps
- [ ] **Utility provider APIs** — pull electricity, water/sewer, gas bills automatically
- [ ] **Google Calendar / iCal** — surface bill due dates as calendar reminders
- [ ] **Mortgage servicer APIs** — pull live balance, payment history, escrow details
- [ ] **Email integration (Gmail / Outlook)** — scan property-related emails → Claude API extracts action items & due dates → saves to dashboard automatically

### Features
- [ ] **Connect /homeos to real data** — currently all mock data; needs Supabase integration + multi-property DB schema
- [ ] **Multi-property support** — current DB model is one property per user; /homeos prototypes the UI for this
- [ ] **Analytics & insights section** — was in the original prototype, removed to keep dashboard lean. Re-add once real data sources are connected

### Collaboration
- [ ] **Vercel Pro** — only needed if partner wants shared Vercel dashboard access (not urgent)

---

## Design feedback & open questions

The `/homeos` page is a good prototype of the product vision — it covers multi-property, utility tracking, compliance, and a health score. The mock/hardcoded data is intentional and temporary.

**Status update: `/v0` rebuilt around a sharper product thesis.**

After a strategy round (full devil's-advocate write-up in chat history; key conclusions below), `/v0` was rebuilt to demo a specific positioning instead of being a generic dashboard:

> **Positioning:** *Every property bill, every property, in one place — paid on time, no thinking.*

**Why this positioning (revised after first user demo):** The earlier "we save you money" framing didn't land — savings claims with mock data felt vague and untrusted. The simpler, undeniable promise — **one inbox for every bill across every property, with autopay status and what needs you front-and-center** — communicates value in 5 seconds without requiring the user to believe a future-tense claim. Audit/savings comes later as a real number from real data, not a headline.

**Competitive gap (verified via scan):** Stessa is free but **passive tracking** (no bill pay, no audit, no autopay). PMS tools (Hostfully, Hospitable) sit alongside, not on top of, the bill stack. Doxo/Prism do bill aggregation but aren't property-aware. Truebill does consumer subscription audit but isn't property-keyed. **No one does bill-by-property aggregation + payment + status for owner-operators with 2–10 properties.** That's the wedge.

**Target user (entry niche):** STR hosts with 2–10 properties. High willingness to pay (business expense), already paying for software, professionalized enough to value automation over tracking.

**Pricing target (not shown in demo):** $29/mo for ≤3 properties, $49/mo unlimited, with savings guarantee.

**Pages in `/v0`:**
- `/v0` — Portfolio overview. Hero: *"N bills across M properties · X on autopay · Y need attention."* One sentence. Below it: a "What needs you this week" link to inbox, then property cards with bill counts, autopay ratio, and net.
- `/v0/inbox` — Cross-property action hub. Hero: "N things need you this week." **Already handled** section (autopay receipts + completed admin tasks — no dollar claims, just receipts). Filter tabs (all / urgent / soon / review / bookings). **From your inbox** (AI-extracted bills awaiting confirmation).
- `/v0/[id]` — Property detail. Hero: *"N bills · X on autopay · Y need attention"* + total due. Needs-your-attention card (action items). Bills front and center, sorted by status. Utility chart + financial summary side-by-side. STR bookings preview.
- `/v0/[id]/bookings` — Per-stay net economics (gross → fees → taxes → net to you), bar chart, upcoming + recent.
- `/v0/[id]/financials` — Full P&L with categorized expenses, mortgage detail with rate, equity donut, booking economics.

Every page is labeled **"Simulated demo data"** at the top — important for honest user demos.

Both `/dashboard` and `/homeos` are kept as reference.

**New: `DECISION_LOG.md`** captures the full thinking behind `/v0` — the 5 rounds of strategy iteration, the devil's-advocate critique that surfaced the wedge, the user-feedback round that killed the "savings" framing, and what was kept/dropped/why. It's referenced from `CLAUDE.md` so any AI assistant (yours or mine) reading the repo gets the reasoning context, not just the diff. **Read or update it whenever you make a significant strategic or design decision in `/v0`.**

**Open partner discussion items:**
1. **DB schema change for multi-property** — the current DB is one-property-per-user. `/v0` is hardcoded with two mock properties to show the direction. We need to decide: extend the schema (`properties` becomes truly many-per-user; bills/utilities/bookings keyed by property_id) and migrate the existing single row?
2. **Validate the positioning before going further.** Show `/v0` to 5 STR hosts. Specifically test: does "Saved $X this month" + "Approve & do it" agent-style recommendations get a different reaction than a tracking dashboard would? If yes → keep building this direction and start work on the actual integrations (email parsing, bill audit logic). If no → pivot the framing.
3. **Real-data wiring sequence.** When we go: 1) Supabase property + bills first (already partially built), 2) Email parsing for bill ingestion (Gmail OAuth, Claude API for extraction), 3) Bill audit logic (compare bills MoM, detect anomalies), 4) Autopay integration (likely manual setup workflow + reminders, true autopay-on-our-behalf is far future), 5) Tax categorization (rule-based, then ML).
4. **Recommendations engine.** Today: hardcoded mock cards. Tomorrow: rule-based (e.g., "if no autopay AND last 3 bills paid 1–4 days before due → suggest autopay"). Long-term: Claude-driven, looking at bill history + market rates + tax law.
5. **Decommission `/dashboard` and `/homeos`** once `/v0` is wired and validated.

---

## Collaboration norms

- **Work in branches, not directly on `main`** — open a PR so the other person can review before merging.
- **Update the context docs on every meaningful commit — this is mandatory.** If you add a page, change a dependency, or make a product decision, the relevant doc must be updated in the same commit. `CLAUDE.md` for stack/structure changes, `DECISION_LOG.md` for strategy/design decisions, this file for page inventory. Stale docs break the next session for both collaborators.
- **Generate context for AI tools** — if you use Claude Code or another AI assistant in your session, save any important decisions or context it surfaces back into `CLAUDE.md` and `DECISION_LOG.md`. Think of it as a shared brain for the project.
- **`.env.local` is never committed** — get the Supabase keys from Jaime directly. Vercel already has them set for all environments so deploys work automatically.

---

## Key context files in this repo

| File | What it covers |
|---|---|
| `CLAUDE.md` | Full technical context for Claude Code — stack, file structure, DB schema, gotchas |
| `ARCHITECTURE.md` | Visual diagrams (system architecture, auth flow, data model, request flow) |
| `PARTNER_BRIEFING.md` | This file — TL;DR for collaborators |
| `DECISION_LOG.md` | Reasoning history behind `/v0` — strategy rounds, dead ends, what's kept/dropped and why. Auto-loaded into AI assistants via `CLAUDE.md`. |
