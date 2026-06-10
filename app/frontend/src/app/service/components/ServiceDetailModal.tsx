'use client';

import { useState } from 'react';
import { X, MessageSquare } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { parseDetailedIssue, formatDate } from '../utils';
import styles from '../service.module.css';

interface ServiceDetailModalProps {
  log: any;
  partners: any[];
  onClose: () => void;
  onUpdate: (updatedLog: any) => void;
  submitting: boolean;
  setSubmitting: (v: boolean) => void;
}

export default function ServiceDetailModal({ log, partners, onClose, onUpdate, submitting, setSubmitting }: ServiceDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editPartnerId, setEditPartnerId] = useState(log.partner?.id || '');
  const [editTechnician, setEditTechnician] = useState(log.technician_name || '');
  const [editStatus, setEditStatus] = useState(log.status || 'PENDING');
  const [editDate, setEditDate] = useState(log.service_date ? log.service_date.split('T')[0] : '');
  const [editActionTaken, setEditActionTaken] = useState(log.action_taken || '');

  const startEditing = () => {
    setEditPartnerId(log.partner?.id || '');
    setEditTechnician(log.technician_name || '');
    setEditStatus(log.status || 'PENDING');
    setEditDate(log.service_date ? log.service_date.split('T')[0] : '');
    setEditActionTaken(log.action_taken || '');
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      setSubmitting(true);
      const { serviceLogApi } = await import('@/lib/api');
      const { data: updated } = await serviceLogApi.update(log.id, {
        partnerId: editPartnerId || null, technician_name: editTechnician,
        status: editStatus, service_date: editDate, action_taken: editActionTaken,
      });
      onUpdate(updated);
      setIsEditing(false);
    } catch { alert('Gagal mengupdate detail log servis.'); }
    finally { setSubmitting(false); }
  };

  const parsed = parseDetailedIssue(log.issue_description);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <header className={styles.modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h3 className={styles.modalTitle}>Detail Permintaan Servis #{log.id}</h3>
            <span className={`${styles.badge} ${log.status === 'PENDING' ? styles.badgePending : log.status === 'COMPLETED' ? styles.badgeCompleted : styles.badgeCancelled}`}>{log.status}</span>
          </div>
          <button type="button" onClick={onClose} className={styles.closeBtn}><X size={20} /></button>
        </header>

        <div className={styles.modalBody}>
          {/* Section 1: Unit */}
          <div className={styles.detailSection}>
            <h4 className={styles.detailSectionTitle}>Unit / Mesin</h4>
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}><span className={styles.detailLabel}>Model Mesin</span><span className={styles.detailValue}>{log.unit?.model_name || '-'}</span></div>
              <div className={styles.detailItem}><span className={styles.detailLabel}>Serial Number</span><span className={styles.detailValuePrimary}>{log.unit?.serial_number || '-'}</span></div>
              <div className={styles.detailItem}><span className={styles.detailLabel}>Pemilik (Client)</span><span className={styles.detailValue}>{log.unit?.current_client?.company_name || 'Umum / Belum Terikat'}</span></div>
              <div className={styles.detailItem}><span className={styles.detailLabel}>Lokasi Kota Unit</span><span className={styles.detailValue}>{log.unit?.current_client?.city || log.unit?.specs?.city || 'Jakarta'}</span></div>
            </div>
          </div>

          {/* Section 2: Kendala */}
          <div className={styles.detailSection}>
            <h4 className={styles.detailSectionTitle}>Laporan Kendala & Pelapor</h4>
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}><span className={styles.detailLabel}>Kategori Kendala</span><span className={styles.detailValue}>{parsed.category}</span></div>
              <div className={styles.detailItem}><span className={styles.detailLabel}>Sub-Kategori</span><span className={styles.detailValue}>{parsed.subcategory}</span></div>
              <div className={styles.detailItemFull}><span className={styles.detailLabel}>Catatan Kerusakan (Remark)</span><span className={styles.detailValue}>{parsed.remark}</span></div>
              <div className={styles.detailItem}><span className={styles.detailLabel}>Nama Kontak Pelapor</span><span className={styles.detailValue}>{parsed.contactName}</span></div>
              <div className={styles.detailItem}><span className={styles.detailLabel}>No. Handphone</span><span className={styles.detailValue}>{parsed.contactPhone}</span></div>
            </div>
          </div>

          {/* Section 3: Routing & Tindakan */}
          <div className={styles.detailSection}>
            <h4 className={styles.detailSectionTitle}>Rute Penugasan & Tindakan</h4>
            <div className={styles.detailGrid}>
              {isEditing ? (<>
                <div className={styles.detailItemFull}><span className={styles.detailLabel}>Mitra Regional Terpilih</span>
                  <CustomSelect value={editPartnerId} onChange={(val) => setEditPartnerId(val)}
                    options={[{ value: '', label: 'HQ (Manual Routing)' }, ...partners.map((p) => ({ value: p.id, label: `${p.partner_name} (${p.city})` }))]} />
                </div>
                <div className={styles.detailItem}><span className={styles.detailLabel}>Nama Teknisi</span>
                  <input type="text" value={editTechnician} onChange={(e) => setEditTechnician(e.target.value)}
                    style={{ width: '100%', marginTop: '4px', padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '0.9rem', color: 'var(--color-deep-navy)', outline: 'none' }} />
                </div>
                <div className={styles.detailItem}><span className={styles.detailLabel}>Tanggal Servis</span>
                  <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)}
                    style={{ width: '100%', marginTop: '4px', padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '0.9rem', color: 'var(--color-deep-navy)', outline: 'none' }} />
                </div>
                <div className={styles.detailItemFull}><span className={styles.detailLabel}>Status Servis</span>
                  <CustomSelect value={editStatus} onChange={(val) => setEditStatus(val)}
                    options={[{ value: 'PENDING', label: 'PENDING' }, { value: 'COMPLETED', label: 'COMPLETED' }, { value: 'CANCELLED', label: 'CANCELLED' }]} />
                </div>
                <div className={styles.detailItemFull}><span className={styles.detailLabel}>Tindakan / Hasil Servis</span>
                  <textarea value={editActionTaken} onChange={(e) => setEditActionTaken(e.target.value)}
                    style={{ width: '100%', marginTop: '4px', padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '0.9rem', color: 'var(--color-deep-navy)', outline: 'none', minHeight: '80px', fontFamily: 'inherit', resize: 'vertical' }} />
                </div>
              </>) : (<>
                <div className={styles.detailItemFull}><span className={styles.detailLabel}>Mitra Regional Terpilih</span>
                  {log.partner ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span className={styles.detailValue}>{log.partner.partner_name} ({log.partner.city})</span>
                      {log.partner.contact_wa && <a href={`https://wa.me/${log.partner.contact_wa}`} target="_blank" rel="noopener noreferrer" className={styles.waBtn}><MessageSquare size={14} /><span>Hubungi WA Mitra: {log.partner.contact_wa}</span></a>}
                    </div>
                  ) : <span className={styles.detailValue} style={{ fontStyle: 'italic', color: 'var(--color-space-grey)' }}>HQ (Manual Routing)</span>}
                </div>
                <div className={styles.detailItem}><span className={styles.detailLabel}>Nama Teknisi</span><span className={styles.detailValue}>{log.technician_name || 'Menunggu Alokasi'}</span></div>
                <div className={styles.detailItem}><span className={styles.detailLabel}>Tanggal Servis</span><span className={styles.detailValue}>{formatDate(log.service_date)}</span></div>
                <div className={styles.detailItemFull}><span className={styles.detailLabel}>Tindakan / Hasil Servis</span><span className={styles.detailValue}>{log.action_taken || 'Menunggu peninjauan teknisi.'}</span></div>
              </>)}
            </div>
          </div>
        </div>

        <footer className={styles.modalFooter}>
          {isEditing ? (<>
            <button type="button" onClick={() => setIsEditing(false)} className={styles.cancelBtn} disabled={submitting}>Batal</button>
            <button type="button" onClick={handleSave} className={styles.saveBtn} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
          </>) : (<>
            <button type="button" onClick={startEditing} className={styles.saveBtn} style={{ marginRight: 'auto', background: 'var(--color-cobalt-blue)' }}>Tindak Lanjuti / Edit</button>
            <button type="button" onClick={onClose} className={styles.cancelBtn}>Tutup</button>
          </>)}
        </footer>
      </div>
    </div>
  );
}
