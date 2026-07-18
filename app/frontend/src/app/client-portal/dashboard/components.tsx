'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, ShieldAlert, Wrench } from 'lucide-react';
import styles from '../ClientPortal.module.css';
import calStyles from './calendar.module.css';

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

// ── Calendar Event Types ──
export type CalendarEventType = 'warranty-expiring' | 'warranty-expired' | 'service';

export interface CalendarEvent {
  type: CalendarEventType;
  units: { id?: string; serial: string; model: string }[];
}

export type CalendarEvents = Record<string, CalendarEvent>; // key: "YYYY-MM-DD"

// ── Mini Calendar Widget with Events ──
export function MiniCalendar({ events = {} }: { events?: CalendarEvents }) {
  const today = new Date();
  const [current, setCurrent] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [tooltip, setTooltip] = useState<{ day: number; x: number; y: number } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const MONTH_NAMES = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const DAY_NAMES = ['S','S','R','K','J','S','M']; // Sen, Sel, Rab, Kam, Jum, Sab, Min

  const firstDayOfWeek = new Date(current.year, current.month, 1).getDay();
  const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  const daysInMonth = new Date(current.year, current.month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const prev = () => { setTooltip(null); setCurrent(c => ({ year: c.month === 0 ? c.year - 1 : c.year, month: c.month === 0 ? 11 : c.month - 1 })); };
  const next = () => { setTooltip(null); setCurrent(c => ({ year: c.month === 11 ? c.year + 1 : c.year, month: c.month === 11 ? 0 : c.month + 1 })); };

  const isToday = (d: number) =>
    d === today.getDate() && current.month === today.getMonth() && current.year === today.getFullYear();

  const getEventKey = (d: number) => {
    const mm = String(current.month + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${current.year}-${mm}-${dd}`;
  };

  const getEvent = (d: number): CalendarEvent | undefined => events[getEventKey(d)];

  const getDotColor = (type: CalendarEventType) => {
    if (type === 'warranty-expired') return '#EF4444';
    if (type === 'warranty-expiring') return '#FF6B00';
    return '#2E5BFF';
  };

  // Close tooltip on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setTooltip(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const tooltipEvent = tooltip ? getEvent(tooltip.day) : null;

  // Count events in current month for legend
  const monthEventCount = Object.entries(events).filter(([key]) => {
    const [y, m] = key.split('-');
    return parseInt(y) === current.year && parseInt(m) - 1 === current.month;
  }).length;

  return (
    <div className={styles.calendarWidget} style={{ position: 'relative' }}>
      {/* Header */}
      <div className={styles.calendarHeader}>
        <button className={styles.calendarNavBtn} onClick={prev} aria-label="Bulan sebelumnya">
          <ChevronLeft size={14} />
        </button>
        <span className={styles.calendarMonth}>{MONTH_NAMES[current.month]} {current.year}</span>
        <button className={styles.calendarNavBtn} onClick={next} aria-label="Bulan berikutnya">
          <ChevronRight size={14} />
        </button>
      </div>

      <div className={styles.calendarBody}>
        {/* Grid */}
        <div className={styles.calendarGrid}>
          {DAY_NAMES.map((d, i) => (
            <div key={i} className={styles.calendarDayName}>{d}</div>
          ))}
          {cells.map((d, i) => {
            if (d === null) return <div key={i} className={styles.calendarDayEmpty} />;
            const event = getEvent(d);
            const isActive = tooltip?.day === d;

            return (
              <div
                key={i}
                className={[
                  styles.calendarDay,
                  isToday(d) ? styles.calendarDayToday : '',
                  event ? calStyles.hasEvent : '',
                  isActive ? calStyles.eventActive : '',
                ].filter(Boolean).join(' ')}
                onClick={e => {
                  if (!event) { setTooltip(null); return; }
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  setTooltip(prev => prev?.day === d ? null : { day: d, x: rect.left, y: rect.bottom });
                }}
                style={event ? {
                  cursor: 'pointer',
                  color: getDotColor(event.type),
                  fontWeight: 800
                } : { cursor: 'default' }}
              >
                {d}
              </div>
            );
          })}
        </div>

        {/* Legend / Deskripsi Event */}
        {monthEventCount > 0 && (
          <div className={calStyles.legend}>
            {Object.entries(events)
              .filter(([key]) => {
                const [y, m] = key.split('-');
                return parseInt(y) === current.year && parseInt(m) - 1 === current.month;
              })
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map(([key, event]) => {
                const dd = key.split('-')[2];
                let desc = '';
                if (event.type === 'service') desc = 'Jadwal Servis';
                if (event.type === 'warranty-expiring') desc = 'Garansi segera habis';
                if (event.type === 'warranty-expired') desc = 'Garansi habis';
                
                return (
                  <div key={key} className={calStyles.legendItem}>
                    <strong style={{ color: getDotColor(event.type) }}>{dd} {MONTH_NAMES[current.month]}:</strong> {desc}
                  </div>
                );
              })}
          </div>
        )}

        {/* Tooltip */}
        {tooltip && tooltipEvent && (
          <div ref={tooltipRef} className={calStyles.tooltip}>
            <div className={calStyles.tooltipHeader}>
              {tooltipEvent.type === 'warranty-expired' && (
                <><ShieldAlert size={13} color="#EF4444" /> <span style={{ color: '#EF4444' }}>Garansi Habis</span></>
              )}
              {tooltipEvent.type === 'warranty-expiring' && (
                <><ShieldAlert size={13} color="#FF6B00" /> <span style={{ color: '#FF6B00' }}>Garansi Segera Habis</span></>
              )}
              {tooltipEvent.type === 'service' && (
                <><Wrench size={13} color="#2E5BFF" /> <span style={{ color: '#2E5BFF' }}>Servis</span></>
              )}
            </div>
            <div className={calStyles.tooltipList}>
              {tooltipEvent.units.slice(0, 5).map((u, i) => (
                <div 
                  key={i} 
                  className={calStyles.tooltipUnit}
                  style={{ cursor: u.id ? 'pointer' : 'default' }}
                  onClick={() => u.id && router.push(`/client-portal/units/${u.id}`)}
                >
                  <span className={calStyles.tooltipSerial} style={{ color: u.id ? 'var(--brand-cobalt-blue)' : undefined }}>
                    {u.serial}
                  </span>
                  <span className={calStyles.tooltipModel}>{u.model}</span>
                </div>
              ))}
              {tooltipEvent.units.length > 5 && (
                <div className={calStyles.tooltipMore}>+{tooltipEvent.units.length - 5} unit lainnya</div>
              )}
            </div>
            <div 
              style={{ padding: '8px 14px', borderTop: '1px solid rgba(0,31,63,0.06)', fontSize: '0.72rem', color: '#2E5BFF', cursor: 'pointer', textAlign: 'center', fontWeight: 600 }}
              onClick={() => {
                if (tooltipEvent.type.includes('warranty')) router.push('/client-portal/warranty');
                else router.push('/client-portal/fleet');
              }}
            >
              Lihat Selengkapnya &rarr;
            </div>
          </div>
        )}
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
