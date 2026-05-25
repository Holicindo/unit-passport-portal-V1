import styles from './template.module.css';
import iStyles from './IssueAnalysisTemplate.module.css';

const BAGIAN_OPTIONS = ['KACA', 'BODY & FITTING', 'LISTRIK', 'PENDINGIN', 'DRAFTER'];

export default function IssueAnalysisTemplate({ mode = 'view', data = {}, unit = {}, onChange }: any) {
  const isEdit = mode === 'edit';
  const h = data.header || {};
  const bagian: string[] = data.bagian || [];
  const bagianNotes = data.bagian_notes || '';
  const mainRow = data.main_row || {};
  const bottomRow = data.bottom_row || {};
  const footer = data.footer || {};

  const setH = (k: string, v: string) => {
    if (onChange && isEdit) onChange('header', { ...h, [k]: v });
  };

  const toggleBagian = (val: string) => {
    if (!onChange || !isEdit) return;
    const updated = bagian.includes(val)
      ? bagian.filter((b) => b !== val)
      : [...bagian, val];
    onChange('bagian', updated);
  };

  const setMain = (k: string, v: string) => {
    if (onChange && isEdit) onChange('main_row', { ...mainRow, [k]: v });
  };

  const setBottom = (k: string, v: string) => {
    if (onChange && isEdit) onChange('bottom_row', { ...bottomRow, [k]: v });
  };

  const setFooter = (k: string, v: string) => {
    if (onChange && isEdit) onChange('footer', { ...footer, [k]: v });
  };

  function CheckBox({ checked, onToggle }: { checked: boolean; onToggle?: () => void }) {
    if (isEdit && onToggle) {
      return (
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          style={{
            accentColor: '#2e5bff',
            width: '11px',
            height: '11px',
            cursor: 'pointer',
            printColorAdjust: 'exact',
            WebkitPrintColorAdjust: 'exact',
          } as React.CSSProperties}
        />
      );
    }
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '11px',
          height: '11px',
          minWidth: '11px',
          border: checked ? '1.5px solid #2e5bff' : '1.5px solid #000',
          borderRadius: '2px',
          background: checked ? '#2e5bff' : '#fff',
          flexShrink: 0,
          printColorAdjust: 'exact',
          WebkitPrintColorAdjust: 'exact',
        } as React.CSSProperties}
      >
        {checked && (
          <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
            <path d="M1 3.5L3 5.5L6 1.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
    );
  }

  const FS = '9.5px';

  function CellInput({ value, onChange: onCh, placeholder, type = 'text', multiline, style }: any) {
    if (!isEdit) {
      return (
        <span style={{ fontSize: FS, whiteSpace: 'pre-wrap', ...style }}>
          {value || ''}
        </span>
      );
    }
    if (multiline) {
      return (
        <textarea
          className={styles.cellInput}
          value={value || ''}
          onChange={(e) => onCh && onCh(e.target.value)}
          placeholder={placeholder}
          style={{ fontSize: FS, width: '100%', minHeight: '60px', resize: 'vertical', fontFamily: 'inherit', ...style }}
        />
      );
    }
    return (
      <input
        type={type}
        className={styles.cellInput}
        value={value || ''}
        onChange={(e) => onCh && onCh(e.target.value)}
        placeholder={placeholder}
        style={{ fontSize: FS, ...style }}
      />
    );
  }

  return (
    <div className={`${styles.a4Sheet} ${iStyles.issueSheet}`}>

      {/* ── TITLE ── */}
      <div className={iStyles.docTitle}>FORM INSPEKSI &amp; ANALISIS MASALAH</div>

      {/* ── HEADER INFO — wrapper relative so nomor_form can be absolute top-right ── */}
      <div style={{ position: 'relative' }}>
        {/* Nomor Form — absolute top-right */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          fontSize: '10px',
          fontWeight: 'bold',
          textAlign: 'right',
          lineHeight: 1.2,
          whiteSpace: 'nowrap',
        }}>
          {isEdit ? (
            <input
              className={styles.cellInput}
              value={h.nomor_form || ''}
              onChange={(e) => setH('nomor_form', e.target.value)}
              placeholder="#QC0000000"
              style={{ fontSize: '10px', fontWeight: 'bold', textAlign: 'right', width: '110px' }}
            />
          ) : (
            h.nomor_form || ''
          )}
        </div>

        <table className={iStyles.headerTable}>
          <tbody>
            <tr>
              <td className={iStyles.headerLabel}>Nama Unit</td>
              <td className={iStyles.headerValue}>
                <CellInput value={h.nama_unit || unit?.model_name || ''} onChange={(v: string) => setH('nama_unit', v)} placeholder="Nama unit" />
              </td>
              <td style={{ width: '8px' }}></td>
              <td className={iStyles.headerLabel}>Tanggal Produksi</td>
              <td className={iStyles.headerValue} style={{ paddingRight: '120px' }}>
                <CellInput type={isEdit ? 'date' : 'text'} value={h.tanggal_produksi || ''} onChange={(v: string) => setH('tanggal_produksi', v)} />
              </td>
            </tr>
            <tr>
              <td className={iStyles.headerLabel}>Nomor Produksi</td>
              <td className={iStyles.headerValue}>
                <CellInput value={h.nomor_produksi || ''} onChange={(v: string) => setH('nomor_produksi', v)} placeholder="Nomor produksi" />
              </td>
              <td></td>
              <td className={iStyles.headerLabel}>Tanggal Inspeksi</td>
              <td className={iStyles.headerValue}>
                <CellInput type={isEdit ? 'date' : 'text'} value={h.tanggal_inspeksi || ''} onChange={(v: string) => setH('tanggal_inspeksi', v)} />
              </td>
            </tr>
            <tr>
              <td className={iStyles.headerLabel}>Nama Customer</td>
              <td className={iStyles.headerValue}>
                <CellInput value={h.nama_customer || ''} onChange={(v: string) => setH('nama_customer', v)} placeholder="Nama customer" />
              </td>
              <td></td>
              <td className={iStyles.headerLabel}>Pemeriksa</td>
              <td className={iStyles.headerValue}>
                <CellInput value={h.pemeriksa || ''} onChange={(v: string) => setH('pemeriksa', v)} placeholder="Nama pemeriksa" />
              </td>
            </tr>
            <tr>
              <td className={iStyles.headerLabel}>Serial Number</td>
              <td className={iStyles.headerValue}>
                <CellInput value={h.serial_number || unit?.serial_number || ''} onChange={(v: string) => setH('serial_number', v)} placeholder="Serial number" />
              </td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── MAIN ANALYSIS TABLE ── */}
      <table className={iStyles.mainTable}>
        <thead>
          <tr>
            <th className={iStyles.bagianCell}>Bagian Bermasalah</th>
            <th style={{ width: '100px' }}>Deskripsi Masalah</th>
            <th>Analisis Penyebab Masalah</th>
            <th style={{ width: '95px' }}>Tindakan Perbaikan</th>
            <th>Tindakan Pencegahan</th>
            <th style={{ width: '60px' }}>Pembuat</th>
            <th className={iStyles.pjHeader}>Penanggung Jawab</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            {/* Bagian Bermasalah */}
            <td className={iStyles.bagianCell}>
              <div className={iStyles.checkboxList}>
                {BAGIAN_OPTIONS.map((opt) => (
                  <div key={opt} className={iStyles.checkboxRow}>
                    <CheckBox checked={bagian.includes(opt)} onToggle={() => toggleBagian(opt)} />
                    <span style={{ fontSize: FS }}>{opt}</span>
                  </div>
                ))}
              </div>
              {isEdit ? (
                <textarea
                  className={styles.cellInput}
                  value={bagianNotes}
                  onChange={(e) => onChange && onChange('bagian_notes', e.target.value)}
                  placeholder="Keterangan bagian..."
                  style={{ fontSize: FS, width: '100%', minHeight: '36px', resize: 'vertical', fontFamily: 'inherit', marginTop: '4px' }}
                />
              ) : (
                <div style={{ fontSize: FS, marginTop: '4px', minHeight: '36px', whiteSpace: 'pre-wrap' }}>
                  {bagianNotes}
                </div>
              )}
            </td>

            <td style={{ verticalAlign: 'top' }}>
              <CellInput value={mainRow.deskripsi} onChange={(v: string) => setMain('deskripsi', v)} placeholder="Deskripsi masalah..." multiline />
            </td>
            <td style={{ verticalAlign: 'top' }}>
              <CellInput value={mainRow.analisis} onChange={(v: string) => setMain('analisis', v)} placeholder="Analisis penyebab masalah..." multiline />
            </td>
            <td style={{ verticalAlign: 'top' }}>
              <CellInput value={mainRow.tindakan_perbaikan} onChange={(v: string) => setMain('tindakan_perbaikan', v)} placeholder="Tindakan perbaikan..." multiline />
            </td>
            <td style={{ verticalAlign: 'top' }}>
              <CellInput value={mainRow.tindakan_pencegahan} onChange={(v: string) => setMain('tindakan_pencegahan', v)} placeholder="Tindakan pencegahan..." multiline />
            </td>
            <td style={{ verticalAlign: 'top', textAlign: 'center' }}>
              <CellInput value={mainRow.pembuat} onChange={(v: string) => setMain('pembuat', v)} placeholder="Nama" style={{ textAlign: 'center' }} />
            </td>

            {/* Penanggung Jawab — split vertically */}
            <td style={{ padding: 0, verticalAlign: 'top' }}>
              <div style={{ borderBottom: '1px solid #000', minHeight: '55px', padding: '4px 5px' }}>
                <CellInput value={mainRow.pj_top} onChange={(v: string) => setMain('pj_top', v)} placeholder="PJ 1" style={{ textAlign: 'center' }} />
              </div>
              <div style={{ minHeight: '55px', padding: '4px 5px' }}>
                <CellInput value={mainRow.pj_bottom} onChange={(v: string) => setMain('pj_bottom', v)} placeholder="PJ 2" style={{ textAlign: 'center' }} />
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── BOTTOM INFO TABLE ── */}
      <table className={iStyles.bottomTable}>
        <thead>
          <tr>
            <th style={{ width: '115px' }}>Bahan yang Digunakan</th>
            <th style={{ width: '95px' }}>Durasi Perbaikan</th>
            <th>Jumlah Pekerja</th>
            <th style={{ width: '95px' }}>Lokasi Ditemukan</th>
            <th>Tahap Perbaikan</th>
            <th style={{ width: '95px' }}>Catatan</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ height: '65px' }}>
            <td style={{ verticalAlign: 'top' }}>
              <CellInput value={bottomRow.bahan} onChange={(v: string) => setBottom('bahan', v)} placeholder="Bahan..." multiline />
            </td>
            <td style={{ verticalAlign: 'top' }}>
              <CellInput value={bottomRow.durasi} onChange={(v: string) => setBottom('durasi', v)} placeholder="Durasi..." multiline />
            </td>
            <td style={{ verticalAlign: 'top' }}>
              <CellInput value={bottomRow.jumlah_pekerja} onChange={(v: string) => setBottom('jumlah_pekerja', v)} placeholder="Jumlah pekerja..." multiline />
            </td>
            <td style={{ verticalAlign: 'top' }}>
              <CellInput value={bottomRow.lokasi} onChange={(v: string) => setBottom('lokasi', v)} placeholder="Lokasi..." multiline />
            </td>
            <td style={{ verticalAlign: 'top' }}>
              <CellInput value={bottomRow.tahap_perbaikan} onChange={(v: string) => setBottom('tahap_perbaikan', v)} placeholder="Tahap perbaikan..." multiline />
            </td>
            <td style={{ verticalAlign: 'top' }}>
              <CellInput value={bottomRow.catatan} onChange={(v: string) => setBottom('catatan', v)} placeholder="Catatan..." multiline />
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── SIGNATURE ROW ── */}
      <div className={iStyles.signRow}>
        <div className={iStyles.signBlock}>
          <div className={iStyles.signTitle}>Mengetahui</div>
          <div className={iStyles.signName}>
            {isEdit ? (
              <input type="text" className={styles.cellInput} value={footer.mengetahui || ''} onChange={(e) => setFooter('mengetahui', e.target.value)} placeholder="Nama" style={{ fontSize: FS, textAlign: 'center' }} />
            ) : (
              `(${footer.mengetahui || 'MR. ANDERSON'})`
            )}
          </div>
        </div>
        <div className={iStyles.signBlock}>
          <div className={iStyles.signTitle}>Disetujui</div>
          <div className={iStyles.signName}>
            {isEdit ? (
              <input type="text" className={styles.cellInput} value={footer.disetujui || ''} onChange={(e) => setFooter('disetujui', e.target.value)} placeholder="Nama" style={{ fontSize: FS, textAlign: 'center' }} />
            ) : (
              `(${footer.disetujui || ''})`
            )}
          </div>
        </div>
        <div className={iStyles.signBlock}>
          <div className={iStyles.signTitle}>Dibuat</div>
          <div className={iStyles.signName}>
            {isEdit ? (
              <input type="text" className={styles.cellInput} value={footer.dibuat || ''} onChange={(e) => setFooter('dibuat', e.target.value)} placeholder="Nama" style={{ fontSize: FS, textAlign: 'center' }} />
            ) : (
              `(${footer.dibuat || 'RISTANTI'})`
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
