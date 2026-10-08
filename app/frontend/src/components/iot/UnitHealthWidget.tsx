'use client';

import React, { useEffect, useState } from 'react';
import {
  ShieldCheck, AlertTriangle, XCircle, Activity,
  Thermometer, Zap, Wind, Snowflake, BarChart2,
  DoorOpen, RefreshCw, TrendingDown, TrendingUp,
  Wifi, WifiOff, Loader2, Clock, Gauge,
} from 'lucide-react';
import { healthScoreApi } from '@/lib/api';

interface UnitHealthWidgetProps {
  unitId: string;
  serialNumber?: string;
}

function scoreColor(score: number) {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}
function scoreLabel(score: number) {
  if (score >= 80) return 'OPTIMAL';
  if (score >= 60) return 'PERHATIAN';
  return 'KRITIS';
}

// ─── SUBSYSTEM BAR ────────────────────────────────────────────────────────────
function SubRow({ icon: Icon, label, score, accent }: {
  icon: React.ElementType; label: string; score: number; accent: string;
}) {
  const c = scoreColor(score);
  const pct = Math.min(100, Math.max(0, score));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 28, height: 28, borderRadius: 7, flexShrink: 0,
        background: 'var(--color-deep-navy, #0D2B5E)',
        boxShadow: '-2px -2px 4px rgba(255,255,255,.05),2px 2px 4px rgba(0,0,0,.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={13} color={accent} />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '.72rem', fontWeight: 700, color: '#f1f5f9' }}>{label}</span>
          <span style={{ fontSize: '.7rem', fontWeight: 900, color: c, fontFamily: 'monospace' }}>
            {Math.round(score)}<span style={{ fontWeight: 500, fontSize: '.6rem', color: '#94a3b8' }}>/100</span>
          </span>
        </div>
        <div style={{ height: 5, borderRadius: 99, background: 'rgba(0,0,0,.25)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: `linear-gradient(90deg,${c}88,${c})`, transition: 'width 1s ease' }} />
        </div>
      </div>
    </div>
  );
}

// ─── COMPACT METRIC CARD ──────────────────────────────────────────────────────
function CMet({ label, value, unit, good, desc }: {
  label: string; value: string; unit?: string; good: boolean; desc?: string;
}) {
  const c = good ? '#10b981' : '#f59e0b';
  return (
    <div style={{
      background: 'var(--color-deep-navy, #0D2B5E)',
      boxShadow: 'inset -2px -2px 4px rgba(255,255,255,.05),inset 2px 2px 4px rgba(0,0,0,.4)',
      borderRadius: 10, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 3,
    }}>
      <div style={{ fontSize: '.6rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em', lineHeight: 1.3 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
        <span style={{ fontSize: '1.1rem', fontWeight: 900, color: c, fontFamily: 'monospace', lineHeight: 1.1 }}>{value}</span>
        {unit && <span style={{ fontSize: '.65rem', color: '#cbd5e1', fontWeight: 600 }}>{unit}</span>}
      </div>
      {desc && <div style={{ fontSize: '.6rem', color: '#94a3b8', fontWeight: 500, lineHeight: 1.4 }}>{desc}</div>}
    </div>
  );
}

// ─── EVIDENCE BAR ─────────────────────────────────────────────────────────────
function EvidRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  const c = value > 0.6 ? '#ef4444' : value > 0.3 ? '#f59e0b' : '#10b981';
  const pct = Math.min(100, value * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Icon size={11} color={c} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, height: 5, borderRadius: 99, background: 'rgba(0,0,0,.25)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: c, transition: 'width 1s ease' }} />
      </div>
      <span style={{ fontSize: '.65rem', fontWeight: 800, color: c, width: 34, textAlign: 'right', flexShrink: 0 }}>
        {pct.toFixed(0)}%
      </span>
      <span style={{ fontSize: '.65rem', color: '#cbd5e1', fontWeight: 600, minWidth: 80, lineHeight: 1.3 }}>{label}</span>
    </div>
  );
}

// ─── SECTION LABEL ────────────────────────────────────────────────────────────
function SecLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontSize: '.62rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.07em' }}>
      {children}
    </span>
  );
}

const neuBox = {
  background: 'var(--color-deep-navy, #0D2B5E)',
  boxShadow: '-4px -4px 10px rgba(255,255,255,0.05), 4px 4px 10px rgba(0,0,0,0.4)',
  borderRadius: 14, padding: '13px 15px', display: 'flex', flexDirection: 'column' as const, gap: 10,
};

