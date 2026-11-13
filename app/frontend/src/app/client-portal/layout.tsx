'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Truck,
  ShieldCheck,
  MessageSquare,
  Bell,
  Search,
  LogOut,
  User,
  X,
  ChevronRight,
} from 'lucide-react';
import styles from './ClientPortal.module.css';
import { notificationApi, unitApi } from '@/lib/api';

// ── Holicindo Logo SVG (tidak diubah sesuai permintaan) ──
function HolicLogo({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 140 120"
      fill="none"
      stroke="currentColor"
      strokeWidth="6"
      strokeLinecap="square"
      strokeLinejoin="miter"
    >
      <polygon points="60,5 10,95 20,110 60,110" />
      <line x1="70" y1="15" x2="70" y2="110" />
      <polyline points="70,15 110,90 100,110 70,110" />
      <polyline points="80,110 80,55 125,45" />
      <polyline points="90,110 90,85 135,75" />
    </svg>
  );
}

const navItems = [
  { href: '/client-portal/dashboard', label: 'Beranda',    icon: LayoutDashboard },
  { href: '/client-portal/fleet',     label: 'Fleet Saya', icon: Truck },
  { href: '/client-portal/warranty',  label: 'Garansi',    icon: ShieldCheck, isCenter: true },
  { href: '/client-portal/messages',  label: 'Pesan',      icon: MessageSquare },
];

const leftNavItems  = navItems.filter(i => !i.isCenter).slice(0, 2);
const centerNavItem = navItems.find(i => i.isCenter)!;
const rightNavItems = navItems.filter(i => !i.isCenter).slice(2);

