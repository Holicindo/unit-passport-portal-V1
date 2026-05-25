'use client';

import React from 'react';
import styles from './CoolingReportForm.module.css';
import qcStyles from './QcServiceForm.module.css';

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

function CheckItem({ label, checked, onChange }: {
  label: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      className={`${styles.checkItem} ${checked ? styles.checkItemActive : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.checkIcon}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '18px', height: '18px', borderRadius: '4px',
          border: checked ? '2px solid #2e5bff' : '2px solid #cbd5e1',
          background: checked ? '#2e5bff' : '#fff', flexShrink: 0,
        }}>
          {checked && (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5L4.5 7.5L8.5 2.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
      </span>
      <span className={styles.checkLabel}>{label}</span>
    </button>
  );
}

// Default checklist items — bisa dikustomisasi
const DEFAULT_ITEMS = [
  'Ukuran sesuai standar',
  'Tidak ada baret',
  'Tidak ada cacat visual',
  'Kondisi bersih & baik',
];

export default function QcServiceForm({ data, onChange }: Props) {
  const h = data.header || {};
  const checklist: boolean[] = data.checklist || Array(DEFAULT_ITEMS.length).fill(false);
  const qc = data.qc || { qc1: '', qc2: '', qc3: '' };
  const tanggal = data.tanggal || '';

  const setH = (k: string, v: string) => onChange('header', { ...h, [k]: v });

  const setCheck = (i: number, v: boolean) => {
    const updated = [...checklist];
    updated[i] = v;
    onChange('checklist', updated);
  };

  const setQc = (k: string, v: string) => onChange('qc', { ...qc, [k]: v });

  return (
    <div className={styles.formWrapper}>

      {/* 1. INFORMASI UNIT */}
      <SectionTitle number="1" title="Informasi Unit" />
      <Card>
        <TwoCol>
          <Field label="Nama Unit">
            <Input value={h.nama_unit || ''} onChange={v => setH('nama_unit', v)} placeholder="Nama unit..." />
          </Field>
          <Field label="Serial Number">
            <Input value={h.serial_number || ''} onChange={v => setH('serial_number', v)} placeholder="Serial number..." />
          </Field>
          <Field label="Nama Customer">
            <Input value={h.nama_customer || ''} onChange={v => setH('nama_customer', v)} placeholder="Nama customer..." />
          </Field>
          <Field label="Nomor Produksi">
            <Input value={h.nomor_produksi || ''} onChange={v => setH('nomor_produksi', v)} placeholder="Nomor produksi..." />
          </Field>
        </TwoCol>
      </Card>

      {/* 2. CHECKLIST QC */}
      <SectionTitle number="2" title="Checklist Quality Control — Kaca Service" />
      <Card>
        <p className={styles.checklistNote}>Centang semua item yang sudah terpenuhi:</p>
        <div className={styles.checklistGrid}>
          {DEFAULT_ITEMS.map((label, i) => (
            <CheckItem
              key={i}
              label={label}
              checked={checklist[i] || false}
              onChange={v => setCheck(i, v)}
            />
          ))}
        </div>
      </Card>

      {/* 3. DIPERIKSA OLEH */}
      <SectionTitle number="3" title="Diperiksa Oleh" />
      <Card>
        <div className={qcStyles.qcSignRow}>
          <Field label="QC 1 — Nama">
            <Input value={qc.qc1 || ''} onChange={v => setQc('qc1', v)} placeholder="Nama QC 1..." />
          </Field>
          <Field label="QC 2 — Nama">
            <Input value={qc.qc2 || ''} onChange={v => setQc('qc2', v)} placeholder="Nama QC 2..." />
          </Field>
          <Field label="QC 3 — Nama">
            <Input value={qc.qc3 || ''} onChange={v => setQc('qc3', v)} placeholder="Nama QC 3..." />
          </Field>
        </div>
        <Field label="Tanggal Pemeriksaan">
          <Input type="date" value={tanggal} onChange={v => onChange('tanggal', v)} />
        </Field>
      </Card>
    </div>
  );
}
