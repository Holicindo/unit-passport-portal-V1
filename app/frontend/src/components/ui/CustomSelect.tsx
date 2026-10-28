'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback, useId } from 'react';
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
  /** Force container to 100% width */
  fullWidth?: boolean;
  /** Show search box. Defaults to auto: only shown when options > 5 */
  showSearch?: boolean;
  /** Custom trigger render function */
  customTrigger?: (selectedOption: SelectOption | undefined, isOpen: boolean) => React.ReactNode;
}

const SEARCH_THRESHOLD = 5;

export function CustomSelect({ value, onChange, options, placeholder = 'Select...', className = '', showSearch, customTrigger, fullWidth }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const uid = useId();

  const selectedOption = options.find(opt => opt.value === value);
  const searchVisible = showSearch !== undefined ? showSearch : options.length > SEARCH_THRESHOLD;

  // Calculate dropdown position from trigger container
  const updateMenuPosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const menuWidth = Math.max(rect.width, 180);
    // Flip left if would overflow right edge
    const leftPos = rect.right - menuWidth < 0
      ? rect.left
      : rect.right + menuWidth > viewportWidth
      ? Math.max(0, rect.right - menuWidth)
      : rect.left;
    setMenuStyle({
      position: 'fixed',
      top: rect.bottom + 6,
      left: leftPos,
      minWidth: menuWidth,
      zIndex: 99999,
    });
  }, []);

  // Close on outside click — check both the container wrapper and the floating portal menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        !(menuRef.current && menuRef.current.contains(target))
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
      // Use rAF to defer until after portal mounts to DOM — fixes first-click offset glitch
      requestAnimationFrame(() => {
        updateMenuPosition();
      });
      setSearch('');
      if (searchVisible) {
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    }
  }, [isOpen, searchVisible, updateMenuPosition]);

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    const lowerSearch = search.toLowerCase();
    return options.filter(opt => opt.label.toLowerCase().includes(lowerSearch));
  }, [options, search]);

  const dropdownContent = (
    <div
      ref={menuRef}
      id={`custom-select-portal-${uid}`}
      className={styles.dropdownMenu}
      style={menuStyle}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {searchVisible && (
        <div className={styles.searchBox}>
          <Search size={14} className={styles.searchIcon} />
          <input
            ref={inputRef}
            type="text"
            className={styles.searchInput}
            placeholder="Cari..."
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
              onMouseDown={(e) => {
                e.stopPropagation();
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
    <div
      className={`${styles.selectContainer} ${className}`}
      ref={containerRef}
      onClick={(e) => e.stopPropagation()}
      style={fullWidth ? { width: '100%', display: 'block' } : undefined}
    >
      {customTrigger ? (
        <div onClick={() => setIsOpen(prev => !prev)}>
          {customTrigger(selectedOption, isOpen)}
        </div>
      ) : (
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
      )}

      {/* Render dropdown into body via portal to avoid z-index/overflow clipping issues */}
      {isOpen && typeof document !== 'undefined' && createPortal(dropdownContent, document.body)}
    </div>
  );
}
