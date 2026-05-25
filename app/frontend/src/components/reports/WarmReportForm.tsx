'use client';

import React from 'react';
import styles from './CoolingReportForm.module.css';

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

function Input({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      className={styles.input}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
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

function ThreeCol({ children }: { children: React.ReactNode }) {
  return <div className={styles.threeCol}>{children}</div>;
}

function Card({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className={styles.card}>
      {title && <div className={styles.cardTitle}>{title}</div>}
      {children}
    </div>
  );
}

function CheckItem({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
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

export default function WarmReportForm({ data, onChange }: Props) {
  const h = data.header || {};
  const gi = data.general_inspection || {};
  const rows: any[] = gi.rows || [{}, {}, {}];
  const p = data.performance_inspection || {};

  const setH = (k: string, v: string) => onChange('header', { ...h, [k]: v });

  const setRow = (idx: number, k: string, v: string) => {
    const newRows = [...rows];
    newRows[idx] = { ...newRows[idx], [k]: v };
    onChange('general_inspection', { ...gi, rows: newRows });
  };

  const setGI = (k: string, v: any) =>
    onChange('general_inspection', { ...gi, [k]: v });

  const setP = (k: string, v: any) =>
    onChange('performance_inspection', { ...p, [k]: v });

  const setFooter = (k: string, v: string) =>
    onChange('footer', { ...data.footer, [k]: v });

  return (
    <div className={styles.formWrapper}>
      {/* 1. INFO DOKUMEN */}
      <SectionTitle number="1" title="Informasi Dokumen" />
      <Card>
        <TwoCol>
          <Field label="Nomor Order Dokumen">
            <Input value={h.order_document || ''} onChange={(v) => setH('order_document', v)} placeholder="Nomor order..." />
          </Field>
          <Field label="Kode Produksi">
            <Input value={h.production_code || ''} onChange={(v) => setH('production_code', v)} placeholder="Kode produksi..." />
          </Field>
          <Field label="Nama Pelanggan">
            <Input value={h.customer || ''} onChange={(v) => setH('customer', v)} placeholder="Nama pelanggan..." />
          </Field>
          <Field label="Kategori Unit">
            <Input value={h.category || ''} onChange={(v) => setH('category', v)} placeholder="Contoh: Warm Case" />
          </Field>
          <Field label="Kode Item">
            <Input value={h.item_code || ''} onChange={(v) => setH('item_code', v)} placeholder="Kode item..." />
          </Field>
          <Field label="Nama Model" hint="Contoh: WHC-120">
            <Input value={h.model || ''} onChange={(v) => setH('model', v)} placeholder="Nama model unit..." />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Tanggal Mulai Produksi">
            <Input type="date" value={h.starting_date || ''} onChange={(v) => setH('starting_date', v)} />
          </Field>
          <Field label="Tanggal Selesai Produksi">
            <Input type="date" value={h.finishing_date || ''} onChange={(v) => setH('finishing_date', v)} />
          </Field>
          <Field label="Tanggal Inspeksi">
            <Input type="date" value={h.inspection_date || ''} onChange={(v) => setH('inspection_date', v)} />
          </Field>
        </TwoCol>
      </Card>

      {/* 2. GENERAL INSPECTION */}
      <SectionTitle number="2" title="Inspeksi Umum — Temperature" />
      <p className={styles.perfNote}>
        Isi data suhu untuk setiap bagian (Part) unit warm.
      </p>
      {rows.map((row: any, idx: number) => (
        <Card key={idx} title={`Temperature — Part ${idx + 1}`}>
          <TwoCol>
            <Field label="Nama Part / Bagian" hint="Contoh: Heater Zone 1">
              <Input value={row.part || ''} onChange={(v) => setRow(idx, 'part', v)} placeholder={`Part ${idx + 1}`} />
            </Field>
            <Field label="Setting Temperature (°C)">
              <Input value={row.setting_temp || ''} onChange={(v) => setRow(idx, 'setting_temp', v)} placeholder="°C" />
            </Field>
            <Field label="Temperature Dalam (°C)">
              <Input value={row.temp_dalam || ''} onChange={(v) => setRow(idx, 'temp_dalam', v)} placeholder="°C" />
            </Field>
            <Field label="Tipe Digital Control">
              <Input value={row.digital_type || ''} onChange={(v) => setRow(idx, 'digital_type', v)} placeholder="Contoh: TL Z40" />
            </Field>
          </TwoCol>
        </Card>
      ))}

      {/* 3. HEATING SYSTEM */}
      <SectionTitle number="3" title="Sistem Pemanas (Heating System)" />
      <Card>
        <TwoCol>
          <Field label="Type Heater">
            <Input value={gi.type_heater || ''} onChange={(v) => setGI('type_heater', v)} placeholder="Contoh: Tubular Heater" />
          </Field>
          <Field label="Jumlah Heater">
            <Input value={gi.jumlah_heater || ''} onChange={(v) => setGI('jumlah_heater', v)} placeholder="Contoh: 2" />
          </Field>
          <Field label="Ampere Start (A)">
            <Input value={gi.amp_start || ''} onChange={(v) => setGI('amp_start', v)} placeholder="A" />
          </Field>
          <Field label="Ampere Running (A)">
            <Input value={gi.amp_run || ''} onChange={(v) => setGI('amp_run', v)} placeholder="A" />
          </Field>
        </TwoCol>
        <Field label="Spesifikasi Heater">
          <textarea
            className={styles.textarea}
            rows={3}
            value={gi.spesifikasi_heater || ''}
            onChange={(e) => setGI('spesifikasi_heater', e.target.value)}
            placeholder="Contoh: 220V 500W, panjang 60cm..."
          />
        </Field>
      </Card>

      {/* 4. PERFORMANCE INSPECTION */}
      <SectionTitle number="4" title="Inspeksi Performa (Performance Inspection)" />
      <Card title="Setting 設定">
        <Field label="Setting" hint="Parameter setting unit (contoh: Set point 65°C, differential 5°C)">
          <textarea
            className={styles.textarea}
            rows={2}
            value={gi.setting || ''}
            onChange={(e) => setGI('setting', e.target.value)}
            placeholder="Contoh: Set point 65°C, differential 5°C..."
          />
        </Field>
      </Card>
      <Card title="Suhu Ruangan">
        <ThreeCol>
          <Field label="Min (°C)">
            <Input value={p.room_min || ''} onChange={(v) => setP('room_min', v)} placeholder="°C" />
          </Field>
          <Field label="Max (°C)">
            <Input value={p.room_max || ''} onChange={(v) => setP('room_max', v)} placeholder="°C" />
          </Field>
          <Field label="Humidity (%)">
            <Input value={p.room_hum || ''} onChange={(v) => setP('room_hum', v)} placeholder="%" />
          </Field>
        </ThreeCol>
      </Card>

      <Card title="QC Checklist">
        <p className={styles.checklistNote}>Centang item yang sudah terpenuhi:</p>
        <div className={styles.checklistGrid}>
          <CheckItem label="Suhu yang direquest sudah benar tercapai" checked={p.qc_1 || false} onChange={(v) => setP('qc_1', v)} />
          <div className={styles.checkItemWithInput}>
            <CheckItem label="Suhu tercapai dalam waktu:" checked={p.qc_2 || false} onChange={(v) => setP('qc_2', v)} />
            {p.qc_2 && (
              <div className={styles.inlineInputRow}>
                <Input value={p.qc_2_time || ''} onChange={(v) => setP('qc_2_time', v)} placeholder="menit" />
                <span className={styles.inlineUnit}>menit</span>
              </div>
            )}
          </div>
          <CheckItem label="Suhu maksimal akan balik ke suhu minimal tidak lebih dari jangka waktu 6 menit" checked={p.qc_3 || false} onChange={(v) => setP('qc_3', v)} />
          <CheckItem label="Unit telah melewati test tegangan listrik" checked={p.qc_4 || false} onChange={(v) => setP('qc_4', v)} />
        </div>
      </Card>

      {/* 5. TANDA TANGAN */}
      <SectionTitle number="5" title="Tanda Tangan" />
      <Card>
        <TwoCol>
          <Field label="Nama Teknisi">
            <Input value={data.footer?.tech_name || ''} onChange={(v) => setFooter('tech_name', v)} placeholder="Nama teknisi..." />
          </Field>
          <Field label="Nama Quality Control (QC)">
            <Input value={data.footer?.qc_name || ''} onChange={(v) => setFooter('qc_name', v)} placeholder="Nama QC..." />
          </Field>
        </TwoCol>
      </Card>
    </div>
  );
}
