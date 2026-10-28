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

  const toggleExpand = (cid: string) => {
    setExpandedCallIds(prev => ({ ...prev, [cid]: !prev[cid] }));
  };

  return (
    <section className={`${styles.panel} ${styles.iotPanel}`}>
      <div className={styles.panelHeader} style={{ padding: '10px 18px' }}>
        <div className={styles.panelHeaderLeft}>
          <Wrench size={16} color="#60a5fa" />
          <h2>Riwayat Servis</h2>
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
      </div>

      <div className={styles.panelContent} style={{ padding: '14px', overflowX: 'auto' }}>
        {groupedList.length === 0 ? (
          <div className={styles.emptyState}>
            <Wrench size={40} style={{ marginBottom: '16px', color: '#94a3b8', opacity: 0.5 }} />
            <p style={{ color: '#94a3b8', textAlign: 'center', fontSize: '0.85rem' }}>Belum ada riwayat servis untuk unit ini</p>
          </div>
        ) : (
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.75rem',
            color: '#e2e8f0'
          }}>
            <thead>
              <tr style={{
                background: 'rgba(255,255,255,0.05)',
                borderBottom: '2px solid rgba(96, 165, 250, 0.3)'
              }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 800, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem', whiteSpace: 'nowrap', width: '130px' }}>ID Tiket</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 800, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}>Jenis</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 800, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}>Tanggal</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 800, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}>Status</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 800, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}>Teknisi</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 800, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}>Kendala</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 800, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}>Penanganan</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 800, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}>Detail</th>
              </tr>
            </thead>
            <tbody>
              {groupedList.map(({ cid, mainLog, history }) => {
                const taskType = mainLog.task_type || 'CORRECTIVE';
                const tc = TASK_COLOR[taskType] || TASK_COLOR.CORRECTIVE;
                const { issue, contact } = parseIssue(mainLog.issue_description);
                const isExpanded = !!expandedCallIds[cid];
                const isCompleted = mainLog.status === 'COMPLETED';
                const isCanceled = mainLog.status === 'CANCELED' || mainLog.status === 'CANCELLED';
                const spareparts = mainLog.replaced_sparepart ? String(mainLog.replaced_sparepart).split(';').filter(Boolean) : [];

                return (
                  <React.Fragment key={cid}>
                    <tr style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                      background: isCompleted 
                        ? 'rgba(16, 185, 129, 0.05)' 
                        : 'rgba(13, 35, 70, 0.3)',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = isCompleted ? 'rgba(16, 185, 129, 0.05)' : 'rgba(13, 35, 70, 0.3)'}
                    >
                      {/* ID Tiket */}
                      <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                        <button
                          type="button"
                          onClick={() => router.push(`/service?call_id=${encodeURIComponent(cid)}`)}
                          title="Buka rincian tiket di Dashboard Log Servis"
                          style={{
                            fontFamily: 'var(--font-heading)',
                            fontWeight: 800,
                            fontSize: '0.72rem',
                            color: '#60a5fa',
                            background: 'rgba(96, 165, 250, 0.14)',
                            border: '1px solid rgba(96, 165, 250, 0.35)',
                            padding: '3px 8px',
                            borderRadius: '5px',
                            letterSpacing: '0.02em',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
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
                          <ExternalLink size={10} style={{ opacity: 0.8 }} />
                        </button>
                      </td>

                      {/* Jenis */}
                      <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                        <span style={{
                          fontSize: '0.62rem',
                          fontWeight: 800,
                          padding: '2px 7px',
                          borderRadius: '4px',
                          background: tc.bg,
                          color: tc.color,
                          border: `1px solid ${tc.border}`,
                          textTransform: 'uppercase',
                          letterSpacing: '0.03em',
                          display: 'inline-block',
                          whiteSpace: 'nowrap'
                        }}>
                          {TASK_LABEL[taskType] || taskType}
                        </span>
                      </td>

                      {/* Tanggal */}
                      <td style={{ padding: '10px 12px', verticalAlign: 'top', whiteSpace: 'nowrap', color: '#cbd5e1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={11} color="#94a3b8" />
                          {formatDate(mainLog.service_date || mainLog.created_at)}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                        {isCompleted ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#34d399',
                            border: '1px solid rgba(16, 185, 129, 0.35)',
                            borderRadius: '20px',
                            padding: '3px 8px',
                            fontSize: '0.62rem',
                            fontWeight: 800,
                            letterSpacing: '0.03em',
                            whiteSpace: 'nowrap'
                          }}>
                            <CheckCircle2 size={10} /> SELESAI
                          </span>
                        ) : isCanceled ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#f87171',
                            border: '1px solid rgba(239, 68, 68, 0.35)',
                            borderRadius: '20px',
                            padding: '3px 8px',
                            fontSize: '0.62rem',
                            fontWeight: 800,
                            whiteSpace: 'nowrap'
                          }}>
                            BATAL
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            background: mainLog.status === 'PENDING' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                            color: mainLog.status === 'PENDING' ? '#fbbf24' : '#60a5fa',
                            border: mainLog.status === 'PENDING' ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(59, 130, 246, 0.35)',
                            borderRadius: '20px',
                            padding: '3px 8px',
                            fontSize: '0.62rem',
                            fontWeight: 800,
                            letterSpacing: '0.03em',
                            whiteSpace: 'nowrap'
                          }}>
                            <Clock size={10} /> {mainLog.status}
                          </span>
                        )}
                      </td>

                      {/* Teknisi */}
                      <td style={{ padding: '10px 12px', verticalAlign: 'top', color: '#cbd5e1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <User size={11} style={{ color: '#94a3b8', flexShrink: 0 }} />
                          <span style={{ fontWeight: 600 }}>{mainLog.technician_name || 'Menunggu Alokasi'}</span>
                        </div>
                      </td>

                      {/* Kendala */}
                      <td style={{ padding: '10px 12px', verticalAlign: 'top', maxWidth: '250px' }}>
                        <div style={{
                          fontSize: '0.72rem',
                          color: '#e2e8f0',
                          lineHeight: 1.35,
                        }}>
                          <div style={{ 
                            display: '-webkit-box', 
                            WebkitLineClamp: 2, 
                            WebkitBoxOrient: 'vertical', 
                            overflow: 'hidden',
                            wordBreak: 'break-word'
                          }}>
                            {issue}
                          </div>
                          {contact && (
                            <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '3px' }}>
                              Pelapor: {contact.name}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Penanganan */}
                      <td style={{ padding: '10px 12px', verticalAlign: 'top', maxWidth: '250px' }}>
                        {mainLog.action_taken && mainLog.action_taken !== 'Dalam proses pengecekan teknis.' ? (
                          <div style={{
                            fontSize: '0.72rem',
                            color: '#dbeafe',
                            lineHeight: 1.35,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            wordBreak: 'break-word'
                          }}>
                            {mainLog.action_taken}
                          </div>
                        ) : (
                          <span style={{ color: '#64748b', fontSize: '0.7rem' }}>—</span>
                        )}
                      </td>

                      {/* Detail button */}
                      <td style={{ padding: '10px 12px', verticalAlign: 'top', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => toggleExpand(cid)}
                          style={{
                            background: 'rgba(96, 165, 250, 0.12)',
                            border: '1px solid rgba(96, 165, 250, 0.3)',
                            color: '#93c5fd',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(96, 165, 250, 0.2)';
                            e.currentTarget.style.color = '#ffffff';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(96, 165, 250, 0.12)';
                            e.currentTarget.style.color = '#93c5fd';
                          }}
                        >
                          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          {isExpanded ? 'Tutup' : 'Detail'}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {isExpanded && (
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <td colSpan={8} style={{ padding: '12px 18px', background: 'rgba(0, 0, 0, 0.25)' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {/* Hasil */}
                            {mainLog.planning_notes && (
                              <div style={{
                                background: 'rgba(16, 185, 129, 0.08)',
                                border: '1px solid rgba(16, 185, 129, 0.2)',
                                borderRadius: '6px',
                                padding: '8px 10px',
                                fontSize: '0.72rem',
                                color: '#a7f3d0',
                                lineHeight: 1.4,
                              }}>
                                <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#34d399', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                  HASIL
                                </span>
                                {mainLog.planning_notes}
                              </div>
                            )}

                            {/* Sparepart */}
                            {spareparts.length > 0 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
                                  SPAREPART:
                                </span>
                                {spareparts.map((sp, sIdx) => (
                                  <span
                                    key={sIdx}
                                    style={{
                                      fontSize: '0.68rem',
                                      background: 'rgba(16, 185, 129, 0.15)',
                                      color: '#34d399',
                                      border: '1px solid rgba(16, 185, 129, 0.25)',
                                      borderRadius: '4px',
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
                            )}

                            {/* Sub-history kunjungan */}
                            {history.length > 1 && (
                              <div style={{ marginTop: '6px' }}>
                                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#93c5fd', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                  Riwayat Kunjungan ({history.length} progress)
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '12px', borderLeft: '2px solid rgba(96, 165, 250, 0.3)' }}>
                                  {history.map((hlog, hIdx) => (
                                    <div key={hlog.id || hIdx} style={{ 
                                      fontSize: '0.7rem', 
                                      background: 'rgba(0,0,0,0.2)', 
                                      padding: '8px 10px', 
                                      borderRadius: '6px',
                                      border: '1px solid rgba(255,255,255,0.05)'
                                    }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', marginBottom: '4px' }}>
                                        <span style={{ fontWeight: 700, color: '#60a5fa' }}>Kunjungan #{hIdx + 1}</span>
                                        <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{formatDate(hlog.service_date || hlog.created_at)}</span>
                                      </div>
                                      <div style={{ color: '#94a3b8', fontSize: '0.68rem' }}>Teknisi: {hlog.technician_name || '—'}</div>
                                      {hlog.action_taken && (
                                        <div style={{ color: '#e2e8f0', marginTop: '4px', lineHeight: 1.3 }}>
                                          <strong style={{ color: '#60a5fa' }}>Tindakan:</strong> {hlog.action_taken}
                                        </div>
                                      )}
                                      {hlog.planning_notes && (
                                        <div style={{ color: '#a7f3d0', marginTop: '3px', lineHeight: 1.3 }}>
                                          <strong style={{ color: '#34d399' }}>Hasil:</strong> {hlog.planning_notes}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
