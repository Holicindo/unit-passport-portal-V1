import styles from './Sidebar.module.css';
import { LayoutDashboard, Package, Wrench, BarChart3, ChevronDown } from 'lucide-react';

const menuItems = [
  { id: 'fleet', label: 'RINGKASAN ARMADA', icon: <LayoutDashboard size={20} /> },
  { 
    id: 'units', 
    label: 'UNIT', 
    icon: <Package size={20} />, 
    active: true, 
    subItems: ['Detail Unit', 'Daftar Nama Unit'] 
  },
  { 
    id: 'service', 
    label: 'SERVIS', 
    icon: <Wrench size={20} />, 
    subItems: ['Uji Kelayakan', 'Perencanaan Servis'] 
  },
  { 
    id: 'analytics', 
    label: 'ANALITIK', 
    icon: <BarChart3 size={20} />, 
    subItems: ['Analitik', 'Riwayat Servis'] 
  },
];

export default function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoSection}>
        <div className={styles.logoWrapper}>
          {/* Logo Holicindo sesuai Gambar 2 & 3 */}
          <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 5L5 85H95L50 5Z" stroke="white" strokeWidth="6" strokeLinejoin="round"/>
            <path d="M50 5V85" stroke="white" strokeWidth="6"/>
            <path d="M65 40H85M65 55H80M65 70H75" stroke="white" strokeWidth="6" strokeLinecap="round"/>
          </svg>
        </div>
        <span className={styles.logoText}>HOLICINDO</span>
      </div>

      <nav className={styles.nav}>
        {menuItems.map((item) => (
          <div key={item.id} className={styles.menuGroup}>
            <div className={`${styles.menuItem} ${item.active ? styles.active : ''}`}>
              <span className={styles.icon}>{item.icon}</span>
              <span className={styles.label}>{item.label}</span>
              {item.subItems && <ChevronDown size={14} className={styles.arrow} />}
            </div>
            {item.subItems && item.active && (
              <div className={styles.subItems}>
                {item.subItems.map((sub) => (
                  <div key={sub} className={`${styles.subItem} ${sub === 'Detail Unit' ? styles.subActive : ''}`}>
                    {sub}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
