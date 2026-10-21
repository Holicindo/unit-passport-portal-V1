'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { serviceLogApi, unitApi, partnerApi } from '@/lib/api';
import {
  Wrench, Search, Plus, Loader2, FileText, CheckCircle2, AlertTriangle, Edit2, Check, X, RefreshCw,
} from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import StatsGrid from '@/components/dashboard/StatsGrid';
import { parseIssueDescription, formatDate } from './utils';
import ServiceFormModal, { ConfirmSubmitModal } from './components/ServiceFormModal';
import ServiceDetailModal from './components/ServiceDetailModal';
import CompleteSparepartModal from './components/CompleteSparepartModal';
import styles from './service.module.css';

export default function ServicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCallId = searchParams.get('call_id') || searchParams.get('search') || '';

  // Core data
  const [logs, setLogs] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState(initialCallId);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [pageSize, setPageSize] = useState(20);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedDetailLog, setSelectedDetailLog] = useState<any | null>(null);
  const [expandedCallIds, setExpandedCallIds] = useState<Record<string, boolean>>({});
  const [quickStatusLog, setQuickStatusLog] = useState<any | null>(null);
  const [quickStatusValue, setQuickStatusValue] = useState<string>('');
  const [quickTechnician, setQuickTechnician] = useState<string>('');
  const [quickScheduledDate, setQuickScheduledDate] = useState<string>('');

  // Complete Sparepart Modal State
  const [sparepartModalTicket, setSparepartModalTicket] = useState<any | null>(null);

  // Sub-row inline edit & add row states
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editRowTech, setEditRowTech] = useState<string>('');
  const [editRowAction, setEditRowAction] = useState<string>('');
  const [editRowResult, setEditRowResult] = useState<string>('');
  const [editRowStatus, setEditRowStatus] = useState<string>('');

  const [addingToCallId, setAddingToCallId] = useState<string | null>(null);
  const [newRowTech, setNewRowTech] = useState<string>('');
  const [newRowAction, setNewRowAction] = useState<string>('');
  const [newRowResult, setNewRowResult] = useState<string>('');
  const [newRowStatus, setNewRowStatus] = useState<string>('IN PROGRESS');

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
  const [ticketType, setTicketType] = useState<'NEW' | 'FOLLOW_UP'>('NEW');
  const [existingCallId, setExistingCallId] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [logsSettled, unitsSettled, partnersSettled] = await Promise.allSettled([
        serviceLogApi.findAll(1, 200),
        unitApi.findAll(1, 1000),
        partnerApi.findAll(),
      ]);

      if (logsSettled.status === 'fulfilled') {
        const res = logsSettled.value;
        const items = res.data?.data ?? (Array.isArray(res.data) ? res.data : []);
        setLogs(items);
      } else {
        console.error('Gagal load service logs:', logsSettled.reason);
      }

      if (unitsSettled.status === 'fulfilled') {
        const res = unitsSettled.value;
        const items = res.data?.data ?? (Array.isArray(res.data) ? res.data : []);
        setUnits(items);
      } else {
        console.error('Gagal load units:', unitsSettled.reason);
      }

      if (partnersSettled.status === 'fulfilled') {
        const res = partnersSettled.value;
        const items = res.data?.data ?? (Array.isArray(res.data) ? res.data : []);
        setPartners(items);
      } else {
        console.error('Gagal load partners:', partnersSettled.reason);
      }

      if (logsSettled.status === 'rejected' && unitsSettled.status === 'rejected') {
        setError('Gagal memuat data dashboard servis. Silakan refresh halaman.');
      }
    } catch (err) {
      console.error('fetchData error:', err);
      setError('Gagal memuat data dashboard servis.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Sync initialCallId if logs loaded
  useEffect(() => {
    if (initialCallId && logs.length > 0) {
      setSearchQuery(initialCallId);
      setExpandedCallIds(prev => ({ ...prev, [initialCallId]: true }));
      const found = logs.find(l => (l.call_id === initialCallId || l.id === initialCallId));
      if (found) {
        setSelectedDetailLog(found);
      }
    }
  }, [initialCallId, logs]);

  const handleActualSubmit = async () => {
    setIsConfirmOpen(false);
    setSubmitting(true);
    setFormError(null);
    try {
      await serviceLogApi.create({
        unitId: selectedUnitId, partnerId: selectedPartnerId || undefined,
        call_id: ticketType === 'FOLLOW_UP' && existingCallId.trim() ? existingCallId.trim() : undefined,
        issue_description: issueDescription.trim(), action_taken: actionTaken.trim(),
        status, technician_name: technicianName.trim() || undefined,
        task_type: taskType,
        scheduled_date: scheduledDate || undefined,
        delivery_date: deliveryDate || undefined,
      });
      setSelectedUnitId(''); setSelectedPartnerId(''); setIssueDescription('');
      setActionTaken('Dalam proses pengecekan teknis.'); setTechnicianName('Menunggu Alokasi');
      setStatus('PENDING'); setTaskType('CORRECTIVE'); setScheduledDate(new Date().toISOString().split('T')[0]);
      setDeliveryDate(''); setTicketType('NEW'); setExistingCallId(''); setIsModalOpen(false);
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

  const handleQuickStatusSave = async () => {
    if (!quickStatusLog || !quickStatusValue) return;

    // Jika diubah menjadi COMPLETED, trigger popup sparepart terlebih dahulu
    if (quickStatusValue === 'COMPLETED' && quickStatusLog.status !== 'COMPLETED') {
      setSparepartModalTicket({
        id: quickStatusLog.id,
        call_id: quickStatusLog.call_id || quickStatusLog.id,
        model_name: quickStatusLog.unit?.model_name,
        technician_name: quickTechnician,
        scheduled_date: quickScheduledDate,
      });
      setQuickStatusLog(null);
      return;
    }

    try {
      const { serviceLogApi } = await import('@/lib/api');
      await serviceLogApi.update(quickStatusLog.id, {
        status: quickStatusValue,
        technician_name: quickTechnician ? quickTechnician.trim() : undefined,
        scheduled_date: quickScheduledDate || undefined,
      });
      await fetchData();
    } catch { alert('Gagal memperbarui kondisi servis.'); }
    finally {
      setQuickStatusLog(null);
      setQuickStatusValue('');
      setQuickTechnician('');
      setQuickScheduledDate('');
    }
  };

  // Handler simpan status Complete beserta sparepart dari popup
  const handleConfirmCompleteSparepart = async (spareparts: string) => {
    if (!sparepartModalTicket) return;
    try {
      setSubmitting(true);
      const { serviceLogApi } = await import('@/lib/api');
      if (sparepartModalTicket.isNewSubRow) {
        await serviceLogApi.create({
          unitId: sparepartModalTicket.unitId,
          call_id: sparepartModalTicket.call_id,
          issue_description: sparepartModalTicket.issue_description,
          action_taken: sparepartModalTicket.action_taken,
          planning_notes: sparepartModalTicket.planning_notes || undefined,
          technician_name: sparepartModalTicket.technician_name || undefined,
          status: 'COMPLETED',
          task_type: sparepartModalTicket.task_type || 'CORRECTIVE',
          replaced_sparepart: spareparts || undefined,
        });
      } else {
        await serviceLogApi.update(sparepartModalTicket.id, {
          status: 'COMPLETED',
          technician_name: sparepartModalTicket.technician_name ? sparepartModalTicket.technician_name.trim() : undefined,
          action_taken: sparepartModalTicket.action_taken ? sparepartModalTicket.action_taken.trim() : undefined,
          planning_notes: sparepartModalTicket.planning_notes ? sparepartModalTicket.planning_notes.trim() : undefined,
          scheduled_date: sparepartModalTicket.scheduled_date || undefined,
          replaced_sparepart: spareparts || undefined,
        });
      }
      await fetchData();
      setSparepartModalTicket(null);
    } catch {
      alert('Gagal memperbarui status servis ke Complete.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handler start in-row editing
  const handleStartRowEdit = (e: React.MouseEvent, hlog: any) => {
    e.stopPropagation();
    setEditingRowId(hlog.id);
    setEditRowTech(hlog.technician_name || '');
    setEditRowAction(hlog.action_taken || '');
    setEditRowResult(hlog.status === 'COMPLETED' ? (hlog.planning_notes || hlog.action_taken || '') : (hlog.planning_notes || ''));
    setEditRowStatus(hlog.status || 'IN PROGRESS');
  };

  // Handler save in-row editing
  const handleSaveRowEdit = async (e: React.MouseEvent, hlog: any) => {
    e.stopPropagation();

    // Trigger popup sparepart jika diubah menjadi COMPLETED
    if (editRowStatus === 'COMPLETED' && hlog.status !== 'COMPLETED') {
      setSparepartModalTicket({
        id: hlog.id,
        call_id: hlog.call_id || hlog.id,
        model_name: hlog.unit?.model_name,
        technician_name: editRowTech.trim(),
        action_taken: editRowAction.trim(),
        planning_notes: editRowResult.trim(),
        status: 'COMPLETED',
      });
      setEditingRowId(null);
      return;
    }

    try {
      setSubmitting(true);
      const { serviceLogApi } = await import('@/lib/api');
      await serviceLogApi.update(hlog.id, {
        technician_name: editRowTech.trim() || undefined,
        action_taken: editRowAction.trim() || undefined,
        planning_notes: editRowResult.trim() || undefined,
        status: editRowStatus,
      });
      setEditingRowId(null);
      await fetchData();
    } catch {
      alert('Gagal menyimpan perubahan baris.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handler add sub-row (tambah progres tindakan baru pada Call ID yang sama)
  const handleSaveNewSubRow = async (e: React.MouseEvent, mainLog: any) => {
    e.stopPropagation();
    if (!newRowAction.trim()) {
      alert('Tuliskan tindakan handling untuk baris baru ini.');
      return;
    }

    // Trigger popup sparepart jika baris baru langsung berstatus COMPLETED
    if (newRowStatus === 'COMPLETED') {
      setSparepartModalTicket({
        isNewSubRow: true,
        unitId: mainLog.unit?.id,
        call_id: mainLog.call_id || mainLog.id,
        issue_description: mainLog.issue_description,
        action_taken: newRowAction.trim(),
        planning_notes: newRowResult.trim(),
        technician_name: newRowTech.trim(),
        status: 'COMPLETED',
        task_type: mainLog.task_type || 'CORRECTIVE',
        model_name: mainLog.unit?.model_name,
      });
      setAddingToCallId(null);
      setNewRowAction('');
      setNewRowResult('');
      setNewRowTech('');
      setNewRowStatus('IN PROGRESS');
      return;
    }

    try {
      setSubmitting(true);
      const { serviceLogApi } = await import('@/lib/api');
      await serviceLogApi.create({
        unitId: mainLog.unit?.id,
        call_id: mainLog.call_id || mainLog.id,
        issue_description: mainLog.issue_description,
        action_taken: newRowAction.trim(),
        planning_notes: newRowResult.trim() || undefined,
        technician_name: newRowTech.trim() || undefined,
        status: newRowStatus as any,
        task_type: mainLog.task_type || 'CORRECTIVE',
      });
      setAddingToCallId(null);
      setNewRowAction('');
      setNewRowResult('');
      setNewRowTech('');
      setNewRowStatus('IN PROGRESS');
      await fetchData();
    } catch {
      alert('Gagal menambahkan baris baru ke log ini.');
    } finally {
      setSubmitting(false);
    }
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
        { label: 'Total Permintaan', value: loading ? '...' : totalRequests, max: 1000, icon: FileText, accent: '#3b82f6' },
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
          <button
            className="dtToolbarCreateBtn"
            onClick={() => setIsModalOpen(true)}
            style={{ background: '#2E5BFF', color: '#fff' }}
          >
            <Plus size={16} strokeWidth={2.5} />Catat Permintaan Baru
          </button>
          <button
            className="dtToolbarCreateBtn"
            onClick={() => {
              setQuickStatusLog({ __standalone: true });
              setQuickStatusValue('PENDING');
              setQuickTechnician('');
              setQuickScheduledDate('');
            }}
            style={{ background: '#001F3F', color: '#fff' }}
          >
            <RefreshCw size={15} strokeWidth={2.5} />Update Status
          </button>
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
            <thead>
              <tr>
                <th style={{ width: '11%' }}>CALL ID</th>
                <th style={{ width: '9%' }}>DATE COMPLAIN</th>
                <th style={{ width: '15%' }}>CUSTOMER & CABANG</th>
                <th style={{ width: '14%' }}>PRODUCT (UNIT)</th>
                <th style={{ width: '15%' }}>ISSUE</th>
                <th style={{ width: '14%' }}>HANDLING</th>
                <th style={{ width: '14%' }}>RESULT</th>
                <th style={{ width: '10%' }}>REPLACED SPAREPART</th>
                <th style={{ width: '7%', textAlign: 'center' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {groupedLogs.map(({ mainLog, history }, cardIdx) => {
                const cid = mainLog.call_id || mainLog.id;
                const isExpanded = expandedCallIds[cid];
                const cardColors = [styles.cardBlue, styles.cardEmerald, styles.cardAmber, styles.cardPurple, styles.cardRose];
                const cardAccentClass = cardColors[cardIdx % cardColors.length];

                return (
                  <React.Fragment key={mainLog.id}>
                    <tr className={`${cardAccentClass} ${styles.clickableRow}`} style={{ cursor: 'pointer', background: isExpanded ? 'rgba(46,91,255,0.03)' : undefined }}>
                      <td className={styles.logId}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button onClick={(e) => toggleExpand(e, cid)} className={styles.expandBtn} title={isExpanded ? 'Tutup riwayat' : 'Buka riwayat'}>
                            {isExpanded ? '-' : '+'}
                          </button>
                          <span
                            onClick={(e) => { e.stopPropagation(); setSelectedDetailLog(mainLog); }}
                            className={styles.callIdLink}
                            title="Klik untuk lihat rincian tiket"
                          >
                            {cid}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--color-deep-navy)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          {formatDate(mainLog.service_date || mainLog.created_at)}
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--color-deep-navy)', fontSize: '0.84rem' }}>
                            {mainLog.unit?.current_client?.company_name || 'Customer Umum'}
                          </span>
                          <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                            {mainLog.unit?.current_client?.branch || mainLog.unit?.current_client?.address || 'Pusat / Cabang'}
                          </span>
                        </div>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className={styles.unitLink} onClick={() => router.push(`/id/${mainLog.unit?.qr_token}`)}>
                          <span className={styles.unitModel}>{mainLog.unit?.model_name || 'Unit Tidak Diketahui'}</span>
                          <span className={styles.unitSn}>SN: {mainLog.unit?.serial_number || '-'}</span>
                        </div>
                      </td>
                      <td onClick={() => setSelectedDetailLog(mainLog)}>
                        {(() => {
                          const { issue, contact } = parseIssueDescription(mainLog.issue_description);
                          return (
                            <div className={styles.issueCell}>
                              <span className={styles.issueTextMain} title={issue}>{issue}</span>
                              {contact && <span className={styles.issueContactSub}>PIC: {contact.name} ({contact.phone})</span>}
                            </div>
                          );
                        })()}
                      </td>
                      <td onClick={() => setSelectedDetailLog(mainLog)}>
                        <span style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 500, lineHeight: 1.35 }}>
                          {mainLog.action_taken && mainLog.action_taken !== 'Dalam proses pengecekan teknis.'
                            ? (mainLog.action_taken.length > 55 ? mainLog.action_taken.slice(0, 55) + '…' : mainLog.action_taken)
                            : <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>Menunggu penanganan</span>}
                        </span>
                      </td>
                      <td onClick={() => setSelectedDetailLog(mainLog)}>
                        <span style={{ fontSize: '0.8rem', color: '#047857', fontWeight: 600, lineHeight: 1.35 }}>
                          {mainLog.planning_notes ? (
                            mainLog.planning_notes.length > 55 ? mainLog.planning_notes.slice(0, 55) + '…' : mainLog.planning_notes
                          ) : mainLog.status === 'COMPLETED' ? (
                            'Unit telah normal kembali'
                          ) : (
                            <span style={{ fontStyle: 'italic', color: '#94a3b8', fontWeight: 400 }}>—</span>
                          )}
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        {mainLog.replaced_sparepart ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {String(mainLog.replaced_sparepart).split(';').filter(Boolean).map((item: string, idx: number) => (
                              <span key={idx} style={{ fontSize: '0.72rem', background: 'rgba(46,91,255,0.08)', color: '#2E5BFF', borderRadius: '4px', padding: '1px 6px', whiteSpace: 'nowrap', fontWeight: 600 }}>{item.trim()}</span>
                            ))}
                          </div>
                        ) : <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic' }}>—</span>}
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <span
                          className={`${styles.badge} ${mainLog.status === 'PENDING' ? styles.badgePending : mainLog.status === 'IN PROGRESS' ? styles.badgeInProgress : mainLog.status === 'COMPLETED' ? styles.badgeCompleted : styles.badgeCancelled}`}
                        >{mainLog.status}</span>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={9} style={{ padding: 0, background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                          <div style={{ padding: '16px 24px 16px 36px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                              <h4 style={{ fontSize: '0.8rem', color: '#1e293b', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 800 }}>
                                Riwayat Progres Kunjungan (CALL ID: #{cid})
                              </h4>
                              {addingToCallId !== cid && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAddingToCallId(cid);
                                    setNewRowTech(mainLog.technician_name || '');
                                    setNewRowAction('');
                                    setNewRowStatus('IN PROGRESS');
                                  }}
                                  className={styles.subRowAddBtn}
                                  title="Tambah progres baru (misal kunjungan hari berikutnya atau follow-up kasus kambuh)"
                                >
                                  <Plus size={14} /> Add Row (Tambah Progres)
                                </button>
                              )}
                            </div>

                            <table className={styles.subRowTable}>
                              <thead>
                                <tr>
                                  <th style={{ width: '15%' }}>Date Execution</th>
                                  <th style={{ width: '16%' }}>Teknisi</th>
                                  <th style={{ width: '30%' }}>Handling</th>
                                  <th style={{ width: '22%' }}>Result</th>
                                  <th style={{ width: '10%' }}>Status</th>
                                  <th style={{ width: '7%', textAlign: 'center' }}>Aksi</th>
                                </tr>
                              </thead>
                              <tbody>
                                {history.map((hlog: any) => {
                                  const isRowEditing = editingRowId === hlog.id;
                                  return (
                                    <tr key={hlog.id}>
                                      <td style={{ color: 'var(--color-deep-navy)', fontWeight: 600 }}>{formatDate(hlog.scheduled_date || hlog.service_date || hlog.created_at)}</td>
                                      <td>
                                        {isRowEditing ? (
                                          <input
                                            type="text"
                                            value={editRowTech}
                                            onChange={(e) => setEditRowTech(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #2E5BFF', fontSize: '0.82rem' }}
                                          />
                                        ) : (
                                          <span style={{ color: 'var(--color-deep-navy)', fontWeight: 600 }}>{hlog.technician_name || 'Menunggu Teknisi'}</span>
                                        )}
                                      </td>
                                      <td>
                                        {isRowEditing ? (
                                          <textarea
                                            value={editRowAction}
                                            onChange={(e) => setEditRowAction(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            placeholder="Handling teknisi..."
                                            style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #2E5BFF', fontSize: '0.82rem', minHeight: '44px', fontFamily: 'inherit' }}
                                          />
                                        ) : (
                                          <span style={{ color: '#334155', lineHeight: 1.4 }}>{hlog.action_taken}</span>
                                        )}
                                      </td>
                                      <td>
                                        {isRowEditing ? (
                                          <textarea
                                            value={editRowResult}
                                            onChange={(e) => setEditRowResult(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            placeholder="Hasil akhir / result..."
                                            style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #10b981', fontSize: '0.82rem', minHeight: '44px', fontFamily: 'inherit' }}
                                          />
                                        ) : (
                                          <span style={{ color: '#047857', fontWeight: 600, fontSize: '0.8rem' }}>
                                            {hlog.planning_notes || (hlog.status === 'COMPLETED' ? 'Unit telah normal kembali' : <span style={{ color: '#94a3b8', fontStyle: 'italic', fontWeight: 400 }}>—</span>)}
                                          </span>
                                        )}
                                      </td>
                                      <td>
                                        {isRowEditing ? (
                                          <select
                                            value={editRowStatus}
                                            onChange={(e) => setEditRowStatus(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            style={{ width: '100%', padding: '4px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                                          >
                                            <option value="PENDING">PENDING</option>
                                            <option value="IN PROGRESS">IN PROGRESS</option>
                                            <option value="COMPLETED">COMPLETED</option>
                                            <option value="CANCELED">CANCELED</option>
                                          </select>
                                        ) : (
                                          <span className={`${styles.badge} ${hlog.status === 'PENDING' ? styles.badgePending : hlog.status === 'IN PROGRESS' ? styles.badgeInProgress : hlog.status === 'COMPLETED' ? styles.badgeCompleted : styles.badgeCancelled}`}>{hlog.status}</span>
                                        )}
                                      </td>
                                      <td style={{ textAlign: 'center' }}>
                                        {isRowEditing ? (
                                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                            <button
                                              type="button"
                                              onClick={(e) => handleSaveRowEdit(e, hlog)}
                                              className={styles.subRowBtn}
                                              style={{ background: '#10b981', color: '#fff', border: 'none' }}
                                              title="Simpan"
                                            >
                                              <Check size={12} />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={(e) => { e.stopPropagation(); setEditingRowId(null); }}
                                              className={styles.subRowBtn}
                                              title="Batal"
                                            >
                                              <X size={12} />
                                            </button>
                                          </div>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={(e) => handleStartRowEdit(e, hlog)}
                                            className={styles.subRowBtn}
                                            title="Edit in Row"
                                          >
                                            <Edit2 size={12} /> Edit
                                          </button>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}

                                {/* Inline Add Row Form */}
                                {addingToCallId === cid && (
                                  <tr style={{ background: 'rgba(46,91,255,0.03)' }}>
                                    <td style={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic' }}>Sekarang (Baru)</td>
                                    <td>
                                      <input
                                        type="text"
                                        placeholder="Nama Teknisi..."
                                        value={newRowTech}
                                        onChange={(e) => setNewRowTech(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #2E5BFF', fontSize: '0.8rem' }}
                                      />
                                    </td>
                                    <td>
                                      <textarea
                                        placeholder="Tindakan / handling..."
                                        value={newRowAction}
                                        onChange={(e) => setNewRowAction(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #2E5BFF', fontSize: '0.8rem', minHeight: '40px', fontFamily: 'inherit' }}
                                      />
                                    </td>
                                    <td>
                                      <textarea
                                        placeholder="Hasil / result (opsional jika belum selesai)..."
                                        value={newRowResult}
                                        onChange={(e) => setNewRowResult(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #10b981', fontSize: '0.8rem', minHeight: '40px', fontFamily: 'inherit' }}
                                      />
                                    </td>
                                    <td>
                                      <select
                                        value={newRowStatus}
                                        onChange={(e) => setNewRowStatus(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{ width: '100%', padding: '6px 6px', borderRadius: '4px', border: '1px solid #2E5BFF', fontSize: '0.78rem' }}
                                      >
                                        <option value="IN PROGRESS">IN PROGRESS</option>
                                        <option value="COMPLETED">COMPLETED</option>
                                        <option value="PENDING">PENDING</option>
                                        <option value="CANCELED">CANCELED</option>
                                      </select>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                        <button
                                          type="button"
                                          onClick={(e) => handleSaveNewSubRow(e, mainLog)}
                                          className={styles.subRowBtn}
                                          style={{ background: '#2E5BFF', color: '#fff', border: 'none' }}
                                          title="Tambah Baris"
                                        >
                                          <Check size={12} /> Tambah
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); setAddingToCallId(null); }}
                                          className={styles.subRowBtn}
                                          title="Batal"
                                        >
                                          <X size={12} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                )}
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

        {/* Mobile Cards (Dengan variasi warna border/aksen dan field bersih) */}
        <div className={styles.mobileView}>
          {groupedLogs.map(({ mainLog }, cardIdx) => {
            const cid = mainLog.call_id || mainLog.id;
            const cardColors = [styles.cardBlue, styles.cardEmerald, styles.cardAmber, styles.cardPurple, styles.cardRose];
            const cardAccentClass = cardColors[cardIdx % cardColors.length];

            return (
              <div key={mainLog.id} className={`${styles.mobileCard} ${cardAccentClass} ${styles.clickableCard}`} onClick={() => setSelectedDetailLog(mainLog)}>
                <div className={styles.mobileCardHeader}>
                  <span className={styles.mobileLogId} style={{ cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'rgba(46,91,255,0.3)' }}>{cid}</span>
                  <span className={`${styles.badge} ${mainLog.status === 'PENDING' ? styles.badgePending : mainLog.status === 'IN PROGRESS' ? styles.badgeInProgress : mainLog.status === 'COMPLETED' ? styles.badgeCompleted : styles.badgeCancelled}`}>
                    Kondisi: {mainLog.status}
                  </span>
                </div>
                <div className={styles.mobileCardBody}>
                  <div className={styles.mobileCardRow}>
                    <span className={styles.mobileLabel}>Masalah Awal</span>
                    <span className={styles.mobileValueIssue}>{parseIssueDescription(mainLog.issue_description).issue}</span>
                  </div>
                  {mainLog.action_taken && mainLog.action_taken !== 'Dalam proses pengecekan teknis.' && (
                    <div className={styles.mobileCardRow}>
                      <span className={styles.mobileLabel}>Penanganan</span>
                      <span className={styles.mobileValue} style={{ color: 'var(--color-deep-navy)', fontSize: '0.82rem' }}>
                        {mainLog.action_taken.length > 80 ? mainLog.action_taken.slice(0, 80) + '…' : mainLog.action_taken}
                      </span>
                    </div>
                  )}
                  <div className={styles.mobileCardRow}>
                    <span className={styles.mobileLabel}>Tanggal</span>
                    <span className={styles.mobileValueDate}>{formatDate(mainLog.service_date)}</span>
                  </div>
                  {mainLog.replaced_sparepart && (
                    <div className={styles.mobileCardRow}>
                      <span className={styles.mobileLabel}>Sparepart</span>
                      <span className={styles.mobileValue} style={{ color: '#2E5BFF', fontWeight: 700 }}>{mainLog.replaced_sparepart}</span>
                    </div>
                  )}
                </div>
                <div className={styles.mobileCardFooter}>
                  <span style={{ fontSize: '0.72rem', color: '#2E5BFF', fontWeight: 700 }}>Ketuk untuk detail →</span>
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
        ticketType={ticketType} setTicketType={setTicketType}
        existingCallId={existingCallId} setExistingCallId={setExistingCallId}
        existingCallIds={Array.from(new Set(logs.map(l => l.call_id).filter(Boolean)))}
      />
      <ConfirmSubmitModal show={isConfirmOpen} onConfirm={handleActualSubmit} onCancel={() => setIsConfirmOpen(false)} />
      {selectedDetailLog && (
        <ServiceDetailModal
          log={selectedDetailLog} partners={partners}
          onClose={() => setSelectedDetailLog(null)}
          onUpdate={async (updated) => { await fetchData(); setSelectedDetailLog(updated); }}
          submitting={submitting} setSubmitting={setSubmitting}
        />
      )}
      {/* Quick Status Modal */}
      {quickStatusLog && (
        <div className={styles.modalOverlay} onClick={() => setQuickStatusLog(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 className={styles.modalTitle} style={{ margin: 0 }}>Update Status & Penugasan Servis</h3>

            {/* Jika dibuka via button toolbar: tampilkan dropdown pilih tiket */}
            {quickStatusLog.__standalone ? (
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Pilih Tiket (Call ID)</label>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    const selected = logs.find(l => (l.call_id || l.id) === e.target.value);
                    if (selected) {
                      setQuickStatusLog(selected);
                      setQuickStatusValue(selected.status);
                      setQuickTechnician(selected.technician_name && !selected.technician_name.includes('Pending') ? selected.technician_name : '');
                      setQuickScheduledDate(selected.scheduled_date ? selected.scheduled_date.split('T')[0] : '');
                    }
                  }}
                  style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.875rem', color: 'var(--color-deep-navy)', outline: 'none', width: '100%', background: '#fff' }}
                >
                  <option value="">— Cari & Pilih Call ID —</option>
                  {Array.from(new Map(logs.map(l => [l.call_id || l.id, l])).values()).map(l => (
                    <option key={l.call_id || l.id} value={l.call_id || l.id}>
                      {l.call_id || l.id} — {l.unit?.model_name || 'Unit'} ({l.status})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--color-space-grey)', border: '1px solid #e2e8f0' }}>
                <div>Unit: <strong style={{ color: 'var(--color-deep-navy)' }}>{quickStatusLog.unit?.model_name || 'Unit'}</strong> (SN: {quickStatusLog.unit?.serial_number || '-'})</div>
                <div style={{ marginTop: '3px' }}>Call ID: <strong style={{ color: 'var(--color-deep-navy)' }}>#{quickStatusLog.call_id || quickStatusLog.id}</strong></div>
              </div>
            )}

            {!quickStatusLog.__standalone && (<>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Kondisi Servis</label>
                <select
                  value={quickStatusValue}
                  onChange={(e) => setQuickStatusValue(e.target.value)}
                  style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.875rem', color: 'var(--color-deep-navy)', outline: 'none', width: '100%', background: '#fff' }}
                >
                  <option value="PENDING">PENDING</option>
                  <option value="IN PROGRESS">IN PROGRESS</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELED">CANCELED</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Nama Teknisi yang Ditugaskan</label>
                <input
                  type="text"
                  placeholder="Contoh: Budi Santoso / Tim Teknisi Holicindo"
                  value={quickTechnician}
                  onChange={(e) => setQuickTechnician(e.target.value)}
                  style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.875rem', color: 'var(--color-deep-navy)', outline: 'none', width: '100%', background: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Rencana Kunjungan / Servis</label>
                <input
                  type="date"
                  value={quickScheduledDate}
                  onChange={(e) => setQuickScheduledDate(e.target.value)}
                  style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.875rem', color: 'var(--color-deep-navy)', outline: 'none', width: '100%', background: '#fff' }}
                />
              </div>
            </>)}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button className={styles.cancelBtn} onClick={() => setQuickStatusLog(null)}>Batal</button>
              {!quickStatusLog.__standalone && (
                <button className={styles.saveBtn} onClick={handleQuickStatusSave}>Simpan & Notifikasi Klien</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Popup Trigger Saat Kondisi Selesai / Complete (Menanyakan Sparepart) */}
      <CompleteSparepartModal
        isOpen={!!sparepartModalTicket}
        ticketTitle={`Tiket #${sparepartModalTicket?.call_id || sparepartModalTicket?.id}`}
        unitModel={sparepartModalTicket?.model_name}
        onCancel={() => setSparepartModalTicket(null)}
        onConfirm={handleConfirmCompleteSparepart}
        loading={submitting}
      />

    </div>
  );
}
