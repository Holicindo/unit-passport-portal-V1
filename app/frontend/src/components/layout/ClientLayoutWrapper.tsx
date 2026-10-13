'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import BottomNav from '@/components/layout/BottomNav';

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const isHomePage = pathname === '/';
  const isPassportPage = pathname?.startsWith('/id/');
  const isClientPortal = pathname?.startsWith('/client-portal');
  const isPartnerPortal = pathname?.startsWith('/partner-portal');

  // Pages that render completely standalone — no admin sidebar/topbar/bottomnav
  const hideLayout = isLoginPage || isHomePage || isPassportPage || isClientPortal || isPartnerPortal;

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // FORCE RESET: Remove any dark theme artifacts from DOM on every page load
  useEffect(() => {
    document.documentElement.removeAttribute('data-theme');
    document.body.removeAttribute('data-theme');

    if (isClientPortal || isPartnerPortal) {
      document.body.style.display = 'block';
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.body.style.overflowX = 'hidden';
      document.body.style.background = '#dde2e8';
      document.body.style.width = '100vw';
      document.body.style.height = 'auto';
    } else if (isLoginPage) {
      // Login page: Force full coverage without margins
      document.body.style.display = 'block';
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.body.style.overflowX = 'hidden';
      document.body.style.background = '#0b1120';
      document.body.style.width = '100vw';
      document.body.style.height = '100vh';
    } else if (isPassportPage) {
      // Passport detail unit page: Full coverage dark background, no white gutters
      document.body.style.display = 'block';
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.body.style.overflowX = 'hidden';
      document.body.style.background = '#060d20';
      document.body.style.width = '100vw';
      document.body.style.height = 'auto';
    } else if (hideLayout) {
      document.body.style.display = 'block';
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.body.style.overflowX = 'hidden';
      document.body.style.background = '#f0f1f7';
      document.body.style.width = '100vw';
      document.body.style.height = 'auto';
    } else {
      // Dashboard pages: Reset to normal layout
      document.body.style.display = 'flex';
      document.body.style.margin = '';
      document.body.style.padding = '';
      document.body.style.overflowX = '';
      document.body.style.background = '';
      document.body.style.width = '';
      document.body.style.height = '';
    }
  }, [pathname, hideLayout, isClientPortal, isPartnerPortal, isLoginPage, isPassportPage]);

  return (
    <>
      {!hideLayout && <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />}
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
          <div
            className={!hideLayout ? 'page-content' : undefined}
            style={hideLayout ? { flex: 1, display: 'flex', flexDirection: 'column', width: '100%', padding: 0, margin: 0 } : undefined}
            suppressHydrationWarning
          >
            {children}
          </div>
        </main>

        {!hideLayout && (
          <footer style={{
            padding: '24px',
            textAlign: 'center',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: '#001F3F',
            background: 'transparent',
            marginTop: 'auto',
            opacity: 0.8,
          }}>
            Copyright ©2026 PT. Holicindo Dasa Anugerah | All Rights Reserved.
          </footer>
        )}

        {!hideLayout && <BottomNav />}
      </div>
    </>
  );
}
