'use client';

import { useState, useEffect } from 'react';
import { reportApi } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileText, CheckCircle } from 'lucide-react';
import styles from '../../ClientPortal.module.css';

export default function ClientReportDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const { data } = await reportApi.findOne(id as string);
        setReport(data);
      } catch (err) {
        console.error('Failed to fetch report:', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchReport();
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: 'var(--brand-space-grey)', fontFamily: 'var(--font-body)' }}>
        Memuat laporan servis...
      </div>
    );
  }

  if (!report) {
    return (
      <div style={{ padding: '48px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--brand-deep-navy)', fontFamily: 'var(--font-heading)', marginBottom: '16px' }}>
          Laporan Tidak Ditemukan
        </h2>
        <button
          onClick={() => router.back()}
          className={styles.btnSecondary}
        >
          <ArrowLeft size={16} /> Kembali
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Back button */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => router.back()}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'none', border: 'none',
            color: 'var(--brand-space-grey)',
            cursor: 'pointer', fontWeight: 600,
            fontFamily: 'var(--font-body)', fontSize: '0.875rem',
            padding: '4px 0',
          }}
        >
          <ArrowLeft size={16} /> Kembali
        </button>
      </div>

      {/* Page header */}
      <div className={styles.pageHeader}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 className={styles.pageTitle}>
              Laporan Servis: {report.report_number || report.id}
            </h1>
            <p className={styles.pageDescription}>
              Unit: {report.unit?.serial_number} | Model: {report.unit?.model_name}
            </p>
          </div>
          <span className={styles.badgeActive} style={{ alignSelf: 'flex-start' }}>
            <CheckCircle size={13} /> SELESAI
          </span>
        </div>
      </div>

      {/* Detail card */}
      <div className={styles.card} style={{ padding: '24px', marginBottom: '20px' }}>
        <h2 style={{
          fontSize: '1rem', fontWeight: 700,
          color: 'var(--brand-deep-navy)',
          fontFamily: 'var(--font-heading)',
          marginBottom: '20px',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <FileText size={20} color="var(--brand-cobalt-blue)" /> Detail Pekerjaan
        </h2>

        {/* Info grid — responsive */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '20px',
        }}>
          {[
            { label: 'Tanggal Servis', value: report.created_at ? new Date(report.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-' },
            { label: 'Teknisi', value: report.technician_name || '-' },
            { label: 'Jenis Laporan', value: report.report_type || '-' },
            { label: 'Lokasi / Outlet', value: report.unit?.specs?.city || '-' },
          ].map(({ label, value }) => (
            <div key={label}>
              <span style={{
                display: 'block', fontSize: '0.72rem',
                color: 'var(--brand-space-grey)',
                fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.05em', marginBottom: '4px',
                fontFamily: 'var(--font-heading)',
              }}>
                {label}
              </span>
              <span style={{
                fontSize: '0.9rem',
                color: 'var(--brand-deep-navy)',
                fontWeight: 600,
                fontFamily: 'var(--font-body)',
              }}>
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Notes section */}
        <div style={{
          padding: '18px 20px',
          background: 'var(--brand-light-grey)',
          borderRadius: '10px',
          border: '1px solid var(--brand-border)',
        }}>
          <span style={{
            display: 'block', fontSize: '0.72rem',
            color: 'var(--brand-space-grey)',
            fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.05em', marginBottom: '8px',
            fontFamily: 'var(--font-heading)',
          }}>
            Tindakan / Hasil Pemeriksaan
          </span>
          <p style={{
            margin: 0,
            color: 'var(--brand-deep-navy)',
            lineHeight: 1.6,
            fontSize: '0.875rem',
            fontFamily: 'var(--font-body)',
          }}>
            {report.general_notes || 'Tidak ada catatan tambahan untuk laporan ini.'}
          </p>
        </div>
      </div>
    </div>
  );
}
