import React from 'react';
import styles from './template.module.css';

/* ─── tiny helpers ─────────────────────────────────────────── */
const B: React.CSSProperties = { border: '1px solid #000' };
const cell = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  ...B, padding: '3px 5px', fontSize: '8.5px', verticalAlign: 'middle', ...extra,
});
const hCell = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  ...cell(), background: '#f1f5f9', fontWeight: 'bold', textAlign: 'center', ...extra,
});
const darkHdr: React.CSSProperties = {
  ...B, background: '#4a4a4a', color: '#fff', fontWeight: 'bold',
  textAlign: 'center', fontSize: '10px', padding: '5px 4px',
};

function Checkbox({ checked, onChange, disabled }: {
  checked: boolean; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; disabled?: boolean;
}) {
  if (!disabled) {
    return <input type="checkbox" checked={checked} onChange={onChange}
      style={{ accentColor: '#2e5bff', width: 11, height: 11, cursor: 'pointer' }} />;
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 11, height: 11, minWidth: 11,
      border: checked ? '1.5px solid #2e5bff' : '1.5px solid #555',
      borderRadius: 2, background: checked ? '#2e5bff' : '#fff', flexShrink: 0,
      printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact',
    } as React.CSSProperties}>
      {checked && <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
        <path d="M1 3.5L3 5.5L6 1.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>}
    </span>
  );
}

