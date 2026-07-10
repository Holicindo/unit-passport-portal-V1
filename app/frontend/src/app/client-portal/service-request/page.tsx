'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { unitApi } from '@/lib/api';
import {
  ArrowLeft, Calendar, Package, Wrench, CheckCircle2,
  MapPin, Phone, User, ChevronDown,
} from 'lucide-react';
import styles from '../ClientPortal.module.css';
import srStyles from './service-request.module.css';

export default function ServiceRequestPage() {
  const router = useRouter();
  const [fleet, setFleet]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');

  const [form, setForm] = useState({
    unit_id: '',
    city: '',
    contact_name: '',
    contact_phone: '',
    notes: '',
    preferred_date: '',
  });

  // Ambil fleet untuk dropdown pilih unit
  useEffect(() => {
    unitApi.findMyFleet()
      .then(({ data }) => setFleet(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Auto-fill kota dari unit yang dipilih
  const handleUnitChange = (unitId: string) => {
    const unit = fleet.find(u => u.id === unitId);
    setForm(f => ({
      ...f,
      unit_id: unitId,
      city: unit?.current_client?.city || unit?.specs?.city || f.city,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.unit_id) { setError('Pilih unit terlebih dahulu.'); return; }
    setSubmitting(true);
    setError('');
    try {
      await unitApi.requestService(form.unit_id, {
        city: form.city,
        contact_name: form.contact_name,
        contact_phone: form.contact_phone,
        notes: form.notes + (form.preferred_date ? `\nTanggal diinginkan: ${new Date(form.preferred_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''),
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal mengirim permintaan. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedUnit = fleet.find(u => u.id === form.unit_id);

  if (success) {
    return (
      <div className={srStyles.successWrap}>
        <div className={srStyles.successCard}>
          <div className={srStyles.successIcon}>
            <CheckCircle2 size={48} color="var(--brand-cobalt-blue)" />
          </div>
          <h2 className={srStyles.successTitle}>Permintaan Terkirim</h2>
          <p className={srStyles.successDesc}>
            Tim Holicindo akan menghubungi Anda dalam 1×24 jam untuk mengkonfirmasi jadwal servis.
          </p>
          {selectedUnit && (
            <div className={srStyles.successUnit}>
              <Package size={14} />
              {selectedUnit.serial_number} — {selectedUnit.model_name}
            </div>
          )}
          <div className={srStyles.successActions}>
            <button
              className={styles.btnPrimary}
              onClick={() => router.push('/client-portal/fleet')}
            >
              <Package size={15} /> Lihat Fleet
            </button>
            <button
              className={styles.btnSecondary}
              onClick={() => {
                setSuccess(false);
                setForm({ unit_id: '', city: '', contact_name: '', contact_phone: '', notes: '', preferred_date: '' });
              }}
            >
              Buat Permintaan Baru
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <button className={srStyles.backBtn} onClick={() => router.back()}>
        <ArrowLeft size={16} /> Kembali
      </button>

      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Jadwal Servis</h1>
        <p className={styles.pageDescription}>
          Ajukan permintaan jadwal servis untuk unit Anda. Tim Holicindo akan merespons dalam 1×24 jam.
        </p>
      </div>

      <div className={srStyles.layout}>
        {/* ── Form Utama ── */}
        <div className={srStyles.formCard}>
          <form onSubmit={handleSubmit}>

            {/* Pilih Unit */}
            <div className={srStyles.section}>
              <div className={srStyles.sectionHeader}>
                <Package size={16} color="var(--brand-cobalt-blue)" />
                <span className={srStyles.sectionTitle}>Pilih Unit</span>
              </div>

              {loading ? (
                <div className={styles.skeleton} style={{ height: 48, borderRadius: 12 }} />
              ) : (
                <div className={srStyles.selectWrap}>
                  <select
                    className={srStyles.select}
                    value={form.unit_id}
                    onChange={e => handleUnitChange(e.target.value)}
                    required
                  >
                    <option value="">-- Pilih unit yang ingin diservis --</option>
                    {fleet.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.serial_number} — {u.model_name || 'Model TBA'} ({u.current_client?.city || u.specs?.city || 'Lokasi TBA'})
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={15} className={srStyles.selectIcon} />
                </div>
              )}

              {/* Preview unit yang dipilih */}
              {selectedUnit && (
                <div className={srStyles.unitPreview}>
                  <div className={srStyles.unitPreviewIcon}>
                    <Package size={20} />
                  </div>
                  <div className={srStyles.unitPreviewInfo}>
                    <div className={srStyles.unitPreviewSerial}>{selectedUnit.serial_number}</div>
                    <div className={srStyles.unitPreviewModel}>{selectedUnit.model_name}</div>
                  </div>
                  <div className={srStyles.unitPreviewCity}>
                    <MapPin size={12} />
                    {selectedUnit.current_client?.city || selectedUnit.specs?.city || '—'}
                  </div>
                </div>
              )}
            </div>

            {/* Informasi Kontak */}
            <div className={srStyles.section}>
              <div className={srStyles.sectionHeader}>
                <User size={16} color="var(--brand-cobalt-blue)" />
                <span className={srStyles.sectionTitle}>Informasi Kontak</span>
              </div>

              <div className={srStyles.formGrid}>
                <div className={srStyles.formGroup}>
                  <label className={srStyles.label}>Nama Kontak *</label>
                  <input
                    className={srStyles.input}
                    type="text"
                    placeholder="Nama PIC yang bisa dihubungi"
                    value={form.contact_name}
                    onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))}
                    required
                  />
                </div>
                <div className={srStyles.formGroup}>
                  <label className={srStyles.label}>No. Telepon / WhatsApp *</label>
                  <input
                    className={srStyles.input}
                    type="tel"
                    placeholder="08xx-xxxx-xxxx"
                    value={form.contact_phone}
                    onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))}
                    required
                  />
                </div>
                <div className={srStyles.formGroup}>
                  <label className={srStyles.label}>Kota *</label>
                  <input
                    className={srStyles.input}
                    type="text"
                    placeholder="Kota lokasi unit"
                    value={form.city}
                    onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                    required
                  />
                </div>
                <div className={srStyles.formGroup}>
                  <label className={srStyles.label}>Tanggal Diinginkan</label>
                  <input
                    className={srStyles.input}
                    type="date"
                    value={form.preferred_date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setForm(f => ({ ...f, preferred_date: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Keluhan / Catatan */}
            <div className={srStyles.section}>
              <div className={srStyles.sectionHeader}>
                <Wrench size={16} color="var(--brand-cobalt-blue)" />
                <span className={srStyles.sectionTitle}>Deskripsi Masalah</span>
              </div>
              <div className={srStyles.formGroup}>
                <label className={srStyles.label}>Catatan / Keluhan</label>
                <textarea
                  className={srStyles.textarea}
                  placeholder="Jelaskan masalah yang dialami unit... (opsional)"
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={4}
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className={srStyles.errorMsg}>{error}</div>
            )}

            {/* Submit */}
            <div className={srStyles.submitRow}>
              <button
                type="submit"
                className={styles.btnWarning}
                disabled={submitting || loading}
                style={{ minWidth: 200, justifyContent: 'center' }}
              >
                <Calendar size={16} />
                {submitting ? 'Mengirim...' : 'Kirim Permintaan Servis'}
              </button>
            </div>
          </form>
        </div>

        {/* ── Info Panel ── */}
        <div className={srStyles.infoPanel}>
          <div className={srStyles.infoCard}>
            <div className={srStyles.infoCardIcon}>
              <Calendar size={22} color="var(--brand-cobalt-blue)" />
            </div>
            <h3 className={srStyles.infoCardTitle}>Proses Permintaan</h3>
            <ol className={srStyles.infoSteps}>
              <li>Isi form dan kirim permintaan</li>
              <li>Tim Holicindo akan menghubungi Anda dalam 1×24 jam</li>
              <li>Konfirmasi jadwal bersama tim</li>
              <li>Teknisi dikirim ke lokasi unit</li>
            </ol>
          </div>

          <div className={srStyles.infoCard}>
            <div className={srStyles.infoCardIcon}>
              <Phone size={22} color="var(--brand-cobalt-blue)" />
            </div>
            <h3 className={srStyles.infoCardTitle}>Butuh Bantuan Segera?</h3>
            <p className={srStyles.infoCardDesc}>
              Untuk kerusakan mendesak, gunakan fitur chat langsung dengan tim Holicindo.
            </p>
            <button
              className={styles.btnSecondary}
              style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
              onClick={() => router.push('/client-portal/messages')}
            >
              <Phone size={14} /> Hubungi via Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
