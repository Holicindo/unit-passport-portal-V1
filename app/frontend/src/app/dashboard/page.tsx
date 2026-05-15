'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const StatsGrid = dynamic(() => import('@/components/dashboard/StatsGrid'), {
  loading: () => <div style={{ height: '140px', background: '#f9f9f9', borderRadius: '16px' }}></div>,
  ssr: false
});

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
  }, []);

  return (
    <div>
      <header style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.8rem', color: 'var(--color-deep-navy)' }}>
          Welcome back, {user?.name || 'User'}
        </h2>
        <p style={{ color: 'var(--color-space-grey)' }}>Here is an overview of your fleet and service status.</p>
      </header>

      <StatsGrid />
    </div>
  );
}
