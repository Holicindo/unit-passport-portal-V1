'use client';

import {
  ArrowLeft, CheckCircle2, ShieldAlert, Phone,
} from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import {
  ISSUE_MAIN_CATEGORIES,
  ISSUE_SUB_CATEGORIES,
} from '../constants';
import styles from '../id.module.css';

export interface ServiceRequestModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  routingResult: any;
  // Form state
  storeName: string;
  setStoreName: (v: string) => void;
  serviceName: string;
  setServiceName: (v: string) => void;
  servicePhone: string;
  setServicePhone: (v: string) => void;
  issueMainCategory: string;
  setIssueMainCategory: (v: string) => void;
  issueSubCategory: string;
  setIssueSubCategory: (v: string) => void;
  serviceNotes: string;
  setServiceNotes: (v: string) => void;
}

export default function ServiceRequestModal({
  show,
  onClose,
  onSubmit,
  loading,
  routingResult,
  storeName,
  setStoreName,
  serviceName,
  setServiceName,
  servicePhone,
  setServicePhone,
  issueMainCategory,
  setIssueMainCategory,
  issueSubCategory,
  setIssueSubCategory,
  serviceNotes,
  setServiceNotes,
}: ServiceRequestModalProps) {
  if (!show) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <div className={styles.headerLeftMobile}>
            <button onClick={onClose} className={styles.mobileBackBtn}>
              <ArrowLeft size={18} strokeWidth={2.5} />
            </button>
            <h2>Request Service &amp; Smart Routing</h2>
          </div>
          <button onClick={onClose} className={styles.closeBtn}>×</button>
        </div>

        {!routingResult ? (
          <form onSubmit={onSubmit} className={styles.modalForm}>
            <p className={styles.modalHint}>Permintaan akan diproses menggunakan sistem Smart Routing regional kami.</p>

            <div className={styles.formGroup}>
              <label>Nama/Kode Outlet (Toko) <span className={styles.mobileOnly} style={{ color: '#ef4444' }}>*</span></label>
              <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Contoh: KFC Kemang / KFC-123" required />
            </div>

            <div className={styles.formGroup}>
              <label>Nama Kontak Penanggung Jawab Outlet <span className={styles.mobileOnly} style={{ color: '#ef4444' }}>*</span></label>
              <input type="text" value={serviceName} onChange={(e) => setServiceName(e.target.value)} placeholder="Contoh: Pak Budi (Store Manager)" required />
            </div>

            <div className={styles.formGroup}>
              <label>No. HP Kontak Outlet <span className={styles.mobileOnly} style={{ color: '#ef4444' }}>*</span></label>
              <input type="text" value={servicePhone} onChange={(e) => setServicePhone(e.target.value)} placeholder="Contoh: 0812XXXXXXXX" required />
            </div>

            <div className={styles.formGroup}>
              <label>Pilih Kategori Kendala Utama <span className={styles.mobileOnly} style={{ color: '#ef4444' }}>*</span></label>
              <CustomSelect
                value={issueMainCategory}
                onChange={(val) => {
                  setIssueMainCategory(val);
                  if (val !== 'Kendala Showcase') setIssueSubCategory('');
                }}
                options={ISSUE_MAIN_CATEGORIES}
                placeholder="— Pilih Kategori —"
              />
            </div>

            {issueMainCategory === 'Kendala Showcase' && (
              <div className={styles.formGroup}>
                <label>Sub-Kategori Kendala Showcase <span className={styles.mobileOnly} style={{ color: '#ef4444' }}>*</span></label>
                <CustomSelect
                  value={issueSubCategory}
                  onChange={(val) => setIssueSubCategory(val)}
                  options={ISSUE_SUB_CATEGORIES}
                  placeholder="— Pilih Sub-Kategori —"
                />
              </div>
            )}

            <div className={styles.formGroup}>
              <label>Catatan Tambahan <span className={styles.desktopOnly}>(Remark)</span><span className={styles.mobileOnly}>(Opsional)</span></label>
              <div style={{ position: 'relative' }}>
                <textarea
                  value={serviceNotes}
                  onChange={(e) => setServiceNotes(e.target.value.slice(0, 500))}
                  placeholder="Jelaskan detail spesifik kendala di sini..."
                  maxLength={500}
                />
                <span className={styles.mobileOnly} style={{ position: 'absolute', bottom: '10px', right: '12px', fontSize: '0.72rem', color: '#94a3b8', pointerEvents: 'none' }}>
                  {serviceNotes.length}/500
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button type="submit" className={styles.btnSubmit} disabled={loading}>
                {loading ? 'Melakukan Smart Routing...' : (
                  <>Kirim Permintaan Servis <span className={styles.mobileOnly} style={{ fontSize: '1.1rem', marginLeft: '6px' }}>→</span></>
                )}
              </button>
              <p className={styles.mobileOnlyFlex} style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', alignItems: 'center', justifyContent: 'center', gap: '5px', marginTop: '10px' }}>
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 17v-1m0-4V7m-7 10a7 7 0 1114 0H5z"/><rect x="8" y="11" width="8" height="6" rx="1"/></svg>
                Data Anda aman dan terenkripsi
              </p>
            </div>
          </form>
        ) : (
          <div className={styles.routingResult}>
            {routingResult.routed_to === 'PARTNER' ? (
              <div className={styles.resultCardSuccess}>
                <CheckCircle2 size={36} color="var(--color-success)" />
                <h3>Smart Routing Berhasil!</h3>
                <p>{routingResult.message}</p>
                <div className={styles.partnerContactCard}>
                  <h4>Informasi Partner Regional:</h4>
                  <p><strong>Nama Partner:</strong> {routingResult.partner_name}</p>
                  <p><strong>Kota:</strong> {routingResult.city}</p>
                  <p><strong>Kontak WA:</strong> {routingResult.contact_wa}</p>
                </div>
              </div>
            ) : (
              <div className={styles.resultCardFallback}>
                <ShieldAlert size={36} color="var(--color-warning)" />
                <h3>Partner Regional Belum Siap (HQ Fallback)</h3>
                <p>{routingResult.message}</p>
                <a href={routingResult.whatsapp_link} target="_blank" className={styles.btnWhatsapp}>
                  <Phone size={16} /> Hubungi Holicindo HQ via WhatsApp
                </a>
              </div>
            )}
            <button onClick={onClose} className={styles.btnFinish}>Selesai</button>
          </div>
        )}
      </div>
    </div>
  );
}
