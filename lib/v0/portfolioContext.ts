// Builds a compact, structured snapshot of the user's REAL Supabase portfolio
// for the AI assistant to reason over. The shape is deterministic (stable key
// order, no timestamps) so it caches cleanly as a prompt-cache prefix, and it
// contains ONLY numbers that came from the database — the assistant is
// instructed to answer strictly from this snapshot and cite the figures it uses.
//
// This is shared by the chat UI (to show the user what context is sent) and the
// /api/assistant route (which serializes it into the cached system block).

import type { DbPropertyWithBills, DbBill } from "@/lib/v0/db";

export type BillSnapshot = {
  name: string;
  amount: number;
  category: string | null;
  autopay: boolean;
  status: "green" | "yellow" | "red" | null;
  dueDate: string | null;
};

export type PropertySnapshot = {
  id: string;
  name: string;
  location: string | null;
  type: string | null;
  estimatedValue: number | null;
  monthlyIncome: number | null;
  mortgage: {
    balance: number | null;
    originalAmount: number | null;
    monthlyPayment: number | null;
    ratePct: number | null;
  };
  equity: number | null;
  monthlyBillsTotal: number;
  monthlyNOI: number | null; // income - all monthly bills (incl. mortgage line)
  bills: BillSnapshot[];
};

export type PortfolioSnapshot = {
  generatedFrom: "supabase";
  propertyCount: number;
  totals: {
    estimatedValue: number;
    mortgageBalance: number;
    equity: number;
    monthlyIncome: number;
    monthlyBills: number;
    monthlyNOI: number;
  };
  properties: PropertySnapshot[];
};

function n(v: number | null | undefined): number | null {
  return v == null || Number.isNaN(v) ? null : v;
}

export function buildPortfolioSnapshot(
  properties: DbPropertyWithBills[]
): PortfolioSnapshot {
  const propertySnaps: PropertySnapshot[] = properties.map((p) => {
    const bills: DbBill[] = p.bills ?? [];
    const monthlyBillsTotal = bills.reduce((s, b) => s + (b.amount ?? 0), 0);
    const income = n(p.income) ?? n(p.rent) ?? 0;
    const value = n(p.prop_val);
    const mortBal = n(p.mort_bal);
    const equity = value != null && mortBal != null ? value - mortBal : null;

    return {
      id: p.id,
      name: p.name ?? "Unnamed property",
      location: p.location,
      type: p.type,
      estimatedValue: value,
      monthlyIncome: income,
      mortgage: {
        balance: mortBal,
        originalAmount: n(p.mort_orig),
        monthlyPayment: n(p.mort_pay),
        ratePct: n(p.mort_rate),
      },
      equity,
      monthlyBillsTotal,
      monthlyNOI: income - monthlyBillsTotal,
      bills: bills.map((b) => ({
        name: b.name,
        amount: b.amount ?? 0,
        category: b.category,
        autopay: !!b.autopay,
        status: b.status,
        dueDate: b.due_date ?? null,
      })),
    };
  });

  const totals = propertySnaps.reduce(
    (acc, p) => {
      acc.estimatedValue += p.estimatedValue ?? 0;
      acc.mortgageBalance += p.mortgage.balance ?? 0;
      acc.equity += p.equity ?? 0;
      acc.monthlyIncome += p.monthlyIncome ?? 0;
      acc.monthlyBills += p.monthlyBillsTotal;
      acc.monthlyNOI += p.monthlyNOI ?? 0;
      return acc;
    },
    {
      estimatedValue: 0,
      mortgageBalance: 0,
      equity: 0,
      monthlyIncome: 0,
      monthlyBills: 0,
      monthlyNOI: 0,
    }
  );

  return {
    generatedFrom: "supabase",
    propertyCount: propertySnaps.length,
    totals,
    properties: propertySnaps,
  };
}

// A few grounded example questions, surfaced in the UI (and the no-key state).
export const EXAMPLE_QUESTIONS = [
  "Which property nets me the most each month?",
  "What bills aren't on autopay yet?",
  "How much total equity do I have across the portfolio?",
  "Which property has the weakest cash flow, and why?",
  "Summarize my portfolio in three sentences.",
];
