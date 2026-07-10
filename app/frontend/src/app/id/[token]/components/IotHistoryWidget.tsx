'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { BarChart2, TableProperties, RefreshCw, TrendingDown, TrendingUp, Minus, Download, ChevronDown } from 'lucide-react';
import { iotApi } from '@/lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────
interface HistoryPoint {
  recorded_at: string;
  temp_cabinet: number | null;
  temp_evaporator: number | null;
  temp_condenser: number | null;
}

interface SensorSummary {
  avg: number | null;
  min: number | null;
  max: number | null;
}

interface Summary {
  cabinet: SensorSummary;
  evaporator: SensorSummary;
  condenser: SensorSummary;
}

// ─── Mock Data Generator ──────────────────────────────────────────────────────
// (Removed: using real IoT data only)// ─── Helper: Compute Summary ─────────────────────────────────────────────────
function computeSummary(data: HistoryPoint[]): Summary {
  function calc(key: keyof HistoryPoint): SensorSummary {
    const vals = data.map(d => d[key] as number).filter(v => v !== null && v !== -127 && v !== 85);
    if (vals.length === 0) return { avg: null, min: null, max: null };
    return {
      avg: parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)),
      min: parseFloat(Math.min(...vals).toFixed(1)),
      max: parseFloat(Math.max(...vals).toFixed(1)),
    };
  }
  return {
    cabinet: calc('temp_cabinet'),
    evaporator: calc('temp_evaporator'),
    condenser: calc('temp_condenser'),
  };
}

