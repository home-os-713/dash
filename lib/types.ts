export type BillStatus = 'paid' | 'warning' | 'danger' | 'upcoming';

export type Bill = {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  meta: string;
  status: BillStatus;
  statusLabel: string;
};

export type DashboardState = {
  propName: string;
  propAddr: string;
  propVal: number;
  mortPay: number;
  mortBal: number;
  mortOrig: number;
  rent: number;
  rentBills: number;
  bills: Bill[];
};

export const DEFAULT_STATE: DashboardState = {
  propName: '142 Maple Street',
  propAddr: '142 Maple Street, Seattle, WA 98101',
  propVal: 685000,
  mortPay: 2340,
  mortBal: 486500,
  mortOrig: 685000,
  rent: 2800,
  rentBills: 120,
  bills: [
    { id: '1', name: 'HOA fees', amount: 320, dueDate: 'Apr 1', meta: 'Due Apr 1 · Auto-pay', status: 'paid', statusLabel: 'Paid' },
    { id: '2', name: 'Property insurance', amount: 185, dueDate: 'Apr 15', meta: 'Due Apr 15 · Annual', status: 'warning', statusLabel: 'Due in 1 day' },
    { id: '3', name: 'Property tax', amount: 920, dueDate: 'Apr 30', meta: 'Due Apr 30 · Biannual', status: 'upcoming', statusLabel: 'Upcoming' },
    { id: '4', name: 'Water & sewer', amount: 75, dueDate: 'Apr 20', meta: 'Due Apr 20', status: 'upcoming', statusLabel: 'Upcoming' },
    { id: '5', name: 'Electricity', amount: 110, dueDate: 'Apr 18', meta: 'Due Apr 18', status: 'warning', statusLabel: 'Due in 4 days' },
    { id: '6', name: 'Internet', amount: 80, dueDate: 'Apr 22', meta: 'Due Apr 22 · Auto-pay', status: 'upcoming', statusLabel: 'Upcoming' },
  ],
};

export function fmt(n: number): string {
  return '$' + Math.round(n).toLocaleString();
}
