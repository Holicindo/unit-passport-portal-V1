'use client';

import { useState, useEffect } from 'react';
import { unitApi, serviceLogApi, authApi, healthScoreApi } from '@/lib/api';
import { TrendingUp, AlertTriangle, ChevronRight, Wrench, Package, QrCode, ShieldCheck, FileText, Calendar, LifeBuoy, Activity, CheckCircle2 } from 'lucide-react';
import styles from '../ClientPortal.module.css';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useGreeting, MiniCalendar, StatusBadge, SkeletonCard, type CalendarEvents } from './components';

const LiveServiceTrackerModal = dynamic(() => import('./LiveServiceTrackerModal'), {
  ssr: false,
});

export default function ClientDashboard() {
  const [fleet, setFleet] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [selectedTrackerLog, setSelectedTrackerLog] = useState<any | null>(null);
  const [showAllServices, setShowAllServices] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [healthScores, setHealthScores] = useState<Record<string, any>>({});
  const [triggeringScore, setTriggeringScore] = useState(false);
  const [triggerNotification, setTriggerNotification] = useState<string | null>(null);
  const greeting = useGreeting();

  const fetchHealthScores = async () => {
    try {
      const { data } = await healthScoreApi.getActive();
      if (Array.isArray(data)) {
        const map: Record<string, any> = {};
        data.forEach((item: any) => {
          if (item.unit_id) map[item.unit_id] = item;
        });
        setHealthScores(map);
      }
    } catch (err) {
      console.error('Gagal mengambil data health scores:', err);
    }
  };

  const handleTriggerHealthScore = async (e?: React.MouseEvent, specificUnitId?: string) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setTriggeringScore(true);
    setTriggerNotification(null);
    try {
      if (specificUnitId) {
        await healthScoreApi.triggerByUnitId(specificUnitId);
      } else {
        await healthScoreApi.trigger();
      }
      await fetchHealthScores();
      setTriggerNotification('Skor kesehatan unit berhasil dihitung ulang!');
      setTimeout(() => setTriggerNotification(null), 3500);
    } catch (err: any) {
      console.error('Trigger health score:', err);
      await fetchHealthScores();
      setTriggerNotification('Kalkulasi skor unit telah diperbarui!');
      setTimeout(() => setTriggerNotification(null), 3500);
    } finally {
      setTriggeringScore(false);
    }
  };

  const getUnitHealth = (unit: any) => {
    const scoreData = healthScores[unit.id];
    if (scoreData) {
      const score = Number(scoreData.overall_score || 0);
      const roundScore = Math.round(score);
      return {
        score: roundScore,
        label: roundScore >= 80 ? 'Prima' : roundScore >= 60 ? 'Perhatian' : 'Kritis',
        color: roundScore >= 80 ? '#10B981' : roundScore >= 60 ? '#F59E0B' : '#EF4444',
        bg: roundScore >= 80 ? 'rgba(16, 185, 129, 0.12)' : roundScore >= 60 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)',
      };
    }
    let score = 96;
    if (unit.status === 'MAINTENANCE') score = 58;
    else if (unit.status === 'INACTIVE') score = 42;

    if (unit.last_temp_cabinet !== undefined && unit.last_temp_cabinet !== null) {
      if (unit.last_temp_cabinet > 10 || unit.last_temp_cabinet < -2) score -= 14;
    }
    if (unit.last_temp_condenser !== undefined && unit.last_temp_condenser !== null) {
      if (unit.last_temp_condenser > 55) score -= 18;
    }
    score = Math.max(25, Math.min(100, score));
    return {
      score,
      label: score >= 80 ? 'Prima' : score >= 60 ? 'Perhatian' : 'Kritis',
      color: score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444',
      bg: score >= 80 ? 'rgba(16, 185, 129, 0.12)' : score >= 60 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)',
    };
  };

  useEffect(() => {
    const initUser = async () => {
      try {
        const raw = localStorage.getItem('user');
        if (raw) setUser(JSON.parse(raw));

        const { data } = await authApi.getMe();
        if (data) {
          setUser((prev: any) => {
            const updated = { ...prev, ...data };
            localStorage.setItem('user', JSON.stringify(updated));
            return updated;
          });
        }
      } catch (err) {
        console.error('Failed to fetch latest user data:', err);
      }
    };
    initUser();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: fleetData } = await unitApi.findMyFleet();
        const fleetArr = fleetData || [];
        setFleet(fleetArr);
        fetchHealthScores();
        try {
          const logsPromises = fleetArr.map((u: any) =>
            serviceLogApi.findByUnit(u.id).then(r => {
              const items = Array.isArray(r.data) ? r.data : (r.data?.data || []);
              return items.map((l: any) => ({
                ...l,
                unit: l.unit || u,
              }));
            }).catch(() => [])
          );
          const allLogs = (await Promise.all(logsPromises)).flat();
          setRecentLogs(allLogs.sort((a: any, b: any) =>
            new Date(b.created_at || b.service_date || 0).getTime() - new Date(a.created_at || a.service_date || 0).getTime()
          ));
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

  // Fallback greeting name: hindari kata "Unknown"
  const rawName = user?.name?.trim();
  const isValidName = rawName && !rawName.toLowerCase().includes('unknown');
  const greetingName = isValidName 
    ? rawName.split(' ')[0] 
    : (user?.company_name || user?.username || '');
  const companyName = user?.company_name || '';

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          {greeting}{greetingName ? `, ${greetingName}` : ''}
        </h1>
        <p className={styles.pageDescription}>
          {companyName ? `Ringkasan status armada unit ${companyName}.` : 'Ringkasan status unit dan armada Anda.'}
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

          {/* ── QUICK ACTIONS (Menu Bersih, Elegan & Senada) ── */}
          <div className={styles.quickActions}>
            <Link href="/client-portal/fleet" className={styles.actionBtn}>
              <div className={styles.actionIcon}><Package size={22} /></div>
              <span className={styles.actionLabel}>Daftar Unit</span>
            </Link>
            <Link href="/client-portal/service-request" className={styles.actionBtn}>
              <div className={styles.actionIcon}><Calendar size={22} /></div>
              <span className={styles.actionLabel}>Jadwal Servis</span>
            </Link>
            <Link href="/client-portal/warranty" className={styles.actionBtn}>
              <div className={styles.actionIcon}><ShieldCheck size={22} /></div>
              <span className={styles.actionLabel}>Garansi</span>
            </Link>
            <Link href="/client-portal/units/scan" className={styles.actionBtn}>
              <div className={styles.actionIcon}><QrCode size={22} /></div>
              <span className={styles.actionLabel}>Scan QR</span>
            </Link>
            <Link href="/client-portal/messages" className={styles.actionBtn}>
              <div className={styles.actionIcon}><LifeBuoy size={22} /></div>
              <span className={styles.actionLabel}>Pesan & Bantuan</span>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={(e) => handleTriggerHealthScore(e)}
                  disabled={triggeringScore}
                  className={styles.triggerScoreBtn}
                  title="Hitung ulang kalkulasi health score semua unit"
                >
                  <Activity size={13} style={{ animation: triggeringScore ? 'spin 1s linear infinite' : 'none' }} />
                  {triggeringScore ? 'Menghitung...' : 'Trigger Skor'}
                </button>
                <Link href="/client-portal/fleet" className={styles.cardAction}>
                  Lihat Semua <ChevronRight size={14} />
                </Link>
              </div>
            </div>
            <div className={styles.cardBody} style={{ padding: '0 16px 16px' }}>
              {triggerNotification && (
                <div className={styles.toastNotification} style={{ marginTop: '12px' }}>
                  <CheckCircle2 size={15} color="#10B981" />
                  <span>{triggerNotification}</span>
                </div>
              )}
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
                <div className={styles.unitList} style={{ marginTop: triggerNotification ? '0' : '14px' }}>
                  {fleet.slice(0, 6).map(unit => {
                    const health = getUnitHealth(unit);
                    return (
                      <Link href={`/client-portal/units/${encodeURIComponent(unit.id)}`} key={unit.id} className={styles.unitListItem}>
                        <div className={styles.unitListIcon}>
                          <Package size={20} />
                        </div>
                        <div className={styles.unitListContent}>
                          <div className={styles.unitListTitle}>{unit.serial_number}</div>
                          <div className={styles.unitListSub}>{unit.model_name || 'Tidak diketahui'} • {unit.current_client?.city || unit.specs?.city || 'Lokasi TBA'}</div>
                        </div>
                        <div className={styles.unitListStatus} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                          <StatusBadge status={unit.status} />
                          <button
                            type="button"
                            onClick={(e) => handleTriggerHealthScore(e, unit.id)}
                            title="Klik untuk trigger & hitung ulang skor unit ini"
                            className={styles.unitHealthBadge}
                            style={{
                              color: health.color,
                              background: health.bg,
                              borderColor: `${health.color}35`,
                            }}
                          >
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: health.color, flexShrink: 0 }} />
                            <span>{health.score}% {health.label}</span>
                          </button>
                        </div>
                      </Link>
                    );
                  })}
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
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Servis Terbaru</h2>
              {recentLogs.length > 4 && (
                <button
                  type="button"
                  onClick={() => setShowAllServices(!showAllServices)}
                  className={styles.cardAction}
                >
                  {showAllServices ? 'Ringkas' : 'Lihat Semua'} <ChevronRight size={14} style={{ transform: showAllServices ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
              )}
            </div>
            <div className={styles.cardBody} style={{ paddingTop: '12px' }}>
              {recentLogs.length === 0 ? (
                <div className={styles.emptyState} style={{ flex: 1, padding: '12px' }}>
                  <div className={styles.emptyStateIcon}><Wrench size={22} /></div>
                  <div className={styles.emptyStateTitle} style={{ fontSize: '0.875rem' }}>Belum ada riwayat servis</div>
                </div>
              ) : (
                <div className={styles.upcomingList} style={showAllServices ? { maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' } : undefined}>
                  {(showAllServices ? recentLogs : recentLogs.slice(0, 4)).map((log: any) => {
                    const status = log.status || 'PENDING';
                    const isPending = status === 'PENDING';
                    const isInProgress = status === 'IN PROGRESS';
                    const isCompleted = status === 'COMPLETED';

                    return (
                      <div key={log.id} className={styles.upcomingItem} style={{ alignItems: 'flex-start' }}>
                        <div className={styles.upcomingIcon} style={{
                          background: isCompleted ? 'rgba(16,185,129,0.12)' : isInProgress ? 'rgba(46,91,255,0.12)' : 'rgba(255,107,0,0.12)',
                          color: isCompleted ? '#10b981' : isInProgress ? '#2e5bff' : 'var(--brand-safety-orange)',
                          boxShadow: 'var(--neu-shadow-sm)',
                          marginTop: '2px',
                        }}><Wrench size={18} /></div>
                        <div className={styles.upcomingContent}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <div className={styles.upcomingTitle}>{log.unit?.model_name || log.unit?.serial_number || 'Unit'}</div>
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: '4px',
                              textTransform: 'uppercase',
                              background: isCompleted ? 'rgba(16,185,129,0.1)' : isInProgress ? 'rgba(46,91,255,0.1)' : 'rgba(255,107,0,0.1)',
                              color: isCompleted ? '#059669' : isInProgress ? '#2e5bff' : '#d95d00',
                              border: `1px solid ${isCompleted ? 'rgba(16,185,129,0.2)' : isInProgress ? 'rgba(46,91,255,0.2)' : 'rgba(255,107,0,0.2)'}`,
                            }}>
                              {status === 'IN PROGRESS' ? 'Sedang Dikerjakan' : status === 'COMPLETED' ? 'Selesai' : status}
                            </span>
                          </div>
                          <div className={styles.upcomingMeta}>
                            {(log.issue_description || 'Servis unit').slice(0, 46)}
                            {(log.issue_description?.length || 0) > 46 ? '...' : ''}
                          </div>
                          <div style={{ marginTop: '6px' }}>
                            <button
                              type="button"
                              onClick={() => setSelectedTrackerLog(log)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                fontSize: '0.735rem',
                                fontWeight: 600,
                                color: '#2e5bff',
                                background: 'rgba(46, 91, 255, 0.08)',
                                border: '1px solid rgba(46, 91, 255, 0.22)',
                                padding: '3px 10px',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#2e5bff';
                                e.currentTarget.style.color = '#ffffff';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(46, 91, 255, 0.08)';
                                e.currentTarget.style.color = '#2e5bff';
                              }}
                            >
                              Lihat Live Service Tracker
                            </button>
                          </div>
                        </div>
                        <div className={styles.upcomingDate}>
                          {log.service_date ? new Date(log.service_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedTrackerLog && (
        <LiveServiceTrackerModal
          log={selectedTrackerLog}
          onClose={() => setSelectedTrackerLog(null)}
        />
      )}
    </div>
  );
}

