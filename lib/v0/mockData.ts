import { Home, Building2, type LucideIcon } from "lucide-react";

export type StatusColor = "green" | "yellow" | "red";
export type Priority = "urgent" | "soon" | "review";
export type RecKind = "autopay" | "lower-bill" | "financials";
export type ActionKind = "bill" | "compliance" | "maintenance" | "review" | "booking";
export type ExpenseCategory =
  | "Mortgage"
  | "Utilities"
  | "Insurance"
  | "HOA"
  | "Tax"
  | "Cleaning"
  | "Maintenance"
  | "Platform fees"
  | "Supplies"
  | "Management"
  | "Other";

export type Property = {
  id: string;
  name: string;
  address: string;
  location: string;
  type: "STR" | "Primary";
  icon: LucideIcon;
  propVal: number;
  mortBal: number;
  mortOrig: number;
  mortPay: number;
  mortRate: number;
};

export type BillItem = {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  status: StatusColor;
  statusLabel: string;
  category: ExpenseCategory;
  autopay: boolean;
  isMortgage?: boolean;
  source?: "email" | "manual" | "integration";
};

export type ActionItem = {
  id: string;
  propertyId: string;
  kind: ActionKind;
  priority: Priority;
  label: string;
  detail: string;
  category: "Compliance" | "Bills" | "Utilities" | "Maintenance" | "Bookings";
  dueIn?: string;
  amount?: number;
  ctaLabel?: string;
};

export type Recommendation = {
  id: string;
  propertyId: string;
  kind: RecKind;
  title: string;
  detail: string;
  reasoning: string;
  estSavings: string;
  estSavingsAnnual: number;
  effort: "1-click" | "10 min" | "30 min";
};

export type UtilityMonth = {
  month: string;
  electric: number;
  water: number;
  gas: number;
  solar: number;
  budget: number;
};

export type FinancialSummary = {
  income: number;
  expenses: number;
  noi: number;
  occupancy: number;
};

export type Booking = {
  id: string;
  platform: "Airbnb" | "VRBO" | "Direct";
  guest: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  gross: number;
  platformFee: number;
  cleaningFee: number;
  taxes: number;
  net: number;
  status: "completed" | "checked-in" | "upcoming";
};

export type ExpenseLine = {
  category: ExpenseCategory;
  amount: number;
  share: number;
};

export type EmailParsed = {
  id: string;
  from: string;
  subject: string;
  parsedAs: string;
  amount?: number;
  dueDate?: string;
  propertyId: string;
  receivedAt: string;
  confidence: "high" | "medium" | "low";
};

export type SavingsItem = {
  source: string;
  detail: string;
  amount: number;
  date: string;
  propertyId?: string;
};

export type AutoHandled = {
  id: string;
  propertyId: string;
  label: string;
  detail: string;
  date: string;
  category: "Autopay" | "Audit" | "Negotiation" | "Categorization" | "Filing";
  amount?: number;
};

export const properties: Property[] = [
  {
    id: "phoenix",
    name: "Desert Ridge Villa",
    address: "5421 E Desert Ridge Dr, Phoenix, AZ",
    location: "Phoenix, AZ",
    type: "STR",
    icon: Home,
    propVal: 685000,
    mortBal: 412000,
    mortOrig: 540000,
    mortPay: 2850,
    mortRate: 7.1,
  },
  {
    id: "pvr",
    name: "Casa del Mar",
    address: "Calle Olas Altas 245, Puerto Vallarta, MX",
    location: "Puerto Vallarta, MX",
    type: "STR",
    icon: Building2,
    propVal: 420000,
    mortBal: 198000,
    mortOrig: 320000,
    mortPay: 1620,
    mortRate: 6.4,
  },
];

