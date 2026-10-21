'use client';

import { useState } from 'react';
import { ArrowLeft, FileText, Check, CheckCircle2, ExternalLink, UserCheck, Plus, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import styles from '../id.module.css';

export interface SelectReportTypeModalProps {
  show: boolean;
  onClose: () => void;
  unit: any;
  unitReports?: any[];
  isAdmin?: boolean;
  editBlocks?: any;
  toggleEdit?: (block: any) => void;
  cancelEdit?: (block: any) => void;
  isSaving?: boolean;
  editData?: any;
  handleEditChange?: (field: string, value: any) => void;
  qcUploading?: Record<string, boolean>;
  handleQcFileUpload?: (fieldKey: string, file: File) => Promise<void>;
}

export default function SelectReportTypeModal({
  show,
  onClose,
  unit,
  unitReports = [],
  isAdmin = false,
  editBlocks = {},
  toggleEdit,
  cancelEdit,
  isSaving = false,
  editData = {},
  handleEditChange,
  qcUploading = {},
  handleQcFileUpload,
}: SelectReportTypeModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'reports' | 'create'>('reports');
  const isEditing = !!editBlocks?.qc;

  if (!show || !unit) return null;

  const coolingTypes = ['COOLING_1', 'COOLING_2', 'COOLING_3', 'COOLING_WARM'];
  const coolingLabels: Record<string, string> = {
    COOLING_1: '1 Suhu',
    COOLING_2: '2 Suhu (Cake & RTD)',
    COOLING_3: '3 Suhu (Cake, Ambient & RTD)',
    COOLING_WARM: 'Warm',
  };
  const coolingCountByType = coolingTypes.reduce((acc, t) => {
    acc[t] = unitReports.filter((r: any) => r.form_type === t).length;
    return acc;
  }, {} as Record<string, number>);
  const coolingTotal = Object.values(coolingCountByType).reduce((a, b) => a + b, 0);

  const qcItems = [
    { label: 'Test Run Results', urlKey: 'test_run_url', routePath: null, formType: null },
    { label: 'Cooling System Report', urlKey: 'cooling_report_url', routePath: '/reports/cooling', formType: '__COOLING__' },
    { label: 'Inspection Report', urlKey: 'inspection_url', routePath: '/reports/inspection', formType: 'INSPECTION' },
    { label: 'ITR', urlKey: 'itr_url', routePath: null, formType: null },
    { label: 'Work Order', urlKey: 'work_order_url', routePath: null, formType: null },
    { label: 'Component Reports', urlKey: 'component_reports_url', routePath: null, formType: null },
  ];

  const inspReport = unitReports.find((r: any) => r.form_type === 'INSPECTION');
  const inspData = inspReport?.data || {};
  const kaca = inspData.dimensions?.kaca || {};
  const works = inspData.works || [];
  const filledWorks = works.filter((w: any) => w.name && w.name.trim() !== '');
  const hasKaca = Object.values(kaca).some(v => v);
  const hasWorks = filledWorks.length > 0;

  const handleItemClick = (item: any) => {
    const url = unit?.specs?.[item.urlKey];
    const isReportLink = item.routePath !== null;
    const isCooling = item.formType === '__COOLING__';
    const unitParam = unit?.id ? `?unit=${unit.id}` : '';

    if (isReportLink) {
      if (isCooling) {
        if (coolingTotal === 1) {
          const r = unitReports.find((r: any) => coolingTypes.includes(r.form_type));
          if (r) { router.push(`/reports/view/${r.id}`); onClose(); return; }
        } else if (coolingTotal > 1) {
          router.push(`/reports/history?unit=${unit?.id}&type=COOLING_1`);
          onClose();
          return;
        }
        router.push(`/reports/cooling${unitParam}`);
      } else {
        const reportCount = unitReports.filter((r: any) => r.form_type === item.formType).length;
        if (reportCount === 1) {
          const r = unitReports.find((r: any) => r.form_type === item.formType);
          if (r) { router.push(`/reports/view/${r.id}`); onClose(); return; }
        } else if (reportCount > 1) {
          router.push(`/reports/history?unit=${unit?.id}&type=${item.formType}`);
          onClose();
          return;
        }
        router.push(`${item.routePath}${unitParam}`);
      }
      onClose();
    } else if (url) {
      window.open(typeof url === 'string' ? url : String(url), '_blank');
    }
  };

  const createReportTypes = [
    { name: 'Laporan Inspeksi (QC)', desc: 'Visual & Elektrikal', path: '/reports/inspection', color: '#3b82f6' },
    { name: 'Pendingin 1 Suhu', desc: 'Single Temperature Standard', path: '/reports/cooling', color: '#06b6d4' },
    { name: 'Pendingin 2 Suhu', desc: 'Dual Zone (Cake & RTD)', path: '/reports/cooling2', color: '#ec4899' },
    { name: 'Pendingin 3 Suhu', desc: 'Triple Zone (Cake, Ambient, RTD)', path: '/reports/cooling3', color: '#3b82f6' },
    { name: 'Pendingin Warm', desc: 'Pemanas / Warm Showcase', path: '/reports/reportwarm', color: '#f97316' },
    { name: 'QC Checklist Kaca', desc: 'Checklist Kaca & Rekondisi', path: '/reports/qc-service', color: '#10b981' },
    { name: 'Pengecekan Rework', desc: 'Hasil Pengerjaan Ulang', path: '/reports/rework', color: '#8b5cf6' },
  ];

  return (
    <div
      className={styles.modalOverlay}
      style={{
        zIndex: 1100,
        background: 'rgba(3, 8, 20, 0.78)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        className={styles.modalCard}
        style={{
          maxWidth: '860px',
          width: '100%',
          /* Contrast elevation: slate/graphite elevated glassmorphic panel to pop out cleanly from navy page */
          background: 'linear-gradient(165deg, #18233a 0%, #10192b 100%)',
          border: '1px solid rgba(147, 197, 253, 0.25)',
          borderRadius: '20px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08), 0 10px 30px rgba(46, 91, 255, 0.2)',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        
        {/* Header persis Gambar 1 & Gambar 2 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={20} color="#60a5fa" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '0.02em' }}>
              QC REPORTS
            </h2>
            <span style={{ fontSize: '0.75rem', background: 'rgba(96,165,250,0.15)', color: '#93c5fd', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
              {unit.serial_number}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Tombol Revisi / Batal & Simpan (Gambar 2) */}
            {isAdmin && toggleEdit && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {isEditing && cancelEdit && (
                  <button
                    type="button"
                    onClick={() => cancelEdit('qc')}
                    style={{
                      background: 'rgba(100, 116, 139, 0.25)',
                      border: '1px solid rgba(148, 163, 184, 0.4)',
                      color: '#e2e8f0',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Batal
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => toggleEdit('qc')}
                  style={{
                    background: isEditing ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(59, 130, 246, 0.2)',
                    border: isEditing ? '1px solid #10b981' : '1px solid rgba(96, 165, 250, 0.4)',
                    color: isEditing ? '#ffffff' : '#93c5fd',
                    padding: '6px 16px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: isEditing ? '0 2px 10px rgba(16, 185, 129, 0.4)' : 'none'
                  }}
                >
                  {isEditing ? (isSaving ? 'Menyimpan…' : 'Simpan') : 'Revisi'}
                </button>
              </div>
            )}

            {!isEditing && (
              <div style={{ display: 'flex', background: 'rgba(0,0,0,0.35)', padding: '3px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('reports')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '7px',
                    border: 'none',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: activeTab === 'reports' ? 'rgba(59,130,246,0.35)' : 'transparent',
                    color: activeTab === 'reports' ? '#fff' : '#94a3b8'
                  }}
                >
                  Daftar Dokumen
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('create')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '7px',
                    border: 'none',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: activeTab === 'create' ? 'rgba(59,130,246,0.35)' : 'transparent',
                    color: activeTab === 'create' ? '#fff' : '#94a3b8'
                  }}
                >
                  <Plus size={12} /> Buat Baru
                </button>
              </div>
            )}

            <button onClick={onClose} style={{ color: '#94a3b8', fontSize: '1.4rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>×</button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '22px 24px', maxHeight: '78vh', overflowY: 'auto' }}>
          {isEditing ? (
            /* Mode Revisi persis Gambar 2 */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                  DOKUMEN LAPORAN
                </p>
                <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '14px', lineHeight: 1.5 }}>
                  Laporan Test Run, Sistem Pendingin, dan Inspeksi dibuat melalui modul laporan.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Test Run upload */}
                  <div>
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>Test Run Results</p>
                    {editData.specs?.test_run_url ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '10px 14px', borderRadius: '8px' }}>
                        <CheckCircle2 size={14} /> File terupload
                        <button type="button" onClick={() => window.open(editData.specs.test_run_url, '_blank')} style={{ background: 'none', border: 'none', color: '#8bb2ff', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline' }}>Lihat</button>
                        <button type="button" onClick={() => handleEditChange && handleEditChange('specs.test_run_url', '')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem' }}>Hapus</button>
                      </div>
                    ) : (
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '8px', padding: '12px 14px', cursor: qcUploading['test_run_url'] ? 'not-allowed' : 'pointer', color: '#94a3b8', fontSize: '0.82rem', background: 'rgba(255,255,255,0.02)', opacity: qcUploading['test_run_url'] ? 0.6 : 1 }}>
                        <FileText size={16} />{qcUploading['test_run_url'] ? 'Mengupload...' : 'Klik untuk upload file (PDF/JPG/PNG)'}
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} disabled={qcUploading['test_run_url']} onChange={(e) => { const f = e.target.files?.[0]; if (f && handleQcFileUpload) handleQcFileUpload('test_run_url', f); }} />
                      </label>
                    )}
                  </div>

                  {/* Laporan Sistem Pendingin */}
                  <div>
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>Laporan Sistem Pendingin</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {[
                        { label: 'Cooling System Report 1 Suhu', path: '/reports/cooling', type: 'COOLING_1' },
                        { label: 'Cooling System Report 2 Suhu', path: '/reports/cooling2', type: 'COOLING_2' },
                        { label: 'Cooling System Report 3 Suhu', path: '/reports/cooling3', type: 'COOLING_3' },
                        { label: 'Cooling System Report Warm', path: '/reports/reportwarm', type: 'COOLING_WARM' }
                      ].map(({ label, path, type }) => {
                        const count = unitReports.filter((r: any) => r.form_type === type).length;
                        return (
                          <button
                            key={path}
                            type="button"
                            onClick={() => {
                              onClose();
                              if (count === 1) {
                                const r = unitReports.find((r: any) => r.form_type === type);
                                if (r) router.push(`/reports/view/${r.id}`);
                              } else if (count > 1) {
                                router.push(`/reports/history?unit=${unit?.id}&type=${type}`);
                              } else {
                                router.push(`${path}?unit=${unit?.id}`);
                              }
                            }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '10px',
                              background: 'rgba(30, 58, 110, 0.45)', border: '1px solid rgba(59, 130, 246, 0.3)',
                              borderRadius: '8px', padding: '10px 14px', cursor: 'pointer',
                              color: '#93c5fd', fontSize: '0.82rem', fontFamily: 'inherit', width: '100%'
                            }}
                          >
                            <FileText size={15} />
                            <span>{label}</span>
                            {count > 0 && <span style={{ marginLeft: '4px', background: 'rgba(16,185,129,0.2)', color: '#10b981', borderRadius: '10px', padding: '1px 6px', fontSize: '0.7rem', fontWeight: 700 }}>{count}</span>}
                            <ExternalLink size={13} style={{ marginLeft: 'auto' }} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Laporan Inspeksi */}
                  <div>
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>Laporan Inspeksi</p>
                    {(() => {
                      const count = unitReports.filter((r: any) => r.form_type === 'INSPECTION').length;
                      return (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            if (count === 1) {
                              const r = unitReports.find((r: any) => r.form_type === 'INSPECTION');
                              if (r) router.push(`/reports/view/${r.id}`);
                            } else if (count > 1) {
                              router.push(`/reports/history?unit=${unit?.id}&type=INSPECTION`);
                            } else {
                              router.push(`/reports/inspection?unit=${unit?.id}`);
                            }
                          }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            background: 'rgba(30, 58, 110, 0.45)', border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: '8px', padding: '10px 14px', cursor: 'pointer',
                            color: '#93c5fd', fontSize: '0.82rem', fontFamily: 'inherit', width: '100%'
                          }}
                        >
                          <FileText size={15} />
                          <span>{count > 0 ? `Lihat ${count} Inspection Report` : 'Buat Inspection Report (QC)'}</span>
                          {count > 0 && <span style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981', borderRadius: '10px', padding: '1px 6px', fontSize: '0.7rem', fontWeight: 700 }}>{count}</span>}
                          <ExternalLink size={13} style={{ marginLeft: 'auto' }} />
                        </button>
                      );
                    })()}
                  </div>

                  {/* ITR upload */}
                  {(() => {
                    const key = 'itr_url';
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600 }}>ITR — Inventory Transfer Request</label>
                        {editData.specs?.[key] ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '10px 14px', borderRadius: '8px' }}>
                            <CheckCircle2 size={14} /> File terupload
                            <button type="button" onClick={() => window.open(editData.specs[key], '_blank')} style={{ background: 'none', border: 'none', color: '#8bb2ff', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline' }}>Lihat</button>
                            <button type="button" onClick={() => handleEditChange && handleEditChange(`specs.${key}`, '')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem' }}>Hapus</button>
                          </div>
                        ) : (
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '8px', padding: '12px 14px', cursor: qcUploading[key] ? 'not-allowed' : 'pointer', color: '#94a3b8', fontSize: '0.82rem', background: 'rgba(255,255,255,0.02)', opacity: qcUploading[key] ? 0.6 : 1 }}>
                            <FileText size={16} />{qcUploading[key] ? 'Mengupload...' : 'Klik untuk upload file (PDF/JPG/PNG)'}
                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} disabled={qcUploading[key]} onChange={(e) => { const f = e.target.files?.[0]; if (f && handleQcFileUpload) handleQcFileUpload(key, f); }} />
                          </label>
                        )}
                      </div>
                    );
                  })()}

                  {/* Work Order upload */}
                  {(() => {
                    const key = 'work_order_url';
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600 }}>Work Order</label>
                        {editData.specs?.[key] ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '10px 14px', borderRadius: '8px' }}>
                            <CheckCircle2 size={14} /> File terupload
                            <button type="button" onClick={() => window.open(editData.specs[key], '_blank')} style={{ background: 'none', border: 'none', color: '#8bb2ff', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline' }}>Lihat</button>
                            <button type="button" onClick={() => handleEditChange && handleEditChange(`specs.${key}`, '')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem' }}>Hapus</button>
                          </div>
                        ) : (
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '8px', padding: '12px 14px', cursor: qcUploading[key] ? 'not-allowed' : 'pointer', color: '#94a3b8', fontSize: '0.82rem', background: 'rgba(255,255,255,0.02)', opacity: qcUploading[key] ? 0.6 : 1 }}>
                            <FileText size={16} />{qcUploading[key] ? 'Mengupload...' : 'Klik untuk upload file (PDF/JPG/PNG)'}
                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} disabled={qcUploading[key]} onChange={(e) => { const f = e.target.files?.[0]; if (f && handleQcFileUpload) handleQcFileUpload(key, f); }} />
                          </label>
                        )}
                      </div>
                    );
                  })()}

                  {/* Component Reports upload */}
                  {(() => {
                    const key = 'component_reports_url';
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600 }}>Component Reports</label>
                        {editData.specs?.[key] ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '10px 14px', borderRadius: '8px' }}>
                            <CheckCircle2 size={14} /> File terupload
                            <button type="button" onClick={() => window.open(editData.specs[key], '_blank')} style={{ background: 'none', border: 'none', color: '#8bb2ff', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline' }}>Lihat</button>
                            <button type="button" onClick={() => handleEditChange && handleEditChange(`specs.${key}`, '')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem' }}>Hapus</button>
                          </div>
                        ) : (
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '8px', padding: '12px 14px', cursor: qcUploading[key] ? 'not-allowed' : 'pointer', color: '#94a3b8', fontSize: '0.82rem', background: 'rgba(255,255,255,0.02)', opacity: qcUploading[key] ? 0.6 : 1 }}>
                            <FileText size={16} />{qcUploading[key] ? 'Mengupload...' : 'Klik untuk upload file (PDF/JPG/PNG)'}
                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} disabled={qcUploading[key]} onChange={(e) => { const f = e.target.files?.[0]; if (f && handleQcFileUpload) handleQcFileUpload(key, f); }} />
                          </label>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          ) : activeTab === 'reports' ? (
            /* Mode View List persis Gambar 1 */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {qcItems.map((item) => {
                const url = unit?.specs?.[item.urlKey];
                const isReportLink = item.routePath !== null;
                const isCooling = item.formType === '__COOLING__';
                const isClickable = isReportLink ? true : !!url;
                const reportCount = isCooling ? coolingTotal : (item.formType ? unitReports.filter((r: any) => r.form_type === item.formType).length : 0);

                return (
                  <div
                    key={item.label}
                    onClick={() => isClickable && handleItemClick(item)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '15px 18px',
                      background: isClickable ? 'rgba(23, 37, 66, 0.75)' : 'rgba(15, 23, 42, 0.5)',
                      borderRadius: '12px',
                      border: isClickable ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
                      cursor: isClickable ? 'pointer' : 'default',
                      transition: 'all 0.2s ease',
                      opacity: isClickable ? 1 : 0.6,
                    }}
                    onMouseEnter={(e) => {
                      if (isClickable) {
                        e.currentTarget.style.background = 'rgba(30, 58, 110, 0.85)';
                        e.currentTarget.style.borderColor = 'rgba(96, 165, 250, 0.6)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isClickable) {
                        e.currentTarget.style.background = 'rgba(23, 37, 66, 0.75)';
                        e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                      }
                    }}
                  >
                    <FileText size={18} color={isClickable ? '#60a5fa' : '#64748b'} style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: isClickable ? '#ffffff' : '#64748b' }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px' }}>
                        {isReportLink
                          ? (reportCount > 0 ? `${reportCount} laporan tersedia` : 'Belum ada laporan')
                          : (url ? 'Dokumen terlampir' : 'Belum ada dokumen')}
                      </div>
                    </div>
                    {isReportLink && reportCount > 0 && (
                      <span style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981', borderRadius: '10px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: 700 }}>
                        {reportCount}
                      </span>
                    )}
                    {isClickable && (
                      <ExternalLink size={15} color="#93c5fd" style={{ flexShrink: 0, opacity: 0.8 }} />
                    )}
                  </div>
                );
              })}

              {/* Glass Dimension & PIC (Source: Inspection Report) persis Gambar 1 */}
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '13px 18px',
                  background: 'rgba(23, 37, 66, 0.75)',
                  borderRadius: hasKaca ? '12px 12px 0 0' : '12px',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FileText size={17} color="#60a5fa" />
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f1f5f9' }}>
                      Glass Dimension (Source: Inspection Report)
                    </span>
                  </div>
                  {hasKaca ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(16,185,129,0.15)', color: '#34d399', borderRadius: '20px', padding: '3px 10px', fontSize: '0.72rem', fontWeight: 700 }}>
                      <Check size={12} /> Ada
                    </span>
                  ) : (
                    <span style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8', borderRadius: '20px', padding: '3px 10px', fontSize: '0.72rem', fontWeight: 600 }}>
                      Belum ada data
                    </span>
                  )}
                </div>
                {hasKaca && (
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    borderTop: 'none',
                    borderRadius: '0 0 12px 12px',
                    padding: '12px 18px',
                    display: 'flex',
                    gap: '20px',
                    flexWrap: 'wrap',
                    marginTop: '-8px'
                  }}>
                    {kaca.depan && <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Depan: <strong style={{ color: '#e2e8f0' }}>{kaca.depan}</strong></span>}
                    {kaca.samping && <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Samping: <strong style={{ color: '#e2e8f0' }}>{kaca.samping}</strong></span>}
                    {kaca.atas && <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Atas: <strong style={{ color: '#e2e8f0' }}>{kaca.atas}</strong></span>}
                    {kaca.pintu && <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Pintu: <strong style={{ color: '#e2e8f0' }}>{kaca.pintu}</strong></span>}
                    {kaca.tingkatan && <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Rak: <strong style={{ color: '#e2e8f0' }}>{kaca.tingkatan}</strong></span>}
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '13px 18px',
                  background: 'rgba(23, 37, 66, 0.75)',
                  borderRadius: hasWorks ? '12px 12px 0 0' : '12px',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <UserCheck size={17} color="#60a5fa" />
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f1f5f9' }}>
                      Production PIC (Source: Inspection Report)
                    </span>
                  </div>
                  {hasWorks ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(16,185,129,0.15)', color: '#34d399', borderRadius: '20px', padding: '3px 10px', fontSize: '0.72rem', fontWeight: 700 }}>
                      <Check size={12} /> {filledWorks.length} Personil
                    </span>
                  ) : (
                    <span style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8', borderRadius: '20px', padding: '3px 10px', fontSize: '0.72rem', fontWeight: 600 }}>
                      Belum ada data
                    </span>
                  )}
                </div>
                {hasWorks && (
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    borderTop: 'none',
                    borderRadius: '0 0 12px 12px',
                    padding: '14px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    marginTop: '-8px'
                  }}>
                    {filledWorks.map((w: any, idx: number) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: idx < filledWorks.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', paddingBottom: '6px' }}>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{w.label}</span>
                        <span style={{ fontSize: '0.8rem', color: '#e2e8f0', fontWeight: 600 }}>{w.name} {w.time ? `(${w.time} hari)` : ''}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Mode Buat Baru */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
              {createReportTypes.map(t => (
                <button
                  key={t.path}
                  type="button"
                  onClick={() => { router.push(`${t.path}?unit=${unit.id}`); onClose(); }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    padding: '16px',
                    background: 'rgba(23, 37, 66, 0.85)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: '#fff',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(30, 58, 110, 0.95)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(23, 37, 66, 0.85)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <FileText size={18} color={t.color} />
                    <ExternalLink size={13} color="#94a3b8" />
                  </div>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', marginTop: '6px' }}>{t.name}</span>
                  <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>{t.desc}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
