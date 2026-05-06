# Decision Log — How we got here

## Purpose
This file is a **working memory** for anyone — including a future Claude session — who lands in this repo and needs to understand **why `/v0` looks the way it does**, not just what changed. It captures the strategic reasoning, the dead ends, and the principles distilled along the way.

If you are a Claude assistant being asked to extend `/v0`, **read this first** before suggesting changes that might re-litigate decisions already explored.

## Context
- Built collaboratively by Adrian + Claude in early May 2026
- Goal: merge `/dashboard` (real Supabase data, simple) and `/homeos` (mock, polished prototype) into a single direction (`/v0`) that can become the future of the product
- Both `/dashboard` and `/homeos` were intentionally kept as reference and **must not be deleted** without partner alignment

---

## Round 1 — Initial merge

Adrian wanted to merge both pages. From his meeting notes:
- **Keep:** status colors, overview, action items, financial summary in small pane, monthly spend chart
- **Remove:** mortgage as separate card (fold into bills), bills-due-this-month section
- **Add:** recommendations (autopay, lower-bill, financials), portfolio overview of all properties
- **Principles:** simplicity, clean and beautiful design

Built (after a clarification round):
- `/v0` portfolio overview
- `/v0/[id]` property detail with action items, KPIs, spend chart, financial summary, bills (mortgage as line item), recommendations
- `/v0/[id]/financials` drill-down
- Multi-property hardcoded (DB schema change tabled for partner discussion)

---

## Round 2 — Strategy ask

Adrian asked Claude to step up: stop building iteratively, design the product around the highest-likelihood-of-success-as-a-business outcome, then build it.

Claude's first answer:
- **Target user:** STR hosts with 2–10 properties (high WTP, business expense)
- **Lead pain:** "I don't know what I'm forgetting" (engagement) + "I can't tell what each property nets" (referral)
- **Pricing:** $29/mo for ≤3, $49/mo unlimited
- **Build mode:** demo-grade with rich mock data

---

## Round 3 — Devil's advocate (recursive)

Adrian asked Claude to critique its own strategy and improve recursively until no faults remain.

### Faults found in v1 (the initial strategy)

- **Stessa is free** and already does landlord financials → no defensible wedge in tracking
- **PMS tools** (Hostfully, Hospitable) already do bookings/cleanings → STR hosts don't want a 2nd dashboard
- **"Never miss" is weekly engagement at best** — bills are mostly autopay, compliance is once-a-year. Weekly-engagement SaaS churns hard.
- STR may be a **shrinking pie** due to regulation (Phoenix, NYC, Barcelona, etc.)
- **Demo with mock data shows nicely but doesn't validate willingness to pay** — nodding heads ≠ pulled wallets
- **Email parsing is a heavy ask** — Gmail OAuth, full inbox scope, privacy concerns
- The pain framing **assumes hosts are disorganized**. Professional STR hosts are organized. The real pain might be tedium and reconciliation, not memory.

### Round 1 response → v2: "Truebill for property owners"

Reposition as bill audit + autopilot + tax-ready expenses + compliance never-miss. Lead with **"we save you money automatically"**, not "we help you remember." Pricing anchored to "less than one bill error caught."

### Faults found in v2

- Property bill audit is more fragmented than consumer subscriptions → less viral than Truebill
- **Tax automation alone is seasonal** — users churn after April 15
- Success-based pricing (% of savings) is unpredictable revenue and hard to underwrite
- The product still **looked like a generic dashboard**, not an autopilot
- "Action items" as hero reinforces passive-tracker positioning
- Recommendations look like **suggestions**, not proposed agent actions

### Round 2 response → v3: Make automation visible

- Savings hero with expandable line items (date + $ + which event)
- Split action items into **"Handled by HomeOS"** vs **"Needs you"**
- Recommendations become **"Approve & do it"** agent-style proposals with reasoning + effort
- One concrete bill-audit moment ("Caught $95 HOA double-charge → refund")
- Don't show pricing in demo

### Faults found in v3

- Mock "$X saved" data shown to real users is **borderline misleading** → could damage trust before we have it
- Still no single sentence that says **why someone buys us instead of Stessa+spreadsheet or their PMS**
- Inflating scope; bookings/financials/etc dilute the wedge moment
- Auto-handled-vs-needs-you split was the strongest UI move and **still wasn't built**
- Recommendations don't carry agent energy — they read as advice

### Round 3 response → v4: Sharpen + add honesty layer

- Foreground 1–2 hero moments per page; quiet everything else
- Redesign recs as "Approve & do it" with Approve state visible
- Add **"Simulated demo data"** label on every page that shows fake numbers
- Sharper tagline: *"The only tool that actively saves you money on your properties — not just tracks it."*

Built v4 with: dual hero (Saved + Needs you), Handled-by-HomeOS sections everywhere, recommendations as proposed-action cards, full bookings page, categorized P&L.

---

## Round 4 — User feedback ("I'm confused")

Adrian opened the v4 build and said:
- The "Saved $208 this month" hero is confusing — doesn't connect to anything tangible
- Couldn't find the value straight away
- Asked: "How can we make the value more simple? And does this product already exist?"

**This was the most important feedback in the whole session.** It surfaced two real problems:

1. **The savings hero with mock data is aspirational, not honest.** Users see "$208 saved" and ask "from what?" — and the receipts didn't tie back clearly. Promising savings before we can deliver them erodes trust early.
2. **We need a clear answer to "doesn't this already exist?"**

