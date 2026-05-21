'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { unitApi } from '@/lib/api';
import { 
  ShieldAlert, Wrench, FileText, CheckCircle2, 
  ExternalLink, Phone, ArrowLeft, Loader2, RefreshCw, 
  Lock, Check, UserCheck, Settings, BookOpen, Clock, Image as ImageIcon
} from 'lucide-react';
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
  const [routingResult, setRoutingResult] = useState<any>(null);
  const [routingLoading, setRoutingLoading] = useState(false);

  // Partner Log state
  const [showLogModal, setShowLogModal] = useState(false);
  const [techName, setTechName] = useState('');
  const [logType, setLogType] = useState('CORRECTIVE');
  const [logNotes, setLogNotes] = useState('');
  const [logLoading, setLogLoading] = useState(false);

  // Admin Transfer state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [targetClientId, setTargetClientId] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);

  // Feature Flags
  const showServiceHistory = false; // TODO: Set to true to show Service History Panel

  // Load user from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    }
  }, []);

  // Fetch unit data
  const loadUnitData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Strict Security Block: Require Login
      const storedUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null;
      
      if (!storedUser) {
        // Stop execution and force login
        router.push(`/login?redirect=/id/${token}`);
        return; 
      }

      // If logged in, proceed to fetch
      const { data: publicUnit } = await unitApi.findByQrToken(token as string);
      
      if (!publicUnit) {
        throw new Error('Unit tidak ditemukan');
      }

      if (storedUser.role === 'PARTNER' || storedUser.role === 'ADMIN') {
        const { data: fullUnit } = await unitApi.findOne(publicUnit.id);
        setUnit(fullUnit);
      } else if (storedUser.role === 'CLIENT') {
        const { data: fullUnit } = await unitApi.findOne(publicUnit.id);
        setUnit(fullUnit);
      } else {
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
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001'}/clients`, {
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

  // Smart Routing submit handler
  const handleServiceRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setRoutingLoading(true);
    try {
      const combinedNotes = `[${issueMainCategory}${issueSubCategory ? ` - ${issueSubCategory}` : ''}] ${serviceNotes}`.trim();
      const { data } = await unitApi.requestService(unit.id, {
        city: unit.current_client?.city || unit.specs?.city || 'Jakarta',
        notes: combinedNotes,
        contact_name: serviceName,
        contact_phone: servicePhone
      });
      setRoutingResult(data);
      loadUnitData(); // Refresh history
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001'}/service-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storedToken}`
        },
        body: JSON.stringify({
          unitId: unit.id,
          service_date: new Date(),
          service_type: logType === 'PREVENTIVE' ? 'PREVENTIVE_MAINTENANCE' : 'CORRECTIVE_MAINTENANCE',
          technician_name: techName,
          notes: logNotes,
          status: 'COMPLETED'
        })
      });
      
      if (res.ok) {
        alert('Log servis berhasil ditambahkan! Tiket berhasil diselesaikan.');
        setShowLogModal(false);
        setTechName('');
        setLogNotes('');
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001'}/units/${unit.id}/transfer`, {
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
    <div className={styles.container}>
      {/* Dynamic Header indicating access level */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button onClick={() => router.back()} className={styles.backBtn}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className={styles.serialNumber}>{unit.serial_number}</h1>
            <p className={styles.modelName}>{unit.model_name}</p>
          </div>
        </div>

        <div className={styles.accessBadge}>
          {isGuest && <span className={`${styles.badge} ${styles.badgeGuest}`}>Level 1: Public Scan</span>}
          {isClient && belongsToClient && <span className={`${styles.badge} ${styles.badgeClient}`}>Level 2: Fleet Owner</span>}
          {hasClientRestriction && <span className={`${styles.badge} ${styles.badgeRestricted}`}>Level 2: Restricted</span>}
          {isPartner && <span className={`${styles.badge} ${styles.badgePartner}`}>Level 3: Technical Partner</span>}
          {isAdmin && <span className={`${styles.badge} ${styles.badgeAdmin}`}>Level 4: Administrator</span>}
        </div>
      </header>

      {/* Main Digital Twin Grid */}
      <div className={styles.grid}>
        
        {/* Left Card: Core Specifications */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <Settings size={20} />
            <h2>Digital Twin Specs</h2>
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
            
            {/* Specs nested values (Compressor, Refrigerant, etc. OR Dimension, Power, Capacity) */}
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
            
            {/* Warranty expiry */}
            <div className={styles.specItem}>
              <span className={styles.specLabel}>Status Garansi</span>
              <span className={`${styles.warrantyStatus} ${isWarrantyActive ? styles.active : styles.expired}`}>
                {isWarrantyActive ? 'AKTIF' : 'KEDALUWARSA / EXPIRED'}
              </span>
            </div>
            <div className={styles.specItem}>
              <span className={styles.specLabel}>Hingga / Expiry</span>
              <span className={styles.specValue}>
                {expiryDate ? expiryDate.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
              </span>
            </div>

            {/* Owner view only */}
            {!isGuest && !hasClientRestriction && (
              <div className={styles.specItem}>
                <span className={styles.specLabel}>Pelanggan Resmi / Client</span>
                <span className={styles.specValue}>
                  {unit.current_client?.company_name || 'Tidak ada pelanggan (Internal)'}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Right Card: Interactive Action Hub */}
        <section className={`${styles.card} ${styles.actionCard}`}>
          <div className={styles.cardHeader}>
            <Wrench size={20} />
            <h2>Layanan &amp; Dukungan</h2>
          </div>
          <div className={styles.cardContent}>
            
            {/* PUBLIC VIEW (Level 1) & RESTRICTED VIEW */}
            {(isGuest || hasClientRestriction) && (
              <div className={styles.publicPrompt}>
                <p className={styles.restrictedText}>
                  {hasClientRestriction 
                    ? 'Anda tidak berwenang melihat riwayat servis lengkap untuk unit milik franchise lain.' 
                    : 'Pindai publik membatasi akses detail riwayat servis dan diagram kelistrikan untuk melindungi rahasia industri.'}
                </p>
                <button className={styles.btnEmergency} onClick={() => setShowServiceModal(true)}>
                  Laporkan Masalah / Request Service
                </button>
                {isGuest && (
                  <p className={styles.guestNote}>
                    Teknisi lapangan / pemilik unit? Silakan <span className={styles.loginLink} onClick={() => router.push('/login')}>Sign In</span> untuk melihat manual lengkap dan electrical circuits.
                  </p>
                )}
              </div>
            )}

            {/* CLIENT VIEW (Level 2) — Active Owner */}
            {isClient && belongsToClient && (
              <div className={styles.clientActions}>
                <p className={styles.sectionInfo}>Unit terdaftar sebagai aset resmi perusahaan Anda.</p>
                <button className={styles.btnEmergency} onClick={() => setShowServiceModal(true)}>
                  Request Emergency Service
                </button>
              </div>
            )}

            {/* PARTNER VIEW (Level 3) — Technical Partner */}
            {isPartner && (
              <div className={styles.partnerActions}>
                <p className={styles.sectionInfo}>Technical Mode Aktif: Anda berada di depan unit.</p>
                <button className={styles.btnPrimary} onClick={() => setShowLogModal(true)}>
                  Tambah Log Servis &amp; Tutup Tiket
                </button>
              </div>
            )}

            {/* ADMIN VIEW (Level 4) — Administrator */}
            {isAdmin && (
              <div className={styles.adminActions}>
                <p className={styles.sectionInfo}>Administrator Mode Aktif: Kontrol Master.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button className={styles.btnEmergency} onClick={() => setShowServiceModal(true)}>
                    Uji Alur Smart Routing
                  </button>
                  <button className={styles.btnPrimary} onClick={() => setShowTransferModal(true)}>
                    Pindahkan Kepemilikan Unit
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* MEDIA & VERIFICATION (PUBLIC VIEW) */}
      <section className={styles.sectionCard}>
        <div className={styles.cardHeader}>
          <ImageIcon size={20} />
          <h2>Media &amp; Verifikasi Pabrik</h2>
        </div>
        <div className={styles.mediaGrid}>
          {/* Test Run Quality Control */}
          <div className={styles.mediaItem}>
            <div className={styles.mediaImageWrapper}>
              <img 
                src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800&auto=format&fit=crop" 
                alt="Test Run QC" 
                className={styles.mediaImage}
              />
              <div className={styles.mediaOverlay}>
                <span className={styles.verifiedBadge}><CheckCircle2 size={14} /> Terverifikasi</span>
              </div>
            </div>
            <div className={styles.mediaContent}>
              <h3>Foto Test Run &amp; Quality Control</h3>
              <p>Dokumentasi pengujian performa kompresor dan suhu ruang sebelum unit didistribusikan ke klien.</p>
            </div>
          </div>

          {/* Diagram / Schematic */}
          <div className={styles.mediaItem}>
            <div className={styles.mediaImageWrapper}>
              <AirflowDiagram />
              <div className={styles.mediaOverlay}>
                <span className={styles.verifiedBadge}><CheckCircle2 size={14} /> Cetak Biru Digital</span>
              </div>
            </div>
            <div className={styles.mediaContent}>
              <h3>Diagram Sirkulasi Udara &amp; Dimensi Fisik</h3>
              <p>Representasi visual sirkulasi pendinginan udara yang merata dan ukuran presisi unit untuk referensi penempatan outlet pelanggan.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICE HISTORY SECTION (Temporarily Hidden via Feature Flag) */}
      {showServiceHistory && (
        <section className={styles.sectionCard} style={{ marginTop: '40px', marginBottom: '40px' }}>
          <div className={styles.cardHeader}>
            <Clock size={20} />
            <h2>Riwayat Servis (Service History)</h2>
          </div>
          <div className={styles.cardContent} style={{ padding: '24px' }}>
            {!unit.service_logs || unit.service_logs.length === 0 ? (
              <div className={styles.emptyState}>
                <CheckCircle2 size={40} style={{ marginBottom: '16px', color: 'var(--color-success)', opacity: 0.8 }} />
                <p>Belum ada riwayat kerusakan atau servis.<br/>Unit beroperasi dalam kondisi optimal.</p>
              </div>
            ) : (
              <div className={styles.timeline}>
                {unit.service_logs.map((log: any, idx: number) => (
                  <div key={log.id || idx} className={styles.timelineItem}>
                    <div className={styles.timelineDot}></div>
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineHeader}>
                        <span className={styles.timelineDate}>
                          {new Date(log.service_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                        <span className={`${styles.logTypeBadge} ${log.service_type === 'PREVENTIVE_MAINTENANCE' ? styles.badgePreventive : styles.badgeCorrective}`}>
                          {log.service_type === 'PREVENTIVE_MAINTENANCE' ? 'Preventive' : 'Corrective'}
                        </span>
                      </div>
                      <h4 className={styles.timelineTech}>Teknisi: {log.technician_name}</h4>
                      <p className={styles.timelineNotes}>{log.notes}</p>
                    </div>
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
              <h2>Request Service &amp; Smart Routing</h2>
              <button onClick={() => { 
                setShowServiceModal(false); 
                setRoutingResult(null); 
                setIssueMainCategory('');
                setIssueSubCategory('');
                setServiceNotes('');
              }} className={styles.closeBtn}>×</button>
            </div>
            
            {!routingResult ? (
              <form onSubmit={handleServiceRequest} className={styles.modalForm}>
                <p className={styles.modalHint}>Permintaan akan diproses menggunakan sistem Smart Routing regional kami.</p>
                
                <div className={styles.formGroup}>
                  <label>Nama Kontak Penanggung Jawab Outlet</label>
                  <input 
                    type="text" 
                    value={serviceName} 
                    onChange={(e) => setServiceName(e.target.value)} 
                    placeholder="Contoh: Pak Budi (Store Manager)" 
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>No. HP Kontak Outlet</label>
                  <input 
                    type="text" 
                    value={servicePhone} 
                    onChange={(e) => setServicePhone(e.target.value)} 
                    placeholder="Contoh: 0812XXXXXXXX" 
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Pilih Kategori Kendala Utama</label>
                  <select 
                    value={issueMainCategory}
                    onChange={(e) => {
                      setIssueMainCategory(e.target.value);
                      if (e.target.value !== 'Kendala Showcase') setIssueSubCategory('');
                    }}
                    required
                  >
                    <option value="">— Pilih Kategori —</option>
                    <option value="Kendala Mesin">Kendala Mesin (Kompresor, dsb)</option>
                    <option value="Kendala Showcase">Kendala Showcase (Fisik/Kabinet)</option>
                  </select>
                </div>

                {issueMainCategory === 'Kendala Showcase' && (
                  <div className={styles.formGroup}>
                    <label>Sub-Kategori Kendala Showcase</label>
                    <select 
                      value={issueSubCategory}
                      onChange={(e) => setIssueSubCategory(e.target.value)}
                      required
                    >
                      <option value="">— Pilih Sub-Kategori —</option>
                      <option value="Kaca">Kaca (Pecah/Berembun)</option>
                      <option value="Lampu">Lampu (Mati/Redup)</option>
                      <option value="Pendingin">Pendingin (Kurang Dingin/Bocor)</option>
                      <option value="Kelistrikan">Kelistrikan (Korslet/Tidak Menyala)</option>
                    </select>
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label>Catatan Tambahan (Remark)</label>
                  <textarea 
                    value={serviceNotes} 
                    onChange={(e) => setServiceNotes(e.target.value)} 
                    placeholder="Jelaskan detail spesifik kendala di sini..."
                    required
                  />
                </div>

                <button type="submit" className={styles.btnSubmit} disabled={routingLoading}>
                  {routingLoading ? 'Melakukan Smart Routing...' : 'Kirim Permintaan Servis'}
                </button>
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

      {/* Modal 2: Partner Log Servis (Level 3) */}
      {showLogModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h2>Record Service Log &amp; Close Ticket</h2>
              <button onClick={() => setShowLogModal(false)} className={styles.closeBtn}>×</button>
            </div>
            
            <form onSubmit={handleAddLog} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Nama Teknisi Yang Mengerjakan</label>
                <input 
                  type="text" 
                  value={techName} 
                  onChange={(e) => setTechName(e.target.value)} 
                  placeholder="Contoh: Andi Wijaya" 
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Kategori Servis</label>
                <select 
                  value={logType} 
                  onChange={(e) => setLogType(e.target.value)}
                  required
                >
                  <option value="CORRECTIVE">Corrective Repair / Perbaikan Masalah</option>
                  <option value="PREVENTIVE">Preventive Maintenance / Perawatan Rutin</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Catatan Tindakan / Masalah Selesai</label>
                <textarea 
                  value={logNotes} 
                  onChange={(e) => setLogNotes(e.target.value)} 
                  placeholder="Jelaskan tindakan (misal: penggantian door gasket, cleaning kondensor)..."
                  required
                />
              </div>

              <button type="submit" className={styles.btnSubmit} disabled={logLoading}>
                {logLoading ? 'Menyimpan...' : 'Simpan Log & Selesaikan Tiket'}
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
              <h2>Transfer Ownership (Pindahkan Aset)</h2>
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
                <select 
                  value={targetClientId} 
                  onChange={(e) => setTargetClientId(e.target.value)}
                  required
                >
                  <option value="">— Pilih Klien —</option>
                  {Array.isArray(clients) && clients.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.company_name} ({c.bp_code})</option>
                  ))}
                </select>
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

    </div>
  );
}
