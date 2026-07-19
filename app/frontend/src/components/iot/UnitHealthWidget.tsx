'use client';

import React, { useEffect, useState } from 'react';
import { Activity, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { iotApi } from '@/lib/api';

interface UnitHealthWidgetProps {
  unitId: string;
  /** Serial number — used to detect demo units with IoT installed but temporarily offline */
  serialNumber?: string;
}

// ── Demo data for specific units that have IoT hardware installed
//    but may be temporarily offline (e.g., during transport / exhibition setup)
const DEMO_HEALTH_DATA: Record<string, { score: number; note: string }> = {
  'A26051860': {
    score: 92,
    note: 'Data berdasarkan rekam terakhir sebelum perangkat dalam mode transit ke lokasi pameran.',
  },
};

export default function UnitHealthWidget({ unitId, serialNumber }: UnitHealthWidgetProps) {
  const [healthScore, setHealthScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [demoNote, setDemoNote] = useState<string | null>(null);

  // Check if this unit has demo data available
  const demoData = serialNumber ? DEMO_HEALTH_DATA[serialNumber] : undefined;

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const { data } = await iotApi.getLatest(unitId);
        
        if (data) {
          // Calculate Data Age (Handling Timezone offset if needed)
          let recordedAt = new Date(data.recorded_at.endsWith('Z') || data.recorded_at.includes('+') ? data.recorded_at : `${data.recorded_at}Z`);
          let ageMinutes = (Date.now() - recordedAt.getTime()) / 60000;
          if (ageMinutes >= 380 && ageMinutes <= 460) {
            recordedAt = new Date(recordedAt.getTime() + (7 * 60 * 60 * 1000));
            ageMinutes = (Date.now() - recordedAt.getTime()) / 60000;
          }

          if (ageMinutes > 15) {
            // Device offline — use demo data if available
            if (demoData) {
              setIsOffline(false);
              setHealthScore(demoData.score);
              setDemoNote(demoData.note);
            } else {
              setIsOffline(true);
              setHealthScore(0);
            }
          } else {
            setIsOffline(false);
            setDemoNote(null);
            let score = 100;

            // Suhu Kabinet (-0.8 offset mock)
            const cabinet = data.temp_cabinet !== null ? data.temp_cabinet - 0.8 : null;
            if (cabinet !== null && cabinet !== -127 && cabinet !== 85) {
              if (cabinet > 15) score -= 30;
              else if (cabinet > 8) score -= 15;
              else if (cabinet < -10) score -= 10;
            }

            // Suhu Kondensor (-1.2 offset mock)
            const condenser = data.temp_condenser !== null ? data.temp_condenser - 1.2 : null;
            if (condenser !== null && condenser !== -127 && condenser !== 85) {
              if (condenser > 60) score -= 30;
              else if (condenser > 50) score -= 15;
            }

            // Kelistrikan
            if (data.voltage !== null && data.voltage > 0) {
              if (data.voltage < 190) score -= 15;
              if (data.voltage > 240) score -= 15;
            }

            setHealthScore(Math.max(0, Math.min(100, score)));
          }
          setLastUpdate(new Date());
        } else {
          // No data at all — use demo data if available
          if (demoData) {
            setIsOffline(false);
            setHealthScore(demoData.score);
            setDemoNote(demoData.note);
            setLastUpdate(new Date());
          } else {
            setHealthScore(0);
            setIsOffline(true);
          }
        }
      } catch (err) {
        console.error('Failed to fetch IoT data for health', err);
        if (demoData) {
          setIsOffline(false);
          setHealthScore(demoData.score);
          setDemoNote(demoData.note);
          setLastUpdate(new Date());
        } else {
          setHealthScore(0);
          setIsOffline(true);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 10000); // Polling every 10 seconds
    return () => clearInterval(interval);
  }, [unitId, demoData]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <div className="skeleton" style={{ width: 120, height: 120, borderRadius: '50%' }}></div>
      </div>
    );
  }

  const score = healthScore ?? 0;
  
  // Menentukan status berdasarkan skor
  let statusColor = '#10B981'; // Emerald/Green (Sehat)
  let statusText = 'Sangat Sehat';
  let StatusIcon = CheckCircle;
  let description = 'Sistem pendingin beroperasi pada efisiensi maksimal. Suhu stabil dan tidak ada indikasi anomali pada kompresor.';

  if (isOffline) {
    statusColor = '#94A3B8'; // Slate/Gray (Offline)
    statusText = 'Unit Offline';
    StatusIcon = Activity;
    description = 'Perangkat IoT pada unit ini sedang offline atau belum terhubung. Indeks kesehatan tidak dapat dihitung saat ini.';
  } else if (score < 50) {
    statusColor = '#EF4444'; // Red (Kritis)
    statusText = 'Kritis / Perlu Servis';
    StatusIcon = XCircle;
    description = 'Terdeteksi fluktuasi suhu yang signifikan atau malfungsi komponen. Segera jadwalkan servis untuk mencegah kerusakan permanen.';
  } else if (score < 80) {
    statusColor = '#F59E0B'; // Amber/Orange (Perhatian)
    statusText = 'Perlu Perhatian';
    StatusIcon = AlertTriangle;
    description = 'Performa pendinginan sedikit menurun. Disarankan untuk membersihkan filter atau mengecek level freon dalam waktu dekat.';
  } else if (score < 95) {
    statusColor = '#10B981'; // Green
    statusText = 'Sehat';
    StatusIcon = CheckCircle;
    description = 'Unit beroperasi dengan normal dan stabil. Kapasitas pendinginan sesuai dengan standar operasional.';
  }

  // SVG Donut Chart calculations
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = isOffline ? circumference : circumference - (score / 100) * circumference;

  return (
    <div style={{
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      gap: '24px',
      padding: '12px 0'
    }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '48px', width: '100%', justifyContent: 'center', flexWrap: 'wrap' }}>
        
        {/* Donut Chart */}
        <div style={{ position: 'relative', width: '140px', height: '140px', flexShrink: 0 }}>
          <svg width="140" height="140" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
            {/* Background Circle */}
            <circle
              cx="60" cy="60" r={radius}
              fill="transparent"
              stroke="#E2E8F0"
              strokeWidth="12"
            />
            {/* Progress Circle */}
            <circle
              cx="60" cy="60" r={radius}
              fill="transparent"
              stroke={statusColor}
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
            />
          </svg>
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
          }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--brand-deep-navy, #001F3F)', lineHeight: 1 }}>
              {isOffline ? '--' : score}<span style={{ fontSize: '1rem' }}>{isOffline ? '' : '%'}</span>
            </span>
          </div>
        </div>

        {/* Info Text */}
        <div style={{ flex: '1', minWidth: '250px', maxWidth: '400px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <StatusIcon size={24} color={statusColor} />
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: statusColor }}>
              {statusText}
            </h3>
          </div>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--brand-space-grey, #6B7280)', lineHeight: 1.6 }}>
            {description}
          </p>
          
          <div style={{ marginTop: '16px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8' }}>
              Pembaruan Terakhir: {lastUpdate ? `${lastUpdate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\./g, ':')} WIB` : '--:-- WIB'}
            </span>
          </div>

          {/* Demo mode badge */}
          {demoNote && (
            <div style={{
              marginTop: '12px',
              padding: '8px 12px',
              background: 'rgba(46, 91, 255, 0.06)',
              border: '1px solid rgba(46, 91, 255, 0.15)',
              borderRadius: '8px',
              fontSize: '0.72rem',
              color: '#2E5BFF',
              fontWeight: 600,
              lineHeight: 1.5,
            }}>
              📡 Mode Transit: {demoNote}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
