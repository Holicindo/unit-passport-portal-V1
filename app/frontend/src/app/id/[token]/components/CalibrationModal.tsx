'use client';

import React from 'react';
import { X, Settings2 } from 'lucide-react';
import SensorCalibrationForm from '@/components/iot/SensorCalibrationForm';

interface CalibrationModalProps {
  unitId: string;
  unitSerial: string;
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export default function CalibrationModal({ unitId, unitSerial, isOpen, onClose, onSave }: CalibrationModalProps) {
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
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(5px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #0b1528 0%, #10203e 100%)',
          borderRadius: '16px',
          maxWidth: '680px',
          width: '95%',
          maxHeight: '90vh',
          overflow: 'auto',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          padding: '24px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            paddingBottom: '16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #2E5BFF, #1a3fd4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(46, 91, 255, 0.3)',
              }}
            >
              <Settings2 size={22} color="#ffffff" />
            </div>
            <div>
              <h2
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 900,
                  color: '#ffffff',
                  marginBottom: '2px',
                }}
              >
                Kalibrasi Sensor IoT
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>
                Unit: <span style={{ color: '#60a5fa' }}>{unitSerial}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
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
          >
            <X size={18} />
          </button>
        </div>

        {/* Unified SensorCalibrationForm Component */}
        <SensorCalibrationForm 
          unitId={unitId} 
          calibratedBy={undefined}
          isModal={true}
          onSuccess={() => {
            if (onSave) onSave();
          }}
        />
      </div>
    </div>
  );
}

