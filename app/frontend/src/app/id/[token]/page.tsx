'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert, Wrench, FileText, CheckCircle2,
  ExternalLink, Phone, ArrowLeft, Loader2,
  Lock, Check, UserCheck, Settings, BookOpen, Clock, Image as ImageIcon,
  HelpCircle, Package, ChevronLeft, ChevronRight,
} from 'lucide-react';
import PassportTopbar from './components/PassportTopbar';
import { CustomSelect } from '@/components/ui/CustomSelect';
import DatePicker from '@/components/ui/DatePicker';
import { usePassportData } from './hooks/usePassportData';
import { useAdminActions } from './hooks/useAdminActions';
import { useSmartRouting } from './hooks/useSmartRouting';
import { EditField } from './components/StyledInput';
import AirflowDiagram from './components/AirflowDiagram';
import ServiceRequestModal from './components/ServiceRequestModal';
import PartnerLogModal from './components/PartnerLogModal';
import AdminTransferModal from './components/AdminTransferModal';
import AllSpecsModal from './components/AllSpecsModal';
import ServiceHistorySection from './components/ServiceHistorySection';
import IotTelemetryWidget from './components/IotTelemetryWidget';
import IotHistoryWidget from './components/IotHistoryWidget';
import CustomerHealthWidget from './components/CustomerHealthWidget';
import QrCard from './components/QrCard';
import { INDONESIA_CITIES, getUnitType, UNIT_TYPE_LABELS, UNIT_TYPE_COLORS } from './constants';
import styles from './id.module.css';

