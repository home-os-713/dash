"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Zap,
  Droplets,
  Flame,
  Sun,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Home,
  Building2,
  ChevronDown,
  Bell,
  ArrowLeft,
  FileText,
  DollarSign,
  Leaf,
  Calendar,
  CircleAlert,
  CheckCircle2,
  Clock,
  Activity,
  ChevronRight,
  Wrench,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

// ─── Mock Data ───────────────────────────────────────────────────────────────

const properties = [
  {
    id: "phoenix",
    name: "Desert Ridge Villa",
    location: "Phoenix, AZ",
    type: "STR",
    icon: Home,
  },
  {
    id: "pvr",
    name: "Casa del Mar",
    location: "Puerto Vallarta, MX",
    type: "STR",
    icon: Building2,
  },
]

const utilityData: Record<string, { electric: number; water: number; gas: number; solar: number; budget: number; month: string }[]> = {
  phoenix: [
    { month: "Sep", electric: 285, water: 78, gas: 32, solar: 120, budget: 420 },
    { month: "Oct", electric: 240, water: 72, gas: 38, solar: 105, budget: 420 },
    { month: "Nov", electric: 195, water: 65, gas: 55, solar: 80, budget: 420 },
    { month: "Dec", electric: 210, water: 60, gas: 68, solar: 65, budget: 420 },
    { month: "Jan", electric: 225, water: 58, gas: 72, solar: 55, budget: 420 },
    { month: "Feb", electric: 215, water: 62, gas: 65, solar: 70, budget: 420 },
    { month: "Mar", electric: 250, water: 70, gas: 48, solar: 95, budget: 420 },
  ],
  pvr: [
    { month: "Sep", electric: 180, water: 95, gas: 15, solar: 0, budget: 300 },
    { month: "Oct", electric: 165, water: 88, gas: 12, solar: 0, budget: 300 },
    { month: "Nov", electric: 150, water: 82, gas: 10, solar: 0, budget: 300 },
    { month: "Dec", electric: 175, water: 90, gas: 14, solar: 0, budget: 300 },
    { month: "Jan", electric: 160, water: 85, gas: 11, solar: 0, budget: 300 },
    { month: "Feb", electric: 155, water: 80, gas: 10, solar: 0, budget: 300 },
    { month: "Mar", electric: 170, water: 92, gas: 13, solar: 0, budget: 300 },
  ],
}

const complianceData: Record<string, { item: string; status: "green" | "yellow" | "red"; deadline: string; detail: string }[]> = {
  phoenix: [
    { item: "STR Permit", status: "green", detail: "Renewed through Dec 2026", deadline: "Dec 15, 2026" },
    { item: "LLC Annual Report", status: "yellow", detail: "Due in 28 days", deadline: "Apr 4, 2026" },
    { item: "Occupancy Tax Filing", status: "green", detail: "Q1 filed", deadline: "Jun 30, 2026" },
    { item: "Fire Safety Inspection", status: "red", detail: "Overdue — schedule now", deadline: "Feb 28, 2026" },
  ],
  pvr: [
    { item: "RFC Registration", status: "green", detail: "Active", deadline: "Dec 31, 2026" },
    { item: "Tourism License", status: "yellow", detail: "Renewal in 21 days", deadline: "Mar 28, 2026" },
    { item: "ISR/IVA Filing", status: "green", detail: "Q1 not yet due", deadline: "Apr 17, 2026" },
    { item: "SARE Registration", status: "green", detail: "Current", deadline: "Jan 15, 2027" },
  ],
}