// ── Avatar: foto profil jika ada, inisial jika tidak ──
function UserAvatar({
  name,
  photoUrl,
  size = 38,
  onClick,
}: {
  name: string;
  photoUrl?: string;
  size?: number;
  onClick?: () => void;
}) {
  const initial = name?.charAt(0)?.toUpperCase() || '?';

  if (photoUrl) {
    return (
      <button
        className={styles.navAvatar}
        style={{ width: size, height: size, padding: 0, overflow: 'hidden' }}
        onClick={onClick}
        aria-label="Menu pengguna"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => {
            // Fallback ke inisial jika foto gagal dimuat
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </button>
    );
  }

  return (
    <button
      className={styles.navAvatar}
      style={{ width: size, height: size }}
      onClick={onClick}
      aria-label="Menu pengguna"
    >
      {initial}
    </button>
  );
}

export default function ClientPortalLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser]               = useState<any>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifCount, setNotifCount]   = useState(0);
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [searchOpen, setSearchOpen]   = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [fleet, setFleet]             = useState<any[]>([]);
  const router      = useRouter();
  const pathname    = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef   = useRef<HTMLDivElement>(null);
  const notifRef    = useRef<HTMLDivElement>(null);

  // Baca user dari localStorage — SINGLE RUN dengan sessionStorage guard
  useEffect(() => {
    // Check if auth has been done in this session to prevent double-run in Strict Mode
    const authDone = sessionStorage.getItem('client-portal-auth-checked');
    
    if (authDone === 'true') {
      console.log('[ClientPortal] Auth already done in this session');
      // Still need to set user from localStorage
      const rawUser = localStorage.getItem('user');
      if (rawUser) {
        try {
          const parsed = JSON.parse(rawUser);
          if (parsed.role === 'CLIENT') {
            setUser(parsed);
          }
        } catch {}
      }
      setIsAuthChecking(false);
      return;
    }

    console.log('[ClientPortal] First auth check in session, pathname:', pathname);
    sessionStorage.setItem('client-portal-auth-checked', 'true');
    
    const rawUser = localStorage.getItem('user');
    const token   = localStorage.getItem('token');

    console.log('[ClientPortal] Token:', !!token, 'User:', !!rawUser);

    if (!token || !rawUser) {
      console.log('[ClientPortal] Missing auth, redirect to login');
      setIsAuthChecking(false);
      window.location.href = '/login'; // Force hard redirect
      return;
    }

    try {
      const parsed = JSON.parse(rawUser);
      console.log('[ClientPortal] User role:', parsed.role, 'email:', parsed.email);
      
      if (parsed.role !== 'CLIENT') {
        console.log('[ClientPortal] Wrong role, redirect to admin dashboard');
        setIsAuthChecking(false);
        window.location.href = '/dashboard'; // Force hard redirect
        return;
      }
      
      console.log('[ClientPortal] Auth SUCCESS - setting user');
      setUser(parsed);
      setIsAuthChecking(false);
    } catch (err) {
      console.error('[ClientPortal] JSON parse error:', err);
      setIsAuthChecking(false);
      window.location.href = '/login';
    }
  }, []); // Run only once on mount

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Load fleet for search
  useEffect(() => {
    if (!user) return;
    unitApi.findMyFleet()
      .then(({ data }) => setFleet(data || []))
      .catch(() => {});
  }, [user]);

  // Search filter
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const q = searchQuery.toLowerCase();
    const results = fleet.filter(u =>
      u.serial_number?.toLowerCase().includes(q) ||
      u.model_name?.toLowerCase().includes(q) ||
      u.current_client?.city?.toLowerCase().includes(q)
    ).slice(0, 6);
    setSearchResults(results);
  }, [searchQuery, fleet]);

  // Poll notifikasi setiap 60 detik
  useEffect(() => {
    if (!user) return;
    const fetchNotif = async () => {
      try {
        const { data } = await notificationApi.getAlerts();
        const alerts = Array.isArray(data) ? data : (data?.data || []);
        setNotifications(alerts);
        const unread = alerts.filter((n: any) => !n.is_read).length;
        setNotifCount(unread);
      } catch { /* silently ignore */ }
    };
    fetchNotif();
    const interval = setInterval(fetchNotif, 60_000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  // Show loading state while checking auth
  if (isAuthChecking) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #eaecf0 0%, #c0c8d2 50%, #dde2e8 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid rgba(46, 91, 255, 0.2)', 
            borderTopColor: '#2E5BFF',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: '#475569', fontSize: '0.875rem', fontWeight: 600 }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Data dari user yang terdaftar — bukan hardcode
  const displayName   = user.name   || '';
  const companyName   = user.company_name || '';
  const photoUrl      = user.photo_url || user.avatar || user.profile_picture || '';
  const emailDisplay  = user.email  || '';

  return (
    <div className={styles.layout}>

      {/* ── TOP NAVIGATION BAR ── */}
      <nav className={styles.topNav}>

        {/* Logo */}
        <Link href="/client-portal/dashboard" className={styles.navBrand}>
          <div className={styles.navLogoIcon}>
            <HolicLogo size={22} />
          </div>
          <span className={styles.navBrandName}>Holic Client Portal</span>
        </Link>

        {/* Menu Tengah - Hide on desktop, show on mobile/tablet */}
        <div className={`${styles.navMenu} ${styles.navMenuHideDesktop}`}>
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
              >
                <Icon size={17} />
                {label}
              </Link>
            );
          })}
        </div>

        {/* Kanan: Notif + Avatar (Search removed) */}
        <div className={styles.navRight}>

          {/* Notifikasi */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              className={styles.navIconBtn}
              aria-label="Notifikasi"
              onClick={() => { setNotifPanelOpen(v => !v); setSearchOpen(false); setDropdownOpen(false); }}
              style={{ position: 'relative' }}
            >
              <Bell size={18} />
              {notifCount > 0 && (
                <span style={{
                  position: 'absolute', top: '-6px', right: '-6px',
                  minWidth: '18px', height: '18px',
                  background: '#ef4444',
                  color: '#fff',
                  borderRadius: '9999px',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 4px',
                  border: '2px solid #071729',
                  lineHeight: 1,
                  fontFamily: 'var(--font-heading)',
                  pointerEvents: 'none',
                }}>
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </button>
            {notifPanelOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                width: '340px',
                background: 'rgba(8,23,41,0.97)',
                border: '1px solid rgba(56,189,248,0.2)',
                borderRadius: '16px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                zIndex: 300, overflow: 'hidden',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(56,189,248,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f8fafc', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Notifikasi {notifCount > 0 && <span style={{ background: '#ef4444', color: 'white', borderRadius: '20px', padding: '1px 7px', fontSize: '0.7rem', fontWeight: 800 }}>{notifCount > 9 ? '9+' : notifCount}</span>}
                  </span>
                  <button onClick={() => setNotifPanelOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
                    <X size={15} />
                  </button>
                </div>
                {notifications.length === 0 ? (
                  <div style={{ padding: '28px', textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem', fontFamily: 'var(--font-body)' }}>
                    Tidak ada notifikasi
                  </div>
                ) : (
                  <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                    {notifications.map((n: any) => (
                      <div
                        key={n.id}
                        style={{
                          padding: '12px 16px', borderBottom: '1px solid rgba(56,189,248,0.08)',
                          background: n.is_read ? 'transparent' : 'rgba(56,189,248,0.08)',
                          borderLeft: n.is_read ? 'none' : '3px solid #38bdf8',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                        }}
                        onClick={() => {
                          notificationApi.markAsRead(n.id).catch(() => {});
                          setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
                          setNotifCount(c => Math.max(0, c - (n.is_read ? 0 : 1)));
                          setNotifPanelOpen(false);
                          router.push('/client-portal/dashboard');
                        }}
                      >
                        <div style={{ fontSize: '0.82rem', color: '#f8fafc', fontFamily: 'var(--font-body)', lineHeight: 1.5, fontWeight: n.is_read ? 400 : 600 }}>
                          {n.message || n.title || 'Notifikasi baru'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px', fontFamily: 'var(--font-body)' }}>
                          {n.created_at ? new Date(n.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Avatar + Dropdown */}
          <div className={styles.userDropdown} ref={dropdownRef}>
            <UserAvatar
              name={displayName}
              photoUrl={photoUrl}
              size={42}
              onClick={() => { setDropdownOpen(v => !v); setSearchOpen(false); setNotifPanelOpen(false); }}
            />

            {dropdownOpen && (
              <div className={styles.userDropdownMenu}>
                {/* Nama & perusahaan dari data yang terdaftar */}
                <div className={styles.userDropdownHeader}>
                  <div className={styles.userDropdownName}>{displayName}</div>
                  {companyName && (
                    <div className={styles.userDropdownRole}>{companyName}</div>
                  )}
                  {!companyName && emailDisplay && (
                    <div className={styles.userDropdownRole}>{emailDisplay}</div>
                  )}
                </div>

                <Link
                  href="/client-portal/profile"
                  className={styles.userDropdownItem}
                  onClick={() => setDropdownOpen(false)}
                >
                  <User size={15} />
                  Profil Saya
                </Link>

                <button
                  className={`${styles.userDropdownItem} ${styles.userDropdownItemDanger}`}
                  onClick={handleLogout}
                >
                  <LogOut size={15} />
                  Keluar
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── MAIN CONTENT ── */}
      <main className={styles.mainContent}>
        {children}
      </main>

      {/* ── MOBILE BOTTOM NAV — Premium style with center FAB ── */}
      <nav className={styles.mobileNav}>
        <div className={styles.mobileNavInner}>

          {/* Left items: Dashboard + Fleet */}
          {leftNavItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={`${styles.mobileNavItem} ${isActive ? styles.mobileNavItemActive : ''}`}
              >
                <div className={styles.mobileNavIconWrap}>
                  <Icon size={20} />
                </div>
                {label}
              </Link>
            );
          })}

          {/* Center FAB: Garansi */}
          {(() => {
            const { href, label, icon: Icon } = centerNavItem;
            const isActive = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                href={href}
                className={`${styles.mobileNavCenter} ${isActive ? styles.mobileNavCenterActive : ''}`}
              >
                <div className={styles.mobileNavCenterFab}>
                  <Icon size={24} />
                </div>
                <span className={styles.mobileNavCenterLabel}>{label}</span>
              </Link>
            );
          })()}

          {/* Right items: Pesan */}
          {rightNavItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={`${styles.mobileNavItem} ${isActive ? styles.mobileNavItemActive : ''}`}
              >
                <div className={styles.mobileNavIconWrap}>
                  <Icon size={20} />
                </div>
                {label}
              </Link>
            );
          })}

          {/* Profil — gantikan Keluar di mobile nav */}
          {(() => {
            const isActive = pathname === '/client-portal/profile';
            return (
              <Link
                href="/client-portal/profile"
                className={`${styles.mobileNavItem} ${isActive ? styles.mobileNavItemActive : ''}`}
              >
                <div className={styles.mobileNavIconWrap}>
                  <User size={20} />
                </div>
                Profil
              </Link>
            );
          })()}

        </div>
      </nav>

    </div>
  );
}
