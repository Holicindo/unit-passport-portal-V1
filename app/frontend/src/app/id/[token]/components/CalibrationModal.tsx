'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Settings2, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { iotApi } from '@/lib/api';

interface CalibrationModalProps {
  unitId: string;
  unitSerial: string;
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export default function CalibrationModal({ unitId, unitSerial, isOpen, onClose, onSave }: CalibrationModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    cabinet_offset: 0,
    evaporator_offset: 0,
    condenser_offset: 0,
    calibrated_by: '',
    notes: '',
    reference_cabinet: null as number | null,
    reference_evaporator: null as number | null,
    reference_condenser: null as number | null,
  });

  useEffect(() => {
    if (isOpen && unitId) {
      fetchCalibration();
    }
  }, [isOpen, unitId]);

  const fetchCalibration = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await iotApi.getCalibration(unitId);
      if (data && data.data) {
        const cal = data.data;
        setFormData({
          cabinet_offset: cal.cabinet_offset || 0,
          evaporator_offset: cal.evaporator_offset || 0,
          condenser_offset: cal.condenser_offset || 0,
          calibrated_by: cal.calibrated_by || '',
          notes: cal.notes || '',
          reference_cabinet: cal.reference_cabinet,
          reference_evaporator: cal.reference_evaporator,
          reference_condenser: cal.reference_condenser,
        });
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal memuat data kalibrasi');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await iotApi.createCalibration(unitId, formData);
      setSuccess(true);
      setTimeout(() => {
        onSave?.();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal menyimpan kalibrasi');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #0f2142 0%, #1a3a5c 100%)',
          borderRadius: '16px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '-4px -4px 12px rgba(255,255,255,0.05), 4px 4px 16px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #2E5BFF, #1a3fd4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(46, 91, 255, 0.3)',
              }}
            >
              <Settings2 size={20} color="#ffffff" />
            </div>
            <div>
              <h2
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 900,
                  color: '#ffffff',
                  fontFamily: 'var(--font-heading)',
                  marginBottom: '2px',
                }}
              >
                Kalibrasi Sensor IoT
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
                Unit: {unitSerial}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#cbd5e1',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.color = '#cbd5e1';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
              <Loader2 size={28} className="animate-spin" style={{ marginBottom: '12px', color: '#60a5fa' }} />
              <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>Memuat data kalibrasi...</p>
            </div>
          )}

          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '10px',
                color: '#f87171',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: '20px',
              }}
            >
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '10px',
                color: '#34d399',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: '20px',
              }}
            >
              <CheckCircle2 size={18} />
              Kalibrasi berhasil disimpan!
            </div>
          )}

          {!loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Offset Fields */}
              <div>
                <h3
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '12px',
                  }}
                >
                  Offset Kalibrasi (°C)
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {[
                    { label: 'Kabinet', key: 'cabinet_offset' },
                    { label: 'Evaporator', key: 'evaporator_offset' },
                    { label: 'Kondensor', key: 'condenser_offset' },
                  ].map((field) => (
                    <div key={field.key}>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: '#cbd5e1',
                          marginBottom: '6px',
                        }}
                      >
                        {field.label}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData[field.key as keyof typeof formData] as number || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, [field.key]: parseFloat(e.target.value) || 0 })
                        }
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          color: '#ffffff',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          fontFamily: 'monospace',
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Reference Values */}
              <div>
                <h3
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '12px',
                  }}
                >
                  Nilai Referensi (Termometer Standar)
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {[
                    { label: 'Kabinet', key: 'reference_cabinet' },
                    { label: 'Evaporator', key: 'reference_evaporator' },
                    { label: 'Kondensor', key: 'reference_condenser' },
                  ].map((field) => (
                    <div key={field.key}>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: '#cbd5e1',
                          marginBottom: '6px',
                        }}
                      >
                        {field.label}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData[field.key as keyof typeof formData] ?? ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [field.key]: e.target.value ? parseFloat(e.target.value) : null,
                          })
                        }
                        placeholder="Optional"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          color: '#ffffff',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          fontFamily: 'monospace',
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Teknisi Name */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '8px',
                  }}
                >
                  Dikalibrasi oleh
                </label>
                <input
                  type="text"
                  value={formData.calibrated_by}
                  onChange={(e) => setFormData({ ...formData, calibrated_by: e.target.value })}
                  placeholder="Nama teknisi"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                  }}
                />
              </div>

              {/* Notes */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '8px',
                  }}
                >
                  Catatan
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Catatan tambahan..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && (
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
            }}
          >
            <button
              onClick={onClose}
              disabled={saving}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#cbd5e1',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.5 : 1,
                transition: 'all 0.2s',
              }}
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                border: '1px solid rgba(46, 91, 255, 0.4)',
                background: 'linear-gradient(135deg, #2E5BFF, #1a3fd4)',
                color: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: 800,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(46, 91, 255, 0.3)',
                transition: 'all 0.2s',
              }}
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Simpan Kalibrasi
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
