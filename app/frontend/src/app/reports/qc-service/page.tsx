'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { unitApi, reportApi } from '@/lib/api';
import { Save, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { CustomSelect } from '@/components/ui/CustomSelect';
import QcServiceForm from '@/components/reports/QcServiceForm';
import QcServiceTemplate from '@/components/reports/QcServiceTemplate';
import styles from './qc-service.module.css';

const EMPTY_FORM = {
  header: {
    nama_unit: '',
    serial_number: '',
    nama_customer: '',
    nomor_produksi: '',
  },
  checklist: [false, false, false, false],
  qc: { qc1: '', qc2: '', qc3: '' },
  tanggal: '',
};

export default function QcServicePage() {
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
          setForm({ ...EMPTY_FORM, ...data.data });
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
      if (isEditMode && editId) {
        await reportApi.update(editId, { data: form });
      } else {
        await reportApi.create({
          unitId: unit.id,
          form_type: 'QC_SERVICE',
          data: form,
          photo_urls: [],
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

  // Count checked items
  const checkedCount = (form.checklist || []).filter(Boolean).length;

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
          {isEditMode ? 'EDIT' : 'NEW'} CHECKLIST QC SERVICE — KACA
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
            {checkedCount} / 4 item tercentang
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
          ? <QcServiceTemplate data={form} unit={unit || {}} />
          : <QcServiceForm data={form} onChange={handleChange} />}
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
          {isEditMode ? 'Simpan Perubahan' : 'Simpan Checklist QC Service'}
        </button>
      </div>

      <Modal
        isOpen={isConfirm}
        onClose={() => setIsConfirm(false)}
        onConfirm={handleSubmit}
        title={isEditMode ? 'Simpan Perubahan?' : 'Simpan Checklist QC Service?'}
        message={`Unit Serial: ${unit?.serial_number || '-'}\nModel: ${unit?.model_name || '-'}\nItem tercentang: ${checkedCount}/4`}
        type="confirm"
        confirmText={loading ? 'Menyimpan...' : isEditMode ? 'Ya, Simpan Perubahan' : 'Ya, Simpan'}
        cancelText="Batal"
      />
      <Modal
        isOpen={isSuccess}
        onClose={() => router.push('/reports/history')}
        title={isEditMode ? 'Laporan Berhasil Diperbarui!' : 'Checklist QC Service Berhasil Disimpan!'}
        message={`Checklist QC untuk serial number ${unit?.serial_number} telah berhasil ${isEditMode ? 'diperbarui' : 'dicatat'}.`}
        type="success"
      />
    </div>
  );
}
