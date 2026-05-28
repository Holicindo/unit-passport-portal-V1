'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  Clock,
  ShieldCheck,
  RefreshCw,
  Thermometer,
  Zap,
  Square,
  HelpCircle,
} from 'lucide-react';
import styles from './audit.module.css';
import { serviceLogApi, unitApi } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ServiceLog {
  id: string;
  issue_description: string;
  action_taken: string;
  service_date: string;
  completed_at: string | null;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  technician_name: string;
  created_at: string;
  unit?: Unit;
}

interface Unit {
  id: string;
  serial_number: string;
  model_name: string;
  warranty_expiry: string | null;
  status: string;
  service_logs?: ServiceLog[];
}

type WarrantyCategory = 'Kaca / Glass' | 'Kelistrikan' | 'Refrigerasi' | 'Lainnya';

interface WarrantyIssue {
  unit: Unit;
  log: ServiceLog;
  category: WarrantyCategory;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysBetween(dateA: Date, dateB: Date): number {
  return Math.floor((dateB.getTime() - dateA.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function categorizeIssue(description: string): WarrantyCategory {
  const d = (description || '').toLowerCase();
  if (/kaca|glass|pintu|door|retak/.test(d)) return 'Kaca / Glass';
  if (/lampu|listrik|electrical|lighting|kabel|wiring/.test(d)) return 'Kelistrikan';
  if (/freon|kompresor|compressor|bocor|suhu|dingin|refriger/.test(d)) return 'Refrigerasi';
  return 'Lainnya';
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i}>
          <div className={styles.skeletonLine} />
        </td>
      ))}
    </tr>
  );
}

