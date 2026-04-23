'use client';

import { useState } from 'react';
import Modal from './Modal';
import { fmt } from '@/lib/types';

type Props = {
  propName: string;
  propAddr: string;
  propVal: number;
  onSave: (name: string, addr: string, val: number) => void;
};

export default function PropertyHeader({ propName, propAddr, propVal, onSave }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(propName);
  const [addr, setAddr] = useState(propAddr);
  const [val, setVal] = useState(String(propVal));

  function handleOpen() {
    setName(propName);
    setAddr(propAddr);
    setVal(String(propVal));
    setOpen(true);
  }

  function handleSave() {
    onSave(name, addr, parseFloat(val) || propVal);
    setOpen(false);
  }

  return (
    <>
      <div className="prop-header">
        <div className="prop-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#378ADD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
        <div>
          <div className="prop-name">{propName}</div>
          <div className="prop-addr">{propAddr} &nbsp;·&nbsp; Single family</div>
        </div>
        <button className="edit-btn" style={{ marginLeft: 'auto' }} onClick={handleOpen}>Edit property</button>
      </div>

      <Modal id="prop-modal" title="Edit property details" open={open} onClose={() => setOpen(false)} onSave={handleSave}>
        <div className="field">
          <label>Property name / nickname</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="field">
          <label>Address</label>
          <input type="text" value={addr} onChange={e => setAddr(e.target.value)} />
        </div>
        <div className="field">
          <label>Estimated market value ($)</label>
          <input type="number" value={val} onChange={e => setVal(e.target.value)} />
        </div>
      </Modal>
    </>
  );
}
