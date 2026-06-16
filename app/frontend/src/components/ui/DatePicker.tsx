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

// ── Color palettes ──────────────────────────────────────────────────────────
const lightColors = {
  popupBg: '#ffffff',
  popupBorder: '#e2e8f0',
  popupShadow: '0 12px 40px rgba(0,0,0,0.15)',
  text: '#0f172a',
  textMuted: '#475569',
  textSubtle: '#94a3b8',
  accent: '#2563eb',
  accentBg: '#2563eb18',
  dayHover: '#f1f5f9',
  emptyDay: '#e2e8f0',
  monthBorder: '#e2e8f0',
  monthBg: '#ffffff',
  footerBorder: '#f1f5f9',
};

const darkColors = {
  popupBg: 'rgba(8, 12, 28, 0.95)',
  popupBorder: 'rgba(46, 91, 255, 0.2)',
  popupShadow: '0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(46,91,255,0.1)',
  text: '#ffffff',
  textMuted: '#a0abc0',
  textSubtle: '#6b7a94',
  accent: '#4f7fff',
  accentBg: 'rgba(79, 127, 255, 0.15)',
  dayHover: 'rgba(46, 91, 255, 0.12)',
  emptyDay: 'rgba(46, 91, 255, 0.08)',
  monthBorder: 'rgba(46, 91, 255, 0.15)',
  monthBg: 'rgba(4, 8, 20, 0.6)',
  footerBorder: 'rgba(46, 91, 255, 0.1)',
};

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

  // ── Detect dark mode from document ─────────────────────────────────────────
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.dataset.theme === 'dark');
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const c = isDark || theme === 'dark' ? darkColors : lightColors;

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

  // ── Trigger colors ─────────────────────────────────────────────────────────
  const triggerBg    = isDark || theme === 'dark' ? 'rgba(255,255,255,0.06)' : '#ffffff';
  const triggerBorder= isDark || theme === 'dark' ? '1px solid rgba(255,255,255,0.15)' : '1px solid #e2e8f0';
  const triggerColor = isDark || theme === 'dark' ? '#ffffff' : '#0f172a';
  const labelColor   = isDark || theme === 'dark' ? '#94a3b8' : '#475569';

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay    = getFirstDay(viewYear, viewMonth);
  const totalCells  = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  // ── Popup content ─────────────────────────────────────────────────────────
  const popup = isOpen ? (
    <div
      ref={popupRef}
      style={{
        ...popupStyle,
        background: c.popupBg,
        border: `1px solid ${c.popupBorder}`,
        borderRadius: '14px',
        padding: '14px',
        boxShadow: c.popupShadow,
        fontFamily: 'inherit',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      }}
    >
      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
        {viewMode === 'days' && (
          <button type="button" onClick={prevMonth}
            style={{ background:'none', border:'none', cursor:'pointer', color: c.textMuted, padding:'4px 6px', borderRadius:'6px', display:'flex', alignItems:'center' }}>
            <ChevronLeft size={15} />
          </button>
        )}
        {viewMode === 'years' && (
          <button type="button" onClick={() => setYearRangeStart(s => s - 12)}
            style={{ background:'none', border:'none', cursor:'pointer', color: c.textMuted, padding:'4px 6px', borderRadius:'6px', display:'flex', alignItems:'center' }}>
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
            fontSize: '0.9rem', fontWeight: 700, color: c.text,
          }}
        >
          {viewMode === 'days' && <>{MONTHS_ID[viewMonth]} {viewYear}</>}
          {viewMode === 'months' && <>{viewYear}</>}
          {viewMode === 'years' && <>{yearRangeStart} – {yearRangeStart + 11}</>}
          <ChevronDown size={13} color={c.textSubtle} />
        </button>

        {viewMode === 'days' && (
          <button type="button" onClick={nextMonth}
            style={{ background:'none', border:'none', cursor:'pointer', color: c.textMuted, padding:'4px 6px', borderRadius:'6px', display:'flex', alignItems:'center' }}>
            <ChevronRight size={15} />
          </button>
        )}
        {viewMode === 'years' && (
          <button type="button" onClick={() => setYearRangeStart(s => s + 12)}
            style={{ background:'none', border:'none', cursor:'pointer', color: c.textMuted, padding:'4px 6px', borderRadius:'6px', display:'flex', alignItems:'center' }}>
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
              <div key={d} style={{ textAlign:'center', fontSize:'0.68rem', fontWeight:700, color: c.textSubtle, padding:'3px 0' }}>{d}</div>
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
                    color: isSel ? '#fff' : isTdy ? c.accent : inMonth ? c.text : c.emptyDay,
                    background: isSel ? c.accent : isTdy ? c.accentBg : 'transparent',
                    fontWeight: isSel || isTdy ? 700 : 400,
                    textAlign: 'center',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => { if (!isSel && inMonth) (e.currentTarget as HTMLButtonElement).style.background = c.dayHover; }}
                  onMouseLeave={e => { if (!isSel) (e.currentTarget as HTMLButtonElement).style.background = isTdy ? c.accentBg : 'transparent'; }}
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
                  border: isCur ? `1.5px solid ${c.accent}` : `1px solid ${c.monthBorder}`,
                  borderRadius: '8px',
                  padding: '8px 4px',
                  fontSize: '0.78rem',
                  fontWeight: isCur ? 700 : 400,
                  color: isCur ? c.accent : c.text,
                  background: isCur ? c.accentBg : c.monthBg,
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
                  border: isCur ? `1.5px solid ${c.accent}` : `1px solid ${c.monthBorder}`,
                  borderRadius: '8px',
                  padding: '8px 4px',
                  fontSize: '0.82rem',
                  fontWeight: isCur ? 700 : 400,
                  color: isCur ? c.accent : c.text,
                  background: isCur ? c.accentBg : c.monthBg,
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
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:'12px', paddingTop:'10px', borderTop:`1px solid ${c.footerBorder}` }}>
        <button type="button"
          onClick={() => { onChange(''); setIsOpen(false); }}
          style={{ background:'none', border:'none', cursor:'pointer', color: c.accent, fontSize:'0.8rem', fontWeight:600 }}>
          Hapus
        </button>
        <button type="button"
          onClick={() => {
            setViewMonth(today.getMonth());
            setViewYear(today.getFullYear());
            setViewMode('days');
            selectDay(today.getDate());
          }}
          style={{ background:'none', border:'none', cursor:'pointer', color: c.accent, fontSize:'0.8rem', fontWeight:600 }}>
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
