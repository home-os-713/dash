# Task — AI Experience + Lean OOTB Integration (Project 2)

## Your identity
You are a **Product Engineer** owning the **AI Experience** workstream of HomeOS end-to-end.
Your job is to take HomeOS "to the next level": an AI-driven experience that makes the app
feel out-of-the-box ready, and a thorough, honest exploration of how to get there leanly
(free/cheap now) while proving enough value to justify paying for services as we scale.
Be rigorous and opinionated. Own design, exploration, a working POC, and docs.

## Communication Contract
- Execute fully and autonomously. Permissions are pre-approved (bypass mode on).
- Do NOT ask questions — make the most reasonable call and document it.
- Work on branch `explore/ai-experience` ONLY. Do NOT touch `main`. Do NOT deploy to Vercel.
- When done: build green, docs updated, branch pushed to origin, summary written.
- Only stop if genuinely blocked (missing dep you cannot work around, unfixable build).

## Context (read FIRST)
- Repo root is your worktree. Read before coding: CLAUDE.md, DECISION_LOG.md, PARTNER_BRIEFING.md
- Stack: Next.js 16 App Router (TS), Supabase, Tailwind CSS v4, shadcn/ui, recharts, lucide-react
- Real property data in Supabase (`properties`, bills, bookings, utility_months, action_items);
  helpers in lib/v0/db.ts. Rentcast lookup in app/api/property-lookup/route.ts.
- Use the `claude-api` skill for any Anthropic SDK work; include prompt caching.

## Two deliverables

### A. Exploration & decision doc — `docs/AI_EXPERIENCE_EXPLORATION.md`
A thorough, honest tradeoff analysis so we can decide together when the human is back. Cover:
1. **Lean/free data APIs to make HomeOS OOTB** — research LIVE (use WebSearch) and verify
   current availability/pricing (your training data may be stale). Evaluate at least:
   FRED (rates/housing indices), US Census, HUD (fair-market rents), OpenStreetMap/Nominatim
   (geocoding), Plaid (bank/mortgage aggregation — sandbox free, prod paid/approval),
   mortgage/loan data sources, insurance/tax sources. For each: what it offers, auth
   complexity, free-tier limits, cost-to-scale, and the value it unlocks.
2. **AI experience options** — ask-your-portfolio chat, predictive projections, agentic
   "approve & do it" actions. For each: architecture, token-cost implications, what proves value.
3. **Recommendation:** a lean v1 we can ship for ~free now, and a staged "what we pay for
   when we scale" path. Tie it back to the positioning in DECISION_LOG.md.

### B. Lean working POC (the strongest lean+free direction)
Build a real, working proof of the most promising lean direction. Bias toward an
**AI "Ask your portfolio" experience** because it's lean (only needs ANTHROPIC_API_KEY,
no paid data API) and decoupled from Project 1's read-only insights:
- A chat surface (e.g. `/dashboard/assistant` or a docked panel) where the user asks
  questions about their real properties/finances and Claude answers grounded in their
  Supabase data (pass the portfolio as structured context; cite the numbers used).
- Server route `app/api/assistant/route.ts` using the Anthropic SDK (`claude-opus-4-8`,
  or haiku for cheap), with prompt caching of the portfolio/system context.
- Optionally include a small agentic touch: Claude can *propose* an action (e.g. "set this
  bill to autopay") returned as a structured suggestion the UI renders as "Approve" — but
  do NOT execute irreversible actions; proposal-only for v1.
- **Graceful degradation:** with NO ANTHROPIC_API_KEY, show a clean disabled/"connect AI"
  state with example questions — never crash, never fake answers.
- If you judge a different lean POC proves more value, you may build that instead — but
  justify the choice in the exploration doc.

## Guardrails
- Keep it LEAN: no paid API signups, no new paid dependency. Free/sandbox tiers only.
- Honesty: never fabricate data or AI output; label everything; cite the real numbers used.
- DECOUPLED from Project 1 (analytics insights+visuals). Your lane: interactive AI experience
  + the OOTB-integration exploration. They should complement, not overlap.
- Don't over-build — a focused, excellent POC beats a sprawling half-done one.

## Deliverables (checklist — put in your summary)
- [ ] docs/AI_EXPERIENCE_EXPLORATION.md (researched live, with a clear recommendation)
- [ ] Working lean POC (AI assistant grounded in real portfolio data) with graceful no-key state
- [ ] `app/api/assistant/route.ts` (Anthropic SDK + prompt caching + rule/disabled fallback)
- [ ] npm run build passes
- [ ] CLAUDE.md (structure + env vars: ANTHROPIC_API_KEY), PARTNER_BRIEFING.md,
      DECISION_LOG.md (round documenting the exploration + POC decision) updated
- [ ] Branch `explore/ai-experience` pushed to origin
- [ ] Summary to .claude/dispatches/done/ai-experience.md (what you built, the recommendation
      headline, and what needs a human: ANTHROPIC_API_KEY, plus any API to sign up for to go further)

## Definition of done
A reviewer can read the exploration doc and immediately decide the P2 direction, AND
`git checkout explore/ai-experience`, build green, run dev, and try the AI assistant POC
(rule/disabled state now, full AI once ANTHROPIC_API_KEY is added).
