'use client';

import React from 'react';
import { ShieldCheck, AlertTriangle, XCircle, Wrench, CheckCircle2, Wifi, WifiOff } from 'lucide-react';

// ─── MOCK DATA ───────────────────────────────────────────────────────────────
// Untuk pameran: nilai stabil dan positif. Angka ini tidak dihitung dari data
// sensor mentah, sehingga informasi teknis tetap tersimpan di sisi internal.
const MOCK_HEALTH_SCORE = 87;
const MOCK_SECONDARY = [
  { label: 'Sistem Pendingin', score: 90 },
  { label: 'Kelistrikan',      score: 85 },
  { label: 'Sirkulasi Udara',  score: 88 },
];

// ─── TIPE ────────────────────────────────────────────────────────────────────
interface StatusConfig {
  label:       string;
  sublabel:    string;
  color:       string;
  bgColor:     string;
  borderColor: string;
  glowColor:   string;
  icon:        React.ElementType;
  recommendation: string;
}

function getStatusConfig(score: number): StatusConfig {
  if (score >= 80) {
    return {
      label:          'Optimal',
      sublabel:       'Unit beroperasi normal',
      color:          '#10b981',
      bgColor:        'rgba(16,185,129,0.08)',
      borderColor:    'rgba(16,185,129,0.25)',
      glowColor:      'rgba(16,185,129,0.3)',
      icon:           ShieldCheck,
      recommendation: 'Tidak ada indikasi gangguan. Kapasitas pendinginan terjaga dengan baik. Jadwal perawatan rutin berikutnya sesuai rencana.',
    };
  }
  if (score >= 60) {
    return {
      label:          'Perhatian',
      sublabel:       'Perlu pemeriksaan segera',
      color:          '#f59e0b',
      bgColor:        'rgba(245,158,11,0.08)',
      borderColor:    'rgba(245,158,11,0.25)',
      glowColor:      'rgba(245,158,11,0.3)',
      icon:           AlertTriangle,
      recommendation: 'Performa sistem pendingin mulai menurun. Disarankan untuk menjadwalkan servis ringan atau pembersihan filter dalam waktu dekat.',
    };
  }
  return {
    label:          'Kritis',
    sublabel:       'Membutuhkan servis segera',
    color:          '#ef4444',
    bgColor:        'rgba(239,68,68,0.08)',
    borderColor:    'rgba(239,68,68,0.25)',
    glowColor:      'rgba(239,68,68,0.3)',
    icon:           XCircle,
    recommendation: 'Terdapat indikasi penurunan kinerja signifikan. Segera hubungi teknisi Holicindo untuk pemeriksaan dan kemungkinan penggantian komponen.',
  };
}

// ─── DONUT CHART ─────────────────────────────────────────────────────────────
function DonutChart({ score, color, glowColor }: { score: number; color: string; glowColor: string }) {
  const size   = 160;
  const stroke = 14;
  const r      = (size - stroke) / 2;
  const circ   = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke="rgba(0,0,0,0.06)"
          strokeWidth={stroke}
        />
        {/* Progress */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease', filter: `drop-shadow(0 0 6px ${glowColor})` }}
        />
      </svg>
      {/* Center label */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <span style={{
          fontSize: '2.2rem', fontWeight: 900,
          color, lineHeight: 1, fontFamily: 'monospace',
          letterSpacing: '-0.03em',
          textShadow: `0 0 20px ${glowColor}`,
        }}>
          {score}
        </span>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-space-grey)', marginTop: '2px' }}>
          / 100
        </span>
      </div>
    </div>
  );
}

// ─── MINI BAR ────────────────────────────────────────────────────────────────
function MiniBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-deep-navy)' }}>{label}</span>
        <span style={{ fontSize: '0.72rem', fontWeight: 800, color, fontFamily: 'monospace' }}>{score}%</span>
      </div>
      <div style={{ height: '6px', borderRadius: '99px', background: 'rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${score}%`, borderRadius: '99px',
          background: `linear-gradient(90deg, ${color}bb, ${color})`,
          transition: 'width 1.2s ease',
          boxShadow: `0 0 6px ${color}55`,
        }} />
      </div>
    </div>
  );
}

