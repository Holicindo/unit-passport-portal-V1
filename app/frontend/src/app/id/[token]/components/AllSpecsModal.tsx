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
    <div 
      className={styles.modalOverlay} 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        padding: '20px',
      }}
    >
      <div
        className={styles.modalContent}
        style={{
          maxWidth: '560px', 
          width: '92%', 
          padding: '28px 24px',
          background: 'rgba(8, 18, 50, 0.98)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '16px', 
          maxHeight: '85vh', 
          overflowY: 'auto', 
          color: '#f1f5f9',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className={styles.modalHeader} 
          style={{ 
            marginBottom: '20px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            background: 'rgba(8, 18, 50, 0.95)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '12px',
            padding: '12px 16px',
            boxShadow: 'inset -2px -2px 6px rgba(255,255,255,0.04), inset 3px 3px 8px rgba(0,0,0,0.6)',
          }}
        >
          <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#f1f5f9' }}>Semua Spesifikasi Unit</h2>
          <button 
            className={styles.closeBtn} 
            onClick={onClose} 
            style={{ 
              color: '#94a3b8', 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid rgba(255,255,255,0.1)',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '1.5rem',
              lineHeight: 1,
            }}
          >×</button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
          <tbody>
            {specRows.map(({ label, value }, idx) => (
              <tr 
                key={label} 
                style={{ 
                  borderBottom: '1px solid rgba(255,255,255,0.08)', 
                  background: idx % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent' 
                }}
              >
                <td style={{ padding: '12px 14px', color: '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap', width: '40%' }}>{label}</td>
                <td style={{ padding: '12px 14px', color: '#f1f5f9', wordBreak: 'break-word', fontWeight: 500 }}>{value || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <button onClick={onClose} style={{
          marginTop: '20px', 
          width: '100%', 
          padding: '12px 16px',
          background: 'rgba(46, 91, 255, 0.15)',
          color: '#60a5fa',
          border: '1px solid rgba(46, 91, 255, 0.3)',
          borderRadius: '10px', 
          fontSize: '0.88rem', 
          fontWeight: 700, 
          cursor: 'pointer', 
          fontFamily: 'inherit',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(46, 91, 255, 0.25)';
          e.currentTarget.style.borderColor = 'rgba(46, 91, 255, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(46, 91, 255, 0.15)';
          e.currentTarget.style.borderColor = 'rgba(46, 91, 255, 0.3)';
        }}
        >
          Tutup
        </button>
      </div>
    </div>
  );
}
