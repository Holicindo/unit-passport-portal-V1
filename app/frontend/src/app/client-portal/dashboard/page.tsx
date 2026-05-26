'use client';

import { useState, useEffect } from 'react';
import { unitApi } from '@/lib/api';
import { Truck, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import styles from '../ClientPortal.module.css';
import Link from 'next/link';

export default function ClientDashboard() {
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

  const totalUnits = fleet.length;
  const activeUnits = fleet.filter(u => u.status === 'ACTIVE').length;
  const needsMaintenance = fleet.filter(u => u.status === 'MAINTENANCE').length;
  // In a real scenario, warranty logic would check the date.
  const activeWarranty = fleet.length; // placeholder

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Dashboard Fleet</h1>
        <p className={styles.pageDescription}>Ringkasan status seluruh aset mesin Anda di seluruh Indonesia.</p>
      </div>

      {loading ? (
        <p>Memuat data fleet...</p>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
            <div className={styles.card} style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Truck size={28} />
              </div>
              <div>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>TOTAL UNIT</p>
                <h3 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>{totalUnits}</h3>
              </div>
            </div>

            <div className={styles.card} style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={28} />
              </div>
              <div>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>UNIT AKTIF</p>
                <h3 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>{activeUnits}</h3>
              </div>
            </div>

            <div className={styles.card} style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={28} />
              </div>
              <div>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>PERLU SERVIS</p>
                <h3 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>{needsMaintenance}</h3>
              </div>
            </div>

            <div className={styles.card} style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={28} />
              </div>
              <div>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>GARANSI AKTIF</p>
                <h3 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>{activeWarranty}</h3>
              </div>
            </div>
          </div>

          <div className={styles.card} style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Unit Terbaru</h2>
              <Link href="/client-portal/fleet" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>Lihat Semua →</Link>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                    <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.85rem' }}>SERIAL NUMBER</th>
                    <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.85rem' }}>MODEL</th>
                    <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.85rem' }}>LOKASI</th>
                    <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.85rem' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {fleet.slice(0, 5).map(unit => (
                    <tr key={unit.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px', fontWeight: 600 }}>
                        <Link href={`/client-portal/units/${unit.id}`} style={{ color: '#0f172a', textDecoration: 'none' }}>
                          {unit.serial_number}
                        </Link>
                      </td>
                      <td style={{ padding: '16px', color: '#475569' }}>{unit.model_name}</td>
                      <td style={{ padding: '16px', color: '#475569' }}>{unit.specs?.city || '-'}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ 
                          padding: '4px 12px', 
                          borderRadius: '20px', 
                          fontSize: '0.75rem', 
                          fontWeight: 700,
                          background: unit.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          color: unit.status === 'ACTIVE' ? '#10b981' : '#f59e0b'
                        }}>
                          {unit.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {fleet.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                        Belum ada unit yang terdaftar atas nama perusahaan Anda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
