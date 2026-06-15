# AI Experience + Lean OOTB Integration — Exploration & Decision

> **Workstream:** AI Experience (Project 2) · **Branch:** `explore/ai-experience` · **Date:** 2026-06-14
> **TL;DR recommendation:** Ship the **"Ask your portfolio" AI assistant** now — it's the only direction that proves real value with **zero paid signups** (needs just `ANTHROPIC_API_KEY`). Layer in **free data APIs (FRED, Census, HUD, Nominatim)** to make the app feel out-of-the-box, and reserve the **paid tier (Plaid production, ATTOM)** for when the assistant has demonstrated enough pull to justify it.

This doc is a researched, honest tradeoff analysis so we can decide the P2 direction together. Pricing/limits below were verified **live** in June 2026 (sources at the bottom) because training data goes stale fast on this stuff.

---

## 1. Lean / free data APIs to make HomeOS feel out-of-the-box

The goal: make a freshly-signed-up user feel like the app already *knows things* — without forcing them to hand-enter every number, and without us paying for data before we have revenue. Each API below is rated on what it unlocks, auth complexity, free-tier limits, and cost-to-scale.

### FRED (Federal Reserve Economic Data) — **★ adopt now, free**
- **What it offers:** 800,000+ US economic time series, including the one that matters most here: `MORTGAGE30US` (30-yr fixed avg, currently ~6.52% as of June 2026), plus home-price indices (Case-Shiller), CPI/inflation, rent CPI, regional series.
- **Auth:** Free account → 32-char API key. Trivial. Server-side only.
- **Free-tier limits:** **120 requests/minute**, no monthly cap, no cost tier at all — *everything* is free.
- **Cost to scale:** $0. There is no paid tier.
- **Value unlocked:** "Your 4.1% mortgage is **2.4 points below** today's 6.5% market rate — refinancing makes no sense." Benchmark each property's mortgage rate against the live market; contextualize equity growth against the home-price index. This is **the single highest-value free integration** — it turns static user numbers into insight with one cached daily fetch.

### US Census Bureau API — **★ adopt soon, free**
- **What it offers:** American Community Survey (ACS) — median home value, median rent, median household income, owner/renter split, by state/county/ZIP/tract. 2024 ACS is live.
- **Auth:** Free API key **required as of May 2026** for >500 queries/day (≤500/day works keyless per IP).
- **Free-tier limits:** Up to 50 variables/query, **500 queries/IP/day** without a key; register (free) for more. Cumulative across all app users.
- **Cost to scale:** $0.
- **Value unlocked:** Neighborhood context — "median rent in this ZIP is $1,950; you're charging $2,650 (36% above area median)." Good for the "is my rent right?" question and for a future market-position widget. Lower priority than FRED because RentCast already gives us per-property rent estimates.

### HUD Fair Market Rents (FMR) — **adopt if STR/Section-8 angle matters, free**
- **What it offers:** HUD's official FMR by ZIP/county/metro and bedroom count — the rent ceiling used for housing vouchers; a conservative "floor" rent benchmark.
- **Auth:** Free **bearer token** (log in to HUD USER, create token). The underlying data is public-domain government data; the official API gates it behind a free token.
- **Free-tier limits:** No published hard cap; it's a government dataset, reasonable use expected.
- **Cost to scale:** $0.
- **Value unlocked:** A second, independent rent benchmark (HUD FMR vs RentCast estimate vs actual). Useful but **overlaps RentCast** — lower priority. Worth it mainly if we ever target long-term/affordable-housing landlords.

### OpenStreetMap / Nominatim (geocoding) — **already partly covered; use as a free fallback**
- **What it offers:** Free address → lat/lng geocoding and reverse geocoding.
- **Auth:** None, but **strict usage policy**: max **1 request/second**, required identifying `User-Agent`/`Referer`, no heavy bulk geocoding, ODbL attribution required.
- **Free-tier limits:** ~1 req/sec on donated infrastructure. Not for high volume.
- **Cost to scale:** $0 on the public instance, but you're expected to self-host if you need volume.
- **Value unlocked:** We already use **Google Maps** for autocomplete + geocoding (paid-ish, key-gated). Nominatim is a viable **free fallback / cost-control** option for pin geocoding when the Google key is absent — but the 1 req/sec policy and attribution requirement make it a backstop, not a primary. **Don't migrate off Google for autocomplete** (UX is materially better); consider Nominatim only to geocode stored addresses server-side cheaply.

### Plaid (bank / mortgage aggregation) — **sandbox free now, paid at scale**
- **What it offers:** Live bank-linked data — **Liabilities** (real mortgage balance, rate, escrow, next payment), **Transactions** (auto-categorize property expenses), **Balance**, **Assets**. This is the dream for auto-populating the dashboard.
- **Auth:** OAuth-style Link flow + client_id/secret. More involved than a simple API key.
- **Free-tier:** **Sandbox is free & unlimited** (fake institutions, great for building). New **Trial plan** (US/CA, accounts created on/after Apr 15 2026): **10 production Items free** on *real* data, incl. Liabilities/Transactions. Then you must upgrade.
- **Cost to scale:** Production is **paid** — Transactions/Liabilities/Investments are **per-Item monthly subscription** fees (an Item ≈ one linked bank login), other products ~$0.10–0.60/call. Real money once past 10 Items, and it requires a Plaid production-access approval step.
- **Value unlocked:** The highest-fidelity auto-population possible — real mortgage balances, real categorized expenses, zero manual entry. **This is the marquee "pay-for-when-we-scale" integration.** Build against sandbox now (free), flip to production only when users are paying.

