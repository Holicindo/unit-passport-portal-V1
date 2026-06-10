'use client';

import dynamic from 'next/dynamic';
import { Cpu, RefreshCw } from 'lucide-react';
import { useDashboardData } from './hooks/useDashboardData';
import ServiceTrendChart from './components/ServiceTrendChart';
import { RecentActivity, UpcomingPM } from './components/ActivityAndPM';
import RightColumn from './components/RightColumn';
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

export default function DashboardPage() {
  const {
    loading, syncing, liveTime, statsData, chartData,
    activeClients, frequentUnits, recentActivities, upcomingPMs,
    frequentCallIds, overdueCallIds, warrantyCategories,
    fetchDashboardData,
  } = useDashboardData();

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
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,31,63,0.08)',
              padding: '8px 16px', borderRadius: '24px', fontSize: '0.82rem',
              fontWeight: 700, color: 'var(--color-deep-navy)', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,31,63,0.02)', transition: 'all 0.2s',
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
          <ServiceTrendChart chartData={chartData} loading={loading} liveTime={liveTime} />
          <RecentActivity activities={recentActivities} loading={loading} />
          <UpcomingPM pms={upcomingPMs} loading={loading} />
        </div>

        {/* RIGHT COLUMN */}
        <RightColumn
          loading={loading}
          activeClients={activeClients}
          frequentCallIds={frequentCallIds}
          overdueCallIds={overdueCallIds}
          warrantyCategories={warrantyCategories}
        />
      </div>
    </div>
  );
}
