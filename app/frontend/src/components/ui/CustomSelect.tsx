'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search } from 'lucide-react';
import styles from './CustomSelect.module.css';

export interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  /** Show search box. Defaults to auto: only shown when options > 5 */
  showSearch?: boolean;
}

const SEARCH_THRESHOLD = 5;

export function CustomSelect({ value, onChange, options, placeholder = 'Select...', className = '', showSearch }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(opt => opt.value === value);
  const searchVisible = showSearch !== undefined ? showSearch : options.length > SEARCH_THRESHOLD;

  // Calculate dropdown position from trigger button
  const updateMenuPosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMenuStyle({
      position: 'fixed',
      top: rect.bottom + 8,
      left: rect.left,
      minWidth: Math.max(rect.width, 160),
      zIndex: 99999,
    });
  }, []);

  // Close on outside click — checking both the container and the portal menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const portalMenu = document.getElementById('custom-select-portal');
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        !(portalMenu && portalMenu.contains(target))
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reposition on scroll / resize
  useEffect(() => {
    if (!isOpen) return;
    const update = () => updateMenuPosition();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [isOpen, updateMenuPosition]);

  useEffect(() => {
    if (isOpen) {
      updateMenuPosition();
      setSearch('');
      if (searchVisible) {
        setTimeout(() => inputRef.current?.focus(), 10);
      }
    }
  }, [isOpen, searchVisible, updateMenuPosition]);

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    const lowerSearch = search.toLowerCase();
    return options.filter(opt => opt.label.toLowerCase().includes(lowerSearch));
  }, [options, search]);

  const dropdownContent = (
    <div id="custom-select-portal" className={styles.dropdownMenu} style={menuStyle}>
      {searchVisible && (
        <div className={styles.searchBox}>
          <Search size={14} className={styles.searchIcon} />
          <input
            ref={inputRef}
            type="text"
            className={styles.searchInput}
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
      <div className={styles.optionsList}>
        {filteredOptions.length > 0 ? (
          filteredOptions.map((option) => (
            <div
              key={option.value}
              className={`${styles.option} ${value === option.value ? styles.selected : ''}`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </div>
          ))
        ) : (
          <div className={styles.noResult}>Tidak ditemukan</div>
        )}
      </div>
    </div>
  );

  return (
    <div className={`${styles.selectContainer} ${className}`} ref={containerRef}>
      <button
        type="button"
        className={`${styles.selectTrigger} ${isOpen ? styles.open : ''}`}
        onClick={() => setIsOpen(prev => !prev)}
      >
        <span className={value ? styles.value : styles.placeholder}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={15} className={`${styles.icon} ${isOpen ? styles.iconOpen : ''}`} />
      </button>

      {/* Render dropdown into body via portal to avoid z-index/overflow clipping issues */}
      {isOpen && typeof document !== 'undefined' && createPortal(dropdownContent, document.body)}
    </div>
  );
}
