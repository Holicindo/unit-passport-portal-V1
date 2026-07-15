'use client';

import { useState, useEffect } from 'react';
import { unitApi, serviceLogApi, reportApi } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Box, MapPin, Wrench, ShieldCheck,
  FileText, AlertTriangle, ExternalLink, Package,
  TrendingUp, Calendar, Activity
} from 'lucide-react';
import styles from '../../ClientPortal.module.css';
import unitStyles from './unit.module.css';
import UnitHealthWidget from '@/components/iot/UnitHealthWidget';

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
  const { id }   = useParams();
  const router   = useRouter();
  const [unit, setUnit]           = useState<any>(null);
  const [logs, setLogs]           = useState<any[]>([]);
  const [reports, setReports]     = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [serviceRequested, setServiceRequested] = useState(false);

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
              <h1 className={styles.pageTitle}>{unit.serial_number}</h1>
              <p className={styles.pageDescription}>{unit.model_name}</p>
            </div>
          </div>
          <div className={unitStyles.unitHeaderRight}>
            <StatusBadge status={unit.status} />
            {!serviceRequested ? (
              <button
                className={styles.btnWarning}
                onClick={() => setShowModal(true)}
              >
                <Wrench size={16} /> Request Servis
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
          
          {/* Info Dasar Unit & Indeks Kesehatan (Flex Row) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            
            {/* Info Dasar Unit */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>
                  <Box size={16} style={{ display: 'inline', marginRight: 8, color: 'var(--brand-cobalt-blue)' }} />
                  Informasi Unit
                </h2>
              </div>
              <div className={styles.cardBody}>
                {[
                  { label: 'Serial Number', value: unit.serial_number },
                  { label: 'Model',         value: unit.model_name },
                  { label: 'Tipe',          value: unit.specs?.type },
                ].map(({ label, value }) => (
                  <div key={label} className={styles.infoRow} style={{ padding: '12px 0', borderBottom: '1px solid var(--brand-border)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--brand-space-grey)', fontWeight: 600 }}>{label}</span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--brand-deep-navy)', fontWeight: 700, float: 'right' }}>{value || '—'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Indeks Kesehatan Unit (Simplified IoT) */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>
                  <Activity size={16} style={{ display: 'inline', marginRight: 8, color: 'var(--brand-cobalt-blue)' }} />
                  Indeks Kesehatan Unit
                </h2>
              </div>
              <div className={styles.cardBody} style={{ padding: '0 16px 16px' }}>
                <UnitHealthWidget unitId={unit.id} />
              </div>
            </div>

          </div>

          {/* ── Riwayat Servis ── */}
          <div className={styles.cardStretch}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <Wrench size={16} style={{ display: 'inline', marginRight: 8, color: 'var(--brand-cobalt-blue)' }} />
                Riwayat Servis
              </h2>
              <span className={unitStyles.countBadge}>{logs.length} catatan</span>
            </div>
            <div className={styles.cardBody} style={{ padding: 0 }}>
              {logs.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <Wrench size={24} color="var(--brand-space-grey)" style={{ marginBottom: 12 }} />
                  <div style={{ color: 'var(--brand-space-grey)', fontWeight: 600 }}>Belum ada riwayat servis</div>
                </div>
              ) : (
                <div className={unitStyles.logList}>
                  {logs.map((log: any) => (
                    <div key={log.id} className={unitStyles.logItem}>
                      <div className={unitStyles.logAccent} />
                      <div className={unitStyles.logContent}>
                        <div className={unitStyles.logTop}>
                          <span className={unitStyles.logTitle}>
                            {log.action_taken || log.issue_description || 'Servis'}
                          </span>
                          <span className={unitStyles.logDate}>
                            <Calendar size={12} />
                            {log.service_date
                              ? new Date(log.service_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                              : '—'}
                          </span>
                        </div>
                        {log.issue_description && log.action_taken && (
                          <p className={unitStyles.logDesc}>{log.issue_description}</p>
                        )}
                        <div className={unitStyles.logMeta}>
                          {log.technician_name && (
                            <span className={unitStyles.logMetaItem}>Teknisi: {log.technician_name}</span>
                          )}
                          {log.partner?.partner_name && (
                            <span className={unitStyles.logMetaItem}>Mitra: {log.partner.partner_name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
