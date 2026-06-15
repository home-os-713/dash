"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo, useCallback } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import {
  Home as HomeIcon,
  ArrowLeft,
  Loader2,
  Sparkles,
  TrendingUp,
  Wallet,
  Building2,
  Percent,
  RotateCcw,
  Info,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import { listUserProperties, type DbPropertyWithBills } from "@/lib/v0/db";
import {
  computePortfolioMetrics,
  projectPortfolio,
  summarizeProjection,
  equityComposition,
  DEFAULT_ASSUMPTIONS,
  ASSUMPTION_BOUNDS,
  fmtMoney,
  fmtPct,
  fmtRatio,
  type Assumptions,
  type PortfolioMetrics,
} from "@/lib/v0/analytics";
import {
  ruleBasedInsights,
  type InsightsResponse,
  type InsightsInput,
} from "@/lib/v0/insights";
import {
  properties as mockProperties,
  billsByProperty as mockBillsByProperty,
} from "@/lib/v0/mockData";

const ASSUMPTIONS_KEY = "homeos.analytics.assumptions";

// Earthy chart palette (matches DECISION_LOG Round 10/11 harmonization).
const C = {
  equity: "var(--accentfg)", // olive
  value: "#5E7C88", // slate-teal
  debt: "#C39A55", // ochre
  cashflow: "#7E9F88", // forest
  clay: "#B0654A",
};
const PIE_COLORS = ["var(--accentfg)", "#5E7C88", "#C39A55", "#B0654A", "#7E9F88", "#8A7BA8"];

// Build DB-shaped properties out of the mock set so the demo (no real data)
// still drives the full analytics engine. Mirrors the portfolio page's fallback.
function mockAsDbProperties(): DbPropertyWithBills[] {
  return mockProperties.map((p) => ({
    id: p.id,
    user_id: "mock",
    name: p.name,
    address: p.address,
    location: p.location,
    type: p.type,
    prop_val: p.propVal,
    mort_pay: p.mortPay,
    mort_bal: p.mortBal,
    mort_orig: p.mortOrig,
    mort_rate: p.mortRate,
    income: p.id === "phoenix" ? 4850 : 3200,
    occupancy: p.id === "phoenix" ? 82 : 74,
    rent: p.id === "phoenix" ? 4850 : 3200,
    rent_bills: null,
    sort_order: null,
    lat: null,
    lng: null,
    updated_at: new Date().toISOString(),
    bills: (mockBillsByProperty[p.id] ?? []).map((b) => ({
      id: b.id,
      property_id: p.id,
      name: b.name,
      amount: b.amount,
      due_date: b.dueDate,
      paid: false,
      category: b.category,
      autopay: b.autopay,
      status: b.status,
      status_label: b.statusLabel,
      source: b.source ?? null,
    })),
  }));
}

