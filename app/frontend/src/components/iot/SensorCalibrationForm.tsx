'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Wrench, RefreshCw, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { iotApi } from '@/lib/api';

// ── Definisi sensor yang bisa dikalibrasi ──────────────────────────────────
export const SENSORS = [
  { key: 'cabinet',    label: 'Suhu Kabinet',    unit: '°C', offsetKey: 'cabinet_offset',    refKey: 'reference_cabinet',    rawKey: 'temp_cabinet', decimals: 1 },
  { key: 'evaporator', label: 'Suhu Evaporator', unit: '°C', offsetKey: 'evaporator_offset', refKey: 'reference_evaporator', rawKey: 'temp_evaporator', decimals: 1 },
  { key: 'condenser',  label: 'Suhu Kondensor',  unit: '°C', offsetKey: 'condenser_offset',  refKey: 'reference_condenser',  rawKey: 'temp_condenser', decimals: 1 },
  { key: 'voltage',    label: 'Tegangan',         unit: 'V',  offsetKey: 'voltage_offset',    refKey: 'reference_voltage',    rawKey: 'voltage', decimals: 1 },
  { key: 'current',    label: 'Arus',             unit: 'A',  offsetKey: 'current_offset',    refKey: 'reference_current',    rawKey: 'current', decimals: 2 },
  { key: 'power',      label: 'Daya',             unit: 'W',  offsetKey: 'power_offset',      refKey: 'reference_power',      rawKey: 'power', decimals: 1 },
];

export interface SensorCalibrationFormProps {
  unitId: string;
  calibratedBy?: string; // nama/id user yang login
  isModal?: boolean;
  onSuccess?: () => void;
}

