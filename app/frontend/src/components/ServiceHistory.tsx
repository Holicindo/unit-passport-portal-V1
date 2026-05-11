import styles from './ServiceHistory.module.css';
import type { ServiceLog } from '@/lib/mock-data';

interface ServiceHistoryProps {
  logs: ServiceLog[];
}

export default function ServiceHistory({ logs }: ServiceHistoryProps) {
  if (logs.length === 0) {
    return (
      <div className={styles.card}>
        <h2 className={styles.title}>Service History</h2>
        <p className={styles.empty}>No service records found for this unit.</p>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Verified Service History</h2>
      <div className={styles.timeline}>
        {logs.map((log, index) => (
          <div key={log.id} className={styles.entry}>
            <div className={styles.timelineLine}>
              <div className={styles.dot} />
              {index < logs.length - 1 && <div className={styles.line} />}
            </div>
            <div className={styles.content}>
              <div className={styles.entryHeader}>
                <span className={styles.logType}>{log.type}</span>
                <span className={styles.logDate}>{log.date}</span>
              </div>
              <div className={styles.logMeta}>
                <span>🔧 {log.technician}</span>
                <span>·</span>
                <span>{log.partner}</span>
              </div>
              <p className={styles.logNotes}>{log.notes}</p>
              <span className={styles.logStatus} data-status={log.status}>
                ✓ {log.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
