'use client';

import { Wrench } from 'lucide-react';
import styles from '../id.module.css';

interface ServiceHistorySectionProps {
  serviceLogs: any[];
}

export default function ServiceHistorySection({ serviceLogs }: ServiceHistorySectionProps) {
  const sorted = [...(serviceLogs || [])].sort(
    (a, b) => new Date(b.service_date || 0).getTime() - new Date(a.service_date || 0).getTime()
  );

  return (
    <section className={styles.sectionCard} style={{ marginTop: '40px', marginBottom: '40px' }}>
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderLeft}>
          <Wrench size={16} color="#8bb2ff" />
          <h2>Riwayat Servis</h2>
        </div>
      </div>
      <div className={styles.cardContent} style={{ padding: '24px' }}>
        {sorted.length === 0 ? (
          <div className={styles.emptyState}>
            <Wrench size={40} style={{ marginBottom: '16px', color: '#8f9bb3', opacity: 0.6 }} />
            <p style={{ color: '#8f9bb3', textAlign: 'center' }}>Belum ada riwayat servis</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sorted.map((log: any, idx: number) => (
              <div key={log.id || idx} style={{
                display: 'flex', flexDirection: 'column', gap: '6px', padding: '16px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <span className={styles.historyDate}>
                    {log.service_date
                      ? new Date(log.service_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
                      : '—'}
                  </span>
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: '999px',
                    background: log.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: log.status === 'COMPLETED' ? '#10b981' : '#f59e0b',
                    border: `1px solid ${log.status === 'COMPLETED' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
                  }}>
                    {log.status === 'COMPLETED' ? 'SELESAI' : 'PENDING'}
                  </span>
                </div>
                <div className={styles.historyTech}>Teknisi: {log.technician_name || '—'}</div>
                {(log.action_taken || log.notes) && (
                  <div className={styles.historyNotes}>
                    {(log.action_taken || log.notes || '').slice(0, 80)}
                    {(log.action_taken || log.notes || '').length > 80 ? '…' : ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
