# Homeowner Dashboard — Partner Briefing

> **Live app:** https://homeowner-dashboard-woad.vercel.app
> **GitHub repo:** https://github.com/jaimegarciae/homeowner-dashboard
> **Supabase:** https://supabase.com/dashboard/project/feorwntlkwhwrsehmjmd

---

## What we built

A personal property management web app. Homeowners sign up, enter their property details (mortgage, equity, bills, rental income), and track their finances over time. Each user has their own account and their data persists across sessions and devices.

There are currently two pages:
- **`/dashboard`** — the live product. Supabase-backed, vanilla CSS, all real data.
- **`/homeos`** — a design prototype. Mock data, Tailwind + shadcn + recharts. Linked from the dashboard via "HomeOS →" button. Next step is wiring it to real data.

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

The `/homeos` page is a good prototype of the product vision — it covers multi-property, utility tracking, compliance, and a health score. A few things to align on as a team:

1. **Styling direction** — `/dashboard` uses vanilla CSS, `/homeos` uses Tailwind. At some point we should pick one and unify. Tailwind scales better; vanilla is simpler. Decision needed before we build more UI.
2. **Mock data** — `/homeos` is hardcoded with fake properties. The immediate next step is wiring it to Supabase so logged-in users see their actual data. This also requires extending the DB schema to support multiple properties per user.
3. **Routing** — currently `/homeos` is a separate page linked from the dashboard. We should decide: does it replace `/dashboard` eventually, or live alongside it?

---

## Collaboration norms

- **Work in branches, not directly on `main`** — open a PR so the other person can review before merging.
- **Update the context docs when you make significant changes** — if you add a new page, dependency, or architectural decision, update `CLAUDE.md`, `ARCHITECTURE.md`, and this file. These docs are how we (and any AI assistant) stay in sync across sessions.
- **Generate context for AI tools** — if you use Claude Code or another AI assistant in your session, save any important decisions or context it surfaces back into `CLAUDE.md`. Think of it as a shared brain for the project.
- **`.env.local` is never committed** — get the Supabase keys from Jaime directly. Vercel already has them set for all environments so deploys work automatically.

---

## Key context files in this repo

| File | What it covers |
|---|---|
| `CLAUDE.md` | Full technical context for Claude Code — stack, file structure, DB schema, gotchas |
| `ARCHITECTURE.md` | Visual diagrams (system architecture, auth flow, data model, request flow) |
| `PARTNER_BRIEFING.md` | This file — TL;DR for collaborators |
