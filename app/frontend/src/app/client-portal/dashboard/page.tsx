'use client';

import { useState, useEffect } from 'react';
import { unitApi, serviceLogApi } from '@/lib/api';
import {
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Wrench,
  Package,
} from 'lucide-react';
import styles from '../ClientPortal.module.css';
import Link from 'next/link';

// ── Greeting real-time berdasarkan jam ──
function useGreeting() {
  const [greeting, setGreeting] = useState('');
  useEffect(() => {
    const update = () => {
      const h = new Date().getHours();
      if (h >= 5  && h < 12) setGreeting('Selamat Pagi');
      else if (h >= 12 && h < 15) setGreeting('Selamat Siang');
      else if (h >= 15 && h < 18) setGreeting('Selamat Sore');
      else setGreeting('Selamat Malam');
    };
    update();
    // Update setiap menit agar tetap akurat
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, []);
  return greeting;
}

// ── Mini Calendar ──
function MiniCalendar() {
  const today = new Date();
  const [current, setCurrent] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });

  const MONTH_NAMES = [
    'Januari','Februari','Maret','April','Mei','Juni',
    'Juli','Agustus','September','Oktober','November','Desember',
  ];
  const DAY_NAMES = ['Sen','Sel','Rab','Kam','Jum','Sab','Min'];

  const firstDayOfWeek = new Date(current.year, current.month, 1).getDay();
  const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  const daysInMonth = new Date(current.year, current.month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const prev = () => setCurrent(c => ({
    year:  c.month === 0 ? c.year - 1 : c.year,
    month: c.month === 0 ? 11 : c.month - 1,
  }));
  const next = () => setCurrent(c => ({
    year:  c.month === 11 ? c.year + 1 : c.year,
    month: c.month === 11 ? 0 : c.month + 1,
  }));

  const isToday = (d: number) =>
    d === today.getDate() &&
    current.month === today.getMonth() &&
    current.year === today.getFullYear();

  return (
    <div className={styles.calendarWidget}>
      <div className={styles.calendarHeader}>
        <button className={styles.calendarNavBtn} onClick={prev} aria-label="Bulan sebelumnya">
          <ChevronLeft size={14} />
        </button>
        <span className={styles.calendarMonth}>
          {MONTH_NAMES[current.month]} {current.year}
        </span>
        <button className={styles.calendarNavBtn} onClick={next} aria-label="Bulan berikutnya">
          <ChevronRight size={14} />
        </button>
      </div>
      <div className={styles.calendarGrid}>
        {DAY_NAMES.map(d => (
          <div key={d} className={styles.calendarDayName}>{d}</div>
        ))}
        {cells.map((d, i) => (
          <div
            key={i}
            className={
              d === null
                ? styles.calendarDayEmpty
                : isToday(d)
                ? `${styles.calendarDay} ${styles.calendarDayToday}`
                : styles.calendarDay
            }
          >
            {d ?? ''}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Status Badge ──
function StatusBadge({ status }: { status: string }) {
  const s = status?.toUpperCase();
  if (s === 'ACTIVE')      return <span className={styles.badgeActive}>Aktif</span>;
  if (s === 'MAINTENANCE') return <span className={styles.badgeMaintenance}>Maintenance</span>;
  if (s === 'INACTIVE')    return <span className={styles.badgeInactive}>Tidak Aktif</span>;
  return <span className={styles.badgeInactive}>{status}</span>;
}

// ── Skeleton Card ──
function SkeletonCard() {
  return (
    <div className={styles.statCard}>
      <div className={styles.skeleton} style={{ height: 12, width: '55%', marginBottom: 14 }} />
      <div className={styles.skeleton} style={{ height: 30, width: '35%', marginBottom: 10 }} />
      <div className={styles.skeleton} style={{ height: 11, width: '45%' }} />
    </div>
  );
}

export default function ClientDashboard() {
  const [fleet, setFleet]           = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [user, setUser]             = useState<any>(null);
  const greeting = useGreeting();

  // Baca user dari localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  // Fetch data fleet & log servis
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: fleetData } = await unitApi.findMyFleet();
        setFleet(fleetData || []);
        try {
          const { data: logsData } = await serviceLogApi.findAll(1, 5);
          setRecentLogs(logsData?.data || logsData || []);
        } catch { /* log servis opsional */ }
      } catch (err) {
        console.error('Gagal memuat data fleet:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Statistik
  const today        = new Date();
  const in30Days     = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const totalUnits   = fleet.length;
  const activeUnits  = fleet.filter(u => u.status === 'ACTIVE').length;
  const maintUnits   = fleet.filter(u => u.status === 'MAINTENANCE').length;
  const activeWarr   = fleet.filter(u => u.warranty_expiry && new Date(u.warranty_expiry) > today).length;
  const expiringWarr = fleet.filter(u => {
    if (!u.warranty_expiry) return false;
    const e = new Date(u.warranty_expiry);
    return e > today && e <= in30Days;
  }).length;

  // Nama depan user yang terdaftar (bukan hardcode "Client")
  const firstName    = user?.name?.split(' ')[0] || '';
  const companyName  = user?.company_name || '';

  return (
    <div>
      {/* ── Page Header — nama & greeting real-time, tanpa emoji ── */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          {greeting}{firstName ? `, ${firstName}` : ''}
        </h1>
        <p className={styles.pageDescription}>
          {companyName
            ? `Ringkasan status fleet ${companyName}.`
            : 'Ringkasan status fleet Anda.'}
        </p>
      </div>

      {/* ── Stat Cards ── */}
      <div className={styles.statsGrid}>
        {loading ? (
          <><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
        ) : (
          <>
            <div className={styles.statCard}>
              <div className={styles.statCardLabel}>Total Unit</div>
              <div className={styles.statCardValue}>{totalUnits}</div>
              <div className={styles.statCardFooter}>
                <span className={styles.statCardSub}>Seluruh aset terdaftar</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statCardLabel}>Unit Aktif</div>
              <div className={styles.statCardValue}>{activeUnits}</div>
              <div className={styles.statCardFooter}>
                {totalUnits > 0 && (
                  <span className={styles.statBadgeUp}>
                    <TrendingUp size={11} />
                    {Math.round((activeUnits / totalUnits) * 100)}%
                  </span>
                )}
                <span className={styles.statCardSub}>dari total unit</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statCardLabel}>Perlu Servis</div>
              <div className={styles.statCardValue}>{maintUnits}</div>
              <div className={styles.statCardFooter}>
                {maintUnits > 0 ? (
                  <span className={styles.statBadgeWarn}>
                    <AlertTriangle size={11} /> Perhatian
                  </span>
                ) : (
                  <span className={styles.statBadgeUp}>Semua OK</span>
                )}
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statCardLabel}>Garansi Aktif</div>
              <div className={styles.statCardValue}>{activeWarr}</div>
              <div className={styles.statCardFooter}>
                {expiringWarr > 0 ? (
                  <span className={styles.statBadgeWarn}>
                    <AlertTriangle size={11} /> {expiringWarr} segera habis
                  </span>
                ) : (
                  <span className={styles.statCardSub}>Tidak ada yang akan habis</span>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Two Column Layout ── */}
      <div className={styles.twoCol}>

        {/* Kiri: Tabel Unit */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Unit Terdaftar</h2>
            <Link href="/client-portal/fleet" className={styles.cardAction}>
              Lihat Semua <ChevronRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: '24px' }}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{ marginBottom: 16 }}>
                  <div className={styles.skeleton} style={{ height: 13, width: '75%', marginBottom: 6 }} />
                  <div className={styles.skeleton} style={{ height: 11, width: '45%' }} />
                </div>
              ))}
            </div>
          ) : fleet.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}><Package size={28} /></div>
              <div className={styles.emptyStateTitle}>Belum ada unit terdaftar</div>
              <div className={styles.emptyStateDesc}>
                Unit yang terdaftar atas nama perusahaan Anda akan muncul di sini.
              </div>
            </div>
          ) : (
            <>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Serial Number</th>
                    <th>Model</th>
                    <th>Lokasi</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {fleet.slice(0, 8).map(unit => (
                    <tr key={unit.id}>
                      <td data-label="Serial Number">
                        <Link
                          href={`/client-portal/units/${unit.id}`}
                          style={{
                            color: 'var(--brand-cobalt-blue)',
                            fontWeight: 700,
                            textDecoration: 'none',
                            fontFamily: 'var(--font-heading)',
                          }}
                        >
                          {unit.serial_number}
                        </Link>
                      </td>
                      <td data-label="Model">{unit.model_name || '-'}</td>
                      <td data-label="Lokasi" style={{ color: 'var(--brand-space-grey)' }}>
                        {unit.current_client?.city || unit.specs?.city || '-'}
                      </td>
                      <td data-label="Status">
                        <StatusBadge status={unit.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {fleet.length > 8 && (
                <div className={styles.pagination}>
                  <span className={styles.paginationInfo}>
                    Menampilkan 8 dari {fleet.length} unit
                  </span>
                  <Link href="/client-portal/fleet" className={styles.cardAction}>
                    Lihat semua
                  </Link>
                </div>
              )}
            </>
          )}
        </div>

        {/* Kanan: Kalender + Servis Terbaru */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <MiniCalendar />

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Servis Terbaru</h2>
            </div>
            {recentLogs.length === 0 ? (
              <div className={styles.emptyState} style={{ padding: '32px' }}>
                <div className={styles.emptyStateIcon}><Wrench size={22} /></div>
                <div className={styles.emptyStateTitle} style={{ fontSize: '0.875rem' }}>
                  Belum ada riwayat servis
                </div>
              </div>
            ) : (
              <div className={styles.upcomingList}>
                {recentLogs.slice(0, 4).map((log: any) => (
                  <div key={log.id} className={styles.upcomingItem}>
                    <div
                      className={styles.upcomingIcon}
                      style={{
                        background: log.status === 'COMPLETED'
                          ? 'rgba(16,185,129,0.1)'
                          : 'rgba(255,107,0,0.1)',
                        color: log.status === 'COMPLETED'
                          ? '#10b981'
                          : 'var(--brand-safety-orange)',
                      }}
                    >
                      <Wrench size={18} />
                    </div>
                    <div className={styles.upcomingContent}>
                      <div className={styles.upcomingTitle}>
                        {log.unit?.model_name || log.unit?.serial_number || 'Unit'}
                      </div>
                      <div className={styles.upcomingMeta}>
                        {(log.issue_description || 'Servis rutin').slice(0, 42)}
                        {(log.issue_description?.length || 0) > 42 ? '...' : ''}
                      </div>
                    </div>
                    <div className={styles.upcomingDate}>
                      {log.service_date
                        ? new Date(log.service_date).toLocaleDateString('id-ID', {
                            day: 'numeric', month: 'short',
                          })
                        : '-'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
