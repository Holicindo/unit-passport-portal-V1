'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { unitApi, reportApi } from '@/lib/api';
import { Save, Camera, ArrowLeft, Loader2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import InspectionReportTemplate from '@/components/reports/InspectionReportTemplate';
import styles from './inspection.module.css';

const WORKS_ITEMS = [
  "Pemasangan Lampu",
  "Pemasangan Kelistrikan",
  "Pemasangan Heater",
  "Pemasangan Unit System",
  "Pengelasan Unit System",
  "Pengelasan Body",
  "Perakitan Rangka Body",
  "Pemasangan Mechanical"
];

export default function InspectionForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [allUnits, setAllUnits]   = useState<any[]>([]);
  const [unit, setUnit]           = useState<any>(null);
  const [loading, setLoading]     = useState(false);
  const [isConfirm, setIsConfirm] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [reportId,  setReportId]  = useState('');
  const [photos, setPhotos]       = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  // Initialize form state
  const [form, setForm] = useState<any>({
    header:     { order_document: '', production_code: '', starting_date: '', finishing_date: '' },
    dimensions: {
      body: { panjang: '', lebar: '', tinggi: '' },
      kaca: { depan: '', samping: '', atas: '', pintu: '', tingkatan: '' },
    },
    visual_checks: {
      external: Array(13).fill(''),
      internal: Array(6).fill('')
    },
    performance: {
      grounding:          { value: '', result: '', remarks: '' },
      insulation:         { value: '', result: '', remarks: '' },
      leakage:            { value: '', result: '', remarks: '' },
      voltage_test:       { value: '', result: '', remarks: '' },
      exterior_temp:      { value: '', result: '', remarks: '' },
      cooling_time:       { value: '', result: '', remarks: '' },
      cabinet_temp_range: { value: '', result: '', remarks: '' },
      temp_variation:     { value: '', result: '', remarks: '' },
      noise:              { value: '', result: '', remarks: '' },
      power_rating:       { value: '', result: '', remarks: '' },
      temp_report:        { value: '', result: '', remarks: '' },
    },
    works: WORKS_ITEMS.map(label => ({ label, name: '', time: '' })),
    footer: { color: '', length: '', light: '', notes: '' },
  });

  // Load units for dropdown
  useEffect(() => {
    unitApi.findAll(1, 1000)
      .then(({ data }) => setAllUnits(Array.isArray(data) ? data[0] : (data.data || [])))
      .catch(() => {});
  }, []);

  const handleUnitSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = allUnits.find((u: any) => u.id === e.target.value);
    setUnit(selected || null);
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const newPhotos = [...photos, ...files].slice(0, 6);
    setPhotos(newPhotos);
    setPhotoUrls(newPhotos.map(file => URL.createObjectURL(file)));
  };

  const removePhoto = (index: number) => {
    const updatedPhotos = [...photos];
    updatedPhotos.splice(index, 1);
    setPhotos(updatedPhotos);
    
    const updatedUrls = [...photoUrls];
    updatedUrls.splice(index, 1);
    setPhotoUrls(updatedUrls);
  };

  const handleSubmit = async () => {
    if (!unit) return alert('Pilih unit terlebih dahulu!');
    setLoading(true);
    try {
      // Upload documentation photos if present
      let uploadedUrls: string[] = [];
      if (photos.length > 0) {
        try {
          const { data: uploadRes } = await reportApi.uploadPhotos(photos);
          uploadedUrls = Array.isArray(uploadRes) ? uploadRes : [];
        } catch (uploadErr) {
          console.error("Gagal mengunggah foto:", uploadErr);
        }
      }

      const payload = { 
        unitId: unit.id, 
        form_type: 'INSPECTION',
        data: form, 
        photo_urls: uploadedUrls 
      };
      
      const { data } = await reportApi.create(payload);
      setReportId(data?.id || '');
      setIsConfirm(false);
      setIsSuccess(true);
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan Laporan. Periksa koneksi server backend Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <button className={styles.backBtn} onClick={() => router.back()}><ArrowLeft size={16} /></button>
        <h1 className={styles.title}>NEW INSPECTION REPORT</h1>
      </div>

      {/* Unit Selector Bar */}
      <div className={styles.unitBar}>
        <div className={styles.unitBarInner}>
          <div className={styles.unitField}>
            <label>PILIH UNIT YANG DIINSPEKSI</label>
            <select onChange={handleUnitSelect} defaultValue="">
              <option value="" disabled>— Pilih Serial Number Unit —</option>
              {allUnits.map((u: any) => (
                <option key={u.id} value={u.id}>{u.serial_number} – {u.model_name}</option>
              ))}
            </select>
          </div>
          {unit && (
            <div className={styles.unitInfo}>
              <span><strong>Serial Number:</strong> {unit.serial_number}</span>
              <span><strong>Model Unit:</strong> {unit.model_name}</span>
              <span><strong>Pelanggan:</strong> {unit.current_client?.company_name || 'INTERNAL / STOCK'}</span>
              <span><strong>Kategori:</strong> {unit.specs?.category || 'N/A'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Shared Interactive Sheet Layout (Single Source of Truth) */}
      <div className={styles.sheetContainer}>
        <InspectionReportTemplate
          mode="edit"
          data={form}
          unit={unit}
          onChange={setForm}
        />
      </div>

      {/* Photo documentation bar */}
      <div className={styles.photoBar}>
        <div className={styles.sectionHeader}>
          <h3>Dokumentasi Foto Lapangan (Max 6 Foto)</h3>
        </div>
        <div className={styles.photoGallery}>
          {photoUrls.map((url, index) => (
            <div key={`photo-${index}`} className={styles.photoItem}>
              <img src={url} alt={`Inspection Photo ${index + 1}`} />
              <button className={styles.removePhotoBtn} onClick={() => removePhoto(index)}>×</button>
            </div>
          ))}
          {photoUrls.length < 6 && (
            <div className={styles.addPhotoCard} onClick={() => fileInputRef.current?.click()}>
              <Camera size={20} />
              <span>Tambah Foto</span>
              <small>Format JPG/PNG</small>
            </div>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={handlePhoto} />
      </div>

      {/* Save Button Footer */}
      <div className={styles.formFooter}>
        <button className={styles.saveBtn} onClick={() => setIsConfirm(true)} disabled={loading || !unit}>
          {loading ? <Loader2 size={14} className={styles.spinner} /> : <Save size={14} />}
          Simpan Laporan & Selesai
        </button>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isConfirm}
        onClose={() => setIsConfirm(false)}
        onConfirm={handleSubmit}
        title="Simpan Laporan Inspeksi?"
        message={`Pastikan semua data inspeksi telah benar dan sesuai dengan kondisi fisik unit.\n\nUnit Serial: ${unit?.serial_number || '-'}\nModel: ${unit?.model_name || '-'}`}
        type="confirm"
        confirmText={loading ? 'Menyimpan...' : 'Ya, Simpan'}
        cancelText="Batal"
      />

      {/* Success Modal */}
      <Modal
        isOpen={isSuccess}
        onClose={() => router.push('/reports/history')}
        title="Laporan QC Berhasil Disimpan!"
        message={`Laporan inspeksi untuk serial number ${unit?.serial_number} telah berhasil dicatat ke dalam unit passport. Anda sekarang dapat mencetak PDF laporan langsung dari riwayat.`}
        type="success"
      />
    </div>
  );
}
