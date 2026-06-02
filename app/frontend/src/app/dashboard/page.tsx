'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { unitApi, serviceLogApi, reportApi, partnerApi } from '@/lib/api';
import { Calendar, Users, TrendingUp, Cpu, RefreshCw, BarChart2, Activity, ShieldAlert, ChevronRight } from 'lucide-react';
import styles from './dashboard.module.css';

const StatsGrid = dynamic(() => import('@/components/dashboard/StatsGrid'), {
  loading: () => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '24px',
    }}>
      {[1,2,3,4,5,6].map(i => (
        <div key={i} style={{
          height: '110px',
          borderRadius: '20px',
          background: 'rgba(255,255,255,0.5)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.4)',
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
      ))}
    </div>
  ),
  ssr: false
});

const formatRelativeTime = (date: Date) => {
  const diffMs = new Date().getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit yang lalu`;
  if (diffHours < 24) return `${diffHours} jam yang lalu`;
  if (diffDays === 1) return 'Kemarin';
  if (diffDays < 0) return 'Akan datang';
  return `${diffDays} hari yang lalu`;
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [liveTime, setLiveTime] = useState<string>('');
  const [statsData, setStatsData] = useState({
    activeUnits: 0,
    underWarranty: 0,
    openReports: 0,
    issuesDetected: 0,
    activePartners: 0,
    fleetHealth: 0,
  });
  
  const [chartData, setChartData] = useState<any[]>([]);
  const [activeClients, setActiveClients] = useState<any[]>([]);
  const [frequentUnits, setFrequentUnits] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [upcomingPMs, setUpcomingPMs] = useState<any[]>([]);
  const [warrantyIssues, setWarrantyIssues] = useState<any[]>([]);
  const [hoveredPoint, setHoveredPoint] = useState<any>(null);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setLiveTime(now.toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      }) + ' WIB');
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async (isSync = false) => {
    if (isSync) setSyncing(true);
    else setLoading(true);

    try {
      let user = null;
      try {
        const userData = localStorage.getItem('user');
        if (userData && userData !== 'undefined' && userData !== 'null') {
          user = JSON.parse(userData);
        }
      } catch { }
      const isAdmin = user?.role === 'ADMIN';

      const [unitsRes, serviceLogsRes, reportsRes, partnersRes] = await Promise.all([
        isAdmin ? unitApi.findAll(1, 1000) : unitApi.findMyFleet(),
        serviceLogApi.findAll(1, 1000),
        reportApi.findAll(1, 1000),
        partnerApi.findAll()
      ]);

      const rawUnits = unitsRes.data?.data || unitsRes.data || [];
      const rawLogs = serviceLogsRes.data?.data || serviceLogsRes.data || [];
      const rawReports = reportsRes.data?.data || reportsRes.data || [];
      const rawPartners = partnersRes.data?.data || partnersRes.data || [];

      // 1. Compute stats
      const activeUnitsCount = rawUnits.length;
      const underWarrantyCount = rawUnits.filter((u: any) => {
        if (!u.warranty_expiry) return false;
        return new Date(u.warranty_expiry) > new Date();
      }).length;
      // Open Service Reports = total semua laporan yang tersimpan di sistem
      const openReportsCount = rawReports.length;
      // Critical Issues = laporan tipe Inspeksi & Analisis Masalah (unit bermasalah)
      const issuesDetectedCount = rawReports.filter((r: any) =>
        r.form_type === 'ISSUE_ANALYSIS' || r.type === 'ISSUE_ANALYSIS'
      ).length;
      const activePartnersCount = rawPartners.length;

      const computedHealth = activeUnitsCount > 0 
        ? Math.round((1 - (issuesDetectedCount / activeUnitsCount)) * 1000) / 10 
        : 99.4;

      setStatsData({
        activeUnits: activeUnitsCount,
        underWarranty: underWarrantyCount,
        openReports: openReportsCount,
        issuesDetected: issuesDetectedCount,
        activePartners: activePartnersCount,
        fleetHealth: computedHealth
      });

      // Filter logs to 1 year
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const oneYearLogs = rawLogs.filter((log: any) => {
        const d = new Date(log.created_at || log.date || new Date());
        return d >= oneYearAgo;
      });

      // 2. Chart (12 Months)
      const last12Months = Array.from({ length: 12 }).map((_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (11 - i));
        return {
          key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
          label: d.toLocaleDateString('id-ID', { month: 'short' }),
          fullName: d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
          count: 0,
          completed: 0,
          pending: 0,
        };
      });

      oneYearLogs.forEach((log: any) => {
        const logDate = new Date(log.created_at || log.date || new Date());
        const logKey = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, '0')}`;
        const monthMatch = last12Months.find(m => m.key === logKey);
        if (monthMatch) {
          monthMatch.count++;
          if (log.status === 'COMPLETED') monthMatch.completed++;
          else monthMatch.pending++;
        }
      });
      setChartData(last12Months);

      // 3. Klien Teraktif (1 year)
      const clientCounts: Record<string, number> = {};
      oneYearLogs.forEach((log: any) => {
         const clientName = log.unit?.current_client?.company_name || log.client?.company_name || 'Umum / Stock HQ';
         clientCounts[clientName] = (clientCounts[clientName] || 0) + 1;
      });
      const activeClientsList = Object.entries(clientCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
      if (activeClientsList.length === 0) activeClientsList.push({ name: 'Umum / Stock HQ', count: 0 });
      setActiveClients(activeClientsList);

      // 4. Unit Sering Servis (1 year, top 5)
      const unitServiceCounts: Record<string, { model: string, count: number }> = {};
      oneYearLogs.forEach((log: any) => {
        const sn = log.unit?.serial_number || '-';
        const model = log.unit?.model_name || 'Unknown Model';
        if (!unitServiceCounts[sn]) {
          unitServiceCounts[sn] = { model, count: 0 };
        }
        unitServiceCounts[sn].count++;
      });
      const frequentUnitsList = Object.entries(unitServiceCounts)
        .map(([sn, val]) => ({ sn, name: val.model, count: val.count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      setFrequentUnits(frequentUnitsList);

      // 5. Schedules (Today & Tomorrow)
      const today = new Date();
      today.setHours(0,0,0,0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const schedulesToday: any[] = [];
      const schedulesTomorrow: any[] = [];
      
      rawLogs.forEach((log: any) => {
        if (log.status !== 'COMPLETED') {
           const sDate = new Date(log.scheduled_date || log.date || new Date());
           sDate.setHours(0,0,0,0);
           const act = {
              id: `log-${log.id}`,
              type: 'info',
              title: 'Servis Terjadwal',
              description: `${log.unit?.model_name || 'Unit'} (${log.unit?.serial_number || '-'}) diservis oleh ${log.partner?.name || 'Partner'}`,
              timeStr: '', // We use section headers instead
              section: sDate.getTime() === today.getTime() ? 'Hari Ini' : 'Besok'
           };
           if (sDate.getTime() === today.getTime()) {
             schedulesToday.push(act);
           } else if (sDate.getTime() === tomorrow.getTime()) {
             schedulesTomorrow.push(act);
           }
        }
      });
      
      // If none, provide empty state hint
      const combinedSchedules = [
        ...(schedulesToday.length > 0 ? schedulesToday : [{ id: 'empty-today', type: 'empty', section: 'Hari Ini', title: 'Tidak ada jadwal hari ini', description: 'Semua aman terkendali.' }]),
        ...(schedulesTomorrow.length > 0 ? schedulesTomorrow : [{ id: 'empty-tomorrow', type: 'empty', section: 'Besok', title: 'Tidak ada jadwal besok', description: 'Semua aman terkendali.' }])
      ];
      setRecentActivities(combinedSchedules);

      // 6. Warranty Issues (New Block)
      const warrantyIssuesCount: Record<string, { model: string, count: number }> = {};
      rawLogs.forEach((log: any) => {
         const logDate = new Date(log.created_at || log.date || new Date());
         if (log.unit && log.unit.warranty_end) {
            const wEnd = new Date(log.unit.warranty_end);
            if (logDate <= wEnd) {
               const sn = log.unit.serial_number;
               if (!warrantyIssuesCount[sn]) {
                  warrantyIssuesCount[sn] = { model: log.unit.model_name, count: 0 };
               }
               warrantyIssuesCount[sn].count++;
            }
         }
      });
      const wIssuesList = Object.entries(warrantyIssuesCount)
        .map(([sn, val]) => ({ sn, name: val.model, count: val.count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      setWarrantyIssues(wIssuesList);

      // 7. Scheduled PMs (Upcoming)
      const pms = rawLogs
        .filter((log: any) => log.status === 'PENDING')
        .map((log: any) => {
          const sDate = new Date(log.scheduled_date || log.date || new Date());
          const diffDays = Math.ceil((sDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          let statusPill = `${diffDays} hari lagi`;
          if (diffDays < 0) statusPill = 'Lewat Jadwal';
          if (diffDays === 0) statusPill = 'Hari Ini';
          if (diffDays === 1) statusPill = 'Besok';

          return {
            id: log.id,
            day: sDate.getDate(),
            month: sDate.toLocaleDateString('id-ID', { month: 'short' }),
            model: log.unit?.model_name || 'Compressor Unit',
            sn: log.unit?.serial_number || '-',
            partner: log.partner?.name || 'Mitra Resmi Holicindo',
            relative: statusPill
          };
        })
        .slice(0, 4);

      setUpcomingPMs(pms);

    } catch (error) {
      console.warn('Dashboard real-time sync loaded fallbacks:', error);
      setChartData([]);
      setActiveClients([]);
      setFrequentUnits([]);
      setRecentActivities([]);
      setUpcomingPMs([]);
      setWarrantyIssues([]);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getDualSplinePaths = () => {
    if (!chartData || chartData.length === 0) return { completedLine: '', completedFill: '', pendingLine: '', pendingFill: '', points: [] };
    
    const pointsCount = chartData.length;
    const maxVal = Math.max(...chartData.map(c => Math.max(c.completed, c.pending)), 4);

    const getPath = (dataKey: 'completed' | 'pending') => {
      const points = chartData.map((d, i) => {
        const x = 5 + (i / (pointsCount - 1)) * 90;
        const y = 85 - (d[dataKey] / maxVal) * 70; // 85 is bottom, 15 is top
        return { x, y, ...d };
      });

      let linePath = `M ${points[0].x} ${points[0].y}`;
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const cp1x = p0.x + (p1.x - p0.x) / 2.5;
        const cp2x = p0.x + (p1.x - p0.x) / 1.5;
        linePath += ` C ${cp1x} ${p0.y}, ${cp2x} ${p1.y}, ${p1.x} ${p1.y}`;
      }
      const fillPath = `${linePath} L 95 100 L 5 100 Z`;
      return { linePath, fillPath, points };
    };

    const comp = getPath('completed');
    const pend = getPath('pending');

    return { 
      completedLine: comp.linePath, completedFill: comp.fillPath, 
      pendingLine: pend.linePath, pendingFill: pend.fillPath, 
      points: comp.points 
    };
  };

  const { completedLine, completedFill, pendingLine, pendingFill, points } = getDualSplinePaths();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h1 className={styles.title}>
            <Cpu size={28} style={{ color: 'var(--color-cobalt-blue)', strokeWidth: 2 }} />
            Ringkasan Armada
          </h1>
          <p className={styles.updateTime}>
            Sistem Pemantauan Unit & Diagnostik Pemeliharaan Terpadu
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            className={styles.syncBtn} 
            onClick={() => fetchDashboardData(true)} 
            disabled={syncing || loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(0,31,63,0.08)',
              padding: '8px 16px',
              borderRadius: '24px',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: 'var(--color-deep-navy)',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,31,63,0.02)',
              transition: 'all 0.2s',
            }}
          >
            <RefreshCw size={14} className={syncing ? styles.spin : ''} style={{ color: 'var(--color-cobalt-blue)' }} />
            {syncing ? 'Menyingkronkan...' : 'Singkronkan Data'}
          </button>
        </div>
      </header>
      
      <StatsGrid data={statsData} loading={loading} />
      
      <div className={styles.bottomSection}>
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Spline Area Chart Section (12 Months) */}
          <div className={styles.chartCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <h3 className={styles.chartTitle} style={{ margin: 0 }}>
                  <TrendingUp size={18} style={{ color: '#E11D48' }} />
                  Tren Aktivitas Servis (12 Bulan Terakhir)
                </h3>
                <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--color-space-grey)' }}>Membandingkan jumlah servis selesai vs yang masih pending secara bulanan.</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                <span style={{
                  fontSize: '0.72rem', background: 'rgba(0,196,140,0.08)', color: '#00C48C',
                  padding: '4px 10px', borderRadius: '12px', fontWeight: 800, letterSpacing: '0.5px',
                  display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                  <span style={{ width: '6px', height: '6px', background: '#00C48C', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1.2s infinite' }}></span>
                  REAL-TIME SYNCED ({liveTime || 'Live Clock'})
                </span>
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.72rem', fontWeight: 700 }}>
                  <span style={{ color: '#E11D48' }}>● Pending</span>
                  <span style={{ color: '#00C48C' }}>● Selesai</span>
                </div>
              </div>
            </div>
            
            <div style={{ position: 'relative', width: '100%', height: '240px' }}>
              {loading ? (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}>
                  <RefreshCw size={24} className={styles.spin} style={{ color: 'var(--color-cobalt-blue)' }} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-space-grey)', fontWeight: 600 }}>Memuat Grafik Aktivitas...</span>
                </div>
              ) : (
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="comp-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00C48C" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#00C48C" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="pend-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#E11D48" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#E11D48" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    <line x1="0" y1="15" x2="100" y2="15" stroke="rgba(0,31,63,0.03)" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
                    <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(0,31,63,0.03)" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
                    <line x1="0" y1="85" x2="100" y2="85" stroke="rgba(0,31,63,0.06)" vectorEffect="non-scaling-stroke" />

                    {completedFill && <path d={completedFill} fill="url(#comp-grad)" />}
                    {pendingFill && <path d={pendingFill} fill="url(#pend-grad)" />}

                    {pendingLine && (
                      <path d={pendingLine} stroke="#E11D48" strokeWidth="2.5" fill="none" vectorEffect="non-scaling-stroke" />
                    )}
                    {completedLine && (
                      <path d={completedLine} stroke="#00C48C" strokeWidth="2.5" fill="none" vectorEffect="non-scaling-stroke" />
                    )}
                  </svg>
                  
                  {points.map((p, idx) => (
                    <div 
                      key={idx}
                      style={{
                        position: 'absolute',
                        left: `${p.x}%`,
                        top: 0,
                        bottom: 0,
                        width: `${90 / Math.max(1, points.length - 1)}%`,
                        minWidth: '20px',
                        transform: 'translateX(-50%)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        zIndex: 10
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
                        marginBottom: '4px',
                        transition: 'all 0.2s'
                      }}>
                        {p.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {hoveredPoint && (
                <div 
                  style={{
                    position: 'absolute',
                    top: '0px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(0, 31, 63, 0.08)',
                    padding: '10px 16px',
                    borderRadius: '12px',
                    boxShadow: '0 10px 30px rgba(0, 31, 63, 0.08)',
                    zIndex: 200,
                    pointerEvents: 'none',
                    animation: 'fadeIn 0.2s ease',
                    textAlign: 'center',
                    minWidth: '170px',
                  }}
                >
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--color-space-grey)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                    {hoveredPoint.fullName}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#E11D48' }}>
                      <span>● Pending</span>
                      <span style={{ fontWeight: 800 }}>{hoveredPoint.pending}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#00C48C' }}>
                      <span>● Selesai</span>
                      <span style={{ fontWeight: 800 }}>{hoveredPoint.completed}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Aktivitas Terkini (Hari Ini & Besok) - MOVED HERE */}
          <div className={styles.listCard} style={{ background: 'var(--color-optic-white)' }}>
            <h3 className={styles.listTitle} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '12px', marginBottom: '16px' }}>
              <Activity size={16} style={{ color: '#00C48C', marginRight: '6px', verticalAlign: 'middle' }} />
              Aktivitas Terkini
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
              {/* KOLOM HARI INI */}
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '20px', paddingLeft: '8px' }}>
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  bottom: '8px',
                  left: '15px',
                  width: '2px',
                  background: 'rgba(0, 31, 63, 0.06)'
                }} />
                
                <div style={{ marginLeft: '28px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-space-grey)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Hari Ini
                </div>

                {loading ? (
                  [1,2].map(i => (
                    <div key={i} style={{ height: '40px', background: '#F1F5F9', borderRadius: '6px', animation: 'pulse 1.5s infinite', marginLeft: '24px' }}></div>
                  ))
                ) : (
                  recentActivities.filter(a => a.section === 'Hari Ini').map(act => (
                    <div key={act.id} style={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
                      <div style={{
                        position: 'absolute',
                        left: '8px',
                        top: '4px',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: 'white',
                        border: `3px solid ${act.type === 'empty' ? 'var(--color-space-grey)' : 'var(--color-cobalt-blue)'}`,
                        boxShadow: `0 0 8px rgba(46,91,255,0.2)`,
                        zIndex: 2,
                      }} />

                      <div style={{ marginLeft: '32px', display: 'flex', flexDirection: 'column', gap: '2px', width: '100%' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: act.type === 'empty' ? 'var(--color-space-grey)' : 'var(--color-deep-navy)' }}>
                          {act.title}
                        </span>
                        <span style={{ fontSize: '0.74rem', color: 'var(--color-space-grey)', lineHeight: 1.35 }}>
                          {act.description}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* KOLOM BESOK */}
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '20px', paddingLeft: '8px' }}>
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  bottom: '8px',
                  left: '15px',
                  width: '2px',
                  background: 'rgba(0, 31, 63, 0.06)'
                }} />
                
                <div style={{ marginLeft: '28px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-space-grey)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Besok
                </div>

                {loading ? (
                  [1,2].map(i => (
                    <div key={i} style={{ height: '40px', background: '#F1F5F9', borderRadius: '6px', animation: 'pulse 1.5s infinite', marginLeft: '24px' }}></div>
                  ))
                ) : (
                  recentActivities.filter(a => a.section === 'Besok').map(act => (
                    <div key={act.id} style={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
                      <div style={{
                        position: 'absolute',
                        left: '8px',
                        top: '4px',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: 'white',
                        border: `3px solid ${act.type === 'empty' ? 'var(--color-space-grey)' : 'var(--color-cobalt-blue)'}`,
                        boxShadow: `0 0 8px rgba(46,91,255,0.2)`,
                        zIndex: 2,
                      }} />

                      <div style={{ marginLeft: '32px', display: 'flex', flexDirection: 'column', gap: '2px', width: '100%' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: act.type === 'empty' ? 'var(--color-space-grey)' : 'var(--color-deep-navy)' }}>
                          {act.title}
                        </span>
                        <span style={{ fontSize: '0.74rem', color: 'var(--color-space-grey)', lineHeight: 1.35 }}>
                          {act.description}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Jadwal Pemeliharaan Preventif (PM) Terdekat - MOVED HERE */}
          <div className={styles.listCard} style={{ background: 'var(--color-optic-white)', flex: 1, display: 'flex', flexDirection: 'column', margin: 0 }}>
            <h3 className={styles.listTitle} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '12px', marginBottom: '16px' }}>
              <Calendar size={16} style={{ color: 'var(--color-cobalt-blue)', marginRight: '6px', verticalAlign: 'middle' }} />
              Jadwal Pemeliharaan Preventif (PM) Terdekat
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', flex: 1 }}>
              {loading ? (
                [1, 2].map(i => (
                  <div key={i} style={{ height: '70px', background: '#F1F5F9', borderRadius: '12px', animation: 'pulse 1.5s infinite' }}></div>
                ))
              ) : (
                upcomingPMs.map((pm) => (
                  <div 
                    key={pm.id} 
                    style={{
                      background: 'rgba(46,91,255,0.02)',
                      border: '1px solid rgba(46,91,255,0.06)',
                      borderRadius: '12px',
                      padding: '16px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.2s',
                      height: '100%',
                    }}
                  >
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      background: 'rgba(46,91,255,0.08)',
                      color: 'var(--color-cobalt-blue)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: 1,
                      flexShrink: 0,
                    }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 850 }}>{pm.day}</span>
                      <span style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', marginTop: '2px' }}>{pm.month}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden', width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--color-deep-navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {pm.sn}
                        </span>
                        <span style={{
                          fontSize: '0.65rem',
                          background: 'rgba(0,196,140,0.08)',
                          color: '#00C48C',
                          padding: '2px 8px',
                          borderRadius: '8px',
                          fontWeight: 800,
                          flexShrink: 0,
                        }}>
                          {pm.relative}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.74rem', color: 'var(--color-space-grey)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {pm.model}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--color-space-grey)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <Users size={12} style={{ color: 'var(--color-cobalt-blue)' }} /> {pm.partner}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className={styles.listsSection}>
          
          <div className={styles.listCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <h3 className={styles.listTitle} style={{ marginBottom: 0 }}>
                <Users size={16} style={{ color: 'var(--color-cobalt-blue)', marginRight: '6px', verticalAlign: 'middle' }} />
                Klien Teraktif
              </h3>
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--color-space-grey)', marginBottom: '16px' }}>
              Berdasarkan servis dalam 12 bulan terakhir.
            </p>
            
            <div className={styles.listItems}>
              {loading ? (
                [1,2,3].map(i => (
                  <div key={i} style={{ height: '30px', background: '#F1F5F9', borderRadius: '6px', animation: 'pulse 1.5s infinite' }}></div>
                ))
              ) : (
                activeClients.map((client, idx) => (
                  <div key={idx} className={styles.listItem}>
                    <span className={styles.clientName} style={{ fontWeight: 600 }}>{client.name}</span>
                    <span className={styles.clientCount} style={{ background: 'rgba(46,91,255,0.06)', color: 'var(--color-cobalt-blue)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.78rem' }}>{client.count} Servis</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={styles.listCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <h3 className={styles.listTitle} style={{ marginBottom: 0 }}>
                <BarChart2 size={16} style={{ color: 'var(--color-safety-orange)', marginRight: '6px', verticalAlign: 'middle' }} />
                Unit Sering Servis
              </h3>
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--color-space-grey)', marginBottom: '16px' }}>
              Unit dengan laporan servis terbanyak dalam 12 bulan.
            </p>
            
            <div className={styles.listItems}>
              {loading ? (
                [1,2,3,4,5].map(i => (
                  <div key={i} style={{ height: '40px', background: '#F1F5F9', borderRadius: '6px', animation: 'pulse 1.5s infinite' }}></div>
                ))
              ) : (
                <>
                  {frequentUnits.map((unit, idx) => (
                    <div key={idx} className={styles.listItem} style={{ flexDirection: 'column', gap: '2px', alignItems: 'stretch' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className={styles.unitName} style={{ fontWeight: 700, color: 'var(--color-deep-navy)' }}>{unit.sn}</span>
                        <span className={styles.unitCount} style={{ fontSize: '0.8rem', fontWeight: 800 }}>{unit.count}x Servis</span>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-space-grey)' }}>{unit.name}</span>
                    </div>
                  ))}
                  {frequentUnits.length > 0 && (
                    <button style={{
                      marginTop: '8px',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--color-cobalt-blue)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      padding: '8px',
                      borderRadius: '8px',
                    }}>
                      Lihat Selengkapnya... <ChevronRight size={14} />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* NEW BLOCK: Warranty Issues */}
          <div className={styles.listCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <h3 className={styles.listTitle} style={{ marginBottom: 0 }}>
                <ShieldAlert size={16} style={{ color: '#E11D48', marginRight: '6px', verticalAlign: 'middle' }} />
                Warranty Issues
              </h3>
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--color-space-grey)', marginBottom: '16px' }}>
              Unit yang diservis padahal masih dalam masa garansi.
            </p>
            
            <div className={styles.listItems}>
              {loading ? (
                [1,2,3].map(i => (
                  <div key={i} style={{ height: '40px', background: '#F1F5F9', borderRadius: '6px', animation: 'pulse 1.5s infinite' }}></div>
                ))
              ) : (
                warrantyIssues.length === 0 ? (
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-space-grey)', textAlign: 'center', padding: '16px 0' }}>
                    Tidak ada masalah garansi tercatat.
                  </div>
                ) : (
                  warrantyIssues.map((unit, idx) => (
                    <div key={idx} className={styles.listItem} style={{ flexDirection: 'column', gap: '2px', alignItems: 'stretch' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className={styles.unitName} style={{ fontWeight: 700, color: 'var(--color-deep-navy)' }}>{unit.sn}</span>
                        <span className={styles.unitCount} style={{ fontSize: '0.75rem', fontWeight: 800, color: '#E11D48', background: 'rgba(225, 29, 72, 0.08)', padding: '2px 6px', borderRadius: '6px' }}>
                          {unit.count} Kasus
                        </span>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-space-grey)' }}>{unit.name}</span>
                    </div>
                  ))
                )
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
