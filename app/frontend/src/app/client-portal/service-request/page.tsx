'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { unitApi } from '@/lib/api';
import {
  ArrowLeft, Calendar, Package, Wrench, CheckCircle2,
  MapPin, Phone, User, ChevronDown, Search, X,
} from 'lucide-react';
import styles from '../ClientPortal.module.css';
import srStyles from './service-request.module.css';

// Data provinsi dan kota Indonesia (major cities)
const CITIES_BY_PROVINCE = {
  'DKI Jakarta': ['Jakarta Pusat', 'Jakarta Utara', 'Jakarta Selatan', 'Jakarta Timur', 'Jakarta Barat'],
  'Jawa Barat': ['Bandung', 'Bekasi', 'Bogor', 'Cirebon', 'Depok', 'Sukabumi', 'Tasikmalaya', 'Karawang'],
  'Jawa Tengah': ['Semarang', 'Solo', 'Magelang', 'Purwokerto', 'Pekalongan', 'Tegal', 'Salatiga'],
  'Jawa Timur': ['Surabaya', 'Malang', 'Sidoarjo', 'Gresik', 'Mojokerto', 'Pasuruan', 'Probolinggo', 'Kediri', 'Blitar', 'Madiun', 'Banyuwangi'],
  'DI Yogyakarta': ['Yogyakarta', 'Sleman', 'Bantul'],
  'Banten': ['Tangerang', 'Tangerang Selatan', 'Serang', 'Cilegon'],
  'Bali': ['Denpasar', 'Badung', 'Gianyar', 'Tabanan'],
  'Sumatera Utara': ['Medan', 'Binjai', 'Pematang Siantar', 'Tebing Tinggi'],
  'Sumatera Barat': ['Padang', 'Bukittinggi', 'Payakumbuh'],
  'Sumatera Selatan': ['Palembang', 'Lubuklinggau', 'Prabumulih'],
  'Riau': ['Pekanbaru', 'Dumai'],
  'Kepulauan Riau': ['Batam', 'Tanjung Pinang', 'Bintan'],
  'Lampung': ['Bandar Lampung', 'Metro'],
  'Kalimantan Barat': ['Pontianak', 'Singkawang'],
  'Kalimantan Timur': ['Balikpapan', 'Samarinda', 'Bontang'],
  'Kalimantan Selatan': ['Banjarmasin', 'Banjarbaru'],
  'Sulawesi Selatan': ['Makassar', 'Parepare', 'Palopo'],
  'Sulawesi Utara': ['Manado', 'Bitung', 'Tomohon'],
  'Papua': ['Jayapura'],
  'Nusa Tenggara Barat': ['Mataram', 'Lombok'],
  'Nusa Tenggara Timur': ['Kupang'],
};

