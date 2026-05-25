'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { unitApi, reportApi } from '@/lib/api';
import { Save, Camera, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { CustomSelect } from '@/components/ui/CustomSelect';
import InspectionReportForm from '@/components/reports/InspectionReportForm';
import InspectionReportTemplate from '@/components/reports/InspectionReportTemplate';
import styles from './inspection.module.css';

const WORKS_ITEMS = [
  'Pemasangan Lampu', 'Pemasangan Kelistrikan', 'Pemasangan Heater',
  'Pemasangan Unit System', 'Pengelasan Unit System', 'Pengelasan Body',
  'Perakitan Rangka Body', 'Pemasangan Mechanical'
];

const EMPTY_FORM = {
  header: { order_document: '', production_code: '', starting_date: '', finishing_date: '' },
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
};

export default function InspectionFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('editId');
  const isEditMode = !!editId;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [allUnits, setAllUnits]       = useState<any[]>([]);
  const [unit, setUnit]               = useState<any>(null);
  const [loading, setLoading]         = useState(false);
  const [loadingData, setLoadingData] = useState(isEditMode);
  const [isConfirm, setIsConfirm]     = useState(false);
  const [isSuccess, setIsSuccess]     = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [photos, setPhotos]           = useState<File[]>([]);
  const [photoUrls, setPhotoUrls]     = useState<string[]>([]);
  const [form, setForm]               = useState<any>(EMPTY_FORM);

  // Load units list
  useEffect(() => {
    unitApi.findAll(1, 1000)
      .then(({ data }) => setAllUnits(Array.isArray(data) ? data[0] : (data.data || [])))
      .catch(() => {});
  }, []);

  // Load existing report data when editing
  useEffect(() => {
    if (!editId) return;
    setLoadingData(true);
    reportApi.findOne(editId)
      .then(({ data }) => {
        if (data) {
          // Deep merge: preserve all existing data, fill missing keys from EMPTY_FORM
          const existing = data.data || {};
          setForm({
            ...EMPTY_FORM,
            ...existing,
            header: { ...EMPTY_FORM.header, ...(existing.header || {}) },
            dimensions: {
              body: { ...EMPTY_FORM.dimensions.body, ...(existing.dimensions?.body || {}) },
              kaca: { ...EMPTY_FORM.dimensions.kaca, ...(existing.dimensions?.kaca || {}) },
            },
            visual_checks: {
              external: existing.visual_checks?.external || Array(13).fill(''),
              internal: existing.visual_checks?.internal || Array(6).fill(''),
            },
            performance: { ...EMPTY_FORM.performance, ...(existing.performance || {}) },
            works: existing.works || EMPTY_FORM.works,
            footer: { ...EMPTY_FORM.footer, ...(existing.footer || {}) },
          });
          setUnit(data.unit || null);
        }
      })
      .catch(err => {
        console.error('Gagal memuat data laporan:', err);
        alert('Gagal memuat data laporan yang akan diedit.');
      })
      .finally(() => setLoadingData(false));
  }, [editId]);

  const handleUnitSelect = (val: string) => {
    const selected = allUnits.find((u: any) => u.id === val);
    setUnit(selected || null);
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const newPhotos = [...photos, ...files].slice(0, 6);
    setPhotos(newPhotos);
    setPhotoUrls(newPhotos.map(f => URL.createObjectURL(f)));
  };

  const removePhoto = (i: number) => {
    const p = [...photos]; p.splice(i, 1); setPhotos(p);
    const u = [...photoUrls]; u.splice(i, 1); setPhotoUrls(u);
  };

  const handleSubmit = async () => {
    if (!unit) return alert('Pilih unit terlebih dahulu!');
    setLoading(true);
    try {
      let uploadedUrls: string[] = [];
      if (photos.length > 0) {
        try {
          const { data: uploadRes } = await reportApi.uploadPhotos(photos);
          uploadedUrls = Array.isArray(uploadRes) ? uploadRes : [];
        } catch {}
      }

      if (isEditMode && editId) {
        // UPDATE existing report
        await reportApi.update(editId, {
          data: form,
          ...(uploadedUrls.length > 0 ? { photo_urls: uploadedUrls } : {})
        });
      } else {
        // CREATE new report
        await reportApi.create({
          unitId: unit.id,
          form_type: 'INSPECTION',
          data: form,
          photo_urls: uploadedUrls
        });
      }

      setIsConfirm(false);
      setIsSuccess(true);
    } catch (err) {
      alert('Gagal menyimpan Laporan. Periksa koneksi server backend Anda.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className={styles.pageWrapper} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: '#475569' }}>
          <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
          <p style={{ fontWeight: 600 }}>Memuat data laporan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <button className={styles.backBtn} onClick={() => router.back()}><ArrowLeft size={16} /></button>
        <h1 className={styles.title}>
          {isEditMode ? 'EDIT INSPECTION REPORT' : 'NEW INSPECTION REPORT'}
        </h1>
        <div style={{ marginLeft: 'auto' }}>
          <button
            className={showPreview ? styles.previewBtnActive : styles.previewBtn}
            onClick={() => setShowPreview(v => !v)}
          >
            {showPreview ? <><EyeOff size={15} /> Kembali ke Form</> : <><Eye size={15} /> Preview Laporan</>}
          </button>
        </div>
      </div>

      {/* Unit Selector */}
      <div className={styles.unitBar}>
        <div className={styles.unitBarInner}>
          <div className={styles.unitField}>
            <label>PILIH UNIT YANG DIINSPEKSI</label>
            <CustomSelect
              options={allUnits.map((u: any) => ({ value: u.id, label: `${u.serial_number} – ${u.model_name}` }))}
              value={unit?.id || ''}
              onChange={handleUnitSelect}
              placeholder="— Pilih Serial Number Unit —"
            />
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

      {/* Mode indicator */}
      <div className={styles.modeBar}>
        <span className={showPreview ? styles.modeBadgePreview : styles.modeBadgeForm}>
          {showPreview ? 'Mode Preview — Tampilan Laporan Final' : isEditMode ? 'Mode Edit — Merevisi Laporan' : 'Mode Pengisian Form'}
        </span>
        {isEditMode && !showPreview && (
          <span style={{ fontSize: '11px', color: '#92400e', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '12px', padding: '3px 12px', marginLeft: '8px' }}>
            Sedang mengedit laporan {editId}
          </span>
        )}
      </div>

      {/* Content: Form or Preview */}
      <div id={showPreview ? 'report-print-area' : undefined} className={showPreview ? styles.sheetContainer : styles.formContainer}>
        {showPreview ? (
          <InspectionReportTemplate mode="view" data={form} unit={unit} />
        ) : (
          <InspectionReportForm data={form} onChange={setForm} />
        )}
      </div>

      {/* Photo section */}
      {!showPreview && (
        <div className={styles.photoBar}>
          <div className={styles.sectionHeader}>
            <h3>Dokumentasi Foto Lapangan (Max 6 Foto)</h3>
          </div>
          <div className={styles.photoGallery}>
            {photoUrls.map((url, i) => (
              <div key={i} className={styles.photoItem}>
                <img src={url} alt={`Photo ${i + 1}`} />
                <button onClick={() => removePhoto(i)} className={styles.removePhotoBtn}>×</button>
              </div>
            ))}
            {photos.length < 6 && (
              <div className={styles.addPhotoCard} onClick={() => fileInputRef.current?.click()}>
                <Camera size={20} />
                <span>Tambah Foto</span>
                <small>Format JPG/PNG</small>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={handlePhoto} />
        </div>
      )}

      {/* Footer */}
      <div className={styles.formFooter}>
        {showPreview ? (
          <button className={styles.previewBtnFooter} onClick={() => setShowPreview(false)}>
            <EyeOff size={15} /> Kembali ke Form
          </button>
        ) : (
          <button className={styles.previewBtnFooter} onClick={() => setShowPreview(true)}>
            <Eye size={15} /> Preview Laporan
          </button>
        )}
        <button
          className={styles.saveBtn}
          onClick={() => {
            if (!unit) return alert('Pilih unit terlebih dahulu di bagian atas sebelum menyimpan laporan!');
            setIsConfirm(true);
          }}
          disabled={loading}
        >
          {loading ? <Loader2 size={14} className={styles.spinner} /> : <Save size={14} />}
          {isEditMode ? 'Simpan Perubahan' : 'Simpan Laporan & Selesai'}
        </button>
      </div>

      <Modal
        isOpen={isConfirm}
        onClose={() => setIsConfirm(false)}
        onConfirm={handleSubmit}
        title={isEditMode ? 'Simpan Perubahan Laporan?' : 'Simpan Laporan Inspeksi?'}
        message={`${isEditMode ? 'Perubahan akan disimpan ke laporan ' + editId + '.' : 'Pastikan semua data inspeksi telah benar.'}\n\nUnit Serial: ${unit?.serial_number || '-'}\nModel: ${unit?.model_name || '-'}`}
        type="confirm"
        confirmText={loading ? 'Menyimpan...' : isEditMode ? 'Ya, Simpan Perubahan' : 'Ya, Simpan'}
        cancelText="Batal"
      />
      <Modal
        isOpen={isSuccess}
        onClose={() => router.push('/reports/history')}
        title={isEditMode ? 'Laporan Berhasil Diperbarui!' : 'Laporan QC Berhasil Disimpan!'}
        message={`Laporan inspeksi untuk serial number ${unit?.serial_number} telah berhasil ${isEditMode ? 'diperbarui' : 'dicatat'}.`}
        type="success"
      />
    </div>
  );
}
