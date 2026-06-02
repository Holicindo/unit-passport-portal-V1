'use client';

import { useState, useEffect, useRef, DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import { unitApi } from '@/lib/api';
import { ArrowLeft, Loader2, Save, Wrench, HelpCircle, ShieldAlert, Upload, ImageIcon, X } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import DatePicker from '@/components/ui/DatePicker';
import styles from './new.module.css';

// Helper: Auto-categorize unit type based on model name keywords
function categorizeUnitType(name: string): string {
  const lower = name.toLowerCase();
  const showcaseKeywords = ['chiller', 'showcase', 'cooler', 'freezer', 'refrigerator', 'display', 'kulkas', 'pendingin'];
  if (showcaseKeywords.some(k => lower.includes(k))) return 'SHOWCASE';
  const mesinKeywords = ['mesin', 'machine', 'generator', 'compressor', 'pump', 'motor', 'mixer', 'grinder', 'oven'];
  if (mesinKeywords.some(k => lower.includes(k))) return 'MESIN';
  return 'SHOWCASE'; // Default
}

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

  // Technical Documents (Level 3 Partner Access)
  const [explodedViewUrl, setExplodedViewUrl] = useState('');
  const [circuitDiagramUrl, setCircuitDiagramUrl] = useState('');
  
  // Media upload states
  const [testRunFile, setTestRunFile] = useState<File | null>(null);
  const [testRunPreview, setTestRunPreview] = useState<string | null>(null);
  const [diagramFile, setDiagramFile] = useState<File | null>(null);
  const [diagramPreview, setDiagramPreview] = useState<string | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [dragActiveTestRun, setDragActiveTestRun] = useState(false);
  const [dragActiveDiagram, setDragActiveDiagram] = useState(false);
  const testRunInputRef = useRef<HTMLInputElement>(null);
  const diagramInputRef = useRef<HTMLInputElement>(null);

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
          const res = await fetch(`/api/clients`, {
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

  // Drag & Drop handlers
  const handleFileSelect = (file: File, type: 'testRun' | 'diagram') => {
    if (!file.type.startsWith('image/')) {
      setError('Hanya file gambar (JPG, PNG, WEBP) yang diperbolehkan.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Ukuran file maksimal 10MB.');
      return;
    }
    const preview = URL.createObjectURL(file);
    if (type === 'testRun') {
      setTestRunFile(file);
      setTestRunPreview(preview);
    } else {
      setDiagramFile(file);
      setDiagramPreview(preview);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, type: 'testRun' | 'diagram') => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'testRun') setDragActiveTestRun(false);
    else setDragActiveDiagram(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file, type);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, type: 'testRun' | 'diagram') => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'testRun') setDragActiveTestRun(true);
    else setDragActiveDiagram(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>, type: 'testRun' | 'diagram') => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'testRun') setDragActiveTestRun(false);
    else setDragActiveDiagram(false);
  };

  const removeFile = (type: 'testRun' | 'diagram') => {
    if (type === 'testRun') {
      if (testRunPreview) URL.revokeObjectURL(testRunPreview);
      setTestRunFile(null);
      setTestRunPreview(null);
    } else {
      if (diagramPreview) URL.revokeObjectURL(diagramPreview);
      setDiagramFile(null);
      setDiagramPreview(null);
    }
  };

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

    // Step 1: Upload media files if selected
    let testRunUrl: string | undefined;
    let diagramUrl: string | undefined;
    
    const filesToUpload: File[] = [];
    const fileLabels: ('testRun' | 'diagram')[] = [];
    if (testRunFile) { filesToUpload.push(testRunFile); fileLabels.push('testRun'); }
    if (diagramFile) { filesToUpload.push(diagramFile); fileLabels.push('diagram'); }

    if (filesToUpload.length > 0) {
      try {
        setUploadingMedia(true);
        const uploadRes = await unitApi.uploadMedia(filesToUpload);
        const uploadedFiles = uploadRes.data;
        fileLabels.forEach((label, idx) => {
          if (label === 'testRun') testRunUrl = uploadedFiles[idx]?.url;
          if (label === 'diagram') diagramUrl = uploadedFiles[idx]?.url;
        });
      } catch (err) {
        console.error('Upload media error:', err);
        setError('Gagal mengunggah gambar. Silakan coba lagi.');
        setLoading(false);
        setUploadingMedia(false);
        return;
      } finally {
        setUploadingMedia(false);
      }
    }

    // Step 2: Build perfect request payload exactly matching backend CreateUnitDto constraints
    const payload: any = {
      serial_number: serialNumber.trim(),
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
      test_run_image_url: testRunUrl || undefined,
      diagram_image_url: diagramUrl || undefined,
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

      {/* Mobile Submenu Pill Tabs */}
      <div className="mobile-sub-tabs">
        <button 
          className="mobile-sub-tab"
          onClick={() => router.push('/units')}
        >
          Daftar Unit
        </button>
        <button 
          className="mobile-sub-tab active"
          onClick={() => router.push('/units/new')}
        >
          Registrasi Unit
        </button>
      </div>

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

        {/* Section 2: Spesifikasi Teknis (Digital Twin Specs) */}
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

        {/* Section 4: Media & Verifikasi Pabrik */}
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>4. Media & Verifikasi Pabrik (Opsional)</h3>
          <div className={styles.dropZoneGrid}>
            {/* Test Run Photo */}
            <div className={styles.dropZoneWrapper}>
              <label>Foto Test Run & Quality Control</label>
              <div
                className={`${styles.dropZone} ${dragActiveTestRun ? styles.dropZoneActive : ''}`}
                onClick={() => testRunInputRef.current?.click()}
                onDrop={(e) => handleDrop(e, 'testRun')}
                onDragOver={(e) => handleDragOver(e, 'testRun')}
                onDragLeave={(e) => handleDragLeave(e, 'testRun')}
              >
                {testRunPreview ? (
                  <div className={styles.dropZonePreview}>
                    <img src={testRunPreview} alt="Test Run Preview" />
                    <button type="button" className={styles.dropZoneRemove} onClick={(e) => { e.stopPropagation(); removeFile('testRun'); }}>
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload size={32} className={styles.dropZoneIcon} />
                    <p className={styles.dropZoneText}>
                      <strong>Klik atau seret foto</strong> ke area ini<br/>
                      JPG, PNG, WEBP — Maks 10MB
                    </p>
                  </>
                )}
                <input
                  ref={testRunInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0], 'testRun'); }}
                />
              </div>
            </div>

            {/* Diagram / Blueprint */}
            <div className={styles.dropZoneWrapper}>
              <label>Diagram Sirkulasi / Cetak Biru Digital</label>
              <div
                className={`${styles.dropZone} ${dragActiveDiagram ? styles.dropZoneActive : ''}`}
                onClick={() => diagramInputRef.current?.click()}
                onDrop={(e) => handleDrop(e, 'diagram')}
                onDragOver={(e) => handleDragOver(e, 'diagram')}
                onDragLeave={(e) => handleDragLeave(e, 'diagram')}
              >
                {diagramPreview ? (
                  <div className={styles.dropZonePreview}>
                    <img src={diagramPreview} alt="Diagram Preview" />
                    <button type="button" className={styles.dropZoneRemove} onClick={(e) => { e.stopPropagation(); removeFile('diagram'); }}>
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <ImageIcon size={32} className={styles.dropZoneIcon} />
                    <p className={styles.dropZoneText}>
                      <strong>Klik atau seret diagram</strong> ke area ini<br/>
                      JPG, PNG, WEBP — Maks 10MB
                    </p>
                  </>
                )}
                <input
                  ref={diagramInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0], 'diagram'); }}
                />
              </div>
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
