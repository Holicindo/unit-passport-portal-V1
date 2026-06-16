'use client';

import { useState, useEffect } from 'react';
import { unitApi, serviceLogApi, reportApi } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Box, MapPin, Wrench, ShieldCheck,
  FileText, AlertTriangle, ExternalLink, Package,
  TrendingUp, Calendar,
} from 'lucide-react';
import styles from '../../ClientPortal.module.css';
import unitStyles from './unit.module.css';

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
  onClose: () => void;
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
    <div className={unitStyles.modalOverlay} onClick={onClose}>
      <div className={unitStyles.modal} onClick={e => e.stopPropagation()}>
        <div className={unitStyles.modalHeader}>
          <h3 className={unitStyles.modalTitle}>Permintaan Servis</h3>
          <button className={unitStyles.modalClose} onClick={onClose}>×</button>
        </div>

        {success ? (
          <div className={unitStyles.modalSuccess}>
            <ShieldCheck size={40} color="var(--brand-cobalt-blue)" />
            <p>Permintaan servis berhasil dikirim. Tim Holicindo akan segera menghubungi Anda.</p>
            <button className={styles.btnPrimary} onClick={onClose}>Tutup</button>
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
              <button type="button" className={styles.btnSecondary} onClick={onClose}>
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
        if (logsRes.status === 'fulfilled')    setLogs(logsRes.value.data || []);
        if (reportsRes.status === 'fulfilled') setReports(reportsRes.value.data || []);
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
      <button
        className={unitStyles.backBtn}
        onClick={() => router.push('/client-portal/fleet')}
      >
        <ArrowLeft size={16} /> Kembali ke Fleet
      </button>

      {/* ── Header Unit ── */}
      <div className={unitStyles.unitHeader}>
        <div className={unitStyles.unitHeaderLeft}>
          <div className={unitStyles.unitIconBox}>
            <Box size={28} />
          </div>
          <div>
            <h1 className={unitStyles.unitSerial}>{unit.serial_number}</h1>
            <p className={unitStyles.unitModel}>{unit.model_name}</p>
          </div>
        </div>
        <div className={unitStyles.unitHeaderRight}>
          <StatusBadge status={unit.status} />
          {/* Tombol Request Service — Safety Orange */}
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

      {/* ── Info Cards ── */}
      <div className={styles.unitDetailGrid} style={{ marginBottom: 24 }}>

        {/* Spesifikasi Teknis */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <Box size={16} style={{ display: 'inline', marginRight: 8, color: 'var(--brand-cobalt-blue)' }} />
              Spesifikasi Teknis
            </h2>
          </div>
          <div style={{ padding: '0 24px' }}>
            {[
              { label: 'Dimensi',          value: unit.specs?.dimension },
              { label: 'Kapasitas',        value: unit.specs?.capacity },
              { label: 'Kompresor',        value: unit.specs?.compressor },
              { label: 'Refrigeran',       value: unit.specs?.refrigerant },
              { label: 'Suhu Operasional', value: unit.specs?.temperature_range },
              { label: 'Tipe',             value: unit.specs?.type },
            ].map(({ label, value }) => (
              <div key={label} className={styles.infoRow}>
                <span className={styles.infoLabel}>{label}</span>
                <span className={styles.infoValue}>{value || '—'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Detail Penempatan & Garansi */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <MapPin size={16} style={{ display: 'inline', marginRight: 8, color: 'var(--brand-cobalt-blue)' }} />
              Penempatan & Garansi
            </h2>
          </div>
          <div style={{ padding: '0 24px' }}>
            {[
              { label: 'Kota',            value: unit.current_client?.city || unit.specs?.city },
              { label: 'Tgl. Produksi',   value: unit.production_date ? new Date(unit.production_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : null },
              { label: 'Garansi Habis',   value: warrantyExpiry ? new Date(warrantyExpiry).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : null },
            ].map(({ label, value }) => (
              <div key={label} className={styles.infoRow}>
                <span className={styles.infoLabel}>{label}</span>
                <span className={styles.infoValue}>{value || '—'}</span>
              </div>
            ))}
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Status Garansi</span>
              <WarrantyBadge endDate={warrantyExpiry} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Riwayat Servis ── */}
      <div className={styles.card} style={{ marginBottom: 24 }}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>
            <Wrench size={16} style={{ display: 'inline', marginRight: 8, color: 'var(--brand-cobalt-blue)' }} />
            Riwayat Servis
          </h2>
          <span className={unitStyles.countBadge}>{logs.length} catatan</span>
        </div>

        {logs.length === 0 ? (
          <div className={styles.emptyState} style={{ padding: '40px' }}>
            <div className={styles.emptyStateIcon}><Wrench size={24} /></div>
            <div className={styles.emptyStateTitle}>Belum ada riwayat servis</div>
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
                    <span className={`${styles.badgeActive} ${log.status === 'PENDING' ? styles.badgeMaintenance : ''}`}>
                      {log.status}
                    </span>
                  </div>
                  {log.attachments?.length > 0 && (
                    <div className={unitStyles.attachments}>
                      {log.attachments.map((url: string, i: number) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={unitStyles.attachLink}
                        >
                          <ExternalLink size={12} /> Lampiran {i + 1}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Laporan Servis ── */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>
            <FileText size={16} style={{ display: 'inline', marginRight: 8, color: 'var(--brand-cobalt-blue)' }} />
            Laporan Servis
          </h2>
          <span className={unitStyles.countBadge}>{reports.length} laporan</span>
        </div>

        {reports.length === 0 ? (
          <div className={styles.emptyState} style={{ padding: '40px' }}>
            <div className={styles.emptyStateIcon}><FileText size={24} /></div>
            <div className={styles.emptyStateTitle}>Belum ada laporan</div>
          </div>
        ) : (
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Tipe Laporan</th>
                <th>Tanggal</th>
                <th>Dibuat Oleh</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((rep: any) => (
                <tr key={rep.id}>
                  <td data-label="Tipe Laporan">
                    <span style={{ fontWeight: 700, color: 'var(--brand-deep-navy)', fontFamily: 'var(--font-heading)' }}>
                      {rep.form_type?.replace(/_/g, ' ') || 'Laporan'}
                    </span>
                  </td>
                  <td data-label="Tanggal" style={{ color: 'var(--brand-space-grey)' }}>
                    {rep.created_at
                      ? new Date(rep.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                      : '—'}
                  </td>
                  <td data-label="Dibuat Oleh" style={{ color: 'var(--brand-space-grey)' }}>
                    {rep.created_by?.name || '—'}
                  </td>
                  <td data-label="Aksi" style={{ textAlign: 'right' }}>
                    <a
                      href={`/client-portal/reports/${rep.id}`}
                      className={styles.cardAction}
                    >
                      Lihat Laporan <ExternalLink size={13} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modal Request Servis ── */}
      {showModal && (
        <ServiceRequestModal
          unitId={id as string}
          onClose={() => {
            setShowModal(false);
            setServiceRequested(true);
          }}
        />
      )}
    </div>
  );
}
