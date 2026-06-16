'use client';

import { X, Loader2, HelpCircle } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { getUnitType, UNIT_TYPE_LABELS, UNIT_TYPE_COLORS } from '../../id/[token]/constants';
import styles from '../service.module.css';

interface ServiceFormModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: () => void;
  units: any[];
  partners: any[];
  formError: string | null;
  setFormError: (v: string | null) => void;
  selectedUnitId: string;
  setSelectedUnitId: (v: string) => void;
  selectedPartnerId: string;
  setSelectedPartnerId: (v: string) => void;
  issueDescription: string;
  setIssueDescription: (v: string) => void;
  actionTaken: string;
  setActionTaken: (v: string) => void;
  technicianName: string;
  setTechnicianName: (v: string) => void;
  status: string;
  setStatus: (v: string) => void;
  taskType: string;
  setTaskType: (v: string) => void;
  scheduledDate: string;
  setScheduledDate: (v: string) => void;
  deliveryDate: string;
  setDeliveryDate: (v: string) => void;
  submitting: boolean;
}

export default function ServiceFormModal(props: ServiceFormModalProps) {
  const {
    show, onClose, onSubmit, units, partners,
    formError, setFormError,
    selectedUnitId, setSelectedUnitId,
    selectedPartnerId, setSelectedPartnerId,
    issueDescription, setIssueDescription,
    actionTaken, setActionTaken,
    technicianName, setTechnicianName,
    status, setStatus,
    taskType, setTaskType,
    scheduledDate, setScheduledDate,
    deliveryDate, setDeliveryDate,
    submitting,
  } = props;

  if (!show) return null;

  const selectedUnit = units.find(u => u.id === selectedUnitId);
  const autoUnitType = selectedUnit ? getUnitType(selectedUnit.model_name) : null;

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!selectedUnitId) { setFormError('Pilih Unit yang bermasalah terlebih dahulu.'); return; }
    if (!issueDescription.trim()) { setFormError('Tuliskan Deskripsi Kendala.'); return; }
    if (!actionTaken.trim()) { setFormError('Tuliskan Tindakan / Penanganan Awal.'); return; }
    onSubmit();
  };

  return (
    <div className={styles.modalOverlay}>
      <form onSubmit={handlePreSubmit} autoComplete="off" className={styles.modalCard}>
        <header className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Catat Permintaan Servis Baru</h3>
          <button type="button" onClick={onClose} className={styles.closeBtn}><X size={20} /></button>
        </header>
        <div className={styles.modalBody}>
          {formError && <div className={styles.errorAlert}>{formError}</div>}
          <div className={styles.formGrid}>
            <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
              <label>Pilih Unit / Mesin Bermasalah *</label>
              <CustomSelect value={selectedUnitId} onChange={(val) => setSelectedUnitId(val)}
                options={[{ value: '', label: '— Cari & Pilih Unit —' }, ...units.map((u) => ({ value: u.id, label: `${u.model_name} (SN: ${u.serial_number}) - ${u.current_client?.company_name}` }))]} />
              {autoUnitType && (
                <div style={{ marginTop: '8px', padding: '10px 14px', background: UNIT_TYPE_COLORS[autoUnitType].bg, border: `1px solid ${UNIT_TYPE_COLORS[autoUnitType].border}`, borderRadius: '10px', fontSize: '0.85rem', color: UNIT_TYPE_COLORS[autoUnitType].color, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Kategori Otomatis: {UNIT_TYPE_LABELS[autoUnitType]}
                </div>
              )}
            </div>
            <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
              <label>Jenis Pekerjaan *</label>
              <CustomSelect value={taskType} onChange={(val) => setTaskType(val)}
                options={[
                  { value: 'CORRECTIVE', label: 'Servis Perbaikan (Corrective)' },
                  { value: 'PREVENTIVE', label: 'Perawatan Rutin (Preventive)' },
                  { value: 'INSTALLATION', label: 'Pengiriman & Instalasi (Delivery)' },
                ]} />
            </div>
            <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
              <label>Mitra Regional / Teknisi Penanggungjawab</label>
              <CustomSelect value={selectedPartnerId} onChange={(val) => setSelectedPartnerId(val)}
                options={[{ value: '', label: '— Gunakan HQ (Manual Routing) —' }, ...partners.map((p) => ({ value: p.id, label: `${p.partner_name} (${p.city})` }))]} />
            </div>
            <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
              <label>Deskripsi Kendala (Problem dari Chat WA/Telp) *</label>
              <textarea value={issueDescription} onChange={(e) => setIssueDescription(e.target.value)} placeholder="Contoh: Lampu showcase kedip-kedip..." autoComplete="new-password" required />
            </div>
            <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
              <label>Tindakan Awal / Status Investigasi *</label>
              <textarea value={actionTaken} onChange={(e) => setActionTaken(e.target.value)} placeholder="Contoh: Menghubungi mitra regional..." autoComplete="new-password" required />
            </div>
            <div className={styles.formGroup}>
              <label>Nama Teknisi</label>
              <input type="text" value={technicianName} onChange={(e) => setTechnicianName(e.target.value)} placeholder="Contoh: Ahmad" autoComplete="new-password" />
            </div>
            <div className={styles.formGroup}>
              <label>Status Awal</label>
              <CustomSelect value={status} onChange={(val) => setStatus(val)}
                options={[{ value: 'PENDING', label: 'PENDING (Antrean)' }, { value: 'IN PROGRESS', label: 'IN PROGRESS (Dikerjakan)' }, { value: 'COMPLETED', label: 'COMPLETED (Selesai)' }, { value: 'CANCELED', label: 'CANCELED (Batal)' }]} />
            </div>
            <div className={styles.formGroup}>
              <label>Tanggal Jadwal Servis</label>
              <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
            </div>
            {taskType === 'INSTALLATION' && (
              <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                <label>Tanggal Delivery / Pengiriman</label>
                <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
              </div>
            )}
          </div>
        </div>
        <footer className={styles.modalFooter}>
          <button type="button" onClick={onClose} className={styles.cancelBtn}>Batal</button>
          <button type="submit" disabled={submitting} className={styles.saveBtn}>
            {submitting ? <><Loader2 size={16} className={styles.spin} style={{ marginRight: '8px', display: 'inline' }} /><span>Menyimpan...</span></> : <span>Simpan Permintaan</span>}
          </button>
        </footer>
      </form>
    </div>
  );
}

export function ConfirmSubmitModal({ show, onConfirm, onCancel }: { show: boolean; onConfirm: () => void; onCancel: () => void }) {
  if (!show) return null;
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalCard} style={{ maxWidth: '440px', padding: '32px', textAlign: 'center', alignItems: 'center', gap: '20px' }}>
        <div className={styles.modalIcon} style={{ color: 'var(--color-cobalt-blue)', background: 'rgba(46,91,255,0.08)', padding: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <HelpCircle size={32} />
        </div>
        <h3 className={styles.modalTitle}>Simpan Permintaan Servis?</h3>
        <p className={styles.modalDescription} style={{ fontSize: '0.95rem', color: 'var(--color-space-grey)', lineHeight: 1.5, fontWeight: 500 }}>
          Apakah Anda yakin ingin merekam permintaan servis ini ke dalam database portal?
        </p>
        <div className={styles.modalActionRow} style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '8px' }}>
          <button type="button" onClick={onCancel} className={styles.cancelBtn} style={{ flex: 1 }}>Batal</button>
          <button type="button" onClick={onConfirm} className={styles.saveBtn} style={{ flex: 1 }}>Ya, Simpan</button>
        </div>
      </div>
    </div>
  );
}
