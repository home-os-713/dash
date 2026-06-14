// ── Portfolio analytics & projection engine ──────────────────────────────────
//
// Pure functions, no React / no Supabase imports — so the SAME code computes the
// numbers shown on /dashboard/analytics AND the numbers fed to the insights API
// route (Claude or rule-based). One source of truth means the AI can never
// "fabricate" a figure the UI didn't also derive.
//
// HONESTY PRINCIPLE (DECISION_LOG Round 5): every value is labeled either
// `actual` (derived from the user's stored Supabase + Rentcast data) or
// `projected` (modeled forward under explicit, user-adjustable assumptions).
// We never present a modeled number as if it were real.

import type { DbPropertyWithBills, DbBill } from "@/lib/v0/db";

// ── Assumptions (user-adjustable, clearly-labeled) ───────────────────────────

export type Assumptions = {
  /** Annual property appreciation, % (e.g. 3.5) */
  appreciation: number;
  /** Annual rent growth, % */
  rentGrowth: number;
  /** Annual operating-expense growth, % */
  expenseGrowth: number;
  /** Holding period, whole years */
  holdingPeriod: number;
};

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  appreciation: 3.5,
  rentGrowth: 3.0,
  expenseGrowth: 2.5,
  holdingPeriod: 5,
};

// Sensible slider bounds.
export const ASSUMPTION_BOUNDS = {
  appreciation: { min: 0, max: 10, step: 0.5, label: "Appreciation", unit: "%/yr" },
  rentGrowth: { min: 0, max: 10, step: 0.5, label: "Rent growth", unit: "%/yr" },
  expenseGrowth: { min: 0, max: 10, step: 0.5, label: "Expense growth", unit: "%/yr" },
  holdingPeriod: { min: 1, max: 30, step: 1, label: "Holding period", unit: "yr" },
} as const;

// ── Per-property metric bundle ───────────────────────────────────────────────

export type PropertyMetrics = {
  id: string;
  name: string;
  location: string | null;
  type: string | null;
  /** Number of rentable units (multi-unit roll-up). Defaults to 1. */
  units: number;

  // Actuals (from stored data)
  propValue: number; // current estimated value
  mortBalance: number;
  equity: number;
  monthlyIncome: number; // gross scheduled rent / income
  monthlyExpenses: number; // operating expenses (bills excl. mortgage principal+interest)
  monthlyDebtService: number; // mortgage payment
  monthlyCashFlow: number; // income - opex - debt service
  annualNOI: number; // (income - opex) * 12  — excludes debt service, per convention
  occupancy: number | null;

  // Investor ratios (actual, point-in-time)
  capRate: number | null; // NOI / value
  cashOnCash: number | null; // annual pre-tax cash flow / equity invested
  grm: number | null; // value / annual gross rent
  dscr: number | null; // NOI / annual debt service
  simpleROI: number | null; // annual cash flow / equity (owner-friendly)

  // Data-quality flags — drive graceful "—" in the UI and honest AI prompts.
  hasValue: boolean;
  hasMortgage: boolean;
  hasIncome: boolean;
};

// Bills we treat as the mortgage line (debt service) vs. operating expenses.
function isMortgageBill(b: DbBill): boolean {
  const cat = (b.category ?? "").toLowerCase();
  const name = (b.name ?? "").toLowerCase();
  return cat === "mortgage" || name.includes("mortgage");
}

// Rough unit count for the multi-unit / developer angle. The schema has no
// dedicated `units` column, so we infer: an explicit count baked into the type
// string (e.g. "4-plex", "Triplex"), else 1. Documented as an assumption.
function inferUnits(p: DbPropertyWithBills): number {
  const t = (p.type ?? "").toLowerCase();
  const m = t.match(/(\d+)\s*[-\s]?(unit|plex)/);
  if (m) return Math.max(1, parseInt(m[1], 10));
  if (t.includes("duplex")) return 2;
  if (t.includes("triplex")) return 3;
  if (t.includes("fourplex") || t.includes("quadplex")) return 4;
  return 1;
}

