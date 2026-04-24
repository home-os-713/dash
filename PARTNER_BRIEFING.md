# Homeowner Dashboard — Partner Briefing

> **Live app:** https://homeowner-dashboard-woad.vercel.app
> **GitHub repo:** https://github.com/jaimegarciae/homeowner-dashboard
> **Supabase:** https://supabase.com/dashboard/project/feorwntlkwhwrsehmjmd

---

## What we built

A personal property management web app. Homeowners sign up, enter their property details (mortgage, equity, bills, rental income), and track their finances over time. Each user has their own account and their data persists across sessions and devices.

---

## Tech Stack TL;DR

| Layer | Tool | What it does |
|---|---|---|
| **Framework** | Next.js 16 (TypeScript) | The skeleton of the app — handles all pages, routing, and server logic in one repo |
| **UI** | React | The dashboard is split into reusable components (MortgageCard, BillsList, etc.) — like Android Views/Composables |
| **Auth + DB** | Supabase (PostgreSQL) | Manages user accounts, sign-up/login, and stores all property + bills data. Row-level security means users only ever see their own data |
| **Deployment** | Vercel | Hosting — connected to GitHub. Every push to `main` auto-deploys to production in ~1 minute. No servers to manage |
| **Version control** | GitHub | Single source of truth for code. Push access = ability to deploy |
| **Styling** | Vanilla CSS | Copied from the original prototype — clean design, no framework needed |

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
- [ ] **Analytics & insights section** — was in the original prototype, removed to keep dashboard lean. Re-add once real data sources are connected
- [ ] **Multi-property support** — current model is one property per user

### Collaboration
- [ ] **Vercel Pro** — only needed if partner wants shared Vercel dashboard access (not urgent)

---

## Key context files in this repo

| File | What it covers |
|---|---|
| `CLAUDE.md` | Full technical context for Claude Code — stack, file structure, DB schema, gotchas |
| `ARCHITECTURE.md` | Visual diagrams (system architecture, auth flow, data model, request flow) |
| `PARTNER_BRIEFING.md` | This file — TL;DR for collaborators |
