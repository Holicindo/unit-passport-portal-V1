'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const userData = localStorage.getItem('user');
        if (userData && userData !== 'undefined' && userData !== 'null') {
          const user = JSON.parse(userData);
          if (user.role === 'CLIENT') {
            router.replace('/client-portal/dashboard');
            return;
          }
          if (user.role === 'PARTNER') {
            router.replace('/partner-portal');
            return;
          }
          router.replace('/dashboard');
          return;
        }
        // If token exists but no valid user data, default to admin dashboard (it will handle its own fail state)
        router.replace('/dashboard');
        return;
      }
    } catch (e) {
      console.error('Error reading auth from localStorage', e);
    }
    
    // Default for unauthenticated users
    router.replace('/login');
  }, [router]);

  // Render nothing while deciding where to route
  return null;
}
