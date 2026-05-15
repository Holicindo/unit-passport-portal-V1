'use client';

import { Package, ShieldCheck, ClipboardList, AlertCircle } from 'lucide-react';

const stats = [
  { label: 'Active Units', value: '512', icon: Package, color: 'var(--color-cobalt-blue)' },
  { label: 'Under Warranty', value: '384', icon: ShieldCheck, color: 'var(--color-success)' },
  { label: 'Open Reports', value: '12', icon: ClipboardList, color: 'var(--color-warning)' },
  { label: 'Issues Detected', value: '3', icon: AlertCircle, color: '#ff4d4d' },
];

export default function StatsGrid() {
  return (
    <div className="stats-grid">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="stat-card">
            <div className="icon-box" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
              <Icon size={24} />
            </div>
            <div className="stat-info">
              <h3>{stat.value}</h3>
              <p>{stat.label}</p>
            </div>
          </div>
        );
      })}

      <style jsx>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 24px;
        }
        .stat-card {
          background: white;
          padding: 24px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          gap: 20px;
          box-shadow: var(--shadow-card);
        }
        .icon-box {
          width: 56px;
          height: 56px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .stat-info h3 {
          font-size: 1.5rem;
          margin-bottom: 4px;
          color: var(--color-deep-navy);
        }
        .stat-info p {
          font-size: 0.9rem;
          color: var(--color-space-grey);
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
