'use client';

import { MessageSquare } from 'lucide-react';
import styles from '../ClientPortal.module.css';

export default function ClientMessages() {
  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Pesan & Laporan</h1>
        <p className={styles.pageDescription}>Pusat notifikasi dan laporan servis untuk armada Anda.</p>
      </div>

      <div className={styles.card} style={{ padding: '64px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
          <MessageSquare size={40} />
        </div>
        <h2 style={{ color: '#0f172a', fontSize: '1.5rem', marginBottom: '12px' }}>Inbox Kosong</h2>
        <p style={{ color: '#64748b', maxWidth: '400px', lineHeight: 1.6 }}>
          Saat ini belum ada pesan, laporan dari teknisi, atau notifikasi servis untuk unit Anda. Segala pemberitahuan akan muncul di sini.
        </p>
      </div>
    </div>
  );
}
