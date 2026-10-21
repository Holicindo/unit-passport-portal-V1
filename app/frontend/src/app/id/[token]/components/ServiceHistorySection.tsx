'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Wrench, Calendar, User, Clock, CheckCircle2, AlertCircle, ChevronDown, 
  ChevronUp, Shield, Package, Check, Phone, ArrowRight, MessageSquare, ExternalLink
} from 'lucide-react';
import styles from '../id.module.css';

interface ServiceHistorySectionProps {
  serviceLogs: any[];
}

const TASK_LABEL: Record<string, string> = { 
  CORRECTIVE: 'Perbaikan', 
  PREVENTIVE: 'Perawatan', 
  INSTALLATION: 'Instalasi' 
};

const TASK_COLOR: Record<string, { bg: string; color: string; border: string }> = {
  CORRECTIVE: { bg: 'rgba(255, 87, 34, 0.12)', color: '#FF5722', border: 'rgba(255, 87, 34, 0.3)' },
  PREVENTIVE: { bg: 'rgba(46, 91, 255, 0.12)', color: '#60a5fa', border: 'rgba(46, 91, 255, 0.3)' },
  INSTALLATION: { bg: 'rgba(16, 185, 129, 0.12)', color: '#34d399', border: 'rgba(16, 185, 129, 0.3)' },
};

