'use client';

import { Package, ShieldCheck, ClipboardList, AlertCircle } from 'lucide-react';

const stats = [
  { label: 'Active Units', value: '512', icon: Package, color: 'var(--color-cobalt-blue)' },
  { label: 'Under Warranty', value: '384', icon: ShieldCheck, color: '#10b981' }, // emerald green
  { label: 'Open Reports', value: '12', icon: ClipboardList, color: '#f59e0b' }, // amber orange
  { label: 'Issues Detected', value: '3', icon: AlertCircle, color: '#ef4444' }, // red
];

export default function StatsGrid() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '24px',
      width: '100%'
    }}>
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div 
            key={stat.label} 
            style={{
              background: 'white',
              padding: '24px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
              border: '1px solid #f1f5f9'
            }}
          >
            <div 
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: stat.color.startsWith('var') ? 'rgba(46, 91, 255, 0.1)' : `${stat.color}15`,
                color: stat.color
              }}
            >
              <Icon size={24} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 
                style={{
                  fontSize: '1.6rem',
                  margin: 0,
                  marginBottom: '2px',
                  color: 'var(--color-deep-navy)',
                  fontWeight: 700,
                  fontFamily: 'var(--font-montserrat)'
                }}
              >
                {stat.value}
              </h3>
              <p 
                style={{
                  fontSize: '0.85rem',
                  margin: 0,
                  color: 'var(--color-space-grey)',
                  fontWeight: 500
                }}
              >
                {stat.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
