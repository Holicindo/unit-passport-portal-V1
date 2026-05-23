'use client';

import { FileCheck, Thermometer, AlertTriangle, Settings, ShieldCheck } from 'lucide-react';
import Link from 'next/link';                           
import { useRouter } from 'next/navigation';
import styles from '../menu.module.css';

const formTypes = [
  { id: 'inspection',    label: 'Inspection Report (QC)',  icon: FileCheck,     color: '#2E5BFF', path: '/reports/inspection' },
  { id: 'cooling_1',     label: 'Cooling System Report 1 Suhu', icon: Thermometer, color: '#10b981', path: '/reports/cooling' },
  { id: 'cooling_2',     label: 'Cooling System Report 2 Suhu (Cake & RTD)', icon: Thermometer,   color: '#0ea5e9', path: '/reports/cooling2' },
  { id: 'cooling_3',     label: 'Cooling System Report 3 Suhu (Cake, Ambient & RTD)', icon: Thermometer,   color: '#00C48C', path: '/reports/cooling3' },
  { id: 'report_warm',     label: 'Cooling System Report Warm', icon: Thermometer,   color: '#2e5bff', path: '/reports/reportwarm' },
  { id: 'analisis_masalah', label: 'Inspeksi & Analisis Masalah', icon: AlertTriangle, color: '#FF4D4D', path: '/reports/issue-analysis' },
  { id: 'rework',  label: 'Pengecekan Rework', icon: Settings, color: '#717378', path: '/reports/rework' },
  { id: 'graphic_record',label: 'Graphic Record', icon: ShieldCheck, color: '#FFB800', path: '/reports/commissioning' },
];

export default function ReportsMenu() {
  const router = useRouter();

  return (
    <div>
      <header className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Reports &amp; Digital Forms</h2>
        <p className={styles.pageSubtitle}>Select a form type to create a new report or view history.</p>
      </header>

      {/* Mobile Submenu Pill Tabs */}
      <div className="mobile-sub-tabs">
        <button 
          className="mobile-sub-tab active"
          onClick={() => router.push('/reports')}
        >
          Digital Form
        </button>
        <button 
          className="mobile-sub-tab"
          onClick={() => router.push('/reports/history')}
        >
          Riwayat Laporan
        </button>
      </div>

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
