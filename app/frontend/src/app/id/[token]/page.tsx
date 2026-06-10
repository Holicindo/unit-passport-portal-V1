'use client';

import { useRouter } from 'next/navigation';
import {
  ShieldAlert, Wrench, FileText, CheckCircle2,
  ExternalLink, Phone, ArrowLeft, Loader2,
  Lock, Check, UserCheck, Settings, BookOpen, Clock, Image as ImageIcon,
  Sun, Moon, QrCode, HelpCircle,
} from 'lucide-react';
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
import { INDONESIA_CITIES } from './constants';
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
    <div className={styles.pageWrapper} data-theme={isDark ? 'dark' : 'light'}>
      {/* Toast */}
      {toast && (
        <div role="alert" aria-live="polite" style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          padding: '12px 20px', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 600,
          maxWidth: '340px', boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
          display: 'flex', alignItems: 'center', gap: '10px', color: '#fff',
          background: toast.type === 'success' ? 'linear-gradient(135deg, #059669, #047857)' : toast.type === 'error' ? 'linear-gradient(135deg, #dc2626, #b91c1c)' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
          animation: 'slideIn 0.25s ease',
        }}>
          <span style={{ fontSize: '1.1rem' }}>{toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}</span>
          {toast.message}
          <button onClick={clearToast} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontSize: '1rem', padding: 0 }}>×</button>
        </div>
      )}

      <div className={styles.dotGrid} aria-hidden="true" />
      <div className={styles.dotGridRight} aria-hidden="true" />

      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button onClick={() => router.back()} className={styles.backBtn}><ArrowLeft size={16} /> Kembali ke Daftar Unit</button>
            <div className={styles.titleRow}>
              <h1 className={styles.serialNumber}>{unit.serial_number}</h1>
              <span className={styles.verifiedBadgeTop}><CheckCircle2 size={16} /> Terverifikasi</span>
            </div>
            <p className={styles.modelName}>{unit.model_name}</p>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.accessBadgeTop}>
              {isGuest && 'LEVEL 1: PUBLIC SCAN'}
              {isClient && belongsToClient && 'LEVEL 2: FLEET OWNER'}
              {hasClientRestriction && 'LEVEL 2: RESTRICTED'}
              {isPartner && 'LEVEL 3: TECHNICAL PARTNER'}
              {isAdmin && 'LEVEL 4: ADMINISTRATOR'}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end', marginTop: '4px' }}>
              {isAdmin && (
                <button onClick={() => {
                  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(window.location.origin + '/id/' + token)}`;
                  const pw = window.open('', '_blank');
                  if (pw) { pw.document.write(`<html><head><title>Print QR</title><style>@page{margin:0}html,body{margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif}</style></head><body><h2>${unit.serial_number}</h2><img src="${qrApiUrl}" alt="QR" style="width:400px;height:400px" onload="window.print();window.close()"/><p>${unit.model_name}</p></body></html>`); pw.document.close(); }
                }} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '20px', padding: '4px 10px', cursor: 'pointer', color: '#3b82f6', fontSize: '0.7rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                  <QrCode size={12} /> QR
                </button>
              )}
              <button onClick={() => setIsDark(v => !v)} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,31,63,0.08)', border: isDark ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(0,31,63,0.15)', borderRadius: '20px', padding: '4px 10px', cursor: 'pointer', color: isDark ? '#e2e8f0' : '#001F3F', fontSize: '0.7rem', fontWeight: 700, fontFamily: 'var(--font-heading)', transition: 'all 0.2s ease' }}>
                {isDark ? <Sun size={12} /> : <Moon size={12} />} {isDark ? 'Light' : 'Dark'}
              </button>
            </div>
            <div className={styles.lastUpdated}><Clock size={12} /> Terakhir diperbarui: {new Date(unit.updated_at || Date.now()).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })} WIB</div>
          </div>
        </header>

        {/* Carousel */}
        <div className={styles.carouselWrapper}>
          <button className={`${styles.carouselNavBtn} ${styles.prevBtn}`} onClick={() => { if (carouselRef.current) carouselRef.current.scrollBy({ left: -carouselRef.current.clientWidth, behavior: 'smooth' }); }}>&lsaquo;</button>
          <div className={styles.carouselContainer} ref={carouselRef}>

          {/* Slide 1: Spesifikasi Utama */}
          <section className={`${styles.card} ${styles.carouselSlide}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}><FileText size={16} color="#8bb2ff" /><h2>Spesifikasi Utama</h2></div>
              {isAdmin && (<div style={{ display: 'flex', gap: '8px' }}>
                {editBlocks.spesifikasi && <button className={styles.btnRevise} onClick={() => cancelEdit('spesifikasi')} style={{ background: '#64748b' }}>Cancel</button>}
                <button className={styles.btnRevise} onClick={() => toggleEdit('spesifikasi')} style={editBlocks.spesifikasi ? { background: '#10b981' } : {}}>
                  {editBlocks.spesifikasi ? (isSaving ? 'Saving…' : 'Save') : 'Revise'}
                </button>
              </div>)}
            </div>
            <div className={styles.cardContent}>
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
                    <EditField label="Daya (Watt)" value={editData.specs?.power || editData.specs?.wattage || ''} onChange={(v) => { handleEditChange('specs.power', v); handleEditChange('specs.wattage', v); }} />
                    <EditField label="Kapasitas" value={editData.specs?.capacity || ''} onChange={(v) => handleEditChange('specs.capacity', v)} />
                    <EditField label="Kompresor" value={editData.specs?.compressor || ''} onChange={(v) => handleEditChange('specs.compressor', v)} />
                    <EditField label="Refrigerant" value={editData.specs?.refrigerant || ''} onChange={(v) => handleEditChange('specs.refrigerant', v)} />
                  </>) : (<>
                    <EditField label="Kompresor" value={editData.specs?.compressor || ''} onChange={(v) => handleEditChange('specs.compressor', v)} />
                    <EditField label="Refrigerant" value={editData.specs?.refrigerant || ''} onChange={(v) => handleEditChange('specs.refrigerant', v)} />
                    <EditField label="Daya / Wattage" value={editData.specs?.wattage || editData.specs?.power || ''} onChange={(v) => { handleEditChange('specs.wattage', v); handleEditChange('specs.power', v); }} />
                    <EditField label="Dimensi" value={editData.specs?.dimension || ''} onChange={(v) => handleEditChange('specs.dimension', v)} />
                    <EditField label="Kapasitas" value={editData.specs?.capacity || ''} onChange={(v) => handleEditChange('specs.capacity', v)} />
                  </>)}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                    <DatePicker label="Garansi Berakhir" value={editData.warranty_expiry ? editData.warranty_expiry.slice(0, 10) : ''} onChange={(v) => handleEditChange('warranty_expiry', v)} theme="dark" />
                  </div>
                  <EditField label="PRO Number" value={editData.specs?.pro_number || ''} onChange={(v) => handleEditChange('specs.pro_number', v)} />
                  <EditField label="QM Number" value={editData.specs?.qm_number || ''} onChange={(v) => handleEditChange('specs.qm_number', v)} />
                  <EditField label="Manufacture SN" value={editData.specs?.manufacture_sn || ''} onChange={(v) => handleEditChange('specs.manufacture_sn', v)} />
                  <EditField label="Delivery Date" value={editData.specs?.delivery_date || ''} onChange={(v) => handleEditChange('specs.delivery_date', v)} />
                  <EditField label="Finish Date" value={editData.specs?.finish_date || ''} onChange={(v) => handleEditChange('specs.finish_date', v)} />
                </div>
              ) : (<>
                <div className={styles.specItem}><span className={styles.specLabel}>Model</span><span className={styles.specValue}>{unit.model_name}</span></div>
                <div className={styles.specItem}><span className={styles.specLabel}>Serial Number</span><span className={styles.specValue}>{unit.serial_number}</span></div>
                {unit.specs?.type === 'MESIN' || (!unit.specs?.type && unit.specs?.dimension) ? (<>
                  <div className={styles.specItem}><span className={styles.specLabel}>Dimensi</span><span className={styles.specValue}>{unit.specs?.dimension || '—'}</span></div>
                  <div className={styles.specItem}><span className={styles.specLabel}>Daya Listrik</span><span className={styles.specValue}>{unit.specs?.power || '—'}</span></div>
                  <div className={styles.specItem}><span className={styles.specLabel}>Kapasitas</span><span className={styles.specValue}>{unit.specs?.capacity || '—'}</span></div>
                </>) : (<>
                  <div className={styles.specItem}><span className={styles.specLabel}>Kompresor</span><span className={styles.specValue}>{unit.specs?.compressor || '—'}</span></div>
                  <div className={styles.specItem}><span className={styles.specLabel}>Refrigeran</span><span className={styles.specValue}>{unit.specs?.refrigerant || '—'}</span></div>
                  <div className={styles.specItem}><span className={styles.specLabel}>Daya / Wattage</span><span className={styles.specValue}>{unit.specs?.wattage || '—'}</span></div>
                </>)}
                <div className={styles.specItem}><span className={styles.specLabel}>PRO Number</span><span className={styles.specValue}>{unit.specs?.pro_number || '—'}</span></div>
                <div className={styles.specItem}><span className={styles.specLabel}>QM Number</span><span className={styles.specValue}>{unit.specs?.qm_number || '—'}</span></div>
                <div className={styles.specItem}><span className={styles.specLabel}>Manufacture SN</span><span className={styles.specValue}>{unit.specs?.manufacture_sn || '—'}</span></div>
                <div className={styles.specItem}><span className={styles.specLabel}>Delivery Date</span><span className={styles.specValue}>{unit.specs?.delivery_date || '—'}</span></div>
                <div className={styles.specItem}><span className={styles.specLabel}>Finish Date</span><span className={styles.specValue}>{unit.specs?.finish_date || '—'}</span></div>
                <div className={styles.specItem}><span className={styles.specLabel}>Dibuat Pada</span><span className={styles.specValue}>{unit.created_at ? new Date(unit.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</span></div>
                <div className={styles.specItem} style={{ borderBottom: 'none' }}><span className={styles.specLabel}>Lokasi Pembuatan</span><span className={styles.specValue}>Tangerang, Indonesia</span></div>
              </>)}
              {!editBlocks.spesifikasi && <button className={styles.btnViewAll} onClick={() => setShowAllSpecsModal(true)}>Lihat Semua Spesifikasi <span>›</span></button>}
            </div>
          </section>

          {/* Slide 2: Layanan & Dukungan */}
          <section className={`${styles.card} ${styles.actionCard} ${styles.carouselSlide}`}>
            <div className={styles.cardHeader}><div className={styles.cardHeaderLeft}><Phone size={16} color="#8bb2ff" /><h2>Layanan &amp; Dukungan</h2></div></div>
            <div className={styles.cardContent} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', justifyContent: 'center' }}>
              {(isGuest || hasClientRestriction) && (
                <div className={styles.publicPrompt}>
                  <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}><div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}><Lock size={20} color="#8f9bb3" /></div></div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '8px' }}>{hasClientRestriction ? 'Akses Terbatas' : 'Layanan & Dukungan'}</h3>
                  <p className={styles.restrictedText} style={{ fontSize: '0.85rem', color: '#8f9bb3', marginBottom: '24px', lineHeight: 1.5 }}>{hasClientRestriction ? 'Anda tidak berwenang melihat riwayat servis lengkap untuk unit milik franchise lain.' : 'Laporkan masalah teknis ke tim servis kami atau login untuk melihat riwayat servis lengkap.'}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                    <button className={styles.btnEmergency} onClick={() => setShowServiceModal(true)}>Laporkan Masalah / Request Service</button>
                    {isGuest && (<><button className={styles.btnPrimary} onClick={() => router.push(`/login?redirect=/id/${token}`)}><Lock size={16} /> Sign In (Manajemen Klien)</button><p className={styles.guestNote} style={{ fontSize: '0.75rem', marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>Pemilik unit, teknisi, atau mitra resmi Holicindo — masuk untuk melihat informasi lebih lengkap.</p></>)}
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
                    <button className={styles.btnEmergency} onClick={() => setShowServiceModal(true)}>Uji Alur Smart Routing</button>
                    <button className={styles.btnPrimary} onClick={() => setShowTransferModal(true)}>Pindahkan Kepemilikan</button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Slide 3: Stats Card */}
          <section className={`${styles.card} ${styles.carouselSlide}`}>
            <div className={styles.cardHeader}><div className={styles.cardHeaderLeft}><Settings size={16} color="#8bb2ff" /><h2>Stats Card</h2></div></div>
            <div className={styles.statsCardGrid}>
              {[
                { tip: 'Kondisi operasional unit saat ini.', icon: <CheckCircle2 size={24} />, cls: styles.success, title: 'Status Unit', status: 'Normal', color: '#10b981', sub: 'Unit beroperasi dengan baik' },
                { tip: 'Masa garansi resmi dari Holicindo.', icon: <ShieldAlert size={24} />, cls: isWarrantyActive ? styles.success : styles.warning, title: 'Garansi', status: isWarrantyActive ? 'Aktif' : 'Kedaluwarsa', color: isWarrantyActive ? '#10b981' : '#f59e0b', sub: isWarrantyActive ? `Hingga ${expiryDate?.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }) || ''}` : 'Hubungi support' },
                { tip: 'Tanggal terakhir unit diservis.', icon: <Wrench size={24} />, cls: styles.info, title: 'Last Service', status: 'Belum Ada', color: '#336bd9ff', sub: 'Belum pernah diservis' },
                { tip: 'Estimasi jadwal servis berikutnya.', icon: <Clock size={24} />, cls: styles.info, title: 'Next Service', status: 'Disarankan', color: '#3b82f6', sub: 'Dalam 180 hari' },
                { tip: 'Status keaslian unit.', icon: <CheckCircle2 size={24} />, cls: styles.success, title: 'Verifikasi', status: 'Asli', color: '#10b981', sub: 'Unit terverifikasi Holicindo' },
              ].map((s) => (
                <div key={s.title} className={styles.statusCard} style={{ position: 'relative' }}>
                  <span className={styles.statTooltipAnchor}><HelpCircle size={12} className={styles.statTooltipIcon} /><span className={styles.statTooltip}>{s.tip}</span></span>
                  <div className={`${styles.statusIcon} ${s.cls}`}>{s.icon}</div>
                  <div className={styles.statusText}><h3>{s.title}</h3><p style={{ color: s.color }}>{s.status}</p><span>{s.sub}</span></div>
                </div>
              ))}
            </div>
          </section>

          {/* Slide 4: QC Reports - kept inline due to complex edit closures */}
          <section className={`${styles.card} ${styles.carouselSlide}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}><FileText size={16} color="#8bb2ff" /><h2>QC Reports</h2></div>
              {isAdmin && (<div style={{ display: 'flex', gap: '8px' }}>
                {editBlocks.qc && <button className={styles.btnRevise} onClick={() => cancelEdit('qc')} style={{ background: '#64748b' }}>Cancel</button>}
                <button className={styles.btnRevise} onClick={() => toggleEdit('qc')} style={editBlocks.qc ? { background: '#10b981' } : {}}>{editBlocks.qc ? (isSaving ? 'Saving…' : 'Save') : 'Revise'}</button>
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
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />
                  <div>
                    <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#8f9bb3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Dimensi Kaca</p>
                    <EditField label="Lebar (cm)" value={editData.specs?.glass_width || ''} onChange={(v) => handleEditChange('specs.glass_width', v)} />
                    <EditField label="Tinggi (cm)" value={editData.specs?.glass_height || ''} onChange={(v) => handleEditChange('specs.glass_height', v)} />
                    <EditField label="Ketebalan (mm)" value={editData.specs?.glass_thickness || ''} onChange={(v) => handleEditChange('specs.glass_thickness', v)} />
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />
                  <div>
                    <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#8f9bb3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>PIC Produksi</p>
                    <EditField label="Nama PIC" value={editData.specs?.pic_name || ''} onChange={(v) => handleEditChange('specs.pic_name', v)} />
                    <DatePicker label="Tanggal" value={editData.specs?.pic_date || ''} onChange={(v) => handleEditChange('specs.pic_date', v)} theme="dark" />
                    <EditField label="Catatan" value={editData.specs?.pic_notes || ''} onChange={(v) => handleEditChange('specs.pic_notes', v)} />
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />
                  <div>
                    <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#8f9bb3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Galeri Foto</p>
                    {editData.specs?.photo_gallery && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '10px' }}>
                        {editData.specs.photo_gallery.split(',').filter(Boolean).map((url: string, idx: number) => (
                          <div key={idx} style={{ position: 'relative' }}>
                            <img src={url} alt={`Foto ${idx + 1}`} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '6px', display: 'block' }} />
                            <button type="button" onClick={() => { const c = editData.specs.photo_gallery.split(',').filter(Boolean); c.splice(idx, 1); handleEditChange('specs.photo_gallery', c.join(',')); }} style={{ position: 'absolute', top: '3px', right: '3px', background: 'rgba(239,68,68,0.85)', border: 'none', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', color: '#fff', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                          </div>
                        ))}
                      </div>
                    )}
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '8px', padding: '10px 14px', cursor: 'pointer', color: '#8f9bb3', fontSize: '0.82rem', background: 'rgba(255,255,255,0.02)', opacity: photoGalleryUploading ? 0.6 : 1 }}>
                      <ImageIcon size={16} />{photoGalleryUploading ? 'Mengupload...' : 'Klik untuk upload foto (bisa pilih banyak)'}
                      <input type="file" accept=".jpg,.jpeg,.png,.webp" multiple style={{ display: 'none' }} disabled={photoGalleryUploading} onChange={(e) => { if (e.target.files?.length) handlePhotoGalleryUpload(e.target.files); }} />
                    </label>
                  </div>
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
                  {/* Glass Dimension */}
                  {(() => { const gw = unit?.specs?.glass_width; const gh = unit?.specs?.glass_height; const gt = unit?.specs?.glass_thickness; const has = gw || gh || gt; return (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: has ? '8px 8px 0 0' : '8px' }}>
                        <FileText size={15} color="#8bb2ff" /><span style={{ flex: 1, fontSize: '0.85rem' }}>Glass Dimension</span>
                        {has ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(16,185,129,0.12)', color: '#10b981', borderRadius: '20px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: 700 }}><Check size={11} /> Ada</span> : <span style={{ background: 'rgba(255,255,255,0.06)', color: '#64748b', borderRadius: '20px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: 600 }}>Belum ada data</span>}
                      </div>
                      {has && <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '0 0 8px 8px', padding: '8px 12px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>{gw && <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Lebar: <strong style={{ color: '#e2e8f0' }}>{gw} cm</strong></span>}{gh && <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Tinggi: <strong style={{ color: '#e2e8f0' }}>{gh} cm</strong></span>}{gt && <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Tebal: <strong style={{ color: '#e2e8f0' }}>{gt} mm</strong></span>}</div>}
                    </div>); })()}
                  {/* Production PIC */}
                  {(() => { const pn = unit?.specs?.pic_name; const pd = unit?.specs?.pic_date; const pnt = unit?.specs?.pic_notes; const has = pn || pd || pnt; return (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: has ? '8px 8px 0 0' : '8px' }}>
                        <FileText size={15} color="#8bb2ff" /><span style={{ flex: 1, fontSize: '0.85rem' }}>Production PIC</span>
                        {has ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(16,185,129,0.12)', color: '#10b981', borderRadius: '20px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: 700 }}><Check size={11} /> Ada</span> : <span style={{ background: 'rgba(255,255,255,0.06)', color: '#64748b', borderRadius: '20px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: 600 }}>Belum ada data</span>}
                      </div>
                      {has && <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '0 0 8px 8px', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>{pn && <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Nama: <strong style={{ color: '#e2e8f0' }}>{pn}</strong></span>}{pd && <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Tanggal: <strong style={{ color: '#e2e8f0' }}>{new Date(pd + 'T00:00:00').toLocaleDateString('id-ID', { dateStyle: 'long' })}</strong></span>}{pnt && <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Catatan: <strong style={{ color: '#e2e8f0' }}>{pnt}</strong></span>}</div>}
                    </div>); })()}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', margin: '4px 0' }} />
                  {/* Photo Gallery */}
                  {(() => { const photos = unit?.specs?.photo_gallery ? String(unit.specs.photo_gallery).split(',').filter(Boolean) : []; return (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: photos.length > 0 ? '8px 8px 0 0' : '8px' }}>
                        <ImageIcon size={15} color="#8bb2ff" /><span style={{ flex: 1, fontSize: '0.85rem' }}>Photo Gallery</span>
                        {photos.length > 0 ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(16,185,129,0.12)', color: '#10b981', borderRadius: '20px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: 700 }}><Check size={11} /> {photos.length} foto</span> : <span style={{ background: 'rgba(255,255,255,0.06)', color: '#64748b', borderRadius: '20px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: 600 }}>Belum ada foto</span>}
                      </div>
                      {photos.length > 0 && <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '0 0 8px 8px', padding: '8px 10px' }}><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>{photos.map((url: string, idx: number) => <img key={idx} src={url} alt={`Foto unit ${idx + 1}`} onClick={() => window.open(url, '_blank')} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer', display: 'block' }} />)}</div></div>}
                    </div>); })()}
                </div>
              )}
            </div>
          </section>

          {/* Slide 5: Manuals */}
          <section className={`${styles.card} ${styles.carouselSlide}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}><BookOpen size={16} color="#8bb2ff" /><h2>Manuals</h2></div>
              {isAdmin && (<div style={{ display: 'flex', gap: '8px' }}>
                {editBlocks.manuals && <button className={styles.btnRevise} onClick={() => cancelEdit('manuals')} style={{ background: '#64748b' }}>Cancel</button>}
                <button className={styles.btnRevise} onClick={() => toggleEdit('manuals')} style={editBlocks.manuals ? { background: '#10b981' } : {}}>{editBlocks.manuals ? (isSaving ? 'Saving…' : 'Save') : 'Revise'}</button>
              </div>)}
            </div>
            <div className={styles.mediaSingleItem} style={{ padding: '16px' }}>
              {editBlocks.manuals ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.5 }}>Upload diagram sirkular udara (JPG, PNG, atau PDF).</p>
                  {(() => { const urls = editData.specs?.manuals_urls ? editData.specs.manuals_urls.split(',').filter(Boolean) : []; return urls.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {urls.map((url: string, idx: number) => (<div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <FileText size={14} color="#8bb2ff" /><span style={{ flex: 1, fontSize: '0.78rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url.includes('pdf') ? `Diagram PDF ${idx + 1}` : `Diagram Gambar ${idx + 1}`}</span>
                        <button type="button" onClick={() => window.open(url, '_blank')} style={{ background: 'none', border: 'none', color: '#8bb2ff', cursor: 'pointer', fontSize: '0.72rem', textDecoration: 'underline' }}>Lihat</button>
                        <button type="button" onClick={() => { const c = (editData.specs?.manuals_urls || '').split(',').filter(Boolean); c.splice(idx, 1); handleEditChange('specs.manuals_urls', c.join(',')); }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.72rem' }}>Hapus</button>
                      </div>))}
                    </div>) : null; })()}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '8px', padding: '10px 14px', cursor: manualsUploading ? 'not-allowed' : 'pointer', color: '#8f9bb3', fontSize: '0.82rem', background: 'rgba(255,255,255,0.02)', opacity: manualsUploading ? 0.6 : 1 }}>
                    <ImageIcon size={16} />{manualsUploading ? 'Mengupload...' : 'Klik untuk upload diagram (JPG/PNG/PDF)'}
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" multiple style={{ display: 'none' }} disabled={manualsUploading} onChange={(e) => { if (e.target.files?.length) handleManualsUpload(e.target.files); }} />
                  </label>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(() => { const urls = unit?.specs?.manuals_urls ? String(unit.specs.manuals_urls).split(',').filter(Boolean) : [];
                    if (urls.length === 0) return (<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', gap: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px dashed rgba(255,255,255,0.1)' }}><BookOpen size={28} color="#3d4f6e" /><p style={{ color: '#64748b', fontSize: '0.82rem', textAlign: 'center' }}>Belum ada diagram</p></div>);
                    return urls.map((url: string, idx: number) => { const isPdf = url.includes('pdf'); const isImage = /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url); return (
                      <div key={idx}>
                        {isImage ? <div onClick={() => window.open(url, '_blank')} style={{ cursor: 'pointer', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}><img src={url} alt={`Diagram ${idx + 1}`} style={{ width: '100%', display: 'block', objectFit: 'contain', maxHeight: '280px', background: '#0a0e1a' }} /><div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}><ImageIcon size={12} /> Diagram {idx + 1}</div></div>
                        : <button className={styles.btnPrimary} style={{ justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', color: 'var(--color-primary-text)' }} onClick={() => window.open(url, '_blank')}><span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={16} />{isPdf ? `Diagram PDF ${idx + 1}` : `File Diagram ${idx + 1}`}</span><ExternalLink size={16} color="#8f9bb3" /></button>}
                      </div>); });
                  })()}
                </div>
              )}
            </div>
          </section>

          {/* Slide 6: Ownership */}
          <section className={`${styles.card} ${styles.carouselSlide}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}><UserCheck size={16} color="#8bb2ff" /><h2>Ownership</h2></div>
              {isAdmin && (<div style={{ display: 'flex', gap: '8px' }}>
                {editBlocks.ownership && <button className={styles.btnRevise} onClick={() => cancelEdit('ownership')} style={{ background: '#64748b' }}>Cancel</button>}
                <button className={styles.btnRevise} onClick={() => toggleEdit('ownership')} style={editBlocks.ownership ? { background: '#10b981' } : {}}>{editBlocks.ownership ? (isSaving ? 'Saving…' : 'Save') : 'Revise'}</button>
              </div>)}
            </div>
            <div className={styles.cardContent}>
              {editBlocks.ownership ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingBottom: '16px' }}>
                  <EditField label="Customer Name" value={editData.current_client?.company_name || ''} onChange={(v) => handleEditChange('current_client.company_name', v)} />
                  <EditField label="SO Number" value={editData.specs?.so_number || ''} onChange={(v) => handleEditChange('specs.so_number', v)} />
                  <EditField label="DO Number" value={editData.specs?.do_number || ''} onChange={(v) => handleEditChange('specs.do_number', v)} />
                  <EditField label="Outlet Branch" value={editData.outlet_branch || ''} onChange={(v) => handleEditChange('outlet_branch', v)} />
                  <div className={styles.editRow}><div className={styles.editGroup}>
                    <span className={styles.editLabel}>Outlet Address (City)</span>
                    <select className={styles.editInput} value={editData.city || ''} onChange={(e) => handleEditChange('city', e.target.value)} style={{ background: '#1e293b', color: '#f8fafc' }}>
                      <option value="">-- Pilih Kota --</option>
                      {Object.entries(INDONESIA_CITIES.reduce((acc: Record<string, string[]>, item) => { if (!acc[item.province]) acc[item.province] = []; acc[item.province].push(item.city); return acc; }, {})).map(([province, cities]) => (<optgroup key={province} label={province}>{(cities as string[]).map(city => <option key={city} value={city}>{city}</option>)}</optgroup>))}
                    </select>
                  </div></div>
                </div>
              ) : (<>
                <div className={styles.specItem}><span className={styles.specLabel}>Customer Name</span><span className={styles.specValue}>{unit.current_client?.company_name || '—'}</span></div>
                <div className={styles.specItem}><span className={styles.specLabel}>SO Number</span><span className={styles.specValue}>{unit.specs?.so_number || '—'}</span></div>
                <div className={styles.specItem}><span className={styles.specLabel}>DO Number</span><span className={styles.specValue}>{unit.specs?.do_number || '—'}</span></div>
                <div className={styles.specItem}><span className={styles.specLabel}>Outlet Branch</span><span className={styles.specValue}>{unit.outlet_branch || '—'}</span></div>
                <div className={styles.specItem} style={{ borderBottom: 'none' }}><span className={styles.specLabel}>Outlet Address (City)</span><span className={styles.specValue}>{unit.city ? (() => { const m = INDONESIA_CITIES.find(c => c.city === unit.city); return m ? `${unit.city} — ${m.province}` : unit.city; })() : '—'}</span></div>
              </>)}
            </div>
          </section>

          </div>
          <button className={`${styles.carouselNavBtn} ${styles.nextBtn}`} onClick={() => { if (carouselRef.current) carouselRef.current.scrollBy({ left: carouselRef.current.clientWidth, behavior: 'smooth' }); }}>&rsaquo;</button>
        </div>

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

        {/* Service History */}
        <ServiceHistorySection serviceLogs={unit.service_logs || []} />

        {/* Modals */}
        <ServiceRequestModal show={showServiceModal} onClose={closeServiceModal} onSubmit={handleServiceRequest} loading={routingLoading} routingResult={routingResult}
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
