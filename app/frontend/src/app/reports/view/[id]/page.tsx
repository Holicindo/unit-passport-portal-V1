'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { reportApi } from '@/lib/api';
import { Printer, FileDown, ArrowLeft, Loader2, Camera } from 'lucide-react';
import InspectionReportTemplate from '@/components/reports/InspectionReportTemplate';
import styles from './view.module.css';

export default function ReportView() {
  const { id } = useParams();
  const router = useRouter();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const { data } = await reportApi.findOne(id as string);
        if (data) {
          setReport(data);
        } else {
          setError('Laporan tidak ditemukan.');
        }
      } catch (err) {
        console.error(err);
        setError('Gagal memuat data laporan dari server.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchReport();
  }, [id]);

  const handlePrint = () => {
    // Natively trigger browser print (user can select printer or save as PDF)
    window.print();
  };

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <Loader2 className={styles.spinner} size={44} />
        <p>Memuat Lembar Laporan QC...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.toolbar}>
          <button onClick={() => router.back()} className={styles.backBtn}>
            <ArrowLeft size={16} /> Kembali
          </button>
        </div>
        <div className={styles.error}>
          <h3>⚠️ Kesalahan Terjadi</h3>
          <p>{error || 'Data laporan kosong.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* Action Toolbar */}
      <header className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <button onClick={() => router.back()} className={styles.backBtn}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <span className={styles.reportId}>LAPORAN QC — {report.id}</span>
            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
              Unit Seri: {report.unit?.serial_number} · Model: {report.unit?.model_name}
            </div>
          </div>
        </div>
        <div className={styles.toolbarActions}>
          <button onClick={handlePrint} className={styles.actionBtn}>
            <Printer size={14} /> Cetak Lembar / Print
          </button>
          <button onClick={handlePrint} className={`${styles.actionBtn} ${styles.primary}`}>
            <FileDown size={14} /> Simpan PDF / Download
          </button>
        </div>
      </header>

      {/* Screen Render Container */}
      <div className={styles.previewWrapper}>
        <InspectionReportTemplate
          mode="view"
          data={report.data}
          unit={report.unit}
        />

        {/* Optional: Photo Documentation Section at the bottom of the screen */}
        {report.photo_urls && report.photo_urls.length > 0 && (
          <div style={{
            marginTop: '20px',
            background: '#ffffff',
            padding: '24px',
            borderTop: '1px solid #e2e8f0',
            borderRadius: '0 0 4px 4px'
          }} className="photoContainerPrintExclude">
            <h4 style={{
              fontSize: '11px',
              fontWeight: 800,
              color: '#475569',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              margin: '0 0 12px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Camera size={14} style={{ color: '#2e5bff' }} />
              Lampiran Foto Dokumentasi QC (Documentation Photos)
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: '16px'
            }}>
              {report.photo_urls.map((url: string, index: number) => (
                <div key={`view-photo-${index}`} style={{
                  aspectRatio: '1',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                }}>
                  <img
                    src={url}
                    alt={`QC Documentation Photo ${index + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CSS overrides to exclude photos or hide specific areas from physical prints if needed */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .photoContainerPrintExclude {
            display: none !important;
          }
          nav, header, footer, aside, .sidebar_active, .toolbar {
            display: none !important;
          }
        }
      ` }} />
    </div>
  );
}