function parseIssue(desc: string) {
  if (!desc) return { issue: '-', contact: null };
  const kontakMatch = desc.match(/(.*)\s*\(Kontak:\s*([^-]+)-\s*([^)]+)\)/i);
  if (kontakMatch) {
    return {
      issue: kontakMatch[1].trim(),
      contact: { name: kontakMatch[2].trim(), phone: kontakMatch[3].trim() }
    };
  }
  const legacyMatch = desc.match(/\[Smart Routing Request\]\s*Contact:\s*([^(]+)\(([^)]+)\)\.\s*Issue:\s*(.*)/i);
  if (legacyMatch) {
    return {
      issue: legacyMatch[3].trim(),
      contact: { name: legacyMatch[1].trim(), phone: legacyMatch[2].trim() }
    };
  }
  return { issue: desc, contact: null };
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function ServiceHistorySection({ serviceLogs }: ServiceHistorySectionProps) {
  const router = useRouter();
  const [showAll, setShowAll] = useState(false);
  const [expandedCallIds, setExpandedCallIds] = useState<Record<string, boolean>>({});

  // Group logs by call_id / id sama persis dengan log servis
  const groupedList = React.useMemo(() => {
    const raw = serviceLogs || [];
    const groups: Record<string, any[]> = {};
    raw.forEach(l => {
      const cid = l.call_id || l.id;
      if (!groups[cid]) groups[cid] = [];
      groups[cid].push(l);
    });

    return Object.values(groups).map(list => {
      // Urutkan riwayat sub-kunjungan terlama ke terbaru
      const sortedHistory = [...list].sort(
        (a, b) => new Date(a.created_at || a.service_date || 0).getTime() - new Date(b.created_at || b.service_date || 0).getTime()
      );
      // Main card adalah entri terupdate
      const mainLog = sortedHistory[sortedHistory.length - 1];
      return { cid: mainLog.call_id || mainLog.id, mainLog, history: sortedHistory };
    }).sort((a, b) => {
      const timeA = new Date(a.mainLog.created_at || a.mainLog.service_date || 0).getTime();
      const timeB = new Date(b.mainLog.created_at || b.mainLog.service_date || 0).getTime();
      return timeB - timeA;
    });
  }, [serviceLogs]);

  const displayedGroups = showAll ? groupedList : groupedList.slice(0, 3);

  const toggleExpand = (cid: string) => {
    setExpandedCallIds(prev => ({ ...prev, [cid]: !prev[cid] }));
  };

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div className={styles.panelHeaderLeft}>
          <Wrench size={16} color="#60a5fa" />
          <h2>Riwayat Servis</h2>
        </div>
        {groupedList.length > 0 && (
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 800,
            background: 'rgba(255,255,255,0.08)',
            color: '#93c5fd',
            padding: '2px 8px',
            borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.12)'
          }}>
            {groupedList.length} Tiket
          </span>
        )}
      </div>

      <div className={styles.panelContent} style={{ padding: '16px' }}>
        {groupedList.length === 0 ? (
          <div className={styles.emptyState}>
            <Wrench size={40} style={{ marginBottom: '16px', color: '#94a3b8', opacity: 0.5 }} />
            <p style={{ color: '#94a3b8', textAlign: 'center', fontSize: '0.85rem' }}>Belum ada riwayat servis untuk unit ini</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {displayedGroups.map(({ cid, mainLog, history }) => {
              const taskType = mainLog.task_type || 'CORRECTIVE';
              const tc = TASK_COLOR[taskType] || TASK_COLOR.CORRECTIVE;
              const { issue, contact } = parseIssue(mainLog.issue_description);
              const isExpanded = !!expandedCallIds[cid];
              const isCompleted = mainLog.status === 'COMPLETED';
              const isCanceled = mainLog.status === 'CANCELED' || mainLog.status === 'CANCELLED';
              const spareparts = mainLog.replaced_sparepart ? String(mainLog.replaced_sparepart).split(';').filter(Boolean) : [];

              return (
                <div
                  key={cid}
                  style={{
                    backgroundColor: 'rgba(13, 35, 70, 0.75)',
                    border: isCompleted 
                      ? '1px solid rgba(16, 185, 129, 0.25)' 
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '14px',
                    padding: '14px 16px',
                    boxShadow: '-3px -3px 8px rgba(255,255,255,0.03), 3px 3px 10px rgba(0,0,0,0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    transition: 'border-color 0.2s',
                  }}
                >
                  {/* Row 1: Header Tiket (Call ID, Badge Task, Tanggal, Status) */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => router.push(`/service?call_id=${encodeURIComponent(cid)}`)}
                        title="Buka rincian tiket di Dashboard Log Servis"
                        style={{
                          fontFamily: 'var(--font-heading)',
                          fontWeight: 800,
                          fontSize: '0.82rem',
                          color: '#60a5fa',
                          background: 'rgba(96, 165, 250, 0.14)',
                          border: '1px solid rgba(96, 165, 250, 0.35)',
                          padding: '3px 9px',
                          borderRadius: '6px',
                          letterSpacing: '0.02em',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(96, 165, 250, 0.25)';
                          e.currentTarget.style.borderColor = '#60a5fa';
                          e.currentTarget.style.color = '#ffffff';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'rgba(96, 165, 250, 0.14)';
                          e.currentTarget.style.borderColor = 'rgba(96, 165, 250, 0.35)';
                          e.currentTarget.style.color = '#60a5fa';
                        }}
                      >
                        {cid}
                        <ExternalLink size={11} style={{ opacity: 0.8 }} />
                      </button>

                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: tc.bg,
                        color: tc.color,
                        border: `1px solid ${tc.border}`,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}>
                        {TASK_LABEL[taskType] || taskType}
                      </span>

                      <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} /> {formatDate(mainLog.service_date || mainLog.created_at)}
                      </span>
                    </div>

                    {/* Status Badge */}
                    {isCompleted ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#34d399',
                        border: '1px solid rgba(16, 185, 129, 0.35)',
                        borderRadius: '20px',
                        padding: '3px 10px',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                      }}>
                        <CheckCircle2 size={11} /> SELESAI
                      </span>
                    ) : isCanceled ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#f87171',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        borderRadius: '20px',
                        padding: '3px 10px',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                      }}>
                        BATAL
                      </span>
                    ) : (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: mainLog.status === 'PENDING' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                        color: mainLog.status === 'PENDING' ? '#fbbf24' : '#60a5fa',
                        border: mainLog.status === 'PENDING' ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(59, 130, 246, 0.35)',
                        borderRadius: '20px',
                        padding: '3px 10px',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                      }}>
                        <Clock size={11} /> {mainLog.status}
                      </span>
                    )}
                  </div>

                  {/* Row 2: Teknisi & Tanggal Jadwal/Delivery */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', fontSize: '0.74rem', color: '#cbd5e1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <User size={13} style={{ color: '#94a3b8' }} />
                      <span>Teknisi: <strong style={{ color: '#fff' }}>{mainLog.technician_name || 'Menunggu Alokasi'}</strong></span>
                    </div>

                    {mainLog.scheduled_date && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#93c5fd' }}>
                        <Clock size={12} />
                        <span>Jadwal: {formatDate(mainLog.scheduled_date)}</span>
                      </div>
                    )}

                    {mainLog.delivery_date && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#34d399' }}>
                        <span>📦 Delivery: {formatDate(mainLog.delivery_date)}</span>
                      </div>
                    )}
                  </div>

                  {/* Row 3: Kendala / Issue */}
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '0.78rem',
                    color: '#e2e8f0',
                    lineHeight: 1.45,
                  }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#f59e0b', display: 'block', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      KENDALA (ISSUE)
                    </span>
                    <div>{issue}</div>
                    {contact && (
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>
                        Pelapor: {contact.name} ({contact.phone})
                      </div>
                    )}
                  </div>

                  {/* Row 4: Handling / Tindakan Teknisi */}
                  {mainLog.action_taken && mainLog.action_taken !== 'Dalam proses pengecekan teknis.' && (
                    <div style={{
                      background: 'rgba(59, 130, 246, 0.08)',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '0.76rem',
                      color: '#dbeafe',
                      lineHeight: 1.45,
                    }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#60a5fa', display: 'block', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        PENANGANAN (HANDLING)
                      </span>
                      {mainLog.action_taken}
                    </div>
                  )}

                  {/* Row 5: Result Servis */}
                  {mainLog.planning_notes && (
                    <div style={{
                      background: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '0.76rem',
                      color: '#a7f3d0',
                      lineHeight: 1.45,
                    }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#34d399', display: 'block', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        HASIL (RESULT)
                      </span>
                      {mainLog.planning_notes}
                    </div>
                  )}

                  {/* Row 6: Replaced Sparepart Chips */}
                  {spareparts.length > 0 && (
                    <div>
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        SPAREPART DIGANTI:
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {spareparts.map((sp, sIdx) => (
                          <span
                            key={sIdx}
                            style={{
                              fontSize: '0.7rem',
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#34d399',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              borderRadius: '6px',
                              padding: '2px 8px',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Package size={11} /> {sp.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Row 7: Expand Sub-History jika ada lebih dari 1 kunjungan */}
                  {history.length > 1 && (
                    <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.07)', paddingTop: '8px', marginTop: '2px' }}>
                      <button
                        type="button"
                        onClick={() => toggleExpand(cid)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#93c5fd',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: 0,
                        }}
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        <span>
                          {isExpanded ? 'Tutup riwayat kunjungan' : `Lihat riwayat kunjungan (${history.length} progress)`}
                        </span>
                      </button>

                      {isExpanded && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px', paddingLeft: '8px', borderLeft: '2px solid rgba(96, 165, 250, 0.3)' }}>
                          {history.map((hlog, hIdx) => (
                            <div key={hlog.id || hIdx} style={{ fontSize: '0.73rem', background: 'rgba(0,0,0,0.2)', padding: '8px 10px', borderRadius: '6px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', marginBottom: '2px' }}>
                                <span style={{ fontWeight: 700, color: '#60a5fa' }}>Kunjungan #{hIdx + 1}</span>
                                <span>{formatDate(hlog.service_date || hlog.created_at)}</span>
                              </div>
                              <div style={{ color: '#94a3b8' }}>Teknisi: {hlog.technician_name || '—'}</div>
                              {hlog.action_taken && <div style={{ color: '#e2e8f0', marginTop: '3px' }}><strong>Tindakan:</strong> {hlog.action_taken}</div>}
                              {hlog.planning_notes && <div style={{ color: '#a7f3d0', marginTop: '2px' }}><strong>Hasil:</strong> {hlog.planning_notes}</div>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* View More / Less */}
            {!showAll && groupedList.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                style={{
                  marginTop: '4px',
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  color: '#93c5fd',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'center',
                  boxShadow: '-2px -2px 5px rgba(255,255,255,0.04), 2px 2px 6px rgba(0,0,0,0.3)',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                Lihat Semua Riwayat Servis ({groupedList.length}) <span>›</span>
              </button>
            )}

            {showAll && groupedList.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAll(false)}
                style={{
                  marginTop: '4px',
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  color: '#93c5fd',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'center',
                  boxShadow: '-2px -2px 5px rgba(255,255,255,0.04), 2px 2px 6px rgba(0,0,0,0.3)',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
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
