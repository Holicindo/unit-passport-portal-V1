'use client';

import React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { Thermometer, ThermometerSnowflake, Zap, DoorOpen, DoorClosed, RefreshCw, Wifi, WifiOff, AlertTriangle, Activity, ShelvingUnit, Settings2 } from 'lucide-react';
import { iotApi } from '@/lib/api';

interface TelemetryData {
  id: string;
  unit_id: string;
  temp_cabinet: number | null;
  temp_evaporator: number | null;
  temp_condenser: number | null;
  voltage: number | null;
  current: number | null;
  power: number | null;
  is_door1_open: boolean | null;
  is_door2_open: boolean | null;
  recorded_at: string;
}

interface IotTelemetryWidgetProps {
  unitId: string;
  unitModel?: string;
  isDark?: boolean;
}

function TempCard({ label, rawValue, min, max, offset, icon: Icon, isWarning, warningLabel }: { label: string; rawValue: number | null; min: number; max: number; offset: number; icon: React.ElementType; isWarning?: boolean; warningLabel?: string; }) {
  const isError = rawValue === null || rawValue === -127 || rawValue === 85;
  const liveValue = isError ? null : rawValue + offset;
  const isAlert = !isError && liveValue !== null && (liveValue > max || liveValue < min);
  const color    = isError ? '#94a3b8' : isAlert ? '#dc2626' : isWarning ? '#f59e0b' : '#059669';
  const bg       = isError ? 'rgba(148,163,184,0.08)' : isAlert ? 'rgba(239,68,68,0.06)' : isWarning ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.06)';
  const border   = isError ? 'rgba(148,163,184,0.2)' : isAlert ? 'rgba(220,38,38,0.3)' : isWarning ? 'rgba(245,158,11,0.3)' : 'rgba(5,150,105,0.3)';

  return (
    <div style={{
      background: bg,
      border: `2px solid ${border}`,
      borderRadius: '14px',
      padding: '16px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      flex: '1 1 0',
      minWidth: '160px',
      transition: 'all 0.3s ease',
      boxShadow: isAlert ? '0 4px 16px rgba(220,38,38,0.1)' : 'none',
      position: 'relative',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ background: color + '22', padding: '6px', borderRadius: '8px' }}>
            <Icon size={16} color={color} />
          </div>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-deep-navy)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {label}
          </span>
        </div>
        {isAlert ? (
          <div style={{
            fontSize: '0.62rem', color: '#fff', fontWeight: 800,
            background: '#ef4444', padding: '3px 8px',
            borderRadius: '20px', letterSpacing: '0.05em',
            boxShadow: '0 2px 8px rgba(239,68,68,0.4)',
          }}>KRITIS</div>
        ) : isWarning ? (
          <div style={{
            fontSize: '0.62rem', color: '#fff', fontWeight: 800,
            background: '#f59e0b', padding: '3px 8px',
            borderRadius: '20px', letterSpacing: '0.05em',
            boxShadow: '0 2px 8px rgba(245,158,11,0.4)',
          }}>{warningLabel || 'PERHATIAN'}</div>
        ) : !isError && (
          <div style={{
            fontSize: '0.62rem', color: '#10b981', fontWeight: 800,
            background: 'rgba(16,185,129,0.15)', padding: '3px 8px',
            borderRadius: '20px', letterSpacing: '0.05em', border: '1px solid rgba(16,185,129,0.3)'
          }}>NORMAL</div>
        )}
      </div>

      {/* Main Value */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <div style={{
          fontSize: '2.4rem', fontWeight: 900, color, lineHeight: 1,
          fontFamily: 'monospace', letterSpacing: '-0.02em',
        }}>
          {isError ? '—' : `${liveValue!.toFixed(1)}°`}
        </div>
      </div>

      <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)', margin: '4px 0' }} />

      {/* 3 Metrics: Calibration, Min, Max */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        {/* Kalibrasi */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', background: 'rgba(0,0,0,0.03)', padding: '6px 8px', borderRadius: '8px', border: '1px dashed rgba(0,0,0,0.1)' }}>
          <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Settings2 size={10} /> Offset
          </span>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-deep-navy)', fontFamily: 'monospace' }}>
            {offset > 0 ? '+' : ''}{offset.toFixed(1)}°
          </span>
        </div>
        {/* Min */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', background: 'rgba(0,0,0,0.03)', padding: '6px 8px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)' }}>
          <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#64748b' }}>Min Suhu</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-deep-navy)', fontFamily: 'monospace' }}>
            {min.toFixed(1)}°
          </span>
        </div>
        {/* Max */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', background: 'rgba(0,0,0,0.03)', padding: '6px 8px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)' }}>
          <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#64748b' }}>Max Suhu</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-deep-navy)', fontFamily: 'monospace' }}>
            {max.toFixed(1)}°
          </span>
        </div>
      </div>
    </div>
  );
}