export const billsByProperty: Record<string, BillItem[]> = {
  phoenix: [
    { id: "p-mort", name: "Mortgage", amount: 2850, dueDate: "May 1", status: "green", statusLabel: "Autopay on", category: "Mortgage", autopay: true, isMortgage: true, source: "integration" },
    { id: "p-elec", name: "APS Electric", amount: 250, dueDate: "May 8", status: "yellow", statusLabel: "Due in 5 days · No autopay", category: "Utilities", autopay: false, source: "email" },
    { id: "p-water", name: "Phoenix Water", amount: 70, dueDate: "May 12", status: "green", statusLabel: "Autopay on", category: "Utilities", autopay: true, source: "email" },
    { id: "p-gas", name: "Southwest Gas", amount: 48, dueDate: "May 15", status: "green", statusLabel: "Autopay on", category: "Utilities", autopay: true, source: "email" },
    { id: "p-ins", name: "Home Insurance", amount: 165, dueDate: "Apr 28", status: "red", statusLabel: "Overdue 5 days", category: "Insurance", autopay: false, source: "email" },
    { id: "p-hoa", name: "Desert Ridge HOA", amount: 95, dueDate: "May 5", status: "yellow", statusLabel: "Due in 2 days", category: "HOA", autopay: false, source: "manual" },
    { id: "p-clean", name: "Sparkle Cleaning Co.", amount: 320, dueDate: "May 6", status: "green", statusLabel: "Scheduled", category: "Cleaning", autopay: true, source: "integration" },
  ],
  pvr: [
    { id: "v-mort", name: "Mortgage", amount: 1620, dueDate: "May 1", status: "green", statusLabel: "Autopay on", category: "Mortgage", autopay: true, isMortgage: true, source: "integration" },
    { id: "v-elec", name: "CFE Electricity", amount: 170, dueDate: "May 10", status: "green", statusLabel: "Autopay on", category: "Utilities", autopay: true, source: "email" },
    { id: "v-water", name: "SEAPAL Water", amount: 92, dueDate: "May 14", status: "yellow", statusLabel: "No autopay", category: "Utilities", autopay: false, source: "email" },
    { id: "v-tax", name: "Predial Tax", amount: 280, dueDate: "May 30", status: "green", statusLabel: "Scheduled", category: "Tax", autopay: true, source: "manual" },
    { id: "v-clean", name: "Limpieza Marina", amount: 180, dueDate: "May 9", status: "green", statusLabel: "Scheduled", category: "Cleaning", autopay: true, source: "integration" },
  ],
};

export const actionItems: ActionItem[] = [
  { id: "a1", propertyId: "phoenix", kind: "bill", priority: "urgent", label: "Pay overdue Home Insurance", detail: "$165 — 5 days overdue, late fee risk", category: "Bills", dueIn: "Overdue 5d", amount: 165, ctaLabel: "Pay $165" },
  { id: "a2", propertyId: "phoenix", kind: "compliance", priority: "urgent", label: "Schedule fire safety inspection", detail: "7 days overdue — fines up to $2,500", category: "Compliance", dueIn: "Overdue 7d", ctaLabel: "Book inspection" },
  { id: "a3", propertyId: "phoenix", kind: "compliance", priority: "soon", label: "File LLC annual report", detail: "Due May 4 — 1 day remaining", category: "Compliance", dueIn: "1 day", ctaLabel: "File now" },
  { id: "a4", propertyId: "phoenix", kind: "review", priority: "review", label: "Investigate water usage spike", detail: "42% above baseline during guest stay Apr 2–5", category: "Utilities", dueIn: "Review", ctaLabel: "View details" },
  { id: "a5", propertyId: "pvr", kind: "compliance", priority: "soon", label: "Renew tourism license", detail: "Due May 28 — 25 days remaining", category: "Compliance", dueIn: "25 days", ctaLabel: "Renew" },
  { id: "a6", propertyId: "pvr", kind: "bill", priority: "soon", label: "Set up SEAPAL Water autopay", detail: "Currently manual — risk of $40 reconnection fee", category: "Bills", ctaLabel: "Turn on autopay" },
  { id: "a7", propertyId: "pvr", kind: "review", priority: "review", label: "Check water usage during vacancy", detail: "Spike detected May 1 with no guests", category: "Utilities", ctaLabel: "View details" },
  { id: "a8", propertyId: "phoenix", kind: "booking", priority: "soon", label: "Confirm cleaning before May 6 check-in", detail: "Sarah & Mike, 4 nights — guest arriving 3pm", category: "Bookings", dueIn: "3 days", ctaLabel: "Confirm" },
];

