# Done — AI Experience + Lean OOTB Integration (Project 2)

**Branch:** `explore/ai-experience` (pushed to origin; NOT merged to main, NOT deployed to Vercel)
**Build:** `npm run build` passes (Next.js 16 / Turbopack) — green with `.env.local` present.

## Recommendation headline
**Ship the "Ask your portfolio" AI assistant now — it proves real AI value with zero paid signups (only `ANTHROPIC_API_KEY`); layer in free data APIs (FRED → Census) to feel out-of-the-box, and pay for Plaid production only once the assistant earns the pull.**

## What I built
A lean, working POC of the strongest lean+free direction — an AI assistant grounded in the user's REAL Supabase portfolio.

- **`app/dashboard/assistant/page.tsx`** — chat surface. Streams answers, shows a "grounded in" context strip (which real numbers ground the answers), renders proposal **Approve** cards (inert in v1), and a clean **"connect AI"** disabled state + example questions when no key is set. Linked from the dashboard header (Sparkles "Assistant" button).
- **`app/api/assistant/route.ts`** — Anthropic SDK, `claude-opus-4-8` + adaptive thinking, streaming SSE. Loads the portfolio **server-side** under the user's session (RLS-scoped — client can't spoof numbers), serializes it into a **prompt-cached** system prefix (`cache_control: ephemeral`), per-turn question in `messages[]`. `GET` = status probe. **Graceful degradation:** no key ⇒ `503 {disabled:true}` (never fakes an answer); no properties ⇒ `422 {empty}`.
- **`lib/v0/portfolioContext.ts`** — deterministic snapshot builder (stable key order, no timestamps → caches cleanly) + grounded example questions.
- **Honesty:** system prompt forbids invented figures, requires citing the numbers used, and limits the model to *proposing* (never executing) actions. Proposal-only agentic touch via a ```proposal fenced-JSON block → Approve card; v1 executes nothing.
- `ASSISTANT_MODEL=claude-haiku-4-5` runs it cheap.

## Exploration doc
**`docs/AI_EXPERIENCE_EXPLORATION.md`** — live-researched (June 2026) tradeoff analysis of FRED, US Census, HUD FMR, Nominatim, Plaid, ATTOM, RentCast, insurance/tax sources (what each offers, auth, free-tier limits, cost-to-scale, value unlocked) + the three AI-experience options, ending with the lean-v1-now / staged-paid-path recommendation tied back to DECISION_LOG positioning.

## Docs updated
- `CLAUDE.md` — stack (@anthropic-ai/sdk), structure (new page/route/lib), a full gotcha entry, env vars (`ANTHROPIC_API_KEY`, `ASSISTANT_MODEL`).
- `PARTNER_BRIEFING.md` — page inventory, stack row, env, current-state "Done".
- `DECISION_LOG.md` — Round 14 documenting the exploration + POC decision.

## Checklist
- [x] `docs/AI_EXPERIENCE_EXPLORATION.md` (researched live, clear recommendation)
- [x] Working lean POC (assistant grounded in real portfolio) with graceful no-key state
- [x] `app/api/assistant/route.ts` (Anthropic SDK + prompt caching + disabled fallback)
- [x] `npm run build` passes
- [x] CLAUDE.md / PARTNER_BRIEFING.md / DECISION_LOG.md updated
- [x] Branch `explore/ai-experience` pushed to origin
- [x] This summary

## Needs a human
1. **Set `ANTHROPIC_API_KEY`** in `.env.local` (and Vercel env, when ready) to turn the assistant on. It's server-only (no `NEXT_PUBLIC_` prefix). Optionally set `ASSISTANT_MODEL=claude-haiku-4-5` for cheaper Q&A. Without the key the assistant shows the disabled "connect AI" state — nothing breaks.
2. **To go further (still free):** grab a free **FRED** API key (<https://fred.stlouisfed.org/docs/api/api_key.html>) — wiring `MORTGAGE30US` lets the assistant benchmark each mortgage against the live market. Next-freest is a **US Census** API key.
3. **The first paid step (later):** **Plaid** production (real mortgage/expense auto-population) — build against the free sandbox first; flip to production only when engagement justifies the per-Item subscription.
4. **Review** the exploration doc to confirm the P2 direction, then decide whether to merge `explore/ai-experience` to main.

## Notes / honesty
- Build green requires `.env.local` (Supabase keys) for the `/dashboard` prerender — the worktree shipped without one, a pre-existing env constraint (same as Maps/Rentcast rounds), not a code defect. Verified by temporarily copying the gitignored `.env.local` from the main worktree, building clean, then removing it. Nothing secret committed.
- UI is auth-gated; not headlessly screenshot-verified (same constraint as Rounds 9–13). No-key path, SSE parsing, and proposal extraction verified by build + typecheck + inspection.
