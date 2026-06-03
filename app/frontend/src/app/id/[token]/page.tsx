'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { unitApi, reportApi } from '@/lib/api';
import { 
  ShieldAlert, Wrench, FileText, CheckCircle2, 
  ExternalLink, Phone, ArrowLeft, Loader2, RefreshCw, 
  Lock, Check, UserCheck, Settings, BookOpen, Clock, Image as ImageIcon,
  Sun, Moon, QrCode, HelpCircle
} from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import DatePicker from '@/components/ui/DatePicker';
import styles from './id.module.css';

// ─── Top-level reusable components (MUST be outside QrPassportPage) ───────────

// Styled input with glassmorphism look
const StyledInput = ({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: focused ? '1px solid rgba(139,178,255,0.55)' : '1px solid rgba(255,255,255,0.15)',
        borderRadius: '8px',
        padding: '10px 14px',
        color: 'inherit',
        fontSize: '0.88rem',
        width: '100%',
        outline: 'none',
        fontFamily: 'inherit',
        transition: 'border-color 0.2s',
        boxSizing: 'border-box',
      }}
    />
  );
};

// EditField — standalone, top-level (never recreated on parent re-render)
export const EditField = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
    <label style={{ fontSize: '0.8rem', color: 'var(--color-space-grey)', fontWeight: 600 }}>{label}</label>
    <StyledInput value={value} onChange={onChange} placeholder={placeholder} type={type} />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────

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

  // Edit states for Admin Revisions
  const [editBlocks, setEditBlocks] = useState({
    spesifikasi: false,
    qc: false,
    manuals: false,
    ownership: false
  });
  const [editData, setEditData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [qcUploading, setQcUploading] = useState<Record<string, boolean>>({});
  const [photoGalleryUploading, setPhotoGalleryUploading] = useState(false);

  // Unit reports — fetched once after unit loads, used to check which reports exist
  const [unitReports, setUnitReports] = useState<any[]>([]);
  const [manualsUploading, setManualsUploading] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // "Lihat Semua Spesifikasi" modal
  const [showAllSpecsModal, setShowAllSpecsModal] = useState(false);
  
  const toggleEdit = (block: keyof typeof editBlocks) => {
    if (!editBlocks[block]) {
      // Entering edit mode — initialise editData with current unit values
      setEditData((prev: any) => ({
        ...prev,
        model_name: unit?.model_name || '',
        serial_number: unit?.serial_number || '',
        specs: { ...unit?.specs },
        current_client: { ...unit?.current_client },
        diagram_image_url: unit?.diagram_image_url || '',
        warranty_expiry: unit?.warranty_expiry || '',
      }));
    } else {
      // Saving mode
      handleSave(block);
    }
    setEditBlocks(prev => ({ ...prev, [block]: !prev[block] }));
  };

  const cancelEdit = (block: keyof typeof editBlocks) => {
    setEditBlocks(prev => ({ ...prev, [block]: false }));
  };

  const handleSave = async (block: keyof typeof editBlocks) => {
    // Check whether anything changed
    const noChange =
      editData.model_name === (unit?.model_name || '') &&
      editData.serial_number === (unit?.serial_number || '') &&
      editData.warranty_expiry === (unit?.warranty_expiry || '') &&
      editData.diagram_image_url === (unit?.diagram_image_url || '') &&
      JSON.stringify(editData.specs) === JSON.stringify(unit?.specs);

    if (noChange) {
      showToast('Tidak ada perubahan', 'info');
      return;
    }

    setIsSaving(true);
    try {
      if (unit && unit.id) {
        // Build payload with only valid backend fields
        const payload: any = {};
        if (editData.model_name !== undefined) payload.model_name = editData.model_name;
        if (editData.specs !== undefined) payload.specs = editData.specs;
        if (editData.diagram_image_url !== undefined) payload.diagram_image_url = editData.diagram_image_url;
        if (editData.warranty_expiry !== undefined) payload.warranty_expiry = editData.warranty_expiry;
        // current_client is read-only via unit update; skip it to avoid 400 errors

        await unitApi.update(unit.id, payload);
        showToast('Perubahan berhasil disimpan!', 'success');
        loadUnitData();
      }
    } catch (err: any) {
      console.error('Failed to save edit', err);
      const msg = err?.response?.data?.message || err?.message || 'Gagal menyimpan perubahan. Silakan coba lagi.';
      showToast(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditChange = (fieldPath: string, value: string) => {
    setEditData((prev: any) => {
      const parts = fieldPath.split('.');
      if (parts.length === 1) {
        return { ...prev, [fieldPath]: value };
      } else if (parts.length === 2) {
        return { 
          ...prev, 
          [parts[0]]: { ...prev[parts[0]], [parts[1]]: value } 
        };
      }
      return prev;
    });
  };

  const handleQcFileUpload = async (fieldKey: string, file: File) => {
    setQcUploading(prev => ({ ...prev, [fieldKey]: true }));
    try {
      const { data } = await unitApi.uploadMedia([file]);
      // Backend returns array of { url, key, originalName }
      const uploadedUrl = data?.[0]?.url || data?.urls?.[0] || '';
      if (uploadedUrl) {
        handleEditChange(`specs.${fieldKey}`, uploadedUrl);
      } else {
        showToast('Upload berhasil tapi URL tidak ditemukan.', 'info');
      }
    } catch (err) {
      console.error('Upload failed', err);
      showToast('Gagal mengupload file. Coba lagi.', 'error');
    } finally {
      setQcUploading(prev => ({ ...prev, [fieldKey]: false }));
    }
  };

  const handlePhotoGalleryUpload = async (files: FileList) => {
    setPhotoGalleryUploading(true);
    try {
      const fileArray = Array.from(files);
      const { data } = await unitApi.uploadMedia(fileArray);
      // Backend returns array of { url, key, originalName }
      const urls: string[] = Array.isArray(data) ? data.map((d: any) => d?.url || d).filter(Boolean) : (data?.urls || []);
      const existing = editData.specs?.photo_gallery
        ? editData.specs.photo_gallery.split(',').filter(Boolean)
        : [];
      const merged = [...existing, ...urls].join(',');
      handleEditChange('specs.photo_gallery', merged);
    } catch (err) {
      showToast('Gagal mengupload foto. Coba lagi.', 'error');
    } finally {
      setPhotoGalleryUploading(false);
    }
  };

  const handleManualsUpload = async (files: FileList) => {
    setManualsUploading(true);
    try {
      const fileArray = Array.from(files);
      const { data } = await unitApi.uploadMedia(fileArray);
      // Backend returns array of { url, key, originalName }
      const urls: string[] = Array.isArray(data) ? data.map((d: any) => d?.url || d).filter(Boolean) : (data?.urls || []);
      const existing = editData.specs?.manuals_urls
        ? editData.specs.manuals_urls.split(',').filter(Boolean)
        : [];
      const merged = [...existing, ...urls].join(',');
      handleEditChange('specs.manuals_urls', merged);
    } catch (err) {
      showToast('Gagal mengupload file manuals. Coba lagi.', 'error');
    } finally {
      setManualsUploading(false);
    }
  };

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

  // Load unit reports after unit data is available
  useEffect(() => {
    if (unit?.id) {
      reportApi.findByUnit(unit.id)
        .then(({ data }) => {
          // backend may return array or paginated object
          const list = Array.isArray(data) ? data : (data?.data || []);
          setUnitReports(list);
        })
        .catch(() => setUnitReports([]));
    }
  }, [unit?.id]);

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
      showToast('Gagal mengirim permintaan servis.', 'error');
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
        showToast('Log servis berhasil ditambahkan! Tiket berhasil diselesaikan.', 'success');
        setShowLogModal(false);
        setTechName('');
        setLogNotes('');
        setLogComponents('');
        setLogStatus('COMPLETED');
        loadUnitData();
      } else {
        showToast('Gagal menyimpan log servis.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal menghubungi server.', 'error');
    } finally {
      setLogLoading(false);
    }
  };

  // Admin Transfer submit handler
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetClientId) { showToast('Pilih klien tujuan terlebih dahulu!', 'info'); return; }
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
        showToast('Kepemilikan unit berhasil dipindahkan!', 'success');
        setShowTransferModal(false);
        setTransferReason('');
        loadUnitData();
      } else {
        showToast('Gagal melakukan transfer kepemilikan.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal menghubungi server.', 'error');
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
      {/* ── Toast Notification ── */}
      {toast && (
        <div
          role="alert"
          aria-live="polite"
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            padding: '12px 20px',
            borderRadius: '10px',
            fontSize: '0.88rem',
            fontWeight: 600,
            maxWidth: '340px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#fff',
            background:
              toast.type === 'success'
                ? 'linear-gradient(135deg, #059669, #047857)'
                : toast.type === 'error'
                ? 'linear-gradient(135deg, #dc2626, #b91c1c)'
                : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            animation: 'slideIn 0.25s ease',
          }}
        >
          <span style={{ fontSize: '1.1rem' }}>
            {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}
          </span>
          {toast.message}
          <button
            onClick={() => setToast(null)}
            aria-label="Tutup notifikasi"
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.8)',
              cursor: 'pointer',
              fontSize: '1rem',
              lineHeight: 1,
              padding: 0,
            }}
          >
            ×
          </button>
        </div>
      )}
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
            {/* Action buttons — right-aligned, below level badge */}
            <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end', marginTop: '4px' }}>
              {isAdmin && (
                <button
                  onClick={() => {
                    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(window.location.origin + '/id/' + token)}`;
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>Print QR Code - ${unit.serial_number}</title>
                            <style>
                              @page { margin: 0; size: auto; }
                              html, body { margin: 0; padding: 0; width: 100%; height: 100vh; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: sans-serif; }
                            </style>
                          </head>
                          <body>
                            <h2 style="margin-bottom:20px; font-size:2rem;">${unit.serial_number}</h2>
                            <img src="${qrApiUrl}" alt="QR Code" style="width:400px;height:400px;" onload="window.print();window.close();" />
                            <p style="margin-top:20px;color:#666; font-size:1.2rem;">${unit.model_name}</p>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                    }
                  }}
                  aria-label="Print QR"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '20px', padding: '4px 10px', cursor: 'pointer',
                    color: '#3b82f6', fontSize: '0.7rem', fontWeight: 700,
                    fontFamily: 'var(--font-heading)'
                  }}
                >
                  <QrCode size={12} /> QR
                </button>
              )}
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
                }}
              >
                {isDark ? <Sun size={12} /> : <Moon size={12} />}
                {isDark ? 'Light' : 'Dark'}
              </button>
            </div>
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
              {isAdmin && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  {editBlocks.spesifikasi && (
                    <button
                      className={styles.btnRevise}
                      onClick={() => cancelEdit('spesifikasi')}
                      style={{ background: '#64748b' }}
                    >
                      Cancel
                    </button>
                  )}
                  <button 
                    className={styles.btnRevise} 
                    onClick={() => toggleEdit('spesifikasi')}
                    style={editBlocks.spesifikasi ? { background: '#10b981' } : {}}
                  >
                    {editBlocks.spesifikasi ? (isSaving ? 'Saving…' : 'Save') : 'Revise'}
                  </button>
                </div>
              )}
            </div>
            <div className={styles.cardContent}>
              {editBlocks.spesifikasi ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <EditField label="Model" value={editData.model_name || ''} onChange={(v) => handleEditChange('model_name', v)} />
                  <EditField label="Serial Number" value={editData.serial_number || ''} onChange={(v) => handleEditChange('serial_number', v)} />

                  {/* Tipe / Type dropdown */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-space-grey)', fontWeight: 600 }}>Tipe / Type</label>
                    <CustomSelect
                      value={editData.specs?.type || ''}
                      onChange={(v) => handleEditChange('specs.type', v)}
                      options={[
                        { value: '', label: '— Pilih Tipe Unit —' },
                        { value: 'SHOWCASE', label: 'Showcase' },
                        { value: 'MESIN', label: 'Mesin' },
                      ]}
                      placeholder="— Pilih Tipe Unit —"
                    />
                  </div>

                  {/* Dynamic fields based on type */}
                  {(editData.specs?.type === 'MESIN') ? (
                    <>
                      <EditField label="Dimensi / Dimension" value={editData.specs?.dimension || ''} onChange={(v) => handleEditChange('specs.dimension', v)} placeholder="Contoh: 60x70x185 cm" />
                      <EditField label="Daya / Power (Watt)" value={editData.specs?.power || editData.specs?.wattage || ''} onChange={(v) => { handleEditChange('specs.power', v); handleEditChange('specs.wattage', v); }} placeholder="Contoh: 450W" />
                      <EditField label="Kapasitas / Capacity" value={editData.specs?.capacity || ''} onChange={(v) => handleEditChange('specs.capacity', v)} placeholder="Contoh: 500L" />
                      <EditField label="Kompresor / Compressor" value={editData.specs?.compressor || ''} onChange={(v) => handleEditChange('specs.compressor', v)} placeholder="Contoh: 1 HP" />
                      <EditField label="Refrigerant" value={editData.specs?.refrigerant || ''} onChange={(v) => handleEditChange('specs.refrigerant', v)} placeholder="Contoh: R290" />
                    </>
                  ) : (
                    <>
                      <EditField label="Kompresor / Compressor" value={editData.specs?.compressor || ''} onChange={(v) => handleEditChange('specs.compressor', v)} placeholder="Contoh: 1 HP" />
                      <EditField label="Refrigerant" value={editData.specs?.refrigerant || ''} onChange={(v) => handleEditChange('specs.refrigerant', v)} placeholder="Contoh: R290" />
                      <EditField label="Daya / Wattage" value={editData.specs?.wattage || editData.specs?.power || ''} onChange={(v) => { handleEditChange('specs.wattage', v); handleEditChange('specs.power', v); }} placeholder="Contoh: 450W" />
                      <EditField label="Dimensi / Dimension" value={editData.specs?.dimension || ''} onChange={(v) => handleEditChange('specs.dimension', v)} placeholder="Contoh: 60x70x185 cm" />
                      <EditField label="Kapasitas / Capacity" value={editData.specs?.capacity || ''} onChange={(v) => handleEditChange('specs.capacity', v)} placeholder="Contoh: 500L" />
                    </>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                    <DatePicker
                      label="Garansi Berakhir (Warranty Expiry)"
                      value={editData.warranty_expiry ? editData.warranty_expiry.slice(0, 10) : ''}
                      onChange={(v) => handleEditChange('warranty_expiry', v)}
                      theme="dark"
                    />
                  </div>
                </div>
              ) : (
                <>
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
                </>
              )}
              
              {!editBlocks.spesifikasi && (
                <button className={styles.btnViewAll} onClick={() => setShowAllSpecsModal(true)}>
                  Lihat Semua Spesifikasi <span>›</span>
                </button>
              )}
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

          {/* Slide 4: QC Reports */}
          <section className={`${styles.card} ${styles.carouselSlide}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <FileText size={16} color="#8bb2ff" />
                <h2>QC Reports</h2>
              </div>
              {isAdmin && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  {editBlocks.qc && (
                    <button className={styles.btnRevise} onClick={() => cancelEdit('qc')} style={{ background: '#64748b' }}>Cancel</button>
                  )}
                  <button 
                    className={styles.btnRevise} 
                    onClick={() => toggleEdit('qc')}
                    style={editBlocks.qc ? { background: '#10b981' } : {}}
                  >
                    {editBlocks.qc ? (isSaving ? 'Saving…' : 'Save') : 'Revise'}
                  </button>
                </div>
              )}
            </div>
            <div className={styles.mediaSingleItem} style={{ padding: '16px' }}>
              {editBlocks.qc ? (
                /* ── EDIT MODE ── */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  {/* Section A: File uploads */}
                  <div>
                    <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#8f9bb3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                      Dokumen Laporan
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '12px', lineHeight: 1.5 }}>
                      Laporan Test Run, Sistem Pendingin, dan Inspeksi dibuat melalui modul laporan. ITR adalah attachment email dari Jakarta yang di-upload oleh tim Bandung.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {/* Test Run Results — file upload (attachment), sama seperti ITR */}
                      <div>
                        <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-space-grey)', marginBottom: '4px' }}>
                          Test Run Results
                        </p>
                        {editData.specs?.test_run_url ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#10b981' }}>
                            <CheckCircle2 size={14} /> File terupload
                            <button
                              type="button"
                              onClick={() => window.open(editData.specs.test_run_url, '_blank')}
                              style={{ background: 'none', border: 'none', color: '#8bb2ff', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline' }}
                            >
                              Lihat
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditChange('specs.test_run_url', '')}
                              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem' }}
                            >
                              Hapus
                            </button>
                          </div>
                        ) : (
                          <label style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '8px',
                            padding: '10px 14px', cursor: qcUploading['test_run_url'] ? 'not-allowed' : 'pointer',
                            color: '#8f9bb3', fontSize: '0.82rem',
                            background: 'rgba(255,255,255,0.02)',
                            opacity: qcUploading['test_run_url'] ? 0.6 : 1,
                          }}>
                            <ImageIcon size={16} />
                            {qcUploading['test_run_url'] ? 'Mengupload...' : 'Klik untuk upload file (PDF/JPG/PNG)'}
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              style={{ display: 'none' }}
                              disabled={qcUploading['test_run_url']}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleQcFileUpload('test_run_url', file);
                              }}
                            />
                          </label>
                        )}
                      </div>

                      {/* Cooling System Report — link ke halaman pilih tipe cooling */}
                      <div>
                        <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-space-grey)', marginBottom: '4px' }}>
                          Laporan Sistem Pendingin
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {[
                            { label: 'Cooling System Report 1 Suhu', path: '/reports/cooling', type: 'COOLING_1' },
                            { label: 'Cooling System Report 2 Suhu', path: '/reports/cooling2', type: 'COOLING_2' },
                            { label: 'Cooling System Report 3 Suhu', path: '/reports/cooling3', type: 'COOLING_3' },
                            { label: 'Cooling System Report Warm', path: '/reports/reportwarm', type: 'COOLING_WARM' },
                          ].map(({ label, path, type }) => {
                            const count = unitReports.filter((r: any) => r.form_type === type).length;
                            return (
                              <button
                                key={path}
                                type="button"
                                onClick={() => {
                                  if (count === 1) {
                                    const report = unitReports.find((r: any) => r.form_type === type);
                                    if (report) router.push(`/reports/view/${report.id}`);
                                  } else if (count > 1) {
                                    router.push(`/reports/history?unit=${unit?.id || ''}&type=${type}`);
                                  } else {
                                    router.push(`${path}?unit=${unit?.id || ''}`);
                                  }
                                }}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '8px',
                                  background: 'rgba(46,91,255,0.1)', border: '1px solid rgba(46,91,255,0.3)',
                                  borderRadius: '8px', padding: '10px 14px', cursor: 'pointer',
                                  color: '#8bb2ff', fontSize: '0.82rem', fontFamily: 'inherit', width: '100%',
                                }}
                              >
                                <FileText size={15} />
                                {label}
                                {count > 0 && (
                                  <span style={{ marginLeft: '4px', background: 'rgba(16,185,129,0.2)', color: '#10b981', borderRadius: '10px', padding: '1px 6px', fontSize: '0.7rem', fontWeight: 700 }}>
                                    {count}
                                  </span>
                                )}
                                <ExternalLink size={13} style={{ marginLeft: 'auto', flexShrink: 0 }} />
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Inspection Report — link ke inspection */}
                      <div>
                        <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-space-grey)', marginBottom: '4px' }}>
                          Laporan Inspeksi
                        </p>
                        {(() => {
                          const count = unitReports.filter((r: any) => r.form_type === 'INSPECTION').length;
                          return (
                            <button
                              type="button"
                              onClick={() => {
                                if (count === 1) {
                                  const report = unitReports.find((r: any) => r.form_type === 'INSPECTION');
                                  if (report) router.push(`/reports/view/${report.id}`);
                                } else if (count > 1) {
                                  router.push(`/reports/history?unit=${unit?.id || ''}&type=INSPECTION`);
                                } else {
                                  router.push(`/reports/inspection?unit=${unit?.id || ''}`);
                                }
                              }}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                background: 'rgba(46,91,255,0.1)', border: '1px solid rgba(46,91,255,0.3)',
                                borderRadius: '8px', padding: '10px 14px', cursor: 'pointer',
                                color: '#8bb2ff', fontSize: '0.82rem', fontFamily: 'inherit', width: '100%',
                              }}
                            >
                              <FileText size={15} />
                              {count > 0 ? `Lihat ${count} Inspection Report` : 'Buat Inspection Report (QC)'}
                              {count > 0 && (
                                <span style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981', borderRadius: '10px', padding: '1px 6px', fontSize: '0.7rem', fontWeight: 700 }}>
                                  {count}
                                </span>
                              )}
                              <ExternalLink size={13} style={{ marginLeft: 'auto', flexShrink: 0 }} />
                            </button>
                          );
                        })()}
                      </div>

                      {/* ITR — tetap upload file */}
                      {[{ label: 'ITR — Inventory Transfer Request', key: 'itr_url' }].map(({ label, key }) => (
                        <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ fontSize: '0.8rem', color: 'var(--color-space-grey)', fontWeight: 600 }}>{label}</label>
                          {editData.specs?.[key] ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#10b981' }}>
                              <CheckCircle2 size={14} /> File terupload
                              <button
                                type="button"
                                onClick={() => handleEditChange(`specs.${key}`, '')}
                                style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem' }}
                              >
                                Hapus
                              </button>
                            </div>
                          ) : (
                            <label style={{
                              display: 'flex', alignItems: 'center', gap: '8px',
                              border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '8px',
                              padding: '10px 14px', cursor: 'pointer',
                              color: '#8f9bb3', fontSize: '0.82rem',
                              background: 'rgba(255,255,255,0.02)',
                              opacity: qcUploading[key] ? 0.6 : 1,
                            }}>
                              <ImageIcon size={16} />
                              {qcUploading[key] ? 'Mengupload...' : 'Klik untuk upload file (PDF/JPG/PNG)'}
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                style={{ display: 'none' }}
                                disabled={qcUploading[key]}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleQcFileUpload(key, file);
                                }}
                              />
                            </label>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Divider */}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />

                  {/* Section B: Glass Dimension */}
                  <div>
                    <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#8f9bb3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                      Dimensi Kaca
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <EditField label="Lebar (cm)" value={editData.specs?.glass_width || ''} onChange={(v) => handleEditChange('specs.glass_width', v)} placeholder="contoh: 120" />
                      <EditField label="Tinggi (cm)" value={editData.specs?.glass_height || ''} onChange={(v) => handleEditChange('specs.glass_height', v)} placeholder="contoh: 200" />
                      <EditField label="Ketebalan (mm)" value={editData.specs?.glass_thickness || ''} onChange={(v) => handleEditChange('specs.glass_thickness', v)} placeholder="contoh: 6" />
                    </div>
                  </div>

                  {/* Divider */}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />

                  {/* Section C: Production PIC */}
                  <div>
                    <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#8f9bb3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                      PIC Produksi
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <EditField label="Nama PIC" value={editData.specs?.pic_name || ''} onChange={(v) => handleEditChange('specs.pic_name', v)} placeholder="contoh: Budi Santoso" />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <DatePicker
                          label="Tanggal"
                          value={editData.specs?.pic_date || ''}
                          onChange={(v) => handleEditChange('specs.pic_date', v)}
                          theme="dark"
                        />
                      </div>
                      <EditField label="Catatan" value={editData.specs?.pic_notes || ''} onChange={(v) => handleEditChange('specs.pic_notes', v)} placeholder="catatan tambahan..." />
                    </div>
                  </div>

                  {/* Divider */}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />

                  {/* Section D: Photo Gallery */}
                  <div>
                    <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#8f9bb3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                      Galeri Foto
                    </p>
                    {/* Existing thumbnails */}
                    {editData.specs?.photo_gallery && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '10px' }}>
                        {editData.specs.photo_gallery.split(',').filter(Boolean).map((url: string, idx: number) => (
                          <div key={idx} style={{ position: 'relative' }}>
                            <img
                              src={url}
                              alt={`Foto ${idx + 1}`}
                              style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '6px', display: 'block' }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const current = editData.specs.photo_gallery.split(',').filter(Boolean);
                                current.splice(idx, 1);
                                handleEditChange('specs.photo_gallery', current.join(','));
                              }}
                              style={{
                                position: 'absolute', top: '3px', right: '3px',
                                background: 'rgba(239,68,68,0.85)', border: 'none',
                                borderRadius: '50%', width: '18px', height: '18px',
                                cursor: 'pointer', color: '#fff', fontSize: '10px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
                              }}
                              aria-label="Hapus foto"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Upload trigger */}
                    <label style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '8px',
                      padding: '10px 14px', cursor: 'pointer',
                      color: '#8f9bb3', fontSize: '0.82rem',
                      background: 'rgba(255,255,255,0.02)',
                      opacity: photoGalleryUploading ? 0.6 : 1,
                    }}>
                      <ImageIcon size={16} />
                      {photoGalleryUploading ? 'Mengupload...' : 'Klik untuk upload foto (bisa pilih banyak)'}
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp"
                        multiple
                        style={{ display: 'none' }}
                        disabled={photoGalleryUploading}
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            handlePhotoGalleryUpload(e.target.files);
                          }
                        }}
                      />
                    </label>
                  </div>

                </div>
              ) : (
                /* ── VIEW MODE ── */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>

                  {/* File-based items */}
                  {(() => {
                    // Cooling: count all 4 subtypes combined
                    const coolingTypes = ['COOLING_1', 'COOLING_2', 'COOLING_3', 'COOLING_WARM'];
                    const coolingLabels: Record<string, string> = {
                      COOLING_1: '1 Suhu', COOLING_2: '2 Suhu (Cake & RTD)',
                      COOLING_3: '3 Suhu (Cake, Ambient & RTD)', COOLING_WARM: 'Warm',
                    };
                    const coolingCountByType = coolingTypes.reduce((acc, t) => {
                      acc[t] = unitReports.filter((r: any) => r.form_type === t).length;
                      return acc;
                    }, {} as Record<string, number>);
                    const coolingTotal = Object.values(coolingCountByType).reduce((a, b) => a + b, 0);
                    const coolingTooltip = coolingTotal > 0
                      ? coolingTypes.filter(t => coolingCountByType[t] > 0)
                          .map(t => `${coolingLabels[t]}: ${coolingCountByType[t]} laporan`)
                          .join('\n')
                      : 'Laporan belum dibuat';

                    const items = [
                      { label: 'Test Run Results', urlKey: 'test_run_url', desc: null, routePath: null, formType: null },
                      { label: 'Cooling System Report', urlKey: 'cooling_report_url', desc: coolingTooltip, routePath: '/reports/cooling', formType: '__COOLING__' },
                      { label: 'Inspection Report', urlKey: 'inspection_url', desc: null, routePath: '/reports/inspection', formType: 'INSPECTION' },
                      { label: 'ITR', urlKey: 'itr_url', desc: 'Inventory Transfer Request — surat pesanan produksi dari Jakarta. Di-upload oleh tim Bandung setelah menerima attachment email.', routePath: null, formType: null },
                    ];

                    return items.map(({ label, urlKey, desc, routePath, formType }) => {
                      const url = unit?.specs?.[urlKey];
                      const isReportLink = routePath !== null;
                      const isCooling = formType === '__COOLING__';
                      const isClickable = isReportLink ? true : !!url;
                      const unitParam = unit?.id ? `?unit=${unit.id}` : '';

                      // Determine report count for badge
                      const reportCount = isCooling
                        ? coolingTotal
                        : (formType ? unitReports.filter((r: any) => r.form_type === formType).length : 0);

                      // Tooltip text for report-linked items
                      const reportTooltip = isReportLink
                        ? (isCooling ? coolingTooltip
                          : reportCount > 0
                            ? `${reportCount} laporan tersedia — klik untuk lihat`
                            : 'Laporan belum dibuat — klik untuk buat baru')
                        : null;

                      return (
                        <div key={urlKey} style={{ position: 'relative' }}
                          title={reportTooltip || undefined}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              if (isReportLink) {
                                if (isCooling) {
                                  // For cooling: find first type that has reports, or open form
                                  const firstType = coolingTypes.find(t => coolingCountByType[t] === 1);
                                  const multiType = coolingTypes.find(t => coolingCountByType[t] > 1);
                                  if (coolingTotal === 1 && firstType) {
                                    const report = unitReports.find((r: any) => coolingTypes.includes(r.form_type));
                                    if (report) router.push(`/reports/view/${report.id}`);
                                  } else if (coolingTotal > 1) {
                                    router.push(`/reports/history?unit=${unit?.id || ''}&type=COOLING_1`);
                                  } else {
                                    router.push(`/reports/cooling${unitParam}`);
                                  }
                                } else {
                                  if (reportCount === 1) {
                                    const report = unitReports.find((r: any) => r.form_type === formType);
                                    if (report) router.push(`/reports/view/${report.id}`);
                                  } else if (reportCount > 1) {
                                    router.push(`/reports/history?unit=${unit?.id || ''}&type=${formType}`);
                                  } else {
                                    router.push(`${routePath}${unitParam}`);
                                  }
                                }
                              } else if (url) {
                                window.open(typeof url === 'string' ? url : String(url), '_blank');
                              }
                            }}
                            disabled={!isClickable}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '12px',
                              padding: '12px 16px',
                              background: isClickable
                                ? 'linear-gradient(135deg, #2E5BFF 0%, #1a3fd4 100%)'
                                : 'rgba(255,255,255,0.05)',
                              borderRadius: '10px',
                              cursor: isClickable ? 'pointer' : 'not-allowed',
                              border: isClickable ? 'none' : '1px solid rgba(255,255,255,0.08)',
                              width: '100%',
                              textAlign: 'left',
                              color: isClickable ? '#ffffff' : '#64748b',
                              fontFamily: 'inherit',
                              fontWeight: isClickable ? 700 : 500,
                              fontSize: '0.88rem',
                              transition: 'opacity 0.15s, transform 0.15s',
                              opacity: isClickable ? 1 : 0.6,
                              position: 'relative',
                              boxShadow: isClickable ? '0 4px 12px rgba(46,91,255,0.3)' : 'none',
                            }}
                            onMouseEnter={e => { if (isClickable) { (e.currentTarget as HTMLButtonElement).style.opacity = '0.88'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; } }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
                          >
                            <FileText size={16} color={isClickable ? '#ffffff' : '#64748b'} style={{ flexShrink: 0 }} />
                            <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1px' }}>
                              <span>{label}</span>
                              {/* Subtitle */}
                              {isReportLink && (
                                <span style={{ fontSize: '0.68rem', fontWeight: 400, opacity: 0.8 }}>
                                  {reportCount > 0
                                    ? `${reportCount} laporan tersedia`
                                    : 'Belum ada laporan — klik untuk buat baru'}
                                </span>
                              )}
                              {/* File type hint for attachment items */}
                              {!isReportLink && url && (() => {
                                const urlStr = typeof url === 'string' ? url : String(url);
                                const isPdf = /\.pdf(\?|$)/i.test(urlStr) || urlStr.toLowerCase().includes('pdf');
                                return (
                                  <span style={{ fontSize: '0.68rem', fontWeight: 400, opacity: 0.75 }}>
                                    {isPdf ? 'PDF — klik untuk buka' : 'File gambar — klik untuk buka'}
                                  </span>
                                );
                              })()}
                              {!isReportLink && !url && (
                                <span style={{ fontSize: '0.68rem', fontWeight: 400, opacity: 0.7 }}>
                                  File belum diupload
                                </span>
                              )}
                            </span>

                            {/* Cooling tooltip icon */}
                            {isCooling && (
                              <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}
                                onMouseEnter={e => {
                                  e.stopPropagation();
                                  const tip = (e.currentTarget as HTMLElement).querySelector('.cooling-tip') as HTMLElement;
                                  if (tip) tip.style.display = 'block';
                                }}
                                onMouseLeave={e => {
                                  const tip = (e.currentTarget as HTMLElement).querySelector('.cooling-tip') as HTMLElement;
                                  if (tip) tip.style.display = 'none';
                                }}
                              >
                                <HelpCircle size={14} color="rgba(255,255,255,0.7)" style={{ cursor: 'help' }} />
                                <span className="cooling-tip" style={{
                                  display: 'none', position: 'absolute',
                                  bottom: 'calc(100% + 8px)', right: 0, width: '220px',
                                  background: '#1e293b', color: '#e2e8f0', fontSize: '0.72rem',
                                  lineHeight: 1.6, padding: '8px 10px', borderRadius: '8px',
                                  boxShadow: '0 4px 16px rgba(0,0,0,0.4)', zIndex: 9999,
                                  pointerEvents: 'none', textAlign: 'left', fontWeight: 400,
                                  border: '1px solid rgba(255,255,255,0.1)', whiteSpace: 'pre-line',
                                }}>
                                  {coolingTotal > 0
                                    ? `Laporan tersedia:\n${coolingTypes.filter(t => coolingCountByType[t] > 0).map(t => `• ${coolingLabels[t]}: ${coolingCountByType[t]}`).join('\n')}`
                                    : 'Belum ada laporan cooling.\nKlik untuk membuat baru.'}
                                </span>
                              </span>
                            )}

                            {/* ITR help tooltip */}
                            {urlKey === 'itr_url' && (
                              <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}
                                onMouseEnter={e => {
                                  e.stopPropagation();
                                  const tip = (e.currentTarget as HTMLElement).querySelector('.itr-tip') as HTMLElement;
                                  if (tip) tip.style.display = 'block';
                                }}
                                onMouseLeave={e => {
                                  const tip = (e.currentTarget as HTMLElement).querySelector('.itr-tip') as HTMLElement;
                                  if (tip) tip.style.display = 'none';
                                }}
                              >
                                <HelpCircle size={14} color={isClickable ? 'rgba(255,255,255,0.7)' : '#64748b'} style={{ cursor: 'help' }} />
                                <span className="itr-tip" style={{
                                  display: 'none', position: 'absolute',
                                  bottom: 'calc(100% + 8px)', right: 0, width: '240px',
                                  background: '#1e293b', color: '#e2e8f0', fontSize: '0.72rem',
                                  lineHeight: 1.5, padding: '8px 10px', borderRadius: '8px',
                                  boxShadow: '0 4px 16px rgba(0,0,0,0.4)', zIndex: 9999,
                                  pointerEvents: 'none', textAlign: 'left', fontWeight: 400,
                                  border: '1px solid rgba(255,255,255,0.1)',
                                }}>
                                  {desc}
                                </span>
                              </span>
                            )}

                            {/* Badge count for report links */}
                            {isReportLink && reportCount > 0 && (
                              <span style={{
                                background: 'rgba(16,185,129,0.2)', color: '#10b981',
                                borderRadius: '10px', padding: '1px 7px',
                                fontSize: '0.7rem', fontWeight: 700, flexShrink: 0,
                              }}>
                                {reportCount}
                              </span>
                            )}
                            {isReportLink && <ExternalLink size={15} color="rgba(255,255,255,0.8)" style={{ flexShrink: 0 }} />}
                            {!isReportLink && url && <ExternalLink size={15} color="rgba(255,255,255,0.8)" style={{ flexShrink: 0 }} />}
                          </button>
                        </div>
                      );
                    });
                  })()}

                  {/* Divider */}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', margin: '4px 0' }} />

                  {/* Glass Dimension */}
                  {(() => {
                    const gw = unit?.specs?.glass_width;
                    const gh = unit?.specs?.glass_height;
                    const gt = unit?.specs?.glass_thickness;
                    const hasData = gw || gh || gt;
                    return (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: hasData ? '8px 8px 0 0' : '8px' }}>
                          <FileText size={15} color="#8bb2ff" style={{ flexShrink: 0 }} />
                          <span style={{ flex: 1, fontSize: '0.85rem' }}>Glass Dimension</span>
                          {hasData ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(16,185,129,0.12)', color: '#10b981', borderRadius: '20px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: 700 }}>
                              <Check size={11} /> Ada
                            </span>
                          ) : (
                            <span style={{ background: 'rgba(255,255,255,0.06)', color: '#64748b', borderRadius: '20px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: 600 }}>
                              Belum ada data
                            </span>
                          )}
                        </div>
                        {hasData && (
                          <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '0 0 8px 8px', padding: '8px 12px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                            {gw && <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Lebar: <strong style={{ color: '#e2e8f0' }}>{gw} cm</strong></span>}
                            {gh && <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Tinggi: <strong style={{ color: '#e2e8f0' }}>{gh} cm</strong></span>}
                            {gt && <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Tebal: <strong style={{ color: '#e2e8f0' }}>{gt} mm</strong></span>}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Production PIC */}
                  {(() => {
                    const pn = unit?.specs?.pic_name;
                    const pd = unit?.specs?.pic_date;
                    const pnt = unit?.specs?.pic_notes;
                    const hasData = pn || pd || pnt;
                    return (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: hasData ? '8px 8px 0 0' : '8px' }}>
                          <FileText size={15} color="#8bb2ff" style={{ flexShrink: 0 }} />
                          <span style={{ flex: 1, fontSize: '0.85rem' }}>Production PIC</span>
                          {hasData ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(16,185,129,0.12)', color: '#10b981', borderRadius: '20px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: 700 }}>
                              <Check size={11} /> Ada
                            </span>
                          ) : (
                            <span style={{ background: 'rgba(255,255,255,0.06)', color: '#64748b', borderRadius: '20px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: 600 }}>
                              Belum ada data
                            </span>
                          )}
                        </div>
                        {hasData && (
                          <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '0 0 8px 8px', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {pn && <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Nama: <strong style={{ color: '#e2e8f0' }}>{pn}</strong></span>}
                            {pd && <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Tanggal: <strong style={{ color: '#e2e8f0' }}>{new Date(pd + 'T00:00:00').toLocaleDateString('id-ID', { dateStyle: 'long' })}</strong></span>}
                            {pnt && <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Catatan: <strong style={{ color: '#e2e8f0' }}>{pnt}</strong></span>}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Divider */}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', margin: '4px 0' }} />

                  {/* Photo Gallery */}
                  {(() => {
                    const photos = unit?.specs?.photo_gallery
                      ? String(unit.specs.photo_gallery).split(',').filter(Boolean)
                      : [];
                    return (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: photos.length > 0 ? '8px 8px 0 0' : '8px' }}>
                          <ImageIcon size={15} color="#8bb2ff" style={{ flexShrink: 0 }} />
                          <span style={{ flex: 1, fontSize: '0.85rem' }}>Photo Gallery</span>
                          {photos.length > 0 ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(16,185,129,0.12)', color: '#10b981', borderRadius: '20px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: 700 }}>
                              <Check size={11} /> {photos.length} foto
                            </span>
                          ) : (
                            <span style={{ background: 'rgba(255,255,255,0.06)', color: '#64748b', borderRadius: '20px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: 600 }}>
                              Belum ada foto
                            </span>
                          )}
                        </div>
                        {photos.length > 0 && (
                          <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '0 0 8px 8px', padding: '8px 10px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                              {photos.map((url: string, idx: number) => (
                                <img
                                  key={idx}
                                  src={url}
                                  alt={`Foto unit ${idx + 1}`}
                                  onClick={() => window.open(url, '_blank')}
                                  style={{
                                    width: '100%', aspectRatio: '1', objectFit: 'cover',
                                    borderRadius: '6px', cursor: 'pointer', display: 'block',
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                </div>
              )}
            </div>
          </section>

          {/* Slide 5: Manuals */}
          <section className={`${styles.card} ${styles.carouselSlide}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <BookOpen size={16} color="#8bb2ff" />
                <h2>Manuals</h2>
              </div>
              {isAdmin && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  {editBlocks.manuals && (
                    <button className={styles.btnRevise} onClick={() => cancelEdit('manuals')} style={{ background: '#64748b' }}>Cancel</button>
                  )}
                  <button 
                    className={styles.btnRevise} 
                    onClick={() => toggleEdit('manuals')}
                    style={editBlocks.manuals ? { background: '#10b981' } : {}}
                  >
                    {editBlocks.manuals ? (isSaving ? 'Saving…' : 'Save') : 'Revise'}
                  </button>
                </div>
              )}
            </div>
            <div className={styles.mediaSingleItem} style={{ padding: '16px' }}>
              {editBlocks.manuals ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.5 }}>
                    Upload diagram sirkulasi udara, satu atau beberapa file (JPG, PNG, atau PDF).
                  </p>

                  {/* Existing manuals thumbnails */}
                  {(() => {
                    const urls = editData.specs?.manuals_urls
                      ? editData.specs.manuals_urls.split(',').filter(Boolean)
                      : [];
                    return urls.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {urls.map((url: string, idx: number) => {
                          const isPdf = url.toLowerCase().includes('.pdf') || url.toLowerCase().includes('pdf');
                          return (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                              <FileText size={14} color="#8bb2ff" style={{ flexShrink: 0 }} />
                              <span style={{ flex: 1, fontSize: '0.78rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {isPdf ? `Diagram PDF ${idx + 1}` : `Diagram Gambar ${idx + 1}`}
                              </span>
                              <button
                                type="button"
                                onClick={() => window.open(url, '_blank')}
                                style={{ background: 'none', border: 'none', color: '#8bb2ff', cursor: 'pointer', fontSize: '0.72rem', textDecoration: 'underline', flexShrink: 0 }}
                              >
                                Lihat
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const current = (editData.specs?.manuals_urls || '').split(',').filter(Boolean);
                                  current.splice(idx, 1);
                                  handleEditChange('specs.manuals_urls', current.join(','));
                                }}
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.72rem', flexShrink: 0 }}
                              >
                                Hapus
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : null;
                  })()}

                  {/* Upload trigger */}
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '8px',
                    padding: '10px 14px', cursor: manualsUploading ? 'not-allowed' : 'pointer',
                    color: '#8f9bb3', fontSize: '0.82rem',
                    background: 'rgba(255,255,255,0.02)',
                    opacity: manualsUploading ? 0.6 : 1,
                  }}>
                    <ImageIcon size={16} />
                    {manualsUploading ? 'Mengupload...' : 'Klik untuk upload diagram (bisa pilih banyak, JPG/PNG/PDF)'}
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      multiple
                      style={{ display: 'none' }}
                      disabled={manualsUploading}
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleManualsUpload(e.target.files);
                        }
                      }}
                    />
                  </label>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(() => {
                    const urls = unit?.specs?.manuals_urls
                      ? String(unit.specs.manuals_urls).split(',').filter(Boolean)
                      : [];

                    if (urls.length === 0) {
                      return (
                        <div style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          padding: '32px 16px', gap: '10px',
                          background: 'rgba(255,255,255,0.02)', borderRadius: '10px',
                          border: '1px dashed rgba(255,255,255,0.1)',
                        }}>
                          <BookOpen size={28} color="#3d4f6e" />
                          <p style={{ color: '#64748b', fontSize: '0.82rem', textAlign: 'center' }}>Belum ada diagram yang diupload</p>
                          {isAdmin && (
                            <p style={{ color: '#475569', fontSize: '0.72rem', textAlign: 'center' }}>Klik "Revise" untuk mengupload diagram</p>
                          )}
                        </div>
                      );
                    }

                    return urls.map((url: string, idx: number) => {
                      const isPdf = url.toLowerCase().includes('.pdf') || url.toLowerCase().includes('pdf');
                      const isImage = /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url);
                      return (
                        <div key={idx}>
                          {isImage ? (
                            <div
                              onClick={() => window.open(url, '_blank')}
                              style={{ cursor: 'pointer', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}
                            >
                              <img
                                src={url}
                                alt={`Diagram ${idx + 1}`}
                                style={{ width: '100%', display: 'block', objectFit: 'contain', maxHeight: '280px', background: '#0a0e1a' }}
                              />
                              <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <ImageIcon size={12} /> Diagram {idx + 1} — klik untuk buka penuh
                              </div>
                            </div>
                          ) : (
                            <button
                              className={styles.btnPrimary}
                              style={{ justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', color: 'var(--color-primary-text)' }}
                              onClick={() => window.open(url, '_blank')}
                            >
                              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FileText size={16} />
                                {isPdf ? `Diagram PDF ${idx + 1}` : `File Diagram ${idx + 1}`}
                              </span>
                              <ExternalLink size={16} color="#8f9bb3" />
                            </button>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          </section>

          {/* Slide 6: Ownership */}
          <section className={`${styles.card} ${styles.carouselSlide}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <UserCheck size={16} color="#8bb2ff" />
                <h2>Ownership</h2>
              </div>
              {isAdmin && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  {editBlocks.ownership && (
                    <button className={styles.btnRevise} onClick={() => cancelEdit('ownership')} style={{ background: '#64748b' }}>Cancel</button>
                  )}
                  <button 
                    className={styles.btnRevise} 
                    onClick={() => toggleEdit('ownership')}
                    style={editBlocks.ownership ? { background: '#10b981' } : {}}
                  >
                    {editBlocks.ownership ? (isSaving ? 'Saving…' : 'Save') : 'Revise'}
                  </button>
                </div>
              )}
            </div>
            <div className={styles.cardContent}>
              {editBlocks.ownership ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingBottom: '16px' }}>
                  <EditField label="Customer Name" value={editData.current_client?.company_name || ''} onChange={(v) => handleEditChange('current_client.company_name', v)} />
                  <EditField label="SO Number" value={editData.specs?.so_number || ''} onChange={(v) => handleEditChange('specs.so_number', v)} />
                  <EditField label="DO Number" value={editData.specs?.do_number || ''} onChange={(v) => handleEditChange('specs.do_number', v)} />
                  <EditField label="Outlet Branch" value={editData.current_client?.outlet_branch || ''} onChange={(v) => handleEditChange('current_client.outlet_branch', v)} />
                  <EditField label="City" value={editData.current_client?.city || ''} onChange={(v) => handleEditChange('current_client.city', v)} />
                  <EditField label="Province" value={editData.current_client?.province || ''} onChange={(v) => handleEditChange('current_client.province', v)} />
                </div>
              ) : (
                <>
                  <div className={styles.specItem}>
                    <span className={styles.specLabel}>Customer Name</span>
                    <span className={styles.specValue}>{unit.current_client?.company_name || '—'}</span>
                  </div>
                  <div className={styles.specItem}>
                    <span className={styles.specLabel}>SO Number</span>
                    <span className={styles.specValue}>{unit.specs?.so_number || '—'}</span>
                  </div>
                  <div className={styles.specItem}>
                    <span className={styles.specLabel}>DO Number</span>
                    <span className={styles.specValue}>{unit.specs?.do_number || '—'}</span>
                  </div>
                  <div className={styles.specItem}>
                    <span className={styles.specLabel}>Outlet Branch</span>
                    <span className={styles.specValue}>{unit.current_client?.outlet_branch || '—'}</span>
                  </div>
                  <div className={styles.specItem} style={{ borderBottom: 'none' }}>
                    <span className={styles.specLabel}>Outlet Address</span>
                    <span className={styles.specValue}>
                      {unit.current_client?.city ? `${unit.current_client.city}, ${unit.current_client.province || ''}` : '—'}
                    </span>
                  </div>
                </>
              )}
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
                {[...unit.service_logs].sort((a: any, b: any) => new Date(b.service_date || 0).getTime() - new Date(a.service_date || 0).getTime()).map((log: any, idx: number) => (
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
      
      {/* ── Lihat Semua Spesifikasi Modal ── */}
      {showAllSpecsModal && unit && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowAllSpecsModal(false)}
        >
          <div
            className={styles.modalContent}
            style={{
              maxWidth: '560px',
              width: '92%',
              padding: '28px 24px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              maxHeight: '85vh',
              overflowY: 'auto',
              color: '#0f172a',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader} style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>Semua Spesifikasi Unit</h2>
              <button
                className={styles.closeBtn}
                onClick={() => setShowAllSpecsModal(false)}
                style={{ color: '#64748b' }}
              >×</button>
            </div>

            {/* Basic unit fields */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <tbody>
                {[
                  { label: 'Model', value: unit.model_name },
                  { label: 'Serial Number', value: unit.serial_number },
                  { label: 'Garansi Berakhir', value: unit.warranty_expiry ? new Date(unit.warranty_expiry).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
                  { label: 'Dibuat Pada', value: unit.created_at ? new Date(unit.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
                  ...(unit.specs
                    ? Object.entries(unit.specs as Record<string, unknown>)
                        .filter(([, v]) => v !== null && v !== undefined && v !== '' && typeof v !== 'object')
                        .map(([k, v]) => ({
                          label: k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
                          value: String(v),
                        }))
                    : []),
                ].map(({ label, value }, idx) => (
                  <tr
                    key={label}
                    style={{
                      borderBottom: '1px solid #e2e8f0',
                      background: idx % 2 === 0 ? '#f8fafc' : '#ffffff',
                    }}
                  >
                    <td
                      style={{
                        padding: '10px 12px',
                        color: '#64748b',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        width: '40%',
                      }}
                    >
                      {label}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#0f172a', wordBreak: 'break-word' }}>
                      {value || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button
              onClick={() => setShowAllSpecsModal(false)}
              style={{
                marginTop: '20px',
                width: '100%',
                padding: '10px 16px',
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Tutup
            </button>
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
