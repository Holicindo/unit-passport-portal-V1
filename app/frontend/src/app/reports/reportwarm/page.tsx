'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { unitApi, reportApi } from '@/lib/api';
import { Save, Camera, ArrowLeft, Loader2, Eye, EyeOff, ChevronDown, Thermometer } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { CustomSelect } from '@/components/ui/CustomSelect';
import WarmReportForm from '@/components/reports/WarmReportForm';
import WarmReportTemplate from '@/components/reports/WarmReportTemplate';
import styles from './reportwarm.module.css';
import { EMPTY_FORM } from './constants';

export default function ReportWarmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('editId');
  const isEditMode = !!editId;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [allUnits, setAllUnits] = useState<any[]>([]);
  const [unit, setUnit] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditMode);
  const [isConfirm, setIsConfirm] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  const coolingTypes = [
    { label: '1 SUHU', sublabel: 'Single Temperature', path: '/reports/cooling', current: false },
    { label: '2 SUHU', sublabel: 'Cake & RTD', path: '/reports/cooling2', current: false },
    { label: '3 SUHU', sublabel: 'Cake, Ambient & RTD', path: '/reports/cooling3', current: false },
    { label: 'WARM', sublabel: 'Warm / Cooler Showcase', path: '/reports/reportwarm', current: true },
  ];

  const handleSwitchType = (path: string) => {
    if (path === '/reports/reportwarm') { setShowTypeDropdown(false); return; }
    const params = new URLSearchParams();
    const unitId = searchParams.get('unit') || searchParams.get('unitId') || unit?.id;
    const svcLog = searchParams.get('serviceLogId');
    if (unitId) params.set('unit', unitId);
    if (svcLog) params.set('serviceLogId', svcLog);
    const qs = params.toString();
    router.push(qs ? `${path}?${qs}` : path);
    setShowTypeDropdown(false);
  };

  useEffect(() => {
    unitApi
      .findAll(1, 1000)
      .then(({ data }) => {
        const list = Array.isArray(data) ? data[0] : data.data || [];
        setAllUnits(list);

        // Auto-select unit from query parameter if present
        const queryUnit = searchParams.get('unit') || searchParams.get('unitId');
        if (queryUnit && !editId) {
          const match = list.find((u: any) => u.id === queryUnit || u.serial_number === queryUnit);
          if (match) setUnit(match);
        }
      })
      .catch(() => {});
  }, [searchParams, editId]);

  useEffect(() => {
    if (!editId) return;
    setLoadingData(true);
    reportApi
      .findOne(editId)
      .then(({ data }) => {
        if (data) {
          setForm({ ...EMPTY_FORM, ...data.data });
          setUnit(data.unit || null);
          if (data.photo_urls && Array.isArray(data.photo_urls)) {
             setPhotoUrls(data.photo_urls);
          }
        }
      })
      .catch(() => alert('Gagal memuat data laporan.'))
      .finally(() => setLoadingData(false));
  }, [editId]);

  const handleUnitSelect = (val: string) =>
    setUnit(allUnits.find((u: any) => u.id === val) || null);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newPhotos = [...photos, ...Array.from(e.target.files)].slice(0, 6);
    setPhotos(newPhotos);
    setPhotoUrls(newPhotos.map((f) => URL.createObjectURL(f)));
  };

  const removePhoto = (i: number) => {
    const p = [...photos];
    p.splice(i, 1);
    setPhotos(p);
    const u = [...photoUrls];
    u.splice(i, 1);
    setPhotoUrls(u);
  };

  const handleSubmit = async () => {
    if (!unit) return alert('Pilih unit terlebih dahulu!');
    setLoading(true);
    try {
      let uploadedUrls: string[] = [];
      if (photos.length > 0) {
        try {
          const { data: r } = await reportApi.uploadPhotos(photos);
          uploadedUrls = Array.isArray(r) ? r : [];
        } catch {}
      }
      if (isEditMode && editId) {
        await reportApi.create({
          unitId: unit.id,
          form_type: 'COOLING_WARM',
          data: form,
          photo_urls: uploadedUrls.length > 0 ? uploadedUrls : photoUrls,
          baseReportId: editId,
          service_log_id: searchParams.get('serviceLogId') || undefined,
        });
      } else {
        await reportApi.create({
          unitId: unit.id,
          form_type: 'COOLING_WARM',
          data: form,
          photo_urls: uploadedUrls,
          service_log_id: searchParams.get('serviceLogId') || undefined,
        });
      }
      setIsConfirm(false);
      setIsSuccess(true);
    } catch {
      alert('Gagal menyimpan Laporan.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div
        className={styles.pageWrapper}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
        }}
      >
        <div style={{ textAlign: 'center', color: '#475569' }}>
          <Loader2
            size={40}
            style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }}
          />
          <p style={{ fontWeight: 600 }}>Memuat data laporan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <ArrowLeft size={16} />
        </button>
        {/* ── Cooling Type Switcher Dropdown ── */}
        <div style={{ position: 'relative', flex: 1 }}>
          <button
            id="cooling-type-switcher"
            onClick={() => !isEditMode && setShowTypeDropdown(v => !v)}
            style={{ background: 'none', border: 'none', padding: 0, cursor: isEditMode ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <h1 className={styles.title} style={{ margin: 0 }}>
              {isEditMode ? 'EDIT' : 'NEW'} COOLING SYSTEM REPORT — WARM
            </h1>
            {!isEditMode && (
              <ChevronDown size={18} color="rgba(255,255,255,0.7)" style={{ transition: 'transform 0.2s', transform: showTypeDropdown ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }} />
            )}
          </button>

          {showTypeDropdown && (
            <>
              <div onClick={() => setShowTypeDropdown(false)} style={{ position: 'fixed', inset: 0, zIndex: 999 }} />
              <div style={{ position: 'absolute', top: 'calc(100% + 10px)', left: 0, zIndex: 1000, background: '#1e293b', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', boxShadow: '0 16px 40px rgba(0,0,0,0.4)', minWidth: '260px', overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Ganti Tipe Cooling Report</span>
                </div>
                {coolingTypes.map((t) => (
                  <button key={t.path} onClick={() => handleSwitchType(t.path)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: t.current ? 'rgba(46,91,255,0.2)' : 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s' }}
                    onMouseEnter={e => { if (!t.current) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; }}
                    onMouseLeave={e => { if (!t.current) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                  >
                    <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: t.current ? 'rgba(46,91,255,0.3)' : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Thermometer size={16} color={t.current ? '#60a5fa' : 'rgba(255,255,255,0.5)'} />
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: t.current ? '#60a5fa' : '#ffffff', fontFamily: 'var(--font-heading, Inter)' }}>COOLING {t.label}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>{t.sublabel}</div>
                    </div>
                    {t.current && <div style={{ marginLeft: 'auto', fontSize: '10px', fontWeight: 700, color: '#60a5fa', background: 'rgba(96,165,250,0.15)', padding: '2px 8px', borderRadius: '10px' }}>AKTIF</div>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
          <button
            className={showPreview ? styles.previewBtnActive : styles.previewBtn}
            onClick={() => setShowPreview((v) => !v)}
          >
            {showPreview ? (
              <>
                <EyeOff size={15} /> Kembali ke Form
              </>
            ) : (
              <>
                <Eye size={15} /> Preview Laporan
              </>
            )}
          </button>
        </div>
      </div>

      {/* Unit Selector */}
      <div className={styles.unitBar}>
        <div className={styles.unitBarInner}>
          <div className={styles.unitField}>
            <label>PILIH UNIT YANG DIINSPEKSI</label>
            <CustomSelect
              options={allUnits.map((u: any) => ({
                value: u.id,
                label: `${u.serial_number} – ${u.model_name}`,
              }))}
              value={unit?.id || ''}
              onChange={handleUnitSelect}
              placeholder="— Pilih Serial Number Unit —"
            />
          </div>
          {unit && (
            <div className={styles.unitInfo}>
              <span>
                <strong>ID:</strong> {unit.id}
              </span>
              <span>
                <strong>Unit:</strong> {unit.model_name}
              </span>
              <span>
                <strong>Status:</strong> {unit.status}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Mode indicator */}
      <div className={styles.modeBar}>
        <span
          className={showPreview ? styles.modeBadgePreview : styles.modeBadgeForm}
        >
          {showPreview
            ? 'Mode Preview — Tampilan Laporan Final'
            : isEditMode
            ? 'Mode Edit — Merevisi Laporan'
            : 'Mode Pengisian Form'}
        </span>
        {isEditMode && !showPreview && (
          <span
            style={{
              fontSize: '11px',
              color: '#92400e',
              background: '#fef3c7',
              border: '1px solid #fcd34d',
              borderRadius: '12px',
              padding: '3px 12px',
              marginLeft: '8px',
            }}
          >
            Sedang mengedit laporan {editId}
          </span>
        )}
      </div>

      {/* Content */}
      <div
        id={showPreview ? 'report-print-area' : undefined}
        className={showPreview ? styles.sheetContainer : styles.formContainer}
      >
        {showPreview ? (
          <WarmReportTemplate mode="view" data={form} unit={unit || {}} />
        ) : (
          <WarmReportForm
            data={form}
            onChange={(key, val) =>
              setForm((prev: any) => ({ ...prev, [key]: val }))
            }
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
                <button
                  onClick={() => removePhoto(i)}
                  className={styles.removePhotoBtn}
                >
                  ×
                </button>
              </div>
            ))}
            {photos.length < 6 && (
              <div
                className={styles.addPhotoCard}
                onClick={() => fileInputRef.current?.click()}
              >
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
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handlePhoto}
          />
        </div>
      )}

      {/* Footer */}
      <div className={styles.formFooter}>
        {showPreview ? (
          <button
            className={styles.previewBtnFooter}
            onClick={() => setShowPreview(false)}
          >
            <EyeOff size={15} /> Kembali ke Form
          </button>
        ) : (
          <button
            className={styles.previewBtnFooter}
            onClick={() => setShowPreview(true)}
          >
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
          <Save size={16} />{' '}
          {isEditMode ? 'Simpan Perubahan' : 'Simpan Laporan Warm'}
        </button>
      </div>

      <Modal
        isOpen={isConfirm}
        onClose={() => setIsConfirm(false)}
        onConfirm={handleSubmit}
        title={
          isEditMode ? 'Simpan Perubahan?' : 'Simpan Cooling System Report Warm?'
        }
        message={`Unit Serial: ${unit?.serial_number || '-'}\nModel: ${
          unit?.model_name || '-'
        }`}
        type="confirm"
        confirmText={
          loading
            ? 'Menyimpan...'
            : isEditMode
            ? 'Ya, Simpan Perubahan'
            : 'Ya, Simpan'
        }
        cancelText="Batal"
      />
      <Modal
        isOpen={isSuccess}
        onClose={() => router.push('/reports/history')}
        title={
          isEditMode
            ? 'Laporan Berhasil Diperbarui!'
            : 'Laporan Warm Berhasil Disimpan!'
        }
        message={`Laporan untuk serial number ${unit?.serial_number} telah berhasil ${
          isEditMode ? 'diperbarui' : 'dicatat'
        }.`}
        type="success"
      />
    </div>
  );
}
