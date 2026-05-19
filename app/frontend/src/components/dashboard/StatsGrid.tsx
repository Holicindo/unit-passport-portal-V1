'use client';

import { Package, ShieldCheck, ClipboardList, AlertCircle } from 'lucide-react';

const stats = [
  { label: 'Active Units', value: '512', icon: Package, accent: '#2E5BFF' },
  { label: 'Under Warranty', value: '384', icon: ShieldCheck, accent: '#00C48C' },
  { label: 'Open Reports', value: '12', icon: ClipboardList, accent: '#FFB800' },
  { label: 'Issues Detected', value: '3', icon: AlertCircle, accent: '#FF6B00' },
];

export default function StatsGrid() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '24px',
      width: '100%'
    }}>
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            style={{
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(16px) saturate(160%)',
              WebkitBackdropFilter: 'blur(16px) saturate(160%)',
              padding: '28px 24px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              boxShadow: '0 8px 32px rgba(0, 31, 63, 0.04), inset 0 1px 0 rgba(255,255,255,0.6)',
              transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              cursor: 'default',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = '0 20px 40px rgba(0, 31, 63, 0.08), inset 0 1px 0 rgba(255,255,255,0.6)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(0, 31, 63, 0.04), inset 0 1px 0 rgba(255,255,255,0.6)';
            }}
          >
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `${stat.accent}15`,
              color: stat.accent,
              flexShrink: 0,
            }}>
              <Icon size={22} strokeWidth={2} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 style={{
                fontSize: '1.8rem',
                margin: 0,
                marginBottom: '2px',
                color: 'var(--color-deep-navy)',
                fontWeight: 800,
                fontFamily: 'var(--font-heading)',
                letterSpacing: '-0.03em',
                lineHeight: 1,
              }}>
                {stat.value}
              </h3>
              <p style={{
                fontSize: '0.82rem',
                margin: 0,
                color: 'var(--color-space-grey)',
                fontWeight: 600,
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
              }}>
                {stat.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
