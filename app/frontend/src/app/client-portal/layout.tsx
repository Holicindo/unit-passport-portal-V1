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
} from 'lucide-react';
import styles from './ClientPortal.module.css';

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
  { href: '/client-portal/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/client-portal/fleet',     label: 'Fleet',      icon: Truck },
  { href: '/client-portal/warranty',  label: 'Garansi',    icon: ShieldCheck },
  { href: '/client-portal/messages',  label: 'Pesan',      icon: MessageSquare },
];

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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifCount]                  = useState(0);
  const router      = useRouter();
  const pathname    = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Baca user dari localStorage — data sesuai yang didaftarkan
  useEffect(() => {
    const rawUser = localStorage.getItem('user');
    const token   = localStorage.getItem('token');

    if (!token || !rawUser) {
      router.push('/login');
      return;
    }
    try {
      const parsed = JSON.parse(rawUser);
      if (parsed.role !== 'CLIENT') {
        router.push('/dashboard');
        return;
      }
      setUser(parsed);
    } catch {
      router.push('/login');
    }
  }, [router]);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

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
          <span className={styles.navBrandName}>Holicindo</span>
        </Link>

        {/* Menu Tengah */}
        <div className={styles.navMenu}>
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

        {/* Kanan: Search + Notif + Avatar */}
        <div className={styles.navRight}>

          <button className={styles.navIconBtn} aria-label="Cari">
            <Search size={18} />
          </button>

          <button className={styles.navIconBtn} aria-label="Notifikasi" style={{ position: 'relative' }}>
            <Bell size={18} />
            {notifCount > 0 && <span className={styles.notifDot} />}
          </button>

          {/* Avatar + Dropdown */}
          <div className={styles.userDropdown} ref={dropdownRef}>
            <UserAvatar
              name={displayName}
              photoUrl={photoUrl}
              size={42}
              onClick={() => setDropdownOpen(v => !v)}
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

      {/* ── MOBILE BOTTOM NAV — Premium style ── */}
      <nav className={styles.mobileNav}>
        <div className={styles.mobileNavInner}>
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={`${styles.mobileNavItem} ${isActive ? styles.mobileNavItemActive : ''}`}
              >
                <div className={styles.mobileNavIconWrap}>
                  <Icon size={22} />
                </div>
                {label}
              </Link>
            );
          })}
          <button
            className={`${styles.mobileNavItem} ${styles.mobileNavItemDanger}`}
            onClick={handleLogout}
          >
            <div className={styles.mobileNavIconWrap}>
              <LogOut size={22} />
            </div>
            Keluar
          </button>
        </div>
      </nav>

    </div>
  );
}
