// "Ask your portfolio" — the AI assistant route.
//
// Grounds Claude in the user's REAL Supabase portfolio (read server-side under
// the requesting user's session, so the client can't spoof the numbers) and
// streams an answer back. Design notes:
//
//   - Model: claude-opus-4-8 (adaptive thinking). Set ASSISTANT_MODEL=claude-haiku-4-5
//     to run it cheap.
//   - Prompt caching: the system prompt + the serialized portfolio snapshot are
//     one cached prefix (cache_control: ephemeral on the last system block). The
//     per-turn question goes in messages[], AFTER the cached prefix, so repeated
//     questions about the same portfolio reuse the cache. The snapshot is built
//     deterministically (stable key order, no timestamps) so the prefix bytes
//     don't drift between turns.
//   - Graceful degradation: with NO ANTHROPIC_API_KEY the route returns a clean
//     503 { disabled: true } — it NEVER fabricates an answer. The UI renders a
//     "connect AI" state instead.
//   - Optional agentic touch: the model MAY return a single structured proposal
//     (e.g. "set this bill to autopay") which the UI renders as an Approve card.
//     PROPOSAL ONLY — this route never mutates data.

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { listUserProperties } from "@/lib/v0/db";
import {
  buildPortfolioSnapshot,
  type PortfolioSnapshot,
} from "@/lib/v0/portfolioContext";

export const runtime = "nodejs";

const MODEL = process.env.ASSISTANT_MODEL || "claude-opus-4-8";

type ChatTurn = { role: "user" | "assistant"; content: string };

function systemPrompt(snapshot: PortfolioSnapshot): string {
  // STABLE prefix — everything here must be byte-identical across turns for the
  // same portfolio so the prompt cache hits. The portfolio JSON is sorted/typed
  // upstream; no Date.now()/random IDs anywhere in this string.
  return [
    "You are HomeOS Assistant, a grounded financial copilot embedded in a property-investment dashboard.",
    "",
    "RULES:",
    "1. Answer ONLY from the PORTFOLIO DATA below. It is the user's real data, pulled live from their database.",
    "2. When you state a number, cite where it came from (e.g. \"Phoenix nets $1,240/mo (income $2,650 − bills $1,410)\"). Never invent figures.",
    "3. If the data can't answer the question, say so plainly and suggest what the user could add. Do not guess.",
    "4. Be concise and concrete. Prefer a direct answer + the one or two numbers that support it over long preambles.",
    "5. All amounts are USD. Monthly figures are monthly unless a field says otherwise. 'NOI' here = monthly income − all monthly bills (the mortgage payment is included as a bill line when present).",
    "6. You CANNOT take actions or change anything. If the user asks you to do something (e.g. enable autopay, pay a bill), you may PROPOSE it — see PROPOSALS — but you never execute it.",
    "",
    "FORMATTING (your reply is rendered as Markdown in a chat bubble — keep it simple, consistent, and scannable):",
    "- Lead with a one-sentence direct answer. No preamble, no restating the question.",
    "- Use short paragraphs (1–2 sentences). When listing properties or figures, use a flat bullet list ('- '); never nest bullets more than one level.",
    "- Bold the key number or property name with **…** so the eye can find it. Don't bold whole sentences.",
    "- Keep replies short — a few sentences or up to ~5 bullets. Don't pad. No headings for a normal answer (only use a heading if the reply genuinely has 2+ distinct sections).",
    "- Money as $1,240, percentages as 6.2%. Be consistent across the whole reply.",
    "",
    "PROPOSALS (optional): If—and only if—the user clearly asks you to perform a concrete, reversible change to a single bill or property, you may end your reply with a fenced ```proposal block containing JSON:",
    '```proposal',
    '{"action":"enable_autopay","target":"<property name> / <bill name>","reason":"<one short sentence>"}',
    "```",
    "Only emit a proposal block when the user asked for an action. Otherwise omit it entirely. Proposals are suggestions the user must approve in the UI; they are never auto-applied.",
    "",
    "PORTFOLIO DATA (JSON, from the user's database):",
    JSON.stringify(snapshot, null, 2),
  ].join("\n");
}

export async function POST(request: Request) {
  // 1) Graceful degradation — no key, no AI. Never fake an answer.
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        disabled: true,
        error:
          "AI assistant is not connected. Set ANTHROPIC_API_KEY to enable it.",
      },
      { status: 503 }
    );
  }

  // 2) Parse the conversation. messages = prior turns + the new question.
  let body: { messages?: ChatTurn[] };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const turns = (body.messages ?? []).filter(
    (m) => m && (m.role === "user" || m.role === "assistant") && m.content?.trim()
  );
  if (turns.length === 0 || turns[turns.length - 1].role !== "user") {
    return Response.json(
      { error: "Expected a non-empty messages array ending in a user turn" },
      { status: 400 }
    );
  }

  // 3) Load the user's REAL portfolio server-side (RLS scopes it to them).
  let snapshot: PortfolioSnapshot;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }
    const properties = await listUserProperties(supabase);
    snapshot = buildPortfolioSnapshot(properties);
  } catch {
    return Response.json(
      { error: "Could not load your portfolio data" },
      { status: 500 }
    );
  }

  if (snapshot.propertyCount === 0) {
    return Response.json(
      {
        empty: true,
        error:
          "No properties found in your portfolio yet. Add a property first, then ask away.",
      },
      { status: 422 }
    );
  }

  // 4) Stream the grounded answer. The system prompt (prompt + portfolio) is the
  //    cached prefix; the per-turn messages follow it.
  const client = new Anthropic({ apiKey });

  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 2048,
    thinking: { type: "adaptive" },
    system: [
      {
        type: "text",
        text: systemPrompt(snapshot),
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: turns.map((m) => ({ role: m.role, content: m.content })),
  });

  const encoder = new TextEncoder();
  const sse = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) =>
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      try {
        for await (const ev of stream) {
          if (
            ev.type === "content_block_delta" &&
            ev.delta.type === "text_delta"
          ) {
            send("delta", { text: ev.delta.text });
          }
        }
        const final = await stream.finalMessage();
        send("done", {
          usage: {
            inputTokens: final.usage.input_tokens,
            outputTokens: final.usage.output_tokens,
            cacheReadInputTokens: final.usage.cache_read_input_tokens ?? 0,
            cacheCreationInputTokens:
              final.usage.cache_creation_input_tokens ?? 0,
          },
          model: final.model,
        });
      } catch (err) {
        send("error", {
          message:
            err instanceof Error ? err.message : "Assistant request failed",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(sse, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

// Lightweight status probe for the UI: is the assistant connected?
export async function GET() {
  return Response.json({
    enabled: !!process.env.ANTHROPIC_API_KEY,
    model: MODEL,
  });
}
