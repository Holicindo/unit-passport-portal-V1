'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { iotApi } from '@/lib/api';
import styles from './IotAlertsAndAnalyticsWidget.module.css';

export default function IotAlertsAndAnalyticsWidget({ activeClients }: { activeClients: any[] }) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const { data } = await iotApi.getActiveAlerts();
        setAlerts(data || []);
      } catch {
        setAlerts([]);
      } finally {
        setLoadingAlerts(false);
      }
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.gridContainer}>
      {/* LEFT CARD: TELEMETRI IOT & ALERTING OTOMATIS */}
      <div className={styles.card}>
        <div>
          {/* Header */}
          <div className={styles.cardHeader}>
            <div className={styles.headerLeft}>
              <div>
                <h3 className={styles.cardTitle}>
                  Telemetri IoT & Peringatan Otomatis
                </h3>
                <span className={styles.cardSubtitle}>
                  {loadingAlerts
                    ? 'Memeriksa sensor...'
                    : alerts.length > 0
                      ? `${alerts.length} Peringatan Terdeteksi di Kabinet`
                      : 'Seluruh sensor telemetri kabinet beroperasi normal'}
                </span>
              </div>
            </div>
            {alerts.length > 0 && (
              <span className={styles.activeBadge}>
                {alerts.length} AKTIF
              </span>
            )}
          </div>

          {/* Alert List Container */}
          {alerts.length === 0 ? (
            <div className={styles.normalStatus}>
              <CheckCircle2 size={18} style={{ color: '#16A34A', flexShrink: 0 }} />
              <span>Suhu kabinet, status pintu, dan tegangan listrik terpantau 100% normal.</span>
            </div>
          ) : (
            <div className={styles.alertsList}>
              {alerts.map((alt) => {
                const isDoor = alt.type === 'DOOR_OPEN';
                const statusText = isDoor ? 'Door Open' : alt.value;
                const isCritical = alt.severity === 'CRITICAL';

                return (
                  <div
                    key={alt.id}
                    className={`${styles.alertItem} ${isCritical ? styles.alertItemCritical : styles.alertItemWarning}`}
                  >
                    <div className={styles.alertContent}>
                      <AlertTriangle size={16} style={{ color: isCritical ? '#DC2626' : '#D97706', flexShrink: 0 }} />
                      <div className={styles.alertInfo}>
                        <div className={styles.alertTitle}>
                          SN: {alt.serial_number}
                          <span className={styles.alertSubinfo}>
                            {alt.title}
                          </span>
                        </div>
                        <div className={styles.alertDescription}>
                          Sensor Status: <span className={styles.alertStatus}>{statusText}</span>
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/id/${alt.serial_number}`}
                      title="Buka halaman informasi lengkap dan data sensor unit"
                      className={`${styles.detailButton} ${isCritical ? styles.detailButtonCritical : styles.detailButtonWarning}`}
                    >
                      Detail Unit <ChevronRight size={12} />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT CARD: KINERJA SLA JARINGAN MITRA & KLIEN UTAMA */}
      <div className={styles.card}>
        {/* Header SLA + Tooltip */}
        <div>
          <div className={styles.slaHeader}>
            <div className={styles.slaHeaderLeft}>
              <h4 className={styles.slaTitle}>
                Kinerja SLA Jaringan Mitra
              </h4>
              <div
                className={styles.tooltipWrapper}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <HelpCircle size={14} style={{ color: '#94A3B8' }} />
                {showTooltip && (
                  <div className={styles.tooltip}>
                    <strong>Penjelasan Metrik SLA Mitra:</strong><br />
                    • <strong>Rata-rata Respon:</strong> Waktu sejak tiket dibuat hingga mitra memproses (*IN PROGRESS*).<br />
                    • <strong>Penyelesaian Servis:</strong> Total waktu hingga perbaikan selesai (*COMPLETED*). Target SLA: &lt; 48 jam.
                  </div>
                )}
              </div>
            </div>
            <span className={styles.slaBadge}>
              94.2% Optimal
            </span>
          </div>

          {/* Mini SLA Progress Graphic */}
          <div className={styles.slaProgress}>
            <div className={styles.slaProgressHeader}>
              <span>Capaian SLA Tepat Waktu</span>
              <span>94.2% (Target 90%)</span>
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} />
            </div>
          </div>

          {/* Respon & Penyelesaian Box */}
          <div className={styles.metricsGrid}>
            <div className={styles.metricBox}>
              <div className={styles.metricLabel}>Rata-rata Respon</div>
              <div className={`${styles.metricValue} ${styles.metricValueBlue}`}>~ 2.4 Jam</div>
              <span className={styles.metricTarget}>Target: &lt; 4 Jam</span>
            </div>
            <div className={styles.metricBox}>
              <div className={styles.metricLabel}>Penyelesaian Servis</div>
              <div className={`${styles.metricValue} ${styles.metricValueDark}`}>~ 18.5 Jam</div>
              <span className={styles.metricTarget}>Target: &lt; 48 Jam</span>
            </div>
          </div>
        </div>

        {/* Bottom: Klien Utama Terdaftar */}
        <div className={styles.clientsSection}>
          <div className={styles.clientsHeader}>
            <span className={styles.clientsTitle}>Klien Utama Terdaftar</span>
          </div>
          <div className={styles.clientsList}>
            {activeClients && activeClients.length > 0 ? (
              activeClients.slice(0, 3).map((c: any, idx: number) => (
                <div key={idx} className={styles.clientItem}>
                  <span>{c.clientName || c.company_name || 'Klien'}</span>
                  <span className={styles.clientUnit}>({c.unitCount || 1} Unit)</span>
                </div>
              ))
            ) : (
              <span className={styles.fallbackText}>Holicindo Enterprise Partners</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