export const recommendations: Recommendation[] = [
  { id: "r1", propertyId: "phoenix", kind: "autopay", title: "Turn on autopay for APS Electric", detail: "Avoid $25 late fees and 5 minutes a month of manual review.", reasoning: "Last 3 months you paid 1–4 days before due. Autopay matches your behavior with zero risk of late fee.", estSavings: "$25/mo", estSavingsAnnual: 300, effort: "1-click" },
  { id: "r2", propertyId: "phoenix", kind: "lower-bill", title: "Switch to APS time-of-use plan", detail: "Your peak usage is mostly off-peak (10pm–6am).", reasoning: "Modeled from last 6 months of bills: 78% of consumption is off-peak. Time-of-use plan is ~24% cheaper for that pattern.", estSavings: "$340/yr", estSavingsAnnual: 340, effort: "10 min" },
  { id: "r3", propertyId: "phoenix", kind: "financials", title: "Refinance mortgage", detail: "Current rate 7.1% — market is 6.3%.", reasoning: "Your remaining balance ($412k) and 22 years left make this a $285/mo savings. Break-even on closing costs in 18 months.", estSavings: "$285/mo", estSavingsAnnual: 3420, effort: "30 min" },
  { id: "r4", propertyId: "pvr", kind: "autopay", title: "Turn on autopay for SEAPAL Water", detail: "Eliminate risk of $40 reconnect fee.", reasoning: "Twice in the last 18 months you paid late. Autopay closes the gap.", estSavings: "$40 per incident", estSavingsAnnual: 80, effort: "1-click" },
  { id: "r5", propertyId: "pvr", kind: "lower-bill", title: "Install smart water shut-off", detail: "Detected vacancy-period water spike May 1.", reasoning: "Two unexplained spikes in the last 6 months during vacancies = likely slow leak. ROI in 14 months from leak prevention alone.", estSavings: "$180/yr", estSavingsAnnual: 180, effort: "30 min" },
  { id: "r6", propertyId: "pvr", kind: "financials", title: "Bundle insurance with Phoenix property", detail: "Multi-property discount with current carrier.", reasoning: "Your Phoenix carrier offers a 12% multi-property discount you're not using. PVR coverage transfers cleanly.", estSavings: "$220/yr", estSavingsAnnual: 220, effort: "30 min" },
];

export const utilityDataByProperty: Record<string, UtilityMonth[]> = {
  phoenix: [
    { month: "Nov", electric: 195, water: 65, gas: 55, solar: 80, budget: 420 },
    { month: "Dec", electric: 210, water: 60, gas: 68, solar: 65, budget: 420 },
    { month: "Jan", electric: 225, water: 58, gas: 72, solar: 55, budget: 420 },
    { month: "Feb", electric: 215, water: 62, gas: 65, solar: 70, budget: 420 },
    { month: "Mar", electric: 250, water: 70, gas: 48, solar: 95, budget: 420 },
    { month: "Apr", electric: 235, water: 88, gas: 42, solar: 110, budget: 420 },
    { month: "May", electric: 250, water: 70, gas: 48, solar: 95, budget: 420 },
  ],
  pvr: [
    { month: "Nov", electric: 150, water: 82, gas: 10, solar: 0, budget: 300 },
    { month: "Dec", electric: 175, water: 90, gas: 14, solar: 0, budget: 300 },
    { month: "Jan", electric: 160, water: 85, gas: 11, solar: 0, budget: 300 },
    { month: "Feb", electric: 155, water: 80, gas: 10, solar: 0, budget: 300 },
    { month: "Mar", electric: 170, water: 92, gas: 13, solar: 0, budget: 300 },
    { month: "Apr", electric: 165, water: 110, gas: 12, solar: 0, budget: 300 },
    { month: "May", electric: 170, water: 92, gas: 13, solar: 0, budget: 300 },
  ],
};

export const financialSummaryByProperty: Record<string, FinancialSummary> = {
  phoenix: { income: 4850, expenses: 1920, noi: 2930, occupancy: 82 },
  pvr: { income: 3200, expenses: 1150, noi: 2050, occupancy: 74 },
};

export const expenseBreakdownByProperty: Record<string, ExpenseLine[]> = {
  phoenix: [
    { category: "Mortgage", amount: 2850, share: 0 },
    { category: "Utilities", amount: 368, share: 0 },
    { category: "Insurance", amount: 165, share: 0 },
    { category: "HOA", amount: 95, share: 0 },
    { category: "Cleaning", amount: 320, share: 0 },
    { category: "Maintenance", amount: 180, share: 0 },
    { category: "Platform fees", amount: 485, share: 0 },
    { category: "Supplies", amount: 95, share: 0 },
  ],
  pvr: [
    { category: "Mortgage", amount: 1620, share: 0 },
    { category: "Utilities", amount: 275, share: 0 },
    { category: "Insurance", amount: 110, share: 0 },
    { category: "Tax", amount: 280, share: 0 },
    { category: "Cleaning", amount: 180, share: 0 },
    { category: "Maintenance", amount: 95, share: 0 },
    { category: "Platform fees", amount: 320, share: 0 },
    { category: "Supplies", amount: 60, share: 0 },
  ],
};

(function computeShares() {
  for (const id of Object.keys(expenseBreakdownByProperty)) {
    const lines = expenseBreakdownByProperty[id];
    const total = lines.reduce((s, l) => s + l.amount, 0);
    lines.forEach((l) => (l.share = l.amount / total));
  }
})();

