"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  Inbox,
  CheckCircle2,
  Mail,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  actionItems,
  emailsParsed,
  getProperty,
  priorityClasses,
  autoHandled,
} from "@/lib/v0/mockData";

type Filter = "all" | "urgent" | "soon" | "review" | "bookings";

export default function InboxPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [pastExpanded, setPastExpanded] = useState(false);

  const filtered = actionItems.filter((a) => {
    if (filter === "all") return true;
    if (filter === "bookings") return a.kind === "booking";
    return a.priority === filter;
  });

  const showEmails = filter === "all";

  const counts = {
    all: actionItems.length + emailsParsed.length,
    urgent: actionItems.filter((a) => a.priority === "urgent").length,
    soon: actionItems.filter((a) => a.priority === "soon").length,
    review: actionItems.filter((a) => a.priority === "review").length,
    bookings: actionItems.filter((a) => a.kind === "booking").length,
  };

  const tabs: { key: Filter; label: string; count: number; tone?: string }[] = [
    { key: "all", label: "All", count: counts.all },
    { key: "urgent", label: "Urgent", count: counts.urgent, tone: "text-red-400" },
    { key: "soon", label: "Soon", count: counts.soon, tone: "text-amber-400" },
    { key: "review", label: "Review", count: counts.review, tone: "text-blue-400" },
    { key: "bookings", label: "Bookings", count: counts.bookings },
  ];

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
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#4B5436] flex items-center justify-center">
                <Inbox className="w-4 h-4 text-white" />
              </div>
              <span className="font-serif text-lg font-bold tracking-tight">Inbox</span>
            </div>
          </div>
          <button className="relative p-2 rounded-xl hover:bg-[#4B5436]/20 transition-colors">
            <Bell className="w-5 h-5 text-white/60" />
            {counts.urgent > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-400 rounded-full" />}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-4">
        <div className="flex items-center gap-2 text-[10px] text-white/30 uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60" />
          Simulated demo data
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs whitespace-nowrap transition-colors border ${
                filter === t.key
                  ? "bg-[#C7BBA3]/15 border-[#C7BBA3]/30 text-white"
                  : "bg-white/[0.02] border-[#4B5436]/15 text-white/50 hover:text-white"
              }`}
            >
              <span className="font-medium">{t.label}</span>
              <span className={`text-[10px] ${t.tone ?? "text-white/40"}`}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* Unified action items + emails list */}
        {filtered.length > 0 || (showEmails && emailsParsed.length > 0) ? (
          <div className="space-y-2">
            {filtered.map((action) => {
              const ps = priorityClasses(action.priority);
              const property = getProperty(action.propertyId)!;
              return (
                <div
                  key={action.id}
                  className={`flex items-center gap-3 p-3 sm:p-4 rounded-xl border ${ps.border} hover:bg-[#4B5436]/10 transition-colors`}
                >
                  <Badge className={`${ps.badge} border-0 text-[10px] px-2 py-0.5 uppercase tracking-wide shrink-0`}>
                    {action.priority}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium leading-tight">{action.label}</p>
                      <Link
                        href={`/dashboard/${property.id}`}
                        className="inline-flex items-center gap-1 text-[10px] text-white/40 hover:text-[#C7BBA3] transition-colors bg-white/[0.04] border border-[#4B5436]/15 rounded-md px-1.5 py-0.5"
                      >
                        <property.icon className="w-3 h-3" />
                        {property.name}
                      </Link>
                    </div>
                    <p className="text-xs text-white/40 mt-1">{action.detail}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {action.dueIn && <span className="text-[10px] text-white/30 hidden sm:inline">{action.dueIn}</span>}
                    {action.ctaLabel && (
                      <button className="text-[11px] font-medium text-[#C7BBA3] bg-[#C7BBA3]/10 hover:bg-[#C7BBA3]/20 border border-[#C7BBA3]/20 rounded-lg px-2.5 py-1.5 transition-colors">
                        {action.ctaLabel}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {showEmails && emailsParsed.map((email) => {
              const property = getProperty(email.propertyId)!;
              return (
                <div
                  key={email.id}
                  className="flex items-center gap-3 p-3 sm:p-4 rounded-xl border border-[#4B5436]/10 bg-white/[0.02] hover:bg-[#4B5436]/10 transition-colors"
                >
                  <Mail className="w-4 h-4 text-white/30 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium leading-tight">{email.parsedAs}</p>
                      <Link
                        href={`/dashboard/${property.id}`}
                        className="inline-flex items-center gap-1 text-[10px] text-white/40 hover:text-[#C7BBA3] transition-colors bg-white/[0.04] border border-[#4B5436]/15 rounded-md px-1.5 py-0.5"
                      >
                        <property.icon className="w-3 h-3" />
                        {property.name}
                      </Link>
                      <span className="text-[10px] text-white/30">{email.receivedAt}</span>
                    </div>
                    <p className="text-xs text-white/40 mt-1">{email.from}</p>
                  </div>
                  <button className="text-[11px] font-medium text-[#C7BBA3] bg-[#C7BBA3]/10 hover:bg-[#C7BBA3]/20 border border-[#C7BBA3]/20 rounded-lg px-2.5 py-1.5 transition-colors shrink-0">
                    Confirm
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-sm text-emerald-400/80">All clear — nothing in this lane.</p>
          </div>
        )}

        {/* Past actions — collapsed by default */}
        <div className="pt-2">
          <button
            onClick={() => setPastExpanded(!pastExpanded)}
            className="flex items-center gap-2 text-sm text-white/40 hover:text-white/60 transition-colors w-full"
          >
            {pastExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <span>Past actions</span>
            <span className="text-[10px] text-white/30">{autoHandled.length}</span>
            <div className="flex-1 h-px bg-white/[0.06] ml-2" />
          </button>
          {pastExpanded && (
            <div className="space-y-2 mt-3">
              {autoHandled.map((h) => {
                const property = getProperty(h.propertyId)!;
                return (
                  <div
                    key={h.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-[#4B5436]/10 bg-white/[0.02]"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium leading-tight text-white/70">{h.label}</p>
                        <Link
                          href={`/dashboard/${property.id}`}
                          className="inline-flex items-center gap-1 text-[10px] text-white/40 hover:text-[#C7BBA3] bg-white/[0.04] border border-[#4B5436]/15 rounded-md px-1.5 py-0.5"
                        >
                          <property.icon className="w-3 h-3" />
                          {property.name}
                        </Link>
                      </div>
                      <p className="text-xs text-white/40 mt-0.5">{h.detail}</p>
                    </div>
                    <p className="text-[10px] text-white/30 shrink-0">{h.date}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <p className="text-white/30 text-xs italic pt-2">v0 preview — actions, emails, and savings are demo data.</p>
      </main>
    </div>
  );
}
