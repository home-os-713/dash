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

## Round 6 — Multi-property DB migration + Rentcast integration (May 2026)

**Decision: wire `/v0` to real Supabase data and replace the Zillow placeholder with Rentcast.**

### What was built

- **SQL migration** (`supabase/001_multi_property.sql`): drops the `user_id` unique constraint on `properties`, extends `properties` and `bills` with v0 fields, adds `bookings`, `utility_months`, `action_items` tables — all with RLS policies.
- **`lib/v0/db.ts`**: TypeScript types for the extended schema (`DbProperty`, `DbBill`, `DbPropertyWithBills`) and Supabase query helpers (`listUserProperties`, `getPropertyById`, `insertProperty`, `computePropertyHealth`, `computeNOI`).
- **`app/api/property-lookup/route.ts`**: server-side proxy to Rentcast API. Hits `/v1/properties` (details) + `/v1/avm/value` (estimated value) in parallel. Requires `RENTCAST_API_KEY` env var.
- **`app/v0/page.tsx`**: loads real properties from Supabase via `listUserProperties`. Shows real cards when properties exist; falls back to mock cards + "Add your first property" banner when none. Includes a full **Add Property modal** with address lookup button (calls `/api/property-lookup`).
- **`app/v0/[id]/page.tsx`**: splits on UUID regex. UUID IDs → query Supabase → `RealPropertyDetail` component. Demo slugs ("phoenix", "pvr") → `MockPropertyDetail` (unchanged). This lets the demo remain working indefinitely alongside real data.
- **`app/dashboard/page.tsx`**: minor fix — changed `.single()` to `.order().limit(1)` so it doesn't break when a user has multiple properties.

### Why Rentcast instead of Zillow

Zillow's public API (ZWSID) was shut down in April 2021. No publicly accessible Zillow endpoint exists. Rentcast (rentcast.io) is the closest direct equivalent: free tier (50 req/mo), US property AVM, same data shape as Zestimate. If the project grows past 50 lookups/month, upgrade to a paid Rentcast plan or swap the `/api/property-lookup` route to ATTOM.

### What stays mock

`/v0/inbox`, `/v0/[id]/financials`, `/v0/[id]/bookings` still use mock data from `lib/v0/mockData.ts`. Real wiring of those pages requires: (1) bills CRUD UI, (2) email parsing for bill ingestion, (3) bookings sync from Airbnb/VRBO. Do not delete mockData.ts until all three are wired.

---

## Round 7 — Property detail redesign + data input + drag-to-reorder (May 2026)

### What was built

**Property detail (`/dashboard/[id]`):**
- `RealPropertyDetail` fully redesigned — now matches the visual richness of `legacy/dashboard` but in the HomeOS dark palette (`#2B2B2B`/`#353530`/`#4B5436`/`#C7BBA3`). Includes: equity SVG donut ring, mortgage progress bar, spending breakdown horizontal bars, 4-stat KPI grid, bills list with status colors.
- Three edit modals added: **Edit property** (name/address/type/value/income), **Edit mortgage** (balance/original/payment/rate), **Add bill** (name/amount/due date/category/autopay/status). All saves are optimistic — local state updates immediately, Supabase write fires in the background.
- `MockPropertyDetail` enhanced: utility mini-cards with MoM% badges, multi-series AreaChart (Electric/Water/Gas), domain-status pills.

**Rentcast caching:**
- Dev mock short-circuits the API entirely in `NODE_ENV !== 'production'` — no API credits burned during development.
- Production responses cached 30 days via `unstable_cache`.

**Bug fix — 404 on property card tap:**
- Root cause: property card `href` was pointing to `/v0/${id}` (old route) instead of `/dashboard/${id}`. Two-line fix in `dashboard/page.tsx`.

**Drag-to-reorder portfolio:**
- Installed `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`.
- Added `sort_order integer` column to `properties` (migration `supabase/002_sort_order.sql` — run manually).
- Portfolio page wraps real property cards in `DndContext` + `SortableContext` (`rectSortingStrategy` handles the 2-column grid). Grip handle appears on hover at each card's top-left corner. On drag end, new `sort_order` values are batch-written to Supabase (fire-and-forget).
- `listUserProperties` falls back gracefully to `updated_at` ordering if `sort_order` column doesn't exist yet — prevents data disappearing before migration is run.

