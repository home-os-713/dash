"use client";

// "Ask your portfolio" — the AI assistant chat surface.
//
// Streams grounded answers from /api/assistant (Claude, server-side, fed the
// user's real Supabase portfolio). Key behaviors:
//   - Loads the real portfolio client-side too, purely to show the user WHICH
//     numbers ground the answers (the grounded context chips) — the answer
//     itself is always grounded server-side, never from this client copy.
//   - Graceful "connect AI" state when ANTHROPIC_API_KEY is absent (probed via
//     GET /api/assistant). Never fakes an answer, never crashes.
//   - Renders an optional ```proposal block as an Approve card — proposal only,
//     nothing is executed in v1 (the Approve button is intentionally inert and
//     labeled as such).

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Home as HomeIcon,
  Send,
  Sparkles,
  Loader2,
  Plug,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import Markdown from "@/components/Markdown";
import { createClient } from "@/lib/supabase/client";
import { listUserProperties } from "@/lib/v0/db";
import {
  buildPortfolioSnapshot,
  EXAMPLE_QUESTIONS,
  type PortfolioSnapshot,
} from "@/lib/v0/portfolioContext";
import { fmtCurrency } from "@/lib/v0/mockData";

type Proposal = { action: string; target: string; reason: string };

type Msg = {
  role: "user" | "assistant";
  content: string;
  proposal?: Proposal | null;
};

// Pull a ```proposal fenced JSON block out of the model's text (if any) and
// return the prose without it + the parsed proposal.
function splitProposal(text: string): { prose: string; proposal: Proposal | null } {
  const m = text.match(/```proposal\s*([\s\S]*?)```/);
  if (!m) return { prose: text, proposal: null };
  let proposal: Proposal | null = null;
  try {
    const parsed = JSON.parse(m[1].trim());
    if (parsed && parsed.action && parsed.target) proposal = parsed as Proposal;
  } catch {
    proposal = null;
  }
  return { prose: text.replace(m[0], "").trim(), proposal };
}

