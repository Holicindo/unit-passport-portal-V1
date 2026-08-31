'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { reportApi } from '@/lib/api';
import { Printer, FileDown, ArrowLeft, Loader2, Camera } from 'lucide-react';
import InspectionReportTemplate from '@/components/reports/InspectionReportTemplate';
import CoolingReportTemplate from '@/components/reports/CoolingReportTemplate';
import Cooling2ReportTemplate from '@/components/reports/Cooling2ReportTemplate';
import Cooling3ReportTemplate from '@/components/reports/Cooling3ReportTemplate';
import WarmReportTemplate from '@/components/reports/WarmReportTemplate';
import ReworkReportTemplate from '@/components/reports/ReworkReportTemplate';
import GraphicRecordTemplate from '@/components/reports/GraphicRecordTemplate';
import QcServiceTemplate from '@/components/reports/QcServiceTemplate';
import IssueAnalysisTemplate from '@/components/reports/IssueAnalysisTemplate';
import styles from './view.module.css';

export default function ReportView() {
  const { id } = useParams();
  const router = useRouter();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [isAdmin, setIsAdmin] = useState(true);

  // Redirect CLIENT users to client portal report view
  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const user = JSON.parse(raw);
        if (user?.role === 'CLIENT') {
          router.replace(`/client-portal/reports/${id}`);
          return;
        }
        if (user?.role === 'PARTNER') {
          setIsAdmin(false);
        }
      }
    } catch { /* ignore */ }
  }, [id, router]);

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

  const handleUpdateStatus = async (newStatus: string, revisionNote?: string) => {
    try {
      setUpdatingStatus(true);
      await reportApi.update(id as string, { status: newStatus, revision_note: revisionNote || undefined });
      setReport((prev: any) => ({ ...prev, status: newStatus, revision_note: revisionNote || prev?.revision_note }));
      alert(`Status laporan berhasil diperbarui menjadi ${newStatus === 'APPROVED' ? 'Disetujui' : 'Revisi'}`);
    } catch {
      alert('Gagal mengupdate status laporan.');
    } finally {
      setUpdatingStatus(false);
    }
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
          <h3>Kesalahan Terjadi</h3>
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

      {/* Admin Approval Banner */}
      {isAdmin && (
        <div style={{
          maxWidth: '850px',
          margin: '0 auto 16px auto',
          background: report.status === 'APPROVED' 
            ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)' 
            : report.status === 'REVISION' 
            ? 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)' 
            : 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
          color: '#ffffff',
          borderRadius: '12px',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9, fontWeight: 700 }}>
              Status Persetujuan HQ: <strong>{report.status || 'PENDING'}</strong>
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, marginTop: '2px' }}>
              {report.status === 'APPROVED' 
                ? '✓ Laporan telah disetujui & dipublikasikan ke Client Portal' 
                : report.status === 'REVISION' 
                ? '⚠ Laporan memerlukan revisi dari teknisi/mitra' 
                : '⏳ Menunggu Verifikasi & Persetujuan Admin HQ'}
            </div>
            {report.revision_note && (
              <div style={{ fontSize: '0.78rem', marginTop: '4px', background: 'rgba(0,0,0,0.15)', padding: '4px 8px', borderRadius: '6px' }}>
                Catatan Revisi: {report.revision_note}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {report.status !== 'APPROVED' && (
              <button
                onClick={() => handleUpdateStatus('APPROVED')}
                disabled={updatingStatus}
                style={{
                  background: '#ffffff',
                  color: '#059669',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                }}
              >
                Setujui Laporan
              </button>
            )}
            {report.status !== 'REVISION' && (
              <button
                onClick={() => {
                  const note = prompt('Masukkan catatan revisi untuk teknisi:');
                  if (note !== null) handleUpdateStatus('REVISION', note);
                }}
                disabled={updatingStatus}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.4)',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                Minta Revisi
              </button>
            )}
          </div>
        </div>
      )}

      {/* Screen Render Container */}
      <div id="report-print-area" className={styles.previewWrapper}>
        {/* Official Kop Surat Holicindo */}
        <div className="officialKopSurat" style={{
          padding: '20px 24px 16px 24px',
          borderBottom: '3px double #2E5BFF',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#FAFCFF',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                background: '#0F172A',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '18px',
                padding: '4px 12px',
                borderRadius: '4px',
                letterSpacing: '1px',
              }}>
                HOLICINDO
              </div>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#2E5BFF' }}>
                PT. HOLICINDO INDONESIA
              </span>
            </div>
            <div style={{ fontSize: '10px', color: '#475569', marginTop: '4px', fontWeight: 600 }}>
              Commercial Refrigeration, Kitchen & Cold Chain Solutions
            </div>
            <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>
              Jl. Raya Industri Holicindo No. 88, Jakarta | Telp: (021) 555-8899 | Email: qc@holicindo.co.id
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              display: 'inline-block',
              padding: '4px 10px',
              borderRadius: '6px',
              background: report.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
              border: report.status === 'APPROVED' ? '1px solid #10B981' : '1px solid #F59E0B',
              color: report.status === 'APPROVED' ? '#059669' : '#D97706',
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
            }}>
              {report.status === 'APPROVED' ? '✓ OFFICIAL APPROVED' : '⏳ PENDING REVIEW'}
            </div>
            <div style={{ fontSize: '9px', color: '#64748b', marginTop: '4px', fontWeight: 700 }}>
              Ref: {report.id}
            </div>
          </div>
        </div>

        {report.form_type === 'COOLING_1' ? (
          <CoolingReportTemplate mode="view" data={report.data} unit={report.unit} />
        ) : report.form_type === 'COOLING_2' ? (
          <Cooling2ReportTemplate mode="view" data={report.data} unit={report.unit} />
        ) : report.form_type === 'COOLING_3' ? (
          <Cooling3ReportTemplate mode="view" data={report.data} unit={report.unit} />
        ) : report.form_type === 'COOLING_WARM' ? (
          <WarmReportTemplate mode="view" data={report.data} unit={report.unit} />
        ) : report.form_type === 'REWORK' ? (
          <ReworkReportTemplate mode="view" data={report.data} unit={report.unit} />
        ) : report.form_type === 'COMMISSIONING' ? (
          (() => {
            // Parse photo_urls (format: 'slot:url') back into data.images
            const images: Record<string, string> = { ...(report.data?.images || {}) };
            if (Array.isArray(report.photo_urls)) {
              report.photo_urls.forEach((entry: string) => {
                const idx = entry.indexOf(':');
                if (idx > 0) {
                  const slot = entry.substring(0, idx);
                  const url = entry.substring(idx + 1);
                  if (['top','front','back','left','right'].includes(slot)) {
                    images[slot] = url;
                  }
                }
              });
            }
            return <GraphicRecordTemplate data={{ ...report.data, images }} unit={report.unit} />;
          })()
        ) : report.form_type === 'QC_SERVICE' ? (
          <QcServiceTemplate data={report.data} unit={report.unit} />
        ) : report.form_type === 'ISSUE_ANALYSIS' ? (
          <IssueAnalysisTemplate mode="view" data={report.data} unit={report.unit} />
        ) : (
          <InspectionReportTemplate mode="view" data={report.data} unit={report.unit} />
        )}

        {/* Photo Documentation — hidden for COMMISSIONING (photos are inside the template) */}
        {report.photo_urls && report.photo_urls.length > 0 && report.form_type !== 'COMMISSIONING' && (
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
              display: 'flex',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              {report.photo_urls.map((url: string, index: number) => (
                <div key={`view-photo-${index}`} style={{
                  width: '100px',
                  height: '100px',
                  flexShrink: 0,
                  borderRadius: '6px',
                  border: '1px solid #edf1f5ff',
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
        {/* Official Digital Verification Stamp Footer */}
        <div style={{
          marginTop: '24px',
          padding: '12px 20px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#FAFCFF',
          fontSize: '9px',
          color: '#64748b',
        }}>
          <div>
            <strong>DOKUMEN RESMI DIGITAL PT HOLICINDO INDONESIA</strong>
            <div>Dicetak dari Unit Passport Portal · Hak Cipta Dilindungi Undang-Undang</div>
          </div>
          <div style={{
            border: '1.5px dashed #2E5BFF',
            padding: '4px 10px',
            borderRadius: '4px',
            color: '#2E5BFF',
            fontWeight: 800,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>
            VERIFIED DIGITAL REPORT · HOLICINDO HQ
          </div>
        </div>
      </div>

      {/* CSS overrides to exclude photos or hide specific areas from physical prints if needed */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          body {
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
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
