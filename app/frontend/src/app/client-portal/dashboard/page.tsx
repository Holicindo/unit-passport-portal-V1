'use client';

import { useState, useEffect } from 'react';
import { unitApi, serviceLogApi } from '@/lib/api';
import { TrendingUp, AlertTriangle, ChevronRight, Wrench, Package } from 'lucide-react';
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

  // ── Build calendar events dari warranty_expiry fleet ──
  const calendarEvents: CalendarEvents = {};
  fleet.forEach(u => {
    if (!u.warranty_expiry) return;
    const exp = new Date(u.warranty_expiry);
    // Key: YYYY-MM-DD (local date)
    const key = `${exp.getFullYear()}-${String(exp.getMonth() + 1).padStart(2, '0')}-${String(exp.getDate()).padStart(2, '0')}`;
    const type = exp < today ? 'warranty-expired' : exp <= in30Days ? 'warranty-expiring' : 'warranty-expiring';
    if (!calendarEvents[key]) {
      calendarEvents[key] = { type, units: [] };
    }
    calendarEvents[key].units.push({
      serial: u.serial_number || '—',
      model: u.model_name || '—',
    });
    // Prioritize expired > expiring
    if (exp < today) calendarEvents[key].type = 'warranty-expired';
  });

  const firstName = user?.name?.split(' ')[0] || '';
  const companyName = user?.company_name || '';

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{greeting}{firstName ? `, ${firstName}` : ''}</h1>
        <p className={styles.pageDescription}>
          {companyName ? `Ringkasan status fleet ${companyName}.` : 'Ringkasan status fleet Anda.'}
        </p>
      </div>

      <div className={styles.statsGrid}>
        {loading ? (
          <><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
        ) : (
          <>
            <div className={`${styles.statCard} ${styles.statCardBlue}`}>
              <div className={styles.statCardLabel}>Total Unit</div>
              <div className={styles.statCardContent}>
                <div className={styles.statCardValue}>{totalUnits}</div>
                <div className={styles.statCardFooter}>
                  <span style={{ color: 'var(--brand-space-grey)', fontSize: '0.78rem', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                    Seluruh aset terdaftar
                  </span>
                </div>
              </div>
            </div>
            <div className={`${styles.statCard} ${styles.statCardGreen}`}>
              <div className={styles.statCardLabel}>Unit Aktif</div>
              <div className={styles.statCardContent}>
                <div className={styles.statCardValue}>{activeUnits}</div>
                <div className={styles.statCardFooter}>
                  {totalUnits > 0 && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(16,185,129,0.12)', color: '#059669', padding: '2px 8px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                      <TrendingUp size={11} />{Math.round((activeUnits / totalUnits) * 100)}%
                    </span>
                  )}
                  <span style={{ color: 'var(--brand-space-grey)', fontSize: '0.78rem', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                    dari total unit
                  </span>
                </div>
              </div>
            </div>
            <div className={`${styles.statCard} ${styles.statCardOrange}`}>
              <div className={styles.statCardLabel}>Perlu Servis</div>
              <div className={styles.statCardContent}>
                <div className={styles.statCardValue}>{maintUnits}</div>
                <div className={styles.statCardFooter}>
                  {maintUnits > 0 ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(255,107,0,0.15)', color: 'var(--brand-safety-orange)', padding: '2px 8px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                      <AlertTriangle size={11} /> Perhatian
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(16,185,129,0.12)', color: '#059669', padding: '2px 8px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                      Semua OK
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className={`${styles.statCard} ${styles.statCardNavy}`}>
              <div className={styles.statCardLabel}>Garansi Aktif</div>
              <div className={styles.statCardContent}>
                <div className={styles.statCardValue}>{activeWarr}</div>
                <div className={styles.statCardFooter}>
                  {expiringWarr > 0 ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(239,68,68,0.12)', color: 'var(--brand-danger)', padding: '2px 8px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                      <AlertTriangle size={11} /> {expiringWarr} segera habis
                    </span>
                  ) : (
                    <span style={{ color: 'var(--brand-space-grey)', fontSize: '0.78rem', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                      Tidak ada yang akan habis
                    </span>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className={styles.twoCol}>
        {/* Kolom kiri — stretch tinggi mengikuti kolom kanan */}
        <div className={styles.twoColLeft}>
          <div className={`${styles.card} ${styles.cardStretch}`}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Unit Terdaftar</h2>
              <Link href="/client-portal/fleet" className={styles.cardAction}>Lihat Semua <ChevronRight size={14} /></Link>
            </div>
            <div className={styles.cardBody}>
              {loading ? (
                <div>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{ marginBottom: 16 }}>
                      <div className={styles.skeleton} style={{ height: 13, width: '75%', marginBottom: 6 }} />
                      <div className={styles.skeleton} style={{ height: 11, width: '45%' }} />
                    </div>
                  ))}
                </div>
              ) : fleet.length === 0 ? (
                <div className={styles.emptyState} style={{ flex: 1 }}>
                  <div className={styles.emptyStateIcon}><Package size={28} /></div>
                  <div className={styles.emptyStateTitle}>Belum ada unit terdaftar</div>
                  <div className={styles.emptyStateDesc}>Unit yang terdaftar atas nama perusahaan Anda akan muncul di sini.</div>
                </div>
              ) : (
                <>
                  <div style={{ flex: 1 }}>
                    <table className={styles.dataTable}>
                      <thead>
                        <tr><th>Serial Number</th><th>Model</th><th>Lokasi</th><th>Status</th></tr>
                      </thead>
                      <tbody>
                        {fleet.slice(0, 8).map(unit => (
                          <tr key={unit.id}>
                            <td data-label="Serial Number">
                              <Link href={`/client-portal/units/${unit.id}`}
                                style={{ color: 'var(--brand-cobalt-blue)', fontWeight: 700, textDecoration: 'none', fontFamily: 'var(--font-heading)' }}>
                                {unit.serial_number}
                              </Link>
                            </td>
                            <td data-label="Model">{unit.model_name || '-'}</td>
                            <td data-label="Lokasi" style={{ color: 'var(--brand-space-grey)' }}>
                              {unit.current_client?.city || unit.specs?.city || '-'}
                            </td>
                            <td data-label="Status"><StatusBadge status={unit.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {fleet.length > 8 && (
                    <div className={styles.pagination}>
                      <span className={styles.paginationInfo}>Menampilkan 8 dari {fleet.length} unit</span>
                      <Link href="/client-portal/fleet" className={styles.cardAction}>Lihat semua</Link>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Kolom kanan — kalender + servis terbaru stretch penuh */}
        <div className={styles.twoColRight}>
          <MiniCalendar events={calendarEvents} />
          <div className={styles.card}>
            <div className={styles.cardHeader}><h2 className={styles.cardTitle}>Servis Terbaru</h2></div>
            <div className={styles.cardBody}>
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
