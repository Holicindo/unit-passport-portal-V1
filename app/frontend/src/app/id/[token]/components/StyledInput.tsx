'use client';

import { useState } from 'react';

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
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: focused ? '1px solid rgba(139,178,255,0.55)' : '1px solid rgba(255,255,255,0.15)',
        borderRadius: '8px',
        padding: '10px 14px',
        color: 'inherit',
        fontSize: '0.88rem',
        width: '100%',
        outline: 'none',
        fontFamily: 'inherit',
        transition: 'border-color 0.2s',
        boxSizing: 'border-box',
      }}
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
    <label style={{ fontSize: '0.8rem', color: 'var(--color-space-grey)', fontWeight: 600 }}>{label}</label>
    <StyledInput value={value} onChange={onChange} placeholder={placeholder} type={type} />
  </div>
);

export { StyledInput };
