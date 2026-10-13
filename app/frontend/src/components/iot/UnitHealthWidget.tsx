/* Unit Health Widget - Ultra Simple Version */
'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, Phone, Wrench } from 'lucide-react';
import { healthScoreApi } from '@/lib/api';

function getStatusConfig(score: number) {
  if (score >= 80) return {
    label: 'Kondisi Mesin: Prima',
    sublabel: 'Unit beroperasi optimal',
    color: '#10b981',
    borderColor: 'rgba(16,185,129,0.2)',
  };
  if (score >= 60) return {
    label: 'Kondisi Mesin: Perlu Perhatian',
    sublabel: 'Ada indikasi penurunan kinerja',
    color: '#f59e0b',
    borderColor: 'rgba(245,158,11,0.2)',
  };
  return {
    label: 'Kondisi Mesin: Butuh Pemeriksaan',
    sublabel: 'Disarankan segera memanggil teknisi',
    color: '#ef4444',
    borderColor: 'rgba(239,68,68,0.2)',
  };
}

function generateRecommendations(data: any) {
  const recs: string[] = [];
  const score = Number(data.overall_score ?? 0);
  const cabScore = Number(data.sub_cabinet_score ?? 0);
  const elecScore = Number(data.sub_electrical_score ?? 0);
  const doorRec = Number(data.door_avg_recovery_min ?? 0);

  if (score < 60) recs.push('Segera hubungi teknisi untuk pemeriksaan menyeluruh');
  else if (score < 80) recs.push('Pantau kinerja mesin secara berkala');
  else recs.push('Unit dalam kondisi prima, lanjutkan perawatan rutin');

  if (cabScore < 70) recs.push('Periksa seal pintu dan ventilasi untuk suhu stabil');
  if (elecScore < 70) recs.push('Monitor stabilitas tegangan listrik');
  if (doorRec > 15) recs.push('Kurangi frekuensi dan durasi membuka pintu');

  return recs;
}

interface UnitHealthWidgetProps {
  unitId: string;
  serialNumber?: string;
  emergencyWhatsapp?: string;  // e.g., "6281234567890"
  onRequestService?: () => void;  // untuk trigger modal Request Service
  testMode?: boolean;  // Mode testing untuk menampilkan data mock
}

