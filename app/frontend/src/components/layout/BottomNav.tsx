'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, Wrench, BarChart3, User } from 'lucide-react';
import styles from './BottomNav.module.css';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Ringkasan', href: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'Unit', href: '/units', icon: <Package size={20} /> },
    { label: 'Servis', href: '/service', icon: <Wrench size={20} /> },
    { label: 'Laporan', href: '/reports', icon: <BarChart3 size={20} /> },
    { label: 'Profil', href: '/profile', icon: <User size={20} /> },
  ];

  return (
    <nav className={styles.bottomNav}>
      {navItems.map((item) => {
        // Match base path to support subroutes
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