const alertsData: Record<string, { id: number; type: "warning" | "info" | "critical"; message: string; time: string }[]> = {
  phoenix: [
    { id: 1, type: "critical", message: "Fire safety inspection overdue — 7 days past deadline", time: "2h ago" },
    { id: 2, type: "warning", message: "Water usage 42% above baseline during guest stay (Mar 2–5)", time: "5h ago" },
    { id: 3, type: "info", message: "Solar generation exceeded grid draw by 18 kWh yesterday", time: "1d ago" },
    { id: 4, type: "warning", message: "LLC annual report due in 28 days", time: "2d ago" },
  ],
  pvr: [
    { id: 1, type: "warning", message: "Tourism license renewal due in 21 days", time: "1h ago" },
    { id: 2, type: "info", message: "Electricity cost down 8% month-over-month", time: "6h ago" },
    { id: 3, type: "warning", message: "Water usage spike detected during vacancy (Mar 1)", time: "1d ago" },
  ],
}

const financialSummary: Record<string, { income: number; expenses: number; noi: number; occupancy: number }> = {
  phoenix: { income: 4850, expenses: 1920, noi: 2930, occupancy: 82 },
  pvr: { income: 3200, expenses: 1150, noi: 2050, occupancy: 74 },
}

const actionItems: Record<string, { priority: "urgent" | "soon" | "review"; label: string; detail: string; category: string }[]> = {
  phoenix: [
    { priority: "urgent", label: "Schedule fire safety inspection", detail: "7 days overdue — risk of fines up to $2,500", category: "Compliance" },
    { priority: "soon", label: "File LLC annual report", detail: "Due Apr 4 — 28 days remaining", category: "Compliance" },
    { priority: "review", label: "Investigate water usage spike", detail: "42% above baseline during guest stay Mar 2–5", category: "Utilities" },
  ],
  pvr: [
    { priority: "soon", label: "Renew tourism license", detail: "Due Mar 28 — 21 days remaining", category: "Compliance" },
    { priority: "review", label: "Check water usage during vacancy", detail: "Spike detected Mar 1 with no guests checked in", category: "Utilities" },
  ],
}

// ─── Health Score ────────────────────────────────────────────────────────────

function computeHealth(
  compliance: { status: "green" | "yellow" | "red" }[],
  totalSpend: number,
  budget: number,
  occupancy: number,
  noi: number,
) {
  // Compliance (50% weight): red = -30pts each, yellow = -12pts each
  const complianceMax = 50
  const compliancePenalty =
    compliance.filter((c) => c.status === "red").length * 30 +
    compliance.filter((c) => c.status === "yellow").length * 12
  const complianceScore = Math.max(0, complianceMax - compliancePenalty)

  // Utilities (25% weight): under budget = full, over = proportional penalty
  const utilityRatio = totalSpend / budget
  const utilityScore = utilityRatio <= 1 ? 25 : Math.max(0, 25 - (utilityRatio - 1) * 50)

  // Financials (25% weight): occupancy + positive NOI
  const occupancyPart = (occupancy / 100) * 15
  const noiPart = noi > 0 ? 10 : 0
  const financialScore = occupancyPart + noiPart

  const total = Math.round(complianceScore + utilityScore + financialScore)

  const complianceStatus: "green" | "yellow" | "red" =
    compliance.some((c) => c.status === "red") ? "red" :
    compliance.some((c) => c.status === "yellow") ? "yellow" : "green"

  const utilityStatus: "green" | "yellow" | "red" =
    utilityRatio > 1.15 ? "red" : utilityRatio > 0.95 ? "yellow" : "green"

  const financialStatus: "green" | "yellow" | "red" =
    noi <= 0 ? "red" : occupancy < 60 ? "yellow" : "green"

  return {
    score: total,
    overall: total >= 80 ? "green" as const : total >= 60 ? "yellow" as const : "red" as const,
    label: total >= 80 ? "Good Standing" : total >= 60 ? "Fair" : "Needs Attention",
    domains: { compliance: complianceStatus, utilities: utilityStatus, financials: financialStatus },
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: "green" | "yellow" | "red" }) {
  const colors = {
    green: "bg-emerald-400 shadow-emerald-400/50",
    yellow: "bg-amber-400 shadow-amber-400/50",
    red: "bg-red-400 shadow-red-400/50 animate-pulse",
  }
  return <span className={`inline-block w-2.5 h-2.5 rounded-full shadow-lg ${colors[status]}`} />
}

