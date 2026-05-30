import React from 'react';
import styles from './template.module.css';
import rStyles from './ReworkReportTemplate.module.css';
import { CustomSelect } from '@/components/ui/CustomSelect';

export default function ReworkReportTemplate({ mode = 'view', data = {}, unit = {}, onChange }: any) {
  const isEdit = mode === 'edit';
  const h = data.header || {};
  const rows: any[] = data.rework_items || Array(6).fill(null).map(() => ({}));
  const penyebab = data.penyebab || {};
  const verifikasi = data.verifikasi || {};
  const catatan = data.catatan || '';
  const footer = data.footer || {};

  const setH = (k: string, v: string) => {
    if (onChange && isEdit) onChange('header', { ...h, [k]: v });
  };
  const setRow = (i: number, k: string, v: string) => {
    if (!onChange || !isEdit) return;
    const updated = rows.map((r, idx) => (idx === i ? { ...r, [k]: v } : r));
    onChange('rework_items', updated);
  };
  const setPenyebab = (k: string, v: any) => {
    if (onChange && isEdit) onChange('penyebab', { ...penyebab, [k]: v });
  };
  const setVerifikasi = (k: string, v: any) => {
    if (onChange && isEdit) onChange('verifikasi', { ...verifikasi, [k]: v });
  };

  function CheckBox({ checked, onChange: onCb, disabled }: { checked: boolean; onChange?: (v: boolean) => void; disabled?: boolean }) {
    if (!disabled && onCb) {
      return (
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onCb(e.target.checked)}
          style={{
            accentColor: '#2e5bff',
            width: '11px', height: '11px',
            cursor: 'pointer',
            printColorAdjust: 'exact',
            WebkitPrintColorAdjust: 'exact',
          } as React.CSSProperties}
        />
      );
    }
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: '11px', height: '11px', minWidth: '11px',
        border: checked ? '1.5px solid #2e5bff' : '1.5px solid #000',
        borderRadius: '2px',
        background: checked ? '#2e5bff' : '#fff',
        flexShrink: 0,
        printColorAdjust: 'exact',
        WebkitPrintColorAdjust: 'exact',
      } as React.CSSProperties}>
        {checked && (
          <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
            <path d="M1 3.5L3 5.5L6 1.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
    );
  }

  function CellInput({ value, onChange: onCh, placeholder, type = 'text', style }: any) {
    if (!isEdit) return <span style={{ fontSize: '8px', ...style }}>{value || ''}</span>;
    return (
      <input
        type={type}
        className={styles.cellInput}
        value={value || ''}
        onChange={(e) => onCh && onCh(e.target.value)}
        placeholder={placeholder}
        style={{ fontSize: '8px', ...style }}
      />
    );
  }

  return (
    <div className={`${styles.a4Sheet} ${rStyles.reworkSheet}`}>

      {/* ── TITLE ── */}
      <div className={rStyles.docTitle}>FORM PENGECEKAN REWORK</div>

      {/* ── HEADER INFO ── */}
      <table className={rStyles.headerTable}>
        <tbody>
          <tr>
            <td className={rStyles.headerLabel}>Nama Unit</td>
            <td className={rStyles.headerValue}>
              : <CellInput value={h.nama_unit || unit?.model_name || ''} onChange={(v: string) => setH('nama_unit', v)} placeholder="Nama unit" />
            </td>
            <td className={rStyles.headerLabel}>Serial Number</td>
            <td className={rStyles.headerValue}>
              : <CellInput value={h.serial_number || unit?.serial_number || ''} onChange={(v: string) => setH('serial_number', v)} placeholder="Serial number" />
            </td>
          </tr>
          <tr>
            <td className={rStyles.headerLabel}>Nama Customer</td>
            <td className={rStyles.headerValue}>
              : <CellInput value={h.nama_customer || ''} onChange={(v: string) => setH('nama_customer', v)} placeholder="Nama customer" />
            </td>
            <td className={rStyles.headerLabel}>ITR</td>
            <td className={rStyles.headerValue}>
              : <CellInput value={h.itr || ''} onChange={(v: string) => setH('itr', v)} placeholder="Nomor ITR" />
            </td>
          </tr>
          <tr>
            <td className={rStyles.headerLabel}>Nomor Produksi</td>
            <td className={rStyles.headerValue}>
              : <CellInput value={h.nomor_produksi || ''} onChange={(v: string) => setH('nomor_produksi', v)} placeholder="Nomor produksi" />
            </td>
            <td className={rStyles.headerLabel}>Tanggal Ditemukan Masalah</td>
            <td className={rStyles.headerValue}>
              : <CellInput type="date" value={h.tanggal_masalah || ''} onChange={(v: string) => setH('tanggal_masalah', v)} />
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── SECTION 1: TABEL REWORK ── */}
      <div className={rStyles.sectionLabel}>1. Informasi Pekerjaan Rework</div>
      <table className={rStyles.reworkTable}>
        <thead>
          <tr>
            <th style={{ width: '28px' }}>NO</th>
            <th>Komponen</th>
            <th>Deskripsi Kerusakan / Cacat</th>
            <th>Tindakan Rework</th>
            <th>Yang Memperbaiki</th>
            <th style={{ width: '60px' }}>Status (OK/NG)</th>
            <th style={{ width: '72px' }}>Tanggal Selesai</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ height: '22px' }}>
              <td style={{ textAlign: 'center', fontSize: '8px' }}>{i + 1}</td>
              <td><CellInput value={row.komponen} onChange={(v: string) => setRow(i, 'komponen', v)} /></td>
              <td><CellInput value={row.deskripsi} onChange={(v: string) => setRow(i, 'deskripsi', v)} /></td>
              <td><CellInput value={row.tindakan} onChange={(v: string) => setRow(i, 'tindakan', v)} /></td>
              <td><CellInput value={row.yang_memperbaiki} onChange={(v: string) => setRow(i, 'yang_memperbaiki', v)} /></td>
              <td style={{ textAlign: 'center' }}>
                {isEdit ? (
                  <CustomSelect
                    className={styles.cellSelect}
                    value={row.status || ''}
                    onChange={(val) => setRow(i, 'status', val)}
                    options={[
                      { value: '', label: '' },
                      { value: 'OK', label: 'OK' },
                      { value: 'NG', label: 'NG' }
                    ]}
                  />
                ) : (
                  <span style={{ fontSize: '8px', fontWeight: 'bold', color: row.status === 'OK' ? '#16a34a' : row.status === 'NG' ? '#dc2626' : '#000' }}>
                    {row.status || ''}
                  </span>
                )}
              </td>
              <td><CellInput type={isEdit ? 'date' : 'text'} value={row.tanggal_selesai} onChange={(v: string) => setRow(i, 'tanggal_selesai', v)} /></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── SECTION 2: PENYEBAB REWORK ── */}
      <div className={rStyles.sectionLabel}>2. Penyebab Rework (Centang yang Sesuai)</div>
      <div className={rStyles.checkSection}>
        <div className={rStyles.checkItem}>
          <CheckBox checked={penyebab.human_error || false} onChange={(v) => setPenyebab('human_error', v)} disabled={!isEdit} />
          <span className={rStyles.checkLabel}>Human Error</span>
        </div>
        <div className={rStyles.checkItem}>
          <CheckBox checked={penyebab.material_defect || false} onChange={(v) => setPenyebab('material_defect', v)} disabled={!isEdit} />
          <span className={rStyles.checkLabel}>Material Defect</span>
        </div>
        <div className={rStyles.checkItem}>
          <CheckBox checked={penyebab.proses_tidak_sesuai || false} onChange={(v) => setPenyebab('proses_tidak_sesuai', v)} disabled={!isEdit} />
          <span className={rStyles.checkLabel}>Proses Tidak Sesuai</span>
        </div>
        <div className={rStyles.checkItem}>
          <CheckBox checked={penyebab.desain_spesifikasi || false} onChange={(v) => setPenyebab('desain_spesifikasi', v)} disabled={!isEdit} />
          <span className={rStyles.checkLabel}>Desain / Spesifikasi</span>
        </div>
        <div className={rStyles.checkItem}>
          <CheckBox checked={penyebab.lainnya || false} onChange={(v) => setPenyebab('lainnya', v)} disabled={!isEdit} />
          <span className={rStyles.checkLabel}>
            Lainnya
            {penyebab.lainnya && (
              <span style={{ borderBottom: '1px dotted #000', marginLeft: '4px', minWidth: '80px', display: 'inline-block' }}>
                {isEdit ? (
                  <input
                    type="text"
                    className={styles.cellInput}
                    value={penyebab.lainnya_text || ''}
                    onChange={(e) => setPenyebab('lainnya_text', e.target.value)}
                    style={{ fontSize: '8px', width: '100px' }}
                    placeholder="..."
                  />
                ) : (
                  penyebab.lainnya_text || '...............'
                )}
              </span>
            )}
            {!penyebab.lainnya && <span style={{ borderBottom: '1px dotted #000', marginLeft: '4px', minWidth: '80px', display: 'inline-block' }}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>}
          </span>
        </div>
      </div>

      {/* ── SECTION 3: HASIL VERIFIKASI ── */}
      <div className={rStyles.sectionLabel}>3. Hasil Verifikasi Setelah Rework</div>
      <div className={rStyles.checkSection}>
        <div className={rStyles.checkItem}>
          <CheckBox checked={verifikasi.sesuai_spesifikasi || false} onChange={(v) => setVerifikasi('sesuai_spesifikasi', v)} disabled={!isEdit} />
          <span className={rStyles.checkLabel}>Sesuai Spesifikasi</span>
        </div>
        <div className={rStyles.checkItem}>
          <CheckBox checked={verifikasi.tidak_sesuai || false} onChange={(v) => setVerifikasi('tidak_sesuai', v)} disabled={!isEdit} />
          <span className={rStyles.checkLabel}>Tidak Sesuai — Perlu Rework Ulang</span>
        </div>
        <div className={rStyles.checkItem}>
          <CheckBox checked={verifikasi.ditolak || false} onChange={(v) => setVerifikasi('ditolak', v)} disabled={!isEdit} />
          <span className={rStyles.checkLabel}>Ditolak</span>
        </div>
      </div>

      {/* ── CATATAN TAMBAHAN ── */}
      <div className={rStyles.notesBox}>
        <div className={rStyles.notesLabel}>Catatan Tambahan</div>
        {isEdit ? (
          <textarea
            className={styles.cellInput}
            style={{ width: '100%', minHeight: '50px', resize: 'vertical', fontSize: '8px', fontFamily: 'inherit' }}
            value={catatan}
            onChange={(e) => onChange && onChange('catatan', e.target.value)}
            placeholder="Catatan tambahan..."
          />
        ) : (
          <div style={{ minHeight: '50px', fontSize: '8px', whiteSpace: 'pre-wrap', padding: '2px 4px' }}>
            {catatan || ''}
          </div>
        )}
      </div>

      {/* ── TANDA TANGAN ── */}
      <table className={rStyles.signTable}>
        <tbody>
          <tr>
            <td className={rStyles.signCell}>
              <div className={rStyles.signTitle}>Pemeriksa QC</div>
              <div className={rStyles.signSpace}></div>
              <div className={rStyles.signName}>
                {isEdit ? (
                  <input
                    type="text"
                    className={styles.cellInput}
                    value={footer.pemeriksa_qc || ''}
                    onChange={(e) => onChange && onChange('footer', { ...footer, pemeriksa_qc: e.target.value })}
                    placeholder="Nama pemeriksa QC"
                    style={{ fontSize: '8px', textAlign: 'center' }}
                  />
                ) : (
                  `(${footer.pemeriksa_qc || 'Riastanti'})`
                )}
              </div>
            </td>
            <td className={rStyles.signCell}>
              <div className={rStyles.signTitle}>Mengetahui</div>
              <div className={rStyles.signSpace}></div>
              <div className={rStyles.signName}>
                {isEdit ? (
                  <input
                    type="text"
                    className={styles.cellInput}
                    value={footer.mengetahui || ''}
                    onChange={(e) => onChange && onChange('footer', { ...footer, mengetahui: e.target.value })}
                    placeholder="Nama yang mengetahui"
                    style={{ fontSize: '8px', textAlign: 'center' }}
                  />
                ) : (
                  `(${footer.mengetahui || 'Pak Adytia'})`
                )}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

    </div>
  );
}
