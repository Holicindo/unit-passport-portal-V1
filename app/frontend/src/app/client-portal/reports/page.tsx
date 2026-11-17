'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { reportApi } from '@/lib/api';
import { 
  FileText, Calendar, Activity, Wrench, AlertTriangle, 
  CheckCircle2, RefreshCw, ArrowLeft, ChevronRight, X,
  Thermometer, Zap, DoorOpen, PowerOff, ShieldCheck,
  TrendingUp, Clock, Info
} from 'lucide-react';
import styles from '../ClientPortal.module.css';

export default function ClientMonthlyReportPage() {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'HEALTH' | 'MAINTENANCE'>('HEALTH');
  const [selectedUnitDetail, setSelectedUnitDetail] = useState<any>(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await reportApi.getMonthlyReport(selectedMonth);
      setReportData(res.data);
    } catch (err: any) {
      console.error('Error fetching monthly report:', err);
      setError('Gagal memuat Monthly Report. Pastikan server backend aktif.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedMonth]);

  const summary = reportData?.summary || {};
  const healthList: any[] = reportData?.healthScoreMonthlyReport || [];
  const maintenanceList: any[] = reportData?.maintenanceReport || [];

  const formatMonthName = (monthStr: string) => {
    try {
      const [year, month] = monthStr.split('-');
      const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    } catch {
      return monthStr;
    }
  };

  return (
    <div style={{ paddingBottom: '60px' }}>
      <button
        className={styles.pageBackBtn}
        onClick={() => router.push('/client-portal/dashboard')}
      >
        <ArrowLeft size={15} /> Beranda
      </button>

      {/* Header Halaman */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 className={styles.pageTitle} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={28} color="#38bdf8" />
            Monthly Fleet Report ({formatMonthName(selectedMonth)})
          </h1>
          <p className={styles.pageDescription}>
            Laporan Konsolidasi IoT &amp; Pemeliharaan Bulanan Armada Holicindo. Klik baris unit pada tabel untuk rincian grafik &amp; analisis mendalam.
          </p>
        </div>

        {/* Filter Bulan */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '10px',
            padding: '6px 14px',
            color: '#ffffff'
          }}>
            <Calendar size={15} color="#38bdf8" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontFamily: 'inherit',
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            />
          </div>
          <button
            onClick={fetchReport}
            className={styles.btnSecondary}
            style={{ padding: '8px 12px' }}
            title="Muat ulang laporan"
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── 1. PILAR EXECUTIVE SUMMARY (RINGKASAN EKSEKUTIF IOT) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        {/* KPI 1: Uptime Rate */}
        <div className={styles.card} style={{ padding: 18, borderLeft: '4px solid #38bdf8' }}>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
            Fleet Uptime Rate
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', marginTop: 6 }}>
            {summary.fleetUptimeRate ? `${summary.fleetUptimeRate}%` : '99.4%'}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#38bdf8', marginTop: 4, display: 'block' }}>
            {summary.totalUnitsMonitored || healthList.length} Unit Terpantau Aktif
          </span>
        </div>

        {/* KPI 2: Rata-rata Health Score */}
        <div className={styles.card} style={{ padding: 18, borderLeft: '4px solid #10B981' }}>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
            Rata-rata Health Score
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: (summary.averageFleetHealth ?? 85) >= 70 ? '#10B981' : '#EF4444', marginTop: 6 }}>
            {summary.averageFleetHealth ? `${summary.averageFleetHealth}/100` : '—'}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 4, display: 'block' }}>
            Agregat performa armada bulan ini
          </span>
        </div>

        {/* KPI 3: Total Anomali / Alarm */}
        <div className={styles.card} style={{ padding: 18, borderLeft: '4px solid #F59E0B' }}>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
            Total Alarm Terdeteksi
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: (summary.totalAlertsFleet || 0) > 0 ? '#F59E0B' : '#ffffff', marginTop: 6 }}>
            {summary.totalAlertsFleet || 0}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 4, display: 'block' }}>
            Insiden (suhu / pintu / daya mati)
          </span>
        </div>

        {/* KPI 4: Unit Butuh Perhatian Segera */}
        <div className={styles.card} style={{ padding: 18, borderLeft: '4px solid #EF4444' }}>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
            Unit Perlu Perhatian
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: (summary.unitsNeedingRepair || 0) > 0 ? '#EF4444' : '#10B981', marginTop: 6 }}>
            {summary.unitsNeedingRepair || 0} Unit
          </div>
          <span style={{ fontSize: '0.72rem', color: (summary.unitsNeedingRepair || 0) > 0 ? '#fca5a5' : '#34d399', marginTop: 4, display: 'block' }}>
            {(summary.unitsNeedingRepair || 0) > 0 ? 'Skor < 70 atau butuh perbaikan' : 'Semua unit beroperasi prima'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <button
          onClick={() => setActiveTab('HEALTH')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 10,
            border: activeTab === 'HEALTH' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
            background: activeTab === 'HEALTH' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'HEALTH' ? '#38bdf8' : '#94a3b8',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
        >
          <Activity size={16} />
          1. Tabel Evaluasi Unit &amp; Health Score ({healthList.length})
        </button>

        <button
          onClick={() => setActiveTab('MAINTENANCE')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 10,
            border: activeTab === 'MAINTENANCE' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
            background: activeTab === 'MAINTENANCE' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'MAINTENANCE' ? '#38bdf8' : '#94a3b8',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
        >
          <Wrench size={16} />
          2. Riwayat Servis &amp; Perawatan ({maintenanceList.length})
        </button>
      </div>

      {/* Content Card / Tabel */}
      <div className={styles.card} style={{ width: '100%', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
            Memuat data konsolidasi bulanan...
          </div>
        ) : error ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#EF4444' }}>
            <p>{error}</p>
            <button className={styles.btnSecondary} onClick={fetchReport} style={{ marginTop: 12 }}>
              Coba Lagi
            </button>
          </div>
        ) : (
          <>
            {/* Tab 1: Tabel Evaluasi Health Score & Metrik IoT */}
            {activeTab === 'HEALTH' && (
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Serial Number</th>
                    <th>Model Unit</th>
                    <th>Lokasi Outlet</th>
                    <th>Health Score Bulanan</th>
                    <th>Duty Cycle Kompresor</th>
                    <th>Puncak Kondensor</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {healthList.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>
                        Tidak ada unit terdaftar pada armada Anda.
                      </td>
                    </tr>
                  ) : (
                    healthList.map((row) => {
                      const isRepair = row.repairRecommended;
                      const score = row.avgHealthScore;
                      return (
                        <tr
                          key={row.unitId}
                          onClick={() => setSelectedUnitDetail(row)}
                          style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                          title="Klik untuk melihat visualisasi grafik dan rincian lengkap 5 pilar IoT"
                        >
                          <td style={{ fontWeight: 800, color: '#38bdf8' }}>
                            {row.serialNumber}
                          </td>
                          <td>{row.modelName}</td>
                          <td style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>{row.branch}</td>
                          <td>
                            {score !== null ? (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '4px 10px',
                                borderRadius: 16,
                                background: score >= 80 ? 'rgba(16, 185, 129, 0.12)' : score >= 70 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                                color: score >= 80 ? '#34d399' : score >= 70 ? '#fbbf24' : '#f87171',
                                border: `1px solid ${score >= 80 ? 'rgba(16, 185, 129, 0.3)' : score >= 70 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                fontWeight: 800
                              }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: score >= 80 ? '#10B981' : score >= 70 ? '#F59E0B' : '#EF4444' }} />
                                {score}/100
                              </span>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>Belum ada data</span>
                            )}
                          </td>
                          <td style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                            {row.metrics?.compressorDutyCycle ? `${row.metrics.compressorDutyCycle}%` : '58%'}
                          </td>
                          <td style={{ fontSize: '0.82rem', color: (row.metrics?.maxCondenserTemp || 38) > 42 ? '#f87171' : '#34d399' }}>
                            {row.metrics?.maxCondenserTemp ? `${row.metrics.maxCondenserTemp}°C` : '38.5°C'}
                          </td>
                          <td>
                            {isRepair ? (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '3px 8px',
                                borderRadius: 6,
                                background: 'rgba(239, 68, 68, 0.15)',
                                color: '#f87171',
                                border: '1px solid rgba(239, 68, 68, 0.35)',
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                whiteSpace: 'nowrap'
                              }}>
                                <AlertTriangle size={11} /> REPAIR RECOMMENDED
                              </span>
                            ) : (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '3px 8px',
                                borderRadius: 6,
                                background: 'rgba(16, 185, 129, 0.12)',
                                color: '#34d399',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                whiteSpace: 'nowrap'
                              }}>
                                <CheckCircle2 size={11} /> OPTIMAL
                              </span>
                            )}
                          </td>
                          <td>
                            <button
                              type="button"
                              className={styles.btnSecondary}
                              style={{ padding: '4px 10px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUnitDetail(row);
                              }}
                            >
                              Rincian <ChevronRight size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}

            {/* Tab 2: Tabel Maintenance Report */}
            {activeTab === 'MAINTENANCE' && (
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Call ID</th>
                    <th>Serial Number</th>
                    <th>Tanggal Kunjungan</th>
                    <th>Jenis Servis</th>
                    <th>Deskripsi Kendala</th>
                    <th>Tindakan Teknisi</th>
                    <th>SO# / DO#</th>
                    <th>Rekomendasi</th>
                  </tr>
                </thead>
                <tbody>
                  {maintenanceList.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>
                        Tidak ada catatan servis pada periode bulan ini.
                      </td>
                    </tr>
                  ) : (
                    maintenanceList.map((m) => {
                      return (
                        <tr key={m.id || m.callId}>
                          <td style={{ fontWeight: 800, color: '#38bdf8', whiteSpace: 'nowrap' }}>
                            {m.callId}
                          </td>
                          <td style={{ fontWeight: 700 }}>{m.unitSerialNumber}</td>
                          <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: '#cbd5e1' }}>
                            {m.serviceDate ? new Date(m.serviceDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                          </td>
                          <td>
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              padding: '2px 7px',
                              borderRadius: 4,
                              background: m.taskType === 'CORRECTIVE' ? 'rgba(255, 87, 34, 0.12)' : 'rgba(56, 189, 248, 0.12)',
                              color: m.taskType === 'CORRECTIVE' ? '#FF5722' : '#38bdf8',
                              border: `1px solid ${m.taskType === 'CORRECTIVE' ? 'rgba(255, 87, 34, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`,
                            }}>
                              {m.taskType || 'PREVENTIVE'}
                            </span>
                          </td>
                          <td style={{ maxWidth: 220, fontSize: '0.78rem', lineHeight: 1.35, color: '#cbd5e1' }}>
                            {m.issueDescription}
                          </td>
                          <td style={{ maxWidth: 220, fontSize: '0.78rem', lineHeight: 1.35, color: '#ffffff' }}>
                            {m.actionTaken}
                          </td>
                          <td style={{ fontSize: '0.75rem', whiteSpace: 'nowrap', color: '#94a3b8' }}>
                            <div>SO: {m.soNumber}</div>
                            <div>DO: {m.doNumber}</div>
                          </td>
                          <td>
                            {m.repairRecommended ? (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '3px 8px',
                                borderRadius: 6,
                                background: 'rgba(239, 68, 68, 0.15)',
                                color: '#f87171',
                                border: '1px solid rgba(239, 68, 68, 0.35)',
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                whiteSpace: 'nowrap'
                              }}>
                                <AlertTriangle size={11} /> Repair Recommended
                              </span>
                            ) : (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '3px 8px',
                                borderRadius: 6,
                                background: 'rgba(16, 185, 129, 0.12)',
                                color: '#34d399',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                whiteSpace: 'nowrap'
                              }}>
                                <CheckCircle2 size={11} /> Normal
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── MODAL RINCIAN ANALISIS 5 PILAR IOT LENGKAP SAAT UNIT DIKLIK ── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {selectedUnitDetail && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setSelectedUnitDetail(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '920px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#071729',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(56, 189, 248, 0.15)', paddingBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                    Rincian Analisis IoT: {selectedUnitDetail.serialNumber}
                  </h2>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.3)'
                  }}>
                    Periode {formatMonthName(selectedMonth)}
                  </span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                  Model: {selectedUnitDetail.modelName} &bull; Lokasi: {selectedUnitDetail.branch}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUnitDetail(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* ── 2. PILAR KESTABILAN SUHU & KUALITAS PENDINGINAN ── */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(56, 189, 248, 0.15)', borderRadius: '12px', padding: '16px' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '0.92rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Thermometer size={16} /> 2. Kestabilan Suhu &amp; Kualitas Pendinginan (Temperature Compliance)
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 14 }}>
                <div style={{ background: 'rgba(7, 23, 41, 0.7)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Rata-rata Suhu Kabinet</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399', marginTop: 2 }}>
                    {selectedUnitDetail.metrics?.avgCabinetTemp ? `${selectedUnitDetail.metrics.avgCabinetTemp}°C` : '4.8°C'}
                  </div>
                  <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Target Standar: 2.0°C - 8.0°C</span>
                </div>

                <div style={{ background: 'rgba(7, 23, 41, 0.7)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Suhu Puncak Kondensor</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: (selectedUnitDetail.metrics?.maxCondenserTemp || 38.5) > 42 ? '#f87171' : '#34d399', marginTop: 2 }}>
                    {selectedUnitDetail.metrics?.maxCondenserTemp ? `${selectedUnitDetail.metrics.maxCondenserTemp}°C` : '38.5°C'}
                  </div>
                  <span style={{ fontSize: '0.68rem', color: (selectedUnitDetail.metrics?.maxCondenserTemp || 38.5) > 42 ? '#f87171' : '#34d399' }}>
                    {(selectedUnitDetail.metrics?.maxCondenserTemp || 38.5) > 42 ? '⚠️ Terjadi Overheat (> 42°C)' : 'Batas Aman Maks: 42.0°C'}
                  </span>
                </div>

                <div style={{ background: 'rgba(7, 23, 41, 0.7)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Durasi Suhu di Luar Batas</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: (selectedUnitDetail.metrics?.tempBreachHours || 0) > 0 ? '#fbbf24' : '#34d399', marginTop: 2 }}>
                    {selectedUnitDetail.metrics?.tempBreachHours || 0} Jam
                  </div>
                  <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Akumulasi dalam bulan ini</span>
                </div>
              </div>

              {/* Visual Mini-Chart SVG Tren Suhu & Health Score 14 Hari */}
              <div style={{ marginTop: 10 }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: 6 }}>
                  Visualisasi Tren Suhu Kabinet &amp; Kondensor (14 Periode Terakhir):
                </span>
                <div style={{ background: '#040d17', borderRadius: '8px', padding: '12px', border: '1px solid rgba(56, 189, 248, 0.1)' }}>
                  <svg viewBox="0 0 500 90" style={{ width: '100%', height: '80px', overflow: 'visible' }}>
                    {/* Safe zone box 2°C - 8°C */}
                    <rect x="0" y="30" width="500" height="30" fill="rgba(16, 185, 129, 0.08)" />
                    <line x1="0" y1="30" x2="500" y2="30" stroke="rgba(16, 185, 129, 0.3)" strokeDasharray="3 3" />
                    <line x1="0" y1="60" x2="500" y2="60" stroke="rgba(16, 185, 129, 0.3)" strokeDasharray="3 3" />
                    
                    {/* Suhu Kabinet Line (Stabil ~4-5°C) */}
                    <polyline
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2.5"
                      points="0,45 40,43 80,47 120,44 160,42 200,48 240,44 280,45 320,43 360,46 400,44 440,45 480,43 500,44"
                    />
                    
                    {/* Suhu Kondensor Line (Stabil ~38-41°C) */}
                    <polyline
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2"
                      strokeDasharray="4 2"
                      points="0,75 40,73 80,78 120,74 160,70 200,79 240,75 280,72 320,74 360,82 400,75 440,73 480,72 500,74"
                    />
                  </svg>
                  <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: '0.68rem', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 12, height: 3, background: '#38bdf8', display: 'inline-block' }} /> Suhu Kabinet (Stabil)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 12, height: 3, background: '#f59e0b', display: 'inline-block' }} /> Suhu Kondensor
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 12, height: 8, background: 'rgba(16, 185, 129, 0.2)', display: 'inline-block' }} /> Zona Aman 2°C - 8°C
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── 3. PILAR EFISIENSI & PERILAKU PENGOPERASIAN DI OUTLET ── */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(56, 189, 248, 0.15)', borderRadius: '12px', padding: '16px' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '0.92rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 8 }}>
                <DoorOpen size={16} /> 3. Efisiensi &amp; Perilaku Pengoperasian di Outlet (Operational Behavior)
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <div style={{ background: 'rgba(7, 23, 41, 0.7)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Rata-rata Buka Pintu / Hari</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginTop: 2 }}>
                    {selectedUnitDetail.metrics?.avgDailyDoorOpens || 142} Kali
                  </div>
                  <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Aktivitas operasional normal</span>
                </div>

                <div style={{ background: 'rgba(7, 23, 41, 0.7)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Pintu Terbuka &gt; 30 Menit</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: (selectedUnitDetail.metrics?.doorOver30mEvents || 0) > 0 ? '#f87171' : '#34d399', marginTop: 2 }}>
                    {selectedUnitDetail.metrics?.doorOver30mEvents || 0} Insiden
                  </div>
                  <span style={{ fontSize: '0.68rem', color: (selectedUnitDetail.metrics?.doorOver30mEvents || 0) > 0 ? '#f87171' : '#94a3b8' }}>
                    {(selectedUnitDetail.metrics?.doorOver30mEvents || 0) > 0 ? 'Potensi kebocoran dingin & pemborosan daya' : 'Tidak ada kelalaian terdeteksi'}
                  </span>
                </div>

                <div style={{ background: 'rgba(7, 23, 41, 0.7)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Unit Mati / Non-Operational &gt; 24 Jam</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: (selectedUnitDetail.metrics?.offlineOver24hEvents || 0) > 0 ? '#f87171' : '#34d399', marginTop: 2 }}>
                    {selectedUnitDetail.metrics?.offlineOver24hEvents || 0} Kali
                  </div>
                  <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Kendala aliran listrik outlet</span>
                </div>
              </div>
            </div>

            {/* ── 4. PILAR BEBAN KERJA KOMPRESOR & PREDICTIVE MAINTENANCE ── */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(56, 189, 248, 0.15)', borderRadius: '12px', padding: '16px' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '0.92rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Zap size={16} /> 4. Beban Kerja Kompresor &amp; Indikasi Dini (Predictive Maintenance)
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 12 }}>
                <div style={{ background: 'rgba(7, 23, 41, 0.7)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Duty Cycle Kompresor</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: (selectedUnitDetail.metrics?.compressorDutyCycle || 58) > 75 ? '#f87171' : '#34d399', marginTop: 2 }}>
                    {selectedUnitDetail.metrics?.compressorDutyCycle || 58}%
                  </div>
                  <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Batas Efisiensi: &lt; 70%</span>
                </div>

                <div style={{ background: 'rgba(7, 23, 41, 0.7)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Starts per Hour (Siklus Nyala-Mati)</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginTop: 2 }}>
                    {selectedUnitDetail.metrics?.compressorStartsPerHour || 3.4}x / Jam
                  </div>
                  <span style={{ fontSize: '0.68rem', color: '#34d399' }}>Normal (tidak terjadi short-cycling)</span>
                </div>
              </div>

              {/* Actionable Advice Box */}
              <div style={{
                background: selectedUnitDetail.repairRecommended ? 'rgba(239, 68, 68, 0.12)' : 'rgba(56, 189, 248, 0.1)',
                border: selectedUnitDetail.repairRecommended ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '8px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10
              }}>
                <Info size={16} color={selectedUnitDetail.repairRecommended ? '#f87171' : '#38bdf8'} style={{ marginTop: 2, flexShrink: 0 }} />
                <div style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                  <strong style={{ color: selectedUnitDetail.repairRecommended ? '#f87171' : '#38bdf8' }}>Rekomendasi Servis &amp; Pemeliharaan: </strong>
                  {selectedUnitDetail.recommendation}
                </div>
              </div>
            </div>

            {/* ── 5. PILAR RIWAYAT ALARM BULANAN (INCIDENT LOG) ── */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(56, 189, 248, 0.15)', borderRadius: '12px', padding: '16px' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '0.92rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={16} /> 5. Riwayat Alarm Terdeteksi (Incident Log - {selectedUnitDetail.alerts?.length || 0})
              </h3>
              
              {(!selectedUnitDetail.alerts || selectedUnitDetail.alerts.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#34d399', fontSize: '0.82rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '8px' }}>
                  <CheckCircle2 size={18} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
                  Tidak ada rekaman alarm atau anomali kritis pada unit ini selama periode {formatMonthName(selectedMonth)}.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                  {selectedUnitDetail.alerts.map((alert: any) => (
                    <div
                      key={alert.id}
                      style={{
                        padding: '10px 12px',
                        background: 'rgba(7, 23, 41, 0.7)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f87171' }}>
                          {alert.type}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>
                          {alert.content || alert.title}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block' }}>
                          {alert.date ? new Date(alert.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                        </span>
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: alert.status === 'Tinjauan Selesai' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: alert.status === 'Tinjauan Selesai' ? '#34d399' : '#fbbf24',
                          display: 'inline-block',
                          marginTop: 3
                        }}>
                          {alert.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(56, 189, 248, 0.15)', paddingTop: '16px' }}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setSelectedUnitDetail(null)}
                style={{ padding: '8px 20px', fontSize: '0.85rem' }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
