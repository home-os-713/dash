"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  ChevronRight,
  Home as HomeIcon,
  Bell,
  Inbox,
  Zap,
  Receipt,
  Plus,
  X,
  Search,
  Loader2,
  GripVertical,
} from "lucide-react";
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
        className="absolute top-2.5 left-3 p-1.5 cursor-grab active:cursor-grabbing touch-none z-10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg hover:bg-black/[0.04]"
        style={{ WebkitTapHighlightColor: "transparent" }}
        onClick={(e) => e.preventDefault()}
      >
        <GripVertical className="w-3.5 h-3.5 text-[#6E6B64]" />
      </div>

      <Link
        href={`/dashboard/${p.id}`}
        className={`block h-full bg-white rounded-2xl border border-[#EAE8E1] shadow-soft hover:border-[#5A6247]/25 transition-all border-l-4 ${
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
                <p className="text-[#6E6B64] text-xs mt-0.5">
                  {p.location ?? p.address ?? "—"} · {p.type ?? "Property"}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#78756E] group-hover:text-[#5A6247] transition-colors shrink-0" />
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#EAE8E1]">
            <div>
              <p className="text-[#6E6B64] text-[11px] mb-1 flex items-center gap-1">
                <Receipt className="w-3 h-3" />
                Bills
              </p>
              <p className="text-sm font-semibold">
                {bills.length > 0 ? bills.length : "—"}
              </p>
            </div>
            <div>
              <p className="text-[#6E6B64] text-[11px] mb-1 flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Autopay
              </p>
              <p className="text-sm font-semibold text-emerald-600">
                {propAutopay}
                <span className="text-[#78756E] font-normal">/{bills.length}</span>
              </p>
            </div>
            <div>
              <p className="text-[#6E6B64] text-[11px] mb-1">Net this mo.</p>
              <p className="text-sm font-semibold text-[#2B2B28]">
                {noi !== 0 ? fmtCurrency(noi) : "—"}
              </p>
            </div>
          </div>

          {bills.length === 0 && (
            <div className="mt-4 flex items-center gap-2 rounded-xl px-3 py-2 border border-[#EFEDE7] bg-black/[0.015]">
              <p className="text-xs text-[#78756E]">No bills added yet</p>
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

// ── Portfolio page ───────────────────────────────────────────────────────────

export default function PortfolioPage() {
  const router = useRouter();
  const supabase = createClient();

  const [signingOut, setSigningOut] = useState(false);
  const [dbProperties, setDbProperties] = useState<DbPropertyWithBills[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState<PropertyForm>(emptyForm);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

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
  const needAttention = allBills.filter((b) => b.status !== "green").length;
  const totalDue = allBills.reduce((s, b) => s + (b.amount ?? 0), 0);

  const totalUrgent = useReal
    ? allBills.filter((b) => b.status === "red").length
    : actionItems.filter((a) => a.priority === "urgent").length;
  const totalSoon = useReal
    ? allBills.filter((b) => b.status === "yellow").length
    : actionItems.filter((a) => a.priority === "soon").length;

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
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleLookup() {
    if (!form.address.trim()) return;
    setLookingUp(true);
    setLookupError("");
    try {
      const res = await fetch(
        `/api/property-lookup?address=${encodeURIComponent(form.address)}`
      );
      const data = await res.json();
      if (!res.ok) {
        setLookupError(data.error ?? "Lookup failed");
        return;
      }
      setForm((f) => ({
        ...f,
        propVal: data.estimatedValue ? String(Math.round(data.estimatedValue)) : f.propVal,
        location:
          data.city && data.state
            ? `${data.city}, ${data.state}`
            : f.location,
      }));
    } catch {
      setLookupError("Lookup failed — check your network or API key.");
    } finally {
      setLookingUp(false);
    }
  }

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
      });
      setDbProperties((prev) => [...prev, { ...created, bills: [] }]);
      setForm(emptyForm);
      setShowAddModal(false);
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#2B2B28]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#E2DFD6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#5A6247] flex items-center justify-center">
              <HomeIcon className="w-4 h-4 text-white" />
            </div>
            <span className="font-serif text-lg font-bold tracking-tight">HomeOS</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/inbox"
              className="flex items-center gap-2 text-[#6E6B64] hover:text-[#2B2B28] text-sm bg-black/[0.025] border border-[#EAE8E1] rounded-xl px-3 py-2 transition-colors"
            >
              <Inbox className="w-4 h-4" />
              <span className="hidden sm:inline">Inbox</span>
              {totalUrgent + totalSoon > 0 && (
                <Badge className="bg-[#5A6247]/[0.08] text-[#5A6247] border-0 text-[10px] px-1.5 h-4">
                  {totalUrgent + totalSoon}
                </Badge>
              )}
            </Link>
            <button className="relative p-2 rounded-xl hover:bg-[#5A6247]/[0.08] transition-colors">
              <Bell className="w-5 h-5 text-[#6E6B64]" />
              {totalUrgent > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-400 rounded-full" />
              )}
            </button>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="text-xs text-[#6E6B64] hover:text-[#2B2B28] transition-colors px-3 py-1.5 rounded-lg border border-[#5A6247]/15"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 animate-rise stagger">
        {/* Demo data banner (only when showing mock) */}
        {!loadingData && !useReal && (
          <div className="flex items-center gap-2 text-[10px] text-[#78756E] uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60" />
            Simulated demo data
          </div>
        )}

        {/* Hero */}
        <div className="bg-white border border-[#EAE8E1] rounded-2xl shadow-soft p-6 sm:p-8">
          <p className="text-[11px] uppercase tracking-wider text-[#6E6B64] mb-3">
            Every bill, every property, one place
          </p>
          {loadingData ? (
            <div className="flex items-center gap-2 text-[#78756E]">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading your properties…</span>
            </div>
          ) : (
            <h1 className="text-2xl sm:text-3xl font-serif font-bold leading-tight">
              <span className="text-[#2B2B28]">{totalBills} bills</span>
              <span className="text-[#6E6B64]"> across </span>
              <span className="text-[#2B2B28]">
                {useReal ? dbProperties.length : mockProperties.length} properties
              </span>
              <span className="text-[#6E6B64]"> · </span>
              <span className="text-emerald-600">{onAutopay} on autopay</span>
              {needAttention > 0 && (
                <>
                  <span className="text-[#6E6B64]"> · </span>
                  <span className="text-amber-600">{needAttention} need attention</span>
                </>
              )}
            </h1>
          )}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-[#EAE8E1]">
            <div>
              <p className="text-[#6E6B64] text-[11px] uppercase tracking-wider">Bills due this month</p>
              <p className="text-2xl font-bold tnum text-[#5A6247] mt-1">{fmtCurrency(totalDue)}</p>
            </div>
            <div>
              <p className="text-[#6E6B64] text-[11px] uppercase tracking-wider">On autopay</p>
              <p className="text-2xl font-bold tnum text-emerald-600 mt-1">
                {onAutopay}
                <span className="text-[#78756E] text-base font-normal">/{totalBills}</span>
              </p>
            </div>
            <div>
              <p className="text-[#6E6B64] text-[11px] uppercase tracking-wider">Needs you</p>
              <p className="text-2xl font-bold tnum text-[#2B2B28] mt-1">{totalUrgent + totalSoon}</p>
            </div>
          </div>
        </div>

        {/* Inbox shortcut (mock only — real doesn't have action items yet) */}
        {!useReal && totalUrgent + totalSoon > 0 && (
          <Link
            href="/dashboard/inbox"
            className="block bg-white border border-[#EAE8E1] hover:border-[#5A6247]/25 rounded-2xl p-5 transition-colors group"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-[#5A6247]/[0.08] shrink-0">
                  <Inbox className="w-4 h-4 text-[#5A6247]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {totalUrgent > 0 && <span className="text-red-500">{totalUrgent} urgent</span>}
                    {totalUrgent > 0 && totalSoon > 0 && <span className="text-[#78756E]"> · </span>}
                    {totalSoon > 0 && <span className="text-amber-600">{totalSoon} due soon</span>}
                  </p>
                  <p className="text-[11px] text-[#6E6B64] mt-0.5">Open inbox to handle them</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#78756E] group-hover:text-[#5A6247] transition-all" />
            </div>
          </Link>
        )}

        {/* Properties header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium text-[#57554F]">Properties</h2>
            {useReal && dbProperties.length > 1 && (
              <span className="text-[10px] text-[#B5B2A9] italic">drag to reorder</span>
            )}
          </div>
          <button
            onClick={() => { setShowAddModal(true); setSaveError(""); }}
            className="flex items-center gap-1.5 text-xs text-[#5A6247] bg-[#5A6247]/[0.06] hover:bg-[#5A6247]/[0.10] border border-[#5A6247]/20 rounded-xl px-3 py-1.5 transition-colors"
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
                    className={`group block h-full bg-white rounded-2xl border border-[#EAE8E1] shadow-soft hover:border-[#5A6247]/25 transition-all border-l-4 ${
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
                            <p className="text-[#6E6B64] text-xs mt-0.5">
                              {p.location} · {p.type}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[#78756E] group-hover:text-[#5A6247] transition-colors shrink-0" />
                      </div>

                      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#EAE8E1]">
                        <div>
                          <p className="text-[#6E6B64] text-[11px] mb-1 flex items-center gap-1">
                            <Receipt className="w-3 h-3" />Bills
                          </p>
                          <p className="text-sm font-semibold">{bills.length}</p>
                        </div>
                        <div>
                          <p className="text-[#6E6B64] text-[11px] mb-1 flex items-center gap-1">
                            <Zap className="w-3 h-3" />Autopay
                          </p>
                          <p className="text-sm font-semibold text-emerald-600">
                            {propAutopay}
                            <span className="text-[#78756E] font-normal">/{bills.length}</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-[#6E6B64] text-[11px] mb-1">Net this mo.</p>
                          <p className="text-sm font-semibold text-[#2B2B28]">{fmtCurrency(fin.noi)}</p>
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

            <p className="text-[#78756E] text-xs italic pt-2">
              Add your first real property above to replace demo data.
            </p>
          </>
        )}
        <div className="pt-8 pb-2 flex justify-center">
          <Link href="/legacy/dashboard" className="text-[10px] text-[#CFCCC3] hover:text-[#78756E] transition-colors">
            Legacy dashboard
          </Link>
        </div>
      </main>

      {/* ── Add Property Modal ─────────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-overlay">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-[#D8D5CB] animate-modal shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[#E2DFD6]">
              <h3 className="font-serif text-lg font-bold">Add property</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg hover:bg-black/[0.04] transition-colors"
              >
                <X className="w-4 h-4 text-[#6E6B64]" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#6E6B64] mb-1.5">
                  Property name *
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder="Desert Ridge Villa"
                  className="w-full bg-[#FAF9F6] border border-[#D8D5CB] rounded-xl px-3 py-2.5 text-sm text-[#2B2B28] placeholder-[#B5B2A9] focus:outline-none focus:border-[#5A6247]/30"
                />
              </div>

              {/* Address + Lookup */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#6E6B64] mb-1.5">
                  Address *
                </label>
                <div className="flex gap-2">
                  <input
                    value={form.address}
                    onChange={(e) => setField("address", e.target.value)}
                    placeholder="5421 E Desert Ridge Dr, Phoenix, AZ"
                    className="flex-1 bg-[#FAF9F6] border border-[#D8D5CB] rounded-xl px-3 py-2.5 text-sm text-[#2B2B28] placeholder-[#B5B2A9] focus:outline-none focus:border-[#5A6247]/30"
                  />
                  <button
                    onClick={handleLookup}
                    disabled={lookingUp || !form.address.trim()}
                    className="flex items-center gap-1.5 px-3 py-2.5 text-xs text-[#5A6247] bg-[#5A6247]/[0.06] hover:bg-[#5A6247]/[0.10] border border-[#5A6247]/20 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  >
                    {lookingUp ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Search className="w-3.5 h-3.5" />
                    )}
                    Look up value
                  </button>
                </div>
                {lookupError && (
                  <p className="text-xs text-red-500 mt-1">{lookupError}</p>
                )}
                <p className="text-[10px] text-[#B5B2A9] mt-1">
                  Fetches estimated value from Rentcast (requires RENTCAST_API_KEY)
                </p>
              </div>

              {/* Location + Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#6E6B64] mb-1.5">
                    Location
                  </label>
                  <input
                    value={form.location}
                    onChange={(e) => setField("location", e.target.value)}
                    placeholder="Phoenix, AZ"
                    className="w-full bg-[#FAF9F6] border border-[#D8D5CB] rounded-xl px-3 py-2.5 text-sm text-[#2B2B28] placeholder-[#B5B2A9] focus:outline-none focus:border-[#5A6247]/30"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#6E6B64] mb-1.5">
                    Type
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setField("type", e.target.value)}
                    className="w-full bg-[#FAF9F6] border border-[#D8D5CB] rounded-xl px-3 py-2.5 text-sm text-[#2B2B28] focus:outline-none focus:border-[#5A6247]/30"
                  >
                    <option value="STR">STR</option>
                    <option value="Primary">Primary</option>
                  </select>
                </div>
              </div>

              {/* Estimated value + Monthly income */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#6E6B64] mb-1.5">
                    Est. value ($)
                  </label>
                  <input
                    value={form.propVal}
                    onChange={(e) => setField("propVal", e.target.value)}
                    placeholder="685000"
                    type="number"
                    className="w-full bg-[#FAF9F6] border border-[#D8D5CB] rounded-xl px-3 py-2.5 text-sm text-[#2B2B28] placeholder-[#B5B2A9] focus:outline-none focus:border-[#5A6247]/30"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#6E6B64] mb-1.5">
                    Monthly income ($)
                  </label>
                  <input
                    value={form.income}
                    onChange={(e) => setField("income", e.target.value)}
                    placeholder="4850"
                    type="number"
                    className="w-full bg-[#FAF9F6] border border-[#D8D5CB] rounded-xl px-3 py-2.5 text-sm text-[#2B2B28] placeholder-[#B5B2A9] focus:outline-none focus:border-[#5A6247]/30"
                  />
                </div>
              </div>

              {/* Mortgage section */}
              <div>
                <p className="text-[11px] uppercase tracking-wider text-[#6E6B64] mb-2">
                  Mortgage (optional)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-[#78756E] mb-1">Balance ($)</label>
                    <input
                      value={form.mortBal}
                      onChange={(e) => setField("mortBal", e.target.value)}
                      placeholder="412000"
                      type="number"
                      className="w-full bg-[#FAF9F6] border border-[#D8D5CB] rounded-xl px-3 py-2 text-sm text-[#2B2B28] placeholder-[#B5B2A9] focus:outline-none focus:border-[#5A6247]/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#78756E] mb-1">Original ($)</label>
                    <input
                      value={form.mortOrig}
                      onChange={(e) => setField("mortOrig", e.target.value)}
                      placeholder="540000"
                      type="number"
                      className="w-full bg-[#FAF9F6] border border-[#D8D5CB] rounded-xl px-3 py-2 text-sm text-[#2B2B28] placeholder-[#B5B2A9] focus:outline-none focus:border-[#5A6247]/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#78756E] mb-1">Monthly payment ($)</label>
                    <input
                      value={form.mortPay}
                      onChange={(e) => setField("mortPay", e.target.value)}
                      placeholder="2850"
                      type="number"
                      className="w-full bg-[#FAF9F6] border border-[#D8D5CB] rounded-xl px-3 py-2 text-sm text-[#2B2B28] placeholder-[#B5B2A9] focus:outline-none focus:border-[#5A6247]/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#78756E] mb-1">Rate (%)</label>
                    <input
                      value={form.mortRate}
                      onChange={(e) => setField("mortRate", e.target.value)}
                      placeholder="7.1"
                      type="number"
                      step="0.01"
                      className="w-full bg-[#FAF9F6] border border-[#D8D5CB] rounded-xl px-3 py-2 text-sm text-[#2B2B28] placeholder-[#B5B2A9] focus:outline-none focus:border-[#5A6247]/30"
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
                  className="flex-1 py-2.5 text-sm text-[#6E6B64] hover:text-[#2B2B28] border border-[#E2DFD6] rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProperty}
                  disabled={saving}
                  className="flex-1 py-2.5 text-sm font-medium text-white bg-[#5A6247] hover:bg-[#4A5239] rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
