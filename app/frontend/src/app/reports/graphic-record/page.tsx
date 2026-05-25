'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { unitApi, reportApi } from '@/lib/api';
import { Save, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { CustomSelect } from '@/components/ui/CustomSelect';
import GraphicRecordForm from '@/components/reports/GraphicRecordForm';
import GraphicRecordTemplate from '@/components/reports/GraphicRecordTemplate';
import styles from './graphic-record.module.css';

const EMPTY_FORM = {
  header: {
    order_document: '',
    production_code: '',
    factory_manager: '',
    quality_control: '',
  },
  images: {
    // Each slot: { file: File, url: string } — file is transient, url is used for display
    // When saved, urls are uploaded and stored as photo_urls
  },
};

// Slots definition — order matters for upload
const IMAGE_SLOTS = ['top', 'front', 'back', 'left', 'right'] as const;
type ImageSlot = typeof IMAGE_SLOTS[number];

export default function GraphicRecordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('editId');
  const isEditMode = !!editId;

  const [allUnits, setAllUnits]       = useState<any[]>([]);
  const [unit, setUnit]               = useState<any>(null);
  const [loading, setLoading]         = useState(false);
  const [loadingData, setLoadingData] = useState(isEditMode);
  const [isConfirm, setIsConfirm]     = useState(false);
  const [isSuccess, setIsSuccess]     = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [form, setForm]               = useState<any>(EMPTY_FORM);

  useEffect(() => {
    unitApi.findAll(1, 1000)
      .then(({ data }) => setAllUnits(Array.isArray(data) ? data[0] : (data.data || [])))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!editId) return;
    setLoadingData(true);
    reportApi.findOne(editId)
      .then(({ data }) => {
        if (data) {
          // Restore saved image URLs from photo_urls array
          // photo_urls stored as: ['top:url', 'front:url', ...]
          const savedImages: Record<string, string> = {};
          if (Array.isArray(data.photo_urls)) {
            data.photo_urls.forEach((entry: string) => {
              const idx = entry.indexOf(':');
              if (idx > 0) {
                const slot = entry.substring(0, idx);
                const url = entry.substring(idx + 1);
                savedImages[slot] = url;
              }
            });
          }
          setForm({
            ...EMPTY_FORM,
            ...data.data,
            images: savedImages,
          });
          setUnit(data.unit || null);
        }
      })
      .catch(() => alert('Gagal memuat data laporan.'))
      .finally(() => setLoadingData(false));
  }, [editId]);

  const handleUnitSelect = (val: string) =>
    setUnit(allUnits.find((u: any) => u.id === val) || null);

  const handleChange = (key: string, val: any) =>
    setForm((prev: any) => ({ ...prev, [key]: val }));

  const handleSubmit = async () => {
    if (!unit) return alert('Pilih unit terlebih dahulu!');
    setLoading(true);
    try {
      // Collect files that need uploading (new uploads have .file property)
      const filesToUpload: { slot: ImageSlot; file: File }[] = [];
      const existingUrls: { slot: string; url: string }[] = [];

      IMAGE_SLOTS.forEach(slot => {
        const entry = form.images?.[slot];
        if (!entry) return;
        if (entry.file instanceof File) {
          filesToUpload.push({ slot, file: entry.file });
        } else if (typeof entry === 'string') {
          // Already a URL from edit mode
          existingUrls.push({ slot, url: entry });
        } else if (entry.url && !entry.file) {
          existingUrls.push({ slot, url: entry.url });
        }
      });

      // Upload new files
      let uploadedSlotUrls: { slot: string; url: string }[] = [...existingUrls];
      if (filesToUpload.length > 0) {
        const { data: uploadRes } = await reportApi.uploadPhotos(filesToUpload.map(f => f.file));
        const uploadedUrls: string[] = Array.isArray(uploadRes) ? uploadRes : [];
        filesToUpload.forEach((item, i) => {
          if (uploadedUrls[i]) {
            uploadedSlotUrls.push({ slot: item.slot, url: uploadedUrls[i] });
          }
        });
      }

      // Encode as 'slot:url' strings
      const photoUrls = uploadedSlotUrls.map(({ slot, url }) => `${slot}:${url}`);

      // Save form data (without File objects — only serializable data)
      const formData = {
        header: form.header,
        images: Object.fromEntries(
          uploadedSlotUrls.map(({ slot, url }) => [slot, url])
        ),
      };

      if (isEditMode && editId) {
        await reportApi.update(editId, { data: formData, photo_urls: photoUrls });
      } else {
        await reportApi.create({
          unitId: unit.id,
          form_type: 'COMMISSIONING',
          data: formData,
          photo_urls: photoUrls,
        });
      }

      setIsConfirm(false);
      setIsSuccess(true);
    } catch {
      alert('Gagal menyimpan laporan.');
    } finally {
      setLoading(false);
    }
  };

  // Count uploaded images
  const uploadedCount = IMAGE_SLOTS.filter(s => form.images?.[s]).length;

  if (loadingData) return (
    <div className={styles.pageWrapper} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center', color: '#475569' }}>
        <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
        <p style={{ fontWeight: 600 }}>Memuat data laporan...</p>
      </div>
    </div>
  );

  return (
    <div className={styles.pageWrapper}>

      {/* ── Toolbar ── */}
      <div className={styles.toolbar}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <ArrowLeft size={16} />
        </button>
        <h1 className={styles.title}>
          {isEditMode ? 'EDIT' : 'NEW'} GRAPHIC RECORD
        </h1>
        <div style={{ marginLeft: 'auto' }}>
          <button
            className={showPreview ? styles.previewBtnActive : styles.previewBtn}
            onClick={() => setShowPreview(v => !v)}
          >
            {showPreview
              ? <><EyeOff size={15} /> Kembali ke Form</>
              : <><Eye size={15} /> Preview Laporan</>}
          </button>
        </div>
      </div>

      {/* ── Unit Selector ── */}
      <div className={styles.unitBar}>
        <div className={styles.unitBarInner}>
          <div className={styles.unitField}>
            <label>PILIH UNIT</label>
            <CustomSelect
              options={allUnits.map((u: any) => ({ value: u.id, label: `${u.serial_number} – ${u.model_name}` }))}
              value={unit?.id || ''}
              onChange={handleUnitSelect}
              placeholder="— Pilih Serial Number Unit —"
            />
          </div>
          {unit && (
            <div className={styles.unitInfo}>
              <span><strong>Serial:</strong> {unit.serial_number}</span>
              <span><strong>Model:</strong> {unit.model_name}</span>
              <span><strong>Status:</strong> {unit.status}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Mode Bar ── */}
      <div className={styles.modeBar}>
        <span className={showPreview ? styles.modeBadgePreview : styles.modeBadgeForm}>
          {showPreview
            ? 'Mode Preview — Tampilan Laporan Final'
            : isEditMode
              ? 'Mode Edit — Merevisi Laporan'
              : 'Mode Pengisian Form'}
        </span>
        {!showPreview && (
          <span className={styles.progressBadge}>
            {uploadedCount} / 5 gambar terupload
          </span>
        )}
        {isEditMode && !showPreview && (
          <span style={{ fontSize: '11px', color: '#92400e', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '12px', padding: '3px 12px', marginLeft: '8px' }}>
            Sedang mengedit laporan {editId}
          </span>
        )}
      </div>

      {/* ── Form / Preview ── */}
      <div
        id={showPreview ? 'report-print-area' : undefined}
        className={showPreview ? styles.sheetContainer : styles.formContainer}
      >
        {showPreview
          ? <GraphicRecordTemplate data={form} unit={unit || {}} />
          : <GraphicRecordForm data={form} onChange={handleChange} />}
      </div>

      {/* ── Footer ── */}
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
            if (!unit) return alert('Pilih unit terlebih dahulu!');
            setIsConfirm(true);
          }}
        >
          <Save size={16} />
          {isEditMode ? 'Simpan Perubahan' : 'Simpan Graphic Record'}
        </button>
      </div>

      <Modal
        isOpen={isConfirm}
        onClose={() => setIsConfirm(false)}
        onConfirm={handleSubmit}
        title={isEditMode ? 'Simpan Perubahan?' : 'Simpan Graphic Record?'}
        message={`Unit Serial: ${unit?.serial_number || '-'}\nModel: ${unit?.model_name || '-'}\nGambar terupload: ${uploadedCount}/5`}
        type="confirm"
        confirmText={loading ? 'Menyimpan...' : isEditMode ? 'Ya, Simpan Perubahan' : 'Ya, Simpan'}
        cancelText="Batal"
      />
      <Modal
        isOpen={isSuccess}
        onClose={() => router.push('/reports/history')}
        title={isEditMode ? 'Laporan Berhasil Diperbarui!' : 'Graphic Record Berhasil Disimpan!'}
        message={`Graphic Record untuk serial number ${unit?.serial_number} telah berhasil ${isEditMode ? 'diperbarui' : 'dicatat'}.`}
        type="success"
      />
    </div>
  );
}
