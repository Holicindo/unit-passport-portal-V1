'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { serviceLogApi, partnerApi, unitApi } from '@/lib/api';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Search, Loader2, ArrowLeft, ClipboardCheck, Edit3 } from 'lucide-react';
import ServiceDetailModal from '../components/ServiceDetailModal';
import { parseIssueDescription, formatDate } from '../utils';
import styles from '../service.module.css';

export default function ServiceEvaluationPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDetailLog, setSelectedDetailLog] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logsRes, partnersRes] = await Promise.all([
        serviceLogApi.findAll(),
        partnerApi.findAll(),
      ]);
      setLogs(logsRes.data || []);
      setPartners(partnersRes.data || []);
    } catch {
      setError('Gagal memuat data evaluasi servis.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Hanya ambil yang sudah COMPLETED untuk evaluasi
  const completedLogs = logs.filter(log => log.status === 'COMPLETED');

  // Filter tambahan (pencarian)
  const filteredLogs = completedLogs.filter(log => {
    const q = searchQuery.toLowerCase();
    return [
      log.call_id, 
      log.unit?.serial_number, 
      log.unit?.model_name, 
      log.technician_name,
      log.action_taken,
      log.planning_notes
    ].some(v => v?.toLowerCase().includes(q));
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className={styles.container}>
      <header className={styles.pageHeader}>
        <div className={styles.titleSection}>
          <button onClick={() => router.push('/service')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--color-space-grey)', cursor: 'pointer', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 700 }}>
            <ArrowLeft size={16} /><span>Kembali ke Log Servis</span>
          </button>
          <h2 className={styles.title}>Evaluasi & Follow-up</h2>
          <p className={styles.subtitle}>Review tiket servis yang sudah selesai, beri catatan evaluasi, atau rencana follow-up.</p>
        </div>
      </header>

      <div className="mobile-sub-tabs">
        <button className="mobile-sub-tab" onClick={() => router.push('/service')}>Log Servis</button>
        <button className="mobile-sub-tab" onClick={() => router.push('/service/planning')}>Pengaturan Jadwal</button>
        <button className="mobile-sub-tab active" onClick={() => router.push('/service/evaluation')}>Evaluasi Servis</button>
      </div>

      <div className="dtToolbar">
        <div className="dtToolbarLeft">
          <div className="dtToolbarText" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: 'var(--color-deep-navy)' }}>
            <ClipboardCheck size={18} color="var(--color-success)" />
            {filteredLogs.length} Tiket Selesai
          </div>
        </div>
        <div className="dtToolbarRight">
          <div className="dtToolbarSearch">
            <input type="text" placeholder="Cari tiket selesai..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)} className="dtToolbarSearchInput" />
            <Search size={16} className="dtToolbarSearchIcon" />
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Loader2 size={36} className={styles.spin} style={{ color: 'var(--color-cobalt-blue)' }} />
        </div>
      ) : error ? (
        <div className={styles.errorAlert}>{error}</div>
      ) : (
        <div className={styles.dtContainer}>
          <table className={styles.dtTable}>
            <thead>
              <tr>
                <th style={{ width: '15%' }}>Call ID / Tgl Selesai</th>
                <th style={{ width: '15%' }}>Unit & Teknisi</th>
                <th style={{ width: '25%' }}>Tindakan Servis (Teknisi)</th>
                <th style={{ width: '35%' }}>Evaluasi / Follow-up Internal</th>
                <th style={{ width: '10%' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: 'var(--color-space-grey)' }}>
                    Tidak ada tiket servis yang berstatus selesai.
                  </td>
                </tr>
              ) : filteredLogs.map((log) => {
                const cid = log.call_id || log.id;
                return (
                  <tr key={log.id} onClick={() => setSelectedDetailLog(log)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div style={{ fontWeight: 800, color: 'var(--color-deep-navy)' }}>{cid}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-space-grey)', marginTop: '4px' }}>
                        {formatDate(log.service_date)}
                      </div>
                    </td>
                    <td>
                      <div className={styles.unitLink} onClick={(e) => { e.stopPropagation(); router.push(`/id/${log.unit?.qr_token}`); }}>
                        <span className={styles.unitModel}>{log.unit?.model_name || '-'}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-space-grey)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{log.technician_name || '-'}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-deep-navy)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {log.action_taken || '-'}
                      </div>
                    </td>
                    <td>
                      {log.planning_notes ? (
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-space-grey)', backgroundColor: '#F8FAFC', padding: '8px 12px', borderRadius: '8px', borderLeft: '3px solid var(--color-cobalt-blue)', fontStyle: 'italic' }}>
                          {log.planning_notes}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>Belum ada evaluasi / follow-up.</span>
                      )}
                    </td>
                    <td>
                      <button className={styles.expandBtn} style={{ background: 'var(--color-cobalt-blue)', color: 'white', padding: '6px 12px', width: 'auto', borderRadius: '6px', fontSize: '0.75rem' }}>
                        <Edit3 size={14} style={{ marginRight: '4px' }} /> Catatan
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedDetailLog && (
        <ServiceDetailModal
          log={selectedDetailLog} partners={partners}
          onClose={() => setSelectedDetailLog(null)}
          onUpdate={async (updated) => { await fetchData(); setSelectedDetailLog(null); }}
          submitting={submitting} setSubmitting={setSubmitting}
        />
      )}
    </div>
  );
}
