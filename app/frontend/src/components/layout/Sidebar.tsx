import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';
import { 
  LayoutDashboard, Package, Wrench, BarChart3, ChevronDown,
  List, PlusCircle, ClipboardCheck, History, Wrench as Tool, Calendar, FileText,
  Users, Shield, Briefcase, Building2, Activity, Database
} from 'lucide-react';

/* ── Holic Logo SVG — matching Login Page ── */
function HolicIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 140 120"
      fill="none"
      stroke="#ffffff"
      strokeWidth="5"
      strokeLinecap="square"
      strokeLinejoin="miter"
      xmlns="http://www.w3.org/2000/svg"
    >
      <polygon points="60,5 10,95 20,110 60,110" />
      <line x1="70" y1="15" x2="70" y2="110" />
      <polyline points="70,15 110,90 100,110 70,110" />
      <polyline points="80,110 80,55 125,45" />
      <polyline points="90,110 90,85 135,75" />
    </svg>
  );
}

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
    id: 'partners', 
    label: 'Mitra & Klien', 
    icon: <Briefcase size={20} />, 
    href: '/partners',
    subItems: [
      { label: 'Manajemen Mitra', icon: <Building2 size={18} />, href: '/partners' },
      { label: 'Manajemen Klien', icon: <Users size={18} />, href: '/partners/clients' }
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
  { 
    id: 'users', 
    label: 'Pengaturan Akses', 
    icon: <Shield size={20} />, 
    href: '/users',
    subItems: [
      { label: 'Manajemen Pengguna', icon: <Users size={18} />, href: '/users' },
      { label: 'Matriks Hak Akses', icon: <Shield size={18} />, href: '/users/roles' }
    ] 
  },
  { 
    id: 'audit', 
    label: 'Aktivitas Log', 
    icon: <Activity size={20} />, 
    href: '/audit'
  },
];

import { useState, useEffect } from 'react';

interface SidebarProps {
  isOpen: boolean;
}

export default function Sidebar({ isOpen }: SidebarProps) {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setRole(user.role);
      } catch (err) {
        console.error('Failed to parse user data from local storage', err);
        // Clear the corrupted data so it doesn't crash on reload
        if (userData === 'undefined' || userData === 'null') {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          // Optionally redirect to login, but just clearing it prevents crashes
        }
      }
    }
  }, []);

  const filteredMenuItems = menuItems.filter((item) => {
    if (role === 'PARTNER') {
      return item.id !== 'units' && item.id !== 'users'; // Partner cannot access users/roles
    }
    return true;
  });

  return (
    <aside className={`${styles.sidebar} ${!isOpen ? styles.hidden : ''}`}>
      <div className={styles.logoSection}>
        <div className={styles.logoWrapper}>
          <HolicIcon className={styles.logoImg} />
        </div>
        <span className={styles.logoText}>HOLICINDO</span>
      </div>

      <nav className={styles.nav}>
        {filteredMenuItems.map((item) => {
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
