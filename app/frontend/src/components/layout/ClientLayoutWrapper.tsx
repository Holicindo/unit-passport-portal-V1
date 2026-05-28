'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import BottomNav from '@/components/layout/BottomNav';

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage     = pathname === '/login';
  const isPassportPage  = pathname?.startsWith('/id/');
  const isClientPortal  = pathname?.startsWith('/client-portal');
  const isPartnerPortal = pathname?.startsWith('/partner-portal');

  // Pages that render completely standalone — no admin sidebar/topbar/bottomnav
  const hideLayout = isLoginPage || isPassportPage || isClientPortal || isPartnerPortal;

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <>
      {!hideLayout && <Sidebar isOpen={sidebarOpen} />}
      <div
        className={`${!hideLayout ? 'main-wrapper' : ''} ${!sidebarOpen && !hideLayout ? 'sidebar-collapsed' : ''}`}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          maxWidth: '100vw',
          overflowX: 'hidden',
        }}
      >
        {!hideLayout && <TopBar onToggleSidebar={toggleSidebar} isSidebarOpen={sidebarOpen} />}

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {children}
        </main>

        {!hideLayout && (
          <footer style={{
            padding: '20px',
            textAlign: 'center',
            fontSize: '0.8rem',
            color: 'var(--color-space-grey)',
            background: 'var(--color-optic-white)',
            borderTop: '1px solid rgba(0, 31, 63, 0.05)',
            marginTop: 'auto',
          }}>
            Copyright ©2026 PT. Holicindo Dasa Anugerah | All Rights Reserved.
          </footer>
        )}

        {!hideLayout && <BottomNav />}
      </div>
    </>
  );
}