export default function UnitHealthWidget({ 
  unitId, 
  emergencyWhatsapp = "6281234567890",
  onRequestService,
  testMode = false
}: UnitHealthWidgetProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (testMode) {
      // Data mock untuk testing
      setTimeout(() => {
        setData({
          overall_score: 45, // Score kritis untuk menampilkan emergency buttons
          serial_number: unitId || "TEST-001",
          sub_cabinet_score: 65,
          sub_electrical_score: 50,
          door_avg_recovery_min: 20
        });
        setLoading(false);
      }, 500);
      return;
    }
    
    if (!unitId) { setLoading(false); return; }
    healthScoreApi.getByUnitId(unitId)
      .then(r => setData(r.data || null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [unitId, testMode]);

  const handleEmergencyWhatsapp = () => {
    const currentScore = Number(data?.overall_score ?? 0);
    const message = `Halo, saya butuh bantuan teknisi darurat untuk showcase saya. Serial: ${data?.serial_number || unitId}. Skor kesehatan: ${currentScore}/100 (KRITIS).`;
    window.open(`https://wa.me/${emergencyWhatsapp}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleServiceRequest = () => {
    if (onRequestService) {
      onRequestService();
    } else {
      // Fallback jika parent tidak menyediakan handler
      console.warn('onRequestService prop tidak tersedia');
    }
  };

  // EARLY RETURN untuk loading & empty state
  if (loading) return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '24px 16px',
      background: 'rgba(8, 18, 50, 0.6)',
      borderRadius: '12px',
      gap: '10px',
    }}>
      <div style={{ 
        width: '16px',
        height: '16px',
        border: '2px solid rgba(16,185,129,0.2)',
        borderTopColor: '#10b981',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Memuat...</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!data?.overall_score && data?.overall_score !== 0) return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '12px', 
      padding: '16px',
      background: 'rgba(8, 18, 50, 0.6)',
      borderRadius: '12px',
    }}>
      <WifiOff size={16} color="#94A3B8" />
      <div>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f1f5f9' }}>
          Data belum tersedia
        </div>
        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
          Analisis berjalan setiap jam
        </div>
      </div>
    </div>
  );

  const score = Number(data.overall_score ?? 0);
  const status = getStatusConfig(score);
  
  const cabScore = Number(data.sub_cabinet_score ?? 0);
  const elecScore = Number(data.sub_electrical_score ?? 0);
  const doorRec = Number(data.door_avg_recovery_min ?? 0);

  const cabGood = cabScore >= 75;
  const elecGood = elecScore >= 75;
  const doorGood = doorRec < 12;

  const recommendations = generateRecommendations(data);
  const severity: 'good' | 'warning' | 'critical' = score >= 80 ? 'good' : score >= 60 ? 'warning' : 'critical';

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '10px',
      padding: '12px',
      background: 'rgba(8, 18, 50, 0.7)',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.05)',
      width: '100%',
      boxSizing: 'border-box',
    }}>
      
      {/* SCORE SECTION */}
      <div style={{
        background: 'rgba(8, 18, 50, 0.9)',
        border: `1.5px solid ${status.borderColor}`,
        borderRadius: '10px',
        padding: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <div style={{ position: 'relative', width: '60px', height: '60px', flexShrink: 0 }}>
          <svg width="60" height="60" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="30" cy="30" r="24" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="6" />
            <circle cx="30" cy="30" r="24" fill="none" stroke={status.color} strokeWidth="6"
              strokeLinecap="round" strokeDasharray={150.8} strokeDashoffset={150.8 - (score / 100) * 150.8} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 900, color: status.color, fontFamily: 'monospace' }}>
              {Math.round(score)}
            </span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 900, color: status.color, lineHeight: 1.2 }}>
            {status.label}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px', lineHeight: 1.3 }}>
            {status.sublabel}
          </div>
        </div>
      </div>

      {/* STATUS CARDS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {[
          { title: 'Suhu Kabinet', good: cabGood, desc: cabGood ? 'Suhu stabil' : 'Periksa stabilitas' },
          { title: 'Kelistrikan', good: elecGood, desc: elecGood ? 'Konsumsi normal' : 'Monitor listrik' },
          { title: 'Pintu', good: doorGood, desc: doorGood ? 'Pola baik' : 'Kurangi buka-tutup' },
        ].map(({ title, good, desc }, idx) => (
          <div key={idx} style={{ 
            background: 'rgba(8, 18, 50, 0.9)',
            border: `1px solid ${good ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)'}`,
            borderRadius: '8px',
            padding: '10px 12px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f1f5f9' }}>{title}</span>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: good ? '#10b981' : '#f59e0b' }}>
                {good ? 'Baik' : 'Perhatian'}
              </span>
            </div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px' }}>{desc}</div>
          </div>
        ))}
      </div>

      {/* RECOMMENDATIONS */}
      <div style={{ 
        background: 'rgba(8, 18, 50, 0.9)',
        border: `1px solid ${severity === 'good' ? 'rgba(16,185,129,0.15)' : severity === 'warning' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)'}`,
        borderRadius: '10px',
        padding: '12px 14px',
      }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: severity === 'good' ? '#10b981' : severity === 'warning' ? '#f59e0b' : '#ef4444', marginBottom: '6px' }}>
          {severity === 'good' ? 'Saran' : severity === 'warning' ? 'Perhatian' : 'Tindakan'}
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {recommendations.slice(0, 2).map((rec, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '5px' }}>
              <span style={{ color: severity === 'good' ? '#10b981' : severity === 'warning' ? '#f59e0b' : '#ef4444', fontSize: '0.7rem' }}>•</span>
              <span style={{ fontSize: '0.72rem', color: '#cbd5e1', lineHeight: 1.3 }}>{rec}</span>
            </div>
          ))}
        </div>

        {/* EMERGENCY BUTTONS - Hanya untuk kondisi KRITIS */}
        {severity === 'critical' && (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '6px',
            marginTop: '12px',
          }}>
            {/* Tombol WA Emergency */}
            <button
              onClick={handleEmergencyWhatsapp}
              style={{
                background: '#ef4444',
                border: 'none',
                borderRadius: '6px',
                padding: '8px',
                color: '#fff',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                width: '100%',
              }}
            >
              <Phone size={12} />
              Hubungi Teknisi Darurat (WA)
            </button>

            {/* Tombol Request Service (Form Holicindo) */}
            <button
              onClick={handleServiceRequest}
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '6px',
                padding: '8px',
                color: '#ef4444',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                width: '100%',
              }}
            >
              <Wrench size={12} />
              Request Servis (Form Holicindo)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}