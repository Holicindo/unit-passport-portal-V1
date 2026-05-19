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
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Selamat Pagi' : hour < 17 ? 'Selamat Siang' : 'Selamat Malam';

  return (
    <div>
      <header style={{ marginBottom: '40px' }}>
        <p style={{
          fontSize: '0.8rem',
          fontWeight: 700,
          color: 'var(--color-cobalt-blue)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: '8px',
        }}>
          {now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 800,
          color: 'var(--color-deep-navy)',
          letterSpacing: '-0.03em',
          marginBottom: '8px',
          lineHeight: 1.2,
        }}>
          {greeting}, {user?.name?.split(' ')[0] || 'User'} 👋
        </h1>
        <p style={{ color: 'var(--color-space-grey)', fontSize: '0.95rem' }}>
          Berikut ringkasan armada dan status layanan aktif Anda.
        </p>
      </header>

      <StatsGrid />
    </div>
  );
}
