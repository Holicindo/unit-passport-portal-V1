'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  label?: string;
  placeholder?: string;
  theme?: 'light' | 'dark';
}

const MONTHS_ID = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember',
];
const DAYS_SHORT = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];

type ViewMode = 'days' | 'months' | 'years';

export default function DatePicker({
  value,
  onChange,
  label,
  placeholder = 'Pilih tanggal...',
  theme = 'light',
}: DatePickerProps) {
  const today = new Date();
  const selectedDate = value ? new Date(value + 'T00:00:00') : null;

  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('days');
  const [viewYear, setViewYear] = useState(selectedDate?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate?.getMonth() ?? today.getMonth());
  const [yearRangeStart, setYearRangeStart] = useState(
    Math.floor((selectedDate?.getFullYear() ?? today.getFullYear()) / 12) * 12
  );
  // popup position: always above the button
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});

  const buttonRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const recalcPosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const popupH = 340;
    const popupW = 290;
    // prefer above; fall back to below only if no room
    const topAbove = rect.top - popupH - 6 + window.scrollY;
    const topBelow = rect.bottom + 6 + window.scrollY;
    const useAbove = rect.top > popupH + 12;
    setPopupStyle({
      position: 'absolute',
      top: useAbove ? topAbove : topBelow,
      left: Math.min(rect.left + window.scrollX, window.innerWidth - popupW - 8),
      width: popupW,
      zIndex: 99999,
    });
  }, []);

  const handleOpen = () => {
    recalcPosition();
    setViewMode('days');
    setIsOpen(o => !o);
  };

  // close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        buttonRef.current?.contains(e.target as Node) ||
        popupRef.current?.contains(e.target as Node)
      ) return;
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // reposition on scroll/resize
  useEffect(() => {
    if (!isOpen) return;
    const handler = () => recalcPosition();
    window.addEventListener('scroll', handler, true);
    window.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('scroll', handler, true);
      window.removeEventListener('resize', handler);
    };
  }, [isOpen, recalcPosition]);

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDay = (y: number, m: number) => new Date(y, m, 1).getDay();

  const selectDay = (day: number) => {
    const s = `${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    onChange(s);
    setIsOpen(false);
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const displayValue = selectedDate
    ? selectedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  // ── Colors (always light popup regardless of theme prop) ──────────────────
  const triggerBg    = theme === 'dark' ? 'rgba(255,255,255,0.06)' : '#ffffff';
  const triggerBorder= theme === 'dark' ? '1px solid rgba(255,255,255,0.15)' : '1px solid #e2e8f0';
  const triggerColor = theme === 'dark' ? '#ffffff' : '#0f172a';
  const labelColor   = theme === 'dark' ? '#94a3b8' : '#475569';
  const accent       = '#2563eb';

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay    = getFirstDay(viewYear, viewMonth);
  const totalCells  = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  // ── Popup content ─────────────────────────────────────────────────────────
  const popup = isOpen ? (
    <div
      ref={popupRef}
      style={{
        ...popupStyle,
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '14px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
        fontFamily: 'inherit',
      }}
    >
      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
        {viewMode === 'days' && (
          <button type="button" onClick={prevMonth}
            style={{ background:'none', border:'none', cursor:'pointer', color:'#475569', padding:'4px 6px', borderRadius:'6px', display:'flex', alignItems:'center' }}>
            <ChevronLeft size={15} />
          </button>
        )}
        {viewMode === 'years' && (
          <button type="button" onClick={() => setYearRangeStart(s => s - 12)}
            style={{ background:'none', border:'none', cursor:'pointer', color:'#475569', padding:'4px 6px', borderRadius:'6px', display:'flex', alignItems:'center' }}>
            <ChevronLeft size={15} />
          </button>
        )}
        {viewMode === 'months' && <div style={{ width: 28 }} />}

        {/* Clickable month / year label */}
        <button
          type="button"
          onClick={() => {
            if (viewMode === 'days') setViewMode('months');
            else if (viewMode === 'months') setViewMode('years');
            else setViewMode('days');
          }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '4px',
            fontSize: '0.9rem', fontWeight: 700, color: '#0f172a',
          }}
        >
          {viewMode === 'days' && <>{MONTHS_ID[viewMonth]} {viewYear}</>}
          {viewMode === 'months' && <>{viewYear}</>}
          {viewMode === 'years' && <>{yearRangeStart} – {yearRangeStart + 11}</>}
          <ChevronDown size={13} color="#64748b" />
        </button>

        {viewMode === 'days' && (
          <button type="button" onClick={nextMonth}
            style={{ background:'none', border:'none', cursor:'pointer', color:'#475569', padding:'4px 6px', borderRadius:'6px', display:'flex', alignItems:'center' }}>
            <ChevronRight size={15} />
          </button>
        )}
        {viewMode === 'years' && (
          <button type="button" onClick={() => setYearRangeStart(s => s + 12)}
            style={{ background:'none', border:'none', cursor:'pointer', color:'#475569', padding:'4px 6px', borderRadius:'6px', display:'flex', alignItems:'center' }}>
            <ChevronRight size={15} />
          </button>
        )}
        {viewMode === 'months' && <div style={{ width: 28 }} />}
      </div>

      {/* ── Days view ── */}
      {viewMode === 'days' && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'2px', marginBottom:'4px' }}>
            {DAYS_SHORT.map(d => (
              <div key={d} style={{ textAlign:'center', fontSize:'0.68rem', fontWeight:700, color:'#94a3b8', padding:'3px 0' }}>{d}</div>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'2px' }}>
            {Array.from({ length: totalCells }).map((_, i) => {
              const day = i - firstDay + 1;
              const inMonth = day >= 1 && day <= daysInMonth;
              const thisDate = new Date(viewYear, viewMonth, day);
              const isTdy = inMonth && thisDate.toDateString() === today.toDateString();
              const isSel = inMonth && selectedDate !== null && thisDate.toDateString() === selectedDate.toDateString();
              return (
                <button
                  key={i}
                  type="button"
                  disabled={!inMonth}
                  onClick={() => inMonth && selectDay(day)}
                  style={{
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 2px',
                    fontSize: '0.82rem',
                    cursor: inMonth ? 'pointer' : 'default',
                    color: isSel ? '#fff' : isTdy ? accent : inMonth ? '#0f172a' : '#e2e8f0',
                    background: isSel ? accent : isTdy ? `${accent}18` : 'transparent',
                    fontWeight: isSel || isTdy ? 700 : 400,
                    textAlign: 'center',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => { if (!isSel && inMonth) (e.currentTarget as HTMLButtonElement).style.background = '#f1f5f9'; }}
                  onMouseLeave={e => { if (!isSel) (e.currentTarget as HTMLButtonElement).style.background = isTdy ? `${accent}18` : 'transparent'; }}
                >
                  {inMonth ? day : ''}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* ── Months view ── */}
      {viewMode === 'months' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'6px' }}>
          {MONTHS_ID.map((m, idx) => {
            const isCur = idx === viewMonth;
            return (
              <button key={m} type="button"
                onClick={() => { setViewMonth(idx); setViewMode('days'); }}
                style={{
                  border: isCur ? `1.5px solid ${accent}` : '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '8px 4px',
                  fontSize: '0.78rem',
                  fontWeight: isCur ? 700 : 400,
                  color: isCur ? accent : '#0f172a',
                  background: isCur ? `${accent}08` : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.12s',
                }}
              >
                {m.slice(0, 3)}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Years view ── */}
      {viewMode === 'years' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'6px' }}>
          {Array.from({ length: 12 }).map((_, i) => {
            const yr = yearRangeStart + i;
            const isCur = yr === viewYear;
            return (
              <button key={yr} type="button"
                onClick={() => { setViewYear(yr); setViewMode('months'); }}
                style={{
                  border: isCur ? `1.5px solid ${accent}` : '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '8px 4px',
                  fontSize: '0.82rem',
                  fontWeight: isCur ? 700 : 400,
                  color: isCur ? accent : '#0f172a',
                  background: isCur ? `${accent}08` : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.12s',
                }}
              >
                {yr}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Footer ── */}
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:'12px', paddingTop:'10px', borderTop:'1px solid #f1f5f9' }}>
        <button type="button"
          onClick={() => { onChange(''); setIsOpen(false); }}
          style={{ background:'none', border:'none', cursor:'pointer', color: accent, fontSize:'0.8rem', fontWeight:600 }}>
          Hapus
        </button>
        <button type="button"
          onClick={() => {
            setViewMonth(today.getMonth());
            setViewYear(today.getFullYear());
            setViewMode('days');
            selectDay(today.getDate());
          }}
          style={{ background:'none', border:'none', cursor:'pointer', color: accent, fontSize:'0.8rem', fontWeight:600 }}>
          Hari Ini
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div style={{ position:'relative', width:'100%' }}>
      {label && (
        <label style={{ display:'block', fontSize:'0.8rem', color: labelColor, fontWeight:600, marginBottom:'6px' }}>
          {label}
        </label>
      )}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleOpen}
        style={{
          width: '100%',
          background: triggerBg,
          border: triggerBorder,
          borderRadius: '8px',
          padding: '10px 14px',
          color: displayValue ? triggerColor : '#94a3b8',
          fontSize: '0.88rem',
          fontFamily: 'inherit',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          cursor: 'pointer',
          textAlign: 'left',
          boxSizing: 'border-box',
          transition: 'border-color 0.2s',
        }}
      >
        <span>{displayValue || placeholder}</span>
        <CalendarDays size={16} color="#94a3b8" />
      </button>

      {typeof document !== 'undefined' && popup && createPortal(popup, document.body)}
    </div>
  );
}
