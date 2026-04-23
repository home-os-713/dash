'use client';

import { useEffect, useRef } from 'react';

type Props = {
  id: string;
  title: string;
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  saveLabel?: string;
  children: React.ReactNode;
};

export default function Modal({ title, open, onClose, onSave, saveLabel = 'Save', children }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (e.target === overlayRef.current) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div ref={overlayRef} className={`modal-overlay${open ? ' open' : ''}`}>
      <div className="modal">
        <div className="modal-title">{title}</div>
        {children}
        <div className="modal-btns">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={onSave}>{saveLabel}</button>
        </div>
      </div>
    </div>
  );
}
