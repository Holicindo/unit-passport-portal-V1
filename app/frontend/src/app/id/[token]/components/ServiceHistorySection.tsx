'use client';

import { Wrench } from 'lucide-react';
import styles from '../id.module.css';

interface ServiceHistorySectionProps {
  serviceLogs: any[];
}

const TASK_LABEL: Record<string, string> = { CORRECTIVE: 'Perbaikan', PREVENTIVE: 'Perawatan', INSTALLATION: 'Instalasi' };
const TASK_COLOR: Record<string, { bg: string; color: string }> = {
  CORRECTIVE: { bg: 'rgba(255,87,34,0.15)', color: '#FF5722' },
  PREVENTIVE: { bg: 'rgba(0,71,171,0.15)', color: '#8bb2ff' },
  INSTALLATION: { bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
};

export default function ServiceHistorySection({ serviceLogs }: ServiceHistorySectionProps) {
  // Reverse chronological order — paling baru di atas
  const sorted = [...(serviceLogs || [])].sort(
    (a, b) => new Date(b.created_at || b.service_date || 0).getTime() - new Date(a.created_at || a.service_date || 0).getTime()
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
            {sorted.map((log: any, idx: number) => {
              const taskType = log.task_type || 'CORRECTIVE';
              const tc = TASK_COLOR[taskType] || TASK_COLOR.CORRECTIVE;
              return (
                <div key={log.id || idx} style={{
                  display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px',
                }}>
                  {/* Row 1: Call ID, Jenis, Tanggal, Status */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#8bb2ff' }}>{log.call_id || log.id}</span>
                      <span style={{
                        fontSize: '0.63rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px',
                        background: tc.bg, color: tc.color,
                      }}>
                        {TASK_LABEL[taskType] || taskType}
                      </span>
                      <span className={styles.historyDate}>
                        {log.service_date
                          ? new Date(log.service_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
                          : '—'}
                      </span>
                      {log.scheduled_date && log.scheduled_date !== log.service_date && (
                        <span style={{ fontSize: '0.68rem', color: '#8bb2ff', fontWeight: 600 }}>
                          Jadwal: {new Date(log.scheduled_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: '999px',
                      background: log.status === 'COMPLETED' ? 'rgba(10, 25, 47, 0.2)' : log.status === 'IN PROGRESS' ? 'rgba(0, 71, 171, 0.2)' : log.status === 'CANCELED' ? 'rgba(113, 115, 120, 0.2)' : 'rgba(255, 87, 34, 0.2)',
                      color: log.status === 'COMPLETED' ? '#e2e8f0' : log.status === 'IN PROGRESS' ? '#60a5fa' : log.status === 'CANCELED' ? '#94a3b8' : '#FF5722',
                      border: `1px solid ${log.status === 'COMPLETED' ? 'rgba(10, 25, 47, 0.4)' : log.status === 'IN PROGRESS' ? 'rgba(0, 71, 171, 0.4)' : log.status === 'CANCELED' ? 'rgba(113, 115, 120, 0.4)' : 'rgba(255, 87, 34, 0.4)'}`,
                    }}>
                      {log.status}
                    </span>
                  </div>

                  {/* Row 2: Teknisi & Delivery Date */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <div className={styles.historyTech}>Teknisi: {log.technician_name || '—'}</div>
                    {log.delivery_date && (
                      <span style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 600 }}>
                        📦 Delivery: {new Date(log.delivery_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </div>

                  {/* Row 3: Catatan tindakan */}
                  {(log.action_taken || log.notes) && (
                    <div className={styles.historyNotes}>
                      {(log.action_taken || log.notes || '').slice(0, 120)}
                      {(log.action_taken || log.notes || '').length > 120 ? '…' : ''}
                    </div>
                  )}

                  {/* Row 4: Planning notes (hanya jika ada) */}
                  {log.planning_notes && (
                    <div style={{
                      fontSize: '0.7rem', color: '#8f9bb3', fontStyle: 'italic',
                      padding: '6px 8px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px',
                      border: '1px dashed rgba(255,255,255,0.1)',
                    }}>
                      📋 {log.planning_notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
