'use client';

import { useState } from 'react';
import { TrendingUp, RefreshCw } from 'lucide-react';
import { ChartMonth, computeSplinePaths } from '../utils';
import styles from '../dashboard.module.css';

interface Props {
  chartData: ChartMonth[];
  loading: boolean;
  liveTime: string;
}

export default function ServiceTrendChart({ chartData, loading, liveTime }: Props) {
  const [hoveredPoint, setHoveredPoint] = useState<any>(null);
  const { completedLine, completedFill, pendingLine, pendingFill, points } = computeSplinePaths(chartData);

  // Compute Y-axis scale labels
  const maxVal = chartData.length > 0 ? Math.max(...chartData.map(c => Math.max(c.completed, c.pending)), 4) : 4;
  const yLabels = [
    { y: '15%', value: maxVal },        // top
    { y: '50%', value: Math.round(maxVal / 2) }, // middle
    { y: '85%', value: 0 },             // bottom
  ];

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .chart-header-mobile {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 10px !important;
          }
          .chart-responsive-container {
            padding-left: 20px !important;
            padding-bottom: 24px !important;
          }
          .chart-legend-mobile {
            align-items: flex-start !important;
            width: 100% !important;
            flex-direction: row !important;
            justify-content: space-between !important;
          }
          .month-label-span {
            font-size: 0.6rem !important;
            font-weight: 700 !important;
            margin-bottom: -20px !important;
          }
        }
      `}</style>
      <div className={styles.chartCard} style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>
      <div className="chart-header-mobile" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h3 className={styles.chartTitle} style={{ margin: 0, fontSize: '0.98rem' }}>
            Tren Aktivitas Servis (12 Bulan Terakhir)
          </h3>
          <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--color-deep-navy)', fontWeight: 600, opacity: 0.7 }}>Membandingkan jumlah servis selesai vs pending.</p>
        </div>
        <div className="chart-legend-mobile" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          <span style={{
            fontSize: '0.68rem', background: 'rgba(0,31,63,0.08)', color: 'var(--color-deep-navy)',
            padding: '3px 8px', borderRadius: '12px', fontWeight: 800, letterSpacing: '0.5px',
            display: 'flex', alignItems: 'center', gap: '4px',
            border: '1px solid rgba(0,31,63,0.15)',
          }}>
            <span style={{ width: '5px', height: '5px', background: 'var(--color-deep-navy)', borderRadius: '50%', display: 'inline-block', opacity: 0.5, animation: 'pulse 1.2s infinite' }}></span>
            SYNCED ({liveTime || 'Live'})
          </span>
          <div style={{ display: 'flex', gap: '10px', fontSize: '0.68rem', fontWeight: 700 }}>
            <span style={{ color: 'var(--color-deep-navy)' }}>— Pending</span>
            <span style={{ color: 'var(--color-deep-navy)', opacity: 0.55 }}>— Selesai</span>
          </div>
        </div>
      </div>

      <div className={styles.chartCeruk} style={{ position: 'relative', width: '100%', maxWidth: '100%', boxSizing: 'border-box', padding: '12px 12px 0 12px', overflow: 'visible' }}>
        {loading ? (
          <div style={{ display: 'flex', height: '180px', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}>
            <RefreshCw size={24} className={styles.spin} style={{ color: 'var(--color-cobalt-blue)' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--color-space-grey)', fontWeight: 600 }}>Memuat Grafik Aktivitas...</span>
          </div>
        ) : (
          <div className="chart-responsive-container" style={{ position: 'relative', width: '100%', paddingLeft: '32px' }}>
            {/* Y-axis labels */}
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: '24px', width: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
              {yLabels.map((label, i) => (
                <span key={i} style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-deep-navy)', textAlign: 'right', opacity: 0.55 }}>
                  {label.value}
                </span>
              ))}
            </div>

            {/* Chart SVG Area - fixed height */}
            <div style={{ position: 'relative', width: '100%', height: '160px' }}>
              {/* Hover columns for interaction */}
              {points.map((p, idx) => (
                <div
                  key={idx}
                  style={{
                    position: 'absolute', left: `${p.x}%`, top: 0, bottom: 0,
                    width: `${90 / Math.max(1, points.length - 1)}%`, minWidth: '18px',
                    transform: 'translateX(-50%)', cursor: 'pointer',
                    zIndex: 10,
                  }}
                  onMouseEnter={() => setHoveredPoint(p)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  {hoveredPoint?.key === p.key && (
                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: '1px', background: 'rgba(0,31,63,0.15)', borderLeft: '1px dashed rgba(0,31,63,0.2)' }} />
                  )}
                </div>
              ))}
              <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="comp-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#001F3F" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#001F3F" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="pend-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#001F3F" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#001F3F" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <line x1="0" y1="15" x2="100" y2="15" stroke="rgba(0,31,63,0.2)" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
                <line x1="0" y1="35" x2="100" y2="35" stroke="rgba(0,31,63,0.12)" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
                <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(0,31,63,0.2)" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
                <line x1="0" y1="65" x2="100" y2="65" stroke="rgba(0,31,63,0.12)" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
                <line x1="0" y1="90" x2="100" y2="90" stroke="rgba(0,31,63,0.35)" vectorEffect="non-scaling-stroke" />
                <line x1="0" y1="0" x2="0" y2="90" stroke="rgba(0,31,63,0.35)" vectorEffect="non-scaling-stroke" />
                {completedFill && <path d={completedFill} fill="url(#comp-grad)" />}
                {pendingFill && <path d={pendingFill} fill="url(#pend-grad)" />}
                {pendingLine && (
                  <path d={pendingLine} stroke="rgba(0,31,63,0.85)" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" />
                )}
                {completedLine && (
                  <path d={completedLine} stroke="rgba(0,31,63,0.4)" strokeWidth="2" strokeDasharray="4 2" fill="none" vectorEffect="non-scaling-stroke" />
                )}
              </svg>
            </div>

            {/* X-axis Month Labels — always visible, outside SVG */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', paddingBottom: '4px' }}>
              {points.map((p, idx) => (
                <span
                  key={idx}
                  className="month-label-span"
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: hoveredPoint?.key === p.key ? 800 : 600,
                    color: hoveredPoint?.key === p.key ? 'var(--color-deep-navy)' : 'var(--color-space-grey)',
                    transition: 'all 0.2s',
                    flex: 1,
                    textAlign: 'center',
                  }}
                >
                  {p.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {hoveredPoint && (
          <div style={{
            position: 'absolute', top: '0px', left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(0,31,63,0.08)',
            padding: '10px 16px', borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,31,63,0.08)', zIndex: 200,
            pointerEvents: 'none', animation: 'fadeIn 0.2s ease', textAlign: 'center', minWidth: '170px',
          }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--color-space-grey)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
              {hoveredPoint.fullName}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-safety-orange)' }}>
                <span>● Pending</span><span style={{ fontWeight: 800 }}>{hoveredPoint.pending}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-cobalt-blue)' }}>
                <span>● Selesai</span><span style={{ fontWeight: 800 }}>{hoveredPoint.completed}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
