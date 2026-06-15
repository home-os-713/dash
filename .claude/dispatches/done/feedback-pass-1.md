# Done — Feedback Pass 1 (investor-first polish)

**Branch:** `feature/intelligence-polish` (off `feature/intelligence`)
**Build:** `npm run build` passes green (Next.js 16 / Turbopack, with `.env.local` present)
**Deploy:** none (per brief — coordinator merges after human preview)

## What changed, per item

1. **Analytics — collapsed Owner/Investor toggle into ONE unified view** (`app/dashboard/analytics/page.tsx`).
   Dropped the toggle, the `ViewToggle` component, and all `homeos.analytics.view` localStorage logic. The page is now one sectioned scroll: *Portfolio at a glance* (value / equity / cash flow / blended return) → investor ratio strip (cap rate / CoC / GRM / DSCR / NOI, always shown) → *Projection* (adjustable labeled assumptions + headline) → charts → *By property* (full investor columns) → AI insights. Insights internally request `view: "investor"` so the rule-based generator always surfaces ratios. Adjustable assumptions kept.

2. **Assistant — render Markdown + tune system prompt** (`app/dashboard/assistant/page.tsx`, `app/api/assistant/route.ts`, new `components/Markdown.tsx`).
   Added `react-markdown` + `remark-gfm` (documented in CLAUDE.md). Assistant bubbles render through the themed `Markdown` component (bold, lists, inline code, tables) instead of raw `whitespace-pre-wrap`. Streaming preserved (re-parses accumulated text per delta). System prompt got a FORMATTING block: lead sentence, short paragraphs, single-level bullets, bold the key number, keep it short. User bubbles stay plain.

3. **Property detail — per-property analytics replaces "financial summary"** (`app/dashboard/[id]/page.tsx`).
   Removed the "Financial summary" expandable block in `RealPropertyDetail`; added a `PropertyAnalytics` section running the SAME `lib/v0/analytics.ts` engine (`computePropertyMetrics` + `projectProperty`): cap rate, cash-on-cash, NOI, monthly cash flow, equity, DSCR as tiles + a compact **projected** equity-buildup AreaChart. Matches portfolio analytics styling. Point-in-time = **actual**; chart = **projected** (default assumptions, link to /analytics). Numbers agree with the portfolio page by construction.

4. **Property detail — removed PropertyMap, full-width banner** (`app/dashboard/[id]/page.tsx`).
   Stopped rendering `<PropertyMap>`, removed its import + the banner/map flex wrapper, banner is now full-width. **Kept** `components/PropertyMap.tsx` (reusable). Add-property Maps autocomplete untouched; `lat`/`lng` still persisted.

5. **Dashboard home — portfolio overview headline** (`app/dashboard/page.tsx`).
   Replaced the bill-centric one-sentence hero with a `PortfolioOverview` card: total value, equity, net monthly cash flow, blended return as hoverable stat tiles (whole card links to `/dashboard/analytics`), property/unit count + occupancy in the header, bills/autopay demoted to a small secondary strip. Numbers from `computePortfolioMetrics`; a `mockAsDbProperties()` helper feeds the engine in demo mode so demo figures match /analytics.

## Single source of truth
All portfolio/property numbers (dashboard, analytics, property detail, assistant) flow through `lib/v0/analytics.ts` / `portfolioContext.ts` — they agree by construction.

## Verification
- Production build green; `tsc --noEmit` clean.
- `next dev` compiles all routes: `/login` 200, dashboard routes 307→login (auth guard intact), no 500s.
- UI is auth-gated → not headlessly screenshot-verified (documented constraint since Round 9; authed pages bounce to `/login`).
- Graceful degradation preserved: no `ANTHROPIC_API_KEY` → assistant "connect AI" state + rule-based insights; no data → clean empty states (incl. the new per-property analytics empty state).

## Docs updated
- `CLAUDE.md` — stack dep, project structure, components, analytics/property-detail/dashboard/assistant gotchas.
- `PARTNER_BRIEFING.md` — page inventory, tech stack, done list.
- `DECISION_LOG.md` — Round 16.

## Human follow-ups
- Set `ANTHROPIC_API_KEY` to enable live AI assistant + insights (optional; both degrade gracefully).
- Merge `feature/intelligence-polish` after a human preview. Pre-existing eslint `react-hooks` errors (Rentcast effect setState, mortgage `Date.now()` payoff calc) are untouched and don't block `next build`.
