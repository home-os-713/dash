# Done — Analytics & Investment Intelligence (Project 1)

**Branch:** `feature/analytics` (pushed to origin; NOT merged to main, NOT deployed to Vercel)
**Build:** `npm run build` passes (Next.js 16 / Turbopack) — green.

> Note: the dispatched product-engineer agent built the full feature but **hit a session
> limit mid-run** and was cut off before committing/finishing docs. The coordination session
> committed the WIP, verified the build, finished the docs (DECISION_LOG Round 14,
> PARTNER_BRIEFING, this summary — CLAUDE.md was already done by the agent), and pushed the branch.

## Recommendation headline
**Ship it — `/dashboard/analytics` turns HomeOS into an investment tool (dual Owner/Investor views + real-data projections) and works fully today; adding `ANTHROPIC_API_KEY` upgrades the insights from rule-based to Claude with zero UI change.**

## What was built
- **`app/dashboard/analytics/page.tsx`** — portfolio analytics page, linked from the dashboard.
  - **Owner ↔ Investor** view toggle, persisted to `localStorage` (`homeos.analytics.view`).
    Owner = simple (value, equity, cash flow, ROI, occupancy); Investor = pro (cap rate,
    cash-on-cash, NOI, GRM, DSCR, equity buildup, appreciation projection, blended return).
  - **Adjustable, labeled projection assumptions** (appreciation %, rent growth %, expense
    growth %, holding period), persisted under `homeos.analytics.assumptions`. Every figure
    tagged actual vs projected.
  - recharts visuals: equity-buildup area, value-vs-debt line, cash-flow bars, equity donut.
  - No real properties ⇒ runs on the mock portfolio, tagged "Simulated demo data".
- **`lib/v0/analytics.ts`** — pure metric + projection engine (no React/Supabase), the single
  source of truth shared by the page and `/api/insights` (AI can't cite a number the UI didn't derive).
- **`lib/v0/insights.ts`** — insight types + deterministic rule-based generator (the no-key fallback).
- **`app/api/insights/route.ts`** — calls Claude (`@anthropic-ai/sdk`, `claude-haiku-4-5`,
  prompt-cached system prompt) when `ANTHROPIC_API_KEY` is set; else returns rule-based insights.
  Identical `{source, headline, insights[]}` shape either way.

## Documented assumptions (honesty)
- Multi-unit count inferred from `type` string (no `units` column) — labeled.
- Cash-on-cash uses current equity as the capital base (original cash invested isn't stored) — labeled.
- AI is forbidden from citing any figure the engine didn't compute.

## Docs updated
- `CLAUDE.md` — stack (@anthropic-ai/sdk), structure (new page/route/libs), a full gotcha entry,
  env vars (`ANTHROPIC_API_KEY`). (Done by the agent.)
- `DECISION_LOG.md` — Round 14 (added by coordination session).
- `PARTNER_BRIEFING.md` — page inventory, stack row, env, Done entry (added by coordination session).

## Checklist
- [x] `/dashboard/analytics` with Owner/Investor toggle
- [x] Projection engine with adjustable, labeled assumptions over real data
- [x] recharts visuals
- [x] `app/api/insights/route.ts` with Claude + rule-based fallback (graceful w/o key)
- [x] `npm run build` passes
- [x] CLAUDE.md / DECISION_LOG.md / PARTNER_BRIEFING.md updated
- [x] Branch `feature/analytics` pushed to origin
- [x] This summary

## Needs a human
1. **Set `ANTHROPIC_API_KEY`** in `.env.local` (and Vercel, when ready) to enable live AI
   insights. Optional — the page works fully with rule-based insights without it.
2. **Test locally:** `git checkout feature/analytics && npm install && npm run dev` →
   open `/dashboard/analytics`, toggle Owner/Investor, adjust assumptions.
3. **At merge:** this branch and `explore/ai-experience` both added a "Round 14" to
   DECISION_LOG — renumber one to 15 when the second branch merges.

## Notes / honesty
- UI is auth-gated; verified by build + typecheck + inspection, not headless screenshot
  (same constraint as Rounds 9–13).
- Build green requires `.env.local` (Supabase keys) present for the `/dashboard` prerender —
  pre-existing env constraint, not a code defect.
