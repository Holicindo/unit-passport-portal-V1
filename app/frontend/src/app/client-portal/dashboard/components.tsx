'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from '../ClientPortal.module.css';

// ── Greeting based on time of day ──
export function useGreeting() {
  const [greeting, setGreeting] = useState('');
  useEffect(() => {
    const update = () => {
      const h = new Date().getHours();
      if (h >= 5 && h < 12) setGreeting('Selamat Pagi');
      else if (h >= 12 && h < 15) setGreeting('Selamat Siang');
      else if (h >= 15 && h < 18) setGreeting('Selamat Sore');
      else setGreeting('Selamat Malam');
    };
    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, []);
  return greeting;
}

// ── Mini Calendar Widget ──
export function MiniCalendar() {
  const today = new Date();
  const [current, setCurrent] = useState({ year: today.getFullYear(), month: today.getMonth() });

  const MONTH_NAMES = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const DAY_NAMES = ['Sen','Sel','Rab','Kam','Jum','Sab','Min'];

  const firstDayOfWeek = new Date(current.year, current.month, 1).getDay();
  const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  const daysInMonth = new Date(current.year, current.month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const prev = () => setCurrent(c => ({ year: c.month === 0 ? c.year - 1 : c.year, month: c.month === 0 ? 11 : c.month - 1 }));
  const next = () => setCurrent(c => ({ year: c.month === 11 ? c.year + 1 : c.year, month: c.month === 11 ? 0 : c.month + 1 }));

  const isToday = (d: number) =>
    d === today.getDate() && current.month === today.getMonth() && current.year === today.getFullYear();

  return (
    <div className={styles.calendarWidget}>
      <div className={styles.calendarHeader}>
        <button className={styles.calendarNavBtn} onClick={prev} aria-label="Bulan sebelumnya"><ChevronLeft size={14} /></button>
        <span className={styles.calendarMonth}>{MONTH_NAMES[current.month]} {current.year}</span>
        <button className={styles.calendarNavBtn} onClick={next} aria-label="Bulan berikutnya"><ChevronRight size={14} /></button>
      </div>
      <div className={styles.calendarGrid}>
        {DAY_NAMES.map(d => <div key={d} className={styles.calendarDayName}>{d}</div>)}
        {cells.map((d, i) => (
          <div key={i} className={
            d === null ? styles.calendarDayEmpty :
            isToday(d) ? `${styles.calendarDay} ${styles.calendarDayToday}` :
            styles.calendarDay
          }>
            {d ?? ''}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Status Badge ──
export function StatusBadge({ status }: { status: string }) {
  const s = status?.toUpperCase();
  if (s === 'ACTIVE') return <span className={styles.badgeActive}>Aktif</span>;
  if (s === 'MAINTENANCE') return <span className={styles.badgeMaintenance}>Maintenance</span>;
  if (s === 'INACTIVE') return <span className={styles.badgeInactive}>Tidak Aktif</span>;
  return <span className={styles.badgeInactive}>{status}</span>;
}

// ── Skeleton Card ──
export function SkeletonCard() {
  return (
    <div className={styles.statCard}>
      <div className={styles.skeleton} style={{ height: 12, width: '55%', marginBottom: 14 }} />
      <div className={styles.skeleton} style={{ height: 30, width: '35%', marginBottom: 10 }} />
      <div className={styles.skeleton} style={{ height: 11, width: '45%' }} />
    </div>
  );
}