export const bookingsByProperty: Record<string, Booking[]> = {
  phoenix: [
    { id: "b1", platform: "Airbnb", guest: "Sarah & Mike", checkIn: "May 6", checkOut: "May 10", nights: 4, gross: 1280, platformFee: 192, cleaningFee: 120, taxes: 95, net: 873, status: "upcoming" },
    { id: "b2", platform: "VRBO", guest: "The Hendersons", checkIn: "Apr 28", checkOut: "May 2", nights: 4, gross: 1180, platformFee: 142, cleaningFee: 120, taxes: 88, net: 830, status: "checked-in" },
    { id: "b3", platform: "Airbnb", guest: "James K.", checkIn: "Apr 18", checkOut: "Apr 22", nights: 4, gross: 1320, platformFee: 198, cleaningFee: 120, taxes: 99, net: 903, status: "completed" },
    { id: "b4", platform: "Airbnb", guest: "Mia & friends", checkIn: "Apr 8", checkOut: "Apr 12", nights: 4, gross: 1480, platformFee: 222, cleaningFee: 120, taxes: 111, net: 1027, status: "completed" },
    { id: "b5", platform: "Direct", guest: "Returning: Patel family", checkIn: "Apr 1", checkOut: "Apr 5", nights: 4, gross: 1250, platformFee: 0, cleaningFee: 120, taxes: 94, net: 1036, status: "completed" },
  ],
  pvr: [
    { id: "b6", platform: "Airbnb", guest: "Emma R.", checkIn: "May 9", checkOut: "May 14", nights: 5, gross: 1100, platformFee: 165, cleaningFee: 90, taxes: 88, net: 757, status: "upcoming" },
    { id: "b7", platform: "VRBO", guest: "Carlos & Maria", checkIn: "Apr 22", checkOut: "Apr 28", nights: 6, gross: 1380, platformFee: 166, cleaningFee: 90, taxes: 110, net: 1014, status: "completed" },
    { id: "b8", platform: "Airbnb", guest: "Tom & Liz", checkIn: "Apr 12", checkOut: "Apr 17", nights: 5, gross: 1250, platformFee: 188, cleaningFee: 90, taxes: 100, net: 872, status: "completed" },
    { id: "b9", platform: "Airbnb", guest: "Spring Breakers", checkIn: "Apr 2", checkOut: "Apr 7", nights: 5, gross: 1620, platformFee: 243, cleaningFee: 90, taxes: 130, net: 1157, status: "completed" },
  ],
};

export const emailsParsed: EmailParsed[] = [
  { id: "e1", from: "billing@aps.com", subject: "Your APS bill is ready", parsedAs: "APS Electric — $250 due May 8", amount: 250, dueDate: "May 8", propertyId: "phoenix", receivedAt: "2h ago", confidence: "high" },
  { id: "e2", from: "noreply@swgas.com", subject: "Statement available", parsedAs: "Southwest Gas — $48 due May 15", amount: 48, dueDate: "May 15", propertyId: "phoenix", receivedAt: "5h ago", confidence: "high" },
  { id: "e3", from: "service@phoenixwater.gov", subject: "April water bill", parsedAs: "Phoenix Water — $70 due May 12", amount: 70, dueDate: "May 12", propertyId: "phoenix", receivedAt: "1d ago", confidence: "high" },
  { id: "e4", from: "no-reply@cfe.mx", subject: "Tu factura CFE", parsedAs: "CFE Electricity — $170 due May 10", amount: 170, dueDate: "May 10", propertyId: "pvr", receivedAt: "1d ago", confidence: "high" },
  { id: "e5", from: "alerts@homeguard.com", subject: "Smoke alarm low battery", parsedAs: "Maintenance: replace smoke alarm battery in master bedroom", propertyId: "phoenix", receivedAt: "2d ago", confidence: "medium" },
];

export const savingsThisMonth: Record<string, SavingsItem[]> = {
  phoenix: [
    { propertyId: "phoenix", source: "Bill audit caught error", detail: "HOA double-charged the April fee — disputed and refunded", amount: 95, date: "Apr 18" },
    { propertyId: "phoenix", source: "Late fee avoided (autopay)", detail: "Mortgage paid on time via autopay", amount: 35, date: "Apr 1" },
    { propertyId: "phoenix", source: "Plan optimization", detail: "Switched to APS time-of-use plan (you approved Mar 12)", amount: 28, date: "Apr bill" },
  ],
  pvr: [
    { propertyId: "pvr", source: "Bill audit caught error", detail: "Water bill estimate too high — disputed and corrected", amount: 32, date: "Apr 22" },
    { propertyId: "pvr", source: "Late fee avoided (autopay)", detail: "CFE Electricity paid on time via autopay", amount: 18, date: "Apr 10" },
  ],
};