export default function ServiceRequestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialUnitId = searchParams.get('unit_id') || '';

  const [fleet, setFleet]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');

  // Modal states
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showProvinceModal, setShowProvinceModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [form, setForm] = useState({
    unit_id: initialUnitId,
    province: '',
    city: '',
    contact_name: '',
    contact_phone: '',
    notes: '',
    preferred_date: '',
  });

  // Cities filtered by selected province
  const availableCities = form.province ? CITIES_BY_PROVINCE[form.province as keyof typeof CITIES_BY_PROVINCE] || [] : [];

  // Filtered lists based on search
  const filteredUnits = useMemo(() => {
    if (!searchQuery) return fleet;
    const q = searchQuery.toLowerCase();
    return fleet.filter(u => 
      u.serial_number?.toLowerCase().includes(q) ||
      u.model_name?.toLowerCase().includes(q) ||
      u.current_client?.city?.toLowerCase().includes(q) ||
      u.specs?.city?.toLowerCase().includes(q)
    );
  }, [fleet, searchQuery]);

  const filteredProvinces = useMemo(() => {
    if (!searchQuery) return Object.keys(CITIES_BY_PROVINCE);
    const q = searchQuery.toLowerCase();
    return Object.keys(CITIES_BY_PROVINCE).filter(prov => prov.toLowerCase().includes(q));
  }, [searchQuery]);

  const filteredCities = useMemo(() => {
    if (!searchQuery) return availableCities;
    const q = searchQuery.toLowerCase();
    return availableCities.filter(city => city.toLowerCase().includes(q));
  }, [availableCities, searchQuery]);

  // Handlers
  const handleSelectUnit = (unitId: string) => {
    handleUnitChange(unitId);
    setShowUnitModal(false);
    setSearchQuery('');
  };

  const handleSelectProvince = (province: string) => {
    setForm(f => ({ ...f, province, city: '' }));
    setShowProvinceModal(false);
    setSearchQuery('');
  };

  const handleSelectCity = (city: string) => {
    setForm(f => ({ ...f, city }));
    setShowCityModal(false);
    setSearchQuery('');
  };

  const openModal = (type: 'unit' | 'province' | 'city') => {
    setSearchQuery('');
    if (type === 'unit') setShowUnitModal(true);
    else if (type === 'province') setShowProvinceModal(true);
    else if (type === 'city') setShowCityModal(true);
  };

  const closeAllModals = () => {
    setShowUnitModal(false);
    setShowProvinceModal(false);
    setShowCityModal(false);
    setSearchQuery('');
  };

  // Ambil fleet untuk dropdown pilih unit
  useEffect(() => {
    unitApi.findMyFleet()
      .then(({ data }) => {
        const units = data || [];
        setFleet(units);
        if (initialUnitId) {
          const matched = units.find((u: any) => u.id === initialUnitId);
          if (matched) {
            const cityFromUnit = matched.current_client?.city || matched.specs?.city || '';
            
            // Try to match city to province
            let matchedProvince = '';
            let matchedCity = cityFromUnit;
            
            if (cityFromUnit) {
              for (const [province, cities] of Object.entries(CITIES_BY_PROVINCE)) {
                if (cities.includes(cityFromUnit)) {
                  matchedProvince = province;
                  break;
                }
              }
            }
            
            setForm(f => ({
              ...f,
              unit_id: initialUnitId,
              province: matchedProvince,
              city: matchedCity,
            }));
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [initialUnitId]);

  // Auto-fill kota dari unit yang dipilih
  const handleUnitChange = (unitId: string) => {
    const unit = fleet.find(u => u.id === unitId);
    const cityFromUnit = unit?.current_client?.city || unit?.specs?.city || '';
    
    // Try to match city to province
    let matchedProvince = '';
    let matchedCity = cityFromUnit;
    
    if (cityFromUnit) {
      // Check if city exists in our database
      for (const [province, cities] of Object.entries(CITIES_BY_PROVINCE)) {
        if (cities.includes(cityFromUnit)) {
          matchedProvince = province;
          break;
        }
      }
    }
    
    setForm(f => ({
      ...f,
      unit_id: unitId,
      province: matchedProvince,
      city: matchedCity,
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
                setForm({ unit_id: '', province: '', city: '', contact_name: '', contact_phone: '', notes: '', preferred_date: '' });
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
      <button className={styles.pageBackBtn} onClick={() => router.push('/client-portal/dashboard')}>
        <ArrowLeft size={15} /> Beranda
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
                <button
                  type="button"
                  className={srStyles.selectButton}
                  onClick={() => openModal('unit')}
                >
                  <Package size={16} className={srStyles.selectButtonIcon} />
                  <span className={srStyles.selectButtonText}>
                    {selectedUnit ? `${selectedUnit.serial_number} • ${selectedUnit.model_name}` : 'Pilih unit yang ingin diservis'}
                  </span>
                  <ChevronDown size={14} className={srStyles.selectButtonChevron} />
                </button>
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
                  <label className={srStyles.label}>Provinsi *</label>
                  <button
                    type="button"
                    className={srStyles.selectButton}
                    onClick={() => openModal('province')}
                  >
                    <MapPin size={16} className={srStyles.selectButtonIcon} />
                    <span className={srStyles.selectButtonText}>
                      {form.province || 'Pilih provinsi lokasi unit'}
                    </span>
                    <ChevronDown size={14} className={srStyles.selectButtonChevron} />
                  </button>
                  {!form.province && (
                    <div className={srStyles.formHint}>Pilih provinsi dimana unit berada</div>
                  )}
                </div>
                <div className={srStyles.formGroup}>
                  <label className={srStyles.label}>Kota *</label>
                  <button
                    type="button"
                    className={srStyles.selectButton}
                    onClick={() => form.province && openModal('city')}
                    disabled={!form.province}
                  >
                    <MapPin size={16} className={srStyles.selectButtonIcon} />
                    <span className={srStyles.selectButtonText}>
                      {form.city || (form.province ? 'Pilih kota' : 'Pilih provinsi terlebih dahulu')}
                    </span>
                    <ChevronDown size={14} className={srStyles.selectButtonChevron} />
                  </button>
                  {!form.province && (
                    <div className={srStyles.formHint}>Kota akan muncul setelah memilih provinsi</div>
                  )}
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
              <Calendar size={22} />
            </div>
            <div className={srStyles.infoCardContent}>
              <h3 className={srStyles.infoCardTitle}>Proses Permintaan</h3>
              <ol className={srStyles.infoSteps}>
                <li>Isi form dan kirim permintaan</li>
                <li>Tim Holicindo akan menghubungi Anda dalam 1×24 jam</li>
                <li>Konfirmasi jadwal bersama tim</li>
                <li>Teknisi dikirim ke lokasi unit</li>
              </ol>
            </div>
          </div>

          <div className={srStyles.infoCard}>
            <div className={srStyles.infoCardIcon}>
              <Phone size={22} />
            </div>
            <div className={srStyles.infoCardContent}>
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

      {/* ── Modal: Pilih Unit ── */}
      {showUnitModal && (
        <div className={srStyles.modal} onClick={closeAllModals}>
          <div className={srStyles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={srStyles.modalHeader}>
              <h3 className={srStyles.modalTitle}>Pilih Unit</h3>
              <button className={srStyles.modalClose} onClick={closeAllModals}>
                <X size={18} />
              </button>
            </div>
            <div className={srStyles.modalSearch}>
              <Search size={16} className={srStyles.modalSearchIcon} />
              <input
                type="text"
                className={srStyles.modalSearchInput}
                placeholder="Cari serial number, model, atau lokasi..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
            <div className={srStyles.modalList}>
              {filteredUnits.length === 0 ? (
                <div className={srStyles.modalEmpty}>
                  <Package size={28} />
                  <p>Tidak ada unit ditemukan</p>
                </div>
              ) : (
                filteredUnits.map(u => (
                  <button
                    key={u.id}
                    type="button"
                    className={`${srStyles.modalItem} ${form.unit_id === u.id ? srStyles.modalItemActive : ''}`}
                    onClick={() => handleSelectUnit(u.id)}
                  >
                    <Package size={16} className={srStyles.modalItemIcon} />
                    <div className={srStyles.modalItemContent}>
                      <div className={srStyles.modalItemTitle}>{u.serial_number}</div>
                      <div className={srStyles.modalItemSubtitle}>
                        {u.model_name || 'Model TBA'} • {u.current_client?.city || u.specs?.city || 'Lokasi TBA'}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Pilih Provinsi ── */}
      {showProvinceModal && (
        <div className={srStyles.modal} onClick={closeAllModals}>
          <div className={srStyles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={srStyles.modalHeader}>
              <h3 className={srStyles.modalTitle}>Pilih Provinsi</h3>
              <button className={srStyles.modalClose} onClick={closeAllModals}>
                <X size={18} />
              </button>
            </div>
            <div className={srStyles.modalSearch}>
              <Search size={16} className={srStyles.modalSearchIcon} />
              <input
                type="text"
                className={srStyles.modalSearchInput}
                placeholder="Cari provinsi..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
            <div className={srStyles.modalList}>
              {filteredProvinces.length === 0 ? (
                <div className={srStyles.modalEmpty}>
                  <MapPin size={28} />
                  <p>Tidak ada provinsi ditemukan</p>
                </div>
              ) : (
                filteredProvinces.map(prov => (
                  <button
                    key={prov}
                    type="button"
                    className={`${srStyles.modalItem} ${form.province === prov ? srStyles.modalItemActive : ''}`}
                    onClick={() => handleSelectProvince(prov)}
                  >
                    <MapPin size={16} className={srStyles.modalItemIcon} />
                    <div className={srStyles.modalItemContent}>
                      <div className={srStyles.modalItemTitle}>{prov}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Pilih Kota ── */}
      {showCityModal && (
        <div className={srStyles.modal} onClick={closeAllModals}>
          <div className={srStyles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={srStyles.modalHeader}>
              <h3 className={srStyles.modalTitle}>Pilih Kota</h3>
              <button className={srStyles.modalClose} onClick={closeAllModals}>
                <X size={18} />
              </button>
            </div>
            <div className={srStyles.modalSearch}>
              <Search size={16} className={srStyles.modalSearchIcon} />
              <input
                type="text"
                className={srStyles.modalSearchInput}
                placeholder="Cari kota..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
            <div className={srStyles.modalList}>
              {filteredCities.length === 0 ? (
                <div className={srStyles.modalEmpty}>
                  <MapPin size={28} />
                  <p>Tidak ada kota ditemukan</p>
                </div>
              ) : (
                filteredCities.map(city => (
                  <button
                    key={city}
                    type="button"
                    className={`${srStyles.modalItem} ${form.city === city ? srStyles.modalItemActive : ''}`}
                    onClick={() => handleSelectCity(city)}
                  >
                    <MapPin size={16} className={srStyles.modalItemIcon} />
                    <div className={srStyles.modalItemContent}>
                      <div className={srStyles.modalItemTitle}>{city}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
