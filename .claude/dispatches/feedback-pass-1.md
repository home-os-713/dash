# Task — Feedback Pass 1 (investor-first polish) on feature/intelligence

## Your identity
You are a **Product Engineer** owning a focused polish pass on HomeOS. The unified
`feature/intelligence` branch (analytics + AI assistant) just passed user testing. Jaime gave
5 pieces of feedback. Execute all 5 with strong design taste, build green, push a branch.

## Guiding principle (applies to everything)
**HomeOS is becoming investor-first.** The dashboard's job is portfolio/investment intelligence;
property management (bills, autopay) is *supported but secondary*. When in doubt, favor the
investor lens: portfolio value, equity, cash flow, ROI/returns — over bill-tracking chrome.
Keep the existing design language (warm editorial, Tailwind v4 tokens, recharts, lucide). Honor
the standing honesty rules (label projected vs actual; never fabricate).

## Communication Contract
- Execute fully and autonomously. Permissions pre-approved. Make reasonable design calls and
  document them. Only stop if truly blocked.
- Work on branch **`feature/intelligence-polish`** (branch off current HEAD = feature/intelligence,
  which already contains analytics + assistant). Do NOT touch `main`. Do NOT deploy. The
  coordinator merges to main after a human preview.
- `npm run build` MUST pass before you finish.

## The 5 changes

### 1. Analytics: collapse Owner/Investor toggle into ONE unified view
`app/dashboard/analytics/page.tsx` currently has an Owner ↔ Investor toggle. **Remove the toggle**
and present a single, well-organized view that shows the full context together — headline portfolio
stats (value, equity, cash flow, ROI) AND the investor metrics (cap rate, cash-on-cash, NOI, GRM,
DSCR) AND the projections + charts + AI insights. Organize it so it's digestible (sections/hierarchy),
not a wall. Drop the `homeos.analytics.view` localStorage logic. Keep the adjustable assumptions.

### 2. Assistant: render markdown properly
`app/dashboard/assistant/page.tsx` currently shows the model's **raw markdown** as plain text
(see bold `**…**`, `-` lists rendering literally). Render it cleanly. Use a lightweight renderer
(`react-markdown` + `remark-gfm` is fine — small, standard) styled to match the app (tight spacing,
bold, lists, paragraphs, inline code). **Also tune the assistant system prompt** in
`app/api/assistant/route.ts` to keep replies simple, consistent, and scannable (short paragraphs +
tight bullet lists; avoid heavy nesting). Goal: clean, friendly, consistent formatting — not a
markdown dump. Keep streaming working (render incrementally or on completion, your call).

### 3. Property detail: replace "financial summary" with in-place per-property analytics
On `app/dashboard/[id]/page.tsx`, **remove the "financial summary" section** and replace it with an
**in-place analytics section for that single property** — reuse the `lib/v0/analytics.ts` engine
(the same source of truth the portfolio analytics + assistant use) to show this property's metrics:
cap rate, cash-on-cash, NOI, monthly cash flow, equity, and a compact projection/visual if it fits.
This is the per-property analytics drill. Keep it consistent with the portfolio analytics styling.

### 4. Property detail: remove the map, full-width banner
On `app/dashboard/[id]/page.tsx`, **remove the `PropertyMap` widget**. Make the property banner/header
take the **full width** of that row (it currently shares the row with the compact map). Don't delete
`components/PropertyMap.tsx` itself (leave it for possible reuse) — just stop rendering it here, and
clean up the now-unused import/layout. The Maps autocomplete on the add-property modal stays untouched.

### 5. Dashboard home: redesign the top headline card (investor overview)
On `app/dashboard/page.tsx`, the top card currently reads like "N bills across M properties · X on
autopay" — too text-heavy and bill-centric. **Redesign it into an interactive, scannable PORTFOLIO
OVERVIEW headline** — the investor's at-a-glance summary across all properties: total portfolio
value, total equity, net monthly cash flow, blended return (ROI/cap rate), property count, occupancy
if available. Make it visually scannable (stat tiles/numbers, not a sentence) and lightly interactive
(e.g., tiles hover; consider linking the overview to `/dashboard/analytics`). **Demote** the bills/
autopay line to a small secondary element — supported, not the headline. Reuse `lib/v0/analytics.ts`
for the portfolio numbers so they match the analytics page exactly.

## Guardrails
- Reuse `lib/v0/analytics.ts` as the single source of truth for all portfolio/property numbers
  (chart, assistant, dashboard, property detail must agree).
- Keep graceful degradation everywhere (no key → rule-based/disabled; no data → clean empty states).
- Keep deps lean — only `react-markdown`/`remark-gfm` if you do #2 that way; document any add in CLAUDE.md.
- Don't break the existing auth, add-property, Rentcast, or assistant flows.

## Deliverables (put in your summary)
- [ ] All 5 changes implemented
- [ ] `npm run build` passes
- [ ] Docs updated: CLAUDE.md (structure/deps/gotchas as needed), PARTNER_BRIEFING.md (page inventory
      if changed), DECISION_LOG.md (Round 16 documenting this investor-first polish pass + decisions)
- [ ] Branch `feature/intelligence-polish` pushed to origin
- [ ] Summary → `.claude/dispatches/done/feedback-pass-1.md` (what changed per item, key design calls,
      anything needing a human)

## Definition of done
A reviewer can `git checkout feature/intelligence-polish`, build green, run dev, and see: one unified
analytics view, nicely-rendered assistant replies, per-property analytics on the detail page (no
financial-summary, no map, full-width banner), and an investor-overview headline on the dashboard.
Your final message to me = concise report (branch, build status, the 5 items, design calls, follow-ups).
