'use client';

import React from 'react';
import { Square, Zap, Thermometer, HelpCircle, ShieldCheck } from 'lucide-react';
import styles from '../audit.module.css';
import {
  ServiceLog,
  Unit,
  WarrantyCategory,
  WarrantyIssue,
  daysBetween,
  formatDate,
} from '../utils';

// ─── Shared Sub-components ────────────────────────────────────────────────────

export function SkeletonRow({ cols }: { cols: number }) {
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

export function SkeletonCard() {
  return <div className={styles.skeletonCard} />;
}

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

// ─── Section 1: Repeated Visits ──────────────────────────────────────────────

interface RepeatedUnit { unit: Unit; logs: ServiceLog[] }

export function RepeatedVisitsSection({ data, loading }: { data: RepeatedUnit[]; loading: boolean }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleGroup}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-safety-orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
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
              ) : data.length === 0 ? (
                <EmptyState message="Tidak ada unit dengan kunjungan berulang." />
              ) : (
                data.map(({ unit, logs }) => {
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
  );
}

// ─── Section 2: Overdue Tickets ──────────────────────────────────────────────

export function OverdueTicketsSection({ data, units, loading }: { data: ServiceLog[]; units: Unit[]; loading: boolean }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleGroup}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E11D48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
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
              ) : data.length === 0 ? (
                <EmptyState message="Tidak ada tiket yang terlambat." />
              ) : (
                data.map((log) => {
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
  );
}

// ─── Section 3: Warranty Issues ──────────────────────────────────────────────

const categoryMeta: Record<WarrantyCategory, { icon: React.ElementType; color: string; bg: string }> = {
  'Kaca / Glass': { icon: Square, color: '#0ea5e9', bg: 'rgba(14,165,233,0.08)' },
  Kelistrikan: { icon: Zap, color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
  Refrigerasi: { icon: Thermometer, color: '#6366f1', bg: 'rgba(99,102,241,0.08)' },
  Lainnya: { icon: HelpCircle, color: 'var(--color-space-grey)', bg: 'rgba(100,116,139,0.08)' },
};

export function WarrantyIssuesSection({
  data,
  counts,
  loading,
}: {
  data: WarrantyIssue[];
  counts: Record<WarrantyCategory, number>;
  loading: boolean;
}) {
  return (
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
                      {counts[cat]}
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
              ) : data.length === 0 ? (
                <EmptyState message="Tidak ada masalah pada unit dalam masa garansi." />
              ) : (
                data.map((issue, idx) => {
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
  );
}
