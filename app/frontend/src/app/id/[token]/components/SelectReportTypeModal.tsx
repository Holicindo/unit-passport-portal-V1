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
      <div className={styles.modalCard} style={{ maxWidth: '650px', width: '90%' }}>
        <div className={styles.modalHeader}>
          <div className={styles.headerLeftMobile}>
            <button onClick={onClose} className={styles.mobileBackBtn}>
              <ArrowLeft size={18} strokeWidth={2.5} />
            </button>
            <h2>Pilih Tipe Laporan Digital</h2>
          </div>
          <button onClick={onClose} className={styles.closeBtn}>×</button>
        </div>

        <div className={styles.modalForm} style={{ padding: '20px 24px' }}>
          <p className={styles.modalHint} style={{ marginBottom: '16px' }}>
            Pilih tipe laporan digital yang ingin dibuat untuk unit ini.
          </p>

          {activeLog && (
            <div style={{
              background: 'rgba(255,107,0,0.08)',
              border: '1px solid rgba(255,107,0,0.2)',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <div style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                color: '#FF6B00',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF6B00', display: 'inline-block' }} />
                Tiket Servis Aktif Terdeteksi
              </div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>
                Call ID: {activeLog.id}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
                Laporan ini akan otomatis ditautkan ke tiket servis di atas untuk dokumentasi.
              </div>
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '12px',
            maxHeight: '400px',
            overflowY: 'auto',
            paddingRight: '4px',
            marginBottom: '10px'
          }}>
            {reportTypes.map((type) => (
              <button
                key={type.path}
                type="button"
                onClick={() => handleSelect(type.path)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '14px',
                  background: type.bg,
                  border: `1px solid ${type.border}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  padding: '8px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {type.icon}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#fff' }}>
                    {type.name}
                  </span>
                  <span style={{ fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.3 }}>
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
