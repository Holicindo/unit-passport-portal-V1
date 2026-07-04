'use client';

import { Wrench } from 'lucide-react';
import styles from '../id.module.css';

interface ServiceHistorySectionProps {
  serviceLogs: any[];
}

const TASK_LABEL: Record<string, string> = { CORRECTIVE: 'Perbaikan', PREVENTIVE: 'Perawatan', INSTALLATION: 'Instalasi' };
const TASK_COLOR: Record<string, { bg: string; color: string }> = {
  CORRECTIVE: { bg: 'rgba(255,87,34,0.15)', color: '#FF5722' },
  PREVENTIVE: { bg: 'var(--task-preventive-bg, rgba(0,71,171,0.15))', color: 'var(--color-cobalt-blue)' },
  INSTALLATION: { bg: 'rgba(16,185,129,0.15)', color: 'var(--color-success)' },
};

export default function ServiceHistorySection({ serviceLogs }: ServiceHistorySectionProps) {
  // Reverse chronological order — paling baru di atas
  const sorted = [...(serviceLogs || [])].sort(
    (a, b) => new Date(b.created_at || b.service_date || 0).getTime() - new Date(a.created_at || a.service_date || 0).getTime()
  );

  return (
    <section className={styles.sectionPanel}>
      <div className={styles.panelHeader}>
        <div className={styles.panelHeaderLeft}>
          <Wrench size={16} color="var(--color-cobalt-blue)" />
          <h2>Riwayat Servis</h2>
        </div>
      </div>
      <div className={styles.panelContent} style={{ padding: '24px' }}>
        {sorted.length === 0 ? (
          <div className={styles.emptyState}>
            <Wrench size={40} style={{ marginBottom: '16px', color: 'var(--color-space-grey)', opacity: 0.6 }} />
            <p style={{ color: 'var(--color-space-grey)', textAlign: 'center' }}>Belum ada riwayat servis</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sorted.map((log: any, idx: number) => {
              const taskType = log.task_type || 'CORRECTIVE';
              const tc = TASK_COLOR[taskType] || TASK_COLOR.CORRECTIVE;
              return (
                <div key={log.id || idx} className={styles.historyItem}>
                  {/* Row 1: Call ID, Jenis, Tanggal, Status */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span className={styles.historyCallId}>{log.call_id || log.id}</span>
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
                        <span style={{ fontSize: '0.68rem', color: 'var(--color-cobalt-blue)', fontWeight: 600 }}>
                          Jadwal: {new Date(log.scheduled_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <span className={`${styles.statusBadge} ${
                      log.status === 'COMPLETED' ? styles.statusCompleted :
                      log.status === 'IN PROGRESS' ? styles.statusInProgress :
                      log.status === 'CANCELED' ? styles.statusCanceled :
                      styles.statusPending
                    }`}>
                      {log.status}
                    </span>
                  </div>

                  {/* Row 2: Teknisi & Delivery Date */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <div className={styles.historyTech}>Teknisi: {log.technician_name || '—'}</div>
                    {log.delivery_date && (
                      <span style={{ fontSize: '0.68rem', color: 'var(--color-success)', fontWeight: 600 }}>
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
                    <div className={styles.planningNotes}>
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
