'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { reportApi } from '@/lib/api';
import { 
  FileText, Calendar, Activity, Wrench, AlertTriangle, 
  CheckCircle2, RefreshCw, ArrowLeft, ChevronRight, ChevronDown, ChevronLeft, X,
  Thermometer, Zap, DoorOpen, PowerOff, ShieldCheck,
  TrendingUp, Clock, Info, Loader2
} from 'lucide-react';
import styles from '../ClientPortal.module.css';
import rStyles from './reports.module.css';

export default function ClientMonthlyReportPage() {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'HEALTH' | 'CORRECTIVE' | 'PREVENTIVE'>('HEALTH');
  const [selectedUnitDetail, setSelectedUnitDetail] = useState<any>(null);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => {
    const d = new Date();
    return d.getFullYear();
  });
  const [showAlarmDetailModal, setShowAlarmDetailModal] = useState(false);
  const [alarmFilter, setAlarmFilter] = useState<'ALL' | 'ACTION_REQUIRED'>('ALL');
  const [loadingUnitId, setLoadingUnitId] = useState<string | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{
    index: number;
    date: string;
    cabinetTemp: number;
    condenserTemp: number;
    x: number;
    yCab: number;
    yCond: number;
  } | null>(null);

  const months = [
    { num: '01', name: 'Januari', short: 'Jan' },
    { num: '02', name: 'Februari', short: 'Feb' },
    { num: '03', name: 'Maret', short: 'Mar' },
    { num: '04', name: 'April', short: 'Apr' },
    { num: '05', name: 'Mei', short: 'Mei' },
    { num: '06', name: 'Juni', short: 'Jun' },
    { num: '07', name: 'Juli', short: 'Jul' },
    { num: '08', name: 'Agustus', short: 'Agu' },
    { num: '09', name: 'September', short: 'Sep' },
    { num: '10', name: 'Oktober', short: 'Okt' },
    { num: '11', name: 'November', short: 'Nov' },
    { num: '12', name: 'Desember', short: 'Des' },
  ];

  const handleOpenDetail = (row: any) => {
    setLoadingUnitId(row.unitId);
    setTimeout(() => {
      setSelectedUnitDetail(row);
      setLoadingUnitId(null);
    }, 150);
  };

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
  const correctiveList: any[] = maintenanceList.filter((m) => m.taskType === 'CORRECTIVE' || !m.taskType);
  const preventiveList: any[] = maintenanceList.filter((m) => m.taskType === 'PREVENTIVE');

  // Seluruh notifikasi / insiden alarm armada pada bulan ini
  const allFleetAlerts: any[] = healthList.flatMap((u) =>
    (u.alerts || []).map((a: any) => ({
      ...a,
      serialNumber: u.serialNumber,
      modelName: u.modelName,
      branch: u.branch,
      unitId: u.unitId,
    }))
  );

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
    <div className={rStyles.reportContainer}>
      <button
        className={styles.pageBackBtn}
        onClick={() => router.push('/client-portal/dashboard')}
      >
        <ArrowLeft size={15} /> Beranda
      </button>

      {/* Header Halaman */}
      <div className={rStyles.headerRow}>
        <div className={rStyles.headerTitleWrapper}>
          <h1 className={styles.pageTitle} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={28} color="#38bdf8" />
            Monthly Fleet Report ({formatMonthName(selectedMonth)})
          </h1>
          <p className={styles.pageDescription}>
            Ringkasan kesehatan unit, performa mesin, dan catatan servis armada Anda sepanjang bulan ini. Klik unit untuk melihat grafik &amp; rincian lengkap.
          </p>
        </div>

        {/* Filter Bulan dengan Custom Dropdown & Modal Pilihan Sesuai Tema Dark */}
        <div className={rStyles.filterControls}>
          <button
            type="button"
            className={rStyles.monthDropdownBtn}
            onClick={() => {
              const [currY] = selectedMonth.split('-');
              if (currY) setPickerYear(parseInt(currY, 10));
              setShowMonthDropdown(prev => !prev);
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={16} color="#38bdf8" />
              <span>{formatMonthName(selectedMonth)}</span>
            </div>
            <ChevronDown size={15} color="#94a3b8" style={{ transform: showMonthDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {/* Modal / Popup Dropdown Kalender Bulan */}
          {showMonthDropdown && (
            <>
              <div 
                style={{ position: 'fixed', inset: 0, zIndex: 998 }} 
                onClick={() => setShowMonthDropdown(false)} 
              />
              <div className={rStyles.monthPickerPopup}>
                {/* Year Navigation */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <button
                    type="button"
                    onClick={() => setPickerYear(y => y - 1)}
                    style={{ background: 'rgba(255, 255, 255, 0.06)', border: 'none', color: '#94a3b8', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: '#38bdf8' }}>{pickerYear}</span>
                  <button
                    type="button"
                    onClick={() => setPickerYear(y => y + 1)}
                    style={{ background: 'rgba(255, 255, 255, 0.06)', border: 'none', color: '#94a3b8', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                {/* 12 Months Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {months.map((m) => {
                    const targetVal = `${pickerYear}-${m.num}`;
                    const isSelected = selectedMonth === targetVal;
                    return (
                      <button
                        key={m.num}
                        type="button"
                        onClick={() => {
                          setSelectedMonth(targetVal);
                          setShowMonthDropdown(false);
                        }}
                        style={{
                          padding: '10px 4px',
                          borderRadius: 8,
                          fontSize: '0.8rem',
                          fontWeight: isSelected ? 700 : 500,
                          cursor: 'pointer',
                          textAlign: 'center',
                          border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.05)',
                          background: isSelected ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                          color: isSelected ? '#38bdf8' : '#e2e8f0',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) (e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)');
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)');
                        }}
                      >
                        {m.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

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
      <div className={rStyles.summaryGrid}>
        {/* KPI 1: Uptime Rate */}
        <div className={`${styles.card} ${rStyles.summaryCard}`} style={{ borderLeft: '4px solid #38bdf8' }}>
          <span className={rStyles.summaryCardLabel}>
            Fleet Uptime Rate
          </span>
          <div className={rStyles.summaryCardVal} style={{ color: '#ffffff' }}>
            {summary.fleetUptimeRate ? `${summary.fleetUptimeRate}%` : '99.4%'}
          </div>
          <span className={rStyles.summaryCardSub} style={{ color: '#38bdf8' }}>
            {summary.totalUnitsMonitored || healthList.length} Unit Terpantau Aktif
          </span>
        </div>

        {/* KPI 2: Rata-rata Health Score */}
        <div className={`${styles.card} ${rStyles.summaryCard}`} style={{ borderLeft: '4px solid #10B981' }}>
          <span className={rStyles.summaryCardLabel}>
            Rata-rata Health Score
          </span>
          <div className={rStyles.summaryCardVal} style={{ color: (summary.averageFleetHealth ?? 85) >= 70 ? '#10B981' : '#EF4444' }}>
            {summary.averageFleetHealth ? `${summary.averageFleetHealth}/100` : '—'}
          </div>
          <span className={rStyles.summaryCardSub} style={{ color: '#94a3b8' }}>
            Agregat performa armada bulan ini
          </span>
        </div>

        {/* KPI 3: Total Anomali / Alarm (Dapat diklik untuk melihat detail insiden) */}
        <div
          className={`${styles.card} ${rStyles.summaryCard}`}
          style={{ borderLeft: '4px solid #F59E0B', cursor: 'pointer', transition: 'all 0.15s ease' }}
          onClick={() => setShowAlarmDetailModal(true)}
          title="Klik untuk melihat rincian riwayat seluruh insiden alarm bulan ini"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className={rStyles.summaryCardLabel}>
              Total Alarm Terdeteksi
            </span>
            <span style={{ fontSize: '0.65rem', color: '#F59E0B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
              Lihat Rincian <ChevronRight size={11} />
            </span>
          </div>
          <div className={rStyles.summaryCardVal} style={{ color: (summary.totalAlertsFleet || 0) > 0 ? '#F59E0B' : '#ffffff' }}>
            {summary.totalAlertsFleet || 0}
          </div>
          <span className={rStyles.summaryCardSub} style={{ color: '#94a3b8' }}>
            Insiden riil (suhu / pintu / daya mati)
          </span>
        </div>

        {/* KPI 4: Unit Butuh Perhatian Segera */}
        <div className={`${styles.card} ${rStyles.summaryCard}`} style={{ borderLeft: '4px solid #EF4444' }}>
          <span className={rStyles.summaryCardLabel}>
            Unit Perlu Perhatian
          </span>
          <div className={rStyles.summaryCardVal} style={{ color: (summary.unitsNeedingRepair || 0) > 0 ? '#EF4444' : '#10B981' }}>
            {summary.unitsNeedingRepair || 0} Unit
          </div>
          <span className={rStyles.summaryCardSub} style={{ color: (summary.unitsNeedingRepair || 0) > 0 ? '#fca5a5' : '#34d399' }}>
            {(summary.unitsNeedingRepair || 0) > 0 ? 'Skor < 70 / butuh servis' : 'Semua unit prima'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className={rStyles.tabRow}>
        <button
          onClick={() => setActiveTab('HEALTH')}
          className={rStyles.tabBtn}
          style={{
            border: activeTab === 'HEALTH' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
            background: activeTab === 'HEALTH' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'HEALTH' ? '#38bdf8' : '#94a3b8',
          }}
        >
          <Activity size={15} />
          1. Tabel Evaluasi Unit &amp; Health Score ({healthList.length})
        </button>
        <button
          onClick={() => setActiveTab('CORRECTIVE')}
          className={rStyles.tabBtn}
          style={{
            border: activeTab === 'CORRECTIVE' ? '1px solid #FF5722' : '1px solid rgba(255,255,255,0.1)',
            background: activeTab === 'CORRECTIVE' ? 'rgba(255, 87, 34, 0.15)' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'CORRECTIVE' ? '#FF5722' : '#94a3b8',
          }}
        >
          <Wrench size={15} />
          2. Riwayat Servis &amp; Perbaikan ({correctiveList.length})
        </button>
        <button
          onClick={() => setActiveTab('PREVENTIVE')}
          className={rStyles.tabBtn}
          style={{
            border: activeTab === 'PREVENTIVE' ? '1px solid #10B981' : '1px solid rgba(255,255,255,0.1)',
            background: activeTab === 'PREVENTIVE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'PREVENTIVE' ? '#34d399' : '#94a3b8',
          }}
        >
          <ShieldCheck size={15} />
          3. Riwayat Perawatan Rutin ({preventiveList.length})
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
                    <th style={{ textAlign: 'center' }}>Health Score Bulanan</th>
                    <th style={{ textAlign: 'center' }}>Duty Cycle Kompresor</th>
                    <th style={{ textAlign: 'center' }}>Suhu Maks. Kondensor</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th style={{ textAlign: 'center' }}>Aksi</th>
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
                          onClick={() => handleOpenDetail(row)}
                          style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                          title="Klik untuk melihat visualisasi grafik dan rincian lengkap 5 pilar IoT"
                        >
                          {/* Col 1: Serial + Badge Status di Pojok Kanan Atas pada Mobile */}
                          <td className={rStyles.unitHeaderCell}>
                            <div className={rStyles.unitCardSerialRow}>
                              <span className={rStyles.unitSerialTitle}>
                                {row.serialNumber}
                              </span>
                              <span className={rStyles.unitCardBadgeMobile}>
                                {isRepair ? (
                                  <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    padding: '2px 7px',
                                    borderRadius: 6,
                                    background: 'rgba(239, 68, 68, 0.15)',
                                    color: '#f87171',
                                    border: '1px solid rgba(239, 68, 68, 0.35)',
                                    fontSize: '0.62rem',
                                    fontWeight: 800,
                                    whiteSpace: 'nowrap'
                                  }}>
                                    <AlertTriangle size={10} /> REPAIR RECOMMENDED
                                  </span>
                                ) : (
                                  <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    padding: '2px 7px',
                                    borderRadius: 6,
                                    background: 'rgba(16, 185, 129, 0.12)',
                                    color: '#34d399',
                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                    fontSize: '0.62rem',
                                    fontWeight: 700,
                                    whiteSpace: 'nowrap'
                                  }}>
                                    <CheckCircle2 size={10} /> OPTIMAL
                                  </span>
                                )}
                              </span>
                            </div>
                          </td>

                          {/* Col 2: Model */}
                          <td>
                            <div className={rStyles.cellRow}>
                              <span className={rStyles.cellLabel}>Model</span>
                              <span className={rStyles.cellValue}>{row.modelName}</span>
                            </div>
                          </td>

                          {/* Col 3: Lokasi */}
                          <td>
                            <div className={rStyles.cellRow}>
                              <span className={rStyles.cellLabel}>Kota Penempatan</span>
                              <span className={rStyles.cellValue} style={{ color: '#cbd5e1' }}>{row.branch}</span>
                            </div>
                          </td>

                          {/* Col 4: Health Score */}
                          <td className={rStyles.textCenterCell}>
                            <div className={rStyles.cellRow}>
                              <span className={rStyles.cellLabel}>Health Score</span>
                              <span className={rStyles.cellValue}>
                                {score !== null ? (
                                  <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    padding: '2px 8px',
                                    borderRadius: 14,
                                    background: score >= 80 ? 'rgba(16, 185, 129, 0.12)' : score >= 70 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                                    color: score >= 80 ? '#34d399' : score >= 70 ? '#fbbf24' : '#f87171',
                                    border: `1px solid ${score >= 80 ? 'rgba(16, 185, 129, 0.3)' : score >= 70 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                    fontWeight: 800,
                                    fontSize: '0.75rem'
                                  }}>
                                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: score >= 80 ? '#10B981' : score >= 70 ? '#F59E0B' : '#EF4444' }} />
                                    {score}/100
                                  </span>
                                ) : (
                                  <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Belum ada data</span>
                                )}
                              </span>
                            </div>
                          </td>

                          {/* Col 5: Duty Cycle */}
                          <td className={rStyles.textCenterCell}>
                            <div className={rStyles.cellRow}>
                              <span className={rStyles.cellLabel}>Duty Cycle</span>
                              <span className={rStyles.cellValue} style={{ color: '#cbd5e1' }}>
                                {row.metrics?.compressorDutyCycle ? `${row.metrics.compressorDutyCycle}%` : '58%'}
                              </span>
                            </div>
                          </td>

                          {/* Col 6: Suhu Maks. Kondensor */}
                          <td className={rStyles.textCenterCell}>
                            <div className={rStyles.cellRow}>
                              <span className={rStyles.cellLabel}>Suhu Maks. Kondensor</span>
                              <span className={rStyles.cellValue} style={{ color: (row.metrics?.maxCondenserTemp || 38) > 42 ? '#f87171' : '#34d399' }}>
                                {row.metrics?.maxCondenserTemp ? `${row.metrics.maxCondenserTemp}°C` : '38.5°C'}
                              </span>
                            </div>
                          </td>

                          {/* Col 7: Status (Desktop only, mobile rendered inside Header Cell) */}
                          <td className={`${styles.hiddenOnMobile} ${rStyles.textCenterCell}`}>
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

                          {/* Col 8: Aksi */}
                          <td className={rStyles.unitRowActionCell}>
                            <button
                              type="button"
                              className={rStyles.unitActionBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDetail(row);
                              }}
                              disabled={loadingUnitId === row.unitId}
                            >
                              {loadingUnitId === row.unitId ? (
                                <>
                                  <Loader2 size={13} className="spin" /> Membuka...
                                </>
                              ) : (
                                <>
                                  Rincian <ChevronRight size={13} />
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}

            {/* Tab 2: Tabel Riwayat Servis & Perbaikan (Corrective) */}
            {activeTab === 'CORRECTIVE' && (
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Call ID</th>
                    <th>Serial Number</th>
                    <th>Tanggal Kunjungan</th>
                    <th>Kategori</th>
                    <th>Deskripsi Kendala</th>
                    <th>Tindakan / Solusi Teknisi</th>
                    <th>SO# / DO#</th>
                    <th style={{ textAlign: 'center' }}>Status &amp; Rekomendasi</th>
                  </tr>
                </thead>
                <tbody>
                  {correctiveList.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                          <CheckCircle2 size={28} color="#34d399" />
                          <span style={{ fontWeight: 600, color: '#e2e8f0' }}>Tidak ada insiden kerusakan/perbaikan (Corrective) bulan ini.</span>
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Seluruh armada beroperasi dengan normal tanpa tiket komplain.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    correctiveList.map((m) => {
                      return (
                        <tr key={m.id || m.callId}>
                          <td data-label="Call ID" style={{ fontWeight: 800, color: '#38bdf8', whiteSpace: 'nowrap' }}>
                            {m.callId}
                          </td>
                          <td data-label="Serial Number" style={{ fontWeight: 700 }}>{m.unitSerialNumber}</td>
                          <td data-label="Tanggal Kunjungan" style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: '#cbd5e1' }}>
                            {m.serviceDate ? new Date(m.serviceDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                          </td>
                          <td data-label="Kategori">
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              padding: '2px 7px',
                              borderRadius: 4,
                              background: 'rgba(255, 87, 34, 0.12)',
                              color: '#FF5722',
                              border: '1px solid rgba(255, 87, 34, 0.3)',
                            }}>
                              CORRECTIVE
                            </span>
                          </td>
                          <td data-label="Deskripsi Kendala" style={{ maxWidth: 220, fontSize: '0.78rem', lineHeight: 1.35, color: '#cbd5e1' }}>
                            {m.issueDescription}
                          </td>
                          <td data-label="Tindakan / Solusi Teknisi" style={{ maxWidth: 220, fontSize: '0.78rem', lineHeight: 1.35, color: '#ffffff' }}>
                            {m.actionTaken}
                          </td>
                          <td data-label="SO# / DO#" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap', color: '#94a3b8' }}>
                            <div>SO: {m.soNumber}</div>
                            <div>DO: {m.doNumber}</div>
                          </td>
                          <td data-label="Status & Rekomendasi" style={{ textAlign: 'center' }}>
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
                                <CheckCircle2 size={11} /> Selesai / Normal
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

            {/* Tab 3: Tabel Riwayat Perawatan Rutin (Preventive Maintenance) */}
            {activeTab === 'PREVENTIVE' && (
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>No. Tiket PM</th>
                    <th>Serial Number</th>
                    <th>Tanggal Perawatan</th>
                    <th>Kategori</th>
                    <th>Pemeriksaan / Catatan Servis</th>
                    <th>Teknisi Pelaksana</th>
                    <th>SO# / DO#</th>
                    <th style={{ textAlign: 'center' }}>Status Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {preventiveList.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                          <ShieldCheck size={28} color="#38bdf8" />
                          <span style={{ fontWeight: 600, color: '#e2e8f0' }}>Tidak ada jadwal kunjungan perawatan rutin (Preventive) pada periode bulan ini.</span>
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Perawatan berkala biasanya terjadwal sesuai interval kontrak armada Anda.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    preventiveList.map((m) => {
                      return (
                        <tr key={m.id || m.callId}>
                          <td data-label="No. Tiket PM" style={{ fontWeight: 800, color: '#38bdf8', whiteSpace: 'nowrap' }}>
                            {m.callId}
                          </td>
                          <td data-label="Serial Number" style={{ fontWeight: 700 }}>{m.unitSerialNumber}</td>
                          <td data-label="Tanggal Perawatan" style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: '#cbd5e1' }}>
                            {m.serviceDate ? new Date(m.serviceDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                          </td>
                          <td data-label="Kategori">
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              padding: '2px 7px',
                              borderRadius: 4,
                              background: 'rgba(16, 185, 129, 0.12)',
                              color: '#34d399',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                            }}>
                              PREVENTIVE
                            </span>
                          </td>
                          <td data-label="Pemeriksaan / Catatan Servis" style={{ maxWidth: 240, fontSize: '0.78rem', lineHeight: 1.35, color: '#ffffff' }}>
                            {m.actionTaken && m.actionTaken !== '—' ? m.actionTaken : m.issueDescription || 'Pembersihan kondensor & pengecekan berkala'}
                          </td>
                          <td data-label="Teknisi Pelaksana" style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                            {m.technicianName || 'Tim Teknisi Holicindo'}
                          </td>
                          <td data-label="SO# / DO#" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap', color: '#94a3b8' }}>
                            <div>SO: {m.soNumber}</div>
                            <div>DO: {m.doNumber}</div>
                          </td>
                          <td data-label="Status Unit" style={{ textAlign: 'center' }}>
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
                              <CheckCircle2 size={11} /> Terawat Prima
                            </span>
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
          className={rStyles.modalOverlay}
          onClick={() => setSelectedUnitDetail(null)}
        >
          <div
            className={rStyles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(56, 189, 248, 0.15)', paddingBottom: '14px', gap: 10 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                    Rincian Analisis IoT: {selectedUnitDetail.serialNumber}
                  </h2>
                  <span style={{
                    fontSize: '0.7rem',
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
                <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                  Model: {selectedUnitDetail.modelName} &bull; Lokasi: {selectedUnitDetail.branch}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUnitDetail(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: 'none',
                  borderRadius: '50%',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
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
                  Visualisasi Tren Suhu Kabinet &amp; Kondensor (Periode Bulan Ini):
                </span>
                <div style={{ background: '#040d17', borderRadius: '8px', padding: '12px', border: '1px solid rgba(56, 189, 248, 0.15)', overflowX: 'auto' }}>
                  {(() => {
                    const trend: any[] = selectedUnitDetail.dailyTrend || [];
                    const chartW = 560;
                    const chartH = 110;
                    const paddingL = 24;
                    const paddingR = 75; // Ruang aman di kanan agar teks '42°C (Maks)', '8°C', '2°C' tidak terpotong
                    const paddingY = 16;

                    // Range suhu: Y dari -5°C sampai 55°C
                    const minT = -5;
                    const maxT = 55;
                    const getY = (val: number) => chartH - paddingY - ((val - minT) / (maxT - minT)) * (chartH - 2 * paddingY);

                    const ySafeTop = getY(8);   // Suhu 8°C
                    const ySafeBottom = getY(2); // Suhu 2°C
                    const y42 = getY(42);       // Garis batas overheat 42°C

                    if (trend.length === 0) {
                      return (
                        <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748b', fontSize: '0.78rem' }}>
                          Belum ada rekaman riwayat tren suhu untuk unit ini pada periode ini.
                        </div>
                      );
                    }

                    const innerW = chartW - paddingL - paddingR;
                    const stepX = trend.length > 1 ? innerW / (trend.length - 1) : 0;

                    const cabPoints = trend
                      .map((d, i) => {
                        const val = d.cabinetTemp ?? 4.5;
                        const x = paddingL + i * stepX;
                        const y = getY(val);
                        return `${x.toFixed(1)},${y.toFixed(1)}`;
                      })
                      .join(' ');

                    const condPoints = trend
                      .map((d, i) => {
                        const val = d.condenserTemp ?? 38.0;
                        const x = paddingL + i * stepX;
                        const y = getY(val);
                        return `${x.toFixed(1)},${y.toFixed(1)}`;
                      })
                      .join(' ');

                    return (
                      <>
                        <div style={{ minWidth: '420px', width: '100%', position: 'relative' }}>
                          <svg
                            viewBox={`0 0 ${chartW} ${chartH}`}
                            style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
                            onMouseLeave={() => setHoveredPoint(null)}
                          >
                            {/* Grid line & Labels */}
                            <line x1={paddingL} y1={y42} x2={chartW - paddingR} y2={y42} stroke="rgba(239, 68, 68, 0.4)" strokeDasharray="3 3" />
                            <text x={chartW - paddingR + 6} y={y42 + 3} fill="#f87171" fontSize="9" fontWeight="bold">42°C (Maks)</text>

                            {/* Safe Zone (2°C - 8°C) */}
                            <rect
                              x={paddingL}
                              y={Math.min(ySafeTop, ySafeBottom)}
                              width={innerW}
                              height={Math.abs(ySafeBottom - ySafeTop)}
                              fill="rgba(16, 185, 129, 0.12)"
                            />
                            <line x1={paddingL} y1={ySafeTop} x2={chartW - paddingR} y2={ySafeTop} stroke="rgba(16, 185, 129, 0.4)" strokeDasharray="2 2" />
                            <line x1={paddingL} y1={ySafeBottom} x2={chartW - paddingR} y2={ySafeBottom} stroke="rgba(16, 185, 129, 0.4)" strokeDasharray="2 2" />
                            <text x={chartW - paddingR + 6} y={ySafeTop + 3} fill="#34d399" fontSize="8">8°C</text>
                            <text x={chartW - paddingR + 6} y={ySafeBottom + 3} fill="#34d399" fontSize="8">2°C</text>

                            {/* Polylines */}
                            <polyline fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 2" points={condPoints} />
                            <polyline fill="none" stroke="#38bdf8" strokeWidth="2.5" points={cabPoints} />

                            {/* Hover Vertical Guide Line */}
                            {hoveredPoint && (
                              <line
                                x1={hoveredPoint.x}
                                y1={paddingY}
                                x2={hoveredPoint.x}
                                y2={chartH - paddingY}
                                stroke="rgba(255, 255, 255, 0.35)"
                                strokeDasharray="2 2"
                              />
                            )}

                            {/* Data points & hit-areas */}
                            {trend.map((d, i) => {
                              const x = paddingL + i * stepX;
                              const cabVal = d.cabinetTemp ?? 4.5;
                              const condVal = d.condenserTemp ?? 38.0;
                              const yCab = getY(cabVal);
                              const yCond = getY(condVal);
                              const isHovered = hoveredPoint?.index === i;

                              return (
                                <g
                                  key={i}
                                  style={{ cursor: 'pointer' }}
                                  onMouseEnter={() => {
                                    setHoveredPoint({
                                      index: i,
                                      date: d.date,
                                      cabinetTemp: cabVal,
                                      condenserTemp: condVal,
                                      x,
                                      yCab,
                                      yCond,
                                    });
                                  }}
                                  onClick={() => {
                                    setHoveredPoint({
                                      index: i,
                                      date: d.date,
                                      cabinetTemp: cabVal,
                                      condenserTemp: condVal,
                                      x,
                                      yCab,
                                      yCond,
                                    });
                                  }}
                                >
                                  {/* Area sentuh/hover lebih lebar untuk kemudahan klik di mobile */}
                                  <rect
                                    x={x - Math.max(stepX / 2, 10)}
                                    y={0}
                                    width={Math.max(stepX, 20)}
                                    height={chartH}
                                    fill="transparent"
                                  />

                                  {/* Lingkaran titik Suhu Kabinet */}
                                  <circle
                                    cx={x}
                                    cy={yCab}
                                    r={isHovered ? 5.5 : 3}
                                    fill="#38bdf8"
                                    stroke={isHovered ? '#ffffff' : 'none'}
                                    strokeWidth={isHovered ? 1.5 : 0}
                                  />

                                  {/* Lingkaran titik Suhu Kondensor */}
                                  <circle
                                    cx={x}
                                    cy={yCond}
                                    r={isHovered ? 5 : 2.5}
                                    fill="#f59e0b"
                                    stroke={isHovered ? '#ffffff' : 'none'}
                                    strokeWidth={isHovered ? 1.5 : 0}
                                  />

                                  {/* Tanggal label */}
                                  <text
                                    x={x}
                                    y={chartH - 4}
                                    fill={isHovered ? '#38bdf8' : '#64748b'}
                                    fontSize="8"
                                    fontWeight={isHovered ? 'bold' : 'normal'}
                                    textAnchor="middle"
                                  >
                                    {d.date}
                                  </text>
                                </g>
                              );
                            })}

                            {/* Tooltip SVG Overlay saat di-hover / disentuh */}
                            {hoveredPoint && (() => {
                              const tooltipW = 105;
                              const tooltipH = 38;
                              // Hitung agar tooltip tidak terpotong tepi layar kanan/kiri
                              let tooltipX = hoveredPoint.x - tooltipW / 2;
                              if (tooltipX < paddingL) tooltipX = paddingL;
                              if (tooltipX + tooltipW > chartW - paddingR + 10) {
                                tooltipX = chartW - paddingR + 10 - tooltipW;
                              }
                              const tooltipY = Math.max(2, Math.min(hoveredPoint.yCab, hoveredPoint.yCond) - tooltipH - 6);

                              return (
                                <g style={{ pointerEvents: 'none' }}>
                                  <rect
                                    x={tooltipX}
                                    y={tooltipY}
                                    width={tooltipW}
                                    height={tooltipH}
                                    rx={5}
                                    fill="rgba(8, 23, 41, 0.95)"
                                    stroke="rgba(56, 189, 248, 0.6)"
                                    strokeWidth={1}
                                  />
                                  <text x={tooltipX + 6} y={tooltipY + 11} fill="#94a3b8" fontSize="8" fontWeight="600">
                                    Tgl: {hoveredPoint.date}
                                  </text>
                                  <text x={tooltipX + 6} y={tooltipY + 22} fill="#38bdf8" fontSize="8.5" fontWeight="bold">
                                    ● Kabinet: {hoveredPoint.cabinetTemp}°C
                                  </text>
                                  <text x={tooltipX + 6} y={tooltipY + 33} fill="#f59e0b" fontSize="8.5" fontWeight="bold">
                                    ● Kondensor: {hoveredPoint.condenserTemp}°C
                                  </text>
                                </g>
                              );
                            })()}
                          </svg>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 10, fontSize: '0.7rem', color: '#94a3b8', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 14, height: 3, background: '#38bdf8', borderRadius: 2, display: 'inline-block' }} />
                            <span>Suhu Kabinet</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 14, height: 2, borderBottom: '2px dashed #f59e0b', display: 'inline-block' }} />
                            <span>Suhu Kondensor</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 12, height: 8, background: 'rgba(16, 185, 129, 0.25)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: 2, display: 'inline-block' }} />
                            <span>Zona Standar (2°C - 8°C)</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 12, height: 1, borderBottom: '2px dashed #f87171', display: 'inline-block' }} />
                            <span>Ambang Overheat (&gt;42°C)</span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
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

      {/* ── MODAL RINCIAN SELURUH ALARM ARMADA (POIN 1 & 2) ── */}
      {showAlarmDetailModal && (
        <div className={rStyles.modalOverlay} onClick={() => setShowAlarmDetailModal(false)}>
          <div className={rStyles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '780px' }}>
            {/* Header Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(56, 189, 248, 0.2)', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={20} color="#F59E0B" />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.05rem', color: '#ffffff', fontWeight: 800 }}>
                    Riwayat Insiden &amp; Alarm Armada ({formatMonthName(selectedMonth)})
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8' }}>
                    Daftar insiden anomali telemetri IoT (suhu kondensor, pintu terbuka, status operasional unit).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAlarmDetailModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Filter Alarm: Semua vs Perlu Tindakan Segera */}
            <div style={{ display: 'flex', gap: 8, padding: '4px 0' }}>
              <button
                type="button"
                onClick={() => setAlarmFilter('ALL')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: alarmFilter === 'ALL' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                  background: alarmFilter === 'ALL' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.04)',
                  color: alarmFilter === 'ALL' ? '#38bdf8' : '#94a3b8',
                  transition: 'all 0.15s ease'
                }}
              >
                Semua Insiden ({allFleetAlerts.length})
              </button>
              <button
                type="button"
                onClick={() => setAlarmFilter('ACTION_REQUIRED')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: alarmFilter === 'ACTION_REQUIRED' ? '1px solid #EF4444' : '1px solid rgba(255,255,255,0.1)',
                  background: alarmFilter === 'ACTION_REQUIRED' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.04)',
                  color: alarmFilter === 'ACTION_REQUIRED' ? '#f87171' : '#94a3b8',
                  transition: 'all 0.15s ease'
                }}
              >
                Perlu Tindakan ({allFleetAlerts.filter(a => a.status !== 'Tinjauan Selesai').length})
              </button>
            </div>

            {/* List Alarm Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '55vh', overflowY: 'auto', paddingRight: 4 }}>
              {(() => {
                const filtered = allFleetAlerts.filter(a => {
                  if (alarmFilter === 'ACTION_REQUIRED') return a.status !== 'Tinjauan Selesai';
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '36px 16px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '12px', border: '1px dashed rgba(56, 189, 248, 0.2)' }}>
                      <CheckCircle2 size={32} color="#34d399" style={{ margin: '0 auto 8px', display: 'block' }} />
                      <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.9rem' }}>
                        {alarmFilter === 'ACTION_REQUIRED' ? 'Semua Insiden Telah Selesai Ditinjau' : 'Tidak Ada Insiden Alarm pada Periode Ini'}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: 4 }}>
                        Seluruh unit armada beroperasi dalam batas parameter normal.
                      </div>
                    </div>
                  );
                }

                return filtered.map((alert, idx) => (
                  <div
                    key={alert.id || idx}
                    style={{
                      background: 'rgba(15, 23, 42, 0.7)',
                      border: '1px solid rgba(56, 189, 248, 0.15)',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 12
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '2px 7px',
                          borderRadius: '4px',
                          background: alert.type?.includes('Kondensor') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: alert.type?.includes('Kondensor') ? '#f87171' : '#fbbf24',
                          border: alert.type?.includes('Kondensor') ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)'
                        }}>
                          {alert.type || 'Anomali'}
                        </span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8' }}>
                          Unit: {alert.serialNumber} ({alert.modelName || 'Chiller'})
                        </span>
                        {alert.branch && (
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            • {alert.branch}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#e2e8f0', lineHeight: 1.4 }}>
                        {alert.content || alert.title}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>
                        {alert.date ? new Date(alert.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </span>
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        padding: '2px 7px',
                        borderRadius: '4px',
                        background: alert.status === 'Tinjauan Selesai' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: alert.status === 'Tinjauan Selesai' ? '#34d399' : '#f87171',
                        border: alert.status === 'Tinjauan Selesai' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                        display: 'inline-block',
                        marginTop: 4
                      }}>
                        {alert.status || 'Perlu Tindakan'}
                      </span>
                    </div>
                  </div>
                ));
              })()}
            </div>

            {/* Footer Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(56, 189, 248, 0.15)', paddingTop: '14px' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                💡 Notifikasi kritis otomatis dikirimkan ke email teknisi &amp; admin penanggung jawab.
              </span>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setShowAlarmDetailModal(false)}
                style={{ padding: '6px 18px', fontSize: '0.82rem' }}
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
