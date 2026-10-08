'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { unitApi, healthScoreApi } from '@/lib/api';
import { ArrowLeft, Loader2, Save, HelpCircle, HeartPulse, RefreshCw } from 'lucide-react';
import { categorizeUnitType } from '@/lib/utils';
import { CustomSelect } from '@/components/ui/CustomSelect';
import DatePicker from '@/components/ui/DatePicker';
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

  // IoT Calibration & Health Score V2 Settings
  const [targetTempMin, setTargetTempMin] = useState<string>('-2');
  const [targetTempMax, setTargetTempMax] = useState<string>('10');
  const [compressorNormalAmpere, setCompressorNormalAmpere] = useState<string>('1.5');
  const [ampereTolerance, setAmpereTolerance] = useState<string>('0.3');
  const [calTempCabinetOffset, setCalTempCabinetOffset] = useState<string>('0');
  const [calTempEvapOffset, setCalTempEvapOffset] = useState<string>('0');
  const [calTempCondenserOffset, setCalTempCondenserOffset] = useState<string>('0');
  const [calVoltageOffset, setCalVoltageOffset] = useState<string>('0');
  const [calPowerSlope, setCalPowerSlope] = useState<string>('1');
  const [calculatingScore, setCalculatingScore] = useState(false);
  const [scoreNotification, setScoreNotification] = useState<string | null>(null);

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
          const res = await fetch(`/api/clients`, {
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

        // Populate calibration settings
        if (unit.target_temp_min !== null && unit.target_temp_min !== undefined) setTargetTempMin(String(unit.target_temp_min));
        if (unit.target_temp_max !== null && unit.target_temp_max !== undefined) setTargetTempMax(String(unit.target_temp_max));
        if (unit.compressor_normal_ampere !== null && unit.compressor_normal_ampere !== undefined) setCompressorNormalAmpere(String(unit.compressor_normal_ampere));
        if (unit.ampere_tolerance !== null && unit.ampere_tolerance !== undefined) setAmpereTolerance(String(unit.ampere_tolerance));
        if (unit.cal_temp_cabinet_offset !== null && unit.cal_temp_cabinet_offset !== undefined) setCalTempCabinetOffset(String(unit.cal_temp_cabinet_offset));
        if (unit.cal_temp_evap_offset !== null && unit.cal_temp_evap_offset !== undefined) setCalTempEvapOffset(String(unit.cal_temp_evap_offset));
        if (unit.cal_temp_condenser_offset !== null && unit.cal_temp_condenser_offset !== undefined) setCalTempCondenserOffset(String(unit.cal_temp_condenser_offset));
        if (unit.cal_voltage_offset !== null && unit.cal_voltage_offset !== undefined) setCalVoltageOffset(String(unit.cal_voltage_offset));
        if (unit.cal_power_slope !== null && unit.cal_power_slope !== undefined) setCalPowerSlope(String(unit.cal_power_slope));
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

      // Update IoT Calibration & Compressor baseline
      await unitApi.updateCalibration(unitId, {
        target_temp_min: targetTempMin ? parseFloat(targetTempMin) : undefined,
        target_temp_max: targetTempMax ? parseFloat(targetTempMax) : undefined,
        compressor_normal_ampere: compressorNormalAmpere ? parseFloat(compressorNormalAmpere) : undefined,
        ampere_tolerance: ampereTolerance ? parseFloat(ampereTolerance) : undefined,
        cal_temp_cabinet_offset: calTempCabinetOffset ? parseFloat(calTempCabinetOffset) : 0,
        cal_temp_evap_offset: calTempEvapOffset ? parseFloat(calTempEvapOffset) : 0,
        cal_temp_condenser_offset: calTempCondenserOffset ? parseFloat(calTempCondenserOffset) : 0,
        cal_voltage_offset: calVoltageOffset ? parseFloat(calVoltageOffset) : 0,
        cal_power_slope: calPowerSlope ? parseFloat(calPowerSlope) : 1,
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

  const handleTriggerHealthScore = async () => {
    if (!unitId) return;
    setCalculatingScore(true);
    setScoreNotification(null);
    try {
      // Simpan kalibrasi dulu sebelum hitung
      await unitApi.updateCalibration(unitId, {
        target_temp_min: targetTempMin ? parseFloat(targetTempMin) : undefined,
        target_temp_max: targetTempMax ? parseFloat(targetTempMax) : undefined,
        compressor_normal_ampere: compressorNormalAmpere ? parseFloat(compressorNormalAmpere) : undefined,
        ampere_tolerance: ampereTolerance ? parseFloat(ampereTolerance) : undefined,
        cal_temp_cabinet_offset: calTempCabinetOffset ? parseFloat(calTempCabinetOffset) : 0,
        cal_temp_evap_offset: calTempEvapOffset ? parseFloat(calTempEvapOffset) : 0,
        cal_temp_condenser_offset: calTempCondenserOffset ? parseFloat(calTempCondenserOffset) : 0,
        cal_voltage_offset: calVoltageOffset ? parseFloat(calVoltageOffset) : 0,
        cal_power_slope: calPowerSlope ? parseFloat(calPowerSlope) : 1,
      });

      const { data } = await healthScoreApi.triggerByUnitId(unitId);
      const score = data?.data?.overall_score ?? data?.overall_score;
      setScoreNotification(
        `✅ Skor kesehatan berhasil dihitung ulang: ${score !== undefined ? Number(score).toFixed(1) : 'Sukses'}!`
      );
    } catch (e: any) {
      setScoreNotification(`❌ Gagal menghitung skor: ${e.response?.data?.message || e.message}`);
    } finally {
      setCalculatingScore(false);
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
            <CustomSelect
              value={unitType}
              onChange={(val) => setUnitType(val)}
              options={[
                { value: 'SHOWCASE', label: 'SHOWCASE / REFRIGERATOR' },
                { value: 'MESIN', label: 'MESIN / MACHINERY & EQUIPMENT' }
              ]}
            />
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
              <CustomSelect 
                value={clientId} 
                onChange={(val) => setClientId(val)}
                options={[
                  { value: '', label: '— Pilih Klien —' },
                  ...(Array.isArray(clients) ? clients.map((c: any) => ({
                    value: c.id,
                    label: `${c.company_name} (${c.bp_code})`
                  })) : [])
                ]}
                placeholder="— Pilih Klien —"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Status Garansi</label>
              <CustomSelect 
                value={warrantyStatus} 
                onChange={(val) => setWarrantyStatus(val)}
                options={[
                  { value: 'ACTIVE', label: 'ACTIVE (Garansi Berlaku)' },
                  { value: 'EXPIRED', label: 'EXPIRED (Garansi Habis)' }
                ]}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Tanggal Habis Garansi</label>
              <DatePicker
                value={warrantyExpiry}
                onChange={(v) => setWarrantyExpiry(v)}
                theme="light"
              />
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

        {/* Section 5: Kalibrasi & Ambang Batas Sensor IoT (Health Score V2) */}
        <div className={styles.formSection} style={{ border: '1px solid #E2E8F0', background: '#F8FAFC', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 className={styles.sectionTitle} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#1E293B' }}>
              <HeartPulse size={20} style={{ color: '#E11D48' }} />
              5. Kalibrasi Sensor &amp; Ambang Batas Kompresor
            </h3>
            <button
              type="button"
              onClick={handleTriggerHealthScore}
              disabled={calculatingScore}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#0284C7',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: calculatingScore ? 'not-allowed' : 'pointer',
              }}
            >
              <RefreshCw size={14} className={calculatingScore ? styles.spin : ''} />
              {calculatingScore ? 'Menghitung Skor...' : 'Hitung Ulang Health Score'}
            </button>
          </div>

          {scoreNotification && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '0.85rem',
                background: scoreNotification.startsWith('✅') ? '#DCFCE7' : '#FEE2E2',
                color: scoreNotification.startsWith('✅') ? '#166534' : '#991B1B',
              }}
            >
              {scoreNotification}
            </div>
          )}

          <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '16px' }}>
            Atur parameter rentang suhu dan arus listrik spesifik untuk model unit ini. Perhitungan Health Score V2 akan otomatis menyesuaikan dengan profil ini.
          </p>

          <h4 style={{ fontSize: '0.9rem', color: '#334155', margin: '12px 0 8px 0' }}>Ambang Batas Suhu &amp; Arus Kompresor</h4>
          <div className={styles.grid}>
            <div className={styles.formGroup}>
              <label>Target Suhu Min Kabinet (°C)</label>
              <input
                type="number"
                step="0.5"
                value={targetTempMin}
                onChange={(e) => setTargetTempMin(e.target.value)}
                placeholder="Contoh: -2.0"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Target Suhu Max Kabinet (°C)</label>
              <input
                type="number"
                step="0.5"
                value={targetTempMax}
                onChange={(e) => setTargetTempMax(e.target.value)}
                placeholder="Contoh: 10.0"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Arus Normal Kompresor (Ampere)</label>
              <input
                type="number"
                step="0.1"
                value={compressorNormalAmpere}
                onChange={(e) => setCompressorNormalAmpere(e.target.value)}
                placeholder="Contoh: 1.5"
              />
              <small style={{ color: '#64748B', fontSize: '0.75rem' }}>Arus rata-rata saat kompresor menyala</small>
            </div>
            <div className={styles.formGroup}>
              <label>Toleransi Anomali Arus (± Ampere)</label>
              <input
                type="number"
                step="0.05"
                value={ampereTolerance}
                onChange={(e) => setAmpereTolerance(e.target.value)}
                placeholder="Contoh: 0.3"
              />
              <small style={{ color: '#64748B', fontSize: '0.75rem' }}>Penyimpangan di luar batas ini memicu penalti</small>
            </div>
          </div>

          <h4 style={{ fontSize: '0.9rem', color: '#334155', margin: '16px 0 8px 0' }}>Offset Kalibrasi Sensor Fisik (1-Point Offset)</h4>
          <div className={styles.grid3}>
            <div className={styles.formGroup}>
              <label>Offset Suhu Kabinet (°C)</label>
              <input
                type="number"
                step="0.1"
                value={calTempCabinetOffset}
                onChange={(e) => setCalTempCabinetOffset(e.target.value)}
                placeholder="0.0"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Offset Suhu Evaporator (°C)</label>
              <input
                type="number"
                step="0.1"
                value={calTempEvapOffset}
                onChange={(e) => setCalTempEvapOffset(e.target.value)}
                placeholder="0.0"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Offset Suhu Kondensor (°C)</label>
              <input
                type="number"
                step="0.1"
                value={calTempCondenserOffset}
                onChange={(e) => setCalTempCondenserOffset(e.target.value)}
                placeholder="0.0"
              />
            </div>
          </div>

          <div className={styles.grid} style={{ marginTop: '8px' }}>
            <div className={styles.formGroup}>
              <label>Offset Tegangan Listrik (Volt)</label>
              <input
                type="number"
                step="1"
                value={calVoltageOffset}
                onChange={(e) => setCalVoltageOffset(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Faktor Pengali Daya (Slope Watt)</label>
              <input
                type="number"
                step="0.05"
                value={calPowerSlope}
                onChange={(e) => setCalPowerSlope(e.target.value)}
                placeholder="1.0"
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