export default function AnalyticsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [assumptions, setAssumptions] = useState<Assumptions>(DEFAULT_ASSUMPTIONS);
  const [dbProperties, setDbProperties] = useState<DbPropertyWithBills[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);

  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  // ── Restore persisted assumptions ───────────────────────────────────────────
  useEffect(() => {
    try {
      const a = localStorage.getItem(ASSUMPTIONS_KEY);
      if (a) setAssumptions({ ...DEFAULT_ASSUMPTIONS, ...JSON.parse(a) });
    } catch {}
  }, []);

  function persistAssumptions(a: Assumptions) {
    setAssumptions(a);
    try {
      localStorage.setItem(ASSUMPTIONS_KEY, JSON.stringify(a));
    } catch {}
  }

  // ── Load real properties (fall back to mock demo when none) ─────────────────
  useEffect(() => {
    listUserProperties(supabase)
      .then((rows) => {
        if (rows.length > 0) {
          setDbProperties(rows);
          setUsingMock(false);
        } else {
          setDbProperties(mockAsDbProperties());
          setUsingMock(true);
        }
      })
      .catch(() => {
        setDbProperties(mockAsDbProperties());
        setUsingMock(true);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derived metrics + projection (the single source of truth) ───────────────
  const metrics: PortfolioMetrics = useMemo(
    () => computePortfolioMetrics(dbProperties),
    [dbProperties]
  );
  const projection = useMemo(
    () => projectPortfolio(dbProperties, assumptions),
    [dbProperties, assumptions]
  );
  const summary = useMemo(() => summarizeProjection(projection), [projection]);
  const composition = useMemo(() => equityComposition(metrics), [metrics]);

  // Year-0 actual cash flow (annual) so the cash-flow bar chart can flag it.
  const cashFlowData = useMemo(
    () =>
      projection.map((y) => ({
        label: y.label,
        cashFlow: y.annualCashFlow,
        isActual: y.isActual,
      })),
    [projection]
  );

  // ── Fetch insights (debounced on metrics/assumptions/view) ──────────────────
  const fetchInsights = useCallback(
    async (signal: AbortSignal) => {
      if (metrics.propertyCount === 0) return;
      // Unified view → always surface the full investor-grade insight set.
      const input: InsightsInput = {
        view: "investor",
        assumptions,
        portfolio: metrics,
        projection: summary,
      };
      setInsightsLoading(true);
      try {
        const res = await fetch("/api/insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
          signal,
        });
        if (!res.ok) throw new Error("bad status");
        const data: InsightsResponse = await res.json();
        setInsights(data);
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        // Client-side graceful fallback — compute the same rule-based insights
        // locally so the panel always shows something real.
        setInsights(ruleBasedInsights({ view: "investor", assumptions, portfolio: metrics, projection: summary }));
      } finally {
        setInsightsLoading(false);
      }
    },
    [assumptions, metrics, summary]
  );

  useEffect(() => {
    if (loading || metrics.propertyCount === 0) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => fetchInsights(ctrl.signal), 500);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [fetchInsights, loading, metrics.propertyCount]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-line2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-muted hover:text-ink text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Portfolio</span>
            </Link>
            <span className="text-line2">/</span>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <span className="font-serif text-lg font-bold tracking-tight">Analytics</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 animate-rise stagger">
        {usingMock && !loading && (
          <div className="flex items-center gap-2 text-[10px] text-faint uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60" />
            Simulated demo data — add a real property to analyze your own portfolio
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-faint py-20 justify-center">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Crunching your portfolio…</span>
          </div>
        ) : (
          <>
            {/* ── Headline stats (value · equity · cash flow · return) ─────── */}
            <SectionLabel>Portfolio at a glance</SectionLabel>
            <HeroMetrics m={metrics} />

            {/* ── Investor ratios (cap rate · CoC · GRM · DSCR · NOI) ──────── */}
            <RatioStrip m={metrics} />

            {/* ── Projection assumptions + headline ───────────────────────── */}
            <SectionLabel>Projection</SectionLabel>
            <AssumptionsPanel
              assumptions={assumptions}
              onChange={persistAssumptions}
              onReset={() => persistAssumptions(DEFAULT_ASSUMPTIONS)}
            />
            {summary && summary.holdingPeriod > 0 && (
              <ProjectionHeadline summary={summary} assumptions={assumptions} />
            )}

            {/* ── Charts ──────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <EquityBuildupChart data={projection} />
              <ValueOverTimeChart data={projection} />
              <CashFlowChart data={cashFlowData} />
              {composition.length > 1 && <CompositionChart data={composition} />}
            </div>

            {/* ── Per-property breakdown (full investor columns) ──────────── */}
            <SectionLabel>By property</SectionLabel>
            <PerPropertyTable m={metrics} />

            {/* ── AI / rule-based insights ────────────────────────────────── */}
            <InsightsPanel insights={insights} loading={insightsLoading} />
          </>
        )}

        <div className="pt-6 pb-2 text-center">
          <p className="text-[10px] text-faint2 max-w-2xl mx-auto leading-relaxed">
            <strong>Actual</strong> figures derive from your stored property, mortgage, bill, and
            Rentcast data. <strong>Projected</strong> figures are modeled forward under the
            assumptions above and are estimates, not guarantees.
          </p>
        </div>
      </main>
    </div>
  );
}

// ── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] uppercase tracking-wider text-faint2 font-medium pt-2 -mb-1">
      {children}
    </h2>
  );
}

// ── Hero metrics (unified — value · equity · cash flow · blended return) ───────

