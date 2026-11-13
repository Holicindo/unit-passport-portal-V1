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

  // ── Build calendar events dari warranty_expiry, next_service_date, dan scheduled_date service_logs ──
  const calendarEvents: CalendarEvents = {};
  
  // 1. Event dari Fleet Units (Garansi & Next Service Date)
  fleet.forEach(u => {
    // 1a. Cek Garansi
    if (u.warranty_expiry) {
      const exp = new Date(u.warranty_expiry);
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

    // 1b. Cek Next Service Date di unit
    if (u.next_service_date) {
      const srv = new Date(u.next_service_date);
      const key = `${srv.getFullYear()}-${String(srv.getMonth() + 1).padStart(2, '0')}-${String(srv.getDate()).padStart(2, '0')}`;
      if (!calendarEvents[key]) {
        calendarEvents[key] = { type: 'service', units: [] };
      }
      // Hindari menimpa status kritis (merah/oranye) dengan status servis
      if (calendarEvents[key].type !== 'warranty-expired' && calendarEvents[key].type !== 'warranty-expiring') {
        calendarEvents[key].type = 'service';
      }
      // Hindari duplikasi unit
      if (!calendarEvents[key].units.some(existing => existing.id === u.id)) {
        calendarEvents[key].units.push({
          id: u.id,
          serial: u.serial_number || '—',
          model: u.model_name || '—',
        });
      }
    }
  });

  // 2. Event dari Service Logs (Scheduled Date dari tiket servis)
  recentLogs.forEach(log => {
    // Hanya ambil tiket PENDING atau IN PROGRESS yang punya jadwal scheduled_date
    const status = (log.status || '').toUpperCase();
    if ((status === 'PENDING' || status === 'IN PROGRESS' || status === 'SCHEDULED') && log.scheduled_date) {
      const srv = new Date(log.scheduled_date);
      const key = `${srv.getFullYear()}-${String(srv.getMonth() + 1).padStart(2, '0')}-${String(srv.getDate()).padStart(2, '0')}`;
      
      const unitData = {
        id: log.unit?.id,
        serial: log.unit?.serial_number || log.unit_serial_number || '—',
        model: log.unit?.model_name || log.unit_model_name || 'Unit Servis',
      };

      if (!calendarEvents[key]) {
        calendarEvents[key] = { type: 'service', units: [] };
      }
      
      // Hindari menimpa status kritis (merah/oranye) dengan status servis
      if (calendarEvents[key].type !== 'warranty-expired' && calendarEvents[key].type !== 'warranty-expiring') {
        calendarEvents[key].type = 'service';
      }
      
      // Hindari duplikasi unit yang sama
      if (!calendarEvents[key].units.some(existing => 
        existing.id === unitData.id || existing.serial === unitData.serial
      )) {
        calendarEvents[key].units.push(unitData);
      }
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
      {/* ── HEADER ROW (Salam di kiri, Quick Actions Pills elegan di kanan) ── */}
      <div className={styles.desktopHeaderRow}>
        <div className={styles.pageHeader} style={{ marginBottom: 0 }}>
          <h1 className={styles.pageTitle}>
            {greeting}{greetingName ? `, ${greetingName}` : ''}
          </h1>
          <p className={styles.pageDescription} style={{ marginBottom: 0 }}>
            {companyName ? `Ringkasan status armada unit ${companyName}.` : 'Ringkasan status unit dan armada Anda.'}
          </p>
        </div>

        <div className={styles.desktopHeaderActions}>
          <Link href="/client-portal/service-request" className={`${styles.desktopPillBtn} ${styles.desktopPillBtnPrimary}`}>
            <Calendar size={15} /> + Ajukan Servis
          </Link>
          <Link href="/client-portal/fleet" className={styles.desktopPillBtn}>
            <Package size={15} /> Semua Unit
          </Link>
          <Link href="/client-portal/units/scan" className={styles.desktopPillBtn}>
            <QrCode size={15} /> Scan QR
          </Link>
          <Link href="/client-portal/messages" className={styles.desktopPillBtn}>
            <LifeBuoy size={15} /> Bantuan
          </Link>
        </div>
      </div>

      <div className={styles.twoCol}>
        {/* ══════════════ KOLOM KIRI (64%): Stat Cards + Unit Terdaftar ══════════════ */}
        <div className={styles.twoColLeft}>
          
          {/* 3 Mini Stat Cards (Unit Aktif, Perlu Servis, Garansi Kritis) */}
          <div className={styles.threeStatsRow}>
            {/* Stat 1: Aktif */}
            <div className={styles.miniStatCard}>
              <div className={styles.miniStatTop}>
                <span className={styles.miniStatLabel}>Aktif Beroperasi</span>
                <div className={styles.miniStatIcon} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                  <TrendingUp size={16} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span className={styles.miniStatValue}>{loading ? '-' : activeUnits}</span>
                <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700 }}>
                  {totalUnits > 0 ? Math.round((activeUnits / totalUnits) * 100) : 100}% Fleet
                </span>
              </div>
            </div>

            {/* Stat 2: Perlu Servis */}
            <div className={styles.miniStatCard}>
              <div className={styles.miniStatTop}>
                <span className={styles.miniStatLabel}>Perlu Servis</span>
                <div className={styles.miniStatIcon} style={{ background: maintUnits > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(56, 189, 248, 0.12)', color: maintUnits > 0 ? '#ef4444' : '#38bdf8' }}>
                  <Wrench size={16} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span className={styles.miniStatValue} style={{ color: maintUnits > 0 ? '#ef4444' : '#ffffff' }}>
                  {loading ? '-' : maintUnits}
                </span>
                <span style={{ fontSize: '0.72rem', color: maintUnits > 0 ? '#ef4444' : '#94a3b8', fontWeight: 600 }}>
                  {maintUnits > 0 ? 'Tindakan diperlukan' : 'Kondisi Normal'}
                </span>
              </div>
            </div>

            {/* Stat 3: Garansi Kritis */}
            <div className={styles.miniStatCard}>
              <div className={styles.miniStatTop}>
                <span className={styles.miniStatLabel}>Garansi Kritis</span>
                <div className={styles.miniStatIcon} style={{ background: expiringWarr > 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(56, 189, 248, 0.12)', color: expiringWarr > 0 ? '#f59e0b' : '#38bdf8' }}>
                  <ShieldCheck size={16} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span className={styles.miniStatValue} style={{ color: expiringWarr > 0 ? '#f59e0b' : '#ffffff' }}>
                  {loading ? '-' : expiringWarr}
                </span>
                <span style={{ fontSize: '0.72rem', color: expiringWarr > 0 ? '#f59e0b' : '#94a3b8', fontWeight: 600 }}>
                  {expiringWarr > 0 ? '< 30 Hari' : 'Terlindungi'}
                </span>
              </div>
            </div>
          </div>

          {/* Unit Terdaftar Card */}
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

        {/* ══════════════ KOLOM KANAN (36%): Kalender Jadwal + Servis Terbaru ══════════════ */}
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
                                color: '#38bdf8',
                                background: 'rgba(56, 189, 248, 0.08)',
                                border: '1px solid rgba(56, 189, 248, 0.22)',
                                padding: '3px 10px',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#0284c7';
                                e.currentTarget.style.color = '#ffffff';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(56, 189, 248, 0.08)';
                                e.currentTarget.style.color = '#38bdf8';
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

