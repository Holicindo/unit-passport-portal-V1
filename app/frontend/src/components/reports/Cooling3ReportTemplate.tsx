import React from 'react';
import styles from './template.module.css';

function CheckboxDisplay({ checked, onChange, disabled }: { checked: boolean; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; disabled?: boolean }) {
  if (!disabled) return <input type="checkbox" checked={checked} onChange={onChange} />;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '13px', height: '13px', minWidth: '13px', border: checked ? '2px solid #2e5bff' : '2px solid #94a3b8', borderRadius: '2px', background: checked ? '#2e5bff' : '#fff', flexShrink: 0 }}>
      {checked && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3.5 6L6.5 2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
    </span>
  );
}

export default function Cooling3ReportTemplate({ mode = 'edit', data = {}, unit = {}, onChange }: any) {
  const isEdit = mode === 'edit';
  const setHeader = (k: string, v: any) => { if (onChange && isEdit) onChange('header', { ...data.header, [k]: v }); };
  const setTempRow = (row: 'cake' | 'ambient' | 'rtd', k: string, v: any) => {
    if (onChange && isEdit) onChange('general_inspection', { ...data.general_inspection, [row]: { ...(data.general_inspection?.[row] || {}), [k]: v } });
  };
  const setCooling = (side: 'left' | 'right', k: string, v: any) => {
    if (onChange && isEdit) onChange('cooling_system', { ...data.cooling_system, [side]: { ...(data.cooling_system?.[side] || {}), [k]: v } });
  };
  const setPerf = (k: string, v: any) => { if (onChange && isEdit) onChange('performance_inspection', { ...data.performance_inspection, [k]: v }); };

  const gi = data.general_inspection || {};
  const cake = gi.cake || {};
  const ambient = gi.ambient || {};
  const rtd = gi.rtd || {};

  // Helper to render a temperature row
  const TempRow = ({ label, rowData, rowKey, showPart }: { label: string; rowData: any; rowKey: 'cake' | 'ambient' | 'rtd'; showPart?: boolean }) => (
    <tr>
      <td className={styles.centerCell} style={{ fontWeight: 'bold' }}>{label}</td>
      <td>{showPart ? (isEdit ? <input type="text" className={styles.cellInput} placeholder="Part" value={gi.part || ''} onChange={e => { if (onChange && isEdit) onChange('general_inspection', { ...gi, part: e.target.value }); }} /> : (gi.part || '-')) : ''}</td>
      <td colSpan={2}>{isEdit ? <input type="text" className={styles.cellInput} value={rowData.required || ''} onChange={e => setTempRow(rowKey, 'required', e.target.value)} /> : (rowData.required || '-')}</td>
      <td colSpan={2} className={styles.centerCell}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isEdit ? <input type="text" className={`${styles.cellInput} ${styles.centerCell}`} value={rowData.setting_temp || ''} onChange={e => setTempRow(rowKey, 'setting_temp', e.target.value)} style={{ width: '40px' }} /> : <span>{rowData.setting_temp || '-'}</span>}
          <span style={{ marginLeft: '2px' }}>°C</span>
        </div>
      </td>
      <td colSpan={2} className={styles.centerCell}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isEdit ? <input type="text" className={`${styles.cellInput} ${styles.centerCell}`} value={rowData.temp_dalam || ''} onChange={e => setTempRow(rowKey, 'temp_dalam', e.target.value)} style={{ width: '40px' }} /> : <span>{rowData.temp_dalam || '-'}</span>}
          <span style={{ marginLeft: '2px' }}>°C</span>
        </div>
      </td>
      <td colSpan={2} className={styles.centerCell}>{isEdit ? <input type="text" className={`${styles.cellInput} ${styles.centerCell}`} value={rowData.digital_type || ''} onChange={e => setTempRow(rowKey, 'digital_type', e.target.value)} /> : (rowData.digital_type || '-')}</td>
      <td colSpan={5}>{isEdit ? <textarea className={styles.cellInput} style={{ minHeight: '28px', resize: 'vertical' }} value={rowData.setting || ''} onChange={e => setTempRow(rowKey, 'setting', e.target.value)} /> : <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '60px', overflow: 'hidden', fontSize: '7px' }}>{rowData.setting || '-'}</div>}</td>
    </tr>
  );

  return (
    <div className={`${styles.a4Sheet} ${styles.coolingReport}`}>
      {/* HEADER */}
      <table className={styles.sheetHeaderTable}>
        <tbody>
          <tr>
            <td className={styles.logoCell} rowSpan={3} style={{ width: '15%', background: '#000', color: '#fff', fontSize: '20px' }}>HOLIC</td>
            <td className={styles.titleCell} rowSpan={3} style={{ width: '50%', borderLeft: '1px solid #000', borderRight: '1px solid #000' }}>
              <div style={{ fontSize: '10px', fontWeight: 'normal' }}>Post-Production</div>
              <div style={{ fontSize: '22px', marginTop: '4px' }}>Cooling System Report</div>
            </td>
            <td style={{ width: '15%', fontSize: '7px', borderBottom: '1px solid #000', paddingLeft: '4px' }}><div>Serial Number</div><div>產品編號</div></td>
            <td style={{ width: '20%', borderBottom: '1px solid #000', paddingLeft: '4px', fontWeight: 'bold' }}>: A- {unit?.serial_number || data.header?.serial_number || '-'}</td>
          </tr>
          <tr>
            <td style={{ fontSize: '7px', borderBottom: '1px solid #000', paddingLeft: '4px' }}><div>Order Document</div><div>訂單編號</div></td>
            <td style={{ borderBottom: '1px solid #000', paddingLeft: '4px', fontWeight: 'bold' }}>: ITR- {isEdit ? <input type="text" className={styles.cellInput} style={{ width: '70%', display: 'inline' }} value={data.header?.order_document || ''} onChange={e => setHeader('order_document', e.target.value)} /> : (data.header?.order_document || '-')}</td>
          </tr>
          <tr>
            <td style={{ fontSize: '7px', paddingLeft: '4px' }}><div>Production Code</div><div>製造代碼</div></td>
            <td style={{ paddingLeft: '4px', fontWeight: 'bold' }}>: PRO- {isEdit ? <input type="text" className={styles.cellInput} style={{ width: '70%', display: 'inline' }} value={data.header?.production_code || ''} onChange={e => setHeader('production_code', e.target.value)} /> : (data.header?.production_code || '-')}</td>
          </tr>
        </tbody>
      </table>

      <table className={styles.infoGridTable}>
        <tbody>
          <tr>
            <th style={{ width: '10%' }}>Customer<br/><span style={{fontWeight:'normal',fontSize:'6px'}}>客戶</span></th>
            <td style={{ width: '20%' }}>{isEdit ? <input type="text" className={styles.cellInput} value={data.header?.customer || ''} onChange={e => setHeader('customer', e.target.value)} /> : (data.header?.customer || '-')}</td>
            <th style={{ width: '10%' }}>Starting Date<br/><span style={{fontWeight:'normal',fontSize:'6px'}}>生產日期</span></th>
            <td style={{ width: '15%' }}>{isEdit ? <input type="date" className={styles.cellInput} value={data.header?.starting_date || ''} onChange={e => setHeader('starting_date', e.target.value)} /> : (data.header?.starting_date || '-')}</td>
            <th style={{ width: '12%' }}>Finishing Date<br/><span style={{fontWeight:'normal',fontSize:'6px'}}>完成日期</span></th>
            <td style={{ width: '15%' }}>{isEdit ? <input type="date" className={styles.cellInput} value={data.header?.finishing_date || ''} onChange={e => setHeader('finishing_date', e.target.value)} /> : (data.header?.finishing_date || '-')}</td>
            <th style={{ width: '8%' }}>Inspection Date</th>
            <td style={{ width: '12%' }}>{isEdit ? <input type="date" className={styles.cellInput} value={data.header?.inspection_date || ''} onChange={e => setHeader('inspection_date', e.target.value)} /> : (data.header?.inspection_date || '-')}</td>
          </tr>
          <tr>
            <th>Category</th>
            <td>{isEdit ? <input type="text" className={styles.cellInput} value={data.header?.category || ''} onChange={e => setHeader('category', e.target.value)} /> : (data.header?.category || '-')}</td>
            <th>Item Code</th>
            <td>{isEdit ? <input type="text" className={styles.cellInput} value={data.header?.item_code || ''} onChange={e => setHeader('item_code', e.target.value)} /> : (data.header?.item_code || '-')}</td>
            <th>Model</th>
            <td colSpan={3}>{unit?.model_name || data.header?.model || '-'}</td>
          </tr>
        </tbody>
      </table>

      {/* GENERAL INSPECTION — 3 rows: CAKE, AMBIENT & RTD */}
      <table className={styles.denseTable} style={{ tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '9%' }} /><col style={{ width: '9%' }} /><col style={{ width: '6%' }} /><col style={{ width: '6%' }} />
          <col style={{ width: '6%' }} /><col style={{ width: '6%' }} /><col style={{ width: '6%' }} /><col style={{ width: '6%' }} />
          <col style={{ width: '9%' }} /><col style={{ width: '6%' }} /><col style={{ width: '6%' }} /><col style={{ width: '6%' }} />
          <col style={{ width: '6%' }} /><col style={{ width: '6%' }} /><col style={{ width: '9%' }} />
        </colgroup>
        <thead>
          <tr className={styles.sectionHeaderRow}>
            <th colSpan={15} style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '6px' }}>General Inspection</th>
          </tr>
          <tr style={{ backgroundColor: '#f8fafc', fontSize: '8px' }}>
            <th rowSpan={2}>Temperature<br/><span style={{fontWeight:'normal',fontSize:'6px'}}>溫度</span></th>
            <th rowSpan={2}>Part<br/><span style={{fontWeight:'normal',fontSize:'6px'}}>部分</span></th>
            <th rowSpan={2} colSpan={2}>Required<br/><span style={{fontWeight:'normal',fontSize:'6px'}}>需求</span></th>
            <th colSpan={2}>Setting Temperature<br/><span style={{fontWeight:'normal',fontSize:'6px'}}>設定溫度</span></th>
            <th colSpan={2}>Temperature Dalam<br/><span style={{fontWeight:'normal',fontSize:'6px'}}>櫃內溫度</span></th>
            <th colSpan={2}>Digital Control Type<br/><span style={{fontWeight:'normal',fontSize:'6px'}}>數位控制類型</span></th>
            <th colSpan={5}>Setting<br/><span style={{fontWeight:'normal',fontSize:'6px'}}>設定</span></th>
          </tr>
          <tr style={{ backgroundColor: '#f8fafc', fontSize: '7px' }}>
            <th colSpan={2}>(Suhu Disetting)</th>
            <th colSpan={2}>(Suhu Dalam Kabinet)</th>
            <th colSpan={2}>(Tipe Kontrol)</th>
            <th colSpan={5}>(Parameter)</th>
          </tr>
        </thead>
        <tbody>
          <TempRow label="CAKE" rowData={cake} rowKey="cake" showPart={true} />
          <TempRow label="AMBIENT" rowData={ambient} rowKey="ambient" />
          <TempRow label="RTD" rowData={rtd} rowKey="rtd" />

          {/* COOLING SYSTEM sub-headers */}
          <tr style={{ backgroundColor: '#f1f5f9', fontSize: '12px', textAlign: 'center' }}>
            <th rowSpan={9} style={{ width: '4%' }}>
              <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: '0 auto' }}>Cooling<br/>System<br/><span style={{fontWeight:'normal',fontSize:'8px'}}>冷卻系統</span></div>
            </th>
            <th rowSpan={3}>Part<br/><span style={{fontWeight:'normal',fontSize:'6px'}}>部分</span></th>
            <th colSpan={2}>Compressor<br/><span style={{fontWeight:'normal',fontSize:'6px'}}>壓縮機</span></th>
            <th colSpan={4}>Serial Number<br/><span style={{fontWeight:'normal',fontSize:'6px'}}>產品編號</span></th>
            <th rowSpan={3}>Part<br/><span style={{fontWeight:'normal',fontSize:'6px'}}>部分</span></th>
            <th colSpan={2}>Compressor<br/><span style={{fontWeight:'normal',fontSize:'6px'}}>壓縮機</span></th>
            <th colSpan={4}>Serial Number<br/><span style={{fontWeight:'normal',fontSize:'6px'}}>產品編號</span></th>
          </tr>
          <tr style={{ backgroundColor: '#f8fafc', fontSize: '7px', textAlign: 'center' }}>
            <th colSpan={2}>Freon<br/><span style={{fontWeight:'normal',fontSize:'5px'}}>冷媒</span></th>
            <th colSpan={2}>Pressure<br/><span style={{fontWeight:'normal',fontSize:'5px'}}>壓力</span></th>
            <th colSpan={2}>Ampere<br/><span style={{fontWeight:'normal',fontSize:'5px'}}>安培</span></th>
            <th colSpan={2}>Freon<br/><span style={{fontWeight:'normal',fontSize:'5px'}}>冷媒</span></th>
            <th colSpan={2}>Pressure<br/><span style={{fontWeight:'normal',fontSize:'5px'}}>壓力</span></th>
            <th colSpan={2}>Ampere<br/><span style={{fontWeight:'normal',fontSize:'5px'}}>安培</span></th>
          </tr>
          <tr style={{ backgroundColor: '#f8fafc', fontSize: '6.5px', textAlign: 'center' }}>
            <th>Type</th><th>Weight<br/><span style={{fontWeight:'normal',fontSize:'5px'}}>GRAM</span></th>
            <th>Start<br/><span style={{fontWeight:'normal',fontSize:'5px'}}>PSI</span></th><th>Running<br/><span style={{fontWeight:'normal',fontSize:'5px'}}>PSI</span></th>
            <th>Start<br/><span style={{fontWeight:'normal',fontSize:'5px'}}>A</span></th><th>Running<br/><span style={{fontWeight:'normal',fontSize:'5px'}}>A</span></th>
            <th>Type</th><th>Weight<br/><span style={{fontWeight:'normal',fontSize:'5px'}}>GRAM</span></th>
            <th>Start<br/><span style={{fontWeight:'normal',fontSize:'5px'}}>PSI</span></th><th>Running<br/><span style={{fontWeight:'normal',fontSize:'5px'}}>PSI</span></th>
            <th>Start<br/><span style={{fontWeight:'normal',fontSize:'5px'}}>A</span></th><th>Running<br/><span style={{fontWeight:'normal',fontSize:'5px'}}>A</span></th>
          </tr>
          <tr>
            <td rowSpan={2} className={styles.centerCell} style={{ fontWeight: 'bold' }}>Compressor<br/><span style={{fontWeight:'normal',fontSize:'6px'}}>壓縮機</span></td>
            <td colSpan={2}>{isEdit ? <input type="text" className={styles.cellInput} placeholder="Type" value={data.cooling_system?.left?.comp_type || ''} onChange={e => setCooling('left','comp_type',e.target.value)} /> : (data.cooling_system?.left?.comp_type || '')}</td>
            <td colSpan={4}>{isEdit ? <input type="text" className={styles.cellInput} placeholder="SN" value={data.cooling_system?.left?.comp_sn || ''} onChange={e => setCooling('left','comp_sn',e.target.value)} /> : (data.cooling_system?.left?.comp_sn || '')}</td>
            <td rowSpan={2} className={styles.centerCell} style={{ fontWeight: 'bold' }}>Compressor<br/><span style={{fontWeight:'normal',fontSize:'6px'}}>壓縮機</span></td>
            <td colSpan={2}>{isEdit ? <input type="text" className={styles.cellInput} placeholder="Type" value={data.cooling_system?.right?.comp_type || ''} onChange={e => setCooling('right','comp_type',e.target.value)} /> : (data.cooling_system?.right?.comp_type || '')}</td>
            <td colSpan={4}>{isEdit ? <input type="text" className={styles.cellInput} placeholder="SN" value={data.cooling_system?.right?.comp_sn || ''} onChange={e => setCooling('right','comp_sn',e.target.value)} /> : (data.cooling_system?.right?.comp_sn || '')}</td>
          </tr>
          <tr>
            {(['freon_type','freon_weight','press_start','press_run','amp_start','amp_run'] as const).map(k => (
              <td key={`l-${k}`} className={styles.centerCell}>{isEdit ? <input type="text" className={styles.cellInput} value={data.cooling_system?.left?.[k] || ''} onChange={e => setCooling('left',k,e.target.value)} /> : data.cooling_system?.left?.[k]}</td>
            ))}
            {(['freon_type','freon_weight','press_start','press_run','amp_start','amp_run'] as const).map(k => (
              <td key={`r-${k}`} className={styles.centerCell}>{isEdit ? <input type="text" className={styles.cellInput} value={data.cooling_system?.right?.[k] || ''} onChange={e => setCooling('right',k,e.target.value)} /> : data.cooling_system?.right?.[k]}</td>
            ))}
          </tr>
          <tr>
            <td className={styles.centerCell} style={{ fontWeight: 'bold' }}>Condensor<br/><span style={{fontWeight:'normal',fontSize:'6px'}}>散熱器</span></td>
            <td colSpan={6} style={{ padding: '3px 8px', fontSize: '9px' }}>{isEdit ? <textarea className={styles.cellInput} style={{ width: '100%', minHeight: '30px', resize: 'none', border: 'none', fontSize: '9px' }} value={data.cooling_system?.left?.condensor || ''} onChange={e => setCooling('left','condensor',e.target.value)} /> : <div style={{ minHeight: '30px', fontSize: '9px' }}>{data.cooling_system?.left?.condensor}</div>}</td>
            <td className={styles.centerCell} style={{ fontWeight: 'bold' }}>Condensor<br/><span style={{fontWeight:'normal',fontSize:'6px'}}>散熱器</span></td>
            <td colSpan={6} style={{ padding: '3px 8px', fontSize: '9px' }}>{isEdit ? <textarea className={styles.cellInput} style={{ width: '100%', minHeight: '30px', resize: 'none', border: 'none', fontSize: '9px' }} value={data.cooling_system?.right?.condensor || ''} onChange={e => setCooling('right','condensor',e.target.value)} /> : <div style={{ minHeight: '30px', fontSize: '9px' }}>{data.cooling_system?.right?.condensor}</div>}</td>
          </tr>

          {/* Evaporator */}
          <tr>
            <td className={styles.centerCell} style={{ fontWeight: 'bold' }}>Evaporator<br/><br/><span style={{fontWeight:'normal',fontSize:'6px'}}>冷排</span></td>
            <td colSpan={6} style={{ padding: 0 }}>
              <div style={{ display: 'flex', height: '100%', minHeight: '60px' }}>
                <div style={{ flex: 1.5, borderRight: '1px solid #cbd5e1', padding: '4px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: '9px', gap: '2px' }}>
                    Ø <input type="text" className={styles.cellInput} style={{ width: '22px', margin: '0 2px', borderBottom: isEdit ? '1px dotted #000' : 'none', fontSize: '9px' }} value={data.cooling_system?.left?.evap_dia || ''} onChange={e => setCooling('left','evap_dia',e.target.value)} disabled={!isEdit} />
                    x <input type="text" className={styles.cellInput} style={{ width: '22px', margin: '0 2px', borderBottom: isEdit ? '1px dotted #000' : 'none', fontSize: '9px' }} value={data.cooling_system?.left?.evap_length || ''} onChange={e => setCooling('left','evap_length',e.target.value)} disabled={!isEdit} />
                    R x <input type="text" className={styles.cellInput} style={{ width: '22px', margin: '0 2px', borderBottom: isEdit ? '1px dotted #000' : 'none', fontSize: '9px' }} value={data.cooling_system?.left?.evap_t || ''} onChange={e => setCooling('left','evap_t',e.target.value)} disabled={!isEdit} /> T
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', marginTop: '4px' }}>
                    <span style={{ marginLeft: '10px' }}>GAP</span>
                    <span><input type="text" className={styles.cellInput} style={{ width: '32px', textAlign: 'right', borderBottom: isEdit ? '1px dotted #000' : 'none', fontSize: '9px' }} value={data.cooling_system?.left?.evap_gap || ''} onChange={e => setCooling('left','evap_gap',e.target.value)} disabled={!isEdit} /> mm</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', marginTop: '4px' }}>
                    <span style={{ marginLeft: '10px' }}>x</span>
                    <span><input type="text" className={styles.cellInput} style={{ width: '32px', textAlign: 'right', borderBottom: isEdit ? '1px dotted #000' : 'none', fontSize: '9px' }} value={data.cooling_system?.left?.evap_x || ''} onChange={e => setCooling('left','evap_x',e.target.value)} disabled={!isEdit} /> mm</span>
                  </div>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ flex: 1, borderBottom: '1px solid #cbd5e1', display: 'flex' }}>
                    <div style={{ width: '54px', borderRight: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '8px' }}>
                      <CheckboxDisplay checked={data.cooling_system?.left?.has_capiler || false} onChange={e => setCooling('left','has_capiler',e.target.checked)} disabled={!isEdit} />
                      <span style={{ marginTop: '3px', fontWeight: 'bold' }}>Capiler</span>
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px' }}>
                      x <input type="text" className={styles.cellInput} style={{ width: '22px', margin: '0 4px', borderBottom: isEdit ? '1px dotted #000' : 'none', fontSize: '9px' }} value={data.cooling_system?.left?.capiler_size || ''} onChange={e => setCooling('left','capiler_size',e.target.value)} disabled={!isEdit} /> cm
                    </div>
                  </div>
                  <div style={{ flex: 1, display: 'flex' }}>
                    <div style={{ width: '54px', borderRight: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '8px', textAlign: 'center' }}>
                      <CheckboxDisplay checked={data.cooling_system?.left?.has_expansion || false} onChange={e => setCooling('left','has_expansion',e.target.checked)} disabled={!isEdit} />
                      <span style={{ marginTop: '3px', fontWeight: 'bold' }}>Expansion<br/>Valve</span>
                    </div>
                    <div style={{ flex: 1 }}></div>
                  </div>
                </div>
              </div>
            </td>
            <td className={styles.centerCell} style={{ fontWeight: 'bold' }}>Evaporator<br/><br/><span style={{fontWeight:'normal',fontSize:'6px'}}>冷排</span></td>
            <td colSpan={6} style={{ padding: 0 }}>
              <div style={{ display: 'flex', height: '100%', minHeight: '60px' }}>
                <div style={{ flex: 1.5, borderRight: '1px solid #cbd5e1', padding: '4px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: '9px', gap: '2px' }}>
                    Ø <input type="text" className={styles.cellInput} style={{ width: '22px', margin: '0 2px', borderBottom: isEdit ? '1px dotted #000' : 'none', fontSize: '9px' }} value={data.cooling_system?.right?.evap_dia || ''} onChange={e => setCooling('right','evap_dia',e.target.value)} disabled={!isEdit} />
                    x <input type="text" className={styles.cellInput} style={{ width: '22px', margin: '0 2px', borderBottom: isEdit ? '1px dotted #000' : 'none', fontSize: '9px' }} value={data.cooling_system?.right?.evap_length || ''} onChange={e => setCooling('right','evap_length',e.target.value)} disabled={!isEdit} />
                    R x <input type="text" className={styles.cellInput} style={{ width: '22px', margin: '0 2px', borderBottom: isEdit ? '1px dotted #000' : 'none', fontSize: '9px' }} value={data.cooling_system?.right?.evap_t || ''} onChange={e => setCooling('right','evap_t',e.target.value)} disabled={!isEdit} /> T
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', marginTop: '4px' }}>
                    <span style={{ marginLeft: '10px' }}>GAP</span>
                    <span><input type="text" className={styles.cellInput} style={{ width: '32px', textAlign: 'right', borderBottom: isEdit ? '1px dotted #000' : 'none', fontSize: '9px' }} value={data.cooling_system?.right?.evap_gap || ''} onChange={e => setCooling('right','evap_gap',e.target.value)} disabled={!isEdit} /> mm</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', marginTop: '4px' }}>
                    <span style={{ marginLeft: '10px' }}>x</span>
                    <span><input type="text" className={styles.cellInput} style={{ width: '32px', textAlign: 'right', borderBottom: isEdit ? '1px dotted #000' : 'none', fontSize: '9px' }} value={data.cooling_system?.right?.evap_x || ''} onChange={e => setCooling('right','evap_x',e.target.value)} disabled={!isEdit} /> mm</span>
                  </div>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ flex: 1, borderBottom: '1px solid #cbd5e1', display: 'flex' }}>
                    <div style={{ width: '54px', borderRight: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '8px' }}>
                      <CheckboxDisplay checked={data.cooling_system?.right?.has_capiler || false} onChange={e => setCooling('right','has_capiler',e.target.checked)} disabled={!isEdit} />
                      <span style={{ marginTop: '3px', fontWeight: 'bold' }}>Capiler</span>
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px' }}>
                      x <input type="text" className={styles.cellInput} style={{ width: '22px', margin: '0 4px', borderBottom: isEdit ? '1px dotted #000' : 'none', fontSize: '9px' }} value={data.cooling_system?.right?.capiler_size || ''} onChange={e => setCooling('right','capiler_size',e.target.value)} disabled={!isEdit} /> cm
                    </div>
                  </div>
                  <div style={{ flex: 1, display: 'flex' }}>
                    <div style={{ width: '54px', borderRight: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '8px', textAlign: 'center' }}>
                      <CheckboxDisplay checked={data.cooling_system?.right?.has_expansion || false} onChange={e => setCooling('right','has_expansion',e.target.checked)} disabled={!isEdit} />
                      <span style={{ marginTop: '3px', fontWeight: 'bold' }}>Expansion<br/>Valve</span>
                    </div>
                    <div style={{ flex: 1 }}></div>
                  </div>
                </div>
              </div>
            </td>
          </tr>
          {/* Fan Evap */}
          <tr>
            <td className={styles.centerCell} style={{ fontWeight: 'bold' }}>Fan Evap</td>
            <td colSpan={6} style={{ padding: '3px 8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', fontSize: '9px', gap: '6px' }}>
                <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Model</span>
                {isEdit ? <input type="text" className={styles.cellInput} style={{ flex: 1, borderBottom: '1px dotted #000', outline: 'none', background: 'transparent', fontSize: '9px' }} value={data.cooling_system?.left?.fan_evap_model || ''} onChange={e => setCooling('left','fan_evap_model',e.target.value)} /> : <span style={{ flex: 1, fontSize: '9px' }}>{data.cooling_system?.left?.fan_evap_model}</span>}
                <span style={{ whiteSpace: 'nowrap' }}>x</span>
                {isEdit ? <input type="text" className={styles.cellInput} style={{ width: '32px', borderBottom: '1px dotted #000', textAlign: 'center', outline: 'none', background: 'transparent', fontSize: '9px' }} value={data.cooling_system?.left?.fan_evap_qty || ''} onChange={e => setCooling('left','fan_evap_qty',e.target.value)} /> : <span style={{ minWidth: '24px', textAlign: 'center', fontSize: '9px', fontWeight: 'bold' }}>{data.cooling_system?.left?.fan_evap_qty}</span>}
                <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>PCS</span>
              </div>
            </td>
            <td className={styles.centerCell} style={{ fontWeight: 'bold' }}>Fan Evap</td>
            <td colSpan={6} style={{ padding: '3px 8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', fontSize: '9px', gap: '6px' }}>
                <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Model</span>
                {isEdit ? <input type="text" className={styles.cellInput} style={{ flex: 1, borderBottom: '1px dotted #000', outline: 'none', background: 'transparent', fontSize: '9px' }} value={data.cooling_system?.right?.fan_evap_model || ''} onChange={e => setCooling('right','fan_evap_model',e.target.value)} /> : <span style={{ flex: 1, fontSize: '9px' }}>{data.cooling_system?.right?.fan_evap_model}</span>}
                <span style={{ whiteSpace: 'nowrap' }}>x</span>
                {isEdit ? <input type="text" className={styles.cellInput} style={{ width: '32px', borderBottom: '1px dotted #000', textAlign: 'center', outline: 'none', background: 'transparent', fontSize: '9px' }} value={data.cooling_system?.right?.fan_evap_qty || ''} onChange={e => setCooling('right','fan_evap_qty',e.target.value)} /> : <span style={{ minWidth: '24px', textAlign: 'center', fontSize: '9px', fontWeight: 'bold' }}>{data.cooling_system?.right?.fan_evap_qty}</span>}
                <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>PCS</span>
              </div>
            </td>
          </tr>
          {/* Fan Antimist */}
          <tr>
            <td className={styles.centerCell} style={{ fontWeight: 'bold' }}>Fan Antimist<br/><span style={{fontWeight:'normal',fontSize:'6px'}}>風扇</span></td>
            <td colSpan={6} style={{ padding: '3px 8px', fontSize: '9px' }}>{isEdit ? <textarea className={styles.cellInput} style={{ width: '100%', minHeight: '30px', resize: 'none', border: 'none', fontSize: '9px' }} value={data.cooling_system?.left?.fan_antimist_notes || ''} onChange={e => setCooling('left','fan_antimist_notes',e.target.value)} /> : <div style={{ minHeight: '30px', padding: '2px 0', fontSize: '9px' }}>{data.cooling_system?.left?.fan_antimist_notes}</div>}</td>
            <td className={styles.centerCell} style={{ fontWeight: 'bold' }}>Fan Antimist<br/><span style={{fontWeight:'normal',fontSize:'6px'}}>風扇</span></td>
            <td colSpan={6} style={{ padding: '3px 8px', fontSize: '9px' }}>{isEdit ? <textarea className={styles.cellInput} style={{ width: '100%', minHeight: '30px', resize: 'none', border: 'none', fontSize: '9px' }} value={data.cooling_system?.right?.fan_antimist_notes || ''} onChange={e => setCooling('right','fan_antimist_notes',e.target.value)} /> : <div style={{ minHeight: '30px', padding: '2px 0', fontSize: '9px' }}>{data.cooling_system?.right?.fan_antimist_notes}</div>}</td>
          </tr>
        </tbody>
      </table>

      {/* PERFORMANCE INSPECTION — merged into same table for column alignment */}
      <table className={styles.denseTable} style={{ tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '9%' }} /><col style={{ width: '9%' }} /><col style={{ width: '6%' }} /><col style={{ width: '6%' }} />
          <col style={{ width: '6%' }} /><col style={{ width: '6%' }} /><col style={{ width: '6%' }} /><col style={{ width: '6%' }} />
          <col style={{ width: '9%' }} /><col style={{ width: '6%' }} /><col style={{ width: '6%' }} /><col style={{ width: '6%' }} />
          <col style={{ width: '6%' }} /><col style={{ width: '6%' }} /><col style={{ width: '9%' }} />
        </colgroup>
        <tbody>
          {/* Section header */}
          <tr className={styles.sectionHeaderRow} style={{ background: '#64748b', color: '#000' }}>
            <th colSpan={15} style={{ padding: '6px', fontSize: '12px', textTransform: 'capitalize' }}>PERFORMANCE INSPECTION</th>
          </tr>
          {/* Diagram (cols 1-9) + Right info (cols 10-15) */}
          <tr>
            <td colSpan={9} style={{ padding: 0, verticalAlign: 'top' }}>
              <div style={{ position: 'relative', minHeight: '280px', padding: '10px' }}>
                <div className={styles.circuitLine} style={{ border: '2px solid #000', top: '30px', bottom: '30px', left: '40px', right: '40px' }}></div>
                <div style={{ position: 'absolute', top: '50%', left: '33px', transform: 'translateY(-50%)' }}>
                  <div style={{ width: 0, height: 0, borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderBottom: '14px solid #000' }}></div>
                  <div style={{ width: '8px', height: '18px', background: '#000', margin: '0 auto' }}></div>
                </div>
                <div style={{ position: 'absolute', top: '50%', right: '33px', transform: 'translateY(-50%)' }}>
                  <div style={{ width: '8px', height: '18px', background: '#000', margin: '0 auto' }}></div>
                  <div style={{ width: 0, height: 0, borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderTop: '14px solid #000' }}></div>
                </div>
                <div style={{ position: 'absolute', bottom: '24px', left: '45%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: 0, height: 0, borderTop: '9px solid transparent', borderBottom: '9px solid transparent', borderRight: '14px solid #000' }}></div>
                  <div style={{ height: '8px', width: '24px', background: '#000' }}></div>
                </div>
                <div style={{ position: 'absolute', top: '15px', left: '50%', transform: 'translateX(-50%)', width: '160px', height: '30px', border: '2px solid #000', background: 'repeating-linear-gradient(90deg,transparent,transparent 10px,#000 10px,#000 11px)', backgroundColor: '#fff', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ background: '#fff', border: '1px solid #000', padding: '2px 8px', textAlign: 'center', width: '80px' }}>
                    <div style={{ fontSize: '9px', fontWeight: 'bold' }}>Evaporator<br/><span style={{fontWeight:'normal',fontSize:'7px'}}>蒸發器</span></div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', fontSize: '7px' }}>
                      <div>Min<br/>Max</div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div>{isEdit ? <input type="text" className={styles.circuitInput} value={data.performance_inspection?.evap_min || ''} onChange={e => setPerf('evap_min',e.target.value)} /> : <span>{data.performance_inspection?.evap_min ?? '-'}°C</span>}</div>
                        <div>{isEdit ? <input type="text" className={styles.circuitInput} value={data.performance_inspection?.evap_max || ''} onChange={e => setPerf('evap_max',e.target.value)} /> : <span>{data.performance_inspection?.evap_max ?? '-'}°C</span>}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ position: 'absolute', top: '5px', left: '46px', fontSize: '8px', background: '#fff', padding: '2px', zIndex: 10 }}>
                  <div>Min {isEdit ? <input type="text" className={styles.circuitInput} style={{ width: '25px' }} value={data.performance_inspection?.evap_left_min || ''} onChange={e => setPerf('evap_left_min',e.target.value)} /> : <span>{data.performance_inspection?.evap_left_min ?? '-'}°C</span>}</div>
                  <div style={{ marginTop: '2px' }}>Max {isEdit ? <input type="text" className={styles.circuitInput} style={{ width: '25px' }} value={data.performance_inspection?.evap_left_max || ''} onChange={e => setPerf('evap_left_max',e.target.value)} /> : <span>{data.performance_inspection?.evap_left_max ?? '-'}°C</span>}</div>
                </div>
                <div style={{ position: 'absolute', top: '5px', right: '46px', fontSize: '8px', background: '#fff', padding: '2px', zIndex: 10 }}>
                  <div>Min {isEdit ? <input type="text" className={styles.circuitInput} style={{ width: '25px' }} value={data.performance_inspection?.evap_right_min || ''} onChange={e => setPerf('evap_right_min',e.target.value)} /> : <span>{data.performance_inspection?.evap_right_min ?? '-'}°C</span>}</div>
                  <div style={{ marginTop: '2px' }}>Max {isEdit ? <input type="text" className={styles.circuitInput} style={{ width: '25px' }} value={data.performance_inspection?.evap_right_max || ''} onChange={e => setPerf('evap_right_max',e.target.value)} /> : <span>{data.performance_inspection?.evap_right_max ?? '-'}°C</span>}</div>
                </div>
                <div className={styles.kabinetArea}>
                  <div style={{ fontWeight: 'bold', fontSize: '16px', textDecoration: 'underline', marginBottom: '8px' }}>Dalam Kabinet</div>
                  <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', marginBottom: '8px' }}>
                    <div><div style={{ fontSize: '11px', fontWeight: 'bold' }}>Min</div><div style={{ display: 'flex', alignItems: 'center', fontSize: '13px', fontWeight: 'bold' }}>{isEdit ? <input type="text" className={styles.circuitInput} value={data.performance_inspection?.kabinet_min || ''} onChange={e => setPerf('kabinet_min',e.target.value)} /> : <span>{data.performance_inspection?.kabinet_min || '-'}</span>} <span style={{ marginLeft: '2px' }}>°C</span></div></div>
                    <div><div style={{ fontSize: '11px', fontWeight: 'bold' }}>Max</div><div style={{ display: 'flex', alignItems: 'center', fontSize: '13px', fontWeight: 'bold' }}>{isEdit ? <input type="text" className={styles.circuitInput} value={data.performance_inspection?.kabinet_max || ''} onChange={e => setPerf('kabinet_max',e.target.value)} /> : <span>{data.performance_inspection?.kabinet_max || '-'}</span>} <span style={{ marginLeft: '2px' }}>°C</span></div></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 'bold' }}>
                    <span>Humidity</span><span style={{ fontSize: '16px' }}>~</span>
                    {isEdit ? <input type="text" className={styles.circuitInput} style={{ width: '30px' }} value={data.performance_inspection?.kabinet_hum || ''} onChange={e => setPerf('kabinet_hum',e.target.value)} /> : <span style={{ fontSize: '13px' }}>{data.performance_inspection?.kabinet_hum || '-'}</span>}
                    <span>%</span>
                  </div>
                </div>
                <div style={{ position: 'absolute', bottom: '-5px', left: '10px', zIndex: 2 }}>
                  <div style={{ width: '80px', height: '60px', border: '2px solid #000', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '50px', height: '50px', border: '1px solid #000', borderRadius: '50%', position: 'relative' }}>
                      <div style={{ position: 'absolute', top: '50%', left: '50%', width: '100%', height: '1px', background: '#000', transform: 'translate(-50%,-50%) rotate(45deg)' }}></div>
                      <div style={{ position: 'absolute', top: '50%', left: '50%', width: '100%', height: '1px', background: '#000', transform: 'translate(-50%,-50%) rotate(-45deg)' }}></div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '8px', fontWeight: 'bold', marginTop: '4px' }}>Condenser<br/><span style={{fontWeight:'normal',fontSize:'7px'}}>冷凝器</span></div>
                </div>
                <div style={{ position: 'absolute', bottom: '35px', left: '100px', fontSize: '8px', background: '#fff', padding: '2px', zIndex: 10 }}>
                  <div>Min {isEdit ? <input type="text" className={styles.circuitInput} style={{ width: '25px' }} value={data.performance_inspection?.cond_min || ''} onChange={e => setPerf('cond_min',e.target.value)} /> : <span>{data.performance_inspection?.cond_min ?? '-'}°C</span>}</div>
                  <div>Max {isEdit ? <input type="text" className={styles.circuitInput} style={{ width: '25px' }} value={data.performance_inspection?.cond_max || ''} onChange={e => setPerf('cond_max',e.target.value)} /> : <span>{data.performance_inspection?.cond_max ?? '-'}°C</span>}</div>
                </div>
                <div style={{ position: 'absolute', bottom: '-5px', right: '15px', zIndex: 2 }}>
                  <div style={{ width: '45px', height: '65px', border: '2px solid #000', borderRadius: '12px', background: '#fff', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '15px', right: '-8px', width: '8px', height: '35px', border: '2px solid #000', borderLeft: 'none', borderRadius: '0 8px 8px 0', background: '#fff' }}></div>
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '8px', fontWeight: 'bold', marginTop: '4px' }}>Compressor<br/><span style={{fontWeight:'normal',fontSize:'7px'}}>壓縮機</span></div>
                </div>
                <div style={{ position: 'absolute', bottom: '35px', right: '65px', fontSize: '8px', background: '#fff', padding: '2px', zIndex: 10 }}>
                  <div>Min {isEdit ? <input type="text" className={styles.circuitInput} style={{ width: '25px' }} value={data.performance_inspection?.comp_min || ''} onChange={e => setPerf('comp_min',e.target.value)} /> : <span>{data.performance_inspection?.comp_min ?? '-'}°C</span>}</div>
                  <div style={{ marginTop: '2px' }}>Max {isEdit ? <input type="text" className={styles.circuitInput} style={{ width: '25px' }} value={data.performance_inspection?.comp_max || ''} onChange={e => setPerf('comp_max',e.target.value)} /> : <span>{data.performance_inspection?.comp_max ?? '-'}°C</span>}</div>
                </div>
              </div>
            </td>
            {/* Right: Suhu Ruangan + QC Checklist — cols 10-15 */}
            <td colSpan={6} style={{ padding: '10px', verticalAlign: 'top' }}>
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div className={styles.roomTempBox} style={{ borderStyle: 'dashed', padding: '16px', borderRadius: '4px', background: '#fff' }}>
                  <div className={styles.boxTitle} style={{ fontSize: '11px', marginBottom: '12px' }}>Suhu Ruangan</div>
                  <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', margin: '8px 0' }}>
                    <div><div style={{ fontSize: '11px', fontWeight: 'bold' }}>Min</div><div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', fontSize: '13px', fontWeight: 'bold' }}>{isEdit ? <input type="text" className={styles.circuitInput} style={{ width: '25px' }} value={data.performance_inspection?.room_min || ''} onChange={e => setPerf('room_min',e.target.value)} /> : <span>{data.performance_inspection?.room_min || '-'}</span>} <span style={{ marginLeft: '2px' }}>°C</span></div></div>
                    <div><div style={{ fontSize: '11px', fontWeight: 'bold' }}>Max</div><div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', fontSize: '13px', fontWeight: 'bold' }}>{isEdit ? <input type="text" className={styles.circuitInput} style={{ width: '25px' }} value={data.performance_inspection?.room_max || ''} onChange={e => setPerf('room_max',e.target.value)} /> : <span>{data.performance_inspection?.room_max || '-'}</span>} <span style={{ marginLeft: '2px' }}>°C</span></div></div>
                  </div>
                  <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 'bold' }}>
                    <span>Humidity</span><span style={{ fontSize: '14px' }}>~</span>
                    {isEdit ? <input type="text" className={styles.circuitInput} style={{ width: '30px' }} value={data.performance_inspection?.room_hum || ''} onChange={e => setPerf('room_hum',e.target.value)} /> : <span style={{ fontSize: '13px' }}>{data.performance_inspection?.room_hum || '-'}</span>}
                    <span>%</span>
                  </div>
                </div>
                <div className={styles.qcChecklistBox} style={{ background: '#fff', border: '1px solid #000', flex: 1 }}>
                  <div className={styles.boxTitle} style={{ textAlign: 'left', marginBottom: '12px', fontSize: '16px' }}>QC Checklist:</div>
                  <label className={styles.qcLabel}>
                    <CheckboxDisplay checked={data.performance_inspection?.qc_1 || false} onChange={e => setPerf('qc_1', e.target.checked)} disabled={!isEdit} />
                    <span>Suhu yang direquest sudah benar tercapai</span>
                  </label>
                  <label className={styles.qcLabel}>
                    <CheckboxDisplay checked={data.performance_inspection?.qc_2 || false} onChange={e => setPerf('qc_2', e.target.checked)} disabled={!isEdit} />
                    <span>Suhu tercapai dalam{' '}
                      {isEdit
                        ? <input type="text" className={styles.inlineInput} style={{ width: '30px', margin: '0 4px', borderBottom: '1px dotted #000' }} value={data.performance_inspection?.qc_2_time || ''} onChange={e => setPerf('qc_2_time', e.target.value)} />
                        : <span style={{ margin: '0 4px' }}>{data.performance_inspection?.qc_2_time || '___'}</span>}
                      {' '}menit
                    </span>
                  </label>
                  <label className={styles.qcLabel}>
                    <CheckboxDisplay checked={data.performance_inspection?.qc_3 || false} onChange={e => setPerf('qc_3', e.target.checked)} disabled={!isEdit} />
                    <span>Suhu maksimal akan balik ke suhu minimal tidak lebih dari jangka waktu 6 menit</span>
                  </label>
                  <label className={styles.qcLabel}>
                    <CheckboxDisplay checked={data.performance_inspection?.qc_4 || false} onChange={e => setPerf('qc_4', e.target.checked)} disabled={!isEdit} />
                    <span>Unit telah melewati test tegangan listrik</span>
                  </label>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <table className={styles.signatureTable}>
        <tbody>
          <tr>
            <td>
              <span className={styles.signatureTitle}>Technician<br/><span style={{fontWeight:'normal',fontSize:'7px'}}>技術員</span></span>
              {isEdit ? <input type="text" className={styles.cellInput} style={{ textAlign: 'center' }} placeholder="Nama Teknisi" value={data.footer?.tech_name || ''} onChange={e => { if (onChange) onChange('footer', { ...data.footer, tech_name: e.target.value }); }} /> : <span className={styles.signatureName}>{data.footer?.tech_name || '-'}</span>}
            </td>
            <td>
              <span className={styles.signatureTitle}>Quality Control<br/><span style={{fontWeight:'normal',fontSize:'7px'}}>品管</span></span>
              {isEdit ? <input type="text" className={styles.cellInput} style={{ textAlign: 'center' }} placeholder="Nama QC" value={data.footer?.qc_name || ''} onChange={e => { if (onChange) onChange('footer', { ...data.footer, qc_name: e.target.value }); }} /> : <span className={styles.signatureName}>{data.footer?.qc_name || '-'}</span>}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