function HeroMetrics({ m }: { m: PortfolioMetrics }) {
  const cards: {
    label: string;
    value: string;
    icon: typeof Building2;
    accent?: boolean;
    tone?: "pos" | "neg";
  }[] = [
    { label: "Portfolio value", value: fmtMoney(m.totalValue), icon: Building2 },
    { label: "Total equity", value: fmtMoney(m.totalEquity), icon: Wallet, accent: true },
    {
      label: "Monthly cash flow",
      value: fmtMoney(m.monthlyCashFlow),
      icon: TrendingUp,
      tone: m.monthlyCashFlow >= 0 ? "pos" : "neg",
    },
    { label: "Blended return", value: fmtPct(m.blendedCashOnCash), icon: Percent },
  ];

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <h1 className="text-xl sm:text-2xl font-serif font-bold">
          {m.propertyCount} {m.propertyCount === 1 ? "property" : "properties"}
          {m.unitCount > m.propertyCount && (
            <span className="text-muted font-normal"> · {m.unitCount} units</span>
          )}
        </h1>
        {m.avgOccupancy != null && (
          <span className="text-xs text-muted">{Math.round(m.avgOccupancy)}% avg occupancy</span>
        )}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 stagger">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`bg-surface border rounded-2xl shadow-soft p-4 sm:p-5 ${
              c.accent ? "border-accentfg/25" : "border-line"
            }`}
          >
            <div className="flex items-center gap-1.5 text-muted text-[11px] uppercase tracking-wider mb-2">
              <c.icon className="w-3.5 h-3.5" />
              {c.label}
            </div>
            <p
              className={`text-2xl font-bold tnum ${
                c.accent
                  ? "text-accentfg"
                  : (c as { tone?: string }).tone === "neg"
                    ? "text-red-500"
                    : (c as { tone?: string }).tone === "pos"
                      ? "text-emerald-600"
                      : "text-ink"
              }`}
            >
              {c.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Investor ratio strip ──────────────────────────────────────────────────────

function RatioStrip({ m }: { m: PortfolioMetrics }) {
  const ratios = [
    { label: "Cap rate", value: fmtPct(m.blendedCapRate), hint: "NOI ÷ value" },
    { label: "Cash-on-cash", value: fmtPct(m.blendedCashOnCash), hint: "cash flow ÷ equity" },
    { label: "GRM", value: fmtRatio(m.blendedGRM), hint: "value ÷ annual rent" },
    { label: "DSCR", value: fmtRatio(m.blendedDSCR), hint: "NOI ÷ debt service" },
    { label: "Mo. NOI", value: fmtMoney(m.annualNOI / 12), hint: "income − opex" },
  ];
  return (
    <div className="bg-surface border border-line rounded-2xl shadow-soft p-1 grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-line">
      {ratios.map((r) => (
        <div key={r.label} className="px-4 py-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted">{r.label}</p>
          <p className="text-lg font-bold tnum mt-0.5">{r.value}</p>
          <p className="text-[9px] text-faint2 mt-0.5">{r.hint}</p>
        </div>
      ))}
    </div>
  );
}

// ── Assumptions panel ─────────────────────────────────────────────────────────

function AssumptionsPanel({
  assumptions,
  onChange,
  onReset,
}: {
  assumptions: Assumptions;
  onChange: (a: Assumptions) => void;
  onReset: () => void;
}) {
  const keys = Object.keys(ASSUMPTION_BOUNDS) as (keyof Assumptions)[];
  return (
    <div className="bg-surface border border-line rounded-2xl shadow-soft p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium">Projection assumptions</h2>
          <span className="flex items-center gap-1 text-[10px] text-faint2">
            <Info className="w-3 h-3" /> drives every projected figure below
          </span>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1 text-[11px] text-muted hover:text-ink transition-colors"
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {keys.map((k) => {
          const b = ASSUMPTION_BOUNDS[k];
          return (
            <div key={k}>
              <div className="flex items-baseline justify-between mb-1.5">
                <label className="text-[11px] uppercase tracking-wider text-muted">{b.label}</label>
                <span className="text-sm font-semibold tnum text-accentfg">
                  {assumptions[k]}
                  <span className="text-faint text-[10px] font-normal ml-0.5">{b.unit}</span>
                </span>
              </div>
              <input
                type="range"
                min={b.min}
                max={b.max}
                step={b.step}
                value={assumptions[k]}
                onChange={(e) => onChange({ ...assumptions, [k]: Number(e.target.value) })}
                className="w-full accent-[color:var(--accent)] cursor-pointer"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Projection headline ───────────────────────────────────────────────────────

function ProjectionHeadline({
  summary,
  assumptions,
}: {
  summary: NonNullable<ReturnType<typeof summarizeProjection>>;
  assumptions: Assumptions;
}) {
  return (
    <div className="bg-accentfg/[0.05] border border-accentfg/20 rounded-2xl p-5 sm:p-6">
      <p className="text-[11px] uppercase tracking-wider text-accentfg mb-2 flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5" />
        Projected · assumes {assumptions.appreciation}% appreciation, {assumptions.rentGrowth}% rent
        growth
      </p>
      <p className="text-lg sm:text-xl font-serif leading-snug">
        In <strong>{summary.holdingPeriod} years</strong> your equity grows from{" "}
        <strong className="text-accentfg">{fmtMoney(summary.startEquity)}</strong> to{" "}
        <strong className="text-accentfg">{fmtMoney(summary.endEquity)}</strong> — a gain of{" "}
        <strong>{fmtMoney(summary.equityGain)}</strong>.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-accentfg/15">
        <MiniStat label="Appreciation" value={fmtMoney(summary.appreciationGain)} />
        <MiniStat label="Loan paydown" value={fmtMoney(summary.principalPaydown)} />
        <MiniStat label="Cumulative cash flow" value={fmtMoney(summary.totalCashFlow)} />
        <MiniStat
          label="Annualized return"
          value={fmtPct(summary.annualizedReturnPct)}
          accent
        />
      </div>
    </div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted">{label}</p>
      <p className={`text-base font-bold tnum mt-0.5 ${accent ? "text-accentfg" : "text-ink"}`}>
        {value}
      </p>
    </div>
  );
}

// ── Charts ────────────────────────────────────────────────────────────────────

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-line rounded-2xl shadow-soft p-5">
      <div className="mb-3">
        <h3 className="text-sm font-medium">{title}</h3>
        {subtitle && <p className="text-[11px] text-faint mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

const tooltipStyle = {
  background: "var(--surface)",
  border: "1px solid var(--line2)",
  borderRadius: 12,
  fontSize: 12,
  color: "var(--ink)",
} as const;

function moneyTick(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${Math.round(v / 1_000)}k`;
  return `$${v}`;
}

