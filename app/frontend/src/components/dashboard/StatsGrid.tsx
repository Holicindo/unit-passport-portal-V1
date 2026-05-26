'use client';

import { Package, ShieldCheck, ClipboardList, AlertCircle, Users, Activity } from 'lucide-react';
import React from 'react';

export interface StatItem {
  label: string;
  value: string | number;
  max: number;
  icon: React.ElementType;
  accent: string;
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
  // Use generic items if provided, otherwise fallback to legacy dashboard mapping
  const stats = items || [
    { label: 'Active Units', value: loading ? '...' : String(data?.activeUnits ?? 514), max: 1000, icon: Package, accent: '#2E5BFF' },
    { label: 'Under Warranty', value: loading ? '...' : String(data?.underWarranty ?? 384), max: 1000, icon: ShieldCheck, accent: '#00C48C' },
    { label: 'Open Reports', value: loading ? '...' : String(data?.openReports ?? 12), max: 50, icon: ClipboardList, accent: '#FFB800' },
    { label: 'Issues Detected', value: loading ? '...' : String(data?.issuesDetected ?? 3), max: 20, icon: AlertCircle, accent: '#FF6B00' },
    { label: 'Mitra Resmi', value: loading ? '...' : String(data?.activePartners ?? 5), max: 20, icon: Users, accent: '#9D4EDD' },
    { label: 'Kesehatan Armada', value: loading ? '...' : `${data?.fleetHealth ?? 99.4}%`, max: 100, icon: Activity, accent: '#00B4D8' },
  ];

  return (
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
        
        const pathD = `M0,${startY} C60,${peakY} 140,${dipY} 200,${startY} L200,100 L0,100 Z`;

        return (
          <div
            key={stat.label + idx}
            style={{
              position: 'relative',
              overflow: 'hidden',
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
              cursor: 'default',
            }}
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
            
            {/* Elegant Background Wave */}
            <svg 
              viewBox="0 0 200 100" 
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0.15,
                pointerEvents: 'none',
                zIndex: 0
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
        );
      })}
    </div>
  );
}
