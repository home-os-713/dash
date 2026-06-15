"use client";

import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  ChevronRight,
  Home as HomeIcon,
  Bell,
  Inbox,
  Zap,
  Receipt,
  Plus,
  X,
  Loader2,
  GripVertical,
  Sparkles,
  TrendingUp,
  Wallet,
  Building2,
  Percent,
} from "lucide-react";
import { useRentcastLookup } from "@/lib/useRentcastLookup";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createClient } from "@/lib/supabase/client";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import {
  type DbPropertyWithBills,
  type DbBill,
  listUserProperties,
  insertProperty,
  updatePropertySortOrders,
  computePropertyHealth,
  computeNOI,
} from "@/lib/v0/db";
import {
  computePortfolioMetrics,
  fmtMoney,
  fmtPct,
} from "@/lib/v0/analytics";
import {
  properties as mockProperties,
  billsByProperty as mockBillsByProperty,
  actionItemsByProperty as mockActionItemsByProperty,
  financialSummaryByProperty,
  getPropertyHealth,
  statusClasses,
  fmtCurrency,
  actionItems,
} from "@/lib/v0/mockData";
import { Badge } from "@/components/ui/badge";

// ── Add Property form state ──────────────────────────────────────────────────

type PropertyForm = {
  name: string;
  address: string;
  location: string;
  type: "STR" | "Primary";
  propVal: string;
  income: string;
  mortBal: string;
  mortOrig: string;
  mortPay: string;
  mortRate: string;
};

const emptyForm: PropertyForm = {
  name: "",
  address: "",
  location: "",
  type: "STR",
  propVal: "",
  income: "",
  mortBal: "",
  mortOrig: "",
  mortPay: "",
  mortRate: "",
};

// Build DB-shaped properties out of the mock set so the demo (no real data)
// drives the SAME portfolio metrics engine the analytics page uses. Mirrors the
// analytics page's fallback so the overview numbers agree in demo mode too.
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

// ── Sortable property card ───────────────────────────────────────────────────

