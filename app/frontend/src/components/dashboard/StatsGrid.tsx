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
      max: 1000, icon: ShieldCheck, accent: '#717378',
      tooltip: 'Jumlah unit yang masih dalam masa garansi resmi Holicindo berdasarkan tanggal expiry.',
      onClick: () => window.location.href = '/units?filter=warranty',
    },
    {
      label: 'Open Service Reports',
      value: loading ? '...' : String(data?.openReports ?? 0),
      max: 50, icon: ClipboardList, accent: '#717378',
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
      max: 20, icon: Users, accent: '#717378',
      tooltip: 'Jumlah mitra teknisi resmi yang terdaftar dan aktif melakukan servis unit Holicindo.',
      onClick: () => window.location.href = '/partners',
    },
    {
      label: 'Kesehatan Armada',
      value: loading ? '...' : `${data?.fleetHealth ?? 0}%`,
      max: 100, icon: Activity, accent: '#2E5BFF',
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
        gap: '20px',
        width: '100%',
        marginBottom: '24px'
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

          const pathD = `M0,${startY} C65,${peakY} 135,${dipY} 200,${startY} C265,${peakY} 335,${dipY} 400,${startY} L400,100 L0,100 Z`;

          return (
            <div
              key={stat.label + idx}
              style={{
                position: 'relative',
                overflow: 'hidden',
                background: 'linear-gradient(145deg, #1E3A5F 0%, #0D2B5E 60%, #162F5A 100%)',
                padding: '20px 22px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '18px',
                border: '1.5px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '-4px -4px 10px rgba(255, 255, 255, 0.04), 4px 4px 14px rgba(0, 0, 0, 0.35)',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                cursor: stat.onClick ? 'pointer' : 'default',
              }}
              onClick={stat.onClick}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '-4px -4px 12px rgba(255,255,255,0.06), 4px 4px 20px rgba(0,0,0,0.45)';
                (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(99, 102, 241, 0.5)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '-4px -4px 10px rgba(255,255,255,0.04), 4px 4px 14px rgba(0,0,0,0.35)';
                (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255, 255, 255, 0.12)';
              }}
            >
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                flexShrink: 0,
              }}>
                <Icon size={22} strokeWidth={1.8} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  margin: 0,
                  marginBottom: '3px',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontFamily: '"Montserrat", sans-serif',
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                  position: 'relative',
                  zIndex: 1
                }}>
                  {stat.value}
                </h3>
                <p style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'rgba(255, 255, 255, 0.65)',
                  margin: 0,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  position: 'relative',
                  zIndex: 1
                }}>
                  {stat.label}
                </p>
              </div>

              {/* Tooltip Icon */}
              {stat.tooltip && (
                <span
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    zIndex: 10,
                    display: 'inline-flex',
                    alignItems: 'center',
                    cursor: 'help',
                  }}
                  className="stat-tip-anchor"
                >
                  <HelpCircle
                    size={14}
                    style={{ color: 'rgba(255,255,255,0.4)', transition: 'color 0.2s' }}
                    className="stat-tip-icon"
                  />
                  <span
                    style={{
                      display: 'none',
                      position: 'absolute',
                      bottom: 'calc(100% + 8px)',
                      right: 0,
                      width: '220px',
                      background: '#0D2B5E',
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      lineHeight: 1.55,
                      fontWeight: 400,
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid rgba(79, 70, 229, 0.25)',
                      boxShadow: '0 8px 24px rgba(13, 43, 94, 0.2)',
                      pointerEvents: 'none',
                      whiteSpace: 'normal',
                      textAlign: 'left',
                      zIndex: 9999,
                    }}
                    className="stat-tip-bubble"
                  >
                    {stat.tooltip}
                    <span style={{
                      position: 'absolute', top: '100%', right: '8px',
                      borderWidth: '5px', borderStyle: 'solid',
                      borderColor: '#0D2B5E transparent transparent transparent',
                    }} />
                  </span>
                </span>
              )}

              {/* Wave animation — lighter/white tinted on dark bg */}
              <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 'inherit', zIndex: 0, pointerEvents: 'none' }}>
                <svg
                  viewBox="0 0 400 100"
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '200%',
                    height: '100%',
                    opacity: 0.14,
                    animation: `waveAnimation ${5 + (idx % 3) * 1.5}s linear infinite`
                  }}
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id={`grad-${stat.label.replace(/\s+/g, '')}-${idx}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                  <path d={pathD} fill={`url(#grad-${stat.label.replace(/\s+/g, '')}-${idx})`} />
                </svg>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
