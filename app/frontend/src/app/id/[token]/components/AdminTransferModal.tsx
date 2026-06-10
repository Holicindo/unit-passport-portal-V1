'use client';

import { ArrowLeft } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import styles from '../id.module.css';

export interface AdminTransferModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  unit: any;
  clients: any[];
  targetClientId: string;
  setTargetClientId: (v: string) => void;
  transferReason: string;
  setTransferReason: (v: string) => void;
}

export default function AdminTransferModal({
  show, onClose, onSubmit, loading, unit, clients,
  targetClientId, setTargetClientId,
  transferReason, setTransferReason,
}: AdminTransferModalProps) {
  if (!show) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <div className={styles.headerLeftMobile}>
            <button onClick={onClose} className={styles.mobileBackBtn}>
              <ArrowLeft size={18} strokeWidth={2.5} />
            </button>
            <h2>Transfer Ownership (Pindahkan Aset)</h2>
          </div>
          <button onClick={onClose} className={styles.closeBtn}>×</button>
        </div>

        <form onSubmit={onSubmit} className={styles.modalForm}>
          <p className={styles.modalHint}>Memindahkan unit secara resmi ke database klien baru.</p>

          <div className={styles.formGroup}>
            <label>Pemilik Saat Ini</label>
            <input type="text" value={unit?.current_client?.company_name || 'INTERNAL STOCK'} disabled
              style={{ background: '#f1f5f9', color: '#64748b' }} />
          </div>

          <div className={styles.formGroup}>
            <label>Pilih Klien Tujuan Baru</label>
            <CustomSelect
              value={targetClientId}
              onChange={(val) => setTargetClientId(val)}
              options={[
                { value: '', label: '— Pilih Klien —' },
                ...(Array.isArray(clients) ? clients.map((c: any) => ({ value: c.id, label: `${c.company_name} (${c.bp_code})` })) : []),
              ]}
              placeholder="— Pilih Klien —"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Alasan Pemindahan / Transfer</label>
            <textarea value={transferReason} onChange={(e) => setTransferReason(e.target.value)}
              placeholder="Sebutkan alasan (misal: relokasi outlet franchise, penjualan unit baru)..." required />
          </div>

          <button type="submit" className={styles.btnSubmit} disabled={loading}>
            {loading ? 'Memproses Transfer...' : 'Konfirmasi Pindahkan Aset'}
          </button>
        </form>
      </div>
    </div>
  );
}