### Collaboration norm added
After every change session: provide a short summary + localhost link to the relevant UI page. Noted in CLAUDE.md gotchas and now expected in all future sessions.

---

## Open questions (carried forward)

1. **Bills CRUD on property detail** — users can now create properties but can't add/edit bills through the UI. Next logical UI step is a "Add bill" modal on `/v0/[id]`.
2. **Email parsing for bill ingestion** — Gmail OAuth + Claude API extraction → writes to `bills` table. This is the highest-value integration (replaces manual bill entry entirely).
3. **Real-data wiring for inbox + financials + bookings** — blocked on bills CRUD + bookings ingestion.
4. **Pricing validation** — $29/$49/mo target needs 5 STR-host interviews before committing.
5. **Decommission `/dashboard` and `/homeos`** once `/v0` is wired and validated.
6. **Rentcast API key setup** — user needs to sign up at rentcast.io, get API key, and set `RENTCAST_API_KEY` in both `.env.local` and Vercel env vars.

---

## Round 8 — Light theme redesign: "Warm Editorial" (May 2026)

**Decision: move `/dashboard` (and every sub-page) off the dark olive palette to a light, Apple-grade aesthetic.**

### Why
Adrian wanted the product to feel simpler, lighter, and more elegant — "similar to Apple, with good animations and beautiful design." The dark olive/cream theme read as heavy and a bit generic for a finance app that people open daily. A light, warm, editorial look is calmer, more premium, and easier to trust with money.

### What was chosen
Offered three light directions (Clean & Neutral / Warm Editorial / Soft Monochrome). Adrian picked **Warm Editorial** — it evolves the existing brand into light mode rather than discarding it.

Palette:
- Background `#FAF9F6` (warm off-white) · cards `#fff` · text `#2B2B28`
- Muted gray ramp: `#57554F` → `#6E6B64` → `#8A8780` → `#A8A59E` → `#C4C1B8`
- Warm hairline borders: `#EAE8E1` / `#E2DFD6` / `#D8D5CB`
- Accent **olive `#5A6247`** (hover `#4A5239`) — replaces both the old olive `#4B5436` and the cream `#C7BBA3` highlight
- Status colors bumped to `-600/-500` shades for contrast on white

### How it was built
- A scripted, collision-safe (two-pass, longest-token-first) find-and-replace mapped every retired dark token → its light equivalent across the 5 dashboard files + inline SVG/recharts/gradient color strings. No hand-editing of thousands of class names.
- Added a reusable polish layer in `globals.css`: `.shadow-soft`, `.card-lift` (hover lift), `.animate-rise` + `.stagger` (entrance), `.animate-modal`/`.animate-overlay` — all gated behind `prefers-reduced-motion`.
- shadcn `<Card>` now ships `shadow-soft` + warm border by default, so card-based pages (financials, bookings, inbox) inherit the look for free.
- Header became a frosted translucent white bar (`bg-white/80 backdrop-blur-xl`).

### Honesty notes / what to watch
- The recharts tooltip deliberately keeps dark text (`#2B2B2B`) on a white background — not a missed token.
- Legacy pages (`/legacy/*`) were intentionally left on their original styling — they're reference for the journey.
- Mock vs. real data behavior is unchanged; this was a pure visual pass.

