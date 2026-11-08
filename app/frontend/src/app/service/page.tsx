'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { serviceLogApi, unitApi, partnerApi, userApi } from '@/lib/api';
import {
  Wrench, Search, Plus, Loader2, FileText, CheckCircle2, AlertTriangle, Edit2, Check, X, RefreshCw, ChevronDown, CalendarDays, Users, Trash2, ChevronLeft, ChevronRight
} from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { MultiSelect } from '@/components/ui/MultiSelect';
import DatePicker from '@/components/ui/DatePicker';
import StatsGrid from '@/components/dashboard/StatsGrid';
import { parseIssueDescription, formatDate } from './utils';
import ServiceFormModal, { ConfirmSubmitModal } from './components/ServiceFormModal';
import ServiceDetailModal from './components/ServiceDetailModal';
import CompleteSparepartModal from './components/CompleteSparepartModal';
import BulkUploadModal from './components/BulkUploadModal';
import { UploadCloud } from 'lucide-react';
import styles from './service.module.css';

export default function ServicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCallId = searchParams.get('call_id') || searchParams.get('search') || '';

  // Core data
  const [logs, setLogs] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Available technicians from User Management with role MECHANIC / TEKNISI
  const technicianOptions = React.useMemo(() => {
    const techs = users.filter(u => {
      const r = (u.role || '').toUpperCase();
      return r === 'MECHANIC' || r === 'TEKNISI';
    });
    if (techs.length > 0) {
      return techs.map(t => ({
        value: t.name,
        label: t.name,
        badge: t.partner_id ? 'Mitra' : 'HQ',
      }));
    }
    // Fallback if users haven't loaded yet or default
    return [
      { value: 'Budi Santoso', label: 'Budi Santoso', badge: 'HQ' },
      { value: 'Andi Wijaya', label: 'Andi Wijaya', badge: 'HQ' },
      { value: 'Mutiara', label: 'Mutiara', badge: 'Teknisi' },
      { value: 'Dedi Kurniawan', label: 'Dedi Kurniawan', badge: 'Mitra' },
    ];
  }, [users]);

  // Filters
  const [searchQuery, setSearchQuery] = useState(initialCallId);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCallIds, setSelectedCallIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

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

  // Bulk Upload Modal State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  // Sub-row inline edit & add row states
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editRowDate, setEditRowDate] = useState<string>('');
  const [editRowTech, setEditRowTech] = useState<string>('');
  const [editRowAction, setEditRowAction] = useState<string>('');
  const [editRowResult, setEditRowResult] = useState<string>('');
  const [editRowStatus, setEditRowStatus] = useState<string>('');

  const [addingToCallId, setAddingToCallId] = useState<string | null>(null);
  const [newRowDate, setNewRowDate] = useState<string>(new Date().toISOString().split('T')[0]);
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
      const [logsSettled, unitsSettled, partnersSettled, usersSettled] = await Promise.allSettled([
        serviceLogApi.findAll(1, 10000),
        unitApi.findAll(1, 1000),
        partnerApi.findAll(),
        userApi.findAll(),
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

      if (usersSettled.status === 'fulfilled') {
        const res = usersSettled.value;
        const items = res.data?.data ?? (Array.isArray(res.data) ? res.data : []);
        setUsers(items);
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
    const matchesSearch = [log.unit?.serial_number, log.unit?.model_name, log.partner?.partner_name, log.issue_description, log.technician_name, log.call_id]
      .some(v => v?.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  const totalRequests = logs.length;
  const pendingRequests = logs.filter(l => l.status === 'PENDING').length;
  const completedRequests = logs.filter(l => l.status === 'COMPLETED').length;

  // Grouping logs by call_id
  const groupedLogs = (Object.values(filteredLogs.reduce((acc, log) => {
    const cid = log.call_id || log.id;
    if (!acc[cid]) acc[cid] = [];
    acc[cid].push(log);
    return acc;
  }, {} as Record<string, any[]>)) as any[][]).map((group: any[]) => {
    // Sort riwayat sub-kegiatan di dalam call_id: yang terbaru di atas
    group.sort((a, b) => new Date(b.service_date || b.created_at).getTime() - new Date(a.service_date || a.created_at).getTime());
    return { mainLog: group[0], history: group, allLogIds: group.map(g => g.id) };
  });

  // Urutkan grup tiket: Tahun/Tanggal terbaru paling atas (DESC)
  // Jadi tahun 2026 / tiket baru tampil paling depan/atas, tahun 2023 / lama di barisan belakang
  groupedLogs.sort((a, b) => {
    const timeA = new Date(a.mainLog.service_date || a.mainLog.created_at).getTime() || 0;
    const timeB = new Date(b.mainLog.service_date || b.mainLog.created_at).getTime() || 0;
    return timeB - timeA;
  });

  // Pagination kalkulasi
  const totalPages = Math.max(1, Math.ceil(groupedLogs.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, groupedLogs.length);
  const paginatedGroupedLogs = groupedLogs.slice(startIndex, endIndex);

  // Checkbox helpers
  const currentPageCallIds = paginatedGroupedLogs.map(g => g.mainLog.call_id || g.mainLog.id);
  const isAllCurrentPageSelected = currentPageCallIds.length > 0 && currentPageCallIds.every(cid => selectedCallIds.includes(cid));

  const toggleSelectAllCurrentPage = () => {
    if (isAllCurrentPageSelected) {
      setSelectedCallIds(prev => prev.filter(cid => !currentPageCallIds.includes(cid)));
    } else {
      setSelectedCallIds(prev => Array.from(new Set([...prev, ...currentPageCallIds])));
    }
  };

  const toggleSelectCallId = (cid: string) => {
    setSelectedCallIds(prev =>
      prev.includes(cid) ? prev.filter(id => id !== cid) : [...prev, cid]
    );
  };

  // Handler Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedCallIds.length === 0) return;

    try {
      setIsDeleting(true);
      // Kumpulkan semua log IDs yang termasuk dalam call_id yang dipilih
      const targetLogIds: string[] = [];
      groupedLogs.forEach(g => {
        const cid = g.mainLog.call_id || g.mainLog.id;
        if (selectedCallIds.includes(cid)) {
          targetLogIds.push(...g.allLogIds);
        }
      });

      await serviceLogApi.bulkDelete(targetLogIds);
      setSelectedCallIds([]);
      setShowBulkDeleteModal(false);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus tiket terpilih.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handler Clear All (Kosongkan Semua Data Dummy)
  const handleClearAllData = async () => {
    try {
      setIsDeleting(true);
      await serviceLogApi.clearAll();
      setShowClearAllModal(false);
      setSelectedCallIds([]);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengosongkan data.');
    } finally {
      setIsDeleting(false);
    }
  };

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
    const dateVal = hlog.scheduled_date || hlog.service_date || hlog.created_at;
    setEditRowDate(dateVal ? new Date(dateVal).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setEditRowTech(hlog.technician_name || '');
    setEditRowAction(hlog.action_taken || '');
    setEditRowResult(hlog.planning_notes || '');
    // Mapping internal status ke Progress display
    const currentProg = hlog.status === 'COMPLETED' ? 'Done' : hlog.status === 'PENDING' ? 'Waiting' : 'Scheduled';
    setEditRowStatus(currentProg);
  };

  // Handler save in-row editing (Sub row hanya update progress tanpa popup sparepart)
  const handleSaveRowEdit = async (e: React.MouseEvent, hlog: any) => {
    e.stopPropagation();

    // Map Progress (Done / Scheduled / Waiting) ke status database
    const mappedDbStatus = editRowStatus === 'Done' ? 'COMPLETED' : editRowStatus === 'Waiting' ? 'PENDING' : 'IN PROGRESS';

    try {
      setSubmitting(true);
      const { serviceLogApi } = await import('@/lib/api');
      await serviceLogApi.update(hlog.id, {
        service_date: editRowDate ? new Date(editRowDate) : undefined,
        scheduled_date: editRowDate || undefined,
        technician_name: editRowTech.trim() || undefined,
        action_taken: editRowAction.trim() || undefined,
        planning_notes: editRowResult.trim() || undefined,
        status: mappedDbStatus,
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

    // Map Progress (Done / Scheduled / Waiting) ke status database
    const mappedDbStatus = newRowStatus === 'Done' ? 'COMPLETED' : newRowStatus === 'Waiting' ? 'PENDING' : 'IN PROGRESS';

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
        service_date: newRowDate ? new Date(newRowDate) : undefined,
        scheduled_date: newRowDate || undefined,
        status: mappedDbStatus as any,
        task_type: mainLog.task_type || 'CORRECTIVE',
      });
      setAddingToCallId(null);
      setNewRowAction('');
      setNewRowResult('');
      setNewRowTech('');
      setNewRowStatus('Scheduled');
      setNewRowDate(new Date().toISOString().split('T')[0]);
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
            onClick={() => setIsBulkModalOpen(true)}
            style={{ background: '#059669', color: '#fff' }}
            title="Import data CSV / Spreadsheet servis"
          >
            <UploadCloud size={16} strokeWidth={2.5} />Import CSV
          </button>
          <button
            className="dtToolbarCreateBtn"
            onClick={() => setShowClearAllModal(true)}
            style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', border: '1px solid rgba(239, 68, 68, 0.3)' }}
            title="Bersihkan data dummy atau reset seluruh data servis"
          >
            <Trash2 size={16} strokeWidth={2.5} />Kosongkan Data
          </button>
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

      {/* Bulk Action Bar (saat ada tiket yang dicentang) */}
      {selectedCallIds.length > 0 && (
        <div className={styles.bulkBar}>
          <div className={styles.bulkBarText}>
            <CheckCircle2 size={18} style={{ color: '#60a5fa' }} />
            <span><strong>{selectedCallIds.length}</strong> tiket servis terpilih</span>
          </div>
          <div className={styles.bulkBarActions}>
            <button
              className={`${styles.bulkBtn} ${styles.bulkBtnDelete}`}
              onClick={() => setShowBulkDeleteModal(true)}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 size={14} className={styles.spin} /> : <Trash2 size={14} />}
              Hapus Tiket Terpilih
            </button>
            <button
              className={`${styles.bulkBtn} ${styles.bulkBtnCancel}`}
              onClick={() => setSelectedCallIds([])}
              disabled={isDeleting}
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Table / Cards */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><Loader2 size={36} className={styles.spin} style={{ color: 'var(--color-cobalt-blue)' }} /></div>
      ) : error ? (
        <div className={styles.errorAlert}>{error}</div>
      ) : groupedLogs.length === 0 ? (
        <div className={styles.tableContainer}><div className={styles.emptyState}><Wrench size={48} style={{ color: 'var(--color-space-grey)', opacity: 0.4 }} /><h3 className={styles.emptyTitle}>Belum Ada Log Servis</h3><p className={styles.emptyDesc}>Tidak ada permintaan servis yang sesuai.</p></div></div>
      ) : (<>
        {/* Desktop Table */}
        <div className={`${styles.tableContainer} ${styles.desktopView}`}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={isAllCurrentPageSelected}
                    onChange={toggleSelectAllCurrentPage}
                    title="Pilih semua di halaman ini"
                    style={{ cursor: 'pointer', width: '15px', height: '15px', accentColor: '#2E5BFF' }}
                  />
                </th>
                <th style={{ width: '11%' }}>CALL ID</th>
                <th style={{ width: '10%' }}>COMPLAINT DATE</th>
                <th style={{ width: '15%' }}>CUSTOMER &amp; BRANCH</th>
                <th style={{ width: '14%' }}>PRODUCT (UNIT)</th>
                <th style={{ width: '15%' }}>ISSUE </th>
                <th style={{ width: '14%' }}>HANDLING</th>
                <th style={{ width: '13%' }}>RESULT</th>
                <th style={{ width: '10%' }}>SPAREPART</th>
                <th style={{ width: '8%', textAlign: 'center' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedGroupedLogs.map(({ mainLog, history }, cardIdx) => {
                const cid = mainLog.call_id || mainLog.id;
                const isExpanded = expandedCallIds[cid];
                const cardColors = [styles.cardBlue, styles.cardEmerald, styles.cardAmber, styles.cardPurple, styles.cardRose];
                const cardAccentClass = cardColors[cardIdx % cardColors.length];
                const isChecked = selectedCallIds.includes(cid);

                return (
                  <React.Fragment key={mainLog.id}>
                    <tr className={`${cardAccentClass} ${styles.clickableRow}`} style={{ cursor: 'pointer', background: isChecked ? 'rgba(46,91,255,0.06)' : isExpanded ? 'rgba(46,91,255,0.03)' : undefined }}>
                      <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectCallId(cid)}
                          style={{ cursor: 'pointer', width: '15px', height: '15px', accentColor: '#2E5BFF' }}
                        />
                      </td>
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
                      <td onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
                        <CustomSelect
                          value={mainLog.status}
                          options={[
                            { value: 'PENDING', label: 'PENDING' },
                            { value: 'IN PROGRESS', label: 'IN PROGRESS' },
                            { value: 'COMPLETED', label: 'COMPLETED' },
                            { value: 'CANCELED', label: 'CANCELED' },
                          ]}
                          showSearch={false}
                          onChange={(newStatus) => {
                            if (newStatus === 'COMPLETED') {
                              // Trigger popup sparepart saat status di main row diubah ke COMPLETED
                              setSparepartModalTicket({
                                id: mainLog.id,
                                call_id: mainLog.call_id || mainLog.id,
                                model_name: mainLog.unit?.model_name,
                                technician_name: mainLog.technician_name || '',
                                action_taken: mainLog.action_taken || '',
                                planning_notes: mainLog.planning_notes || '',
                                status: 'COMPLETED',
                              });
                            } else {
                              // Update status biasa (PENDING / IN PROGRESS / CANCELED)
                              (async () => {
                                try {
                                  setSubmitting(true);
                                  const { serviceLogApi } = await import('@/lib/api');
                                  await serviceLogApi.update(mainLog.id, { status: newStatus });
                                  await fetchData();
                                } catch {
                                  alert('Gagal mengubah status.');
                                } finally {
                                  setSubmitting(false);
                                }
                              })();
                            }
                          }}
                          customTrigger={(opt, isOpen) => {
                            const currentVal = opt ? opt.value : mainLog.status;
                            const statusClass =
                              currentVal === 'COMPLETED'
                                ? styles.statusCompleted
                                : currentVal === 'IN PROGRESS'
                                  ? styles.statusInProgress
                                  : currentVal === 'PENDING'
                                    ? styles.statusPending
                                    : styles.statusCancelled;

                            return (
                              <button
                                type="button"
                                className={`${styles.neuStatusPillTrigger} ${statusClass}`}
                              >
                                <span>{opt ? opt.label : currentVal}</span>
                                <ChevronDown
                                  size={13}
                                  style={{
                                    transform: isOpen ? 'rotate(180deg)' : 'none',
                                    transition: 'transform 0.2s ease',
                                    opacity: 0.85,
                                  }}
                                />
                              </button>
                            );
                          }}
                        />
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={10} style={{ padding: 0, background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
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
                                  <th style={{ width: '16%' }}>Execution Date</th>
                                  <th style={{ width: '16%' }}>Technician</th>
                                  <th style={{ width: '30%' }}>Action Taken</th>
                                  <th style={{ width: '22%' }}>Result</th>
                                  <th style={{ width: '11%' }}>Progress</th>
                                  <th style={{ width: '7%', textAlign: 'center' }}>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {history.map((hlog: any) => {
                                  const isRowEditing = editingRowId === hlog.id;
                                  const progressLabel = hlog.status === 'COMPLETED' ? 'Done' : hlog.status === 'PENDING' ? 'Waiting' : 'Scheduled';
                                  return (
                                    <tr key={hlog.id}>
                                      <td style={{ color: 'var(--color-deep-navy)', fontWeight: 600 }}>
                                        {isRowEditing ? (
                                          <DatePicker
                                            value={editRowDate}
                                            onChange={(val) => setEditRowDate(val)}
                                            customTrigger={(formatted) => (
                                              <button
                                                type="button"
                                                className={styles.neuDateInput}
                                                style={{
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'space-between',
                                                  cursor: 'pointer',
                                                  textAlign: 'left',
                                                  fontSize: '0.8rem',
                                                  background: '#ffffff',
                                                }}
                                              >
                                                <span>{editRowDate || 'Pilih tanggal...'}</span>
                                                <CalendarDays size={14} style={{ color: '#2E5BFF', opacity: 0.8 }} />
                                              </button>
                                            )}
                                          />
                                        ) : (
                                          formatDate(hlog.scheduled_date || hlog.service_date || hlog.created_at)
                                        )}
                                      </td>
                                      <td>
                                        {isRowEditing ? (
                                          <div onClick={(e) => e.stopPropagation()}>
                                            <MultiSelect
                                              value={editRowTech ? editRowTech.split(',').map((s: string) => s.trim()).filter(Boolean) : []}
                                              onChange={(arr) => setEditRowTech(arr.join(', '))}
                                              options={technicianOptions}
                                              placeholder="Pilih teknisi..."
                                              fullWidth
                                            />
                                          </div>
                                        ) : (
                                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', alignItems: 'center' }}>
                                            {hlog.technician_name ? (
                                              hlog.technician_name.split(',').map((tName: string, tIdx: number) => (
                                                <span
                                                  key={tIdx}
                                                  style={{
                                                    fontSize: '0.74rem',
                                                    fontWeight: 600,
                                                    background: 'rgba(46,91,255,0.08)',
                                                    color: '#1E40AF',
                                                    padding: '2px 7px',
                                                    borderRadius: '4px',
                                                    display: 'inline-block',
                                                  }}
                                                >
                                                  {tName.trim()}
                                                </span>
                                              ))
                                            ) : (
                                              <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.78rem' }}>Menunggu Teknisi</span>
                                            )}
                                          </div>
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
                                          <CustomSelect
                                            value={editRowStatus}
                                            options={[
                                              { value: 'Done', label: 'Done' },
                                              { value: 'Scheduled', label: 'Scheduled' },
                                              { value: 'Waiting', label: 'Waiting' },
                                            ]}
                                            showSearch={false}
                                            onChange={(val) => setEditRowStatus(val)}
                                            customTrigger={(opt, isOpen) => {
                                              const cur = opt ? opt.value : editRowStatus;
                                              const pClass =
                                                cur === 'Done'
                                                  ? styles.progressDone
                                                  : cur === 'Scheduled'
                                                    ? styles.progressScheduled
                                                    : styles.progressWaiting;
                                              return (
                                                <button
                                                  type="button"
                                                  className={`${styles.neuStatusPillTrigger} ${pClass}`}
                                                  style={{ padding: '4px 10px', fontSize: '0.68rem' }}
                                                >
                                                  <span>{opt ? opt.label : cur}</span>
                                                  <ChevronDown
                                                    size={12}
                                                    style={{
                                                      transform: isOpen ? 'rotate(180deg)' : 'none',
                                                      transition: 'transform 0.2s ease',
                                                    }}
                                                  />
                                                </button>
                                              );
                                            }}
                                          />
                                        ) : (
                                          <span
                                            style={{
                                              fontSize: '0.68rem',
                                              fontWeight: 800,
                                              padding: '3px 8px',
                                              borderRadius: '12px',
                                              textTransform: 'uppercase',
                                              display: 'inline-block',
                                              background: progressLabel === 'Done' ? 'rgba(16, 185, 129, 0.12)' : progressLabel === 'Scheduled' ? 'rgba(0, 71, 171, 0.1)' : 'rgba(245, 158, 11, 0.12)',
                                              color: progressLabel === 'Done' ? '#059669' : progressLabel === 'Scheduled' ? '#0047AB' : '#d97706',
                                              border: `1px solid ${progressLabel === 'Done' ? 'rgba(16, 185, 129, 0.3)' : progressLabel === 'Scheduled' ? 'rgba(0, 71, 171, 0.25)' : 'rgba(245, 158, 11, 0.3)'}`,
                                            }}
                                          >
                                            {progressLabel}
                                          </span>
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
                                    <td>
                                      <DatePicker
                                        value={newRowDate}
                                        onChange={(val) => setNewRowDate(val)}
                                        customTrigger={(formatted) => (
                                          <button
                                            type="button"
                                            className={styles.neuDateInput}
                                            style={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'space-between',
                                              cursor: 'pointer',
                                              textAlign: 'left',
                                              fontSize: '0.8rem',
                                              background: '#ffffff',
                                            }}
                                          >
                                            <span>{newRowDate || 'Pilih tanggal...'}</span>
                                            <CalendarDays size={14} style={{ color: '#2E5BFF', opacity: 0.8 }} />
                                          </button>
                                        )}
                                      />
                                    </td>
                                    <td>
                                      <div onClick={(e) => e.stopPropagation()}>
                                        <MultiSelect
                                          value={newRowTech ? newRowTech.split(',').map((s: string) => s.trim()).filter(Boolean) : []}
                                          onChange={(arr) => setNewRowTech(arr.join(', '))}
                                          options={technicianOptions}
                                          placeholder="Pilih teknisi..."
                                          fullWidth
                                        />
                                      </div>
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
                                      <CustomSelect
                                        value={newRowStatus}
                                        options={[
                                          { value: 'Done', label: 'Done' },
                                          { value: 'Scheduled', label: 'Scheduled' },
                                          { value: 'Waiting', label: 'Waiting' },
                                        ]}
                                        showSearch={false}
                                        onChange={(val) => setNewRowStatus(val)}
                                        customTrigger={(opt, isOpen) => {
                                          const cur = opt ? opt.value : newRowStatus;
                                          const pClass =
                                            cur === 'Done'
                                              ? styles.progressDone
                                              : cur === 'Scheduled'
                                                ? styles.progressScheduled
                                                : styles.progressWaiting;
                                          return (
                                            <button
                                              type="button"
                                              className={`${styles.neuStatusPillTrigger} ${pClass}`}
                                              style={{ padding: '4px 10px', fontSize: '0.68rem' }}
                                            >
                                              <span>{opt ? opt.label : cur}</span>
                                              <ChevronDown
                                                size={12}
                                                style={{
                                                  transform: isOpen ? 'rotate(180deg)' : 'none',
                                                  transition: 'transform 0.2s ease',
                                                }}
                                              />
                                            </button>
                                          );
                                        }}
                                      />
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
          {paginatedGroupedLogs.map(({ mainLog }, cardIdx) => {
            const cid = mainLog.call_id || mainLog.id;
            const cardColors = [styles.cardBlue, styles.cardEmerald, styles.cardAmber, styles.cardPurple, styles.cardRose];
            const cardAccentClass = cardColors[cardIdx % cardColors.length];
            const isChecked = selectedCallIds.includes(cid);

            return (
              <div key={mainLog.id} className={`${styles.mobileCard} ${cardAccentClass} ${styles.clickableCard}`} onClick={() => setSelectedDetailLog(mainLog)}>
                <div className={styles.mobileCardHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => { e.stopPropagation(); toggleSelectCallId(cid); }}
                      style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#2E5BFF' }}
                    />
                    <span className={styles.mobileLogId} style={{ cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'rgba(46,91,255,0.3)' }}>{cid}</span>
                  </div>
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

        {/* ================= PAGINATION CONTROLS ================= */}
        <div className={styles.paginationContainer}>
          <div className={styles.paginationInfo}>
            Menampilkan <strong>{groupedLogs.length === 0 ? 0 : startIndex + 1}</strong> - <strong>{endIndex}</strong> dari <strong>{groupedLogs.length}</strong> tiket
            {searchQuery && <span> (difilter dari {totalRequests} total entri)</span>}
          </div>
          <div className={styles.paginationControls}>
            <button
              className={styles.paginationBtn}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={validCurrentPage <= 1}
              title="Halaman Sebelumnya"
            >
              <ChevronLeft size={16} />
            </button>
            {(() => {
              const pages: (number | string)[] = [];
              const maxButtons = 5;
              if (totalPages <= maxButtons) {
                for (let i = 1; i <= totalPages; i++) pages.push(i);
              } else {
                pages.push(1);
                if (validCurrentPage > 3) pages.push('...');
                const start = Math.max(2, validCurrentPage - 1);
                const end = Math.min(totalPages - 1, validCurrentPage + 1);
                for (let i = start; i <= end; i++) {
                  if (!pages.includes(i)) pages.push(i);
                }
                if (validCurrentPage < totalPages - 2) pages.push('...');
                if (!pages.includes(totalPages)) pages.push(totalPages);
              }

              return pages.map((p, idx) => {
                if (typeof p === 'string') {
                  return <span key={`ellipsis-${idx}`} className={styles.paginationEllipsis}>…</span>;
                }
                const isActive = p === validCurrentPage;
                return (
                  <button
                    key={p}
                    className={`${styles.paginationBtn} ${isActive ? styles.paginationBtnActive : ''}`}
                    onClick={() => setCurrentPage(p)}
                  >
                    {p}
                  </button>
                );
              });
            })()}
            <button
              className={styles.paginationBtn}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={validCurrentPage >= totalPages}
              title="Halaman Berikutnya"
            >
              <ChevronRight size={16} />
            </button>
          </div>
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
        technicianOptions={technicianOptions}
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
          technicianOptions={technicianOptions}
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
                <CustomSelect
                  value=""
                  placeholder="— Cari & Pilih Call ID —"
                  options={Array.from(new Map(logs.map(l => [l.call_id || l.id, l])).values()).map(l => ({
                    value: l.call_id || l.id,
                    label: `${l.call_id || l.id} — ${l.unit?.model_name || 'Unit'} (${l.status})`,
                  }))}
                  onChange={(val) => {
                    const selected = logs.find(l => (l.call_id || l.id) === val);
                    if (selected) {
                      setQuickStatusLog(selected);
                      setQuickStatusValue(selected.status);
                      setQuickTechnician(selected.technician_name && !selected.technician_name.includes('Pending') ? selected.technician_name : '');
                      setQuickScheduledDate(selected.scheduled_date ? selected.scheduled_date.split('T')[0] : '');
                    }
                  }}
                />
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
                <CustomSelect
                  value={quickStatusValue}
                  options={[
                    { value: 'PENDING', label: 'PENDING' },
                    { value: 'IN PROGRESS', label: 'IN PROGRESS' },
                    { value: 'COMPLETED', label: 'COMPLETED' },
                    { value: 'CANCELED', label: 'CANCELED' },
                  ]}
                  showSearch={false}
                  onChange={(val) => setQuickStatusValue(val)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Teknisi yang Ditugaskan (Bisa pilih lebih dari 1)</label>
                <MultiSelect
                  value={quickTechnician ? quickTechnician.split(',').map((s: string) => s.trim()).filter(Boolean) : []}
                  onChange={(arr) => setQuickTechnician(arr.join(', '))}
                  options={technicianOptions}
                  placeholder="Pilih teknisi yang berangkat..."
                  fullWidth
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Rencana Kunjungan / Servis</label>
                <DatePicker
                  value={quickScheduledDate}
                  onChange={(val) => setQuickScheduledDate(val)}
                  customTrigger={(formatted) => (
                    <button
                      type="button"
                      className={styles.neuDateInput}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: '0.85rem',
                        background: '#ffffff',
                        padding: '9px 12px',
                      }}
                    >
                      <span>{quickScheduledDate || 'Pilih tanggal kunjungan...'}</span>
                      <CalendarDays size={15} style={{ color: '#2E5BFF', opacity: 0.8 }} />
                    </button>
                  )}
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

      {/* Modal Bulk Upload CSV */}
      <BulkUploadModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={() => {
          fetchData();
        }}
      />

      {/* Modal Konfirmasi Kosongkan Semua Data */}
      {showClearAllModal && (
        <div className={styles.modalOverlay} onClick={() => !isDeleting && setShowClearAllModal(false)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()} style={{ maxWidth: '480px', textAlign: 'center', padding: '32px 24px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Trash2 size={28} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
              Kosongkan Seluruh Data Servis?
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5, marginBottom: '24px' }}>
              Tindakan ini akan <strong>menghapus permanen seluruh data log servis</strong> di database. Gunakan ini sebelum Anda mengimpor data melalui fitur Bulk Upload.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setShowClearAllModal(false)}
                disabled={isDeleting}
                style={{ minWidth: '100px' }}
              >
                Batal
              </button>
              <button
                type="button"
                className={styles.deleteConfirmBtn}
                onClick={handleClearAllData}
                disabled={isDeleting}
                style={{
                  background: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {isDeleting ? <Loader2 size={16} className={styles.spin} /> : <Trash2 size={16} />}
                Ya, Bersihkan Semua
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Massal Tiket Terpilih */}
      {showBulkDeleteModal && (
        <div className={styles.modalOverlay} onClick={() => !isDeleting && setShowBulkDeleteModal(false)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()} style={{ maxWidth: '480px', textAlign: 'center', padding: '32px 24px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Trash2 size={28} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
              Hapus {selectedCallIds.length} Tiket Servis?
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5, marginBottom: '24px' }}>
              Apakah Anda yakin ingin menghapus <strong>{selectedCallIds.length} tiket</strong> yang dipilih? Seluruh riwayat kunjungan dan progres pada tiket-tiket ini akan dihapus secara permanen.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setShowBulkDeleteModal(false)}
                disabled={isDeleting}
                style={{ minWidth: '100px' }}
              >
                Batal
              </button>
              <button
                type="button"
                className={styles.deleteConfirmBtn}
                onClick={handleBulkDelete}
                disabled={isDeleting}
                style={{
                  background: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {isDeleting ? <Loader2 size={16} className={styles.spin} /> : <Trash2 size={16} />}
                Ya, Hapus Terpilih
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
