// ── Portfolio insights API ────────────────────────────────────────────────────
//
// POST { view, assumptions, portfolio, projection }  →  { source, headline, insights[] }
//
// Graceful degradation by design:
//   • ANTHROPIC_API_KEY set  → Claude generates plain-English commentary from the
//     user's REAL computed numbers (model `claude-haiku-4-5` for cost; the figures
//     are already derived server-side so a small fast model is plenty).
//   • no key                 → deterministic rule-based insights from the SAME
//     numbers (lib/v0/insights.ts). No fake AI, no fabricated figures.
//
// Adding the key upgrades quality with ZERO UI change — the client always POSTs
// the same payload and renders { headline, insights[] } the same way.
//
// Prompt caching: the system prompt (role, rules, schema description) is static
// and marked `cache_control: ephemeral`, so repeated requests in a session reuse
// it — only the small per-request portfolio JSON is uncached.

import Anthropic from "@anthropic-ai/sdk";
import { ruleBasedInsights, type InsightsInput, type InsightsResponse } from "@/lib/v0/insights";

export const runtime = "nodejs";

// Stable, cacheable system prompt. Edits here invalidate the cache (intended).
const SYSTEM_PROMPT = `You are a property-investment analyst writing for a real-estate owner-operator using the HomeOS portfolio dashboard.

You will be given a JSON object with the user's REAL portfolio metrics (already computed from their data) plus a forward PROJECTION computed under explicit assumptions.

Your job: produce a short, sharp, plain-English read of their portfolio.

HARD RULES — non-negotiable:
- Use ONLY the numbers present in the provided JSON. Never invent, estimate, or round to a different figure. If a field is null, treat it as unknown and say so rather than guessing.
- Clearly distinguish ACTUAL figures (portfolio.*) from PROJECTED ones (projection.*). When citing a projected number, say it's projected / under the stated assumptions.
- Be specific: cite the actual dollar amounts, percentages, and ratios from the JSON.
- Be honest about risk and about missing data. Do not hype.
- "owner" view → friendly, plain language, minimal jargon. "investor" view → use the pro ratios (cap rate, cash-on-cash, NOI, GRM, DSCR) by name.

OUTPUT: Respond ONLY with a JSON object matching this TypeScript type, no markdown, no prose around it:
{
  "headline": string,            // one punchy sentence summarizing the portfolio
  "insights": Array<{
    "title": string,             // <= 8 words
    "body": string,              // 1-2 sentences, cites real numbers
    "tone": "positive" | "watch" | "neutral"
  }>                             // 3 to 6 items, most decision-relevant first
}`;

function isValidInput(b: unknown): b is InsightsInput {
  if (!b || typeof b !== "object") return false;
  const o = b as Record<string, unknown>;
  return (
    (o.view === "owner" || o.view === "investor") &&
    typeof o.assumptions === "object" &&
    typeof o.portfolio === "object" &&
    o.portfolio !== null
  );
}

export async function POST(request: Request) {
  let input: InsightsInput;
  try {
    const body = await request.json();
    if (!isValidInput(body)) {
      return Response.json({ error: "invalid input" }, { status: 400 });
    }
    input = body;
  } catch {
    return Response.json({ error: "invalid JSON" }, { status: 400 });
  }

  // No key → deterministic fallback. Same shape, no fabrication.
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(ruleBasedInsights(input));
  }

  try {
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" }, // cache the stable instructions
        },
      ],
      messages: [
        {
          role: "user",
          content: `Here is the portfolio data:\n\n${JSON.stringify(input)}`,
        },
      ],
    });

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    const parsed = parseAiInsights(text);
    if (!parsed) {
      // Model returned something unparseable — fall back rather than show nothing.
      return Response.json(ruleBasedInsights(input));
    }
    const result: InsightsResponse = { source: "ai", ...parsed };
    return Response.json(result);
  } catch {
    // Any API error (rate limit, outage, bad key) → never break the page.
    return Response.json(ruleBasedInsights(input));
  }
}

// Tolerant parse: strip code fences, pull the first {...} block, validate shape.
function parseAiInsights(
  text: string
): Pick<InsightsResponse, "headline" | "insights"> | null {
  try {
    const cleaned = text.replace(/```json\s*|\s*```/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    const obj = JSON.parse(cleaned.slice(start, end + 1));
    if (typeof obj.headline !== "string" || !Array.isArray(obj.insights)) return null;
    const insights = obj.insights
      .filter(
        (i: unknown) =>
          i &&
          typeof i === "object" &&
          typeof (i as Record<string, unknown>).title === "string" &&
          typeof (i as Record<string, unknown>).body === "string"
      )
      .map((i: Record<string, unknown>) => ({
        title: String(i.title),
        body: String(i.body),
        tone:
          i.tone === "positive" || i.tone === "watch" || i.tone === "neutral"
            ? (i.tone as "positive" | "watch" | "neutral")
            : "neutral",
      }))
      .slice(0, 6);
    if (insights.length === 0) return null;
    return { headline: obj.headline, insights };
  } catch {
    return null;
  }
}