export default function QrPassportPage() {
  const router = useRouter();
  const passport = usePassportData();
  const {
    token, unit, user, loading, error,
    isDark, setIsDark, carouselRef, unitReports,
    toast, showToast, clearToast, loadUnitData,
    isGuest, isClient, isPartner, isAdmin,
    belongsToClient, hasClientRestriction,
    isWarrantyActive, expiryDate,
  } = passport;

  const autoUnitType = unit ? getUnitType(unit.model_name) : 'MESIN';
  const [photoIdx, setPhotoIdx] = useState(0);

  // Ref untuk menyamakan tinggi kolom kiri dan kanan
  const leftColRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);

  const equalizeColumns = useCallback(() => {
    const left = leftColRef.current;
    const right = rightColRef.current;
    if (!left || !right) return;
    // Reset dulu agar bisa mengukur tinggi alami
    left.style.minHeight = '';
    right.style.minHeight = '';
    const leftH = left.scrollHeight;
    const rightH = right.scrollHeight;
    const maxH = Math.max(leftH, rightH);
    left.style.minHeight = `${maxH}px`;
    right.style.minHeight = `${maxH}px`;
  }, []);

  useEffect(() => {
    if (!unit) return;
    const t = setTimeout(equalizeColumns, 100);
    window.addEventListener('resize', equalizeColumns);
    return () => { clearTimeout(t); window.removeEventListener('resize', equalizeColumns); };
  }, [unit, equalizeColumns]);

  const admin = useAdminActions(unit, loadUnitData, showToast);
  const {
    editBlocks, editData, isSaving, qcUploading, photoGalleryUploading, manualsUploading,
    toggleEdit, cancelEdit, handleEditChange,
    handleQcFileUpload, handlePhotoGalleryUpload, handleManualsUpload,
  } = admin;

  const routing = useSmartRouting(unit, user, loadUnitData, showToast);
  const {
    showServiceModal, setShowServiceModal, closeServiceModal,
    issueMainCategory, setIssueMainCategory, issueSubCategory, setIssueSubCategory,
    serviceNotes, setServiceNotes, serviceName, setServiceName,
    servicePhone, setServicePhone, storeName, setStoreName,
    routingResult, routingLoading, handleServiceRequest,
    showLogModal, setShowLogModal, closeLogModal,
    techName, setTechName, logType, setLogType,
    logNotes, setLogNotes, logStatus, setLogStatus,
    logComponents, setLogComponents, logLoading, handleAddLog,
    showTransferModal, setShowTransferModal,
    clients, targetClientId, setTargetClientId,
    transferReason, setTransferReason, transferLoading, handleTransfer,
    showAllSpecsModal, setShowAllSpecsModal,
    selectedMedia, setSelectedMedia,
  } = routing;

  const [showAllPicModal, setShowAllPicModal] = useState(false);

  if (loading) return <div className={styles.loadingContainer}><Loader2 className={styles.spinner} size={48} /><p>Memindai QR Passport...</p></div>;
  if (error || !unit) return (
    <div className={styles.errorContainer}><div className={styles.errorCard}>
      <ShieldAlert size={48} className={styles.errorIcon} />
      <h2>Unit Tidak Terdaftar</h2>
      <p>{error || 'QR Code yang Anda pindai tidak valid atau sudah kedaluwarsa.'}</p>
      <button onClick={() => router.push('/')} className={styles.btnBack}><ArrowLeft size={16} /> Kembali ke Beranda</button>
    </div></div>
  );

  return (
    <div className={styles.pageWrapper} data-theme={isDark ? 'dark' : 'light'} data-page="passport">
      {/* Toast — CSS module classes */}
      {toast && (
        <div role="alert" aria-live="polite" className={styles.toastContainer}>
          <div className={toast.type === 'success' ? styles.toastSuccess : toast.type === 'error' ? styles.toastError : styles.toastInfo}
            style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>{toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}</span>
            {toast.message}
            <button onClick={clearToast} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1rem', padding: 0, opacity: 0.7 }}>×</button>
          </div>
        </div>
      )}

      <div className={styles.dotGrid} aria-hidden="true" />
      <div className={styles.dotGridRight} aria-hidden="true" />

      {/* Sticky topbar — outside container */}
      <PassportTopbar
        isDark={isDark}
        setIsDark={setIsDark}
        isGuest={isGuest}
        isClient={isClient}
        isPartner={isPartner}
        isAdmin={isAdmin}
        belongsToClient={belongsToClient}
        hasClientRestriction={hasClientRestriction}
        unit={unit}
        token={Array.isArray(token) ? token[0] : (token ?? '')}
      />

      <div className={styles.container}>
        {/* Unit header (serial number, model, back button) */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button onClick={() => router.back()} className={styles.backBtn}><ArrowLeft size={16} /> Kembali ke Daftar Unit</button>
            <div className={styles.titleRow}>
              <h1 className={styles.serialNumber}>{unit.serial_number}</h1>
              <span className={styles.verifiedBadgeTop}><CheckCircle2 size={16} /> Terverifikasi</span>
              {unit && (
                <span style={{
                  background: UNIT_TYPE_COLORS[autoUnitType].bg,
                  color: UNIT_TYPE_COLORS[autoUnitType].color,
                  border: `1px solid ${UNIT_TYPE_COLORS[autoUnitType].border}`,
                  padding: '5px 12px', borderRadius: '50px', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em',
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                }}>
                  {UNIT_TYPE_LABELS[autoUnitType]}
                </span>
              )}
            </div>
            <p className={styles.modelName}>{unit.model_name}</p>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.lastUpdated}><Clock size={12} /> Terakhir diperbarui: {new Date(unit.updated_at || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>
        </header>

        {/* 2-COLUMN LAYOUT / CAROUSEL DI MOBILE */}
        <div className={styles.carouselWrapper} style={{ position: 'relative' }}>
          {/* Tombol navigasi Mobile (kiri/kanan) */}
          <button className={`${styles.carouselNavBtn} ${styles.prevBtn}`} aria-label="Geser Kiri" onClick={() => carouselRef.current?.scrollBy({ left: -window.innerWidth * 0.85, behavior: 'smooth' })}>
            <ChevronLeft size={20} />
          </button>
          <button className={`${styles.carouselNavBtn} ${styles.nextBtn}`} aria-label="Geser Kanan" onClick={() => carouselRef.current?.scrollBy({ left: window.innerWidth * 0.85, behavior: 'smooth' })}>
            <ChevronRight size={20} />
          </button>

          <div className={styles.passportLayout} ref={carouselRef}>

          {/* ── KOLOM KIRI: Spesifikasi Utama + Stats ── */}
          <div className={styles.passportLeft} ref={leftColRef}>

          {/* Slide 1: Spesifikasi Utama */}
          <section className={`${styles.panel} ${styles.iotPanel}`} style={{ background: "#E8EAEE", border: "none", boxShadow: "-6px -6px 10px rgba(255,255,255,0.72), 6px 6px 12px rgba(0,31,63,0.14)", borderRadius: "20px", backdropFilter: "none" }}>
            <div className={styles.panelHeader}>
              <div className={styles.panelHeaderLeft}><FileText size={16} color="var(--color-cobalt-blue)" /><h2>Spesifikasi Utama</h2></div>
              {isAdmin && (<div style={{ display: 'flex', gap: '8px' }}>
                {editBlocks.spesifikasi && <button className={styles.btnCancel} onClick={() => cancelEdit('spesifikasi')}>Batal</button>}
                <button className={editBlocks.spesifikasi ? styles.btnSave : styles.btnRevise} onClick={() => toggleEdit('spesifikasi')}>
                  {editBlocks.spesifikasi ? (isSaving ? 'Menyimpan…' : 'Simpan') : 'Revisi'}
                </button>
              </div>)}
            </div>
            <div className={styles.panelContent}>
              {!editBlocks.spesifikasi && (() => {
                const photos = unit.specs?.photo_gallery ? String(unit.specs.photo_gallery).split(',').filter(Boolean) : [];
                const clampedIdx = Math.min(photoIdx, Math.max(0, photos.length - 1));
                const prev = () => setPhotoIdx(i => (i - 1 + photos.length) % photos.length);
                const next = () => setPhotoIdx(i => (i + 1) % photos.length);
                return (
                  <div style={{ position: 'relative', marginBottom: '16px' }}>
                    {/* Main image area */}
                    <div className={styles.unitImagePlaceholder} style={{ marginBottom: 0, overflow: 'hidden', position: 'relative' }}>
                      <div className={styles.unitImageInner}>
                        {photos.length > 0 ? (
                          <img
                            src={photos[clampedIdx]}
                            alt={`${unit.model_name} — foto ${clampedIdx + 1} dari ${photos.length}`}
                            className={styles.unitImage}
                            style={{ transition: 'opacity 0.2s ease' }}
                            onClick={() => window.open(photos[clampedIdx], '_blank')}
                          />
                        ) : (
                          <Package size={64} className={styles.unitImageIcon} />
                        )}
                      </div>

                      {/* Nav buttons — only show when >1 photo */}
                      {photos.length > 1 && (<>
                        <button onClick={prev} style={{
                          position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)',
                          background: 'rgba(255,255,255,0.85)', border: 'none', borderRadius: '50%',
                          width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,31,63,0.15)', zIndex: 2,
                        }} aria-label="Foto sebelumnya">
                          <ChevronLeft size={18} color="var(--color-deep-navy)" />
                        </button>
                        <button onClick={next} style={{
                          position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                          background: 'rgba(255,255,255,0.85)', border: 'none', borderRadius: '50%',
                          width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,31,63,0.15)', zIndex: 2,
                        }} aria-label="Foto berikutnya">
                          <ChevronRight size={18} color="var(--color-deep-navy)" />
                        </button>
                        {/* Counter badge */}
                        <span style={{
                          position: 'absolute', bottom: '8px', right: '10px',
                          background: 'rgba(0,31,63,0.55)', color: '#fff',
                          fontSize: '0.68rem', fontWeight: 700, fontFamily: 'var(--font-heading)',
                          padding: '2px 8px', borderRadius: '20px', zIndex: 2,
                        }}>{clampedIdx + 1}/{photos.length}</span>
                      </>)}
                    </div>

                    {/* Thumbnail strip — only when >1 photo */}
                    {photos.length > 1 && (
                      <div style={{ display: 'flex', gap: '6px', marginTop: '8px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '2px' }}>
                        {photos.map((url, idx) => (
                          <button key={idx} onClick={() => setPhotoIdx(idx)} style={{
                            flexShrink: 0, width: '52px', height: '52px', padding: 0, border: 'none',
                            borderRadius: '6px', overflow: 'hidden', cursor: 'pointer',
                            outline: idx === clampedIdx ? '2px solid var(--color-cobalt-blue)' : '2px solid transparent',
                            outlineOffset: '1px', transition: 'outline 0.15s ease', opacity: idx === clampedIdx ? 1 : 0.65,
                          }} aria-label={`Lihat foto ${idx + 1}`}>
                            <img src={url} alt={`Thumbnail ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
              {editBlocks.spesifikasi ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <EditField label="Model" value={editData.model_name || ''} onChange={(v) => handleEditChange('model_name', v)} />
                  <EditField label="Serial Number" value={editData.serial_number || ''} onChange={(v) => handleEditChange('serial_number', v)} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-space-grey)', fontWeight: 600 }}>Tipe / Type</label>
                    <CustomSelect value={editData.specs?.type || ''} onChange={(v) => handleEditChange('specs.type', v)}
                      options={[{ value: '', label: '— Pilih Tipe Unit —' }, { value: 'SHOWCASE', label: 'Showcase' }, { value: 'MESIN', label: 'Mesin' }]} />
                  </div>
                  {(editData.specs?.type === 'MESIN') ? (<>
                    <EditField label="Dimensi" value={editData.specs?.dimension || ''} onChange={(v) => handleEditChange('specs.dimension', v)} />
                    <EditField label="Daya / Power" value={editData.specs?.power || editData.specs?.wattage || ''} onChange={(v) => { handleEditChange('specs.power', v); handleEditChange('specs.wattage', v); }} />
                    <EditField label="Kapasitas" value={editData.specs?.capacity || ''} onChange={(v) => handleEditChange('specs.capacity', v)} />
                    <EditField label="Kompresor" value={editData.specs?.compressor || ''} onChange={(v) => handleEditChange('specs.compressor', v)} />
                    <EditField label="Refrigerant" value={editData.specs?.refrigerant || ''} onChange={(v) => handleEditChange('specs.refrigerant', v)} />
                  </>) : (<>
                    <EditField label="Kompresor" value={editData.specs?.compressor || ''} onChange={(v) => handleEditChange('specs.compressor', v)} />
                    <EditField label="Refrigerant" value={editData.specs?.refrigerant || ''} onChange={(v) => handleEditChange('specs.refrigerant', v)} />
                    <EditField label="Daya / Power" value={editData.specs?.wattage || editData.specs?.power || ''} onChange={(v) => { handleEditChange('specs.wattage', v); handleEditChange('specs.power', v); }} />
                    <EditField label="Dimensi" value={editData.specs?.dimension || ''} onChange={(v) => handleEditChange('specs.dimension', v)} />
                    <EditField label="Kapasitas" value={editData.specs?.capacity || ''} onChange={(v) => handleEditChange('specs.capacity', v)} />
                  </>)}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                    <DatePicker label="Garansi Berakhir" value={editData.warranty_expiry ? editData.warranty_expiry.slice(0, 10) : ''} onChange={(v) => handleEditChange('warranty_expiry', v)} theme="dark" />
                  </div>
                  <DatePicker label="Production Date" value={editData.specs?.production_date ? editData.specs.production_date.slice(0, 10) : (editData.specs?.finish_date ? editData.specs.finish_date.slice(0, 10) : '')} onChange={(v) => handleEditChange('specs.production_date', v)} theme="dark" />
                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-space-grey)', fontWeight: 600 }}>Foto Utama Unit</label>
                    {editData.specs?.photo_gallery && editData.specs.photo_gallery.split(',').filter(Boolean).length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '6px' }}>
                        {editData.specs.photo_gallery.split(',').filter(Boolean).map((url: string, idx: number) => (
                          <div key={idx} style={{ position: 'relative' }}>
                            <img src={url} alt={`Foto ${idx + 1}`} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '6px', display: 'block' }} />
                            <button type="button" onClick={() => { const c = editData.specs.photo_gallery.split(',').filter(Boolean); c.splice(idx, 1); handleEditChange('specs.photo_gallery', c.join(',')); }} style={{ position: 'absolute', top: '3px', right: '3px', background: 'rgba(239,68,68,0.85)', border: 'none', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', color: '#fff', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                          </div>
                        ))}
                      </div>
                    )}
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px dashed rgba(0,31,63,0.15)', borderRadius: '8px', padding: '10px 14px', cursor: photoGalleryUploading ? 'not-allowed' : 'pointer', color: 'var(--color-space-grey)', fontSize: '0.82rem', background: 'var(--color-light-tech-grey)', opacity: photoGalleryUploading ? 0.6 : 1 }}>
                      <ImageIcon size={16} />{photoGalleryUploading ? 'Mengupload...' : 'Upload foto unit (bisa pilih banyak)'}
                      <input type="file" accept=".jpg,.jpeg,.png,.webp" multiple style={{ display: 'none' }} disabled={photoGalleryUploading} onChange={(e) => { if (e.target.files?.length) handlePhotoGalleryUpload(e.target.files); }} />
                    </label>
                  </div>
                </div>
              ) : (<>
                <div className={styles.specItem}><span className={styles.specLabel}>Model</span><span className={styles.specValue}>{unit.model_name}</span></div>
                <div className={styles.specItem}><span className={styles.specLabel}>Serial Number</span><span className={styles.specValue}>{unit.serial_number}</span></div>
                {unit.specs?.type === 'MESIN' || (!unit.specs?.type && unit.specs?.dimension) ? (<>
                  <div className={styles.specItem}><span className={styles.specLabel}>Dimensi</span><span className={styles.specValue}>{unit.specs?.dimension || '—'}</span></div>
                  <div className={styles.specItem}><span className={styles.specLabel}>Daya / Power</span><span className={styles.specValue}>{unit.specs?.power || '—'}</span></div>
                  <div className={styles.specItem}><span className={styles.specLabel}>Kapasitas</span><span className={styles.specValue}>{unit.specs?.capacity || '—'}</span></div>
                </>) : (<>
                  <div className={styles.specItem}><span className={styles.specLabel}>Kompresor</span><span className={styles.specValue}>{unit.specs?.compressor || '—'}</span></div>
                  <div className={styles.specItem}><span className={styles.specLabel}>Refrigeran</span><span className={styles.specValue}>{unit.specs?.refrigerant || '—'}</span></div>
                  <div className={styles.specItem}><span className={styles.specLabel}>Daya / Power</span><span className={styles.specValue}>{unit.specs?.wattage || '—'}</span></div>
                </>)}
                <div className={styles.specItem} style={{ borderBottom: 'none' }}><span className={styles.specLabel}>Production Date</span><span className={styles.specValue}>{(unit.specs?.production_date || unit.specs?.finish_date) ? new Date(unit.specs.production_date || unit.specs.finish_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</span></div>
              </>)}
              {!editBlocks.spesifikasi && <button className={styles.btnViewAll} onClick={() => setShowAllSpecsModal(true)}>Lihat Semua Spesifikasi <span>›</span></button>}
            </div>
          </section>

          {/* Slide 5: Manuals */}
          {(isAdmin || isPartner) && (
          <section className={`${styles.panel} ${styles.iotPanel}`} style={{ background: "#E8EAEE", border: "none", boxShadow: "-6px -6px 10px rgba(255,255,255,0.72), 6px 6px 12px rgba(0,31,63,0.14)", borderRadius: "20px", backdropFilter: "none" }}>
            <div className={styles.panelHeader}>
              <div className={styles.panelHeaderLeft}><BookOpen size={16} color="var(--color-cobalt-blue)" /><h2>Manuals</h2></div>
              {isAdmin && (<div style={{ display: 'flex', gap: '8px' }}>
                {editBlocks.manuals && <button className={styles.btnCancel} onClick={() => cancelEdit('manuals')}>Batal</button>}
                <button className={editBlocks.manuals ? styles.btnSave : styles.btnRevise} onClick={() => toggleEdit('manuals')}>{editBlocks.manuals ? (isSaving ? 'Menyimpan…' : 'Simpan') : 'Revisi'}</button>
              </div>)}
            </div>
            <div className={styles.mediaSingleItem} style={{ padding: '16px' }}>
              {editBlocks.manuals ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-space-grey)', lineHeight: 1.5 }}>Upload diagram sirkular udara (JPG, PNG, atau PDF).</p>
                  {(() => { const urls = editData.specs?.manuals_urls ? editData.specs.manuals_urls.split(',').filter(Boolean) : []; return urls.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {urls.map((url: string, idx: number) => (<div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: 'var(--color-light-tech-grey)', borderRadius: '8px', border: 'var(--border-card)' }}>
                        <FileText size={14} color="var(--color-cobalt-blue)" /><span style={{ flex: 1, fontSize: '0.78rem', color: 'var(--color-space-grey)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url.includes('pdf') ? `Diagram PDF ${idx + 1}` : `Diagram Gambar ${idx + 1}`}</span>
                        <button type="button" onClick={() => window.open(url, '_blank')} style={{ background: 'none', border: 'none', color: 'var(--color-cobalt-blue)', cursor: 'pointer', fontSize: '0.72rem', textDecoration: 'underline' }}>Lihat</button>
                        <button type="button" onClick={() => { const c = (editData.specs?.manuals_urls || '').split(',').filter(Boolean); c.splice(idx, 1); handleEditChange('specs.manuals_urls', c.join(',')); }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.72rem' }}>Hapus</button>
                      </div>))}
                    </div>) : null; })()}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px dashed rgba(0,31,63,0.12)', borderRadius: '8px', padding: '10px 14px', cursor: manualsUploading ? 'not-allowed' : 'pointer', color: 'var(--color-space-grey)', fontSize: '0.82rem', background: 'var(--color-light-tech-grey)', opacity: manualsUploading ? 0.6 : 1 }}>
                    <ImageIcon size={16} />{manualsUploading ? 'Mengupload...' : 'Klik untuk upload diagram (JPG/PNG/PDF)'}
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" multiple style={{ display: 'none' }} disabled={manualsUploading} onChange={(e) => { if (e.target.files?.length) handleManualsUpload(e.target.files); }} />
                  </label>
                  {/* YouTube Link Upload */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-space-grey)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#ef4444"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                      Link Video YouTube (Opsional)
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="url"
                        placeholder="https://youtube.com/watch?v=..."
                        style={{ flex: 1, padding: '10px 12px', background: 'var(--color-light-tech-grey)', border: 'var(--border-card)', borderRadius: '8px', color: 'var(--color-deep-navy)', fontSize: '0.82rem', fontFamily: 'inherit', outline: 'none' }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = (e.target as HTMLInputElement).value.trim();
                            if (val && (val.includes('youtube.com') || val.includes('youtu.be'))) {
                              const existing = editData.specs?.manuals_urls ? editData.specs.manuals_urls.split(',').filter(Boolean) : [];
                              handleEditChange('specs.manuals_urls', [...existing, val].join(','));
                              (e.target as HTMLInputElement).value = '';
                            }
                          }
                        }}
                        id="youtube-link-input"
                      />
                      <button type="button" style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                        onClick={() => {
                          const inp = document.getElementById('youtube-link-input') as HTMLInputElement;
                          const val = inp?.value.trim();
                          if (val && (val.includes('youtube.com') || val.includes('youtu.be'))) {
                            const existing = editData.specs?.manuals_urls ? editData.specs.manuals_urls.split(',').filter(Boolean) : [];
                            handleEditChange('specs.manuals_urls', [...existing, val].join(','));
                            inp.value = '';
                          }
                        }}
                      >+ Tambah</button>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-space-grey)' }}>Tekan Enter atau klik Tambah untuk menyimpan link</span>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(() => { const urls = unit?.specs?.manuals_urls ? String(unit.specs.manuals_urls).split(',').filter(Boolean) : [];
                    if (urls.length === 0) return (<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', gap: '10px', background: 'var(--color-light-tech-grey)', borderRadius: '10px', border: '1px dashed rgba(0,31,63,0.12)' }}><BookOpen size={28} color="var(--color-space-grey)" /><p style={{ color: 'var(--color-space-grey)', fontSize: '0.82rem', textAlign: 'center' }}>Belum ada diagram</p></div>);
                    return urls.map((url: string, idx: number) => { const isPdf = url.includes('pdf'); const isImage = /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url); const isYoutube = url.includes('youtube.com') || url.includes('youtu.be'); return (
                      <div key={idx}>
                        {isYoutube ? (
                          <button className={styles.btnPrimary} style={{ justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: 'var(--color-deep-navy)', fontFamily: 'inherit' }} onClick={() => window.open(url, '_blank')}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="#ef4444"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                              Video YouTube {idx + 1}
                            </span>
                            <ExternalLink size={15} color="var(--color-space-grey)" style={{ flexShrink: 0 }} />
                          </button>
                        ) : isImage ? <div onClick={() => window.open(url, '_blank')} style={{ cursor: 'pointer', borderRadius: '10px', overflow: 'hidden', border: 'var(--border-card)' }}><img src={url} alt={`Diagram ${idx + 1}`} style={{ width: '100%', display: 'block', objectFit: 'contain', maxHeight: '280px', background: 'var(--color-light-tech-grey)' }} /><div style={{ padding: '8px 12px', background: 'var(--color-light-tech-grey)', fontSize: '0.72rem', color: 'var(--color-space-grey)', display: 'flex', alignItems: 'center', gap: '6px' }}><ImageIcon size={12} /> Diagram {idx + 1}</div></div>
                        : <button className={styles.btnPrimary} style={{ justifyContent: 'space-between', padding: '12px 16px', background: 'var(--color-light-tech-grey)', color: 'var(--color-deep-navy)', border: 'var(--border-card)' }} onClick={() => window.open(url, '_blank')}><span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={16} />{isPdf ? `Diagram PDF ${idx + 1}` : `File Diagram ${idx + 1}`}</span><ExternalLink size={16} color="var(--color-space-grey)" /></button>}
                      </div>); });
                  })()}
                </div>
              )}
            </div>
          </section>
          )}

          {/* Slide 6: Ownership */}
          {(!isGuest && !hasClientRestriction) && (
          <section className={`${styles.panel} ${styles.iotPanel}`} style={{ background: "#E8EAEE", border: "none", boxShadow: "-6px -6px 10px rgba(255,255,255,0.72), 6px 6px 12px rgba(0,31,63,0.14)", borderRadius: "20px", backdropFilter: "none" }}>
            <div className={styles.panelHeader}>
              <div className={styles.panelHeaderLeft}><UserCheck size={16} color="var(--color-cobalt-blue)" /><h2>Ownership</h2></div>
              {isAdmin && (<div style={{ display: 'flex', gap: '8px' }}>
                {editBlocks.ownership && <button className={styles.btnCancel} onClick={() => cancelEdit('ownership')}>Batal</button>}
                <button className={editBlocks.ownership ? styles.btnSave : styles.btnRevise} onClick={() => toggleEdit('ownership')}>{editBlocks.ownership ? (isSaving ? 'Menyimpan…' : 'Simpan') : 'Revisi'}</button>
              </div>)}
            </div>
            <div className={styles.panelContent}>
              {editBlocks.ownership ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingBottom: '16px' }}>
                  <EditField label="Customer Name" value={editData.current_client?.company_name || ''} onChange={(v) => handleEditChange('current_client.company_name', v)} />
                  <EditField label="HQ Address (Pusat)" value={editData.specs?.hq_address || ''} onChange={(v) => handleEditChange('specs.hq_address', v)} />
                  <EditField label="SO Number" value={editData.specs?.so_number || ''} onChange={(v) => handleEditChange('specs.so_number', v)} />
                  <EditField label="DO Number" value={editData.specs?.do_number || ''} onChange={(v) => handleEditChange('specs.do_number', v)} />
                  <DatePicker label="Delivery Date" value={editData.specs?.delivery_date ? editData.specs.delivery_date.slice(0, 10) : ''} onChange={(v) => handleEditChange('specs.delivery_date', v)} theme="dark" />
                  
                  <div style={{ marginTop: '12px', marginBottom: '8px', paddingBottom: '4px', borderBottom: 'var(--border-card)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-cobalt-blue)' }}>Lokasi Unit (Branch)</div>
                  <EditField label="Outlet Branch" value={editData.outlet_branch || ''} onChange={(v) => handleEditChange('outlet_branch', v)} />
                  <EditField label="Branch Address (Jalan)" value={editData.specs?.branch_address || ''} onChange={(v) => handleEditChange('specs.branch_address', v)} />
                  <div className={styles.editRow}><div className={styles.editGroup}>
                    <span className={styles.editLabel}>Kota (City)</span>
                    <select className={styles.editInput} value={editData.city || ''} onChange={(e) => handleEditChange('city', e.target.value)}>
                      <option value="">-- Pilih Kota --</option>
                      {Object.entries(INDONESIA_CITIES.reduce((acc: Record<string, string[]>, item) => { if (!acc[item.province]) acc[item.province] = []; acc[item.province].push(item.city); return acc; }, {})).map(([province, cities]) => (<optgroup key={province} label={province}>{(cities as string[]).map(city => <option key={city} value={city}>{city}</option>)}</optgroup>))}
                    </select>
                  </div></div>
                </div>
              ) : (<>
                <div className={styles.specItem}><span className={styles.specLabel}>Customer Name</span><span className={styles.specValue}>{unit.current_client?.company_name || '—'}</span></div>
                <div className={styles.specItem}><span className={styles.specLabel}>HQ Address</span><span className={styles.specValue}>{unit.specs?.hq_address || '—'}</span></div>
                <div className={styles.specItem}><span className={styles.specLabel}>SO Number</span><span className={styles.specValue}>{unit.specs?.so_number || '—'}</span></div>
                <div className={styles.specItem}><span className={styles.specLabel}>DO Number</span><span className={styles.specValue}>{unit.specs?.do_number || '—'}</span></div>
                <div className={styles.specItem}><span className={styles.specLabel}>Delivery Date</span><span className={styles.specValue}>{unit.specs?.delivery_date ? new Date(unit.specs.delivery_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</span></div>
                
                <div style={{ marginTop: '12px', padding: '4px 16px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-cobalt-blue)', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'rgba(46,91,255,0.06)' }}>Lokasi Unit (Branch)</div>
                <div className={styles.specItem}><span className={styles.specLabel}>Outlet Branch</span><span className={styles.specValue}>{unit.outlet_branch || '—'}</span></div>
                <div className={styles.specItem}><span className={styles.specLabel}>Branch Address</span><span className={styles.specValue}>{unit.specs?.branch_address || '—'}</span></div>
                <div className={styles.specItem} style={{ borderBottom: 'none' }}><span className={styles.specLabel}>City & Province</span><span className={styles.specValue}>{unit.city ? (() => { const m = INDONESIA_CITIES.find(c => c.city === unit.city); return m ? `${unit.city}, ${m.province}` : unit.city; })() : '—'}</span></div>
              </>)}
            </div>
          </section>
          )}

          {/* Riwayat Servis */}
          {(!isGuest && !hasClientRestriction) && (
            <ServiceHistorySection serviceLogs={unit.service_logs || []} />
          )}

          </div>{/* ── END passportLeft ── */}

          {/* ── KOLOM KANAN: Layanan + QC + Manuals + Ownership + IoT ── */}
          <div className={styles.passportRight} ref={rightColRef}>

            {/* Baris atas: Layanan & Dukungan + QR Card (desktop: 2 kolom) */}
            <div className={styles.topRowGrid}>
              {/* Layanan & Dukungan */}
              <section className={`${styles.panel} ${styles.actionPanel}`} style={{ background: '#E8EAEE', border: 'none', boxShadow: '-6px -6px 10px rgba(255,255,255,0.72), 6px 6px 12px rgba(0,31,63,0.14)', borderRadius: '18px', backdropFilter: 'none' }}>
                <div className={styles.panelHeader}><div className={styles.panelHeaderLeft}><Phone size={16} color="var(--color-cobalt-blue)" /><h2>Layanan &amp; Dukungan</h2></div></div>
                <div className={styles.panelContent} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', justifyContent: 'center' }}>
                  {(isGuest || hasClientRestriction) && (
                  <div className={styles.publicPrompt}>
                  <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}><div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(0,31,63,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,31,63,0.12)' }}><Lock size={20} color="var(--color-space-grey)" /></div></div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '8px', color: 'var(--color-deep-navy)' }}>{hasClientRestriction ? 'Akses Terbatas' : 'Layanan & Dukungan'}</h3>
                  <p className={styles.restrictedText} style={{ fontSize: '0.85rem', marginBottom: '24px', lineHeight: 1.5 }}>{hasClientRestriction ? 'Anda tidak berwenang melihat riwayat servis lengkap untuk unit milik franchise lain.' : 'Laporkan masalah teknis ke tim servis kami atau login untuk melihat riwayat servis lengkap.'}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                    <button className={styles.btnEmergency} onClick={() => setShowServiceModal(true)}>Laporkan Masalah / Request Service</button>
                    {isGuest && (
                      <>
                        {/* Login buttons untuk upgrade akses */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                          {/* Untuk Klien / Franchise Owner */}
                          <button
                            className={styles.btnPrimary}
                            onClick={() => router.push(`/login?redirect=/id/${Array.isArray(token) ? token[0] : (token ?? '')}`)}
                          >
                            <UserCheck size={16} /> Masuk sebagai Pemilik Unit
                          </button>
                          {/* Untuk Teknisi / Partner */}
                          <button
                            style={{
                              width: '100%',
                              background: 'linear-gradient(135deg, #059669, #047857)',
                              color: '#fff',
                              border: 'none',
                              padding: '14px 20px',
                              borderRadius: 'var(--radius-md)',
                              fontFamily: 'var(--font-heading)',
                              fontWeight: 800,
                              fontSize: '0.92rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              boxShadow: '-3px -3px 8px rgba(255,255,255,0.12), 3px 3px 10px rgba(0,0,0,0.2), 0 4px 15px rgba(5,150,105,0.4)',
                            }}
                            onClick={() => router.push(`/login?redirect=/id/${Array.isArray(token) ? token[0] : (token ?? '')}&role=partner`)}
                          >
                            <Wrench size={16} /> Masuk sebagai Teknisi
                          </button>
                        </div>
                        <p className={styles.guestNote} style={{ fontSize: '0.72rem', marginTop: '8px', borderTop: 'var(--border-card)', paddingTop: '12px', lineHeight: 1.6 }}>
                          Pemilik unit, teknisi, atau mitra resmi Holicindo —<br/>masuk untuk mengakses informasi lengkap unit ini.
                        </p>
                      </>
                    )}
                  </div>
                  </div>
                  )}
              {isClient && belongsToClient && (
                <div className={styles.clientActions} style={{ width: '100%', textAlign: 'left' }}>
                  <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}><div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(59,130,246,0.2)' }}><UserCheck size={20} color="#3b82f6" /></div></div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '8px', textAlign: 'center' }}>Akses Pemilik (Fleet Owner)</h3>
                  <p className={styles.sectionInfo} style={{ textAlign: 'center', marginBottom: '24px' }}>Unit terdaftar sebagai aset resmi perusahaan Anda.</p>
                  <button className={styles.btnEmergency} onClick={() => setShowServiceModal(true)}>Request Emergency Service</button>
                </div>
              )}
              {isPartner && (
                <div className={styles.partnerActions} style={{ width: '100%', textAlign: 'left' }}>
                  <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}><div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(16,185,129,0.2)' }}><Wrench size={20} color="#10b981" /></div></div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '4px', textAlign: 'center' }}>Technical Partner Mode</h3>
                  <p className={styles.sectionInfo} style={{ textAlign: 'center', marginBottom: '16px', fontSize: '0.82rem' }}>Anda terverifikasi sebagai teknisi untuk unit ini.</p>
                  {unit.service_logs?.filter((l: any) => l.status === 'PENDING').length > 0 && (
                    <div style={{ background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.2)', borderRadius: '10px', padding: '12px 14px', marginBottom: '14px' }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#FF6B00', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF6B00', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />Tiket Aktif</div>
                      {unit.service_logs.filter((l: any) => l.status === 'PENDING').slice(0, 1).map((log: any) => (<div key={log.id}><div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff', marginBottom: '4px', fontFamily: 'monospace' }}>Call ID: {log.id}</div><div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4 }}>{(log.issue_description || '').slice(0, 80)}{log.issue_description?.length > 80 ? '…' : ''}</div></div>))}
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button className={styles.btnPrimary} onClick={() => { setTechName(user?.name || ''); setShowLogModal(true); }} style={{ background: 'linear-gradient(135deg, #059669, #047857)', boxShadow: '0 4px 12px rgba(5,150,105,0.3)' }}><Check size={16} /> Selesaikan &amp; Tutup Tiket</button>
                    <button className={styles.btnPrimary} onClick={() => { setTechName(user?.name || ''); setLogStatus('PENDING'); setShowLogModal(true); }}><Wrench size={16} /> Tambah Catatan Servis</button>
                  </div>
                </div>
              )}
              {isAdmin && (
                <div className={styles.adminActions} style={{ width: '100%', textAlign: 'left' }}>
                  <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}><div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(139,92,246,0.2)' }}><ShieldAlert size={20} color="#a78bfa" /></div></div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '8px', textAlign: 'center' }}>Administrator Control</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                    <button className={styles.btnEmergency} onClick={() => setShowServiceModal(true)}>Request Service</button>
                    <button className={styles.btnPrimary} onClick={() => setShowTransferModal(true)}>Pindahkan Kepemilikan</button>
                  </div>
                </div>
              )}
            </div>
          </section>

              {/* QR Card — di sebelah Layanan & Dukungan */}
              {isAdmin && <QrCard token={Array.isArray(token) ? token[0] : (token ?? '')} serialNumber={unit.serial_number} modelName={unit.model_name} />}
            </div>{/* end topRowGrid */}

          {/* QC Reports */}
          {(!isGuest && !hasClientRestriction) && (
          <section className={styles.panel} style={{ background: '#E8EAEE', border: 'none', boxShadow: '-6px -6px 10px rgba(255,255,255,0.72), 6px 6px 12px rgba(0,31,63,0.14)', borderRadius: '18px', backdropFilter: 'none' }}>
            <div className={styles.panelHeader}>
              <div className={styles.panelHeaderLeft}><FileText size={16} color="var(--color-cobalt-blue)" /><h2>QC Reports</h2></div>
              {isAdmin && (<div style={{ display: 'flex', gap: '8px' }}>
                {editBlocks.qc && <button className={styles.btnCancel} onClick={() => cancelEdit('qc')}>Batal</button>}
                <button className={editBlocks.qc ? styles.btnSave : styles.btnRevise} onClick={() => toggleEdit('qc')}>{editBlocks.qc ? (isSaving ? 'Menyimpan…' : 'Simpan') : 'Revisi'}</button>
              </div>)}
            </div>
            <div className={styles.mediaSingleItem} style={{ padding: '16px' }}>
              {editBlocks.qc ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#8f9bb3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Dokumen Laporan</p>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '12px', lineHeight: 1.5 }}>Laporan Test Run, Sistem Pendingin, dan Inspeksi dibuat melalui modul laporan.</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {/* Test Run upload */}
                      <div>
                        <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-space-grey)', marginBottom: '4px' }}>Test Run Results</p>
                        {editData.specs?.test_run_url ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#10b981' }}>
                            <CheckCircle2 size={14} /> File terupload
                            <button type="button" onClick={() => window.open(editData.specs.test_run_url, '_blank')} style={{ background: 'none', border: 'none', color: '#8bb2ff', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline' }}>Lihat</button>
                            <button type="button" onClick={() => handleEditChange('specs.test_run_url', '')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem' }}>Hapus</button>
                          </div>
                        ) : (
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '8px', padding: '10px 14px', cursor: qcUploading['test_run_url'] ? 'not-allowed' : 'pointer', color: '#8f9bb3', fontSize: '0.82rem', background: 'rgba(255,255,255,0.02)', opacity: qcUploading['test_run_url'] ? 0.6 : 1 }}>
                            <ImageIcon size={16} />{qcUploading['test_run_url'] ? 'Mengupload...' : 'Klik untuk upload file (PDF/JPG/PNG)'}
                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} disabled={qcUploading['test_run_url']} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleQcFileUpload('test_run_url', f); }} />
                          </label>
                        )}
                      </div>
                      {/* Cooling report links */}
                      <div>
                        <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-space-grey)', marginBottom: '4px' }}>Laporan Sistem Pendingin</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {[{ label: 'Cooling System Report 1 Suhu', path: '/reports/cooling', type: 'COOLING_1' }, { label: 'Cooling System Report 2 Suhu', path: '/reports/cooling2', type: 'COOLING_2' }, { label: 'Cooling System Report 3 Suhu', path: '/reports/cooling3', type: 'COOLING_3' }, { label: 'Cooling System Report Warm', path: '/reports/reportwarm', type: 'COOLING_WARM' }].map(({ label, path, type }) => {
                            const count = unitReports.filter((r: any) => r.form_type === type).length;
                            return (<button key={path} type="button" onClick={() => { if (count === 1) { const r = unitReports.find((r: any) => r.form_type === type); if (r) router.push(`/reports/view/${r.id}`); } else if (count > 1) router.push(`/reports/history?unit=${unit?.id}&type=${type}`); else router.push(`${path}?unit=${unit?.id}`); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(46,91,255,0.1)', border: '1px solid rgba(46,91,255,0.3)', borderRadius: '8px', padding: '10px 14px', cursor: 'pointer', color: '#8bb2ff', fontSize: '0.82rem', fontFamily: 'inherit', width: '100%' }}>
                              <FileText size={15} />{label}{count > 0 && <span style={{ marginLeft: '4px', background: 'rgba(16,185,129,0.2)', color: '#10b981', borderRadius: '10px', padding: '1px 6px', fontSize: '0.7rem', fontWeight: 700 }}>{count}</span>}<ExternalLink size={13} style={{ marginLeft: 'auto' }} />
                            </button>);
                          })}
                        </div>
                      </div>
                      {/* Inspection report link */}
                      <div>
                        <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-space-grey)', marginBottom: '4px' }}>Laporan Inspeksi</p>
                        {(() => { const count = unitReports.filter((r: any) => r.form_type === 'INSPECTION').length; return (
                          <button type="button" onClick={() => { if (count === 1) { const r = unitReports.find((r: any) => r.form_type === 'INSPECTION'); if (r) router.push(`/reports/view/${r.id}`); } else if (count > 1) router.push(`/reports/history?unit=${unit?.id}&type=INSPECTION`); else router.push(`/reports/inspection?unit=${unit?.id}`); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(46,91,255,0.1)', border: '1px solid rgba(46,91,255,0.3)', borderRadius: '8px', padding: '10px 14px', cursor: 'pointer', color: '#8bb2ff', fontSize: '0.82rem', fontFamily: 'inherit', width: '100%' }}>
                            <FileText size={15} />{count > 0 ? `Lihat ${count} Inspection Report` : 'Buat Inspection Report (QC)'}{count > 0 && <span style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981', borderRadius: '10px', padding: '1px 6px', fontSize: '0.7rem', fontWeight: 700 }}>{count}</span>}<ExternalLink size={13} style={{ marginLeft: 'auto' }} />
                          </button>); })()}
                      </div>
                      {/* ITR upload */}
                      {(() => { const key = 'itr_url'; return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ fontSize: '0.8rem', color: 'var(--color-space-grey)', fontWeight: 600 }}>ITR — Inventory Transfer Request</label>
                          {editData.specs?.[key] ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#10b981' }}>
                              <CheckCircle2 size={14} /> File terupload
                              <button type="button" onClick={() => window.open(editData.specs[key], '_blank')} style={{ background: 'none', border: 'none', color: '#8bb2ff', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline' }}>Lihat</button>
                              <button type="button" onClick={() => handleEditChange(`specs.${key}`, '')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem' }}>Hapus</button>
                            </div>
                          ) : (
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '8px', padding: '10px 14px', cursor: 'pointer', color: '#8f9bb3', fontSize: '0.82rem', background: 'rgba(255,255,255,0.02)', opacity: qcUploading[key] ? 0.6 : 1 }}>
                              <ImageIcon size={16} />{qcUploading[key] ? 'Mengupload...' : 'Klik untuk upload file (PDF/JPG/PNG)'}
                              <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} disabled={qcUploading[key]} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleQcFileUpload(key, f); }} />
                            </label>
                          )}
                        </div>); })()}
                      {/* Work Order upload */}
                      {(() => { const key = 'work_order_url'; return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ fontSize: '0.8rem', color: 'var(--color-space-grey)', fontWeight: 600 }}>Work Order</label>
                          {editData.specs?.[key] ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#10b981' }}>
                              <CheckCircle2 size={14} /> File terupload
                              <button type="button" onClick={() => window.open(editData.specs[key], '_blank')} style={{ background: 'none', border: 'none', color: '#8bb2ff', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline' }}>Lihat</button>
                              <button type="button" onClick={() => handleEditChange(`specs.${key}`, '')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem' }}>Hapus</button>
                            </div>
                          ) : (
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '8px', padding: '10px 14px', cursor: 'pointer', color: '#8f9bb3', fontSize: '0.82rem', background: 'rgba(255,255,255,0.02)', opacity: qcUploading[key] ? 0.6 : 1 }}>
                              <ImageIcon size={16} />{qcUploading[key] ? 'Mengupload...' : 'Klik untuk upload file (PDF/JPG/PNG)'}
                              <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} disabled={qcUploading[key]} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleQcFileUpload(key, f); }} />
                            </label>
                          )}
                        </div>); })()}
                      {/* Component Reports upload */}
                      {(() => { const key = 'component_reports_url'; return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ fontSize: '0.8rem', color: 'var(--color-space-grey)', fontWeight: 600 }}>Component Reports</label>
                          {editData.specs?.[key] ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#10b981' }}>
                              <CheckCircle2 size={14} /> File terupload
                              <button type="button" onClick={() => window.open(editData.specs[key], '_blank')} style={{ background: 'none', border: 'none', color: '#8bb2ff', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline' }}>Lihat</button>
                              <button type="button" onClick={() => handleEditChange(`specs.${key}`, '')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem' }}>Hapus</button>
                            </div>
                          ) : (
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '8px', padding: '10px 14px', cursor: 'pointer', color: '#8f9bb3', fontSize: '0.82rem', background: 'rgba(255,255,255,0.02)', opacity: qcUploading[key] ? 0.6 : 1 }}>
                              <ImageIcon size={16} />{qcUploading[key] ? 'Mengupload...' : 'Klik untuk upload file (PDF/JPG/PNG)'}
                              <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} disabled={qcUploading[key]} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleQcFileUpload(key, f); }} />
                            </label>
                          )}
                        </div>); })()}
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />
                  {/* Glass Dimension dan PIC telah dipindahkan. Data ditarik dari Laporan Inspeksi (Read Only). */}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {/* View mode: report buttons + glass/PIC/gallery summaries */}
                  {(() => {
                    const coolingTypes = ['COOLING_1', 'COOLING_2', 'COOLING_3', 'COOLING_WARM'];
                    const coolingLabels: Record<string, string> = { COOLING_1: '1 Suhu', COOLING_2: '2 Suhu (Cake & RTD)', COOLING_3: '3 Suhu (Cake, Ambient & RTD)', COOLING_WARM: 'Warm' };
                    const coolingCountByType = coolingTypes.reduce((acc, t) => { acc[t] = unitReports.filter((r: any) => r.form_type === t).length; return acc; }, {} as Record<string, number>);
                    const coolingTotal = Object.values(coolingCountByType).reduce((a, b) => a + b, 0);
                    const coolingTooltip = coolingTotal > 0 ? coolingTypes.filter(t => coolingCountByType[t] > 0).map(t => `${coolingLabels[t]}: ${coolingCountByType[t]}`).join('\n') : 'Laporan belum dibuat';
                    const items = [
                      { label: 'Test Run Results', urlKey: 'test_run_url', desc: null, routePath: null, formType: null },
                      { label: 'Cooling System Report', urlKey: 'cooling_report_url', desc: coolingTooltip, routePath: '/reports/cooling', formType: '__COOLING__' },
                      { label: 'Inspection Report', urlKey: 'inspection_url', desc: null, routePath: '/reports/inspection', formType: 'INSPECTION' },
                      { label: 'ITR', urlKey: 'itr_url', desc: 'Inventory Transfer Request', routePath: null, formType: null },
                      { label: 'Work Order', urlKey: 'work_order_url', desc: 'Work Order Document', routePath: null, formType: null },
                      { label: 'Component Reports', urlKey: 'component_reports_url', desc: 'Component Reports Document', routePath: null, formType: null },
                    ];
                    return items.map(({ label, urlKey, desc, routePath, formType }) => {
                      const url = unit?.specs?.[urlKey]; const isReportLink = routePath !== null; const isCooling = formType === '__COOLING__';
                      const isClickable = isReportLink ? true : !!url; const unitParam = unit?.id ? `?unit=${unit.id}` : '';
                      const reportCount = isCooling ? coolingTotal : (formType ? unitReports.filter((r: any) => r.form_type === formType).length : 0);
                      return (
                        <div key={urlKey} style={{ position: 'relative' }}>
                          <button type="button" onClick={() => {
                            if (isReportLink) { if (isCooling) { if (coolingTotal === 1) { const r = unitReports.find((r: any) => coolingTypes.includes(r.form_type)); if (r) router.push(`/reports/view/${r.id}`); } else if (coolingTotal > 1) router.push(`/reports/history?unit=${unit?.id}&type=COOLING_1`); else router.push(`/reports/cooling${unitParam}`); } else { if (reportCount === 1) { const r = unitReports.find((r: any) => r.form_type === formType); if (r) router.push(`/reports/view/${r.id}`); } else if (reportCount > 1) router.push(`/reports/history?unit=${unit?.id}&type=${formType}`); else router.push(`${routePath}${unitParam}`); } } else if (url) window.open(typeof url === 'string' ? url : String(url), '_blank');
                          }} disabled={!isClickable} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: isClickable ? 'linear-gradient(135deg, #2E5BFF, #1a3fd4)' : 'rgba(255,255,255,0.05)', borderRadius: '10px', cursor: isClickable ? 'pointer' : 'not-allowed', border: isClickable ? 'none' : '1px solid rgba(255,255,255,0.08)', width: '100%', textAlign: 'left', color: isClickable ? '#fff' : '#64748b', fontFamily: 'inherit', fontWeight: isClickable ? 700 : 500, fontSize: '0.88rem', opacity: isClickable ? 1 : 0.6, boxShadow: isClickable ? '0 4px 12px rgba(46,91,255,0.3)' : 'none' }}>
                            <FileText size={16} color={isClickable ? '#fff' : '#64748b'} style={{ flexShrink: 0 }} />
                            <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1px' }}>
                              <span>{label}</span>
                              {isReportLink && <span style={{ fontSize: '0.68rem', fontWeight: 400, opacity: 0.8 }}>{reportCount > 0 ? `${reportCount} laporan tersedia` : 'Belum ada laporan'}</span>}
                            </span>
                            {isReportLink && reportCount > 0 && <span style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981', borderRadius: '10px', padding: '1px 7px', fontSize: '0.7rem', fontWeight: 700 }}>{reportCount}</span>}
                            {(isReportLink || url) && <ExternalLink size={15} color="rgba(255,255,255,0.8)" style={{ flexShrink: 0 }} />}
                          </button>
                        </div>
                      );
                    });
                  })()}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', margin: '4px 0' }} />
                  {(() => {
                    const inspReport = unitReports.find((r: any) => r.form_type === 'INSPECTION');
                    const inspData = inspReport?.data || {};
                    const kaca = inspData.dimensions?.kaca || {};
                    const works = inspData.works || [];
                    const filledWorks = works.filter((w: any) => w.name && w.name.trim() !== '');
                    const hasKaca = Object.values(kaca).some(v => v);
                    const hasWorks = filledWorks.length > 0;
                    return (
                      <>
                        {/* Glass Dimension */}
                        <div style={{ marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: hasKaca ? '8px 8px 0 0' : '8px' }}>
                            <FileText size={15} color="#8bb2ff" /><span style={{ flex: 1, fontSize: '0.85rem' }}>Glass Dimension (Source: Inspection Report)</span>
                            {hasKaca ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(16,185,129,0.12)', color: '#10b981', borderRadius: '20px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: 700 }}><Check size={11} /> Ada</span> : <span style={{ background: 'rgba(255,255,255,0.06)', color: '#64748b', borderRadius: '20px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: 600 }}>Belum ada data</span>}
                          </div>
                          {hasKaca && (
                            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '0 0 8px 8px', padding: '8px 12px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                              {kaca.depan && <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Depan: <strong style={{ color: '#e2e8f0' }}>{kaca.depan}</strong></span>}
                              {kaca.samping && <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Samping: <strong style={{ color: '#e2e8f0' }}>{kaca.samping}</strong></span>}
                              {kaca.atas && <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Atas: <strong style={{ color: '#e2e8f0' }}>{kaca.atas}</strong></span>}
                              {kaca.pintu && <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Pintu: <strong style={{ color: '#e2e8f0' }}>{kaca.pintu}</strong></span>}
                              {kaca.tingkatan && <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Rak: <strong style={{ color: '#e2e8f0' }}>{kaca.tingkatan}</strong></span>}
                            </div>
                          )}
                        </div>

                        {/* Production PIC */}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: hasWorks ? '8px 8px 0 0' : '8px' }}>
                            <UserCheck size={15} color="#8bb2ff" /><span style={{ flex: 1, fontSize: '0.85rem' }}>Production PIC (Source: Inspection Report)</span>
                            {hasWorks ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(16,185,129,0.12)', color: '#10b981', borderRadius: '20px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: 700 }}><Check size={11} /> {filledWorks.length} Personil</span> : <span style={{ background: 'rgba(255,255,255,0.06)', color: '#64748b', borderRadius: '20px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: 600 }}>Belum ada data</span>}
                          </div>
                          {hasWorks && (
                            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '0 0 8px 8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {filledWorks.slice(0, 3).map((w: any, idx: number) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: idx < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none', paddingBottom: idx < 2 ? '8px' : 0 }}>
                                  <span style={{ fontSize: '0.78rem', color: '#94a3b8', width: '45%' }}>{w.label}</span>
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                    <span style={{ fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 600 }}>{w.name}</span>
                                    {w.time && <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Waktu: {w.time} hari</span>}
                                  </div>
                                </div>
                              ))}
                              {filledWorks.length > 3 && (
                                <button type="button" onClick={() => setShowAllPicModal(true)} style={{ marginTop: '4px', width: '100%', padding: '8px', background: 'rgba(46,91,255,0.1)', border: '1px solid rgba(46,91,255,0.2)', borderRadius: '6px', color: '#8bb2ff', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}>
                                  Lihat Seluruh PIC Produksi ({filledWorks.length}) <span>›</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </section>
          )}

            {/* IoT — Customer: Health Index Widget (mock data, no raw sensor values) */}
            {isClient && !isAdmin && !isPartner && unit.id && (
              <section className={`${styles.panel} ${styles.iotPanel}`}>
                <div className={styles.panelHeader}>
                  <div className={styles.panelHeaderLeft}>
                    <span style={{ fontSize: '1rem' }}>📡</span>
                    <h2>Kesehatan Unit</h2>
                  </div>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '20px', padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                    LIVE
                  </span>
                </div>
                <div className={styles.panelContent}>
                  <CustomerHealthWidget isDark={isDark} />
                </div>
              </section>
            )}

            {/* IoT — Admin/Partner: Raw Sensor Real-Time */}
            {(isPartner || isAdmin) && unit.id && (
              <section className={`${styles.panel} ${styles.iotPanel}`}>
                <div className={styles.panelHeader}>
                  <div className={styles.panelHeaderLeft}>
                    <span style={{ fontSize: '1rem' }}>📡</span>
                    <h2>Sensor Real-Time</h2>
                  </div>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '20px', padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                    LIVE
                  </span>
                </div>
                <div className={styles.panelContent}>
                  <IotTelemetryWidget unitId={unit.id} unitModel={unit.model_name} isDark={isDark} />
                </div>
              </section>
            )}

            {/* IoT Sensor History — Admin/Partner only */}
            {(isPartner || isAdmin) && unit.id && (
              <section className={`${styles.panel} ${styles.iotPanel}`}>
                <div className={styles.panelHeader}>
                  <div className={styles.panelHeaderLeft}>
                    <span style={{ fontSize: '1rem' }}>📊</span>
                    <h2>Riwayat Sensor</h2>
                  </div>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, background: 'rgba(46,91,255,0.1)', color: '#2E5BFF', border: '1px solid rgba(46,91,255,0.2)', borderRadius: '20px', padding: '3px 8px' }}>
                    Histori & Avg
                  </span>
                </div>
                <div className={styles.panelContent}>
                  <IotHistoryWidget unitId={unit.id} isDark={isDark} />
                </div>
              </section>
            )}

            {/* Stats Card — full width di desktop, jadi item carousel di mobile */}
            <section className={`${styles.panel} ${styles.statsFullWidth}`} style={{ gridColumn: '1 / -1', margin: 0 }}>
              <div className={styles.panelHeader}><div className={styles.panelHeaderLeft}><Settings size={16} color="var(--color-cobalt-blue)" /><h2>Stats Card</h2></div></div>
              <div className={`${styles.statsGrid} ${styles.panelContent}`}>
                {[
                  { tip: 'Kondisi operasional unit saat ini.', icon: <CheckCircle2 size={24} />, cls: styles.success, title: 'Status Unit', status: 'Normal', color: 'var(--color-cobalt-blue)', sub: 'Unit beroperasi dengan baik' },
                  { tip: 'Masa garansi resmi dari Holicindo.', icon: <ShieldAlert size={24} />, cls: isWarrantyActive ? styles.success : styles.warning, title: 'Garansi', status: isWarrantyActive ? 'Aktif' : 'Kedaluwarsa', color: isWarrantyActive ? 'var(--color-cobalt-blue)' : '#f59e0b', sub: isWarrantyActive ? `Hingga ${expiryDate?.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) || ''}` : 'Hubungi support' },
                  { tip: 'Tanggal terakhir unit diservis.', icon: <Wrench size={24} />, cls: styles.info, title: 'Last Service', status: 'Belum Ada', color: '#336bd9ff', sub: 'Belum pernah diservis' },
                  { tip: 'Estimasi jadwal servis berikutnya.', icon: <Clock size={24} />, cls: styles.info, title: 'Next Service', status: 'Disarankan', color: '#3b82f6', sub: 'Dalam 180 hari' },
                  { tip: 'Status keaslian unit.', icon: <CheckCircle2 size={24} />, cls: styles.success, title: 'Verifikasi', status: 'Asli', color: 'var(--color-cobalt-blue)', sub: 'Unit terverifikasi Holicindo' },
                ].map((s) => (
                  <div key={s.title} className={styles.statusItem} style={{ position: 'relative' }}>
                    <span className={styles.statTooltipAnchor}><HelpCircle size={12} className={styles.statTooltipIcon} /><span className={styles.statTooltip}>{s.tip}</span></span>
                    <div className={`${styles.statusIcon} ${s.cls}`}>{s.icon}</div>
                    <div className={styles.statusText}>
                      <h3>{s.title}</h3>
                      <p style={{ color: s.color }}>{s.status}</p>
                      <span>{s.sub}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>{/* end passportRight */}
        </div>{/* end passportLayout */}
        </div>{/* end carouselWrapper */}

        {/* Media Modal */}
        {selectedMedia && (
          <div className={styles.modalOverlay} onClick={() => setSelectedMedia(null)}>
            <div className={styles.modalContent} style={{ maxWidth: '900px', width: '90%', padding: '24px', background: 'rgba(6,13,33,0.95)', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader} style={{ marginBottom: '20px' }}>
                <h2>{selectedMedia === 'diagram' || selectedMedia === unit?.diagram_image_url ? 'Diagram Sirkulasi Udara' : 'Foto Test Run QC'}</h2>
                <button className={styles.closeBtn} onClick={() => setSelectedMedia(null)}>×</button>
              </div>
              <div style={{ width: '100%', height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', borderRadius: '8px', overflow: 'hidden' }}>
                {selectedMedia === 'diagram' ? <div style={{ transform: 'scale(1.5)' }}><AirflowDiagram /></div> : <img src={selectedMedia} alt="Media" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />}
              </div>
            </div>
          </div>
        )}

        {/* Modal All PIC Produksi */}
        {showAllPicModal && (() => {
          const inspReport = unitReports.find((r: any) => r.form_type === 'INSPECTION');
          const works = inspReport?.data?.works || [];
          const filledWorks = works.filter((w: any) => w.name && w.name.trim() !== '');
          return (
            <div className={styles.modalOverlay} onClick={() => setShowAllPicModal(false)}>
              <div className={styles.modalContent} style={{ maxWidth: '600px', width: '90%', padding: '24px', background: 'var(--color-slate-900)', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader} style={{ marginBottom: '20px' }}>
                  <h2 style={{ color: '#fff', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}><UserCheck size={20} color="#8bb2ff" /> Seluruh Personil Produksi</h2>
                  <button className={styles.closeBtn} onClick={() => setShowAllPicModal(false)} style={{ color: '#fff' }}>×</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '60vh', overflowY: 'auto' }}>
                  {filledWorks.map((w: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ fontSize: '0.85rem', color: '#94a3b8', width: '50%' }}>{w.label}</span>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: '0.9rem', color: '#e2e8f0', fontWeight: 700 }}>{w.name}</span>
                        {w.time && <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Waktu: {w.time} hari</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Modals */}
        <ServiceRequestModal show={showServiceModal} onClose={closeServiceModal} onSubmit={handleServiceRequest} loading={routingLoading} routingResult={routingResult}
          unitType={autoUnitType}
          storeName={storeName} setStoreName={setStoreName} serviceName={serviceName} setServiceName={setServiceName} servicePhone={servicePhone} setServicePhone={setServicePhone}
          issueMainCategory={issueMainCategory} setIssueMainCategory={setIssueMainCategory} issueSubCategory={issueSubCategory} setIssueSubCategory={setIssueSubCategory}
          serviceNotes={serviceNotes} setServiceNotes={setServiceNotes} />
        <PartnerLogModal show={showLogModal} onClose={closeLogModal} onSubmit={handleAddLog} loading={logLoading} unit={unit}
          techName={techName} setTechName={setTechName} logType={logType} setLogType={setLogType} logNotes={logNotes} setLogNotes={setLogNotes}
          logStatus={logStatus} setLogStatus={setLogStatus} logComponents={logComponents} setLogComponents={setLogComponents} />
        <AdminTransferModal show={showTransferModal} onClose={() => setShowTransferModal(false)} onSubmit={handleTransfer} loading={transferLoading}
          unit={unit} clients={clients} targetClientId={targetClientId} setTargetClientId={setTargetClientId} transferReason={transferReason} setTransferReason={setTransferReason} />
        <AllSpecsModal show={showAllSpecsModal} onClose={() => setShowAllSpecsModal(false)} unit={unit} />
      </div>

      <footer className={styles.footerCopyright}>Copyright &copy; 2026 PT. Holicindo Dasa Anugerah. All rights reserved.</footer>
    </div>
  );
}
