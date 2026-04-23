import { fmt } from '@/lib/types';

type Props = {
  mortPay: number;
};

export default function SpendingChart({ mortPay }: Props) {
  const items = [
    { label: 'Mortgage', amount: mortPay, colorClass: 'bar-blue' },
    { label: 'Property tax', amount: 920, colorClass: 'bar-amber' },
    { label: 'HOA fees', amount: 320, colorClass: 'bar-purple' },
    { label: 'Insurance', amount: 185, colorClass: 'bar-teal' },
    { label: 'Utilities', amount: 265, colorClass: 'bar-red' },
  ];
  const max = Math.max(...items.map(i => i.amount));

  return (
    <div className="card">
      <div className="card-title">Monthly spending breakdown</div>
      {items.map((item, i) => (
        <div key={item.label} className="bar-wrap" style={{ marginBottom: i < items.length - 1 ? 10 : 0 }}>
          <div className="bar-label"><span>{item.label}</span><span>{fmt(item.amount)}</span></div>
          <div className="bar-track">
            <div className={`bar-fill ${item.colorClass}`} style={{ width: `${Math.round((item.amount / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
