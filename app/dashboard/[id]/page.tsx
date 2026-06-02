"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  Home as HomeIcon,
  Wrench,
  ChevronRight,
  ChevronDown,
  Activity,
  DollarSign,
  Receipt,
  Zap,
  Inbox,
  Calendar,
  Loader2,
  Droplets,
  Flame,
  TrendingUp,
  TrendingDown,
  Sun,
  Pencil,
  Plus,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import {
  type DbPropertyWithBills,
  type DbBill,
  getPropertyById,
  listUserProperties,
  computePropertyHealth,
  computeNOI,
  isDbId,
} from "@/lib/v0/db";
import {
  getProperty,
  billsByProperty as mockBillsByProperty,
  actionItemsByProperty,
  utilityDataByProperty,
  financialSummaryByProperty,
  expenseBreakdownByProperty,
  bookingsByProperty,
  getPropertyHealth,
  statusClasses,
  priorityClasses,
  fmtCurrency,
} from "@/lib/v0/mockData";

// ── Real-data property detail ────────────────────────────────────────────────

const BILL_CATEGORIES = [
  "Other", "Mortgage", "Utilities", "Insurance", "HOA", "Tax",
  "Cleaning", "Maintenance", "Platform fees", "Supplies", "Management",
] as const;

const categoryColors: Record<string, string> = {
  Mortgage: "bg-[#5A6247]",
  Utilities: "bg-amber-400",
  Insurance: "bg-blue-400",
  HOA: "bg-violet-400",
  Tax: "bg-rose-400",
  Cleaning: "bg-cyan-400",
  Maintenance: "bg-orange-400",
  "Platform fees": "bg-pink-400",
  Supplies: "bg-teal-400",
  Management: "bg-indigo-400",
  Other: "bg-[#A8A59E]",
};

