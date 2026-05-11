import styles from './SpecCard.module.css';
import { Settings, Snowflake, Zap, Activity, Maximize, ShieldCheck } from 'lucide-react';

interface Spec {
  label: string;
  value: string;
  icon: React.ReactNode;
}

interface SpecCardProps {
  compressor: string;
  refrigerant: string;
  wattage: string;
  voltage: string;
  dimensions: string;
  warrantyEnd: string;
}

export default function SpecCard({
  compressor, refrigerant, wattage, voltage, dimensions, warrantyEnd,
}: SpecCardProps) {
  const specs: Spec[] = [
    { label: 'Kompresor', value: compressor, icon: <Settings size={18} /> },
    { label: 'Refrigeran', value: refrigerant, icon: <Snowflake size={18} /> },
    { label: 'Daya', value: wattage, icon: <Zap size={18} /> },
    { label: 'Tegangan', value: voltage, icon: <Activity size={18} /> },
    { label: 'Dimensi', value: dimensions, icon: <Maximize size={18} /> },
    { label: 'Garansi Hingga', value: warrantyEnd, icon: <ShieldCheck size={18} /> },
  ];

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Spesifikasi Teknis</h2>
      <div className={styles.grid}>
        {specs.map((spec) => (
          <div key={spec.label} className={styles.specItem}>
            <span className={styles.specIcon}>{spec.icon}</span>
            <div className={styles.specInfo}>
              <span className={styles.specLabel}>{spec.label}</span>
              <span className={styles.specValue}>{spec.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