function AlertIcon({ type }: { type: "warning" | "info" | "critical" }) {
  if (type === "critical") return <CircleAlert className="w-4 h-4 text-red-400 shrink-0" />
  if (type === "warning") return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
  return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
}

function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount)
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function HomeOSDashboard() {
  const [selectedProperty, setSelectedProperty] = useState("phoenix")
  const [propertyMenuOpen, setPropertyMenuOpen] = useState(false)

  const property = properties.find((p) => p.id === selectedProperty)!
  const utilities = utilityData[selectedProperty]
  const compliance = complianceData[selectedProperty]
  const alerts = alertsData[selectedProperty]
  const financials = financialSummary[selectedProperty]
  const currentMonth = utilities[utilities.length - 1]
  const prevMonth = utilities[utilities.length - 2]
  const totalSpend = currentMonth.electric + currentMonth.water + currentMonth.gas
  const prevTotalSpend = prevMonth.electric + prevMonth.water + prevMonth.gas
  const spendDelta = ((totalSpend - prevTotalSpend) / prevTotalSpend) * 100
  const solarOffset = currentMonth.solar > 0 ? Math.round((currentMonth.solar / currentMonth.electric) * 100) : 0

  const complianceCount = {
    green: compliance.filter((c) => c.status === "green").length,
    yellow: compliance.filter((c) => c.status === "yellow").length,
    red: compliance.filter((c) => c.status === "red").length,
  }

  const currency = selectedProperty === "pvr" ? "MXN" : "USD"
  const actions = actionItems[selectedProperty]
  const health = computeHealth(compliance, totalSpend, currentMonth.budget, financials.occupancy, financials.noi)

  const healthColors = {
    green: { border: "border-l-emerald-400", bg: "bg-emerald-400/10", text: "text-emerald-400", dot: "bg-emerald-400" },
    yellow: { border: "border-l-amber-400", bg: "bg-amber-400/10", text: "text-amber-400", dot: "bg-amber-400" },
    red: { border: "border-l-red-400", bg: "bg-red-400/10", text: "text-red-400", dot: "bg-red-400 animate-pulse" },
  }
  const hc = healthColors[health.overall]

  return (
    <div className="min-h-screen bg-[#2B2B2B] text-white">
      {/* Header */}
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
                <Home className="w-4 h-4 text-white" />
              </div>
              <span className="font-serif text-lg font-bold tracking-tight">HomeOS</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Property Selector */}
            <div className="relative">
              <button
                onClick={() => setPropertyMenuOpen(!propertyMenuOpen)}
                className="flex items-center gap-2 bg-[#4B5436]/20 hover:bg-[#C7BBA3]/15 border border-[#C7BBA3]/15 rounded-xl px-3 py-2 text-sm transition-all"
              >
                <property.icon className="w-4 h-4 text-[#C7BBA3]" />
                <span className="hidden sm:inline font-medium">{property.name}</span>
                <span className="sm:hidden font-medium">{property.location.split(",")[0]}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-white/40 transition-transform ${propertyMenuOpen ? "rotate-180" : ""}`} />
              </button>
              {propertyMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-[#353530] border border-[#4B5436]/20 rounded-xl shadow-2xl overflow-hidden z-50">
                  {properties.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedProperty(p.id)
                        setPropertyMenuOpen(false)
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-[#4B5436]/20 transition-colors ${
                        p.id === selectedProperty ? "bg-[#4B5436]/20" : ""
                      }`}
                    >
                      <p.icon className="w-4 h-4 text-[#C7BBA3]" />
                      <div className="text-left">
                        <div className="font-medium">{p.name}</div>
                        <div className="text-white/40 text-xs">{p.location} &middot; {p.type}</div>
                      </div>
                      {p.id === selectedProperty && (
                        <CheckCircle2 className="w-4 h-4 text-[#4B5436] ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Alerts Bell */}
            <button className="relative p-2 rounded-xl hover:bg-[#4B5436]/20 transition-colors">
              <Bell className="w-5 h-5 text-white/60" />
              {alerts.some((a) => a.type === "critical") && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-400 rounded-full" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* ── Property Health Banner ─────────────────────────────────── */}
        <div className={`bg-[#353530] rounded-2xl border border-[#4B5436]/15 ${hc.border} border-l-4 p-4 sm:p-6`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Left: Property name + health status */}
            <div className="flex items-start sm:items-center gap-4">
              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${hc.bg} flex items-center justify-center shrink-0`}>
                <span className={`text-xl sm:text-2xl font-bold ${hc.text}`}>{health.score}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-serif font-bold text-white">{property.name}</h1>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${hc.text}`}>
                    <span className={`w-2 h-2 rounded-full ${hc.dot}`} />
                    {health.label}
                  </span>
                  <span className="text-white/20">|</span>
                  <span className="text-white/40 text-xs">{property.location} &middot; STR</span>
                </div>
              </div>
            </div>

            {/* Right: Domain pills */}
            <div className="flex items-center gap-2 sm:gap-3">
              {([
                { label: "Compliance", status: health.domains.compliance },
                { label: "Utilities", status: health.domains.utilities },
                { label: "Finances", status: health.domains.financials },
              ] as const).map((d) => (
                <div
                  key={d.label}
                  className="flex items-center gap-1.5 bg-white/[0.04] rounded-lg px-2.5 py-1.5 border border-[#4B5436]/10"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${healthColors[d.status].dot}`} />
                  <span className="text-xs text-white/60">{d.label}</span>
                </div>
              ))}
              <span className="text-white/20 text-xs hidden sm:inline ml-1">Synced 12m ago</span>
            </div>
          </div>
        </div>

        {/* ── Action Items ─────────────────────────────────────────────── */}
        {actions.length > 0 ? (
          <Card className="bg-[#353530] border-[#4B5436]/15 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                Action Items
                <Badge className="bg-[#C7BBA3]/15 text-[#C7BBA3] border-0 text-xs px-2 ml-auto">{actions.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {actions.map((action, i) => {
                const priorityStyles = {
                  urgent: { badge: "bg-red-500/20 text-red-400", border: "border-red-500/10 bg-red-500/5" },
                  soon: { badge: "bg-amber-500/20 text-amber-400", border: "border-amber-500/10 bg-amber-500/5" },
                  review: { badge: "bg-blue-500/20 text-blue-400", border: "border-[#4B5436]/10 bg-white/[0.02]" },
                }
                const ps = priorityStyles[action.priority]
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 p-3 rounded-xl border ${ps.border} hover:bg-[#4B5436]/10 transition-colors cursor-pointer group`}
                  >
                    <Badge className={`${ps.badge} border-0 text-[10px] px-2 py-0.5 uppercase tracking-wide shrink-0`}>
                      {action.priority}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white leading-tight">{action.label}</p>
                      <p className="text-xs text-white/40 mt-0.5">{action.detail}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-white/25 hidden sm:inline">{action.category}</span>
                      <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-[#C7BBA3] transition-colors" />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        ) : (
          <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-sm text-emerald-400/80">All clear — no actions required for this property.</p>
          </div>
        )}

        {/* ── Summary Cards ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Electric */}
          <Card className="bg-[#353530] border-[#4B5436]/15 text-white hover:border-[#C7BBA3]/15 transition-colors">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <Badge variant="outline" className="text-xs border-[#C7BBA3]/15 text-white/50 font-normal">
                  {currentMonth.electric > prevMonth.electric ? (
                    <TrendingUp className="w-3 h-3 mr-1 text-red-400" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-1 text-emerald-400" />
                  )}
                  {Math.abs(Math.round(((currentMonth.electric - prevMonth.electric) / prevMonth.electric) * 100))}%
                </Badge>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-[#C7BBA3]">${currentMonth.electric}</p>
              <p className="text-white/40 text-xs mt-1">Electricity</p>
            </CardContent>
          </Card>

          {/* Water */}
          <Card className="bg-[#353530] border-[#4B5436]/15 text-white hover:border-[#C7BBA3]/15 transition-colors">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Droplets className="w-4 h-4 text-blue-400" />
                </div>
                <Badge variant="outline" className="text-xs border-[#C7BBA3]/15 text-white/50 font-normal">
                  {currentMonth.water > prevMonth.water ? (
                    <TrendingUp className="w-3 h-3 mr-1 text-red-400" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-1 text-emerald-400" />
                  )}
                  {Math.abs(Math.round(((currentMonth.water - prevMonth.water) / prevMonth.water) * 100))}%
                </Badge>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-[#C7BBA3]">${currentMonth.water}</p>
              <p className="text-white/40 text-xs mt-1">Water</p>
            </CardContent>
          </Card>

          {/* Gas */}
          <Card className="bg-[#353530] border-[#4B5436]/15 text-white hover:border-[#C7BBA3]/15 transition-colors">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Flame className="w-4 h-4 text-orange-400" />
                </div>
                <Badge variant="outline" className="text-xs border-[#C7BBA3]/15 text-white/50 font-normal">
                  {currentMonth.gas > prevMonth.gas ? (
                    <TrendingUp className="w-3 h-3 mr-1 text-red-400" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-1 text-emerald-400" />
                  )}
                  {Math.abs(Math.round(((currentMonth.gas - prevMonth.gas) / prevMonth.gas) * 100))}%
                </Badge>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-[#C7BBA3]">${currentMonth.gas}</p>
              <p className="text-white/40 text-xs mt-1">Gas</p>
            </CardContent>
          </Card>

          {/* Total / Solar */}
          <Card className="bg-[#353530] border-[#4B5436]/15 text-white hover:border-[#C7BBA3]/15 transition-colors">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  {solarOffset > 0 ? (
                    <Sun className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
                <Badge variant="outline" className="text-xs border-[#C7BBA3]/15 text-white/50 font-normal">
                  {spendDelta > 0 ? (
                    <TrendingUp className="w-3 h-3 mr-1 text-red-400" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-1 text-emerald-400" />
                  )}
                  {Math.abs(Math.round(spendDelta))}%
                </Badge>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-[#C7BBA3]">${totalSpend}</p>
              <p className="text-white/40 text-xs mt-1">
                {solarOffset > 0 ? `Total · ${solarOffset}% solar offset` : "Total Utilities"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ── Charts + Compliance Row ──────────────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Utility Trend Chart */}
          <Card className="lg:col-span-2 bg-[#353530] border-[#4B5436]/15 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Monthly Utility Spend
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-[280px] sm:h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={utilities} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="electricGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gasGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#353530",
                        border: "1px solid rgba(75,84,54,0.3)",
                        borderRadius: "12px",
                        color: "#C7BBA3",
                        fontSize: "13px",
                      }}
                      formatter={(value: number, name: string) => [`$${value}`, name.charAt(0).toUpperCase() + name.slice(1)]}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}
                      formatter={(value: string) => <span style={{ color: "rgba(255,255,255,0.5)" }}>{value.charAt(0).toUpperCase() + value.slice(1)}</span>}
                    />
                    <Area type="monotone" dataKey="electric" stroke="#f59e0b" fill="url(#electricGrad)" strokeWidth={2} dot={false} />
                    <Area type="monotone" dataKey="water" stroke="#3b82f6" fill="url(#waterGrad)" strokeWidth={2} dot={false} />
                    <Area type="monotone" dataKey="gas" stroke="#f97316" fill="url(#gasGrad)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Compliance Status */}
          <Card className="bg-[#353530] border-[#4B5436]/15 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/70 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Compliance
                </span>
                <div className="flex items-center gap-2">
                  {complianceCount.red > 0 && (
                    <Badge className="bg-red-500/20 text-red-400 border-0 text-xs px-2">{complianceCount.red} overdue</Badge>
                  )}
                  {complianceCount.yellow > 0 && (
                    <Badge className="bg-amber-500/20 text-amber-400 border-0 text-xs px-2">{complianceCount.yellow} soon</Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {compliance.map((item) => (
                <div
                  key={item.item}
                  className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
                    item.status === "red"
                      ? "bg-red-500/5 border border-red-500/10"
                      : item.status === "yellow"
                        ? "bg-amber-500/5 border border-amber-500/10"
                        : "bg-white/[0.02] border border-[#4B5436]/10"
                  }`}
                >
                  <StatusDot status={item.status} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-tight text-white">{item.item}</p>
                    <p className="text-xs text-white/40 mt-0.5">{item.detail}</p>
                  </div>
                  <div className="flex items-center gap-1 text-white/30 shrink-0">
                    <Calendar className="w-3 h-3" />
                    <span className="text-xs">{item.deadline.split(",")[0]}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* ── Financial Summary + Alerts Row ───────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Financial Quick View */}
          <Card className="bg-[#353530] border-[#4B5436]/15 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Financial Summary
                <Badge variant="outline" className="text-[10px] border-[#C7BBA3]/15 text-white/30 ml-auto font-normal">
                  MTD
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/50">Rental Income</span>
                  <span className="text-sm font-semibold text-emerald-400">
                    {formatCurrency(financials.income, currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/50">Expenses</span>
                  <span className="text-sm font-semibold text-red-400">
                    {formatCurrency(financials.expenses, currency)}
                  </span>
                </div>
                <div className="h-px bg-[#4B5436]/20" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/70 font-medium">NOI</span>
                  <span className="text-lg font-bold text-[#C7BBA3]">
                    {formatCurrency(financials.noi, currency)}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-white/40">Occupancy Rate</span>
                  <span className="text-xs font-medium text-white/70">{financials.occupancy}%</span>
                </div>
                <div className="w-full h-2 bg-[#4B5436]/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#4B5436] to-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${financials.occupancy}%` }}
                  />
                </div>
              </div>

              {solarOffset > 0 && (
                <div className="pt-2 border-t border-white/5 flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-white/40">
                    Solar offset: <span className="text-emerald-400 font-medium">{solarOffset}%</span> of electric cost
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Alerts */}
          <Card className="lg:col-span-2 bg-[#353530] border-[#4B5436]/15 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Recent Alerts
                {alerts.some((a) => a.type === "critical") && (
                  <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-start gap-3 p-3 rounded-xl transition-colors hover:bg-[#4B5436]/10 ${
                    alert.type === "critical"
                      ? "bg-red-500/5 border border-red-500/10"
                      : "bg-white/[0.02] border border-[#4B5436]/10"
                  }`}
                >
                  <AlertIcon type={alert.type} />
                  <p className="text-sm text-white/70 flex-1 leading-relaxed">{alert.message}</p>
                  <div className="flex items-center gap-1 text-white/25 shrink-0">
                    <Clock className="w-3 h-3" />
                    <span className="text-xs">{alert.time}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-[#4B5436]/20 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white/30 text-xs">
            <div className="w-5 h-5 rounded bg-[#4B5436] flex items-center justify-center">
              <Home className="w-3 h-3 text-white" />
            </div>
            <span>HomeOS — The Mind for Your Home</span>
          </div>
          <p className="text-white/20 text-xs">Prototype &middot; Mock data for demonstration</p>
        </div>
      </footer>
    </div>
  )
}
