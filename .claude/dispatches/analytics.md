# Task — Analytics & Investment Intelligence (Project 1)

## Your identity
You are a **Product Engineer** owning the **Analytics** workstream of HomeOS end-to-end.
You take this from product intent → shipped, build-green feature on a branch. Own the
design, the data wiring, the visuals, and the docs. Be opinionated and thorough.

## Communication Contract
- Execute fully and autonomously. Permissions are pre-approved (bypass mode on).
- Do NOT ask questions — make the most reasonable product/design call and document it in
  DECISION_LOG.md.
- Work on branch `feature/analytics` ONLY. Do NOT touch `main`. Do NOT deploy to Vercel.
- When done: build green, docs updated, branch pushed to origin, summary written.
- Only stop if genuinely blocked (missing dep you cannot work around, unfixable build).

## Context (read FIRST)
- Repo root is your worktree. Read before coding: CLAUDE.md, DECISION_LOG.md, PARTNER_BRIEFING.md
- Stack: Next.js 16 App Router (TS), Supabase, Tailwind CSS v4, shadcn/ui, recharts, lucide-react
- Real property data lives in Supabase `properties` (+ bills, bookings, utility_months, action_items).
  See lib/v0/db.ts for query helpers and lib/v0/mockData.ts for the mock fallback shape.
- Rentcast values available via app/api/property-lookup/route.ts.
- Design language: clean, editorial, calm. System/Georgia fonts. Earthy status palette.
  Reuse components/ui/* (Card, Badge) and existing patterns from /dashboard.

## Product requirements
Build a portfolio analytics experience that turns HomeOS from a bill tracker into an
**investment intelligence** tool — something a real-estate investor/developer uses to
understand ROI and make decisions, while staying simple for a 2–5 property owner.

1. **New route `/dashboard/analytics`** (portfolio-level). Link it from the dashboard nav/header.
2. **Dual view toggle: "Owner" (simple) ↔ "Investor" (pro).** Persist choice (localStorage).
   - Owner view: portfolio value, total equity, monthly cash flow, simple ROI, occupancy.
     Big, friendly, few numbers, great visuals.
   - Investor view: cap rate, cash-on-cash return, NOI, gross rent multiplier, DSCR,
     equity buildup, appreciation projection, blended portfolio return. Denser, pro.
3. **Projections with real data + labeled, user-adjustable assumptions.**
   - Inputs (sliders/fields, sensible defaults): annual appreciation %, rent growth %,
     expense growth %, holding period (years). Default appreciation/rent ~3–4%.
   - Compute projected value, equity, and cash flow over the holding period from REAL
     current values (Supabase + Rentcast). Clearly label projected vs actual, and label
     the assumptions ("Assumes 3.5% appreciation — adjust").
   - Visuals via recharts: equity-buildup area chart, value-over-time, cash-flow bars,
     portfolio composition. Make them genuinely good.
4. **AI narrative insights (graceful degradation).**
   - Server route `app/api/insights/route.ts`: if `process.env.ANTHROPIC_API_KEY` is set,
     call Claude (model `claude-opus-4-8` or `claude-haiku-4-5-20251001` for cost) to
     generate plain-English portfolio commentary from the user's real numbers
     (e.g. "Phoenix NOI is up 8% MoM; at 3.5% appreciation your equity reaches $X in 5y").
   - If NO key: return deterministic, rule-based insights computed from the same numbers
     (no fabrication, no fake AI). Architect so adding the key upgrades quality with no UI change.
   - Use prompt caching (cache the system prompt / portfolio schema) per the claude-api skill.
   - Never fabricate numbers — insights must derive from actual computed metrics.
5. Multi-unit / developer angle: support a property `type` of multi-unit/complex and roll
   up unit-level economics where data allows (ok to model units as a count + per-unit rent
   if schema lacks it — document any assumption).

## Guardrails
- Real data first; where a field is missing, degrade gracefully (hide or label "—"), never crash.
- Label any simulated/assumed value clearly (DECISION_LOG principle: honesty over aspiration).
- No new paid dependency. recharts is already in. If you add a small lib, justify in CLAUDE.md.
- This project is DECOUPLED from the AI-experience project (Project 2). Stay in your lane:
  insights + visuals here; interactive AI chat/agentic is Project 2's scope.

## Deliverables (checklist — put in your summary)
- [ ] `/dashboard/analytics` route with Owner/Investor toggle
- [ ] Projection engine with adjustable, labeled assumptions over real data
- [ ] Strong recharts visuals
- [ ] `app/api/insights/route.ts` with Claude + rule-based fallback (graceful w/o key)
- [ ] npm run build passes
- [ ] CLAUDE.md (structure + env vars: document ANTHROPIC_API_KEY), PARTNER_BRIEFING.md
      (page inventory), DECISION_LOG.md (new round documenting decisions/assumptions) updated
- [ ] Branch `feature/analytics` pushed to origin
- [ ] Summary written to .claude/dispatches/done/analytics.md (what you built, key decisions,
      what needs a human: ANTHROPIC_API_KEY in .env.local + Vercel for live AI)

## Definition of done
A reviewer can `git checkout feature/analytics`, `npm run build` (green), `npm run dev`,
open /dashboard/analytics, toggle Owner/Investor, adjust assumptions, see real projections +
visuals, and read insights (rule-based now, AI once the key is added).