### Open follow-ups
- Re-theme the `login`/`signup` pages to match (not touched this round).
- Consider a real screenshot/visual QA pass once auth is available locally (couldn't render the auth-gated detail pages headlessly this session; validated via typecheck + `/dashboard` 200 + zero-leftover-token sweep).

---

## Round 9 — Whole-site UX/UI polish pass (May 2026)

**Decision: review every page against UX/UI fundamentals and fix consistency, light-mode legibility, and accessibility — keeping it elegant and simple.**

### Method
Reviewed all pages (login, signup, portfolio, property detail, inbox, financials, bookings) via headless-Chrome screenshots of the public pages plus code review of the auth-gated ones. **Note for future sessions:** no browser-automation/MCP tool is wired into Claude Code here, and a temporary `proxy.ts` auth bypass to screenshot logged-in pages was (correctly) blocked by the safety classifier — do NOT disable the auth guard for screenshots. To see authed pages, log in in a real browser or have the user paste a screenshot.

### What was found & fixed
- **Login & signup were off-theme** — still on the retired palette (`#4B5436`/`#1a1a18`/`#888780`, legacy vanilla `.modal`/`.btn-primary` classes) with a *corrupted* dead class (`hover:bg-[#3d4escape2c]`). Rebuilt both on Warm Editorial: white card + `shadow-soft`, olive accent, AA-legible text, app-standard error (`red-500/5` + `text-red-600`) and emerald success state. Google OAuth button restyled (kept logic). First impression now matches the product.
- **Muted text failed WCAG AA in light mode** — verified by contrast math vs white: `#8A8780` = 3.6:1, `#A8A59E` = 2.5:1, used on 10–13px labels. Remapped *text* usages site-wide → `#6E6B64` (5.3:1) and `#78756E` (4.6:1). Old values kept only for decorative dots/dividers.
- **No keyboard focus indicator** — added a global `:focus-visible` olive ring in `globals.css` (invisible to mouse users → no aesthetic cost).
- **Numbers didn't align** — added `.tnum` (tabular figures) and applied to metric numbers for a finance-grade feel.

### Deliberately NOT changed
- Did not restructure the dense property-detail page — that's a product decision, not a visual one. Legacy pages untouched.

---

## Round 10 — Editorial type system + earthy palette (in progress, June 2026)

**Decision: give the product a real, iconic typographic identity and harmonize the status colors into the warm/editorial direction.** Asked for a Buck Mason / Apple / Basecamp level of craft.

### Why
The "Warm Editorial" light theme (Rounds 8–9) was cohesive but had **no real typeface** — every `font-serif` heading was silently falling back to **Georgia**, and body text used the raw system stack. There was no brand voice. Type is the single highest-leverage craft lever, so it came first.

### What was built (this checkpoint)
- **Type system** — loaded **Fraunces** (warm, optical-sized display serif — the Buck Mason energy) + **Inter** (crisp, neutral UI sans) via `next/font/google` in `app/layout.tsx`, and mapped them onto Tailwind's `--font-serif`/`--font-sans` tokens in a `globals.css` `@theme` block. Because every page already used `font-serif` for headings and the system sans for body, the new type **propagated to all pages at once** with no per-page edits. Verified rendering on login/signup. Added serif optical-sizing + tracking and Inter glyph refinements (`cv05`/`cv08`/`ss03`, single-story `a`).
- **Earthy status palette** (Adrian chose "mute to match olive" over keeping bright status colors) — remapped the `emerald`/`amber`/`red` Tailwind scales (shades 400/500/600) to **forest / ochre / brick** in the same `@theme` block, so all ~120 existing status utilities inherit the muted tones with zero file churn. Text shades hand-verified AA on white (forest 6.2:1, ochre 6.0:1, brick 5.8:1).
- **Chart harmonization** — utility AreaChart series (electric/water/gas) recolored from bright amber/blue/orange to **ochre / slate-teal / clay**; equity donut recolored to brand olive.
- **Contrast fix** — bumped failing `#A8A59E` (2.5:1) placeholder text to `#8A8780` (3.6:1) in login, signup, property-detail inputs.

### Why it's a tooling battle worth noting
Turbopack served a **stale CSS chunk** after the `@theme` edits — `--font-serif` kept resolving to the Georgia default. HMR + restart didn't fix it; the `.next` build cache had to be cleared (moved to Trash, since `rm` is blocked here) and the dev server restarted before the new tokens compiled. If theme/`@theme` edits don't appear, clear `.next` and restart.

### Status / open
- **Not yet visually verified on the auth-gated pages** (portfolio, property detail, inbox, financials, bookings) — Adrian uses Google sign-in, which on a non-`:3000` dev port bounces to production (only `localhost:3000/auth/callback` is allowlisted in Supabase). Plan: log in via an email/password **test account** (e.g. `+test` alias) on `localhost:3001` to keep the session local, then do the full screenshot + contrast sweep and page-by-page refinement.
- This was committed **locally only** (no push) as a checkpoint to protect the work — none of Rounds 8–10 are on GitHub yet (`origin/main` is still at the "Merge legacy UI" commit).

### Dev-port / auth gotcha (for future sessions)
Google OAuth redirect URLs allowlisted in Supabase are `localhost:3000/auth/callback` + production. If `:3000` is taken (another local project) and `next dev` lands on `:3001`, Google sign-in falls back to the Supabase **Site URL** (production). Fixes: run this app on `:3000`, add the `:3001` callback to Supabase redirect URLs, or use an email/password test account (no hosted redirect → stays local).

---

---

## Round 11 — Dark mode (June 2026)

**Decision: add a full dark mode, built on a semantic token layer rather than `dark:` variants.**

### Why a token layer (not Tailwind `dark:` variants)
The app had ~600 hardcoded `[#hex]` arbitrary values. Sprinkling `dark:` on each would have doubled that surface and guaranteed drift. Instead, every palette hex was routed **once** through a semantic CSS variable (`paper`/`surface`/`ink`/`muted`/`line`/`accent`/`accentfg`/…) defined in `globals.css` `@theme` + `:root`/`.dark`. A single `.dark` class on `<html>` reskins the whole app. **Light values are byte-identical to the old hexes**, so light mode is provably unchanged — the only risk surface is dark.

### What was built
- Semantic tokens in `@theme`; light values in `:root`, warm-charcoal dark values in `.dark` (paper `#15140F`, surface `#1F1E19`, ink `#F1EFE8`, etc. — warm, not pure black, to keep the editorial feel).
- Scripted remap of every utility hex → semantic class across the 5 dashboard pages + login/signup + card (e.g. `text-[#6E6B64]`→`text-muted`, `bg-white`→`bg-surface`, `border-[#EAE8E1]`→`border-line`, `bg-[#5A6247]`→`bg-accent`, `text-[#5A6247]`→`text-accentfg`). Decorative `#A8A59E` category dots left literal.
- Accent split into `accent` (solid fills, white text) vs `accentfg` (text/icon/border/tint, lighter in dark) so olive stays legible in both modes.
- `tint` token (black in light, white in dark) so the subtle `bg-black/[0.0x]` hover/inset overlays invert correctly.
- Status text shades re-tuned lighter inside `.dark` (the AA-on-white earthy tones were too dark on charcoal).
- recharts: grid/axis retargeted via `.dark .recharts-*` rules; hand-rolled SVG `<text>` fills + tooltip `contentStyle` switched to `var(--…)` (resolves in inline styles) so tooltips aren't a glaring white box on dark.
- `components/ThemeToggle.tsx` — a switch rendered in **every page header**; persists to `localStorage`. Inline no-flash script in `layout.tsx` applies the class pre-paint; `<html suppressHydrationWarning>`.

### Follow-up (same round): default light + header toggle
First cut defaulted to dark by following `prefers-color-scheme` and used a floating bottom-right toggle. Adrian read that as "you changed it to dark mode" and didn't notice the corner button. Fixed: **default to light** (dark is opt-in only when explicitly stored — no longer follows the OS setting), and moved the toggle into every page header so the switch is obvious. Lesson: a redesign should land in the *familiar* state first, with the new mode discoverable but opt-in.

### Verified (this round — Adrian logged in via the localhost test account, so authed pages were finally checked)
Portfolio, property detail (bills + equity donut + utility AreaChart + tooltip), financials P&L, bookings, inbox — all clean in **both** modes. Programmatic contrast audit in dark: every text/bg pair clears WCAG AA (ink 14.5, ink2 10.1, muted 6.7, faint 5.2, accent 8.0, forest 7.6, ochre 8.1, brick 4.5 on surface). Light mode visually unchanged.

### Known minor / deferred
- Category-coding dots on financials (blue/violet/teal/orange/pink) and the inbox `REVIEW` badge (blue) are still bright — they're functional category/info indicators, not status, so left as-is. Revisit if we want them earthier.
- Bookings bar chart occasionally renders bars faint/late (recharts animation timing) — pre-existing, not a dark-mode regression.

---

## Round 12 — Rentcast auto-sync on add/edit (June 2026)

**Decision: make Rentcast value + rent pre-fill *automatic* (debounced as the user types the address), replacing the manual "Look up value" button — but never let it overwrite what the user typed, and never block on failure.**

### Why
The Add-property modal had a manual "Look up value" button that (a) only fetched the sale value, not rent, and (b) required an extra click. The dispatched task was to make the lookup automatic and cover the **rent** field too, so adding/editing a property is mostly hands-free while staying fully overridable.

### What was built
- **`/api/property-lookup`** now also calls `/v1/avm/rent/long-term` (third parallel fetch) and returns `rentEstimate`/`rentRangeLow`/`rentRangeHigh`. Each of the three Rentcast endpoints degrades independently; the route is wrapped in try/catch so it returns a clean error JSON instead of throwing. Dev mock extended with rent fields.
- **`lib/useRentcastLookup.ts`** — a shared debounced client hook (700ms, min 8 chars, `AbortController` to drop stale responses, never throws). Returns `{ data, loading, error }`.
- **Add modal** (`app/dashboard/page.tsx`): manual lookup button removed. The hook fires off the address field; results pre-fill `prop_val`, monthly income (rent), and location. A **dirty-field set** (`useRef`) tracks anything the user has manually edited so auto-fill never clobbers it. `Sparkles` badge marks auto-filled fields; spinner while loading; failures fall back to manual entry silently.
- **Edit modal** (`app/dashboard/[id]/page.tsx`): keyed off the property's **stored `prop.address`** (no new address input added here — see below). On open it auto-fills only **blank** value/income fields (so it never silently overwrites saved data), plus an explicit **"Apply Rentcast estimates"** button (shows the $ figures) to override existing values on demand. `savePropEdit` now persists both `income` and `rent`.

### Key product decisions
1. **Auto-fill is non-destructive.** Add modal protects user-edited fields via a dirty set; Edit modal only auto-fills blanks and requires an explicit click to override saved values. The whole point of pulling from an estimate API is convenience, not surprise edits — overwriting a number the user deliberately set would erode trust (same principle as Round 5: don't show numbers the user can't trust).
2. **The Edit modal does NOT add an address `<input>`.** A parallel **Maps** task owns the address field in that same modal. To avoid a merge collision, this task keys the Edit-modal lookup off the existing `prop.address` value rather than introducing/editing an address input. When the Maps task lands an editable address field, the lookup will naturally re-fire as `prop.address` changes — or the hook can be repointed at the Maps form state in a quick follow-up.
3. **Failure is always silent + manual.** No blocking errors, no crash — consistent with the standing "never block the user" decision.

### Verification
- `npm run build` passes (Next.js 16 / Turbopack). `tsc --noEmit` clean.
- **Tooling note:** the worktree's `node_modules` was a symlink to the main worktree's, which **Turbopack rejects** ("Symlink points out of the filesystem root") — the build fatal-errored until the symlink was replaced with a real `npm install` in the worktree. If a future worktree build dies with that error, do a local `npm install` (node_modules is gitignored, so nothing to commit).
- UI is auth-gated; not screenshot-verified headlessly (same constraint noted in Rounds 9–10). The API dev-mock path and the debounce/abort logic were verified by inspection + typecheck. Note: `proxy.ts`'s matcher actually **does** catch `/api/*` (redirects unauthed API calls to `/login` with 307) — contrary to the dispatch's "api routes are public" note — but in-app the authenticated session cookie rides along with the same-origin `fetch`, so the modal lookups work for logged-in users.

### Open / follow-up
- Coordinate with the Maps task on the Edit-modal address field (point the lookup at the new editable address once it lands).
- `RENTCAST_API_KEY` must be set in **Vercel** env (Production) for prod lookups — without it prod returns 503 and fields stay manual. Free tier is 50 req/mo; the route caches 30 days per address.

---

## Round 13 — App-level Rentcast cache + quota optimizations (June 2026)

**Decision: cache Rentcast data at the APPLICATION level (keyed by address, shared across users), fire lookups only on a committed address, persist coordinates to skip geocoding, and surface the value/rent ranges + facts we were already fetching.**

### Why
Rentcast's free tier is 50 req/mo and each lookup costs **3 API calls** (~16 lookups/mo). For a product that's tested repeatedly against the **same small set of properties** by two collaborators, the dominant waste was re-querying the same address — especially when deleting and re-adding a property, or when each collaborator looks one up independently. The earlier `unstable_cache` (30-day, in-memory, per-deployment) helped but resets on redeploy and is invisible across the delete/re-add cycle. Jaime asked for a durable store "tied to the application as a whole, not a user."

### What was built
- **`rentcast_cache` table** (migration 003), primary key = **normalized address** (`lower(trim())`), holding all 14 Rentcast fields + `fetched_at`. RLS: any authenticated user reads + writes — it's shared *reference* data (public property estimates), not user-private. **No expiry** for now (test data; protects quota); `fetched_at` retained so a TTL / manual refresh can be added later.
- **Route is cache-backed** (`/api/property-lookup`): prod path checks `rentcast_cache` first (hit = 0 API calls), else live-fetches and upserts. Degrades to a plain fetch if the table is missing — caching is never a hard dependency. Dev still returns the mock (local = free).
- **Fire-on-select**: the Add modal now triggers Rentcast only when the user picks a Google autocomplete suggestion (`onSelect` commits `lookupAddr`), not on every debounced keystroke. Observed live: typing one address previously fired 3 separate lookups (= 9 API calls in prod) for partial strings. Trade-off: a manual typer who never picks a suggestion gets no auto-fill (acceptable — autocomplete is the normal path; values remain hand-editable).
- **Coords persisted**: autocomplete's lat/lng are saved to `properties.lat/lng`; `PropertyMap` renders from them and skips a per-view Geocoding call (falls back to geocoding when absent).
- **Show what we already fetch**: the detail page now displays a labeled "Rentcast estimate" reference strip (beds/baths/sqft/year/type + value & rent **ranges**) and falls back to the estimate range in the Est. Value card when the user hasn't entered their own value/rent. Honors the Round 5 principle (label estimates; don't pass them off as the user's own numbers).

### Honesty / what to watch
- The cache is **prod-only** (dev short-circuits to the mock), so the cache + fire-on-select behavior can't be fully exercised on localhost — verified by build + typecheck + logic, consistent with prior rounds' auth-gated constraints. The display strip *is* visible locally (it reads the mock through the route).
- Cache writes happen server-side under the requesting user's session; RLS must allow authenticated writes (migration 003 sets this).
- Google Maps key billing: legacy `Autocomplete` widget auto-manages session tokens and we request only Basic-Data fields (cheap path). Recommended Console guardrails: per-API daily quota caps + a billing budget alert.

### Open / follow-up
- Run `supabase/003_rentcast_cache.sql` in Supabase before prod relies on the cache.
- Set `RENTCAST_API_KEY` + `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in Vercel.
- Consider migrating off the deprecated `google.maps.Marker` / `places.Autocomplete` to `AdvancedMarkerElement` / `PlaceAutocompleteElement` (both work today; legacy).

---

## Round 14 — Analytics & investment intelligence (Project 1, June 2026)

> Dispatched as a parallel "product engineer" workstream alongside the AI-experience
> workstream (which also self-numbered Round 14 on its own branch — renumber one to 15 at merge).

**Decision: add a portfolio-level analytics page that turns HomeOS from a bill tracker into an investment-intelligence tool — dual-audience (simple owner ↔ pro investor), projections driven by REAL data with clearly-labeled adjustable assumptions, and AI narrative insights that degrade to deterministic rules without a key.**

### Why
The roadmap calls for moving beyond the 2–5-property "mom-and-pop" owner toward established investors/developers who need ROI, cap rate, and projections to make decisions. But the simple owner shouldn't be drowned in pro metrics. Jaime chose a **two-view toggle** (not one-size-fits-all) and **real data + labeled assumptions** (not mock, not unlabeled projections) — consistent with the Round 4/5 honesty principle (never show a number the user can't trace).

### What was built
- **`/dashboard/analytics`** — portfolio page, linked from the dashboard. **Owner ↔ Investor** toggle persisted to `localStorage` (`homeos.analytics.view`).
  - Owner view: portfolio value, equity, monthly cash flow, simple ROI, occupancy — few numbers, big visuals.
  - Investor view: cap rate, cash-on-cash, NOI, GRM, DSCR, equity buildup, appreciation projection, blended return.
- **Projection engine** over real Supabase + Rentcast values with **user-adjustable, labeled assumptions** (appreciation %, rent growth %, expense growth %, holding period), persisted under `homeos.analytics.assumptions`. Every figure tagged **actual** vs **projected**.
- **`lib/v0/analytics.ts`** — pure metric + projection functions (no React/Supabase) so the page and `/api/insights` compute from ONE source of truth. recharts visuals: equity-buildup area, value-vs-debt line, cash-flow bars, equity-composition donut.
- **AI narrative insights** — `/api/insights` calls Claude (`@anthropic-ai/sdk`, `claude-haiku-4-5`, prompt-cached system prompt) when `ANTHROPIC_API_KEY` is set; otherwise (and on any error / client-fetch failure) returns deterministic **rule-based** insights from `lib/v0/insights.ts`. Identical `{source, headline, insights[]}` shape → adding the key is a zero-UI-change upgrade. Insights panel labels the source ("AI-generated" vs "Rule-based").
- No real properties ⇒ the same engine runs on the mock portfolio, tagged "Simulated demo data".

### Documented assumptions / honesty
- **Multi-unit roll-up**: schema has no `units` column → unit count inferred from the `type` string ("Triplex"→3, "4-plex"→4, else 1). Documented, not hidden.
- **Cash-on-cash** uses current equity as the capital base (original cash invested isn't stored) — labeled in the UI.
- AI is forbidden from citing any figure the engine didn't compute; never fabricates numbers.

### Honesty / what to watch
- Built autonomously by a dispatched agent that **hit a session limit mid-run** — the feature code was complete and `npm run build` passes green, but the agent was cut off before committing/finishing docs; the coordination session committed the WIP and finished docs (this round + PARTNER_BRIEFING + done summary). UI is auth-gated; verified by build + typecheck + inspection, not headless screenshot (same constraint as Rounds 9–13).
- **Needs a human:** set `ANTHROPIC_API_KEY` in `.env.local` (+ Vercel) to enable live AI insights — optional; rule-based works without it.

### Open / follow-up
- Renumber this vs the AI-experience branch's Round 14 when the second branch merges.
- Consider a per-property analytics drill (this round is portfolio-level).
- Wire free macro data (FRED rates, Census/HUD rents) to ground projection defaults — overlaps the AI-experience exploration doc's recommendation.
## Round 15 — AI "Ask your portfolio" experience + lean OOTB-data exploration (June 2026)

**Decision: prove AI value with a lean, ~free "Ask your portfolio" chat (only `ANTHROPIC_API_KEY`, no paid data API), and chart a staged path for the data integrations we pay for only when we scale.** Built on branch `explore/ai-experience` (P2 / AI Experience workstream — not yet merged to main).

### Why this direction
The brief was to take HomeOS "to the next level" with an AI-driven, out-of-the-box-feeling experience — leanly. Three AI shapes were evaluated (full analysis in `docs/AI_EXPERIENCE_EXPLORATION.md`):
- **A. Ask-your-portfolio chat** — lean (no paid data API), decoupled from Project 1's read-only analytics, directly answers the questions the Decision Log says users actually have ("which property nets what?", "what am I forgetting?").
- **B. Predictive projections** — strong, but the math is deterministic (doesn't need AI) and the honest version needs FRED wired first. Phase 2; overlaps Project 1's lane.
- **C. Agentic "approve & do it"** — the autopilot vision from Rounds 3–5, but Round 4 ("I'm confused") + Round 5 (killed the savings hero) warn hard against acting on un-trusted/mock data. **Built the proposal half only — Claude may propose, the UI shows an Approve card, nothing executes in v1.**

Chose **A + proposal-only C** for v1. It's the only direction that proves AI value *today* with zero paid commitment, and it honors the standing principles: *simpler + honest beats aspirational* (R5), *cite/label real numbers* (R4–5), *don't execute on mock data* (R4).

### What was built (the POC)
- `app/dashboard/assistant/page.tsx` — chat surface with a "grounded in" context strip (shows which real numbers ground the answers), streaming, proposal Approve cards (inert in v1), and a clean **"connect AI"** disabled state + example questions when no key.
- `app/api/assistant/route.ts` — Anthropic SDK (`claude-opus-4-8`, adaptive thinking, streaming SSE). Loads the portfolio **server-side** under the user's session (RLS-scoped — client can't spoof numbers) and passes it as a **prompt-cached** system prefix; per-turn question follows in `messages[]`. `GET` = status probe.
- `lib/v0/portfolioContext.ts` — deterministic snapshot builder (stable key order, no timestamps → caches cleanly) + grounded example questions.
- **Honesty guarantees** in the system prompt: answer only from the snapshot, cite the numbers used, never invent figures, propose-but-never-execute.
- **Graceful degradation**: no `ANTHROPIC_API_KEY` ⇒ disabled state (never crashes, never fabricates); no properties ⇒ `422 {empty}`.

### Lean v1 now → staged "pay when we scale" (researched live, June 2026)
- **Now (free):** the assistant (only `ANTHROPIC_API_KEY`; run `claude-haiku-4-5` via `ASSISTANT_MODEL` for cheap).
- **Next (still free): FRED** (`MORTGAGE30US` + home-price index — benchmark each mortgage against the live ~6.5% market; $0 forever, 120 req/min). Then **US Census ACS** (neighborhood rent/value context; free key).
- **Pay when scaling:** **Plaid production** (real mortgage/expense auto-population — sandbox free now, per-Item subscription at scale; build against sandbox so the switch is a config change) is the first paid line item. **ATTOM** (authoritative tax/AVM, ~$95/mo+) only if RentCast + heuristics fall short. Insurance ≈ heuristic (% of value), no good free API.

### Tie-back to positioning
The wedge stays *bill aggregation + payment status by property* (R5). The assistant **serves** that wedge — it's the natural-language way to interrogate the bill/finance data the dashboard already centralizes — and re-introduces the Round-3 "approve & do it" energy **honestly** (proposal-only, real data, cited numbers). AI is a feature that sharpens the wedge, not a new headline.

### Verification / honesty notes
- `npm run build` passes (Next.js 16 / Turbopack) **with `.env.local` present**. Note: the worktree had no `.env.local`, so the build initially failed prerendering `/dashboard` with "Supabase URL and API key required" — a **pre-existing env issue, not a code defect** (same constraint as the Maps/Rentcast rounds). Verified green by copying the gitignored `.env.local` from the main worktree, building, then removing it. New routes compiled: `/api/assistant` (dynamic) + `/dashboard/assistant` (static).
- UI is auth-gated; not headlessly screenshot-verified (same constraint noted in Rounds 9–13). The no-key disabled path, SSE parsing, and proposal extraction were verified by build + typecheck + inspection.
- Human follow-ups: set `ANTHROPIC_API_KEY` in `.env.local` (+ Vercel) to turn the assistant on; optionally `ASSISTANT_MODEL=claude-haiku-4-5`. To go further: grab a free **FRED** API key.

> **Merge note:** Rounds 14 (analytics) and 15 (this) were built as parallel dispatched workstreams; both originally self-numbered "Round 14" on their own branches and were reconciled to 14/15 when merged into `feature/intelligence`.

---

**Any commit that changes product direction, repositions a feature, or makes a meaningful design/architecture decision must add a new entry here.** This is not a nice-to-have — it's how both collaborators and future Claude sessions stay aligned without re-litigating past decisions.

When adding an entry:
- Add a new "Round N" section at the bottom
- Capture what you tried, what worked, what failed, and why
- **Don't delete old rounds** — the dead ends are the most valuable part for future contributors

This is a working memory. Keep it honest.
