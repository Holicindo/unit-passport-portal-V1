'use client';

import { Package, ShieldCheck, ClipboardList, AlertCircle, Users, Activity } from 'lucide-react';

interface StatsGridProps {
  data?: {
    activeUnits: number;
    underWarranty: number;
    openReports: number;
    issuesDetected: number;
    activePartners: number;
    fleetHealth: number;
  };
  loading?: boolean;
}

export default function StatsGrid({ data, loading }: StatsGridProps) {
  const stats = [
    { label: 'Active Units', value: loading ? '...' : String(data?.activeUnits ?? 514), icon: Package, accent: '#2E5BFF' },
    { label: 'Under Warranty', value: loading ? '...' : String(data?.underWarranty ?? 384), icon: ShieldCheck, accent: '#00C48C' },
    { label: 'Open Reports', value: loading ? '...' : String(data?.openReports ?? 12), icon: ClipboardList, accent: '#FFB800' },
    { label: 'Issues Detected', value: loading ? '...' : String(data?.issuesDetected ?? 3), icon: AlertCircle, accent: '#FF6B00' },
    { label: 'Mitra Resmi', value: loading ? '...' : String(data?.activePartners ?? 5), icon: Users, accent: '#9D4EDD' },
    { label: 'Kesehatan Armada', value: loading ? '...' : `${data?.fleetHealth ?? 99.4}%`, icon: Activity, accent: '#00B4D8' },
  ];

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
              background: 'var(--glass-bg)',
              backdropFilter: 'var(--glass-blur)',
              WebkitBackdropFilter: 'var(--glass-blur)',
              padding: '24px 20px',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              border: '1px solid var(--glass-border)',
              boxShadow: 'var(--glass-shadow)',
              transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              cursor: 'default',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--glass-shadow-hover)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--glass-shadow)';
            }}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `${stat.accent}15`,
              color: stat.accent,
              flexShrink: 0,
            }}>
              <Icon size={20} strokeWidth={2} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 style={{
                fontSize: '1.6rem',
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
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--color-space-grey)',
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
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
