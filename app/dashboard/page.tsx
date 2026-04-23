'use client';

import { useEffect, useReducer, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { DashboardState, DEFAULT_STATE, Bill } from '@/lib/types';
import PropertyHeader from '@/components/PropertyHeader';
import MetricsGrid from '@/components/MetricsGrid';
import MortgageCard from '@/components/MortgageCard';
import EquityCard from '@/components/EquityCard';
import BillsList from '@/components/BillsList';
import RentalCard from '@/components/RentalCard';
import SpendingChart from '@/components/SpendingChart';

type Action =
  | { type: 'SAVE_PROPERTY'; name: string; addr: string; val: number }
  | { type: 'SAVE_MORTGAGE'; pay: number; bal: number; orig: number }
  | { type: 'SAVE_RENTAL'; rent: number; rentBills: number }
  | { type: 'ADD_BILL'; bill: Bill }
  | { type: 'LOAD'; state: DashboardState };

function reducer(state: DashboardState, action: Action): DashboardState {
  switch (action.type) {
    case 'LOAD':
      return action.state;
    case 'SAVE_PROPERTY':
      return { ...state, propName: action.name, propAddr: action.addr, propVal: action.val };
    case 'SAVE_MORTGAGE':
      return { ...state, mortPay: action.pay, mortBal: action.bal, mortOrig: action.orig };
    case 'SAVE_RENTAL':
      return { ...state, rent: action.rent, rentBills: action.rentBills };
    case 'ADD_BILL':
      return { ...state, bills: [...state.bills, action.bill] };
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, DEFAULT_STATE);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: property } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (property) {
        setPropertyId(property.id);
        const { data: bills } = await supabase
          .from('bills')
          .select('*')
          .eq('property_id', property.id);

        dispatch({
          type: 'LOAD',
          state: {
            propName: property.name ?? DEFAULT_STATE.propName,
            propAddr: property.address ?? DEFAULT_STATE.propAddr,
            propVal: property.prop_val ?? DEFAULT_STATE.propVal,
            mortPay: property.mort_pay ?? DEFAULT_STATE.mortPay,
            mortBal: property.mort_bal ?? DEFAULT_STATE.mortBal,
            mortOrig: property.mort_orig ?? DEFAULT_STATE.mortOrig,
            rent: property.rent ?? DEFAULT_STATE.rent,
            rentBills: property.rent_bills ?? DEFAULT_STATE.rentBills,
            bills: bills?.map(b => ({
              id: b.id,
              name: b.name,
              amount: b.amount,
              dueDate: b.due_date,
              meta: `Due ${b.due_date}`,
              status: b.paid ? 'paid' : 'upcoming',
              statusLabel: b.paid ? 'Paid' : 'Upcoming',
            })) ?? DEFAULT_STATE.bills,
          },
        });
      }
      setLoading(false);
    }
    load();
  }, []);

  async function saveProperty(name: string, addr: string, val: number) {
    dispatch({ type: 'SAVE_PROPERTY', name, addr, val });
    await upsertProperty({ name, address: addr, prop_val: val });
  }

  async function saveMortgage(pay: number, bal: number, orig: number) {
    dispatch({ type: 'SAVE_MORTGAGE', pay, bal, orig });
    await upsertProperty({ mort_pay: pay, mort_bal: bal, mort_orig: orig });
  }

  async function saveRental(rent: number, rentBills: number) {
    dispatch({ type: 'SAVE_RENTAL', rent, rentBills });
    await upsertProperty({ rent, rent_bills: rentBills });
  }

  async function addBill(bill: Bill) {
    dispatch({ type: 'ADD_BILL', bill });
    const pid = await ensureProperty();
    await supabase.from('bills').insert({
      property_id: pid,
      name: bill.name,
      amount: bill.amount,
      due_date: bill.dueDate,
      paid: false,
    });
  }

  async function ensureProperty(): Promise<string> {
    if (propertyId) return propertyId;
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from('properties')
      .insert({ user_id: user!.id })
      .select('id')
      .single();
    setPropertyId(data!.id);
    return data!.id;
  }

  async function upsertProperty(fields: Record<string, unknown>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (propertyId) {
      await supabase.from('properties').update(fields).eq('id', propertyId);
    } else {
      const { data } = await supabase
        .from('properties')
        .insert({ user_id: user.id, ...fields })
        .select('id')
        .single();
      if (data) setPropertyId(data.id);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  const equity = state.propVal - state.mortBal;
  const equityPct = Math.round((equity / state.propVal) * 100);
  const cashFlow = state.rent - state.mortPay - state.rentBills;
  const totalBills = state.bills.reduce((sum, b) => sum + b.amount, 0);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 13, color: '#888780' }}>Loading…</div>
      </div>
    );
  }

  return (
    <div className="dash">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <button className="edit-btn" onClick={handleSignOut}>Sign out</button>
      </div>
      <PropertyHeader
        propName={state.propName}
        propAddr={state.propAddr}
        propVal={state.propVal}
        onSave={saveProperty}
      />
      <MetricsGrid
        propVal={state.propVal}
        equity={equity}
        equityPct={equityPct}
        cashFlow={cashFlow}
        totalBills={totalBills}
      />
      <div className="two-col">
        <MortgageCard
          mortPay={state.mortPay}
          mortBal={state.mortBal}
          mortOrig={state.mortOrig}
          onSave={saveMortgage}
        />
        <EquityCard propVal={state.propVal} mortBal={state.mortBal} />
      </div>
      <div className="two-col">
        <BillsList bills={state.bills} onAddBill={addBill} />
        <RentalCard
          rent={state.rent}
          rentBills={state.rentBills}
          mortPay={state.mortPay}
          onSave={saveRental}
        />
      </div>
      <SpendingChart mortPay={state.mortPay} />
    </div>
  );
}
