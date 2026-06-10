'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import styles from './audit.module.css';
import { serviceLogApi, unitApi } from '@/lib/api';
import { ServiceLog, Unit, WarrantyCategory, WarrantyIssue, categorizeIssue } from './utils';
import {
  SkeletonCard,
  RepeatedVisitsSection,
  OverdueTicketsSection,
  WarrantyIssuesSection,
} from './components/AuditSections';

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
        return Math.floor((now.getTime() - filed.getTime()) / (1000 * 60 * 60 * 24)) > 14;
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
      result.push({ unit, log, category: categorizeIssue(log.issue_description) });
    }
    return result;
  }, [serviceLogs, units]);

  const warrantyCounts = useMemo(() => {
    const counts: Record<WarrantyCategory, number> = {
      'Kaca / Glass': 0, Kelistrikan: 0, Refrigerasi: 0, Lainnya: 0,
    };
    for (const issue of warrantyIssues) counts[issue.category]++;
    return counts;
  }, [warrantyIssues]);

  const stats = [
    { label: 'Tiket Berulang', value: repeatedUnits.length, icon: RefreshCw, color: 'var(--color-safety-orange)', bg: 'rgba(255,107,0,0.08)' },
    { label: 'Tiket Terlambat', value: overdueTickets.length, icon: Clock, color: '#E11D48', bg: 'rgba(225,29,72,0.08)' },
    { label: 'Masalah Garansi', value: warrantyIssues.length, icon: ShieldCheck, color: 'var(--color-cobalt-blue)', bg: 'rgba(46,91,255,0.08)' },
  ];

  return (
    <div className={styles.container}>
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
                    <div className={styles.statValue} style={{ color: s.color }}>{s.value}</div>
                    <div className={styles.statLabel}>{s.label}</div>
                  </div>
                </div>
              );
            })}
      </div>

      <RepeatedVisitsSection data={repeatedUnits} loading={loading} />
      <OverdueTicketsSection data={overdueTickets} units={units} loading={loading} />
      <WarrantyIssuesSection data={warrantyIssues} counts={warrantyCounts} loading={loading} />
    </div>
  );
}
