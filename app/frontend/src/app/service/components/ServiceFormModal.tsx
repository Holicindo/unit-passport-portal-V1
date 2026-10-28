'use client';

import { X, Loader2, HelpCircle, Hash, Cpu, Wrench, ClipboardList, UserCheck, Calendar } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { getUnitType, UNIT_TYPE_LABELS, UNIT_TYPE_COLORS } from '../../id/[token]/constants';
import styles from '../service.module.css';

interface ServiceFormModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: () => void;
  units: any[];
  partners: any[];
  technicianOptions?: { value: string; label: string; badge?: string }[];
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
  ticketType?: 'NEW' | 'FOLLOW_UP';
  setTicketType?: (v: 'NEW' | 'FOLLOW_UP') => void;
  existingCallId?: string;
  setExistingCallId?: (v: string) => void;
  existingCallIds?: string[];
}

const fieldStyle: React.CSSProperties = {
  width: '100%',
  marginTop: '6px',
  padding: '10px 14px',
  borderRadius: '8px',
  border: '1px solid #CBD5E1',
  fontSize: '0.9rem',
  color: '#001F3F',
  outline: 'none',
  background: '#fff',
  fontFamily: 'inherit',
  transition: 'border-color 0.2s',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 700,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: '4px',
};

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
  padding: '16px',
  background: '#F8FAFC',
  borderRadius: '10px',
  border: '1px solid #E2E8F0',
};

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
      <div style={{ color: '#2E5BFF', display: 'flex' }}>{icon}</div>
      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#001F3F', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{title}</span>
    </div>
  );
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
    ticketType = 'NEW', setTicketType,
    existingCallId = '', setExistingCallId,
    existingCallIds = [],
  } = props;

  if (!show) return null;

  const selectedUnit = units.find(u => u.id === selectedUnitId);
  const autoUnitType = selectedUnit ? getUnitType(selectedUnit.model_name) : null;

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!selectedUnitId) { setFormError('Pilih Unit yang bermasalah terlebih dahulu.'); return; }
    if (ticketType === 'FOLLOW_UP' && !existingCallId.trim()) {
      setFormError('Pilih ID Tiket / Call ID yang ingin di-follow-up.');
      return;
    }
    if (!issueDescription.trim()) { setFormError('Tuliskan Deskripsi Kendala.'); return; }
    if (!actionTaken.trim()) { setFormError('Tuliskan Tindakan / Penanganan Awal.'); return; }
    onSubmit();
  };

  return (
    <div className={styles.modalOverlay}>
      <form onSubmit={handlePreSubmit} autoComplete="off" className={styles.modalCard} style={{ maxWidth: '580px' }}>
        {/* Header */}
        <header className={styles.modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(46,91,255,0.1)', color: '#2E5BFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ClipboardList size={18} />
            </div>
            <div>
              <h3 className={styles.modalTitle} style={{ marginBottom: '1px' }}>Catat Permintaan Servis</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Isi form berikut untuk merekam tiket servis baru</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className={styles.closeBtn}><X size={20} /></button>
        </header>

        <div className={styles.modalBody} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {formError && <div className={styles.errorAlert}>{formError}</div>}

          {/* ── SECTION 1: Tipe Tiket & Call ID ── */}
          <div style={sectionStyle}>
            <SectionHeader icon={<Hash size={14} />} title="Tipe & ID Tiket" />

            {/* Radio Toggle — pill style */}
            <div style={{ display: 'flex', background: '#E2E8F0', borderRadius: '8px', padding: '3px', gap: '3px' }}>
              {(['NEW', 'FOLLOW_UP'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTicketType && setTicketType(type)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    background: ticketType === type ? '#001F3F' : 'transparent',
                    color: ticketType === type ? '#fff' : '#64748b',
                    boxShadow: ticketType === type ? '0 2px 6px rgba(0,31,63,0.2)' : 'none',
                  }}
                >
                  {type === 'NEW' ? 'Tiket Baru' : 'Follow-up Tiket'}
                </button>
              ))}
            </div>

            {/* Call ID Field */}
            {ticketType === 'FOLLOW_UP' ? (
              <div>
                <label style={labelStyle}>Pilih Call ID Lama *</label>
                <CustomSelect
                  value={existingCallId}
                  onChange={(val) => setExistingCallId && setExistingCallId(val)}
                  options={[
                    { value: '', label: '— Pilih Call ID —' },
                    ...existingCallIds.map((cid) => ({ value: cid, label: `#${cid}` }))
                  ]}
                />
              </div>
            ) : (
              <div>
                <label style={labelStyle}>Call ID <span style={{ color: '#94a3b8', fontWeight: 400, textTransform: 'none' }}>(opsional — kosongkan untuk otomatis)</span></label>
                <input
                  type="text"
                  placeholder="Contoh: 456 atau 18.001"
                  value={existingCallId}
                  onChange={(e) => setExistingCallId && setExistingCallId(e.target.value)}
                  style={fieldStyle}
                />
              </div>
            )}
          </div>

          {/* ── SECTION 2: Unit Mesin ── */}
          <div style={sectionStyle}>
            <SectionHeader icon={<Cpu size={14} />} title="Unit Bermasalah" />

            <div>
              <label style={labelStyle}>Customer, Branch & Serial Number *</label>
              <CustomSelect
                value={selectedUnitId}
                onChange={(val) => setSelectedUnitId(val)}
                options={[
                  { value: '', label: '— Cari & Pilih Unit —' },
                  ...units.map((u) => {
                    const clientName = u.current_client?.company_name || u.client?.company_name || 'Customer Umum';
                    const branch = u.current_client?.branch || u.current_client?.address || '';
                    const branchLabel = branch ? ` [${branch}]` : '';
                    return {
                      value: u.id,
                      label: `${clientName}${branchLabel} — ${u.model_name} (SN: ${u.serial_number || '-'})`
                    };
                  })
                ]}
              />
            </div>

            {/* Preview unit terpilih */}
            {selectedUnit && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', padding: '12px 14px', background: '#fff', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.82rem' }}>
                <div><span style={{ color: '#94a3b8', fontWeight: 600 }}>Customer</span><br /><span style={{ color: '#001F3F', fontWeight: 700 }}>{selectedUnit.current_client?.company_name || '-'}</span></div>
                <div><span style={{ color: '#94a3b8', fontWeight: 600 }}>Branch</span><br /><span style={{ color: '#001F3F' }}>{selectedUnit.current_client?.branch || selectedUnit.current_client?.address || '-'}</span></div>
                <div><span style={{ color: '#94a3b8', fontWeight: 600 }}>Model</span><br /><span style={{ color: '#001F3F', fontWeight: 700 }}>{selectedUnit.model_name}</span></div>
                <div><span style={{ color: '#94a3b8', fontWeight: 600 }}>Serial Number</span><br /><span style={{ color: '#001F3F' }}>{selectedUnit.serial_number || '-'}</span></div>
                {selectedUnit.current_client?.phone || selectedUnit.current_client?.contact_person ? (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span style={{ color: '#94a3b8', fontWeight: 600 }}>Kontak Klien</span><br />
                    <span style={{ color: '#001F3F' }}>{selectedUnit.current_client?.phone || selectedUnit.current_client?.contact_person}</span>
                  </div>
                ) : null}
              </div>
            )}

            {autoUnitType && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: UNIT_TYPE_COLORS[autoUnitType].bg, border: `1px solid ${UNIT_TYPE_COLORS[autoUnitType].border}`, borderRadius: '6px', fontSize: '0.78rem', color: UNIT_TYPE_COLORS[autoUnitType].color, fontWeight: 700, width: 'fit-content' }}>
                Kategori: {UNIT_TYPE_LABELS[autoUnitType]}
              </div>
            )}
          </div>

          {/* ── SECTION 3: Laporan Kendala ── */}
          <div style={sectionStyle}>
            <SectionHeader icon={<ClipboardList size={14} />} title="Laporan Kendala" />

            <div>
              <label style={labelStyle}>Jenis Pekerjaan *</label>
              <CustomSelect value={taskType} onChange={(val) => setTaskType(val)}
                options={[
                  { value: 'CORRECTIVE', label: 'Servis Perbaikan (Corrective)' },
                  { value: 'PREVENTIVE', label: 'Perawatan Rutin (Preventive)' },
                  { value: 'INSTALLATION', label: 'Pengiriman & Instalasi (Delivery)' },
                ]} />
            </div>

            <div>
              <label style={labelStyle}>Deskripsi Kendala yang Dilaporkan *</label>
              <textarea
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="Contoh: Showcase minuman bocor, berisik / Suhu tidak dingin seperti biasanya..."
                autoComplete="new-password"
                required
                style={{ ...fieldStyle, minHeight: '80px', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Status *</label>
                <CustomSelect value={status} onChange={(val) => setStatus(val)}
                  options={[
                    { value: 'PENDING', label: 'PENDING' },
                    { value: 'IN PROGRESS', label: 'IN PROGRESS' },
                    { value: 'COMPLETED', label: 'COMPLETED' },
                    { value: 'CANCELED', label: 'CANCELED' },
                  ]} />
              </div>
              <div>
                <label style={labelStyle}>Date Complain *</label>
                <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} required style={fieldStyle} />
              </div>
            </div>
          </div>

          {/* ── SECTION 4: Penugasan & Tindakan ── */}
          <div style={sectionStyle}>
            <SectionHeader icon={<UserCheck size={14} />} title="Penugasan & Tindakan Awal" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Mitra Regional / Workshop</label>
                <CustomSelect value={selectedPartnerId} onChange={(val) => setSelectedPartnerId(val)}
                  options={[{ value: '', label: 'HQ (Manual Routing)' }, ...partners.map((p) => ({ value: p.id, label: `${p.partner_name} (${p.city})` }))]} />
              </div>
              <div>
                <label style={labelStyle}>Teknisi Bertugas (Multi-Select)</label>
                <MultiSelect
                  value={technicianName && technicianName !== 'Menunggu Alokasi' ? technicianName.split(',').map((s: string) => s.trim()).filter(Boolean) : []}
                  onChange={(arr) => setTechnicianName(arr.length > 0 ? arr.join(', ') : 'Menunggu Alokasi')}
                  options={props.technicianOptions || [
                    { value: 'Budi Santoso', label: 'Budi Santoso' },
                    { value: 'Andi Wijaya', label: 'Andi Wijaya' },
                    { value: 'Mutiara', label: 'Mutiara' },
                  ]}
                  placeholder="Pilih teknisi..."
                  fullWidth
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Handling Awal (Tindakan / Pemeriksaan) *</label>
              <textarea
                value={actionTaken}
                onChange={(e) => setActionTaken(e.target.value)}
                placeholder="Contoh: Setelah dicek kabel putus, setting ulang kalibrasi suhu..."
                autoComplete="new-password"
                required
                style={{ ...fieldStyle, minHeight: '70px', resize: 'vertical' }}
              />
            </div>

            {taskType === 'INSTALLATION' && (
              <div>
                <label style={labelStyle}><Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />Date Delivery / Pengiriman</label>
                <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} style={fieldStyle} />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className={styles.modalFooter}>
          <button type="button" onClick={onClose} className={styles.cancelBtn}>Batal</button>
          <button type="submit" disabled={submitting} className={styles.saveBtn}>
            {submitting
              ? <><Loader2 size={16} className={styles.spin} style={{ marginRight: '8px', display: 'inline' }} /><span>Menyimpan...</span></>
              : <span>Simpan Permintaan</span>}
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
      <div className={styles.modalCard} style={{ maxWidth: '420px', padding: '32px', textAlign: 'center', alignItems: 'center', gap: '20px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(46,91,255,0.08)', color: '#2E5BFF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
          <HelpCircle size={28} />
        </div>
        <h3 className={styles.modalTitle} style={{ marginTop: '4px' }}>Simpan Permintaan Servis?</h3>
        <p style={{ margin: '0 0 8px', fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6 }}>
          Apakah Anda yakin ingin merekam permintaan servis ini ke dalam database portal?
        </p>
        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
          <button type="button" onClick={onCancel} className={styles.cancelBtn} style={{ flex: 1 }}>Batal</button>
          <button type="button" onClick={onConfirm} className={styles.saveBtn} style={{ flex: 1 }}>Ya, Simpan</button>
        </div>
      </div>
    </div>
  );
}