// ─── MAIN WIDGET ─────────────────────────────────────────────────────────────
export default function UnitHealthWidget({ unitId }: UnitHealthWidgetProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchHealth = async () => {
    try {
      const { data: res } = await healthScoreApi.getByUnitId(unitId);
      setData(res || null);
      setLastUpdate(new Date());
    } catch { setData(null); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchHealth();
    const iv = setInterval(fetchHealth, 60000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitId]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 36 }}>
      <Loader2 size={22} className="animate-spin" style={{ color: '#94a3b8' }} />
    </div>
  );

  if (!data?.overall_score && data?.overall_score !== 0) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '28px 16px', color: '#94a3b8', textAlign: 'center' }}>
      <WifiOff size={30} strokeWidth={1.5} />
      <div style={{ fontSize: '.85rem', fontWeight: 700, color: 'var(--color-deep-navy)' }}>Health Score V4 Belum Tersedia</div>
      <div style={{ fontSize: '.72rem', lineHeight: 1.6 }}>Kalkulasi berjalan otomatis setiap jam.<br />Pastikan unit aktif & terhubung IoT.</div>
    </div>
  );

  const score = Number(data.overall_score ?? 0);
  const conf = Number(data.confidence_score ?? 0);
  const lc = data.lifecycle_state ?? 'LEARNING';
  const c = scoreColor(score);
  const lbl = scoreLabel(score);

  // Subsystem
  const cabScore = Number(data.sub_cabinet_score ?? 0);
  const evapScore = Number(data.sub_evaporator_score ?? 0);
  const condScore = Number(data.sub_condenser_score ?? 0);
  const elecScore = Number(data.sub_electrical_score ?? 0);
  const baseScore = Number(data.sub_baseline_score ?? 100);

  // Metrik operasional
  const tib = Number(data.tib_percentage ?? 0);
  const hdm = Number(data.hdm_value ?? 0);
  const duty = Number(data.duty_cycle_percentage ?? 0);
  const starts = Number(data.starts_per_hour ?? 0);

  // V4 spesifik
  const doorRec = Number(data.door_avg_recovery_min ?? 0);
  const doorEvt = Number(data.door_event_count ?? 0);
  const voltAno = Number(data.voltage_anomaly_ratio ?? 0);
  const defCycles = Number(data.defrost_cycle_count ?? 0);
  const defAno = Number(data.defrost_anomaly_fraction ?? 0);
  const blTIB = Number(data.baseline_tib_delta ?? 0);
  const blCool = Number(data.baseline_cooling_delta ?? 0);

  // Evidence
  const evCond = Number(data.evidence_condenser_issue ?? 0);
  const evEvap = Number(data.evidence_evaporator_issue ?? 0);
  const evWeak = Number(data.evidence_weak_cooling ?? 0);

  const StatusIcon = score >= 80 ? ShieldCheck : score >= 60 ? AlertTriangle : XCircle;

  // Donut
  const r = 45, circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ── STATUS BAR ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--color-deep-navy, #0D2B5E)', boxShadow: 'inset -2px -2px 4px rgba(255,255,255,.05),inset 2px 2px 4px rgba(0,0,0,.4)', borderRadius: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '.72rem', fontWeight: 800, color: c }}>
          <Wifi size={13} />
          <span>Health Score V4 — IoT Aktif</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '.6rem', fontWeight: 800, color: lc === 'ACTIVE' ? '#10b981' : '#f59e0b', background: lc === 'ACTIVE' ? 'rgba(16,185,129,.1)' : 'rgba(245,158,11,.1)', border: `1px solid ${lc === 'ACTIVE' ? 'rgba(16,185,129,.25)' : 'rgba(245,158,11,.25)'}`, borderRadius: 20, padding: '2px 7px' }}>
            {lc === 'ACTIVE' ? 'Aktif' : lc === 'PROVISIONAL' ? 'Awal Operasi' : 'Pembelajaran'}
          </span>
          <span style={{ fontSize: '.58rem', color: '#94a3b8', fontWeight: 600 }}>
            {lastUpdate ? lastUpdate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
          </span>
        </div>
      </div>

      {/* ── SKOR + SUBSISTEM ── */}
      <div style={{ ...neuBox, flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>

        {/* Donut & Score */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <div style={{ position: 'relative', width: 104, height: 104 }}>
            <svg width={104} height={104} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={52} cy={52} r={r} fill="none" stroke="rgba(0,0,0,.25)" strokeWidth={12} />
              <circle cx={52} cy={52} r={r} fill="none" stroke={c} strokeWidth={12}
                strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 1s ease' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.65rem', fontWeight: 900, color: c, fontFamily: 'monospace', lineHeight: 1 }}>{Math.round(score)}</span>
              <span style={{ fontSize: '.6rem', color: '#94a3b8', fontWeight: 600 }}>/100</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <StatusIcon size={12} color={c} />
            <span style={{ fontSize: '.68rem', fontWeight: 800, color: c }}>{lbl}</span>
          </div>
          <span style={{ fontSize: '.58rem', color: '#94a3b8', fontWeight: 600 }}>
            Keakuratan: {(conf * 100).toFixed(0)}%
          </span>
        </div>

        {/* 5 Subsystem Bars */}
        <div style={{ flex: '1 1 160px', display: 'flex', flexDirection: 'column', gap: 7 }}>
          <SecLabel>Skor Per Subsistem</SecLabel>
          {/* Label menggunakan nama teknis + deskripsi fungsi */}
          <SubRow icon={Thermometer} label="Kabinet" score={cabScore} accent="#3b82f6" />
          <SubRow icon={Snowflake} label="Evaporator" score={evapScore} accent="#06b6d4" />
          <SubRow icon={Wind} label="Kondensor" score={condScore} accent="#f97316" />
          <SubRow icon={Zap} label="Kelistrikan & Kompresor" score={elecScore} accent="#8b5cf6" />
          <SubRow icon={BarChart2} label="Performa vs Awal Aktivasi" score={baseScore} accent="#ec4899" />
        </div>
      </div>

      {/* ── METRIK V4 BARU ── */}
      <div style={neuBox}>
        <SecLabel>Analitik V4 — Fitur Lanjutan</SecLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 7 }}>
          <CMet
            label="Pemulihan Suhu Setelah Pintu Dibuka"
            value={doorRec > 0 ? doorRec.toFixed(1) : 'N/A'}
            unit={doorRec > 0 ? 'menit' : undefined}
            good={doorRec <= 15 || doorRec === 0}
            desc={`${doorEvt}x pintu dibuka hari ini`}
          />
          <CMet
            label="Siklus Defrost Tidak Normal"
            value={`${(defAno * 100).toFixed(0)}%`}
            good={defAno <= 0.1}
            desc={`Total ${defCycles} siklus pencairan terdeteksi`}
          />
          <CMet
            label="Gangguan Tegangan Listrik"
            value={`${(voltAno * 100).toFixed(1)}%`}
            unit="pembacaan anomali"
            good={voltAno <= 0.02}
            desc="Batas normal: 180V – 250V"
          />
          <CMet
            label="Penurunan Performa vs Awal"
            value={blTIB > 0 ? `-${blTIB.toFixed(1)}%` : '0%'}
            good={blTIB <= 5}
            desc={`Laju pendinginan turun ${blCool.toFixed(2)} °C/mnt`}
          />
        </div>
      </div>

      {/* ── METRIK OPERASIONAL ── */}
      <div style={neuBox}>
        <SecLabel>Metrik Operasional Harian</SecLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 7 }}>
          <CMet
            label="Waktu Suhu dalam Target (%)"
            value={`${tib.toFixed(1)}`}
            unit="%"
            good={tib >= 95}
            desc="Target ≥ 95% (batas aman)"
          />
          <CMet
            label="Akumulasi Panas Berlebih / Jam"
            value={`${hdm.toFixed(1)}`}
            unit="°C·mnt"
            good={hdm <= 1}
            desc="Target ≤ 1.0 (batas aman)"
          />
          <CMet
            label="Waktu Kompresor Menyala (%)"
            value={`${duty.toFixed(1)}`}
            unit="%"
            good={duty <= 60}
            desc="Target ≤ 60% (batas aman)"
          />
          <CMet
            label="Frekuensi Nyala Kompresor / Jam"
            value={`${starts.toFixed(1)}`}
            unit="x/jam"
            good={starts <= 4}
            desc="Target ≤ 4x/jam (batas aman)"
          />
        </div>
      </div>

      {/* ── INDIKASI MASALAH (EVIDENCE) ── */}
      <div style={neuBox}>
        <SecLabel>Indikasi Masalah (Berdasarkan Analisis Multi-Sensor)</SecLabel>
        <EvidRow icon={Wind} label="Kondensor" value={evCond} />
        <EvidRow icon={Snowflake} label="Evaporator" value={evEvap} />
        <EvidRow icon={TrendingDown} label="Pendinginan Tidak Optimal" value={evWeak} />
        <div style={{ fontSize: '.65rem', color: '#94a3b8', padding: '6px 8px', background: 'rgba(0,0,0,.2)', borderRadius: 7, lineHeight: 1.5 }}>
          Nilai 0% = tidak ada indikasi masalah &nbsp;|&nbsp; Nilai merah (&gt;60%) = komponen perlu diperiksa teknisi
        </div>
      </div>

    </div>
  );
}
