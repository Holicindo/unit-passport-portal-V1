import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';
import { 
  LayoutDashboard, Package, Wrench, BarChart3, ChevronDown,
  List, PlusCircle, ClipboardCheck, History, Wrench as Tool, Calendar, FileText,
  Users, Shield, Briefcase, Building2, Activity, Database
} from 'lucide-react';

/* ── Holic Logo SVG — icon only, no text ── */
function HolicIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 210"
      fill="none"
      stroke="#0f172a"
      strokeWidth="9"
      strokeLinecap="square"
      strokeLinejoin="miter"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer triangle with chamfered bottom corners */}
      <polyline points="100,8 8,182 20,198 180,198 192,182 100,8" />

      {/* Center vertical double line */}
      <line x1="93" y1="20" x2="93" y2="198" strokeWidth="7" />
      <line x1="107" y1="20" x2="107" y2="198" strokeWidth="7" />

      {/* Top right L-bracket (outer) */}
      <polyline points="107,75 150,75 150,128" strokeWidth="7" />
      {/* Top right L-bracket (inner) */}
      <polyline points="107,87 138,87 138,128" strokeWidth="7" />

      {/* Bottom right L-bracket (outer) */}
      <polyline points="107,128 168,128 168,178" strokeWidth="7" />
      {/* Bottom right L-bracket (inner) */}
      <polyline points="107,140 156,140 156,178" strokeWidth="7" />
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
