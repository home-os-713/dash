'use client';

import { useState } from 'react';
import Modal from './Modal';
import { Bill, fmt } from '@/lib/types';

type Props = {
  bills: Bill[];
  onAddBill: (bill: Bill) => void;
};

export default function BillsList({ bills, onAddBill }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');

  function handleSave() {
    if (!name.trim()) return;
    onAddBill({
      id: Date.now().toString(),
      name: name.trim(),
      amount: parseFloat(amount) || 0,
      dueDate: dueDate || 'TBD',
      meta: `Due ${dueDate || 'TBD'}`,
      status: 'upcoming',
      statusLabel: 'Upcoming',
    });
    setName('');
    setAmount('');
    setDueDate('');
    setOpen(false);
  }

  const tagClass: Record<Bill['status'], string> = {
    paid: 'tag-success',
    warning: 'tag-warning',
    danger: 'tag-danger',
    upcoming: 'tag-info',
  };

  return (
    <>
      <div className="card">
        <div className="card-title">
          Bills due this month
          <button className="edit-btn" onClick={() => setOpen(true)}>+ Add</button>
        </div>
        <div>
          {bills.map(bill => (
            <div key={bill.id} className="bill-row">
              <div>
                <div className="bill-name">{bill.name}</div>
                <div className="bill-meta">{bill.meta}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="bill-amount">{fmt(bill.amount)}</div>
                <span className={`tag ${tagClass[bill.status]}`}>{bill.statusLabel}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal id="bill-modal" title="Add a bill" open={open} onClose={() => setOpen(false)} onSave={handleSave} saveLabel="Add bill">
        <div className="field">
          <label>Bill name</label>
          <input type="text" placeholder="e.g. Landscaping" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="field">
          <label>Amount ($)</label>
          <input type="number" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} />
        </div>
        <div className="field">
          <label>Due date</label>
          <input type="text" placeholder="e.g. Apr 25" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        </div>
      </Modal>
    </>
  );
}
