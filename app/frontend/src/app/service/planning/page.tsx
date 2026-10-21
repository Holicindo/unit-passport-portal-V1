'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { serviceLogApi, unitApi, partnerApi } from '@/lib/api';
import { Calendar, Search, Loader2, ArrowLeft, Clock, AlertCircle, ChevronLeft, ChevronRight, X, GripVertical, CheckCircle2, XCircle } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import styles from './planning.module.css';
import StatsGrid from '@/components/dashboard/StatsGrid';

const TASK_LABELS: Record<string, string> = { CORRECTIVE: 'Perbaikan', PREVENTIVE: 'Perawatan', INSTALLATION: 'Instalasi' };
const TASK_STYLE: Record<string, string> = { CORRECTIVE: styles.taskCorrective, PREVENTIVE: styles.taskPreventive, INSTALLATION: styles.taskInstallation };

type KanbanCol = 'unallocated' | 'allocated' | 'completed';

function fmtDate(d: string | Date | null) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ScheduleManagementPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'kanban'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [taskFilter, setTaskFilter] = useState('ALL');

  // Calendar state
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());

  // Bulk reschedule
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleDelivery, setRescheduleDelivery] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Notes modal
  const [notesModal, setNotesModal] = useState<any | null>(null);
  const [editNotes, setEditNotes] = useState('');

  // Drag & Drop state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<KanbanCol | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [logsRes, unitsRes, partnersRes] = await Promise.all([
        serviceLogApi.findAll(1, 1000), unitApi.findAll(1, 1000), partnerApi.findAll(),
      ]);
      const logsData = logsRes.data?.data ?? (Array.isArray(logsRes.data) ? logsRes.data : []);
      setLogs(logsData.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      setUnits(unitsRes.data?.data ?? (Array.isArray(unitsRes.data) ? unitsRes.data : []));
      if (Array.isArray(partnersRes.data)) setPartners(partnersRes.data);
    } catch { setError('Gagal memuat data jadwal.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const activeLogs = useMemo(() => {
    return logs.filter(l => {
      const matchTask = taskFilter === 'ALL' || l.task_type === taskFilter;
      const q = searchQuery.toLowerCase();
      const matchSearch = [l.unit?.serial_number, l.unit?.model_name, l.technician_name, l.call_id, l.id]
        .some(v => v?.toLowerCase().includes(q));
      return matchTask && matchSearch;
    });
  }, [logs, taskFilter, searchQuery]);

  const unallocated = activeLogs.filter(l => !l.is_allocated && l.status !== 'COMPLETED' && l.status !== 'CANCELED' && l.status !== 'CANCELLED');
  const allocated = activeLogs.filter(l => l.is_allocated && l.status !== 'COMPLETED' && l.status !== 'CANCELED' && l.status !== 'CANCELLED');
  const completed = activeLogs.filter(l => l.status === 'COMPLETED' || l.status === 'CANCELED' || l.status === 'CANCELLED');

  // Calendar helpers
  const calDays = useMemo(() => {
    const first = new Date(calYear, calMonth, 1);
    const last = new Date(calYear, calMonth + 1, 0);
    const startDay = first.getDay();
    const days: (number | null)[] = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let d = 1; d <= last.getDate(); d++) days.push(d);
    return days;
  }, [calMonth, calYear]);

  const getLogsForDay = (day: number) => activeLogs.filter(l => {
    const sd = l.scheduled_date || l.service_date;
    if (!sd) return false;
    const d = new Date(sd);
    return d.getDate() === day && d.getMonth() === calMonth && d.getFullYear() === calYear;
  });
  const getDeliveriesForDay = (day: number) => activeLogs.filter(l => {
    if (!l.delivery_date) return false;
    const d = new Date(l.delivery_date);
    return d.getDate() === day && d.getMonth() === calMonth && d.getFullYear() === calYear;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBulkReschedule = async () => {
    if (!rescheduleDate) return;
    setSubmitting(true);
    try {
      await serviceLogApi.bulkReschedule(selectedIds, rescheduleDate, rescheduleDelivery || undefined);
      setSelectedIds([]); setShowRescheduleModal(false);
      setRescheduleDate(''); setRescheduleDelivery('');
      await fetchData();
    } catch { alert('Gagal mengubah jadwal.'); }
    finally { setSubmitting(false); }
  };

  const handleSaveNotes = async () => {
    if (!notesModal) return;
    setSubmitting(true);
    try {
      await serviceLogApi.update(notesModal.id, { internal_notes: editNotes, is_allocated: true });
      setNotesModal(null);
      await fetchData();
    } catch { alert('Gagal menyimpan catatan.'); }
    finally { setSubmitting(false); }
  };

  // ── Drag & Drop Handlers ──
  const handleDragStart = (e: React.DragEvent, logId: string) => {
    setDraggedId(logId);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', logId);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverCol(null);
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent, col: KanbanCol) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(col);
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = async (e: React.DragEvent, targetCol: KanbanCol) => {
    e.preventDefault();
    setDragOverCol(null);
    setIsDragging(false);

    const logId = e.dataTransfer.getData('text/plain') || draggedId;
    setDraggedId(null);
    if (!logId) return;

    const log = logs.find(l => l.id === logId);
    if (!log) return;

    const currentCol: KanbanCol =
      (log.status === 'COMPLETED' || log.status === 'CANCELED' || log.status === 'CANCELLED') ? 'completed'
        : log.is_allocated ? 'allocated' : 'unallocated';

    if (currentCol === targetCol) return;

    // ── Optimistic update: update local state IMMEDIATELY ──
    let patchedLog = { ...log };
    if (targetCol === 'unallocated') {
      patchedLog.is_allocated = false;
    } else if (targetCol === 'allocated') {
      patchedLog.is_allocated = true;
      if (patchedLog.status === 'PENDING') patchedLog.status = 'IN PROGRESS';
    } else if (targetCol === 'completed') {
      patchedLog.is_allocated = true;
      patchedLog.status = 'COMPLETED';
    }

    // Update local state instantly (no loading)
    setLogs(prev => prev.map(l => l.id === logId ? patchedLog : l));

    // Fire API in background (no await on UI side)
    try {
      const payload: any = {};
      if (targetCol === 'unallocated') payload.is_allocated = false;
      else if (targetCol === 'allocated') { payload.is_allocated = true; payload.status = patchedLog.status; }
      else if (targetCol === 'completed') { payload.is_allocated = true; payload.status = 'COMPLETED'; }
      await serviceLogApi.update(logId, payload);
    } catch {
      // Rollback on failure
      setLogs(prev => prev.map(l => l.id === logId ? log : l));
      alert('Gagal memindahkan tiket. Perubahan dibatalkan.');
    }
  };

  const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const dayNames = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
  const today = new Date();

  // Render kanban card
  const renderCard = (log: any) => {
    const isDragged = draggedId === log.id;
    const isCompleted = log.status === 'COMPLETED';
    const isCanceled = log.status === 'CANCELED' || log.status === 'CANCELLED';

    return (
      <div
        key={log.id}
        className={styles.kanbanCard}
        draggable
        onDragStart={(e) => handleDragStart(e, log.id)}
        onDragEnd={handleDragEnd}
        style={{
          opacity: isDragged ? 0.35 : 1,
          cursor: isDragged ? 'grabbing' : 'grab',
          transition: 'opacity 0.15s, box-shadow 0.15s',
          boxShadow: isDragged ? '0 16px 40px rgba(0,0,0,0.18)' : undefined,
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      >
        {/* Card Header: Call ID + Task Type */}
        <div className={styles.kanbanCardHeader} style={{ cursor: 'grab' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <GripVertical size={14} style={{ color: '#cbd5e1', flexShrink: 0 }} />
            <input type="checkbox" className={styles.kanbanCheckbox} checked={selectedIds.includes(log.id)}
              onChange={() => toggleSelect(log.id)} onClick={e => e.stopPropagation()} />
            <span className={styles.kanbanCallId}>{log.call_id || log.id}</span>
          </div>
          <span className={`${styles.kanbanTaskBadge} ${TASK_STYLE[log.task_type] || styles.taskCorrective}`}>
            {TASK_LABELS[log.task_type] || 'Perbaikan'}
          </span>
        </div>

        {/* Unit info */}
        <div>
          <div className={styles.kanbanUnit}>{log.unit?.model_name || 'Unit'}</div>
          <div className={styles.kanbanSn}>SN: {log.unit?.serial_number || '-'}</div>
        </div>

        {/* Date & Status row */}
        <div className={styles.kanbanMeta}>
          <Calendar size={12} /> {fmtDate(log.scheduled_date || log.service_date)}
          {log.delivery_date && <><span style={{ margin: '0 4px' }}>|</span> {fmtDate(log.delivery_date)}</>}
        </div>
        <div className={styles.kanbanMeta} style={{ marginTop: '4px' }}>
          {/* Status badge — lebih dominan di kolom selesai */}
          {isCompleted ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(16,185,129,0.12)', color: '#059669', borderRadius: '5px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: 800, border: '1px solid rgba(16,185,129,0.3)' }}>
              <CheckCircle2 size={11} /> SELESAI
            </span>
          ) : isCanceled ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(239,68,68,0.1)', color: '#dc2626', borderRadius: '5px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: 800, border: '1px solid rgba(239,68,68,0.25)' }}>
              <XCircle size={11} /> BATAL
            </span>
          ) : (
            <span className={`${styles.badge} ${log.status === 'PENDING' ? styles.badgePending : log.status === 'IN PROGRESS' ? styles.badgeInProgress : styles.badgeCancelled}`}>{log.status}</span>
          )}
          <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#64748b' }}>{log.technician_name || 'Belum alokasi'}</span>
        </div>

        {/* Result Servis (read-only) */}
        {log.planning_notes && (
          <div className={styles.kanbanNotes} style={{ background: 'rgba(4,120,87,0.06)', borderLeft: '3px solid #10b981', color: '#047857' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, display: 'block', marginBottom: '2px', opacity: 0.7 }}>RESULT</span>
            {log.planning_notes.length > 80 ? log.planning_notes.slice(0, 80) + '…' : log.planning_notes}
          </div>
        )}

        {/* Catatan Internal Admin */}
        {log.internal_notes && (
          <div className={styles.kanbanNotes} style={{ background: 'rgba(100,116,139,0.07)', borderLeft: '3px solid #94a3b8' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, display: 'block', marginBottom: '2px', opacity: 0.7 }}>CATATAN INTERNAL</span>
            {log.internal_notes.length > 80 ? log.internal_notes.slice(0, 80) + '…' : log.internal_notes}
          </div>
        )}

        <button onClick={() => { setNotesModal(log); setEditNotes(log.internal_notes || ''); }}
          style={{ marginTop: '6px', width: '100%', background: '#001F3F', border: 'none', borderRadius: '6px', padding: '6px 8px', fontSize: '0.72rem', color: 'white', cursor: 'pointer', fontWeight: 700, transition: 'background 0.2s' }}>
          {log.internal_notes ? 'Edit Catatan Internal' : 'Tambah Catatan Internal'}
        </button>
      </div>
    );
  };

  // Column drop zone wrapper
  const DropColumn = ({ col, title, count, icon, children, accentColor }: {
    col: KanbanCol; title: string; count: number; icon: React.ReactNode; children: React.ReactNode; accentColor: string;
  }) => {
    const isOver = dragOverCol === col;
    return (
      <div
        className={styles.kanbanColumn}
        onDragOver={(e) => handleDragOver(e, col)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, col)}
        style={{
          transition: 'background 0.2s, box-shadow 0.2s',
          background: isOver ? `rgba(${accentColor}, 0.06)` : undefined,
          boxShadow: isOver ? `inset 0 0 0 2px rgba(${accentColor}, 0.4)` : undefined,
          borderRadius: isOver ? '12px' : undefined,
        }}
      >
        <div className={styles.kanbanHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {icon}
            <span className={styles.kanbanTitle}>{title}</span>
          </div>
          <span className={styles.kanbanCount}>{count}</span>
        </div>
        {isOver && isDragging && (
          <div style={{
            margin: '8px 8px 0',
            padding: '12px',
            border: `2px dashed rgba(${accentColor}, 0.5)`,
            borderRadius: '8px',
            textAlign: 'center',
            fontSize: '0.78rem',
            fontWeight: 700,
            color: `rgba(${accentColor}, 0.7)`,
            background: `rgba(${accentColor}, 0.04)`,
          }}>
            Lepas di sini untuk memindahkan
          </div>
        )}
        <div className={styles.kanbanBody}>
          {children}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <header className={styles.pageHeader}>
        <div className={styles.titleSection}>
          <button onClick={() => router.push('/service')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--color-space-grey)', cursor: 'pointer', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 700 }}>
            <ArrowLeft size={16} /><span>Kembali ke Log Servis</span>
          </button>
          <h2 className={styles.title}>Pengaturan Jadwal</h2>
          <p className={styles.subtitle}>Kelola jadwal servis, perawatan & pengiriman — drag & drop card untuk memindahkan status.</p>
        </div>
        <div className={styles.viewTabs}>
          <button className={`${styles.viewTab} ${viewMode === 'kanban' ? styles.viewTabActive : ''}`} onClick={() => setViewMode('kanban')}>Kanban</button>
          <button className={`${styles.viewTab} ${viewMode === 'calendar' ? styles.viewTabActive : ''}`} onClick={() => setViewMode('calendar')}>Kalender</button>
        </div>
      </header>

      <div className="mobile-sub-tabs">
        <button className="mobile-sub-tab" onClick={() => router.push('/service')}>Log Servis</button>
        <button className="mobile-sub-tab active" onClick={() => router.push('/service/planning')}>Pengaturan Jadwal</button>
        <button className="mobile-sub-tab" onClick={() => router.push('/service/evaluation')}>Evaluasi Servis</button>
      </div>

      <StatsGrid loading={loading} items={[
        { label: 'Belum Dialokasi', value: loading ? '...' : unallocated.length, max: 100, icon: AlertCircle, accent: '#FF5722' },
        { label: 'Sudah Terjadwal', value: loading ? '...' : allocated.length, max: 100, icon: Clock, accent: '#3b82f6' },
        { label: 'Selesai / Batal', value: loading ? '...' : completed.length, max: 100, icon: Calendar, accent: '#10b981' },
      ]} />

      <div className="dtToolbar">
        <div className="dtToolbarLeft">
          <div className="dtToolbarText">Jenis:</div>
          <CustomSelect value={taskFilter} onChange={setTaskFilter}
            options={[
              { value: 'ALL', label: 'Semua Jenis' }, { value: 'CORRECTIVE', label: 'Perbaikan' },
              { value: 'PREVENTIVE', label: 'Perawatan' }, { value: 'INSTALLATION', label: 'Instalasi' },
            ]} />
        </div>
        <div className="dtToolbarRight">
          {isDragging && (
            <span style={{ fontSize: '0.8rem', color: '#2E5BFF', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'rgba(46,91,255,0.08)', borderRadius: '8px' }}>
              <GripVertical size={14} /> Drag ke kolom tujuan...
            </span>
          )}
          <div className="dtToolbarSearch">
            <input type="text" placeholder="Cari SN, model, Call ID..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)} className="dtToolbarSearchInput" />
            <Search size={16} className="dtToolbarSearchIcon" />
          </div>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.length > 0 && (
        <div className={styles.bulkBar}>
          <span className={styles.bulkBarText}>{selectedIds.length} tiket dipilih</span>
          <div className={styles.bulkBarActions}>
            <button className={`${styles.bulkBtn} ${styles.bulkBtnReschedule}`}
              onClick={() => { setRescheduleDate(''); setRescheduleDelivery(''); setShowRescheduleModal(true); }}>
              Ubah Jadwal Massal
            </button>
            <button className={`${styles.bulkBtn} ${styles.bulkBtnCancel}`} onClick={() => setSelectedIds([])}>Batal Pilih</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Loader2 size={36} className={styles.spin} style={{ color: 'var(--color-cobalt-blue)' }} />
        </div>
      ) : error ? (
        <div className={styles.errorAlert}>{error}</div>
      ) : viewMode === 'calendar' ? (
        /* ============ CALENDAR VIEW ============ */
        <div className={styles.calendarContainer}>
          <div className={styles.calendarHeader}>
            <div className={styles.calendarNav}>
              <button className={styles.calendarNavBtn} onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }}><ChevronLeft size={16} /></button>
            </div>
            <h3 className={styles.calendarTitle}>{monthNames[calMonth]} {calYear}</h3>
            <div className={styles.calendarNav}>
              <button className={styles.calendarNavBtn} onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }}><ChevronRight size={16} /></button>
            </div>
          </div>
          <div className={styles.calendarGrid}>
            {dayNames.map(d => <div key={d} className={styles.calendarDayHeader}>{d}</div>)}
            {calDays.map((day, i) => {
              if (day === null) return <div key={`e${i}`} className={`${styles.calendarDay} ${styles.calendarDayEmpty}`} />;
              const sLogs = getLogsForDay(day);
              const dLogs = getDeliveriesForDay(day);
              const isToday = day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
              const serviceCount = sLogs.filter(l => l.task_type !== 'INSTALLATION').length;
              const installCount = sLogs.filter(l => l.task_type === 'INSTALLATION').length;
              return (
                <div key={day} className={`${styles.calendarDay} ${isToday ? styles.calendarDayToday : ''}`}>
                  <div className={styles.calendarDayNum}>{day}</div>
                  <div>
                    {serviceCount > 0 && <><span className={`${styles.calendarDot} ${styles.calendarDotService}`} /><span className={styles.calendarDayCount}>{serviceCount}</span> </>}
                    {dLogs.length > 0 && <><span className={`${styles.calendarDot} ${styles.calendarDotDelivery}`} /><span className={styles.calendarDayCount}>{dLogs.length}</span> </>}
                    {installCount > 0 && <><span className={`${styles.calendarDot} ${styles.calendarDotInstall}`} /><span className={styles.calendarDayCount}>{installCount}</span></>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className={styles.calendarLegend}>
            <div className={styles.legendItem}><span className={`${styles.calendarDot} ${styles.calendarDotService}`} /> Servis</div>
            <div className={styles.legendItem}><span className={`${styles.calendarDot} ${styles.calendarDotDelivery}`} /> Delivery</div>
            <div className={styles.legendItem}><span className={`${styles.calendarDot} ${styles.calendarDotInstall}`} /> Instalasi</div>
          </div>
        </div>
      ) : (
        /* ============ KANBAN VIEW ============ */
        <div className={styles.kanbanContainer}>
          <DropColumn col="unallocated" title="Belum Dialokasi" count={unallocated.length}
            icon={<AlertCircle size={14} style={{ color: '#FF5722' }} />} accentColor="255,87,34">
            {unallocated.length === 0
              ? <div className={styles.emptyState}><AlertCircle size={24} style={{ opacity: 0.3 }} /><p className={styles.emptyDesc}>Semua tiket sudah dialokasi</p></div>
              : unallocated.map(renderCard)}
          </DropColumn>

          <DropColumn col="allocated" title="Sudah Terjadwal" count={allocated.length}
            icon={<Clock size={14} style={{ color: '#2E5BFF' }} />} accentColor="46,91,255">
            {allocated.length === 0
              ? <div className={styles.emptyState}><Clock size={24} style={{ opacity: 0.3 }} /><p className={styles.emptyDesc}>Belum ada jadwal aktif</p></div>
              : allocated.map(renderCard)}
          </DropColumn>

          <DropColumn col="completed" title="Selesai / Batal" count={completed.length}
            icon={<CheckCircle2 size={14} style={{ color: '#059669' }} />} accentColor="5,150,105">
            {completed.length === 0
              ? <div className={styles.emptyState}><Calendar size={24} style={{ opacity: 0.3 }} /><p className={styles.emptyDesc}>Belum ada yang selesai</p></div>
              : completed.slice(0, 20).map(renderCard)}
          </DropColumn>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className={styles.modalOverlay} onClick={() => setShowRescheduleModal(false)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Ubah Jadwal Massal ({selectedIds.length} tiket)</h3>
              <button className={styles.closeBtn} onClick={() => setShowRescheduleModal(false)}><X size={20} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Tanggal Servis Baru *</label>
                <input type="date" value={rescheduleDate} onChange={e => setRescheduleDate(e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label>Tanggal Delivery Baru (opsional)</label>
                <input type="date" value={rescheduleDelivery} onChange={e => setRescheduleDelivery(e.target.value)} />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowRescheduleModal(false)}>Batal</button>
              <button className={styles.saveBtn} disabled={!rescheduleDate || submitting} onClick={handleBulkReschedule}>
                {submitting ? 'Menyimpan...' : 'Terapkan Jadwal Baru'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {notesModal && (
        <div className={styles.modalOverlay} onClick={() => setNotesModal(null)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Catatan Internal — {notesModal.call_id || notesModal.id}</h3>
              <button className={styles.closeBtn} onClick={() => setNotesModal(null)}><X size={20} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Catatan Internal Admin <span style={{ fontWeight: 400, color: '#94a3b8' }}>(hanya terlihat oleh admin/teknisi)</span></label>
                <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)}
                  placeholder="Contoh: Perlu bawa spare part kompresor, koordinasi dengan mitra Surabaya..." rows={4} />
              </div>
              {notesModal?.planning_notes && (
                <div style={{ padding: '10px 14px', background: 'rgba(4,120,87,0.06)', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.2)', fontSize: '0.82rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#047857', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>Result Servis (dari Log Servis)</span>
                  <span style={{ color: '#064e3b' }}>{notesModal.planning_notes}</span>
                </div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setNotesModal(null)}>Batal</button>
              <button className={styles.saveBtn} disabled={submitting} onClick={handleSaveNotes}>
                {submitting ? 'Menyimpan...' : 'Simpan & Alokasi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