export default function AssistantPage() {
  const [enabled, setEnabled] = useState<boolean | null>(null); // null = probing
  const [model, setModel] = useState<string>("");
  const [snapshot, setSnapshot] = useState<PortfolioSnapshot | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [approved, setApproved] = useState<Set<number>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  // Probe whether the AI is connected.
  useEffect(() => {
    fetch("/api/assistant")
      .then((r) => r.json())
      .then((d) => {
        setEnabled(!!d.enabled);
        setModel(d.model ?? "");
      })
      .catch(() => setEnabled(false));
  }, []);

  // Load the real portfolio (for the grounded-context display only).
  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const props = await listUserProperties(supabase);
        setSnapshot(buildPortfolioSnapshot(props));
      } catch {
        setSnapshot(null);
      } finally {
        setLoadingData(false);
      }
    })();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || streaming || enabled === false) return;
    setInput("");

    const history: Msg[] = [...messages, { role: "user", content: q }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setStreaming(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      // Non-stream error responses (disabled / empty / auth).
      if (!res.ok && res.headers.get("content-type")?.includes("application/json")) {
        const err = await res.json();
        if (err.disabled) setEnabled(false);
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            role: "assistant",
            content: err.error || "Something went wrong.",
          };
          return next;
        });
        setStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";

      // Parse the SSE event/data frames.
      const pump = async (): Promise<void> => {
        const { done, value } = await reader.read();
        if (done) return;
        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";
        for (const frame of frames) {
          const evLine = frame.split("\n").find((l) => l.startsWith("event: "));
          const dataLine = frame.split("\n").find((l) => l.startsWith("data: "));
          if (!evLine || !dataLine) continue;
          const event = evLine.slice(7).trim();
          const data = JSON.parse(dataLine.slice(6));
          if (event === "delta") {
            acc += data.text;
            const { prose } = splitProposal(acc);
            setMessages((prev) => {
              const next = [...prev];
              next[next.length - 1] = { role: "assistant", content: prose };
              return next;
            });
          } else if (event === "done") {
            const { prose, proposal } = splitProposal(acc);
            setMessages((prev) => {
              const next = [...prev];
              next[next.length - 1] = { role: "assistant", content: prose, proposal };
              return next;
            });
          } else if (event === "error") {
            setMessages((prev) => {
              const next = [...prev];
              next[next.length - 1] = {
                role: "assistant",
                content: `⚠ ${data.message}`,
              };
              return next;
            });
          }
        }
        await pump();
      };
      await pump();
    } catch {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: "assistant",
          content: "⚠ Couldn't reach the assistant. Try again.",
        };
        return next;
      });
    } finally {
      setStreaming(false);
    }
  }

  const hasProperties = (snapshot?.propertyCount ?? 0) > 0;

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-line2">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 -ml-2 rounded-xl hover:bg-accentfg/[0.08] transition-colors text-muted hover:text-ink"
              aria-label="Back to portfolio"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
              <HomeIcon className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-lg font-bold tracking-tight">Assistant</span>
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-accentfg bg-accentfg/[0.08] rounded-full px-2 py-0.5">
                <Sparkles className="w-3 h-3" /> Ask your portfolio
              </span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col">
        {/* Grounded-context strip */}
        <GroundedContext loading={loadingData} snapshot={snapshot} enabled={enabled} />

        {/* Conversation */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 py-4 min-h-[40vh]">
          {messages.length === 0 && (
            <EmptyState
              enabled={enabled}
              hasProperties={hasProperties}
              onPick={(q) => ask(q)}
            />
          )}

          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={
                  m.role === "user"
                    ? "max-w-[85%] bg-accent text-white rounded-2xl rounded-br-sm px-4 py-2.5 text-sm shadow-soft"
                    : "max-w-[85%] bg-surface border border-line rounded-2xl rounded-bl-sm px-4 py-3 text-sm shadow-soft"
                }
              >
                {m.role === "assistant" && !m.content && streaming && i === messages.length - 1 ? (
                  <span className="inline-flex items-center gap-2 text-muted">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Reading your portfolio…
                  </span>
                ) : m.role === "assistant" ? (
                  // Model replies are Markdown — render them cleanly (bold,
                  // lists, inline code, tables) instead of dumping raw text.
                  <Markdown>{m.content}</Markdown>
                ) : (
                  <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                )}

                {m.proposal && (
                  <ProposalCard
                    proposal={m.proposal}
                    approved={approved.has(i)}
                    onApprove={() => setApproved((s) => new Set(s).add(i))}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
          className="sticky bottom-0 bg-paper/80 backdrop-blur-xl pt-3 pb-4"
        >
          <div className="flex items-end gap-2 bg-surface border border-line rounded-2xl shadow-soft px-3 py-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={enabled === false || streaming}
              placeholder={
                enabled === false
                  ? "Connect AI to ask questions…"
                  : hasProperties
                  ? "Ask anything about your properties & finances…"
                  : "Add a property to start asking…"
              }
              className="flex-1 bg-transparent outline-none text-sm py-1.5 px-1 disabled:opacity-50 placeholder:text-faint"
            />
            <button
              type="submit"
              disabled={enabled === false || streaming || !input.trim()}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-accent text-white disabled:opacity-40 hover:bg-accentdark transition-colors"
              aria-label="Send"
            >
              {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[10px] text-faint mt-2 px-1">
            Answers are grounded in your real Supabase data and cite the numbers used. The assistant
            can propose actions but never changes anything on its own.
          </p>
        </form>
      </main>
    </div>
  );
}

// ── Grounded-context strip ────────────────────────────────────────────────────

function GroundedContext({
  loading,
  snapshot,
  enabled,
}: {
  loading: boolean;
  snapshot: PortfolioSnapshot | null;
  enabled: boolean | null;
}) {
  if (loading) {
    return (
      <div className="text-[11px] text-faint flex items-center gap-2 py-1">
        <Loader2 className="w-3 h-3 animate-spin" /> Loading your portfolio…
      </div>
    );
  }
  if (!snapshot || snapshot.propertyCount === 0) return null;
  const t = snapshot.totals;
  return (
    <div className="bg-surface border border-line rounded-2xl shadow-soft px-4 py-3 flex flex-wrap items-center gap-x-5 gap-y-1.5">
      <span className="text-[10px] uppercase tracking-wider text-muted mr-1">
        Grounded in
      </span>
      <Chip label="Properties" value={String(snapshot.propertyCount)} />
      <Chip label="Equity" value={fmtCurrency(t.equity)} />
      <Chip label="Income/mo" value={fmtCurrency(t.monthlyIncome)} />
      <Chip label="Bills/mo" value={fmtCurrency(t.monthlyBills)} />
      <Chip label="Net/mo" value={fmtCurrency(t.monthlyNOI)} />
      {enabled === false && (
        <span className="ml-auto text-[10px] text-amber-600 inline-flex items-center gap-1">
          <Plug className="w-3 h-3" /> AI not connected
        </span>
      )}
    </div>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="text-[10px] uppercase tracking-wider text-faint">{label}</span>
      <span className="text-sm font-semibold tnum">{value}</span>
    </span>
  );
}

// ── Empty state (and disabled "connect AI" state) ────────────────────────────

function EmptyState({
  enabled,
  hasProperties,
  onPick,
}: {
  enabled: boolean | null;
  hasProperties: boolean;
  onPick: (q: string) => void;
}) {
  if (enabled === false) {
    return (
      <div className="bg-surface border border-line rounded-2xl shadow-soft p-6 text-center max-w-lg mx-auto mt-6">
        <div className="w-11 h-11 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
          <Plug className="w-5 h-5 text-amber-600" />
        </div>
        <h2 className="font-serif text-lg font-bold mb-1">Connect AI to ask your portfolio</h2>
        <p className="text-sm text-muted mb-4">
          The assistant answers questions about your real properties and finances, grounded in your
          data. Add an <code className="text-accentfg">ANTHROPIC_API_KEY</code> to the environment to
          turn it on.
        </p>
        <p className="text-[11px] uppercase tracking-wider text-faint mb-2">You'll be able to ask</p>
        <div className="flex flex-col gap-2">
          {EXAMPLE_QUESTIONS.slice(0, 3).map((q) => (
            <div
              key={q}
              className="text-sm text-muted bg-tint/[0.03] border border-line rounded-xl px-3 py-2 text-left"
            >
              {q}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="text-center max-w-xl mx-auto mt-6">
      <div className="w-11 h-11 rounded-2xl bg-accentfg/[0.08] flex items-center justify-center mx-auto mb-3">
        <Sparkles className="w-5 h-5 text-accentfg" />
      </div>
      <h2 className="font-serif text-lg font-bold mb-1">Ask your portfolio anything</h2>
      <p className="text-sm text-muted mb-5">
        {hasProperties
          ? "Grounded in your real data — every answer cites the numbers it used."
          : "Add a property first, then I can answer questions about your finances."}
      </p>
      {hasProperties && (
        <div className="flex flex-col gap-2">
          {EXAMPLE_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => onPick(q)}
              className="text-sm text-left bg-surface border border-line rounded-xl px-4 py-2.5 hover:border-accentfg/40 hover:bg-accentfg/[0.03] shadow-soft transition-colors card-lift"
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Proposal card (proposal-only — nothing executes in v1) ───────────────────

function ProposalCard({
  proposal,
  approved,
  onApprove,
}: {
  proposal: Proposal;
  approved: boolean;
  onApprove: () => void;
}) {
  return (
    <div className="mt-3 border border-accentfg/30 bg-accentfg/[0.04] rounded-xl p-3">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-3.5 h-3.5 text-accentfg" />
        <span className="text-[10px] uppercase tracking-wider text-accentfg font-semibold">
          Proposed action
        </span>
      </div>
      <p className="text-sm font-medium">{proposal.action.replace(/_/g, " ")}</p>
      <p className="text-xs text-muted">
        {proposal.target} — {proposal.reason}
      </p>
      {approved ? (
        <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-emerald-600">
          <CheckCircle2 className="w-3.5 h-3.5" /> Approved (demo — not executed)
        </div>
      ) : (
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={onApprove}
            className="text-xs bg-accent text-white rounded-lg px-3 py-1.5 hover:bg-accentdark transition-colors"
          >
            Approve
          </button>
          <span className="inline-flex items-center gap-1 text-[10px] text-faint">
            <AlertCircle className="w-3 h-3" /> Proposal only — v1 never executes actions
          </span>
        </div>
      )}
    </div>
  );
}
