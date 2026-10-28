'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useDashboardData } from './hooks/useDashboardData';
import ServiceTrendChart from './components/ServiceTrendChart';
import { RecentActivity, UpcomingPM } from './components/ActivityAndPM';
import RightColumn, {
  FrequentComplaintsCard,
  WarrantyDistributionCard,
  NewServiceRequestsCard,
  ActiveClientsCard,
  OverdueTicketsCard,
} from './components/RightColumn';
import styles from './dashboard.module.css';

const StatsGrid = dynamic(() => import('@/components/dashboard/StatsGrid'), {
  loading: () => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '24px',
    }}>
      {[1, 2, 3, 4, 5, 6].map(i => (
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

import IotAlertsAndAnalyticsWidget, { IotTelemetryCard, SlaMetricsCard } from './components/IotAlertsAndAnalyticsWidget';

export default function DashboardPage() {
  const {
    loading, syncing, liveTime, statsData, chartData,
    activeClients, frequentUnits, recentActivities, upcomingPMs,
    frequentCallIds, overdueCallIds, warrantyCategories, newServiceRequests,
    fetchDashboardData,
  } = useDashboardData();

  // Listen to TopBar sync trigger
  useEffect(() => {
    const handleSyncRequest = () => {
      fetchDashboardData(true);
    };
    window.addEventListener('request-dashboard-sync', handleSyncRequest);
    return () => window.removeEventListener('request-dashboard-sync', handleSyncRequest);
  }, [fetchDashboardData]);

  // Sync state notification to TopBar
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('dashboard-sync-state', { detail: syncing }));
  }, [syncing]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <h1 className={styles.title}>
            Dashboard
          </h1>
          <p className={styles.updateTime}>
            Sistem Pemantauan Unit & Diagnostik Pemeliharaan Terpadu
          </p>
        </div>
      </header>

      <StatsGrid data={statsData} loading={loading} />

      {/* DESKTOP VIEW: IotAlertsAndAnalyticsWidget lengkap berdampingan */}
      <div className={styles.desktopUpcomingPm} style={{ marginTop: '16px' }}>
        <IotAlertsAndAnalyticsWidget activeClients={activeClients} />
      </div>

      {/* MOBILE VIEW: Telemetri IoT -> 4 Card Prioritas -> Kinerja SLA Jaringan Mitra */}
      <div className={styles.mobileTopCards} style={{ marginTop: '14px' }}>
        {/* Card 1: Telemetri IoT & Peringatan Otomatis */}
        <IotTelemetryCard />

        {/* 4 Card Prioritas (2 pasang) */}
        {/* Row 1: Permintaan Servis Masuk & Tiket Terbengkalai > 2 Minggu */}
        <div className={styles.mobilePairRow}>
          <NewServiceRequestsCard loading={loading} newServiceRequests={newServiceRequests} />
          <OverdueTicketsCard loading={loading} overdueCallIds={overdueCallIds} />
        </div>

        {/* Row 2: Klien Teraktif & Jadwal PM Terdekat */}
        <div className={styles.mobilePairRow}>
          <ActiveClientsCard loading={loading} activeClients={activeClients} />
          <UpcomingPM pms={upcomingPMs} loading={loading} />
        </div>

        {/* Card 2: Kinerja SLA Jaringan Mitra (ditukar di bawah 4 card prioritas) */}
        <div style={{ marginTop: '4px' }}>
          <SlaMetricsCard activeClients={activeClients} />
        </div>
      </div>

      <div className={styles.bottomSection}>
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <ServiceTrendChart chartData={chartData} loading={loading} liveTime={liveTime} />
          <RecentActivity activities={recentActivities} loading={loading} />
          <div className={styles.desktopUpcomingPm}>
            <UpcomingPM pms={upcomingPMs} loading={loading} />
          </div>

          <div className="frequent-warranty-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <FrequentComplaintsCard loading={loading} frequentCallIds={frequentCallIds} />
            <WarrantyDistributionCard loading={loading} warrantyCategories={warrantyCategories} />
          </div>
        </div>

        {/* RIGHT COLUMN (Visible on Desktop) */}
        <div className={styles.desktopRightColumn}>
          <RightColumn
            loading={loading}
            activeClients={activeClients}
            frequentCallIds={frequentCallIds}
            overdueCallIds={overdueCallIds}
            warrantyCategories={warrantyCategories}
            newServiceRequests={newServiceRequests}
          />
        </div>
      </div>
    </div>
  );
}
