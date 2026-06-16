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
    <div className={styles.chartCard}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h3 className={styles.chartTitle} style={{ margin: 0 }}>
            <TrendingUp size={18} style={{ color: 'var(--color-safety-orange)' }} />
            Tren Aktivitas Servis (12 Bulan Terakhir)
          </h3>
          <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--color-space-grey)' }}>Membandingkan jumlah servis selesai vs yang masih pending secara bulanan.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
          <span style={{
            fontSize: '0.72rem', background: 'rgba(46,91,255,0.08)', color: 'var(--color-cobalt-blue)',
            padding: '4px 10px', borderRadius: '12px', fontWeight: 800, letterSpacing: '0.5px',
            display: 'flex', alignItems: 'center', gap: '4px'
          }}>
            <span style={{ width: '6px', height: '6px', background: 'var(--color-cobalt-blue)', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1.2s infinite' }}></span>
            REAL-TIME SYNCED ({liveTime || 'Live Clock'})
          </span>
          <div style={{ display: 'flex', gap: '12px', fontSize: '0.72rem', fontWeight: 700 }}>
            <span style={{ color: 'var(--color-safety-orange)' }}>● Pending</span>
            <span style={{ color: 'var(--color-cobalt-blue)' }}>● Selesai</span>
          </div>
        </div>
      </div>

      <div className={styles.chartCeruk} style={{ position: 'relative', width: '100%', height: '260px' }}>
        {loading ? (
          <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}>
            <RefreshCw size={24} className={styles.spin} style={{ color: 'var(--color-cobalt-blue)' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--color-space-grey)', fontWeight: 600 }}>Memuat Grafik Aktivitas...</span>
          </div>
        ) : (
          <div style={{ position: 'relative', width: '100%', height: '100%', paddingLeft: '32px' }}>
            {/* Y-axis labels */}
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: '24px', width: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
              {yLabels.map((label, i) => (
                <span key={i} style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--color-space-grey)', textAlign: 'right', opacity: 0.7 }}>
                  {label.value}
                </span>
              ))}
            </div>

            {/* Chart SVG */}
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="comp-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2E5BFF" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#2E5BFF" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="pend-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF6B00" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#FF6B00" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <line x1="0" y1="15" x2="100" y2="15" stroke="rgba(0,31,63,0.03)" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(0,31,63,0.03)" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
              <line x1="0" y1="85" x2="100" y2="85" stroke="rgba(0,31,63,0.06)" vectorEffect="non-scaling-stroke" />

              {completedFill && <path d={completedFill} fill="url(#comp-grad)" />}
              {pendingFill && <path d={pendingFill} fill="url(#pend-grad)" />}

              {pendingLine && (
                <path d={pendingLine} stroke="#FF6B00" strokeWidth="2.5" fill="none" vectorEffect="non-scaling-stroke" />
              )}
              {completedLine && (
                <path d={completedLine} stroke="#2E5BFF" strokeWidth="2.5" fill="none" vectorEffect="non-scaling-stroke" />
              )}
            </svg>

            {points.map((p, idx) => (
              <div
                key={idx}
                style={{
                  position: 'absolute', left: `${p.x}%`, top: 0, bottom: 0,
                  width: `${90 / Math.max(1, points.length - 1)}%`, minWidth: '20px',
                  transform: 'translateX(-50%)', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                  alignItems: 'center', zIndex: 10,
                }}
                onMouseEnter={() => setHoveredPoint(p)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {hoveredPoint?.key === p.key && (
                  <div style={{ position: 'absolute', top: 0, bottom: '24px', width: '1px', background: 'rgba(0,31,63,0.15)', borderLeft: '1px dashed rgba(0,31,63,0.2)' }} />
                )}
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: hoveredPoint?.key === p.key ? 800 : 600,
                  color: hoveredPoint?.key === p.key ? 'var(--color-deep-navy)' : 'var(--color-space-grey)',
                  marginBottom: '4px', transition: 'all 0.2s',
                }}>
                  {p.label}
                </span>
              </div>
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
  );
}
