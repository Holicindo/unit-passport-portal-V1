'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { serviceLogApi, unitApi, partnerApi } from '@/lib/api';
import {
  Wrench, Search, Plus, Loader2, FileText, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import StatsGrid from '@/components/dashboard/StatsGrid';
import { parseIssueDescription, formatDate } from './utils';
import ServiceFormModal, { ConfirmSubmitModal } from './components/ServiceFormModal';
import ServiceDetailModal from './components/ServiceDetailModal';
import styles from './service.module.css';

export default function ServicePage() {
  const router = useRouter();

  // Core data
  const [logs, setLogs] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [pageSize, setPageSize] = useState(20);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedDetailLog, setSelectedDetailLog] = useState<any | null>(null);
  const [expandedCallIds, setExpandedCallIds] = useState<Record<string, boolean>>({});

  // Form states
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [actionTaken, setActionTaken] = useState('Dalam proses pengecekan teknis.');
  const [technicianName, setTechnicianName] = useState('Menunggu Alokasi');
  const [status, setStatus] = useState('PENDING');
  const [taskType, setTaskType] = useState('CORRECTIVE');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const logsRes = await serviceLogApi.findAll(1, 200);
      setLogs(logsRes.data?.data ?? (Array.isArray(logsRes.data) ? logsRes.data : []));
      const unitsRes = await unitApi.findAll(1, 1000);
      setUnits(unitsRes.data?.data ?? (Array.isArray(unitsRes.data) ? unitsRes.data : []));
      const partnersRes = await partnerApi.findAll();
      if (Array.isArray(partnersRes.data)) setPartners(partnersRes.data);
    } catch { setError('Gagal memuat data dashboard servis.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleActualSubmit = async () => {
    setIsConfirmOpen(false);
    setSubmitting(true);
    setFormError(null);
    try {
      await serviceLogApi.create({
        unitId: selectedUnitId, partnerId: selectedPartnerId || undefined,
        issue_description: issueDescription.trim(), action_taken: actionTaken.trim(),
        status, technician_name: technicianName.trim() || undefined,
        task_type: taskType,
        scheduled_date: scheduledDate || undefined,
        delivery_date: deliveryDate || undefined,
      });
      setSelectedUnitId(''); setSelectedPartnerId(''); setIssueDescription('');
      setActionTaken('Dalam proses pengecekan teknis.'); setTechnicianName('Menunggu Alokasi');
      setStatus('PENDING'); setTaskType('CORRECTIVE'); setScheduledDate(new Date().toISOString().split('T')[0]);
      setDeliveryDate(''); setIsModalOpen(false);
      await fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setFormError(Array.isArray(msg) ? msg.join(' | ') : (msg || 'Gagal merekam log servis.'));
    } finally { setSubmitting(false); }
  };

  const filteredLogs = logs.filter(log => {
    const matchesStatus = statusFilter === 'ALL' || log.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = [log.unit?.serial_number, log.unit?.model_name, log.partner?.partner_name, log.issue_description, log.technician_name]
      .some(v => v?.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  }).slice(0, pageSize);

  const totalRequests = logs.length;
  const pendingRequests = logs.filter(l => l.status === 'PENDING').length;
  const completedRequests = logs.filter(l => l.status === 'COMPLETED').length;

  const groupedLogs = (Object.values(filteredLogs.reduce((acc, log) => {
    const cid = log.call_id || log.id;
    if (!acc[cid]) acc[cid] = [];
    acc[cid].push(log);
    return acc;
  }, {} as Record<string, any[]>)) as any[][]).map((group: any[]) => {
    group.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return { mainLog: group[0], history: group };
  });

  const toggleExpand = (e: React.MouseEvent, cid: string) => {
    e.stopPropagation();
    setExpandedCallIds(prev => ({ ...prev, [cid]: !prev[cid] }));
  };

  return (
    <div className={styles.container}>
      <header className={styles.pageHeader}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Daftar Permintaan Servis</h1>
          <p className={styles.subtitle}>Rekap permasalahan dan permintaan service masuk dari Customer.</p>
        </div>
      </header>

      <div className="mobile-sub-tabs">
        <button className="mobile-sub-tab active" onClick={() => router.push('/service')}>Log Servis</button>
        <button className="mobile-sub-tab" onClick={() => router.push('/service/planning')}>Rencana Servis</button>
        <button className="mobile-sub-tab" onClick={() => router.push('/service/evaluation')}>Evaluasi Servis</button>
      </div>

      <StatsGrid loading={loading} items={[
        { label: 'Total Permintaan', value: loading ? '...' : totalRequests, max: 1000, icon: FileText, accent: '#64748b' },
        { label: 'Antrean Pending', value: loading ? '...' : pendingRequests, max: 100, icon: AlertTriangle, accent: '#FF6B00' },
        { label: 'Selesai Ditangani', value: loading ? '...' : completedRequests, max: 1000, icon: CheckCircle2, accent: '#00C48C' },
      ]} />

      {/* Toolbar */}
      <div className="dtToolbar">
        <div className="dtToolbarLeft">
          <div className="dtToolbarText">Show
            <CustomSelect options={[{ value: '20', label: '20' }, { value: '50', label: '50' }, { value: '100', label: '100' }]} value={pageSize.toString()} onChange={(val) => setPageSize(parseInt(val, 10))} />
            entries
          </div>
          <CustomSelect options={[{ value: 'ALL', label: 'Semua Status' }, { value: 'PENDING', label: 'PENDING' }, { value: 'IN PROGRESS', label: 'IN PROGRESS' }, { value: 'COMPLETED', label: 'COMPLETED' }, { value: 'CANCELED', label: 'CANCELED' }]} value={statusFilter} onChange={(val) => setStatusFilter(val)} />
        </div>
        <div className="dtToolbarRight">
          <div className="dtToolbarSearch">
            <input type="text" placeholder="Cari SN, model, partner..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="dtToolbarSearchInput" />
            <Search size={16} className="dtToolbarSearchIcon" />
          </div>
          <button className="dtToolbarCreateBtn" onClick={() => setIsModalOpen(true)}><Plus size={16} strokeWidth={2.5} />Catat Permintaan Baru</button>
        </div>
      </div>

      {/* Table / Cards */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><Loader2 size={36} className={styles.spin} style={{ color: 'var(--color-cobalt-blue)' }} /></div>
      ) : error ? (
        <div className={styles.errorAlert}>{error}</div>
      ) : filteredLogs.length === 0 ? (
        <div className={styles.tableContainer}><div className={styles.emptyState}><Wrench size={48} style={{ color: 'var(--color-space-grey)', opacity: 0.4 }} /><h3 className={styles.emptyTitle}>Belum Ada Log Servis</h3><p className={styles.emptyDesc}>Tidak ada permintaan servis yang sesuai.</p></div></div>
      ) : (<>
        {/* Desktop Table */}
        <div className={`${styles.tableContainer} ${styles.desktopView}`}>
          <table className={styles.table}>
            <thead><tr><th>CALL ID</th><th>Jenis</th><th>Unit / Mesin</th><th>Deskripsi Kendala</th><th>Tgl Jadwal</th><th>Status</th></tr></thead>
            <tbody>
              {groupedLogs.map(({ mainLog, history }) => {
                const cid = mainLog.call_id || mainLog.id;
                const isExpanded = expandedCallIds[cid];
                return (
                  <React.Fragment key={mainLog.id}>
                    <tr onClick={() => setSelectedDetailLog(mainLog)} style={{ cursor: 'pointer', background: isExpanded ? 'rgba(0,0,0,0.02)' : 'transparent' }}>
                      <td className={styles.logId}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button onClick={(e) => toggleExpand(e, cid)} className={styles.expandBtn}>
                            {isExpanded ? '-' : '+'}
                          </button>
                          {cid}
                        </div>
                      </td>
                      <td>
                        {(() => {
                          const tType = mainLog.task_type || 'CORRECTIVE';
                          const tLabel: Record<string,string> = { CORRECTIVE: 'Perbaikan', PREVENTIVE: 'Perawatan', INSTALLATION: 'Instalasi' };
                          const tColor: Record<string,{bg:string,color:string}> = {
                            CORRECTIVE: { bg: 'rgba(255,87,34,0.1)', color: '#FF5722' },
                            PREVENTIVE: { bg: 'rgba(0,71,171,0.1)', color: '#0047AB' },
                            INSTALLATION: { bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
                          };
                          const c = tColor[tType] || tColor.CORRECTIVE;
                          return <span className={styles.badge} style={{ background: c.bg, color: c.color }}>{tLabel[tType] || tType}</span>;
                        })()}
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className={styles.unitLink} onClick={() => router.push(`/id/${mainLog.unit?.qr_token}`)}>
                          <span className={styles.unitModel}>{mainLog.unit?.model_name || 'Unit Tidak Diketahui'}</span>
                          <span className={styles.unitSn}>{mainLog.unit?.serial_number}</span>
                        </div>
                      </td>
                      <td>{(() => { const { issue, contact } = parseIssueDescription(mainLog.issue_description); return (<div className={styles.issueCell}><span className={styles.issueTextMain} title={issue}>{issue}</span>{contact && <span className={styles.issueContactSub}>{contact.name} ({contact.phone})</span>}</div>); })()}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--color-deep-navy)', fontSize: '0.8rem' }}>
                            {formatDate(mainLog.scheduled_date || mainLog.service_date)}
                          </span>
                          {mainLog.delivery_date && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-cobalt-blue)', fontWeight: 600 }}>
                              📦 {formatDate(mainLog.delivery_date)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td><span className={`${styles.badge} ${mainLog.status === 'PENDING' ? styles.badgePending : mainLog.status === 'IN PROGRESS' ? styles.badgeInProgress : mainLog.status === 'COMPLETED' ? styles.badgeCompleted : styles.badgeCancelled}`}>{mainLog.status}</span></td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} style={{ padding: 0, background: '#f8fafc', borderBottom: '1px solid #f0f0f4' }}>
                          <div style={{ padding: '16px 24px 16px 48px' }}>
                            <h4 style={{ fontSize: '0.8rem', color: 'var(--color-space-grey)', marginBottom: '12px', textTransform: 'uppercase' }}>Riwayat Status ({cid})</h4>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                              <thead>
                                <tr>
                                  <th style={{ textAlign: 'left', padding: '8px', color: 'var(--color-space-grey)', borderBottom: '1px solid #e2e8f0', width: '20%' }}>Tanggal</th>
                                  <th style={{ textAlign: 'left', padding: '8px', color: 'var(--color-space-grey)', borderBottom: '1px solid #e2e8f0', width: '20%' }}>Teknisi</th>
                                  <th style={{ textAlign: 'left', padding: '8px', color: 'var(--color-space-grey)', borderBottom: '1px solid #e2e8f0', width: '45%' }}>Tindakan</th>
                                  <th style={{ textAlign: 'left', padding: '8px', color: 'var(--color-space-grey)', borderBottom: '1px solid #e2e8f0', width: '15%' }}>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {history.map((hlog: any) => (
                                  <tr key={hlog.id}>
                                    <td style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', color: 'var(--color-deep-navy)' }}>{formatDate(hlog.created_at)}</td>
                                    <td style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', color: 'var(--color-deep-navy)' }}>{hlog.technician_name || '-'}</td>
                                    <td style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', color: 'var(--color-space-grey)' }}>{hlog.action_taken}</td>
                                    <td style={{ padding: '8px', borderBottom: '1px solid #f1f5f9' }}><span className={`${styles.badge} ${hlog.status === 'PENDING' ? styles.badgePending : hlog.status === 'IN PROGRESS' ? styles.badgeInProgress : hlog.status === 'COMPLETED' ? styles.badgeCompleted : styles.badgeCancelled}`}>{hlog.status}</span></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className={styles.mobileView}>
          {groupedLogs.map(({ mainLog }) => {
            const cid = mainLog.call_id || mainLog.id;
            return (
              <div key={mainLog.id} className={styles.mobileCard} onClick={() => setSelectedDetailLog(mainLog)}>
                <div className={styles.mobileCardHeader}>
                  <span className={styles.mobileLogId}>{cid}</span>
                  <span className={`${styles.badge} ${mainLog.status === 'PENDING' ? styles.badgePending : mainLog.status === 'IN PROGRESS' ? styles.badgeInProgress : mainLog.status === 'COMPLETED' ? styles.badgeCompleted : styles.badgeCancelled}`}>{mainLog.status}</span>
                </div>
                <div className={styles.mobileCardBody}>
                  <div className={styles.mobileCardRow}><span className={styles.mobileLabel}>Unit / Mesin</span><div className={styles.mobileUnitInfo}><span className={styles.mobileUnitModel}>{mainLog.unit?.model_name || 'Unit Tidak Diketahui'}</span><span className={styles.mobileUnitSn}>SN: {mainLog.unit?.serial_number || '-'}</span></div></div>
                  <div className={styles.mobileCardRow}><span className={styles.mobileLabel}>Deskripsi Kendala</span><span className={styles.mobileValueIssue}>{parseIssueDescription(mainLog.issue_description).issue}</span></div>
                  <div className={styles.mobileCardRow}><span className={styles.mobileLabel}>Tanggal Servis</span><span className={styles.mobileValueDate}>{formatDate(mainLog.service_date)}</span></div>
                </div>
              </div>
            );
          })}
        </div>
      </>)}

      {/* Modals */}
      <ServiceFormModal
        show={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={() => setIsConfirmOpen(true)}
        units={units} partners={partners} formError={formError} setFormError={setFormError}
        selectedUnitId={selectedUnitId} setSelectedUnitId={setSelectedUnitId}
        selectedPartnerId={selectedPartnerId} setSelectedPartnerId={setSelectedPartnerId}
        issueDescription={issueDescription} setIssueDescription={setIssueDescription}
        actionTaken={actionTaken} setActionTaken={setActionTaken}
        technicianName={technicianName} setTechnicianName={setTechnicianName}
        status={status} setStatus={setStatus}
        taskType={taskType} setTaskType={setTaskType}
        scheduledDate={scheduledDate} setScheduledDate={setScheduledDate}
        deliveryDate={deliveryDate} setDeliveryDate={setDeliveryDate}
        submitting={submitting}
      />
      <ConfirmSubmitModal show={isConfirmOpen} onConfirm={handleActualSubmit} onCancel={() => setIsConfirmOpen(false)} />
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
