import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';
import { 
  LayoutDashboard, Package, Wrench, BarChart3, ChevronDown,
  List, PlusCircle, ClipboardCheck, History, Wrench as Tool, Calendar, FileText
} from 'lucide-react';

const menuItems = [
  { id: 'dashboard', label: 'Ringkasan Armada', icon: <LayoutDashboard size={20} />, href: '/dashboard' },
  { 
    id: 'units', 
    label: 'Unit', 
    icon: <Package size={20} />, 
    href: '/units',
    subItems: [
      { label: 'Daftar Unit', icon: <List size={18} />, href: '/units' },
      { label: 'Registrasi Unit', icon: <PlusCircle size={18} />, href: '/units/new' }
    ] 
  },
  { 
    id: 'service', 
    label: 'Servis', 
    icon: <Wrench size={20} />, 
    href: '/service',
    subItems: [
      { label: 'Log Servis', icon: <Tool size={18} />, href: '/service' },
      { label: 'Rencana Servis', icon: <Calendar size={18} />, href: '/service/planning' }
    ] 
  },
  { 
    id: 'reports', 
    label: 'Laporan', 
    icon: <BarChart3 size={20} />, 
    href: '/reports',
    subItems: [
      { label: 'Digital Form', icon: <FileText size={18} />, href: '/reports' },
      { label: 'Riwayat Laporan', icon: <History size={18} />, href: '/reports/history' }
    ] 
  },
];

interface SidebarProps {
  isOpen: boolean;
}

export default function Sidebar({ isOpen }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={`${styles.sidebar} ${!isOpen ? styles.hidden : ''}`}>
      <div className={styles.logoSection}>
        <div className={styles.logoWrapper}>
          <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 5L5 85H95L50 5Z" stroke="var(--color-cobalt-blue)" strokeWidth="6" strokeLinejoin="round"/>
            <path d="M50 5V85" stroke="var(--color-cobalt-blue)" strokeWidth="6"/>
            <path d="M65 40H85M65 55H80M65 70H75" stroke="var(--color-cobalt-blue)" strokeWidth="6" strokeLinecap="round"/>
          </svg>
        </div>
        <span className={styles.logoText}>HOLICINDO</span>
      </div>

      <nav className={styles.nav}>
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const hasSubItems = !!item.subItems;
          
          return (
            <div key={item.id} className={styles.menuGroup}>
              <Link 
                href={item.href} 
                className={`${styles.menuItem} ${isActive ? styles.active : ''}`}
              >
                <div className={styles.menuItemMain}>
                  <span className={styles.icon}>{item.icon}</span>
                  <span className={styles.label}>{item.label}</span>
                </div>
                {hasSubItems && (
                  <ChevronDown 
                    size={16} 
                    className={`${styles.arrow} ${isActive ? styles.arrowOpen : ''}`} 
                  />
                )}
              </Link>
              
              {hasSubItems && (
                <div className={`${styles.subItemsContainer} ${isActive ? styles.expanded : ''}`}>
                  <div className={styles.subItems}>
                    {item.subItems.map((sub) => {
                      const isSubActive = pathname === sub.href;
                      return (
                        <Link 
                          key={sub.label} 
                          href={sub.href} 
                          className={`${styles.subItem} ${isSubActive ? styles.subActive : ''}`}
                        >
                          <span className={styles.subIcon}>{sub.icon}</span>
                          {sub.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
