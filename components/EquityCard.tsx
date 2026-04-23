import { fmt } from '@/lib/types';

type Props = {
  propVal: number;
  mortBal: number;
};

export default function EquityCard({ propVal, mortBal }: Props) {
  const equity = propVal - mortBal;
  const equityPct = Math.round((equity / propVal) * 100);
  const circumference = 226.2;
  const dashOffset = (circumference * (1 - equityPct / 100)).toFixed(1);

  return (
    <div className="card">
      <div className="card-title">Equity breakdown</div>
      <div className="equity-ring">
        <svg width="90" height="90" viewBox="0 0 90 90">
          <circle cx="45" cy="45" r="36" fill="none" stroke="#ebebea" strokeWidth="14"/>
          <circle
            cx="45" cy="45" r="36" fill="none" stroke="#378ADD" strokeWidth="14"
            strokeDasharray="226.2" strokeDashoffset={dashOffset}
            strokeLinecap="butt" transform="rotate(-90 45 45)"
          />
          <text x="45" y="41" textAnchor="middle" fontSize="13" fontWeight="500" fill="#1a1a18">{equityPct}%</text>
          <text x="45" y="55" textAnchor="middle" fontSize="10" fill="#888780">equity</text>
        </svg>
        <div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#378ADD' }} />
            Equity: <strong>{fmt(equity)}</strong>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#ebebea', border: '1px solid rgba(0,0,0,0.1)' }} />
            Balance: <strong>{fmt(mortBal)}</strong>
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: '#888780' }}>Purchase price</div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{fmt(propVal)}</div>
        </div>
      </div>
    </div>
  );
}
