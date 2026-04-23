'use client';

import { useState } from 'react';
import Modal from './Modal';
import { fmt } from '@/lib/types';

type Props = {
  mortPay: number;
  mortBal: number;
  mortOrig: number;
  onSave: (pay: number, bal: number, orig: number) => void;
};

export default function MortgageCard({ mortPay, mortBal, mortOrig, onSave }: Props) {
  const [open, setOpen] = useState(false);
  const [pay, setPay] = useState(String(mortPay));
  const [bal, setBal] = useState(String(mortBal));
  const [orig, setOrig] = useState(String(mortOrig));

  function handleOpen() {
    setPay(String(mortPay));
    setBal(String(mortBal));
    setOrig(String(mortOrig));
    setOpen(true);
  }

  function handleSave() {
    onSave(parseFloat(pay) || mortPay, parseFloat(bal) || mortBal, parseFloat(orig) || mortOrig);
    setOpen(false);
  }

  const balPct = Math.round((mortBal / mortOrig) * 100);
  const principalPaid = mortOrig - mortBal;

  return (
    <>
      <div className="card">
        <div className="card-title">
          Mortgage
          <button className="edit-btn" onClick={handleOpen}>Edit</button>
        </div>
        <div style={{ fontSize: 28, fontWeight: 500, color: '#1a1a18', marginBottom: 4 }}>
          {fmt(mortPay)}<span style={{ fontSize: 14, fontWeight: 400, color: '#888780' }}>/mo</span>
        </div>
        <div style={{ fontSize: 12, color: '#888780', marginBottom: 14 }}>30-yr fixed · 6.25% · 22 yrs remaining</div>
        <div className="bar-wrap">
          <div className="bar-label"><span>Principal balance</span><span>{fmt(mortBal)}</span></div>
          <div className="bar-track"><div className="bar-fill bar-blue" style={{ width: `${balPct}%` }} /></div>
        </div>
        <div style={{ marginTop: 10, display: 'flex', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: '#888780' }}>Principal paid</div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{fmt(principalPaid)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#888780' }}>Interest/mo</div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>$2,534</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#888780' }}>Payoff date</div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Jan 2047</div>
          </div>
        </div>
      </div>

      <Modal id="mortgage-modal" title="Edit mortgage details" open={open} onClose={() => setOpen(false)} onSave={handleSave}>
        <div className="field">
          <label>Monthly payment ($)</label>
          <input type="number" value={pay} onChange={e => setPay(e.target.value)} />
        </div>
        <div className="field">
          <label>Remaining principal ($)</label>
          <input type="number" value={bal} onChange={e => setBal(e.target.value)} />
        </div>
        <div className="field">
          <label>Original loan amount ($)</label>
          <input type="number" value={orig} onChange={e => setOrig(e.target.value)} />
        </div>
      </Modal>
    </>
  );
}
