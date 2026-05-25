import React from 'react';
import styles from './template.module.css';
import qcStyles from './QcServiceTemplate.module.css';

const DEFAULT_ITEMS = [
  'Ukuran sesuai standar',
  'Tidak ada baret',
  'Tidak ada cacat visual',
  'Kondisi bersih & baik',
];

export default function QcServiceTemplate({ data = {}, unit = {}, onChange }: any) {
  const h = data.header || {};
  const checklist: boolean[] = data.checklist || Array(DEFAULT_ITEMS.length).fill(false);
  const qc = data.qc || { qc1: '', qc2: '', qc3: '' };
  const tanggal = data.tanggal || '';

  return (
    <div className={`${styles.a4Sheet} ${qcStyles.qcSheet}`}>
      <div className={qcStyles.outerBox}>

        {/* ── TITLE ── */}
        <div className={qcStyles.titleRow}>
          CHECKLIST QUALITY CONTROL – KACA SERVICE
        </div>

        {/* ── CHECKLIST ITEMS ── */}
        <div className={qcStyles.checklistSection}>
          {DEFAULT_ITEMS.map((label, i) => (
            <div key={i} className={qcStyles.checkRow}>
              <span 
                className={qcStyles.checkBox}
                style={checklist[i] ? {
                  background: '#2e5bff',
                  borderColor: '#2e5bff',
                  printColorAdjust: 'exact',
                  WebkitPrintColorAdjust: 'exact',
                } : {}}
              >
                {checklist[i] && (
                  <svg width="11" height="11" viewBox="0 0 9 9" fill="none">
                    <path d="M1.5 4.5L3.5 6.5L7.5 2" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className={qcStyles.checkLabel}>{label}</span>
            </div>
          ))}
        </div>

        {/* ── DIPERIKSA OLEH ── */}
        <div className={qcStyles.signSection}>
          <div className={qcStyles.signHeader}>Diperiksa oleh:</div>

          <div className={qcStyles.signRow}>
            <span className={qcStyles.signLabel}>QC 1 :</span>
            <span className={qcStyles.signLine}>{qc.qc1 || ''}</span>
            <span className={qcStyles.signTtd}>(TTD)</span>
          </div>

          <div className={qcStyles.signRow}>
            <span className={qcStyles.signLabel}>QC 2 :</span>
            <span className={qcStyles.signLine}>{qc.qc2 || ''}</span>
            <span className={qcStyles.signTtd}>(TTD)</span>
          </div>

          <div className={qcStyles.signRow}>
            <span className={qcStyles.signLabel}>QC 3 :</span>
            <span className={qcStyles.signLine}>{qc.qc3 || ''}</span>
            <span className={qcStyles.signTtd}>(TTD)</span>
          </div>

          <div className={qcStyles.tanggalRow}>
            <span className={qcStyles.signLabel}>Tanggal:</span>
            <span className={qcStyles.tanggalLine}>{tanggal || ''}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
