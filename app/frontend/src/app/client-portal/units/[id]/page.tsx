'use client';

import { useState, useEffect } from 'react';
import { unitApi, serviceLogApi, reportApi } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Box, MapPin, Wrench, ShieldCheck,
  FileText, AlertTriangle, ExternalLink, Package,
  TrendingUp, Calendar, Activity, ImageOff, Zap, Wind, Thermometer,
  User, Briefcase, ChevronDown, ChevronUp
} from 'lucide-react';
import styles from '../../ClientPortal.module.css';
import unitStyles from './unit.module.css';
import UnitHealthWidget from '@/components/iot/UnitHealthWidget';

// ── Cooling Circulation Diagram (Menyesuaikan Format Manual QC) ──
function CoolingCircuitDiagram() {
  return (
    <div style={{ padding: '16px 20px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, minHeight: '100%' }}>
      <svg viewBox="0 0 520 280" width="100%" style={{ display: 'block', overflow: 'visible', maxWidth: '600px' }}>
        <defs>
          <marker id="arrowBlue" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#2E5BFF" />
          </marker>
          <marker id="arrowOrange" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#FF6B00" />
          </marker>
        </defs>

        {/* ── Komponen Boxes ── */}

        {/* Evaporator (Atas) */}
        <rect x="150" y="10" width="220" height="60" rx="10" fill="#1e3a5f" opacity="0.9"/>
        {/* Garis-garis vertikal ala Evaporator di gambar manual */}
        <path d="M160,10 L160,70 M175,10 L175,70 M190,10 L190,70 M205,10 L205,70 M315,10 L315,70 M330,10 L330,70 M345,10 L345,70 M360,10 L360,70" stroke="rgba(255,255,255,0.15)" strokeWidth="2"/>
        <text x="260" y="32" textAnchor="middle" fill="white" fontSize="12" fontWeight="700">EVAPORATOR</text>
        <text x="260" y="48" textAnchor="middle" fill="#93c5fd" fontSize="9">Serap Panas Kabin</text>
        <text x="260" y="62" textAnchor="middle" fill="#dbeafe" fontSize="9">-15 ~ -5 °C</text>

        {/* Kondensor (Kiri Bawah) */}
        <rect x="20" y="200" width="130" height="70" rx="10" fill="#c2410c" opacity="0.9"/>
        {/* Ikon X (Kipas Kondensor) di gambar manual */}
        <circle cx="50" cy="235" r="20" fill="transparent" stroke="#fed7aa" strokeWidth="2" opacity="0.5"/>
        <path d="M36,221 L64,249 M64,221 L36,249" stroke="#fed7aa" strokeWidth="2" opacity="0.5"/>
        <text x="100" y="222" textAnchor="middle" fill="white" fontSize="11" fontWeight="700">CONDENSER</text>
        <text x="100" y="238" textAnchor="middle" fill="#fed7aa" fontSize="9">Buang Panas</text>
        <text x="100" y="254" textAnchor="middle" fill="#ffedd5" fontSize="9">~40–60 °C</text>

        {/* Kompresor (Kanan Bawah) */}
        <rect x="370" y="200" width="130" height="70" rx="10" fill="#1e40af" opacity="0.9"/>
        <text x="435" y="222" textAnchor="middle" fill="white" fontSize="11" fontWeight="700">COMPRESSOR</text>
        <text x="435" y="238" textAnchor="middle" fill="#93c5fd" fontSize="9">Pompa Freon</text>
        <text x="435" y="254" textAnchor="middle" fill="#dbeafe" fontSize="9">R290 | 1/2 HP</text>

        {/* ── Jalur Freon (Menyesuaikan Arah Panah di Manual) ── */}
        
        {/* Kondensor → Evaporator (Kiri, arah Atas) */}
        <path d="M85,200 L85,40 L150,40" fill="none" stroke="#2E5BFF" strokeWidth="2.5" markerEnd="url(#arrowBlue)"/>
        {/* Panah dekoratif besar di tengah jalur kiri (seperti di manual) */}
        <path d="M75,130 L85,115 L95,130 Z" fill="#2E5BFF" opacity="0.4"/>
        <text x="75" y="100" textAnchor="end" fill="#2E5BFF" fontSize="9" fontWeight="600">Cairan Dingin</text>

        {/* Evaporator → Kompresor (Kanan, arah Bawah) */}
        <path d="M370,40 L435,40 L435,200" fill="none" stroke="#2E5BFF" strokeWidth="2.5" markerEnd="url(#arrowBlue)"/>
        {/* Panah dekoratif besar di tengah jalur kanan (seperti di manual) */}
        <path d="M425,115 L435,130 L445,115 Z" fill="#2E5BFF" opacity="0.4"/>
        <text x="445" y="100" textAnchor="start" fill="#2E5BFF" fontSize="9" fontWeight="600">Uap Dingin</text>

        {/* Kompresor → Kondensor (Bawah, arah Kiri) */}
        <path d="M370,235 L150,235" fill="none" stroke="#FF6B00" strokeWidth="2.5" markerEnd="url(#arrowOrange)"/>
        <text x="260" y="230" textAnchor="middle" fill="#FF6B00" fontSize="9" fontWeight="600">← Freon Panas</text>
        {/* Panah dekoratif besar di tengah jalur bawah */}
        <path d="M280,245 L265,235 L280,225 Z" fill="#FF6B00" opacity="0.4"/>

        {/* ── Teks Tengah (Dalam Kabinet) ── */}
        <rect x="200" y="100" width="120" height="70" rx="8" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1"/>
        <text x="260" y="120" textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="700" textDecoration="underline">Dalam Kabinet</text>
        <text x="220" y="140" textAnchor="middle" fill="#64748b" fontSize="9">Min</text>
        <text x="300" y="140" textAnchor="middle" fill="#64748b" fontSize="9">Max</text>
        <text x="260" y="160" textAnchor="middle" fill="#475569" fontSize="9" fontWeight="500">Humidity  -  %</text>

        {/* Label Min/Max tambahan di luar (seperti di sudut-sudut komponen) */}
        <text x="140" y="20" fill="#94a3b8" fontSize="8">Min</text>
        <text x="140" y="30" fill="#94a3b8" fontSize="8">Max</text>
        
        <text x="375" y="20" fill="#94a3b8" fontSize="8">Min</text>
        <text x="375" y="30" fill="#94a3b8" fontSize="8">Max</text>

        <text x="20" y="185" fill="#94a3b8" fontSize="8">Min</text>
        <text x="20" y="195" fill="#94a3b8" fontSize="8">Max</text>

        <text x="480" y="185" fill="#94a3b8" fontSize="8">Min</text>
        <text x="480" y="195" fill="#94a3b8" fontSize="8">Max</text>

      </svg>
    </div>
  );
}

// ── Status Badge ──
function StatusBadge({ status }: { status: string }) {
  const s = status?.toUpperCase();
  if (s === 'ACTIVE')      return <span className={styles.badgeActive}>Active</span>;
  if (s === 'MAINTENANCE') return <span className={styles.badgeMaintenance}>Maintenance</span>;
  if (s === 'INACTIVE')    return <span className={styles.badgeInactive}>Inactive</span>;
  return <span className={styles.badgeInactive}>{status}</span>;
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
              {/* Tombol Request Service — Safety Orange */}
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
  // Decode in case ID was URL-encoded (e.g. IDs with spaces like "UNT VHIEU3R")
  const id = rawId ? decodeURIComponent(rawId as string) : rawId;
  const router   = useRouter();
  const [unit, setUnit]           = useState<any>(null);
  const [logs, setLogs]           = useState<any[]>([]);
  const [reports, setReports]     = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [serviceRequested, setServiceRequested] = useState(false);
  const [expandedLogId, setExpandedLogId]       = useState<string | null>(null);

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
          // MOCK DATA UNTUK DEMO PM JIKA KOSONG
          if (fetchedLogs.length === 0) {
            fetchedLogs = [
              {
                id: 'mock-log-1',
                action_taken: 'Pembersihan Evaporator & Cek Freon',
                issue_description: 'Suhu kurang maksimal, dilakukan pembersihan sirip evaporator.',
                service_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
                technician_name: 'Budi Santoso',
                partner: { partner_name: 'PT Pendingin Utama' },
                status: 'COMPLETED'
              },
              {
                id: 'mock-log-2',
                action_taken: 'Inspeksi Rutin & Kalibrasi Sensor IoT',
                issue_description: 'Pengecekan bulanan kompresor dan kalibrasi sensor suhu.',
                service_date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
                technician_name: 'Agus Riyadi',
                partner: { partner_name: 'Holicindo Tech Team' },
                status: 'COMPLETED'
              }
            ];
          }
          setLogs(fetchedLogs);
        }

        if (reportsRes.status === 'fulfilled') {
          let fetchedReports = reportsRes.value.data || [];
          // MOCK DATA UNTUK DEMO PM JIKA KOSONG
          if (fetchedReports.length === 0) {
            fetchedReports = [
              {
                id: 'mock-report-1',
                form_type: 'PREVENTIVE_MAINTENANCE',
                created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
                created_by: { name: 'Budi Santoso' }
              },
              {
                id: 'mock-report-2',
                form_type: 'ROUTINE_INSPECTION',
                created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
                created_by: { name: 'Agus Riyadi' }
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
      <div>
        <div style={{ marginBottom: 24 }}>
          <div className={styles.skeleton} style={{ height: 20, width: 160 }} />
        </div>
        <div className={styles.statsGrid}>
          {[1,2,3,4].map(i => (
            <div key={i} className={styles.statCard}>
              <div className={styles.skeleton} style={{ height: 14, width: '60%', marginBottom: 12 }} />
              <div className={styles.skeleton} style={{ height: 28, width: '40%' }} />
            </div>
          ))}
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

  return (
    <div>
      {/* ── Breadcrumb ── */}
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
                {/* Badge for mobile, hidden on desktop */}
                <div className={unitStyles.mobileBadgeOnly}>
                  <StatusBadge status={unit.status} />
                </div>
              </h1>
              <p className={styles.pageDescription}>{unit.model_name}</p>
            </div>
          </div>
          <div className={unitStyles.unitHeaderRight}>
            {/* Badge for desktop, hidden on mobile */}
            <div className={unitStyles.desktopBadgeOnly}>
              <StatusBadge status={unit.status} />
            </div>
            {!serviceRequested ? (
              <button
                className={`${styles.btnWarning} ${unitStyles.btnRequestMobile}`}
                onClick={() => setShowModal(true)}
              >
                <Wrench size={14} /> Request Servis
              </button>
            ) : (
              <span className={styles.badgeActive}>Permintaan Terkirim</span>
            )}
          </div>
        </div>
      </div>

      <div className={styles.twoCol}>
        
        {/* KOLOM KIRI (Main Content) */}
        <div className={styles.twoColLeft}>
          
          {/* Main Grid: 2 Kolom Vertikal (Kiri untuk info statis & foto, Kanan untuk health & diagram) */}
          <div className={unitStyles.innerGrid}>
            
            {/* ── KOLOM KIRI DALAM ── */}            {/* Informasi Unit (Gabungan Foto & Spesifikasi) */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>
                  <Box size={16} style={{ display: 'inline', marginRight: 8, color: 'var(--brand-cobalt-blue)' }} />
                  Informasi Unit
                </h2>
              </div>
              <div className={styles.cardBody} style={{ padding: '20px' }}>
                
                {/* Foto Unit */}
                <div style={{ marginBottom: '20px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                  {unit.test_run_image_url ? (
                    <img
                      src={unit.test_run_image_url}
                      alt={`Foto ${unit.serial_number}`}
                      style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, gap: 12, padding: 24, background: 'linear-gradient(135deg, rgba(30,64,175,0.06) 0%, rgba(46,91,255,0.04) 100%)' }}>
                      <svg viewBox="0 0 120 160" width="100" style={{ opacity: 0.6 }}>
                        <rect x="10" y="15" width="100" height="130" rx="8" fill="none" stroke="#2E5BFF" strokeWidth="2"/>
                        <rect x="16" y="21" width="88" height="105" rx="5" fill="rgba(46,91,255,0.06)" stroke="#2E5BFF" strokeWidth="1.2" strokeDasharray="4 2"/>
                        <rect x="56" y="55" width="8" height="50" rx="4" fill="#2E5BFF" opacity="0.5"/>
                        <line x1="16" y1="65" x2="104" y2="65" stroke="#93c5fd" strokeWidth="1"/>
                        <line x1="16" y1="95" x2="104" y2="95" stroke="#93c5fd" strokeWidth="1"/>
                        <rect x="10" y="145" width="100" height="12" rx="4" fill="#1e40af" opacity="0.4"/>
                        <rect x="20" y="22" width="80" height="4" rx="2" fill="#60a5fa" opacity="0.7"/>
                        <text x="60" y="110" textAnchor="middle" fontSize="22" fill="#2E5BFF" opacity="0.4">❄</text>
                      </svg>
                      <span style={{ fontSize: '0.8rem', color: 'var(--brand-space-grey)', fontWeight: 600 }}>Foto belum tersedia</span>
                    </div>
                  )}
                </div>

                {/* Tabel Spesifikasi */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {[
                    { label: 'Model',           value: unit.model_name },
                    { label: 'Serial Number',   value: unit.serial_number },
                    { label: 'Kompresor',       value: unit.specs?.compressor || 'NT6226GK' },
                    { label: 'Refrigeran',      value: unit.specs?.refrigerant || 'R404A' },
                    { label: 'Daya / Power',    value: unit.specs?.power || '1350 watt' },
                    { label: 'Production Date', value: unit.production_date ? new Date(unit.production_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '1 Juli 2026' },
                  ].map(({ label, value }) => (
                    <div key={label} className={styles.infoRow} style={{ padding: '14px 0', borderBottom: '1px solid var(--brand-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--brand-space-grey)', fontWeight: 600 }}>{label}</span>
                      <span style={{ fontSize: '0.9rem', color: 'var(--brand-deep-navy)', fontWeight: 800, textAlign: 'right' }}>{value || '—'}</span>
                    </div>
                  ))}
                </div>

              </div>
            </div>

            {/* ── KOLOM KANAN DALAM ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>

            {/* Indeks Kesehatan Unit (Simplified IoT) */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>
                  <Activity size={16} style={{ display: 'inline', marginRight: 8, color: 'var(--brand-cobalt-blue)' }} />
                  Indeks Kesehatan Unit
                </h2>
              </div>
              <div className={styles.cardBody} style={{ padding: '0 16px 16px' }}>
                <UnitHealthWidget unitId={unit.id} serialNumber={unit.serial_number} />
              </div>
            </div>

            {/* Diagram Sirkulasi Pendinginan */}
            <div className={styles.card} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>
                  <Wind size={16} style={{ display: 'inline', marginRight: 8, color: 'var(--brand-cobalt-blue)' }} />
                  Diagram Sirkulasi Pendinginan
                </h2>
              </div>
              <div className={styles.cardBody} style={{ padding: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <CoolingCircuitDiagram />
              </div>
            </div>

            </div>

          </div>
        </div>

        {/* KOLOM KANAN (Sidebar) */}
        <div className={styles.twoColRight}>
          
          {/* Detail Penempatan & Garansi */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <MapPin size={16} style={{ display: 'inline', marginRight: 8, color: 'var(--brand-cobalt-blue)' }} />
                Garansi
              </h2>
            </div>
            <div className={styles.cardBody}>
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--brand-space-grey)', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Status Garansi</span>
                <div style={{ marginTop: 8 }}><WarrantyBadge endDate={warrantyExpiry} /></div>
              </div>
              {[
                { label: 'Kota Penempatan', value: unit.current_client?.city || unit.specs?.city },
                { label: 'Tgl. Produksi',   value: unit.production_date ? new Date(unit.production_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : null },
                { label: 'Garansi Habis',   value: warrantyExpiry ? new Date(warrantyExpiry).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : null },
              ].map(({ label, value }) => (
                <div key={label} style={{ padding: '12px 0', borderTop: '1px solid var(--brand-border)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--brand-space-grey)', fontWeight: 600, display: 'block', marginBottom: 4 }}>{label}</span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--brand-deep-navy)', fontWeight: 700 }}>{value || '—'}</span>
                </div>
              ))}
              
              {/* Tombol Lihat Riwayat Servis */}
              <button 
                onClick={() => setShowHistoryModal(true)}
                style={{ 
                  width: '100%', marginTop: '16px', padding: '14px', 
                  background: 'rgba(0, 31, 63, 0.04)', border: '1px solid rgba(0, 31, 63, 0.08)', 
                  borderRadius: '12px', color: 'var(--brand-deep-navy)', 
                  fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}
              >
                <span>Lihat Riwayat Servis ({logs.length})</span>
                <span style={{ color: 'var(--brand-space-grey)', fontSize: '1.2rem', lineHeight: 0.8 }}>›</span>
              </button>
            </div>
          </div>

          {/* ── Laporan Servis ── */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <FileText size={16} style={{ display: 'inline', marginRight: 8, color: 'var(--brand-cobalt-blue)' }} />
                Laporan Terbaru
              </h2>
            </div>
            <div className={styles.cardBody} style={{ padding: '0 0 16px 0' }}>
              {reports.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center' }}>
                  <div style={{ color: 'var(--brand-space-grey)', fontWeight: 600, fontSize: '0.85rem' }}>Belum ada laporan</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {reports.slice(0, 5).map((rep: any) => (
                    <a
                      key={rep.id}
                      href={`/client-portal/reports/${rep.id}`}
                      style={{ 
                        padding: '12px 20px', 
                        borderBottom: '1px solid var(--brand-border)', 
                        textDecoration: 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'background 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'rgba(46, 91, 255, 0.05)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--brand-deep-navy)', marginBottom: 2 }}>
                          {rep.form_type?.replace(/_/g, ' ') || 'Laporan'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--brand-space-grey)' }}>
                          {rep.created_at ? new Date(rep.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </div>
                      </div>
                      <ExternalLink size={14} color="var(--brand-cobalt-blue)" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── Modal Riwayat Servis ── */}
      {showHistoryModal && (
        <div className={unitStyles.modalOverlay} onClick={() => setShowHistoryModal(false)}>
          <div 
            className={unitStyles.modal} 
            onClick={e => e.stopPropagation()} 
          >
            <div className={unitStyles.modalHeader} style={{ flexShrink: 0 }}>
              <h2 className={unitStyles.modalTitle}>
                <Wrench size={18} style={{ display: 'inline', marginRight: 8, color: 'var(--brand-cobalt-blue)', verticalAlign: 'text-bottom' }} />
                Riwayat Servis
              </h2>
              <button className={unitStyles.modalClose} onClick={() => setShowHistoryModal(false)}>×</button>
            </div>
            
            <div style={{ padding: 0, overflowY: 'auto', flexGrow: 1 }}>
              {logs.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <Wrench size={24} color="var(--brand-space-grey)" style={{ marginBottom: 12 }} />
                  <div style={{ color: 'var(--brand-space-grey)', fontWeight: 600 }}>Belum ada riwayat servis</div>
                </div>
              ) : (
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                  {/* Timeline vertical line */}
                  <div style={{ position: 'absolute', left: '33px', top: '24px', bottom: '24px', width: '2px', background: 'var(--brand-border)', zIndex: 0 }} />
                  
                  {logs.map((log: any, index: number) => {
                    const isExpanded = expandedLogId === log.id;
                    return (
                    <div key={log.id} style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1 }}>
                      {/* Timeline Dot */}
                      <div style={{ 
                        width: '28px', height: '28px', borderRadius: '50%', background: '#fff', 
                        border: '2px solid var(--brand-cobalt-blue)', display: 'flex', alignItems: 'center', 
                        justifyContent: 'center', flexShrink: 0, marginTop: '2px', boxShadow: '0 0 0 4px #fff' 
                      }}>
                        <Wrench size={12} color="var(--brand-cobalt-blue)" />
                      </div>

                      {/* Content Card */}
                      <div 
                        style={{ 
                          flex: 1, background: 'var(--brand-bg-light)', border: '1px solid rgba(0, 31, 63, 0.05)', 
                          borderRadius: '12px', padding: '12px 14px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                          display: 'flex', flexDirection: 'column', gap: '8px',
                          cursor: 'pointer', transition: 'all 0.2s'
                        }}
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      >
                        
                        {/* Header: Title & Date & Toggle Icon */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: 'var(--brand-deep-navy)', lineHeight: 1.3 }}>
                              {log.action_taken || log.issue_description || 'Servis & Pemeliharaan'}
                            </h4>
                            <span style={{ 
                              background: 'rgba(46, 91, 255, 0.08)', color: 'var(--brand-cobalt-blue)', 
                              padding: '3px 8px', borderRadius: '16px', fontSize: '0.65rem', fontWeight: 700,
                              display: 'inline-flex', alignItems: 'center', gap: '4px', alignSelf: 'flex-start',
                              border: '1px solid rgba(46, 91, 255, 0.1)'
                            }}>
                              <Calendar size={10} />
                              {log.service_date
                                ? new Date(log.service_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                                : '—'}
                            </span>
                          </div>
                          <div style={{ padding: '4px', color: 'var(--brand-space-grey)' }}>
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </div>
                        </div>

                        {/* Collapsible Content */}
                        {isExpanded && (
                          <div style={{ marginTop: '6px', paddingTop: '10px', borderTop: '1px dashed var(--brand-border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {/* Description / Actions Taken */}
                            {log.issue_description && (
                              <div>
                                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--brand-slate)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Keterangan</span>
                                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--brand-space-grey)', lineHeight: 1.5 }}>
                                  {log.issue_description}
                                </p>
                              </div>
                            )}

                            {/* Footer Meta: Technician & Partner */}
                            <div style={{ 
                              display: 'flex', gap: '12px', flexWrap: 'wrap'
                            }}>
                              {log.technician_name && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--brand-space-grey)' }}>
                                  <User size={12} color="var(--brand-slate)" />
                                  <span style={{ fontWeight: 600 }}>Teknisi:</span> {log.technician_name}
                                </div>
                              )}
                              {log.partner?.partner_name && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--brand-space-grey)' }}>
                                  <Briefcase size={12} color="var(--brand-slate)" />
                                  <span style={{ fontWeight: 600 }}>Mitra:</span> {log.partner.partner_name}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
