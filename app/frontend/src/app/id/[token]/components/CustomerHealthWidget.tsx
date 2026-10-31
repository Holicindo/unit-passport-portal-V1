'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, AlertTriangle, XCircle, Wrench, CheckCircle2,
  Wifi, WifiOff, Loader2, Thermometer, Zap, Wind, Snowflake,
  Activity, TrendingDown, TrendingUp, AlertCircle,
  DoorOpen, RefreshCw, BarChart2, Clock, ChevronDown, ChevronUp,
} from 'lucide-react';
import { healthScoreApi } from '@/lib/api';

// ─── STATUS CONFIG ────────────────────────────────────────────────────────────
function getStatusConfig(score: number) {
  if (score >= 80) return {
    label: 'Mesin Berjalan Baik', sublabel: 'Unit beroperasi dalam kondisi optimal',
    color: '#10b981', bgColor: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.25)', glowColor: 'rgba(16,185,129,0.3)',
    icon: ShieldCheck,
    recommendation: 'Tidak ada indikasi gangguan. Kapasitas pendinginan terjaga dengan baik. Jadwal perawatan rutin berikutnya sesuai rencana.',
  };
  if (score >= 60) return {
    label: 'Perlu Diperhatikan', sublabel: 'Ada tanda-tanda yang perlu segera dicek',
    color: '#f59e0b', bgColor: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.25)', glowColor: 'rgba(245,158,11,0.3)',
    icon: AlertTriangle,
    recommendation: 'Performa sistem pendingin mulai menurun. Disarankan untuk menjadwalkan servis ringan atau pembersihan filter dalam waktu dekat.',
  };
  return {
    label: 'Mesin Butuh Servis', sublabel: 'Perlu penanganan teknisi segera',
    color: '#ef4444', bgColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)', glowColor: 'rgba(239,68,68,0.3)',
    icon: XCircle,
    recommendation: 'Terdapat indikasi penurunan kinerja signifikan. Segera hubungi teknisi Holicindo untuk pemeriksaan dan kemungkinan penggantian komponen.',
  };
}

function sc(score: number) {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}
function sl(score: number) {
  if (score >= 80) return 'BAIK';
  if (score >= 60) return 'PERHATIAN';
  return 'KRITIS';
}

// ─── DONUT CHART (PROPORTIONAL) ──────────────────────────────────────────────
function DonutChart({ score, color }: { score: number; color: string; glowColor?: string }) {
  const size = 120, stroke = 11, r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '1.8rem', fontWeight: 900, color, lineHeight: 1, fontFamily: 'monospace' }}>
          {Math.round(score)}
        </span>
        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', marginTop: 2 }}>/100</span>
      </div>
    </div>
  );
}

// ─── SCORE BREAKDOWN TOOLTIP ───────────────────────────────────────────────────
interface BreakdownItem {
  label: string;
  value: string;
  penaltyPct: number;
  safe: boolean;
}