const SensorCalibrationForm: React.FC<SensorCalibrationFormProps> = ({ unitId, calibratedBy, isModal = false, onSuccess }) => {
  const [expanded, setExpanded] = useState(isModal ? true : false);
  const [rawData, setRawData]   = useState<Record<string, number | null>>({});
  const [current, setCurrent]   = useState<Record<string, any>>({});  // kalibrasi aktif
  const [refs, setRefs]         = useState<Record<string, string>>({}); // input referensi teknisi
  const [manualOffsets, setManualOffsets] = useState<Record<string, string>>({}); // offset manual jika raw N/A
  const [notes, setNotes]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState('');

  // Fallback nama calibratedBy dari localStorage atau prop
  const effectiveCalibratedBy = useCallback(() => {
    if (calibratedBy && calibratedBy !== 'Teknisi' && calibratedBy !== 'Unknown User') {
      return calibratedBy;
    }
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('user');
        if (stored && stored !== 'undefined' && stored !== 'null') {
          const u = JSON.parse(stored);
          const name = u?.name || u?.full_name || u?.username || u?.email;
          if (name) {
            const roleLabel = u?.role ? ` (${u.role})` : '';
            return `${name}${roleLabel}`;
          }
        }
      } catch {}
    }
    return calibratedBy || 'Teknisi / QC';
  }, [calibratedBy]);

  // Hitung differential dari input referensi & nilai raw
  const getDiff = (sensor: typeof SENSORS[0]) => {
    const raw = rawData[sensor.rawKey];
    const ref = parseFloat(refs[sensor.key] ?? '');
    // Jika ada raw data valid dan referensi diisi
    if (raw !== null && raw !== undefined && !isNaN(raw) && raw !== -127 && !isNaN(ref)) {
      return parseFloat((ref - raw).toFixed(2));
    }
    // Jika raw N/A tapi ada input manual offset
    if (manualOffsets[sensor.key] !== undefined && manualOffsets[sensor.key] !== '') {
      const val = parseFloat(manualOffsets[sensor.key]);
      return isNaN(val) ? null : parseFloat(val.toFixed(2));
    }
    return null;
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [rawRes, calRes] = await Promise.all([
        iotApi.getLatestRaw(unitId).catch(() => null),
        iotApi.getCalibration(unitId).catch(() => null),
      ]);
      setRawData(rawRes?.data ?? rawRes ?? {});
      const calData = calRes?.data?.data ?? calRes?.data ?? {};
      setCurrent(calData);
      
      const prefillRefs: Record<string, string> = {};
      const prefillOffsets: Record<string, string> = {};
      SENSORS.forEach(s => {
        if (calData[s.refKey] != null) prefillRefs[s.key] = String(calData[s.refKey]);
        if (calData[s.offsetKey] != null && Number(calData[s.offsetKey]) !== 0) {
          prefillOffsets[s.key] = String(calData[s.offsetKey]);
        }
      });
      setRefs(prefillRefs);
      setManualOffsets(prefillOffsets);
      setNotes(calData.notes ?? '');
    } catch { /* skip */ }
    setLoading(false);
  }, [unitId]);

  useEffect(() => { 
    if (expanded || isModal) loadData(); 
  }, [expanded, isModal, loadData]);

  const handleSave = async () => {
    setSaving(true); 
    setError(''); 
    setSaved(false);
    const author = effectiveCalibratedBy();
    const payload: Record<string, any> = { calibrated_by: author, notes };
    
    SENSORS.forEach(s => {
      const diff = getDiff(s);
      if (diff !== null) {
        payload[s.offsetKey] = diff;
        payload[s.refKey]    = !isNaN(parseFloat(refs[s.key])) ? parseFloat(refs[s.key]) : null;
      } else if (current[s.offsetKey] !== undefined) {
        payload[s.offsetKey] = current[s.offsetKey];
        payload[s.refKey]    = current[s.refKey] ?? null;
      }
    });

    try {
      await iotApi.createCalibration(unitId, payload);
      setSaved(true);
      await loadData();
      if (onSuccess) onSuccess();
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Gagal menyimpan kalibrasi');
    }
    setSaving(false);
  };

  // Selalu bisa disimpan jika ada referensi terisi, manual offset terisi, atau catatan terisi
  const hasChanges = SENSORS.some(s => (refs[s.key] && refs[s.key].trim() !== '') || (manualOffsets[s.key] && manualOffsets[s.key].trim() !== '')) || notes.trim() !== '';

  return (
    <div style={{ 
      border: isModal ? 'none' : '1px solid #1e293b', 
      borderRadius: isModal ? 0 : 12, 
      marginTop: isModal ? 0 : 16, 
      overflow: 'hidden', 
      background: isModal ? 'transparent' : '#0d1526' 
    }}>
      {/* Header toggle - hanya jika bukan modal */}
      {!isModal && (
        <button
          onClick={() => setExpanded(v => !v)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#e2e8f0' }}
        >
          <Wrench size={16} color="#60a5fa" />
          <span style={{ fontWeight: 600, fontSize: 14 }}>Kalibrasi Sensor</span>
          {current.calibrated_at && (
            <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>
              Terakhir: {new Date(current.calibrated_at).toLocaleDateString('id-ID')}
              {current.calibrated_by && ` · ${current.calibrated_by}`}
            </span>
          )}
          {expanded ? <ChevronUp size={14} style={{ marginLeft: 'auto' }} /> : <ChevronDown size={14} style={{ marginLeft: 'auto' }} />}
        </button>
      )}

      {(expanded || isModal) && (
        <div style={{ padding: isModal ? '0' : '0 18px 18px' }}>
          {/* Penjelasan Ringkas & Ramah Teknisi */}
          <div style={{ display: 'flex', gap: 10, background: 'rgba(37,99,235,0.08)', borderRadius: 10, padding: '12px 14px', marginBottom: 16, fontSize: 12, color: '#94a3b8', border: '1px solid rgba(59,130,246,0.2)' }}>
            <Info size={16} color="#60a5fa" style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ lineHeight: 1.5 }}>
              <span style={{ color: '#e2e8f0', fontWeight: 600 }}>Panduan Teknisi: </span>
              Cukup masukkan angka hasil pengukuran alat ukur standar Anda pada kolom <strong style={{ color: '#60a5fa' }}>Nilai Referensi</strong>. Sistem otomatis menghitung koreksi differential (<code style={{ color: '#38bdf8' }}>Differential = Referensi − Sensor Raw</code>).
            </div>
          </div>

          {loading ? (
            <div style={{ color: '#64748b', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>Memuat data sensor...</div>
          ) : (
            <>
              {/* Tabel sensor */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ color: '#64748b', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <th style={{ textAlign: 'left', padding: '10px 8px', fontWeight: 600 }}>Sensor</th>
                      <th style={{ textAlign: 'right', padding: '10px 8px', fontWeight: 600 }}>Sensor Raw</th>
                      <th style={{ textAlign: 'right', padding: '10px 8px', fontWeight: 600 }}>Nilai Referensi</th>
                      <th style={{ textAlign: 'right', padding: '10px 8px', fontWeight: 600 }}>Differential</th>
                      <th style={{ textAlign: 'right', padding: '10px 8px', fontWeight: 600 }}>Offset Aktif</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SENSORS.map(s => {
                      const raw = rawData[s.rawKey];
                      const rawValid = raw !== null && raw !== undefined && raw !== -127;
                      const formattedRaw = rawValid ? Number(raw).toFixed(s.decimals) : null;
                      const diff = getDiff(s);
                      const activeOffset = Number(current[s.offsetKey] ?? 0);

                      return (
                        <tr key={s.key} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <td style={{ padding: '12px 8px', color: '#cbd5e1', fontWeight: 500 }}>{s.label}</td>
                          <td style={{ padding: '12px 8px', textAlign: 'right', color: rawValid ? '#f1f5f9' : '#f87171', fontFamily: 'monospace', fontSize: 13, fontWeight: 600 }}>
                            {rawValid ? `${formattedRaw} ${s.unit}` : 'N/A (Offline)'}
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                              <input
                                type="number"
                                step={s.decimals === 2 ? '0.01' : '0.1'}
                                placeholder={rawValid ? `mis. ${formattedRaw}` : 'Offset'}
                                value={rawValid ? (refs[s.key] ?? '') : (manualOffsets[s.key] ?? refs[s.key] ?? '')}
                                onChange={e => {
                                  const val = e.target.value;
                                  if (rawValid) {
                                    setRefs(p => ({ ...p, [s.key]: val }));
                                  } else {
                                    setManualOffsets(p => ({ ...p, [s.key]: val }));
                                    setRefs(p => ({ ...p, [s.key]: val }));
                                  }
                                }}
                                style={{
                                  width: 86, padding: '6px 10px', borderRadius: 6, border: '1px solid #334155',
                                  background: '#071022', color: '#ffffff', fontSize: 13, textAlign: 'right', outline: 'none',
                                  fontFamily: 'monospace', fontWeight: 600,
                                }}
                              />
                              <span style={{ color: '#64748b', fontSize: 11, minWidth: 16 }}>{s.unit}</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'right', fontFamily: 'monospace' }}>
                            {diff !== null ? (
                              <span style={{ color: diff > 0 ? '#34d399' : diff < 0 ? '#f87171' : '#94a3b8', fontWeight: 700, fontSize: 13 }}>
                                {diff > 0 ? '+' : ''}{diff.toFixed(s.decimals)} {s.unit}
                              </span>
                            ) : (
                              <span style={{ color: '#475569' }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'right', fontFamily: 'monospace' }}>
                            {activeOffset !== 0 ? (
                              <span style={{ color: '#60a5fa', fontSize: 12, fontWeight: 700 }}>
                                {activeOffset > 0 ? '+' : ''}{activeOffset.toFixed(s.decimals)} {s.unit}
                              </span>
                            ) : (
                              <span style={{ color: '#475569', fontSize: 12 }}>0.0</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Catatan & Metadata Pelaksana */}
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#94a3b8', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: 8 }}>
                  <span>Pelaksana Kalibrasi: <strong style={{ color: '#60a5fa', fontWeight: 700 }}>{effectiveCalibratedBy()}</strong></span>
                  {current.calibrated_at && (
                    <span style={{ fontSize: 11, color: '#64748b' }}>
                      Update Terakhir: {new Date(current.calibrated_at).toLocaleString('id-ID')}
                    </span>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Catatan Kalibrasi (Opsional)</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="mis. Kalibrasi setelah penyesuaian termometer standar atau pergantian sparepart sensor"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #334155', background: '#071022', color: '#e2e8f0', fontSize: 13, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Actions Button */}
              <div style={{ display: 'flex', gap: 10, marginTop: 18, alignItems: 'center' }}>
                <button onClick={loadData} disabled={loading} type="button" title="Refresh data sensor" style={{ background: 'transparent', border: '1px solid #334155', borderRadius: 8, padding: '9px 12px', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <RefreshCw size={14} />
                </button>
                <button
                  onClick={handleSave}
                  type="button"
                  disabled={saving || !hasChanges}
                  style={{ 
                    flex: 1, 
                    padding: '10px 16px', 
                    borderRadius: 8, 
                    border: 'none', 
                    background: hasChanges ? '#2563eb' : '#1e293b', 
                    color: hasChanges ? '#fff' : '#64748b', 
                    fontWeight: 700, 
                    fontSize: 13, 
                    cursor: hasChanges ? 'pointer' : 'not-allowed', 
                    transition: 'all .2s', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: 6 
                  }}
                >
                  {saving ? 'Menyimpan...' : 'Simpan Kalibrasi'}
                </button>
                {saved && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#34d399', fontSize: 13, fontWeight: 700 }}>
                    <CheckCircle size={15} /> Tersimpan!
                  </span>
                )}
                {error && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#f87171', fontSize: 12 }}>
                    <AlertCircle size={14} /> {error}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SensorCalibrationForm;
