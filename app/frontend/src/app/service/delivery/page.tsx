'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { deliveryApi, unitApi, partnerApi } from '@/lib/api';
import {
  Truck, Search, Plus, Loader2, CheckCircle2, AlertTriangle, Edit2, Check, X, RefreshCw, ChevronDown, CalendarDays, Package
} from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import DatePicker from '@/components/ui/DatePicker';
import StatsGrid from '@/components/dashboard/StatsGrid';
import styles from '../service.module.css';

function formatDate(d: string | Date | null) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function DeliveryLogPage() {
  const router = useRouter();

  // Core data
  const [deliveries, setDeliveries] = useState<any[]>([]);
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

  // Inline editing state
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editRowDate, setEditRowDate] = useState<string>('');
  const [editRowAddress, setEditRowAddress] = useState<string>('');
  const [editRowPartner, setEditRowPartner] = useState<string>('');
  const [editRowNotes, setEditRowNotes] = useState<string>('');
  const [editRowStatus, setEditRowStatus] = useState<string>('');

  // Add sub-row state
  const [addingToUnitId, setAddingToUnitId] = useState<string | null>(null);
  const [newRowDate, setNewRowDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newRowAddress, setNewRowAddress] = useState<string>('');
  const [newRowPartner, setNewRowPartner] = useState<string>('');
  const [newRowNotes, setNewRowNotes] = useState<string>('');
  const [newRowStatus, setNewRowStatus] = useState<string>('PENDING');

  // Quick status modal
  const [quickStatusDelivery, setQuickStatusDelivery] = useState<any | null>(null);
  const [quickStatusValue, setQuickStatusValue] = useState<string>('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [delSettled, unitsSettled, partnersSettled] = await Promise.allSettled([
        deliveryApi.findAll(1, 500),
        unitApi.findAll(1, 1000),
        partnerApi.findAll(),
      ]);

      if (delSettled.status === 'fulfilled') {
        const res = delSettled.value;
        const items = res.data?.data ?? (Array.isArray(res.data) ? res.data : []);
        setDeliveries(items);
      } else {
        console.error('Gagal load deliveries:', delSettled.reason);
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

      if (delSettled.status === 'rejected' && unitsSettled.status === 'rejected') {
        setError('Gagal memuat data pengiriman. Silakan refresh halaman.');
      }
    } catch (err) {
      console.error('fetchData error:', err);
      setError('Gagal memuat data pengiriman.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredDeliveries = deliveries.filter(del => {
    const matchesStatus = statusFilter === 'ALL' || del.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = [
      del.unit?.serial_number,
      del.unit?.model_name,
      del.partner?.partner_name,
      del.destination_address,
      del.notes
    ].some(v => v?.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  }).slice(0, pageSize);

  const totalDeliveries = deliveries.length;
  const pendingDeliveries = deliveries.filter(d => d.status === 'PENDING' || d.status === 'IN_TRANSIT').length;
  const completedDeliveries = deliveries.filter(d => d.status === 'DELIVERED').length;

  // Group by unitId
  const groupedDeliveries = (Object.values(filteredDeliveries.reduce((acc, del) => {
    const uid = del.unit?.id || 'unknown';
    if (!acc[uid]) acc[uid] = [];
    acc[uid].push(del);
    return acc;
  }, {} as Record<string, any[]>)) as any[][]).map((group: any[]) => {
    group.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return { mainDelivery: group[0], history: group };
  });

  const toggleExpand = (e: React.MouseEvent, unitId: string) => {
    e.stopPropagation();
    setExpandedUnitIds(prev => ({ ...prev, [unitId]: !prev[unitId] }));
  };

  const handleStartRowEdit = (e: React.MouseEvent, del: any) => {
    e.stopPropagation();
    setEditingRowId(del.id);
    const dateVal = del.delivery_date || del.created_at;
    setEditRowDate(dateVal ? new Date(dateVal).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setEditRowAddress(del.destination_address || '');
    setEditRowPartner(del.partner?.id || '');
    setEditRowNotes(del.notes || '');
    setEditRowStatus(del.status || 'PENDING');
  };

  const handleSaveRowEdit = async (e: React.MouseEvent, del: any) => {
    e.stopPropagation();
    try {
      setSubmitting(true);
      await deliveryApi.update(del.id, {
        delivery_date: editRowDate || undefined,
        destination_address: editRowAddress.trim() || undefined,
        partnerId: editRowPartner || undefined,
        notes: editRowNotes.trim() || undefined,
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

  const handleSaveNewSubRow = async (e: React.MouseEvent, mainDel: any) => {
    e.stopPropagation();
    if (!newRowAddress.trim() && !newRowNotes.trim()) {
      alert('Minimal isi alamat tujuan atau catatan.');
      return;
    }

    try {
      setSubmitting(true);
      await deliveryApi.create({
        unitId: mainDel.unit?.id,
        partnerId: newRowPartner || undefined,
        delivery_date: newRowDate || undefined,
        destination_address: newRowAddress.trim() || undefined,
        notes: newRowNotes.trim() || undefined,
        status: newRowStatus,
      });
      setAddingToUnitId(null);
      setNewRowAddress('');
      setNewRowPartner('');
      setNewRowNotes('');
      setNewRowStatus('PENDING');
      setNewRowDate(new Date().toISOString().split('T')[0]);
      await fetchData();
    } catch {
      alert('Gagal menambahkan baris baru.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickStatusSave = async () => {
    if (!quickStatusDelivery || !quickStatusValue) return;
    try {
      await deliveryApi.update(quickStatusDelivery.id, { status: quickStatusValue });
      await fetchData();
    } catch {
      alert('Gagal memperbarui status.');
    } finally {
      setQuickStatusDelivery(null);
      setQuickStatusValue('');
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.pageHeader}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Log Pengiriman</h1>
          <p className={styles.subtitle}>Kelola catatan pengiriman unit ke customer</p>
        </div>
      </header>

      <StatsGrid
        loading={loading}
        items={[
          { label: 'Total Pengiriman', value: loading ? '...' : totalDeliveries, max: 1000, icon: Package, accent: '#3b82f6' },
          { label: 'Dalam Perjalanan', value: loading ? '...' : pendingDeliveries, max: 100, icon: Truck, accent: '#FF6B00' },
          { label: 'Terkirim', value: loading ? '...' : completedDeliveries, max: 1000, icon: CheckCircle2, accent: '#00C48C' },
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
              { value: 'PENDING', label: 'PENDING' },
              { value: 'IN_TRANSIT', label: 'IN_TRANSIT' },
              { value: 'DELIVERED', label: 'DELIVERED' },
              { value: 'FAILED', label: 'FAILED' }
            ]}
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
          />
        </div>
        <div className="dtToolbarRight">
          <div className="dtToolbarSearch">
            <input
              type="text"
              placeholder="Cari SN, model, alamat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="dtToolbarSearchInput"
            />
            <Search size={16} className="dtToolbarSearchIcon" />
          </div>
          <button
            className="dtToolbarCreateBtn"
            onClick={() => {
              // Bisa buka modal atau navigate ke form
              alert('Fitur tambah pengiriman baru akan segera hadir!');
            }}
            style={{ background: '#2E5BFF', color: '#fff' }}
          >
            <Plus size={16} strokeWidth={2.5} />Tambah Pengiriman
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
      ) : filteredDeliveries.length === 0 ? (
        <div className={styles.tableContainer}>
          <div className={styles.emptyState}>
            <Truck size={48} style={{ color: 'var(--color-space-grey)', opacity: 0.4 }} />
            <h3 className={styles.emptyTitle}>Belum Ada Data Pengiriman</h3>
            <p className={styles.emptyDesc}>Tidak ada pengiriman yang sesuai dengan filter.</p>
          </div>
        </div>
      ) : (
        <div className={`${styles.tableContainer} ${styles.desktopView}`}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '11%' }}>ID</th>
                <th style={{ width: '10%' }}>TGL KIRIM</th>
                <th style={{ width: '15%' }}>CUSTOMER &amp; BRANCH</th>
                <th style={{ width: '14%' }}>PRODUCT (UNIT)</th>
                <th style={{ width: '20%' }}>ALAMAT TUJUAN</th>
                <th style={{ width: '12%' }}>MITRA/KURIR</th>
                <th style={{ width: '10%' }}>CATATAN</th>
                <th style={{ width: '8%', textAlign: 'center' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {groupedDeliveries.map(({ mainDelivery, history }, cardIdx) => {
                const unitId = mainDelivery.unit?.id || 'unknown';
                const isExpanded = expandedUnitIds[unitId];
                const cardColors = [styles.cardBlue, styles.cardEmerald, styles.cardAmber, styles.cardPurple, styles.cardRose];
                const cardAccentClass = cardColors[cardIdx % cardColors.length];

                return (
                  <React.Fragment key={mainDelivery.id}>
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
                          <span className={styles.callIdLink}>{mainDelivery.id}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--color-deep-navy)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          {formatDate(mainDelivery.delivery_date || mainDelivery.created_at)}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--color-deep-navy)', fontSize: '0.84rem' }}>
                            {mainDelivery.unit?.current_client?.company_name || 'Customer Umum'}
                          </span>
                          <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                            {mainDelivery.unit?.city || 'Pusat / Cabang'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.unitLink} onClick={() => router.push(`/id/${mainDelivery.unit?.qr_token}`)}>
                          <span className={styles.unitModel}>{mainDelivery.unit?.model_name || 'Unit Tidak Diketahui'}</span>
                          <span className={styles.unitSn}>SN: {mainDelivery.unit?.serial_number || '-'}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 500 }}>
                          {mainDelivery.destination_address || <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>—</span>}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: '#334155' }}>
                          {mainDelivery.partner?.partner_name || <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>Internal</span>}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          {mainDelivery.notes ? (mainDelivery.notes.length > 30 ? mainDelivery.notes.slice(0, 30) + '…' : mainDelivery.notes) : '—'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <CustomSelect
                          value={mainDelivery.status}
                          options={[
                            { value: 'PENDING', label: 'PENDING' },
                            { value: 'IN_TRANSIT', label: 'IN_TRANSIT' },
                            { value: 'DELIVERED', label: 'DELIVERED' },
                            { value: 'FAILED', label: 'FAILED' },
                          ]}
                          showSearch={false}
                          onChange={(newStatus) => {
                            (async () => {
                              try {
                                setSubmitting(true);
                                await deliveryApi.update(mainDelivery.id, { status: newStatus });
                                await fetchData();
                              } catch {
                                alert('Gagal mengubah status.');
                              } finally {
                                setSubmitting(false);
                              }
                            })();
                          }}
                          customTrigger={(opt, isOpen) => {
                            const currentVal = opt ? opt.value : mainDelivery.status;
                            const statusClass =
                              currentVal === 'DELIVERED'
                                ? styles.statusCompleted
                                : currentVal === 'IN_TRANSIT'
                                  ? styles.statusInProgress
                                  : currentVal === 'PENDING'
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

                    {/* Sub-rows (History) */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} style={{ padding: 0, background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                          <div style={{ padding: '16px 24px 16px 36px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                              <h4 style={{ fontSize: '0.8rem', color: '#1e293b', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 800 }}>
                                Riwayat Pengiriman (Unit: {mainDelivery.unit?.serial_number})
                              </h4>
                              {addingToUnitId !== unitId && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAddingToUnitId(unitId);
                                    setNewRowPartner(mainDelivery.partner?.id || '');
                                    setNewRowAddress('');
                                    setNewRowNotes('');
                                    setNewRowStatus('PENDING');
                                  }}
                                  className={styles.subRowAddBtn}
                                  title="Tambah pengiriman baru untuk unit ini"
                                >
                                  <Plus size={14} /> Tambah Pengiriman
                                </button>
                              )}
                            </div>

                            <table className={styles.subRowTable}>
                              <thead>
                                <tr>
                                  <th style={{ width: '15%' }}>Tanggal Kirim</th>
                                  <th style={{ width: '25%' }}>Alamat Tujuan</th>
                                  <th style={{ width: '15%' }}>Mitra/Kurir</th>
                                  <th style={{ width: '25%' }}>Catatan</th>
                                  <th style={{ width: '12%' }}>Status</th>
                                  <th style={{ width: '8%', textAlign: 'center' }}>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {history.map((del: any) => {
                                  const isRowEditing = editingRowId === del.id;
                                  return (
                                    <tr key={del.id}>
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
                                          formatDate(del.delivery_date || del.created_at)
                                        )}
                                      </td>
                                      <td>
                                        {isRowEditing ? (
                                          <textarea
                                            value={editRowAddress}
                                            onChange={(e) => setEditRowAddress(e.target.value)}
                                            placeholder="Alamat tujuan..."
                                            style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #2E5BFF', fontSize: '0.82rem', minHeight: '44px', fontFamily: 'inherit' }}
                                          />
                                        ) : (
                                          <span style={{ color: '#334155', lineHeight: 1.4 }}>{del.destination_address || '—'}</span>
                                        )}
                                      </td>
                                      <td>
                                        {isRowEditing ? (
                                          <select
                                            value={editRowPartner}
                                            onChange={(e) => setEditRowPartner(e.target.value)}
                                            style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.82rem' }}
                                          >
                                            <option value="">Internal</option>
                                            {partners.map((p: any) => (
                                              <option key={p.id} value={p.id}>{p.partner_name}</option>
                                            ))}
                                          </select>
                                        ) : (
                                          <span style={{ color: '#334155' }}>{del.partner?.partner_name || 'Internal'}</span>
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
                                          <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{del.notes || '—'}</span>
                                        )}
                                      </td>
                                      <td>
                                        {isRowEditing ? (
                                          <CustomSelect
                                            value={editRowStatus}
                                            options={[
                                              { value: 'PENDING', label: 'PENDING' },
                                              { value: 'IN_TRANSIT', label: 'IN_TRANSIT' },
                                              { value: 'DELIVERED', label: 'DELIVERED' },
                                              { value: 'FAILED', label: 'FAILED' },
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
                                              background: del.status === 'DELIVERED' ? 'rgba(16, 185, 129, 0.12)' : del.status === 'IN_TRANSIT' ? 'rgba(59, 130, 246, 0.12)' : del.status === 'PENDING' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                                              color: del.status === 'DELIVERED' ? '#059669' : del.status === 'IN_TRANSIT' ? '#2563eb' : del.status === 'PENDING' ? '#d97706' : '#dc2626',
                                              border: `1px solid ${del.status === 'DELIVERED' ? 'rgba(16, 185, 129, 0.3)' : del.status === 'IN_TRANSIT' ? 'rgba(59, 130, 246, 0.3)' : del.status === 'PENDING' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                            }}
                                          >
                                            {del.status}
                                          </span>
                                        )}
                                      </td>
                                      <td style={{ textAlign: 'center' }}>
                                        {isRowEditing ? (
                                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                            <button
                                              type="button"
                                              onClick={(e) => handleSaveRowEdit(e, del)}
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
                                            onClick={(e) => handleStartRowEdit(e, del)}
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

                                {/* Add new sub-row form */}
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
                                      <textarea
                                        placeholder="Alamat tujuan..."
                                        value={newRowAddress}
                                        onChange={(e) => setNewRowAddress(e.target.value)}
                                        style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #2E5BFF', fontSize: '0.8rem', minHeight: '40px', fontFamily: 'inherit' }}
                                      />
                                    </td>
                                    <td>
                                      <select
                                        value={newRowPartner}
                                        onChange={(e) => setNewRowPartner(e.target.value)}
                                        style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.82rem' }}
                                      >
                                        <option value="">Internal</option>
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
                                          { value: 'PENDING', label: 'PENDING' },
                                          { value: 'IN_TRANSIT', label: 'IN_TRANSIT' },
                                          { value: 'DELIVERED', label: 'DELIVERED' },
                                          { value: 'FAILED', label: 'FAILED' },
                                        ]}
                                        showSearch={false}
                                        onChange={(val) => setNewRowStatus(val)}
                                      />
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                        <button
                                          type="button"
                                          onClick={(e) => handleSaveNewSubRow(e, mainDelivery)}
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
