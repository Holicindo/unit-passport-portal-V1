import React from 'react';
import styles from './template.module.css';

function CheckboxDisplay({ checked, onChange, disabled }: { checked: boolean; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; disabled?: boolean }) {
  if (!disabled) return <input type="checkbox" checked={checked} onChange={onChange} />;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:'13px', height:'13px', minWidth:'13px', border: checked ? '2px solid #2e5bff' : '2px solid #94a3b8', borderRadius:'2px', background: checked ? '#2e5bff' : '#fff', flexShrink:0 }}>
      {checked && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3.5 6L6.5 2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
    </span>
  );
}

export default function WarmReportTemplate({ mode = 'edit', data = {}, unit = {}, onChange }: any) {
  const isEdit = mode === 'edit';

  const setHeader = (k: string, v: any) => { if (onChange && isEdit) onChange('header', { ...data.header, [k]: v }); };
  const setRow    = (i: number, k: string, v: any) => {
    if (!onChange || !isEdit) return;
    const r = [...(data.general_inspection?.rows || [{},{},{}])];
    r[i] = { ...r[i], [k]: v };
    onChange('general_inspection', { ...data.general_inspection, rows: r });
  };
  const setGI   = (k: string, v: any) => { if (onChange && isEdit) onChange('general_inspection', { ...data.general_inspection, [k]: v }); };
  const setPerf = (k: string, v: any) => { if (onChange && isEdit) onChange('performance_inspection', { ...data.performance_inspection, [k]: v }); };

  const gi   = data.general_inspection || {};
  const rows = (gi.rows || [{},{},{}]) as any[];
  const p    = data.performance_inspection || {};

  const ci = (val: string, cb: (v:string)=>void, ph='') =>
    isEdit ? <input type="text" className={styles.cellInput} value={val} onChange={e=>cb(e.target.value)} placeholder={ph}/> : <span>{val||''}</span>;

  return (
    <div className={`${styles.a4Sheet} ${styles.coolingReport}`}>

      {/* ── HEADER ── */}
      <table className={styles.sheetHeaderTable}>
        <tbody>
          <tr>
            <td className={styles.logoCell} rowSpan={3} style={{ width:'15%', background:'#000000', color:'#ffffff', fontSize:'20px' }}>HOLIC</td>
            <td className={styles.titleCell} rowSpan={3} style={{ width:'50%', borderLeft:'1px solid #000', borderRight:'1px solid #000' }}>
              <div style={{ fontSize:'10px', fontWeight:'normal' }}>Post-Production</div>
              <div style={{ fontSize:'22px', marginTop:'4px' }}>Cooling System Report</div>
            </td>
            <td style={{ width:'15%', fontSize:'7px', borderBottom:'1px solid #000', paddingLeft:'4px' }}><div>Serial Number</div><div>產品編號</div></td>
            <td style={{ width:'20%', borderBottom:'1px solid #000', paddingLeft:'4px', fontWeight:'bold' }}>: A- {unit?.serial_number || data.header?.serial_number || '-'}</td>
          </tr>
          <tr>
            <td style={{ fontSize:'7px', borderBottom:'1px solid #000', paddingLeft:'4px' }}><div>Order Document</div><div>訂單編號</div></td>
            <td style={{ borderBottom:'1px solid #000', paddingLeft:'4px', fontWeight:'bold' }}>: ITR- {isEdit ? <input type="text" className={styles.cellInput} style={{ width:'70%', display:'inline' }} value={data.header?.order_document||''} onChange={e=>setHeader('order_document',e.target.value)}/> : (data.header?.order_document||'-')}</td>
          </tr>
          <tr>
            <td style={{ fontSize:'7px', paddingLeft:'4px' }}><div>Production Code</div><div>製造代碼</div></td>
            <td style={{ paddingLeft:'4px', fontWeight:'bold' }}>: PRO- {isEdit ? <input type="text" className={styles.cellInput} style={{ width:'70%', display:'inline' }} value={data.header?.production_code||''} onChange={e=>setHeader('production_code',e.target.value)}/> : (data.header?.production_code||'-')}</td>
          </tr>
        </tbody>
      </table>

      {/* ── INFO ROW ── */}
      <table className={styles.infoGridTable}>
        <tbody>
          <tr>
            <th style={{ width:'10%' }}>Customer<br/><span style={{ fontWeight:'normal', fontSize:'6px' }}>客戶</span></th>
            <td style={{ width:'20%' }}>{isEdit ? <input type="text" className={styles.cellInput} value={data.header?.customer||''} onChange={e=>setHeader('customer',e.target.value)}/> : (data.header?.customer||'-')}</td>
            <th style={{ width:'10%' }}>Starting Date<br/><span style={{ fontWeight:'normal', fontSize:'6px' }}>生產日期</span></th>
            <td style={{ width:'15%' }}>{isEdit ? <input type="date" className={styles.cellInput} value={data.header?.starting_date||''} onChange={e=>setHeader('starting_date',e.target.value)}/> : (data.header?.starting_date||'-')}</td>
            <th style={{ width:'12%' }}>Finishing Date<br/><span style={{ fontWeight:'normal', fontSize:'6px' }}>完成日期</span></th>
            <td style={{ width:'15%' }}>{isEdit ? <input type="date" className={styles.cellInput} value={data.header?.finishing_date||''} onChange={e=>setHeader('finishing_date',e.target.value)}/> : (data.header?.finishing_date||'-')}</td>
            <th style={{ width:'8%' }}>Inspection Date</th>
            <td style={{ width:'12%' }}>{isEdit ? <input type="date" className={styles.cellInput} value={data.header?.inspection_date||''} onChange={e=>setHeader('inspection_date',e.target.value)}/> : (data.header?.inspection_date||'-')}</td>
          </tr>
          <tr>
            <th>Category</th>
            <td>{isEdit ? <input type="text" className={styles.cellInput} value={data.header?.category||''} onChange={e=>setHeader('category',e.target.value)}/> : (data.header?.category||'-')}</td>
            <th>Item Code</th>
            <td>{isEdit ? <input type="text" className={styles.cellInput} value={data.header?.item_code||''} onChange={e=>setHeader('item_code',e.target.value)}/> : (data.header?.item_code||'-')}</td>
            <th>Model</th>
            <td colSpan={3}>{unit?.model_name || data.header?.model || '-'}</td>
          </tr>
        </tbody>
      </table>

      {/* ── MAIN BODY ──
        Columns (9 total, matching company template exactly):
          C0  9%  — row-group label (Temperature 溫度 / Cooling System 冷凍系統)
          C1  8%  — Required sub-label (Part 部分)
          C2 10%  — Required value
          C3 11%  — Setting Temperature
          C4 11%  — Temperature Dalam
          C5 11%  — Digital Control Type
          C6 10%  — Setting 設定 / Spesifikasi Heater label
          ── divider ──
          C7 30%  — Performance Inspection right panel

        Row structure (matching company template):
          R0: "General Inspection"(cs7) | "Performance Inspection"(C7)
          R1: Temperature(rs4) | Required(cs2) | Setting Temp | Temp Dalam | Digital Control | Setting | [perf: blank top area]
          R2: Part label | - °C | (empty) | (empty) | (empty) | (empty) | [perf: blank]
          R3: Part label | part[0] | setting[0] | dalam[0] | digital[0] | (empty) | [perf: blank]
          R4: Part label | part[1] | setting[1] | dalam[1] | digital[1] | (empty) | [perf: Performance header]
          R5: Part label | part[2] | setting[2] | dalam[2] | digital[2] | (empty) | [perf: Suhu Ruangan content]
          R6: Cooling(rs4) | Type Heater(cs2) | type_heater(cs2) | (empty) | Spesifikasi Heater | [perf: QC Checklist]
          R7: | Jumlah Heater(cs2) | Ampere(cs3) | (empty) | [perf: continued]
          R8: | (empty cs2) | Start | Running | (empty) | (empty) | [perf: continued]
          R9: | jumlah(cs2) | amp_start | amp_run | (empty) | (empty) | [perf: Spesifikasi Heater value]

        NOTE: Performance column uses multiple rowSpan cells to achieve the staggered layout.
        We split C7 into separate cells per row group rather than one giant rowSpan.
      ── */}
      <table className={styles.denseTable} style={{ tableLayout:'fixed' }}>
        <colgroup>
          <col style={{ width:'9%' }}/>
          <col style={{ width:'8%' }}/>
          <col style={{ width:'10%' }}/>
          <col style={{ width:'11%' }}/>
          <col style={{ width:'11%' }}/>
          <col style={{ width:'11%' }}/>
          <col style={{ width:'10%' }}/>
          <col style={{ width:'30%' }}/>
        </colgroup>
        <thead>
          {/* R0: Section headers */}
          <tr className={styles.sectionHeaderRow}>
            <th colSpan={7} style={{ fontSize:'12px', fontWeight:'bold', textAlign:'center', padding:'6px', background:'#4a4a4a', color:'#fff' }}>General Inspection</th>
            <th style={{ fontSize:'12px', fontWeight:'bold', textAlign:'center', padding:'6px', background:'#4a4a4a', color:'#fff' }}>Performance Inspection</th>
          </tr>
          {/* R1: Column headers — single row */}
          <tr style={{ backgroundColor:'#f8fafc', fontSize:'8px' }}>
            <th style={{ textAlign:'center', verticalAlign:'middle' }}>
              Temperature<br/><span style={{ fontWeight:'normal', fontSize:'6px' }}>溫度</span>
            </th>
            <th colSpan={2} style={{ textAlign:'center' }}>Required<br/><span style={{ fontWeight:'normal', fontSize:'6px' }}>需求</span></th>
            <th style={{ textAlign:'center' }}>Setting Temperature</th>
            <th style={{ textAlign:'center' }}>Temperature Dalam</th>
            <th style={{ textAlign:'center' }}>Digital Control Type</th>
            <th style={{ textAlign:'center' }}>Setting<br/><span style={{ fontWeight:'normal', fontSize:'6px' }}>設定</span></th>
            <th style={{ background:'#f8fafc', border:'1px solid #475569' }}></th>
          </tr>
          {/* R2: Sub-header row 2 */}
          <tr style={{ backgroundColor:'#f8fafc', fontSize:'7px' }}>
            <th style={{ textAlign:'center' }}></th>
            <th style={{ textAlign:'center' }}>Part<br/><span style={{ fontWeight:'normal', fontSize:'6px' }}>部分</span></th>
            <th style={{ textAlign:'center' }}></th>
            <th style={{ textAlign:'center' }}>- °C</th>
            <th></th>
            <th></th>
            <th></th>
            <th style={{ border:'1px solid #475569' }}></th>
          </tr>
        </thead>
        <tbody>
          {/* ALL 7 rows share C0 "Cooling System" label (rowSpan=7)
              Part rows 1-3 + Type Heater + Jumlah Heater + Start/Running + Values */}

          {/* R3: Part 1 — C0 Cooling System rowSpan=7, C7 perf rowSpan=7 covers all rows */}
          <tr>
            <td rowSpan={7} className={styles.centerCell} style={{ fontWeight:'bold', fontSize:'7.5px', verticalAlign:'middle' }}>
              <div style={{ writingMode:'vertical-rl', transform:'rotate(180deg)', margin:'0 auto', lineHeight:1.4 }}>
                Cooling<br/>System<br/><span style={{ fontWeight:'normal', fontSize:'6px' }}>冷凍系統</span>
              </div>
            </td>
            <td className={styles.centerCell} style={{ fontSize:'7px', padding:'4px 2px' }}>Part<br/><span style={{ fontSize:'6px', color:'#555' }}>部分</span></td>
            <td style={{ padding:'4px' }}>{ci(rows[0]?.part||'', v=>setRow(0,'part',v), 'Part 1')}</td>
            <td className={styles.centerCell} style={{ padding:'4px' }}>{ci(rows[0]?.setting_temp||'', v=>setRow(0,'setting_temp',v), '°C')}</td>
            <td className={styles.centerCell} style={{ padding:'4px' }}>{ci(rows[0]?.temp_dalam||'', v=>setRow(0,'temp_dalam',v), '°C')}</td>
            <td className={styles.centerCell} style={{ padding:'4px' }}>{ci(rows[0]?.digital_type||'', v=>setRow(0,'digital_type',v), 'Type')}</td>
            <td style={{ padding:'4px', fontSize:'7px', verticalAlign:'top' }}>
              {isEdit
                ? <textarea className={styles.cellInput} style={{ width:'100%', minHeight:'28px', resize:'none', fontSize:'7px' }} value={rows[0]?.setting||''} onChange={e=>setRow(0,'setting',e.target.value)} placeholder="Parameter..."/>
                : <div style={{ fontSize:'7px', whiteSpace:'pre-wrap' }}>{rows[0]?.setting||''}</div>}
            </td>
            {/* Performance panel — rowSpan=7 covers all body rows */}
            <td rowSpan={7} style={{ border:'1px solid #475569', verticalAlign:'top', padding:0 }}>
              <div style={{ background:'#4a4a4a', color:'#fff', fontWeight:'bold', fontSize:'10px', textAlign:'center', padding:'5px 0' }}>Performance Inspection</div>
              <div style={{ padding:'8px 10px', fontSize:'8px' }}>
                {/* Suhu Ruangan */}
                <div style={{ textAlign:'center', fontWeight:'bold', marginBottom:'6px', fontSize:'9px' }}>Suhu Ruangan</div>
                <div style={{ display:'flex', justifyContent:'center', gap:'32px', marginBottom:'3px' }}>
                  <span style={{ fontWeight:'bold', textAlign:'center' }}>Min</span>
                  <span style={{ fontWeight:'bold', textAlign:'center' }}>Max</span>
                </div>
                <div style={{ display:'flex', justifyContent:'center', gap:'32px', marginBottom:'6px' }}>
                  <span style={{ textAlign:'center' }}>{isEdit ? <input type="text" className={styles.cellInput} style={{ width:'40px', textAlign:'center', borderBottom:'1px solid #94a3b8' }} value={p.room_min||''} onChange={e=>setPerf('room_min',e.target.value)} placeholder="°C"/> : (p.room_min||'-')}</span>
                  <span style={{ textAlign:'center' }}>{isEdit ? <input type="text" className={styles.cellInput} style={{ width:'40px', textAlign:'center', borderBottom:'1px solid #94a3b8' }} value={p.room_max||''} onChange={e=>setPerf('room_max',e.target.value)} placeholder="°C"/> : (p.room_max||'-')}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:'4px', marginBottom:'8px' }}>
                  <span>Humidity</span>
                  {isEdit ? <input type="text" className={styles.cellInput} style={{ width:'32px', textAlign:'center', borderBottom:'1px solid #94a3b8' }} value={p.room_hum||''} onChange={e=>setPerf('room_hum',e.target.value)} placeholder="~"/> : <span>{p.room_hum||'~'}</span>}
                  <span>%</span>
                </div>
                {/* QC Checklist */}
                <div style={{ fontWeight:'bold', marginBottom:'4px', fontSize:'7.5px' }}>QC Checklist:</div>
                <div style={{ display:'flex', flexDirection:'column', gap:'5px', marginBottom:'8px' }}>
                  <label style={{ display:'flex', alignItems:'flex-start', gap:'5px', fontSize:'7.5px', cursor:isEdit?'pointer':'default', lineHeight:1.35 }}>
                    <CheckboxDisplay checked={p.qc_1||false} onChange={e=>setPerf('qc_1',e.target.checked)} disabled={!isEdit}/>
                    <span>Suhu yang direquest sudah benar tercapai</span>
                  </label>
                  <label style={{ display:'flex', alignItems:'flex-start', gap:'5px', fontSize:'7.5px', cursor:isEdit?'pointer':'default', lineHeight:1.35 }}>
                    <CheckboxDisplay checked={p.qc_2||false} onChange={e=>setPerf('qc_2',e.target.checked)} disabled={!isEdit}/>
                    <span>{isEdit ? <>Suhu tercapai dalam <input type="text" className={styles.inlineInput} style={{ width:'28px' }} value={p.qc_2_time||''} onChange={e=>setPerf('qc_2_time',e.target.value)} placeholder="…"/> menit</> : `Suhu tercapai dalam ${p.qc_2_time||'………'} menit`}</span>
                  </label>
                  <label style={{ display:'flex', alignItems:'flex-start', gap:'5px', fontSize:'7.5px', cursor:isEdit?'pointer':'default', lineHeight:1.35 }}>
                    <CheckboxDisplay checked={p.qc_3||false} onChange={e=>setPerf('qc_3',e.target.checked)} disabled={!isEdit}/>
                    <span>Suhu maksimal akan balik ke suhu minimal tidak lebih dari jangka waktu 6 menit</span>
                  </label>
                  <label style={{ display:'flex', alignItems:'flex-start', gap:'5px', fontSize:'7.5px', cursor:isEdit?'pointer':'default', lineHeight:1.35 }}>
                    <CheckboxDisplay checked={p.qc_4||false} onChange={e=>setPerf('qc_4',e.target.checked)} disabled={!isEdit}/>
                    <span>Unit telah melewati test tegangan listrik</span>
                  </label>
                </div>
              </div>
            </td>
          </tr>

          {/* R4: Part 2 */}
          <tr>
            <td className={styles.centerCell} style={{ fontSize:'7px', padding:'4px 2px' }}>Part<br/><span style={{ fontSize:'6px', color:'#555' }}>部分</span></td>
            <td style={{ padding:'4px' }}>{ci(rows[1]?.part||'', v=>setRow(1,'part',v), 'Part 2')}</td>
            <td className={styles.centerCell} style={{ padding:'4px' }}>{ci(rows[1]?.setting_temp||'', v=>setRow(1,'setting_temp',v), '°C')}</td>
            <td className={styles.centerCell} style={{ padding:'4px' }}>{ci(rows[1]?.temp_dalam||'', v=>setRow(1,'temp_dalam',v), '°C')}</td>
            <td className={styles.centerCell} style={{ padding:'4px' }}>{ci(rows[1]?.digital_type||'', v=>setRow(1,'digital_type',v), 'Type')}</td>
            <td style={{ padding:'4px' }}></td>
          </tr>

          {/* R5: Part 3 */}
          <tr>
            <td className={styles.centerCell} style={{ fontSize:'7px', padding:'4px 2px' }}>Part<br/><span style={{ fontSize:'6px', color:'#555' }}>部分</span></td>
            <td style={{ padding:'4px' }}>{ci(rows[2]?.part||'', v=>setRow(2,'part',v), 'Part 3')}</td>
            <td className={styles.centerCell} style={{ padding:'4px' }}>{ci(rows[2]?.setting_temp||'', v=>setRow(2,'setting_temp',v), '°C')}</td>
            <td className={styles.centerCell} style={{ padding:'4px' }}>{ci(rows[2]?.temp_dalam||'', v=>setRow(2,'temp_dalam',v), '°C')}</td>
            <td className={styles.centerCell} style={{ padding:'4px' }}>{ci(rows[2]?.digital_type||'', v=>setRow(2,'digital_type',v), 'Type')}</td>
            <td style={{ padding:'4px' }}></td>
          </tr>
          {/* R6: Type Heater */}
          <tr>
            <td colSpan={2} className={styles.centerCell} style={{ fontWeight:'bold', fontSize:'8px', padding:'5px 4px' }}>Type Heater</td>
            <td colSpan={4} style={{ padding:'5px 4px' }}>{ci(gi.type_heater||'', v=>setGI('type_heater',v), 'Type heater...')}</td>
          </tr>

          {/* R7: Jumlah Heater + Ampere header */}
          <tr>
            <td colSpan={2} className={styles.centerCell} style={{ fontWeight:'bold', fontSize:'8px', padding:'6px 4px' }}>Jumlah Heater</td>
            <td colSpan={4} className={styles.centerCell} style={{ fontWeight:'bold', fontSize:'8px', padding:'6px 4px' }}>Ampere</td>
          </tr>

          {/* R8: Start / Running sub-header */}
          <tr>
            <td colSpan={2} style={{ border:'1px solid #475569', padding:'5px 4px' }}></td>
            <td className={styles.centerCell} style={{ fontWeight:'bold', fontSize:'8px', padding:'5px 4px' }}>Start</td>
            <td className={styles.centerCell} style={{ fontWeight:'bold', fontSize:'8px', padding:'5px 4px' }}>Running</td>
            <td colSpan={2} style={{ border:'1px solid #475569', padding:'5px 4px' }}></td>
          </tr>

          {/* R9: Values */}
          <tr>
            <td colSpan={2} className={styles.centerCell} style={{ padding:'8px 4px' }}>{ci(gi.jumlah_heater||'', v=>setGI('jumlah_heater',v), 'Jumlah')}</td>
            <td className={styles.centerCell} style={{ padding:'8px 4px' }}>{isEdit ? <input type="text" className={styles.cellInput} style={{ textAlign:'center' }} value={gi.amp_start||''} onChange={e=>setGI('amp_start',e.target.value)} placeholder="A"/> : <span>{gi.amp_start ? gi.amp_start+' A' : ''}</span>}</td>
            <td className={styles.centerCell} style={{ padding:'8px 4px' }}>{isEdit ? <input type="text" className={styles.cellInput} style={{ textAlign:'center' }} value={gi.amp_run||''} onChange={e=>setGI('amp_run',e.target.value)} placeholder="A"/> : <span>{gi.amp_run ? gi.amp_run+' A' : ''}</span>}</td>
            <td colSpan={2} style={{ border:'1px solid #475569', padding:'8px 4px' }}></td>
          </tr>
        </tbody>
      </table>

      {/* ── SIGNATURE ── */}
      <table className={styles.signatureTable} style={{ marginTop:0 }}>
        <tbody>
          <tr>
            <td style={{ width:'50%', textAlign:'center', verticalAlign:'bottom' }}>
              <span className={styles.signatureTitle}>Technician</span>
              <span className={styles.signatureName}>{isEdit ? <input type="text" className={styles.cellInput} style={{ textAlign:'center' }} value={data.footer?.tech_name||''} onChange={e=>onChange&&isEdit&&onChange('footer',{...data.footer,tech_name:e.target.value})} placeholder="Nama teknisi..."/> : (data.footer?.tech_name||'')}</span>
            </td>
            <td style={{ width:'50%', textAlign:'center', verticalAlign:'bottom' }}>
              <span className={styles.signatureTitle}>Quality Control<br/><span style={{ fontWeight:'normal', fontSize:'6px' }}>品管</span></span>
              <span className={styles.signatureName}>{isEdit ? <input type="text" className={styles.cellInput} style={{ textAlign:'center' }} value={data.footer?.qc_name||''} onChange={e=>onChange&&isEdit&&onChange('footer',{...data.footer,qc_name:e.target.value})} placeholder="Nama QC..."/> : (data.footer?.qc_name||'')}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
