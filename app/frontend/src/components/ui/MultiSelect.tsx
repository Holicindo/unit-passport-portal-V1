'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, Check, X } from 'lucide-react';
import styles from './CustomSelect.module.css';

export interface SelectOption {
  value: string;
  label: string;
  badge?: string;
  color?: string;
}

interface MultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  fullWidth?: boolean;
  showSearch?: boolean;
  maxDisplay?: number;
}

export function MultiSelect({
  value = [],
  onChange,
  options,
  placeholder = 'Pilih teknisi...',
  className = '',
  fullWidth = false,
  showSearch = true,
  maxDisplay = 2,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const uid = useId();

  // Calculate position
  const updateMenuPosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const menuWidth = Math.max(rect.width, 240);
    const leftPos =
      rect.right - menuWidth < 0
        ? rect.left
        : rect.right + menuWidth > viewportWidth
        ? Math.max(0, rect.right - menuWidth)
        : rect.left;

    setMenuStyle({
      position: 'fixed',
      top: rect.bottom + 6,
      left: leftPos,
      minWidth: menuWidth,
      width: Math.max(rect.width, 240),
      zIndex: 99999,
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        updateMenuPosition();
      });
      setSearch('');
      if (showSearch) {
        setTimeout(() => inputRef.current?.focus(), 20);
      }
    }
  }, [isOpen, showSearch, updateMenuPosition]);

  useEffect(() => {
    if (!isOpen) return;
    const handleScrollOrResize = () => updateMenuPosition();
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, updateMenuPosition]);

  // Click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter(
      (opt) => opt.label.toLowerCase().includes(q) || opt.value.toLowerCase().includes(q)
    );
  }, [options, search]);

  const toggleOption = (val: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  const removeSingle = (val: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== val));
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const selectedOptions = options.filter((opt) => value.includes(opt.value));
  // If some selected values don't match any option label, preserve them
  const fallbackValues = value.filter((v) => !options.some((o) => o.value === v));

  return (
    <div
      ref={containerRef}
      className={`${styles.selectContainer} ${fullWidth ? styles.fullWidth : ''} ${className}`}
      style={{ position: 'relative', width: fullWidth ? '100%' : undefined }}
    >
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: '38px',
          padding: '4px 10px',
          background: '#ffffff',
          borderRadius: '8px',
          border: isOpen ? '1.5px solid #2E5BFF' : '1px solid #CBD5E1',
          cursor: 'pointer',
          userSelect: 'none',
          boxShadow: isOpen ? '0 0 0 3px rgba(46,91,255,0.12)' : 'none',
          transition: 'all 0.15s ease',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center', flex: 1, overflow: 'hidden' }}>
          {value.length === 0 ? (
            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{placeholder}</span>
          ) : (
            <>
              {selectedOptions.slice(0, maxDisplay).map((opt) => (
                <span
                  key={opt.value}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: '#EEF2FF',
                    color: '#2E5BFF',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                  }}
                >
                  {opt.label}
                  <X
                    size={12}
                    onClick={(e) => removeSingle(opt.value, e)}
                    style={{ cursor: 'pointer', opacity: 0.7 }}
                  />
                </span>
              ))}
              {fallbackValues.slice(0, Math.max(0, maxDisplay - selectedOptions.length)).map((v) => (
                <span
                  key={v}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: '#EEF2FF',
                    color: '#2E5BFF',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                  }}
                >
                  {v}
                  <X
                    size={12}
                    onClick={(e) => removeSingle(v, e)}
                    style={{ cursor: 'pointer', opacity: 0.7 }}
                  />
                </span>
              ))}
              {value.length > maxDisplay && (
                <span
                  style={{
                    background: '#F1F5F9',
                    color: '#475569',
                    padding: '2px 6px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                >
                  +{value.length - maxDisplay} orang
                </span>
              )}
            </>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '6px' }}>
          {value.length > 0 && (
            <span
              onClick={clearAll}
              title="Hapus semua pilihan"
              style={{
                fontSize: '0.7rem',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '2px',
              }}
            >
              <X size={13} />
            </span>
          )}
          <ChevronDown
            size={14}
            style={{
              color: '#64748b',
              transform: isOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.15s ease',
            }}
          />
        </div>
      </div>

      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            id={`multi-select-portal-${uid}`}
            className={styles.menu}
            style={{
              ...menuStyle,
              background: '#ffffff',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
              overflow: 'hidden',
              padding: '6px',
            }}
          >
            {showSearch && (
              <div
                style={{
                  position: 'relative',
                  marginBottom: '6px',
                  padding: '2px',
                }}
              >
                <Search
                  size={14}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94A3B8',
                  }}
                />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Cari teknisi..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: '100%',
                    padding: '6px 10px 6px 30px',
                    fontSize: '0.82rem',
                    border: '1px solid #E2E8F0',
                    borderRadius: '6px',
                    outline: 'none',
                    background: '#F8FAFC',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            )}

            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {filteredOptions.length === 0 ? (
                <div style={{ padding: '8px 12px', fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' }}>
                  Tidak ada data teknisi
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isChecked = value.includes(opt.value);
                  return (
                    <div
                      key={opt.value}
                      onClick={(e) => toggleOption(opt.value, e)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '7px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.83rem',
                        color: isChecked ? '#1E3A8A' : '#1E293B',
                        background: isChecked ? 'rgba(46,91,255,0.08)' : 'transparent',
                        fontWeight: isChecked ? 600 : 400,
                        transition: 'background 0.12s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isChecked) e.currentTarget.style.background = '#F8FAFC';
                      }}
                      onMouseLeave={(e) => {
                        if (!isChecked) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '4px',
                            border: isChecked ? '1.5px solid #2E5BFF' : '1.5px solid #CBD5E1',
                            background: isChecked ? '#2E5BFF' : '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {isChecked && <Check size={11} color="#ffffff" strokeWidth={3} />}
                        </div>
                        <span>{opt.label}</span>
                      </div>
                      {opt.badge && (
                        <span
                          style={{
                            fontSize: '0.68rem',
                            color: '#64748b',
                            background: '#F1F5F9',
                            padding: '1px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          {opt.badge}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div
              style={{
                marginTop: '6px',
                paddingTop: '6px',
                borderTop: '1px solid #F1F5F9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.72rem',
                color: '#64748b',
                paddingLeft: '4px',
                paddingRight: '4px',
              }}
            >
              <span>{value.length} orang dipilih</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                style={{
                  background: '#2E5BFF',
                  color: '#ffffff',
                  border: 'none',
                  padding: '3px 10px',
                  borderRadius: '5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.72rem',
                }}
              >
                Selesai
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
