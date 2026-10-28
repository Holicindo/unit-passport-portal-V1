'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { installationApi, unitApi, partnerApi } from '@/lib/api';
import {
  Wrench, Search, Plus, Loader2, CheckCircle2, AlertTriangle, Edit2, Check, X, RefreshCw, ChevronDown, CalendarDays, Settings
} from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import DatePicker from '@/components/ui/DatePicker';
import StatsGrid from '@/components/dashboard/StatsGrid';
import styles from '../service.module.css';

function formatDate(d: string | Date | null) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function InstallationLogPage() {
  const router = useRouter();

  // Core data
  const [installations, setInstallations] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [pageSize, setPageSize] = useState(20);

  // Expanded state
  const [expandedUnitIds, setExpandedUnitIds] = useState<Record<string, boolean>>({});

  // Inline editing
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editRowDate, setEditRowDate] = useState<string>('');
  const [editRowLocation, setEditRowLocation] = useState<string>('');
  const [editRowTechnician, setEditRowTechnician] = useState<string>('');
  const [editRowPartner, setEditRowPartner] = useState<string>('');
  const [editRowNotes, setEditRowNotes] = useState<string>('');
  const [editRowStatus, setEditRowStatus] = useState<string>('');

  // Add sub-row
  const [addingToUnitId, setAddingToUnitId] = useState<string | null>(null);
  const [newRowDate, setNewRowDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newRowLocation, setNewRowLocation] = useState<string>('');
  const [newRowTechnician, setNewRowTechnician] = useState<string>('');
  const [newRowPartner, setNewRowPartner] = useState<string>('');
  const [newRowNotes, setNewRowNotes] = useState<string>('');
  const [newRowStatus, setNewRowStatus] = useState<string>('SCHEDULED');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [instSettled, unitsSettled, partnersSettled] = await Promise.allSettled([
        installationApi.findAll(1, 500),
        unitApi.findAll(1, 1000),
        partnerApi.findAll(),
      ]);

      if (instSettled.status === 'fulfilled') {
        const res = instSettled.value;
        const items = res.data?.data ?? (Array.isArray(res.data) ? res.data : []);
        setInstallations(items);
      }

      if (unitsSettled.status === 'fulfilled') {
        const res = unitsSettled.value;
        const items = res.data?.data ?? (Array.isArray(res.data) ? res.data : []);
        setUnits(items);
      }

      if (partnersSettled.status === 'fulfilled') {
        const res = partnersSettled.value;
        const items = res.data?.data ?? (Array.isArray(res.data) ? res.data : []);
        setPartners(items);
      }

      if (instSettled.status === 'rejected' && unitsSettled.status === 'rejected') {
        setError('Gagal memuat data instalasi.');
      }
    } catch (err) {
      console.error('fetchData error:', err);
      setError('Gagal memuat data instalasi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredInstallations = installations.filter(inst => {
    const matchesStatus = statusFilter === 'ALL' || inst.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = [
      inst.unit?.serial_number,
      inst.unit?.model_name,
      inst.partner?.partner_name,
      inst.location,
      inst.technician_name,
      inst.notes
    ].some(v => v?.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  }).slice(0, pageSize);

  const totalInstallations = installations.length;
  const pendingInstallations = installations.filter(i => i.status === 'SCHEDULED' || i.status === 'IN_PROGRESS').length;
  const completedInstallations = installations.filter(i => i.status === 'DONE').length;

  // Group by unitId
  const groupedInstallations = (Object.values(filteredInstallations.reduce((acc, inst) => {
    const uid = inst.unit?.id || 'unknown';
    if (!acc[uid]) acc[uid] = [];
    acc[uid].push(inst);
    return acc;
  }, {} as Record<string, any[]>)) as any[][]).map((group: any[]) => {
    group.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return { mainInstallation: group[0], history: group };
  });

  const toggleExpand = (e: React.MouseEvent, unitId: string) => {
    e.stopPropagation();
    setExpandedUnitIds(prev => ({ ...prev, [unitId]: !prev[unitId] }));
  };

  const handleStartRowEdit = (e: React.MouseEvent, inst: any) => {
    e.stopPropagation();
    setEditingRowId(inst.id);
    const dateVal = inst.installation_date || inst.created_at;
    setEditRowDate(dateVal ? new Date(dateVal).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setEditRowLocation(inst.location || '');
    setEditRowTechnician(inst.technician_name || '');
    setEditRowPartner(inst.partner?.id || '');
    setEditRowNotes(inst.notes || '');
    setEditRowStatus(inst.status || 'SCHEDULED');
  };

  const handleSaveRowEdit = async (e: React.MouseEvent, inst: any) => {
    e.stopPropagation();
    try {
      setSubmitting(true);
      await installationApi.update(inst.id, {
        installation_date: editRowDate || undefined,
        location: editRowLocation.trim() || undefined,
        technician_name: editRowTechnician.trim() || undefined,
        partnerId: editRowPartner || undefined,
        notes: editRowNotes.trim() || undefined,
        status: editRowStatus,
      });
      setEditingRowId(null);
      await fetchData();
    } catch {
      alert('Gagal menyimpan perubahan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveNewSubRow = async (e: React.MouseEvent, mainInst: any) => {
    e.stopPropagation();
    if (!newRowLocation.trim()) {
      alert('Lokasi instalasi harus diisi.');
      return;
    }

    try {
      setSubmitting(true);
      await installationApi.create({
        unitId: mainInst.unit?.id,
        partnerId: newRowPartner || undefined,
        installation_date: newRowDate || undefined,
        location: newRowLocation.trim(),
        technician_name: newRowTechnician.trim() || undefined,
        notes: newRowNotes.trim() || undefined,
        status: newRowStatus,
      });
      setAddingToUnitId(null);
      setNewRowLocation('');
      setNewRowTechnician('');
      setNewRowPartner('');
      setNewRowNotes('');
      setNewRowStatus('SCHEDULED');
      setNewRowDate(new Date().toISOString().split('T')[0]);
      await fetchData();
    } catch {
      alert('Gagal menambahkan instalasi baru.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.pageHeader}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Log Instalasi</h1>
          <p className={styles.subtitle}>Kelola catatan instalasi unit di lokasi customer</p>
        </div>
      </header>

      <StatsGrid
        loading={loading}
        items={[
          { label: 'Total Instalasi', value: loading ? '...' : totalInstallations, max: 1000, icon: Settings, accent: '#8b5cf6' },
          { label: 'Proses / Scheduled', value: loading ? '...' : pendingInstallations, max: 100, icon: Wrench, accent: '#FF6B00' },
          { label: 'Selesai (Done)', value: loading ? '...' : completedInstallations, max: 1000, icon: CheckCircle2, accent: '#00C48C' },
        ]}
      />

      {/* Toolbar */}
      <div className="dtToolbar">
        <div className="dtToolbarLeft">
          <div className="dtToolbarText">Show
            <CustomSelect
              options={[{ value: '20', label: '20' }, { value: '50', label: '50' }, { value: '100', label: '100' }]}
              value={pageSize.toString()}
              onChange={(val) => setPageSize(parseInt(val, 10))}
            />
            entries
          </div>
          <CustomSelect
            options={[
              { value: 'ALL', label: 'Semua Status' },
              { value: 'SCHEDULED', label: 'SCHEDULED' },
              { value: 'IN_PROGRESS', label: 'IN_PROGRESS' },
              { value: 'DONE', label: 'DONE' },
              { value: 'CANCELLED', label: 'CANCELLED' }
            ]}
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
          />
        </div>
        <div className="dtToolbarRight">
          <div className="dtToolbarSearch">
            <input
              type="text"
              placeholder="Cari SN, lokasi, teknisi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="dtToolbarSearchInput"
            />
            <Search size={16} className="dtToolbarSearchIcon" />
          </div>
          <button
            className="dtToolbarCreateBtn"
            onClick={() => {
              alert('Fitur tambah instalasi baru akan segera hadir!');
            }}
            style={{ background: '#2E5BFF', color: '#fff' }}
          >
            <Plus size={16} strokeWidth={2.5} />Tambah Instalasi
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Loader2 size={36} className={styles.spin} style={{ color: 'var(--color-cobalt-blue)' }} />
        </div>
      ) : error ? (
        <div className={styles.errorAlert}>{error}</div>
      ) : filteredInstallations.length === 0 ? (
        <div className={styles.tableContainer}>
          <div className={styles.emptyState}>
            <Wrench size={48} style={{ color: 'var(--color-space-grey)', opacity: 0.4 }} />
            <h3 className={styles.emptyTitle}>Belum Ada Data Instalasi</h3>
            <p className={styles.emptyDesc}>Tidak ada instalasi yang sesuai dengan filter.</p>
          </div>
        </div>
      ) : (
        <div className={`${styles.tableContainer} ${styles.desktopView}`}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '11%' }}>ID</th>
                <th style={{ width: '10%' }}>TGL INSTALASI</th>
                <th style={{ width: '15%' }}>CUSTOMER &amp; BRANCH</th>
                <th style={{ width: '14%' }}>PRODUCT (UNIT)</th>
                <th style={{ width: '18%' }}>LOKASI INSTALASI</th>
                <th style={{ width: '12%' }}>TEKNISI</th>
                <th style={{ width: '12%' }}>CATATAN</th>
                <th style={{ width: '8%', textAlign: 'center' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {groupedInstallations.map(({ mainInstallation, history }, cardIdx) => {
                const unitId = mainInstallation.unit?.id || 'unknown';
                const isExpanded = expandedUnitIds[unitId];
                const cardColors = [styles.cardBlue, styles.cardEmerald, styles.cardAmber, styles.cardPurple, styles.cardRose];
                const cardAccentClass = cardColors[cardIdx % cardColors.length];

                return (
                  <React.Fragment key={mainInstallation.id}>
                    <tr className={`${cardAccentClass} ${styles.clickableRow}`} style={{ cursor: 'pointer', background: isExpanded ? 'rgba(46,91,255,0.03)' : undefined }}>
                      <td className={styles.logId}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={(e) => toggleExpand(e, unitId)}
                            className={styles.expandBtn}
                            title={isExpanded ? 'Tutup riwayat' : 'Buka riwayat'}
                          >
                            {isExpanded ? '-' : '+'}
                          </button>
                          <span className={styles.callIdLink}>{mainInstallation.id}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--color-deep-navy)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          {formatDate(mainInstallation.installation_date || mainInstallation.created_at)}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--color-deep-navy)', fontSize: '0.84rem' }}>
                            {mainInstallation.unit?.current_client?.company_name || 'Customer Umum'}
                          </span>
                          <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                            {mainInstallation.unit?.city || 'Pusat / Cabang'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.unitLink} onClick={() => router.push(`/id/${mainInstallation.unit?.qr_token}`)}>
                          <span className={styles.unitModel}>{mainInstallation.unit?.model_name || 'Unit Tidak Diketahui'}</span>
                          <span className={styles.unitSn}>SN: {mainInstallation.unit?.serial_number || '-'}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 500 }}>
                          {mainInstallation.location || <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>—</span>}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 600 }}>
                          {mainInstallation.technician_name || <span style={{ fontStyle: 'italic', color: '#94a3b8', fontWeight: 400 }}>Belum ditugaskan</span>}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          {mainInstallation.notes ? (mainInstallation.notes.length > 30 ? mainInstallation.notes.slice(0, 30) + '…' : mainInstallation.notes) : '—'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <CustomSelect
                          value={mainInstallation.status}
                          options={[
                            { value: 'SCHEDULED', label: 'SCHEDULED' },
                            { value: 'IN_PROGRESS', label: 'IN_PROGRESS' },
                            { value: 'DONE', label: 'DONE' },
                            { value: 'CANCELLED', label: 'CANCELLED' },
                          ]}
                          showSearch={false}
                          onChange={(newStatus) => {
                            (async () => {
                              try {
                                setSubmitting(true);
                                await installationApi.update(mainInstallation.id, { status: newStatus });
                                await fetchData();
                              } catch {
                                alert('Gagal mengubah status.');
                              } finally {
                                setSubmitting(false);
                              }
                            })();
                          }}
                          customTrigger={(opt, isOpen) => {
                            const currentVal = opt ? opt.value : mainInstallation.status;
                            const statusClass =
                              currentVal === 'DONE'
                                ? styles.statusCompleted
                                : currentVal === 'IN_PROGRESS'
                                  ? styles.statusInProgress
                                  : currentVal === 'SCHEDULED'
                                    ? styles.statusPending
                                    : styles.statusCancelled;

                            return (
                              <button type="button" className={`${styles.neuStatusPillTrigger} ${statusClass}`}>
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

                    {/* Sub-rows */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} style={{ padding: 0, background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                          <div style={{ padding: '16px 24px 16px 36px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                              <h4 style={{ fontSize: '0.8rem', color: '#1e293b', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 800 }}>
                                Riwayat Instalasi (Unit: {mainInstallation.unit?.serial_number})
                              </h4>
                              {addingToUnitId !== unitId && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAddingToUnitId(unitId);
                                    setNewRowPartner(mainInstallation.partner?.id || '');
                                    setNewRowTechnician('');
                                    setNewRowLocation('');
                                    setNewRowNotes('');
                                    setNewRowStatus('SCHEDULED');
                                  }}
                                  className={styles.subRowAddBtn}
                                  title="Tambah instalasi baru"
                                >
                                  <Plus size={14} /> Tambah Instalasi
                                </button>
                              )}
                            </div>

                            <table className={styles.subRowTable}>
                              <thead>
                                <tr>
                                  <th style={{ width: '14%' }}>Tanggal</th>
                                  <th style={{ width: '22%' }}>Lokasi</th>
                                  <th style={{ width: '15%' }}>Teknisi</th>
                                  <th style={{ width: '15%' }}>Mitra</th>
                                  <th style={{ width: '18%' }}>Catatan</th>
                                  <th style={{ width: '10%' }}>Status</th>
                                  <th style={{ width: '6%', textAlign: 'center' }}>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {history.map((inst: any) => {
                                  const isRowEditing = editingRowId === inst.id;
                                  return (
                                    <tr key={inst.id}>
                                      <td style={{ color: 'var(--color-deep-navy)', fontWeight: 600 }}>
                                        {isRowEditing ? (
                                          <DatePicker
                                            value={editRowDate}
                                            onChange={(val) => setEditRowDate(val)}
                                            customTrigger={() => (
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
                                          formatDate(inst.installation_date || inst.created_at)
                                        )}
                                      </td>
                                      <td>
                                        {isRowEditing ? (
                                          <input
                                            type="text"
                                            value={editRowLocation}
                                            onChange={(e) => setEditRowLocation(e.target.value)}
                                            placeholder="Lokasi instalasi..."
                                            style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #2E5BFF', fontSize: '0.82rem', fontFamily: 'inherit' }}
                                          />
                                        ) : (
                                          <span style={{ color: '#334155', lineHeight: 1.4 }}>{inst.location || '—'}</span>
                                        )}
                                      </td>
                                      <td>
                                        {isRowEditing ? (
                                          <input
                                            type="text"
                                            value={editRowTechnician}
                                            onChange={(e) => setEditRowTechnician(e.target.value)}
                                            placeholder="Nama teknisi..."
                                            style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #8b5cf6', fontSize: '0.82rem', fontFamily: 'inherit' }}
                                          />
                                        ) : (
                                          <span style={{ color: '#334155', fontWeight: 600 }}>{inst.technician_name || '—'}</span>
                                        )}
                                      </td>
                                      <td>
                                        {isRowEditing ? (
                                          <select
                                            value={editRowPartner}
                                            onChange={(e) => setEditRowPartner(e.target.value)}
                                            style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.82rem' }}
                                          >
                                            <option value="">—</option>
                                            {partners.map((p: any) => (
                                              <option key={p.id} value={p.id}>{p.partner_name}</option>
                                            ))}
                                          </select>
                                        ) : (
                                          <span style={{ color: '#334155' }}>{inst.partner?.partner_name || '—'}</span>
                                        )}
                                      </td>
                                      <td>
                                        {isRowEditing ? (
                                          <textarea
                                            value={editRowNotes}
                                            onChange={(e) => setEditRowNotes(e.target.value)}
                                            placeholder="Catatan..."
                                            style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #10b981', fontSize: '0.82rem', minHeight: '44px', fontFamily: 'inherit' }}
                                          />
                                        ) : (
                                          <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{inst.notes || '—'}</span>
                                        )}
                                      </td>
                                      <td>
                                        {isRowEditing ? (
                                          <CustomSelect
                                            value={editRowStatus}
                                            options={[
                                              { value: 'SCHEDULED', label: 'SCHEDULED' },
                                              { value: 'IN_PROGRESS', label: 'IN_PROGRESS' },
                                              { value: 'DONE', label: 'DONE' },
                                              { value: 'CANCELLED', label: 'CANCELLED' },
                                            ]}
                                            showSearch={false}
                                            onChange={(val) => setEditRowStatus(val)}
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
                                              background: inst.status === 'DONE' ? 'rgba(16, 185, 129, 0.12)' : inst.status === 'IN_PROGRESS' ? 'rgba(59, 130, 246, 0.12)' : inst.status === 'SCHEDULED' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(148, 163, 184, 0.12)',
                                              color: inst.status === 'DONE' ? '#059669' : inst.status === 'IN_PROGRESS' ? '#2563eb' : inst.status === 'SCHEDULED' ? '#d97706' : '#64748b',
                                              border: `1px solid ${inst.status === 'DONE' ? 'rgba(16, 185, 129, 0.3)' : inst.status === 'IN_PROGRESS' ? 'rgba(59, 130, 246, 0.3)' : inst.status === 'SCHEDULED' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(148, 163, 184, 0.3)'}`,
                                            }}
                                          >
                                            {inst.status}
                                          </span>
                                        )}
                                      </td>
                                      <td style={{ textAlign: 'center' }}>
                                        {isRowEditing ? (
                                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                            <button
                                              type="button"
                                              onClick={(e) => handleSaveRowEdit(e, inst)}
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
                                            onClick={(e) => handleStartRowEdit(e, inst)}
                                            className={styles.subRowBtn}
                                            title="Edit"
                                          >
                                            <Edit2 size={12} /> Edit
                                          </button>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}

                                {/* Add new sub-row */}
                                {addingToUnitId === unitId && (
                                  <tr style={{ background: 'rgba(46,91,255,0.03)' }}>
                                    <td>
                                      <DatePicker
                                        value={newRowDate}
                                        onChange={(val) => setNewRowDate(val)}
                                        customTrigger={() => (
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
                                      <input
                                        type="text"
                                        placeholder="Lokasi instalasi..."
                                        value={newRowLocation}
                                        onChange={(e) => setNewRowLocation(e.target.value)}
                                        style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #2E5BFF', fontSize: '0.8rem', fontFamily: 'inherit' }}
                                      />
                                    </td>
                                    <td>
                                      <input
                                        type="text"
                                        placeholder="Nama teknisi..."
                                        value={newRowTechnician}
                                        onChange={(e) => setNewRowTechnician(e.target.value)}
                                        style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #8b5cf6', fontSize: '0.8rem', fontFamily: 'inherit' }}
                                      />
                                    </td>
                                    <td>
                                      <select
                                        value={newRowPartner}
                                        onChange={(e) => setNewRowPartner(e.target.value)}
                                        style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.82rem' }}
                                      >
                                        <option value="">—</option>
                                        {partners.map((p: any) => (
                                          <option key={p.id} value={p.id}>{p.partner_name}</option>
                                        ))}
                                      </select>
                                    </td>
                                    <td>
                                      <textarea
                                        placeholder="Catatan (opsional)..."
                                        value={newRowNotes}
                                        onChange={(e) => setNewRowNotes(e.target.value)}
                                        style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #10b981', fontSize: '0.8rem', minHeight: '40px', fontFamily: 'inherit' }}
                                      />
                                    </td>
                                    <td>
                                      <CustomSelect
                                        value={newRowStatus}
                                        options={[
                                          { value: 'SCHEDULED', label: 'SCHEDULED' },
                                          { value: 'IN_PROGRESS', label: 'IN_PROGRESS' },
                                          { value: 'DONE', label: 'DONE' },
                                          { value: 'CANCELLED', label: 'CANCELLED' },
                                        ]}
                                        showSearch={false}
                                        onChange={(val) => setNewRowStatus(val)}
                                      />
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                        <button
                                          type="button"
                                          onClick={(e) => handleSaveNewSubRow(e, mainInstallation)}
                                          className={styles.subRowBtn}
                                          style={{ background: '#2E5BFF', color: '#fff', border: 'none' }}
                                          title="Tambah"
                                        >
                                          <Check size={12} /> Tambah
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); setAddingToUnitId(null); }}
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
      )}
    </div>
  );
}
