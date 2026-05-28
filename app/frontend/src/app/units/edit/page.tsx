'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { unitApi } from '@/lib/api';
import { ArrowLeft, Loader2, Save, HelpCircle } from 'lucide-react';
import { categorizeUnitType } from '@/lib/utils';
import styles from '../../units/new/new.module.css';

function EditUnitForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const unitId = searchParams.get('id');

  // Core form states
  const [serialNumber, setSerialNumber] = useState('');
  const [modelName, setModelName] = useState('');
  const [unitType, setUnitType] = useState('SHOWCASE');

  // Showcase specs
  const [compressor, setCompressor] = useState('');
  const [refrigerant, setRefrigerant] = useState('');
  const [wattage, setWattage] = useState('');

  // Mesin specs
  const [dimension, setDimension] = useState('');
  const [power, setPower] = useState('');
  const [capacity, setCapacity] = useState('');

  // Technical Documents (Level 3 Partner Access)
  const [explodedViewUrl, setExplodedViewUrl] = useState('');
  const [circuitDiagramUrl, setCircuitDiagramUrl] = useState('');

  // Client & Warranty
  const [clients, setClients] = useState<any[]>([]);
  const [clientId, setClientId] = useState('');
  const [warrantyStatus, setWarrantyStatus] = useState('ACTIVE');
  const [warrantyExpiry, setWarrantyExpiry] = useState('');

  // UI
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Load clients list
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001'}/clients`, {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          const data = await res.json();
          if (Array.isArray(data)) setClients(data);
          else if (data && Array.isArray(data.data)) setClients(data.data);
        }
      } catch (e) {
        console.error('Failed to load clients:', e);
      }
    };
    fetchClients();
  }, []);

  // Load existing unit data
  useEffect(() => {
    if (!unitId) {
      setError('ID Unit tidak valid.');
      setFetching(false);
      return;
    }
    const fetchUnit = async () => {
      try {
        const { data } = await unitApi.findOne(unitId);
        const unit = data;
        setSerialNumber(unit.serial_number || '');
        setModelName(unit.model_name || '');
        const type = unit.specs?.type || (unit.specs?.dimension ? 'MESIN' : 'SHOWCASE');
        setUnitType(type);
        if (type === 'MESIN') {
          setDimension(unit.specs?.dimension || '');
          setPower(unit.specs?.power || '');
          setCapacity(unit.specs?.capacity || '');
        } else {
          setCompressor(unit.specs?.compressor || '');
          setRefrigerant(unit.specs?.refrigerant || '');
          setWattage(unit.specs?.wattage || '');
        }
        setClientId(unit.current_client?.id || '');
        setWarrantyStatus(unit.specs?.warranty_status || 'ACTIVE');
        if (unit.warranty_expiry) {
          setWarrantyExpiry(unit.warranty_expiry.substring(0, 10));
        }
        setExplodedViewUrl(unit.exploded_view_url || '');
        setCircuitDiagramUrl(unit.circuit_diagram_url || '');
      } catch (err: any) {
        setError('Gagal memuat data unit. Pastikan unit ini masih tersedia.');
      } finally {
        setFetching(false);
      }
    };
    fetchUnit();
  }, [unitId]);

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!modelName.trim()) {
      setError('Nama Model / Tipe Unit wajib diisi.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!clientId) {
      setError('Pilih Klien / Pemilik Resmi terlebih dahulu.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setIsConfirmModalOpen(true);
  };

  const handleActualSubmit = async () => {
    if (!unitId) return;
    setIsConfirmModalOpen(false);
    setLoading(true);
    setError(null);
    try {
      await unitApi.update(unitId, {
        model_name: modelName.trim(),
        current_client_id: clientId,
        specs: {
          type: unitType,
          ...(unitType === 'SHOWCASE' ? {
            compressor: compressor.trim() || undefined,
            refrigerant: refrigerant.trim() || undefined,
            wattage: wattage.trim() || undefined,
          } : {
            dimension: dimension.trim() || undefined,
            power: power.trim() || undefined,
            capacity: capacity.trim() || undefined,
          }),
          warranty_status: warrantyStatus,
        },
        warranty_expiry: warrantyExpiry || undefined,
        exploded_view_url: explodedViewUrl.trim() || undefined,
        circuit_diagram_url: circuitDiagramUrl.trim() || undefined,
      });
      router.push('/units');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message;
      if (Array.isArray(errorMsg)) setError(errorMsg.join(' | '));
      else setError(errorMsg || 'Gagal memperbarui unit. Silakan cek data Anda.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className={styles.container} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 size={40} className={styles.spin} style={{ color: 'var(--color-cobalt-blue)' }} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.pageHeader}>
        <button onClick={() => router.push('/units')} className={styles.backBtn}>
          <ArrowLeft size={16} />
          <span>Kembali</span>
        </button>
        <div>
          <h2 className={styles.title}>Edit Unit: {serialNumber}</h2>
          <p className={styles.subtitle}>Perbarui data spesifikasi dan informasi unit digital twin.</p>
        </div>
      </header>

      <form onSubmit={handlePreSubmit} autoComplete="off" className={styles.formCard}>
        {error && <div className={styles.errorAlert}>{error}</div>}

        {/* Section 1: Data Utama */}
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>1. Data Utama Unit</h3>
          <div className={styles.grid}>
            <div className={styles.formGroup}>
              <label>Nomor Seri Mesin (Serial Number)</label>
              <input
                type="text"
                value={serialNumber}
                disabled
                style={{ opacity: 0.5, cursor: 'not-allowed', background: '#f5f5f5' }}
              />
              <small style={{ color: 'var(--color-space-grey)', fontSize: '0.75rem', marginTop: '4px' }}>
                Serial Number tidak dapat diubah setelah registrasi.
              </small>
            </div>
            <div className={styles.formGroup}>
              <label>Nama Model / Tipe Unit *</label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => {
                  const newName = e.target.value;
                  setModelName(newName);
                  setUnitType(categorizeUnitType(newName));
                }}
                placeholder="Contoh: Undercounter Chiller B610"
                autoComplete="new-password"
                required
              />
            </div>
          </div>
        </div>

        {/* Section 2: Spesifikasi Teknis */}
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>2. Spesifikasi Teknis (Digital Twin Specs)</h3>

          <div className={styles.formGroup} style={{ marginBottom: '20px', maxWidth: '300px' }}>
            <label>Kategori / Jenis Unit *</label>
            <select
              value={unitType}
              onChange={(e) => setUnitType(e.target.value)}
              style={{ background: '#FFF', border: '1.5px solid var(--color-cobalt-blue)', fontWeight: 700 }}
            >
              <option value="SHOWCASE">SHOWCASE / REFRIGERATOR</option>
              <option value="MESIN">MESIN / MACHINERY & EQUIPMENT</option>
            </select>
          </div>

          {unitType === 'SHOWCASE' ? (
            <div className={styles.grid3}>
              <div className={styles.formGroup}>
                <label>Kompresor / Compressor</label>
                <input type="text" value={compressor} onChange={(e) => setCompressor(e.target.value)} placeholder="Contoh: Embraco 1/2 HP" />
              </div>
              <div className={styles.formGroup}>
                <label>Refrigeran / Refrigerant</label>
                <input type="text" value={refrigerant} onChange={(e) => setRefrigerant(e.target.value)} placeholder="Contoh: R290 (Eco-Friendly)" />
              </div>
              <div className={styles.formGroup}>
                <label>Daya / Wattage</label>
                <input type="text" value={wattage} onChange={(e) => setWattage(e.target.value)} placeholder="Contoh: 450W" />
              </div>
            </div>
          ) : (
            <div className={styles.grid3}>
              <div className={styles.formGroup}>
                <label>Dimensi / Dimension</label>
                <input type="text" value={dimension} onChange={(e) => setDimension(e.target.value)} placeholder="Contoh: 1200 x 750 x 850 mm" />
              </div>
              <div className={styles.formGroup}>
                <label>Power (Daya Listrik)</label>
                <input type="text" value={power} onChange={(e) => setPower(e.target.value)} placeholder="Contoh: 220V/50Hz / 1500W" />
              </div>
              <div className={styles.formGroup}>
                <label>Kapasitas / Capacity</label>
                <input type="text" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="Contoh: 500 Liter atau 20 kg/jam" />
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Kepemilikan & Garansi */}
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>3. Kepemilikan &amp; Garansi</h3>
          <div className={styles.grid3}>
            <div className={styles.formGroup}>
              <label>Klien / Pemilik Resmi *</label>
              <select value={clientId} onChange={(e) => setClientId(e.target.value)} required>
                <option value="">— Pilih Klien —</option>
                {Array.isArray(clients) && clients.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.company_name} ({c.bp_code})</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Status Garansi</label>
              <select value={warrantyStatus} onChange={(e) => setWarrantyStatus(e.target.value)}>
                <option value="ACTIVE">ACTIVE (Garansi Berlaku)</option>
                <option value="EXPIRED">EXPIRED (Garansi Habis)</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Tanggal Habis Garansi</label>
              <input type="date" value={warrantyExpiry} onChange={(e) => setWarrantyExpiry(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Section 4: Dokumen Teknis */}
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>4. Dokumen Teknis (Level 3 Partner Access)</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-space-grey)', marginBottom: '16px', marginTop: '-8px' }}>
            Dokumen berikut hanya dapat diakses oleh pengguna dengan level Partner dan Admin. Masukkan URL langsung ke file PDF atau gambar.
          </p>
          <div className={styles.grid}>
            <div className={styles.formGroup}>
              <label>URL Exploded View (PDF/Gambar)</label>
              <input
                type="url"
                value={explodedViewUrl}
                onChange={(e) => setExplodedViewUrl(e.target.value)}
                placeholder="https://example.com/exploded-view.pdf"
                autoComplete="off"
              />
            </div>
            <div className={styles.formGroup}>
              <label>URL Wiring / Circuit Diagram (PDF/Gambar)</label>
              <input
                type="url"
                value={circuitDiagramUrl}
                onChange={(e) => setCircuitDiagramUrl(e.target.value)}
                placeholder="https://example.com/circuit-diagram.pdf"
                autoComplete="off"
              />
            </div>
          </div>
        </div>

        <div className={styles.actionRow}>
          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? (
              <>
                <Loader2 size={18} className={styles.spin} />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span>Simpan Perubahan</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalIcon}>
              <HelpCircle size={32} />
            </div>
            <h3 className={styles.modalTitle}>Konfirmasi Perubahan</h3>
            <p className={styles.modalDescription}>
              Simpan perubahan untuk unit <strong>{serialNumber}</strong>? Pastikan semua data sudah benar sebelum menyimpan.
            </p>
            <div className={styles.modalActionRow}>
              <button type="button" onClick={() => setIsConfirmModalOpen(false)} className={styles.cancelBtn}>
                Batal
              </button>
              <button type="button" onClick={handleActualSubmit} className={styles.confirmBtn}>
                Ya, Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EditUnitPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Memuat editor...</div>}>
      <EditUnitForm />
    </Suspense>
  );
}
