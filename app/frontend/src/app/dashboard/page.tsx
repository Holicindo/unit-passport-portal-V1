'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import styles from './dashboard.module.css';

const StatsGrid = dynamic(() => import('@/components/dashboard/StatsGrid'), {
  loading: () => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '24px',
    }}>
      {[1,2,3,4].map(i => (
        <div key={i} style={{
          height: '120px',
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
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
  }, []);

  const now = new Date();
  
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          Ringkasan Armada
        </h1>
        <p className={styles.updateTime}>
          Terakhir diperbarui: {now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </header>
      
      <StatsGrid />
      
      {/* Dashboard Bottom Section */}
      <div className={styles.bottomSection}>
        {/* Chart Section */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>
            Aktivitas Servis Bulanan
          </h3>
          
          <div className={styles.chartArea}>
            {/* Dummy Bars representing chart data */}
            <div className={styles.bar} style={{ height: '40%' }}></div>
            <div className={styles.bar} style={{ height: '0%' }}></div>
            <div className={styles.bar} style={{ height: '60%' }}></div>
            <div className={styles.bar} style={{ height: '100%' }}></div>
            <div className={styles.bar} style={{ height: '60%' }}></div>
            <div className={styles.bar} style={{ height: '0%' }}></div>
            <div className={styles.bar} style={{ height: '40%' }}></div>
          </div>
        </div>

        {/* Lists Section */}
        <div className={styles.listsSection}>
          
          <div className={styles.listCard}>
            <h3 className={styles.listTitle}>
              Klien Teraktif
            </h3>
            
            <div className={styles.listItems}>
              <div className={styles.listItem}>
                <span className={styles.clientName}>PT Indah Putih</span>
                <span className={styles.clientCount}>14 Unit</span>
              </div>
              <div className={styles.listItem}>
                <span className={styles.clientName}>CV Mega Logistik</span>
                <span className={styles.clientCount}>9 Unit</span>
              </div>
              <div className={styles.listItem}>
                <span className={styles.clientName}>Mitra Abadi</span>
                <span className={styles.clientCount}>5 Unit</span>
              </div>
            </div>
          </div>

          <div className={styles.listCard}>
            <h3 className={styles.listTitle}>
              Unit Sering Servis
            </h3>
            
            <div className={styles.listItems}>
              <div className={styles.listItem}>
                <span className={styles.unitName}>HOLI-CP-001</span>
                <span className={styles.unitCount}>3x</span>
              </div>
              <div className={styles.listItem}>
                <span className={styles.unitName}>HOLI-CP-042</span>
                <span className={styles.unitCount}>2x</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
