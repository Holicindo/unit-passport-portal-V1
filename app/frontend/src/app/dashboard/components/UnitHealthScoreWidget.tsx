'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { healthScoreApi } from '@/lib/api';
import styles from './UnitHealthScoreWidget.module.css';

export default function UnitHealthScoreWidget() {
  const [scores, setScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const { data } = await healthScoreApi.getActive();
        setScores(data || []);
      } catch (error) {
        console.error("Failed to fetch health scores", error);
        setScores([]);
      } finally {
        setLoading(false);
      }
    };
    fetchScores();
    const interval = setInterval(fetchScores, 300000);
    return () => clearInterval(interval);
  }, []);

  const totalUnits = scores.length;
  const healthyUnits = scores.filter(s => s.overall_score >= 80).length;
  const atRiskUnits = scores.filter(s => s.overall_score < 80 && s.overall_score >= 50).length;
  const criticalUnits = scores.filter(s => s.overall_score < 50).length;

  return (
    <div className={styles.wrapper}>
      {/* Header tanpa icon di pinggir judul dan tanpa V2 */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h3 className={styles.title}>Kesehatan Unit &amp; Prediksi Kerusakan</h3>
          <span className={styles.subtitle}>
            {loading
              ? 'Menghitung skor kesehatan unit...'
              : `Berdasarkan kalkulasi TIB dan HDM dari ${totalUnits} unit aktif`}
          </span>
        </div>
        {!loading && (
          <div className={styles.badgeSuccess}>
            <span className={styles.badgeSuccessDot} />
            {healthyUnits} Optimal
          </div>
        )}
      </div>

      <div className={styles.body}>
        {/* Ringkasan Status 3 Kategori */}
        <div className={styles.statsGrid}>
          <div className={`${styles.statCard} ${styles.statHealthy}`}>
            <span className={styles.statLabel}>Sehat (Score &ge; 80)</span>
            <div className={styles.statValue} style={{ color: '#059669' }}>
              {healthyUnits} <span className={styles.statUnit}>Unit</span>
            </div>
          </div>
          
          <div className={`${styles.statCard} ${styles.statWarning}`}>
            <span className={styles.statLabel}>Berisiko (Score 50-79)</span>
            <div className={styles.statValue} style={{ color: '#d97706' }}>
              {atRiskUnits} <span className={styles.statUnit}>Unit</span>
            </div>
          </div>

          <div className={`${styles.statCard} ${styles.statCritical}`}>
            <span className={styles.statLabel}>Kritis (Score &lt; 50)</span>
            <div className={styles.statValue} style={{ color: '#dc2626' }}>
              {criticalUnits} <span className={styles.statUnit}>Unit</span>
            </div>
          </div>
        </div>

        {/* Daftar Skor Unit */}
        {!loading && scores.length > 0 && (
          <div className={styles.unitListSection}>
            <div className={styles.unitListTitle}>
              <span>Daftar Skor Terbaru</span>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>Real-time telemetry</span>
            </div>

            <div className={styles.unitGrid}>
              {scores.slice(0, 6).map((score) => {
                const isOptimal = score.overall_score >= 80;
                const isWarning = score.overall_score >= 50 && score.overall_score < 80;
                const scoreClass = isOptimal
                  ? styles.scorePillOptimal
                  : isWarning
                  ? styles.scorePillWarning
                  : styles.scorePillCritical;

                return (
                  <div key={score.id} className={styles.unitCard}>
                    <div className={styles.unitCardLeft}>
                      <div className={styles.unitCardHeader}>
                        <span className={styles.unitSn}>
                          SN: {score.unit?.serial_number || 'Unknown'}
                        </span>
                        <span className={`${styles.scorePill} ${scoreClass}`}>
                          Score: {Number(score.overall_score).toFixed(1)}
                        </span>
                      </div>
                      <div className={styles.unitMetrics}>
                        <span>TIB: {Number(score.tib_percentage).toFixed(1)}%</span>
                        <span className={styles.metricDivider}>•</span>
                        <span>HDM: {Number(score.hdm_value).toFixed(1)}</span>
                      </div>
                    </div>

                    <Link
                      href={`/id/${score.unit?.serial_number}`}
                      className={styles.btnDetail}
                    >
                      Lihat Unit
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
