'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert, Wrench, FileText, CheckCircle2,
  ExternalLink, Phone, ArrowLeft, Loader2,
  Lock, Check, UserCheck, Settings, BookOpen, Clock, Image as ImageIcon,
  HelpCircle, Package, ChevronLeft, ChevronRight, Activity, BarChart2, FilePlus,
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
import SelectReportTypeModal from './components/SelectReportTypeModal';
import { INDONESIA_CITIES, getUnitType, UNIT_TYPE_LABELS, UNIT_TYPE_COLORS } from './constants';
import styles from './id.module.css';

export default function QrPassportPage() {
  const router = useRouter();
  const passport = usePassportData();
  const {
    token, unit, user, loading, error,
    carouselRef, unitReports,
    toast, showToast, clearToast, loadUnitData,
    isGuest, isClient, isPartner, isAdmin, isQC,
    belongsToClient, hasClientRestriction,
    isWarrantyActive, expiryDate,
  } = passport;

  const autoUnitType = unit ? getUnitType(unit.model_name) : 'MESIN';
  const [photoIdx, setPhotoIdx] = useState(0);
  const [showReportSelector, setShowReportSelector] = useState(false);
  const [iotSlideTab, setIotSlideTab] = useState<'realtime' | 'history'>('realtime');

  useEffect(() => {
    if (!unit) return;

    if (isClient) {
      router.replace(`/client-portal/units/${encodeURIComponent(unit.id)}`);
      return;
    }
  }, [unit, isClient, router]);

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
  const [showImageModal, setShowImageModal] = useState<string | null>(null);

  // Anti-zoom effect: keep content at 100% scale regardless of browser zoom
  useEffect(() => {
    const handleZoom = () => {
      const container = document.querySelector(`.${styles.container}`) as HTMLElement;
      if (!container) return;

      // Detect browser zoom level
      const zoomLevel = Math.round((window.outerWidth / window.innerWidth) * 100) / 100;
      
      // Counter-scale to maintain 100% size
      if (zoomLevel !== 1) {
        container.style.transform = `scale(${1 / zoomLevel})`;
        container.style.transformOrigin = 'top center';
        container.style.width = `${95 * zoomLevel}%`;
        container.style.maxWidth = `${1600 * zoomLevel}px`;
      } else {
        container.style.transform = 'none';
        container.style.width = '95%';
        container.style.maxWidth = '1600px';
      }
    };

    handleZoom();
    window.addEventListener('resize', handleZoom);
    return () => window.removeEventListener('resize', handleZoom);
  }, []);

  if (loading) return <div className={styles.loadingContainer} suppressHydrationWarning><Loader2 className={styles.spinner} size={48} /><p>Memindai QR Passport...</p></div>;
  if (error || !unit) return (
    <div className={styles.errorContainer}><div className={styles.errorCard}>
      <ShieldAlert size={48} className={styles.errorIcon} />
      <h2>Unit Tidak Terdaftar</h2>
      <p>{error || 'QR Code yang Anda pindai tidak valid atau sudah kedaluwarsa.'}</p>
      <button onClick={() => router.push('/')} className={styles.btnBack}><ArrowLeft size={16} /> Kembali ke Beranda</button>
    </div></div>
  );

  return (
    <div className={styles.pageWrapper} data-page="passport">
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
          <div className={styles.passportLeft}>

          {/* Slide 1: Spesifikasi Utama */}
          <section className={`${styles.panel} ${styles.iotPanel}`} style={{ borderRadius: "20px" }}>
            <div className={styles.panelHeader}>
              <div className={styles.panelHeaderLeft}><FileText size={16} color="#60a5fa" /><h2>Spesifikasi Utama</h2></div>
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
                            style={{ transition: 'opacity 0.2s ease', cursor: 'zoom-in' }}
                            onClick={() => setShowImageModal(photos[clampedIdx])}
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
                    <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Tipe / Type</label>
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
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>Foto Utama Unit</label>
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
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px dashed rgba(0,31,63,0.2)', borderRadius: '10px', padding: '10px 14px', cursor: photoGalleryUploading ? 'not-allowed' : 'pointer', color: 'var(--color-space-grey)', fontSize: '0.82rem', background: '#E8EAEE', boxShadow: 'inset 2px 2px 5px rgba(0,31,63,0.08), inset -2px -2px 5px rgba(255,255,255,0.6)', opacity: photoGalleryUploading ? 0.6 : 1 }}>
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
              {!editBlocks.spesifikasi && !isGuest && <button className={styles.btnViewAll} onClick={() => setShowAllSpecsModal(true)}>Lihat Semua Spesifikasi <span>›</span></button>}
            </div>
          </section>

          {/* Slide 6: Ownership */}
          {(!isGuest && !hasClientRestriction) && (
          <section className={`${styles.panel} ${styles.iotPanel}`} style={{ borderRadius: "20px" }}>
            <div className={styles.panelHeader}>
              <div className={styles.panelHeaderLeft}><UserCheck size={16} color="#60a5fa" /><h2>Ownership</h2></div>
              {isAdmin && (<div style={{ display: 'flex', gap: '8px' }}>
                {editBlocks.ownership && <button className={styles.btnCancel} onClick={() => cancelEdit('ownership')}>Batal</button>}
                <button className={editBlocks.ownership ? styles.btnSave : styles.btnRevise} onClick={() => toggleEdit('ownership')}>{editBlocks.ownership ? (isSaving ? 'Menyimpan…' : 'Simpan') : 'Revisi'}</button>
              </div>)}
            </div>
            <div className={styles.panelContent}>
              {editBlocks.ownership ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingBottom: '16px' }}>
                  <div className={styles.editRow}><div className={styles.editGroup}>
                    <span className={styles.editLabel}>Customer Name</span>
                    <CustomSelect
                      value={editData.current_client_id || editData.current_client?.id || ''}
                      onChange={(val) => {
                        const selectedClient = clients.find(c => c.id === val);
                        handleEditChange('current_client_id', val);
                        if (selectedClient) {
                          handleEditChange('current_client', selectedClient);
                        } else if (val === '') {
                          handleEditChange('current_client', null);
                        }
                      }}
                      options={[
                        { value: '', label: '-- Tidak ada Klien (Unassigned) --' },
                        ...clients.map((c: any) => ({
                          value: c.id,
                          label: c.company_name || c.name
                        }))
                      ]}
                      placeholder="Cari atau pilih klien..."
                      showSearch={true}
                    />
                  </div></div>
                  <EditField label="HQ Address (Pusat)" value={editData.specs?.hq_address || ''} onChange={(v) => handleEditChange('specs.hq_address', v)} />
                  <EditField label="SO Number" value={editData.specs?.so_number || ''} onChange={(v) => handleEditChange('specs.so_number', v)} />
                  <EditField label="DO Number" value={editData.specs?.do_number || ''} onChange={(v) => handleEditChange('specs.do_number', v)} />
                  <DatePicker label="Delivery Date" value={editData.specs?.delivery_date ? editData.specs.delivery_date.slice(0, 10) : ''} onChange={(v) => handleEditChange('specs.delivery_date', v)} theme="light" />
                  
                  <div style={{ marginTop: '12px', marginBottom: '8px', padding: '6px 14px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, color: '#93c5fd', background: 'rgba(46,91,255,0.2)' }}>Lokasi Unit (Branch)</div>
                  <EditField label="Outlet Branch" value={editData.outlet_branch || ''} onChange={(v) => handleEditChange('outlet_branch', v)} />
                  <EditField label="Branch Address (Jalan)" value={editData.specs?.branch_address || ''} onChange={(v) => handleEditChange('specs.branch_address', v)} />
                  <div className={styles.editRow}><div className={styles.editGroup}>
                    <span className={styles.editLabel}>Kota (City)</span>
                    <CustomSelect
                      value={editData.city || ''}
                      onChange={(val) => handleEditChange('city', val)}
                      options={[
                        { value: '', label: '-- Pilih Kota --' },
                        ...INDONESIA_CITIES.map((item) => ({
                          value: item.city,
                          label: `${item.city} (${item.province})`
                        }))
                      ]}
                      placeholder="Cari atau pilih kota..."
                      showSearch={true}
                    />
                  </div></div>
                </div>
              ) : (<>
                <div className={styles.specItem}><span className={styles.specLabel}>Customer Name</span><span className={styles.specValue}>{unit.current_client?.company_name || '—'}</span></div>
                <div className={styles.specItem}><span className={styles.specLabel}>HQ Address</span><span className={styles.specValue}>{unit.specs?.hq_address || '—'}</span></div>
                <div className={styles.specItem}><span className={styles.specLabel}>SO Number</span><span className={styles.specValue}>{unit.specs?.so_number || '—'}</span></div>
                <div className={styles.specItem}><span className={styles.specLabel}>DO Number</span><span className={styles.specValue}>{unit.specs?.do_number || '—'}</span></div>
                <div className={styles.specItem}><span className={styles.specLabel}>Delivery Date</span><span className={styles.specValue}>{unit.specs?.delivery_date ? new Date(unit.specs.delivery_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</span></div>
                
                <div style={{ marginTop: '12px', padding: '6px 14px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'rgba(46,91,255,0.2)' }}>Lokasi Unit (Branch)</div>
                <div className={styles.specItem}><span className={styles.specLabel}>Outlet Branch</span><span className={styles.specValue}>{unit.outlet_branch || '—'}</span></div>
                <div className={styles.specItem}><span className={styles.specLabel}>Branch Address</span><span className={styles.specValue}>{unit.specs?.branch_address || '—'}</span></div>
                <div className={styles.specItem} style={{ borderBottom: 'none' }}><span className={styles.specLabel}>City & Province</span><span className={styles.specValue}>{unit.city ? (() => { const m = INDONESIA_CITIES.find(c => c.city === unit.city); return m ? `${unit.city}, ${m.province}` : unit.city; })() : '—'}</span></div>
              </>)}
            </div>
          </section>
          )}

          {/* Slide 3: Stats Card (Ringkasan Unit) — Dipindahkan ke Kolom Kiri agar seimbang & compact */}
          {!isGuest && (
          <section className={`${styles.panel} ${styles.iotPanel}`} style={{ borderRadius: "20px" }}>
            <div className={styles.panelHeader}>
              <div className={styles.panelHeaderLeft}>
                <Settings size={16} color="#60a5fa" />
                <h2>Status &amp; Garansi</h2>
              </div>
            </div>
            <div className={styles.panelContent} style={{ padding: '14px' }}>
              <div className={styles.statsGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {[
                  { tip: 'Kondisi operasional unit saat ini.', icon: <CheckCircle2 size={18} />, cls: styles.success, title: 'Status Unit', status: 'Normal', color: '#34d399', sub: 'Beroperasi baik' },
                  { tip: 'Masa garansi resmi dari Holicindo.', icon: <ShieldAlert size={18} />, cls: isWarrantyActive ? styles.success : styles.warning, title: 'Garansi', status: isWarrantyActive ? 'Aktif' : 'Kedaluwarsa', color: isWarrantyActive ? '#34d399' : '#f59e0b', sub: isWarrantyActive ? `${expiryDate?.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) || ''}` : 'Hubungi support' },
                  { tip: 'Tanggal terakhir unit diservis.', icon: <Wrench size={18} />, cls: styles.info, title: 'Last Service', status: 'Belum Ada', color: '#60a5fa', sub: 'Belum pernah' },
                  { tip: 'Estimasi jadwal servis berikutnya.', icon: <Clock size={18} />, cls: styles.info, title: 'Next Service', status: 'Disarankan', color: '#60a5fa', sub: 'Dalam 180 hari' },
                  { tip: 'Status keaslian unit.', icon: <CheckCircle2 size={18} />, cls: styles.success, title: 'Verifikasi', status: 'Asli', color: '#34d399', sub: 'Terverifikasi' },
                ].map((s, idx) => (
                  <div
                    key={s.title}
                    className={styles.statusItem}
                    style={{
                      padding: '10px 12px',
                      gap: '10px',
                      borderRadius: '12px',
                      gridColumn: idx === 4 ? '1 / -1' : 'auto' // Item ke-5 membentang penuh 2 kolom agar rapi
                    }}
                  >
                    <span className={styles.statTooltipAnchor}><HelpCircle size={11} className={styles.statTooltipIcon} /><span className={styles.statTooltip}>{s.tip}</span></span>
                    <div className={`${styles.statusIcon} ${s.cls}`} style={{ width: '32px', height: '32px', minWidth: '32px' }}>{s.icon}</div>
                    <div className={styles.statusText} style={{ gap: '2px' }}>
                      <h3 style={{ fontSize: '0.62rem' }}>{s.title}</h3>
                      <p style={{ color: s.color, fontSize: '0.82rem' }}>{s.status}</p>
                      <span style={{ fontSize: '0.65rem' }}>{s.sub}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
          )}

          </div>{/* ── END passportLeft ── */}

          {/* ── KOLOM KANAN: Layanan + QC + Manuals + Ownership + IoT ── */}
          <div className={styles.passportRight}>

            {/* Baris atas: Manuals (kiri) + Layanan & Dukungan (tengah) + QR Card (kanan) */}
            <div className={styles.topRowGrid}>
              {/* Slide 5: Manuals (Kiri) */}
              {(isAdmin || isPartner) && (
              <section className={`${styles.panel} ${styles.iotPanel}`} style={{ borderRadius: "18px", margin: 0, display: 'flex', flexDirection: 'column' }}>
                <div className={styles.panelHeader}>
                  <div className={styles.panelHeaderLeft}><BookOpen size={16} color="#60a5fa" /><h2>Manuals</h2></div>
                  {isQC && (
                  <div className={styles.partnerActions} style={{ width: '100%', textAlign: 'left' }}>
                    <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(16,185,129,0.3)' }}>
                        <CheckCircle2 size={20} color="#10b981" />
                      </div>
                    </div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '4px', textAlign: 'center', color: '#ffffff' }}>Quality Control Mode</h3>
                    <p className={styles.sectionInfo} style={{ textAlign: 'center', marginBottom: '16px', fontSize: '0.82rem', color: '#cbd5e1' }}>Inspeksi kualitas, sensor, dan laporan unit.</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <button className={styles.btnPrimary} onClick={() => setShowReportSelector(true)} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#ffffff', border: 'none', fontWeight: 700, padding: '12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <FileText size={16} /> Buka / Buat QC Report
                      </button>
                    </div>
                  </div>
                )}
                {isAdmin && (<div style={{ display: 'flex', gap: '8px' }}>
                    {editBlocks.manuals && <button className={styles.btnCancel} onClick={() => cancelEdit('manuals')}>Batal</button>}
                    <button className={editBlocks.manuals ? styles.btnSave : styles.btnRevise} onClick={() => toggleEdit('manuals')}>{editBlocks.manuals ? (isSaving ? 'Menyimpan…' : 'Simpan') : 'Revisi'}</button>
                  </div>)}
                </div>
                <div className={styles.mediaSingleItem} style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {editBlocks.manuals ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <p style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.5 }}>Upload diagram sirkular udara (JPG, PNG, atau PDF).</p>
                      {(() => { const urls = editData.specs?.manuals_urls ? editData.specs.manuals_urls.split(',').filter(Boolean) : []; return urls.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {urls.map((url: string, idx: number) => (<div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'rgba(0,0,0,0.25)', borderRadius: '10px', boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <FileText size={14} color="#60a5fa" /><span style={{ flex: 1, fontSize: '0.78rem', fontWeight: 600, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url.includes('pdf') ? `Diagram PDF ${idx + 1}` : `Diagram Gambar ${idx + 1}`}</span>
                            <button type="button" onClick={() => window.open(url, '_blank')} style={{ background: 'none', border: 'none', color: '#93c5fd', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600, textDecoration: 'underline' }}>Lihat</button>
                            <button type="button" onClick={() => { const c = (editData.specs?.manuals_urls || '').split(',').filter(Boolean); c.splice(idx, 1); handleEditChange('specs.manuals_urls', c.join(',')); }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600 }}>Hapus</button>
                          </div>))}
                        </div>) : null; })()}
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '10px', padding: '8px 12px', cursor: manualsUploading ? 'not-allowed' : 'pointer', color: '#cbd5e1', fontSize: '0.78rem', background: 'rgba(0,0,0,0.2)', boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.3)', opacity: manualsUploading ? 0.6 : 1 }}>
                        <ImageIcon size={15} />{manualsUploading ? 'Mengupload...' : 'Klik untuk upload diagram'}
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" multiple style={{ display: 'none' }} disabled={manualsUploading} onChange={(e) => { if (e.target.files?.length) handleManualsUpload(e.target.files); }} />
                      </label>
                      {/* YouTube Link Upload */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="#ef4444"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                          Link Video YouTube (Opsional)
                        </label>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <input
                            type="url"
                            placeholder="https://youtube.com/..."
                            style={{ flex: 1, padding: '8px 10px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', boxShadow: 'inset 3px 3px 7px rgba(0,0,0,0.3)', color: '#ffffff', fontSize: '0.78rem', fontFamily: 'inherit', outline: 'none' }}
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
                          <button type="button" style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: '8px', color: '#f87171', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'inherit', whiteSpace: 'nowrap' }}
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
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, justifyContent: 'center' }}>
                      {(() => { const urls = unit?.specs?.manuals_urls ? String(unit.specs.manuals_urls).split(',').filter(Boolean) : [];
                        if (urls.length === 0) return (<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 12px', gap: '8px', background: 'rgba(0,0,0,0.25)', borderRadius: '12px', boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.3)', border: '1px dashed rgba(255,255,255,0.15)', height: '100%', minHeight: '140px' }}><BookOpen size={24} color="#94a3b8" /><p style={{ color: '#94a3b8', fontSize: '0.78rem', textAlign: 'center' }}>Belum ada diagram</p></div>);
                        return urls.map((url: string, idx: number) => { const isPdf = url.includes('pdf'); const isImage = /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url); const isYoutube = url.includes('youtube.com') || url.includes('youtu.be'); return (
                          <div key={idx} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            {isYoutube ? (
                              <button className={styles.btnPrimary} style={{ justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', color: '#ffffff', fontFamily: 'inherit', fontSize: '0.78rem' }} onClick={() => window.open(url, '_blank')}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="#ef4444"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                                  Video YouTube {idx + 1}
                                </span>
                                <ExternalLink size={13} color="#cbd5e1" style={{ flexShrink: 0 }} />
                              </button>
                            ) : isImage ? (
                              <div onClick={() => window.open(url, '_blank')} style={{ cursor: 'pointer', borderRadius: '12px', overflow: 'hidden', background: '#ffffff', boxShadow: '0 4px 14px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', height: '100%', minHeight: '190px' }}>
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff', overflow: 'hidden', padding: '6px' }}>
                                  <img src={url} alt={`Diagram ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: '200px', display: 'block' }} />
                                </div>
                                <div style={{ padding: '8px 12px', background: 'rgba(13,43,94,0.95)', fontSize: '0.74rem', fontWeight: 600, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '6px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                  <ImageIcon size={13} color="#60a5fa" /> Diagram {idx + 1}
                                </div>
                              </div>
                            ) : (
                              <button className={styles.btnPrimary} style={{ justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.08)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.12)', fontSize: '0.78rem' }} onClick={() => window.open(url, '_blank')}><span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FileText size={14} color="#60a5fa" />{isPdf ? `Diagram PDF ${idx + 1}` : `File Diagram ${idx + 1}`}</span><ExternalLink size={14} color="#cbd5e1" /></button>
                            )}
                          </div>); });
                      })()}
                    </div>
                  )}
                </div>
              </section>
              )}

              {/* QR Card — di tengah (sebelah Manuals) */}
              {isAdmin && <QrCard token={Array.isArray(token) ? token[0] : (token ?? '')} serialNumber={unit.serial_number} modelName={unit.model_name} />}

              {/* Layanan & Dukungan (Kanan) */}
              <section className={`${styles.panel} ${styles.actionPanel}`} style={{ borderRadius: '18px', margin: 0, display: 'flex', flexDirection: 'column' }}>
                <div className={styles.panelHeader}><div className={styles.panelHeaderLeft}><Phone size={16} color="#60a5fa" /><h2>Layanan &amp; Dukungan</h2></div></div>
                <div className={styles.panelContent} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', justifyContent: 'center', flex: 1, padding: '16px' }}>
                  {(isGuest || hasClientRestriction) && (
                  <div className={styles.publicPrompt}>
                  <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}><div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.15)' }}><Lock size={20} color="#cbd5e1" /></div></div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '8px', color: '#ffffff' }}>{hasClientRestriction ? 'Akses Terbatas' : 'Layanan & Dukungan'}</h3>
                  <p className={styles.restrictedText} style={{ fontSize: '0.85rem', marginBottom: '24px', lineHeight: 1.5, color: '#cbd5e1' }}>{hasClientRestriction ? 'Anda tidak berwenang melihat riwayat servis lengkap untuk unit milik franchise lain.' : 'Laporkan masalah teknis ke tim servis kami atau login untuk melihat riwayat servis lengkap.'}</p>
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
                              boxShadow: '-3px -3px 8px rgba(255,255,255,0.12), 3px 3px 10px rgba(0,0,0,0.2)',
                            }}
                            onClick={() => router.push(`/login?redirect=/id/${Array.isArray(token) ? token[0] : (token ?? '')}&role=partner`)}
                          >
                            <Wrench size={16} /> Masuk sebagai Teknisi
                          </button>
                        </div>
                        <p className={styles.guestNote} style={{ fontSize: '0.72rem', marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px', lineHeight: 1.6, color: '#94a3b8' }}>
                          Pemilik unit, teknisi, atau mitra resmi Holicindo —<br/>masuk untuk mengakses informasi lengkap unit ini.
                        </p>
                      </>
                    )}
                  </div>
                  </div>
                  )}
              {isClient && belongsToClient && (
                <div className={styles.clientActions} style={{ width: '100%', textAlign: 'left' }}>
                  <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}><div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(59,130,246,0.3)' }}><UserCheck size={20} color="#60a5fa" /></div></div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '8px', textAlign: 'center', color: '#ffffff' }}>Akses Pemilik (Fleet Owner)</h3>
                  <p className={styles.sectionInfo} style={{ textAlign: 'center', marginBottom: '24px', color: '#cbd5e1' }}>Unit terdaftar sebagai aset resmi perusahaan Anda.</p>
                  <button className={styles.btnEmergency} onClick={() => setShowServiceModal(true)}>Request Emergency Service</button>
                </div>
              )}
              {isPartner && (
                <div className={styles.partnerActions} style={{ width: '100%', textAlign: 'left' }}>
                  <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}><div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(16,185,129,0.3)' }}><Wrench size={20} color="#34d399" /></div></div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '4px', textAlign: 'center', color: '#ffffff' }}>Technical Partner Mode</h3>
                  <p className={styles.sectionInfo} style={{ textAlign: 'center', marginBottom: '16px', fontSize: '0.82rem', color: '#cbd5e1' }}>Anda terverifikasi sebagai teknisi untuk unit ini.</p>
                  {unit.service_logs?.filter((l: any) => l.status === 'PENDING').length > 0 && (
                    <div style={{ background: 'rgba(255,107,0,0.12)', border: '1px solid rgba(255,107,0,0.3)', borderRadius: '10px', padding: '12px 14px', marginBottom: '14px' }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#FF6B00', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF6B00', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />Tiket Aktif</div>
                      {unit.service_logs.filter((l: any) => l.status === 'PENDING').slice(0, 1).map((log: any) => (<div key={log.id}><div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff', marginBottom: '4px', fontFamily: 'monospace' }}>Call ID: {log.id}</div><div style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.4 }}>{(log.issue_description || '').slice(0, 80)}{log.issue_description?.length > 80 ? '…' : ''}</div></div>))}
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button className={styles.btnPrimary} onClick={() => { setTechName(user?.name || ''); setLogStatus('COMPLETED'); setShowLogModal(true); }} style={{ background: 'var(--neu-bg, rgba(8,20,50,0.8))', color: '#10b981', border: '1px solid rgba(0,31,63,0.1)', boxShadow: '-3px -3px 8px rgba(255,255,255,0.04), 3px 3px 8px rgba(0,31,63,0.1)' }}><Check size={16} /> Selesaikan &amp; Tutup Tiket</button>
                    <button className={styles.btnPrimary} onClick={() => { setTechName(user?.name || ''); setLogStatus('PENDING'); setShowLogModal(true); }} style={{ background: 'var(--neu-bg, rgba(8,20,50,0.8))', color: '#3b82f6', border: '1px solid rgba(0,31,63,0.1)', boxShadow: '-3px -3px 8px rgba(255,255,255,0.04), 3px 3px 8px rgba(0,31,63,0.1)' }}><Wrench size={16} /> Tambah Catatan Servis</button>
                    <button className={styles.btnPrimary} onClick={() => setShowReportSelector(true)} style={{ background: 'var(--neu-bg, rgba(8,20,50,0.8))', color: '#60a5fa', border: '1px solid rgba(0,31,63,0.1)', boxShadow: '-3px -3px 8px rgba(255,255,255,0.04), 3px 3px 8px rgba(0,31,63,0.1)' }}><FileText size={16} /> QC Reports</button>
                  </div>
                </div>
              )}
              {isAdmin && (
                <div className={styles.adminActions} style={{ width: '100%', textAlign: 'left' }}>
                  <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}><div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(139,92,246,0.3)' }}><ShieldAlert size={20} color="#c4b5fd" /></div></div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '8px', textAlign: 'center', color: '#ffffff' }}>Administrator Control</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                    <button className={styles.btnEmergency} onClick={() => setShowServiceModal(true)}>Request Service</button>
                    <button className={styles.btnPrimary} onClick={() => setShowReportSelector(true)} style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}><FileText size={16} /> QC Reports</button>
                    <button className={styles.btnPrimary} onClick={() => setShowTransferModal(true)}>Pindahkan Kepemilikan</button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>{/* end topRowGrid */}



            {/* Health Score V2 — Semua role: Customer, Partner, Admin */}
            {unit.id && (
              <section className={`${styles.panel} ${styles.iotPanel}`}>
                <div className={styles.panelHeader}>
                  <div className={styles.panelHeaderLeft}>
                    <h2>Kesehatan Unit</h2>
                  </div>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '20px', padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                    LIVE
                  </span>
                </div>
                <div className={styles.panelContent}>
                  <CustomerHealthWidget unitId={unit.id} />
                </div>
              </section>
            )}

            {/* Riwayat Servis — Di bawah Kesehatan Unit & Di atas Sensor Real-Time */}
            {(!isGuest && !hasClientRestriction) && (
              <ServiceHistorySection serviceLogs={unit.service_logs || []} />
            )}

            {/* IoT — Admin/Partner: Slide Carousel (Sensor Real-Time <-> Riwayat Sensor) */}
            {(isPartner || isAdmin || isQC) && unit.id && (
              <section className={`${styles.panel} ${styles.iotPanel}`}>
                <div className={styles.panelHeader}>
                  <div className={styles.iotSlideHeader}>
                    <div className={styles.panelHeaderLeft}>
                      {iotSlideTab === 'realtime' ? (
                        <>
                          <Activity size={16} color="var(--color-cobalt-blue)" />
                          <h2>Sensor Real-Time</h2>
                        </>
                      ) : (
                        <>
                          <BarChart2 size={16} color="var(--color-cobalt-blue)" />
                          <h2>Riwayat Sensor</h2>
                        </>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {/* Tab Switcher */}
                      <div className={styles.iotSlideTabs}>
                        <button
                          type="button"
                          className={`${styles.iotSlideTabItem} ${iotSlideTab === 'realtime' ? styles.iotSlideTabItemActive : ''}`}
                          onClick={() => setIotSlideTab('realtime')}
                        >
                          Real-Time
                        </button>
                        <button
                          type="button"
                          className={`${styles.iotSlideTabItem} ${iotSlideTab === 'history' ? styles.iotSlideTabItemActive : ''}`}
                          onClick={() => setIotSlideTab('history')}
                        >
                          Riwayat
                        </button>
                      </div>

                      {/* Status Badges */}
                      {iotSlideTab === 'realtime' ? (
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '20px', padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                          LIVE
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, background: 'rgba(46,91,255,0.1)', color: '#2E5BFF', border: '1px solid rgba(46,91,255,0.2)', borderRadius: '20px', padding: '3px 8px' }}>
                          Histori & Avg
                        </span>
                      )}

                      {/* Navigation Prev & Next (< >) */}
                      <div className={styles.iotSlideNav}>
                        <button
                          type="button"
                          aria-label="Slide sebelumnya"
                          title="Sensor Real-Time"
                          className={styles.iotSlideBtn}
                          disabled={iotSlideTab === 'realtime'}
                          onClick={() => setIotSlideTab('realtime')}
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button
                          type="button"
                          aria-label="Slide berikutnya"
                          title="Riwayat Sensor"
                          className={styles.iotSlideBtn}
                          disabled={iotSlideTab === 'history'}
                          onClick={() => setIotSlideTab('history')}
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.panelContent}>
                  {iotSlideTab === 'realtime' ? (
                    <IotTelemetryWidget unitId={unit.id} unitModel={unit.model_name} unit={unit} />
                  ) : (
                    <IotHistoryWidget unitId={unit.id} unit={unit} onUnitUpdate={loadUnitData} />
                  )}
                </div>
              </section>
            )}

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
        <SelectReportTypeModal
          show={showReportSelector}
          onClose={() => setShowReportSelector(false)}
          unit={unit}
          unitReports={unitReports}
          isAdmin={isAdmin}
          editBlocks={editBlocks}
          toggleEdit={toggleEdit}
          cancelEdit={cancelEdit}
          isSaving={isSaving}
          editData={editData}
          handleEditChange={handleEditChange}
          qcUploading={qcUploading}
          handleQcFileUpload={handleQcFileUpload}
        />

        {/* Image Zoom Modal */}
        {showImageModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.95)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              padding: '20px',
              cursor: 'zoom-out',
            }}
            onClick={() => setShowImageModal(null)}
          >
            <img
              src={showImageModal}
              alt="Zoomed unit"
              style={{
                maxWidth: '95%',
                maxHeight: '95%',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 25px 80px rgba(0,0,0,0.8)',
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setShowImageModal(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: '#fff',
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                fontSize: '24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              ×
            </button>
          </div>
        )}
      </div>

      <footer className={styles.footerCopyright}>Copyright &copy; 2026 PT. Holicindo Dasa Anugerah. All rights reserved.</footer>
    </div>
  );
}
