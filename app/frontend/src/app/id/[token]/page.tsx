'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { unitApi } from '@/lib/api';
import { 
  ShieldAlert, Wrench, FileText, CheckCircle2, 
  ExternalLink, Phone, ArrowLeft, Loader2, RefreshCw, 
  Lock, Check, UserCheck, Settings, BookOpen, Clock, Image as ImageIcon,
  Sun, Moon
} from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import styles from './id.module.css';

// SVG Blueprint Component for Airflow & Dimensions
const AirflowDiagram = () => (
  <div style={{ width: '100%', height: '100%', backgroundColor: '#001F3F', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
    {/* Background Grid Pattern */}
    <div style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'linear-gradient(#2E5BFF 1px, transparent 1px), linear-gradient(90deg, #2E5BFF 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
    
    <svg viewBox="0 0 200 300" width="100%" height="100%" style={{ zIndex: 1, padding: '20px' }} xmlns="http://www.w3.org/2000/svg">
       <defs>
         <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
           <polygon points="0 0, 6 3, 0 6" fill="#00C48C" />
         </marker>
       </defs>

       {/* Outer Showcase Frame */}
       <rect x="45" y="20" width="110" height="240" fill="rgba(0, 31, 63, 0.8)" stroke="#2E5BFF" strokeWidth="2.5" rx="4" />
       
       {/* Glass Door Area */}
       <rect x="52.5" y="28" width="95" height="175" fill="rgba(46, 91, 255, 0.05)" stroke="#2E5BFF" strokeWidth="1" strokeDasharray="2 2" />
       
       {/* Bottom Compressor Box */}
       <rect x="45" y="215" width="110" height="45" fill="rgba(255,255,255,0.02)" stroke="#2E5BFF" strokeWidth="1.5" />
       <line x1="55" y1="225" x2="135" y2="225" stroke="#2E5BFF" strokeWidth="1" opacity="0.5" />
       <line x1="55" y1="235" x2="135" y2="235" stroke="#2E5BFF" strokeWidth="1" opacity="0.5" />
       <line x1="55" y1="245" x2="135" y2="245" stroke="#2E5BFF" strokeWidth="1" opacity="0.5" />
       
       {/* Shelves */}
       <line x1="52.5" y1="65" x2="147.5" y2="65" stroke="#2E5BFF" strokeWidth="1.5" opacity="0.8" />
       <line x1="52.5" y1="105" x2="147.5" y2="105" stroke="#2E5BFF" strokeWidth="1.5" opacity="0.8" />
       <line x1="52.5" y1="145" x2="147.5" y2="145" stroke="#2E5BFF" strokeWidth="1.5" opacity="0.8" />
       <line x1="52.5" y1="185" x2="147.5" y2="185" stroke="#2E5BFF" strokeWidth="1.5" opacity="0.8" />

       {/* Dynamic Airflow Arrows (Cyan/Green) */}
       {/* Central Updraft from compressor */}
       <path d="M 100 205 L 100 45" stroke="#00C48C" strokeWidth="2.5" fill="none" markerEnd="url(#arrowhead)" opacity="0.9" />
       
       {/* Right Downdraft */}
       <path d="M 100 45 Q 135 45 135 70 L 135 190" stroke="#00C48C" strokeWidth="1.5" fill="none" markerEnd="url(#arrowhead)" strokeDasharray="4 3" opacity="0.8" />
       
       {/* Left Downdraft */}
       <path d="M 100 45 Q 65 45 65 70 L 65 190" stroke="#00C48C" strokeWidth="1.5" fill="none" markerEnd="url(#arrowhead)" strokeDasharray="4 3" opacity="0.8" />

       {/* Dimensions Lines */}
       {/* Height Dimension */}
       <line x1="25" y1="20" x2="25" y2="260" stroke="#F2F4F7" strokeWidth="1" opacity="0.6" />
       <line x1="20" y1="20" x2="30" y2="20" stroke="#F2F4F7" strokeWidth="1" opacity="0.6" />
       <line x1="20" y1="260" x2="30" y2="260" stroke="#F2F4F7" strokeWidth="1" opacity="0.6" />
       <text x="15" y="140" fill="#F2F4F7" fontSize="10" transform="rotate(-90 15,140)" textAnchor="middle" opacity="0.9" style={{ fontFamily: 'sans-serif', fontWeight: 600 }}>Tinggi</text>
       
       {/* Width Dimension */}
       <line x1="45" y1="280" x2="155" y2="280" stroke="#F2F4F7" strokeWidth="1" opacity="0.6" />
       <line x1="45" y1="275" x2="45" y2="285" stroke="#F2F4F7" strokeWidth="1" opacity="0.6" />
       <line x1="155" y1="275" x2="155" y2="285" stroke="#F2F4F7" strokeWidth="1" opacity="0.6" />
       <text x="100" y="295" fill="#F2F4F7" fontSize="10" textAnchor="middle" opacity="0.9" style={{ fontFamily: 'sans-serif', fontWeight: 600 }}>Lebar</text>
    </svg>
  </div>
);

export default function QrPassportPage() {
  const params = useParams();
  const token = params?.token;
  const router = useRouter();

  // Core States
  const [unit, setUnit] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Smart Routing states
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [issueMainCategory, setIssueMainCategory] = useState('');
  const [issueSubCategory, setIssueSubCategory] = useState('');
  const [serviceNotes, setServiceNotes] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [servicePhone, setServicePhone] = useState('');
  const [storeName, setStoreName] = useState('');
  const [routingResult, setRoutingResult] = useState<any>(null);
  const [routingLoading, setRoutingLoading] = useState(false);

  // Partner Log state
  const [showLogModal, setShowLogModal] = useState(false);
  const [techName, setTechName] = useState('');
  const [logType, setLogType] = useState('CORRECTIVE');
  const [logNotes, setLogNotes] = useState('');
  const [logStatus, setLogStatus] = useState('COMPLETED');
  const [logComponents, setLogComponents] = useState('');
  const [logLoading, setLogLoading] = useState(false);

  // Admin Transfer state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [targetClientId, setTargetClientId] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);

  // Feature Flags
  const showServiceHistory = true; // Verified Service History — visible to all access levels

  // Theme toggle — default light for public scan
  const [isDark, setIsDark] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Load user from localStorage (safe parse)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('user');
        if (stored && stored !== 'undefined' && stored !== 'null') {
          setUser(JSON.parse(stored));
        }
      } catch (err) {
        console.error('Failed to parse user data in QR Passport', err);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, []);

  // Fetch unit data — PUBLIC first, then enrich if logged in
  const loadUnitData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Step 1: Always fetch public unit data (no auth required)
      const { data: publicUnit } = await unitApi.findByQrToken(token as string);
      
      if (!publicUnit) {
        throw new Error('Unit tidak ditemukan');
      }

      // Step 2: If user is logged in, try to enrich with full data
      let storedUser = null;
      try {
        const raw = localStorage.getItem('user');
        if (raw && raw !== 'undefined' && raw !== 'null') {
          storedUser = JSON.parse(raw);
        }
      } catch { /* ignore parse errors */ }

      if (storedUser && localStorage.getItem('token')) {
        try {
          const { data: fullUnit } = await unitApi.findOne(publicUnit.id);
          setUnit(fullUnit);
        } catch {
          // Fallback to public data if auth fails (401)
          setUnit(publicUnit);
        }
      } else {
        // Guest view — show public data
        setUnit(publicUnit);
      }
    } catch (err: any) {
      console.error('Failed to load unit:', err);
      if (err.code === 'ERR_NETWORK') {
        setError('Network Error: Gagal terhubung ke server backend. Pastikan server (port 3001) berjalan dan koneksi internet stabil.');
      } else {
        setError(err.response?.data?.message || 'Gagal memuat data Unit Passport. QR Code mungkin salah atau tidak terdaftar.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadUnitData();
    }
  }, [token]);

  // Load clients for Admin Transfer
  useEffect(() => {
    if (user?.role === 'ADMIN' && showTransferModal) {
      const fetchClients = async () => {
        try {
          const storedToken = localStorage.getItem('token');
          if (storedToken) {
            const res = await fetch(`/api/clients`, {
              headers: { Authorization: `Bearer ${storedToken}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
              setClients(data);
            } else if (data && Array.isArray(data.data)) {
              setClients(data.data);
            } else {
              setClients([]);
            }
          }
        } catch (e) {
          console.error(e);
        }
      };
      fetchClients();
    }
  }, [user, showTransferModal]);

  // Pre-fill techName when log modal opens
  useEffect(() => {
    if (showLogModal && user?.name && !techName) {
      setTechName(user.name);
    }
  }, [showLogModal]);

  // Smart Routing submit handler
  const handleServiceRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setRoutingLoading(true);
    try {
      const combinedNotes = `[${issueMainCategory}${issueSubCategory ? ` - ${issueSubCategory}` : ''}] ${serviceNotes}`.trim();
      const contactInfo = storeName ? `${serviceName} (${storeName})` : serviceName;
      const { data } = await unitApi.requestService(unit.id, {
        city: unit.current_client?.city || unit.specs?.city || 'Jakarta',
        notes: combinedNotes,
        contact_name: contactInfo,
        contact_phone: servicePhone
      });
      setRoutingResult(data);
      loadUnitData(); // Refresh history
      
      // Auto-redirect to WhatsApp if fallback
      if (data.routed_to === 'HQ_FALLBACK' && data.whatsapp_link) {
        setTimeout(() => {
          window.open(data.whatsapp_link, '_blank');
        }, 1500); // 1.5 seconds delay so they can read the modal message first
      }
    } catch (err: any) {
      console.error(err);
      alert('Gagal mengirim permintaan servis.');
    } finally {
      setRoutingLoading(false);
    }
  };

  // Technician Log submit handler
  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogLoading(true);
    try {
      const storedToken = localStorage.getItem('token');
      const res = await fetch(`/api/service-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storedToken}`
        },
        body: JSON.stringify({
          unitId: unit.id,
          service_date: new Date().toISOString(),
          technician_name: techName || user?.name,
          issue_description: logType === 'PREVENTIVE' ? 'Perawatan Rutin (PM)' : 'Perbaikan Masalah / Kerusakan',
          action_taken: logNotes,
          status: logStatus || 'COMPLETED'
        })
      });
      
      if (res.ok) {
        alert('Log servis berhasil ditambahkan! Tiket berhasil diselesaikan.');
        setShowLogModal(false);
        setTechName('');
        setLogNotes('');
        setLogComponents('');
        setLogStatus('COMPLETED');
        loadUnitData();
      } else {
        alert('Gagal menyimpan log servis.');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal menghubungi server.');
    } finally {
      setLogLoading(false);
    }
  };

  // Admin Transfer submit handler
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetClientId) return alert('Pilih klien tujuan terlebih dahulu!');
    setTransferLoading(true);
    try {
      const storedToken = localStorage.getItem('token');
      const res = await fetch(`/api/units/${unit.id}/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storedToken}`
        },
        body: JSON.stringify({
          toClientId: targetClientId,
          reason: transferReason || 'Transfer kepemilikan rutin',
          notes: 'Dibuat otomatis dari dashboard transfer digital'
        })
      });

      if (res.ok) {
        alert('Kepemilikan unit berhasil dipindahkan!');
        setShowTransferModal(false);
        setTransferReason('');
        loadUnitData();
      } else {
        alert('Gagal melakukan transfer kepemilikan.');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal menghubungi server.');
    } finally {
      setTransferLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={48} />
        <p>Memindai QR Passport...</p>
      </div>
    );
  }

  if (error || !unit) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorCard}>
          <ShieldAlert size={48} className={styles.errorIcon} />
          <h2>Unit Tidak Terdaftar</h2>
          <p>{error || 'QR Code yang Anda pindai tidak valid atau sudah kedaluwarsa.'}</p>
          <button onClick={() => router.push('/')} className={styles.btnBack}>
            <ArrowLeft size={16} /> Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  // --- ACCESS CONTROL VARIABLES ---
  const isGuest = !user;
  const isClient = user?.role === 'CLIENT';
  const isPartner = user?.role === 'PARTNER';
  const isAdmin = user?.role === 'ADMIN';

  // Client Validation: check if unit belongs to client
  const belongsToClient = isClient && unit.current_client?.id === user.client_id;
  const hasClientRestriction = isClient && !belongsToClient;

  // Determine warranty status
  const today = new Date();
  const expiryDate = unit.warranty_expiry ? new Date(unit.warranty_expiry) : null;
  const isWarrantyActive = expiryDate ? expiryDate > today : false;

  return (
    <div className={styles.pageWrapper} data-theme={isDark ? 'dark' : 'light'}>
      {/* Background decorations */}
      <div className={styles.dotGrid} aria-hidden="true" />
      <div className={styles.dotGridRight} aria-hidden="true" />

      <div className={styles.container}>
        {/* Dynamic Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button onClick={() => router.back()} className={styles.backBtn}>
              <ArrowLeft size={16} /> Kembali ke Daftar Unit
            </button>
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
            {/* Theme toggle — right-aligned, below level badge */}
            <button
              onClick={() => setIsDark(v => !v)}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,31,63,0.08)',
                border: isDark ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(0,31,63,0.15)',
                borderRadius: '20px',
                padding: '4px 10px',
                cursor: 'pointer',
                color: isDark ? '#e2e8f0' : '#001F3F',
                fontSize: '0.7rem',
                fontWeight: 700,
                fontFamily: 'var(--font-heading)',
                letterSpacing: '0.04em',
                transition: 'all 0.2s ease',
                alignSelf: 'flex-end',
              }}
            >
              {isDark ? <Sun size={12} /> : <Moon size={12} />}
              {isDark ? 'Light' : 'Dark'}
            </button>
            <div className={styles.lastUpdated}>
              <Clock size={12} /> Terakhir diperbarui: {new Date(unit.updated_at || Date.now()).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })} WIB
            </div>
          </div>
        </header>

        {/* Mobile-First Carousel Container */}
        <div className={styles.carouselWrapper}>
          <button className={`${styles.carouselNavBtn} ${styles.prevBtn}`} onClick={() => { if (carouselRef.current) carouselRef.current.scrollBy({ left: -carouselRef.current.clientWidth, behavior: 'smooth' }); }}>&lsaquo;</button>
          <div className={styles.carouselContainer} ref={carouselRef}>

          {/* Slide 1: Spesifikasi Utama */}
          <section className={`${styles.card} ${styles.carouselSlide}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <FileText size={16} color="#8bb2ff" />
                <h2>Spesifikasi Utama</h2>
              </div>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>Model</span>
                <span className={styles.specValue}>{unit.model_name}</span>
              </div>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>Serial Number</span>
                <span className={styles.specValue}>{unit.serial_number}</span>
              </div>
              
              {unit.specs?.type === 'MESIN' || (!unit.specs?.type && unit.specs?.dimension) ? (
                <>
                  <div className={styles.specItem}>
                    <span className={styles.specLabel}>Dimensi / Dimension</span>
                    <span className={styles.specValue}>{unit.specs?.dimension || '—'}</span>
                  </div>
                  <div className={styles.specItem}>
                    <span className={styles.specLabel}>Daya Listrik / Power</span>
                    <span className={styles.specValue}>{unit.specs?.power || '—'}</span>
                  </div>
                  <div className={styles.specItem}>
                    <span className={styles.specLabel}>Kapasitas / Capacity</span>
                    <span className={styles.specValue}>{unit.specs?.capacity || '—'}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.specItem}>
                    <span className={styles.specLabel}>Kompresor / Compressor</span>
                    <span className={styles.specValue}>{unit.specs?.compressor || '—'}</span>
                  </div>
                  <div className={styles.specItem}>
                    <span className={styles.specLabel}>Refrigeran / Refrigerant</span>
                    <span className={styles.specValue}>{unit.specs?.refrigerant || '—'}</span>
                  </div>
                  <div className={styles.specItem}>
                    <span className={styles.specLabel}>Daya / Wattage</span>
                    <span className={styles.specValue}>{unit.specs?.wattage || '—'}</span>
                  </div>
                </>
              )}
              
              <div className={styles.specItem}>
                <span className={styles.specLabel}>Dibuat Pada</span>
                <span className={styles.specValue}>
                  {unit.created_at ? new Date(unit.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                </span>
              </div>
              <div className={styles.specItem} style={{ borderBottom: 'none' }}>
                <span className={styles.specLabel}>Lokasi Pembuatan</span>
                <span className={styles.specValue}>Tangerang, Indonesia</span>
              </div>
              
              <button className={styles.btnViewAll}>
                Lihat Semua Spesifikasi <span>›</span>
              </button>
            </div>
          </section>

          {/* Slide 2: Layanan & Dukungan */}
          <section className={`${styles.card} ${styles.actionCard} ${styles.carouselSlide}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <Phone size={16} color="#8bb2ff" />
                <h2>Layanan &amp; Dukungan</h2>
              </div>
            </div>
            <div className={styles.cardContent} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', justifyContent: 'center' }}>
              
              {/* PUBLIC VIEW (Level 1) & RESTRICTED VIEW */}
              {(isGuest || hasClientRestriction) && (
                <div className={styles.publicPrompt}>
                  <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <Lock size={20} color="#8f9bb3" />
                    </div>
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '8px' }}>
                    {hasClientRestriction ? 'Akses Terbatas' : 'Layanan & Dukungan'}
                  </h3>
                  <p className={styles.restrictedText} style={{ fontSize: '0.85rem', color: '#8f9bb3', marginBottom: '24px', lineHeight: 1.5 }}>
                    {hasClientRestriction 
                      ? 'Anda tidak berwenang melihat riwayat servis lengkap untuk unit milik franchise lain.' 
                      : 'Laporkan masalah teknis ke tim servis kami atau login untuk melihat riwayat servis lengkap.'}
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                    <button className={styles.btnEmergency} onClick={() => setShowServiceModal(true)}>
                      Laporkan Masalah / Request Service
                    </button>
                    
                    {isGuest && (
                      <>
                        <button className={styles.btnPrimary} onClick={() => router.push(`/login?redirect=/id/${token}`)}>
                          <Lock size={16} /> Sign In (Manajemen Klien)
                        </button>
                        <p className={styles.guestNote} style={{ fontSize: '0.75rem', marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
                          Pemilik unit, teknisi, atau mitra resmi Holicindo — masuk untuk melihat informasi lebih lengkap.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* CLIENT VIEW (Level 2) — Active Owner */}
              {isClient && belongsToClient && (
                <div className={styles.clientActions} style={{ width: '100%', textAlign: 'left' }}>
                  <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                      <UserCheck size={20} color="#3b82f6" />
                    </div>
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '8px', textAlign: 'center' }}>Akses Pemilik (Fleet Owner)</h3>
                  <p className={styles.sectionInfo} style={{ textAlign: 'center', marginBottom: '24px' }}>Unit terdaftar sebagai aset resmi perusahaan Anda.</p>
                  <button className={styles.btnEmergency} onClick={() => setShowServiceModal(true)}>
                    Request Emergency Service
                  </button>
                </div>
              )}

              {/* PARTNER VIEW (Level 3) — Technical Partner */}
              {isPartner && (
                <div className={styles.partnerActions} style={{ width: '100%', textAlign: 'left' }}>
                  <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      <Wrench size={20} color="#10b981" />
                    </div>
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '4px', textAlign: 'center' }}>Technical Partner Mode</h3>
                  <p className={styles.sectionInfo} style={{ textAlign: 'center', marginBottom: '16px', fontSize: '0.82rem' }}>Anda terverifikasi sebagai teknisi untuk unit ini.</p>

                  {/* Active Ticket Info */}
                  {unit.service_logs && unit.service_logs.filter((l: any) => l.status === 'PENDING').length > 0 && (
                    <div style={{
                      background: 'rgba(255,107,0,0.08)',
                      border: '1px solid rgba(255,107,0,0.2)',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      marginBottom: '14px',
                    }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#FF6B00', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF6B00', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                        Tiket Aktif
                      </div>
                      {unit.service_logs.filter((l: any) => l.status === 'PENDING').slice(0, 1).map((log: any) => (
                        <div key={log.id}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ffffff', marginBottom: '4px', fontFamily: 'monospace' }}>
                            Call ID: {log.id}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4 }}>
                            {(log.issue_description || '').slice(0, 80)}{(log.issue_description || '').length > 80 ? '…' : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button
                      className={styles.btnPrimary}
                      onClick={() => {
                        setTechName(user?.name || '');
                        setShowLogModal(true);
                      }}
                      style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', boxShadow: '0 4px 12px rgba(5,150,105,0.3)' }}
                    >
                      <Check size={16} /> Selesaikan &amp; Tutup Tiket
                    </button>
                    <button
                      className={styles.btnPrimary}
                      onClick={() => {
                        setTechName(user?.name || '');
                        setLogStatus('PENDING');
                        setShowLogModal(true);
                      }}
                    >
                      <Wrench size={16} /> Tambah Catatan Servis
                    </button>
                  </div>
                </div>
              )}

              {/* ADMIN VIEW (Level 4) — Administrator */}
              {isAdmin && (
                <div className={styles.adminActions} style={{ width: '100%', textAlign: 'left' }}>
                  <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                      <ShieldAlert size={20} color="#a78bfa" />
                    </div>
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '8px', textAlign: 'center' }}>Administrator Control</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                    <button className={styles.btnEmergency} onClick={() => setShowServiceModal(true)}>
                      Uji Alur Smart Routing
                    </button>
                    <button className={styles.btnPrimary} onClick={() => setShowTransferModal(true)}>
                      Pindahkan Kepemilikan
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Slide 3: Stats Card */}
          <section className={`${styles.card} ${styles.carouselSlide}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <Settings size={16} color="#8bb2ff" />
                <h2>Stats Card</h2>
              </div>
            </div>
            <div className={styles.statsCardGrid}>
          {/* Status Unit */}
          <div className={styles.statusCard}>
            <div className={`${styles.statusIcon} ${styles.success}`}>
              <CheckCircle2 size={24} />
            </div>
            <div className={styles.statusText}>
              <h3>Status Unit</h3>
              <p style={{ color: '#10b981' }}>Normal</p>
              <span>Unit beroperasi dengan baik</span>
            </div>
          </div>

          {/* Garansi */}
          <div className={styles.statusCard}>
            <div className={`${styles.statusIcon} ${isWarrantyActive ? styles.success : styles.warning}`}>
              <ShieldAlert size={24} />
            </div>
            <div className={styles.statusText}>
              <h3>Garansi</h3>
              <p style={{ color: isWarrantyActive ? '#10b981' : '#f59e0b' }}>{isWarrantyActive ? 'Aktif' : 'Kedaluwarsa'}</p>
              <span>{isWarrantyActive ? `Hingga ${expiryDate ? expiryDate.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}` : 'Hubungi support'}</span>
            </div>
          </div>

          {/* Last Service */}
          <div className={styles.statusCard}>
            <div className={`${styles.statusIcon} ${styles.info}`}>
              <Wrench size={24} />
            </div>
            <div className={styles.statusText}>
              <h3>Last Service</h3>
              <p style={{ color: '#336bd9ff' }}>Belum Ada</p>
              <span>Belum pernah diservis</span>
            </div>
          </div>

          {/* Next Service */}
          <div className={styles.statusCard}>
            <div className={`${styles.statusIcon} ${styles.info}`}>
              <Clock size={24} />
            </div>
            <div className={styles.statusText}>
              <h3>Next Service</h3>
              <p style={{ color: '#3b82f6' }}>Disarankan</p>
              <span>Dalam 180 hari</span>
            </div>
          </div>

          {/* Verifikasi */}
          <div className={styles.statusCard}>
            <div className={`${styles.statusIcon} ${styles.success}`}>
              <CheckCircle2 size={24} />
            </div>
            <div className={styles.statusText}>
              <h3>Verifikasi</h3>
              <p style={{ color: '#10b981' }}>Asli</p>
              <span>Unit terverifikasi Holicindo</span>
            </div>
          </div>
          </div>
          </section>

          {/* Slide 4: Media - Foto Test Run */}
          <section className={`${styles.card} ${styles.carouselSlide}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <ImageIcon size={16} color="#8bb2ff" />
                <h2>Foto Test Run &amp; QC</h2>
              </div>
            </div>
            <div className={styles.mediaSingleItem}>
              <div className={styles.mediaItem} style={{ border: 'none', boxShadow: 'none', borderRadius: '0 0 12px 12px' }}>
            <div className={styles.mediaImageWrapper}>
              <img 
                src={unit.test_run_image_url || '/test_run.png?v=2'} 
                alt="Test Run QC" 
                className={styles.mediaImage}
                style={{ cursor: 'pointer', objectPosition: 'center 40%' }}
                onClick={() => setSelectedMedia(unit.test_run_image_url || '/test_run.png?v=2')}
              />
              <div className={styles.mediaOverlay}>
                <span className={styles.verifiedBadge}><CheckCircle2 size={14} /> Terverifikasi</span>
              </div>
            </div>
            <div className={styles.mediaContent}>
              <h3>Foto Test Run &amp; Quality Control</h3>
              <p>Dokumentasi pengujian performa kompresor dan suhu ruang sebelum unit didistribusikan ke klien.</p>
              <button className={styles.btnViewAll} style={{ width: 'fit-content', padding: '8px 16px', marginTop: '16px' }} onClick={() => setSelectedMedia(unit.test_run_image_url || '/test_run.png?v=2')}>
                Lihat Foto <ImageIcon size={14} style={{marginLeft: '8px'}}/>
              </button>
            </div>
          </div>
        </div>
      </section>

          {/* Slide 5: Media - Diagram Sirkulasi */}
          <section className={`${styles.card} ${styles.carouselSlide}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <ImageIcon size={16} color="#8bb2ff" />
                <h2>Diagram Sirkulasi Udara</h2>
              </div>
            </div>
            <div className={styles.mediaSingleItem}>
              <div className={styles.mediaItem} style={{ border: 'none', boxShadow: 'none', borderRadius: '0 0 12px 12px' }}>
            <div className={styles.mediaImageWrapper} style={{ cursor: 'pointer' }} onClick={() => setSelectedMedia(unit.diagram_image_url || 'diagram')}>
              {unit.diagram_image_url ? (
                <img 
                  src={unit.diagram_image_url} 
                  alt="Diagram" 
                  className={styles.mediaImage}
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <AirflowDiagram />
              )}
              <div className={styles.mediaOverlay}>
                <span className={styles.verifiedBadge}><CheckCircle2 size={14} /> Cetak Biru Digital</span>
              </div>
            </div>
            <div className={styles.mediaContent}>
              <h3>Diagram Sirkulasi Udara &amp; Dimensi Fisik</h3>
              <p>Representasi visual sirkulasi pendinginan udara yang merata dan ukuran presisi unit untuk referensi penempatan outlet pelanggan.</p>
              <button className={styles.btnViewAll} style={{ width: 'fit-content', padding: '8px 16px', marginTop: '16px' }} onClick={() => setSelectedMedia(unit?.diagram_image_url || "diagram")}>
                Lihat Diagram <ArrowLeft size={14} style={{marginLeft: '8px', transform: 'rotate(180deg)'}}/>
              </button>
            </div>
          </div>
        </div>
      </section>

      </div>
      <button className={`${styles.carouselNavBtn} ${styles.nextBtn}`} onClick={() => { if (carouselRef.current) carouselRef.current.scrollBy({ left: carouselRef.current.clientWidth, behavior: 'smooth' }); }}>&rsaquo;</button>
    </div>


      {/* Media Modal */}
      {selectedMedia && (
        <div className={styles.modalOverlay} onClick={() => setSelectedMedia(null)}>
          <div className={styles.modalContent} style={{ maxWidth: '900px', width: '90%', padding: '24px', background: 'rgba(6, 13, 33, 0.95)', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader} style={{ marginBottom: '20px' }}>
              <h2>{selectedMedia === 'diagram' || selectedMedia === unit?.diagram_image_url ? 'Diagram Sirkulasi Udara' : 'Foto Test Run QC'}</h2>
              <button className={styles.closeBtn} onClick={() => setSelectedMedia(null)}>×</button>
            </div>
            <div style={{ width: '100%', height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', borderRadius: '8px', overflow: 'hidden' }}>
              {selectedMedia === 'diagram' ? (
                <div style={{ transform: 'scale(1.5)' }}>
                  <AirflowDiagram />
                </div>
              ) : (
                <img src={selectedMedia} alt="Media" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* SERVICE HISTORY SECTION — Verified Service History (visible to all access levels) */}
      {showServiceHistory && (
        <section className={styles.sectionCard} style={{ marginTop: '40px', marginBottom: '40px' }}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderLeft}>
              <Wrench size={16} color="#8bb2ff" />
              <h2>Riwayat Servis</h2>
            </div>
          </div>
          <div className={styles.cardContent} style={{ padding: '24px' }}>
            {!unit.service_logs || unit.service_logs.length === 0 ? (
              <div className={styles.emptyState}>
                <Wrench size={40} style={{ marginBottom: '16px', color: '#8f9bb3', opacity: 0.6 }} />
                <p style={{ color: '#8f9bb3', textAlign: 'center' }}>Belum ada riwayat servis</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {unit.service_logs.map((log: any, idx: number) => (
                  <div key={log.id || idx} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    padding: '16px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <span className={styles.historyDate}>
                        {log.service_date
                          ? new Date(log.service_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
                          : '—'}
                      </span>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '999px',
                        background: log.status === 'COMPLETED'
                          ? 'rgba(16, 185, 129, 0.15)'
                          : 'rgba(245, 158, 11, 0.15)',
                        color: log.status === 'COMPLETED' ? '#10b981' : '#f59e0b',
                        border: `1px solid ${log.status === 'COMPLETED' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
                      }}>
                        {log.status === 'COMPLETED' ? 'SELESAI' : 'PENDING'}
                      </span>
                    </div>
                    <div className={styles.historyTech}>
                      Teknisi: {log.technician_name || '—'}
                    </div>
                    {(log.action_taken || log.notes) && (
                      <div className={styles.historyNotes}>
                        {(log.action_taken || log.notes || '').slice(0, 80)}
                        {(log.action_taken || log.notes || '').length > 80 ? '…' : ''}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ────────────────── MODALS & FORMS ────────────────── */}

      {/* Modal 1: Smart Service Routing */}
      {showServiceModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <div className={styles.headerLeftMobile}>
                <button onClick={() => { 
                  setShowServiceModal(false); 
                  setRoutingResult(null); 
                  setIssueMainCategory('');
                  setIssueSubCategory('');
                  setServiceNotes('');
                  setStoreName('');
                }} className={styles.mobileBackBtn}>
                  <ArrowLeft size={18} strokeWidth={2.5} />
                </button>
                <h2>Request Service &amp; Smart Routing</h2>
              </div>
              <button onClick={() => { 
                setShowServiceModal(false); 
                setRoutingResult(null); 
                setIssueMainCategory('');
                setIssueSubCategory('');
                setServiceNotes('');
                setStoreName('');
              }} className={styles.closeBtn}>×</button>
            </div>
            
            {!routingResult ? (
              <form onSubmit={handleServiceRequest} className={styles.modalForm}>
                <p className={styles.modalHint}>Permintaan akan diproses menggunakan sistem Smart Routing regional kami.</p>
                
                <div className={styles.formGroup}>
                  <label>Nama/Kode Outlet (Toko) <span className={styles.mobileOnly} style={{ color: '#ef4444' }}>*</span></label>
                  <input 
                    type="text" 
                    value={storeName} 
                    onChange={(e) => setStoreName(e.target.value)} 
                    placeholder="Contoh: KFC Kemang / KFC-123" 
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Nama Kontak Penanggung Jawab Outlet <span className={styles.mobileOnly} style={{ color: '#ef4444' }}>*</span></label>
                  <input 
                    type="text" 
                    value={serviceName} 
                    onChange={(e) => setServiceName(e.target.value)} 
                    placeholder="Contoh: Pak Budi (Store Manager)" 
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>No. HP Kontak Outlet <span className={styles.mobileOnly} style={{ color: '#ef4444' }}>*</span></label>
                  <input 
                    type="text" 
                    value={servicePhone} 
                    onChange={(e) => setServicePhone(e.target.value)} 
                    placeholder="Contoh: 0812XXXXXXXX" 
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Pilih Kategori Kendala Utama <span className={styles.mobileOnly} style={{ color: '#ef4444' }}>*</span></label>
                  <CustomSelect 
                    value={issueMainCategory}
                    onChange={(val) => {
                      setIssueMainCategory(val);
                      if (val !== 'Kendala Showcase') setIssueSubCategory('');
                    }}
                    options={[
                      { value: '', label: '— Pilih Kategori —' },
                      { value: 'Kendala Mesin', label: 'Kendala Mesin (Kompresor, dsb)' },
                      { value: 'Kendala Showcase', label: 'Kendala Showcase (Fisik/Kabinet)' }
                    ]}
                    placeholder="— Pilih Kategori —"
                  />
                </div>

                {issueMainCategory === 'Kendala Showcase' && (
                  <div className={styles.formGroup}>
                    <label>Sub-Kategori Kendala Showcase <span className={styles.mobileOnly} style={{ color: '#ef4444' }}>*</span></label>
                    <CustomSelect 
                      value={issueSubCategory}
                      onChange={(val) => setIssueSubCategory(val)}
                      options={[
                        { value: '', label: '— Pilih Sub-Kategori —' },
                        { value: 'Kaca', label: 'Kaca (Pecah/Berembun)' },
                        { value: 'Lampu', label: 'Lampu (Mati/Redup)' },
                        { value: 'Pendingin', label: 'Pendingin (Kurang Dingin/Bocor)' },
                        { value: 'Kelistrikan', label: 'Kelistrikan (Korslet/Tidak Menyala)' }
                      ]}
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
                  <button type="submit" className={styles.btnSubmit} disabled={routingLoading}>
                    {routingLoading ? 'Melakukan Smart Routing...' : (
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
                    <a 
                      href={routingResult.whatsapp_link} 
                      target="_blank" 
                      className={styles.btnWhatsapp}
                    >
                      <Phone size={16} /> Hubungi Holicindo HQ via WhatsApp
                    </a>
                  </div>
                )}
                
                <button 
                  onClick={() => { 
                    setShowServiceModal(false); 
                    setRoutingResult(null); 
                    setIssueMainCategory('');
                    setIssueSubCategory('');
                    setServiceNotes('');
                  }}
                  className={styles.btnFinish}
                >
                  Selesai
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal 2: Partner Log Servis (Level 3) — Enhanced Close Ticket */}
      {showLogModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <div className={styles.headerLeftMobile}>
                <button onClick={() => { setShowLogModal(false); setLogStatus('COMPLETED'); setLogComponents(''); }} className={styles.mobileBackBtn}>
                  <ArrowLeft size={18} strokeWidth={2.5} />
                </button>
                <h2>{logStatus === 'COMPLETED' ? 'Selesaikan & Tutup Tiket' : 'Tambah Catatan Servis'}</h2>
              </div>
              <button onClick={() => { setShowLogModal(false); setLogStatus('COMPLETED'); setLogComponents(''); }} className={styles.closeBtn}>×</button>
            </div>

            <form onSubmit={handleAddLog} className={styles.modalForm}>
              {/* Unit info summary */}
              <div style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px',
                padding: '12px 14px',
                marginBottom: '4px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}>
                <span style={{ fontSize: '0.72rem', color: '#8f9bb3', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Unit yang Dikerjakan</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff' }}>{unit.model_name}</span>
                <span style={{ fontSize: '0.78rem', color: '#8f9bb3', fontFamily: 'monospace' }}>SN: {unit.serial_number}</span>
              </div>

              <div className={styles.formGroup}>
                <label>Nama Teknisi Yang Mengerjakan *</label>
                <input
                  type="text"
                  value={techName}
                  onChange={(e) => setTechName(e.target.value)}
                  placeholder="Contoh: Andi Wijaya"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Jenis Servis *</label>
                <CustomSelect 
                  value={logType} 
                  onChange={(val) => setLogType(val)} 
                  options={[
                    { value: 'CORRECTIVE', label: 'Corrective — Perbaikan Masalah / Kerusakan' },
                    { value: 'PREVENTIVE', label: 'Preventive — Perawatan Rutin (PM)' }
                  ]}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Tindakan yang Dilakukan *</label>
                <textarea
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  placeholder="Jelaskan tindakan yang dilakukan, misal: Penggantian door gasket, cleaning kondensor, isi freon R290..."
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Komponen Diganti (opsional)</label>
                <input
                  type="text"
                  value={logComponents}
                  onChange={(e) => setLogComponents(e.target.value)}
                  placeholder="Contoh: Door gasket, fan motor, kapasitor"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Status Penyelesaian *</label>
                <CustomSelect 
                  value={logStatus} 
                  onChange={(val) => setLogStatus(val)} 
                  options={[
                    { value: 'COMPLETED', label: 'SELESAI — Tiket ditutup, unit berfungsi normal' },
                    { value: 'PENDING', label: 'MASIH PROSES — Perlu kunjungan lanjutan' }
                  ]}
                />
              </div>

              <button type="submit" className={styles.btnSubmit} disabled={logLoading} style={{
                background: logStatus === 'COMPLETED'
                  ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                  : 'linear-gradient(135deg, #184cf4 0%, #0a2eb5 100%)',
              }}>
                {logLoading
                  ? 'Menyimpan...'
                  : logStatus === 'COMPLETED'
                    ? 'Simpan & Tutup Tiket'
                    : 'Simpan Catatan Servis'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Admin Ownership Transfer (Level 4) */}
      {showTransferModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <div className={styles.headerLeftMobile}>
                <button onClick={() => setShowTransferModal(false)} className={styles.mobileBackBtn}>
                  <ArrowLeft size={18} strokeWidth={2.5} />
                </button>
                <h2>Transfer Ownership (Pindahkan Aset)</h2>
              </div>
              <button onClick={() => setShowTransferModal(false)} className={styles.closeBtn}>×</button>
            </div>
            
            <form onSubmit={handleTransfer} className={styles.modalForm}>
              <p className={styles.modalHint}>Memindahkan unit secara resmi ke database klien baru.</p>
              
              <div className={styles.formGroup}>
                <label>Pemilik Saat Ini</label>
                <input 
                  type="text" 
                  value={unit.current_client?.company_name || 'INTERNAL STOCK'} 
                  disabled 
                  style={{ background: '#f1f5f9', color: '#64748b' }}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Pilih Klien Tujuan Baru</label>
                <CustomSelect 
                  value={targetClientId} 
                  onChange={(val) => setTargetClientId(val)}
                  options={[
                    { value: '', label: '— Pilih Klien —' },
                    ...(Array.isArray(clients) ? clients.map((c: any) => ({ value: c.id, label: `${c.company_name} (${c.bp_code})` })) : [])
                  ]}
                  placeholder="— Pilih Klien —"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Alasan Pemindahan / Transfer</label>
                <textarea 
                  value={transferReason} 
                  onChange={(e) => setTransferReason(e.target.value)} 
                  placeholder="Sebutkan alasan (misal: relokasi outlet franchise, penjualan unit baru)..."
                  required
                />
              </div>

              <button type="submit" className={styles.btnSubmit} disabled={transferLoading}>
                {transferLoading ? 'Memproses Transfer...' : 'Konfirmasi Pindahkan Aset'}
              </button>
            </form>
          </div>
        </div>
      )}
      
      {/* Footer Copyright */}
      <footer className={styles.footerCopyright}>
        Copyright &copy; 2026 PT. Holicindo Dasa Anugerah. All rights reserved.
      </footer>
    </div>
    </div>
  );
}
