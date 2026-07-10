'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, Wrench, BarChart3, User } from 'lucide-react';
import styles from './BottomNav.module.css';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Ringkasan', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Unit', href: '/units', icon: Package },
    { label: 'Servis', href: '/service', icon: Wrench, isCenter: true },
    { label: 'Laporan', href: '/reports', icon: BarChart3 },
    { label: 'Profil', href: '/profile', icon: User },
  ];

  const leftNavItems = navItems.filter(i => !i.isCenter).slice(0, 2);
  const centerNavItem = navItems.find(i => i.isCenter)!;
  const rightNavItems = navItems.filter(i => !i.isCenter).slice(2);

  return (
    <nav className={styles.bottomNav}>
      <div className={styles.bottomNavInner}>
        {/* Left items */}
        {leftNavItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href + '/'));
          return (
            <Link
              key={href}
              href={href}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
            >
              <div className={styles.navIconWrap}>
                <Icon size={20} />
              </div>
              {label}
            </Link>
          );
        })}

        {/* Center FAB */}
        {(() => {
          const { href, label, icon: Icon } = centerNavItem;
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href + '/'));
          return (
            <Link
              href={href}
              className={`${styles.navCenter} ${isActive ? styles.navCenterActive : ''}`}
            >
              <div className={styles.navCenterFab}>
                <Icon size={24} />
              </div>
              <span className={styles.navCenterLabel}>{label}</span>
            </Link>
          );
        })()}

        {/* Right items */}
        {rightNavItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href + '/'));
          return (
            <Link
              key={href}
              href={href}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
            >
              <div className={styles.navIconWrap}>
                <Icon size={20} />
              </div>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
