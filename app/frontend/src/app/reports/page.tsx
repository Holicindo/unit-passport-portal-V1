'use client';

import { FileCheck, Thermometer, AlertTriangle, Settings, ShieldCheck } from 'lucide-react';
import Link from 'next/link';                           
import styles from '../menu.module.css';

const formTypes = [
  { id: 'inspection',    label: 'Inspection Report (QC)',  icon: FileCheck,     color: '#2E5BFF', path: '/reports/inspection' },
  { id: 'cooling1',     label: 'Cooling Report (1 Suhu)', icon: Thermometer,   color: '#00C48C', path: '/reports/cooling1' },
  { id: 'cooling2',     label: 'Cooling Report (2 Suhu)', icon: Thermometer,   color: '#00C48C', path: '/reports/cooling2' },
  { id: 'cooling3',     label: 'Cooling Report (3 Suhu)', icon: Thermometer,   color: '#00C48C', path: '/reports/cooling3' },
  { id: 'problem',      label: 'Analisis Masalah',        icon: AlertTriangle, color: '#FF4D4D', path: '/reports/issue-analysis' },
  { id: 'maintenance',  label: 'Maintenance Log',         icon: Settings,      color: '#717378', path: '/reports/maintenance' },
  { id: 'commissioning',label: 'Commissioning Report',    icon: ShieldCheck,   color: '#FFB800', path: '/reports/commissioning' },
];

export default function ReportsMenu() {
  return (
    <div>
      <header className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Reports &amp; Digital Forms</h2>
        <p className={styles.pageSubtitle}>Select a form type to create a new report or view history.</p>
      </header>

      <div className={styles.menuGrid}>
        {formTypes.map((form) => {
          const Icon = form.icon;
          return (
            <Link href={form.path} key={form.id} className={styles.menuCard}>
              <div
                className={styles.iconWrapper}
                style={{ backgroundColor: `${form.color}18`, color: form.color }}
              >
                <Icon size={28} />
              </div>
              <div className={styles.textWrapper}>
                <h3>{form.label}</h3>
                <p>Submit digital report for units</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
