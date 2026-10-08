'use client';

import { useState } from 'react';
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

  const [showAll, setShowAll] = useState(false);
  const displayedLogs = showAll ? sorted : sorted.slice(0, 3);

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div className={styles.panelHeaderLeft}>
          <Wrench size={16} color="#60a5fa" />
          <h2>Riwayat Servis</h2>
        </div>
      </div>
      <div className={styles.panelContent} style={{ padding: '20px' }}>
        {sorted.length === 0 ? (
          <div className={styles.emptyState}>
            <Wrench size={40} style={{ marginBottom: '16px', color: '#94a3b8', opacity: 0.6 }} />
            <p style={{ color: '#94a3b8', textAlign: 'center' }}>Belum ada riwayat servis</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {displayedLogs.map((log: any, idx: number) => {
              const taskType = log.task_type || 'CORRECTIVE';
              const tc = TASK_COLOR[taskType] || TASK_COLOR.CORRECTIVE;
              return (
                <div
                  key={log.id || idx}
                  className={styles.historyItem}
                  style={{
                    backgroundColor: 'var(--neu-bg, rgba(8,20,50,0.8))',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '14px',
                    boxShadow: '-3px -3px 8px rgba(255,255,255,0.04), 3px 3px 8px rgba(0,31,63,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  {/* Row 1: Call ID, Jenis, Tanggal, Status */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span className={styles.historyCallId} style={{ color: '#93c5fd', fontWeight: 800 }}>{log.call_id || log.id}</span>
                      <span style={{
                        fontSize: '0.63rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px',
                        background: tc.bg, color: tc.color,
                      }}>
                        {TASK_LABEL[taskType] || taskType}
                      </span>
                      <span className={styles.historyDate} style={{ color: '#cbd5e1' }}>
                        {log.service_date
                          ? new Date(log.service_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
                          : '—'}
                      </span>
                      {log.scheduled_date && log.scheduled_date !== log.service_date && (
                        <span style={{ fontSize: '0.68rem', color: '#60a5fa', fontWeight: 600 }}>
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
                    <div className={styles.historyTech} style={{ color: '#cbd5e1' }}>Teknisi: {log.technician_name || '—'}</div>
                    {log.delivery_date && (
                      <span style={{ fontSize: '0.68rem', color: '#34d399', fontWeight: 600 }}>
                        📦 Delivery: {new Date(log.delivery_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </div>

                  {/* Row 3: Catatan tindakan */}
                  {(log.action_taken || log.notes) && (
                    <div className={styles.historyNotes} style={{ color: '#f1f5f9' }}>
                      {(log.action_taken || log.notes || '').slice(0, 120)}
                      {(log.action_taken || log.notes || '').length > 120 ? '…' : ''}
                    </div>
                  )}

                  {/* Row 4: Planning notes (hanya jika ada) */}
                  {log.planning_notes && (
                    <div className={styles.planningNotes} style={{ color: '#e2e8f0' }}>
                      📋 {log.planning_notes}
                    </div>
                  )}
                </div>
              );
            })}
            
            {!showAll && sorted.length > 3 && (
              <button 
                onClick={() => setShowAll(true)}
                style={{
                  marginTop: '6px', width: '100%', padding: '12px', 
                  background: 'rgba(255, 255, 255, 0.08)', 
                  border: '1px solid rgba(255, 255, 255, 0.12)', 
                  borderRadius: '12px', 
                  color: '#93c5fd', 
                  fontSize: '0.82rem', fontWeight: 700, 
                  cursor: 'pointer', textAlign: 'center',
                  boxShadow: '-2px -2px 5px rgba(255,255,255,0.05), 2px 2px 5px rgba(0,0,0,0.3)',
                  transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                Lihat Semua Riwayat Servis ({sorted.length}) <span>›</span>
              </button>
            )}
            {showAll && sorted.length > 3 && (
              <button 
                onClick={() => setShowAll(false)}
                style={{
                  marginTop: '6px', width: '100%', padding: '12px', 
                  background: 'rgba(255, 255, 255, 0.08)', 
                  border: '1px solid rgba(255, 255, 255, 0.12)', 
                  borderRadius: '12px', 
                  color: '#93c5fd', 
                  fontSize: '0.82rem', fontWeight: 700, 
                  cursor: 'pointer', textAlign: 'center',
                  boxShadow: '-2px -2px 5px rgba(255,255,255,0.05), 2px 2px 5px rgba(0,0,0,0.3)',
                  transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                Sembunyikan <span>‹</span>
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
