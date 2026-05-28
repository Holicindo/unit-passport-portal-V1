import styles from './PassportHeader.module.css';

interface PassportHeaderProps {
  serialNumber: string;
  modelName: string;
  clientName: string;
  outletName: string;
  status: string;
}

export default function PassportHeader({
  serialNumber,
  modelName,
  clientName,
  outletName,
  status,
}: PassportHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.topBar}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>⬡</span>
          <span className={styles.logoText}>HOLICINDO</span>
        </div>
        <span className={styles.poweredBy}>Unit Passport</span>
      </div>

      <div className={styles.identity}>
        <div className={styles.serialBadge}>
          <span className={styles.serialLabel}>SERIAL NO.</span>
          <span className={styles.serialNumber}>{serialNumber}</span>
        </div>
        <div className={styles.statusBadge} data-status={status}>
          <span className={styles.statusDot} />
          {status}
        </div>
      </div>

      <h1 className={styles.modelName}>{modelName}</h1>

        <div className={styles.locationInfo}>
          <span className={styles.locationIcon}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          </span>
        <span>
          <strong>{clientName}</strong> — {outletName}
        </span>
      </div>
    </header>
  );
}
