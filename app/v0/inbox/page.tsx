"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  Inbox,
  CheckCircle2,
  Mail,
  Bot,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const filtered = actionItems.filter((a) => {
    if (filter === "all") return true;
    if (filter === "bookings") return a.kind === "booking";
    return a.priority === filter;
  });

  const counts = {
    all: actionItems.length,
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
            <Link href="/v0" className="flex items-center gap-2 text-white/50 hover:text-white text-sm">
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

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <div className="flex items-center gap-2 text-[10px] text-white/30 uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60" />
          Simulated demo data
        </div>
        {/* Hero — single, clear sentence */}
        <div className="bg-[#353530] rounded-2xl border border-[#4B5436]/15 p-5 sm:p-6">
          <p className="text-white/40 text-xs uppercase tracking-wider mb-2">This week</p>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold leading-tight">
            {counts.urgent + counts.soon === 0 ? (
              <span className="text-emerald-400">All clear — nothing pressing.</span>
            ) : (
              <>
                <span className="text-white">{counts.urgent + counts.soon} things need you</span>
                <span className="text-white/40"> · </span>
                {counts.urgent > 0 && <span className="text-red-400">{counts.urgent} urgent</span>}
                {counts.urgent > 0 && counts.soon > 0 && <span className="text-white/30">, </span>}
                {counts.soon > 0 && <span className="text-amber-400">{counts.soon} due soon</span>}
              </>
            )}
          </h1>
        </div>

        {/* Handled by HomeOS */}
        <Card className="bg-[#353530] border-[#4B5436]/15 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
              <Bot className="w-4 h-4" />
              Already handled
              <Badge className="bg-white/[0.04] text-white/50 border-0 text-xs px-2 ml-auto">
                {autoHandled.length}
              </Badge>
            </CardTitle>
            <p className="text-[11px] text-white/40">Bills paid on autopay and admin tasks completed — nothing for you to do here.</p>
          </CardHeader>
          <CardContent className="space-y-2">
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
                      <p className="text-sm font-medium leading-tight">{h.label}</p>
                      <Link
                        href={`/v0/${property.id}`}
                        className="inline-flex items-center gap-1 text-[10px] text-white/40 hover:text-[#C7BBA3] bg-white/[0.04] border border-[#4B5436]/15 rounded-md px-1.5 py-0.5"
                      >
                        <property.icon className="w-3 h-3" />
                        {property.name}
                      </Link>
                      <Badge className="bg-white/[0.04] text-white/50 border-0 text-[10px] px-1.5 py-0 h-4">
                        {h.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-white/40 mt-0.5">{h.detail}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-white/30">{h.date}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

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

        {/* Action items list */}
        {filtered.length > 0 ? (
          <div className="space-y-2">
            {filtered.map((action) => {
              const ps = priorityClasses(action.priority);
              const property = getProperty(action.propertyId)!;
              return (
                <div
                  key={action.id}
                  className={`flex items-center gap-3 p-4 rounded-xl border ${ps.border} hover:bg-[#4B5436]/10 transition-colors group`}
                >
                  <Badge className={`${ps.badge} border-0 text-[10px] px-2 py-0.5 uppercase tracking-wide shrink-0`}>
                    {action.priority}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium leading-tight">{action.label}</p>
                      <Link
                        href={`/v0/${property.id}`}
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
                    <button
                      title="Snooze"
                      className="text-[10px] text-white/40 hover:text-white px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors hidden sm:block"
                    >
                      Snooze
                    </button>
                  </div>
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

        {/* From your inbox (parsed emails) */}
        <Card className="bg-[#353530] border-[#4B5436]/15 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              From your inbox
              <Badge className="bg-[#C7BBA3]/15 text-[#C7BBA3] border-0 text-xs px-2 ml-auto">
                {emailsParsed.length}
              </Badge>
            </CardTitle>
            <p className="text-[11px] text-white/40">AI extracted these from emails — confirm to file as bills or actions.</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {emailsParsed.map((email) => {
              const property = getProperty(email.propertyId)!;
              const confidenceColor =
                email.confidence === "high" ? "text-emerald-400" : email.confidence === "medium" ? "text-amber-400" : "text-white/40";
              return (
                <div
                  key={email.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-[#4B5436]/10 bg-white/[0.02] hover:bg-[#4B5436]/10 transition-colors"
                >
                  <Mail className="w-4 h-4 text-white/30 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-tight">{email.parsedAs}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[10px] text-white/40">{email.from}</span>
                      <span className="text-white/15 text-[10px]">·</span>
                      <Link
                        href={`/v0/${property.id}`}
                        className="inline-flex items-center gap-1 text-[10px] text-white/40 hover:text-[#C7BBA3]"
                      >
                        <property.icon className="w-3 h-3" />
                        {property.name}
                      </Link>
                      <span className="text-white/15 text-[10px]">·</span>
                      <span className={`text-[10px] ${confidenceColor}`}>{email.confidence} confidence</span>
                      <span className="text-white/15 text-[10px]">·</span>
                      <span className="text-[10px] text-white/30">{email.receivedAt}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button className="text-[11px] font-medium text-[#C7BBA3] bg-[#C7BBA3]/10 hover:bg-[#C7BBA3]/20 border border-[#C7BBA3]/20 rounded-lg px-2.5 py-1.5 transition-colors">
                      Confirm
                    </button>
                    <button className="text-[10px] text-white/40 hover:text-white px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors hidden sm:block">
                      Ignore
                    </button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <p className="text-white/30 text-xs italic pt-4">v0 preview — actions, emails, and savings are demo data.</p>
      </main>
    </div>
  );
}
