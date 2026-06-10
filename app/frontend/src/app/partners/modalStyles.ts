// ── Inline styles for modal & toggle ────────────────────────────────────────

export const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '16px',
};

export const modalStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: '16px',
  padding: '32px',
  width: '100%',
  maxWidth: '480px',
  boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
};

export const modalTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: '1.25rem',
  fontWeight: 800,
  color: 'var(--color-deep-navy)',
  margin: 0,
};

export const modalFooterStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '12px',
};

export const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.82rem',
  fontWeight: 700,
  color: 'var(--color-space-grey)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '6px',
};

export const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '10px',
  border: '1px solid rgba(0,31,63,0.12)',
  fontSize: '0.95rem',
  fontFamily: 'var(--font-body)',
  color: 'var(--color-deep-navy)',
  background: '#fff',
  boxSizing: 'border-box',
  outline: 'none',
};

export const cancelBtnStyle: React.CSSProperties = {
  padding: '10px 20px',
  borderRadius: '10px',
  border: '1px solid rgba(0,31,63,0.12)',
  background: '#f8fafc',
  color: 'var(--color-deep-navy)',
  fontWeight: 600,
  fontSize: '0.9rem',
  cursor: 'pointer',
};

export const saveBtnStyle: React.CSSProperties = {
  padding: '10px 24px',
  borderRadius: '10px',
  border: 'none',
  background: 'var(--color-deep-navy)',
  color: '#fff',
  fontWeight: 700,
  fontSize: '0.9rem',
  cursor: 'pointer',
};

export const toggleBtnStyle = (active: boolean): React.CSSProperties => ({
  position: 'relative',
  width: '44px',
  height: '24px',
  borderRadius: '50px',
  border: 'none',
  background: active ? '#00C48C' : '#d1d5db',
  cursor: 'pointer',
  transition: 'background 0.25s ease',
  flexShrink: 0,
  padding: 0,
});

export const toggleKnobStyle = (active: boolean): React.CSSProperties => ({
  position: 'absolute',
  top: '3px',
  left: active ? '23px' : '3px',
  width: '18px',
  height: '18px',
  borderRadius: '50%',
  background: '#fff',
  boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
  transition: 'left 0.25s ease',
  display: 'block',
});