function EquityBuildupChart({ data }: { data: ReturnType<typeof projectPortfolio> }) {
  return (
    <ChartCard title="Equity buildup" subtitle="Appreciation + loan paydown over the holding period">
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.equity} stopOpacity={0.35} />
              <stop offset="100%" stopColor={C.equity} stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={moneyTick} tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} width={48} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => [fmtMoney(Number(v)), "Equity"]} />
          <Area type="monotone" dataKey="equity" stroke={C.equity} strokeWidth={2} fill="url(#equityFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function ValueOverTimeChart({ data }: { data: ReturnType<typeof projectPortfolio> }) {
  return (
    <ChartCard title="Value vs. debt" subtitle="Projected property value and remaining mortgage">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={moneyTick} tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} width={48} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [fmtMoney(Number(v)), n === "value" ? "Value" : "Debt"]} />
          <Line type="monotone" dataKey="value" stroke={C.value} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="debt" stroke={C.debt} strokeWidth={2} dot={false} strokeDasharray="4 3" />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-2 text-[11px] text-muted">
        <Legend color={C.value} label="Value" />
        <Legend color={C.debt} label="Mortgage balance" dashed />
      </div>
    </ChartCard>
  );
}

function CashFlowChart({ data }: { data: { label: string; cashFlow: number; isActual: boolean }[] }) {
  return (
    <ChartCard title="Annual cash flow" subtitle="Year 0 is actual; later years projected">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={moneyTick} tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} width={48} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => [fmtMoney(Number(v)), "Cash flow"]} />
          <ReferenceLine y={0} stroke="var(--line2)" />
          <Bar dataKey="cashFlow" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => (
              <Cell
                key={i}
                fill={d.cashFlow < 0 ? C.clay : d.isActual ? C.equity : C.cashflow}
                fillOpacity={d.isActual ? 1 : 0.75}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function CompositionChart({ data }: { data: ReturnType<typeof equityComposition> }) {
  return (
    <ChartCard title="Equity composition" subtitle="Share of total equity by property">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={50}
            outerRadius={85}
            paddingAngle={2}
            strokeWidth={0}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => fmtMoney(Number(v))} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
        {data.map((s, i) => (
          <div key={s.id} className="flex items-center gap-1.5 text-[11px] text-muted">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
            />
            {s.name} · {fmtPct(s.share, 0)}
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

function Legend({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="inline-block w-4 h-0.5 rounded"
        style={{ background: color, opacity: dashed ? 0.7 : 1 }}
      />
      {label}
    </span>
  );
}

// ── Per-property table ────────────────────────────────────────────────────────

function PerPropertyTable({ m }: { m: PortfolioMetrics }) {
  return (
    <div className="bg-surface border border-line rounded-2xl shadow-soft overflow-hidden">
      <div className="p-5 pb-3">
        <h3 className="text-sm font-medium">Per-property breakdown</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-muted border-y border-line">
              <th className="text-left font-medium px-5 py-2">Property</th>
              <th className="text-right font-medium px-3 py-2">Value</th>
              <th className="text-right font-medium px-3 py-2">Equity</th>
              <th className="text-right font-medium px-3 py-2">Cash flow/mo</th>
              <th className="text-right font-medium px-3 py-2">Cap</th>
              <th className="text-right font-medium px-3 py-2">CoC</th>
              <th className="text-right font-medium px-5 py-2">DSCR</th>
            </tr>
          </thead>
          <tbody>
            {m.perProperty.map((p) => (
              <tr key={p.id} className="border-b border-line last:border-0 hover:bg-tint/[0.015]">
                <td className="px-5 py-3">
                  <Link href={`/dashboard/${p.id}`} className="hover:text-accentfg transition-colors">
                    <span className="font-medium">{p.name}</span>
                    <span className="block text-[11px] text-faint">
                      {p.location ?? "—"}
                      {p.units > 1 && ` · ${p.units} units`}
                    </span>
                  </Link>
                </td>
                <td className="text-right tnum px-3 py-3">{p.hasValue ? fmtMoney(p.propValue) : "—"}</td>
                <td className="text-right tnum px-3 py-3">{fmtMoney(p.equity)}</td>
                <td
                  className={`text-right tnum px-3 py-3 ${
                    p.monthlyCashFlow < 0 ? "text-red-500" : "text-ink"
                  }`}
                >
                  {fmtMoney(p.monthlyCashFlow)}
                </td>
                <td className="text-right tnum px-3 py-3">{fmtPct(p.capRate)}</td>
                <td className="text-right tnum px-3 py-3">{fmtPct(p.cashOnCash)}</td>
                <td className="text-right tnum px-5 py-3">{fmtRatio(p.dscr)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Insights panel ────────────────────────────────────────────────────────────

function InsightsPanel({ insights, loading }: { insights: InsightsResponse | null; loading: boolean }) {
  return (
    <div className="bg-surface border border-line rounded-2xl shadow-soft p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-accentfg/[0.08]">
            <Sparkles className="w-4 h-4 text-accentfg" />
          </div>
          <h2 className="text-sm font-medium">Insights</h2>
        </div>
        {insights && (
          <span className="text-[10px] uppercase tracking-wider text-faint2">
            {insights.source === "ai" ? "AI-generated" : "Rule-based"}
          </span>
        )}
      </div>

      {loading && !insights ? (
        <div className="flex items-center gap-2 text-faint py-6">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Analyzing your portfolio…</span>
        </div>
      ) : insights ? (
        <>
          <p className="text-base font-serif leading-snug mb-4">{insights.headline}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {insights.insights.map((ins, i) => (
              <div
                key={i}
                className={`rounded-xl border p-3.5 ${
                  ins.tone === "positive"
                    ? "border-emerald-500/20 bg-emerald-500/[0.04]"
                    : ins.tone === "watch"
                      ? "border-amber-500/20 bg-amber-500/[0.04]"
                      : "border-line bg-tint/[0.015]"
                }`}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${
                      ins.tone === "positive"
                        ? "bg-emerald-500"
                        : ins.tone === "watch"
                          ? "bg-amber-500"
                          : "bg-faint2"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium leading-tight">{ins.title}</p>
                    <p className="text-[13px] text-muted mt-1 leading-relaxed">{ins.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-faint2 mt-4">
            {insights.source === "ai"
              ? "Generated by Claude from your real computed metrics — figures are not fabricated."
              : "Computed from your real metrics. Set ANTHROPIC_API_KEY to upgrade to richer AI commentary."}
          </p>
        </>
      ) : (
        <p className="text-sm text-faint">Add a property to see insights.</p>
      )}
    </div>
  );
}