export function computePropertyMetrics(p: DbPropertyWithBills): PropertyMetrics {
  const bills = p.bills ?? [];
  const propValue = p.prop_val ?? 0;
  const mortBalance = p.mort_bal ?? 0;
  const monthlyIncome = p.income ?? p.rent ?? 0;
  const monthlyDebtService = p.mort_pay ?? 0;

  // Operating expenses = sum of non-mortgage bills. If the user hasn't entered
  // bills, fall back to rent_bills (a stored monthly utilities/HOA figure) so the
  // NOI isn't artificially inflated to the full rent.
  const billOpex = bills
    .filter((b) => !isMortgageBill(b))
    .reduce((s, b) => s + (b.amount ?? 0), 0);
  const monthlyExpenses = billOpex > 0 ? billOpex : p.rent_bills ?? 0;

  const equity = Math.max(0, propValue - mortBalance);
  const monthlyCashFlow = monthlyIncome - monthlyExpenses - monthlyDebtService;
  const annualNOI = (monthlyIncome - monthlyExpenses) * 12;
  const annualDebtService = monthlyDebtService * 12;
  const annualGrossRent = monthlyIncome * 12;

  const hasValue = propValue > 0;
  const hasIncome = monthlyIncome > 0;
  const hasMortgage = monthlyDebtService > 0 || mortBalance > 0;

  // Down-payment proxy for cash-on-cash: we don't store original cash invested,
  // so we use current equity as the capital base. Labeled as such in the UI.
  const capRate = hasValue ? annualNOI / propValue : null;
  const cashOnCash = equity > 0 ? (monthlyCashFlow * 12) / equity : null;
  const grm = hasValue && annualGrossRent > 0 ? propValue / annualGrossRent : null;
  const dscr = annualDebtService > 0 ? annualNOI / annualDebtService : null;
  const simpleROI = equity > 0 ? (monthlyCashFlow * 12) / equity : null;

  return {
    id: p.id,
    name: p.name ?? "Untitled property",
    location: p.location ?? p.address ?? null,
    type: p.type,
    units: inferUnits(p),
    propValue,
    mortBalance,
    equity,
    monthlyIncome,
    monthlyExpenses,
    monthlyDebtService,
    monthlyCashFlow,
    annualNOI,
    occupancy: p.occupancy,
    capRate,
    cashOnCash,
    grm,
    dscr,
    simpleROI,
    hasValue,
    hasMortgage,
    hasIncome,
  };
}

// ── Portfolio roll-up ────────────────────────────────────────────────────────

export type PortfolioMetrics = {
  propertyCount: number;
  unitCount: number;
  totalValue: number;
  totalDebt: number;
  totalEquity: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyDebtService: number;
  monthlyCashFlow: number;
  annualNOI: number;
  // Blended portfolio ratios (value/equity-weighted where appropriate).
  blendedCapRate: number | null;
  blendedCashOnCash: number | null;
  blendedDSCR: number | null;
  blendedGRM: number | null;
  avgOccupancy: number | null;
  ltv: number | null; // loan-to-value
  perProperty: PropertyMetrics[];
};

