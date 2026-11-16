'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { reportApi } from '@/lib/api';
import { 
  FileText, Calendar, Activity, Wrench, AlertTriangle, 
  CheckCircle2, Download, RefreshCw, ArrowLeft, ChevronRight, ShieldAlert
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

  return (
    <div>
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
            <FileText size={28} color="#2E5BFF" />
            Monthly Fleet Report
          </h1>
          <p className={styles.pageDescription}>
            Konsolidasi Laporan Bulanan: Evaluasi Kesehatan Unit (Health Score) & Rekomendasi Perawatan Mesin.
          </p>
        </div>

        {/* Filter Bulan */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '10px',
            padding: '6px 14px',
            color: '#ffffff'
          }}>
            <Calendar size={15} color="#60a5fa" />
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

      {/* KPI Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        {/* KPI 1 */}
        <div className={styles.card} style={{ padding: 18, borderLeft: '4px solid #2E5BFF' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--brand-space-grey)', textTransform: 'uppercase', fontWeight: 700 }}>
            Total Unit Terpantau
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', marginTop: 6 }}>
            {summary.totalUnitsMonitored || 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#60a5fa', marginTop: 4, display: 'block' }}>
            Unit terdaftar di armada
          </span>
        </div>

        {/* KPI 2 */}
        <div className={styles.card} style={{ padding: 18, borderLeft: '4px solid #10B981' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--brand-space-grey)', textTransform: 'uppercase', fontWeight: 700 }}>
            Rata-rata Health Score
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: summary.averageFleetHealth >= 70 ? '#10B981' : '#EF4444', marginTop: 6 }}>
            {summary.averageFleetHealth ? `${summary.averageFleetHealth}/100` : '—'}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--brand-space-grey)', marginTop: 4, display: 'block' }}>
            Kondisi agregat armada bulan ini
          </span>
        </div>

        {/* KPI 3 */}
        <div className={styles.card} style={{ padding: 18, borderLeft: '4px solid #F59E0B' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--brand-space-grey)', textTransform: 'uppercase', fontWeight: 700 }}>
            Aktivitas Servis / Kunjungan
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', marginTop: 6 }}>
            {summary.totalServicesLogged || 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--brand-space-grey)', marginTop: 4, display: 'block' }}>
            Log servis terlaksana
          </span>
        </div>

        {/* KPI 4 */}
        <div className={styles.card} style={{ padding: 18, borderLeft: '4px solid #EF4444' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--brand-space-grey)', textTransform: 'uppercase', fontWeight: 700 }}>
            Repair Recommended
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: summary.unitsNeedingRepair > 0 ? '#EF4444' : '#10B981', marginTop: 6 }}>
            {summary.unitsNeedingRepair || 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: summary.unitsNeedingRepair > 0 ? '#fca5a5' : '#34d399', marginTop: 4, display: 'block' }}>
            {summary.unitsNeedingRepair > 0 ? 'Perlu tindakan perbaikan segera' : 'Semua unit beroperasi baik'}
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
            border: activeTab === 'HEALTH' ? '1px solid #2E5BFF' : '1px solid rgba(255,255,255,0.1)',
            background: activeTab === 'HEALTH' ? 'rgba(46, 91, 255, 0.15)' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'HEALTH' ? '#60a5fa' : 'var(--brand-space-grey)',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
        >
          <Activity size={16} />
          1. Laporan Health Score Monthly ({healthList.length})
        </button>

        <button
          onClick={() => setActiveTab('MAINTENANCE')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 10,
            border: activeTab === 'MAINTENANCE' ? '1px solid #2E5BFF' : '1px solid rgba(255,255,255,0.1)',
            background: activeTab === 'MAINTENANCE' ? 'rgba(46, 91, 255, 0.15)' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'MAINTENANCE' ? '#60a5fa' : 'var(--brand-space-grey)',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
        >
          <Wrench size={16} />
          2. Laporan Maintenance &amp; Repair ({maintenanceList.length})
        </button>
      </div>

      {/* Content Card */}
      <div className={styles.card} style={{ width: '100%', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--brand-space-grey)' }}>
            Memuat konsolidasi laporan bulanan...
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
            {/* Tab 1: Health Score Monthly */}
            {activeTab === 'HEALTH' && (
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Serial Number</th>
                    <th>Model Unit</th>
                    <th>Lokasi Cabang</th>
                    <th>Rata-rata Health Score</th>
                    <th>Rentang (Min - Max)</th>
                    <th>Status Kondisi</th>
                    <th>Rekomendasi Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {healthList.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--brand-space-grey)' }}>
                        Tidak ada data unit untuk periode ini.
                      </td>
                    </tr>
                  ) : (
                    healthList.map((row) => {
                      const isRepair = row.repairRecommended;
                      const score = row.avgHealthScore;
                      return (
                        <tr key={row.unitId}>
                          <td style={{ fontWeight: 800, color: '#60a5fa' }}>
                            {row.serialNumber}
                          </td>
                          <td>{row.modelName}</td>
                          <td style={{ color: 'var(--brand-space-grey)', fontSize: '0.8rem' }}>{row.branch}</td>
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
                              <span style={{ color: 'var(--brand-space-grey)', fontSize: '0.78rem' }}>Belum ada data</span>
                            )}
                          </td>
                          <td style={{ color: 'var(--brand-space-grey)', fontSize: '0.8rem' }}>
                            {row.minScore !== null ? `${row.minScore} - ${row.maxScore}` : '—'}
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
                                fontSize: '0.72rem',
                                fontWeight: 800
                              }}>
                                <AlertTriangle size={12} /> REPAIR RECOMMENDED
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
                                fontSize: '0.72rem',
                                fontWeight: 700
                              }}>
                                <CheckCircle2 size={12} /> NORMAL
                              </span>
                            )}
                          </td>
                          <td style={{ fontSize: '0.78rem', color: isRepair ? '#fca5a5' : 'var(--brand-space-grey)', maxWidth: 280, lineHeight: 1.4 }}>
                            {row.recommendation}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}

            {/* Tab 2: Maintenance Report */}
            {activeTab === 'MAINTENANCE' && (
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Call ID</th>
                    <th>Serial Number</th>
                    <th>Tanggal</th>
                    <th>Jenis</th>
                    <th>Kendala</th>
                    <th>Tindakan / Hasil</th>
                    <th>SO# / DO#</th>
                    <th>Status Rekomendasi</th>
                  </tr>
                </thead>
                <tbody>
                  {maintenanceList.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--brand-space-grey)' }}>
                        Tidak ada riwayat perbaikan pada bulan ini.
                      </td>
                    </tr>
                  ) : (
                    maintenanceList.map((m) => {
                      return (
                        <tr key={m.id}>
                          <td style={{ fontWeight: 800, color: '#60a5fa', whiteSpace: 'nowrap' }}>
                            {m.callId}
                          </td>
                          <td style={{ fontWeight: 700 }}>{m.unitSerialNumber}</td>
                          <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--brand-space-grey)' }}>
                            {new Date(m.serviceDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td>
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              padding: '2px 7px',
                              borderRadius: 4,
                              background: m.taskType === 'CORRECTIVE' ? 'rgba(255, 87, 34, 0.12)' : 'rgba(46, 91, 255, 0.12)',
                              color: m.taskType === 'CORRECTIVE' ? '#FF5722' : '#60a5fa',
                              border: `1px solid ${m.taskType === 'CORRECTIVE' ? 'rgba(255, 87, 34, 0.3)' : 'rgba(46, 91, 255, 0.3)'}`,
                            }}>
                              {m.taskType}
                            </span>
                          </td>
                          <td style={{ maxWidth: 220, fontSize: '0.78rem', lineHeight: 1.35 }}>
                            {m.issueDescription}
                          </td>
                          <td style={{ maxWidth: 220, fontSize: '0.78rem', lineHeight: 1.35, color: '#dbeafe' }}>
                            {m.actionTaken}
                          </td>
                          <td style={{ fontSize: '0.75rem', whiteSpace: 'nowrap', color: 'var(--brand-space-grey)' }}>
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
                                <CheckCircle2 size={11} /> Selesai
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
    </div>
  );
}
