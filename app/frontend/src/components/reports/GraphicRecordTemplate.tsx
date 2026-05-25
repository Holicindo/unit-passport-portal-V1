import React from 'react';
import styles from './template.module.css';
import grStyles from './GraphicRecordTemplate.module.css';

export default function GraphicRecordTemplate({ data = {}, unit = {}, onChange }: any) {
  const h = data.header || {};
  const images = data.images || {};

  const getUrl = (slot: string): string | undefined => {
    const entry = images[slot];
    if (!entry) return undefined;
    if (typeof entry === 'string') return entry;
    return entry.url;
  };

  const ImgCell = ({ slot, label, chinese }: { slot: string; label: string; chinese: string }) => (
    <div className={grStyles.imgCellWrap}>
      <div className={grStyles.imgArea}>
        {getUrl(slot)
          ? <img src={getUrl(slot)} alt={label} className={grStyles.img} />
          : <div className={grStyles.imgEmpty} />}
      </div>
      <div className={grStyles.imgLabel}>
        <span className={grStyles.labelMain}>{label}</span>
        <span className={grStyles.labelChinese}>{chinese}</span>
      </div>
    </div>
  );

  return (
    <div className={`${styles.a4Sheet} ${grStyles.grSheet}`}>
      <table className={grStyles.masterTable}>
        <tbody>

          {/* ── HEADER ROW ── */}
          <tr>
            <td className={grStyles.tdLogo} rowSpan={3}>
              <span className={grStyles.logoText}>HOLIC</span>
            </td>
            <td className={grStyles.tdTitle} rowSpan={3} colSpan={3}>
              <div className={grStyles.titleSub}>Post-Production</div>
              <div className={grStyles.titleMain}>Graphic Record</div>
            </td>
            <td className={grStyles.tdMetaLabel}>
              <div>Serial Number</div>
              <div className={grStyles.metaChinese}>產品編號</div>
            </td>
            <td className={grStyles.tdMetaValue}>
              : A- {unit?.serial_number || '-'}
            </td>
          </tr>
          <tr>
            <td className={grStyles.tdMetaLabel}>
              <div>Order Document</div>
              <div className={grStyles.metaChinese}>訂單憑證</div>
            </td>
            <td className={grStyles.tdMetaValue}>
              : ITR- {h.order_document || '-'}
            </td>
          </tr>
          <tr>
            <td className={grStyles.tdMetaLabel} style={{ borderBottom: 'none' }}>
              <div>Production Code</div>
              <div className={grStyles.metaChinese}>製造代碼</div>
            </td>
            <td className={grStyles.tdMetaValue} style={{ borderBottom: 'none' }}>
              : PRO- {h.production_code || '-'}
            </td>
          </tr>

          {/* ── ROW 1: FRONT (40%) + TOP (60%) ── */}
          <tr>
            <td className={grStyles.tdImg} colSpan={2} style={{ width: '40%' }}>
              <ImgCell slot="front" label="FRONT" chinese="正面" />
            </td>
            <td className={grStyles.tdImgTop} colSpan={4} style={{ width: '60%', position: 'relative' }}>
              <div className={grStyles.imgArea} style={{ minHeight: '110mm' }}>
                {getUrl('top')
                  ? <img src={getUrl('top')} alt="TOP" className={grStyles.img} />
                  : <div className={grStyles.imgEmpty} />}
              </div>
              {/* TOP label vertical on right */}
              <div className={grStyles.topLabel}>
                <span className={grStyles.labelMain}>TOP</span>
                <span className={grStyles.labelChinese}>上面</span>
              </div>
            </td>
          </tr>

          {/* ── ROW 2: BACK + LEFT + RIGHT ── */}
          <tr>
            <td className={grStyles.tdImg} colSpan={2} style={{ width: '33.33%' }}>
              <ImgCell slot="back" label="BACK" chinese="後面" />
            </td>
            <td className={grStyles.tdImg} colSpan={2} style={{ width: '33.33%' }}>
              <ImgCell slot="left" label="LEFT" chinese="左面" />
            </td>
            <td className={grStyles.tdImg} colSpan={2} style={{ width: '33.33%' }}>
              <ImgCell slot="right" label="RIGHT" chinese="右面" />
            </td>
          </tr>

          {/* ── SIGNATURES ── */}
          <tr>
            <td className={grStyles.tdSign} colSpan={3}>
              <div className={grStyles.signTitle}>Factory Manager</div>
              <div className={grStyles.signChinese}>廠長</div>
              <div className={grStyles.signSpace} />
              <div className={grStyles.signName}>
                {h.factory_manager ? `(${h.factory_manager})` : ''}
              </div>
            </td>
            <td className={grStyles.tdSign} colSpan={3}>
              <div className={grStyles.signTitle}>Quality Control</div>
              <div className={grStyles.signChinese}>品管</div>
              <div className={grStyles.signSpace} />
              <div className={grStyles.signName}>
                {h.quality_control ? `(${h.quality_control})` : ''}
              </div>
            </td>
          </tr>

        </tbody>
      </table>
    </div>
  );
}