function DoorStatus({ label, isOpen }: { label: string; isOpen: boolean | null }) {
  // Sensor pintu belum terpasang — force TUTUP sampai sensor fisik dipasang
  // Ubah baris ini ke `isOpen === true` saat sensor sudah terpasang
  const actuallyOpen = false;
  const statusColor = actuallyOpen ? '#d97706' : '#059669';
  const bg    = actuallyOpen ? 'rgba(245,158,11,0.16)' : 'rgba(16,185,129,0.16)';
  const bdr   = actuallyOpen ? 'rgba(217,119,6,0.55)' : 'rgba(5,150,105,0.5)';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '14px',
      padding: '14px 18px',
      background: bg,
      border: `2px solid ${bdr}`,
      borderRadius: '12px',
      boxShadow: actuallyOpen
        ? '0 2px 10px rgba(217,119,6,0.15)'
        : '0 2px 10px rgba(5,150,105,0.15)',
    }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '50%',
        background: `${statusColor}22`,
        border: `2px solid ${statusColor}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {actuallyOpen ? <DoorOpen size={18} color="#f59e0b" /> : <DoorClosed size={18} color="#10b981" />}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>{label}</div>
        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: statusColor }}>
          {actuallyOpen ? 'BUKA' : 'TUTUP'}
        </div>
      </div>
    </div>
  );
}

export default function IotTelemetryWidget({ unitId, unitModel, isDark = false }: IotTelemetryWidgetProps) {
  const [data, setData] = useState<TelemetryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [tick, setTick] = useState(0); // ticks every second to update the "X dtk lalu" counter

  // Configuration limits based on unitModel
  const isCX3 = unitModel?.includes('CX3');
  const limits = isCX3 ? {
    cabinet: { min: 0.0, max: 60.0 },
    evaporator: { min: -15.0, max: 20.0 },
    condenser: { min: 30.0, max: 42.0 },
  } : {
    // Universal placeholder thresholds
    cabinet: { min: 0.0, max: 15.0 },
    evaporator: { min: -25.0, max: 10.0 },
    condenser: { min: 25.0, max: 65.0 },
  };

  // Mocked Calibration Offsets (This would normally come from the DB)
  const offsets = {
    cabinet: -0.8,
    evaporator: 0.5,
    condenser: -1.2,
  };

  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else if (!data) setLoading(true);
    setError(null);
    try {
      const { data: res } = await iotApi.getLatest(unitId);
      setData(res);
      setLastFetched(new Date());
    } catch (err: any) {
      if (err?.response?.status === 404 || !err?.response) {
        setData(null);
      } else {
        setError('Gagal memuat data sensor.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [unitId]);

  useEffect(() => {
    fetchData(false);
    // Auto-refresh via background fetch (10 seconds)
    const interval = setInterval(() => fetchData(true), 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Tick every second so "X dtk lalu" stays accurate
  useEffect(() => {
    const ticker = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(ticker);
  }, []);

  // timeSince re-evaluates every second via 'tick'
  const timeSince = lastFetched
    ? Math.floor((Date.now() - lastFetched.getTime()) / 1000)
    : null;

  // Membaca waktu dari string
  const getCorrectedDate = (dateStr: string) => {
    if (!dateStr) return null;
    let d = new Date(dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : `${dateStr}Z`);
    
    // FIX ZONA WAKTU: Supabase/Server mengembalikan waktu yang ketika di-parse
    // ternyata persis mundur 7 jam dari waktu asli (WIB).
    let ageMinutes = (Date.now() - d.getTime()) / 60000;
    if (ageMinutes >= 380 && ageMinutes <= 460) {
      d = new Date(d.getTime() + (7 * 60 * 60 * 1000));
    }
    return d;
  };

  const rawDate = data?.recorded_at ? getCorrectedDate(data.recorded_at) : null;
  let dataAge = rawDate ? Math.floor((Date.now() - rawDate.getTime()) / 1000 / 60) : null;

  const isOffline = dataAge !== null && dataAge > 2; // Anggap offline jika lebih dari 2 menit tidak ada data

  if (loading && !data) {
    return (
      <div style={{ padding: '40px 24px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', background: 'transparent', flex: 1 }}>
        <Activity size={28} style={{ animation: 'spin 1s linear infinite', color: '#2E5BFF' }} />
        <p style={{ fontWeight: 600 }}>Memuat data sensor...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '8px', background: 'transparent' }}>

      {/* Status Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px',
        background: isOffline ? 'rgba(239,68,68,0.08)' : data ? 'rgba(16,185,129,0.08)' : 'rgba(100,116,139,0.08)',
        border: `1.5px solid ${isOffline ? 'rgba(239,68,68,0.25)' : data ? 'rgba(16,185,129,0.25)' : 'rgba(100,116,139,0.2)'}`,
        borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: isOffline ? '#ef4444' : data ? '#10b981' : '#64748b' }}>
          {isOffline ? <WifiOff size={15} /> : data ? <Wifi size={15} /> : <WifiOff size={15} />}
          <span style={{ fontWeight: 800 }}>
            {isOffline ? `OFFLINE (${dataAge} menit lalu)` : data ? 'LIVE — Terhubung' : 'Belum Ada Data IoT'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {timeSince !== null && (
            <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.72rem' }}>
              {timeSince < 60
                ? `${timeSince} dtk lalu`
                : `${Math.floor(timeSince / 60)} mnt lalu`
              }
            </span>
          )}
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            style={{
              background: refreshing
                ? 'rgba(46,91,255,0.12)'
                : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,31,63,0.06)',
              border: `1px solid ${refreshing ? 'rgba(46,91,255,0.3)' : isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,31,63,0.12)'}`,
              borderRadius: '6px', padding: '4px 10px',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              color: refreshing ? '#2E5BFF' : isDark ? '#f8fafc' : '#475569',
              display: 'flex', alignItems: 'center', gap: '5px',
              fontSize: '0.72rem', fontWeight: 700, fontFamily: 'inherit',
              transition: 'all 0.2s ease',
              opacity: refreshing ? 0.8 : 1,
            }}
          >
            <RefreshCw size={11} style={{ animation: refreshing ? 'spin 0.7s linear infinite' : 'none', transition: 'all 0.2s' }} />
            {refreshing ? 'Memperbarui...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.25)', borderRadius: '10px', color: '#ef4444', fontSize: '0.85rem', fontWeight: 600 }}>
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {!data && !error && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center', color: '#64748b', background: 'var(--neu-bg)', borderRadius: '12px', border: '1.5px dashed rgba(100,116,139,0.3)' }}>
          <Wifi size={40} color="#2E5BFF" style={{ marginBottom: '14px', opacity: 0.5 }} />
          <p style={{ marginBottom: '6px', fontWeight: 700, color: 'var(--color-deep-navy)', fontSize: '0.95rem' }}>Perangkat IoT Belum Terhubung</p>
          <p style={{ fontSize: '0.78rem', lineHeight: 1.6, color: '#64748b', maxWidth: '260px' }}>Unit ini belum memiliki IoT Device ID. Hubungi admin untuk mengkonfigurasi perangkat sensor.</p>
        </div>
      )}

      {data && (
        <>
          {/* Sensor Suhu */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
              <Thermometer size={15} color="#2E5BFF" />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-deep-navy)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Sensor Suhu</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
              <TempCard label="Kabinet"    rawValue={data.temp_cabinet}    min={limits.cabinet.min} max={limits.cabinet.max} offset={offsets.cabinet} icon={ShelvingUnit} />
              <TempCard 
                label="Evaporator" 
                rawValue={data.temp_evaporator} 
                min={limits.evaporator.min} 
                max={limits.evaporator.max} 
                offset={offsets.evaporator} 
                icon={ThermometerSnowflake} 
                isWarning={data.temp_evaporator !== null && (data.temp_evaporator + offsets.evaporator) > 0 && (data.temp_evaporator + offsets.evaporator) <= limits.evaporator.max}
                warningLabel="DEFROST"
              />
              <TempCard label="Kondensor"  rawValue={data.temp_condenser}  min={limits.condenser.min} max={limits.condenser.max} offset={offsets.condenser} icon={Thermometer} />
            </div>
          </div>

          {/* Kelistrikan */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
              <Zap size={15} color="#2E5BFF" />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-deep-navy)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Kelistrikan (PZEM)</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(85px, 1fr))', gap: '10px' }}>
              {[
                { label: 'Tegangan', value: data.voltage, unit: 'V',
                  alert: data.voltage !== null && data.voltage > 0 && (data.voltage < 190 || data.voltage > 240) },
                { label: 'Arus',    value: data.current, unit: 'A', alert: false },
                { label: 'Daya',    value: data.power,   unit: 'W', alert: false },
              ].map(({ label, value, unit, alert }) => (
                <div key={label} style={{
                  background: alert ? 'rgba(239,68,68,0.08)' : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,31,63,0.04)'),
                  border: `1.5px solid ${alert ? 'rgba(239,68,68,0.3)' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,31,63,0.08)')}`,
                  borderRadius: '12px', padding: '14px 10px', textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '1.4rem', fontWeight: 900,
                    color: alert ? '#ef4444' : (value && value !== 0) ? 'var(--color-deep-navy)' : '#94a3b8',
                    fontFamily: 'monospace', lineHeight: 1, letterSpacing: '-0.02em',
                  }}>
                    {value !== null && value !== 0 ? (
                      <>
                        {value.toFixed(1)}
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, marginLeft: '3px', color: '#64748b' }}>{unit}</span>
                      </>
                    ) : '—'}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '6px' }}>{label}</div>
                  {(value === null || value === 0) && (
                    <div style={{ fontSize: '0.62rem', color: '#94a3b8', marginTop: '3px', fontWeight: 600 }}>Belum tercolok</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Status Pintu */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
              <DoorClosed size={15} color="#2E5BFF" />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-deep-navy)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Status Pintu</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <DoorStatus label="Pintu 1" isOpen={data.is_door1_open} />
              <DoorStatus label="Pintu 2" isOpen={data.is_door2_open} />
            </div>
          </div>

          {/* Timestamp */}
          <div style={{ textAlign: 'right', fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600, marginTop: 'auto', paddingTop: '4px' }}>
            Data dari: {getCorrectedDate(data.recorded_at)!.toLocaleString('id-ID', {
              timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short'
            })}
          </div>
        </>
      )}
    </div>
  );
}
