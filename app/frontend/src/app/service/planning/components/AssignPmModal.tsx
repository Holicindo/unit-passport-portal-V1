'use client';

import React from 'react';
import { X } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import styles from '../planning.module.css';

interface AssignPmModalProps {
  unitModel: string;
  unitSerial: string;
  partners: { id: string; partner_name: string; city: string }[];
  selectedPartnerId: string;
  setPartnerId: (v: string) => void;
  scheduledDate: string;
  setScheduledDate: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  formError: string | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function AssignPmModal({
  unitModel, unitSerial, partners,
  selectedPartnerId, setPartnerId,
  scheduledDate, setScheduledDate,
  notes, setNotes, formError, submitting,
  onClose, onSubmit,
}: AssignPmModalProps) {
  return (
    <div className={styles.modalOverlay}>
      <form onSubmit={onSubmit} autoComplete="off" className={styles.modalCard}>
        <header className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Tugaskan Jadwal PM Rutin</h3>
          <button type="button" onClick={onClose} className={styles.closeBtn}><X size={20} /></button>
        </header>

        <div className={styles.modalBody}>
          {formError && <div className={styles.errorAlert}>{formError}</div>}

          <div style={{ background: 'rgba(46, 91, 255, 0.05)', padding: '14px', borderRadius: '10px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '4px', border: '1px solid rgba(46, 91, 255, 0.1)' }}>
            <span style={{ fontWeight: 800, color: 'var(--color-cobalt-blue)', textTransform: 'uppercase', fontSize: '0.75rem' }}>Unit Yang Ditugaskan</span>
            <span style={{ fontWeight: 700, color: 'var(--color-deep-navy)' }}>{unitModel}</span>
            <span style={{ color: 'var(--color-space-grey)' }}>Serial Number: <strong>{unitSerial}</strong></span>
          </div>

          <div className={styles.formGroup}>
            <label>Pilih Mitra Regional Penanggungjawab *</label>
            <CustomSelect value={selectedPartnerId} onChange={(val) => setPartnerId(val)}
              options={[
                { value: '', label: '— Pilih Partner Regional —' },
                ...partners.map(p => ({ value: p.id, label: `${p.partner_name} (${p.city})` })),
              ]}
              placeholder="— Pilih Partner Regional —" />
          </div>

          <div className={styles.formGroup}>
            <label>Tanggal Rencana Kunjungan PM *</label>
            <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} required />
          </div>

          <div className={styles.formGroup}>
            <label>Cakupan Pekerjaan PM (Notes) *</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Instruksi checklist perawatan mesin..." autoComplete="new-password" required />
          </div>
        </div>

        <footer className={styles.modalFooter}>
          <button type="button" onClick={onClose} className={styles.cancelBtn}>Batal</button>
          <button type="submit" className={styles.saveBtn} disabled={submitting}>
            {submitting ? 'Menugaskan...' : 'Tugaskan Sekarang'}
          </button>
        </footer>
      </form>
    </div>
  );
}
