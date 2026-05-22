'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { unitApi, reportApi } from '@/lib/api';
import { Save, Camera, ArrowLeft, Loader2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { CustomSelect } from '@/components/ui/CustomSelect';
import CoolingReportTemplate from '@/components/reports/CoolingReportTemplate';
import styles from './cooling.module.css';

export default function CoolingForm() {
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

  // Initialize form state matching CoolingReportTemplate
  const [form, setForm] = useState<any>({
    header: { order_document: '', production_code: '', starting_date: '', finishing_date: '', inspection_date: '', customer: '', category: '', item_code: '' },
    general_inspection: { part: '', required: '', setting_temp: '', temp_dalam: '', digital_type: '', setting: '' },
    cooling_system: {
      left: { comp_type: '', comp_sn: '', freon_type: '', freon_weight: '', press_start: '', press_run: '', amp_start: '', amp_run: '', condensor: '', evaporator: '', fan_evap_model: '', fan_evap_qty: '', fan_antimist_model: '', fan_antimist_qty: '' },
      right: { comp_type: '', comp_sn: '', freon_type: '', freon_weight: '', press_start: '', press_run: '', amp_start: '', amp_run: '', condensor: '', evaporator: '', fan_evap_model: '', fan_evap_qty: '', fan_antimist_model: '', fan_antimist_qty: '' }
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
  });

  // Load units for dropdown
  useEffect(() => {
    unitApi.findAll(1, 1000)
      .then(({ data }) => setAllUnits(Array.isArray(data) ? data[0] : (data.data || [])))
      .catch(() => {});
  }, []);

  const handleUnitSelect = (val: string) => {
    const selected = allUnits.find((u: any) => u.id === val);
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
        form_type: 'COOLING_1',
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
        <h1 className={styles.title}>NEW COOLING SYSTEM REPORT 1 SUHU</h1>
      </div>

      {/* Unit Selector Bar */}
      <div className={styles.unitBar}>
        <div className={styles.unitBarInner}>
          <div className={styles.unitField}>
            <label>PILIH UNIT YANG DIINSPEKSI</label>
            <CustomSelect
              options={allUnits.map((u: any) => ({
                value: u.id,
                label: `${u.serial_number} – ${u.model_name}`
              }))}
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

      <div className={styles.sheetContainer}>
        <CoolingReportTemplate
          mode="edit"
          data={form}
          unit={unit || {}}
          onChange={(key: string, val: any) => setForm((prev: any) => ({ ...prev, [key]: val }))}
        />
      </div>

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
        <input
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handlePhoto}
        />
      </div>

      <div className={styles.formFooter}>
        <button className={styles.saveBtn} onClick={() => {
          if (!unit) return alert('Pilih unit terlebih dahulu di bagian atas sebelum menyimpan laporan!');
          setIsConfirm(true);
        }}>
          <Save size={16} /> Simpan Laporan Cooling
        </button>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isConfirm}
        onClose={() => setIsConfirm(false)}
        onConfirm={handleSubmit}
        title="Simpan Cooling System Report?"
        message={`Pastikan semua data cooling system telah benar dan sesuai dengan kondisi fisik unit.\n\nUnit Serial: ${unit?.serial_number || '-'}\nModel: ${unit?.model_name || '-'}`}
        type="confirm"
        confirmText={loading ? 'Menyimpan...' : 'Ya, Simpan'}
        cancelText="Batal"
      />

      {/* Success Modal */}
      <Modal
        isOpen={isSuccess}
        onClose={() => router.push('/reports/history')}
        title="Laporan Cooling Berhasil Disimpan!"
        message={`Laporan cooling system untuk serial number ${unit?.serial_number} telah berhasil dicatat ke dalam unit passport. Anda sekarang dapat mencetak PDF laporan langsung dari riwayat.`}
        type="success"
      />
    </div>
  );
}
