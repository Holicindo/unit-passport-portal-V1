'use client';

import { useState, useEffect, useRef } from 'react';
import { reportApi } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Camera, Loader2 } from 'lucide-react';
import styles from '../../ClientPortal.module.css';

// Reuse the same report template renderers as the admin view
import InspectionReportTemplate from '@/components/reports/InspectionReportTemplate';
import CoolingReportTemplate from '@/components/reports/CoolingReportTemplate';
import Cooling2ReportTemplate from '@/components/reports/Cooling2ReportTemplate';
import Cooling3ReportTemplate from '@/components/reports/Cooling3ReportTemplate';
import WarmReportTemplate from '@/components/reports/WarmReportTemplate';
import ReworkReportTemplate from '@/components/reports/ReworkReportTemplate';
import GraphicRecordTemplate from '@/components/reports/GraphicRecordTemplate';
import QcServiceTemplate from '@/components/reports/QcServiceTemplate';
import IssueAnalysisTemplate from '@/components/reports/IssueAnalysisTemplate';

export default function ClientReportDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reportWrapperRef = useRef<HTMLDivElement>(null);
  const reportContainerRef = useRef<HTMLDivElement>(null);

  // Scale report to fit mobile viewport — update on resize
  useEffect(() => {
    const applyScale = () => {
      const wrapper = reportWrapperRef.current;
      const container = reportContainerRef.current;
      if (!wrapper || !container) return;
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        const availableWidth = window.innerWidth - 32; // account for 16px padding each side
        const scale = availableWidth / 794;
        wrapper.style.transform = `scale(${scale})`;
        wrapper.style.transformOrigin = 'top left';
        wrapper.style.width = '794px';
        // Compensate container height so nothing is clipped
        const scaledHeight = wrapper.scrollHeight * scale;
        container.style.height = `${scaledHeight}px`;
        container.style.overflow = 'hidden';
      } else {
        wrapper.style.transform = '';
        wrapper.style.transformOrigin = '';
        wrapper.style.width = '';
        container.style.height = '';
        container.style.overflow = '';
      }
    };

    // Apply after template renders
    const timeout = setTimeout(applyScale, 100);
    window.addEventListener('resize', applyScale);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', applyScale);
    };
  }, [report]);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const { data } = await reportApi.findOne(id as string);
        if (data) {
          setReport(data);
        } else {
          setError('Laporan tidak ditemukan.');
        }
      } catch (err: any) {
        if (err?.response?.status === 403) {
          setError('Akses ditolak. Laporan ini tidak terkait dengan unit Anda.');
          setTimeout(() => router.push('/client-portal/fleet'), 3000);
        } else {
          setError('Gagal memuat data laporan dari server.');
        }
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchReport();
  }, [id, router]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px', gap: '16px' }}>
        <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: 'var(--brand-cobalt-blue)' }} />
        <p style={{ color: 'var(--brand-space-grey)', fontFamily: 'var(--font-body)' }}>Memuat Laporan QC...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div style={{ padding: '48px', textAlign: 'center' }}>
        <p style={{ color: 'var(--brand-safety-orange)', marginBottom: '16px', fontFamily: 'var(--font-body)' }}>
          {error || 'Data laporan kosong.'}
        </p>
        <button onClick={() => router.back()} className={styles.btnSecondary}>
          <ArrowLeft size={16} /> Kembali
        </button>
      </div>
    );
  }

  // Render the correct template based on form_type — same logic as admin reports/view/[id]/page.tsx
  const renderTemplate = () => {
    if (report.form_type === 'COOLING_1') {
      return <CoolingReportTemplate mode="view" data={report.data} unit={report.unit} />;
    }
    if (report.form_type === 'COOLING_2') {
      return <Cooling2ReportTemplate mode="view" data={report.data} unit={report.unit} />;
    }
    if (report.form_type === 'COOLING_3') {
      return <Cooling3ReportTemplate mode="view" data={report.data} unit={report.unit} />;
    }
    if (report.form_type === 'COOLING_WARM') {
      return <WarmReportTemplate mode="view" data={report.data} unit={report.unit} />;
    }
    if (report.form_type === 'REWORK') {
      return <ReworkReportTemplate mode="view" data={report.data} unit={report.unit} />;
    }
    if (report.form_type === 'COMMISSIONING') {
      const images: Record<string, string> = { ...(report.data?.images || {}) };
      if (Array.isArray(report.photo_urls)) {
        report.photo_urls.forEach((entry: string) => {
          const idx = entry.indexOf(':');
          if (idx > 0) {
            const slot = entry.substring(0, idx);
            const url = entry.substring(idx + 1);
            if (['top', 'front', 'back', 'left', 'right'].includes(slot)) {
              images[slot] = url;
            }
          }
        });
      }
      return <GraphicRecordTemplate data={{ ...report.data, images }} unit={report.unit} />;
    }
    if (report.form_type === 'QC_SERVICE') {
      return <QcServiceTemplate data={report.data} unit={report.unit} />;
    }
    if (report.form_type === 'ISSUE_ANALYSIS') {
      return <IssueAnalysisTemplate mode="view" data={report.data} unit={report.unit} />;
    }
    // Default: INSPECTION
    return <InspectionReportTemplate mode="view" data={report.data} unit={report.unit} />;
  };

  return (
    <div>
      {/* Toolbar — back button + report info */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => router.back()}
            style={{
              display: 'flex', alignItems: 'center',
              background: 'none', border: 'none',
              color: 'var(--brand-space-grey)', cursor: 'pointer',
              fontWeight: 600, fontFamily: 'var(--font-body)', fontSize: '0.875rem',
              flexShrink: 0, padding: '4px 6px 4px 0',
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontWeight: 700, fontFamily: 'var(--font-heading)',
              color: 'var(--brand-deep-navy)', fontSize: '0.85rem',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              Laporan: {report.id}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--brand-space-grey)', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {report.unit?.serial_number} · {report.unit?.model_name}
            </div>
          </div>
        </div>
      </div>

      {/* Report preview — neumorphic card wrapper */}
      <div style={{
        background: 'var(--neu-base)',
        borderRadius: '18px',
        overflow: 'hidden',
        boxShadow: 'var(--neu-shadow)',
      }}>
        <div ref={reportContainerRef} style={{ position: 'relative' }}>
          <div id="report-print-area" ref={reportWrapperRef} className="reportScaleWrapper">
            {renderTemplate()}
          </div>
        </div>

        {/* Photo documentation */}
        {report.photo_urls && report.photo_urls.length > 0 && report.form_type !== 'COMMISSIONING' && (
          <div style={{ padding: '24px', borderTop: '1px solid rgba(0,31,63,0.06)' }} className="photoContainerPrintExclude">
            <h4 style={{
              fontSize: '11px', fontWeight: 800, color: 'var(--brand-space-grey)',
              textTransform: 'uppercase', letterSpacing: '0.05em',
              margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px',
              fontFamily: 'var(--font-heading)',
            }}>
              <Camera size={14} style={{ color: 'var(--brand-cobalt-blue)' }} />
              Lampiran Foto Dokumentasi QC
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {report.photo_urls.map((url: string, index: number) => (
                <div key={index} style={{
                  width: '100px', height: '100px', flexShrink: 0,
                  borderRadius: '10px',
                  overflow: 'hidden',
                  boxShadow: 'var(--neu-shadow-sm)',
                }}>
                  <img
                    src={url}
                    alt={`Foto ${index + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        /* Mobile: scale A4 template to fit viewport width */
        @media (max-width: 768px) {
          .reportScaleWrapper {
            transform-origin: top left;
            transform: scale(calc((100vw - 32px) / 794));
            width: 794px;
          }
          .reportScaleWrapper + .scaleHeightCompensator {
            display: block;
          }
        }
      ` }} />
    </div>
  );
}