### Mortgage / loan data sources
- **Live market rates:** FRED `MORTGAGE30US` (free, above) covers the benchmark. **Adopt.**
- **Per-loan servicer data (your actual balance/escrow/history):** No free public API. The realistic paths are **Plaid Liabilities** (paid at scale, above) or manual entry (what we do today). MX/Finicity are Plaid-equivalents with similar paid models — no advantage. **Verdict:** FRED for the benchmark now; Plaid for real per-loan data later.

### Insurance / property-tax sources
- **Property tax:** No clean free nationwide API. Options: **RentCast** (already integrated — its property records include some tax/assessment data, 50 free calls/mo), **ATTOM** (158M properties, comprehensive tax/AVM — **free 30-day trial, then ~$95/mo+ custom quote**), TaxNetUSA/PropMix (paid). County assessor data is public but fragmented per-county (no unified free API).
- **Insurance:** No meaningful free quote API; carriers gate quoting behind partnerships. Estimating insurance as a % of property value (industry rule-of-thumb ~0.3–0.5%/yr) is a **free, good-enough** heuristic the assistant can apply with no API at all.
- **Verdict:** Lean on RentCast's existing data + simple heuristics now; ATTOM is the paid upgrade if we need authoritative tax/assessment data at scale.

### Summary table

| API | Unlocks | Auth | Free limit | Cost to scale | Verdict |
|---|---|---|---|---|---|
| **FRED** | Live mortgage-rate & home-price benchmarks | Free key | 120 req/min, no cap | **$0 forever** | **Adopt now** |
| **US Census ACS** | Neighborhood median rent/value/income | Free key (>500/day) | 500 q/IP/day keyless | $0 | Adopt soon |
| **HUD FMR** | Independent rent benchmark | Free bearer token | Reasonable use | $0 | Optional (overlaps RentCast) |
| **Nominatim** | Free geocoding fallback | None (UA required) | ~1 req/sec | $0 (self-host for volume) | Backstop only |
| **Plaid** | Real mortgage/expense auto-population | OAuth + secret | Sandbox free; 10 prod Items | **Per-Item subscription** | **Pay when scaling** |
| **ATTOM** | Authoritative tax/AVM, 158M props | Key | 30-day trial | **~$95/mo+** | Pay if needed |
| **RentCast** *(already in)* | Per-property value + rent | Key | 50 req/mo | Paid plan past 50 | Keep |
| **Insurance** | Premium estimates | — | — | — | Heuristic (% of value), no API |

---

## 2. AI experience options

Three shapes were on the table. Evaluated on architecture, token-cost, and what each *proves*.

### A. Ask-your-portfolio chat — **★ build this first**
- **Architecture:** Read the user's real Supabase portfolio server-side → serialize a compact, deterministic snapshot → pass it as a **cached system prefix** → stream Claude's grounded answer. No new data API; decoupled from Project 1's read-only analytics.
- **Token cost:** The portfolio snapshot is small (a few KB → ~1–3K tokens for a typical 2–5 property portfolio). With **prompt caching**, the snapshot+system prefix is written once and read at **0.1× input cost** on every follow-up turn in the same session. On `claude-opus-4-8` ($5/$25 per MTok) a typical Q&A turn is well under a cent; on `claude-haiku-4-5` ($1/$5) it's a fraction of that. Set `ASSISTANT_MODEL=claude-haiku-4-5` to run it cheap.
- **What it proves:** That conversational access to your own numbers is *useful* — "which property nets most?", "what's not on autopay?", "how much equity do I have?". It's the lowest-cost way to put real AI value in front of users and watch whether they engage. **Highest value-per-effort, lowest cost, zero paid dependency.**

### B. Predictive projections
- **Architecture:** Either deterministic math (amortization schedules, equity-growth curves, cash-flow forecasts) rendered as charts, *or* Claude-narrated projections grounded in FRED home-price/rate series.
- **Token cost:** Low if Claude only narrates pre-computed numbers; the heavy lifting is math, not tokens.
- **What it proves:** Forward-looking value ("at 3% appreciation you'll cross $X equity in 2028"). Strong, but: the *math* doesn't need AI (it's deterministic), and the honest version needs **FRED** wired for real appreciation/rate inputs. **Phase 2** — it pairs naturally with the FRED integration and overlaps Project 1's analytics lane, so it's better sequenced after the chat proves engagement.

