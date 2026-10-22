'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  Clock,
  ShieldCheck,
  Activity,
  Users,
  BarChart3,
  LogIn,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import styles from './audit.module.css';
import { serviceLogApi, unitApi, userApi } from '@/lib/api';
import {
  ServiceLog,
  Unit,
  WarrantyCategory,
  WarrantyIssue,
  AuditUser,
  categorizeIssue,
  getTimeAgo,
  formatDateTime,
} from './utils';
import {
  SkeletonCard,
  RepeatedVisitsSection,
  OverdueTicketsSection,
  WarrantyIssuesSection,
} from './components/AuditSections';

interface ActivityItem {
  id: string;
  type: 'service_created' | 'service_completed' | 'service_pending' | 'service_cancelled';
  label: string;
  description: string;
  technician: string;
  unit_serial: string;
  unit_model: string;
  timestamp: string;
}

function deriveActivityItems(logs: ServiceLog[]): ActivityItem[] {
  const items: ActivityItem[] = [];
  for (const log of logs) {
    const serial = log.unit?.serial_number ?? 'N/A';
    const model = log.unit?.model_name ?? 'N/A';
    items.push({
      id: log.id + '-created',
      type: 'service_created',
      label: 'Tiket Dibuat',
      description: log.issue_description || 'N/A',
      technician: log.technician_name || 'N/A',
      unit_serial: serial,
      unit_model: model,
      timestamp: log.created_at,
    });
    if (log.status === 'COMPLETED' && log.completed_at) {
      items.push({
        id: log.id + '-completed',
        type: 'service_completed',
        label: 'Servis Selesai',
        description: log.action_taken || 'N/A',
        technician: log.technician_name || 'N/A',
        unit_serial: serial,
        unit_model: model,
        timestamp: log.completed_at,
      });
    } else if (log.status === 'CANCELLED') {
      items.push({
        id: log.id + '-cancelled',
        type: 'service_cancelled',
        label: 'Tiket Dibatalkan',
        description: log.issue_description || 'N/A',
        technician: log.technician_name || 'N/A',
        unit_serial: serial,
        unit_model: model,
        timestamp: log.completed_at ?? log.service_date,
      });
    }
  }
  return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

const ROLE_META: Record<string, { label: string; color: string; bg: string }> = {
  SUPERADMIN: { label: 'Super Admin', color: '#7C3AED', bg: 'rgba(124,58,237,0.1)' },
  ADMIN: { label: 'Admin', color: '#2E5BFF', bg: 'rgba(46,91,255,0.1)' },
  TECHNICIAN: { label: 'Teknisi', color: '#059669', bg: 'rgba(5,150,105,0.1)' },
  CLIENT: { label: 'Client', color: '#D97706', bg: 'rgba(217,119,6,0.1)' },
  PARTNER: { label: 'Partner', color: '#DC2626', bg: 'rgba(220,38,38,0.1)' },
};

const ACTIVITY_TYPE_META: Record<string, { color: string; bg: string }> = {
  service_created: { color: '#2E5BFF', bg: 'rgba(46,91,255,0.1)' },
  service_completed: { color: '#059669', bg: 'rgba(5,150,105,0.1)' },
  service_cancelled: { color: '#DC2626', bg: 'rgba(220,38,38,0.1)' },
  service_pending: { color: '#D97706', bg: 'rgba(217,119,6,0.1)' },
};

const ACTIVITY_PAGE_SIZE = 20;
const AUTO_REFRESH_MS = 30000;

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

const AVATAR_COLORS = [
  { bg: 'rgba(46,91,255,0.15)', color: '#2E5BFF' },
  { bg: 'rgba(5,150,105,0.15)', color: '#059669' },
  { bg: 'rgba(124,58,237,0.15)', color: '#7C3AED' },
  { bg: 'rgba(217,119,6,0.15)', color: '#D97706' },
  { bg: 'rgba(220,38,38,0.15)', color: '#DC2626' },
];

function getAvatarColor(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export default function AuditAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'activity' | 'users'>('analytics');
  const [serviceLogs, setServiceLogs] = useState<ServiceLog[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [users, setUsers] = useState<AuditUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [activityPage, setActivityPage] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [logsRes, unitsRes, usersRes] = await Promise.all([
        serviceLogApi.findAll(1, 1000),
        unitApi.findAll(1, 1000),
        userApi.findAll(),
      ]);
      setServiceLogs(logsRes.data?.data ?? logsRes.data ?? []);
      setUnits(unitsRes.data?.data ?? unitsRes.data ?? []);
      setUsers(usersRes.data?.data ?? usersRes.data ?? []);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data. Periksa koneksi atau coba lagi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    intervalRef.current = setInterval(() => fetchData(true), AUTO_REFRESH_MS);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchData]);

  const repeatedUnits = useMemo(() => {
    const map = new Map<string, { unit: Unit; logs: ServiceLog[] }>();
    for (const log of serviceLogs) {
      const unitId = log.unit?.id;
      if (!unitId) continue;
      if (!map.has(unitId)) {
        const unitData = units.find((u) => u.id === unitId) ?? log.unit!;
        map.set(unitId, { unit: unitData, logs: [] });
      }
      map.get(unitId)!.logs.push(log);
    }
    return Array.from(map.values()).filter((e) => e.logs.length > 2).sort((a, b) => b.logs.length - a.logs.length);
  }, [serviceLogs, units]);

  const overdueTickets = useMemo(() => {
    const now = new Date();
    return serviceLogs.filter((log) => {
      if (log.status !== 'PENDING') return false;
      return Math.floor((now.getTime() - new Date(log.service_date).getTime()) / 86400000) > 14;
    }).sort((a, b) => new Date(a.service_date).getTime() - new Date(b.service_date).getTime());
  }, [serviceLogs]);

  const warrantyIssues = useMemo((): WarrantyIssue[] => {
    const today = new Date();
    const result: WarrantyIssue[] = [];
    for (const log of serviceLogs) {
      const unit = units.find((u) => u.id === log.unit?.id) ?? log.unit;
      if (!unit?.warranty_expiry) continue;
      if (new Date(unit.warranty_expiry) <= today) continue;
      result.push({ unit, log, category: categorizeIssue(log.issue_description) });
    }
    return result;
  }, [serviceLogs, units]);

  const warrantyCounts = useMemo(() => {
    const counts: Record<WarrantyCategory, number> = { 'Kaca / Glass': 0, Kelistrikan: 0, Refrigerasi: 0, Lainnya: 0 };
    for (const issue of warrantyIssues) counts[issue.category]++;
    return counts;
  }, [warrantyIssues]);

  const allActivities = useMemo(() => deriveActivityItems(serviceLogs), [serviceLogs]);
  const totalActivityPages = Math.max(1, Math.ceil(allActivities.length / ACTIVITY_PAGE_SIZE));
  const pagedActivities = useMemo(() => {
    const start = (activityPage - 1) * ACTIVITY_PAGE_SIZE;
    return allActivities.slice(start, start + ACTIVITY_PAGE_SIZE);
  }, [allActivities, activityPage]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase();
    return users.filter(
      (u) => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  const onlineUsers = useMemo(() => {
    const cutoff = Date.now() - 15 * 60 * 1000;
    return users.filter((u) => u.last_login && new Date(u.last_login).getTime() > cutoff);
  }, [users]);

  const statsIcons = [RefreshCw, Clock, ShieldCheck, Activity, Users, LogIn];
  const stats = [
    { label: 'Tiket Berulang', value: repeatedUnits.length, color: '#FF6B00', bg: 'rgba(255,107,0,0.1)' },
    { label: 'Tiket Terlambat', value: overdueTickets.length, color: '#E53E3E', bg: 'rgba(229,62,62,0.1)' },
    { label: 'Masalah Garansi', value: warrantyIssues.length, color: '#001F3F', bg: 'rgba(0,31,63,0.1)' },
    { label: 'Log Aktivitas', value: allActivities.length, color: '#2E5BFF', bg: 'rgba(46,91,255,0.1)' },
    { label: 'Total Pengguna', value: users.length, color: '#7C3AED', bg: 'rgba(124,58,237,0.1)' },
    { label: 'Online Sekarang', value: onlineUsers.length, color: '#059669', bg: 'rgba(5,150,105,0.1)' },
  ];

  return (
    <div className={styles.container}>
      <header className={styles.pageHeader}>
        <div className={styles.headerTopRow}>
          <div>
            <h1 className={styles.title}>Analitik &amp; Audit</h1>
            <p className={styles.subtitle}>Identifikasi masalah berulang, log aktivitas real-time, dan manajemen pengguna</p>
          </div>
          <div className={styles.realtimeControls}>
            <span className={styles.liveBadge}>
              <span className={styles.pulseDot} />
              LIVE
            </span>
            {lastRefreshed && (
              <span style={{ fontSize: '0.78rem', color: 'var(--color-space-grey)', fontWeight: 500 }}>
                {getTimeAgo(lastRefreshed.toISOString())}
              </span>
            )}
            <button className={styles.refreshButton} onClick={() => fetchData(true)} disabled={refreshing}>
              <RefreshCw size={14} className={refreshing ? styles.spinning : undefined} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className={styles.errorBanner}>
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      <div className={styles.statsRow} style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
        {loading
          ? [0,1,2,3,4,5].map((i) => <SkeletonCard key={i} />)
          : stats.map((s, idx) => {
              const Icon = statsIcons[idx];
              return (
                <div key={s.label} className={styles.statCard} style={{
                  background: '#ECEEF2', border: 'none', borderRadius: '20px',
                  boxShadow: '-6px -6px 14px rgba(255,255,255,0.85), 6px 6px 14px rgba(0,31,63,0.1)',
                  padding: '16px 18px', flexDirection: 'column', alignItems: 'flex-start', gap: '10px',
                }}>
                  <div className={styles.statIcon} style={{ background: s.bg, color: s.color, borderRadius: '12px', width: '40px', height: '40px', boxShadow: 'none' }}>
                    <Icon size={18} strokeWidth={2} />
                  </div>
                  <div>
                    <div className={styles.statValue} style={{ color: s.color, fontSize: '1.6rem' }}>{s.value}</div>
                    <div className={styles.statLabel}>{s.label}</div>
                  </div>
                </div>
              );
            })}
      </div>

      <div className={styles.tabNavigation}>
        {(
          [
            { key: 'analytics' as const, label: 'Analitik', Icon: BarChart3, badge: repeatedUnits.length + overdueTickets.length },
            { key: 'activity' as const, label: 'Log Aktivitas', Icon: Activity, badge: allActivities.length },
            { key: 'users' as const, label: 'Pengguna', Icon: Users, badge: users.length },
          ]
        ).map(({ key, label, Icon, badge }) => (
          <button
            key={key}
            className={[styles.tabBtn, activeTab === key ? styles.tabBtnActive : ''].join(' ')}
            onClick={() => setActiveTab(key)}
          >
            <Icon size={15} />
            {label}
            {badge > 0 && <span className={styles.tabBadge}>{badge}</span>}
          </button>
        ))}
      </div>

      {activeTab === 'analytics' && (
        <>
          <RepeatedVisitsSection data={repeatedUnits} loading={loading} />
          <OverdueTicketsSection data={overdueTickets} units={units} loading={loading} />
          <WarrantyIssuesSection data={warrantyIssues} counts={warrantyCounts} loading={loading} />
        </>
      )}

      {activeTab === 'activity' && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleGroup}>
              <Activity size={18} color="#2E5BFF" />
              <h2 className={styles.sectionTitle}>Log Aktivitas Sistem</h2>
              <span className={styles.sectionBadge} style={{ background: 'rgba(46,91,255,0.1)', color: '#2E5BFF' }}>{allActivities.length} entri</span>
            </div>
            <p className={styles.sectionDesc}>Semua aktivitas servis yang tercatat, diperbarui otomatis setiap 30 detik.</p>
          </div>
          <div className={styles.tableCard}>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Waktu</th>
                    <th>Tipe</th>
                    <th>Unit</th>
                    <th>Teknisi</th>
                    <th>Deskripsi</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className={styles.loadingCell}>Memuat log aktivitas...</td></tr>
                  ) : pagedActivities.length === 0 ? (
                    <tr>
                      <td colSpan={5} className={styles.emptyCell}>
                        <div className={styles.emptyInner}><Activity size={28} /><span>Belum ada aktivitas tercatat</span></div>
                      </td>
                    </tr>
                  ) : pagedActivities.map((item) => {
                    const meta = ACTIVITY_TYPE_META[item.type] ?? ACTIVITY_TYPE_META.service_created;
                    return (
                      <tr key={item.id} className={styles.dataRow}>
                        <td className={styles.timestampCol} style={{ whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--color-deep-navy)' }}>{getTimeAgo(item.timestamp)}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--color-space-grey)', marginTop: 2 }}>{formatDateTime(item.timestamp)}</div>
                        </td>
                        <td>
                          <span className={styles.logTypeBadge} style={{ background: meta.bg, color: meta.color }}>{item.label}</span>
                        </td>
                        <td>
                          <div className={styles.unitCell}>
                            <span className={styles.unitModel}>{item.unit_model}</span>
                            <span className={styles.unitSn}>{item.unit_serial}</span>
                          </div>
                        </td>
                        <td className={styles.userCol}>{item.technician}</td>
                        <td className={styles.detailsCol}>{item.description}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {!loading && totalActivityPages > 1 && (
              <div className={styles.activityPagination}>
                <button className={styles.pageBtn} onClick={() => setActivityPage((p) => Math.max(1, p - 1))} disabled={activityPage === 1}>
                  <ChevronLeft size={15} />
                </button>
                <span className={styles.pageInfo}>Halaman <strong>{activityPage}</strong> dari <strong>{totalActivityPages}</strong></span>
                <button className={styles.pageBtn} onClick={() => setActivityPage((p) => Math.min(totalActivityPages, p + 1))} disabled={activityPage === totalActivityPages}>
                  <ChevronRight size={15} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleGroup}>
              <Users size={18} color="#7C3AED" />
              <h2 className={styles.sectionTitle}>Manajemen Pengguna &amp; Login</h2>
              <span className={styles.sectionBadge} style={{ background: 'rgba(124,58,237,0.1)', color: '#7C3AED' }}>{users.length} pengguna</span>
              {onlineUsers.length > 0 && (
                <span className={styles.sectionBadge} style={{ background: 'rgba(5,150,105,0.1)', color: '#059669' }}>{onlineUsers.length} online</span>
              )}
            </div>
            <p className={styles.sectionDesc}>Riwayat login dan status aktivitas semua pengguna sistem.</p>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div className={styles.searchBox} style={{ maxWidth: 360 }}>
              <span className={styles.searchIcon}><Users size={15} /></span>
              <input
                className={styles.searchInput}
                placeholder="Cari nama, email, atau peran..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>
          </div>
          <div className={styles.tableCard}>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Pengguna</th>
                    <th>Peran</th>
                    <th>Organisasi</th>
                    <th>Login Terakhir</th>
                    <th>Status</th>
                    <th>Bergabung</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className={styles.loadingCell}>Memuat data pengguna...</td></tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={styles.emptyCell}>
                        <div className={styles.emptyInner}><Users size={28} /><span>Tidak ada pengguna ditemukan</span></div>
                      </td>
                    </tr>
                  ) : filteredUsers.map((user) => {
                    const role = ROLE_META[user.role] ?? { label: user.role, color: '#64748b', bg: 'rgba(100,116,139,0.1)' };
                    const isOnline = user.last_login ? Date.now() - new Date(user.last_login).getTime() < 900000 : false;
                    const avatar = getAvatarColor(user.id);
                    const org = user.client?.company_name || user.partner?.partner_name || 'N/A';
                    return (
                      <tr key={user.id} className={styles.dataRow}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className={styles.userAvatar} style={{ background: avatar.bg, color: avatar.color }}>
                              {getInitials(user.name || user.email || 'NA')}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-deep-navy)' }}>{user.name || 'N/A'}</div>
                              <div style={{ fontSize: '0.76rem', color: 'var(--color-space-grey)' }}>{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td><span className={styles.roleBadge} style={{ background: role.bg, color: role.color }}>{role.label}</span></td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--color-space-grey)' }}>{org}</td>
                        <td>
                          {user.last_login ? (
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--color-deep-navy)' }}>{getTimeAgo(user.last_login)}</div>
                              <div style={{ fontSize: '0.74rem', color: 'var(--color-space-grey)', marginTop: 2 }}>{formatDateTime(user.last_login)}</div>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--color-space-grey)', fontSize: '0.82rem' }}>Belum pernah login</span>
                          )}
                        </td>
                        <td>
                          {isOnline ? (
                            <span className={styles.onlineIndicator}>
                              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                              Online
                            </span>
                          ) : (
                            <span className={styles.offlineIndicator}>
                              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#94a3b8', display: 'inline-block' }} />
                              Offline
                            </span>
                          )}
                        </td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--color-space-grey)' }}>{formatDateTime(user.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