export function computePortfolioMetrics(
  properties: DbPropertyWithBills[]
): PortfolioMetrics {
  const perProperty = properties.map(computePropertyMetrics);

  const totalValue = sum(perProperty, (m) => m.propValue);
  const totalDebt = sum(perProperty, (m) => m.mortBalance);
  const totalEquity = sum(perProperty, (m) => m.equity);
  const monthlyIncome = sum(perProperty, (m) => m.monthlyIncome);
  const monthlyExpenses = sum(perProperty, (m) => m.monthlyExpenses);
  const monthlyDebtService = sum(perProperty, (m) => m.monthlyDebtService);
  const monthlyCashFlow = monthlyIncome - monthlyExpenses - monthlyDebtService;
  const annualNOI = (monthlyIncome - monthlyExpenses) * 12;
  const annualDebtService = monthlyDebtService * 12;
  const annualGrossRent = monthlyIncome * 12;

  const occ = perProperty.map((m) => m.occupancy).filter((o): o is number => o != null);

  return {
    propertyCount: perProperty.length,
    unitCount: sum(perProperty, (m) => m.units),
    totalValue,
    totalDebt,
    totalEquity,
    monthlyIncome,
    monthlyExpenses,
    monthlyDebtService,
    monthlyCashFlow,
    annualNOI,
    blendedCapRate: totalValue > 0 ? annualNOI / totalValue : null,
    blendedCashOnCash: totalEquity > 0 ? (monthlyCashFlow * 12) / totalEquity : null,
    blendedDSCR: annualDebtService > 0 ? annualNOI / annualDebtService : null,
    blendedGRM: totalValue > 0 && annualGrossRent > 0 ? totalValue / annualGrossRent : null,
    avgOccupancy: occ.length > 0 ? occ.reduce((a, b) => a + b, 0) / occ.length : null,
    ltv: totalValue > 0 ? totalDebt / totalValue : null,
    perProperty,
  };
}

// ── Forward projection ───────────────────────────────────────────────────────
//
// Year-by-year model over the holding period. Every figure here is PROJECTED
// (modeled), never actual. Year 0 is the present (actuals).

export type ProjectionYear = {
  year: number; // 0..holdingPeriod
  label: string; // "Now", "Yr 1", ...
  value: number; // projected property value
  debt: number; // projected remaining mortgage balance
  equity: number; // value - debt (appreciation + principal paydown)
  annualCashFlow: number; // projected pre-tax cash flow for that year
  cumulativeCashFlow: number;
  isActual: boolean; // true only for year 0
};

// Amortize a mortgage one year forward, returning the new balance.
// Uses the stored rate + payment; if rate is missing we approximate paydown as
// principal = payment*12 - interest with a 6.5% fallback rate (documented).
function amortizeOneYear(
  balance: number,
  annualRatePct: number,
  monthlyPayment: number
): number {
  if (balance <= 0 || monthlyPayment <= 0) return Math.max(0, balance);
  const r = (annualRatePct > 0 ? annualRatePct : 6.5) / 100 / 12;
  let b = balance;
  for (let i = 0; i < 12; i++) {
    const interest = b * r;
    const principal = Math.max(0, monthlyPayment - interest);
    b = Math.max(0, b - principal);
    if (b <= 0) break;
  }
  return b;
}

/** Project a single property forward. Returns one row per year (0..holding). */
export function projectProperty(
  p: DbPropertyWithBills,
  a: Assumptions
): ProjectionYear[] {
  const m = computePropertyMetrics(p);
  const rate = p.mort_rate ?? 0;
  const rows: ProjectionYear[] = [];

  let value = m.propValue;
  let debt = m.mortBalance;
  let monthlyIncome = m.monthlyIncome;
  let monthlyExpenses = m.monthlyExpenses;
  const monthlyDebtService = m.monthlyDebtService;
  let cumulative = 0;

  for (let yr = 0; yr <= a.holdingPeriod; yr++) {
    if (yr > 0) {
      value = value * (1 + a.appreciation / 100);
      debt = amortizeOneYear(debt, rate, monthlyDebtService);
      monthlyIncome = monthlyIncome * (1 + a.rentGrowth / 100);
      monthlyExpenses = monthlyExpenses * (1 + a.expenseGrowth / 100);
    }
    const annualCashFlow =
      (monthlyIncome - monthlyExpenses - monthlyDebtService) * 12;
    if (yr > 0) cumulative += annualCashFlow;

    rows.push({
      year: yr,
      label: yr === 0 ? "Now" : `Yr ${yr}`,
      value: Math.round(value),
      debt: Math.round(debt),
      equity: Math.round(Math.max(0, value - debt)),
      annualCashFlow: Math.round(annualCashFlow),
      cumulativeCashFlow: Math.round(cumulative),
      isActual: yr === 0,
    });
  }
  return rows;
}

