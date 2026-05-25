'use client';

import React from 'react';
import styles from './CoolingReportForm.module.css';
import reworkStyles from './ReworkReportForm.module.css';

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

function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
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

function Card({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className={styles.card}>
      {title && <div className={styles.cardTitle}>{title}</div>}
      {children}
    </div>
  );
}

function CheckItem({
  label,
  checked,
  onChange,
  hasInput,
  inputValue,
  onInputChange,
  inputPlaceholder,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hasInput?: boolean;
  inputValue?: string;
  onInputChange?: (v: string) => void;
  inputPlaceholder?: string;
}) {
  return (
    <div className={reworkStyles.checkRow}>
      <button
        type="button"
        className={`${reworkStyles.checkItem} ${checked ? reworkStyles.checkItemActive : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span className={reworkStyles.checkBox}>
          {checked && (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5L4.5 7.5L8.5 2.5" stroke="#2e5bff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
        <span className={reworkStyles.checkLabel}>{label}</span>
      </button>
      {hasInput && checked && onInputChange && (
        <input
          type="text"
          className={reworkStyles.checkInlineInput}
          value={inputValue || ''}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={inputPlaceholder || 'Isi keterangan...'}
        />
      )}
    </div>
  );
}

const EMPTY_ROW = {
  komponen: '',
  deskripsi: '',
  tindakan: '',
  yang_memperbaiki: '',
  status: '',
  tanggal_selesai: '',
};

export default function ReworkReportForm({ data, onChange }: Props) {
  const h = data.header || {};
  const rows: any[] = data.rework_items || Array(6).fill(null).map(() => ({ ...EMPTY_ROW }));
  const penyebab = data.penyebab || {};
  const verifikasi = data.verifikasi || {};
  const catatan = data.catatan || '';

  const setH = (k: string, v: string) => onChange('header', { ...h, [k]: v });

  const setRow = (i: number, k: string, v: string) => {
    const updated = rows.map((r, idx) => (idx === i ? { ...r, [k]: v } : r));
    onChange('rework_items', updated);
  };

  const addRow = () => {
    onChange('rework_items', [...rows, { ...EMPTY_ROW }]);
  };

  const removeRow = (i: number) => {
    if (rows.length <= 1) return;
    onChange('rework_items', rows.filter((_, idx) => idx !== i));
  };

  const setPenyebab = (k: string, v: any) => onChange('penyebab', { ...penyebab, [k]: v });
  const setVerifikasi = (k: string, v: any) => onChange('verifikasi', { ...verifikasi, [k]: v });

  return (
    <div className={styles.formWrapper}>

      {/* 1. INFORMASI HEADER */}
      <SectionTitle number="1" title="Informasi Unit" />
      <Card>
        <TwoCol>
          <Field label="Nama Unit">
            <Input value={h.nama_unit || ''} onChange={(v) => setH('nama_unit', v)} placeholder="Nama unit..." />
          </Field>
          <Field label="Serial Number">
            <Input value={h.serial_number || ''} onChange={(v) => setH('serial_number', v)} placeholder="Serial number..." />
          </Field>
          <Field label="Nama Customer">
            <Input value={h.nama_customer || ''} onChange={(v) => setH('nama_customer', v)} placeholder="Nama customer..." />
          </Field>
          <Field label="ITR">
            <Input value={h.itr || ''} onChange={(v) => setH('itr', v)} placeholder="Nomor ITR..." />
          </Field>
          <Field label="Nomor Produksi">
            <Input value={h.nomor_produksi || ''} onChange={(v) => setH('nomor_produksi', v)} placeholder="Nomor produksi..." />
          </Field>
          <Field label="Tanggal Ditemukan Masalah">
            <Input type="date" value={h.tanggal_masalah || ''} onChange={(v) => setH('tanggal_masalah', v)} />
          </Field>
        </TwoCol>
      </Card>

      {/* 2. TABEL INFORMASI PEKERJAAN REWORK */}
      <SectionTitle number="2" title="Informasi Pekerjaan Rework" />
      <Card>
        <div className={reworkStyles.tableWrapper}>
          <table className={reworkStyles.reworkTable}>
            <thead>
              <tr>
                <th style={{ width: '40px' }}>NO</th>
                <th>Komponen</th>
                <th>Deskripsi Kerusakan / Cacat</th>
                <th>Tindakan Rework</th>
                <th>Yang Memperbaiki</th>
                <th style={{ width: '90px' }}>Status (OK/NG)</th>
                <th style={{ width: '110px' }}>Tanggal Selesai</th>
                <th style={{ width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  <td className={reworkStyles.centerCell}>{i + 1}</td>
                  <td>
                    <input
                      type="text"
                      className={reworkStyles.tableInput}
                      value={row.komponen || ''}
                      onChange={(e) => setRow(i, 'komponen', e.target.value)}
                      placeholder="Komponen..."
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className={reworkStyles.tableInput}
                      value={row.deskripsi || ''}
                      onChange={(e) => setRow(i, 'deskripsi', e.target.value)}
                      placeholder="Deskripsi kerusakan..."
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className={reworkStyles.tableInput}
                      value={row.tindakan || ''}
                      onChange={(e) => setRow(i, 'tindakan', e.target.value)}
                      placeholder="Tindakan yang dilakukan..."
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className={reworkStyles.tableInput}
                      value={row.yang_memperbaiki || ''}
                      onChange={(e) => setRow(i, 'yang_memperbaiki', e.target.value)}
                      placeholder="Nama teknisi..."
                    />
                  </td>
                  <td>
                    <select
                      className={reworkStyles.tableSelect}
                      value={row.status || ''}
                      onChange={(e) => setRow(i, 'status', e.target.value)}
                    >
                      <option value="">— Pilih —</option>
                      <option value="OK">OK</option>
                      <option value="NG">NG</option>
                    </select>
                  </td>
                  <td>
                    <input
                      type="date"
                      className={reworkStyles.tableInput}
                      value={row.tanggal_selesai || ''}
                      onChange={(e) => setRow(i, 'tanggal_selesai', e.target.value)}
                    />
                  </td>
                  <td className={reworkStyles.centerCell}>
                    <button
                      type="button"
                      className={reworkStyles.removeRowBtn}
                      onClick={() => removeRow(i)}
                      title="Hapus baris"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="button" className={reworkStyles.addRowBtn} onClick={addRow}>
          + Tambah Baris
        </button>
      </Card>

      {/* 3. PENYEBAB REWORK */}
      <SectionTitle number="3" title="Penyebab Rework (Centang yang Sesuai)" />
      <Card>
        <div className={reworkStyles.checkList}>
          <CheckItem
            label="Human Error"
            checked={penyebab.human_error || false}
            onChange={(v) => setPenyebab('human_error', v)}
          />
          <CheckItem
            label="Material Defect"
            checked={penyebab.material_defect || false}
            onChange={(v) => setPenyebab('material_defect', v)}
          />
          <CheckItem
            label="Proses Tidak Sesuai"
            checked={penyebab.proses_tidak_sesuai || false}
            onChange={(v) => setPenyebab('proses_tidak_sesuai', v)}
          />
          <CheckItem
            label="Desain / Spesifikasi"
            checked={penyebab.desain_spesifikasi || false}
            onChange={(v) => setPenyebab('desain_spesifikasi', v)}
          />
          <CheckItem
            label="Lainnya"
            checked={penyebab.lainnya || false}
            onChange={(v) => setPenyebab('lainnya', v)}
            hasInput
            inputValue={penyebab.lainnya_text || ''}
            onInputChange={(v) => setPenyebab('lainnya_text', v)}
            inputPlaceholder="Sebutkan penyebab lainnya..."
          />
        </div>
      </Card>

      {/* 4. HASIL VERIFIKASI SETELAH REWORK */}
      <SectionTitle number="4" title="Hasil Verifikasi Setelah Rework" />
      <Card>
        <div className={reworkStyles.checkList}>
          <CheckItem
            label="Sesuai Spesifikasi"
            checked={verifikasi.sesuai_spesifikasi || false}
            onChange={(v) => setVerifikasi('sesuai_spesifikasi', v)}
          />
          <CheckItem
            label="Tidak Sesuai — Perlu Rework Ulang"
            checked={verifikasi.tidak_sesuai || false}
            onChange={(v) => setVerifikasi('tidak_sesuai', v)}
          />
          <CheckItem
            label="Ditolak"
            checked={verifikasi.ditolak || false}
            onChange={(v) => setVerifikasi('ditolak', v)}
          />
        </div>
      </Card>

      {/* 5. CATATAN TAMBAHAN */}
      <SectionTitle number="5" title="Catatan Tambahan" />
      <Card>
        <Field label="Catatan">
          <textarea
            className={styles.textarea}
            rows={4}
            value={catatan}
            onChange={(e) => onChange('catatan', e.target.value)}
            placeholder="Tulis catatan tambahan jika ada..."
          />
        </Field>
      </Card>

      {/* 6. TANDA TANGAN */}
      <SectionTitle number="6" title="Tanda Tangan" />
      <Card>
        <TwoCol>
          <Field label="Pemeriksa QC">
            <Input
              value={data.footer?.pemeriksa_qc || ''}
              onChange={(v) => onChange('footer', { ...data.footer, pemeriksa_qc: v })}
              placeholder="Nama pemeriksa QC..."
            />
          </Field>
          <Field label="Mengetahui">
            <Input
              value={data.footer?.mengetahui || ''}
              onChange={(v) => onChange('footer', { ...data.footer, mengetahui: v })}
              placeholder="Nama yang mengetahui..."
            />
          </Field>
        </TwoCol>
      </Card>
    </div>
  );
}