### C. Agentic "approve & do it"
- **Architecture:** Claude proposes a concrete action (enable autopay, schedule a bill) → rendered as an Approve card → on approval, a server action mutates Supabase.
- **Token cost:** Comparable to chat (it's chat + a structured tool/proposal output).
- **What it proves:** The "autopilot" positioning from DECISION_LOG Rounds 3–5. **But** the Decision Log is explicit that agent-action framing with mock/aspirational data **erodes trust** (Round 4: "I'm confused"; Round 5 killed the savings hero). Executing irreversible actions before we've earned trust is the exact trap that round warned against.
- **Verdict:** Build the **proposal half only** for v1 — Claude *may* surface an Approve card, but **nothing executes**. This previews the autopilot vision honestly without the trust risk. Wiring real execution waits until (a) the data is real and (b) actions are reversible/audited.

---

## 3. Recommendation — lean v1 now, staged paid path later

### Lean v1 (ship now, ~free)
**Build the "Ask your portfolio" assistant** (Option A) + the **proposal-only agentic touch** (Option C, no execution).
- **Cost:** Only `ANTHROPIC_API_KEY`. No paid data signup, no new paid dependency. Runs on `claude-opus-4-8` (or `claude-haiku-4-5` for cheap), with **prompt caching** of the portfolio context so repeated questions are near-free.
- **Why this first:** It's the only direction that proves AI value *today* with zero paid commitment, it's decoupled from Project 1's analytics, and it directly answers the questions the Decision Log says users actually have ("which property nets what?", "what am I forgetting?") — grounded in real numbers, citing them, never fabricating. It honors every Decision Log principle: *simpler + honest beats aspirational* (Round 5), *label/cite real numbers* (Rounds 4–5), *don't execute on mock data* (Round 4).
- **This is the POC built on this branch.** See §4.

### Staged "what we pay for when we scale"
1. **FRED (still free) — next.** Wire `MORTGAGE30US` + home-price index so the assistant can benchmark each mortgage against the live market and narrate equity growth. **$0, highest ROI of any remaining integration.**
2. **Census ACS (still free).** Neighborhood rent/value context for the "is my rent right?" answer.
3. **Predictive projections (Option B).** Deterministic forecasts narrated by Claude, fed by FRED. Pairs with Project 1.
4. **Plaid production (paid trigger).** When users are engaged enough to justify it, flip from sandbox to production for real mortgage/expense auto-population. **First paid line item.** Build against the free sandbox now so the switch is a config change.
5. **ATTOM (paid, optional).** Authoritative tax/assessment data if RentCast + heuristics prove insufficient.
6. **Agentic execution (Option C, full).** Only once data is real and actions are reversible/audited.

### Tie-back to positioning (DECISION_LOG)
The converged positioning is *"every property bill, every property, in one place — paid on time, no thinking"* (Round 5), with the wedge being **bill aggregation + payment status by property**, not "AI." The assistant **serves that wedge** rather than competing with it: it's the natural-language way to interrogate exactly the bill/finance data the dashboard already centralizes. It re-introduces the "approve & do it" energy from Round 3 **honestly** (proposal-only, real data, cited numbers) — exactly the correction Rounds 4–5 demanded. AI is a *feature that makes the wedge sharper*, not a new headline. The free-data layer (FRED/Census) makes the app feel out-of-the-box without changing the wedge.

---

## 4. What was built (the POC on this branch)

- **`app/dashboard/assistant/page.tsx`** — chat surface. Loads the real portfolio for a "grounded in" context strip (so users see which numbers ground the answers), streams answers, renders proposal Approve cards (inert in v1), and shows a clean **"connect AI"** state when no key is set with example questions.
- **`app/api/assistant/route.ts`** — Anthropic SDK (`claude-opus-4-8`, adaptive thinking, streaming). Reads the portfolio **server-side** under the user's session (client can't spoof numbers), serializes it into a **prompt-cached** system prefix, and streams SSE. `GET` is a status probe. **Graceful degradation:** no `ANTHROPIC_API_KEY` → clean `503 {disabled:true}`, never a fake answer.
- **`lib/v0/portfolioContext.ts`** — deterministic snapshot builder (stable key order, no timestamps → caches cleanly) + grounded example questions.
- Honesty guarantees: the system prompt forbids invented figures, requires citing the numbers used, and limits the assistant to *proposing* (never executing) actions.

---

## Sources (verified live, June 2026)
- FRED API key & limits: <https://fred.stlouisfed.org/docs/api/api_key.html> · pricing: <https://apispine.com/fred/pricing>
- Census API key requirement & limits: <https://www.census.gov/data/developers.html>
- HUD FMR API: <https://www.huduser.gov/portal/dataset/fmr-api.html>
- Nominatim usage policy: <https://operations.osmfoundation.org/policies/nominatim/>
- Plaid pricing/sandbox/trial: <https://support.plaid.com/hc/en-us/articles/16194632655895-How-much-does-Plaid-cost-and-what-are-the-pricing-models> · <https://plaid.com/docs/sandbox/>
- ATTOM / RentCast / property-tax APIs: <https://www.attomdata.com/news/attom-insights/best-apis-real-estate/> · <https://www.rentcast.io/api>
- Anthropic pricing & prompt caching: <https://www.cloudzero.com/blog/claude-api-pricing/>
- Mortgage rate (June 2026 context): <https://www.bankrate.com/mortgages/analysis/mortgage-rates-june-10-2026/>
