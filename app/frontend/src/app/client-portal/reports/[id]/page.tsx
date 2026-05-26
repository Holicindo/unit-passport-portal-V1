'use client';

import { useState, useEffect } from 'react';
import { reportApi } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileText, CheckCircle, Clock } from 'lucide-react';
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
    return <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>Memuat laporan servis...</div>;
  }

  if (!report) {
    return (
      <div style={{ padding: '48px', textAlign: 'center' }}>
        <h2 style={{ color: '#0f172a' }}>Laporan Tidak Ditemukan</h2>
        <button onClick={() => router.back()} style={{ marginTop: '16px', padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <button 
          onClick={() => router.back()}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 600 }}
        >
          <ArrowLeft size={18} /> Kembali
        </button>
      </div>

      <div className={styles.pageHeader}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className={styles.pageTitle}>Laporan Servis: {report.report_number || report.id}</h1>
            <p className={styles.pageDescription}>Unit: {report.unit?.serial_number} | Model: {report.unit?.model_name}</p>
          </div>
          <span style={{ 
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 16px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700,
            background: 'rgba(16, 185, 129, 0.1)', color: '#10b981'
          }}>
            <CheckCircle size={16} /> SELESAI
          </span>
        </div>
      </div>

      <div className={styles.card} style={{ padding: '32px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={24} color="#3b82f6" /> Detail Pekerjaan
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          <div>
            <div style={{ marginBottom: '16px' }}>
              <span style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>Tanggal Servis</span>
              <span style={{ fontSize: '1rem', color: '#0f172a', fontWeight: 600 }}>
                {report.created_at ? new Date(report.created_at).toLocaleDateString('id-ID') : '-'}
              </span>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <span style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>Teknisi</span>
              <span style={{ fontSize: '1rem', color: '#0f172a', fontWeight: 600 }}>{report.technician_name || '-'}</span>
            </div>
          </div>
          <div>
            <div style={{ marginBottom: '16px' }}>
              <span style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>Jenis Laporan</span>
              <span style={{ fontSize: '1rem', color: '#0f172a', fontWeight: 600 }}>{report.report_type}</span>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <span style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>Lokasi / Outlet</span>
              <span style={{ fontSize: '1rem', color: '#0f172a', fontWeight: 600 }}>{report.unit?.specs?.city || '-'}</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '32px', padding: '24px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <span style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', fontWeight: 600, marginBottom: '8px' }}>Tindakan / Hasil Pemeriksaan</span>
          <p style={{ margin: 0, color: '#334155', lineHeight: 1.6 }}>
            {report.general_notes || 'Tidak ada catatan tambahan untuk laporan ini.'}
          </p>
        </div>
      </div>
    </div>
  );
}
