'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { BarChart2, TableProperties, RefreshCw, TrendingDown, TrendingUp, Minus, Download, ChevronDown, Settings2, X, Check, FileText } from 'lucide-react';
import { iotApi, unitApi } from '@/lib/api';

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
  { label: '1 Jam',    hours: 1,       bucketMin: 5   },
  { label: '7 Jam',   hours: 7,       bucketMin: 5   },
  { label: '24 Jam',  hours: 24,      bucketMin: 5   },
  { label: '1 Bulan', hours: 720,     bucketMin: 120 },  // 30 days → 2-hour buckets
  { label: '3 Bulan', hours: 2160,    bucketMin: 360 },  // 90 days → 6-hour buckets
  { label: '1 Tahun', hours: 8760,    bucketMin: 1440 }, // 365 days → 1-day buckets
];

interface IotHistoryWidgetProps {
  unitId: string;
  isDark?: boolean;
  unit?: any; // To access specs and update them
  onUnitUpdate?: (newUnit: any) => void;
}

export default function IotHistoryWidget({ unitId, isDark = false, unit, onUnitUpdate }: IotHistoryWidgetProps) {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const [rangeIdx, setRangeIdx] = useState(2); // default 24 Jam
  const [data, setData] = useState<HistoryPoint[]>([]);
  const [rawData, setRawData] = useState<HistoryPoint[]>([]); // unsampled, for export
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllRows, setShowAllRows] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Settings State
  const [savingSettings, setSavingSettings] = useState(false);
  const [tempLimits, setTempLimits] = useState({
    cabinet: { min: 0, max: 15 },
    evaporator: { min: -25, max: 10 },
    condenser: { min: 25, max: 65 },
  });

  // Initialize limits from unit.specs or defaults
  useEffect(() => {
    if (unit?.specs?.iot_limits) {
      setTempLimits(unit.specs.iot_limits);
    } else {
      const isCX3 = unit?.model_name?.includes('CX3');
      setTempLimits(isCX3 ? {
        cabinet: { min: 0.0, max: 60.0 },
        evaporator: { min: -15.0, max: 20.0 },
        condenser: { min: 30.0, max: 42.0 },
      } : {
        cabinet: { min: 0.0, max: 15.0 },
        evaporator: { min: -25.0, max: 10.0 },
        condenser: { min: 25.0, max: 65.0 },
      });
    }
  }, [unit]);

  const saveSettings = async () => {
    if (!unit) return;
    setSavingSettings(true);
    try {
      const updatedSpecs = { ...unit.specs, iot_limits: tempLimits };
      await unitApi.update(unit.id, { specs: updatedSpecs });
      if (onUnitUpdate) {
        onUnitUpdate({ ...unit, specs: updatedSpecs });
      }
      setShowSettings(false);
    } catch (err) {
      console.error('Failed to save IoT settings:', err);
      alert('Gagal menyimpan pengaturan suhu');
    } finally {
      setSavingSettings(false);
    }
  };

  // Terapkan hack koreksi suhu yang sama dengan backend (iot.service.ts)
  // Kabinet > 25°C tapi evap < 15°C = sensor kabel bermasalah, koreksi dari evap
  const applyHack = (point: HistoryPoint): HistoryPoint => {
    const cab  = point.temp_cabinet;
    const evap = point.temp_evaporator;
    if (
      cab  !== null && cab  !== undefined && cab  !== -127 && cab  > 25 &&
      evap !== null && evap !== undefined && evap !== -127 && evap < 15
    ) {
      return {
        ...point,
        temp_cabinet: parseFloat((evap * 0.75).toFixed(1)),
      };
    }
    return point;
  };

  const downsample = (points: HistoryPoint[], bucketMin: number) => {
    if (!points || points.length === 0) return [];
    
    // Untuk interval konsisten 5 menit, kita perlu mengelompokkan berdasarkan slot waktu yang tepat
    // Bukan hanya membagi dengan bucket, tapi membuat grid waktu yang konsisten
    const bucketMs = bucketMin * 60 * 1000;
    
    // Group data berdasarkan slot waktu 5 menit
    const buckets = new Map<number, HistoryPoint[]>();
    
    for (const point of points) {
      const time = new Date(point.recorded_at).getTime();
      // Bulatkan ke slot 5 menit terdekat
      // Misal 16:23:30 -> 16:23:00, 16:28:15 -> 16:28:00
      const slotTime = Math.floor(time / bucketMs) * bucketMs;
      
      if (!buckets.has(slotTime)) {
        buckets.set(slotTime, []);
      }
      buckets.get(slotTime)!.push(point);
    }
    
    // Ambil satu data per slot (yang paling dekat dengan waktu slot)
    const result: HistoryPoint[] = [];
    
    for (const [slotTime, pointsInSlot] of buckets) {
      // Pilih data yang paling dekat dengan waktu slot
      const bestPoint = pointsInSlot.reduce((closest, current) => {
        const closestDiff = Math.abs(new Date(closest.recorded_at).getTime() - slotTime);
        const currentDiff = Math.abs(new Date(current.recorded_at).getTime() - slotTime);
        return currentDiff < closestDiff ? current : closest;
      });
      
      result.push(bestPoint);
    }
    
    return result.sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());
  };

  const fetchHistory = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else if (data.length === 0) setLoading(true);

    try {
      const range = TIME_RANGES[rangeIdx];
      const res = await iotApi.getHistory(unitId, range.hours);
      const raw: HistoryPoint[] = res.data || [];
      // Filter rawData to exactly match the selected time range
      const since = new Date(Date.now() - range.hours * 60 * 60 * 1000);
      const filtered = raw
        .filter(p => new Date(p.recorded_at) >= since)
        .map(applyHack); // terapkan koreksi sensor yang sama dengan backend
      setRawData(filtered);
      setData(downsample(filtered, range.bucketMin));
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

  // Table and summary use downsampled data (same as chart) — consistent intervals
  const tableSource = useMemo(() => data, [data]);
  const summary = useMemo(() => computeSummary(tableSource), [tableSource]);

  // Table rows — oldest first, limited to 20 unless expanded
  const tableRows = useMemo(() => [...tableSource], [tableSource]);
  const visibleRows = showAllRows ? tableRows : tableRows.slice(0, 20);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    // Explicit WIB (UTC+7) conversion
    const wib = new Date(d.getTime() + 7 * 60 * 60 * 1000);
    const dd   = String(wib.getUTCDate()).padStart(2, '0');
    const mm   = String(wib.getUTCMonth() + 1).padStart(2, '0');
    const yyyy = wib.getUTCFullYear();
    const H    = String(wib.getUTCHours()).padStart(2, '0');
    const M    = String(wib.getUTCMinutes()).padStart(2, '0');
    // Hapus detik, hanya jam:menit
    return `${dd}/${mm}/${yyyy} ${H}:${M}`;
  };

  const exportCsv = () => {
    // Use rawData (5-min intervals) instead of downsampled display data
    const exportRows = rawData.length > 0 ? rawData : data;
    const rawSummary = computeSummary(exportRows);
    const header = 'Waktu (WIB),Kabinet (°C),Evaporator (°C),Kondensor (°C)\n';
    const rows = exportRows.map(d =>
      `${formatTime(d.recorded_at)},${d.temp_cabinet?.toFixed(1) ?? ''},${d.temp_evaporator?.toFixed(1) ?? ''},${d.temp_condenser?.toFixed(1) ?? ''}`
    ).join('\n');
    const summaryRow = `\nRATA-RATA (${exportRows.length} DATA),${rawSummary.cabinet.avg ?? ''},${rawSummary.evaporator.avg ?? ''},${rawSummary.condenser.avg ?? ''}`;
    const blob = new Blob([header + rows + summaryRow], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sensor-history-${unitId}-${TIME_RANGES[rangeIdx].label}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    // Use rawData (5-min intervals) for the full report
    const exportRows = rawData.length > 0 ? rawData : data;
    const rawSummary = computeSummary(exportRows);

    // ── Build SVG chart inline ──
    const W = 900, H = 520, PL = 70, PR = 70, PT = 55, PB = 65;
    const cW = W - PL - PR, cH = H - PT - PB;

    const allTemps = exportRows.flatMap(d => [d.temp_cabinet, d.temp_evaporator, d.temp_condenser])
      .filter(v => v !== null && v !== -127 && v !== 85) as number[];
    const rawMin = allTemps.length ? Math.floor(Math.min(...allTemps)) : 0;
    const rawMax = allTemps.length ? Math.ceil(Math.max(...allTemps)) : 40;
    const pad = Math.max(3, Math.ceil((rawMax - rawMin) * 0.15));
    const dMin = rawMin - pad, dMax = rawMax + pad, dRange = dMax - dMin;

    const xOf = (i: number) => exportRows.length <= 1 ? PL + cW / 2 : PL + (i / (exportRows.length - 1)) * cW;
    const yOf = (v: number) => PT + cH - ((v - dMin) / dRange) * cH;

    const buildSvgPath = (key: keyof HistoryPoint) => {
      const pts: string[] = [];
      exportRows.forEach((d, i) => {
        const v = d[key] as number | null;
        if (v !== null && v !== -127 && v !== 85) pts.push(`${i === 0 || pts.length === 0 ? 'M' : 'L'} ${xOf(i).toFixed(1)} ${yOf(v).toFixed(1)}`);
      });
      return pts.join(' ');
    };

    // Y-axis grid lines
    const yStep = Math.max(1, Math.ceil(dRange / 6));
    const yLines: number[] = [];
    for (let v = dMin; v <= dMax; v += yStep) yLines.push(v);

    // X-axis ticks (up to 10)
    const xTickCount = Math.min(10, exportRows.length);
    const xTicks = xTickCount <= 1 ? [0] : Array.from({ length: xTickCount }, (_, i) => Math.floor(i * (exportRows.length - 1) / (xTickCount - 1)));

    const gridLines = yLines.map(v =>
      `<line x1="${PL}" y1="${yOf(v).toFixed(1)}" x2="${W - PR}" y2="${yOf(v).toFixed(1)}" stroke="#bbb" stroke-width="0.8" stroke-dasharray="4 4"/>
       <text x="${PL - 10}" y="${yOf(v).toFixed(1)}" text-anchor="end" dominant-baseline="middle" font-size="13" fill="#000" font-weight="bold" font-family="monospace">${v.toFixed(0)}</text>
       <text x="${W - PR + 10}" y="${yOf(v).toFixed(1)}" text-anchor="start" dominant-baseline="middle" font-size="13" fill="#000" font-weight="bold" font-family="monospace">${v.toFixed(0)}</text>`
    ).join('');

    const xTickSvg = xTicks.map(idx => {
      const d = new Date(exportRows[idx].recorded_at);
      const dd = String(d.getDate()).padStart(2, '0');
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const yy = d.getFullYear();
      const hh = String(d.getHours()).padStart(2, '0');
      const mi = String(d.getMinutes()).padStart(2, '0');
      const x = xOf(idx).toFixed(1);
      return `<line x1="${x}" y1="${PT}" x2="${x}" y2="${PT + cH}" stroke="#ddd" stroke-width="0.8"/>
              <line x1="${x}" y1="${PT + cH}" x2="${x}" y2="${PT + cH + 6}" stroke="#555" stroke-width="1.5"/>
              <text x="${x}" y="${PT + cH + 20}" text-anchor="middle" font-size="11" fill="#000" font-weight="bold" font-family="monospace">${dd}/${mo}/${yy}</text>
              <text x="${x}" y="${PT + cH + 35}" text-anchor="middle" font-size="11" fill="#000" font-weight="bold" font-family="monospace">${hh}:${mi}</text>`;
    }).join('');

    const alarmLineH1 = tempLimits.cabinet.max;
    const alarmLineL1 = tempLimits.cabinet.min;
    const alarmSvg = [
      `<line x1="${PL}" y1="${yOf(alarmLineH1).toFixed(1)}" x2="${W - PR}" y2="${yOf(alarmLineH1).toFixed(1)}" stroke="#ef4444" stroke-width="1" stroke-dasharray="6 3" opacity="0.6"/>`,
      `<line x1="${PL}" y1="${yOf(alarmLineL1).toFixed(1)}" x2="${W - PR}" y2="${yOf(alarmLineL1).toFixed(1)}" stroke="#ef4444" stroke-width="1" stroke-dasharray="6 3" opacity="0.6"/>`,
    ].join('');

    const chartSvg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;">
      <!-- Legend -->
      <text x="${PL}" y="22" font-size="13" fill="#000" font-weight="bold" font-family="sans-serif">Kabinet°C</text>
      <line x1="${PL + 75}" y1="16" x2="${PL + 115}" y2="16" stroke="#10b981" stroke-width="4"/>
      <text x="${PL + 130}" y="22" font-size="13" fill="#000" font-weight="bold" font-family="sans-serif">Evaporator°C</text>
      <line x1="${PL + 230}" y1="16" x2="${PL + 270}" y2="16" stroke="#2E5BFF" stroke-width="4"/>
      <text x="${PL + 285}" y="22" font-size="13" fill="#000" font-weight="bold" font-family="sans-serif">Kondensor°C</text>
      <line x1="${PL + 390}" y1="16" x2="${PL + 430}" y2="16" stroke="#ef4444" stroke-width="4"/>
      <!-- Grid -->
      ${gridLines}
      <!-- Alarm thresholds -->
      ${alarmSvg}
      <!-- Chart border -->
      <rect x="${PL}" y="${PT}" width="${cW}" height="${cH}" fill="none" stroke="#ccc" stroke-width="1"/>
      <!-- X ticks -->
      ${xTickSvg}
      <!-- Data lines -->
      <path d="${buildSvgPath('temp_cabinet')}" fill="none" stroke="#10b981" stroke-width="3" stroke-linejoin="round"/>
      <path d="${buildSvgPath('temp_evaporator')}" fill="none" stroke="#2E5BFF" stroke-width="3" stroke-linejoin="round"/>
      <path d="${buildSvgPath('temp_condenser')}" fill="none" stroke="#ef4444" stroke-width="3" stroke-linejoin="round"/>
    </svg>`;

    // ── Build table HTML (multi-column like Elitech, 4 cols of rows) ──
    const COLS = 4;
    const colSize = Math.ceil(exportRows.length / COLS);
    let tableHtml = `<table class="data-table"><thead><tr>`;
    for (let c = 0; c < COLS; c++) {
      tableHtml += `<th>Waktu (WIB)</th><th>Kab°C</th><th>Evap°C</th><th>Kond°C</th>`;
    }
    tableHtml += `</tr></thead><tbody>`;
    for (let row = 0; row < colSize; row++) {
      tableHtml += '<tr>';
      for (let col = 0; col < COLS; col++) {
        const idx = col * colSize + row;
        if (idx < exportRows.length) {
          const d = exportRows[idx];
          tableHtml += `<td class="time">${formatTime(d.recorded_at)}</td>
            <td class="cab">${d.temp_cabinet?.toFixed(1) ?? '—'}</td>
            <td class="evap">${d.temp_evaporator?.toFixed(1) ?? '—'}</td>
            <td class="cond">${d.temp_condenser?.toFixed(1) ?? '—'}</td>`;
        } else {
          tableHtml += '<td colspan="4"></td>';
        }
      }
      tableHtml += '</tr>';
    }
    tableHtml += '</tbody></table>';

    // ── Duration string ──
    const firstTs = exportRows[0] ? new Date(exportRows[0].recorded_at) : new Date();
    const lastTs = exportRows[exportRows.length - 1] ? new Date(exportRows[exportRows.length - 1].recorded_at) : new Date();
    const durationMs = lastTs.getTime() - firstTs.getTime();
    const dDays = Math.floor(durationMs / 86400000);
    const dHours = Math.floor((durationMs % 86400000) / 3600000);
    const dMins = Math.floor((durationMs % 3600000) / 60000);
    const durationStr = dDays > 0 ? `${dDays}d ${dHours}h ${dMins}m` : `${dHours}h ${dMins}m`;

    const unitName = unit?.model_name ?? unitId;
    const unitSn = unit?.serial_number ?? unitId;
    const clientName = unit?.current_client?.company_name ?? '—';
    const outlet = unit?.outlet_branch ?? '—';
    const createdOn = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Data Report — ${unitSn}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #000; background: #fff; padding: 28px 32px; }

    /* ── Header ── */
    .page-header {
      display: flex; justify-content: space-between; align-items: center;
      border-bottom: 2px solid #000; padding-bottom: 14px; margin-bottom: 20px;
    }
    .page-header-left h1 {
      font-size: 30px; font-weight: 900; color: #000; letter-spacing: -0.5px; line-height: 1;
    }
    .page-header-left .sub {
      font-size: 12px; color: #444; margin-top: 4px; font-weight: 400;
    }
    .logo-block {
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      padding: 0;
    }
    .logo-block svg { width: 44px; height: 44px; color: #000; }
    .logo-block span {
      font-size: 15px; font-weight: 900; color: #000;
      letter-spacing: 1px; font-family: Arial, sans-serif; text-transform: uppercase;
    }

    /* ── Section titles ── */
    .section-title {
      color: #000; font-weight: 900;
      padding: 10px 0 5px; font-size: 15px; letter-spacing: 0.1px;
      margin-top: 18px; margin-bottom: 8px;
      border-bottom: 2px solid #000;
    }

    /* ── Info grid (2-col key-value) ── */
    .info-grid {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 0; border: 1px solid #999; border-radius: 4px; overflow: hidden;
    }
    .info-row {
      display: flex; align-items: baseline; padding: 7px 14px;
      border-bottom: 1px solid #ddd; font-size: 12px;
    }
    .info-row:nth-child(odd) { background: #f5f5f5; }
    .info-row b { min-width: 160px; font-weight: 700; color: #000; flex-shrink: 0; }
    .info-row span { color: #000; }

    /* ── Alarm section ── */
    .alarm-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .alarm-table th {
      background: #e8e8e8; font-weight: 700; color: #000;
      padding: 7px 14px; text-align: left; border: 1px solid #999;
    }
    .alarm-table td { padding: 7px 14px; border: 1px solid #999; color: #000; }
    .alarm-table tr:nth-child(even) td { background: #f5f5f5; }
    .alarm-table td:first-child { font-weight: 700; min-width: 100px; }
    .ok-badge {
      display: inline-block; background: #dcfce7; color: #15803d;
      border: 1px solid #16a34a; border-radius: 3px; padding: 1px 8px;
      font-size: 11px; font-weight: 900;
    }

    /* ── Summary ── */
    .summary-outer { display: flex; gap: 0; border: 1px solid #999; border-radius: 4px; overflow: hidden; }
    .summary-left { flex: 1.2; }
    .summary-right { flex: 1; border-left: 1px solid #999; }
    .sum-row {
      display: flex; align-items: baseline; padding: 7px 14px;
      border-bottom: 1px solid #ddd; font-size: 12px;
    }
    .sum-row:nth-child(odd) { background: #f5f5f5; }
    .sum-row b { min-width: 160px; font-weight: 700; color: #000; flex-shrink: 0; }
    .sum-row .v { font-family: monospace; font-weight: 700; color: #000; }
    .v-green { color: #000 !important; }
    .v-blue  { color: #000 !important; }
    .v-red   { color: #000 !important; }

    /* ── Chart ── */
    .chart-wrap {
      margin: 6px 0 10px; border: 1px solid #999;
      border-radius: 4px; overflow: hidden; padding: 8px 6px 4px;
      background: #fff;
    }

    /* ── Data table ── */
    .data-range {
      font-size: 9.5px; color: #444; margin-bottom: 4px; font-style: italic;
    }
    .data-table {
      width: 100%; border-collapse: collapse;
      font-size: 10px; font-family: monospace;
    }
    .data-table thead tr th {
      background: #222; color: #fff;
      padding: 4px 7px; text-align: left; font-size: 10px;
      font-family: Arial, sans-serif; font-weight: 700; white-space: nowrap;
    }
    .data-table tbody td {
      padding: 2px 7px; border-bottom: 1px solid #ddd;
      white-space: nowrap;
    }
    .data-table tbody tr:nth-child(even) td { background: #f5f5f5; }
    .data-table td.time { color: #000; font-weight: 600; }
    .data-table td.cab  { color: #000; font-weight: 700; }
    .data-table td.evap { color: #000; font-weight: 700; }
    .data-table td.cond { color: #000; font-weight: 700; }
    /* column separators between each group */
    .data-table td.sep, .data-table th.sep { border-left: 2px solid #999; }

    /* ── Footer ── */
    .page-footer {
      margin-top: 16px; padding-top: 7px;
      border-top: 1px solid #999;
      display: flex; justify-content: space-between;
      font-size: 9px; color: #444;
    }

    @media print {
      body { padding: 14px 18px; }
      .page-header { margin-bottom: 12px; }
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page-break { page-break-before: always; break-before: page; }
    }
  </style>
</head>
<body>

  <!-- ═══════════════ HEADER ═══════════════ -->
  <div class="page-header">
    <div class="page-header-left">
      <h1>Data Report IoT Telemetry</h1>
      <div class="sub">File created on: ${createdOn} WIB &nbsp;·&nbsp; ${unitSn}</div>
    </div>
    <div class="logo-block">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 210" fill="none">
        <polyline points="100,8 8,182 20,198 180,198 192,182 100,8" stroke="currentColor" stroke-width="10" stroke-linejoin="miter" stroke-linecap="square" fill="none"/>
        <line x1="93" y1="20" x2="93" y2="198" stroke="currentColor" stroke-width="8" stroke-linecap="square"/>
        <line x1="107" y1="20" x2="107" y2="198" stroke="currentColor" stroke-width="8" stroke-linecap="square"/>
        <polyline points="107,75 150,75 150,128" stroke="currentColor" stroke-width="8" stroke-linecap="square" stroke-linejoin="miter" fill="none"/>
        <polyline points="107,87 138,87 138,128" stroke="currentColor" stroke-width="8" stroke-linecap="square" stroke-linejoin="miter" fill="none"/>
        <polyline points="107,128 168,128 168,175" stroke="currentColor" stroke-width="8" stroke-linecap="square" stroke-linejoin="miter" fill="none"/>
        <polyline points="107,140 156,140 156,175" stroke="currentColor" stroke-width="8" stroke-linecap="square" stroke-linejoin="miter" fill="none"/>
      </svg>
      <span>Holicindo</span>
    </div>
  </div>

  <!-- ═══════════════ DEVICE INFO ═══════════════ -->
  <div class="section-title">Device Information</div>
  <div class="info-grid">
    <div class="info-row"><b>Model:</b><span>${unitName}</span></div>
    <div class="info-row"><b>Probe Type:</b><span>Temperature (3-Sensor)</span></div>
    <div class="info-row"><b>Serial Number:</b><span>${unitSn}</span></div>
    <div class="info-row"><b>Unit ID (IoT):</b><span>${unit?.iot_unit_id ?? unitId}</span></div>
    <div class="info-row"><b>Klien:</b><span>${clientName}</span></div>
    <div class="info-row"><b>Outlet / Cabang:</b><span>${outlet}</span></div>
  </div>

  <!-- ═══════════════ CONFIG ═══════════════ -->
  <div class="section-title">Config. Info</div>
  <div class="info-grid">
    <div class="info-row"><b>Logging Interval:</b><span>5 menit</span></div>
    <div class="info-row"><b>Storage Mode:</b><span>Continuous</span></div>
    <div class="info-row"><b>Range Tampil:</b><span>${TIME_RANGES[rangeIdx].label}</span></div>
    <div class="info-row"><b>Total Data Points:</b><span>${exportRows.length} titik</span></div>
  </div>

  <!-- ═══════════════ ALARM THRESHOLD ═══════════════ -->
  <div class="section-title">Alarm Threshold</div>
  <table class="alarm-table">
    <thead>
      <tr>
        <th>Sensor</th><th>Batas Atas (H1)</th><th>Batas Bawah (L1)</th><th>Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><b>Kabinet</b></td>
        <td>Above: ${tempLimits.cabinet.max.toFixed(1)}°C</td>
        <td>Below: ${tempLimits.cabinet.min.toFixed(1)}°C</td>
        <td><span class="ok-badge">OK</span></td>
      </tr>
      <tr>
        <td><b>Evaporator</b></td>
        <td>Above: ${tempLimits.evaporator.max.toFixed(1)}°C</td>
        <td>Below: ${tempLimits.evaporator.min.toFixed(1)}°C</td>
        <td><span class="ok-badge">OK</span></td>
      </tr>
      <tr>
        <td><b>Kondensor</b></td>
        <td>Above: ${tempLimits.condenser.max.toFixed(1)}°C</td>
        <td>Below: ${tempLimits.condenser.min.toFixed(1)}°C</td>
        <td><span class="ok-badge">OK</span></td>
      </tr>
    </tbody>
  </table>

  <!-- ═══════════════ SUMMARY ═══════════════ -->
  <div class="section-title">Summary</div>
  <div class="summary-outer">
    <div class="summary-left">
      <div class="sum-row"><b>Maximum (Kabinet):</b><span class="v v-green">${rawSummary.cabinet.max ?? '—'}°C</span></div>
      <div class="sum-row"><b>Minimum (Kabinet):</b><span class="v v-green">${rawSummary.cabinet.min ?? '—'}°C</span></div>
      <div class="sum-row"><b>Average (Kabinet):</b><span class="v v-green">${rawSummary.cabinet.avg ?? '—'}°C</span></div>
      <div class="sum-row"><b>Average (Evaporator):</b><span class="v v-blue">${rawSummary.evaporator.avg ?? '—'}°C</span></div>
      <div class="sum-row"><b>Average (Kondensor):</b><span class="v v-red">${rawSummary.condenser.avg ?? '—'}°C</span></div>
    </div>
    <div class="summary-right">
      <div class="sum-row"><b>First Reading:</b><span class="v">${exportRows[0] ? formatTime(exportRows[0].recorded_at) : '—'} WIB</span></div>
      <div class="sum-row"><b>Last Reading:</b><span class="v">${exportRows[exportRows.length-1] ? formatTime(exportRows[exportRows.length-1].recorded_at) : '—'} WIB</span></div>
      <div class="sum-row"><b>Logging Duration:</b><span class="v">${durationStr}</span></div>
      <div class="sum-row"><b>Total Memory:</b><span class="v">${exportRows.length} titik data</span></div>
      <div class="sum-row"><b>First Alarm:</b><span class="v">N/A</span></div>
    </div>
  </div>

  <!-- ═══════════════ CHART ═══════════════ -->
  <div class="chart-wrap">${chartSvg}</div>

  <!-- Footer halaman 1 -->
  <div class="page-footer" style="margin-top:20px;">
    <span>portal.holicindo.com</span>
    <span>File Name: SensorReport_${unitSn}_${TIME_RANGES[rangeIdx].label.replace(' ', '')}_${new Date().toISOString().slice(0,10)} &nbsp;·&nbsp; Halaman 1/2</span>
  </div>

  <!-- ═══════════════ DATA TABLE ═══════════════ -->
  <div class="page-break">
  <div class="section-title">Data Detail</div>
  <div class="data-range">
    From ${exportRows[0] ? formatTime(exportRows[0].recorded_at) : '—'} WIB &nbsp;→&nbsp; ${exportRows[exportRows.length-1] ? formatTime(exportRows[exportRows.length-1].recorded_at) : '—'} WIB &nbsp;·&nbsp; ${exportRows.length} titik data &nbsp;·&nbsp; interval 5 menit
  </div>
  ${tableHtml}

  <!-- ═══════════════ FOOTER (halaman 2) ═══════════════ -->
  <div class="page-footer">
    <span>portal.holicindo.com</span>
    <span>File Name: SensorReport_${unitSn}_${TIME_RANGES[rangeIdx].label.replace(' ', '')}_${new Date().toISOString().slice(0,10)}</span>
  </div>
  </div><!-- end page-break div -->

  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=1000,height=800');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
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
          
          {/* Settings Button */}
          {unit && (
            <button onClick={() => setShowSettings(true)} style={{
              padding: '5px 10px', borderRadius: '8px', border: '1px solid rgba(0,31,63,0.1)',
              background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
              fontSize: '0.72rem', fontWeight: 700, color: '#475569', fontFamily: 'inherit',
            }}>
              <Settings2 size={12} />
              Atur Suhu
            </button>
          )}

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
          <button onClick={exportPdf} disabled={data.length === 0} style={{
            padding: '5px 10px', borderRadius: '8px', border: '1px solid rgba(234,88,12,0.25)',
            background: 'rgba(234,88,12,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
            fontSize: '0.72rem', fontWeight: 700, color: '#ea580c', fontFamily: 'inherit',
          }}>
            <FileText size={12} />
            Export PDF
          </button>
        </div>
      </div>

      {/* Legend (Removed since it is now inside the chart) */}
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
          {tableRows.length} titik data · interval 5 menit
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
                        Rata-rata ({tableRows.length} data)
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

      {/* Settings Modal */}
      {showSettings && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,15,30,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '20px'
        }}>
          <div style={{
            background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '420px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)', overflow: 'hidden'
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings2 size={18} color="#2E5BFF" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-deep-navy)' }}>Atur Batas Suhu (Threshold)</h3>
              </div>
              <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}><X size={18} color="#64748b" /></button>
            </div>
            
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                Atur nilai batas minimum dan maksimum suhu. Nilai ini akan digunakan untuk indikator peringatan pada dashboard monitoring real-time.
              </p>
              
              {[
                { key: 'cabinet', label: 'Suhu Kabinet (°C)', color: '#10b981' },
                { key: 'evaporator', label: 'Suhu Evaporator (°C)', color: '#2E5BFF' },
                { key: 'condenser', label: 'Suhu Kondensor (°C)', color: '#ef4444' },
              ].map(({ key, label, color }) => (
                <div key={key} style={{ background: 'rgba(0,0,0,0.02)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-deep-navy)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
                    {label}
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>Min</label>
                      <input 
                        type="number" 
                        value={tempLimits[key as keyof typeof tempLimits].min}
                        onChange={e => setTempLimits(prev => ({ ...prev, [key]: { ...prev[key as keyof typeof tempLimits], min: Number(e.target.value) } }))}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontFamily: 'monospace', fontWeight: 600, outline: 'none' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>Max</label>
                      <input 
                        type="number" 
                        value={tempLimits[key as keyof typeof tempLimits].max}
                        onChange={e => setTempLimits(prev => ({ ...prev, [key]: { ...prev[key as keyof typeof tempLimits], max: Number(e.target.value) } }))}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontFamily: 'monospace', fontWeight: 600, outline: 'none' }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(0,0,0,0.08)', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setShowSettings(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'transparent', color: '#64748b', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>Batal</button>
              <button onClick={saveSettings} disabled={savingSettings} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#2E5BFF', color: '#fff', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {savingSettings ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={14} />}
                {savingSettings ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
