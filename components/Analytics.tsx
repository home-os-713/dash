'use client';

import { useState } from 'react';

type Tab = 'insights' | 'value' | 'equity-build';

export default function Analytics() {
  const [activeTab, setActiveTab] = useState<Tab>('insights');

  return (
    <div className="card">
      <div className="card-title">Analytics &amp; insights</div>
      <div className="tab-row">
        {(['insights', 'value', 'equity-build'] as Tab[]).map((tab, i) => (
          <button
            key={tab}
            className={`tab${activeTab === tab ? ' active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {['Key insights', 'Value trend', 'Equity growth'][i]}
          </button>
        ))}
      </div>

      {activeTab === 'insights' && (
        <div>
          {[
            { color: '#1D9E75', text: 'Your rental income covers 120% of your mortgage payment', sub: 'Net yield on property value: ~4.9% annually — above Seattle average of 4.1%' },
            { color: '#378ADD', text: 'Equity has grown $41,200 in the last 12 months', sub: '$22,000 from principal paydown + $19,200 from estimated appreciation' },
            { color: '#BA7517', text: "At current pace, you'll reach 20% LTV in ~3.2 years", sub: 'Eliminating PMI would save ~$190/mo if applicable to your loan' },
            { color: '#E24B4A', text: '2 bills are due within 5 days totaling $295', sub: 'Property insurance ($185) and electricity ($110) — consider enabling auto-pay' },
            { color: '#7F77DD', text: 'Annual property costs represent 7.4% of home value', sub: 'Industry benchmark is 1–4%. Review HOA fees and insurance rate at renewal' },
          ].map((item, i) => (
            <div key={i} className="insight-row">
              <div className="insight-dot" style={{ background: item.color }} />
              <div>
                <div className="insight-text">{item.text}</div>
                <div className="insight-sub">{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'value' && (
        <div>
          <svg className="svg-chart" height="160" viewBox="0 0 560 160" preserveAspectRatio="none">
            <defs>
              <linearGradient id="vg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#378ADD" stopOpacity="0.15"/>
                <stop offset="100%" stopColor="#378ADD" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <path d="M0,130 L80,120 L160,112 L240,100 L320,88 L400,72 L480,60 L560,48" fill="none" stroke="#378ADD" strokeWidth="2" strokeLinecap="round"/>
            <path d="M0,130 L80,120 L160,112 L240,100 L320,88 L400,72 L480,60 L560,48 L560,155 L0,155 Z" fill="url(#vg)"/>
            <text x="0" y="155" fontSize="11" fill="#888780">Apr &apos;23</text>
            <text x="224" y="155" fontSize="11" fill="#888780">Oct &apos;23</text>
            <text x="452" y="155" fontSize="11" fill="#888780">Apr &apos;24</text>
            <text x="520" y="155" fontSize="11" fill="#888780">Now</text>
            <text x="560" y="44" fontSize="11" fill="#378ADD" textAnchor="end">$685k</text>
            <text x="0" y="128" fontSize="11" fill="#888780">$620k</text>
          </svg>
          <div style={{ fontSize: 12, color: '#888780', marginTop: 8 }}>Estimated value trend based on 3.2% annual appreciation rate. Values are estimates only.</div>
        </div>
      )}

      {activeTab === 'equity-build' && (
        <div>
          <svg className="svg-chart" height="160" viewBox="0 0 560 160" preserveAspectRatio="none">
            <path d="M0,148 L80,142 L160,134 L240,122 L320,108 L400,90 L480,68 L560,44" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round"/>
            <path d="M0,140 L80,138 L160,135 L240,132 L320,128 L400,124 L480,118 L560,110" fill="none" stroke="#378ADD" strokeWidth="1.5" strokeDasharray="4,3" strokeLinecap="round"/>
            <text x="0" y="155" fontSize="11" fill="#888780">Now</text>
            <text x="220" y="155" fontSize="11" fill="#888780">5 yrs</text>
            <text x="430" y="155" fontSize="11" fill="#888780">10 yrs</text>
            <text x="560" y="40" fontSize="11" fill="#1D9E75" textAnchor="end">$390k</text>
            <text x="560" y="106" fontSize="11" fill="#378ADD" textAnchor="end">$290k</text>
          </svg>
          <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
            <div className="legend-item"><div className="legend-dot" style={{ background: '#1D9E75' }} />Total equity (w/ appreciation)</div>
            <div className="legend-item"><div style={{ background: '#378ADD', borderRadius: 0, width: 14, height: 3, marginTop: 3, flexShrink: 0 }} />Principal-only equity</div>
          </div>
          <div style={{ fontSize: 12, color: '#888780', marginTop: 6 }}>Projected 10-year equity assuming 3.2% annual appreciation and current mortgage terms.</div>
        </div>
      )}
    </div>
  );
}
