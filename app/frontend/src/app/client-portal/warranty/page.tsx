'use client';

import { useState, useEffect } from 'react';
import { unitApi } from '@/lib/api';
import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';
import styles from '../ClientPortal.module.css';

export default function ClientWarranty() {
  const [fleet, setFleet] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFleet = async () => {
      try {
        const { data } = await unitApi.findMyFleet();
        setFleet(data);
      } catch (err) {
        console.error('Failed to fetch fleet:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFleet();
  }, []);

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Status Garansi</h1>
        <p className={styles.pageDescription}>Pantau masa berlaku garansi unit Anda.</p>
      </div>

      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>Memuat data garansi...</div>
      ) : (
        <div className={styles.card}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '16px 24px', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>SERIAL NUMBER</th>
                  <th style={{ padding: '16px 24px', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>MODEL</th>
                  <th style={{ padding: '16px 24px', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>STATUS GARANSI</th>
                  <th style={{ padding: '16px 24px', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>PERKIRAAN HABIS</th>
                </tr>
              </thead>
              <tbody>
                {fleet.map(unit => {
                  // Simplified warranty logic based on manufacturing date + 1 year
                  let isExpired = false;
                  let expiryDate = '-';
                  if (unit.manufacturing_date) {
                    const mfgDate = new Date(unit.manufacturing_date);
                    const expDate = new Date(mfgDate.setFullYear(mfgDate.getFullYear() + 1));
                    expiryDate = expDate.toLocaleDateString('id-ID');
                    isExpired = expDate < new Date();
                  }

                  return (
                    <tr key={unit.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px 24px', fontWeight: 700, color: '#0f172a' }}>{unit.serial_number}</td>
                      <td style={{ padding: '16px 24px', color: '#475569' }}>{unit.model_name}</td>
                      <td style={{ padding: '16px 24px' }}>
                        {isExpired ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontSize: '0.85rem', fontWeight: 600 }}>
                            <AlertTriangle size={16} /> Habis / Tidak Aktif
                          </span>
                        ) : (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>
                            <ShieldCheck size={16} /> Aktif (1 Tahun)
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '16px 24px', color: '#475569', fontWeight: 600 }}>
                        {expiryDate}
                      </td>
                    </tr>
                  );
                })}
                {fleet.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
                      Tidak ada data garansi.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