export const autoHandled: AutoHandled[] = [
  { id: "h1", propertyId: "phoenix", label: "HOA bill audit + dispute", detail: "Detected double-charge on Apr HOA invoice. Filed dispute Apr 18. Refund posted Apr 24.", date: "Apr 18", category: "Audit", amount: 95 },
  { id: "h2", propertyId: "phoenix", label: "Mortgage paid via autopay", detail: "Auto-debited on Apr 1. No late fee.", date: "Apr 1", category: "Autopay" },
  { id: "h3", propertyId: "phoenix", label: "Phoenix Water paid via autopay", detail: "Auto-debited on Apr 12.", date: "Apr 12", category: "Autopay" },
  { id: "h4", propertyId: "phoenix", label: "Southwest Gas paid via autopay", detail: "Auto-debited on Apr 15.", date: "Apr 15", category: "Autopay" },
  { id: "h5", propertyId: "phoenix", label: "5 expenses categorized for taxes", detail: "Cleaning, supplies, and platform fees auto-coded for Schedule E.", date: "Apr 28", category: "Categorization" },
  { id: "h6", propertyId: "pvr", label: "SEAPAL Water dispute filed", detail: "Estimated reading was 2.4× actual. Provider corrected the bill.", date: "Apr 22", category: "Audit", amount: 32 },
  { id: "h7", propertyId: "pvr", label: "CFE paid via autopay", detail: "Auto-debited on Apr 10.", date: "Apr 10", category: "Autopay" },
  { id: "h8", propertyId: "pvr", label: "Predial Tax scheduled", detail: "Set up scheduled payment for May 30.", date: "Apr 14", category: "Filing" },
];

export function getProperty(id: string): Property | undefined {
  return properties.find((p) => p.id === id);
}

export function actionItemsByProperty(propertyId: string): ActionItem[] {
  return actionItems.filter((a) => a.propertyId === propertyId);
}

export function recommendationsByProperty(propertyId: string): Recommendation[] {
  return recommendations.filter((r) => r.propertyId === propertyId);
}

export function emailsParsedByProperty(propertyId: string): EmailParsed[] {
  return emailsParsed.filter((e) => e.propertyId === propertyId);
}

export function savingsTotal(propertyId?: string): number {
  if (propertyId) return (savingsThisMonth[propertyId] ?? []).reduce((s, x) => s + x.amount, 0);
  return Object.values(savingsThisMonth).flat().reduce((s, x) => s + x.amount, 0);
}

export function autoHandledByProperty(propertyId?: string): AutoHandled[] {
  if (!propertyId) return autoHandled;
  return autoHandled.filter((h) => h.propertyId === propertyId);
}

export function savingsByProperty(propertyId: string): SavingsItem[] {
  return savingsThisMonth[propertyId] ?? [];
}

export function statusClasses(status: StatusColor) {
  return {
    green: { dot: "bg-emerald-400", text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/15" },
    yellow: { dot: "bg-amber-400", text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/15" },
    red: { dot: "bg-red-400 animate-pulse", text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/15" },
  }[status];
}

export function priorityClasses(priority: Priority) {
  return {
    urgent: { badge: "bg-red-500/20 text-red-400", border: "border-red-500/15 bg-red-500/5" },
    soon: { badge: "bg-amber-500/20 text-amber-400", border: "border-amber-500/15 bg-amber-500/5" },
    review: { badge: "bg-blue-500/20 text-blue-400", border: "border-[#4B5436]/10 bg-white/[0.02]" },
  }[priority];
}

export function fmtCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

export function getPropertyHealth(propertyId: string) {
  const actions = actionItemsByProperty(propertyId);
  const urgentCount = actions.filter((a) => a.priority === "urgent").length;
  const soonCount = actions.filter((a) => a.priority === "soon").length;
  const overall: StatusColor = urgentCount > 0 ? "red" : soonCount > 1 ? "yellow" : "green";
  const score = Math.max(40, 100 - urgentCount * 20 - soonCount * 8);
  const label = overall === "green" ? "Good Standing" : overall === "yellow" ? "Fair" : "Needs Attention";
  return { overall, score, label, urgentCount, soonCount };
}

export const KEEP_FOR_BACK_COMPAT_actionItemsByProperty: Record<string, ActionItem[]> = Object.fromEntries(
  properties.map((p) => [p.id, actionItemsByProperty(p.id)]),
);
export const KEEP_FOR_BACK_COMPAT_recommendationsByProperty: Record<string, Recommendation[]> = Object.fromEntries(
  properties.map((p) => [p.id, recommendationsByProperty(p.id)]),
);