/* ─── main component ───────────────────────────────────────── */
export default function WarmReportTemplate({ mode = 'edit', data = {}, unit = {}, onChange }: any) {
  const isEdit = mode === 'edit';

  const setH  = (k: string, v: any) => onChange?.('header', { ...data.header, [k]: v });
  const setRow = (i: number, k: string, v: any) => {
    if (!onChange || !isEdit) return;
    const r = [...(data.general_inspection?.rows ?? [{},{},{},{}])];
    r[i] = { ...r[i], [k]: v };
    onChange('general_inspection', { ...data.general_inspection, rows: r });
  };
  const setGI  = (k: string, v: any) => onChange?.('general_inspection', { ...data.general_inspection, [k]: v });
  const setP   = (k: string, v: any) => onChange?.('performance_inspection', { ...data.performance_inspection, [k]: v });

  const gi   = data.general_inspection   ?? {};
  const rows = (gi.rows ?? [{},{},{},{}]) as any[];
  const p    = data.performance_inspection ?? {};
  const h    = data.header ?? {};

  /* inline text input */
  const ci = (val: string, cb: (v: string) => void, ph = '', w?: string | number) =>
    isEdit
      ? <input type="text" className={styles.cellInput}
          value={val} onChange={e => cb(e.target.value)} placeholder={ph}
          style={w ? { width: w } : undefined} />
      : <span style={{ fontSize: '8.5px' }}>{val || ''}</span>;

  /* date input */
  const di = (val: string, cb: (v: string) => void) =>
    isEdit
      ? <input type="date" className={styles.cellInput} value={val} onChange={e => cb(e.target.value)} />
      : <span style={{ fontSize: '8.5px' }}>{val || ''}</span>;

  return (
    <div className={`${styles.a4Sheet} ${styles.coolingReport}`}>

      {/* ══════════════════════════════════════════════════════
          1. HEADER — Logo | Title | Serial / Order / Prod
          ══════════════════════════════════════════════════════ */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 0 }}>
        <tbody>
          <tr>
            {/* Logo */}
            <td rowSpan={3} style={{ ...B, width: '15%', background: '#000', color: '#fff',
              fontSize: 22, fontWeight: 900, textAlign: 'center', verticalAlign: 'middle', letterSpacing: '0.04em' }}>
              HOLIC
            </td>
            {/* Title */}
            <td rowSpan={3} style={{ ...B, width: '50%', textAlign: 'center', verticalAlign: 'middle',
              borderLeft: '1px solid #000', borderRight: '1px solid #000' }}>
              <div style={{ fontSize: 9, color: '#555' }}>Post-Production</div>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>Cooling System Report</div>
            </td>
            {/* Serial Number */}
            <td style={{ ...B, width: '14%', fontSize: 7, borderBottom: '1px solid #000', padding: '3px 5px' }}>
              Serial Number<br /><span style={{ color: '#888' }}>產品編號</span>
            </td>
            <td style={{ ...B, width: '21%', borderBottom: '1px solid #000', padding: '3px 5px', fontWeight: 'bold', fontSize: 8.5 }}>
              : A-&nbsp;{unit?.serial_number || h.serial_number || ''}
            </td>
          </tr>
          <tr>
            <td style={{ ...B, fontSize: 7, borderBottom: '1px solid #000', padding: '3px 5px' }}>
              Order Document<br /><span style={{ color: '#888' }}>訂單編號</span>
            </td>
            <td style={{ ...B, borderBottom: '1px solid #000', padding: '3px 5px', fontWeight: 'bold', fontSize: 8.5 }}>
              : ITR-&nbsp;{ci(h.order_document || '', v => setH('order_document', v))}
            </td>
          </tr>
          <tr>
            <td style={{ ...B, fontSize: 7, padding: '3px 5px' }}>
              Production Code<br /><span style={{ color: '#888' }}>製造代碼</span>
            </td>
            <td style={{ ...B, padding: '3px 5px', fontWeight: 'bold', fontSize: 8.5 }}>
              : PRO-&nbsp;{ci(h.production_code || '', v => setH('production_code', v))}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ══════════════════════════════════════════════════════
          2. INFO ROW — Customer / Dates / Category / Model
          ══════════════════════════════════════════════════════ */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={hCell({ width: '9%' })}>Customer<br /><span style={{ fontWeight: 'normal', fontSize: 6 }}>客戶</span></td>
            <td style={cell({ width: '18%' })}>{ci(h.customer || '', v => setH('customer', v), 'Customer')}</td>
            <td style={hCell({ width: '10%' })}>Starting Date<br /><span style={{ fontWeight: 'normal', fontSize: 6 }}>生產日期</span></td>
            <td style={cell({ width: '13%' })}>{di(h.starting_date || '', v => setH('starting_date', v))}</td>
            <td style={hCell({ width: '11%' })}>Finishing Date<br /><span style={{ fontWeight: 'normal', fontSize: 6 }}>完成日期</span></td>
            <td style={cell({ width: '13%' })}>{di(h.finishing_date || '', v => setH('finishing_date', v))}</td>
            <td style={hCell({ width: '10%' })}>Inspection Date</td>
            <td style={cell({ width: '16%' })}>{di(h.inspection_date || '', v => setH('inspection_date', v))}</td>
          </tr>
          <tr>
            <td style={hCell()}>Category</td>
            <td style={cell()}>{ci(h.category || '', v => setH('category', v), 'Category')}</td>
            <td style={hCell()}>Item Code</td>
            <td style={cell()}>{ci(h.item_code || '', v => setH('item_code', v), 'Item Code')}</td>
            <td style={hCell()}>Model</td>
            <td colSpan={3} style={cell()}>{unit?.model_name || h.model || ''}</td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '9%' }} />
          <col style={{ width: '5%' }} />
          <col style={{ width: '9%' }} />
          <col style={{ width: '13%' }} />
          <col style={{ width: '13%' }} />
          <col style={{ width: '13%' }} />
          <col style={{ width: '38%' }} />
        </colgroup>
        <tbody>

          {/* R0: Section headers */}
          <tr>
            <td colSpan={7} style={darkHdr}>GENERAL INSPECTION</td>
          </tr>

          {/* R1: Column headers */}
          <tr>
            <td rowSpan={4} style={hCell({ fontSize: 7.5 })}>
              Temperature<br /><span style={{ fontWeight: 'normal', fontSize: 6 }}>溫度</span>
            </td>
            <td colSpan={2} style={hCell({ fontSize: 7.5 })}>
              Required<br /><span style={{ fontWeight: 'normal', fontSize: 6 }}>需求</span>
            </td>
            <td style={hCell({ fontSize: 7.5 })}>Setting Temperature</td>
            <td style={hCell({ fontSize: 7.5 })}>Temperature Dalam</td>
            <td style={hCell({ fontSize: 7.5 })}>Digital Control Type</td>
            <td style={hCell({ fontSize: 7.5 })}>
              Setting<br /><span style={{ fontWeight: 'normal', fontSize: 6 }}>設定</span>
            </td>
          </tr>

          {/* R2–R4: Part data rows 0–2 */}
          {[0, 1, 2].map(i => (
            <tr key={i}>
              <td style={cell({ textAlign: 'center', fontSize: 7 })}>
                Part<br /><span style={{ fontSize: 6, color: '#555' }}>部分</span>
              </td>
              <td style={cell()}>{ci(rows[i]?.part || '', v => setRow(i, 'part', v), `Part ${i + 1}`)}</td>
              <td style={cell({ textAlign: 'center' })}>{ci(rows[i]?.setting_temp || '', v => setRow(i, 'setting_temp', v), '°C')}</td>
              <td style={cell({ textAlign: 'center' })}>{ci(rows[i]?.temp_dalam || '', v => setRow(i, 'temp_dalam', v), '°C')}</td>
              <td style={cell({ textAlign: 'center' })}>{ci(rows[i]?.digital_type || '', v => setRow(i, 'digital_type', v), 'Type')}</td>
              
              {i === 0 && (
                <td rowSpan={2} style={{ ...B, verticalAlign: 'top', padding: '4px' }}>
                  {isEdit
                    ? <textarea className={styles.cellInput}
                        style={{ width: '100%', height: '100%', minHeight: '36px', resize: 'vertical', fontSize: '8px', fontFamily: 'inherit', border: 'none', background: 'transparent' }}
                        value={gi.setting || ''} onChange={e => setGI('setting', e.target.value)}
                        placeholder="Input setting..." />
                    : <div style={{ fontSize: '8px', padding: '2px', whiteSpace: 'pre-wrap' }}>{gi.setting || ''}</div>}
                </td>
              )}
              
              {i === 2 && (
                <td style={{ ...B, background: '#4a4a4a', color: '#fff', fontWeight: 'bold', fontSize: 12, textAlign: 'center', padding: '4px 0', verticalAlign: 'middle' }}>
                  Performance Inspection
                </td>
              )}
            </tr>
          ))}

          {/* R5: Type Heater — Cooling System rowSpan=2 */}
          <tr>
            <td rowSpan={2} style={cell({ textAlign: 'center', fontWeight: 'bold', fontSize: 7.5, verticalAlign: 'middle' })}>
              <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: '0 auto', lineHeight: 1.5 }}>
                Cooling<br />System<br />
                <span style={{ fontWeight: 'normal', fontSize: 6 }}>冷凍系統</span>
              </div>
            </td>
            <td colSpan={5} style={{ padding: 0, height: '1px' }}>
              <table style={{ width: '100%', height: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ ...hCell({ fontSize: 8 }), width: '20%', borderTop: 'none', borderBottom: 'none', borderLeft: 'none' }}>Type Heater</td>
                    <td style={{ ...cell(), width: '40%', borderTop: 'none', borderBottom: 'none' }}>{ci(gi.type_heater || '', v => setGI('type_heater', v), 'Type heater...')}</td>
                    <td style={{ ...hCell({ fontSize: 8 }), width: '20%', borderTop: 'none', borderBottom: 'none' }}>Spesifikasi Heater</td>
                    <td style={{ ...cell(), width: '20%', borderTop: 'none', borderBottom: 'none', borderRight: 'none' }}>{ci(gi.spesifikasi_heater || '', v => setGI('spesifikasi_heater', v), 'Spesifikasi...')}</td>
                  </tr>
                </tbody>
              </table>
            </td>
            <td rowSpan={2} style={{ ...B, verticalAlign: 'top', padding: 0 }}>
              <div style={{ padding: '7px 7px', fontSize: 8.5 }}>
                <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: 5, fontSize: 9 }}>Suhu Ruangan</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 28, marginBottom: 2 }}>
                  <span style={{ fontWeight: 'bold', fontSize: 8 }}>Min</span>
                  <span style={{ fontWeight: 'bold', fontSize: 8 }}>Max</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 28, marginBottom: 4 }}>
                  <span>
                    {isEdit
                      ? <input type="text" className={styles.cellInput}
                          style={{ width: 36, textAlign: 'center', borderBottom: '1px solid #94a3b8' }}
                          value={p.room_min || ''} onChange={e => setP('room_min', e.target.value)} placeholder="°C" />
                      : <span style={{ fontSize: 8.5 }}>{p.room_min || ''}</span>}
                  </span>
                  <span>
                    {isEdit
                      ? <input type="text" className={styles.cellInput}
                          style={{ width: 36, textAlign: 'center', borderBottom: '1px solid #94a3b8' }}
                          value={p.room_max || ''} onChange={e => setP('room_max', e.target.value)} placeholder="°C" />
                      : <span style={{ fontSize: 8.5 }}>{p.room_max || ''}</span>}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 12 }}>
                  <span style={{ fontWeight: 'bold', fontSize: 8 }}>Kelembaban / Humidity:</span>
                  {isEdit
                    ? <input type="text" className={styles.cellInput}
                        style={{ width: 28, textAlign: 'center', borderBottom: '1px solid #94a3b8' }}
                        value={p.room_hum || ''} onChange={e => setP('room_hum', e.target.value)} placeholder="~" />
                    : <span style={{ fontSize: 8.5 }}>{p.room_hum || '~'}</span>}
                  <span style={{ fontSize: 8 }}>%</span>
                </div>
                <div style={{ fontWeight: 'bold', marginBottom: 5, fontSize: 8 }}>QC Checklist:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {[
                    { key: 'qc_1', label: 'Suhu yang direquest sudah benar tercapai' },
                    { key: 'qc_3', label: 'Suhu maksimal akan balik ke suhu minimal tidak lebih dari jangka waktu 6 menit' },
                    { key: 'qc_4', label: 'Unit telah melewati test tegangan listrik' },
                  ].map(({ key, label }) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 5, fontSize: 8, cursor: isEdit ? 'pointer' : 'default', lineHeight: 1.35 }}>
                      <Checkbox checked={p[key] || false} onChange={e => setP(key, e.target.checked)} disabled={!isEdit} />
                      <span>{label}</span>
                    </label>
                  ))}
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 5, fontSize: 8, cursor: isEdit ? 'pointer' : 'default', lineHeight: 1.35 }}>
                    <Checkbox checked={p.qc_2 || false} onChange={e => setP('qc_2', e.target.checked)} disabled={!isEdit} />
                    <span>
                      {isEdit
                        ? <>Suhu tercapai dalam&nbsp;
                            <input type="text" className={styles.inlineInput} style={{ width: 28 }}
                              value={p.qc_2_time || ''} onChange={e => setP('qc_2_time', e.target.value)} placeholder="…" />
                            &nbsp;menit</>
                        : `Suhu tercapai dalam ${p.qc_2_time || '…………………………'} menit`}
                    </span>
                  </label>
                </div>
              </div>
            </td>
          </tr>

          {/* R6: Jumlah Heater + Ampere (Merged R6, R7, R8) */}
          <tr>
            <td colSpan={5} style={{ padding: 0, height: '1px' }}>
               <table style={{ width: '100%', height: '100%', borderCollapse: 'collapse' }}>
                 <tbody>
                   {/* Header Row */}
                   <tr style={{ height: '24px' }}>
                     <td style={{ ...hCell({ fontSize: 9 }), width: '40%' }}>Jumlah Heater</td>
                     <td colSpan={2} style={{ ...hCell({ fontSize: 9 }), width: '60%' }}>Ampere</td>
                   </tr>
                   {/* Sub-Header Row */}
                   <tr style={{ height: '24px' }}>
                     <td rowSpan={2} style={{ ...cell({ textAlign: 'center', verticalAlign: 'middle', padding: '8px' }) }}>
                        {ci(gi.jumlah_heater || '', v => setGI('jumlah_heater', v), 'Jumlah')}
                     </td>
                     <td style={{ ...hCell({ fontSize: 8 }), width: '30%' }}>Start</td>
                     <td style={{ ...hCell({ fontSize: 8 }), width: '30%' }}>Running</td>
                   </tr>
                   {/* Value Row */}
                   <tr style={{ height: '100%' }}>
                     <td style={{ ...cell({ textAlign: 'center', verticalAlign: 'bottom', paddingTop: '40px', paddingBottom: '4px' }), height: '100%' }}>
                        {isEdit
                          ? <input type="text" className={styles.cellInput} style={{ textAlign: 'center' }}
                              value={gi.amp_start || ''} onChange={e => setGI('amp_start', e.target.value)} placeholder="A" />
                          : <div style={{ fontSize: 8.5 }}>{gi.amp_start ? gi.amp_start + ' A' : 'A'}</div>}
                     </td>
                     <td style={{ ...cell({ textAlign: 'center', verticalAlign: 'bottom', paddingTop: '40px', paddingBottom: '4px' }), height: '100%' }}>
                        {isEdit
                          ? <input type="text" className={styles.cellInput} style={{ textAlign: 'center' }}
                              value={gi.amp_run || ''} onChange={e => setGI('amp_run', e.target.value)} placeholder="A" />
                          : <div style={{ fontSize: 8.5 }}>{gi.amp_run ? gi.amp_run + ' A' : 'A'}</div>}
                     </td>
                   </tr>
                 </tbody>
               </table>
            </td>
          </tr>

        </tbody>
      </table>

      {/* ══════════════════════════════════════════════════════
          4. SIGNATURE
          ══════════════════════════════════════════════════════ */}
      <table className={styles.signatureTable} style={{ marginTop: 0 }}>
        <tbody>
          <tr>
            <td style={{ width: '50%', textAlign: 'center', verticalAlign: 'bottom' }}>
              <span className={styles.signatureTitle}>Technician</span>
              <span className={styles.signatureName}>
                {isEdit
                  ? <input type="text" className={styles.cellInput} style={{ textAlign: 'center' }}
                      value={data.footer?.tech_name || ''}
                      onChange={e => onChange && isEdit && onChange('footer', { ...data.footer, tech_name: e.target.value })}
                      placeholder="Nama teknisi..." />
                  : (data.footer?.tech_name || '')}
              </span>
            </td>
            <td style={{ width: '50%', textAlign: 'center', verticalAlign: 'bottom' }}>
              <span className={styles.signatureTitle}>
                Quality Control<br />
                <span style={{ fontWeight: 'normal', fontSize: 6 }}>品管</span>
              </span>
              <span className={styles.signatureName}>
                {isEdit
                  ? <input type="text" className={styles.cellInput} style={{ textAlign: 'center' }}
                      value={data.footer?.qc_name || ''}
                      onChange={e => onChange && isEdit && onChange('footer', { ...data.footer, qc_name: e.target.value })}
                      placeholder="Nama QC..." />
                  : (data.footer?.qc_name || '')}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

    </div>
  );
}
