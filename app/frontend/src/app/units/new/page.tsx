'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { unitApi } from '@/lib/api';
import { ArrowLeft, Loader2, Save, Wrench, HelpCircle, ShieldAlert } from 'lucide-react';
import styles from './new.module.css';

export default function RegisterUnitPage() {
  const router = useRouter();
  
  // Core form states
  const [serialNumber, setSerialNumber] = useState('');
  const [modelName, setModelName] = useState('');
  
  // Specs states
  const [unitType, setUnitType] = useState('SHOWCASE');
  // Specs for Showcase
  const [compressor, setCompressor] = useState('');
  const [refrigerant, setRefrigerant] = useState('');
  const [wattage, setWattage] = useState('');
  // Specs for Mesin
  const [dimension, setDimension] = useState('');
  const [power, setPower] = useState('');
  const [capacity, setCapacity] = useState('');
  
  // Client and Warranty states
  const [clients, setClients] = useState<any[]>([]);
  const [clientId, setClientId] = useState('');
  const [warrantyStatus, setWarrantyStatus] = useState('ACTIVE');
  const [warrantyExpiry, setWarrantyExpiry] = useState('');
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Load clients list on mount
  useEffect(() => {
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
          }
        }
      } catch (e) {
        console.error('Failed to load clients:', e);
      }
    };
    fetchClients();
  }, []);

  // Intercept form submit to perform client-side validation and trigger custom modal
  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Strict Client-side validations
    if (!serialNumber.trim()) {
      setError('Nomor Seri Mesin (Serial Number) wajib diisi.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!modelName.trim()) {
      setError('Nama Model / Tipe Unit wajib diisi.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!clientId) {
      setError('Pilih Klien / Pemilik Resmi terlebih dahulu. Setiap unit digital twin wajib dihubungkan dengan Klien.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Open custom confirmation modal if valid
    setIsConfirmModalOpen(true);
  };

  // Perform actual API submission once user confirms in custom modal
  const handleActualSubmit = async () => {
    setIsConfirmModalOpen(false);
    setLoading(true);
    setError(null);

    // Build perfect request payload exactly matching backend CreateUnitDto constraints
    const payload = {
      serial_number: serialNumber.trim(),
      model_name: modelName.trim(),
      current_client_id: clientId, // UUID string stringently expected by NestJS
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
      // warranty_expiry must sit at top-level of the body as defined in CreateUnitDto
      warranty_expiry: warrantyExpiry || undefined
    };

    try {
      await unitApi.create(payload);
      router.push('/units');
    } catch (err: any) {
      console.error('Submit unit error:', err);
      // Clean backend array validator error messages for extreme UI legibility
      const errorMsg = err.response?.data?.message;
      if (Array.isArray(errorMsg)) {
        setError(errorMsg.join(' | '));
      } else {
        setError(errorMsg || 'Gagal mendaftarkan unit baru. Silakan cek data Anda.');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.pageHeader}>
        <button onClick={() => router.push('/units')} className={styles.backBtn}>
          <ArrowLeft size={16} />
          <span>Kembali</span>
        </button>
        <div>
          <h2 className={styles.title}>Registrasi Unit Baru</h2>
          <p className={styles.subtitle}>Mendaftarkan aset mesin digital twin baru ke ekosistem Holicindo.</p>
        </div>
      </header>

      <form onSubmit={handlePreSubmit} autoComplete="off" className={styles.formCard}>
        {error && <div className={styles.errorAlert}>{error}</div>}
        
        {/* Section 1: Data Utama */}
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>1. Data Utama Unit</h3>
          <div className={styles.grid}>
            <div className={styles.formGroup}>
              <label>Nomor Seri Mesin (Serial Number) *</label>
              <input 
                type="text" 
                value={serialNumber} 
                onChange={(e) => setSerialNumber(e.target.value)} 
                placeholder="Contoh: HD1910010208"
                autoComplete="new-password"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Nama Model / Tipe Unit *</label>
              <input 
                type="text" 
                value={modelName} 
                onChange={(e) => setModelName(e.target.value)} 
                placeholder="Contoh: Undercounter Chiller B610"
                autoComplete="new-password"
                required
              />
            </div>
          </div>
        </div>

        {/* Section 2: Spesifikasi Teknis (Digital Twin Specs) */}
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
                <input 
                  type="text" 
                  value={compressor} 
                  onChange={(e) => setCompressor(e.target.value)} 
                  placeholder="Contoh: Embraco 1/2 HP"
                  autoComplete="new-password"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Refrigeran / Refrigerant</label>
                <input 
                  type="text" 
                  value={refrigerant} 
                  onChange={(e) => setRefrigerant(e.target.value)} 
                  placeholder="Contoh: R290 (Eco-Friendly)"
                  autoComplete="new-password"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Daya / Wattage</label>
                <input 
                  type="text" 
                  value={wattage} 
                  onChange={(e) => setWattage(e.target.value)} 
                  placeholder="Contoh: 450W"
                  autoComplete="new-password"
                />
              </div>
            </div>
          ) : (
            <div className={styles.grid3}>
              <div className={styles.formGroup}>
                <label>Dimensi / Dimension *</label>
                <input 
                  type="text" 
                  value={dimension} 
                  onChange={(e) => setDimension(e.target.value)} 
                  placeholder="Contoh: 1200 x 750 x 850 mm"
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Power (Daya Listrik) *</label>
                <input 
                  type="text" 
                  value={power} 
                  onChange={(e) => setPower(e.target.value)} 
                  placeholder="Contoh: 220V/50Hz / 1500W"
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Kapasitas / Capacity *</label>
                <input 
                  type="text" 
                  value={capacity} 
                  onChange={(e) => setCapacity(e.target.value)} 
                  placeholder="Contoh: 500 Liter atau 20 kg/jam"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Kepemilikan & Garansi */}
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>3. Kepemilikan & Garansi</h3>
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
              <input 
                type="date" 
                value={warrantyExpiry} 
                onChange={(e) => setWarrantyExpiry(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>
        </div>

        <div className={styles.actionRow}>
          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? (
              <>
                <Loader2 size={18} className={styles.spin} />
                <span>Mendaftarkan...</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span>Simpan & Daftarkan Unit</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Elegant Custom Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalIcon}>
              <HelpCircle size={32} />
            </div>
            <h3 className={styles.modalTitle}>Konfirmasi Registrasi</h3>
            <p className={styles.modalDescription}>
              Apakah Anda yakin ingin mendaftarkan unit dengan nomor seri <strong>{serialNumber}</strong>? Pastikan seluruh data spesifikasi teknis dan kepemilikan sudah benar.
            </p>
            <div className={styles.modalActionRow}>
              <button 
                type="button" 
                onClick={() => setIsConfirmModalOpen(false)} 
                className={styles.cancelBtn}
              >
                Batal
              </button>
              <button 
                type="button" 
                onClick={handleActualSubmit} 
                className={styles.confirmBtn}
              >
                Ya, Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
