import { fmt } from '@/lib/types';

type Props = {
  propVal: number;
  equity: number;
  equityPct: number;
  cashFlow: number;
  totalBills: number;
};

export default function MetricsGrid({ propVal, equity, equityPct, cashFlow, totalBills }: Props) {
  const cfPos = cashFlow >= 0;
  return (
    <>
      <div className="section-title">Overview</div>
      <div className="metric-grid">
        <div className="metric">
          <div className="metric-label">Estimated value</div>
          <div className="metric-value">{fmt(propVal)}</div>
          <div className="metric-sub metric-up">+3.2% this year</div>
        </div>
        <div className="metric">
          <div className="metric-label">Home equity</div>
          <div className="metric-value">{fmt(equity)}</div>
          <div className="metric-sub metric-neutral">{equityPct}% of value</div>
        </div>
        <div className="metric">
          <div className="metric-label">Monthly cash flow</div>
          <div className="metric-value" style={{ color: cfPos ? '#3b6d11' : '#a32d2d' }}>
            {cfPos ? '+' : ''}{fmt(cashFlow)}
          </div>
          <div className="metric-sub metric-neutral">Rental income surplus</div>
        </div>
        <div className="metric">
          <div className="metric-label">Bills due this month</div>
          <div className="metric-value">{fmt(totalBills)}</div>
          <div className="metric-sub metric-warning">2 due within 5 days</div>
        </div>
      </div>
    </>
  );
}
