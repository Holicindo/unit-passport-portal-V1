'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const StatsGrid = dynamic(() => import('@/components/dashboard/StatsGrid'), {
  loading: () => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '24px',
    }}>
      {[1,2,3,4].map(i => (
        <div key={i} style={{
          height: '120px',
          borderRadius: '20px',
          background: 'rgba(255,255,255,0.5)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.4)',
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
      ))}
    </div>
  ),
  ssr: false
});

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
  }, []);

  const now = new Date();
  
  return (
    <div style={{ animation: 'fadeIn 0.5s ease', paddingTop: '40px' }}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-end',
        marginBottom: '32px',
        borderBottom: '1px solid rgba(0, 31, 63, 0.1)',
        paddingBottom: '20px'
      }}>
        <h1 style={{
          fontSize: '1.8rem',
          fontWeight: 800,
          color: 'var(--color-space-grey)',
          fontFamily: 'var(--font-heading)',
          letterSpacing: '-0.02em',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          Ringkasan Armada
        </h1>
        <p style={{
          fontSize: '0.85rem',
          color: 'var(--color-space-grey)',
          fontWeight: 500,
        }}>
          Terakhir diperbarui: {now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </header>
      
      <StatsGrid />
      
      {/* Dashboard Bottom Section */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '2fr 1fr', 
        gap: '24px', 
        marginTop: '24px' 
      }}>
        {/* Chart Section */}
        <div style={{
          background: 'var(--color-optic-white)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(113, 115, 120, 0.15)',
          padding: '24px',
          boxShadow: '0 8px 30px rgba(113, 115, 120, 0.08)',
          minHeight: '400px'
        }}>
          <h3 style={{ 
            fontSize: '1.1rem', 
            color: 'var(--color-space-grey)', 
            marginBottom: '24px',
            fontFamily: 'var(--font-heading)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 700
          }}>
            Aktivitas Servis Bulanan
          </h3>
          
          <div style={{
            height: '300px',
            borderLeft: '1px dashed var(--color-space-grey)',
            borderBottom: '1px dashed var(--color-space-grey)',
            position: 'relative',
            display: 'flex',
            alignItems: 'flex-end',
            paddingLeft: '10px',
            gap: '16px',
            opacity: 0.8
          }}>
            {/* Dummy Bars representing chart data */}
            <div style={{ width: '30px', height: '40%', background: 'var(--color-cobalt-blue)', borderRadius: '4px 4px 0 0' }}></div>
            <div style={{ width: '30px', height: '0%', background: 'var(--color-cobalt-blue)', borderRadius: '4px 4px 0 0' }}></div>
            <div style={{ width: '30px', height: '60%', background: 'var(--color-cobalt-blue)', borderRadius: '4px 4px 0 0' }}></div>
            <div style={{ width: '30px', height: '100%', background: 'var(--color-cobalt-blue)', borderRadius: '4px 4px 0 0' }}></div>
            <div style={{ width: '30px', height: '60%', background: 'var(--color-cobalt-blue)', borderRadius: '4px 4px 0 0' }}></div>
            <div style={{ width: '30px', height: '0%', background: 'var(--color-cobalt-blue)', borderRadius: '4px 4px 0 0' }}></div>
            <div style={{ width: '30px', height: '40%', background: 'var(--color-cobalt-blue)', borderRadius: '4px 4px 0 0' }}></div>
          </div>
        </div>

        {/* Lists Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{
            background: 'var(--color-optic-white)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(113, 115, 120, 0.15)',
            padding: '24px',
            boxShadow: '0 8px 30px rgba(113, 115, 120, 0.08)'
          }}>
            <h3 style={{ 
              fontSize: '1rem', 
              color: 'var(--color-space-grey)', 
              marginBottom: '16px',
              fontFamily: 'var(--font-heading)',
              borderBottom: '1px solid rgba(0,0,0,0.05)',
              paddingBottom: '12px',
              fontWeight: 700
            }}>
              Klien Teraktif
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--color-space-grey)', fontSize: '0.9rem' }}>PT Indah Putih</span>
                <span style={{ color: 'var(--color-deep-navy)', fontWeight: 600, fontSize: '0.9rem' }}>14 Unit</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--color-space-grey)', fontSize: '0.9rem' }}>CV Mega Logistik</span>
                <span style={{ color: 'var(--color-deep-navy)', fontWeight: 600, fontSize: '0.9rem' }}>9 Unit</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--color-space-grey)', fontSize: '0.9rem' }}>Mitra Abadi</span>
                <span style={{ color: 'var(--color-deep-navy)', fontWeight: 600, fontSize: '0.9rem' }}>5 Unit</span>
              </div>
            </div>
          </div>

          <div style={{
            background: 'var(--color-optic-white)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(113, 115, 120, 0.15)',
            padding: '24px',
            boxShadow: '0 8px 30px rgba(113, 115, 120, 0.08)'
          }}>
            <h3 style={{ 
              fontSize: '1rem', 
              color: 'var(--color-space-grey)', 
              marginBottom: '16px',
              fontFamily: 'var(--font-heading)',
              borderBottom: '1px solid rgba(0,0,0,0.05)',
              paddingBottom: '12px',
              fontWeight: 700
            }}>
              Unit Sering Servis
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--color-space-grey)', fontSize: '0.9rem' }}>HOLI-CP-001</span>
                <span style={{ color: 'var(--color-safety-orange)', fontWeight: 600, fontSize: '0.9rem' }}>3x</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--color-space-grey)', fontSize: '0.9rem' }}>HOLI-CP-042</span>
                <span style={{ color: 'var(--color-safety-orange)', fontWeight: 600, fontSize: '0.9rem' }}>2x</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