/** Project the whole portfolio (sum of per-property projections, aligned by year). */
export function projectPortfolio(
  properties: DbPropertyWithBills[],
  a: Assumptions
): ProjectionYear[] {
  if (properties.length === 0) return [];
  const perProp = properties.map((p) => projectProperty(p, a));

  const out: ProjectionYear[] = [];
  for (let yr = 0; yr <= a.holdingPeriod; yr++) {
    let value = 0;
    let debt = 0;
    let equity = 0;
    let annualCashFlow = 0;
    let cumulative = 0;
    for (const rows of perProp) {
      const row = rows[yr];
      if (!row) continue;
      value += row.value;
      debt += row.debt;
      equity += row.equity;
      annualCashFlow += row.annualCashFlow;
      cumulative += row.cumulativeCashFlow;
    }
    out.push({
      year: yr,
      label: yr === 0 ? "Now" : `Yr ${yr}`,
      value,
      debt,
      equity,
      annualCashFlow,
      cumulativeCashFlow: cumulative,
      isActual: yr === 0,
    });
  }
  return out;
}

// ── Projection summary (the headline "in N years" numbers) ───────────────────

export type ProjectionSummary = {
  holdingPeriod: number;
  startEquity: number;
  endEquity: number;
  equityGain: number;
  startValue: number;
  endValue: number;
  appreciationGain: number;
  principalPaydown: number;
  totalCashFlow: number; // summed over the holding period
  /** Total return = equity gain + cumulative cash flow, over starting equity. */
  totalReturnPct: number | null;
  /** Annualized (CAGR-style) on equity, approximate. */
  annualizedReturnPct: number | null;
};

export function summarizeProjection(rows: ProjectionYear[]): ProjectionSummary | null {
  if (rows.length < 2) return null;
  const start = rows[0];
  const end = rows[rows.length - 1];
  const holdingPeriod = end.year;
  const equityGain = end.equity - start.equity;
  const appreciationGain = end.value - start.value;
  const principalPaydown = start.debt - end.debt;
  const totalCashFlow = end.cumulativeCashFlow;
  const totalProfit = equityGain + totalCashFlow;

  const totalReturnPct = start.equity > 0 ? totalProfit / start.equity : null;
  const annualizedReturnPct =
    start.equity > 0 && holdingPeriod > 0
      ? (Math.pow((end.equity + totalCashFlow) / start.equity, 1 / holdingPeriod) - 1) || null
      : null;

  return {
    holdingPeriod,
    startEquity: start.equity,
    endEquity: end.equity,
    equityGain,
    startValue: start.value,
    endValue: end.value,
    appreciationGain,
    principalPaydown,
    totalCashFlow,
    totalReturnPct,
    annualizedReturnPct,
  };
}

// ── Portfolio composition (for the donut/share chart) ────────────────────────

export type CompositionSlice = {
  id: string;
  name: string;
  value: number; // equity contribution
  share: number; // 0..1
};

export function equityComposition(m: PortfolioMetrics): CompositionSlice[] {
  const total = m.totalEquity || 1;
  return m.perProperty
    .map((p) => ({ id: p.id, name: p.name, value: p.equity, share: p.equity / total }))
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value);
}

// ── helpers ──────────────────────────────────────────────────────────────────

function sum<T>(arr: T[], f: (t: T) => number): number {
  return arr.reduce((s, t) => s + f(t), 0);
}

export function fmtPct(x: number | null, digits = 1): string {
  if (x == null || !isFinite(x)) return "—";
  return `${(x * 100).toFixed(digits)}%`;
}

export function fmtRatio(x: number | null, digits = 2): string {
  if (x == null || !isFinite(x)) return "—";
  return `${x.toFixed(digits)}×`;
}

export function fmtMoney(x: number | null): string {
  if (x == null || !isFinite(x)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(x);
}
