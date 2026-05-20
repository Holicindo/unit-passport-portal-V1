'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Wrench, BarChart3, Mail } from 'lucide-react';
import styles from './BottomNav.module.css';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Armada', href: '/dashboard', icon: <LayoutDashboard size={22} /> },
    { label: 'Servis', href: '/service', icon: <Wrench size={22} /> },
    { label: 'Laporan', href: '/reports', icon: <BarChart3 size={22} /> },
    { label: 'Pesan', href: '/messages', icon: <Mail size={22} /> },
  ];

  return (
    <nav className={styles.bottomNav}>
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
        return (
          <Link key={item.label} href={item.href} className={`${styles.navItem} ${isActive ? styles.active : ''}`}>
            <span className={styles.icon}>{item.icon}</span>
            <span className={styles.label}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
