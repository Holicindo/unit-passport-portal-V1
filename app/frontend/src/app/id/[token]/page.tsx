'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { unitApi } from '@/lib/api';
import { 
  ShieldAlert, Wrench, FileText, CheckCircle2, 
  ExternalLink, Phone, ArrowLeft, Loader2, RefreshCw, 
  Lock, Check, UserCheck, Settings, BookOpen, Clock
} from 'lucide-react';
import styles from './id.module.css';

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
  const [serviceCity, setServiceCity] = useState('');
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
      // Step 1: Scan via public endpoint to get unit
      const { data: publicUnit } = await unitApi.findByQrToken(token as string);
      
      if (!publicUnit) {
        throw new Error('Unit tidak ditemukan');
      }

      // Step 2: If logged in, fetch full details depending on role
      const storedUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null;
      
      if (storedUser) {
        if (storedUser.role === 'PARTNER' || storedUser.role === 'ADMIN') {
          // Tech/Admin gets full data
          const { data: fullUnit } = await unitApi.findOne(publicUnit.id);
          setUnit(fullUnit);
        } else if (storedUser.role === 'CLIENT') {
          // Client gets owner view (validates on server/client side)
          const { data: fullUnit } = await unitApi.findOne(publicUnit.id);
          setUnit(fullUnit);
        } else {
          setUnit(publicUnit);
        }
      } else {
        setUnit(publicUnit);
      }
    } catch (err: any) {
      console.error('Failed to load unit:', err);
      setError(err.response?.data?.message || 'Gagal memuat data Unit Passport. QR Code mungkin salah atau tidak terdaftar.');
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
            setClients(data);
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
      const { data } = await unitApi.requestService(unit.id, {
        city: serviceCity || unit.specs?.city || 'Jakarta',
        notes: serviceNotes,
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
            
            {/* Specs nested values (Compressor, Refrigerant, etc.) */}
            <div className={styles.specItem}>
              <span className={styles.specLabel}>Kompresor / Compressor</span>
              <span className={styles.specValue}>{unit.specs?.compressor || 'Embraco 1/2 HP (Premium)'}</span>
            </div>
            <div className={styles.specItem}>
              <span className={styles.specLabel}>Refrigeran / Refrigerant</span>
              <span className={styles.specValue}>{unit.specs?.refrigerant || 'R290 (Eco-Friendly)'}</span>
            </div>
            <div className={styles.specItem}>
              <span className={styles.specLabel}>Daya / Wattage</span>
              <span className={styles.specValue}>{unit.specs?.wattage || '450W'}</span>
            </div>
            
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
                  {unit.current_client?.company_name || 'PT HOLICINDO STOCK'}
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

      {/* DOCUMENT LIBRARY — Hidden for public/competitors */}
      {!isGuest && !hasClientRestriction && (
        <section className={styles.sectionCard}>
          <div className={styles.cardHeader}>
            <BookOpen size={20} />
            <h2>Perpustakaan Dokumen &amp; Video</h2>
          </div>
          <div className={styles.docGrid}>
            <div className={styles.docItem}>
              <div className={styles.docIcon}>
                <BookOpen size={20} className={styles.docIconSvg} />
              </div>
              <div className={styles.docText}>
                <h3>User Manual (PDF)</h3>
                <p>Panduan lengkap instruksi pemakaian dan pemeliharaan harian.</p>
              </div>
              <a href="#" className={styles.btnDownload}>Unduh</a>
            </div>

            {/* LEVEL 3 PARTNER & LEVEL 4 ADMIN ONLY: Deep Technical Diagrams */}
            {(isPartner || isAdmin) ? (
              <>
                <div className={styles.docItem}>
                  <div className={styles.docIcon}>
                    <Wrench size={20} className={styles.docIconSvg} />
                  </div>
                  <div className={styles.docText}>
                    <h3>Wiring Circuit Diagram (PDF)</h3>
                    <p style={{ color: 'var(--color-safety-orange)' }}><strong>SANGAT RAHASIA:</strong> Diagram sirkuit kelistrikan.</p>
                  </div>
                  <a href={unit.circuit_diagram_url || '#'} target="_blank" className={styles.btnDownload}>Buka</a>
                </div>
                <div className={styles.docItem}>
                  <div className={styles.docIcon}>
                    <Settings size={20} className={styles.docIconSvg} />
                  </div>
                  <div className={styles.docText}>
                    <h3>Exploded View Assembly (PDF)</h3>
                    <p style={{ color: 'var(--color-safety-orange)' }}><strong>SANGAT RAHASIA:</strong> Komponen terurai showcase.</p>
                  </div>
                  <a href={unit.exploded_view_url || '#'} target="_blank" className={styles.btnDownload}>Buka</a>
                </div>
              </>
            ) : (
              <div className={`${styles.docItem} ${styles.docLocked}`}>
                <div className={styles.docIcon}><Lock size={20} /></div>
                <div className={styles.docText}>
                  <h3>Technical Circuit &amp; Exploded Diagrams</h3>
                  <p>Hanya dapat diakses oleh Mitra Teknisi Resmi PT Holicindo.</p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* VERIFIED SERVICE HISTORY — Hidden for public/competitors */}
      {!isGuest && !hasClientRestriction && (
        <section className={styles.sectionCard}>
          <div className={styles.cardHeader}>
            <Clock size={20} />
            <h2>Verified Service History</h2>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Kategori</th>
                  <th>Teknisi</th>
                  <th>Partner</th>
                  <th>Catatan Perbaikan / Tindakan</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {unit.service_logs && unit.service_logs.length > 0 ? (
                  unit.service_logs.map((log: any) => (
                    <tr key={log.id} className={styles.dataRow}>
                      <td className={styles.dateCol}>
                        {new Date(log.service_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'numeric', day: 'numeric' })}
                      </td>
                      <td>
                        <span className={`${styles.typeTag} ${log.service_type === 'PREVENTIVE_MAINTENANCE' ? styles.typePrev : styles.typeCorr}`}>
                          {log.service_type === 'PREVENTIVE_MAINTENANCE' ? 'Preventive' : 'Corrective'}
                        </span>
                      </td>
                      <td>{log.technician_name}</td>
                      <td>{log.partner?.partner_name || 'Holicindo HQ'}</td>
                      <td>{log.notes}</td>
                      <td>
                        <span className={styles.statusCompleted}>✓ {log.status}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className={styles.emptyTable}>Belum ada riwayat servis tercatat untuk unit ini.</td>
                  </tr>
                )}
              </tbody>
            </table>
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
              <button onClick={() => { setShowServiceModal(false); setRoutingResult(null); }} className={styles.closeBtn}>×</button>
            </div>
            
            {!routingResult ? (
              <form onSubmit={handleServiceRequest} className={styles.modalForm}>
                <p className={styles.modalHint}>Permintaan akan diproses menggunakan sistem Smart Routing regional kami.</p>
                
                <div className={styles.formGroup}>
                  <label>Kota Lokasi Unit Saat Ini</label>
                  <select 
                    value={serviceCity} 
                    onChange={(e) => setServiceCity(e.target.value)}
                    required
                  >
                    <option value="">— Pilih Kota —</option>
                    <option value="Jakarta">DKI Jakarta</option>
                    <option value="Medan">Medan (Sumatera Utara)</option>
                    <option value="Surabaya">Surabaya (Jawa Timur)</option>
                    <option value="Bandung">Bandung (Jawa Barat)</option>
                    <option value="Semarang">Semarang (Jawa Tengah)</option>
                  </select>
                </div>

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
                  <label>Deskripsi Kendala Mesin Showcase</label>
                  <textarea 
                    value={serviceNotes} 
                    onChange={(e) => setServiceNotes(e.target.value)} 
                    placeholder="Jelaskan kendala (misal: suhu tidak mau dingin di bawah 10°C, kompresor bising)..."
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
                  onClick={() => { setShowServiceModal(false); setRoutingResult(null); }}
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
                  {clients.map((c: any) => (
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
