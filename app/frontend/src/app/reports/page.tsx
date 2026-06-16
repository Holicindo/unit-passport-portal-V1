'use client';

import { FileCheck, Thermometer, AlertTriangle, Settings, ShieldCheck, Clipboard } from 'lucide-react';
import Link from 'next/link';                           
import { useRouter } from 'next/navigation';
import styles from '../menu.module.css';

interface FormType {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  path: string;
  description: string;
  category: string;
}

const formTypes: FormType[] = [
  { id: 'inspection',       label: 'Inspection Report (QC)',           icon: FileCheck,      color: '#2E5BFF', path: '/reports/inspection',     category: 'Quality Control', description: 'Form pemeriksaan kualitas unit sebelum pengiriman ke klien.' },
  { id: 'qc_service',       label: 'Checklist QC Service',             icon: Clipboard,      color: '#2E5BFF', path: '/reports/qc-service',     category: 'Quality Control', description: 'Checklist standar QC untuk service berkala unit di lapangan.' },
  { id: 'rework',           label: 'Pengecekan Rework',                icon: Settings,       color: '#717378', path: '/reports/rework',         category: 'Quality Control', description: 'Verifikasi ulang unit yang telah mengalami perbaikan atau rework.' },
  { id: 'cooling_1',        label: 'Cooling System Report 1 Suhu',     icon: Thermometer,    color: '#2E5BFF', path: '/reports/cooling',        category: 'Cooling System',  description: 'Laporan performa pendinginan 1 titik ukur suhu.' },
  { id: 'cooling_2',        label: 'Cooling System Report 2 Suhu',     icon: Thermometer,    color: '#2E5BFF', path: '/reports/cooling2',       category: 'Cooling System',  description: 'Laporan performa pendinginan 2 titik ukur (Cake & RTD).' },
  { id: 'cooling_3',        label: 'Cooling System Report 3 Suhu',     icon: Thermometer,    color: '#2E5BFF', path: '/reports/cooling3',       category: 'Cooling System',  description: 'Laporan performa pendinginan 3 titik ukur (Cake, Ambient & RTD).' },
  { id: 'report_warm',      label: 'Cooling System Report Warm',       icon: Thermometer,    color: '#717378', path: '/reports/reportwarm',     category: 'Cooling System',  description: 'Laporan khusus unit warm/cooler (non-freezer temperature).' },
  { id: 'analisis_masalah', label: 'Inspeksi & Analisis Masalah',      icon: AlertTriangle,  color: '#FF6B00', path: '/reports/issue-analysis', category: 'Analisis',        description: 'Diagnosis kerusakan unit dan rekomendasi tindak lanjut.' },
  { id: 'graphic_record',   label: 'Graphic Record',                   icon: ShieldCheck,    color: '#2E5BFF', path: '/reports/graphic-record', category: 'Analisis',        description: 'Dokumentasi visual kondisi unit dalam bentuk grafik.' },
];

/* Group forms by category */
function groupByCategory(forms: FormType[]) {
  const groups: Record<string, FormType[]> = {};
  for (const f of forms) {
    if (!groups[f.category]) groups[f.category] = [];
    groups[f.category].push(f);
  }
  return groups;
}

const CATEGORY_ORDER = ['Quality Control', 'Cooling System', 'Analisis'];

export default function ReportsMenu() {
  const router = useRouter();
  const grouped = groupByCategory(formTypes);

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

      {CATEGORY_ORDER.map(category => {
        const items = grouped[category];
        if (!items || items.length === 0) return null;

        return (
          <div key={category} style={{ marginBottom: '32px' }}>
            <div className={styles.categoryHeader}>
              <span className={styles.categoryDot} style={{ background: items[0].color }} />
              <h3 className={styles.categoryTitle}>{category}</h3>
              <span className={styles.categoryCount}>{items.length} form</span>
            </div>
            <div className={styles.menuGrid}>
              {items.map((form) => {
                const Icon = form.icon;
                return (
                  <Link href={form.path} key={form.id} className={styles.menuCard} style={{ '--card-accent': form.color } as React.CSSProperties}>
                    <div
                      className={styles.iconWrapper}
                      style={{ backgroundColor: `${form.color}18`, color: form.color }}
                    >
                      <Icon size={28} />
                    </div>
                    <div className={styles.textWrapper}>
                      <h3>{form.label}</h3>
                      <p>{form.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