function SortablePropertyCard({ p }: { p: DbPropertyWithBills }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: p.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const bills = p.bills ?? [];
  const health = computePropertyHealth(bills);
  const noi = computeNOI(p, bills);
  const propAutopay = bills.filter((b) => b.autopay).length;
  const overdueBills = bills.filter((b) => b.status === "red").length;
  const propAttention = bills.filter((b) => b.status !== "green").length;
  const sc = statusClasses(health.overall);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group h-full ${isDragging ? "opacity-60 z-50" : ""}`}
    >
      {/* Drag handle — top-left corner, revealed on hover */}
      <div
        {...listeners}
        {...attributes}
        className="absolute top-2.5 left-3 p-1.5 cursor-grab active:cursor-grabbing touch-none z-10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg hover:bg-tint/[0.04]"
        style={{ WebkitTapHighlightColor: "transparent" }}
        onClick={(e) => e.preventDefault()}
      >
        <GripVertical className="w-3.5 h-3.5 text-muted" />
      </div>

      <Link
        href={`/dashboard/${p.id}`}
        className={`block h-full bg-surface rounded-2xl border border-line shadow-soft hover:border-accentfg/25 transition-all border-l-4 ${
          health.overall === "green"
            ? "border-l-emerald-400"
            : health.overall === "yellow"
              ? "border-l-amber-400"
              : "border-l-red-400"
        } ${isDragging ? "pointer-events-none" : ""}`}
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className={`w-12 h-12 rounded-2xl ${sc.bg} flex items-center justify-center shrink-0`}>
                <HomeIcon className={`w-5 h-5 ${sc.text}`} />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-serif font-bold truncate">
                  {p.name ?? "Untitled property"}
                </h2>
                <p className="text-muted text-xs mt-0.5">
                  {p.location ?? p.address ?? "—"} · {p.type ?? "Property"}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-faint group-hover:text-accentfg transition-colors shrink-0" />
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-line">
            <div>
              <p className="text-muted text-[11px] mb-1 flex items-center gap-1">
                <Receipt className="w-3 h-3" />
                Bills
              </p>
              <p className="text-sm font-semibold">
                {bills.length > 0 ? bills.length : "—"}
              </p>
            </div>
            <div>
              <p className="text-muted text-[11px] mb-1 flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Autopay
              </p>
              <p className="text-sm font-semibold text-emerald-600">
                {propAutopay}
                <span className="text-faint font-normal">/{bills.length}</span>
              </p>
            </div>
            <div>
              <p className="text-muted text-[11px] mb-1">Net this mo.</p>
              <p className="text-sm font-semibold text-ink">
                {noi !== 0 ? fmtCurrency(noi) : "—"}
              </p>
            </div>
          </div>

          {bills.length === 0 && (
            <div className="mt-4 flex items-center gap-2 rounded-xl px-3 py-2 border border-subtle bg-tint/[0.015]">
              <p className="text-xs text-faint">No bills added yet</p>
            </div>
          )}

          {bills.length > 0 && (overdueBills > 0 || propAttention > 0) && (
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
              <p className={`text-xs ${overdueBills > 0 ? "text-red-500" : "text-amber-600"}`}>
                {overdueBills > 0
                  ? `${overdueBills} overdue · ${propAttention - overdueBills} due soon`
                  : `${propAttention} due soon`}
              </p>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}

// ── Portfolio overview (investor-first headline) ─────────────────────────────
//
// Scannable stat tiles — total value, equity, net monthly cash flow, blended
// return, plus property/unit count and occupancy when available. Numbers come
// from computePortfolioMetrics (lib/v0/analytics.ts) so they match the analytics
// page exactly. The whole card links to /dashboard/analytics. Bills/autopay are
// demoted to a small secondary strip — supported, not the headline.

function PortfolioOverview({
  portfolio,
  propertyCount,
  bills,
}: {
  portfolio: ReturnType<typeof computePortfolioMetrics>;
  propertyCount: number;
  bills: { total: number; autopay: number; needsYou: number; due: number };
}) {
  const m = portfolio;
  const tiles: {
    label: string;
    value: string;
    icon: typeof Wallet;
    tone?: "pos" | "neg" | "accent";
  }[] = [
    { label: "Portfolio value", value: fmtMoney(m.totalValue), icon: Building2 },
    { label: "Total equity", value: fmtMoney(m.totalEquity), icon: Wallet, tone: "accent" },
    {
      label: "Net cash flow/mo",
      value: fmtMoney(m.monthlyCashFlow),
      icon: TrendingUp,
      tone: m.monthlyCashFlow >= 0 ? "pos" : "neg",
    },
    { label: "Blended return", value: fmtPct(m.blendedCashOnCash), icon: Percent },
  ];

  return (
    <div className="bg-surface border border-line rounded-2xl shadow-soft overflow-hidden">
      {/* Header → links to full analytics */}
      <Link
        href="/dashboard/analytics"
        className="group flex items-center justify-between gap-3 px-6 pt-5 pb-3 hover:bg-tint/[0.015] transition-colors"
      >
        <div className="flex items-baseline gap-2 flex-wrap">
          <h1 className="text-lg sm:text-xl font-serif font-bold">Portfolio overview</h1>
          <span className="text-muted text-xs">
            {propertyCount} {propertyCount === 1 ? "property" : "properties"}
            {m.unitCount > propertyCount && ` · ${m.unitCount} units`}
            {m.avgOccupancy != null && ` · ${Math.round(m.avgOccupancy)}% occupancy`}
          </span>
        </div>
        <span className="flex items-center gap-1 text-xs text-accentfg shrink-0">
          <TrendingUp className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Analytics</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </Link>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-line">
        {tiles.map((t) => (
          <Link
            key={t.label}
            href="/dashboard/analytics"
            className="group bg-surface px-6 py-4 hover:bg-tint/[0.02] transition-colors"
          >
            <div className="flex items-center gap-1.5 text-muted text-[11px] uppercase tracking-wider mb-1.5">
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </div>
            <p
              className={`text-xl sm:text-2xl font-bold tnum ${
                t.tone === "accent"
                  ? "text-accentfg"
                  : t.tone === "pos"
                    ? "text-emerald-600"
                    : t.tone === "neg"
                      ? "text-red-500"
                      : "text-ink"
              }`}
            >
              {t.value}
            </p>
          </Link>
        ))}
      </div>

      {/* Demoted bills/autopay strip — supported, secondary */}
      <div className="flex items-center gap-x-5 gap-y-1.5 flex-wrap px-6 py-3 border-t border-line bg-tint/[0.01]">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted">
          <Receipt className="w-3.5 h-3.5 text-faint" />
          <span className="font-medium text-ink2 tnum">{bills.total}</span> bills
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted">
          <Zap className="w-3.5 h-3.5 text-faint" />
          <span className="font-medium text-emerald-600 tnum">{bills.autopay}</span> on autopay
        </span>
        {bills.due > 0 && (
          <span className="text-xs text-muted">
            <span className="font-medium text-ink2 tnum">{fmtCurrency(bills.due)}</span> due this month
          </span>
        )}
        {bills.needsYou > 0 ? (
          <Link
            href="/dashboard/inbox"
            className="inline-flex items-center gap-1.5 text-xs text-amber-600 hover:text-ink ml-auto transition-colors"
          >
            <span className="font-medium tnum">{bills.needsYou}</span> need attention
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 ml-auto">
            All bills handled
          </span>
        )}
      </div>
    </div>
  );
}

// ── Portfolio page ───────────────────────────────────────────────────────────

export default function PortfolioPage() {
  const router = useRouter();
  const supabase = createClient();

  const [signingOut, setSigningOut] = useState(false);
  const [dbProperties, setDbProperties] = useState<DbPropertyWithBills[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState<PropertyForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Fields the user has manually typed into — auto-fill must never clobber these.
  const dirtyFields = useRef<Set<keyof PropertyForm>>(new Set());
  // Tracks which fields the latest Rentcast lookup auto-filled (for the UI hint).
  const [autofilled, setAutofilled] = useState<Set<keyof PropertyForm>>(new Set());

  // Coordinates captured when the user picks an autocomplete suggestion — saved
  // on the property so the detail-page map skips a per-view Geocoding call.
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>(
    { lat: null, lng: null }
  );

  // The Rentcast lookup fires only on a *committed* address (picked from the
  // autocomplete dropdown, set in onSelect) — not on every keystroke. A partial
  // address is a distinct, uncached key that would burn 3 API calls for nothing.
  const [lookupAddr, setLookupAddr] = useState("");
  const lookup = useRentcastLookup(lookupAddr, showAddModal);

  // dnd-kit sensors: require 8px movement before starting drag (prevents accidental drags on tap)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  useEffect(() => {
    listUserProperties(supabase)
      .then(setDbProperties)
      .catch(() => {})
      .finally(() => setLoadingData(false));
  }, []);

  const useReal = dbProperties.length > 0;

  // ── Stats from real or mock data ─────────────────────────────────────────

  const allBills: DbBill[] = useReal
    ? dbProperties.flatMap((p) => p.bills ?? [])
    : mockProperties.flatMap((p) =>
        (mockBillsByProperty[p.id] ?? []).map((b) => ({
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
        }))
      );

  const totalBills = allBills.length;
  const onAutopay = allBills.filter((b) => b.autopay).length;
  const totalDue = allBills.reduce((s, b) => s + (b.amount ?? 0), 0);

  const totalUrgent = useReal
    ? allBills.filter((b) => b.status === "red").length
    : actionItems.filter((a) => a.priority === "urgent").length;
  const totalSoon = useReal
    ? allBills.filter((b) => b.status === "yellow").length
    : actionItems.filter((a) => a.priority === "soon").length;

  // ── Portfolio overview metrics (single source of truth — matches /analytics)
  // Computed from real properties, or DB-shaped mock props in demo mode.
  const metricsProps = useReal ? dbProperties : mockAsDbProperties();
  const portfolio = computePortfolioMetrics(metricsProps);

  // ── Drag-and-drop handler ────────────────────────────────────────────────

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setDbProperties((prev) => {
      const oldIndex = prev.findIndex((p) => p.id === active.id);
      const newIndex = prev.findIndex((p) => p.id === over.id);
      const reordered = arrayMove(prev, oldIndex, newIndex);

      // Persist new sort_order values to Supabase (fire-and-forget)
      const updates = reordered.map((p, i) => ({ id: p.id, sort_order: i }));
      updatePropertySortOrders(supabase, updates).catch(() => {});

      return reordered;
    });
  }

  // ── Handlers ────────────────────────────────────────────────────────────

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/login");
  }

  function setField(key: keyof PropertyForm, value: string) {
    // Address is the lookup key, not an auto-filled output — typing it
    // shouldn't mark it dirty. Any other field the user edits is "owned" by
    // them and protected from future auto-fills.
    if (key !== "address") dirtyFields.current.add(key);
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Apply a fresh Rentcast result: fill prop value, rent (monthly income) and
  // location — but only fields the user hasn't manually edited. Never blocks.
  useEffect(() => {
    const data = lookup.data;
    if (!data) return;

    const filled = new Set<keyof PropertyForm>();
    setForm((f) => {
      const next = { ...f };
      if (!dirtyFields.current.has("propVal") && data.estimatedValue != null) {
        next.propVal = String(Math.round(data.estimatedValue));
        filled.add("propVal");
      }
      if (!dirtyFields.current.has("income") && data.rentEstimate != null) {
        next.income = String(Math.round(data.rentEstimate));
        filled.add("income");
      }
      if (
        !dirtyFields.current.has("location") &&
        data.city &&
        data.state
      ) {
        next.location = `${data.city}, ${data.state}`;
        filled.add("location");
      }
      return next;
    });
    setAutofilled(filled);
  }, [lookup.data]);

  // Default the property name to the address as it gets filled in (whether picked
  // from autocomplete or typed) — but only until the user types their own name,
  // at which point `name` is marked dirty and we leave it alone.
  useEffect(() => {
    if (dirtyFields.current.has("name")) return;
    setForm((f) => (f.name === f.address ? f : { ...f, name: f.address }));
  }, [form.address]);

  async function handleSaveProperty() {
    if (!form.name.trim() || !form.address.trim()) {
      setSaveError("Name and address are required.");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      const created = await insertProperty(supabase, {
        name: form.name.trim(),
        address: form.address.trim(),
        location: form.location.trim() || null,
        type: form.type,
        prop_val: form.propVal ? Number(form.propVal) : null,
        mort_pay: form.mortPay ? Number(form.mortPay) : null,
        mort_bal: form.mortBal ? Number(form.mortBal) : null,
        mort_orig: form.mortOrig ? Number(form.mortOrig) : null,
        mort_rate: form.mortRate ? Number(form.mortRate) : null,
        income: form.income ? Number(form.income) : null,
        occupancy: null,
        rent: form.income ? Number(form.income) : null,
        rent_bills: null,
        sort_order: dbProperties.length, // append at end
        lat: coords.lat,
        lng: coords.lng,
      });
      setDbProperties((prev) => [...prev, { ...created, bills: [] }]);
      setForm(emptyForm);
      dirtyFields.current = new Set();
      setAutofilled(new Set());
      setCoords({ lat: null, lng: null });
      setLookupAddr("");
      setShowAddModal(false);
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-line2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
              <HomeIcon className="w-4 h-4 text-white" />
            </div>
            <span className="font-serif text-lg font-bold tracking-tight">HomeOS</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/analytics"
              className="flex items-center gap-2 text-muted hover:text-ink text-sm bg-tint/[0.025] border border-line rounded-xl px-3 py-2 transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </Link>
            <Link
              href="/dashboard/assistant"
              className="flex items-center gap-2 text-accentfg hover:text-ink text-sm bg-accentfg/[0.08] border border-accentfg/20 rounded-xl px-3 py-2 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Assistant</span>
            </Link>
            <Link
              href="/dashboard/inbox"
              className="flex items-center gap-2 text-muted hover:text-ink text-sm bg-tint/[0.025] border border-line rounded-xl px-3 py-2 transition-colors"
            >
              <Inbox className="w-4 h-4" />
              <span className="hidden sm:inline">Inbox</span>
              {totalUrgent + totalSoon > 0 && (
                <Badge className="bg-accentfg/[0.08] text-accentfg border-0 text-[10px] px-1.5 h-4">
                  {totalUrgent + totalSoon}
                </Badge>
              )}
            </Link>
            <ThemeToggle />
            <button className="relative p-2 rounded-xl hover:bg-accentfg/[0.08] transition-colors">
              <Bell className="w-5 h-5 text-muted" />
              {totalUrgent > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-400 rounded-full" />
              )}
            </button>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="text-xs text-muted hover:text-ink transition-colors px-3 py-1.5 rounded-lg border border-accentfg/15"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 animate-rise stagger">
        {/* Demo data banner (only when showing mock) */}
        {!loadingData && !useReal && (
          <div className="flex items-center gap-2 text-[10px] text-faint uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60" />
            Simulated demo data
          </div>
        )}

        {/* ── Portfolio overview (investor-first headline) ─────────────────── */}
        {loadingData ? (
          <div className="bg-surface border border-line rounded-2xl shadow-soft p-6 sm:p-8">
            <div className="flex items-center gap-2 text-faint">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading your portfolio…</span>
            </div>
          </div>
        ) : (
          <PortfolioOverview
            portfolio={portfolio}
            propertyCount={useReal ? dbProperties.length : mockProperties.length}
            bills={{ total: totalBills, autopay: onAutopay, needsYou: totalUrgent + totalSoon, due: totalDue }}
          />
        )}

        {/* Inbox shortcut (mock only — real doesn't have action items yet) */}
        {!useReal && totalUrgent + totalSoon > 0 && (
          <Link
            href="/dashboard/inbox"
            className="block bg-surface border border-line hover:border-accentfg/25 rounded-2xl p-5 transition-colors group"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-accentfg/[0.08] shrink-0">
                  <Inbox className="w-4 h-4 text-accentfg" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {totalUrgent > 0 && <span className="text-red-500">{totalUrgent} urgent</span>}
                    {totalUrgent > 0 && totalSoon > 0 && <span className="text-faint"> · </span>}
                    {totalSoon > 0 && <span className="text-amber-600">{totalSoon} due soon</span>}
                  </p>
                  <p className="text-[11px] text-muted mt-0.5">Open inbox to handle them</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-faint group-hover:text-accentfg transition-all" />
            </div>
          </Link>
        )}

        {/* Properties header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium text-ink2">Properties</h2>
            {useReal && dbProperties.length > 1 && (
              <span className="text-[10px] text-faint2 italic">drag to reorder</span>
            )}
          </div>
          <button
            onClick={() => {
              setForm(emptyForm);
              dirtyFields.current = new Set();
              setAutofilled(new Set());
              setCoords({ lat: null, lng: null });
              setLookupAddr("");
              setSaveError("");
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 text-xs text-accentfg bg-accentfg/[0.06] hover:bg-accentfg/[0.10] border border-accentfg/20 rounded-xl px-3 py-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add property
          </button>
        </div>

        {/* Real property cards — sortable */}
        {useReal && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={dbProperties.map((p) => p.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 stagger">
                {dbProperties.map((p) => (
                  <SortablePropertyCard key={p.id} p={p} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Mock property cards (shown when no real properties) */}
        {!useReal && !loadingData && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 stagger">
              {mockProperties.map((p) => {
                const health = getPropertyHealth(p.id);
                const fin = financialSummaryByProperty[p.id];
                const bills = mockBillsByProperty[p.id] ?? [];
                const propAutopay = bills.filter((b) => b.autopay).length;
                const propAttention = bills.filter((b) => b.status !== "green").length;
                const overdueBills = bills.filter((b) => b.status === "red").length;
                const sc = statusClasses(health.overall);

                return (
                  <Link
                    key={p.id}
                    href={`/dashboard/${p.id}`}
                    className={`group block h-full bg-surface rounded-2xl border border-line shadow-soft hover:border-accentfg/25 transition-all border-l-4 ${
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
                            <p className="text-muted text-xs mt-0.5">
                              {p.location} · {p.type}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-faint group-hover:text-accentfg transition-colors shrink-0" />
                      </div>

                      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-line">
                        <div>
                          <p className="text-muted text-[11px] mb-1 flex items-center gap-1">
                            <Receipt className="w-3 h-3" />Bills
                          </p>
                          <p className="text-sm font-semibold">{bills.length}</p>
                        </div>
                        <div>
                          <p className="text-muted text-[11px] mb-1 flex items-center gap-1">
                            <Zap className="w-3 h-3" />Autopay
                          </p>
                          <p className="text-sm font-semibold text-emerald-600">
                            {propAutopay}
                            <span className="text-faint font-normal">/{bills.length}</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-muted text-[11px] mb-1">Net this mo.</p>
                          <p className="text-sm font-semibold text-ink">{fmtCurrency(fin.noi)}</p>
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
                          <p className={`text-xs ${overdueBills > 0 ? "text-red-500" : "text-amber-600"}`}>
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

            <p className="text-faint text-xs italic pt-2">
              Add your first real property above to replace demo data.
            </p>
          </>
        )}
        <div className="pt-8 pb-2 flex justify-center">
          <Link href="/legacy/dashboard" className="text-[10px] text-faint2 hover:text-faint transition-colors">
            Legacy dashboard
          </Link>
        </div>
      </main>

      {/* ── Add Property Modal ─────────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-overlay">
          <div className="w-full max-w-lg bg-surface rounded-2xl border border-line3 animate-modal shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-line2">
              <h3 className="font-serif text-lg font-bold">Add property</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg hover:bg-tint/[0.04] transition-colors"
              >
                <X className="w-4 h-4 text-muted" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-muted mb-1.5">
                  Property name *
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder="Desert Ridge Villa"
                  className="w-full bg-paper border border-line3 rounded-xl px-3 py-2.5 text-sm text-ink placeholder-faint2 focus:outline-none focus:border-accentfg/30"
                />
              </div>

              {/* Address — drives an automatic, debounced Rentcast lookup */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-muted mb-1.5">
                  Address *
                </label>
                {/* Address field uses Google Places autocomplete; selecting a
                    suggestion also seeds "City, ST". Typing it drives the
                    debounced Rentcast value+rent lookup below. */}
                <AddressAutocomplete
                  value={form.address}
                  onChange={(v) => setField("address", v)}
                  onSelect={(sel) => {
                    // Commit the picked address → triggers the Rentcast lookup
                    // once (see lookupAddr), and capture coords for the map.
                    setLookupAddr(sel.address);
                    setCoords({ lat: sel.lat, lng: sel.lng });
                    // Auto-fill "City, ST" from the picked place when the user
                    // hasn't already typed a location of their own.
                    if (sel.location && !form.location.trim()) {
                      setField("location", sel.location);
                    }
                  }}
                  placeholder="5421 E Desert Ridge Dr, Phoenix, AZ"
                  className="w-full bg-paper border border-line3 rounded-xl px-3 py-2.5 text-sm text-ink placeholder-faint2 focus:outline-none focus:border-accentfg/30"
                />
                {/* Lookup status — loading / filled / failed (failure is non-blocking) */}
                {lookup.loading ? (
                  <p className="flex items-center gap-1.5 text-[11px] text-muted mt-1.5">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Looking up value &amp; rent from Rentcast…
                  </p>
                ) : autofilled.size > 0 ? (
                  <p className="flex items-center gap-1.5 text-[11px] text-accentfg mt-1.5">
                    <Sparkles className="w-3 h-3" />
                    Auto-filled from Rentcast — edit any field to override.
                  </p>
                ) : lookup.error ? (
                  <p className="text-[11px] text-muted mt-1.5">
                    Couldn&apos;t fetch estimates — enter value and rent manually below.
                  </p>
                ) : (
                  <p className="text-[10px] text-faint2 mt-1.5">
                    We&apos;ll auto-fill estimated value &amp; rent from Rentcast as you type.
                  </p>
                )}
              </div>

              {/* Location + Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-muted mb-1.5">
                    Location
                  </label>
                  <input
                    value={form.location}
                    onChange={(e) => setField("location", e.target.value)}
                    placeholder="Phoenix, AZ"
                    className="w-full bg-paper border border-line3 rounded-xl px-3 py-2.5 text-sm text-ink placeholder-faint2 focus:outline-none focus:border-accentfg/30"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-muted mb-1.5">
                    Type
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setField("type", e.target.value)}
                    className="w-full bg-paper border border-line3 rounded-xl px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-accentfg/30"
                  >
                    <option value="STR">STR</option>
                    <option value="Primary">Primary</option>
                  </select>
                </div>
              </div>

              {/* Estimated value + Monthly income */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted mb-1.5">
                    Est. value ($)
                    {autofilled.has("propVal") && (
                      <Sparkles className="w-3 h-3 text-accentfg" />
                    )}
                  </label>
                  <input
                    value={form.propVal}
                    onChange={(e) => setField("propVal", e.target.value)}
                    placeholder="685000"
                    type="number"
                    className="w-full bg-paper border border-line3 rounded-xl px-3 py-2.5 text-sm text-ink placeholder-faint2 focus:outline-none focus:border-accentfg/30"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted mb-1.5">
                    Monthly income ($)
                    {autofilled.has("income") && (
                      <Sparkles className="w-3 h-3 text-accentfg" />
                    )}
                  </label>
                  <input
                    value={form.income}
                    onChange={(e) => setField("income", e.target.value)}
                    placeholder="4850"
                    type="number"
                    className="w-full bg-paper border border-line3 rounded-xl px-3 py-2.5 text-sm text-ink placeholder-faint2 focus:outline-none focus:border-accentfg/30"
                  />
                </div>
              </div>

              {/* Mortgage section */}
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted mb-2">
                  Mortgage (optional)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-faint mb-1">Balance ($)</label>
                    <input
                      value={form.mortBal}
                      onChange={(e) => setField("mortBal", e.target.value)}
                      placeholder="412000"
                      type="number"
                      className="w-full bg-paper border border-line3 rounded-xl px-3 py-2 text-sm text-ink placeholder-faint2 focus:outline-none focus:border-accentfg/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-faint mb-1">Original ($)</label>
                    <input
                      value={form.mortOrig}
                      onChange={(e) => setField("mortOrig", e.target.value)}
                      placeholder="540000"
                      type="number"
                      className="w-full bg-paper border border-line3 rounded-xl px-3 py-2 text-sm text-ink placeholder-faint2 focus:outline-none focus:border-accentfg/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-faint mb-1">Monthly payment ($)</label>
                    <input
                      value={form.mortPay}
                      onChange={(e) => setField("mortPay", e.target.value)}
                      placeholder="2850"
                      type="number"
                      className="w-full bg-paper border border-line3 rounded-xl px-3 py-2 text-sm text-ink placeholder-faint2 focus:outline-none focus:border-accentfg/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-faint mb-1">Rate (%)</label>
                    <input
                      value={form.mortRate}
                      onChange={(e) => setField("mortRate", e.target.value)}
                      placeholder="7.1"
                      type="number"
                      step="0.01"
                      className="w-full bg-paper border border-line3 rounded-xl px-3 py-2 text-sm text-ink placeholder-faint2 focus:outline-none focus:border-accentfg/30"
                    />
                  </div>
                </div>
              </div>

              {saveError && (
                <p className="text-xs text-red-500">{saveError}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 text-sm text-muted hover:text-ink border border-line2 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProperty}
                  disabled={saving}
                  className="flex-1 py-2.5 text-sm font-medium text-white bg-accent hover:bg-accentdark rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save property
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