### Honest competitive scan (verified)

| Tool | What it does | Why it's not the same |
|---|---|---|
| **Stessa** (free, Roofstock-owned) | Tracks finances, generates Schedule E for taxes | **Doesn't pay bills, doesn't audit, doesn't handle autopay.** Passive ledger only. |
| **Hostfully / Hospitable / Hostaway** ($80–160/mo) | PMS — guest messaging, calendars, cleaning | **Don't centralize bills or audit anything.** STR hosts already pay them. |
| **Doxo / Prism / MyCheckFree** | Aggregates consumer bills | **Not property-aware, no portfolio view, no audit.** |
| **QuickBooks Self-Employed / REI Hub** | Landlord bookkeeping | Accountant-shaped, not homeowner-shaped. |
| **Truebill / Rocket Money** | Consumer subscription audit + bill negotiation | **Personal, not property-keyed.** Closest analog. |
| **Belong / Roofstock managed** | Full-service property management (8–10% of rent) | Different category (full service, not software). |

**The gap that's actually open:** No one does **bill-by-property aggregation + automated payment + audit** for owner-operators with 2–10 properties. Stessa is closest but is *passive tracking only*. PMS tools sit alongside, not on top of, the bill stack.

---

## Round 5 — Simpler rebuild (current `/v0`)

**Decision: kill the savings hero.** The aspirational "we save you money" framing fails when the user can't see the math, and shipping it with mock data damages trust before we earn it.

### New positioning (the converged truth)

> *Every property bill, every property, in one place — paid on time, no thinking.*

A simpler, undeniable promise the demo can actually deliver in 5 seconds without requiring belief in a future-tense claim. **Audit/savings becomes a feature later, not the headline.**

### What was kept

- Multi-property portfolio + property detail + drill-down structure
- Status colors (green/yellow/red)
- Action items inbox at `/v0/inbox`
- Bookings page (STR-specific value)
- Financials drill (P&L, mortgage, equity donut)
- "Already handled" section in inbox (autopay receipts + completed admin tasks — but with **no dollar claims**, just receipts)
- "From your inbox" AI-parsed email section
- Dark olive/cream palette, Tailwind + shadcn + recharts
- **"Simulated demo data" labels** on every page

### What was dropped

- "$X saved this month" hero on portfolio + property pages
- "Proposed actions" recommendation cards — re-add when fed by real audit data
- "Plus saved by HomeOS" / "Effective monthly take" line on financials page
- Dollar amounts on auto-handled receipts (was conflating "we did X" with "we saved you Y")

### Current page structure

- **`/v0`** — Portfolio. Hero is **one sentence**: *"N bills across M properties · X on autopay · Y need attention."* Three simple stats (total due, autopay ratio, needs-you), then property cards.
- **`/v0/inbox`** — Hero: *"N things need you this week."* Then "Already handled" receipts, filter tabs (urgent/soon/review/bookings), action list, "From your inbox" parsed emails.
- **`/v0/[id]`** — Hero: *"N bills · X on autopay · Y need attention"* + total due. Action items. **Bills front-and-center, sorted by status.** Utility chart + financial summary side-by-side. Bookings preview.
- **`/v0/[id]/bookings`** — Per-stay net economics (gross → fees → taxes → net to you), bar chart.
- **`/v0/[id]/financials`** — Categorized P&L → NOI. No savings claim.

---

## Principles distilled (for future sessions)

1. **Simpler + honest beats aspirational.** A claim the demo can't deliver erodes trust before you earn it. Lead with the boring, true promise.
2. **Mock data must be labeled.** Every page in `/v0` is tagged "Simulated demo data" so demos don't mislead.
3. **The wedge is bill aggregation + payment status by property.** Not "savings." Not "AI." Not "compliance." Those are features, not the lead.
4. **Multi-property is hardcoded for now.** Real wiring requires a DB schema change (one-property-per-user → many) and is a partner discussion item before further build.
5. **Strategy is iterative, not pre-decided.** This file documents 5 rounds of revision. Future sessions should expect to do the same — write, critique, simplify.
6. **Honesty about competition is part of the pitch.** Stessa exists. PMS tools exist. We're not the only thing — we're the only thing that does *this specific gap*. Re-scan competition before assuming the gap is still open.
7. **Don't delete `/dashboard` or `/homeos` without partner alignment.** They're reference for the journey.

---

## Open questions (carried forward)

1. **DB schema change for multi-property** — needs partner alignment before wiring real data. Current schema is one-property-per-user; v0 is hardcoded with two mock properties.
2. **Real-data wiring sequence:** (1) Supabase property + bills, (2) email parsing for bill ingestion (Gmail OAuth + Claude API extraction), (3) bill audit logic (compare bills MoM, detect anomalies), (4) autopay setup workflow (likely manual setup + reminders before true autopay-on-our-behalf), (5) tax categorization (rule-based, then ML).
3. **Pricing validation** — $29/$49/mo target needs 5 STR-host interviews before committing.
4. **Show `/v0` to 5 STR hosts before building integrations.** Test specifically: does the simpler "one place for every bill" framing land? If yes → start integration work. If no → pivot the framing again.
5. **Decommission `/dashboard` and `/homeos`** once `/v0` is wired and validated.

---

## How to extend this log

When you make a significant strategic or design decision in `/v0`:
- Add a new "Round N" section above
- Capture what you tried, what worked, what failed, and why
- **Don't delete old rounds** — the dead ends are the most valuable part for future contributors

This is a working memory. Keep it honest.
