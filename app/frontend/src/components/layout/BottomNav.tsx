'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, Wrench, BarChart3, User } from 'lucide-react';
import styles from './BottomNav.module.css';

export default function BottomNav() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!localStorage.getItem('token')) return;
      try {
        const { notificationApi } = await import('@/lib/api');
        const res = await notificationApi.getAlerts().catch(() => ({ data: [] }));
        const unread = (res.data || []).filter((a: any) => !a.is_read).length;
        setUnreadCount(unread);
      } catch {
        /* ignore */
      }
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { label: 'Ringkasan', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Unit', href: '/units', icon: Package },
    { label: 'Servis', href: '/service', icon: Wrench, isCenter: true },
    { label: 'Laporan', href: '/reports', icon: BarChart3 },
    { label: 'Profil', href: '/profile', icon: User, hasBadge: unreadCount > 0, badgeCount: unreadCount },
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
        {rightNavItems.map(({ href, label, icon: Icon, hasBadge, badgeCount }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href + '/'));
          return (
            <Link
              key={href}
              href={href}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
            >
              <div className={styles.navIconWrap}>
                <Icon size={20} />
                {hasBadge && (
                  <span className={styles.navBadge}>
                    {(badgeCount || 0) > 9 ? '9+' : badgeCount}
                  </span>
                )}
              </div>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
