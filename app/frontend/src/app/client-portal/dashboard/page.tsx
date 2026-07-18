'use client';

import { useState, useEffect } from 'react';
import { unitApi, serviceLogApi } from '@/lib/api';
import { TrendingUp, AlertTriangle, ChevronRight, Wrench, Package, QrCode, ShieldCheck, FileText, Calendar, LifeBuoy } from 'lucide-react';
import styles from '../ClientPortal.module.css';
import Link from 'next/link';
import { useGreeting, MiniCalendar, StatusBadge, SkeletonCard, type CalendarEvents } from './components';

export default function ClientDashboard() {
  const [fleet, setFleet] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const greeting = useGreeting();

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: fleetData } = await unitApi.findMyFleet();
        const fleetArr = fleetData || [];
        setFleet(fleetArr);
        try {
          const logsPromises = fleetArr.slice(0, 3).map((u: any) =>
            serviceLogApi.findByUnit(u.id).then(r => r.data || []).catch(() => [])
          );
          const allLogs = (await Promise.all(logsPromises)).flat();
          setRecentLogs(allLogs.sort((a: any, b: any) =>
            new Date(b.service_date || 0).getTime() - new Date(a.service_date || 0).getTime()
          ).slice(0, 5));
        } catch {}
      } catch (err) {
        console.error('Gagal memuat data fleet:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const today = new Date();
  const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const totalUnits = fleet.length;
  const activeUnits = fleet.filter(u => u.status === 'ACTIVE').length;
  const maintUnits = fleet.filter(u => u.status === 'MAINTENANCE').length;
  const activeWarr = fleet.filter(u => u.warranty_expiry && new Date(u.warranty_expiry) > today).length;
  const expiringWarr = fleet.filter(u => {
    if (!u.warranty_expiry) return false;
    const e = new Date(u.warranty_expiry);
    return e > today && e <= in30Days;
  }).length;

  // ── Build calendar events dari warranty_expiry dan next_service_date fleet ──
  const calendarEvents: CalendarEvents = {};
  fleet.forEach(u => {
    // 1. Cek Garansi
    if (u.warranty_expiry) {
      const exp = new Date(u.warranty_expiry);
      // Key: YYYY-MM-DD (local date)
      const key = `${exp.getFullYear()}-${String(exp.getMonth() + 1).padStart(2, '0')}-${String(exp.getDate()).padStart(2, '0')}`;
      const type = exp < today ? 'warranty-expired' : exp <= in30Days ? 'warranty-expiring' : 'warranty-expiring';
      if (!calendarEvents[key]) {
        calendarEvents[key] = { type, units: [] };
      }
      calendarEvents[key].units.push({
        id: u.id,
        serial: u.serial_number || '—',
        model: u.model_name || '—',
      });
      // Prioritize expired > expiring
      if (exp < today) calendarEvents[key].type = 'warranty-expired';
    }

    // 2. Cek Jadwal Servis (real-time dari backend jika field sudah ditambahkan)
    if (u.next_service_date) {
      const srv = new Date(u.next_service_date);
      const key = `${srv.getFullYear()}-${String(srv.getMonth() + 1).padStart(2, '0')}-${String(srv.getDate()).padStart(2, '0')}`;
      if (!calendarEvents[key]) {
        calendarEvents[key] = { type: 'service', units: [] };
      }
      // Hindari menimpa status kritis (merah/oranye) dengan status servis jika tanggal sama
      if (calendarEvents[key].type !== 'warranty-expired' && calendarEvents[key].type !== 'warranty-expiring') {
        calendarEvents[key].type = 'service';
      }
      // Hindari duplikasi push unit jika unit yang sama punya garansi habis & jadwal servis di hari yang sama
      if (!calendarEvents[key].units.some(existing => existing.id === u.id)) {
        calendarEvents[key].units.push({
          id: u.id,
          serial: u.serial_number || '—',
          model: u.model_name || '—',
        });
      }
    }
  });

  // ── MOCK DATA PENGINGAT (REMINDERS) UNTUK DEMO ──
  // Menambahkan jadwal servis dan pengingat di sekitar tanggal hari ini
  const mockDates = [
    { offset: 2, type: 'service' as const, id: 'demo1', serial: 'A26051860', model: 'Cold Case CX3-1500 [GOLD]' },
    { offset: 5, type: 'warranty-expiring' as const, id: 'demo2', serial: 'B99201991', model: 'Showcase Cooler V2' },
    { offset: -3, type: 'service' as const, id: 'demo3', serial: 'C10293847', model: 'Freezer Max 300L' },
  ];

  mockDates.forEach(mock => {
    const d = new Date(today.getTime() + mock.offset * 24 * 60 * 60 * 1000);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!calendarEvents[key]) {
      calendarEvents[key] = { type: mock.type, units: [] };
    }
    // Jika tidak ada unit aslinya di tanggal tersebut, atau untuk memperkaya data:
    if (!calendarEvents[key].units.some(u => u.serial === mock.serial)) {
      calendarEvents[key].units.push({
        id: mock.id,
        serial: mock.serial,
        model: mock.model,
      });
    }
  });

  const firstName = user?.name?.split(' ')[0] || '';
  const companyName = user?.company_name || '';

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{greeting}{firstName ? `, ${firstName}` : ''}</h1>
        <p className={styles.pageDescription}>
          {companyName ? `Ringkasan status fleet ${companyName}.` : 'Ringkasan status fleet Anda.'}
        </p>
      </div>

      {loading ? (
        <><SkeletonCard /><SkeletonCard /></>
      ) : (
        <>
          {/* ── HERO CARD (Gopay-style Saldo) ── */}
          <div className={styles.heroCard}>
            <div className={styles.heroHeader}>
              <span className={styles.heroHeading}>Kesehatan Fleet</span>
              <span className={styles.heroTotal}>{totalUnits} Unit</span>
            </div>
            <div className={styles.heroStatsRow}>
              <div className={styles.heroStatItem}>
                <span className={styles.heroStatValue}>{activeUnits}</span>
                <span className={styles.heroStatLabel}>Aktif Beroperasi</span>
              </div>
              <div className={styles.heroStatDivider} />
              <div className={styles.heroStatItem}>
                <span className={styles.heroStatValue} style={{ color: maintUnits > 0 ? '#FFA07A' : 'inherit' }}>
                  {maintUnits}
                </span>
                <span className={styles.heroStatLabel}>Perlu Servis</span>
              </div>
              <div className={styles.heroStatDivider} />
              <div className={styles.heroStatItem}>
                <span className={styles.heroStatValue} style={{ color: expiringWarr > 0 ? '#FFA07A' : 'inherit' }}>
                  {expiringWarr}
                </span>
                <span className={styles.heroStatLabel}>Garansi Kritis</span>
              </div>
            </div>
          </div>

          {/* ── QUICK ACTIONS (Menu Bulat) ── */}
          <div className={styles.quickActions}>
            <Link href="/client-portal/fleet" className={styles.actionBtn}>
              <div className={styles.actionIcon}><Package size={22} /></div>
              <span className={styles.actionLabel}>Daftar Unit</span>
            </Link>
            <Link href="/client-portal/service-request" className={styles.actionBtn}>
              <div className={styles.actionIcon}><Calendar size={22} /></div>
              <span className={styles.actionLabel}>Jadwal Servis</span>
            </Link>
            <Link href="/client-portal/units/scan" className={styles.actionBtn}>
              <div className={styles.actionIcon}><QrCode size={22} /></div>
              <span className={styles.actionLabel}>Scan QR</span>
            </Link>
            <Link href="/client-portal/messages" className={styles.actionBtn}>
              <div className={styles.actionIcon}><LifeBuoy size={22} /></div>
              <span className={styles.actionLabel}>Bantuan</span>
            </Link>
          </div>
        </>
      )}

      <div className={styles.twoCol}>
        {/* Kolom kiri — Unit Terdaftar (List View) */}
        <div className={styles.twoColLeft}>
          <div className={`${styles.card} ${styles.cardStretch}`}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Unit Terdaftar</h2>
              <Link href="/client-portal/fleet" className={styles.cardAction}>Lihat Semua <ChevronRight size={14} /></Link>
            </div>
            <div className={styles.cardBody} style={{ padding: '0 16px 16px' }}>
              {loading ? (
                <div>
                  {[1,2,3].map(i => (
                    <div key={i} style={{ marginBottom: 16 }}>
                      <div className={styles.skeleton} style={{ height: 13, width: '75%', marginBottom: 6 }} />
                      <div className={styles.skeleton} style={{ height: 11, width: '45%' }} />
                    </div>
                  ))}
                </div>
              ) : fleet.length === 0 ? (
                <div className={styles.emptyState} style={{ flex: 1, marginTop: '20px' }}>
                  <div className={styles.emptyStateIcon}><Package size={28} /></div>
                  <div className={styles.emptyStateTitle}>Belum ada unit terdaftar</div>
                  <div className={styles.emptyStateDesc}>
                    Unit yang terdaftar atas nama perusahaan Anda akan muncul di sini. Jika merasa ini adalah kesalahan, silakan hubungi tim Holicindo melalui menu Pesan.
                  </div>
                </div>
              ) : (
                <div className={styles.unitList}>
                  {fleet.slice(0, 6).map(unit => (
                    <Link href={`/client-portal/units/${encodeURIComponent(unit.id)}`} key={unit.id} className={styles.unitListItem}>
                      <div className={styles.unitListIcon}>
                        <Package size={20} />
                      </div>
                      <div className={styles.unitListContent}>
                        <div className={styles.unitListTitle}>{unit.serial_number}</div>
                        <div className={styles.unitListSub}>{unit.model_name || 'Tidak diketahui'} • {unit.current_client?.city || unit.specs?.city || 'Lokasi TBA'}</div>
                      </div>
                      <div className={styles.unitListStatus}>
                        <StatusBadge status={unit.status} />
                      </div>
                    </Link>
                  ))}
                  {fleet.length > 6 && (
                    <div style={{ textAlign: 'center', marginTop: '8px' }}>
                      <Link href="/client-portal/fleet" className={styles.cardAction} style={{ fontSize: '0.85rem' }}>
                        Lihat {fleet.length - 6} unit lainnya
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Kolom kanan — kalender + servis terbaru */}
        <div className={styles.twoColRight}>
          <MiniCalendar events={calendarEvents} />
          <div className={styles.card}>
            <div className={styles.cardHeader}><h2 className={styles.cardTitle}>Servis Terbaru</h2></div>
            <div className={styles.cardBody} style={{ paddingTop: 0 }}>
              {recentLogs.length === 0 ? (
                <div className={styles.emptyState} style={{ flex: 1, padding: '12px' }}>
                  <div className={styles.emptyStateIcon}><Wrench size={22} /></div>
                  <div className={styles.emptyStateTitle} style={{ fontSize: '0.875rem' }}>Belum ada riwayat servis</div>
                </div>
              ) : (
                <div className={styles.upcomingList}>
                  {recentLogs.slice(0, 4).map((log: any) => (
                    <div key={log.id} className={styles.upcomingItem}>
                      <div className={styles.upcomingIcon} style={{
                        background: log.status === 'COMPLETED' ? 'rgba(16,185,129,0.12)' : 'rgba(255,107,0,0.12)',
                        color: log.status === 'COMPLETED' ? '#10b981' : 'var(--brand-safety-orange)',
                        boxShadow: 'var(--neu-shadow-sm)',
                      }}><Wrench size={18} /></div>
                      <div className={styles.upcomingContent}>
                        <div className={styles.upcomingTitle}>{log.unit?.model_name || log.unit?.serial_number || 'Unit'}</div>
                        <div className={styles.upcomingMeta}>
                          {(log.issue_description || 'Servis rutin').slice(0, 42)}
                          {(log.issue_description?.length || 0) > 42 ? '...' : ''}
                        </div>
                      </div>
                      <div className={styles.upcomingDate}>
                        {log.service_date ? new Date(log.service_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
