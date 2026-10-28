import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, MessageSquare, FilePlus, FileText, ExternalLink, Edit2, Check, Wrench, Plus, Trash2, Package, Search } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { reportApi, sparepartApi } from '@/lib/api';
import { HOLIC_SPAREPARTS_INVENTORY } from '@/lib/spareparts-inventory';
import { parseDetailedIssue, formatDate } from '../utils';
import { getUnitType, UNIT_TYPE_LABELS, UNIT_TYPE_COLORS } from '../../id/[token]/constants';
import CompleteSparepartModal from './CompleteSparepartModal';
import styles from '../service.module.css';

interface ServiceDetailModalProps {
  log: any;
  partners: any[];
  technicianOptions?: { value: string; label: string; badge?: string }[];
  onClose: () => void;
  onUpdate: (updatedLog: any) => void;
  submitting: boolean;
  setSubmitting: (v: boolean) => void;
}

export default function ServiceDetailModal({ log, partners, technicianOptions = [], onClose, onUpdate, submitting, setSubmitting }: ServiceDetailModalProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editPartnerId, setEditPartnerId] = useState(log.partner?.id || '');
  const [editTechnician, setEditTechnician] = useState(log.technician_name || '');
  const [editStatus, setEditStatus] = useState(log.status || 'PENDING');
  const [editDate, setEditDate] = useState(log.service_date ? log.service_date.split('T')[0] : '');
  const [editActionTaken, setEditActionTaken] = useState(log.action_taken || '');
  const [editResult, setEditResult] = useState(log.planning_notes || '');
  const [editScheduledDate, setEditScheduledDate] = useState(log.scheduled_date ? log.scheduled_date.split('T')[0] : '');
  const [editDeliveryDate, setEditDeliveryDate] = useState(log.delivery_date ? log.delivery_date.split('T')[0] : '');
  const [editInternalNotes, setEditInternalNotes] = useState(log.internal_notes || '');
  // Sparepart list as array for tag editing
  const parseSparepartStr = (str: string) => str ? str.split(';').map((s: string) => s.trim()).filter(Boolean) : [];
  const [editSparepartItems, setEditSparepartItems] = useState<string[]>(parseSparepartStr(log.replaced_sparepart || ''));
  const [sparepartSearch, setSparepartSearch] = useState('');
  const [showSparepartDropdown, setShowSparepartDropdown] = useState(false);
  const editReplacedSparepart = editSparepartItems.join('; ');

  // Laporan Kendala revision state
  const [isEditingIssue, setIsEditingIssue] = useState(false);
  const [editedIssueDesc, setEditedIssueDesc] = useState(log.issue_description || '');

  // Trigger Complete Sparepart Modal
  const [showCompleteSparepartModal, setShowCompleteSparepartModal] = useState(false);

  const [linkedReports, setLinkedReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // Sync state ketika log prop berubah dari parent (setelah save)
  useEffect(() => {
    if (!isEditing) {
      setEditPartnerId(log.partner?.id || '');
      setEditTechnician(log.technician_name || '');
      setEditStatus(log.status || 'PENDING');
      setEditDate(log.service_date ? log.service_date.split('T')[0] : '');
      setEditActionTaken(log.action_taken || '');
      setEditResult(log.planning_notes || '');
      setEditScheduledDate(log.scheduled_date ? log.scheduled_date.split('T')[0] : '');
      setEditDeliveryDate(log.delivery_date ? log.delivery_date.split('T')[0] : '');
      setEditInternalNotes(log.internal_notes || '');
      setEditSparepartItems(parseSparepartStr(log.replaced_sparepart || ''));
      setSparepartSearch('');
      setShowSparepartDropdown(false);
      setEditedIssueDesc(log.issue_description || '');
    }
  }, [log.id, log.internal_notes, log.planning_notes, log.action_taken, log.replaced_sparepart, log.status]);

  useEffect(() => {
    if (!log?.id && !log?.call_id) return;
    const targetId = log.call_id || log.id;
    setLoadingReports(true);
    reportApi.findByServiceLog(targetId)
      .then(({ data }) => setLinkedReports(Array.isArray(data) ? data : (data.data || [])))
      .catch(() => setLinkedReports([]))
      .finally(() => setLoadingReports(false));
  }, [log]);


  const startEditing = () => {
    setEditPartnerId(log.partner?.id || '');
    setEditTechnician(log.technician_name || '');
    setEditStatus(log.status || 'PENDING');
    setEditDate(log.service_date ? log.service_date.split('T')[0] : '');
    setEditActionTaken(log.action_taken || '');
    setEditResult(log.planning_notes || '');
    setEditScheduledDate(log.scheduled_date ? log.scheduled_date.split('T')[0] : '');
    setEditDeliveryDate(log.delivery_date ? log.delivery_date.split('T')[0] : '');
    setEditInternalNotes(log.internal_notes || '');
    setEditSparepartItems(parseSparepartStr(log.replaced_sparepart || ''));
    setSparepartSearch('');
    setShowSparepartDropdown(false);
    setIsEditing(true);
  };

  const handleStatusChangeInEdit = (val: string) => {
    setEditStatus(val);
    if (val === 'COMPLETED' && log.status !== 'COMPLETED') {
      setShowCompleteSparepartModal(true);
    }
  };

  const handleSaveIssueRevision = async () => {
    try {
      setSubmitting(true);
      const { serviceLogApi } = await import('@/lib/api');
      const { data: updated } = await serviceLogApi.update(log.id, {
        issue_description: editedIssueDesc.trim(),
      });
      onUpdate(updated);
      setIsEditingIssue(false);
    } catch {
      alert('Gagal merevisi laporan kendala.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSave = async (overrideSpareparts?: string) => {
    try {
      setSubmitting(true);
      const { serviceLogApi } = await import('@/lib/api');
      const payload: any = {
        partnerId: editPartnerId || null,
        technician_name: editTechnician,
        status: editStatus,
        service_date: editDate,
        scheduled_date: editScheduledDate || null,
        delivery_date: editDeliveryDate || null,
        action_taken: editActionTaken.trim() || undefined,
        planning_notes: editResult.trim() || null,
        internal_notes: editInternalNotes.trim() || null,
        is_allocated: !!(editTechnician || editPartnerId),
        replaced_sparepart: overrideSpareparts !== undefined
          ? overrideSpareparts
          : (editSparepartItems.length > 0 ? editSparepartItems.join('; ') : null),
      };
      const { data: updated } = await serviceLogApi.update(log.id, payload);
      onUpdate(updated);
      setIsEditing(false);
      setShowCompleteSparepartModal(false);
    } catch { alert('Gagal memperbarui kondisi dan penugasan servis.'); }
    finally { setSubmitting(false); }
  };

  const parsed = parseDetailedIssue(log.issue_description);
  const autoUnitType = log.unit ? getUnitType(log.unit.model_name) : null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '660px' }}>
        <header className={styles.modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h3 className={styles.modalTitle}>Detail Permintaan Servis #{log.id}</h3>
            <span className={`${styles.badge} ${log.status === 'PENDING' ? styles.badgePending : log.status === 'IN PROGRESS' ? styles.badgeInProgress : log.status === 'COMPLETED' ? styles.badgeCompleted : styles.badgeCancelled}`}>
              Kondisi: {log.status}
            </span>
          </div>
          <button type="button" onClick={onClose} className={styles.closeBtn}><X size={20} /></button>
        </header>

        <div className={styles.modalBody}>
          {/* Section 1: Unit Mesin */}
          <div className={styles.detailSection}>
            <h4 className={styles.detailSectionTitle}>Unit Mesin</h4>
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}><span className={styles.detailLabel}>Model Unit</span><span className={styles.detailValue} style={{ fontWeight: 700, color: 'var(--color-deep-navy)' }}>{log.unit?.model_name || '-'}</span></div>
              <div className={styles.detailItem}><span className={styles.detailLabel}>Kategori Unit</span>{autoUnitType ? <span style={{ padding: '4px 8px', background: UNIT_TYPE_COLORS[autoUnitType].bg, border: `1px solid ${UNIT_TYPE_COLORS[autoUnitType].border}`, borderRadius: '6px', fontSize: '0.75rem', color: UNIT_TYPE_COLORS[autoUnitType].color, fontWeight: 700, display: 'inline-block', width: 'fit-content' }}>{UNIT_TYPE_LABELS[autoUnitType]}</span> : <span className={styles.detailValue}>-</span>}</div>
              <div className={styles.detailItem}><span className={styles.detailLabel}>Serial Number</span><span className={styles.detailValuePrimary} style={{ color: '#001870ff', fontWeight: 800 }}>{log.unit?.serial_number || '-'}</span></div>
              <div className={styles.detailItem}><span className={styles.detailLabel}>Customer</span><span className={styles.detailValue} style={{ fontWeight: 700, color: 'var(--color-deep-navy)' }}>{log.unit?.current_client?.company_name || 'Umum / Belum Terikat'}</span></div>
              <div className={styles.detailItem}><span className={styles.detailLabel}>Kontak Klien</span><span className={styles.detailValue} style={{ color: 'var(--color-deep-navy)', fontWeight: 600 }}>{parsed.contactPhone !== '-' ? parsed.contactPhone : (log.unit?.current_client?.phone || log.unit?.current_client?.contact_person || '-')}</span></div>
              <div className={styles.detailItem}><span className={styles.detailLabel}>Lokasi Kota Unit</span><span className={styles.detailValue}>{log.unit?.current_client?.city || log.unit?.specs?.city || 'Jakarta'}</span></div>
            </div>
          </div>

          {/* Section 2: Kendala (Laporan Kendala yang bisa direvisi) */}
          <div className={styles.detailSection}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h4 className={styles.detailSectionTitle} style={{ margin: 0 }}>Laporan Kendala</h4>
              {!isEditingIssue ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditedIssueDesc(log.issue_description || '');
                    setIsEditingIssue(true);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#04213dff',
                    color: '#ffffffff',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Edit2 size={12} /> Revisi Kendala
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setIsEditingIssue(false)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      background: '#FF6B00',
                      color: '#ffffff',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveIssueRevision}
                    disabled={submitting}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      background: '#04573bff',
                      color: '#fff',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <Check size={12} /> Simpan Revisi
                  </button>
                </div>
              )}
            </div>

            {isEditingIssue ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Edit deskripsi masalah kendala di bawah:</span>
                <textarea
                  value={editedIssueDesc}
                  onChange={(e) => setEditedIssueDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #2E5BFF',
                    fontSize: '0.88rem',
                    color: 'var(--color-deep-navy)',
                    minHeight: '80px',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            ) : (
              <div className={styles.detailGrid}>
                <div className={styles.detailItemFull}>
                  <span className={styles.detailLabel}>Deskripsi Masalah Awal</span>
                  <span className={styles.detailValue} style={{ fontWeight: 600, color: 'var(--color-deep-navy)', lineHeight: 1.6 }}>{parsed.remark || log.issue_description || '-'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Record Penugasan & Tindakan */}
          <div className={styles.detailSection}>
            <h4 className={styles.detailSectionTitle}>Record Penugasan & Tindakan</h4>
            <div className={styles.detailGrid}>
              {isEditing ? (<>
                <div className={styles.detailItemFull}><span className={styles.detailLabel}>Mitra Regional Terpilih</span>
                  <CustomSelect value={editPartnerId} onChange={(val) => setEditPartnerId(val)}
                    options={[{ value: '', label: 'HQ (Manual Routing)' }, ...partners.map((p) => ({ value: p.id, label: `${p.partner_name} (${p.city})` }))]} />
                </div>
                <div className={styles.detailItem}><span className={styles.detailLabel}>Teknisi Bertugas (Multi-Select)</span>
                  <MultiSelect
                    value={editTechnician ? editTechnician.split(',').map((s: string) => s.trim()).filter(Boolean) : []}
                    onChange={(arr) => setEditTechnician(arr.join(', '))}
                    options={technicianOptions}
                    placeholder="Pilih teknisi..."
                    fullWidth
                  />
                </div>
                <div className={styles.detailItem}><span className={styles.detailLabel}>Scheduled Date</span>
                  <input type="date" value={editScheduledDate} onChange={(e) => setEditScheduledDate(e.target.value)}
                    style={{ width: '100%', marginTop: '4px', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.9rem', color: 'var(--color-deep-navy)', outline: 'none' }} />
                </div>
                <div className={styles.detailItemFull}><span className={styles.detailLabel}>Kondisi Servis</span>
                  <CustomSelect value={editStatus} onChange={handleStatusChangeInEdit}
                    options={[{ value: 'PENDING', label: 'PENDING' }, { value: 'IN PROGRESS', label: 'IN PROGRESS' }, { value: 'COMPLETED', label: 'COMPLETED' }, { value: 'CANCELED', label: 'CANCELED' }]} />
                </div>
                <div className={styles.detailItemFull}><span className={styles.detailLabel}>Handling (Tindakan / Penanganan Lapangan)</span>
                  <textarea value={editActionTaken} onChange={(e) => setEditActionTaken(e.target.value)}
                    placeholder="Tuliskan tindakan perbaikan yang dilakukan..."
                    style={{ width: '100%', marginTop: '4px', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.9rem', color: 'var(--color-deep-navy)', outline: 'none', minHeight: '60px', fontFamily: 'inherit', resize: 'vertical' }} />
                </div>
                <div className={styles.detailItemFull}><span className={styles.detailLabel}>Result (Hasil Akhir Servis)</span>
                  <input type="text" value={editResult} onChange={(e) => setEditResult(e.target.value)}
                    placeholder="Contoh: Unit normal, suhu mencapai -18°C"
                    style={{ width: '100%', marginTop: '4px', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.9rem', color: 'var(--color-deep-navy)', outline: 'none' }} />
                </div>
                <div className={styles.detailItemFull}>
                  <span className={styles.detailLabel}>Sparepart Diganti</span>
                  {/* Tag pills display */}
                  {editSparepartItems.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px', marginBottom: '8px' }}>
                      {editSparepartItems.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(46,91,255,0.07)', border: '1px solid rgba(46,91,255,0.2)', borderRadius: '8px', padding: '5px 10px' }}>
                          <Package size={13} style={{ color: '#2E5BFF', flexShrink: 0 }} />
                          <span style={{ flex: 1, fontSize: '0.85rem', color: '#1E40AF', fontWeight: 600 }}>{item}</span>
                          <button
                            type="button"
                            onClick={() => setEditSparepartItems(prev => prev.filter((_, i) => i !== idx))}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
                            title="Hapus sparepart ini"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Searchable dropdown dari inventory */}
                  <div style={{ position: 'relative', marginTop: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '2px solid #2E5BFF', borderRadius: '8px', padding: '8px 12px', background: '#fff' }}>
                      <Package size={15} style={{ color: '#2E5BFF', flexShrink: 0 }} />
                      <input
                        type="text"
                        value={sparepartSearch}
                        onChange={(e) => { setSparepartSearch(e.target.value); setShowSparepartDropdown(true); }}
                        onFocus={() => setShowSparepartDropdown(true)}
                        placeholder="+ Tambah Sparepart..."
                        style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.88rem', color: 'var(--color-deep-navy)', background: 'transparent', fontWeight: 500 }}
                      />
                      {sparepartSearch && (
                        <button type="button" onClick={() => { setSparepartSearch(''); setShowSparepartDropdown(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', padding: 0 }}><X size={14} /></button>
                      )}
                    </div>
                    {showSparepartDropdown && (() => {
                      const filtered = HOLIC_SPAREPARTS_INVENTORY.filter(sp =>
                        !editSparepartItems.includes(sp.name) &&
                        (sp.name.toLowerCase().includes(sparepartSearch.toLowerCase()) || sp.category.toLowerCase().includes(sparepartSearch.toLowerCase()))
                      );
                      if (filtered.length === 0) return null;
                      // Group by category
                      const grouped = filtered.reduce<Record<string, typeof filtered>>((acc, sp) => {
                        if (!acc[sp.category]) acc[sp.category] = [];
                        acc[sp.category].push(sp);
                        return acc;
                      }, {});
                      return (
                        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 9999, maxHeight: '220px', overflowY: 'auto' }}>
                          {Object.entries(grouped).map(([cat, items]) => (
                            <div key={cat}>
                              <div style={{ padding: '6px 12px 3px', fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>{cat}</div>
                              {items.map(sp => (
                                <button
                                  key={sp.id}
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    setEditSparepartItems(prev => [...prev, sp.name]);
                                    setSparepartSearch('');
                                    setShowSparepartDropdown(false);
                                  }}
                                  style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 14px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.84rem', color: 'var(--color-deep-navy)', transition: 'background 0.15s' }}
                                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(46,91,255,0.06)')}
                                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                                >
                                  <Package size={12} style={{ color: '#2E5BFF', flexShrink: 0 }} />
                                  <span style={{ flex: 1 }}>{sp.name}</span>
                                  <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{sp.partNumber}</span>
                                </button>
                              ))}
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                    {showSparepartDropdown && <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={() => setShowSparepartDropdown(false)} />}
                  </div>
                </div>
                <div className={styles.detailItemFull}><span className={styles.detailLabel}>Catatan Internal (Khusus Admin)</span>
                  <textarea value={editInternalNotes} onChange={(e) => setEditInternalNotes(e.target.value)}
                    placeholder="Catatan khusus admin servis call..."
                    style={{ width: '100%', marginTop: '4px', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.9rem', color: 'var(--color-deep-navy)', outline: 'none', minHeight: '60px', fontFamily: 'inherit', resize: 'vertical', background: '#F8FAFC' }} />
                </div>
              </>) : (
                <div className={styles.detailItemFull}>
                  <div className={styles.detailStructuredBox}>
                    {/* Row 1: Jenis Pekerjaan */}
                    <div className={styles.detailStructuredRow}>
                      <div className={styles.detailStructuredLabel}>Jenis Pekerjaan</div>
                      <div className={styles.detailStructuredVal}>
                        {(() => {
                          const tType = log.task_type || 'CORRECTIVE';
                          const tLabel: Record<string, string> = { CORRECTIVE: 'Servis Perbaikan', PREVENTIVE: 'Perawatan Rutin', INSTALLATION: 'Delivery & Instalasi' };
                          const tColor: Record<string, { bg: string, color: string, border: string }> = {
                            CORRECTIVE: { bg: 'rgba(255,107,0,0.1)', color: '#FF6B00', border: 'rgba(255,107,0,0.25)' },
                            PREVENTIVE: { bg: 'rgba(46,91,255,0.1)', color: '#2E5BFF', border: 'rgba(46,91,255,0.25)' },
                            INSTALLATION: { bg: 'rgba(16,185,129,0.1)', color: '#059669', border: 'rgba(16,185,129,0.25)' },
                          };
                          const c = tColor[tType] || tColor.CORRECTIVE;
                          return (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: c.bg,
                              color: c.color,
                              border: `1px solid ${c.border}`,
                              width: 'fit-content',
                              lineHeight: '1.2'
                            }}>
                              {tLabel[tType] || tType}
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Row 2: Mitra Regional */}
                    <div className={styles.detailStructuredRow}>
                      <div className={styles.detailStructuredLabel}>Mitra Regional</div>
                      <div className={styles.detailStructuredVal}>
                        {log.partner ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span>{log.partner.partner_name} ({log.partner.city})</span>
                            {log.partner.contact_wa && (
                              <a href={`https://wa.me/${log.partner.contact_wa}`} target="_blank" rel="noopener noreferrer" className={styles.waBtn} style={{ marginTop: 0, padding: '3px 8px', fontSize: '0.72rem' }}>
                                <MessageSquare size={12} />
                                <span>WA: {log.partner.contact_wa}</span>
                              </a>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontStyle: 'italic', color: '#64748B' }}>HQ (Manual Routing)</span>
                        )}
                      </div>
                    </div>

                    {/* Row 2b: Teknisi Lapangan (Bisa Multi) */}
                    <div className={styles.detailStructuredRow}>
                      <div className={styles.detailStructuredLabel}>Teknisi Bertugas</div>
                      <div className={styles.detailStructuredVal}>
                        {log.technician_name ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                            {log.technician_name.split(',').map((tName: string, tIdx: number) => (
                              <span
                                key={tIdx}
                                style={{
                                  fontSize: '0.78rem',
                                  fontWeight: 600,
                                  background: 'rgba(46,91,255,0.08)',
                                  color: '#1E40AF',
                                  padding: '3px 9px',
                                  borderRadius: '6px',
                                  border: '1px solid rgba(46,91,255,0.2)',
                                  display: 'inline-block',
                                }}
                              >
                                {tName.trim()}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>Menunggu alokasi teknisi</span>
                        )}
                      </div>
                    </div>

                    {/* Row 3: Scheduled Date */}
                    <div className={styles.detailStructuredRow}>
                      <div className={styles.detailStructuredLabel}>Scheduled Date</div>
                      <div className={styles.detailStructuredVal}>
                        <span>{formatDate(log.scheduled_date || log.service_date)}</span>
                      </div>
                    </div>

                    {/* Row 4: Handling (Penanganan Lapangan) */}
                    <div className={styles.detailStructuredRow}>
                      <div className={styles.detailStructuredLabel}>Handling</div>
                      <div className={styles.detailStructuredVal} style={{ lineHeight: 1.5 }}>
                        {log.action_taken && log.action_taken !== 'Dalam proses pengecekan teknis.' ? (
                          <span>{log.action_taken}</span>
                        ) : (
                          <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>Menunggu penanganan teknisi.</span>
                        )}
                      </div>
                    </div>

                    {/* Row 5: Result (Hasil Servis) */}
                    <div className={styles.detailStructuredRow}>
                      <div className={styles.detailStructuredLabel}>Result</div>
                      <div className={styles.detailStructuredVal} style={{ lineHeight: 1.5 }}>
                        {log.planning_notes ? (
                          <span style={{ color: '#047857', fontWeight: 600 }}>{log.planning_notes}</span>
                        ) : log.status === 'COMPLETED' ? (
                          <span style={{ color: '#047857', fontWeight: 600 }}>Unit telah normal kembali</span>
                        ) : (
                          <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>Belum selesai</span>
                        )}
                      </div>
                    </div>

                    {/* Row 6: Sparepart Diganti */}
                    <div className={styles.detailStructuredRow}>
                      <div className={styles.detailStructuredLabel}>Sparepart Diganti</div>
                      <div className={styles.detailStructuredVal}>
                        {log.replaced_sparepart ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            {String(log.replaced_sparepart).split(';').map((s: string) => s.trim()).filter(Boolean).map((item: string, idx: number) => (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(46,91,255,0.07)', border: '1px solid rgba(46,91,255,0.18)', borderRadius: '7px', padding: '4px 10px', width: 'fit-content', maxWidth: '100%' }}>
                                <Package size={12} style={{ color: '#2E5BFF', flexShrink: 0 }} />
                                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#1E40AF' }}>{item}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontStyle: 'italic', color: '#94a3b8', fontSize: '0.82rem' }}>Tidak ada penggantian sparepart</span>
                        )}
                      </div>
                    </div>

                    {/* Row 7: Catatan Internal (Khusus Admin Servis) */}
                    <div className={styles.detailStructuredRow}>
                      <div className={styles.detailStructuredLabel}>Catatan Internal</div>
                      <div className={styles.detailStructuredVal} style={{ color: '#64748B', fontSize: '0.84rem' }}>
                        {log.internal_notes ? (
                          <span>{log.internal_notes}</span>
                        ) : (
                          <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>Tidak ada catatan internal admin.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <footer className={styles.modalFooter}>
          {isEditing ? (<>
            <button type="button" onClick={() => setIsEditing(false)} className={styles.cancelBtn} disabled={submitting}>Batal</button>
            <button type="button" onClick={() => handleSave()} className={styles.saveBtn} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
          </>) : (<>
            <button type="button" onClick={startEditing} className={styles.saveBtn} style={{ marginRight: 'auto', background: '#2E5BFF', color: '#FFFFFF' }}>Tindak Lanjuti / Edit</button>
            <button type="button" onClick={onClose} className={styles.cancelBtn}>Tutup</button>
          </>)}
        </footer>
      </div>

      {/* Popup Trigger Saat Kondisi Selesai / Complete */}
      <CompleteSparepartModal
        isOpen={showCompleteSparepartModal}
        ticketTitle={`Tiket #${log.call_id || log.id}`}
        unitModel={log.unit?.model_name}
        initialSpareparts={editSparepartItems.join('; ')}
        onCancel={() => setShowCompleteSparepartModal(false)}
        onConfirm={(spareparts) => {
          setEditSparepartItems(parseSparepartStr(spareparts));
          handleSave(spareparts);
        }}
        loading={submitting}
      />
    </div>
  );
}
