'use client';

import { Wrench, ClipboardCheck, Calendar, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import styles from '../menu.module.css';

const serviceMenu = [
  { id: 'kelayakan', label: 'Uji Kelayakan (QA)',   icon: ClipboardCheck, color: '#00C48C', path: '/service/qa' },
  { id: 'planning',  label: 'Perencanaan Servis',   icon: Calendar,       color: '#2E5BFF', path: '/service/planning' },
  { id: 'emergency', label: 'Emergency Repair',     icon: ShieldAlert,    color: '#FF4D4D', path: '/service/emergency' },
];

export default function ServicePage() {
  return (
    <div>
      <header className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Technical Service &amp; Maintenance</h2>
        <p className={styles.pageSubtitle}>Manage unit inspections, service planning, and repairs.</p>
      </header>

      <div className={styles.menuGrid}>
        {serviceMenu.map((item) => {
          const Icon = item.icon;
          return (
            <Link href={item.path} key={item.id} className={styles.menuCard}>
              <div
                className={styles.iconWrapper}
                style={{ backgroundColor: `${item.color}18`, color: item.color }}
              >
                <Icon size={28} />
              </div>
              <div className={styles.textWrapper}>
                <h3>{item.label}</h3>
                <p>Manage technical operations</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