function SkeletonCard() {
  return <div className={styles.skeletonCard} />;
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <tr>
      <td colSpan={99} className={styles.emptyCell}>
        <div className={styles.emptyInner}>
          <ShieldCheck size={32} strokeWidth={1.5} style={{ opacity: 0.3 }} />
          <span>{message}</span>
        </div>
      </td>
    </tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AuditAnalyticsPage() {
  const [serviceLogs, setServiceLogs] = useState<ServiceLog[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [logsRes, unitsRes] = await Promise.all([
          serviceLogApi.findAll(1, 1000),
          unitApi.findAll(1, 1000),
        ]);

        const logsData: ServiceLog[] = logsRes.data?.data ?? logsRes.data ?? [];
        const unitsData: Unit[] = unitsRes.data?.data ?? unitsRes.data ?? [];

        setServiceLogs(logsData);
        setUnits(unitsData);
      } catch (err) {
        console.error(err);
        setError('Gagal memuat data. Periksa koneksi atau coba lagi.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // ── Section 1: Repeated visits (>2 times per unit) ──────────────────────────
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

    return Array.from(map.values())
      .filter((entry) => entry.logs.length > 2)
      .sort((a, b) => b.logs.length - a.logs.length);
  }, [serviceLogs, units]);

  // ── Section 2: Overdue tickets (PENDING > 14 days) ──────────────────────────
  const overdueTickets = useMemo(() => {
    const now = new Date();
    return serviceLogs
      .filter((log) => {
        if (log.status !== 'PENDING') return false;
        const filed = new Date(log.service_date);
        return daysBetween(filed, now) > 14;
      })
      .sort((a, b) => new Date(a.service_date).getTime() - new Date(b.service_date).getTime());
  }, [serviceLogs]);

  // ── Section 3: Warranty issues ───────────────────────────────────────────────
  const warrantyIssues = useMemo((): WarrantyIssue[] => {
    const today = new Date();
    const result: WarrantyIssue[] = [];

    for (const log of serviceLogs) {
      const unitId = log.unit?.id;
      if (!unitId) continue;
      const unit = units.find((u) => u.id === unitId) ?? log.unit;
      if (!unit?.warranty_expiry) continue;
      if (new Date(unit.warranty_expiry) <= today) continue;
      result.push({
        unit,
        log,
        category: categorizeIssue(log.issue_description),
      });
    }

    return result;
  }, [serviceLogs, units]);

  const warrantyCounts = useMemo(() => {
    const counts: Record<WarrantyCategory, number> = {
      'Kaca / Glass': 0,
      Kelistrikan: 0,
      Refrigerasi: 0,
      Lainnya: 0,
    };
    for (const issue of warrantyIssues) {
      counts[issue.category]++;
    }
    return counts;
  }, [warrantyIssues]);

  // ── Stats ────────────────────────────────────────────────────────────────────
  const stats = [
    {
      label: 'Tiket Berulang',
      value: repeatedUnits.length,
      icon: RefreshCw,
      color: 'var(--color-safety-orange)',
      bg: 'rgba(255,107,0,0.08)',
    },
    {
      label: 'Tiket Terlambat',
      value: overdueTickets.length,
      icon: Clock,
      color: '#E11D48',
      bg: 'rgba(225,29,72,0.08)',
    },
    {
      label: 'Masalah Garansi',
      value: warrantyIssues.length,
      icon: ShieldCheck,
      color: 'var(--color-cobalt-blue)',
      bg: 'rgba(46,91,255,0.08)',
    },
  ];

  const categoryMeta: Record<WarrantyCategory, { icon: React.ElementType; color: string; bg: string }> = {
    'Kaca / Glass': { icon: Square, color: '#0ea5e9', bg: 'rgba(14,165,233,0.08)' },
    Kelistrikan: { icon: Zap, color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
    Refrigerasi: { icon: Thermometer, color: '#6366f1', bg: 'rgba(99,102,241,0.08)' },
    Lainnya: { icon: HelpCircle, color: 'var(--color-space-grey)', bg: 'rgba(100,116,139,0.08)' },
  };

  return (
    <div className={styles.container}>
      {/* ── Header ── */}
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Analitik &amp; Audit</h1>
          <p className={styles.subtitle}>
            Identifikasi masalah berulang, tiket terlambat, dan klaim garansi
          </p>
        </div>
      </header>

      {error && (
        <div className={styles.errorBanner}>
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* ── Stats Summary ── */}
      <div className={styles.statsRow}>
        {loading
          ? [0, 1, 2].map((i) => <SkeletonCard key={i} />)
          : stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className={styles.statCard}>
                  <div className={styles.statIcon} style={{ background: s.bg, color: s.color }}>
                    <Icon size={22} strokeWidth={2} />
                  </div>
                  <div>
                    <div className={styles.statValue} style={{ color: s.color }}>
                      {s.value}
                    </div>
                    <div className={styles.statLabel}>{s.label}</div>
                  </div>
                </div>
              );
            })}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1 — Tiket Berulang
      ══════════════════════════════════════════════════════════════════════ */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <RefreshCw size={18} style={{ color: 'var(--color-safety-orange)' }} />
            <h2 className={styles.sectionTitle}>Tiket Berulang</h2>
            <span className={styles.sectionBadge} style={{ background: 'rgba(255,107,0,0.1)', color: 'var(--color-safety-orange)' }}>
              &gt;2 kunjungan
            </span>
          </div>
          <p className={styles.sectionDesc}>
            Unit yang dikunjungi teknisi lebih dari 2 kali — mengindikasikan kesulitan servis.
          </p>
        </div>

        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Unit (Model / SN)</th>
                  <th>Jumlah Kunjungan</th>
                  <th>Terakhir Diservis</th>
                  <th>Status Terakhir</th>
                  <th>Indikator</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
                ) : repeatedUnits.length === 0 ? (
                  <EmptyState message="Tidak ada unit dengan kunjungan berulang." />
                ) : (
                  repeatedUnits.map(({ unit, logs }) => {
                    const sorted = [...logs].sort(
                      (a, b) => new Date(b.service_date).getTime() - new Date(a.service_date).getTime()
                    );
                    const latest = sorted[0];
                    return (
                      <tr key={unit.id} className={styles.dataRow}>
                        <td>
                          <div className={styles.unitCell}>
                            <span className={styles.unitModel}>{unit.model_name}</span>
                            <span className={styles.unitSn}>{unit.serial_number}</span>
                          </div>
                        </td>
                        <td>
                          <span className={styles.visitCount}>{logs.length}×</span>
                        </td>
                        <td className={styles.timestampCol}>{formatDate(latest.service_date)}</td>
                        <td>
                          <StatusBadge status={latest.status} />
                        </td>
                        <td>
                          <span className={styles.alertBadge}>Perlu Perhatian</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2 — Tiket Terlambat
      ══════════════════════════════════════════════════════════════════════ */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <Clock size={18} style={{ color: '#E11D48' }} />
            <h2 className={styles.sectionTitle}>Tiket Terlambat</h2>
            <span className={styles.sectionBadge} style={{ background: 'rgba(225,29,72,0.1)', color: '#E11D48' }}>
              &gt;2 minggu belum selesai
            </span>
          </div>
          <p className={styles.sectionDesc}>
            Tiket berstatus PENDING yang sudah lebih dari 14 hari sejak keluhan masuk.
          </p>
        </div>

        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Call ID</th>
                  <th>Unit</th>
                  <th>Tanggal Masuk</th>
                  <th>Hari Tertunda</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
                ) : overdueTickets.length === 0 ? (
                  <EmptyState message="Tidak ada tiket yang terlambat." />
                ) : (
                  overdueTickets.map((log) => {
                    const unit = units.find((u) => u.id === log.unit?.id) ?? log.unit;
                    const days = daysBetween(new Date(log.service_date), new Date());
                    return (
                      <tr key={log.id} className={styles.dataRow}>
                        <td>
                          <span className={styles.callId}>{log.id}</span>
                        </td>
                        <td>
                          {unit ? (
                            <div className={styles.unitCell}>
                              <span className={styles.unitModel}>{unit.model_name}</span>
                              <span className={styles.unitSn}>{unit.serial_number}</span>
                            </div>
                          ) : (
                            <span className={styles.unitSn}>—</span>
                          )}
                        </td>
                        <td className={styles.timestampCol}>{formatDate(log.service_date)}</td>
                        <td>
                          <span className={styles.daysLate}>{days} hari</span>
                        </td>
                        <td>
                          <span className={styles.lateBadge}>Terlambat</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3 — Masalah dalam Masa Garansi
      ══════════════════════════════════════════════════════════════════════ */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <ShieldCheck size={18} style={{ color: 'var(--color-cobalt-blue)' }} />
            <h2 className={styles.sectionTitle}>Masalah dalam Masa Garansi</h2>
            <span className={styles.sectionBadge} style={{ background: 'rgba(46,91,255,0.1)', color: 'var(--color-cobalt-blue)' }}>
              Garansi aktif
            </span>
          </div>
          <p className={styles.sectionDesc}>
            Unit yang masih dalam masa garansi namun memiliki catatan servis — dikategorikan berdasarkan jenis masalah.
          </p>
        </div>

        {/* Category summary cards */}
        <div className={styles.categoryCards}>
          {loading
            ? [0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)
            : (Object.entries(categoryMeta) as [WarrantyCategory, typeof categoryMeta[WarrantyCategory]][]).map(
                ([cat, meta]) => {
                  const Icon = meta.icon;
                  return (
                    <div key={cat} className={styles.categoryCard} style={{ borderTopColor: meta.color }}>
                      <div className={styles.categoryIcon} style={{ background: meta.bg, color: meta.color }}>
                        <Icon size={20} strokeWidth={2} />
                      </div>
                      <div className={styles.categoryCount} style={{ color: meta.color }}>
                        {warrantyCounts[cat]}
                      </div>
                      <div className={styles.categoryLabel}>{cat}</div>
                    </div>
                  );
                }
              )}
        </div>

        {/* Warranty issues table */}
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Unit (Model / SN)</th>
                  <th>Garansi Hingga</th>
                  <th>Kategori Masalah</th>
                  <th>Deskripsi Masalah</th>
                  <th>Tanggal Servis</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
                ) : warrantyIssues.length === 0 ? (
                  <EmptyState message="Tidak ada masalah pada unit dalam masa garansi." />
                ) : (
                  warrantyIssues.map((issue, idx) => {
                    const meta = categoryMeta[issue.category];
                    return (
                      <tr key={`${issue.unit.id}-${issue.log.id}-${idx}`} className={styles.dataRow}>
                        <td>
                          <div className={styles.unitCell}>
                            <span className={styles.unitModel}>{issue.unit.model_name}</span>
                            <span className={styles.unitSn}>{issue.unit.serial_number}</span>
                          </div>
                        </td>
                        <td className={styles.timestampCol}>{formatDate(issue.unit.warranty_expiry)}</td>
                        <td>
                          <span
                            className={styles.categoryBadge}
                            style={{ background: meta.bg, color: meta.color }}
                          >
                            {issue.category}
                          </span>
                        </td>
                        <td className={styles.detailsCol}>
                          {issue.log.issue_description || '—'}
                        </td>
                        <td className={styles.timestampCol}>{formatDate(issue.log.service_date)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Status Badge sub-component ───────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    COMPLETED: { label: 'Selesai', cls: 'badgeSuccess' },
    PENDING: { label: 'Pending', cls: 'badgeWarning' },
    CANCELLED: { label: 'Dibatalkan', cls: 'badgeDanger' },
  };
  const entry = map[status] ?? { label: status, cls: 'badgeWarning' };
  return (
    <span className={`${styles.statusBadge} ${styles[entry.cls as keyof typeof styles]}`}>
      {entry.label}
    </span>
  );
}
