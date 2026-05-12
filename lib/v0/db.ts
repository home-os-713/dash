import { createClient } from "@/lib/supabase/client";

// ── Types matching the extended Supabase schema ──────────────────────────────

export type DbProperty = {
  id: string;
  user_id: string;
  name: string | null;
  address: string | null;
  location: string | null;
  type: "STR" | "Primary" | null;
  prop_val: number | null;
  mort_pay: number | null;
  mort_bal: number | null;
  mort_orig: number | null;
  mort_rate: number | null;
  income: number | null;
  occupancy: number | null;
  rent: number | null;
  rent_bills: number | null;
  updated_at: string;
};

export type DbBill = {
  id: string;
  property_id: string;
  name: string;
  amount: number;
  due_date: string;
  paid: boolean;
  category: string | null;
  autopay: boolean | null;
  status: "green" | "yellow" | "red" | null;
  status_label: string | null;
  source: string | null;
};

export type DbPropertyWithBills = DbProperty & { bills: DbBill[] };

// ── Query helpers (all use the browser Supabase client) ─────────────────────

type SupabaseClient = ReturnType<typeof createClient>;

export async function listUserProperties(
  supabase: SupabaseClient
): Promise<DbPropertyWithBills[]> {
  const { data, error } = await supabase
    .from("properties")
    .select("*, bills(*)")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as DbPropertyWithBills[];
}

export async function getPropertyById(
  supabase: SupabaseClient,
  id: string
): Promise<DbPropertyWithBills | null> {
  const { data, error } = await supabase
    .from("properties")
    .select("*, bills(*)")
    .eq("id", id)
    .maybeSingle();

  if (error) return null;
  return data as DbPropertyWithBills | null;
}

export async function insertProperty(
  supabase: SupabaseClient,
  fields: Omit<DbProperty, "id" | "user_id" | "updated_at">
): Promise<DbProperty> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("properties")
    .insert({ ...fields, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data as DbProperty;
}

// ── Derived UI helpers ───────────────────────────────────────────────────────

export type PropertyHealth = {
  overall: "green" | "yellow" | "red";
  urgentCount: number;
  soonCount: number;
};

export function computePropertyHealth(bills: DbBill[]): PropertyHealth {
  const overdue = bills.filter((b) => b.status === "red").length;
  const dueSoon = bills.filter((b) => b.status === "yellow").length;
  const overall = overdue > 0 ? "red" : dueSoon > 0 ? "yellow" : "green";
  return { overall, urgentCount: overdue, soonCount: dueSoon };
}

export function computeNOI(property: DbProperty, bills: DbBill[]): number {
  const income = property.income ?? property.rent ?? 0;
  const expenses = bills.reduce((s, b) => s + (b.amount ?? 0), 0);
  return income - expenses;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isDbId(id: string): boolean {
  return UUID_RE.test(id);
}
