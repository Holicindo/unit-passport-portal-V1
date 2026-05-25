'use client';

import React from 'react';
import baseStyles from './CoolingReportForm.module.css';
import iStyles from './IssueAnalysisForm.module.css';

interface Props {
  data: any;
  onChange: (section: string, val: any) => void;
}

const BAGIAN_OPTIONS = ['KACA', 'BODY & FITTING', 'LISTRIK', 'PENDINGIN', 'DRAFTER'];

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className={baseStyles.field}>
      <label className={baseStyles.fieldLabel}>{label}</label>
      {hint && <span className={baseStyles.fieldHint}>{hint}</span>}
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input
      type={type}
      className={baseStyles.input}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

function SectionTitle({ number, title }: { number: string; title: string }) {
  return (
    <div className={baseStyles.sectionTitle}>
      <span className={baseStyles.sectionNumber}>{number}</span>
      <span className={baseStyles.sectionTitleText}>{title}</span>
    </div>
  );
}

function TwoCol({ children }: { children: React.ReactNode }) {
  return <div className={baseStyles.twoCol}>{children}</div>;
}

function Card({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className={baseStyles.card}>
      {title && <div className={baseStyles.cardTitle}>{title}</div>}
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
      className={`${iStyles.checkItem} ${checked ? iStyles.checkItemActive : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className={iStyles.checkBox}>
        {checked && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5L4.5 7.5L8.5 2.5" stroke="#2e5bff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className={iStyles.checkLabel}>{label}</span>
    </button>
  );
}

export default function IssueAnalysisForm({ data, onChange }: Props) {
  const h = data.header || {};
  const bagian: string[] = data.bagian || [];
  const bagianNotes = data.bagian_notes || '';
  const mainRow = data.main_row || {};
  const bottomRow = data.bottom_row || {};
  const footer = data.footer || {};

  const setH = (k: string, v: string) => onChange('header', { ...h, [k]: v });
  const setMain = (k: string, v: string) => onChange('main_row', { ...mainRow, [k]: v });
  const setBottom = (k: string, v: string) => onChange('bottom_row', { ...bottomRow, [k]: v });

  const toggleBagian = (val: string) => {
    const updated = bagian.includes(val)
      ? bagian.filter((b) => b !== val)
      : [...bagian, val];
    onChange('bagian', updated);
  };

  return (
    <div className={baseStyles.formWrapper}>

      {/* 1. INFORMASI HEADER */}
      <SectionTitle number="1" title="Informasi Unit & Inspeksi" />
      <Card>
        <TwoCol>
          <Field label="Nama Unit">
            <Input value={h.nama_unit || ''} onChange={(v) => setH('nama_unit', v)} placeholder="Nama unit..." />
          </Field>
          <Field label="Nomor Produksi">
            <Input value={h.nomor_produksi || ''} onChange={(v) => setH('nomor_produksi', v)} placeholder="Nomor produksi..." />
          </Field>
          <Field label="Nama Customer">
            <Input value={h.nama_customer || ''} onChange={(v) => setH('nama_customer', v)} placeholder="Nama customer..." />
          </Field>
          <Field label="Serial Number">
            <Input value={h.serial_number || ''} onChange={(v) => setH('serial_number', v)} placeholder="Serial number..." />
          </Field>
          <Field label="Tanggal Produksi">
            <Input type="date" value={h.tanggal_produksi || ''} onChange={(v) => setH('tanggal_produksi', v)} />
          </Field>
          <Field label="Tanggal Inspeksi">
            <Input type="date" value={h.tanggal_inspeksi || ''} onChange={(v) => setH('tanggal_inspeksi', v)} />
          </Field>
          <Field label="Pemeriksa">
            <Input value={h.pemeriksa || ''} onChange={(v) => setH('pemeriksa', v)} placeholder="Nama pemeriksa..." />
          </Field>
          <Field label="Nomor Form" hint="Contoh: #QC3604002">
            <Input value={h.nomor_form || ''} onChange={(v) => setH('nomor_form', v)} placeholder="#QC0000000" />
          </Field>
        </TwoCol>
      </Card>

      {/* 2. BAGIAN BERMASALAH */}
      <SectionTitle number="2" title="Bagian Bermasalah" />
      <Card>
        <div className={iStyles.checkList}>
          {BAGIAN_OPTIONS.map((opt) => (
            <CheckItem
              key={opt}
              label={opt}
              checked={bagian.includes(opt)}
              onChange={() => toggleBagian(opt)}
            />
          ))}
        </div>
        <div style={{ marginTop: '16px' }}>
          <Field label="Keterangan Tambahan Bagian">
            <textarea
              className={baseStyles.textarea}
              rows={3}
              value={bagianNotes}
              onChange={(e) => onChange('bagian_notes', e.target.value)}
              placeholder="Keterangan tambahan bagian bermasalah..."
            />
          </Field>
        </div>
      </Card>

      {/* 3. ANALISIS MASALAH */}
      <SectionTitle number="3" title="Analisis Masalah" />
      <Card>
        <Field label="Deskripsi Masalah">
          <textarea
            className={baseStyles.textarea}
            rows={3}
            value={mainRow.deskripsi || ''}
            onChange={(e) => setMain('deskripsi', e.target.value)}
            placeholder="Deskripsikan masalah yang ditemukan..."
          />
        </Field>
        <Field label="Analisis Penyebab Masalah">
          <textarea
            className={baseStyles.textarea}
            rows={4}
            value={mainRow.analisis || ''}
            onChange={(e) => setMain('analisis', e.target.value)}
            placeholder="Analisis penyebab masalah secara detail..."
          />
        </Field>
        <TwoCol>
          <Field label="Tindakan Perbaikan">
            <textarea
              className={baseStyles.textarea}
              rows={3}
              value={mainRow.tindakan_perbaikan || ''}
              onChange={(e) => setMain('tindakan_perbaikan', e.target.value)}
              placeholder="Tindakan perbaikan yang dilakukan..."
            />
          </Field>
          <Field label="Tindakan Pencegahan">
            <textarea
              className={baseStyles.textarea}
              rows={3}
              value={mainRow.tindakan_pencegahan || ''}
              onChange={(e) => setMain('tindakan_pencegahan', e.target.value)}
              placeholder="Tindakan pencegahan agar tidak terulang..."
            />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Pembuat">
            <Input value={mainRow.pembuat || ''} onChange={(v) => setMain('pembuat', v)} placeholder="Nama pembuat laporan..." />
          </Field>
          <div>
            <Field label="Penanggung Jawab 1">
              <Input value={mainRow.pj_top || ''} onChange={(v) => setMain('pj_top', v)} placeholder="Nama penanggung jawab 1..." />
            </Field>
            <Field label="Penanggung Jawab 2">
              <Input value={mainRow.pj_bottom || ''} onChange={(v) => setMain('pj_bottom', v)} placeholder="Nama penanggung jawab 2..." />
            </Field>
          </div>
        </TwoCol>
      </Card>

      {/* 4. INFORMASI PERBAIKAN */}
      <SectionTitle number="4" title="Informasi Perbaikan" />
      <Card>
        <TwoCol>
          <Field label="Bahan yang Digunakan">
            <textarea
              className={baseStyles.textarea}
              rows={3}
              value={bottomRow.bahan || ''}
              onChange={(e) => setBottom('bahan', e.target.value)}
              placeholder="Bahan / material yang digunakan..."
            />
          </Field>
          <Field label="Durasi Perbaikan">
            <textarea
              className={baseStyles.textarea}
              rows={3}
              value={bottomRow.durasi || ''}
              onChange={(e) => setBottom('durasi', e.target.value)}
              placeholder="Durasi perbaikan (contoh: 2 jam)..."
            />
          </Field>
          <Field label="Jumlah Pekerja">
            <Input value={bottomRow.jumlah_pekerja || ''} onChange={(v) => setBottom('jumlah_pekerja', v)} placeholder="Jumlah pekerja yang terlibat..." />
          </Field>
          <Field label="Lokasi Ditemukan">
            <Input value={bottomRow.lokasi || ''} onChange={(v) => setBottom('lokasi', v)} placeholder="Lokasi ditemukan masalah..." />
          </Field>
          <Field label="Tahap Perbaikan">
            <textarea
              className={baseStyles.textarea}
              rows={3}
              value={bottomRow.tahap_perbaikan || ''}
              onChange={(e) => setBottom('tahap_perbaikan', e.target.value)}
              placeholder="Tahap-tahap perbaikan yang dilakukan..."
            />
          </Field>
          <Field label="Catatan">
            <textarea
              className={baseStyles.textarea}
              rows={3}
              value={bottomRow.catatan || ''}
              onChange={(e) => setBottom('catatan', e.target.value)}
              placeholder="Catatan tambahan..."
            />
          </Field>
        </TwoCol>
      </Card>

      {/* 5. TANDA TANGAN */}
      <SectionTitle number="5" title="Tanda Tangan" />
      <Card>
        <div className={baseStyles.twoCol} style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          <Field label="Mengetahui">
            <Input value={footer.mengetahui || ''} onChange={(v) => onChange('footer', { ...footer, mengetahui: v })} placeholder="Nama yang mengetahui..." />
          </Field>
          <Field label="Disetujui">
            <Input value={footer.disetujui || ''} onChange={(v) => onChange('footer', { ...footer, disetujui: v })} placeholder="Nama yang menyetujui..." />
          </Field>
          <Field label="Dibuat">
            <Input value={footer.dibuat || ''} onChange={(v) => onChange('footer', { ...footer, dibuat: v })} placeholder="Nama pembuat..." />
          </Field>
        </div>
      </Card>

    </div>
  );
}