function RealPropertyDetail({ property: initialProperty }: { property: DbPropertyWithBills }) {
  const supabase = createClient();

  // ── Local state (optimistic) ──────────────────────────────────────────────
  const [prop, setProp] = useState(initialProperty);
  const [bills, setBills] = useState<DbBill[]>(initialProperty.bills ?? []);

  const [showPropModal, setShowPropModal] = useState(false);
  const [showMortgageModal, setShowMortgageModal] = useState(false);
  const [showAddBillModal, setShowAddBillModal] = useState(false);
  const [showFullFinancials, setShowFullFinancials] = useState(false);
  const [saving, setSaving] = useState(false);

  const [propForm, setPropForm] = useState({
    name: initialProperty.name ?? "",
    location: initialProperty.location ?? "",
    prop_val: String(initialProperty.prop_val ?? ""),
    income: String(initialProperty.income ?? ""),
    occupancy: String(initialProperty.occupancy ?? ""),
    type: initialProperty.type ?? "Primary",
  });

  const [mortForm, setMortForm] = useState({
    mort_bal: String(initialProperty.mort_bal ?? ""),
    mort_orig: String(initialProperty.mort_orig ?? ""),
    mort_pay: String(initialProperty.mort_pay ?? ""),
    mort_rate: String(initialProperty.mort_rate ?? ""),
  });

  const [billForm, setBillForm] = useState({
    name: "",
    amount: "",
    due_date: "",
    category: "Other" as typeof BILL_CATEGORIES[number],
    autopay: false,
    status_label: "Upcoming",
  });

  // ── Derived values ────────────────────────────────────────────────────────
  const health = computePropertyHealth(bills);
  const noi = computeNOI(prop, bills);

  const propVal = prop.prop_val ?? 0;
  const mortBal = prop.mort_bal ?? 0;
  const mortOrig = prop.mort_orig ?? 0;
  const mortPay = prop.mort_pay ?? 0;
  const mortRate = prop.mort_rate ?? 0;

  const equity = propVal > 0 ? propVal - mortBal : 0;
  const equityPct = propVal > 0 ? Math.round((equity / propVal) * 100) : 0;

  const healthScore = Math.max(40, 100 - health.urgentCount * 20 - health.soonCount * 8);
  const healthLabel =
    healthScore >= 80 ? "Good Standing" : healthScore >= 60 ? "Fair" : "Needs Attention";

  const income = prop.income ?? prop.rent ?? 0;
  const totalDue = bills.reduce((s, b) => s + (b.amount ?? 0), 0);
  const onAutopay = bills.filter((b) => b.autopay).length;

  const billsDomainStatus = health.overall;
  const finDomainStatus: "green" | "yellow" | "red" =
    noi > 0 ? "green" : noi < 0 ? "red" : "yellow";
  const mortDomainStatus: "green" | "yellow" =
    mortBal > 0 && mortOrig > 0 && mortBal / mortOrig > 0.8 ? "yellow" : "green";

  const categoryTotals = Object.entries(
    bills.reduce<Record<string, number>>((acc, b) => {
      const cat = b.category ?? "Other";
      acc[cat] = (acc[cat] ?? 0) + (b.amount ?? 0);
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const maxCat = categoryTotals[0]?.[1] ?? 1;

  const sortedBills = [...bills].sort((a, b) => {
    const order = { red: 0, yellow: 1, green: 2 } as const;
    const aStatus = (a.status ?? "green") as keyof typeof order;
    const bStatus = (b.status ?? "green") as keyof typeof order;
    return order[aStatus] - order[bStatus];
  });

  // ── Health color helpers ──────────────────────────────────────────────────
  const hc = {
    green: { border: "border-l-emerald-400", bg: "bg-emerald-400/10", text: "text-emerald-600", dot: "bg-emerald-400", scoreBg: "bg-emerald-400/15" },
    yellow: { border: "border-l-amber-400", bg: "bg-amber-400/10", text: "text-amber-600", dot: "bg-amber-400", scoreBg: "bg-amber-400/15" },
    red: { border: "border-l-red-400", bg: "bg-red-400/10", text: "text-red-500", dot: "bg-red-400 animate-pulse", scoreBg: "bg-red-400/15" },
  }[health.overall];

  const domainDot = (s: "green" | "yellow" | "red") =>
    ({ green: "bg-emerald-400", yellow: "bg-amber-400", red: "bg-red-400 animate-pulse" })[s];

  // ── Supabase save handlers ────────────────────────────────────────────────
  async function savePropEdit() {
    setSaving(true);
    const updates = {
      name: propForm.name,
      location: propForm.location,
      prop_val: propForm.prop_val ? Number(propForm.prop_val) : null,
      income: propForm.income ? Number(propForm.income) : null,
      occupancy: propForm.occupancy ? Number(propForm.occupancy) : null,
      type: propForm.type,
    };
    await supabase.from("properties").update(updates).eq("id", prop.id);
    setProp((p) => ({ ...p, ...updates }));
    setSaving(false);
    setShowPropModal(false);
  }

  async function saveMortgageEdit() {
    setSaving(true);
    const updates = {
      mort_bal: mortForm.mort_bal ? Number(mortForm.mort_bal) : null,
      mort_orig: mortForm.mort_orig ? Number(mortForm.mort_orig) : null,
      mort_pay: mortForm.mort_pay ? Number(mortForm.mort_pay) : null,
      mort_rate: mortForm.mort_rate ? Number(mortForm.mort_rate) : null,
    };
    await supabase.from("properties").update(updates).eq("id", prop.id);
    setProp((p) => ({ ...p, ...updates }));
    setSaving(false);
    setShowMortgageModal(false);
  }

  async function handleAddBill() {
    setSaving(true);
    const newBill = {
      property_id: prop.id,
      name: billForm.name,
      amount: billForm.amount ? Number(billForm.amount) : 0,
      due_date: billForm.due_date || null,
      paid: false,
      category: billForm.category,
      autopay: billForm.autopay,
      status: "green" as const,
      status_label: billForm.status_label || "Upcoming",
      source: "manual" as const,
    };
    const { data } = await supabase.from("bills").insert(newBill).select().single();
    if (data) setBills((prev) => [...prev, data as DbBill]);
    setSaving(false);
    setShowAddBillModal(false);
    setBillForm({ name: "", amount: "", due_date: "", category: "Other", autopay: false, status_label: "Upcoming" });
  }

  // ── SVG donut math ────────────────────────────────────────────────────────
  const r = 36;
  const circ = 2 * Math.PI * r;
  const equityArc = equityPct > 0 ? (equityPct / 100) * circ : 0;
  const mortArc = circ - equityArc;

  // ── Modal shared styles ───────────────────────────────────────────────────
  const inputCls = "w-full bg-[#FAF9F6] border border-[#D8D5CB] rounded-xl px-3 py-2 text-sm text-[#2B2B28] placeholder-[#8A8780] focus:outline-none focus:border-[#BDB9AC]";
  const labelCls = "block text-xs text-[#6E6B64] mb-1";

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 animate-rise stagger">

      {/* ── 1. Hero banner ────────────────────────────────────────────────── */}
      <div className={`bg-white rounded-2xl border border-[#EAE8E1] shadow-soft ${hc.border} border-l-4 p-5 sm:p-6`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl ${hc.scoreBg} flex items-center justify-center shrink-0`}>
              <span className={`text-xl font-bold tnum ${hc.text}`}>{healthScore}</span>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-[#6E6B64] mb-0.5">
                {prop.location ?? prop.address ?? "—"} · {prop.type ?? "Property"}
              </p>
              <h1 className="text-xl sm:text-2xl font-serif font-bold">{prop.name ?? "Untitled property"}</h1>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${hc.text}`}>
                  <span className={`w-2 h-2 rounded-full ${hc.dot}`} />
                  {healthLabel}
                </span>
                <span className="text-[#C4C1B8]">·</span>
                <span className="text-[#6E6B64] text-xs">
                  {bills.length} bills · {onAutopay} autopay · {totalDue > 0 ? fmtCurrency(totalDue) : "—"} due
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {(["Bills", "Finances", "Mortgage"] as const).map((label) => {
              const s = label === "Bills" ? billsDomainStatus : label === "Finances" ? finDomainStatus : mortDomainStatus;
              return (
                <div key={label} className="flex items-center gap-1.5 bg-black/[0.025] rounded-lg px-2.5 py-1.5 border border-[#EFEDE7]">
                  <span className={`w-1.5 h-1.5 rounded-full ${domainDot(s)}`} />
                  <span className="text-xs text-[#6E6B64]">{label}</span>
                </div>
              );
            })}
            <button
              onClick={() => setShowPropModal(true)}
              className="flex items-center gap-1.5 bg-black/[0.025] hover:bg-black/[0.05] border border-[#E2DFD6] rounded-lg px-2.5 py-1.5 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5 text-[#6E6B64]" />
              <span className="text-xs text-[#6E6B64]">Edit</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. KPI cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger">
        {/* Est. value */}
        <div className="bg-white border border-[#EAE8E1] rounded-2xl shadow-soft p-4">
          <p className="text-[11px] uppercase tracking-wider text-[#6E6B64] mb-3">Est. Value</p>
          <p className="text-2xl font-bold tnum text-[#5A6247]">{propVal > 0 ? fmtCurrency(propVal) : "—"}</p>
          <p className="text-xs text-[#78756E] mt-1">Property</p>
        </div>
        {/* Equity */}
        <div className="bg-white border border-[#EAE8E1] rounded-2xl shadow-soft p-4">
          <p className="text-[11px] uppercase tracking-wider text-[#6E6B64] mb-3">Equity</p>
          <p className="text-2xl font-bold tnum text-emerald-600">{equity > 0 ? fmtCurrency(equity) : "—"}</p>
          <p className="text-xs text-[#78756E] mt-1">
            {equity > 0 ? `${equityPct}% of value` : "Add value & mortgage"}
          </p>
        </div>
        {/* Monthly cash flow */}
        <div className="bg-white border border-[#EAE8E1] rounded-2xl shadow-soft p-4">
          <p className="text-[11px] uppercase tracking-wider text-[#6E6B64] mb-3">Monthly Cash Flow</p>
          <p className={`text-2xl font-bold tnum ${noi > 0 ? "text-emerald-600" : noi < 0 ? "text-red-500" : "text-[#5A6247]"}`}>
            {income > 0 ? fmtCurrency(noi) : "—"}
          </p>
          <p className="text-xs text-[#78756E] mt-1">NOI</p>
        </div>
        {/* Bills due */}
        <div className="bg-white border border-[#EAE8E1] rounded-2xl shadow-soft p-4">
          <p className="text-[11px] uppercase tracking-wider text-[#6E6B64] mb-3">Bills Due</p>
          <p className="text-2xl font-bold tnum text-[#5A6247]">{totalDue > 0 ? fmtCurrency(totalDue) : "—"}</p>
          <p className="text-xs mt-1">
            {health.urgentCount > 0 ? (
              <span className="text-red-500 font-medium">{health.urgentCount} overdue</span>
            ) : health.soonCount > 0 ? (
              <span className="text-amber-600 font-medium">{health.soonCount} due soon</span>
            ) : (
              <span className="text-[#78756E]">{bills.length} bills · {onAutopay} autopay</span>
            )}
          </p>
        </div>
      </div>

      {/* ── 2b. Action items (auto-generated from bill status) ────────────── */}
      {(() => {
        const actionItems = [
          ...bills
            .filter((b) => b.status === "red")
            .map((b) => ({
              id: `urgent-${b.id}`,
              priority: "urgent" as const,
              label: `Overdue: ${b.name}`,
              detail: `${fmtCurrency(b.amount ?? 0)} — due ${b.due_date ?? "now"}`,
              ctaLabel: "Pay now",
            })),
          ...bills
            .filter((b) => b.status === "yellow" && !b.autopay)
            .map((b) => ({
              id: `soon-${b.id}`,
              priority: "soon" as const,
              label: `Due soon: ${b.name}`,
              detail: `${fmtCurrency(b.amount ?? 0)} — due ${b.due_date ?? "soon"}`,
              ctaLabel: "Review",
            })),
        ];

        if (actionItems.length === 0) {
          return (
            <div className="flex items-center gap-3 bg-white border border-[#EAE8E1] rounded-2xl shadow-soft px-5 py-4">
              <div className="w-8 h-8 rounded-xl bg-emerald-400/10 flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-sm text-[#6E6B64]">All clear — no action needed right now</p>
            </div>
          );
        }

        const priorityStyles = {
          urgent: { badge: "bg-red-400/15 text-red-500", border: "border-red-400/20" },
          soon: { badge: "bg-amber-400/15 text-amber-600", border: "border-amber-400/20" },
        };

        return (
          <Card className="bg-white border-[#EAE8E1] text-[#2B2B28]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#57554F] flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                Needs your attention
                <Badge className="bg-[#5A6247]/[0.08] text-[#5A6247] border-0 text-xs px-2 ml-auto">
                  {actionItems.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {actionItems.map((action) => {
                const ps = priorityStyles[action.priority];
                return (
                  <div
                    key={action.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border ${ps.border} hover:bg-[#5A6247]/[0.06] transition-colors`}
                  >
                    <Badge className={`${ps.badge} border-0 text-[10px] px-2 py-0.5 uppercase tracking-wide shrink-0`}>
                      {action.priority}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-tight">{action.label}</p>
                      <p className="text-xs text-[#6E6B64] mt-0.5">{action.detail}</p>
                    </div>
                    <button className="text-[11px] font-medium text-[#5A6247] bg-[#5A6247]/[0.06] hover:bg-[#5A6247]/[0.10] border border-[#5A6247]/20 rounded-lg px-2.5 py-1.5 transition-colors shrink-0">
                      {action.ctaLabel}
                    </button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })()}

      {/* ── 3. Equity + Mortgage row ──────────────────────────────────────── */}
      {(propVal > 0 || mortPay > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 stagger">
          {/* Equity ring */}
          {propVal > 0 && (
            <Card className="bg-white border-[#EAE8E1] text-[#2B2B28]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[#57554F]">Equity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <svg width="90" height="90" viewBox="0 0 90 90" className="shrink-0">
                    <circle cx="45" cy="45" r={r} fill="none" stroke="rgba(90,98,71,0.15)" strokeWidth="10" />
                    {equityArc > 0 && (
                      <circle
                        cx="45" cy="45" r={r} fill="none"
                        stroke="#5A6247" strokeWidth="10"
                        strokeDasharray={`${equityArc} ${mortArc}`}
                        strokeDashoffset={circ / 4}
                        strokeLinecap="round"
                      />
                    )}
                    <text x="45" y="42" textAnchor="middle" fill="#5A6247" fontSize="14" fontWeight="bold">{equityPct}%</text>
                    <text x="45" y="56" textAnchor="middle" fill="rgba(43,43,40,0.45)" fontSize="10">equity</text>
                  </svg>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-[11px] text-[#6E6B64]">Equity</p>
                      <p className="font-semibold text-emerald-600">{fmtCurrency(equity)}</p>
                    </div>
                    {mortBal > 0 && (
                      <div>
                        <p className="text-[11px] text-[#6E6B64]">Balance</p>
                        <p className="font-semibold text-[#57554F]">{fmtCurrency(mortBal)}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[11px] text-[#6E6B64]">Est. Value</p>
                      <p className="font-semibold text-[#5A6247]">{fmtCurrency(propVal)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mortgage card */}
          <Card className="bg-white border-[#EAE8E1] text-[#2B2B28]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#57554F] flex items-center justify-between">
                <span>Mortgage</span>
                <button onClick={() => setShowMortgageModal(true)} className="p-1 rounded-lg hover:bg-black/[0.04] transition-colors">
                  <Pencil className="w-3.5 h-3.5 text-[#6E6B64]" />
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mortPay > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-end gap-1.5">
                    <span className="text-2xl font-bold tnum text-[#5A6247]">{fmtCurrency(mortPay)}</span>
                    <span className="text-[#6E6B64] text-sm mb-0.5">/mo</span>
                    {mortRate > 0 && (
                      <span className="text-[#6E6B64] text-xs mb-0.5 ml-1">{mortRate}%</span>
                    )}
                  </div>
                  {mortBal > 0 && mortOrig > 0 && (
                    <div>
                      <div className="w-full h-2 bg-[#5A6247]/[0.08] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.round((1 - mortBal / mortOrig) * 100)}%`,
                            background: "linear-gradient(to right, #5A6247, rgba(138,148,114,0.85))",
                          }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-[#78756E]">Paid {fmtCurrency(mortOrig - mortBal)}</span>
                        <span className="text-[10px] text-[#78756E]">of {fmtCurrency(mortOrig)}</span>
                      </div>
                    </div>
                  )}
                  {mortRate > 0 && mortBal > 0 && (() => {
                    const monthlyInterest = mortBal * (mortRate / 100 / 12);
                    const principal = mortPay - monthlyInterest;
                    const payoffMonths = principal > 0 ? Math.ceil(mortBal / principal) : null;
                    const payoffDate = payoffMonths ? new Date(Date.now() + payoffMonths * 30.44 * 24 * 60 * 60 * 1000) : null;
                    return (
                      <div className="flex gap-4 pt-1">
                        <div>
                          <p className="text-[10px] text-[#78756E]">Interest/mo</p>
                          <p className="text-xs font-medium text-[#6E6B64]">{fmtCurrency(monthlyInterest)}</p>
                        </div>
                        {payoffDate && (
                          <div>
                            <p className="text-[10px] text-[#78756E]">Payoff</p>
                            <p className="text-xs font-medium text-[#6E6B64]">
                              {payoffDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <button
                  onClick={() => setShowMortgageModal(true)}
                  className="w-full py-6 border border-dashed border-[#D8D5CB] rounded-xl text-sm text-[#78756E] hover:text-[#6E6B64] hover:border-[#C6C2B6] transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add mortgage details
                </button>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── 4. Spending breakdown ─────────────────────────────────────────── */}
      {categoryTotals.length > 0 && (
        <Card className="bg-white border-[#EAE8E1] text-[#2B2B28]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#57554F] flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Spending breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {categoryTotals.map(([cat, amount]) => (
              <div key={cat}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[#6E6B64]">{cat}</span>
                  <span className="text-xs font-medium text-[#5A6247]">{fmtCurrency(amount)}</span>
                </div>
                <div className="w-full h-1.5 bg-[#5A6247]/[0.07] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.round((amount / maxCat) * 100)}%`,
                      background: "linear-gradient(to right, #5A6247, rgba(138,148,114,0.75))",
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── 5. Bills list ─────────────────────────────────────────────────── */}
      <Card className="bg-white border-[#EAE8E1] text-[#2B2B28]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-[#57554F] flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Bills this month
            {totalDue > 0 && (
              <Badge className="bg-[#5A6247]/[0.08] text-[#5A6247] border-0 text-xs px-2">
                {fmtCurrency(totalDue)}
              </Badge>
            )}
            <button
              onClick={() => setShowAddBillModal(true)}
              className="ml-auto flex items-center gap-1 text-xs text-[#5A6247]/70 hover:text-[#5A6247] border border-[#E2DFD6] hover:border-[#CFCBC0] rounded-lg px-2.5 py-1 transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add bill
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedBills.length === 0 ? (
            <div className="py-8 text-center">
              <Receipt className="w-8 h-8 text-[#D8D5CC] mx-auto mb-3" />
              <p className="text-sm text-[#78756E] mb-3">No bills yet.</p>
              <button
                onClick={() => setShowAddBillModal(true)}
                className="text-xs text-[#5A6247] hover:text-[#2B2B28] border border-[#5A6247]/20 hover:border-[#5A6247]/30 rounded-lg px-3 py-1.5 transition-colors"
              >
                Add your first bill →
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedBills.map((bill) => {
                const bStatus = (bill.status ?? "green") as "green" | "yellow" | "red";
                const bsc = statusClasses(bStatus);
                return (
                  <div
                    key={bill.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border ${bsc.border} ${bsc.bg}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${bsc.dot} shrink-0`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium truncate">{bill.name}</p>
                        {bill.autopay ? (
                          <Badge className="bg-emerald-500/15 text-emerald-600 border-0 text-[10px] px-1.5 py-0 h-4 flex items-center gap-1">
                            <Zap className="w-2.5 h-2.5" />
                            Autopay
                          </Badge>
                        ) : (
                          <Badge className="bg-black/[0.025] text-[#6E6B64] border-0 text-[10px] px-1.5 py-0 h-4">
                            Manual
                          </Badge>
                        )}
                      </div>
                      <p className={`text-xs mt-0.5 ${bsc.text}`}>
                        {bill.status_label ?? (bill.paid ? "Paid" : "Upcoming")} · {bill.due_date}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">{fmtCurrency(bill.amount)}</p>
                      <p className="text-[10px] text-[#78756E]">{bill.category ?? "Other"}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── 6. Financial summary (expandable, full-width) ────────────────── */}
      <Card className="bg-white border-[#EAE8E1] text-[#2B2B28]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-[#57554F] flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Financial summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between py-1.5">
              <span className="text-sm text-[#6E6B64]">Income</span>
              <span className="text-sm font-semibold text-emerald-600">{income > 0 ? `+${fmtCurrency(income)}` : "—"}</span>
            </div>
            {categoryTotals.slice(0, 3).map(([cat, amount]) => (
              <div key={cat} className="flex items-center justify-between py-1.5">
                <span className="flex items-center gap-2 text-sm text-[#6E6B64]">
                  <span className={`w-1.5 h-1.5 rounded-full ${categoryColors[cat] ?? "bg-[#A8A59E]"} shrink-0`} />
                  {cat}
                </span>
                <span className="text-sm font-semibold text-red-500">-{fmtCurrency(amount)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 border-t border-[#E2DFD6]">
              <span className="text-sm font-medium text-[#57554F]">Net cash flow</span>
              <span className={`text-sm font-bold ${noi > 0 ? "text-emerald-600" : noi < 0 ? "text-red-500" : "text-[#5A6247]"}`}>
                {income > 0 || totalDue > 0 ? `${noi >= 0 ? "+" : ""}${fmtCurrency(noi)}` : "—"}
              </span>
            </div>
          </div>

          <div className="relative group pt-3 border-t border-[#EAE8E1]">
            <button
              onClick={() => setShowFullFinancials((v) => !v)}
              className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-[#5A6247]/[0.06] hover:bg-[#5A6247]/[0.08] border border-[#E2DFD6] hover:border-[#CFCBC0] text-sm font-medium text-[#5A6247] hover:text-[#2B2B28] transition-all"
            >
              <div className="flex items-center gap-2.5">
                <DollarSign className="w-4 h-4" />
                <span>Full P&amp;L · Mortgage · Equity</span>
              </div>
              <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${showFullFinancials ? "rotate-180" : ""}`} />
            </button>
            {!showFullFinancials && (
              <div className="absolute left-0 right-0 top-full mt-1.5 rounded-xl bg-[#FAF9F6] border border-[#D8D5CB] shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 p-4">
                <div className="grid grid-cols-3 gap-5">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#78756E] mb-2">Top expenses</p>
                    {categoryTotals.length > 0 && (
                      <div className="h-2 rounded-full overflow-hidden flex bg-[#5A6247]/[0.08] mb-2">
                        {categoryTotals.slice(0, 4).map(([cat, amount]) => (
                          <div
                            key={cat}
                            className={`h-full first:rounded-l-full last:rounded-r-full ${categoryColors[cat] ?? "bg-[#A8A59E]"}`}
                            style={{ width: `${totalDue > 0 ? (amount / totalDue) * 100 : 0}%` }}
                          />
                        ))}
                      </div>
                    )}
                    <div className="space-y-0.5">
                      {categoryTotals.slice(0, 3).map(([cat, amount]) => (
                        <div key={cat} className="flex items-center gap-1.5 text-[11px]">
                          <span className={`w-1.5 h-1.5 rounded-full ${categoryColors[cat] ?? "bg-[#A8A59E]"} shrink-0`} />
                          <span className="text-[#6E6B64] truncate">{cat}</span>
                          <span className="text-[#78756E] ml-auto shrink-0">{fmtCurrency(amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#78756E] mb-2">Mortgage</p>
                    {mortPay > 0 && mortOrig > 0 ? (
                      <>
                        <div className="h-2 rounded-full overflow-hidden bg-[#5A6247]/[0.08] mb-2">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-[#8A9472]"
                            style={{ width: `${Math.round((1 - mortBal / mortOrig) * 100)}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-[#6E6B64]">
                          <span className="text-emerald-600 font-medium">{Math.round((1 - mortBal / mortOrig) * 100)}%</span> paid off
                        </p>
                        <p className="text-[11px] text-[#78756E]">{fmtCurrency(mortBal)} remaining</p>
                      </>
                    ) : (
                      <p className="text-[11px] text-[#78756E] italic">Not set up yet</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#78756E] mb-2">Equity</p>
                    {propVal > 0 ? (
                      <div className="flex items-center gap-3">
                        {(() => {
                          const pR = 16; const pC = 2 * Math.PI * pR;
                          return (
                            <svg width="42" height="42" viewBox="0 0 42 42" className="shrink-0">
                              <circle cx="21" cy="21" r={pR} fill="none" stroke="rgba(90,98,71,0.15)" strokeWidth="5" />
                              {equityPct > 0 && (
                                <circle cx="21" cy="21" r={pR} fill="none" stroke="#5A6247" strokeWidth="5"
                                  strokeDasharray={`${(equityPct / 100) * pC} ${(1 - equityPct / 100) * pC}`}
                                  strokeLinecap="round" transform="rotate(-90 21 21)" />
                              )}
                            </svg>
                          );
                        })()}
                        <div>
                          <p className="text-sm font-semibold text-[#5A6247]">{equityPct}%</p>
                          <p className="text-[11px] text-[#78756E]">{fmtCurrency(equity)}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-[#78756E] italic">Add property value</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {showFullFinancials && (
            <div className="pt-4 mt-3 border-t border-[#EAE8E1]">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left: P&L breakdown (3/5 width) */}
                <div className="lg:col-span-3 space-y-2.5">
                  <p className="text-[11px] font-medium text-[#6E6B64] uppercase tracking-wider mb-3">Monthly P&amp;L</p>
                  <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Income</p>
                      <p className="text-[11px] text-[#6E6B64]">Monthly revenue</p>
                    </div>
                    <p className="text-lg font-semibold text-emerald-600">+{income > 0 ? fmtCurrency(income) : "—"}</p>
                  </div>
                  {categoryTotals.map(([cat, amount]) => (
                    <div key={cat} className="flex items-center gap-3 p-3 rounded-xl bg-black/[0.015] border border-[#EFEDE7]">
                      <span className={`w-2.5 h-2.5 rounded-full ${categoryColors[cat] ?? "bg-[#A8A59E]"} shrink-0`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm">{cat}</p>
                        <div className="mt-1.5 h-1.5 bg-[#5A6247]/[0.08] rounded-full overflow-hidden">
                          <div
                            className={`h-full ${categoryColors[cat] ?? "bg-[#A8A59E]"} rounded-full`}
                            style={{ width: `${Math.round((amount / maxCat) * 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-red-500">{fmtCurrency(amount)}</p>
                        <p className="text-[10px] text-[#78756E]">{totalDue > 0 ? `${Math.round((amount / totalDue) * 100)}%` : ""}</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-3 border-t border-[#EAE8E1]">
                    <p className="text-sm font-semibold">Net operating income</p>
                    <p className={`text-xl font-bold tnum ${noi >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {income > 0 || totalDue > 0 ? fmtCurrency(noi) : "—"}
                    </p>
                  </div>
                </div>

                {/* Right: Mortgage + Equity (2/5 width) */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-medium text-[#6E6B64] uppercase tracking-wider">Mortgage</p>
                      <button onClick={() => setShowMortgageModal(true)} className="p-1 rounded-lg hover:bg-black/[0.04] transition-colors">
                        <Pencil className="w-3 h-3 text-[#78756E]" />
                      </button>
                    </div>
                    {mortPay > 0 ? (
                      <div className="space-y-2.5 p-4 rounded-xl bg-black/[0.015] border border-[#EFEDE7]">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#6E6B64]">Monthly payment</span>
                          <span className="text-sm font-semibold">
                            {fmtCurrency(mortPay)}
                            {mortRate > 0 && <span className="text-[#6E6B64] text-xs ml-1.5">@ {mortRate}%</span>}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#6E6B64]">Current balance</span>
                          <span className="text-sm font-semibold">{fmtCurrency(mortBal)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#6E6B64]">Original loan</span>
                          <span className="text-sm font-semibold">{fmtCurrency(mortOrig)}</span>
                        </div>
                        {mortBal > 0 && mortOrig > 0 && (
                          <>
                            <div className="flex items-center justify-between pt-2.5 border-t border-[#EAE8E1]">
                              <span className="text-xs text-[#57554F]">Principal paid</span>
                              <span className="text-sm font-bold text-emerald-600">
                                {fmtCurrency(mortOrig - mortBal)} ({Math.round((1 - mortBal / mortOrig) * 100)}%)
                              </span>
                            </div>
                            <div className="h-2.5 bg-[#5A6247]/[0.08] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-[#8A9472]"
                                style={{ width: `${Math.round((1 - mortBal / mortOrig) * 100)}%` }}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowMortgageModal(true)}
                        className="w-full py-5 border border-dashed border-[#D8D5CB] rounded-xl text-sm text-[#78756E] hover:text-[#6E6B64] hover:border-[#C6C2B6] transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add mortgage details
                      </button>
                    )}
                  </div>

                  {propVal > 0 && (
                    <div className="space-y-3">
                      <p className="text-[11px] font-medium text-[#6E6B64] uppercase tracking-wider">Equity</p>
                      <div className="flex flex-col items-center p-4 rounded-xl bg-black/[0.015] border border-[#EFEDE7]">
                        {(() => {
                          const eR = 54;
                          const eC = 2 * Math.PI * eR;
                          const eOffset = eC - (equityPct / 100) * eC;
                          return (
                            <svg width="140" height="140" viewBox="0 0 140 140">
                              <circle cx="70" cy="70" r={eR} fill="none" stroke="rgba(90,98,71,0.15)" strokeWidth="11" />
                              {equityPct > 0 && (
                                <circle
                                  cx="70" cy="70" r={eR} fill="none"
                                  stroke="#5A6247" strokeWidth="11"
                                  strokeDasharray={eC}
                                  strokeDashoffset={eOffset}
                                  strokeLinecap="round"
                                  transform="rotate(-90 70 70)"
                                />
                              )}
                              <text x="70" y="66" textAnchor="middle" fill="#5A6247" fontSize="22" fontWeight="bold">{equityPct}%</text>
                              <text x="70" y="84" textAnchor="middle" fill="rgba(43,43,40,0.45)" fontSize="10">equity</text>
                            </svg>
                          );
                        })()}
                        <div className="grid grid-cols-2 gap-4 w-full mt-3 pt-3 border-t border-[#EAE8E1]">
                          <div>
                            <p className="text-[#6E6B64] text-[11px]">Equity</p>
                            <p className="text-base font-semibold text-[#5A6247]">{fmtCurrency(equity)}</p>
                          </div>
                          <div>
                            <p className="text-[#6E6B64] text-[11px]">Owed</p>
                            <p className="text-base font-semibold">{mortBal > 0 ? fmtCurrency(mortBal) : "—"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── 7. Modals ─────────────────────────────────────────────────────── */}

      {/* Edit property modal */}
      {showPropModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-overlay">
          <div className="bg-white rounded-2xl border border-[#D8D5CB] animate-modal w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-bold">Edit Property</h2>
              <button onClick={() => setShowPropModal(false)} className="p-1 rounded-lg hover:bg-black/[0.04]">
                <X className="w-4 h-4 text-[#6E6B64]" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Property name</label>
                <input className={inputCls} value={propForm.name} onChange={(e) => setPropForm((f) => ({ ...f, name: e.target.value }))} placeholder="My Property" />
              </div>
              <div>
                <label className={labelCls}>Location</label>
                <input className={inputCls} value={propForm.location} onChange={(e) => setPropForm((f) => ({ ...f, location: e.target.value }))} placeholder="Phoenix, AZ" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Est. value ($)</label>
                  <input className={inputCls} type="number" value={propForm.prop_val} onChange={(e) => setPropForm((f) => ({ ...f, prop_val: e.target.value }))} placeholder="450000" />
                </div>
                <div>
                  <label className={labelCls}>Monthly income ($)</label>
                  <input className={inputCls} type="number" value={propForm.income} onChange={(e) => setPropForm((f) => ({ ...f, income: e.target.value }))} placeholder="3500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Occupancy (%)</label>
                  <input className={inputCls} type="number" value={propForm.occupancy} onChange={(e) => setPropForm((f) => ({ ...f, occupancy: e.target.value }))} placeholder="85" />
                </div>
                <div>
                  <label className={labelCls}>Type</label>
                  <select className={inputCls} value={propForm.type} onChange={(e) => setPropForm((f) => ({ ...f, type: e.target.value as "STR" | "Primary" }))}>
                    <option value="Primary">Primary</option>
                    <option value="STR">STR</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowPropModal(false)} className="flex-1 py-2.5 rounded-xl border border-[#D8D5CB] text-sm text-[#6E6B64] hover:text-[#2B2B28] transition-colors">Cancel</button>
              <button onClick={savePropEdit} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-[#5A6247] text-sm font-medium text-white hover:bg-[#4A5239] disabled:opacity-50 transition-colors">
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit mortgage modal */}
      {showMortgageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-overlay">
          <div className="bg-white rounded-2xl border border-[#D8D5CB] animate-modal w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-bold">Edit Mortgage</h2>
              <button onClick={() => setShowMortgageModal(false)} className="p-1 rounded-lg hover:bg-black/[0.04]">
                <X className="w-4 h-4 text-[#6E6B64]" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Balance ($)</label>
                  <input className={inputCls} type="number" value={mortForm.mort_bal} onChange={(e) => setMortForm((f) => ({ ...f, mort_bal: e.target.value }))} placeholder="340000" />
                </div>
                <div>
                  <label className={labelCls}>Original loan ($)</label>
                  <input className={inputCls} type="number" value={mortForm.mort_orig} onChange={(e) => setMortForm((f) => ({ ...f, mort_orig: e.target.value }))} placeholder="400000" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Monthly payment ($)</label>
                  <input className={inputCls} type="number" value={mortForm.mort_pay} onChange={(e) => setMortForm((f) => ({ ...f, mort_pay: e.target.value }))} placeholder="2100" />
                </div>
                <div>
                  <label className={labelCls}>Rate (%)</label>
                  <input className={inputCls} type="number" step="0.01" value={mortForm.mort_rate} onChange={(e) => setMortForm((f) => ({ ...f, mort_rate: e.target.value }))} placeholder="6.75" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowMortgageModal(false)} className="flex-1 py-2.5 rounded-xl border border-[#D8D5CB] text-sm text-[#6E6B64] hover:text-[#2B2B28] transition-colors">Cancel</button>
              <button onClick={saveMortgageEdit} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-[#5A6247] text-sm font-medium text-white hover:bg-[#4A5239] disabled:opacity-50 transition-colors">
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add bill modal */}
      {showAddBillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-overlay">
          <div className="bg-white rounded-2xl border border-[#D8D5CB] animate-modal w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-bold">Add Bill</h2>
              <button onClick={() => setShowAddBillModal(false)} className="p-1 rounded-lg hover:bg-black/[0.04]">
                <X className="w-4 h-4 text-[#6E6B64]" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Bill name</label>
                <input className={inputCls} value={billForm.name} onChange={(e) => setBillForm((f) => ({ ...f, name: e.target.value }))} placeholder="Internet" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Amount ($)</label>
                  <input className={inputCls} type="number" value={billForm.amount} onChange={(e) => setBillForm((f) => ({ ...f, amount: e.target.value }))} placeholder="120" />
                </div>
                <div>
                  <label className={labelCls}>Due date</label>
                  <input className={inputCls} value={billForm.due_date} onChange={(e) => setBillForm((f) => ({ ...f, due_date: e.target.value }))} placeholder="May 15" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Category</label>
                <select className={inputCls} value={billForm.category} onChange={(e) => setBillForm((f) => ({ ...f, category: e.target.value as typeof BILL_CATEGORIES[number] }))}>
                  {BILL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Autopay</label>
                <button
                  type="button"
                  onClick={() => setBillForm((f) => ({ ...f, autopay: !f.autopay }))}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-colors ${billForm.autopay ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600" : "bg-black/[0.025] border-[#E2DFD6] text-[#6E6B64]"}`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  {billForm.autopay ? "On" : "Off"}
                </button>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowAddBillModal(false)} className="flex-1 py-2.5 rounded-xl border border-[#D8D5CB] text-sm text-[#6E6B64] hover:text-[#2B2B28] transition-colors">Cancel</button>
              <button onClick={handleAddBill} disabled={saving || !billForm.name} className="flex-1 py-2.5 rounded-xl bg-[#5A6247] text-sm font-medium text-white hover:bg-[#4A5239] disabled:opacity-50 transition-colors">
                {saving ? "Adding…" : "Add bill"}
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}

// ── Mock-data property detail (preserved for phoenix/pvr demo) ───────────────

function MockPropertyDetail({ id }: { id: string }) {
  const [showFullFinancials, setShowFullFinancials] = useState(false);
  const property = getProperty(id);
  if (!property) notFound();

  const bills = mockBillsByProperty[id] ?? [];
  const actions = actionItemsByProperty(id);
  const utilities = utilityDataByProperty[id] ?? [];
  const fin = financialSummaryByProperty[id];
  const expenses = expenseBreakdownByProperty[id] ?? [];
  const mockEquity = property.propVal - property.mortBal;
  const mockEquityPct = Math.round((mockEquity / property.propVal) * 100);
  const mockPaidPrincipal = property.mortOrig - property.mortBal;
  const mockPaidPct = Math.round((mockPaidPrincipal / property.mortOrig) * 100);
  const bookings = bookingsByProperty[id] ?? [];
  const health = getPropertyHealth(id);

  const onAutopay = bills.filter((b) => b.autopay).length;
  const needAttention = bills.filter((b) => b.status !== "green").length;
  const totalDue = bills.reduce((s, b) => s + b.amount, 0);
  const needYouActions = actions.filter((a) => a.priority !== "review");
  const upcomingBookings = bookings.filter((b) => b.status !== "completed").slice(0, 3);

  // Utility month derivations
  const lastMonth = utilities[utilities.length - 1];
  const prevMonth = utilities[utilities.length - 2];
  const totalSpend = lastMonth ? lastMonth.electric + lastMonth.water + lastMonth.gas : 0;
  const prevTotalSpend = prevMonth ? prevMonth.electric + prevMonth.water + prevMonth.gas : 0;
  const elecDelta = prevMonth ? Math.round(((lastMonth.electric - prevMonth.electric) / prevMonth.electric) * 100) : 0;
  const waterDelta = prevMonth ? Math.round(((lastMonth.water - prevMonth.water) / prevMonth.water) * 100) : 0;
  const gasDelta = prevMonth ? Math.round(((lastMonth.gas - prevMonth.gas) / prevMonth.gas) * 100) : 0;
  const totalDelta = prevTotalSpend ? Math.round(((totalSpend - prevTotalSpend) / prevTotalSpend) * 100) : 0;
  const solarOffset = lastMonth?.solar && lastMonth.electric > 0
    ? Math.round((lastMonth.solar / lastMonth.electric) * 100)
    : 0;

  // Domain status for health pills
  const complianceActions = actions.filter((a) => a.category === "Compliance");
  const complianceStatus =
    complianceActions.some((a) => a.priority === "urgent") ? "red" as const :
    complianceActions.some((a) => a.priority === "soon") ? "yellow" as const : "green" as const;
  const utilityStatus = lastMonth
    ? totalSpend > lastMonth.budget ? "red" as const
      : totalSpend > lastMonth.budget * 0.9 ? "yellow" as const
      : "green" as const
    : "green" as const;
  const financialStatus =
    fin.noi <= 0 ? "red" as const :
    fin.occupancy < 60 ? "yellow" as const : "green" as const;

  const chartData = utilities.map((u) => ({
    month: u.month,
    Electric: u.electric,
    Water: u.water,
    Gas: u.gas,
  }));

  const sortedBills = [...bills].sort((a, b) => {
    const order = { red: 0, yellow: 1, green: 2 } as const;
    return order[a.status] - order[b.status];
  });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 animate-rise stagger">
      <div className="flex items-center gap-2 text-[10px] text-[#78756E] uppercase tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60" />
        Simulated demo data
      </div>

      {(() => {
        const hc = {
          green: { border: "border-l-emerald-400", bg: "bg-emerald-400/10", text: "text-emerald-600", dot: "bg-emerald-400" },
          yellow: { border: "border-l-amber-400", bg: "bg-amber-400/10", text: "text-amber-600", dot: "bg-amber-400" },
          red: { border: "border-l-red-400", bg: "bg-red-400/10", text: "text-red-500", dot: "bg-red-400 animate-pulse" },
        }[health.overall];
        const domainDot = (s: "green" | "yellow" | "red") => ({
          green: "bg-emerald-400", yellow: "bg-amber-400", red: "bg-red-400 animate-pulse",
        }[s]);
        return (
          <div className={`bg-white rounded-2xl border border-[#EAE8E1] shadow-soft ${hc.border} border-l-4 p-5 sm:p-6`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Left: score + name */}
              <div className="flex items-start sm:items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl ${hc.bg} flex items-center justify-center shrink-0`}>
                  <span className={`text-xl font-bold tnum ${hc.text}`}>{health.score}</span>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-[#6E6B64] mb-0.5">
                    {property.location} · {property.type}
                  </p>
                  <h1 className="text-xl sm:text-2xl font-serif font-bold">{property.name}</h1>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${hc.text}`}>
                      <span className={`w-2 h-2 rounded-full ${hc.dot}`} />
                      {health.label}
                    </span>
                    <span className="text-[#C4C1B8]">·</span>
                    <span className="text-[#6E6B64] text-xs">
                      {bills.length} bills · {onAutopay} autopay · {fmtCurrency(totalDue)} due
                    </span>
                  </div>
                </div>
              </div>
              {/* Right: domain pills */}
              <div className="flex items-center gap-2 flex-wrap">
                {(["Compliance", "Utilities", "Finances"] as const).map((label) => {
                  const s = label === "Compliance" ? complianceStatus : label === "Utilities" ? utilityStatus : financialStatus;
                  return (
                    <div key={label} className="flex items-center gap-1.5 bg-black/[0.025] rounded-lg px-2.5 py-1.5 border border-[#EFEDE7]">
                      <span className={`w-1.5 h-1.5 rounded-full ${domainDot(s)}`} />
                      <span className="text-xs text-[#6E6B64]">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {needYouActions.length > 0 && (
        <Card className="bg-white border-[#EAE8E1] text-[#2B2B28]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#57554F] flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Needs your attention
              <Badge className="bg-[#5A6247]/[0.08] text-[#5A6247] border-0 text-xs px-2 ml-auto">
                {needYouActions.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {needYouActions.map((action) => {
              const ps = priorityClasses(action.priority);
              return (
                <div
                  key={action.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${ps.border} hover:bg-[#5A6247]/[0.06] transition-colors group`}
                >
                  <Badge className={`${ps.badge} border-0 text-[10px] px-2 py-0.5 uppercase tracking-wide shrink-0`}>
                    {action.priority}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-tight">{action.label}</p>
                    <p className="text-xs text-[#6E6B64] mt-0.5">{action.detail}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {action.dueIn && (
                      <span className="text-[10px] text-[#78756E] hidden sm:inline">{action.dueIn}</span>
                    )}
                    {action.ctaLabel && (
                      <button className="text-[11px] font-medium text-[#5A6247] bg-[#5A6247]/[0.06] hover:bg-[#5A6247]/[0.10] border border-[#5A6247]/20 rounded-lg px-2.5 py-1.5 transition-colors">
                        {action.ctaLabel}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Utility mini-cards */}
      {lastMonth && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger">
          {([
            { label: "Electricity", value: lastMonth.electric, delta: elecDelta, icon: Zap, color: "text-amber-600", bg: "bg-amber-500/10" },
            { label: "Water", value: lastMonth.water, delta: waterDelta, icon: Droplets, color: "text-blue-400", bg: "bg-blue-500/10" },
            { label: "Gas", value: lastMonth.gas, delta: gasDelta, icon: Flame, color: "text-orange-400", bg: "bg-orange-500/10" },
            { label: solarOffset > 0 ? `Total · ${solarOffset}% solar` : "Total utilities", value: totalSpend, delta: totalDelta, icon: solarOffset > 0 ? Sun : DollarSign, color: "text-emerald-600", bg: "bg-emerald-500/10" },
          ] as const).map(({ label, value, delta, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white border border-[#EAE8E1] rounded-2xl shadow-soft p-4 hover:border-[#5A6247]/15 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${bg}`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <span className="flex items-center gap-1 text-xs text-[#6E6B64] bg-black/[0.025] border border-[#EAE8E1] rounded-lg px-2 py-1">
                  {delta > 0 ? <TrendingUp className="w-3 h-3 text-red-500" /> : <TrendingDown className="w-3 h-3 text-emerald-600" />}
                  {Math.abs(delta)}%
                </span>
              </div>
              <p className="text-2xl font-bold tnum text-[#5A6247]">${value}</p>
              <p className="text-[#6E6B64] text-xs mt-1 truncate">{label}</p>
            </div>
          ))}
        </div>
      )}

      <Card className="bg-white border-[#EAE8E1] text-[#2B2B28]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-[#57554F] flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Bills this month
            <Badge className="bg-[#5A6247]/[0.08] text-[#5A6247] border-0 text-xs px-2 ml-auto">
              {fmtCurrency(totalDue)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sortedBills.map((bill) => {
            const bsc = statusClasses(bill.status);
            return (
              <div
                key={bill.id}
                className={`flex items-center gap-3 p-3 rounded-xl border ${bsc.border} ${bsc.bg}`}
              >
                <span className={`w-2 h-2 rounded-full ${bsc.dot} shrink-0`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium truncate">{bill.name}</p>
                    {bill.isMortgage && (
                      <Badge className="bg-black/[0.05] text-[#6E6B64] border-0 text-[10px] px-1.5 py-0 h-4">
                        Mortgage
                      </Badge>
                    )}
                    {bill.autopay ? (
                      <Badge className="bg-emerald-500/15 text-emerald-600 border-0 text-[10px] px-1.5 py-0 h-4 flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5" />
                        Autopay
                      </Badge>
                    ) : (
                      <Badge className="bg-black/[0.025] text-[#6E6B64] border-0 text-[10px] px-1.5 py-0 h-4">
                        Manual
                      </Badge>
                    )}
                  </div>
                  <p className={`text-xs mt-0.5 ${bsc.text}`}>
                    {bill.statusLabel} · {bill.dueDate}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-semibold">{fmtCurrency(bill.amount)}</p>
                    <p className="text-[10px] text-[#78756E]">{bill.category}</p>
                  </div>
                  {!bill.autopay && bill.status !== "green" && (
                    <button className="text-[11px] font-medium text-[#5A6247] bg-[#5A6247]/[0.06] hover:bg-[#5A6247]/[0.10] border border-[#5A6247]/20 rounded-lg px-2.5 py-1.5 transition-colors hidden sm:block">
                      Pay
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Utility chart — standalone full-width */}
      <Card className="bg-white border-[#EAE8E1] text-[#2B2B28]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-[#57554F] flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Monthly utility spend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="elecGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#A9792F" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#A9792F" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5E7C88" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#5E7C88" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gasGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#B0654A" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#B0654A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(43,43,40,0.06)" />
                <XAxis dataKey="month" tick={{ fill: "rgba(43,43,40,0.45)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(43,43,40,0.45)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid #EAE8E1",
                    borderRadius: 12,
                    color: "#2B2B28",
                    fontSize: 12,
                    boxShadow: "0 12px 28px -16px rgba(43,43,40,0.25)",
                  }}
                  formatter={(value, name) => [`$${value}`, String(name)]}
                />
                <Area type="monotone" dataKey="Electric" stroke="#A9792F" fill="url(#elecGrad)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="Water" stroke="#5E7C88" fill="url(#waterGrad)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="Gas" stroke="#B0654A" fill="url(#gasGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-2 px-1">
            {[["#A9792F", "Electric"], ["#5E7C88", "Water"], ["#B0654A", "Gas"]].map(([color, label]) => (
              <span key={label} className="flex items-center gap-1.5 text-[11px] text-[#6E6B64]">
                <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                {label}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Financial summary — full-width, expandable */}
      <Card className="bg-white border-[#EAE8E1] text-[#2B2B28]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-[#57554F] flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Financial summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-3">
            <div>
              <p className="text-[11px] text-[#6E6B64] mb-1">Income</p>
              <p className="text-lg font-bold text-emerald-600">{fmtCurrency(fin.income)}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#6E6B64] mb-1">Expenses</p>
              <p className="text-lg font-bold text-red-500">{fmtCurrency(fin.expenses)}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#6E6B64] mb-1">NOI</p>
              <p className={`text-lg font-bold ${fin.noi > 0 ? "text-emerald-600" : fin.noi < 0 ? "text-red-500" : "text-[#5A6247]"}`}>
                {fmtCurrency(fin.noi)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[#6E6B64] mb-1">Occupancy</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold text-[#5A6247]">{fin.occupancy}%</p>
                <div className="flex-1 h-2 bg-[#5A6247]/[0.08] rounded-full overflow-hidden max-w-[80px]">
                  <div
                    className="h-full bg-gradient-to-r from-[#5A6247] to-emerald-500 rounded-full"
                    style={{ width: `${fin.occupancy}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="relative group pt-3 border-t border-[#EAE8E1]">
            <button
              onClick={() => setShowFullFinancials((v) => !v)}
              className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-[#5A6247]/[0.06] hover:bg-[#5A6247]/[0.08] border border-[#E2DFD6] hover:border-[#CFCBC0] text-sm font-medium text-[#5A6247] hover:text-[#2B2B28] transition-all"
            >
              <div className="flex items-center gap-2.5">
                <DollarSign className="w-4 h-4" />
                <span>Full P&amp;L · Mortgage · Equity</span>
              </div>
              <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${showFullFinancials ? "rotate-180" : ""}`} />
            </button>
            {!showFullFinancials && (
              <div className="absolute left-0 right-0 top-full mt-1.5 rounded-xl bg-[#FAF9F6] border border-[#D8D5CB] shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 p-4">
                <div className="grid grid-cols-3 gap-5">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#78756E] mb-2">Top expenses</p>
                    {expenses.length > 0 && (
                      <div className="h-2 rounded-full overflow-hidden flex bg-[#5A6247]/[0.08] mb-2">
                        {expenses.slice(0, 4).map((e) => (
                          <div
                            key={e.category}
                            className={`h-full first:rounded-l-full last:rounded-r-full ${categoryColors[e.category] ?? "bg-[#A8A59E]"}`}
                            style={{ width: `${Math.round(e.share * 100)}%` }}
                          />
                        ))}
                      </div>
                    )}
                    <div className="space-y-0.5">
                      {expenses.slice(0, 3).map((e) => (
                        <div key={e.category} className="flex items-center gap-1.5 text-[11px]">
                          <span className={`w-1.5 h-1.5 rounded-full ${categoryColors[e.category] ?? "bg-[#A8A59E]"} shrink-0`} />
                          <span className="text-[#6E6B64] truncate">{e.category}</span>
                          <span className="text-[#78756E] ml-auto shrink-0">{fmtCurrency(e.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#78756E] mb-2">Mortgage</p>
                    <div className="h-2 rounded-full overflow-hidden bg-[#5A6247]/[0.08] mb-2">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-[#8A9472]"
                        style={{ width: `${mockPaidPct}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-[#6E6B64]">
                      <span className="text-emerald-600 font-medium">{mockPaidPct}%</span> paid off
                    </p>
                    <p className="text-[11px] text-[#78756E]">{fmtCurrency(property.mortBal)} remaining</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#78756E] mb-2">Equity</p>
                    <div className="flex items-center gap-3">
                      {(() => {
                        const pR = 16; const pC = 2 * Math.PI * pR;
                        return (
                          <svg width="42" height="42" viewBox="0 0 42 42" className="shrink-0">
                            <circle cx="21" cy="21" r={pR} fill="none" stroke="rgba(90,98,71,0.15)" strokeWidth="5" />
                            <circle cx="21" cy="21" r={pR} fill="none" stroke="#5A6247" strokeWidth="5"
                              strokeDasharray={`${(mockEquityPct / 100) * pC} ${(1 - mockEquityPct / 100) * pC}`}
                              strokeLinecap="round" transform="rotate(-90 21 21)" />
                          </svg>
                        );
                      })()}
                      <div>
                        <p className="text-sm font-semibold text-[#5A6247]">{mockEquityPct}%</p>
                        <p className="text-[11px] text-[#78756E]">{fmtCurrency(mockEquity)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {showFullFinancials && (
            <div className="pt-4 mt-3 border-t border-[#EAE8E1]">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left: P&L breakdown (3/5 width) */}
                <div className="lg:col-span-3 space-y-2.5">
                  <p className="text-[11px] font-medium text-[#6E6B64] uppercase tracking-wider mb-3">Monthly P&amp;L</p>
                  <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Booking income</p>
                      <p className="text-[11px] text-[#6E6B64]">{bookings.filter((b) => b.status === "completed").length} stays this period</p>
                    </div>
                    <p className="text-lg font-semibold text-emerald-600">+{fmtCurrency(fin.income)}</p>
                  </div>
                  {expenses.map((e) => (
                    <div key={e.category} className="flex items-center gap-3 p-3 rounded-xl bg-black/[0.015] border border-[#EFEDE7]">
                      <span className={`w-2.5 h-2.5 rounded-full ${categoryColors[e.category] ?? "bg-[#A8A59E]"} shrink-0`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm">{e.category}</p>
                        <div className="mt-1.5 h-1.5 bg-[#5A6247]/[0.08] rounded-full overflow-hidden">
                          <div
                            className={`h-full ${categoryColors[e.category] ?? "bg-[#A8A59E]"} rounded-full`}
                            style={{ width: `${Math.round(e.share * 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-red-500">{fmtCurrency(e.amount)}</p>
                        <p className="text-[10px] text-[#78756E]">{Math.round(e.share * 100)}%</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-3 border-t border-[#EAE8E1]">
                    <p className="text-sm font-semibold">Net operating income</p>
                    <p className={`text-xl font-bold tnum ${fin.noi >= 0 ? "text-emerald-600" : "text-red-500"}`}>{fmtCurrency(fin.noi)}</p>
                  </div>
                </div>

                {/* Right: Mortgage + Equity (2/5 width) */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-medium text-[#6E6B64] uppercase tracking-wider">Mortgage</p>
                      <Badge className="bg-black/[0.025] text-[#6E6B64] border-0 text-[10px] px-1.5">
                        {property.mortRate}% APR
                      </Badge>
                    </div>
                    <div className="space-y-2.5 p-4 rounded-xl bg-black/[0.015] border border-[#EFEDE7]">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#6E6B64]">Monthly payment</span>
                        <span className="text-sm font-semibold">{fmtCurrency(property.mortPay)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#6E6B64]">Current balance</span>
                        <span className="text-sm font-semibold">{fmtCurrency(property.mortBal)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#6E6B64]">Original loan</span>
                        <span className="text-sm font-semibold">{fmtCurrency(property.mortOrig)}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2.5 border-t border-[#EAE8E1]">
                        <span className="text-xs text-[#57554F]">Principal paid</span>
                        <span className="text-sm font-bold text-emerald-600">
                          {fmtCurrency(mockPaidPrincipal)} ({mockPaidPct}%)
                        </span>
                      </div>
                      <div className="h-2.5 bg-[#5A6247]/[0.08] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-[#8A9472]"
                          style={{ width: `${mockPaidPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[11px] font-medium text-[#6E6B64] uppercase tracking-wider">Equity</p>
                    <div className="flex flex-col items-center p-4 rounded-xl bg-black/[0.015] border border-[#EFEDE7]">
                      {(() => {
                        const eR = 54;
                        const eC = 2 * Math.PI * eR;
                        const eOffset = eC - (mockEquityPct / 100) * eC;
                        return (
                          <svg width="140" height="140" viewBox="0 0 140 140">
                            <circle cx="70" cy="70" r={eR} fill="none" stroke="rgba(90,98,71,0.15)" strokeWidth="11" />
                            <circle
                              cx="70" cy="70" r={eR} fill="none"
                              stroke="#5A6247" strokeWidth="11"
                              strokeDasharray={eC}
                              strokeDashoffset={eOffset}
                              strokeLinecap="round"
                              transform="rotate(-90 70 70)"
                            />
                            <text x="70" y="66" textAnchor="middle" fill="#5A6247" fontSize="22" fontWeight="bold">{mockEquityPct}%</text>
                            <text x="70" y="84" textAnchor="middle" fill="rgba(43,43,40,0.45)" fontSize="10">equity</text>
                          </svg>
                        );
                      })()}
                      <div className="grid grid-cols-2 gap-4 w-full mt-3 pt-3 border-t border-[#EAE8E1]">
                        <div>
                          <p className="text-[#6E6B64] text-[11px]">Equity</p>
                          <p className="text-base font-semibold text-[#5A6247]">{fmtCurrency(mockEquity)}</p>
                        </div>
                        <div>
                          <p className="text-[#6E6B64] text-[11px]">Owed</p>
                          <p className="text-base font-semibold">{fmtCurrency(property.mortBal)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-[#78756E] text-xs italic pt-4">All numbers are simulated for design review.</p>
    </main>
  );
}

// ── Page shell (header + routing) ────────────────────────────────────────────

export default function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const supabase = createClient();

  const [dbProperty, setDbProperty] = useState<DbPropertyWithBills | null | undefined>(
    undefined
  );
  const [allProperties, setAllProperties] = useState<DbPropertyWithBills[]>([]);
  const [showPropertyDropdown, setShowPropertyDropdown] = useState(false);

  useEffect(() => {
    if (!isDbId(id)) {
      setDbProperty(null);
      return;
    }
    getPropertyById(supabase, id).then(setDbProperty);
    listUserProperties(supabase).then(setAllProperties).catch(() => {});
  }, [id]);

  const loading = dbProperty === undefined && isDbId(id);
  const propertyName = isDbId(id)
    ? (dbProperty as DbPropertyWithBills | null)?.name ?? "Loading…"
    : getProperty(id)?.name ?? "Property";

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#2B2B28]">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#E2DFD6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-[#6E6B64] hover:text-[#2B2B28] text-sm">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Portfolio</span>
            </Link>
            <div className="h-5 w-px bg-[#5A6247]/[0.08]" />
            <div className="relative">
              <button
                onClick={() => allProperties.length > 1 && setShowPropertyDropdown((v) => !v)}
                className="flex items-center gap-2 min-w-0"
              >
                <div className="w-7 h-7 rounded-lg bg-[#5A6247] flex items-center justify-center shrink-0">
                  <HomeIcon className="w-4 h-4 text-white" />
                </div>
                <span className="font-serif text-base sm:text-lg font-bold tracking-tight truncate">
                  {propertyName}
                </span>
                {allProperties.length > 1 && (
                  <ChevronDown className={`w-4 h-4 text-[#6E6B64] shrink-0 transition-transform ${showPropertyDropdown ? "rotate-180" : ""}`} />
                )}
              </button>
              {showPropertyDropdown && allProperties.length > 1 && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-[#D8D5CB] rounded-xl shadow-xl z-50 overflow-hidden">
                  {allProperties.map((p) => (
                    <Link
                      key={p.id}
                      href={`/dashboard/${p.id}`}
                      onClick={() => setShowPropertyDropdown(false)}
                      className={`flex items-center gap-3 px-4 py-3 text-sm hover:bg-[#5A6247]/[0.08] transition-colors ${
                        p.id === id ? "bg-[#5A6247]/[0.06] text-[#5A6247]" : "text-[#57554F]"
                      }`}
                    >
                      <HomeIcon className="w-4 h-4 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{p.name ?? "Untitled"}</p>
                        <p className="text-[11px] text-[#6E6B64] truncate">{p.location ?? p.address ?? ""}</p>
                      </div>
                      {p.id === id && <span className="ml-auto text-emerald-600 text-xs">Current</span>}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/inbox"
              className="text-xs text-[#6E6B64] hover:text-[#2B2B28] px-3 py-1.5 rounded-lg border border-[#5A6247]/15 hidden sm:flex items-center gap-2"
            >
              <Inbox className="w-3.5 h-3.5" />
              Inbox
            </Link>
            <button className="relative p-2 rounded-xl hover:bg-[#5A6247]/[0.08] transition-colors">
              <Bell className="w-5 h-5 text-[#6E6B64]" />
            </button>
          </div>
        </div>
      </header>

      {loading && (
        <div className="flex items-center justify-center py-24 text-[#78756E]">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading property…
        </div>
      )}

      {!loading && isDbId(id) && dbProperty && (
        <RealPropertyDetail property={dbProperty} />
      )}

      {!loading && isDbId(id) && dbProperty === null && notFound()}

      {!isDbId(id) && <MockPropertyDetail id={id} />}
    </div>
  );
}
