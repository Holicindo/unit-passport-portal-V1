'use client';

import React from 'react';
import styles from './CoolingReportForm.module.css'; // reuse same form styles
import formStyles from './InspectionReportForm.module.css';
import { CheckCircle2, XCircle, Circle } from 'lucide-react';

interface Props {
  data: any;
  onChange: (newData: any) => void;
}

// ── Reusable primitives ──────────────────────────────────────

function SectionTitle({ number, title, icon }: { number: string; title: string; icon?: string }) {
  return (
    <div className={styles.sectionTitle}>
      <span className={styles.sectionNumber}>{number}</span>
      <span className={styles.sectionTitleText}>{icon} {title}</span>
    </div>
  );
}

function Card({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className={styles.card}>
      {title && <div className={styles.cardTitle}>{title}</div>}
      {children}
    </div>
  );
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

function TwoCol({ children }: { children: React.ReactNode }) {
  return <div className={styles.twoCol}>{children}</div>;
}

function ThreeCol({ children }: { children: React.ReactNode }) {
  return <div className={styles.threeCol}>{children}</div>;
}

// Pass / Fail toggle button
function PassFail({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className={formStyles.passFail}>
      <button
        type="button"
        className={`${formStyles.passBtn} ${value === 'V' ? formStyles.passActive : ''}`}
        onClick={() => onChange(value === 'V' ? '' : 'V')}
      >
        <CheckCircle2 size={16} />
        <span>PASS</span>
      </button>
      <button
        type="button"
        className={`${formStyles.failBtn} ${value === 'X' ? formStyles.failActive : ''}`}
        onClick={() => onChange(value === 'X' ? '' : 'X')}
      >
        <XCircle size={16} />
        <span>FAIL</span>
      </button>
    </div>
  );
}

// Visual check item row
function VisualItem({ number, label, value, onChange }: {
  number: number; label: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className={`${formStyles.visualItem} ${value === 'V' ? formStyles.visualPass : value === 'X' ? formStyles.visualFail : ''}`}>
      <span className={formStyles.visualNum}>{number}</span>
      <span className={formStyles.visualLabel}>{label}</span>
      <PassFail value={value} onChange={onChange} />
    </div>
  );
}

// Performance row
function PerfRow({ label, requirement, condition, value, result, remarks, onValue, onResult, onRemarks }: {
  label: string; requirement: string; condition: string;
  value: string; result: string; remarks: string;
  onValue: (v: string) => void; onResult: (v: string) => void; onRemarks: (v: string) => void;
}) {
  return (
    <div className={formStyles.perfRow}>
      <div className={formStyles.perfLeft}>
        <div className={formStyles.perfLabel}>{label}</div>
        <div className={formStyles.perfReq}>{requirement}</div>
        <div className={formStyles.perfCond}>📋 {condition}</div>
      </div>
      <div className={formStyles.perfRight}>
        <Field label="Nilai Test">
          <Input value={value} onChange={onValue} placeholder="Isi nilai..." />
        </Field>
        <Field label="Hasil">
          <PassFail value={result} onChange={onResult} />
        </Field>
        <Field label="Keterangan">
          <Input value={remarks} onChange={onRemarks} placeholder="Catatan..." />
        </Field>
      </div>
    </div>
  );
}

// ── External visual check labels ────────────────────────────
const EXT_LABELS = [
  'Bagian las (luar) harus dipoles dan menyerupai pola aslinya',
  'Permukaan luar harus halus dan rata, tanpa penyok, goresan, atau kerutan',
  'Tepi luar (yang bersentuhan dengan tangan) harus bebas dari gerinda tajam dan sudut tajam',
  'Kaca harus bening, tanpa goresan, retakan, atau kabut',
  'Pegangan terpasang dengan benar dan tidak longgar',
  'Semua sekrup dan paku keling harus terpasang dengan tepat dan kuat',
  'Pintu kaca harus dapat digeser dengan ringan dan lancar',
  'Pintu tidak boleh mengalami deformasi atau terdapat bekas goresan',
  'Panel atas harus terpasang dengan aman, dan celah harus merata',
  'Pelat nama, label unit, dan label kabel harus ditempel di posisi yang ditentukan',
  'Rel geser pintu harus terpasang dengan kuat',
  'Lampu LED harus terpasang',
  'Celah antara panel penutup geser dan panel atas harus merata dan tidak lebih dari 2 mm',
];

const INT_LABELS = [
  'Sensor suhu harus terpasang dengan kuat',
  'Sekrup atau paku keling harus terpasang dengan kuat dan tegak lurus',
  'Rak kabin harus rata dan tidak bengkok',
  'Karet gasket harus bebas dari sobekan atau luka',
  'Perakitan lampu dan penutupnya harus terpasang dengan kuat',
  'Filter condensing harus terpasang dengan benar dan dapat dilepas maupun dipasang kembali dengan mudah',
];

const PERF_SPECS = [
  { key: 'grounding',          label: 'Tahanan Pembumian',                    req: '< 0.1Ω',                                                                    cond: 'Temperature: ±25°C, Humidity: 55~65%RH' },
  { key: 'insulation',         label: 'Tahanan Uji Isolasi',                  req: '> 7 MΩ',                                                                    cond: 'Temperature: ±25°C, Humidity: 55~65%RH' },
  { key: 'leakage',            label: 'Arus Bocor',                           req: '≤ 10mA',                                                                    cond: 'Temperature: ±25°C, Humidity: 55~65%RH' },
  { key: 'voltage_test',       label: 'Tegangan Tahan (Uji Ketahanan)',       req: '1250V/50Hz, 1 menit',                                                       cond: 'AC high-voltage tester' },
  { key: 'exterior_temp',      label: 'Suhu Eksterior',                       req: 'Pintu luar bebas dari kondensasi (embun)',                                  cond: 'Visual check' },
  { key: 'cooling_time',       label: 'Waktu Pendinginan',                    req: 'Suhu rata-rata kabinet tercapai dalam ≤ 50 menit',                          cond: 'Timer' },
  { key: 'cabinet_temp_range', label: 'Rentang Suhu Kabinet',                 req: 'Suhu udara dalam kabinet harus dalam rentang yang ditentukan',               cond: 'Temperature logger' },
  { key: 'temp_variation',     label: 'Variasi Suhu',                         req: 'Pembacaan sensor suhu dalam toleransi ±5°C',                                cond: 'Sensor logger' },
  { key: 'noise',              label: 'Kebisingan',                           req: 'Tidak ada suara abnormal',                                                  cond: 'Decibel meter / Sound check' },
  { key: 'power_rating',       label: 'Uji Daya (Power Rating Test)',         req: 'Daya dalam kisaran +5% hingga -10% dari daya rancangan',                    cond: 'Wattmeter' },
  { key: 'temp_report',        label: 'Laporan Uji Suhu',                     req: 'Lihat lampiran untuk laporan uji suhu',                                     cond: 'Attached graphic document' },
];

const WORKS_ITEMS = [
  'Pemasangan Lampu', 'Pemasangan Kelistrikan', 'Pemasangan Heater',
  'Pemasangan Unit System', 'Pengelasan Unit System', 'Pengelasan Body',
  'Perakitan Rangka Body', 'Pemasangan Mechanical',
];

// ── Main Form ────────────────────────────────────────────────

export default function InspectionReportForm({ data, onChange }: Props) {
  const h = data.header || {};
  const dim = data.dimensions || {};
  const vc = data.visual_checks || {};
  const perf = data.performance || {};
  const works = data.works || WORKS_ITEMS.map(label => ({ label, name: '', time: '' }));
  const footer = data.footer || {};

  const setH = (k: string, v: string) => onChange({ ...data, header: { ...h, [k]: v } });
  const setBody = (k: string, v: string) => onChange({ ...data, dimensions: { ...dim, body: { ...dim.body, [k]: v } } });
  const setKaca = (k: string, v: string) => onChange({ ...data, dimensions: { ...dim, kaca: { ...dim.kaca, [k]: v } } });
  const setExtVis = (i: number, v: string) => {
    const arr = [...(vc.external || Array(13).fill(''))];
    arr[i] = v;
    onChange({ ...data, visual_checks: { ...vc, external: arr } });
  };
  const setIntVis = (i: number, v: string) => {
    const arr = [...(vc.internal || Array(6).fill(''))];
    arr[i] = v;
    onChange({ ...data, visual_checks: { ...vc, internal: arr } });
  };
  const setPerf = (key: string, field: string, v: string) =>
    onChange({ ...data, performance: { ...perf, [key]: { ...perf[key], [field]: v } } });
  const setWork = (i: number, field: string, v: string) => {
    const arr = [...works];
    arr[i] = { ...arr[i], [field]: v };
    onChange({ ...data, works: arr });
  };
  const setFooter = (k: string, v: string) => onChange({ ...data, footer: { ...footer, [k]: v } });

  return (
    <div className={styles.formWrapper}>

      {/* ── 1. INFORMASI DOKUMEN ── */}
      <SectionTitle number="1" title="Informasi Dokumen" icon="📋" />
      <Card>
        <TwoCol>
          <Field label="Nomor Order Dokumen" hint="Contoh: ITR-2025-001">
            <Input value={h.order_document || ''} onChange={v => setH('order_document', v)} placeholder="Nomor order..." />
          </Field>
          <Field label="Kode Produksi" hint="Contoh: PRO-2025">
            <Input value={h.production_code || ''} onChange={v => setH('production_code', v)} placeholder="Kode produksi..." />
          </Field>
          <Field label="Tanggal Mulai Produksi">
            <Input type="date" value={h.starting_date || ''} onChange={v => setH('starting_date', v)} />
          </Field>
          <Field label="Tanggal Selesai Produksi">
            <Input type="date" value={h.finishing_date || ''} onChange={v => setH('finishing_date', v)} />
          </Field>
        </TwoCol>
      </Card>

      {/* ── 2. DIMENSI & UKURAN ── */}
      <SectionTitle number="2" title="Dimensi & Ukuran Kabinet" icon="📐" />
      <Card title="Dimensi Body (mm)">
        <ThreeCol>
          <Field label="Panjang / Length (mm)">
            <Input value={dim.body?.panjang || ''} onChange={v => setBody('panjang', v)} placeholder="mm" />
          </Field>
          <Field label="Lebar / Width (mm)">
            <Input value={dim.body?.lebar || ''} onChange={v => setBody('lebar', v)} placeholder="mm" />
          </Field>
          <Field label="Tinggi / Height (mm)">
            <Input value={dim.body?.tinggi || ''} onChange={v => setBody('tinggi', v)} placeholder="mm" />
          </Field>
        </ThreeCol>
      </Card>
      <Card title="Ukuran Kaca">
        <TwoCol>
          <Field label="Kaca Depan" hint="Contoh: Tempered 10mm">
            <Input value={dim.kaca?.depan || ''} onChange={v => setKaca('depan', v)} placeholder="Contoh: Tempered 10mm" />
          </Field>
          <Field label="Kaca Samping" hint="Contoh: Tempered 8mm">
            <Input value={dim.kaca?.samping || ''} onChange={v => setKaca('samping', v)} placeholder="Contoh: Tempered 8mm" />
          </Field>
          <Field label="Kaca Atas">
            <Input value={dim.kaca?.atas || ''} onChange={v => setKaca('atas', v)} placeholder="Contoh: Tempered 8mm" />
          </Field>
          <Field label="Kaca Pintu">
            <Input value={dim.kaca?.pintu || ''} onChange={v => setKaca('pintu', v)} placeholder="Contoh: Tempered 6mm sliding" />
          </Field>
          <Field label="Kaca Tingkatan / Rak">
            <Input value={dim.kaca?.tingkatan || ''} onChange={v => setKaca('tingkatan', v)} placeholder="Contoh: Tempered 8mm shelves" />
          </Field>
        </TwoCol>
      </Card>

      {/* ── 3. VISUAL CHECK LUAR ── */}
      <SectionTitle number="3" title="Visual Check — Bagian Luar" icon="👁️" />
      <p className={styles.perfNote}>
        💡 Tekan <strong>PASS</strong> jika kondisi sesuai standar, tekan <strong>FAIL</strong> jika tidak sesuai.
      </p>
      <Card>
        <div className={formStyles.visualList}>
          {EXT_LABELS.map((label, i) => (
            <VisualItem
              key={i}
              number={i + 1}
              label={label}
              value={vc.external?.[i] || ''}
              onChange={v => setExtVis(i, v)}
            />
          ))}
        </div>
      </Card>

      {/* ── 4. VISUAL CHECK DALAM ── */}
      <SectionTitle number="4" title="Visual Check — Bagian Dalam Kabinet" icon="🔍" />
      <Card>
        <div className={formStyles.visualList}>
          {INT_LABELS.map((label, i) => (
            <VisualItem
              key={i}
              number={i + 1}
              label={label}
              value={vc.internal?.[i] || ''}
              onChange={v => setIntVis(i, v)}
            />
          ))}
        </div>
      </Card>

      {/* ── 5. PERFORMANCE REQUIREMENTS ── */}
      <SectionTitle number="5" title="Performance Requirements — Sistem & Elektrikal" icon="⚡" />
      <p className={styles.perfNote}>
        💡 Isi nilai hasil pengujian, lalu pilih PASS atau FAIL untuk setiap item.
      </p>
      <Card>
        <div className={formStyles.perfList}>
          {PERF_SPECS.map(spec => {
            const cur = perf[spec.key] || { value: '', result: '', remarks: '' };
            return (
              <PerfRow
                key={spec.key}
                label={spec.label}
                requirement={spec.req}
                condition={spec.cond}
                value={cur.value || ''}
                result={cur.result || ''}
                remarks={cur.remarks || ''}
                onValue={v => setPerf(spec.key, 'value', v)}
                onResult={v => setPerf(spec.key, 'result', v)}
                onRemarks={v => setPerf(spec.key, 'remarks', v)}
              />
            );
          })}
        </div>
      </Card>

      {/* ── 6. WORKS INVOLVED ── */}
      <SectionTitle number="6" title="Pekerjaan yang Terlibat (Person-In-Charge)" icon="👷" />
      <Card>
        <div className={formStyles.worksList}>
          {works.map((w: any, i: number) => (
            <div key={i} className={formStyles.workRow}>
              <span className={formStyles.workNum}>{i + 1}</span>
              <span className={formStyles.workLabel}>{w.label || WORKS_ITEMS[i]}</span>
              <div className={formStyles.workInputs}>
                <Field label="Nama / PIC">
                  <Input value={w.name || ''} onChange={v => setWork(i, 'name', v)} placeholder="Nama teknisi..." />
                </Field>
                <Field label="Total Waktu (hari)">
                  <Input value={w.time || ''} onChange={v => setWork(i, 'time', v)} placeholder="Contoh: 0.5" />
                </Field>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── 7. SPESIFIKASI UNIT ── */}
      <SectionTitle number="7" title="Spesifikasi Unit & Catatan" icon="📝" />
      <Card>
        <ThreeCol>
          <Field label="Warna (Color)" hint="Contoh: Stainless Steel">
            <Input value={footer.color || ''} onChange={v => setFooter('color', v)} placeholder="Warna unit..." />
          </Field>
          <Field label="Panjang (Length)" hint="Contoh: 2.5m">
            <Input value={footer.length || ''} onChange={v => setFooter('length', v)} placeholder="Panjang..." />
          </Field>
          <Field label="Lampu (Light)" hint="Contoh: T5 LED 15W">
            <Input value={footer.light || ''} onChange={v => setFooter('light', v)} placeholder="Tipe lampu..." />
          </Field>
        </ThreeCol>
        <Field label="Keterangan / Catatan Tambahan">
          <textarea
            className={styles.textarea}
            rows={3}
            value={footer.notes || ''}
            onChange={e => setFooter('notes', e.target.value)}
            placeholder="Tulis catatan kelulusan inspeksi QC..."
          />
        </Field>
      </Card>

    </div>
  );
}
