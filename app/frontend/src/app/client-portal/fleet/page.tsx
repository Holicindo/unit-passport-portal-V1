'use client';

import { useState, useEffect } from 'react';
import { unitApi } from '@/lib/api';
import Link from 'next/link';
import { Search, Eye } from 'lucide-react';
import styles from '../ClientPortal.module.css';

export default function ClientFleet() {
  const [fleet, setFleet] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

  const filteredFleet = fleet.filter(u => 
    u.serial_number?.toLowerCase().includes(search.toLowerCase()) || 
    u.model_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.specs?.city?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>My Fleet</h1>
        <p className={styles.pageDescription}>Kelola dan pantau seluruh unit mesin di semua lokasi Anda.</p>
      </div>

      <div className={styles.card}>
        <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Cari serial number, model, atau kota..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '12px 16px 12px 42px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none' }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>Memuat data fleet...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '16px 24px', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>SERIAL NUMBER</th>
                  <th style={{ padding: '16px 24px', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>MODEL</th>
                  <th style={{ padding: '16px 24px', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>LOKASI / KOTA</th>
                  <th style={{ padding: '16px 24px', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>TANGGAL INSTALL</th>
                  <th style={{ padding: '16px 24px', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>STATUS</th>
                  <th style={{ padding: '16px 24px', color: '#64748b', fontSize: '0.85rem', fontWeight: 600, textAlign: 'right' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {filteredFleet.map(unit => (
                  <tr key={unit.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px 24px', fontWeight: 700, color: '#0f172a' }}>{unit.serial_number}</td>
                    <td style={{ padding: '16px 24px', color: '#475569' }}>{unit.model_name}</td>
                    <td style={{ padding: '16px 24px', color: '#475569' }}>{unit.specs?.city || '-'}</td>
                    <td style={{ padding: '16px 24px', color: '#475569' }}>
                      {unit.manufacturing_date ? new Date(unit.manufacturing_date).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ 
                        padding: '6px 12px', 
                        borderRadius: '20px', 
                        fontSize: '0.75rem', 
                        fontWeight: 700,
                        background: unit.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                        color: unit.status === 'ACTIVE' ? '#10b981' : '#f59e0b'
                      }}>
                        {unit.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <Link href={`/client-portal/units/${unit.id}`} style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        padding: '8px 16px', 
                        background: '#f1f5f9', 
                        color: '#3b82f6', 
                        borderRadius: '6px', 
                        textDecoration: 'none',
                        fontWeight: 600,
                        fontSize: '0.85rem'
                      }}>
                        <Eye size={16} /> Detail
                      </Link>
                    </td>
                  </tr>
                ))}
                {filteredFleet.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
                      Tidak ada data unit yang sesuai.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
