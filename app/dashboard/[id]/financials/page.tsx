"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Home as HomeIcon, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getProperty,
  fmtCurrency,
  financialSummaryByProperty,
  expenseBreakdownByProperty,
  bookingsByProperty,
} from "@/lib/v0/mockData";

const categoryColors: Record<string, string> = {
  Mortgage: "bg-accent",
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

export default function FinancialsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const property = getProperty(id);
  if (!property) notFound();

  const fin = financialSummaryByProperty[id];
  const expenses = expenseBreakdownByProperty[id] ?? [];
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const equity = property.propVal - property.mortBal;
  const equityPct = Math.round((equity / property.propVal) * 100);
  const paidPrincipal = property.mortOrig - property.mortBal;
  const paidPct = Math.round((paidPrincipal / property.mortOrig) * 100);
  const bookings = bookingsByProperty[id] ?? [];
  const bookingNet = bookings.filter((b) => b.status === "completed").reduce((s, b) => s + b.net, 0);

  const C = 2 * Math.PI * 70;
  const equityOffset = C - (equityPct / 100) * C;

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-line2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
          <Link href={`/dashboard/${id}`} className="flex items-center gap-2 text-muted hover:text-ink text-sm">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{property.name}</span>
          </Link>
          <div className="h-5 w-px bg-accentfg/[0.08]" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
              <HomeIcon className="w-4 h-4 text-white" />
            </div>
            <span className="font-serif text-base sm:text-lg font-bold tracking-tight">Financials</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <div className="flex items-center gap-2 text-[10px] text-faint uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60" />
          Simulated demo data
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold flex items-center gap-3">
            <DollarSign className="w-7 h-7 text-accentfg" />
            Full financial breakdown
          </h1>
          <p className="text-muted text-sm mt-1">
            {property.name} · {property.address}
          </p>
        </div>

        {/* P&L */}
        <Card className="bg-surface border-line text-ink">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-ink2">Monthly P&amp;L</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Income line */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
              <div>
                <p className="text-sm font-medium">Booking income</p>
                <p className="text-[11px] text-muted">{bookings.filter((b) => b.status === "completed").length} stays this period</p>
              </div>
              <p className="text-lg font-semibold text-emerald-600">+{fmtCurrency(fin.income)}</p>
            </div>

            {/* Expense lines */}
            {expenses.map((e) => (
              <div
                key={e.category}
                className="flex items-center gap-3 p-3 rounded-xl bg-tint/[0.015] border border-subtle"
              >
                <span className={`w-2.5 h-2.5 rounded-full ${categoryColors[e.category] ?? "bg-[#A8A59E]"} shrink-0`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{e.category}</p>
                  <div className="mt-1 h-1 bg-accentfg/10 rounded-full overflow-hidden max-w-xs">
                    <div
                      className={`h-full ${categoryColors[e.category] ?? "bg-[#A8A59E]"} transition-all`}
                      style={{ width: `${Math.round(e.share * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-red-500">−{fmtCurrency(e.amount)}</p>
                  <p className="text-[10px] text-faint">{Math.round(e.share * 100)}% of expenses</p>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between pt-3 mt-2 border-t border-line">
              <p className="text-sm font-semibold">Net operating income</p>
              <p className="text-xl font-bold tnum text-emerald-600">{fmtCurrency(fin.income - totalExpenses)}</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 stagger">
          {/* Mortgage */}
          <Card className="bg-surface border-line text-ink">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-ink2 flex items-center gap-2">
                Mortgage
                <Badge className="bg-tint/[0.025] text-muted border-0 text-[10px] px-1.5 ml-auto">
                  {property.mortRate}% APR
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">Monthly payment</span>
                <span className="text-sm font-semibold">{fmtCurrency(property.mortPay)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">Current balance</span>
                <span className="text-sm font-semibold">{fmtCurrency(property.mortBal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">Original loan</span>
                <span className="text-sm font-semibold">{fmtCurrency(property.mortOrig)}</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-line">
                <span className="text-xs text-ink2">Principal paid</span>
                <span className="text-sm font-bold text-emerald-600">
                  {fmtCurrency(paidPrincipal)} ({paidPct}%)
                </span>
              </div>
              <div className="mt-2">
                <div className="h-2 bg-accentfg/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-accentlight transition-all"
                    style={{ width: `${paidPct}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Equity donut */}
          <Card className="bg-surface border-line text-ink">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-ink2">Equity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <svg width="180" height="180" viewBox="0 0 180 180">
                  <circle cx="90" cy="90" r="70" fill="none" stroke="#5A6247" strokeOpacity={0.13} strokeWidth="14" />
                  <circle
                    cx="90"
                    cy="90"
                    r="70"
                    fill="none"
                    stroke="#5A6247"
                    strokeWidth="14"
                    strokeDasharray={C}
                    strokeDashoffset={equityOffset}
                    strokeLinecap="round"
                    transform="rotate(-90 90 90)"
                  />
                  <text x="90" y="86" textAnchor="middle" style={{ fill: "var(--accentfg)" }} fontSize="28" fontWeight="bold">
                    {equityPct}%
                  </text>
                  <text x="90" y="106" textAnchor="middle" style={{ fill: "var(--faint)" }} fontSize="11">
                    equity
                  </text>
                </svg>

                <div className="grid grid-cols-2 gap-4 w-full mt-4 pt-4 border-t border-line">
                  <div>
                    <p className="text-muted text-[11px]">Equity</p>
                    <p className="text-base font-semibold text-accentfg">{fmtCurrency(equity)}</p>
                  </div>
                  <div>
                    <p className="text-muted text-[11px]">Owed</p>
                    <p className="text-base font-semibold">{fmtCurrency(property.mortBal)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Booking economics */}
        <Card className="bg-surface border-line text-ink">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-ink2">Booking economics (last 30 days)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">Stays completed</span>
              <span className="text-sm font-semibold">{bookings.filter((b) => b.status === "completed").length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">Net (after platform/cleaning/taxes)</span>
              <span className="text-sm font-semibold text-emerald-600">+{fmtCurrency(bookingNet)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">Occupancy</span>
              <span className="text-sm font-semibold">{fin.occupancy}%</span>
            </div>
            <Link
              href={`/dashboard/${id}/bookings`}
              className="text-xs text-accentfg hover:text-ink inline-flex items-center gap-1 mt-2"
            >
              See per-booking detail →
            </Link>
          </CardContent>
        </Card>

        <p className="text-faint text-xs italic pt-4">All numbers are simulated for design review.</p>
      </main>
    </div>
  );
}