// ─── MAIN WIDGET ─────────────────────────────────────────────────────────────
interface CustomerHealthWidgetProps {
  isDark?: boolean;
}

export default function CustomerHealthWidget({ isDark = false }: CustomerHealthWidgetProps) {
  const score  = MOCK_HEALTH_SCORE;
  const status = getStatusConfig(score);
  const Icon   = status.icon;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── Status bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px',
        background: status.bgColor,
        border: `1.5px solid ${status.borderColor}`,
        borderRadius: '10px',
        fontSize: '0.78rem', fontWeight: 700,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: status.color }}>
          <Wifi size={15} />
          <span style={{ fontWeight: 800 }}>IoT AKTIF — Data Terproses</span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          fontSize: '0.65rem', color: '#10b981', fontWeight: 800,
          background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
          borderRadius: '20px', padding: '3px 9px',
        }}>
          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
          TERPANTAU
        </div>
      </div>

      {/* ── Donut + Status Info ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '20px',
        padding: '20px',
        background: status.bgColor,
        border: `1.5px solid ${status.borderColor}`,
        borderRadius: '16px',
        flexWrap: 'wrap',
      }}>
        {/* Chart */}
        <DonutChart score={score} color={status.color} glowColor={status.glowColor} />

        {/* Info */}
        <div style={{ flex: '1 1 160px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Badge status */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', alignSelf: 'flex-start' }}>
            <div style={{
              background: `${status.color}22`, padding: '5px', borderRadius: '8px',
              border: `1px solid ${status.borderColor}`,
            }}>
              <Icon size={16} color={status.color} />
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 900, color: status.color, lineHeight: 1 }}>
                {status.label}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-space-grey)', fontWeight: 600, marginTop: '2px' }}>
                {status.sublabel}
              </div>
            </div>
          </div>

          {/* Indeks label */}
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-space-grey)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '3px' }}>
              Indeks Kesehatan Unit
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: status.color, lineHeight: 1, fontFamily: 'monospace' }}>
              {score}<span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-space-grey)', marginLeft: '2px' }}>%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sub-indicators ── */}
      <div style={{
        padding: '16px',
        background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,31,63,0.03)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,31,63,0.07)'}`,
        borderRadius: '14px',
        display: 'flex', flexDirection: 'column', gap: '12px',
      }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-space-grey)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Rincian Komponen
        </div>
        {MOCK_SECONDARY.map((item) => (
          <MiniBar
            key={item.label}
            label={item.label}
            score={item.score}
            color={getStatusConfig(item.score).color}
          />
        ))}
      </div>

      {/* ── Rekomendasi ── */}
      <div style={{
        display: 'flex', gap: '12px', alignItems: 'flex-start',
        padding: '14px 16px',
        background: 'rgba(46,91,255,0.05)',
        border: '1px solid rgba(46,91,255,0.15)',
        borderRadius: '12px',
      }}>
        <div style={{
          flexShrink: 0, marginTop: '1px',
          background: 'rgba(46,91,255,0.1)', padding: '6px', borderRadius: '8px',
        }}>
          <CheckCircle2 size={16} color="#2E5BFF" />
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#2E5BFF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
            Rekomendasi
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-deep-navy)', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
            {status.recommendation}
          </p>
        </div>
      </div>

      {/* ── Service nudge ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '12px 14px',
        background: 'rgba(245,158,11,0.06)',
        border: '1px solid rgba(245,158,11,0.2)',
        borderRadius: '10px',
      }}>
        <Wrench size={15} color="#f59e0b" style={{ flexShrink: 0 }} />
        <p style={{ fontSize: '0.78rem', color: 'var(--color-deep-navy)', lineHeight: 1.5, margin: 0, fontWeight: 600 }}>
          Ingin menjadwalkan perawatan rutin?{' '}
          <span style={{ color: '#2E5BFF', fontWeight: 700 }}>Gunakan tombol "Request Service" di atas.</span>
        </p>
      </div>

    </div>
  );
}
