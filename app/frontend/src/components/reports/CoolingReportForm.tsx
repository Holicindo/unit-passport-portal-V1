'use client';

import React from 'react';
import styles from './CoolingReportForm.module.css';
import { CheckSquare, Square } from 'lucide-react';

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
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

function SectionTitle({ number, title, icon }: { number: string; title: string; icon?: string }) {
  return (
    <div className={styles.sectionTitle}>
      <span className={styles.sectionNumber}>{number}</span>
      <span className={styles.sectionTitleText}>{icon} {title}</span>
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
    <button type="button" className={`${styles.checkItem} ${checked ? styles.checkItemActive : ''}`} onClick={() => onChange(!checked)}>
      <span className={styles.checkIcon}>
        {checked ? <CheckSquare size={20} color="#2e5bff" /> : <Square size={20} color="#94a3b8" />}
      </span>
      <span className={styles.checkLabel}>{label}</span>
    </button>
  );
}

export default function CoolingReportForm({ data, onChange }: Props) {
  const h = data.header || {};
  const g = data.general_inspection || {};
  const cl = data.cooling_system?.left || {};
  const cr = data.cooling_system?.right || {};
  const p = data.performance_inspection || {};

  const setH = (k: string, v: string) => onChange('header', { ...h, [k]: v });
  const setG = (k: string, v: string) => onChange('general_inspection', { ...g, [k]: v });
  const setCL = (k: string, v: any) => onChange('cooling_system', { ...data.cooling_system, left: { ...cl, [k]: v } });
  const setCR = (k: string, v: any) => onChange('cooling_system', { ...data.cooling_system, right: { ...cr, [k]: v } });
  const setP = (k: string, v: any) => onChange('performance_inspection', { ...p, [k]: v });
  const setFooter = (k: string, v: string) => onChange('footer', { ...data.footer, [k]: v });

  return (
    <div className={styles.formWrapper}>

      {/* ── SECTION 1: INFO DOKUMEN ── */}
      <SectionTitle number="1" title="Informasi Dokumen" icon="📋" />
      <Card>
        <TwoCol>
          <Field label="Nomor Order Dokumen" hint="Contoh: 2025-001">
            <Input value={h.order_document || ''} onChange={v => setH('order_document', v)} placeholder="Nomor order..." />
          </Field>
          <Field label="Kode Produksi" hint="Contoh: PRO-2025">
            <Input value={h.production_code || ''} onChange={v => setH('production_code', v)} placeholder="Kode produksi..." />
          </Field>
          <Field label="Nama Pelanggan">
            <Input value={h.customer || ''} onChange={v => setH('customer', v)} placeholder="Nama pelanggan..." />
          </Field>
          <Field label="Kategori Unit">
            <Input value={h.category || ''} onChange={v => setH('category', v)} placeholder="Contoh: Cold Case" />
          </Field>
          <Field label="Kode Item">
            <Input value={h.item_code || ''} onChange={v => setH('item_code', v)} placeholder="Kode item..." />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Tanggal Mulai Produksi" hint="Tanggal unit mulai dikerjakan">
            <Input type="date" value={h.starting_date || ''} onChange={v => setH('starting_date', v)} />
          </Field>
          <Field label="Tanggal Selesai Produksi" hint="Tanggal unit selesai dikerjakan">
            <Input type="date" value={h.finishing_date || ''} onChange={v => setH('finishing_date', v)} />
          </Field>
          <Field label="Tanggal Inspeksi" hint="Tanggal laporan ini dibuat">
            <Input type="date" value={h.inspection_date || ''} onChange={v => setH('inspection_date', v)} />
          </Field>
        </TwoCol>
      </Card>

      {/* ── SECTION 2: GENERAL INSPECTION ── */}
      <SectionTitle number="2" title="Inspeksi Umum (General Inspection)" icon="🌡️" />
      <Card>
        <TwoCol>
          <Field label="Bagian / Part" hint="Contoh: chiller, freezer">
            <Input value={g.part || ''} onChange={v => setG('part', v)} placeholder="Contoh: chiller" />
          </Field>
          <Field label="Suhu yang Diminta (Required)" hint="Contoh: -18°C s/d -22°C">
            <Input value={g.required || ''} onChange={v => setG('required', v)} placeholder="Contoh: -18 s/d -22" />
          </Field>
          <Field label="Suhu Setting (Suhu Disetting)" hint="Suhu yang diset di controller">
            <Input value={g.setting_temp || ''} onChange={v => setG('setting_temp', v)} placeholder="Contoh: 2 - 6" />
          </Field>
          <Field label="Suhu Dalam Kabinet" hint="Suhu aktual di dalam kabinet">
            <Input value={g.temp_dalam || ''} onChange={v => setG('temp_dalam', v)} placeholder="Contoh: 2 - 8" />
          </Field>
          <Field label="Tipe Kontrol Digital" hint="Contoh: TL Z40, Dixell">
            <Input value={g.digital_type || ''} onChange={v => setG('digital_type', v)} placeholder="Contoh: TL Z40" />
          </Field>
        </TwoCol>
        <Field label="Parameter Setting Controller" hint="Isi semua parameter yang diset, contoh: E1=2, E12=2, ...">
          <textarea
            className={styles.textarea}
            value={g.setting || ''}
            onChange={e => setG('setting', e.target.value)}
            placeholder="Contoh: E1=2 E12=2 E13=5 ..."
            rows={3}
          />
        </Field>
      </Card>

      {/* ── SECTION 3: COOLING SYSTEM ── */}
      <SectionTitle number="3" title="Sistem Pendingin (Cooling System)" icon="❄️" />

      {/* Compressor */}
      <div className={styles.subSectionTitle}>🔧 Kompresor (Compressor)</div>
      <div className={styles.sideBySide}>
        <Card title="Sisi Kiri (Left)">
          <Field label="Tipe Kompresor">
            <Input value={cl.comp_type || ''} onChange={v => setCL('comp_type', v)} placeholder="Contoh: Embraco" />
          </Field>
          <Field label="Serial Number Kompresor">
            <Input value={cl.comp_sn || ''} onChange={v => setCL('comp_sn', v)} placeholder="Nomor seri..." />
          </Field>
          <ThreeCol>
            <Field label="Tipe Freon">
              <Input value={cl.freon_type || ''} onChange={v => setCL('freon_type', v)} placeholder="R134a" />
            </Field>
            <Field label="Berat Freon (gram)">
              <Input value={cl.freon_weight || ''} onChange={v => setCL('freon_weight', v)} placeholder="gram" />
            </Field>
          </ThreeCol>
          <TwoCol>
            <Field label="Tekanan Start (PSI)">
              <Input value={cl.press_start || ''} onChange={v => setCL('press_start', v)} placeholder="PSI" />
            </Field>
            <Field label="Tekanan Running (PSI)">
              <Input value={cl.press_run || ''} onChange={v => setCL('press_run', v)} placeholder="PSI" />
            </Field>
            <Field label="Ampere Start (A)">
              <Input value={cl.amp_start || ''} onChange={v => setCL('amp_start', v)} placeholder="A" />
            </Field>
            <Field label="Ampere Running (A)">
              <Input value={cl.amp_run || ''} onChange={v => setCL('amp_run', v)} placeholder="A" />
            </Field>
          </TwoCol>
        </Card>
        <Card title="Sisi Kanan (Right)">
          <Field label="Tipe Kompresor">
            <Input value={cr.comp_type || ''} onChange={v => setCR('comp_type', v)} placeholder="Contoh: Embraco" />
          </Field>
          <Field label="Serial Number Kompresor">
            <Input value={cr.comp_sn || ''} onChange={v => setCR('comp_sn', v)} placeholder="Nomor seri..." />
          </Field>
          <ThreeCol>
            <Field label="Tipe Freon">
              <Input value={cr.freon_type || ''} onChange={v => setCR('freon_type', v)} placeholder="R134a" />
            </Field>
            <Field label="Berat Freon (gram)">
              <Input value={cr.freon_weight || ''} onChange={v => setCR('freon_weight', v)} placeholder="gram" />
            </Field>
          </ThreeCol>
          <TwoCol>
            <Field label="Tekanan Start (PSI)">
              <Input value={cr.press_start || ''} onChange={v => setCR('press_start', v)} placeholder="PSI" />
            </Field>
            <Field label="Tekanan Running (PSI)">
              <Input value={cr.press_run || ''} onChange={v => setCR('press_run', v)} placeholder="PSI" />
            </Field>
            <Field label="Ampere Start (A)">
              <Input value={cr.amp_start || ''} onChange={v => setCR('amp_start', v)} placeholder="A" />
            </Field>
            <Field label="Ampere Running (A)">
              <Input value={cr.amp_run || ''} onChange={v => setCR('amp_run', v)} placeholder="A" />
            </Field>
          </TwoCol>
        </Card>
      </div>

      {/* Condensor */}
      <div className={styles.subSectionTitle}>🌬️ Kondensor (Condensor)</div>
      <div className={styles.sideBySide}>
        <Card title="Sisi Kiri (Left)">
          <Field label="Keterangan Kondensor">
            <textarea className={styles.textarea} rows={2} value={cl.condensor || ''} onChange={e => setCL('condensor', e.target.value)} placeholder="Keterangan kondensor kiri..." />
          </Field>
        </Card>
        <Card title="Sisi Kanan (Right)">
          <Field label="Keterangan Kondensor">
            <textarea className={styles.textarea} rows={2} value={cr.condensor || ''} onChange={e => setCR('condensor', e.target.value)} placeholder="Keterangan kondensor kanan..." />
          </Field>
        </Card>
      </div>

      {/* Evaporator */}
      <div className={styles.subSectionTitle}>🧊 Evaporator</div>
      <div className={styles.sideBySide}>
        <Card title="Sisi Kiri (Left)">
          <ThreeCol>
            <Field label="Diameter (Ø)">
              <Input value={cl.evap_dia || ''} onChange={v => setCL('evap_dia', v)} placeholder="mm" />
            </Field>
            <Field label="Panjang (x)">
              <Input value={cl.evap_length || ''} onChange={v => setCL('evap_length', v)} placeholder="mm" />
            </Field>
            <Field label="Row (R x)">
              <Input value={cl.evap_t || ''} onChange={v => setCL('evap_t', v)} placeholder="T" />
            </Field>
          </ThreeCol>
          <TwoCol>
            <Field label="GAP (mm)">
              <Input value={cl.evap_gap || ''} onChange={v => setCL('evap_gap', v)} placeholder="mm" />
            </Field>
            <Field label="Ukuran x (mm)">
              <Input value={cl.evap_x || ''} onChange={v => setCL('evap_x', v)} placeholder="mm" />
            </Field>
          </TwoCol>
          <div className={styles.checkRow}>
            <CheckItem label="Menggunakan Capiler" checked={cl.has_capiler || false} onChange={v => setCL('has_capiler', v)} />
            {cl.has_capiler && (
              <Field label="Ukuran Capiler (cm)">
                <Input value={cl.capiler_size || ''} onChange={v => setCL('capiler_size', v)} placeholder="cm" />
              </Field>
            )}
            <CheckItem label="Menggunakan Expansion Valve" checked={cl.has_expansion || false} onChange={v => setCL('has_expansion', v)} />
          </div>
        </Card>
        <Card title="Sisi Kanan (Right)">
          <ThreeCol>
            <Field label="Diameter (Ø)">
              <Input value={cr.evap_dia || ''} onChange={v => setCR('evap_dia', v)} placeholder="mm" />
            </Field>
            <Field label="Panjang (x)">
              <Input value={cr.evap_length || ''} onChange={v => setCR('evap_length', v)} placeholder="mm" />
            </Field>
            <Field label="Row (R x)">
              <Input value={cr.evap_t || ''} onChange={v => setCR('evap_t', v)} placeholder="T" />
            </Field>
          </ThreeCol>
          <TwoCol>
            <Field label="GAP (mm)">
              <Input value={cr.evap_gap || ''} onChange={v => setCR('evap_gap', v)} placeholder="mm" />
            </Field>
            <Field label="Ukuran x (mm)">
              <Input value={cr.evap_x || ''} onChange={v => setCR('evap_x', v)} placeholder="mm" />
            </Field>
          </TwoCol>
          <div className={styles.checkRow}>
            <CheckItem label="Menggunakan Capiler" checked={cr.has_capiler || false} onChange={v => setCR('has_capiler', v)} />
            {cr.has_capiler && (
              <Field label="Ukuran Capiler (cm)">
                <Input value={cr.capiler_size || ''} onChange={v => setCR('capiler_size', v)} placeholder="cm" />
              </Field>
            )}
            <CheckItem label="Menggunakan Expansion Valve" checked={cr.has_expansion || false} onChange={v => setCR('has_expansion', v)} />
          </div>
        </Card>
      </div>

      {/* Fan Evap */}
      <div className={styles.subSectionTitle}>💨 Fan Evaporator & Fan Antimist</div>
      <div className={styles.sideBySide}>
        <Card title="Sisi Kiri (Left)">
          <Field label="Model Fan Evaporator">
            <Input value={cl.fan_evap_model || ''} onChange={v => setCL('fan_evap_model', v)} placeholder="Contoh: EBM-Papst" />
          </Field>
          <Field label="Jumlah Fan Evap (PCS)">
            <Input value={cl.fan_evap_qty || ''} onChange={v => setCL('fan_evap_qty', v)} placeholder="Contoh: 2" />
          </Field>
          <Field label="Keterangan Fan Antimist">
            <textarea className={styles.textarea} rows={2} value={cl.fan_antimist_notes || ''} onChange={e => setCL('fan_antimist_notes', e.target.value)} placeholder="Keterangan fan antimist kiri..." />
          </Field>
        </Card>
        <Card title="Sisi Kanan (Right)">
          <Field label="Model Fan Evaporator">
            <Input value={cr.fan_evap_model || ''} onChange={v => setCR('fan_evap_model', v)} placeholder="Contoh: EBM-Papst" />
          </Field>
          <Field label="Jumlah Fan Evap (PCS)">
            <Input value={cr.fan_evap_qty || ''} onChange={v => setCR('fan_evap_qty', v)} placeholder="Contoh: 2" />
          </Field>
          <Field label="Keterangan Fan Antimist">
            <textarea className={styles.textarea} rows={2} value={cr.fan_antimist_notes || ''} onChange={e => setCR('fan_antimist_notes', e.target.value)} placeholder="Keterangan fan antimist kanan..." />
          </Field>
        </Card>
      </div>

      {/* ── SECTION 4: PERFORMANCE INSPECTION ── */}
      <SectionTitle number="4" title="Inspeksi Performa (Performance Inspection)" icon="📊" />
      <p className={styles.perfNote}>
        💡 Isi suhu-suhu berikut sesuai hasil pengukuran aktual. Data ini akan otomatis ditampilkan pada diagram laporan.
      </p>

      {/* Evaporator temps */}
      <Card title="🧊 Suhu Evaporator">
        <TwoCol>
          <Field label="Suhu Evaporator — Min (°C)">
            <Input value={p.evap_min || ''} onChange={v => setP('evap_min', v)} placeholder="Contoh: -5" />
          </Field>
          <Field label="Suhu Evaporator — Max (°C)">
            <Input value={p.evap_max || ''} onChange={v => setP('evap_max', v)} placeholder="Contoh: -2" />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Sisi Kiri — Min (°C)">
            <Input value={p.evap_left_min || ''} onChange={v => setP('evap_left_min', v)} placeholder="°C" />
          </Field>
          <Field label="Sisi Kiri — Max (°C)">
            <Input value={p.evap_left_max || ''} onChange={v => setP('evap_left_max', v)} placeholder="°C" />
          </Field>
          <Field label="Sisi Kanan — Min (°C)">
            <Input value={p.evap_right_min || ''} onChange={v => setP('evap_right_min', v)} placeholder="°C" />
          </Field>
          <Field label="Sisi Kanan — Max (°C)">
            <Input value={p.evap_right_max || ''} onChange={v => setP('evap_right_max', v)} placeholder="°C" />
          </Field>
        </TwoCol>
      </Card>

      {/* Dalam Kabinet */}
      <Card title="🏠 Suhu Dalam Kabinet">
        <ThreeCol>
          <Field label="Min (°C)">
            <Input value={p.kabinet_min || ''} onChange={v => setP('kabinet_min', v)} placeholder="°C" />
          </Field>
          <Field label="Max (°C)">
            <Input value={p.kabinet_max || ''} onChange={v => setP('kabinet_max', v)} placeholder="°C" />
          </Field>
          <Field label="Kelembaban / Humidity (%)">
            <Input value={p.kabinet_hum || ''} onChange={v => setP('kabinet_hum', v)} placeholder="%" />
          </Field>
        </ThreeCol>
      </Card>

      {/* Suhu Ruangan */}
      <Card title="🌡️ Suhu Ruangan">
        <ThreeCol>
          <Field label="Min (°C)">
            <Input value={p.room_min || ''} onChange={v => setP('room_min', v)} placeholder="°C" />
          </Field>
          <Field label="Max (°C)">
            <Input value={p.room_max || ''} onChange={v => setP('room_max', v)} placeholder="°C" />
          </Field>
          <Field label="Kelembaban / Humidity (%)">
            <Input value={p.room_hum || ''} onChange={v => setP('room_hum', v)} placeholder="%" />
          </Field>
        </ThreeCol>
      </Card>

      {/* Kondenser & Kompresor */}
      <div className={styles.sideBySide}>
        <Card title="🌬️ Suhu Kondenser">
          <TwoCol>
            <Field label="Min (°C)">
              <Input value={p.cond_min || ''} onChange={v => setP('cond_min', v)} placeholder="°C" />
            </Field>
            <Field label="Max (°C)">
              <Input value={p.cond_max || ''} onChange={v => setP('cond_max', v)} placeholder="°C" />
            </Field>
          </TwoCol>
        </Card>
        <Card title="🔧 Suhu Kompresor">
          <TwoCol>
            <Field label="Min (°C)">
              <Input value={p.comp_min || ''} onChange={v => setP('comp_min', v)} placeholder="°C" />
            </Field>
            <Field label="Max (°C)">
              <Input value={p.comp_max || ''} onChange={v => setP('comp_max', v)} placeholder="°C" />
            </Field>
          </TwoCol>
        </Card>
      </div>

      {/* QC Checklist */}
      <Card title="✅ QC Checklist">
        <p className={styles.checklistNote}>Centang item yang sudah terpenuhi / lulus pemeriksaan:</p>
        <div className={styles.checklistGrid}>
          <CheckItem
            label="Suhu yang direquest sudah benar tercapai"
            checked={p.qc_1 || false}
            onChange={v => setP('qc_1', v)}
          />
          <div className={styles.checkItemWithInput}>
            <CheckItem
              label="Suhu tercapai dalam waktu:"
              checked={p.qc_2 || false}
              onChange={v => setP('qc_2', v)}
            />
            {p.qc_2 && (
              <div className={styles.inlineInputRow}>
                <Input value={p.qc_2_time || ''} onChange={v => setP('qc_2_time', v)} placeholder="menit" />
                <span className={styles.inlineUnit}>menit</span>
              </div>
            )}
          </div>
          <CheckItem
            label="Suhu maksimal akan balik ke suhu minimal tidak lebih dari 6 menit"
            checked={p.qc_3 || false}
            onChange={v => setP('qc_3', v)}
          />
          <CheckItem
            label="Unit telah melewati test tegangan listrik"
            checked={p.qc_4 || false}
            onChange={v => setP('qc_4', v)}
          />
        </div>
      </Card>

      {/* ── SECTION 5: TANDA TANGAN ── */}
      <SectionTitle number="5" title="Tanda Tangan" icon="✍️" />
      <Card>
        <TwoCol>
          <Field label="Nama Teknisi">
            <Input value={data.footer?.tech_name || ''} onChange={v => setFooter('tech_name', v)} placeholder="Nama teknisi..." />
          </Field>
          <Field label="Nama Quality Control (QC)">
            <Input value={data.footer?.qc_name || ''} onChange={v => setFooter('qc_name', v)} placeholder="Nama QC..." />
          </Field>
        </TwoCol>
      </Card>

    </div>
  );
}
