'use client';

import { useEffect, useState, useCallback } from 'react';
import { Thermometer, Zap, DoorOpen, DoorClosed, RefreshCw, Wifi, WifiOff, AlertTriangle, Activity } from 'lucide-react';
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
  isDark?: boolean;
}

function TempCard({ label, value, maxNormal, icon }: { label: string; value: number | null; maxNormal: number; icon: string }) {
  const isError = value === null || value === -127;
  const isAlert = !isError && value > maxNormal;
  const color    = isError ? '#94a3b8' : isAlert ? '#dc2626' : '#059669';
  const bg       = isError ? 'rgba(148,163,184,0.08)' : isAlert ? 'rgba(239,68,68,0.18)' : 'rgba(16,185,129,0.16)';
  const border   = isError ? 'rgba(148,163,184,0.2)' : isAlert ? 'rgba(220,38,38,0.55)' : 'rgba(5,150,105,0.5)';

  return (
    <div style={{
      background: bg,
      border: `2px solid ${border}`,
      borderRadius: '14px',
      padding: '18px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      flex: 1,
      minWidth: 0,
      transition: 'all 0.3s ease',
      boxShadow: isAlert
        ? '0 2px 12px rgba(220,38,38,0.18)'
        : (!isError ? '0 2px 12px rgba(5,150,105,0.15)' : 'none'),
    }}>
      <div style={{ fontSize: '1.8rem', lineHeight: 1 }}>{icon}</div>
      <div style={{
        fontSize: '2rem',
        fontWeight: 900,
        color,
        lineHeight: 1,
        fontFamily: 'monospace',
        letterSpacing: '-0.02em',
      }}>
        {isError ? '—' : `${value!.toFixed(1)}°`}
      </div>
      <div style={{
        fontSize: '0.68rem',
        fontWeight: 800,
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
      }}>{label}</div>
      {isAlert && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          fontSize: '0.62rem', color: '#ef4444', fontWeight: 800,
          background: 'rgba(239,68,68,0.12)', padding: '2px 7px',
          borderRadius: '20px', border: '1px solid rgba(239,68,68,0.25)',
          width: 'fit-content',
        }}>
          ⚠ TINGGI
        </div>
      )}
    </div>
  );
}

function DoorStatus({ label, isOpen }: { label: string; isOpen: boolean | null }) {
  const unknown = isOpen === null;
  const statusColor = unknown ? '#94a3b8' : isOpen ? '#d97706' : '#059669';
  const bg    = unknown ? 'rgba(148,163,184,0.07)' : isOpen ? 'rgba(245,158,11,0.16)' : 'rgba(16,185,129,0.16)';
  const bdr   = unknown ? 'rgba(148,163,184,0.2)' : isOpen ? 'rgba(217,119,6,0.55)' : 'rgba(5,150,105,0.5)';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '14px',
      padding: '14px 18px',
      background: bg,
      border: `2px solid ${bdr}`,
      borderRadius: '12px',
      boxShadow: unknown ? 'none' : isOpen
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
        {unknown ? <DoorClosed size={18} color="#94a3b8" /> : isOpen ? <DoorOpen size={18} color="#f59e0b" /> : <DoorClosed size={18} color="#10b981" />}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>{label}</div>
        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: statusColor }}>
          {unknown ? 'Tidak ada data' : isOpen ? '🔓 Terbuka' : '✓ Tertutup'}
        </div>
      </div>
    </div>
  );
}

