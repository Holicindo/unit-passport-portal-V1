'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { unitApi } from '@/lib/api';
import { Loader2, ShieldAlert } from 'lucide-react';
import styles from './redirect.module.css';

export default function UnitRedirectPage() {
  const { id } = useParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndRedirect = async () => {
      try {
        const { data } = await unitApi.findOne(id as string);
        if (data && data.qr_token) {
          router.replace(`/id/${data.qr_token}`);
        } else {
          setError('Unit tidak memiliki QR token yang valid.');
        }
      } catch (err: any) {
        console.error('Redirect failed:', err);
        setError('Gagal memuat data Unit Passport dari server.');
      }
    };

    if (id) {
      fetchAndRedirect();
    }
  }, [id, router]);

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorCard}>
          <ShieldAlert size={48} className={styles.errorIcon} />
          <h2>Kesalahan Pengalihan</h2>
          <p>{error}</p>
          <button onClick={() => router.push('/units')} className={styles.btnBack}>
            Kembali ke Daftar Unit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Loader2 className={styles.spinner} size={48} />
      <p>Mengalihkan ke Unit Passport...</p>
    </div>
  );
}
