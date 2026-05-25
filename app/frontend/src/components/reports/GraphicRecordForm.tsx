'use client';

import React, { useRef } from 'react';
import styles from './CoolingReportForm.module.css';
import grStyles from './GraphicRecordForm.module.css';

interface Props {
  data: any;
  onChange: (section: string, val: any) => void;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      {hint && <span className={styles.fieldHint}>{hint}</span>}
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input type={type} className={styles.input} value={value}
      onChange={e => onChange(e.target.value)} placeholder={placeholder} />
  );
}

function SectionTitle({ number, title }: { number: string; title: string }) {
  return (
    <div className={styles.sectionTitle}>
      <span className={styles.sectionNumber}>{number}</span>
      <span className={styles.sectionTitleText}>{title}</span>
    </div>
  );
}

function TwoCol({ children }: { children: React.ReactNode }) {
  return <div className={styles.twoCol}>{children}</div>;
}

function Card({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className={styles.card}>
      {title && <div className={styles.cardTitle}>{title}</div>}
      {children}
    </div>
  );
}

// ── Image Upload Slot ──────────────────────────────────────
function ImageSlot({
  label,
  sublabel,
  imageUrl,
  onUpload,
  onRemove,
  aspectRatio = '4/3',
}: {
  label: string;
  sublabel?: string;
  imageUrl?: string;
  onUpload: (file: File) => void;
  onRemove: () => void;
  aspectRatio?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    // reset so same file can be re-selected
    e.target.value = '';
  };

  return (
    <div className={grStyles.imageSlot} style={{ aspectRatio }}>
      {imageUrl ? (
        <div className={grStyles.imagePreview}>
          <img src={imageUrl} alt={label} />
          <button type="button" className={grStyles.removeImageBtn} onClick={onRemove}>×</button>
        </div>
      ) : (
        <button type="button" className={grStyles.uploadArea} onClick={() => inputRef.current?.click()}>
          <div className={grStyles.uploadIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
          <span className={grStyles.uploadLabel}>{label}</span>
          {sublabel && <span className={grStyles.uploadSublabel}>{sublabel}</span>}
          <span className={grStyles.uploadHint}>Klik untuk upload gambar</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleChange}
      />
      <div className={grStyles.slotLabel}>
        <span className={grStyles.slotLabelMain}>{label}</span>
        {sublabel && <span className={grStyles.slotLabelSub}>{sublabel}</span>}
      </div>
    </div>
  );
}

// ── Main Form ──────────────────────────────────────────────
export default function GraphicRecordForm({ data, onChange }: Props) {
  const h = data.header || {};
  const images = data.images || {};

  const setH = (k: string, v: string) => onChange('header', { ...h, [k]: v });

  const handleImageUpload = (slot: string, file: File) => {
    const url = URL.createObjectURL(file);
    onChange('images', { ...images, [slot]: { file, url } });
  };

  const handleImageRemove = (slot: string) => {
    const updated = { ...images };
    delete updated[slot];
    onChange('images', updated);
  };

  const getUrl = (slot: string) => images[slot]?.url;

  return (
    <div className={styles.formWrapper}>

      {/* 1. INFORMASI HEADER */}
      <SectionTitle number="1" title="Informasi Dokumen" />
      <Card>
        <TwoCol>
          <Field label="Order Document" hint="Nomor ITR">
            <Input value={h.order_document || ''} onChange={v => setH('order_document', v)} placeholder="Nomor order..." />
          </Field>
          <Field label="Production Code" hint="Kode PRO">
            <Input value={h.production_code || ''} onChange={v => setH('production_code', v)} placeholder="Kode produksi..." />
          </Field>
        </TwoCol>
      </Card>

      {/* 2. UPLOAD GAMBAR */}
      <SectionTitle number="2" title="Upload Gambar Unit (5 Sisi)" />
      <p className={styles.perfNote}>
        Upload foto/gambar unit dari 5 sisi: TOP (atas), FRONT (depan), BACK (belakang), LEFT (kiri), RIGHT (kanan).
        Setiap slot menerima 1 gambar.
      </p>

      {/* TOP — full width */}
      <Card title="Tampak Atas (TOP)">
        <ImageSlot
          label="TOP"
          sublabel="上面"
          imageUrl={getUrl('top')}
          onUpload={f => handleImageUpload('top', f)}
          onRemove={() => handleImageRemove('top')}
          aspectRatio="16/7"
        />
      </Card>

      {/* FRONT — full width */}
      <Card title="Tampak Depan (FRONT)">
        <ImageSlot
          label="FRONT"
          sublabel="正面"
          imageUrl={getUrl('front')}
          onUpload={f => handleImageUpload('front', f)}
          onRemove={() => handleImageRemove('front')}
          aspectRatio="16/7"
        />
      </Card>

      {/* BACK + LEFT + RIGHT — 3 kolom */}
      <Card title="Tampak Belakang, Kiri & Kanan (BACK / LEFT / RIGHT)">
        <div className={grStyles.threeSlotRow}>
          <ImageSlot
            label="BACK"
            sublabel="後面"
            imageUrl={getUrl('back')}
            onUpload={f => handleImageUpload('back', f)}
            onRemove={() => handleImageRemove('back')}
            aspectRatio="3/4"
          />
          <ImageSlot
            label="LEFT"
            sublabel="左面"
            imageUrl={getUrl('left')}
            onUpload={f => handleImageUpload('left', f)}
            onRemove={() => handleImageRemove('left')}
            aspectRatio="3/4"
          />
          <ImageSlot
            label="RIGHT"
            sublabel="右面"
            imageUrl={getUrl('right')}
            onUpload={f => handleImageUpload('right', f)}
            onRemove={() => handleImageRemove('right')}
            aspectRatio="3/4"
          />
        </div>
      </Card>

      {/* 3. TANDA TANGAN */}
      <SectionTitle number="3" title="Tanda Tangan" />
      <Card>
        <TwoCol>
          <Field label="Factory Manager (Kepala Pabrik)">
            <Input value={h.factory_manager || ''} onChange={v => setH('factory_manager', v)} placeholder="Nama factory manager..." />
          </Field>
          <Field label="Quality Control">
            <Input value={h.quality_control || ''} onChange={v => setH('quality_control', v)} placeholder="Nama QC..." />
          </Field>
        </TwoCol>
      </Card>
    </div>
  );
}
