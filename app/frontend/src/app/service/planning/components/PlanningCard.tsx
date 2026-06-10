'use client';

import { Building, MapPin, CheckCircle, Wrench } from 'lucide-react';
import styles from '../planning.module.css';

interface PlanningCardProps {
  unit: any;
  nextPmDate: Date;
  daysRemaining: number;
  statusLabel: string;
  statusText: string;
  lastPmDate: Date | null;
  onAssign: () => void;
}

function formatDate(date: Date | null) {
  if (!date) return 'Belum Pernah';
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PlanningCard({
  unit, nextPmDate, daysRemaining, statusLabel, statusText, lastPmDate, onAssign,
}: PlanningCardProps) {
  return (
    <div className={styles.planningCard}>
      <div className={styles.cardHeader}>
        <div className={styles.unitInfo}>
          <h3 className={styles.modelName}>{unit.model_name}</h3>
          <span className={styles.serialNumber}>SN: {unit.serial_number}</span>
        </div>
        <span className={`${styles.statusBadge} ${
          statusLabel === 'DUE' ? styles.statusDue :
          statusLabel === 'OVERDUE' ? styles.statusOverdue :
          styles.statusScheduled
        }`}>
          {statusText}
        </span>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.metaRow}>
          <Building size={16} className={styles.metaIcon} />
          <span className={styles.metaLabel}>Pemilik Resmi:</span>
          <span>{unit.current_client?.company_name || 'Internal Stock'}</span>
        </div>
        <div className={styles.metaRow}>
          <MapPin size={16} className={styles.metaIcon} />
          <span className={styles.metaLabel}>Kota Lokasi:</span>
          <span>{unit.current_client?.city || 'Jakarta (HQ)'}</span>
        </div>
        <div className={styles.metaRow}>
          <CheckCircle size={16} className={styles.metaIcon} />
          <span className={styles.metaLabel}>PM Terakhir:</span>
          <span>{formatDate(lastPmDate)}</span>
        </div>

        <div className={styles.forecastBox}>
          <span className={styles.forecastTitle}>Inspeksi PM Terdekat</span>
          <span className={styles.forecastDate}>{formatDate(nextPmDate)}</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: statusLabel === 'DUE' ? 'var(--color-safety-orange)' : 'var(--color-space-grey)' }}>
            ({daysRemaining} hari lagi)
          </span>
        </div>
      </div>

      <div className={styles.cardFooter}>
        <button className={styles.assignBtn} onClick={onAssign}>
          <Wrench size={16} />
          <span>Tugaskan Inspeksi PM</span>
        </button>
      </div>
    </div>
  );
}
