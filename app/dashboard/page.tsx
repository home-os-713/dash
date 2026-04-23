'use client';

import { useReducer } from 'react';
import { DashboardState, DEFAULT_STATE, Bill, fmt } from '@/lib/types';
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
  | { type: 'ADD_BILL'; bill: Bill };

function reducer(state: DashboardState, action: Action): DashboardState {
  switch (action.type) {
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
  const [state, dispatch] = useReducer(reducer, DEFAULT_STATE);

  const equity = state.propVal - state.mortBal;
  const equityPct = Math.round((equity / state.propVal) * 100);
  const cashFlow = state.rent - state.mortPay - state.rentBills;
  const totalBills = state.bills.reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="dash">
      <PropertyHeader
        propName={state.propName}
        propAddr={state.propAddr}
        propVal={state.propVal}
        onSave={(name, addr, val) => dispatch({ type: 'SAVE_PROPERTY', name, addr, val })}
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
          onSave={(pay, bal, orig) => dispatch({ type: 'SAVE_MORTGAGE', pay, bal, orig })}
        />
        <EquityCard propVal={state.propVal} mortBal={state.mortBal} />
      </div>
      <div className="two-col">
        <BillsList
          bills={state.bills}
          onAddBill={bill => dispatch({ type: 'ADD_BILL', bill })}
        />
        <RentalCard
          rent={state.rent}
          rentBills={state.rentBills}
          mortPay={state.mortPay}
          onSave={(rent, rentBills) => dispatch({ type: 'SAVE_RENTAL', rent, rentBills })}
        />
      </div>
      <SpendingChart mortPay={state.mortPay} />
    </div>
  );
}
