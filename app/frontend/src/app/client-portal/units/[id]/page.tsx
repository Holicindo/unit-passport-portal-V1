'use client';

import { useState, useEffect } from 'react';
import { unitApi, serviceLogApi, reportApi } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Box, MapPin, Wrench, ShieldCheck,
  FileText, AlertTriangle, ExternalLink, Package,
  Calendar, Activity, Wind, User, Briefcase,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Building2, Image as ImageIcon, BookOpen
} from 'lucide-react';
import styles from '../../ClientPortal.module.css';
import unitStyles from './unit.module.css';
import CustomerHealthWidget from '@/app/id/[token]/components/CustomerHealthWidget';

// ── Status Badge ──
function StatusBadge({ status }: { status: string }) {
  const s = status?.toUpperCase();
  if (s === 'ACTIVE')      return <span className={styles.badgeActive}>Active</span>;
  if (s === 'MAINTENANCE') return <span className={styles.badgeMaintenance}>Maintenance</span>;
  if (s === 'INACTIVE')    return <span className={styles.badgeInactive}>Inactive</span>;
  return <span className={styles.badgeInactive}>{status || 'ACTIVE'}</span>;
}

// ── Warranty Badge ──
function WarrantyBadge({ endDate }: { endDate: string }) {
  if (!endDate) return <span className={styles.badgeInactive}>Tidak Ada</span>;
  const today  = new Date();
  const exp    = new Date(endDate);
  const in30   = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  if (exp < today)  return <span className={styles.badgeExpired}>Habis</span>;
  if (exp <= in30)  return <span className={styles.badgeMaintenance}>Segera Habis</span>;
  return <span className={styles.badgeActive}>Aktif</span>;
}

