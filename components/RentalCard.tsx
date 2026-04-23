'use client';

import { useState } from 'react';
import Modal from './Modal';
import { fmt } from '@/lib/types';

type Props = {
  rent: number;
  rentBills: number;
  mortPay: number;
  onSave: (rent: number, rentBills: number) => void;
};

export default function RentalCard({ rent, rentBills, mortPay, onSave }: Props) {
  const [open, setOpen] = useState(false);
  const [rentVal, setRentVal] = useState(String(rent));
  const [billsVal, setBillsVal] = useState(String(rentBills));

  function handleOpen() {
    setRentVal(String(rent));
    setBillsVal(String(rentBills));
    setOpen(true);
  }

  function handleSave() {
    onSave(parseFloat(rentVal) || rent, parseFloat(billsVal) || rentBills);
    setOpen(false);
  }

  const cashFlow = rent - mortPay - rentBills;
  const cfPos = cashFlow >= 0;

  return (
    <>
      <div className="card">
        <div className="card-title">
          Rental income
          <button className="edit-btn" onClick={handleOpen}>Edit</button>
        </div>
        <div style={{ fontSize: 28, fontWeight: 500, color: '#3b6d11', marginBottom: 4 }}>
          {fmt(rent)}<span style={{ fontSize: 14, fontWeight: 400, color: '#888780' }}>/mo</span>
        </div>
        <div style={{ fontSize: 12, color: '#888780', marginBottom: 14 }}>Unit B · Lease ends Oct 2025</div>
        <div className="cash-row">
          <div className="cash-cat">Gross rent</div>
          <div className="cash-val cash-val-pos">+{fmt(rent)}</div>
        </div>
        <div className="cash-row">
          <div className="cash-cat">Mortgage</div>
          <div className="cash-val cash-val-neg">–{fmt(mortPay)}</div>
        </div>
        <div className="cash-row">
          <div className="cash-cat">Bills &amp; expenses</div>
          <div className="cash-val cash-val-neg">–{fmt(rentBills)}</div>
        </div>
        <div className="cash-row" style={{ borderTop: '0.5px solid rgba(0,0,0,0.2)', marginTop: 4, paddingTop: 10 }}>
          <div className="cash-cat" style={{ fontWeight: 500, color: '#1a1a18' }}>Net cash flow</div>
          <div className="cash-val" style={{ fontSize: 15, color: cfPos ? '#3b6d11' : '#a32d2d' }}>
            {cfPos ? '+' : ''}{fmt(cashFlow)}
          </div>
        </div>
      </div>

      <Modal id="rental-modal" title="Edit rental income" open={open} onClose={() => setOpen(false)} onSave={handleSave}>
        <div className="field">
          <label>Monthly rent income ($)</label>
          <input type="number" value={rentVal} onChange={e => setRentVal(e.target.value)} />
        </div>
        <div className="field">
          <label>Monthly bills/expenses charged to tenant ($)</label>
          <input type="number" value={billsVal} onChange={e => setBillsVal(e.target.value)} />
        </div>
      </Modal>
    </>
  );
}
