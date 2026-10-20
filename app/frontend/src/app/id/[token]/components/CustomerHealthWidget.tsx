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

// ─── SUBSYSTEM CARD (SLIM & COMPACT) ──────────────────────────────────────────
function SubCard({ icon: Icon, label, score, accent }: {
  icon: React.ElementType; label: string; score: number; accent: string; desc?: string;
}) {
  const c = sc(score), lbl = sl(score), pct = Math.min(100, Math.max(0, score));
  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.22)',
      boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.4), inset -1px -1px 3px rgba(255,255,255,0.03)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      borderRadius: 12,
      padding: '10px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      minWidth: 0,
    }}>
      {/* Top: Icon + Title + Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <Icon size={14} color={accent} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '.74rem', fontWeight: 700, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {label}
          </span>
        </div>
        <span style={{ fontSize: '.58rem', fontWeight: 800, color: c, background: `${c}15`, border: `1px solid ${c}30`, borderRadius: 12, padding: '1px 6px', flexShrink: 0 }}>
          {lbl}
        </span>
      </div>

      {/* Middle: Score number */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
        <span style={{ fontSize: '1.35rem', fontWeight: 900, color: c, fontFamily: 'monospace', lineHeight: 1 }}>
          {Math.round(score)}
        </span>
        <span style={{ fontSize: '.68rem', color: '#64748b', fontWeight: 600 }}>/100</span>
      </div>

      {/* Bottom: Mini Progress Bar */}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                Skor 4 Bagian Mesin
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              <SubCard icon={Thermometer} label="Kabinet" score={cabScore} accent="#3b82f6" />
              <SubCard icon={Snowflake} label="Evaporator" score={evapScore} accent="#06b6d4" />
              <SubCard icon={Wind} label="Kondensor" score={condScore} accent="#f97316" />
              <SubCard icon={Zap} label="Kelistrikan" score={elecScore} accent="#8b5cf6" />
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
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: showAnalytics ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.22)',
              color: showAnalytics ? '#f1f5f9' : '#94a3b8',
              fontSize: '.72rem',
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
              letterSpacing: '.03em',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: 'none',
            }}
          >
            <Activity size={13} color={showAnalytics ? '#60a5fa' : '#94a3b8'} />
            <span>{showAnalytics ? 'Tutup Analitik Lanjutan' : 'Analitik Lanjutan'}</span>
            {showAnalytics ? <ChevronUp size={14} color={showAnalytics ? '#60a5fa' : '#94a3b8'} /> : <ChevronDown size={14} color="#94a3b8" />}
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
