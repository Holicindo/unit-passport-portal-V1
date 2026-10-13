'use client';

import UnitHealthWidget from '@/components/iot/UnitHealthWidget';
import { useState } from 'react';

export default function TestHealthWidgetPage() {
  const [showModal, setShowModal] = useState(false);
  const [score, setScore] = useState(45);

  const handleRequestService = () => {
    console.log('Request service clicked');
    setShowModal(true);
  };

  const handleEmergencyWhatsapp = () => {
    console.log('Emergency whatsapp clicked');
  };

  return (
    <div style={{ 
      maxWidth: '400px', 
      margin: '40px auto', 
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1>Test UnitHealthWidget</h1>
      <p style={{ marginBottom: '20px', color: '#666' }}>
        Widget ini menampilkan kondisi mesin dengan skor kesehatan dan emergency buttons untuk kondisi kritis.
      </p>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
          Test Score (0-100):
        </label>
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={score} 
          onChange={(e) => setScore(Number(e.target.value))}
          style={{ width: '100%' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
          <span>0 (Kritis)</span>
          <span style={{ fontWeight: 'bold' }}>{score}</span>
          <span>100 (Prima)</span>
        </div>
      </div>

      <div style={{ 
        background: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '12px',
        border: '1px solid #e9ecef'
      }}>
        <UnitHealthWidget 
          unitId="TEST-001"
          testMode={true}
          onRequestService={handleRequestService}
          emergencyWhatsapp="6281234567890"
        />
      </div>

      <div style={{ marginTop: '30px', fontSize: '0.9rem', color: '#6c757d' }}>
        <h3>Catatan Testing:</h3>
        <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
          <li>Emergency buttons hanya muncul saat score &lt; 60 (kondisi kritis)</li>
          <li>Score 0-59: Kritis (merah) - muncul emergency buttons</li>
          <li>Score 60-79: Perhatian (kuning)</li>
          <li>Score 80-100: Baik (hijau)</li>
          <li>Widget sudah menghapus semua emoji dan icon tidak penting</li>
          <li>Layout responsif dengan width: 100%</li>
        </ul>
      </div>

      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3>Modal Request Service</h3>
            <p>Ini adalah modal test untuk request service.</p>
            <button 
              onClick={() => setShowModal(false)}
              style={{
                background: '#007bff',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '10px'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}