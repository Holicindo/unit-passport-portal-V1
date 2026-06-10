'use client';

import { ArrowLeft } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { LOG_TYPE_OPTIONS, LOG_STATUS_OPTIONS } from '../constants';
import styles from '../id.module.css';

export interface PartnerLogModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  unit: any;
  techName: string;
  setTechName: (v: string) => void;
  logType: string;
  setLogType: (v: string) => void;
  logNotes: string;
  setLogNotes: (v: string) => void;
  logStatus: string;
  setLogStatus: (v: string) => void;
  logComponents: string;
  setLogComponents: (v: string) => void;
}

export default function PartnerLogModal({
  show, onClose, onSubmit, loading, unit,
  techName, setTechName,
  logType, setLogType,
  logNotes, setLogNotes,
  logStatus, setLogStatus,
  logComponents, setLogComponents,
}: PartnerLogModalProps) {
  if (!show) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <div className={styles.headerLeftMobile}>
            <button onClick={onClose} className={styles.mobileBackBtn}>
              <ArrowLeft size={18} strokeWidth={2.5} />
            </button>
            <h2>{logStatus === 'COMPLETED' ? 'Selesaikan & Tutup Tiket' : 'Tambah Catatan Servis'}</h2>
          </div>
          <button onClick={onClose} className={styles.closeBtn}>×</button>
        </div>

        <form onSubmit={onSubmit} className={styles.modalForm}>
          {/* Unit info summary */}
          <div style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px', padding: '12px 14px', marginBottom: '4px',
            display: 'flex', flexDirection: 'column', gap: '4px',
          }}>
            <span style={{ fontSize: '0.72rem', color: '#8f9bb3', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Unit yang Dikerjakan</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff' }}>{unit?.model_name}</span>
            <span style={{ fontSize: '0.78rem', color: '#8f9bb3', fontFamily: 'monospace' }}>SN: {unit?.serial_number}</span>
          </div>

          <div className={styles.formGroup}>
            <label>Nama Teknisi Yang Mengerjakan *</label>
            <input type="text" value={techName} onChange={(e) => setTechName(e.target.value)} placeholder="Contoh: Andi Wijaya" required />
          </div>

          <div className={styles.formGroup}>
            <label>Jenis Servis *</label>
            <CustomSelect value={logType} onChange={(val) => setLogType(val)} options={LOG_TYPE_OPTIONS} />
          </div>

          <div className={styles.formGroup}>
            <label>Tindakan yang Dilakukan *</label>
            <textarea value={logNotes} onChange={(e) => setLogNotes(e.target.value)}
              placeholder="Jelaskan tindakan yang dilakukan, misal: Penggantian door gasket, cleaning kondensor, isi freon R290..." required />
          </div>

          <div className={styles.formGroup}>
            <label>Komponen Diganti (opsional)</label>
            <input type="text" value={logComponents} onChange={(e) => setLogComponents(e.target.value)}
              placeholder="Contoh: Door gasket, fan motor, kapasitor" />
          </div>

          <div className={styles.formGroup}>
            <label>Status Penyelesaian *</label>
            <CustomSelect value={logStatus} onChange={(val) => setLogStatus(val)} options={LOG_STATUS_OPTIONS} />
          </div>

          <button type="submit" className={styles.btnSubmit} disabled={loading} style={{
            background: logStatus === 'COMPLETED'
              ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
              : 'linear-gradient(135deg, #184cf4 0%, #0a2eb5 100%)',
          }}>
            {loading ? 'Menyimpan...' : logStatus === 'COMPLETED' ? 'Simpan & Tutup Tiket' : 'Simpan Catatan Servis'}
          </button>
        </form>
      </div>
    </div>
  );
}
