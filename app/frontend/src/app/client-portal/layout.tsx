'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Truck, FileText, ShieldAlert, MessageSquare, LogOut, Menu } from 'lucide-react';
import styles from './ClientPortal.module.css';

export default function ClientPortalLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const rawUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!token || !rawUser) {
      router.push('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(rawUser);
      if (parsedUser.role !== 'CLIENT') {
        router.push('/dashboard');
        return;
      }
      setUser(parsedUser);
    } catch (e) {
      router.push('/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) return null; // or loading spinner

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? '' : styles.collapsed}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logoArea}>
            <div className={styles.logoIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 22h20L12 2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
              </svg>
            </div>
            {sidebarOpen && <span className={styles.logoText}>Holicindo</span>}
          </div>
        </div>

        <nav className={styles.navMenu}>
          <div className={styles.navGroup}>
            {sidebarOpen && <span className={styles.navGroupTitle}>MENU KLIEN</span>}
            <Link href="/client-portal/dashboard" className={styles.navLink}>
              <LayoutDashboard size={20} />
              {sidebarOpen && <span>Dashboard</span>}
            </Link>
            <Link href="/client-portal/fleet" className={styles.navLink}>
              <Truck size={20} />
              {sidebarOpen && <span>My Fleet</span>}
            </Link>
            <Link href="/client-portal/warranty" className={styles.navLink}>
              <ShieldAlert size={20} />
              {sidebarOpen && <span>Garansi</span>}
            </Link>
            <Link href="/client-portal/messages" className={styles.navLink}>
              <MessageSquare size={20} />
              {sidebarOpen && <span>Pesan & Laporan</span>}
            </Link>
          </div>
        </nav>

        <div className={styles.sidebarFooter}>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={20} />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={styles.mainWrapper}>
        <header className={styles.topbar}>
          <button className={styles.toggleBtn} onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu size={24} />
          </button>
          
          <div className={styles.topbarRight}>
            <div className={styles.userProfile}>
              <div className={styles.avatar}>
                {user.name ? user.name.charAt(0).toUpperCase() : 'C'}
              </div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user.name || 'Client User'}</span>
                <span className={styles.userRole}>Fleet Owner</span>
              </div>
            </div>
          </div>
        </header>

        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}
