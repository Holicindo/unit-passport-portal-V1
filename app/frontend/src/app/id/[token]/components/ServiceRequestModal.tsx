'use client';

import {
  ArrowLeft, CheckCircle2, ShieldAlert, Phone,
} from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import {
  ISSUE_MAIN_CATEGORIES,
  ISSUE_SUB_CATEGORIES_SHOWCASE,
} from '../constants';
import styles from '../id.module.css';

export interface ServiceRequestModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  routingResult: any;
  unitType?: string; // 'SHOWCASE' | 'MESIN' | undefined
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
  unitType,
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

  // Determine if unit type is already known
  const isShowcase = unitType === 'SHOWCASE';
  const isMesin = unitType === 'MESIN';
  const isKnownType = isShowcase || isMesin;

  // For known showcase units, show sub-category directly
  // For known mesin units, no sub-category needed
  const showMainCategorySelect = !isKnownType;
  const showSubCategory = isShowcase || issueMainCategory === 'Kendala Showcase';

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <div className={styles.headerLeftMobile}>
            <button onClick={onClose} className={styles.mobileBackBtn}>
              <ArrowLeft size={18} strokeWidth={2.5} />
            </button>
            <h2>Request Service</h2>
          </div>
          <button onClick={onClose} className={styles.closeBtn}>×</button>
        </div>

        {!routingResult ? (
          <form onSubmit={onSubmit} className={styles.modalForm}>
            <p className={styles.modalHint}>Isi formulir berikut untuk mengirimkan permintaan servis ke tim kami.</p>

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

            {/* Kategori Unit — hanya muncul jika tipe unit belum diketahui */}
            {showMainCategorySelect && (
              <div className={styles.formGroup}>
                <label>Kategori Unit <span className={styles.mobileOnly} style={{ color: '#ef4444' }}>*</span></label>
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
            )}

            {/* Sub-kategori Showcase — tampil jika unit adalah showcase atau kategori dipilih showcase */}
            {showSubCategory && (
              <div className={styles.formGroup}>
                <label>Kendala Unit <span className={styles.mobileOnly} style={{ color: '#ef4444' }}>*</span></label>
                <CustomSelect
                  value={issueSubCategory}
                  onChange={(val) => setIssueSubCategory(val)}
                  options={ISSUE_SUB_CATEGORIES_SHOWCASE}
                  placeholder="— Pilih Kendala —"
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
                {loading ? 'Memproses Permintaan...' : (
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
                <h3>Permintaan Berhasil Dikirim!</h3>
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