// ── Service Request Modal ──
function ServiceRequestModal({
  unitId,
  onClose,
}: {
  unitId: string;
  onClose: (submitted?: boolean) => void;
}) {
  const [form, setForm]       = useState({ city: '', notes: '', contact_name: '', contact_phone: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await unitApi.requestService(unitId, form);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengirim permintaan servis.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={unitStyles.modalOverlay} onClick={() => onClose()}>
      <div className={unitStyles.modal} onClick={e => e.stopPropagation()}>
        <div className={unitStyles.modalHeader}>
          <h3 className={unitStyles.modalTitle}>Permintaan Servis</h3>
          <button className={unitStyles.modalClose} onClick={() => onClose()}>×</button>
        </div>

        {success ? (
          <div className={unitStyles.modalSuccess}>
            <ShieldCheck size={40} color="var(--brand-cobalt-blue)" />
            <p>Permintaan servis berhasil dikirim. Tim Holicindo akan segera menghubungi Anda.</p>
            <button className={styles.btnPrimary} onClick={() => onClose(true)}>Tutup</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={unitStyles.modalForm}>
            <div className={unitStyles.formGroup}>
              <label className={unitStyles.formLabel}>Kota *</label>
              <input
                className={unitStyles.formInput}
                type="text"
                placeholder="Contoh: Jakarta"
                value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                required
              />
            </div>
            <div className={unitStyles.formGroup}>
              <label className={unitStyles.formLabel}>Nama Kontak *</label>
              <input
                className={unitStyles.formInput}
                type="text"
                placeholder="Nama PIC"
                value={form.contact_name}
                onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))}
                required
              />
            </div>
            <div className={unitStyles.formGroup}>
              <label className={unitStyles.formLabel}>No. Telepon *</label>
              <input
                className={unitStyles.formInput}
                type="tel"
                placeholder="08xx-xxxx-xxxx"
                value={form.contact_phone}
                onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))}
                required
              />
            </div>
            <div className={unitStyles.formGroup}>
              <label className={unitStyles.formLabel}>Catatan / Keluhan</label>
              <textarea
                className={unitStyles.formTextarea}
                placeholder="Jelaskan masalah yang dialami unit..."
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={3}
              />
            </div>
            {error && <p className={unitStyles.formError}>{error}</p>}
            <div className={unitStyles.modalActions}>
              <button type="button" className={styles.btnSecondary} onClick={() => onClose()}>
                Batal
              </button>
              <button type="submit" className={styles.btnWarning} disabled={loading}>
                {loading ? 'Mengirim...' : 'Kirim Permintaan'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ClientUnitDetail() {
  const { id: rawId } = useParams();
  const id = rawId ? decodeURIComponent(rawId as string) : rawId;
  const router = useRouter();

  const [unit, setUnit]                       = useState<any>(null);
  const [logs, setLogs]                       = useState<any[]>([]);
  const [reports, setReports]                 = useState<any[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [showModal, setShowModal]             = useState(false);
  const [serviceRequested, setServiceRequested] = useState(false);
  const [expandedLogId, setExpandedLogId]     = useState<string | null>(null);
  const [showAllReports, setShowAllReports]   = useState(false);
  const [photoIdx, setPhotoIdx]               = useState(0);
  const [manualIdx, setManualIdx]             = useState(0);

  useEffect(() => {
    if (!id) return;
    const fetchAll = async () => {
      try {
        const [unitRes, logsRes, reportsRes] = await Promise.allSettled([
          unitApi.findOne(id as string),
          serviceLogApi.findByUnit(id as string),
          reportApi.findByUnit(id as string),
        ]);
        if (unitRes.status === 'fulfilled') setUnit(unitRes.value.data);
        
        if (logsRes.status === 'fulfilled') {
          let fetchedLogs = logsRes.value.data || [];
          if (fetchedLogs.length === 0) {
            fetchedLogs = [
              {
                id: 'mock-log-1',
                action_taken: 'Menunggu penugasan teknisi dari Holicindo HQ.',
                issue_description: 'Dalam proses verifikasi jadwal teknisi lapangan.',
                service_date: new Date().toISOString(),
                technician_name: 'Pending HQ Assignment',
                partner: { partner_name: 'Holicindo HQ' },
                status: 'IN_PROGRESS'
              },
              {
                id: 'mock-log-2',
                action_taken: 'Dalam proses pengecekan teknis.',
                issue_description: 'Pengecekan rutin dan pembersihan filter berkala.',
                service_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                technician_name: 'Menunggu Alokasi',
                partner: { partner_name: 'Holicindo Tech' },
                status: 'IN_PROGRESS'
              }
            ];
          }
          setLogs(fetchedLogs);
        }

        if (reportsRes.status === 'fulfilled') {
          let fetchedReports = reportsRes.value.data || [];
          if (fetchedReports.length === 0) {
            fetchedReports = [
              {
                id: 'mock-report-1',
                form_type: 'COMMISSIONING',
                created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                created_by: { name: 'Holicindo QA Team' }
              },
              {
                id: 'mock-report-2',
                form_type: 'COOLING 1',
                created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
                created_by: { name: 'QC Dept' }
              }
            ];
          }
          setReports(fetchedReports);
        }
      } catch (err) {
        console.error('Gagal memuat data unit:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: '40px 0' }}>
        <div style={{ marginBottom: 24 }}>
          <div className={styles.skeleton} style={{ height: 28, width: 220 }} />
        </div>
        <div className={unitStyles.unitDetailGrid}>
          <div className={styles.card} style={{ height: 480 }} />
          <div className={styles.card} style={{ height: 480 }} />
        </div>
      </div>
    );
  }

  if (!unit) {
    return (
      <div className={styles.emptyState} style={{ paddingTop: 80 }}>
        <div className={styles.emptyStateIcon}><Package size={32} /></div>
        <div className={styles.emptyStateTitle}>Unit Tidak Ditemukan</div>
        <div className={styles.emptyStateDesc}>Unit dengan ID ini tidak tersedia atau tidak terdaftar atas nama perusahaan Anda.</div>
        <button
          className={styles.btnPrimary}
          style={{ marginTop: 20 }}
          onClick={() => router.push('/client-portal/fleet')}
        >
          <ArrowLeft size={16} /> Kembali ke Fleet
        </button>
      </div>
    );
  }

  const warrantyExpiry = unit.warranty_expiry || unit.warranties?.[0]?.end_date;

  // Process Photos
  const photos = unit.specs?.photo_gallery
    ? String(unit.specs.photo_gallery).split(',').filter(Boolean)
    : (unit.test_run_image_url ? [unit.test_run_image_url] : []);
  const clampedPhotoIdx = Math.min(photoIdx, Math.max(0, photos.length - 1));
  const prevPhoto = () => setPhotoIdx(i => (i - 1 + photos.length) % photos.length);
  const nextPhoto = () => setPhotoIdx(i => (i + 1) % photos.length);

  // Process Diagrams / Manuals
  const manuals = unit.specs?.manuals_urls
    ? String(unit.specs.manuals_urls).split(',').filter(Boolean)
    : [];
  const clampedManualIdx = Math.min(manualIdx, Math.max(0, manuals.length - 1));
  const prevManual = () => setManualIdx(i => (i - 1 + manuals.length) % manuals.length);
  const nextManual = () => setManualIdx(i => (i + 1) % manuals.length);
  const currentManual = manuals[clampedManualIdx];
  const isManualImage = currentManual ? /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(currentManual) : false;

  return (
    <div>
      {/* ── Breadcrumb & Top Action Header ── */}
      <div className={styles.pageHeader}>
        <button
          className={styles.pageBackBtn}
          onClick={() => router.push('/client-portal/fleet')}
        >
          <ArrowLeft size={16} /> Kembali ke Fleet
        </button>
        <div className={unitStyles.unitHeader}>
          <div className={unitStyles.unitHeaderLeft}>
            <div className={unitStyles.unitIconBox}>
              <Box size={28} />
            </div>
            <div>
              <h1 className={styles.pageTitle} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {unit.serial_number}
                <div className={unitStyles.mobileBadgeOnly}>
                  <StatusBadge status={unit.status} />
                </div>
              </h1>
              <p className={styles.pageDescription}>{unit.model_name}</p>
            </div>
          </div>
          <div className={unitStyles.unitHeaderRight}>
            <div className={unitStyles.desktopBadgeOnly}>
              <StatusBadge status={unit.status} />
            </div>
            {!serviceRequested ? (
              <button
                className={`${styles.btnWarning} ${unitStyles.btnRequestMobile}`}
                onClick={() => router.push(`/client-portal/service-request?unit_id=${encodeURIComponent(unit.id)}`)}
              >
                <Wrench size={14} /> Request Servis
              </button>
            ) : (
              <span className={styles.badgeActive}>Permintaan Terkirim</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Balanced 2-Column Dashboard Layout (Sesuai Referensi Personal Finance) ── */}
      <div className={unitStyles.unitDetailGrid}>
        
        {/* ══════════════ KOLOM KIRI (Informasi Unit + Kepemilikan Unit) ══════════════ */}
        <div className={unitStyles.leftSectionStack}>
          
          {/* Card 1: Informasi Unit (Foto & Diagram di kiri, Garansi & Spesifikasi di kanan) */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <Box size={18} style={{ display: 'inline', marginRight: 8, color: '#38bdf8', verticalAlign: 'text-bottom' }} />
                Informasi Unit
              </h2>
            </div>
            <div className={styles.cardBody} style={{ padding: '22px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: '22px', alignItems: 'stretch' }}>
                
                {/* ── Sisi Kiri: Foto Gallery + Diagram Schematics Container ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  
                  {/* Container Foto Unit */}
                  <div style={{
                    position: 'relative',
                    height: '260px',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    background: 'radial-gradient(circle at center, #0f2b48 0%, #061526 100%)',
                    border: '1px solid rgba(56, 189, 248, 0.22)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)'
                  }}>
                    {photos.length > 0 ? (
                      <img
                        src={photos[clampedPhotoIdx]}
                        alt={`Foto ${unit.serial_number} ${clampedPhotoIdx + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          display: 'block',
                          padding: '8px'
                        }}
                      />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                        <ImageIcon size={32} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Foto belum tersedia</span>
                      </div>
                    )}

                    {/* Navigasi Carousel Foto */}
                    {photos.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={prevPhoto}
                          style={{
                            position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
                            background: 'rgba(7, 23, 41, 0.75)', border: '1px solid rgba(56, 189, 248, 0.3)',
                            borderRadius: '50%', width: '32px', height: '32px', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                            color: '#ffffff', backdropFilter: 'blur(4px)', zIndex: 2
                          }}
                        >
                          <ChevronLeft size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={nextPhoto}
                          style={{
                            position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                            background: 'rgba(7, 23, 41, 0.75)', border: '1px solid rgba(56, 189, 248, 0.3)',
                            borderRadius: '50%', width: '32px', height: '32px', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                            color: '#ffffff', backdropFilter: 'blur(4px)', zIndex: 2
                          }}
                        >
                          <ChevronRight size={18} />
                        </button>
                        <span style={{
                          position: 'absolute', bottom: '10px', right: '12px',
                          background: 'rgba(7, 23, 41, 0.85)', color: '#38bdf8',
                          fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px',
                          borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.3)',
                          zIndex: 2
                        }}>
                          {clampedPhotoIdx + 1}/{photos.length}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Container Diagram / Manual */}
                  <div style={{
                    position: 'relative',
                    height: '240px',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    background: 'radial-gradient(circle at center, #0f2b48 0%, #061526 100%)',
                    border: '1px solid rgba(56, 189, 248, 0.22)',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)'
                  }}>
                    {/* Header bar diagram */}
                    <div style={{
                      padding: '8px 14px',
                      background: 'rgba(7, 23, 41, 0.75)',
                      borderBottom: '1px solid rgba(56, 189, 248, 0.15)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <BookOpen size={13} /> Diagram / QC Manual
                      </span>
                      {manuals.length > 1 && (
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8' }}>
                          {clampedManualIdx + 1}/{manuals.length}
                        </span>
                      )}
                    </div>

                    {/* Preview Image Diagram */}
                    <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px' }}>
                      {manuals.length > 0 ? (
                        isManualImage ? (
                          <img
                            src={currentManual}
                            alt={`Diagram ${clampedManualIdx + 1}`}
                            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                          />
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', color: '#94a3b8' }}>
                            <FileText size={28} color="#38bdf8" />
                            <span style={{ fontSize: '0.78rem' }}>Dokumen Diagram PDF</span>
                          </div>
                        )
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                          <BookOpen size={28} />
                          <span style={{ fontSize: '0.78rem' }}>Diagram belum tersedia</span>
                        </div>
                      )}

                      {manuals.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={prevManual}
                            style={{
                              position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)',
                              background: 'rgba(7, 23, 41, 0.8)', border: '1px solid rgba(56, 189, 248, 0.3)',
                              borderRadius: '50%', width: '28px', height: '28px', display: 'flex',
                              alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                              color: '#ffffff', zIndex: 2
                            }}
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={nextManual}
                            style={{
                              position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                              background: 'rgba(7, 23, 41, 0.8)', border: '1px solid rgba(56, 189, 248, 0.3)',
                              borderRadius: '50%', width: '28px', height: '28px', display: 'flex',
                              alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                              color: '#ffffff', zIndex: 2
                            }}
                          >
                            <ChevronRight size={16} />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Bottom bar with open link */}
                    {currentManual && (
                      <div style={{
                        padding: '6px 14px',
                        background: 'rgba(7, 23, 41, 0.9)',
                        borderTop: '1px solid rgba(56, 189, 248, 0.15)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>Diagram {clampedManualIdx + 1}</span>
                        <a
                          href={currentManual}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            fontSize: '0.72rem', fontWeight: 700, color: '#38bdf8', textDecoration: 'none'
                          }}
                        >
                          Buka Tab Baru <ExternalLink size={12} />
                        </a>
                      </div>
                    )}
                  </div>

                </div>

                {/* ── Sisi Kanan: Widget Garansi di ATAS & Tabel Spesifikasi di BAWAH ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Widget Garansi Unit (Dipindahkan ke atas spesifikasi sesuai instruksi user) */}
                  <div style={{
                    padding: '16px 18px',
                    borderRadius: '16px',
                    background: 'linear-gradient(145deg, rgba(14, 36, 61, 0.8) 0%, rgba(7, 23, 41, 0.9) 100%)',
                    border: '1px solid rgba(56, 189, 248, 0.22)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.25)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ShieldCheck size={16} color="#38bdf8" /> Garansi Unit
                      </span>
                      <WarrantyBadge endDate={warrantyExpiry} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                        <span style={{ color: '#94a3b8' }}>Kota Penempatan</span>
                        <span style={{ fontWeight: 700, color: '#ffffff' }}>
                          {unit.current_client?.city || unit.specs?.city || 'JAKARTA'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                        <span style={{ color: '#94a3b8' }}>Garansi Berakhir</span>
                        <span style={{ fontWeight: 700, color: '#ffffff' }}>
                          {warrantyExpiry ? new Date(warrantyExpiry).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '15 November 2027'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tabel Spesifikasi Unit */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '8px 16px',
                    borderRadius: '16px',
                    background: 'rgba(7, 23, 41, 0.45)',
                    border: '1px solid rgba(56, 189, 248, 0.15)'
                  }}>
                    {[
                      { label: 'Model',           value: unit.model_name },
                      { label: 'Serial Number',   value: unit.serial_number },
                      { label: 'Kompresor',       value: unit.specs?.compressor || 'FFI12HBK' },
                      { label: 'Refrigeran',      value: unit.specs?.refrigerant || 'R134' },
                      { label: 'Daya / Power',    value: unit.specs?.power || '660 watt' },
                      { label: 'Production Date', value: unit.production_date ? new Date(unit.production_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '17 September 2026' },
                    ].map(({ label, value }, idx, arr) => (
                      <div
                        key={label}
                        style={{
                          padding: '10px 0',
                          borderBottom: idx < arr.length - 1 ? '1px solid rgba(56, 189, 248, 0.1)' : 'none',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>{label}</span>
                        <span style={{ fontSize: '0.88rem', color: '#ffffff', fontWeight: 800, textAlign: 'right' }}>{value || '—'}</span>
                      </div>
                    ))}
                  </div>

                </div>

              </div>
            </div>
          </div>

          {/* Card 2: Kepemilikan Unit (Melebar horizontal penuh di bawah Info Unit) */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <Building2 size={18} style={{ display: 'inline', marginRight: 8, color: '#38bdf8', verticalAlign: 'text-bottom' }} />
                Kepemilikan Unit
              </h2>
            </div>
            <div className={styles.cardBody} style={{ padding: '22px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '24px' }}>
                
                {/* Sub-kolom 1: Data Pelanggan / Kantor Pusat */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Customer Name</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#38bdf8' }}>
                      {unit.current_client?.company_name || 'PAMERAN FHI'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8', flexShrink: 0 }}>HQ Address</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#ffffff', textAlign: 'right', lineHeight: 1.4 }}>
                      {unit.current_client?.address || 'Thamrin Plaza, Jl. M.H. Thamrin Kav. 8-9, Lantai PH / 12-13, Kelurahan Kebon Melati, Kecamatan Tanah Abang, Jakarta Pusat 10230'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>SO Number</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>
                      {unit.so_number || 'S026025531'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>DO Number</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>
                      {unit.do_number || 'DO26073545'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Delivery Date</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>
                      {unit.delivery_date ? new Date(unit.delivery_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '23 Oktober 2026'}
                    </span>
                  </div>
                </div>

                {/* Sub-kolom 2: Lokasi Unit / Cabang Outlet */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  paddingLeft: '20px',
                  borderLeft: '1px solid rgba(56, 189, 248, 0.15)'
                }}>
                  <div style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: '#38bdf8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: 2
                  }}>
                    Lokasi Unit (Branch)
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Outlet Branch</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#ffffff' }}>
                      {unit.outlet_branch || 'Fore Donut Lippo Mall Puri'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8', flexShrink: 0 }}>Branch Address</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#ffffff', textAlign: 'right', lineHeight: 1.4 }}>
                      {unit.branch_address || 'Jl. Puri Indah Raya Blok U1, RT.3/RW.2, Kembangan Sel., Kec. Kembangan, Kota Jakarta Barat, DKI Jakarta 11610'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>City & Province</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>
                      {unit.current_client?.city || 'Jakarta Pusat'}, DKI Jakarta
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>

        {/* ══════════════ KOLOM KANAN (Kesehatan Unit, Riwayat Servis, Laporan Terbaru) ══════════════ */}
        <div className={unitStyles.rightColStack}>
          
          {/* Card 1: Kesehatan Unit (IoT Analysis) */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <Activity size={18} style={{ display: 'inline', marginRight: 8, color: '#38bdf8', verticalAlign: 'text-bottom' }} />
                Kesehatan Unit
              </h2>
              <span style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '0.7rem',
                fontWeight: 800,
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                LIVE
              </span>
            </div>
            <div className={styles.cardBody} style={{ padding: '16px' }}>
              <CustomerHealthWidget
                unitId={unit.id}
                unit={unit}
                hideAnalytics={true}
              />
            </div>
          </div>

          {/* Card 2: Riwayat Servis */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <Wrench size={18} style={{ display: 'inline', marginRight: 8, color: '#38bdf8', verticalAlign: 'text-bottom' }} />
                Riwayat Servis
              </h2>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>
                {logs.length} catatan
              </span>
            </div>
            <div className={styles.cardBody} style={{ padding: '14px 16px' }}>
              {logs.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                  Belum ada catatan servis
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {logs.map((log: any) => {
                    const isExpanded = expandedLogId === log.id;
                    return (
                      <div
                        key={log.id}
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '12px',
                          background: 'rgba(7, 23, 41, 0.55)',
                          border: '1px solid rgba(56, 189, 248, 0.15)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ color: '#38bdf8', fontSize: '0.8rem' }}>•</span>
                              <h4 style={{ margin: 0, fontSize: '0.83rem', fontWeight: 700, color: '#ffffff', lineHeight: 1.3 }}>
                                {log.action_taken || log.issue_description || 'Servis & Pemeliharaan'}
                              </h4>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 4, marginLeft: 12 }}>
                              {log.service_date
                                ? new Date(log.service_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                                : '—'}
                            </div>
                          </div>
                          <span style={{
                            background: 'rgba(245, 158, 11, 0.15)',
                            color: '#f59e0b',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '10px',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            flexShrink: 0
                          }}>
                            Proses
                          </span>
                        </div>

                        {/* Collapsed/Expanded detail */}
                        {isExpanded && (
                          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed rgba(56, 189, 248, 0.15)', fontSize: '0.75rem', color: '#cbd5e1' }}>
                            {log.issue_description && (
                              <p style={{ margin: '0 0 8px 0', lineHeight: 1.4 }}>{log.issue_description}</p>
                            )}
                            <div style={{ display: 'flex', gap: '14px', color: '#94a3b8' }}>
                              {log.technician_name && <span>Teknisi: {log.technician_name}</span>}
                              {log.partner?.partner_name && <span>Mitra: {log.partner.partner_name}</span>}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Laporan Terbaru (Dipindahkan ke kolom kanan di bawah Riwayat Servis) */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <FileText size={18} style={{ display: 'inline', marginRight: 8, color: '#38bdf8', verticalAlign: 'text-bottom' }} />
                Laporan Terbaru ({reports.length})
              </h2>
              {reports.length > 2 && (
                <button
                  type="button"
                  onClick={() => setShowAllReports(!showAllReports)}
                  className={styles.cardAction}
                >
                  {showAllReports ? 'Ringkas' : 'Lihat Semua'}
                </button>
              )}
            </div>
            <div className={styles.cardBody} style={{ padding: '12px 16px' }}>
              {reports.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem' }}>
                  Belum ada laporan
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(showAllReports ? reports : reports.slice(0, 3)).map((rep: any) => (
                    <a
                      key={rep.id}
                      href={`/client-portal/reports/${rep.id}`}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: 'rgba(7, 23, 41, 0.55)',
                        border: '1px solid rgba(56, 189, 248, 0.15)',
                        textDecoration: 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)'}
                      onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.15)'}
                    >
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#ffffff', letterSpacing: '0.3px' }}>
                          {rep.form_type?.replace(/_/g, ' ') || 'Laporan'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>
                          {rep.created_at ? new Date(rep.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </div>
                      </div>
                      <ExternalLink size={14} color="#38bdf8" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* ── Modal Request Servis ── */}
      {showModal && (
        <ServiceRequestModal
          unitId={id as string}
          onClose={(submitted?: boolean) => {
            setShowModal(false);
            if (submitted) setServiceRequested(true);
          }}
        />
      )}
    </div>
  );
}