export default function IotTelemetryWidget({ unitId }: IotTelemetryWidgetProps) {
  const [data, setData] = useState<TelemetryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
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
    fetchData();
    const interval = setInterval(() => fetchData(), 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const timeSince = lastFetched
    ? Math.floor((Date.now() - lastFetched.getTime()) / 1000)
    : null;

  const dataAge = data?.recorded_at
    ? Math.floor((Date.now() - new Date(data.recorded_at).getTime()) / 1000 / 60)
    : null;

  const isOffline = dataAge !== null && dataAge > 30;

  if (loading) {
    return (
      <div style={{ padding: '40px 24px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', background: '#E8EAEE', flex: 1 }}>
        <Activity size={28} style={{ animation: 'spin 1s linear infinite', color: '#2E5BFF' }} />
        <p style={{ fontWeight: 600 }}>Memuat data sensor...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', background: '#E8EAEE' }}>

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
          {timeSince !== null && <span style={{ color: '#94a3b8', fontWeight: 600 }}>Refresh {timeSince}d lalu</span>}
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            style={{
              background: 'rgba(0,31,63,0.06)', border: '1px solid rgba(0,31,63,0.12)',
              borderRadius: '6px', padding: '4px 10px', cursor: 'pointer',
              color: '#475569', display: 'flex', alignItems: 'center', gap: '5px',
              fontSize: '0.72rem', fontWeight: 700, fontFamily: 'inherit',
            }}
          >
            <RefreshCw size={11} style={{ animation: refreshing ? 'spin 0.7s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.25)', borderRadius: '10px', color: '#ef4444', fontSize: '0.85rem', fontWeight: 600 }}>
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {!data && !error && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center', color: '#64748b', background: 'rgba(0,31,63,0.03)', borderRadius: '12px', border: '1.5px dashed rgba(0,31,63,0.1)' }}>
          <Wifi size={40} color="#2E5BFF" style={{ marginBottom: '14px', opacity: 0.5 }} />
          <p style={{ marginBottom: '6px', fontWeight: 700, color: '#334155', fontSize: '0.95rem' }}>Perangkat IoT Belum Terhubung</p>
          <p style={{ fontSize: '0.78rem', lineHeight: 1.6, color: '#64748b', maxWidth: '260px' }}>Unit ini belum memiliki IoT Device ID. Hubungi admin untuk mengkonfigurasi perangkat sensor.</p>
        </div>
      )}

      {data && (
        <>
          {/* Sensor Suhu */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
              <Thermometer size={15} color="#2E5BFF" />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Sensor Suhu</span>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <TempCard label="Kabinet"    value={data.temp_cabinet}    maxNormal={10} icon="🧊" />
              <TempCard label="Evaporator" value={data.temp_evaporator} maxNormal={5}  icon="❄️" />
              <TempCard label="Kondensor"  value={data.temp_condenser}  maxNormal={55} icon="🌡️" />
            </div>
          </div>

          {/* Kelistrikan */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
              <Zap size={15} color="#2E5BFF" />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Kelistrikan (PZEM)</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {[
                { label: 'Tegangan', value: data.voltage, unit: 'V',
                  alert: data.voltage !== null && data.voltage > 0 && (data.voltage < 190 || data.voltage > 240) },
                { label: 'Arus',    value: data.current, unit: 'A', alert: false },
                { label: 'Daya',    value: data.power,   unit: 'W', alert: false },
              ].map(({ label, value, unit, alert }) => (
                <div key={label} style={{
                  background: alert ? 'rgba(239,68,68,0.08)' : 'rgba(0,31,63,0.04)',
                  border: `1.5px solid ${alert ? 'rgba(239,68,68,0.3)' : 'rgba(0,31,63,0.08)'}`,
                  borderRadius: '12px', padding: '14px 14px',
                }}>
                  <div style={{
                    fontSize: '1.5rem', fontWeight: 900,
                    color: alert ? '#ef4444' : (value && value !== 0) ? '#1e293b' : '#94a3b8',
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
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Status Pintu</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <DoorStatus label="Pintu 1" isOpen={data.is_door1_open} />
              <DoorStatus label="Pintu 2" isOpen={data.is_door2_open} />
            </div>
          </div>

          {/* Timestamp */}
          <div style={{ textAlign: 'right', fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600, marginTop: 'auto', paddingTop: '4px' }}>
            Data dari: {new Date(data.recorded_at).toLocaleString('id-ID', {
              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit',
            })}
          </div>
        </>
      )}
    </div>
  );
}
