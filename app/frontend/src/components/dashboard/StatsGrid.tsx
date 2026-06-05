'use client';

import { Package, ShieldCheck, ClipboardList, AlertCircle, Users, Activity, HelpCircle } from 'lucide-react';
import React from 'react';

export interface StatItem {
  label: string;
  value: string | number;
  max: number;
  icon: React.ElementType;
  accent: string;
  onClick?: () => void;
  tooltip?: string;
}

interface StatsGridProps {
  items?: StatItem[];
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

export default function StatsGrid({ items, data, loading }: StatsGridProps) {
  const stats = items || [
    {
      label: 'Active Units',
      value: loading ? '...' : String(data?.activeUnits ?? 0),
      max: 1000, icon: Package, accent: '#2E5BFF',
      tooltip: 'Total unit yang terdaftar dan aktif dalam sistem. Klik untuk melihat daftar lengkap unit.',
      onClick: () => window.location.href = '/units',
    },
    {
      label: 'Under Warranty',
      value: loading ? '...' : String(data?.underWarranty ?? 0),
      max: 1000, icon: ShieldCheck, accent: '#00C48C',
      tooltip: 'Jumlah unit yang masih dalam masa garansi resmi Holicindo berdasarkan tanggal expiry.',
      onClick: () => window.location.href = '/units?filter=warranty',
    },
    {
      label: 'Open Service Reports',
      value: loading ? '...' : String(data?.openReports ?? 0),
      max: 50, icon: ClipboardList, accent: '#FFB800',
      tooltip: 'Total laporan servis yang tercatat di sistem (semua jenis form teknis: Inspection, Cooling, Rework, dll).',
      onClick: () => window.location.href = '/reports/history',
    },
    {
      label: 'Critical Issues',
      value: loading ? '...' : String(data?.issuesDetected ?? 0),
      max: 20, icon: AlertCircle, accent: '#FF6B00',
      tooltip: 'Laporan Inspeksi & Analisis Masalah — unit yang dilaporkan mengalami kerusakan atau perlu tindak lanjut segera.',
      onClick: () => window.location.href = '/reports/history?type=ISSUE_ANALYSIS',
    },
    {
      label: 'Mitra Resmi',
      value: loading ? '...' : String(data?.activePartners ?? 0),
      max: 20, icon: Users, accent: '#9D4EDD',
      tooltip: 'Jumlah mitra teknisi resmi yang terdaftar dan aktif melakukan servis unit Holicindo.',
      onClick: () => window.location.href = '/partners',
    },
    {
      label: 'Kesehatan Armada',
      value: loading ? '...' : `${data?.fleetHealth ?? 0}%`,
      max: 100, icon: Activity, accent: '#00B4D8',
      tooltip: 'Skor kesehatan armada: 100% = semua unit aktif tanpa isu kritis. Dihitung dari: (1 - Critical Issues / Total Unit) × 100. Skor di bawah 90% perlu perhatian.',
    },
  ];

  return (
    <>
      <style>{`
        @keyframes waveAnimation {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '24px',
        width: '100%',
        marginBottom: '24px' // Add default spacing below grid
      }}>
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        
        // Dynamic wave logic
        const numValue = parseFloat(String(stat.value).replace(/[^0-9.]/g, '')) || 0;
        let percentage = Math.min(1, numValue / stat.max);
        if (loading || isNaN(percentage)) percentage = 0.5;
        
        const startY = 100 - (percentage * 50);
        const peakY = 100 - (percentage * 90);
        const dipY = 100 - (percentage * 30);
        
        // Continuous double wave for seamless looping
        const pathD = `M0,${startY} C65,${peakY} 135,${dipY} 200,${startY} C265,${peakY} 335,${dipY} 400,${startY} L400,100 L0,100 Z`;

        return (
          <div
            key={stat.label + idx}
            style={{
              position: 'relative',
              overflow: 'visible',
              background: 'var(--glass-bg, #ffffff)',
              backdropFilter: 'var(--glass-blur, blur(20px))',
              WebkitBackdropFilter: 'var(--glass-blur, blur(20px))',
              padding: '26px 20px',
              borderRadius: 'var(--radius-lg, 16px)',
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              border: '1px solid var(--glass-border, rgba(0,31,63,0.08))',
              boxShadow: 'var(--glass-shadow, 0 8px 32px rgba(0,31,63,0.04))',
              transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              cursor: stat.onClick ? 'pointer' : 'default',
            }}
            onClick={stat.onClick}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--glass-shadow-hover, 0 12px 48px rgba(0,31,63,0.08))';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--glass-shadow, 0 8px 32px rgba(0,31,63,0.04))';
            }}
          >
            <div style={{
              width: '42px',
              height: '42px',
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
                color: 'var(--color-deep-navy, #010412)',
                fontWeight: 800,
                fontFamily: 'var(--font-heading, "Montserrat", sans-serif)',
                letterSpacing: '-0.03em',
                lineHeight: 1,
                position: 'relative',
                zIndex: 1
              }}>
                {stat.value}
              </h3>
              <p style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--color-space-grey, #64748b)',
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                position: 'relative',
                zIndex: 1
              }}>
                {stat.label}
              </p>
            </div>

            {/* Tooltip Icon — top-right corner */}
            {stat.tooltip && (
              <span
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  zIndex: 10,
                  display: 'inline-flex',
                  alignItems: 'center',
                  cursor: 'help',
                }}
                className="stat-tip-anchor"
              >
                <HelpCircle
                  size={13}
                  style={{ color: `${stat.accent}99`, transition: 'color 0.2s' }}
                  className="stat-tip-icon"
                />
                <span
                  style={{
                    display: 'none',
                    position: 'absolute',
                    bottom: 'calc(100% + 8px)',
                    right: 0,
                    width: '220px',
                    background: '#0f1b35',
                    color: '#e2e8f0',
                    fontSize: '0.72rem',
                    lineHeight: 1.55,
                    fontWeight: 400,
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
                    pointerEvents: 'none',
                    whiteSpace: 'normal',
                    textAlign: 'left',
                    zIndex: 9999,
                  }}
                  className="stat-tip-bubble"
                >
                  {stat.tooltip}
                  <span style={{
                    position: 'absolute', top: '100%', right: '6px',
                    borderWidth: '5px', borderStyle: 'solid',
                    borderColor: '#0f1b35 transparent transparent transparent',
                  }} />
                </span>
              </span>
            )}

            {/* Elegant Background Wave (Animated) */}
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 'inherit', zIndex: 0, pointerEvents: 'none' }}>
              <svg 
                viewBox="0 0 400 100" 
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '200%',
                  height: '100%',
                  opacity: 0.15,
                  animation: `waveAnimation ${12 + (idx % 3) * 2}s linear infinite`
                }}
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id={`grad-${stat.label.replace(/\s+/g, '')}-${idx}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={stat.accent} stopOpacity="1" />
                    <stop offset="100%" stopColor={stat.accent} stopOpacity="0.1" />
                  </linearGradient>
                </defs>
                <path d={pathD} fill={`url(#grad-${stat.label.replace(/\s+/g, '')}-${idx})`} style={{ transition: 'd 0.8s ease' }} />
              </svg>
            </div>
          </div>
        );
      })}
    </div>
    </>
  );
}
