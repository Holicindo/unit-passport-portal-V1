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
        background: 'var(--color-light-tech-grey)',
        border: focused ? '1px solid rgba(139,178,255,0.55)' : '1px solid rgba(0,31,63,0.12)',
        borderRadius: '8px',
        padding: '10px 14px',
        color: 'var(--color-deep-navy)',
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
