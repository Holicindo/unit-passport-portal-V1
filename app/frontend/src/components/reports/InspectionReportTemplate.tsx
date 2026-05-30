import React from 'react';
import styles from './template.module.css';
import { CustomSelect } from '@/components/ui/CustomSelect';

interface InspectionReportTemplateProps {
  data: any;
  mode: 'edit' | 'view';
  unit: any;
  onChange?: (newData: any) => void;
}

export default function InspectionReportTemplate({
  data,
  mode,
  unit,
  onChange,
}: InspectionReportTemplateProps) {
  const isEdit = mode === 'edit';

  const updateData = (updater: (prev: any) => any) => {
    if (isEdit && onChange) {
      onChange(updater(data));
    }
  };

  const setHeader = (k: string, v: string) =>
    updateData((p: any) => ({ ...p, header: { ...p.header, [k]: v } }));

  const setBody = (k: string, v: string) =>
    updateData((p: any) => ({
      ...p,
      dimensions: {
        ...p.dimensions,
        body: { ...p.dimensions.body, [k]: v },
      },
    }));

  const setKaca = (k: string, v: string) =>
    updateData((p: any) => ({
      ...p,
      dimensions: {
        ...p.dimensions,
        kaca: { ...p.dimensions.kaca, [k]: v },
      },
    }));

  const setExtVis = (i: number, v: string) =>
    updateData((p: any) => {
      const a = [...p.visual_checks.external];
      a[i] = v;
      return {
        ...p,
        visual_checks: { ...p.visual_checks, external: a },
      };
    });

  const setIntVis = (i: number, v: string) =>
    updateData((p: any) => {
      const a = [...p.visual_checks.internal];
      a[i] = v;
      return {
        ...p,
        visual_checks: { ...p.visual_checks, internal: a },
      };
    });

  const setPerf = (k: string, f2: string, v: string) =>
    updateData((p: any) => ({
      ...p,
      performance: {
        ...p.performance,
        [k]: { ...p.performance[k], [f2]: v },
      },
    }));

  const setWork = (i: number, f2: string, v: string) =>
    updateData((p: any) => {
      const a = [...p.works];
      a[i] = { ...a[i], [f2]: v };
      return { ...p, works: a };
    });

  const setFooter = (k: string, v: string) =>
    updateData((p: any) => ({ ...p, footer: { ...p.footer, [k]: v } }));

  // Official Visual Checks External Labels
  const extLabels = [
    'Bagian las (luar) harus dipoles dan menyerupai pola aslinya',
    'Permukaan luar harus halus dan rata, tanpa penyok, goresan, atau kerutan',
    'Tepi luar (yang bersentuhan dengan tangan) harus bebas dari gerinda tajam dan sudut tajam',
    'Kaca harus bening, tanpa goresan, retakan, atau kabut.',
    'Pegangan terpasang dengan benar dan tidak longgar',
    'Semua sekrup dan paku keling harus terpasang dengan tepat dan kuat.',
    'Pintu kaca harus dapat digeser dengan ringan dan lancar.',
    'Pintu tidak boleh mengalami deformasi atau terdapat bekas goresan.',
    'Panel atas harus terpasang dengan aman, dan celah harus merata.',
    'Pelat nama, label unit, dan label kabel harus ditempel di posisi yang ditentukan.',
    'Rel geser pintu harus terpasang dengan kuat.',
    'Lampu LED harus terpasang.',
    'Celah antara panel penutup geser dan panel atas harus merata dan tidak lebih dari 2 mm.',
  ];

  // Official Visual Checks Internal Labels
  const intLabels = [
    'Sensor suhu harus terpasang dengan kuat.',
    'Sekrup atau paku keling harus terpasang dengan kuat dan tegak lurus.',
    'Rak kabin harus rata dan tidak bengkok.',
    'Karet gasket harus bebas dari sobekan atau luka.',
    'Perakitan lampu dan penutupnya harus terpasang dengan kuat.',
    'Filter condensing harus terpasang dengan benar dan dapat dilepas maupun dipasang kembali dengan mudah.',
  ];

  // Official Performance Specs Grid
  const perfSpecs = [
    {
      key: 'grounding',
      label: 'Tahanan Pembumian',
      req: '< 0.1Ω',
      cond: 'Temperature: ±25 °C Humidity: 55~65 %RH',
      defVal: '0.04 Ω',
    },
    {
      key: 'insulation',
      label: 'Tahanan Uji Isolasi',
      req: '> 7 MΩ',
      cond: 'Temperature: ±25 °C Humidity: 55~65 %RH',
      defVal: '>5000 MΩ',
    },
    {
      key: 'leakage',
      label: 'Arus Bocor',
      req: '≤ 10mA',
      cond: 'Temperature: ±25 °C Humidity: 55~65 %RH',
      defVal: '0.22 mA',
    },
    {
      key: 'voltage_test',
      label: 'Tegangan Tahan (Uji Ketahanan Tegangan)',
      req: '1250V/50Hz, 1 min',
      cond: 'AC high-voltage tester',
      defVal: 'V',
    },
    {
      key: 'exterior_temp',
      label: 'Suhu Eksterior',
      req: 'Pintu luar bebas dari kondensasi (embun)',
      cond: 'Visual check',
      defVal: 'V',
    },
    {
      key: 'cooling_time',
      label: 'Waktu Pendinginan',
      req: 'Suhu rata-rata ruang kabinet harus tercapai dalam ≤ 50 menit',
      cond: 'Timer',
      defVal: '50 menit',
    },
    {
      key: 'cabinet_temp_range',
      label: 'Rentang Suhu Kabinet',
      req: 'Suhu rata-rata udara di dalam kabinet harus berada dalam rentang yang telah ditentukan',
      cond: 'Temperature logger',
      defVal: 'Sesuai specs',
    },
    {
      key: 'temp_variation',
      label: 'Variasi Suhu',
      req: 'Pembacaan dari sensor suhu harus berada dalam toleransi ±5°C',
      cond: 'Sensor logger',
      defVal: '< 5 °C',
    },
    {
      key: 'noise',
      label: 'Kebisingan',
      req: 'Tidak ada suara abnormal',
      cond: 'Decibel meter / Sound check',
      defVal: 'No noise',
    },
    {
      key: 'power_rating',
      label: 'Uji Daya (Power Rating Test)',
      req: 'Daya harus berada dalam kisaran +5% hingga -10% dari daya rancangan',
      cond: 'Wattmeter',
      defVal: 'Sesuai specs',
    },
    {
      key: 'temp_report',
      label: 'Laporan Uji Suhu',
      req: 'Silakan lihat lampiran untuk laporan uji suhu',
      cond: 'Attached graphic document',
      defVal: 'Terlampir',
    },
  ];

  return (
    <div className={styles.a4Sheet}>
      {/* 1. Header Grid Block - Replicating GSheets Border Box */}
      <table className={styles.sheetHeaderTable}>
        <tbody>
          <tr>
            <td className={styles.logoCell} style={{ background: '#000000', color: '#ffffff', fontSize: '20px' }}>
              <div>HOLIC</div>
            </td>
            <td className={styles.titleCell}>
              <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Inspection Report</div>
              <div style={{ fontSize: '9px', fontWeight: 'normal', color: '#475569' }}>
                檢驗報告 / LAPORAN INSPEKSI PRODUK
              </div>
            </td>
            <td className={styles.metaGridCell}>
              <table className={styles.innerMetaTable}>
                <tbody>
                  <tr>
                    <td style={{ width: '45%' }}><strong>Serial Number:</strong></td>
                    <td><strong>{unit ? unit.serial_number : 'A - 產品編號'}</strong></td>
                  </tr>
                  <tr>
                    <td><strong>Order Document:</strong></td>
                    <td>
                      {isEdit ? (
                        <input
                          type="text"
                          className={styles.cellInput}
                          placeholder="ITR - 訂單憑證"
                          value={data.header?.order_document || ''}
                          onChange={(e) => setHeader('order_document', e.target.value)}
                        />
                      ) : (
                        data.header?.order_document || '-'
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Production Code:</strong></td>
                    <td>
                      {isEdit ? (
                        <input
                          type="text"
                          className={styles.cellInput}
                          placeholder="PRO - 製造代碼"
                          value={data.header?.production_code || ''}
                          onChange={(e) => setHeader('production_code', e.target.value)}
                        />
                      ) : (
                        data.header?.production_code || '-'
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* 2. Customer & Dates Row */}
      <table className={styles.infoGridTable}>
        <tbody>
          <tr>
            <th style={{ width: '12%' }}>Customer</th>
            <td style={{ width: '38%' }}>{unit?.current_client?.company_name || '客戶 / INTERNAL STOCK'}</td>
            <th style={{ width: '12%' }}>Starting Date</th>
            <td style={{ width: '13%' }}>
              {isEdit ? (
                <input
                  type="date"
                  className={styles.cellInput}
                  value={data.header?.starting_date || ''}
                  onChange={(e) => setHeader('starting_date', e.target.value)}
                />
              ) : (
                data.header?.starting_date || '-'
              )}
            </td>
            <th style={{ width: '12%' }}>Finishing Date</th>
            <td style={{ width: '13%' }}>
              {isEdit ? (
                <input
                  type="date"
                  className={styles.cellInput}
                  value={data.header?.finishing_date || ''}
                  onChange={(e) => setHeader('finishing_date', e.target.value)}
                />
              ) : (
                data.header?.finishing_date || '-'
              )}
            </td>
          </tr>
          <tr>
            <th>Category</th>
            <td>{unit?.specs?.category || 'Item Code'}</td>
            <th>Model</th>
            <td colSpan={3}><strong>{unit ? unit.model_name : 'Dimension Model'}</strong></td>
          </tr>
        </tbody>
      </table>

      {/* 3. Dimensions Section */}
      <table className={styles.denseTable}>
        <thead>
          <tr className={styles.sectionHeaderRow}>
            <th colSpan={5}>1. Dimensi & Ukuran (Cabinet Dimensions)</th>
          </tr>
          <tr>
            <th style={{ width: '30%' }}>Item</th>
            <th style={{ width: '15%' }}>Panjang (L)</th>
            <th style={{ width: '15%' }}>Lebar (W)</th>
            <th style={{ width: '15%' }}>Tinggi (H)</th>
            <th style={{ width: '25%' }}>Instrument</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Dimensi Body (mm)</strong></td>
            <td className={styles.centerCell}>
              {isEdit ? (
                <input
                  type="text"
                  className={styles.cellInput}
                  style={{ textAlign: 'center' }}
                  value={data.dimensions?.body?.panjang || ''}
                  onChange={(e) => setBody('panjang', e.target.value)}
                />
              ) : (
                data.dimensions?.body?.panjang || '-'
              )}
            </td>
            <td className={styles.centerCell}>
              {isEdit ? (
                <input
                  type="text"
                  className={styles.cellInput}
                  style={{ textAlign: 'center' }}
                  value={data.dimensions?.body?.lebar || ''}
                  onChange={(e) => setBody('lebar', e.target.value)}
                />
              ) : (
                data.dimensions?.body?.lebar || '-'
              )}
            </td>
            <td className={styles.centerCell}>
              {isEdit ? (
                <input
                  type="text"
                  className={styles.cellInput}
                  style={{ textAlign: 'center' }}
                  value={data.dimensions?.body?.tinggi || ''}
                  onChange={(e) => setBody('tinggi', e.target.value)}
                />
              ) : (
                data.dimensions?.body?.tinggi || '-'
              )}
            </td>
            <td className={styles.centerCell}>Meteran</td>
          </tr>
          <tr>
            <td>Ukuran Kaca Depan</td>
            <td colSpan={3} className={styles.centerCell}>
              {isEdit ? (
                <input
                  type="text"
                  className={styles.cellInput}
                  placeholder="e.g. Tempered 10mm"
                  value={data.dimensions?.kaca?.depan || ''}
                  onChange={(e) => setKaca('depan', e.target.value)}
                />
              ) : (
                data.dimensions?.kaca?.depan || '-'
              )}
            </td>
            <td className={styles.centerCell}>Meteran</td>
          </tr>
          <tr>
            <td>Ukuran Kaca Samping</td>
            <td colSpan={3} className={styles.centerCell}>
              {isEdit ? (
                <input
                  type="text"
                  className={styles.cellInput}
                  placeholder="e.g. Tempered 8mm"
                  value={data.dimensions?.kaca?.samping || ''}
                  onChange={(e) => setKaca('samping', e.target.value)}
                />
              ) : (
                data.dimensions?.kaca?.samping || '-'
              )}
            </td>
            <td className={styles.centerCell}>Meteran</td>
          </tr>
          <tr>
            <td>Ukuran Kaca Atas</td>
            <td colSpan={3} className={styles.centerCell}>
              {isEdit ? (
                <input
                  type="text"
                  className={styles.cellInput}
                  placeholder="e.g. Tempered 8mm"
                  value={data.dimensions?.kaca?.atas || ''}
                  onChange={(e) => setKaca('atas', e.target.value)}
                />
              ) : (
                data.dimensions?.kaca?.atas || '-'
              )}
            </td>
            <td className={styles.centerCell}>Meteran</td>
          </tr>
          <tr>
            <td>Ukuran Kaca Pintu</td>
            <td colSpan={3} className={styles.centerCell}>
              {isEdit ? (
                <input
                  type="text"
                  className={styles.cellInput}
                  placeholder="e.g. Tempered 6mm sliding"
                  value={data.dimensions?.kaca?.pintu || ''}
                  onChange={(e) => setKaca('pintu', e.target.value)}
                />
              ) : (
                data.dimensions?.kaca?.pintu || '-'
              )}
            </td>
            <td className={styles.centerCell}>Meteran</td>
          </tr>
          <tr>
            <td>Ukuran Kaca Tingkatan</td>
            <td colSpan={3} className={styles.centerCell}>
              {isEdit ? (
                <input
                  type="text"
                  className={styles.cellInput}
                  placeholder="e.g. Tempered 8mm shelves"
                  value={data.dimensions?.kaca?.tingkatan || ''}
                  onChange={(e) => setKaca('tingkatan', e.target.value)}
                />
              ) : (
                data.dimensions?.kaca?.tingkatan || '-'
              )}
            </td>
            <td className={styles.centerCell}>Meteran</td>
          </tr>
        </tbody>
      </table>

      {/* 4. Appearance Inspection Section (Pemeriksaan Fisik Bagian Luar) */}
      <table className={styles.denseTable}>
        <thead>
          <tr className={styles.sectionHeaderRow}>
            <th colSpan={4}>2. Visual Check — Bagian Luar (Appearance Inspection)</th>
          </tr>
          <tr>
            <th style={{ width: '6%' }}>No.</th>
            <th>Uraian Pemeriksaan (Inspection Checklist Description)</th>
            <th style={{ width: '20%' }}>Instrument</th>
            <th style={{ width: '15%' }}>Hasil (Result)</th>
          </tr>
        </thead>
        <tbody>
          {extLabels.map((lbl, idx) => {
            const currentVal = data.visual_checks?.external?.[idx] || '';
            return (
              <tr key={`ext-${idx}`}>
                <td className={styles.centerCell}>{idx + 1}</td>
                <td className={styles.checkLabel}>{lbl}</td>
                <td className={styles.centerCell}>Visual / Sentuhan</td>
                <td className={styles.centerCell}>
                  {isEdit ? (
                    <div className={styles.resultToggleGroup}>
                      <button
                        type="button"
                        className={`${styles.resultBtn} ${styles.pass} ${
                          currentVal === 'V' ? styles.active : ''
                        }`}
                        onClick={() => setExtVis(idx, currentVal === 'V' ? '' : 'V')}
                      >
                        V
                      </button>
                      <button
                        type="button"
                        className={`${styles.resultBtn} ${styles.fail} ${
                          currentVal === 'X' ? styles.active : ''
                        }`}
                        onClick={() => setExtVis(idx, currentVal === 'X' ? '' : 'X')}
                      >
                        X
                      </button>
                    </div>
                  ) : currentVal ? (
                    <span
                      className={`${styles.statusBadge} ${
                        currentVal === 'V' ? styles.pass : styles.fail
                      }`}
                    >
                      {currentVal === 'V' ? '✓ Pass' : '✗ Fail'}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* 5. Visual Check Internal Cabinet */}
      <table className={styles.denseTable}>
        <thead>
          <tr className={styles.sectionHeaderRow}>
            <th colSpan={4}>3. Visual Check — Bagian Dalam Kabinet (Internal Cabinet)</th>
          </tr>
          <tr>
            <th style={{ width: '6%' }}>No.</th>
            <th>Uraian Pemeriksaan (Inspection Checklist Description)</th>
            <th style={{ width: '20%' }}>Instrument</th>
            <th style={{ width: '15%' }}>Hasil (Result)</th>
          </tr>
        </thead>
        <tbody>
          {intLabels.map((lbl, idx) => {
            const currentVal = data.visual_checks?.internal?.[idx] || '';
            return (
              <tr key={`int-${idx}`}>
                <td className={styles.centerCell}>{idx + 1}</td>
                <td className={styles.checkLabel}>{lbl}</td>
                <td className={styles.centerCell}>Visual / Sentuhan</td>
                <td className={styles.centerCell}>
                  {isEdit ? (
                    <div className={styles.resultToggleGroup}>
                      <button
                        type="button"
                        className={`${styles.resultBtn} ${styles.pass} ${
                          currentVal === 'V' ? styles.active : ''
                        }`}
                        onClick={() => setIntVis(idx, currentVal === 'V' ? '' : 'V')}
                      >
                        V
                      </button>
                      <button
                        type="button"
                        className={`${styles.resultBtn} ${styles.fail} ${
                          currentVal === 'X' ? styles.active : ''
                        }`}
                        onClick={() => setIntVis(idx, currentVal === 'X' ? '' : 'X')}
                      >
                        X
                      </button>
                    </div>
                  ) : currentVal ? (
                    <span
                      className={`${styles.statusBadge} ${
                        currentVal === 'V' ? styles.pass : styles.fail
                      }`}
                    >
                      {currentVal === 'V' ? '✓ Pass' : '✗ Fail'}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* 6. Systems & Performance */}
      <table className={styles.denseTable}>
        <thead>
          <tr className={styles.sectionHeaderRow}>
            <th colSpan={6}>4. Performance Requirements — Sistem (System & Electrical)</th>
          </tr>
          <tr>
            <th style={{ width: '25%' }}>Item</th>
            <th style={{ width: '25%' }}>Performance Requirements</th>
            <th style={{ width: '20%' }}>Test Condition</th>
            <th style={{ width: '12%' }}>Test Value</th>
            <th style={{ width: '8%' }}>Result</th>
            <th style={{ width: '10%' }}>Remarks</th>
          </tr>
        </thead>
        <tbody>
          {perfSpecs.map((spec) => {
            const currentVal = data.performance?.[spec.key] || {
              value: '',
              result: '',
              remarks: '',
            };
            return (
              <tr key={spec.key}>
                <td><strong>{spec.label}</strong></td>
                <td>{spec.req}</td>
                <td>{spec.cond}</td>
                <td className={styles.centerCell}>
                  {isEdit ? (
                    <input
                      type="text"
                      className={styles.cellInput}
                      style={{ textAlign: 'center' }}
                      placeholder={spec.defVal}
                      value={currentVal.value || ''}
                      onChange={(e) => setPerf(spec.key, 'value', e.target.value)}
                    />
                  ) : (
                    currentVal.value || '-'
                  )}
                </td>
                <td className={styles.centerCell}>
                  {isEdit ? (
                    <CustomSelect
                      className={styles.cellSelect}
                      value={currentVal.result || ''}
                      onChange={(val) => setPerf(spec.key, 'result', val)}
                      options={[
                        { value: '', label: '-' },
                        { value: 'V', label: 'V' },
                        { value: 'X', label: 'X' }
                      ]}
                    />
                  ) : currentVal.result ? (
                    <span
                      className={`${styles.statusBadge} ${
                        currentVal.result === 'V' ? styles.pass : styles.fail
                      }`}
                    >
                      {currentVal.result}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
                <td className={styles.centerCell}>
                  {isEdit ? (
                    <input
                      type="text"
                      className={styles.cellInput}
                      placeholder="Remarks"
                      value={currentVal.remarks || ''}
                      onChange={(e) => setPerf(spec.key, 'remarks', e.target.value)}
                    />
                  ) : (
                    currentVal.remarks || '-'
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* 7. Works Involved Section */}
      <table className={styles.denseTable} style={{ marginBottom: 0 }}>
        <thead>
          <tr className={styles.sectionHeaderRow}>
            <th colSpan={4}>5. Works Involved (Person-In-Charge)</th>
          </tr>
          <tr>
            <th style={{ width: '6%' }}>No.</th>
            <th>Item Pekerjaan</th>
            <th style={{ width: '45%' }}>Name / PIC</th>
            <th style={{ width: '25%' }}>Total Time (days)</th>
          </tr>
        </thead>
        <tbody>
          {data.works?.map((w: any, idx: number) => (
            <tr key={`work-${idx}`}>
              <td className={styles.centerCell}>{idx + 1}</td>
              <td><strong>{w.label || w.item}</strong></td>
              <td className={styles.centerCell}>
                {isEdit ? (
                  <input
                    type="text"
                    className={styles.cellInput}
                    placeholder="Nama Teknisi PIC"
                    value={w.name || ''}
                    onChange={(e) => setWork(idx, 'name', e.target.value)}
                  />
                ) : (
                  w.name || '-'
                )}
              </td>
              <td className={styles.centerCell}>
                {isEdit ? (
                  <input
                    type="text"
                    className={styles.cellInput}
                    style={{ textAlign: 'center' }}
                    placeholder="e.g. 0.5"
                    value={w.time || ''}
                    onChange={(e) => setWork(idx, 'time', e.target.value)}
                  />
                ) : (
                  w.time || '-'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 8. Light, Color, Length Specs Row */}
      <div className={styles.specsFooterRow}>
        <div className={styles.specField}>
          <label>Color :</label>
          {isEdit ? (
            <input
              type="text"
              className={styles.cellInput}
              placeholder="e.g. Stainless Steel"
              value={data.footer?.color || ''}
              onChange={(e) => setFooter('color', e.target.value)}
            />
          ) : (
            <strong>{data.footer?.color || '-'}</strong>
          )}
        </div>
        <div className={styles.specField}>
          <label>Length :</label>
          {isEdit ? (
            <input
              type="text"
              className={styles.cellInput}
              placeholder="e.g. 2.5m"
              value={data.footer?.length || ''}
              onChange={(e) => setFooter('length', e.target.value)}
            />
          ) : (
            <strong>{data.footer?.length || '-'}</strong>
          )}
        </div>
        <div className={styles.specField}>
          <label>Light :</label>
          {isEdit ? (
            <input
              type="text"
              className={styles.cellInput}
              placeholder="e.g. T5 LED 15W"
              value={data.footer?.light || ''}
              onChange={(e) => setFooter('light', e.target.value)}
            />
          ) : (
            <strong>{data.footer?.light || '-'}</strong>
          )}
        </div>
      </div>

      {/* 9. Notes / Keterangan Area */}
      <div className={styles.notesArea}>
        <label>Keterangan / Catatan :</label>
        {isEdit ? (
          <textarea
            rows={2}
            placeholder="Tulis catatan kelulusan inspeksi QC..."
            value={data.footer?.notes || ''}
            onChange={(e) => setFooter('notes', e.target.value)}
          />
        ) : (
          <div className={styles.notesView}>{data.footer?.notes || 'Tidak ada catatan tambahan.'}</div>
        )}
      </div>

      {/* Footnotes Text */}
      <div className={styles.footnoteText}>
        Pemeriksaan dilakukan sesuai dengan standar produk stainless steel Fabristeel. Hasil uji
        kinerja tersedia dalam laporan uji terpisah. Jika hasil sesuai kriteria, beri tanda '✓'; jika
        tidak, beri tanda 'X'.
      </div>

      {/* 10. GSheets Signatures Block */}
      <table className={styles.signatureTable}>
        <tbody>
          <tr>
            <td>
              <span className={styles.signatureTitle}>SPV Quality Control</span>
              <span className={styles.signatureName}>Signature Box (Verified Digital)</span>
            </td>
            <td>
              <span className={styles.signatureTitle}>Quality Control Inspector</span>
              <span className={styles.signatureName}>Signature Box (Verified Digital)</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
