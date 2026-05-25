'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { unitApi, reportApi } from '@/lib/api';
import { Save, Camera, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { CustomSelect } from '@/components/ui/CustomSelect';
import CoolingReportForm from '@/components/reports/CoolingReportForm';
import CoolingReportTemplate from '@/components/reports/CoolingReportTemplate';
import styles from './cooling.module.css';

const EMPTY_FORM = {
  header: {
    order_document: '', production_code: '', starting_date: '',
    finishing_date: '', inspection_date: '', customer: '', category: '', item_code: ''
  },
  general_inspection: {
    part: '', required: '', setting_temp: '', temp_dalam: '', digital_type: '', setting: ''
  },
  cooling_system: {
    left: {
      comp_type: '', comp_sn: '', freon_type: '', freon_weight: '',
      press_start: '', press_run: '', amp_start: '', amp_run: '',
      condensor: '', evap_dia: '', evap_length: '', evap_t: '',
      evap_gap: '', evap_x: '', has_capiler: false, capiler_size: '',
      has_expansion: false, fan_evap_model: '', fan_evap_qty: '', fan_antimist_notes: ''
    },
    right: {
      comp_type: '', comp_sn: '', freon_type: '', freon_weight: '',
      press_start: '', press_run: '', amp_start: '', amp_run: '',
      condensor: '', evap_dia: '', evap_length: '', evap_t: '',
      evap_gap: '', evap_x: '', has_capiler: false, capiler_size: '',
      has_expansion: false, fan_evap_model: '', fan_evap_qty: '', fan_antimist_notes: ''
    }
  },
  performance_inspection: {
    evap_min: '', evap_max: '',
    evap_left_min: '', evap_left_max: '',
    evap_right_min: '', evap_right_max: '',
    cond_min: '', cond_max: '',
    comp_min: '', comp_max: '',
    kabinet_min: '', kabinet_max: '', kabinet_hum: '',
    room_min: '', room_max: '', room_hum: '',
    qc_1: false, qc_2: false, qc_2_time: '', qc_3: false, qc_4: false
  },
  footer: { tech_name: '', qc_name: '' }
};

export default function CoolingFormPage() {
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
          // Merge existing data with empty form to fill any missing keys
          setForm({ ...EMPTY_FORM, ...data.data });
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
          form_type: 'COOLING_1',
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
          {isEditMode ? 'EDIT COOLING SYSTEM REPORT' : 'NEW COOLING SYSTEM REPORT 1 SUHU'}
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
              <span><strong>ID:</strong> {unit.id}</span>
              <span><strong>Unit:</strong> {unit.model_name}</span>
              <span><strong>Status:</strong> {unit.status}</span>
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
          <CoolingReportTemplate mode="view" data={form} unit={unit || {}} />
        ) : (
          <CoolingReportForm
            data={form}
            onChange={(key, val) => setForm((prev: any) => ({ ...prev, [key]: val }))}
          />
        )}
      </div>

      {/* Photo section */}
      {!showPreview && (
        <div className={styles.photoBar}>
          <div className={styles.sectionHeader}>
            <h3>Lampiran Foto Dokumentasi QC</h3>
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
                <Camera size={24} />
                <span>Tambah Foto</span>
                <small>Maks 6 Foto</small>
              </div>
            )}
          </div>
          <input type="file" multiple accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handlePhoto} />
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
        >
          <Save size={16} /> {isEditMode ? 'Simpan Perubahan' : 'Simpan Laporan Cooling'}
        </button>
      </div>

      <Modal
        isOpen={isConfirm}
        onClose={() => setIsConfirm(false)}
        onConfirm={handleSubmit}
        title={isEditMode ? 'Simpan Perubahan Laporan?' : 'Simpan Cooling System Report?'}
        message={`${isEditMode ? 'Perubahan akan disimpan ke laporan ' + editId + '.' : 'Pastikan semua data cooling system telah benar.'}\n\nUnit Serial: ${unit?.serial_number || '-'}\nModel: ${unit?.model_name || '-'}`}
        type="confirm"
        confirmText={loading ? 'Menyimpan...' : isEditMode ? 'Ya, Simpan Perubahan' : 'Ya, Simpan'}
        cancelText="Batal"
      />
      <Modal
        isOpen={isSuccess}
        onClose={() => router.push('/reports/history')}
        title={isEditMode ? 'Laporan Berhasil Diperbarui!' : 'Laporan Cooling Berhasil Disimpan!'}
        message={`Laporan cooling system untuk serial number ${unit?.serial_number} telah berhasil ${isEditMode ? 'diperbarui' : 'dicatat'}.`}
        type="success"
      />
    </div>
  );
}
