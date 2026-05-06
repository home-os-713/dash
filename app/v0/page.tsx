"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Home as HomeIcon,
  Bell,
  Inbox,
  Zap,
  Receipt,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  properties,
  billsByProperty,
  actionItemsByProperty,
  financialSummaryByProperty,
  getPropertyHealth,
  statusClasses,
  fmtCurrency,
  actionItems,
} from "@/lib/v0/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PortfolioPage() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const supabase = createClient();

  const allBills = properties.flatMap((p) => billsByProperty[p.id] ?? []);
  const totalBills = allBills.length;
  const onAutopay = allBills.filter((b) => b.autopay).length;
  const needAttention = allBills.filter((b) => b.status !== "green").length;
  const totalDue = allBills.reduce((s, b) => s + b.amount, 0);

  const totalUrgent = actionItems.filter((a) => a.priority === "urgent").length;
  const totalSoon = actionItems.filter((a) => a.priority === "soon").length;

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-[#2B2B2B] text-white">
      <header className="sticky top-0 z-50 bg-[#4B5436]/95 backdrop-blur-xl border-b border-[#4B5436]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <div className="h-5 w-px bg-[#C7BBA3]/15" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#4B5436] flex items-center justify-center">
                <HomeIcon className="w-4 h-4 text-white" />
              </div>
              <span className="font-serif text-lg font-bold tracking-tight">HomeOS</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/v0/inbox"
              className="flex items-center gap-2 text-white/60 hover:text-white text-sm bg-white/[0.04] border border-[#4B5436]/15 rounded-xl px-3 py-2 transition-colors"
            >
              <Inbox className="w-4 h-4" />
              <span className="hidden sm:inline">Inbox</span>
              {totalUrgent + totalSoon > 0 && (
                <Badge className="bg-[#C7BBA3]/15 text-[#C7BBA3] border-0 text-[10px] px-1.5 h-4">
                  {totalUrgent + totalSoon}
                </Badge>
              )}
            </Link>
            <button className="relative p-2 rounded-xl hover:bg-[#4B5436]/20 transition-colors">
              <Bell className="w-5 h-5 text-white/60" />
              {totalUrgent > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-400 rounded-full" />}
            </button>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="text-xs text-white/50 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-[#C7BBA3]/15"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <div className="flex items-center gap-2 text-[10px] text-white/30 uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60" />
          Simulated demo data
        </div>

        {/* HERO — single, clear line */}
        <div className="bg-[#353530] border border-[#4B5436]/15 rounded-2xl p-6 sm:p-8">
          <p className="text-[11px] uppercase tracking-wider text-white/40 mb-3">Every bill, every property, one place</p>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold leading-tight">
            <span className="text-white">{totalBills} bills</span>
            <span className="text-white/40"> across </span>
            <span className="text-white">{properties.length} properties</span>
            <span className="text-white/40"> · </span>
            <span className="text-emerald-400">{onAutopay} on autopay</span>
            {needAttention > 0 && (
              <>
                <span className="text-white/40"> · </span>
                <span className="text-amber-400">{needAttention} need attention</span>
              </>
            )}
          </h1>
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-[#4B5436]/15">
            <div>
              <p className="text-white/40 text-[11px] uppercase tracking-wider">Bills due this month</p>
              <p className="text-2xl font-bold text-[#C7BBA3] mt-1">{fmtCurrency(totalDue)}</p>
            </div>
            <div>
              <p className="text-white/40 text-[11px] uppercase tracking-wider">On autopay</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">
                {onAutopay}<span className="text-white/30 text-base font-normal">/{totalBills}</span>
              </p>
            </div>
            <div>
              <p className="text-white/40 text-[11px] uppercase tracking-wider">Needs you</p>
              <p className="text-2xl font-bold text-white mt-1">{totalUrgent + totalSoon}</p>
            </div>
          </div>
        </div>

        {/* What needs you (link to inbox) */}
        {totalUrgent + totalSoon > 0 && (
          <Link
            href="/v0/inbox"
            className="block bg-[#353530] border border-[#4B5436]/15 hover:border-[#C7BBA3]/30 rounded-2xl p-5 transition-colors group"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-[#C7BBA3]/15 shrink-0">
                  <Inbox className="w-4 h-4 text-[#C7BBA3]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {totalUrgent > 0 && <span className="text-red-400">{totalUrgent} urgent</span>}
                    {totalUrgent > 0 && totalSoon > 0 && <span className="text-white/30"> · </span>}
                    {totalSoon > 0 && <span className="text-amber-400">{totalSoon} due soon</span>}
                  </p>
                  <p className="text-[11px] text-white/40 mt-0.5">
                    Open inbox to handle them
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-[#C7BBA3] group-hover:translate-x-0.5 transition-all" />
            </div>
          </Link>
        )}

        {/* Properties */}
        <div>
          <h2 className="text-sm font-medium text-white/70 mb-3">Properties</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {properties.map((p) => {
              const health = getPropertyHealth(p.id);
              const fin = financialSummaryByProperty[p.id];
              const bills = billsByProperty[p.id];
              const propAutopay = bills.filter((b) => b.autopay).length;
              const propAttention = bills.filter((b) => b.status !== "green").length;
              const overdueBills = bills.filter((b) => b.status === "red").length;
              const sc = statusClasses(health.overall);

              return (
                <Link
                  key={p.id}
                  href={`/v0/${p.id}`}
                  className={`group block bg-[#353530] rounded-2xl border border-[#4B5436]/15 hover:border-[#C7BBA3]/30 transition-all border-l-4 ${
                    health.overall === "green"
                      ? "border-l-emerald-400"
                      : health.overall === "yellow"
                        ? "border-l-amber-400"
                        : "border-l-red-400"
                  }`}
                >
                  <div className="p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`w-12 h-12 rounded-2xl ${sc.bg} flex items-center justify-center shrink-0`}>
                          <p.icon className={`w-5 h-5 ${sc.text}`} />
                        </div>
                        <div className="min-w-0">
                          <h2 className="text-lg font-serif font-bold truncate">{p.name}</h2>
                          <p className="text-white/40 text-xs mt-0.5">
                            {p.location} · {p.type}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-[#C7BBA3] transition-colors shrink-0" />
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#4B5436]/15">
                      <div>
                        <p className="text-white/40 text-[11px] mb-1 flex items-center gap-1">
                          <Receipt className="w-3 h-3" />
                          Bills
                        </p>
                        <p className="text-sm font-semibold">{bills.length}</p>
                      </div>
                      <div>
                        <p className="text-white/40 text-[11px] mb-1 flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          Autopay
                        </p>
                        <p className="text-sm font-semibold text-emerald-400">
                          {propAutopay}<span className="text-white/30 font-normal">/{bills.length}</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-white/40 text-[11px] mb-1">Net this mo.</p>
                        <p className="text-sm font-semibold text-white">{fmtCurrency(fin.noi)}</p>
                      </div>
                    </div>

                    {(overdueBills > 0 || propAttention > 0) && (
                      <div
                        className={`mt-4 flex items-center gap-2 rounded-xl px-3 py-2 border ${
                          overdueBills > 0
                            ? "bg-red-500/5 border-red-500/15"
                            : "bg-amber-500/5 border-amber-500/15"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            overdueBills > 0 ? "bg-red-400 animate-pulse" : "bg-amber-400"
                          }`}
                        />
                        <p className={`text-xs ${overdueBills > 0 ? "text-red-400" : "text-amber-400"}`}>
                          {overdueBills > 0
                            ? `${overdueBills} overdue · ${propAttention - overdueBills} due soon`
                            : `${propAttention} due soon`}
                        </p>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <p className="text-white/30 text-xs italic pt-4">
          Multi-property is hardcoded for design review. Wiring to live data needs a schema change
          (one-property-per-user → many).
        </p>
      </main>
    </div>
  );
}
