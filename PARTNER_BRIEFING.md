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

**The agreed next step: merge both pages into one.**
Take the best visual design and features from `/homeos` and the real Supabase data layer from `/dashboard`, and combine them into a single unified page. Once merged, `/homeos` can be removed.

Things to figure out during the merge:
1. **Styling direction** — `/dashboard` uses vanilla CSS, `/homeos` uses Tailwind. Pick one for the merged page. Tailwind scales better long-term; vanilla CSS is simpler. Decide before writing new UI.
2. **Multi-property DB schema** — `/homeos` shows multiple properties per user. The current DB only supports one property per user. The schema will need extending before the merged page can support this.
3. **Which features to bring over** — utility charts, compliance tracker, health score, and action items from `/homeos` are all candidates. Prioritize based on what real data sources are available first.

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
