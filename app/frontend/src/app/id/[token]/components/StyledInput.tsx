'use client';

import { useState } from 'react';

/* -------------------------------------------------------
   Dark Neumorphic input — inset shadow on dark bg
   Matches the dark theme aesthetic.
   ------------------------------------------------------- */
const neuInputBase: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: 'rgba(8, 18, 50, 0.95)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: '10px',
  boxShadow: 'inset -2px -2px 6px rgba(255,255,255,0.04), inset 3px 3px 8px rgba(0,0,0,0.6)',
  color: '#f1f5f9',
  fontSize: '0.88rem',
  fontFamily: 'inherit',
  fontWeight: 500,
  outline: 'none',
  transition: 'box-shadow 0.2s ease',
  boxSizing: 'border-box' as const,
};

const neuInputFocused: React.CSSProperties = {
  ...neuInputBase,
  boxShadow: 'inset -2px -2px 6px rgba(255,255,255,0.06), inset 3px 3px 10px rgba(0,0,0,0.7), 0 0 0 2px rgba(46,91,255,0.3)',
};

const StyledInput = ({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
      style={focused ? neuInputFocused : neuInputBase}
    />
  );
};

export const EditField = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
    <label style={{
      fontSize: '0.72rem',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: '#64748b',
    }}>{label}</label>
    <StyledInput value={value} onChange={onChange} placeholder={placeholder} type={type} />
  </div>
);

export { StyledInput };

