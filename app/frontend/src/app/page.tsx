'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Sesuai permintaan, kita tidak lagi mengecek token untuk auto-login.
    // Setiap kali root URL (/) dibuka, sesi lama dibersihkan dan user dipaksa login kembali.
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.replace('/login');
  }, [router]);

  return (
    <div style={{ 
      display: 'flex', height: '100vh', width: '100vw', 
      alignItems: 'center', justifyContent: 'center', background: 'var(--color-light-tech-grey)' 
    }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '50%',
        border: '3px solid rgba(0, 31, 63, 0.1)',
        borderTopColor: 'var(--color-cobalt-blue)',
        animation: 'spin 1s linear infinite'
      }} />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
