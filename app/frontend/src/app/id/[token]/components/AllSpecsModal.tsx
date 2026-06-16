'use client';

import styles from '../id.module.css';

interface AllSpecsModalProps {
  show: boolean;
  onClose: () => void;
  unit: any;
}

export default function AllSpecsModal({ show, onClose, unit }: AllSpecsModalProps) {
  if (!show || !unit) return null;

  const specRows = [
    { label: 'Model', value: unit.model_name },
    { label: 'Serial Number', value: unit.serial_number },
    { label: 'Garansi Berakhir', value: unit.warranty_expiry ? new Date(unit.warranty_expiry).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
    { label: 'Production Date', value: (unit.specs?.production_date || unit.specs?.finish_date) ? new Date(unit.specs.production_date || unit.specs.finish_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
    ...(unit.specs
      ? Object.entries(unit.specs as Record<string, unknown>)
          .filter(([k, v]) => v !== null && v !== undefined && v !== '' && typeof v !== 'object' && !['pro_number', 'qm_number', 'manufacture_sn', 'production_date', 'finish_date', 'delivery_date'].includes(k))
          .map(([k, v]) => ({
            label: k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            value: String(v),
          }))
      : []),
  ];

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalContent}
        style={{
          maxWidth: '560px', width: '92%', padding: '28px 24px',
          background: '#ffffff', border: '1px solid #e2e8f0',
          borderRadius: '16px', maxHeight: '85vh', overflowY: 'auto', color: '#0f172a',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader} style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>Semua Spesifikasi Unit</h2>
          <button className={styles.closeBtn} onClick={onClose} style={{ color: '#64748b' }}>×</button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
          <tbody>
            {specRows.map(({ label, value }, idx) => (
              <tr key={label} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#f8fafc' : '#ffffff' }}>
                <td style={{ padding: '10px 12px', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap', width: '40%' }}>{label}</td>
                <td style={{ padding: '10px 12px', color: '#0f172a', wordBreak: 'break-word' }}>{value || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <button onClick={onClose} style={{
          marginTop: '20px', width: '100%', padding: '10px 16px',
          background: '#2563eb', color: '#ffffff', border: 'none',
          borderRadius: '8px', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          Tutup
        </button>
      </div>
    </div>
  );
}
