'use client';

import { useState, useEffect } from 'react';
import { unitApi } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Box, Droplets, MapPin, Wrench, ShieldCheck, FileText } from 'lucide-react';
import styles from '../../ClientPortal.module.css';

export default function ClientUnitDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [unit, setUnit] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUnit = async () => {
      try {
        const { data } = await unitApi.findOne(id as string);
        setUnit(data);
      } catch (err) {
        console.error('Failed to fetch unit:', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchUnit();
  }, [id]);

  if (loading) {
    return <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>Memuat data unit...</div>;
  }

  if (!unit) {
    return (
      <div style={{ padding: '48px', textAlign: 'center' }}>
        <h2 style={{ color: '#0f172a' }}>Unit Tidak Ditemukan</h2>
        <button onClick={() => router.push('/client-portal/fleet')} style={{ marginTop: '16px', padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          Kembali ke Fleet
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <button 
          onClick={() => router.push('/client-portal/fleet')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 600 }}
        >
          <ArrowLeft size={18} /> Kembali ke Fleet
        </button>
      </div>

      <div className={styles.pageHeader}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className={styles.pageTitle}>{unit.serial_number}</h1>
            <p className={styles.pageDescription}>{unit.model_name}</p>
          </div>
          <span style={{ 
            padding: '6px 16px', 
            borderRadius: '20px', 
            fontSize: '0.85rem', 
            fontWeight: 700,
            background: unit.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
            color: unit.status === 'ACTIVE' ? '#10b981' : '#f59e0b'
          }}>
            {unit.status}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        <div className={styles.card} style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
            <Box size={20} color="#3b82f6" /> Spesifikasi Teknis
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
              <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Dimensi</span>
              <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{unit.specs?.dimension || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
              <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Kapasitas</span>
              <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{unit.specs?.capacity || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
              <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Kompresor</span>
              <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{unit.specs?.compressor || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px' }}>
              <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Suhu Operasional</span>
              <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{unit.specs?.temperature_range || '-'}</span>
            </div>
          </div>
        </div>

        <div className={styles.card} style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
            <MapPin size={20} color="#10b981" /> Detail Penempatan
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
              <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Kota</span>
              <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{unit.specs?.city || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
              <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Refrigeran</span>
              <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{unit.specs?.refrigerant || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px' }}>
              <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Tgl Manufaktur</span>
              <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>
                {unit.manufacturing_date ? new Date(unit.manufacturing_date).toLocaleDateString('id-ID') : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.card} style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
          <Wrench size={20} color="#f59e0b" /> Riwayat Servis
        </h3>
        
        {unit.service_logs && unit.service_logs.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {unit.service_logs.map((log: any) => (
              <div key={log.id} style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>{log.action_taken || log.issue_description}</span>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>{new Date(log.service_date).toLocaleDateString('id-ID')}</span>
                </div>
                <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>{log.issue_description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Teknisi: {log.technician_name}</span>
                  <span style={{ fontSize: '0.75rem', padding: '2px 8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '4px', fontWeight: 700 }}>{log.status}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '32px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '8px' }}>
            Belum ada riwayat servis untuk unit ini.
          </div>
        )}
      </div>
    </div>
  );
}
