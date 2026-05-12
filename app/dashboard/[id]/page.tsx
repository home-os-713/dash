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
  Activity,
  DollarSign,
  Receipt,
  Zap,
  Inbox,
  Calendar,
  Loader2,
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
  bookingsByProperty,
  getPropertyHealth,
  statusClasses,
  priorityClasses,
  fmtCurrency,
} from "@/lib/v0/mockData";

// ── Real-data property detail ────────────────────────────────────────────────

function RealPropertyDetail({ property }: { property: DbPropertyWithBills }) {
  const bills = property.bills ?? [];
  const health = computePropertyHealth(bills);
  const noi = computeNOI(property, bills);
  const sc = statusClasses(health.overall);

  const onAutopay = bills.filter((b) => b.autopay).length;
  const needAttention = bills.filter((b) => b.status !== "green").length;
  const totalDue = bills.reduce((s, b) => s + (b.amount ?? 0), 0);

  const sortedBills = [...bills].sort((a, b) => {
    const order = { red: 0, yellow: 1, green: 2 } as const;
    const aStatus = (a.status ?? "green") as keyof typeof order;
    const bStatus = (b.status ?? "green") as keyof typeof order;
    return order[aStatus] - order[bStatus];
  });

  const income = property.income ?? property.rent ?? 0;
  const expenses = bills.reduce((s, b) => s + (b.amount ?? 0), 0);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Hero */}
      <div
        className={`bg-[#353530] rounded-2xl border border-[#4B5436]/15 border-l-4 p-5 sm:p-6 ${
          health.overall === "green"
            ? "border-l-emerald-400"
            : health.overall === "yellow"
              ? "border-l-amber-400"
              : "border-l-red-400"
        }`}
      >
        <div className="flex items-start justify-between gap-4 flex-col sm:flex-row sm:items-center">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-white/40 mb-1">
              {property.location ?? property.address ?? "—"} · {property.type ?? "Property"}
            </p>
            <h1 className="text-xl sm:text-2xl font-serif font-bold">
              {property.name ?? "Untitled property"}
            </h1>
            <h2 className="text-base sm:text-lg mt-3 leading-snug">
              <span className="text-white">{bills.length} bills this month</span>
              {bills.length > 0 && (
                <>
                  <span className="text-white/40"> · </span>
                  <span className="text-emerald-400">{onAutopay} on autopay</span>
                  {needAttention > 0 && (
                    <>
                      <span className="text-white/40"> · </span>
                      <span className="text-amber-400">{needAttention} need attention</span>
                    </>
                  )}
                </>
              )}
            </h2>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 text-right">
            <div>
              <p className="text-white/40 text-[11px] uppercase tracking-wider">Total due</p>
              <p className="text-2xl font-bold text-[#C7BBA3] mt-1">
                {totalDue > 0 ? fmtCurrency(totalDue) : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bills */}
      <Card className="bg-[#353530] border-[#4B5436]/15 text-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Bills this month
            {totalDue > 0 && (
              <Badge className="bg-[#C7BBA3]/15 text-[#C7BBA3] border-0 text-xs px-2 ml-auto">
                {fmtCurrency(totalDue)}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedBills.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-white/30">No bills yet.</p>
              <p className="text-xs text-white/20 mt-1">
                Add bills to this property via the Supabase dashboard or wait for bill ingestion to be wired up.
              </p>
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
                          <Badge className="bg-emerald-500/15 text-emerald-400 border-0 text-[10px] px-1.5 py-0 h-4 flex items-center gap-1">
                            <Zap className="w-2.5 h-2.5" />
                            Autopay
                          </Badge>
                        ) : (
                          <Badge className="bg-white/[0.04] text-white/40 border-0 text-[10px] px-1.5 py-0 h-4">
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
                      <p className="text-[10px] text-white/30">{bill.category ?? "Other"}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial summary */}
      <Card className="bg-[#353530] border-[#4B5436]/15 text-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Financial summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50">Income</span>
            <span className="text-sm font-semibold">
              {income > 0 ? fmtCurrency(income) : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50">Expenses</span>
            <span className="text-sm font-semibold">
              {expenses > 0 ? fmtCurrency(expenses) : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-[#4B5436]/15">
            <span className="text-xs text-white/70">Net</span>
            <span className={`text-sm font-bold ${noi >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {income > 0 || expenses > 0 ? fmtCurrency(noi) : "—"}
            </span>
          </div>
          {property.prop_val && property.mort_bal && (
            <>
              <div className="flex items-center justify-between pt-3 border-t border-[#4B5436]/15">
                <span className="text-xs text-white/50">Property value</span>
                <span className="text-sm font-semibold">{fmtCurrency(property.prop_val)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/50">Equity</span>
                <span className="text-sm font-semibold text-emerald-400">
                  {fmtCurrency(property.prop_val - property.mort_bal)}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <p className="text-white/30 text-xs italic pt-2">
        Bills, bookings, and utility charts will populate as you add data to this property.
      </p>
    </main>
  );
}

// ── Mock-data property detail (preserved for phoenix/pvr demo) ───────────────

function MockPropertyDetail({ id }: { id: string }) {
  const property = getProperty(id);
  if (!property) notFound();

  const bills = mockBillsByProperty[id] ?? [];
  const actions = actionItemsByProperty(id);
  const utilities = utilityDataByProperty[id] ?? [];
  const fin = financialSummaryByProperty[id];
  const bookings = bookingsByProperty[id] ?? [];
  const health = getPropertyHealth(id);

  const onAutopay = bills.filter((b) => b.autopay).length;
  const needAttention = bills.filter((b) => b.status !== "green").length;
  const totalDue = bills.reduce((s, b) => s + b.amount, 0);
  const needYouActions = actions.filter((a) => a.priority !== "review");
  const upcomingBookings = bookings.filter((b) => b.status !== "completed").slice(0, 3);

  const chartData = utilities.map((u) => ({
    month: u.month,
    Total: u.electric + u.water + u.gas,
  }));

  const sortedBills = [...bills].sort((a, b) => {
    const order = { red: 0, yellow: 1, green: 2 } as const;
    return order[a.status] - order[b.status];
  });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div className="flex items-center gap-2 text-[10px] text-white/30 uppercase tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60" />
        Simulated demo data
      </div>

      <div
        className={`bg-[#353530] rounded-2xl border border-[#4B5436]/15 border-l-4 p-5 sm:p-6 ${
          health.overall === "green"
            ? "border-l-emerald-400"
            : health.overall === "yellow"
              ? "border-l-amber-400"
              : "border-l-red-400"
        }`}
      >
        <div className="flex items-start justify-between gap-4 flex-col sm:flex-row sm:items-center">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-white/40 mb-1">
              {property.location} · {property.type}
            </p>
            <h1 className="text-xl sm:text-2xl font-serif font-bold">{property.name}</h1>
            <h2 className="text-base sm:text-lg mt-3 leading-snug">
              <span className="text-white">{bills.length} bills this month</span>
              <span className="text-white/40"> · </span>
              <span className="text-emerald-400">{onAutopay} on autopay</span>
              {needAttention > 0 && (
                <>
                  <span className="text-white/40"> · </span>
                  <span className="text-amber-400">{needAttention} need attention</span>
                </>
              )}
            </h2>
          </div>
          <div>
            <p className="text-white/40 text-[11px] uppercase tracking-wider">Total due</p>
            <p className="text-2xl font-bold text-[#C7BBA3] mt-1">{fmtCurrency(totalDue)}</p>
          </div>
        </div>
      </div>

      {needYouActions.length > 0 && (
        <Card className="bg-[#353530] border-[#4B5436]/15 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Needs your attention
              <Badge className="bg-[#C7BBA3]/15 text-[#C7BBA3] border-0 text-xs px-2 ml-auto">
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
                  className={`flex items-center gap-3 p-3 rounded-xl border ${ps.border} hover:bg-[#4B5436]/10 transition-colors group`}
                >
                  <Badge className={`${ps.badge} border-0 text-[10px] px-2 py-0.5 uppercase tracking-wide shrink-0`}>
                    {action.priority}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-tight">{action.label}</p>
                    <p className="text-xs text-white/40 mt-0.5">{action.detail}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {action.dueIn && (
                      <span className="text-[10px] text-white/30 hidden sm:inline">{action.dueIn}</span>
                    )}
                    {action.ctaLabel && (
                      <button className="text-[11px] font-medium text-[#C7BBA3] bg-[#C7BBA3]/10 hover:bg-[#C7BBA3]/20 border border-[#C7BBA3]/20 rounded-lg px-2.5 py-1.5 transition-colors">
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

      <Card className="bg-[#353530] border-[#4B5436]/15 text-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Bills this month
            <Badge className="bg-[#C7BBA3]/15 text-[#C7BBA3] border-0 text-xs px-2 ml-auto">
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
                      <Badge className="bg-white/10 text-white/60 border-0 text-[10px] px-1.5 py-0 h-4">
                        Mortgage
                      </Badge>
                    )}
                    {bill.autopay ? (
                      <Badge className="bg-emerald-500/15 text-emerald-400 border-0 text-[10px] px-1.5 py-0 h-4 flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5" />
                        Autopay
                      </Badge>
                    ) : (
                      <Badge className="bg-white/[0.04] text-white/40 border-0 text-[10px] px-1.5 py-0 h-4">
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
                    <p className="text-[10px] text-white/30">{bill.category}</p>
                  </div>
                  {!bill.autopay && bill.status !== "green" && (
                    <button className="text-[11px] font-medium text-[#C7BBA3] bg-[#C7BBA3]/10 hover:bg-[#C7BBA3]/20 border border-[#C7BBA3]/20 rounded-lg px-2.5 py-1.5 transition-colors hidden sm:block">
                      Pay
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="bg-[#353530] border-[#4B5436]/15 text-white lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Monthly utility spend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C7BBA3" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#C7BBA3" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4B5436" strokeOpacity={0.2} />
                  <XAxis dataKey="month" stroke="#888780" fontSize={11} />
                  <YAxis stroke="#888780" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: "#2B2B2B",
                      border: "1px solid #4B5436",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="Total" stroke="#C7BBA3" strokeWidth={2} fill="url(#totalGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#353530] border-[#4B5436]/15 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Financial summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/50">Income</span>
              <span className="text-sm font-semibold">{fmtCurrency(fin.income)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/50">Expenses</span>
              <span className="text-sm font-semibold">{fmtCurrency(fin.expenses)}</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-[#4B5436]/15">
              <span className="text-xs text-white/70">Net</span>
              <span className="text-sm font-bold text-emerald-400">{fmtCurrency(fin.noi)}</span>
            </div>
            <Link
              href={`/dashboard/${id}/financials`}
              className="flex items-center justify-between mt-2 text-xs text-[#C7BBA3] hover:text-white transition-colors group"
            >
              <span>Full P&amp;L · mortgage · equity</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {property.type === "STR" && upcomingBookings.length > 0 && (
        <Card className="bg-[#353530] border-[#4B5436]/15 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Upcoming stays
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingBookings.map((b) => (
              <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl border border-[#4B5436]/10 bg-white/[0.02]">
                <Badge className="bg-white/[0.04] text-white/60 border-0 text-[10px] px-1.5 py-0 h-5 shrink-0">
                  {b.platform}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{b.guest}</p>
                  <p className="text-[11px] text-white/40">
                    {b.checkIn} → {b.checkOut} · {b.nights} nights
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-emerald-400">+{fmtCurrency(b.net)}</p>
                  <p className="text-[10px] text-white/30">net</p>
                </div>
              </div>
            ))}
            <Link
              href={`/dashboard/${id}/bookings`}
              className="flex items-center justify-between mt-2 pt-3 border-t border-[#4B5436]/15 text-xs text-[#C7BBA3] hover:text-white"
            >
              <span>All stays &amp; net per booking</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </CardContent>
        </Card>
      )}

      <p className="text-white/30 text-xs italic pt-4">All numbers are simulated for design review.</p>
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

  useEffect(() => {
    if (!isDbId(id)) {
      setDbProperty(null);
      return;
    }
    getPropertyById(supabase, id).then(setDbProperty);
  }, [id]);

  const loading = dbProperty === undefined && isDbId(id);
  const propertyName = isDbId(id)
    ? (dbProperty as DbPropertyWithBills | null)?.name ?? "Loading…"
    : getProperty(id)?.name ?? "Property";

  return (
    <div className="min-h-screen bg-[#2B2B2B] text-white">
      <header className="sticky top-0 z-50 bg-[#4B5436]/95 backdrop-blur-xl border-b border-[#4B5436]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-white/50 hover:text-white text-sm">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Portfolio</span>
            </Link>
            <div className="h-5 w-px bg-[#C7BBA3]/15" />
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#4B5436] flex items-center justify-center shrink-0">
                <HomeIcon className="w-4 h-4 text-white" />
              </div>
              <span className="font-serif text-base sm:text-lg font-bold tracking-tight truncate">
                {propertyName}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/inbox"
              className="text-xs text-white/60 hover:text-white px-3 py-1.5 rounded-lg border border-[#C7BBA3]/15 hidden sm:flex items-center gap-2"
            >
              <Inbox className="w-3.5 h-3.5" />
              Inbox
            </Link>
            <button className="relative p-2 rounded-xl hover:bg-[#4B5436]/20 transition-colors">
              <Bell className="w-5 h-5 text-white/60" />
            </button>
          </div>
        </div>
      </header>

      {loading && (
        <div className="flex items-center justify-center py-24 text-white/30">
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