function ScoreTooltip({ items, score, label }: { items: BreakdownItem[]; score: number; label: string }) {
  const c = sc(score);
  return (
    <div style={{
      position: 'absolute',
      bottom: 'calc(100% + 8px)',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      minWidth: 230,
      maxWidth: 275,
      background: 'rgba(6, 16, 40, 0.98)',
      border: `1px solid ${c}45`,
      borderRadius: 10,
      padding: '10px 12px',
      boxShadow: `0 8px 28px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04)`,
      pointerEvents: 'none',
    }}>
      <div style={{
        position: 'absolute',
        bottom: -7,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 13,
        height: 7,
        overflow: 'hidden',
      }}>
        <div style={{
          width: 13,
          height: 13,
          background: 'rgba(6, 16, 40, 0.98)',
          border: `1px solid ${c}45`,
          transform: 'rotate(45deg)',
          marginTop: -7,
        }} />
      </div>
      <div style={{ fontSize: '.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>
        Rincian — {label}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {items.map((item, i) => {
          const barColor = item.safe ? '#10b981' : item.penaltyPct > 60 ? '#ef4444' : '#f59e0b';
          return (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 3 }}>
                <span style={{ fontSize: '.66rem', fontWeight: 600, color: '#94a3b8', lineHeight: 1.35 }}>{item.label}</span>
                <span style={{ fontSize: '.68rem', fontWeight: 800, color: barColor, flexShrink: 0, fontFamily: 'monospace' }}>{item.value}</span>
              </div>
              <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${item.penaltyPct}%`, borderRadius: 99, background: barColor, transition: 'width 0.6s ease' }} />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 8, paddingTop: 7, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '.6rem', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>Skor</span>
        <span style={{ fontSize: '.82rem', fontWeight: 900, color: c, fontFamily: 'monospace' }}>{Math.round(score)}<span style={{ fontSize: '.6rem', color: '#64748b' }}>/100</span></span>
      </div>
    </div>
  );
}

// ─── SUBSYSTEM CARD (SLIM & COMPACT, HOVER TOOLTIP) ──────────────────────────
function SubCard({ label, score, accent, breakdown }: {
  label: string; score: number; accent: string; breakdown: BreakdownItem[];
}) {
  const [hovered, setHovered] = useState(false);
  const c = sc(score), lbl = sl(score), pct = Math.min(100, Math.max(0, score));
  return (
    <div
      style={{
        background: 'rgba(0, 0, 0, 0.22)',
        boxShadow: hovered
          ? `inset 1px 1px 3px rgba(0,0,0,0.4), inset -1px -1px 3px rgba(255,255,255,0.03), 0 0 0 1px ${accent}35`
          : 'inset 1px 1px 3px rgba(0,0,0,0.4), inset -1px -1px 3px rgba(255,255,255,0.03)',
        border: hovered ? `1px solid ${accent}50` : '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        minWidth: 0,
        position: 'relative',
        cursor: 'default',
        transition: 'border 0.15s ease, box-shadow 0.15s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered && (breakdown ?? []).length > 0 && (
        <ScoreTooltip items={breakdown} score={score} label={label} />
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <span style={{ fontSize: '.74rem', fontWeight: 700, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {label}
        </span>
        <span style={{ fontSize: '.58rem', fontWeight: 800, color: c, background: `${c}15`, border: `1px solid ${c}30`, borderRadius: 12, padding: '1px 6px', flexShrink: 0 }}>
          {lbl}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
        <span style={{ fontSize: '1.35rem', fontWeight: 900, color: c, fontFamily: 'monospace', lineHeight: 1 }}>
          {Math.round(score)}
        </span>
        <span style={{ fontSize: '.68rem', color: '#64748b', fontWeight: 600 }}>/100</span>
      </div>
      <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: c, transition: 'width 1s ease' }} />
      </div>
    </div>
  );
}

// ─── EVIDENCE BAR ─────────────────────────────────────────────────────────────
function EvidenceBar({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  const pct = Math.min(100, Math.max(0, value * 100));
  const c = value > 0.6 ? '#ef4444' : value > 0.3 ? '#f59e0b' : '#10b981';
  const lbl = value > 0.6 ? 'Tinggi' : value > 0.3 ? 'Sedang' : 'Rendah';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Icon size={11} color={c} />
          <span style={{ fontSize: '.72rem', fontWeight: 700, color: '#f1f5f9' }}>{label}</span>
        </div>
        <span style={{ fontSize: '.65rem', fontWeight: 800, color: c }}>{lbl} ({pct.toFixed(0)}%)</span>
      </div>
      <div style={{ height: 5, borderRadius: 99, background: 'rgba(0,0,0,.25)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: `linear-gradient(90deg,${c}88,${c})`, transition: 'width 1.2s ease' }} />
      </div>
    </div>
  );
}

// ─── METRIC PILL ──────────────────────────────────────────────────────────────
function MetricPill({ icon: Icon, label, value, sub, good }: {
  icon: React.ElementType; label: string; value: string; sub: string; good: boolean;
}) {
  const c = good ? '#10b981' : '#f59e0b';
  return (
    <div style={{ background: 'var(--color-deep-navy, #0D2B5E)', boxShadow: 'inset -2px -2px 4px rgba(255,255,255,.05),inset 2px 2px 4px rgba(0,0,0,.4)', borderRadius: 12, padding: '11px 12px', display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <Icon size={12} color={c} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      </div>
      <span style={{ fontSize: '1.25rem', fontWeight: 900, color: c, fontFamily: 'monospace', lineHeight: 1.1 }}>{value}</span>
      <span style={{ fontSize: '.63rem', color: '#cbd5e1', fontWeight: 600, lineHeight: 1.3 }}>{sub}</span>
    </div>
  );
}

// ─── SECTION HEADER ───────────────────────────────────────────────────────────
function SectionHeader({ title, badge }: { title: string; badge?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: '.68rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.07em' }}>{title}</span>
      {badge && (
        <span style={{ fontSize: '.6rem', fontWeight: 800, color: '#60a5fa', background: 'rgba(96,165,250,.1)', border: '1px solid rgba(96,165,250,.2)', borderRadius: 20, padding: '2px 8px' }}>{badge}</span>
      )}
    </div>
  );
}

const neuBox = {
  background: 'var(--color-deep-navy, #0D2B5E)',
  boxShadow: '-4px -4px 10px rgba(255,255,255,.05), 4px 4px 10px rgba(0,0,0,.4)',
  borderRadius: 16, padding: '16px 18px', display: 'flex', flexDirection: 'column' as const, gap: 13,
};

// ─── MAIN WIDGET ─────────────────────────────────────────────────────────────
interface Props { unitId?: string; }

export default function CustomerHealthWidget({ unitId }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    if (!unitId) { setLoading(false); return; }
    healthScoreApi.getByUnitId(unitId)
      .then(r => setData(r.data || null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [unitId]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10, color: '#94a3b8' }}>
      <Loader2 size={18} className="animate-spin" />
      <span style={{ fontSize: '.84rem', fontWeight: 600 }}>Memuat data kesehatan mesin...</span>
    </div>
  );

  if (!data?.overall_score && data?.overall_score !== 0) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 15px', background: 'rgba(148,163,184,.07)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 12 }}>
      <WifiOff size={15} color="#94A3B8" />
      <div>
        <div style={{ fontSize: '.82rem', fontWeight: 700, color: 'var(--color-deep-navy)' }}>Data Kesehatan Belum Tersedia</div>
        <div style={{ fontSize: '.7rem', color: '#94a3b8', marginTop: 2 }}>Analisis pertama berjalan otomatis setiap jam. Pastikan unit sudah terhubung ke perangkat IoT.</div>
      </div>
    </div>
  );

  const score    = Number(data.overall_score ?? 0);
  const status   = getStatusConfig(score);
  const Icon     = status.icon;
  const conf     = Number(data.confidence_score ?? 0);
  const lc       = data.lifecycle_state ?? 'LEARNING';

  // Subsystem scores
  const cabScore  = Number(data.sub_cabinet_score    ?? 0);
  const evapScore = Number(data.sub_evaporator_score ?? 0);
  const condScore = Number(data.sub_condenser_score  ?? 0);
  const elecScore = Number(data.sub_electrical_score ?? 0);
  const baseScore = Number(data.sub_baseline_score   ?? 100);

  // Evidence
  const evCond = Number(data.evidence_condenser_issue  ?? 0);
  const evEvap = Number(data.evidence_evaporator_issue ?? 0);
  const evWeak = Number(data.evidence_weak_cooling     ?? 0);
  const hasAlert = evCond > 0.5 || evEvap > 0.5 || evWeak > 0.5;

  // Metrik operasional
  const tib     = Number(data.tib_percentage        ?? 0);
  const hdm     = Number(data.hdm_value             ?? 0);
  const duty    = Number(data.duty_cycle_percentage ?? 0);
  const starts  = Number(data.starts_per_hour       ?? 0);

  // V4 baru
  const doorRec     = Number(data.door_avg_recovery_min    ?? 0);
  const doorEvt     = Number(data.door_event_count         ?? 0);
  const voltAnomaly = Number(data.voltage_anomaly_ratio    ?? 0);
  const defCycles   = Number(data.defrost_cycle_count      ?? 0);
  const defAnomaly  = Number(data.defrost_anomaly_fraction ?? 0);
  const blTIBDelta  = Number(data.baseline_tib_delta       ?? 0);
  const blCoolDelta = Number(data.baseline_cooling_delta   ?? 0);

  const lcLabel = lc === 'ACTIVE' ? 'Aktif' : lc === 'PROVISIONAL' ? 'Awal Operasi' : 'Pembelajaran';

  // ── Breakdown per sub-sistem (untuk tooltip) ──────────────────────────────
  // ── Variabel tambahan dari data untuk tooltip ─────────────────────────────
  const evapCoolRate  = Number(data.evap_cooling_rate   ?? 0);
  const evapDropAmp   = Number(data.evap_drop_amplitude ?? 0);
  const cabEvapDiff   = Number(data.cab_evap_diff       ?? 0);
  const condPeak      = Number(data.condenser_peak      ?? 0);
  const condRise      = Number(data.condenser_rise      ?? 0);
  const cabCoolRate   = Number(data.cabinet_cooling_rate ?? 0);

  // Helper: 0 = aman (hijau), 100 = kritis (merah)
  function lp(val: number, safe: number, crit: number): number {
    if (safe < crit) {
      if (val <= safe) return 0;
      if (val >= crit) return 100;
      return Math.round(((val - safe) / (crit - safe)) * 100);
    } else {
      if (val >= safe) return 0;
      if (val <= crit) return 100;
      return Math.round(((safe - val) / (safe - crit)) * 100);
    }
  }

  // ── KABINET: Seberapa baik suhu ruang dalam terjaga ─────────────────────
  // ── KABINET: Seberapa baik suhu ruang dalam terjaga ─────────────────────
  const cabBreakdown: BreakdownItem[] = [
    {
      label: tib >= 95 ? `Suhu kabinet selalu stabil (${tib.toFixed(0)}% waktu dalam batas aman)` : `Suhu kabinet sempat keluar batas aman`,
      value: `${tib.toFixed(1)}%`, penaltyPct: lp(tib, 95, 70), safe: tib >= 95,
    },
    {
      label: hdm <= 1.0 ? `Panas berlebih sangat rendah — suhu terjaga prima` : `Mesin sering kepanasan (${hdm.toFixed(1)} unit/jam)`,
      value: `${hdm.toFixed(2)}`, penaltyPct: lp(hdm, 1.0, 5.0), safe: hdm <= 1.0,
    },
    {
      label: cabCoolRate >= 0.20 ? `Kecepatan pendinginan kabinet cepat & stabil` : `Pendinginan awal kabinet bekerja normal`,
      value: cabCoolRate > 0 ? `${cabCoolRate.toFixed(2)} °C/mnt` : `Optimal`, penaltyPct: 0, safe: true,
    },
    {
      label: doorRec > 0 ? `Suhu cepat normal kembali setelah pintu dibuka-tutup` : `Pintu tertutup rapat sepanjang pemantauan`,
      value: doorRec > 0 ? `${doorRec.toFixed(0)} mnt` : `Stabil`, penaltyPct: 0, safe: true,
    },
  ];

  // ── EVAPORATOR: Performa sirkulasi dingin dalam mesin ────────────────────
  const evapBreakdown: BreakdownItem[] = [
    {
      label: duty >= 92 ? `Kompresor bekerja hampir non-stop tanpa jeda istirahat (beban kerja sangat tinggi)` : evapCoolRate >= 0.30 ? `Evaporator mendinginkan dengan baik` : evapCoolRate === 0 ? `Data siklus evaporator masih dikumpulkan` : `Laju pendinginan evaporator membutuhkan waktu lebih lama`,
      value: duty >= 92 ? `Beban Kritis` : evapCoolRate > 0 ? `${evapCoolRate.toFixed(2)} °C/mnt` : `Terpantau`, penaltyPct: duty >= 92 ? 70 : evapCoolRate === 0 ? 0 : lp(evapCoolRate, 0.30, 0.05), safe: duty < 92,
    },
    {
      label: evapDropAmp >= 8 ? `Penurunan suhu evaporator per siklus normal - ${evapDropAmp.toFixed(1)}°C (target >= 8°C)` : evapDropAmp > 0 ? `Penurunan suhu evaporator kurang optimal (${evapDropAmp.toFixed(1)}°C)` : `Penurunan suhu evaporator dalam batas normal`,
      value: evapDropAmp > 0 ? `${evapDropAmp.toFixed(1)} °C` : `Normal`, penaltyPct: lp(evapDropAmp, 8, 2), safe: evapDropAmp >= 8,
    },
    {
      label: cabEvapDiff <= 15 ? `Selisih suhu kabinet vs evaporator ${cabEvapDiff.toFixed(1)}°C - sirkulasi udara merata` : `Selisih suhu kabinet vs evaporator ${cabEvapDiff.toFixed(1)}°C - perlu cek sirkulasi`,
      value: cabEvapDiff > 0 ? `${cabEvapDiff.toFixed(1)} °C` : `Normal`, penaltyPct: lp(cabEvapDiff, 15, 25), safe: cabEvapDiff <= 15,
    },
    {
      label: defCycles > 0 ? (defAnomaly <= 0.10 ? `Siklus pencairan es (defrost) terpantau ${defCycles}x - berjalan normal standar` : `Siklus defrost terpantau ${defCycles}x namun ${(defAnomaly*100).toFixed(0)}% ada anomali`) : `Belum ada siklus defrost dalam rentang pemantauan ini`,
      value: defCycles > 0 ? `${defCycles}x (${(defAnomaly * 100).toFixed(0)}% anomali)` : `0x (Normal)`, penaltyPct: lp(defAnomaly, 0.10, 0.60), safe: defAnomaly <= 0.10,
    },
  ];

  // ── KONDENSOR: Pembuangan panas ke luar mesin ────────────────────────────
  const condBreakdown: BreakdownItem[] = [
    {
      label: condPeak > 0 ? (condPeak <= 45 ? `Puncak suhu kondensor ${condPeak.toFixed(0)}°C - dingin & efisien` : condPeak <= 60 ? `Puncak suhu kondensor ${condPeak.toFixed(0)}°C - normal untuk pabrik` : `Puncak suhu kondensor ${condPeak.toFixed(0)}°C - terlalu panas`) : `Pembuangan panas kondensor lancar`,
      value: condPeak > 0 ? `${condPeak.toFixed(1)} °C` : `Normal`, penaltyPct: lp(condPeak, 45, 60), safe: condPeak <= 45,
    },
    {
      label: condRise > 0 ? (condRise <= 35 ? `Kenaikan suhu kondensor per siklus ${condRise.toFixed(0)}°C - normal untuk pabrik` : condRise <= 50 ? `Kenaikan suhu kondensor ${condRise.toFixed(0)}°C - sedikit tinggi, cek ventilasi` : `Kenaikan suhu kondensor ${condRise.toFixed(0)}°C - kondensor perlu dibersihkan`) : `Ventilasi & fan kondensor berputar stabil`,
      value: condRise > 0 ? `${condRise.toFixed(1)} °C` : `Lancar`, penaltyPct: lp(condRise, 35, 50), safe: condRise <= 35,
    },
  ];

  // ── KELISTRIKAN: Kondisi kerja kompresor dan tegangan ───────────────────
  const elecBreakdown: BreakdownItem[] = [
    {
      label: duty <= 75 ? `Kompresor bekerja proporsional (${duty.toFixed(0)}% aktif) - efisiensi baik` : duty <= 92 ? `Kompresor aktif ${duty.toFixed(0)}% waktu - normal untuk kondisi pabrik panas` : `Kompresor bekerja hampir non-stop (${duty.toFixed(0)}%) - perlu investigasi`,
      value: `${duty.toFixed(1)}%`, penaltyPct: lp(duty, 75, 92), safe: duty <= 75,
    },
    {
      label: starts <= 8 ? `Frekuensi nyala-mati kompresor ${starts.toFixed(1)}x/jam - normal stabil` : starts <= 20 ? `Frekuensi nyala-mati ${starts.toFixed(1)}x/jam - sedikit tinggi (adaptasi suhu/beban)` : duty >= 70 ? `Siklus ${starts.toFixed(1)}x/jam terpantau tinggi saat unit baru menyala/pendinginan awal. Solusi: Aman, biarkan beroperasi normal 1-2 jam hingga suhu stabil.` : `Frekuensi ${starts.toFixed(1)}x/jam terlalu sering (short-cycle). Solusi: Cek pengaturan thermostat, relay kontak, atau tekanan freon.`, 
      value: `${starts.toFixed(1)}x/jam`, penaltyPct: lp(starts, 8, 20), safe: starts <= 8,
    },
    {
      label: voltAnomaly <= 0.05 ? `Tegangan listrik stabil (${(voltAnomaly*100).toFixed(1)}% variasi - dalam batas normal PLN)` : voltAnomaly <= 0.20 ? `Tegangan sedikit berfluktuasi (${(voltAnomaly*100).toFixed(1)}%) - pantau jika terus berlanjut` : `Tegangan tidak stabil (${(voltAnomaly*100).toFixed(1)}%) - beban berat bagi motor kompresor`,
      value: `${(voltAnomaly * 100).toFixed(1)}%`, penaltyPct: lp(voltAnomaly, 0.05, 0.20), safe: voltAnomaly <= 0.05,
    },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── STATUS BAR ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', background: 'var(--color-deep-navy, #0D2B5E)', boxShadow: 'inset -2px -2px 5px rgba(255,255,255,.05),inset 2px 2px 5px rgba(0,0,0,.4)', borderRadius: 11, fontSize: '.76rem', fontWeight: 700 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: status.color }}>
          <Wifi size={14} />
          <span>IoT Aktif — Analisis Kesehatan Mesin</span>
        </div>
        <span style={{ fontSize: '.62rem', fontWeight: 800, background: lc === 'ACTIVE' ? 'rgba(16,185,129,.1)' : 'rgba(245,158,11,.1)', color: lc === 'ACTIVE' ? '#10b981' : '#f59e0b', border: `1px solid ${lc === 'ACTIVE' ? 'rgba(16,185,129,.25)' : 'rgba(245,158,11,.25)'}`, borderRadius: 20, padding: '3px 9px' }}>
          {lcLabel}
        </span>
      </div>

      {/* ── KESEHATAN UTAMA & SKOR 4 BAGIAN MESIN (ULTRA COMPACT SIDE-BY-SIDE) ── */}
      <div style={{ ...neuBox, padding: '16px 18px', gap: 14 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
          alignItems: 'center',
        }}>
          {/* Kolom Kiri: Donut & Status Langsung Menyatu (Tanpa Wrapper Kotak Berlapis) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '4px 6px',
            minWidth: 0,
          }}>
            <DonutChart score={score} color={status.color} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Icon size={16} color={status.color} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '.95rem', fontWeight: 900, color: status.color, lineHeight: 1.2 }}>
                  {status.label}
                </span>
              </div>
              <div style={{ fontSize: '.72rem', color: '#94a3b8', fontWeight: 500, lineHeight: 1.35 }}>
                {status.sublabel}
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: '.62rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  Akurasi
                </span>
                <span style={{ fontSize: '.65rem', fontWeight: 700, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '1px 7px', borderRadius: 10 }}>
                  {(conf * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: 4 Subsistem Grid (2x2 Compact) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflow: 'visible' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                Skor 4 Bagian Mesin
              </span>
              <span style={{ fontSize: '.58rem', color: '#475569', fontWeight: 600 }}>Arahkan kursor untuk detail</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, overflow: 'visible' }}>
              <SubCard label="Kabinet"    score={cabScore}  accent="#3b82f6" breakdown={cabBreakdown} />
              <SubCard label="Evaporator" score={evapScore} accent="#06b6d4" breakdown={evapBreakdown} />
              <SubCard label="Kondensor"  score={condScore} accent="#f97316" breakdown={condBreakdown} />
              <SubCard label="Kelistrikan" score={elecScore} accent="#8b5cf6" breakdown={elecBreakdown} />
            </div>
          </div>
        </div>

        {/* Toggle Button: Analitik Lanjutan */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 2 }}>
          <button
            type="button"
            onClick={() => setShowAnalytics(!showAnalytics)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '6px 16px',
              borderRadius: 20,
              border: showAnalytics ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(46, 91, 255, 0.4)',
              background: showAnalytics 
                ? 'linear-gradient(135deg, #1d4ed8, #1e40af)' 
                : 'linear-gradient(135deg, #2E5BFF, #1a3fd4)',
              color: '#ffffff',
              fontSize: '.72rem',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              letterSpacing: '.03em',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '-2px -2px 6px rgba(255, 255, 255, 0.1), 3px 3px 8px rgba(0, 0, 0, 0.35), 0 3px 10px rgba(46, 91, 255, 0.35)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.filter = 'brightness(1.1)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.filter = 'none';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <Activity size={13} color="#ffffff" />
            <span>{showAnalytics ? 'Tutup Analitik Lanjutan' : 'Analitik Lanjutan'}</span>
            {showAnalytics ? <ChevronUp size={14} color="#ffffff" /> : <ChevronDown size={14} color="#ffffff" />}
          </button>
        </div>
      </div>

      {/* ── 2 CARD ANALITIK YANG DI-HIDE / DITAMPILKAN KETIKA BUTTON DIKLIK ── */}
      {showAnalytics && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'fadeIn 0.3s ease' }}>
          {/* 1. ANALITIK V4 BARU */}
          <div style={neuBox}>
            <SectionHeader title="Analitik Lanjutan" badge="V4" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 10 }}>
              <MetricPill icon={DoorOpen} label="Pemulihan Suhu Pintu" value={doorRec > 0 ? `${doorRec.toFixed(1)} mnt` : 'N/A'} sub={`${doorEvt} kali pintu dibuka hari ini`} good={doorRec <= 15} />
              <MetricPill icon={RefreshCw} label="Siklus Defrost" value={`${defCycles}x`} sub={`Tidak normal: ${(defAnomaly*100).toFixed(0)}%`} good={defAnomaly <= 0.1} />
              <MetricPill icon={Zap} label="Gangguan Tegangan Listrik" value={`${(voltAnomaly*100).toFixed(1)}%`} sub="Batas aman: 195V – 245V" good={voltAnomaly <= 0.02} />
              <MetricPill icon={TrendingDown} label="Penurunan Performa vs Awal" value={blTIBDelta > 0 ? `-${blTIBDelta.toFixed(1)}%` : '0%'} sub={`Laju pendinginan turun ${blCoolDelta.toFixed(2)} °C/mnt`} good={blTIBDelta <= 5} />
            </div>
          </div>

          {/* 2. METRIK OPERASIONAL HARIAN */}
          <div style={neuBox}>
            <SectionHeader title="Metrik Operasional Harian" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 10 }}>
              <MetricPill icon={Activity} label="Waktu Suhu dalam Target" value={`${tib.toFixed(1)}%`} sub="Target: ≥ 95%" good={tib >= 95} />
              <MetricPill icon={TrendingUp} label="Akumulasi Panas Berlebih / Jam" value={`${hdm.toFixed(1)} °C·mnt`} sub="Target: ≤ 1.0" good={hdm <= 1} />
              <MetricPill icon={Zap} label="Waktu Kompresor Menyala" value={`${duty.toFixed(1)}%`} sub="Target: ≤ 60%" good={duty <= 60} />
              <MetricPill icon={Activity} label="Frekuensi Nyala Kompresor / Jam" value={`${starts.toFixed(1)}x`} sub="Target: ≤ 4x/jam" good={starts <= 4} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