// ─── SVG Line Chart (Industrial Style) ──────────────────────────────────────────
function SensorLineChart({ data }: { data: HistoryPoint[] }) {
  const W = 1000; // viewBox width
  const H = 420; // viewBox height
  const PAD_LEFT = 80;
  const PAD_RIGHT = 80;
  const PAD_TOP = 60; // Extra room for top legend
  const PAD_BOTTOM = 60; // Extra room for X labels (date + time)
  const chartW = W - PAD_LEFT - PAD_RIGHT;
  const chartH = H - PAD_TOP - PAD_BOTTOM;

  const allTemps = data.flatMap(d => [d.temp_cabinet, d.temp_evaporator, d.temp_condenser])
    .filter(v => v !== null && v !== -127 && v !== 85) as number[];
  if (allTemps.length === 0) return null;

  const rawMin = Math.floor(Math.min(...allTemps));
  const rawMax = Math.ceil(Math.max(...allTemps));
  const range = rawMax - rawMin;
  const paddingY = Math.max(3, Math.ceil(range * 0.15)); // Add 15% padding to top and bottom, minimum 3 degrees

  const domainMin = rawMin - paddingY;
  const domainMax = rawMax + paddingY;
  const domainRange = domainMax - domainMin;

  function xOf(i: number) {
    if (data.length <= 1) return PAD_LEFT + chartW / 2;
    return PAD_LEFT + (i / (data.length - 1)) * chartW;
  }
  function yOf(val: number) {
    return PAD_TOP + chartH - ((val - domainMin) / domainRange) * chartH;
  }

  function buildPath(key: keyof HistoryPoint) {
    const pts: [number, number][] = [];
    data.forEach((d, i) => {
      const v = d[key] as number | null;
      if (v !== null && v !== -127 && v !== 85) pts.push([xOf(i), yOf(v)]);
    });
    if (pts.length === 0) return '';
    if (pts.length === 1) {
      // Single point: draw a visible dash ±8px wide
      return `M ${pts[0][0] - 8} ${pts[0][1]} L ${pts[0][0] + 8} ${pts[0][1]}`;
    }
    return `M ${pts[0][0]} ${pts[0][1]} ` + pts.slice(1).map(p => `L ${p[0]} ${p[1]}`).join(' ');
  }

  function buildDots(key: keyof HistoryPoint, color: string) {
    return data.map((d, i) => {
      const v = d[key] as number | null;
      if (v === null || v === -127 || v === 85) return null;
      return <circle key={i} cx={xOf(i)} cy={yOf(v)} r={3} fill={color} stroke="#fff" strokeWidth={1} />;
    });
  }

  // Y-axis labels
  const yLabels = [];
  const yStep = Math.max(1, Math.ceil(domainRange / 6));
  for (let v = domainMin; v <= domainMax; v += yStep) {
    yLabels.push(v);
  }

  // X-axis: up to 10 evenly spaced ticks, guard against single-point division by zero
  const xLabels = [];
  const xTickCount = Math.min(10, data.length);
  if (xTickCount === 1) {
    const d = new Date(data[0].recorded_at);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const H = String(d.getHours()).padStart(2, '0');
    const M = String(d.getMinutes()).padStart(2, '0');
    xLabels.push({ i: 0, dateLine: `${dd}/${mm}/${yyyy}`, timeLine: `${H}:${M}` });
  } else {
    for (let i = 0; i < xTickCount; i++) {
      const idx = Math.floor(i * (data.length - 1) / (xTickCount - 1));
      const d = new Date(data[idx].recorded_at);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const H = String(d.getHours()).padStart(2, '0');
      const M = String(d.getMinutes()).padStart(2, '0');
      xLabels.push({
        i: idx,
        dateLine: `${dd}/${mm}/${yyyy}`,
        timeLine: `${H}:${M}`
      });
    }
  }

  return (
    <div style={{ background: 'transparent', borderRadius: '4px', overflow: 'hidden', padding: '10px 0' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        
        {/* Top Legend matching image style */}
        <g transform={`translate(${PAD_LEFT}, 25)`}>
          {/* Kabinet */}
          <text x="0" y="0" fontSize="14" fill="#4b5563" fontWeight="bold" fontFamily="sans-serif">Kabinet°C</text>
          <line x1="75" y1="-5" x2="115" y2="-5" stroke="#10b981" strokeWidth="3" />
          
          {/* Evaporator */}
          <text x="145" y="0" fontSize="14" fill="#4b5563" fontWeight="bold" fontFamily="sans-serif">Evaporator°C</text>
          <line x1="240" y1="-5" x2="280" y2="-5" stroke="#2E5BFF" strokeWidth="3" />
          
          {/* Kondensor */}
          <text x="310" y="0" fontSize="14" fill="#4b5563" fontWeight="bold" fontFamily="sans-serif">Kondensor°C</text>
          <line x1="400" y1="-5" x2="440" y2="-5" stroke="#ef4444" strokeWidth="3" />
        </g>

        {/* Chart Frame Border */}
        <rect x={PAD_LEFT} y={PAD_TOP} width={chartW} height={chartH} fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />

        {/* Horizontal Grid Lines */}
        {yLabels.map(v => (
          <g key={`y-${v}`}>
            <line x1={PAD_LEFT} y1={yOf(v)} x2={W - PAD_RIGHT} y2={yOf(v)} stroke="rgba(0,0,0,0.1)" strokeWidth="1" strokeDasharray="5 5" />
            {/* Left Y label */}
            <text x={PAD_LEFT - 12} y={yOf(v)} textAnchor="end" dominantBaseline="middle" fontSize="14" fill="#64748b" fontFamily="monospace">
              {v.toFixed(1)}
            </text>
            {/* Right Y label (mirrored) */}
            <text x={W - PAD_RIGHT + 12} y={yOf(v)} textAnchor="start" dominantBaseline="middle" fontSize="14" fill="#64748b" fontFamily="monospace">
              {v.toFixed(1)}
            </text>
          </g>
        ))}

        {/* Vertical Grid Lines & X-axis Labels */}
        {xLabels.map(({ i, dateLine, timeLine }, idx) => {
          const x = xOf(i);
          return (
            <g key={`x-${idx}`}>
              <line x1={x} y1={PAD_TOP} x2={x} y2={PAD_TOP + chartH} stroke="rgba(0,0,0,0.1)" strokeWidth="1" strokeDasharray="5 5" />
              {/* Tick Mark on X axis */}
              <line x1={x} y1={PAD_TOP + chartH} x2={x} y2={PAD_TOP + chartH + 6} stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
              {/* Date Line */}
              <text x={x} y={PAD_TOP + chartH + 22} textAnchor="middle" fontSize="12" fill="#64748b" fontFamily="monospace">
                {dateLine}
              </text>
              {/* Time Line */}
              <text x={x} y={PAD_TOP + chartH + 38} textAnchor="middle" fontSize="12" fill="#64748b" fontFamily="monospace">
                {timeLine}
              </text>
            </g>
          );
        })}

        {/* Lines Data - Sharp straight lines */}
        <path d={buildPath('temp_cabinet')} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinejoin="miter" />
        <path d={buildPath('temp_evaporator')} fill="none" stroke="#2E5BFF" strokeWidth="2.5" strokeLinejoin="miter" />
        <path d={buildPath('temp_condenser')} fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinejoin="miter" />
        {/* Dot markers on each data point */}
        {buildDots('temp_cabinet', '#10b981')}
        {buildDots('temp_evaporator', '#2E5BFF')}
        {buildDots('temp_condenser', '#ef4444')}
      </svg>
    </div>
  );
}

// ─── Summary Card ──────────────────────────────────────────────────────────────
function SummaryCard({ label, summary, color }: { label: string; summary: SensorSummary; color: string }) {
  const icon = summary.avg !== null && summary.avg < 0
    ? <TrendingDown size={14} color={color} />
    : summary.avg !== null && summary.avg > 30
    ? <TrendingUp size={14} color={color} />
    : <Minus size={14} color={color} />;

  return (
    <div style={{
      flex: 1, minWidth: '140px',
      background: `${color}0d`,
      border: `1.5px solid ${color}33`,
      borderRadius: '12px',
      padding: '14px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
        {icon}
        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-deep-navy)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
        {[
          { key: 'Rata-rata', val: summary.avg },
          { key: 'Min', val: summary.min },
          { key: 'Max', val: summary.max },
        ].map(({ key, val }) => (
          <div key={key} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1rem', fontWeight: 900, color, fontFamily: 'monospace', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {val !== null ? `${val}°` : '—'}
            </div>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginTop: '2px' }}>{key}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
const TIME_RANGES = [
  { label: '30 Menit', hours: 0.5 },
  { label: '3 Jam', hours: 3 },
  { label: '6 Jam', hours: 6 },
  { label: '24 Jam', hours: 24 },
  { label: '3 Hari', hours: 72 },
  { label: '7 Hari', hours: 168 },
];

interface IotHistoryWidgetProps {
  unitId: string;
  isDark?: boolean;
}

export default function IotHistoryWidget({ unitId, isDark = false }: IotHistoryWidgetProps) {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const [rangeIdx, setRangeIdx] = useState(0); // default 30 Menit (mudah lihat data terbaru)
  const [data, setData] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllRows, setShowAllRows] = useState(false);

  const downsampleTo5Minutes = (points: HistoryPoint[]) => {
    if (!points || points.length === 0) return [];
    const buckets = new Map<number, HistoryPoint>();
    for (const p of points) {
      const time = new Date(p.recorded_at).getTime();
      // Bucket data into 5-minute intervals (300000 ms)
      const bucketId = Math.floor(time / 300000);
      if (!buckets.has(bucketId)) {
        buckets.set(bucketId, p);
      }
    }
    // Return sorted oldest to newest
    return Array.from(buckets.values()).sort((a, b) => 
      new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    );
  };

  const fetchHistory = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else if (data.length === 0) setLoading(true);

    try {
      const hours = TIME_RANGES[rangeIdx].hours;
      const res = await iotApi.getHistory(unitId, hours);
      const raw: HistoryPoint[] = res.data || [];
      setData(downsampleTo5Minutes(raw));
    } catch {
      // API unavailable or failed
      setData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [unitId, rangeIdx, data.length]);

  useEffect(() => {
    fetchHistory(false);
    const interval = setInterval(() => fetchHistory(true), 10000);
    return () => clearInterval(interval);
  }, [fetchHistory]);

  const summary = useMemo(() => computeSummary(data), [data]);

  // Table rows — oldest first, limited to 20 unless expanded
  const tableRows = useMemo(() => [...data], [data]);
  const visibleRows = showAllRows ? tableRows : tableRows.slice(0, 20);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const H = String(d.getHours()).padStart(2, '0');
    const M = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${H}:${M}`;
  };

  const exportCsv = () => {
    const header = 'Waktu,Kabinet (°C),Evaporator (°C),Kondensor (°C)\n';
    const rows = data.map(d =>
      `${formatTime(d.recorded_at)},${d.temp_cabinet ?? ''},${d.temp_evaporator ?? ''},${d.temp_condenser ?? ''}`
    ).join('\n');
    
    // Tambahkan rata-rata di paling bawah CSV
    const summaryRow = `\nRATA-RATA (${data.length} DATA),${summary.cabinet.avg ?? ''},${summary.evaporator.avg ?? ''},${summary.condenser.avg ?? ''}`;
    
    const blob = new Blob([header + rows + summaryRow], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sensor-history-${unitId}-${TIME_RANGES[rangeIdx].label}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'transparent' }}>

      {/* Controls Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        {/* Time Range Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            value={rangeIdx}
            onChange={(e) => setRangeIdx(Number(e.target.value))}
            style={{
              padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(0,31,63,0.15)', cursor: 'pointer',
              fontSize: '0.78rem', fontWeight: 700, fontFamily: 'inherit',
              background: '#f8fafc', color: '#475569', outline: 'none',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            }}
          >
            {TIME_RANGES.map((r, i) => (
              <option key={r.label} value={i}>{r.label}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {/* View Toggle */}
          <div style={{ display: 'flex', background: 'rgba(0,31,63,0.05)', borderRadius: '8px', padding: '3px' }}>
            {[{ v: 'chart', icon: <BarChart2 size={13} /> }, { v: 'table', icon: <TableProperties size={13} /> }].map(({ v, icon }) => (
              <button key={v} onClick={() => setView(v as 'chart' | 'table')} style={{
                padding: '5px 8px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                background: view === v ? '#2E5BFF' : 'transparent',
                color: view === v ? '#fff' : '#64748b',
                display: 'flex', alignItems: 'center', transition: 'all 0.2s ease',
              }}>
                {icon}
              </button>
            ))}
          </div>

          {/* Refresh & Export */}
          <button onClick={() => fetchHistory(true)} disabled={refreshing || loading} style={{
            padding: '5px 10px', borderRadius: '8px', border: '1px solid rgba(0,31,63,0.1)',
            background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
            fontSize: '0.72rem', fontWeight: 700, color: '#64748b', fontFamily: 'inherit',
          }}>
            <RefreshCw size={12} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
            {refreshing ? 'Memperbarui...' : 'Refresh'}
          </button>
          <button onClick={exportCsv} disabled={data.length === 0} style={{
            padding: '5px 10px', borderRadius: '8px', border: '1px solid rgba(46,91,255,0.2)',
            background: 'rgba(46,91,255,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
            fontSize: '0.72rem', fontWeight: 700, color: '#2E5BFF', fontFamily: 'inherit',
          }}>
            <Download size={12} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Legend (Removed since it is now inside the chart) */}
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
          {data.length} titik data · interval 5 menit
        </span>
      </div>

      {loading && data.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px', color: '#94a3b8', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <RefreshCw size={24} style={{ animation: 'spin 0.8s linear infinite', color: '#2E5BFF' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Memuat riwayat sensor...</span>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <SummaryCard label="Kabinet" summary={summary.cabinet} color="#10b981" />
            <SummaryCard label="Evaporator" summary={summary.evaporator} color="#2E5BFF" />
            <SummaryCard label="Kondensor" summary={summary.condenser} color="#ef4444" />
          </div>

          {/* Chart View */}
          {view === 'chart' && (
            <div style={{ width: '100%', paddingBottom: '10px' }}>
              {data.length >= 1 ? (
                <SensorLineChart data={data} />
              ) : (
                <div style={{
                  textAlign: 'center', padding: '48px 32px', color: '#94a3b8',
                  fontSize: '0.85rem', borderRadius: '8px',
                  border: '1.5px dashed rgba(100,116,139,0.2)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'
                }}>
                  <RefreshCw size={20} style={{ opacity: 0.3 }} />
                  <span>Menunggu data sensor masuk...</span>
                  <span style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>Data akan muncul otomatis setiap 10 detik</span>
                </div>
              )}
            </div>
          )}

          {/* Table View */}
          {view === 'table' && (
            <div style={{ border: '1px solid rgba(0,31,63,0.08)', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '420px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f8fafc' }}>
                    <tr style={{ background: 'rgba(0,31,63,0.04)', borderBottom: '1px solid rgba(0,31,63,0.1)' }}>
                      {['No', 'Waktu (WIB)', 'Kabinet (°C)', 'Evaporator (°C)', 'Kondensor (°C)'].map(h => (
                        <th key={h} style={{ padding: '12px 14px', textAlign: h === 'No' ? 'center' : 'left', fontWeight: 800, color: '#475569', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', backdropFilter: 'blur(4px)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((row, i) => {
                      const evap = row.temp_evaporator;
                      const isDefrost = evap !== null && evap > 0;
                      return (
                        <tr key={i} style={{
                          borderBottom: '1px solid rgba(0,31,63,0.05)',
                          background: i % 2 === 0 ? 'transparent' : 'rgba(0,31,63,0.015)',
                        }}>
                          <td style={{ padding: '8px 14px', textAlign: 'center', color: '#94a3b8', fontFamily: 'monospace' }}>
                            {i + 1}
                          </td>
                          <td style={{ padding: '8px 14px', fontFamily: 'monospace', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>
                            {formatTime(row.recorded_at)}
                          </td>
                          <td style={{ padding: '8px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#10b981' }}>
                            {row.temp_cabinet?.toFixed(1) ?? '—'}
                          </td>
                          <td style={{ padding: '8px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: isDefrost ? '#f59e0b' : '#2E5BFF' }}>
                                {row.temp_evaporator?.toFixed(1) ?? '—'}
                              </span>
                              {isDefrost && (
                                <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', padding: '1px 5px', borderRadius: '4px', border: '1px solid rgba(245,158,11,0.25)' }}>
                                  DEFROST
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '8px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#ef4444' }}>
                            {row.temp_condenser?.toFixed(1) ?? '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {/* Footer summary row */}
                  <tfoot style={{ position: 'sticky', bottom: 0, zIndex: 10, background: '#f0f4f8' }}>
                    <tr style={{ background: 'rgba(46,91,255,0.04)', borderTop: '2px solid rgba(46,91,255,0.12)' }}>
                      <td colSpan={2} style={{ padding: '12px 14px', fontWeight: 800, color: '#475569', fontSize: '0.7rem', textTransform: 'uppercase', backdropFilter: 'blur(4px)' }}>
                        Rata-rata ({data.length} data)
                      </td>
                      <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 900, color: '#10b981', backdropFilter: 'blur(4px)' }}>
                        {summary.cabinet.avg !== null ? `${summary.cabinet.avg}°` : '—'}
                      </td>
                      <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 900, color: '#2E5BFF', backdropFilter: 'blur(4px)' }}>
                        {summary.evaporator.avg !== null ? `${summary.evaporator.avg}°` : '—'}
                      </td>
                      <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 900, color: '#ef4444', backdropFilter: 'blur(4px)' }}>
                        {summary.condenser.avg !== null ? `${summary.condenser.avg}°` : '—'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Show More / Less */}
              {tableRows.length > 20 && (
                <button onClick={() => setShowAllRows(s => !s)} style={{
                  width: '100%', padding: '10px', background: 'rgba(0,31,63,0.02)',
                  border: 'none', borderTop: '1px solid rgba(0,31,63,0.06)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: '#2E5BFF', fontFamily: 'inherit',
                }}>
                  <ChevronDown size={14} style={{ transform: showAllRows ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                  {showAllRows ? 'Tampilkan Lebih Sedikit' : `Tampilkan Semua ${tableRows.length} Data`}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
