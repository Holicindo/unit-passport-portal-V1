'use client';

import { ArrowLeft, FileText, CheckSquare, Thermometer, ShieldAlert, AlertTriangle, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import styles from '../id.module.css';

export interface SelectReportTypeModalProps {
  show: boolean;
  onClose: () => void;
  unit: any;
}

export default function SelectReportTypeModal({ show, onClose, unit }: SelectReportTypeModalProps) {
  const router = useRouter();

  if (!show || !unit) return null;

  // Find active service ticket if any
  const activeLog = unit.service_logs?.find((l: any) => l.status === 'PENDING');

  const reportTypes = [
    {
      name: 'Laporan Inspeksi (QC)',
      description: 'Laporan QC visual & elektrikal unit baru / perbaikan.',
      path: '/reports/inspection',
      icon: <FileText size={20} color="#3b82f6" />,
      bg: 'rgba(59,130,246,0.08)',
      border: 'rgba(59,130,246,0.15)',
    },
    {
      name: 'QC Service Checklist (Kaca)',
      description: 'Checklist quality control kaca unit setelah perbaikan.',
      path: '/reports/qc-service',
      icon: <CheckSquare size={20} color="#10b981" />,
      bg: 'rgba(16,185,129,0.08)',
      border: 'rgba(16,185,129,0.15)',
    },
    {
      name: 'Pengecekan Rework',
      description: 'Laporan hasil pengerjaan ulang (rework) komponen.',
      path: '/reports/rework',
      icon: <RefreshCw size={20} color="#8b5cf6" />,
      bg: 'rgba(139,92,246,0.08)',
      border: 'rgba(139,92,246,0.15)',
    },
    {
      name: 'Inspeksi & Analisis Masalah',
      description: 'Form investigasi masalah teknis & tindakan perbaikan.',
      path: '/reports/issue-analysis',
      icon: <AlertTriangle size={20} color="#f59e0b" />,
      bg: 'rgba(245,158,11,0.08)',
      border: 'rgba(245,158,11,0.15)',
    },
    {
      name: 'Pendingin 1 Suhu',
      description: 'Sistem pendingin standar single temperature.',
      path: '/reports/cooling',
      icon: <Thermometer size={20} color="#06b6d4" />,
      bg: 'rgba(6,182,212,0.08)',
      border: 'rgba(6,182,212,0.15)',
    },
    {
      name: 'Pendingin 2 Suhu',
      description: 'Sistem pendingin dual zone (Cake & RTD).',
      path: '/reports/cooling2',
      icon: <Thermometer size={20} color="#ec4899" />,
      bg: 'rgba(236,72,153,0.08)',
      border: 'rgba(236,72,153,0.15)',
    },
    {
      name: 'Pendingin 3 Suhu',
      description: 'Sistem pendingin triple zone (Cake, Ambient & RTD).',
      path: '/reports/cooling3',
      icon: <Thermometer size={20} color="#3b82f6" />,
      bg: 'rgba(59,130,246,0.08)',
      border: 'rgba(59,130,246,0.15)',
    },
    {
      name: 'Pendingin Warm',
      description: 'Sistem pemanas / pendingin warm showcase.',
      path: '/reports/reportwarm',
      icon: <Thermometer size={20} color="#f97316" />,
      bg: 'rgba(249,115,22,0.08)',
      border: 'rgba(249,115,22,0.15)',
    },
  ];

  const handleSelect = (path: string) => {
    let url = `${path}?unit=${unit.id}`;
    if (activeLog) {
      url += `&serviceLogId=${activeLog.id}`;
    }
    router.push(url);
    onClose();
  };

  return (
    <div className={styles.modalOverlay} style={{ zIndex: 1100 }}>
      <div className={styles.modalCard} style={{ maxWidth: '720px', width: '92%' }}>
        <div className={styles.modalHeader}>
          <div className={styles.headerLeftMobile}>
            <button onClick={onClose} className={styles.mobileBackBtn}>
              <ArrowLeft size={18} strokeWidth={2.5} />
            </button>
            <h2>Pilih Tipe Laporan Digital</h2>
          </div>
          <button onClick={onClose} className={styles.closeBtn}>×</button>
        </div>

        <div className={styles.modalForm} style={{ padding: '24px 28px' }}>
          <p className={styles.modalHint} style={{
            marginBottom: '20px'
          }}>
            Pilih tipe laporan digital yang ingin dibuat untuk unit ini.
          </p>

          {activeLog && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(255,107,0,0.12) 0%, rgba(255,107,0,0.06) 100%)',
              border: '1.5px solid rgba(255,107,0,0.3)',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{
                fontSize: '0.7rem',
                fontWeight: 800,
                color: '#D97706',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FF6B00', display: 'inline-block' }} />
                Tiket Servis Aktif Terdeteksi
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-deep-navy)', fontFamily: 'var(--font-heading)' }}>
                Call ID: {activeLog.id}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px', lineHeight: 1.4 }}>
                Laporan ini akan otomatis ditautkan ke tiket servis di atas untuk dokumentasi.
              </div>
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
            maxHeight: '420px',
            overflowY: 'auto',
            paddingRight: '8px',
            marginBottom: '12px'
          }}>
            {reportTypes.map((type) => (
              <button
                key={type.path}
                type="button"
                onClick={() => handleSelect(type.path)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  padding: '18px 16px',
                  background: '#FFFFFF',
                  border: `2px solid ${type.border}`,
                  borderRadius: '14px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  outline: 'none',
                  boxShadow: '0 2px 12px rgba(13, 43, 94, 0.06)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(13, 43, 94, 0.12)';
                  e.currentTarget.style.borderColor = type.border.replace('0.15', '0.4');
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 2px 12px rgba(13, 43, 94, 0.06)';
                  e.currentTarget.style.borderColor = type.border;
                }}
              >
                <div style={{
                  padding: '10px',
                  background: type.bg,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {type.icon}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                  <span style={{
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: 'var(--color-deep-navy)',
                    fontFamily: 'var(--font-heading)',
                    lineHeight: 1.2
                  }}>
                    {type.name}
                  </span>
                  <span style={{
                    fontSize: '0.78rem',
                    color: '#64748b',
                    lineHeight: 1.4,
                    fontWeight: 500
                  }}>
                    {type.description}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
