'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { invoiceApi, unitApi, partnerApi } from '@/lib/api';
import {
  Receipt, Search, Plus, Loader2, CheckCircle2, AlertTriangle, Edit2, Check, X, RefreshCw, ChevronDown, CalendarDays, FileText
} from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import DatePicker from '@/components/ui/DatePicker';
import StatsGrid from '@/components/dashboard/StatsGrid';
import styles from '../service.module.css';

function formatDate(d: string | Date | null) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function InvoiceLogPage() {
  const router = useRouter();

  // Core data
  const [invoices, setInvoices] = useState<any[]>([]);
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
  const [expandedInvoiceNums, setExpandedInvoiceNums] = useState<Record<string, boolean>>({});

  // Inline editing
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editRowDate, setEditRowDate] = useState<string>('');
  const [editRowInvoiceNum, setEditRowInvoiceNum] = useState<string>('');
  const [editRowDescription, setEditRowDescription] = useState<string>('');
  const [editRowPartner, setEditRowPartner] = useState<string>('');
  const [editRowNotes, setEditRowNotes] = useState<string>('');
  const [editRowStatus, setEditRowStatus] = useState<string>('');

  // Add sub-row
  const [addingToInvoiceNum, setAddingToInvoiceNum] = useState<string | null>(null);
  const [newRowDate, setNewRowDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newRowInvoiceNum, setNewRowInvoiceNum] = useState<string>('');
  const [newRowDescription, setNewRowDescription] = useState<string>('');
  const [newRowPartner, setNewRowPartner] = useState<string>('');
  const [newRowNotes, setNewRowNotes] = useState<string>('');
  const [newRowStatus, setNewRowStatus] = useState<string>('PENDING');
  const [newRowUnitId, setNewRowUnitId] = useState<string>('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [invSettled, unitsSettled, partnersSettled] = await Promise.allSettled([
        invoiceApi.findAll(1, 500),
        unitApi.findAll(1, 1000),
        partnerApi.findAll(),
      ]);

      if (invSettled.status === 'fulfilled') {
        const res = invSettled.value;
        const items = res.data?.data ?? (Array.isArray(res.data) ? res.data : []);
        setInvoices(items);
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

      if (invSettled.status === 'rejected' && unitsSettled.status === 'rejected') {
        setError('Gagal memuat data faktur.');
      }
    } catch (err) {
      console.error('fetchData error:', err);
      setError('Gagal memuat data faktur.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredInvoices = invoices.filter(inv => {
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = [
      inv.invoice_number,
      inv.unit?.serial_number,
      inv.unit?.model_name,
      inv.partner?.partner_name,
      inv.description,
      inv.notes
    ].some(v => v?.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  }).slice(0, pageSize);

  const totalInvoices = invoices.length;
  const pendingInvoices = invoices.filter(i => i.status === 'PENDING' || i.status === 'SUBMITTED').length;
  const confirmedInvoices = invoices.filter(i => i.status === 'CONFIRMED').length;

  // Group by invoice_number (invoices with same invoice number are revisions/versions)
  const groupedInvoices = (Object.values(filteredInvoices.reduce((acc, inv) => {
    const invNum = inv.invoice_number || inv.id;
    if (!acc[invNum]) acc[invNum] = [];
    acc[invNum].push(inv);
    return acc;
  }, {} as Record<string, any[]>)) as any[][]).map((group: any[]) => {
    group.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return { mainInvoice: group[0], history: group };
  });

  const toggleExpand = (e: React.MouseEvent, invNum: string) => {
    e.stopPropagation();
    setExpandedInvoiceNums(prev => ({ ...prev, [invNum]: !prev[invNum] }));
  };

  const handleStartRowEdit = (e: React.MouseEvent, inv: any) => {
    e.stopPropagation();
    setEditingRowId(inv.id);
    const dateVal = inv.invoice_date || inv.created_at;
    setEditRowDate(dateVal ? new Date(dateVal).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setEditRowInvoiceNum(inv.invoice_number || '');
    setEditRowDescription(inv.description || '');
    setEditRowPartner(inv.partner?.id || '');
    setEditRowNotes(inv.notes || '');
    setEditRowStatus(inv.status || 'PENDING');
  };

  const handleSaveRowEdit = async (e: React.MouseEvent, inv: any) => {
    e.stopPropagation();
    try {
      setSubmitting(true);
      await invoiceApi.update(inv.id, {
        invoice_date: editRowDate || undefined,
        invoice_number: editRowInvoiceNum.trim() || undefined,
        description: editRowDescription.trim() || undefined,
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

  const handleSaveNewSubRow = async (e: React.MouseEvent, mainInv: any) => {
    e.stopPropagation();
    if (!newRowInvoiceNum.trim()) {
      alert('Nomor faktur harus diisi.');
      return;
    }

    try {
      setSubmitting(true);
      await invoiceApi.create({
        invoice_number: newRowInvoiceNum.trim(),
        unitId: newRowUnitId || undefined,
        partnerId: newRowPartner || undefined,
        invoice_date: newRowDate || undefined,
        description: newRowDescription.trim() || undefined,
        notes: newRowNotes.trim() || undefined,
        status: newRowStatus,
      });
      setAddingToInvoiceNum(null);
      setNewRowInvoiceNum('');
      setNewRowDescription('');
      setNewRowPartner('');
      setNewRowNotes('');
      setNewRowUnitId('');
      setNewRowStatus('PENDING');
      setNewRowDate(new Date().toISOString().split('T')[0]);
      await fetchData();
    } catch {
      alert('Gagal menambahkan faktur baru.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.pageHeader}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Log Tukar Faktur</h1>
          <p className={styles.subtitle}>Kelola bukti penyerahan barang / surat jalan pengiriman</p>
        </div>
      </header>

      <StatsGrid
        loading={loading}
        items={[
          { label: 'Total Faktur', value: loading ? '...' : totalInvoices, max: 1000, icon: FileText, accent: '#f59e0b' },
          { label: 'Pending / Submitted', value: loading ? '...' : pendingInvoices, max: 100, icon: Receipt, accent: '#FF6B00' },
          { label: 'Dikonfirmasi', value: loading ? '...' : confirmedInvoices, max: 1000, icon: CheckCircle2, accent: '#00C48C' },
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
              { value: 'SUBMITTED', label: 'SUBMITTED' },
              { value: 'CONFIRMED', label: 'CONFIRMED' }
            ]}
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
          />
        </div>
        <div className="dtToolbarRight">
          <div className="dtToolbarSearch">
            <input
              type="text"
              placeholder="Cari no. faktur, SN, deskripsi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="dtToolbarSearchInput"
            />
            <Search size={16} className="dtToolbarSearchIcon" />
          </div>
          <button
            className="dtToolbarCreateBtn"
            onClick={() => {
              alert('Fitur tambah faktur baru akan segera hadir!');
            }}
            style={{ background: '#2E5BFF', color: '#fff' }}
          >
            <Plus size={16} strokeWidth={2.5} />Tambah Faktur
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
      ) : filteredInvoices.length === 0 ? (
        <div className={styles.tableContainer}>
          <div className={styles.emptyState}>
            <Receipt size={48} style={{ color: 'var(--color-space-grey)', opacity: 0.4 }} />
            <h3 className={styles.emptyTitle}>Belum Ada Data Faktur</h3>
            <p className={styles.emptyDesc}>Tidak ada faktur yang sesuai dengan filter.</p>
          </div>
        </div>
      ) : (
        <div className={`${styles.tableContainer} ${styles.desktopView}`}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '13%' }}>NO. FAKTUR</th>
                <th style={{ width: '10%' }}>TGL FAKTUR</th>
                <th style={{ width: '14%' }}>CUSTOMER &amp; BRANCH</th>
                <th style={{ width: '13%' }}>PRODUCT (UNIT)</th>
                <th style={{ width: '18%' }}>DESKRIPSI BARANG</th>
                <th style={{ width: '12%' }}>MITRA</th>
                <th style={{ width: '12%' }}>CATATAN</th>
                <th style={{ width: '8%', textAlign: 'center' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {groupedInvoices.map(({ mainInvoice, history }, cardIdx) => {
                const invNum = mainInvoice.invoice_number || mainInvoice.id;
                const isExpanded = expandedInvoiceNums[invNum];
                const cardColors = [styles.cardBlue, styles.cardEmerald, styles.cardAmber, styles.cardPurple, styles.cardRose];
                const cardAccentClass = cardColors[cardIdx % cardColors.length];

                return (
                  <React.Fragment key={mainInvoice.id}>
                    <tr className={`${cardAccentClass} ${styles.clickableRow}`} style={{ cursor: 'pointer', background: isExpanded ? 'rgba(46,91,255,0.03)' : undefined }}>
                      <td className={styles.logId}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={(e) => toggleExpand(e, invNum)}
                            className={styles.expandBtn}
                            title={isExpanded ? 'Tutup riwayat' : 'Buka riwayat'}
                          >
                            {isExpanded ? '-' : '+'}
                          </button>
                          <span className={styles.callIdLink}>{invNum}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--color-deep-navy)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          {formatDate(mainInvoice.invoice_date || mainInvoice.created_at)}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--color-deep-navy)', fontSize: '0.84rem' }}>
                            {mainInvoice.unit?.current_client?.company_name || 'Customer Umum'}
                          </span>
                          <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                            {mainInvoice.unit?.city || 'Pusat / Cabang'}
                          </span>
                        </div>
                      </td>
                      <td>
                        {mainInvoice.unit ? (
                          <div className={styles.unitLink} onClick={() => router.push(`/id/${mainInvoice.unit?.qr_token}`)}>
                            <span className={styles.unitModel}>{mainInvoice.unit?.model_name}</span>
                            <span className={styles.unitSn}>SN: {mainInvoice.unit?.serial_number}</span>
                          </div>
                        ) : (
                          <span style={{ fontStyle: 'italic', color: '#94a3b8', fontSize: '0.8rem' }}>—</span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 500 }}>
                          {mainInvoice.description ? (mainInvoice.description.length > 50 ? mainInvoice.description.slice(0, 50) + '…' : mainInvoice.description) : <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>—</span>}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: '#334155' }}>
                          {mainInvoice.partner?.partner_name || <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>—</span>}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          {mainInvoice.notes ? (mainInvoice.notes.length > 30 ? mainInvoice.notes.slice(0, 30) + '…' : mainInvoice.notes) : '—'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <CustomSelect
                          value={mainInvoice.status}
                          options={[
                            { value: 'PENDING', label: 'PENDING' },
                            { value: 'SUBMITTED', label: 'SUBMITTED' },
                            { value: 'CONFIRMED', label: 'CONFIRMED' },
                          ]}
                          showSearch={false}
                          onChange={(newStatus) => {
                            (async () => {
                              try {
                                setSubmitting(true);
                                await invoiceApi.update(mainInvoice.id, { status: newStatus });
                                await fetchData();
                              } catch {
                                alert('Gagal mengubah status.');
                              } finally {
                                setSubmitting(false);
                              }
                            })();
                          }}
                          customTrigger={(opt, isOpen) => {
                            const currentVal = opt ? opt.value : mainInvoice.status;
                            const statusClass =
                              currentVal === 'CONFIRMED'
                                ? styles.statusCompleted
                                : currentVal === 'SUBMITTED'
                                  ? styles.statusInProgress
                                  : styles.statusPending;

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
                                Riwayat Faktur (No: {invNum})
                              </h4>
                              {addingToInvoiceNum !== invNum && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAddingToInvoiceNum(invNum);
                                    setNewRowInvoiceNum(invNum);
                                    setNewRowPartner(mainInvoice.partner?.id || '');
                                    setNewRowDescription('');
                                    setNewRowNotes('');
                                    setNewRowUnitId('');
                                    setNewRowStatus('PENDING');
                                  }}
                                  className={styles.subRowAddBtn}
                                  title="Tambah revisi faktur"
                                >
                                  <Plus size={14} /> Tambah Revisi
                                </button>
                              )}
                            </div>

                            <table className={styles.subRowTable}>
                              <thead>
                                <tr>
                                  <th style={{ width: '12%' }}>Tanggal</th>
                                  <th style={{ width: '15%' }}>No. Faktur</th>
                                  <th style={{ width: '20%' }}>Deskripsi</th>
                                  <th style={{ width: '13%' }}>Unit</th>
                                  <th style={{ width: '13%' }}>Mitra</th>
                                  <th style={{ width: '15%' }}>Catatan</th>
                                  <th style={{ width: '10%' }}>Status</th>
                                  <th style={{ width: '6%', textAlign: 'center' }}>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {history.map((inv: any) => {
                                  const isRowEditing = editingRowId === inv.id;
                                  return (
                                    <tr key={inv.id}>
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
                                          formatDate(inv.invoice_date || inv.created_at)
                                        )}
                                      </td>
                                      <td>
                                        {isRowEditing ? (
                                          <input
                                            type="text"
                                            value={editRowInvoiceNum}
                                            onChange={(e) => setEditRowInvoiceNum(e.target.value)}
                                            placeholder="No. Faktur..."
                                            style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #2E5BFF', fontSize: '0.82rem', fontFamily: 'inherit' }}
                                          />
                                        ) : (
                                          <span style={{ color: '#1e293b', fontWeight: 700, fontSize: '0.82rem' }}>{inv.invoice_number || '—'}</span>
                                        )}
                                      </td>
                                      <td>
                                        {isRowEditing ? (
                                          <textarea
                                            value={editRowDescription}
                                            onChange={(e) => setEditRowDescription(e.target.value)}
                                            placeholder="Deskripsi barang..."
                                            style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #f59e0b', fontSize: '0.82rem', minHeight: '44px', fontFamily: 'inherit' }}
                                          />
                                        ) : (
                                          <span style={{ color: '#334155', lineHeight: 1.4, fontSize: '0.8rem' }}>{inv.description || '—'}</span>
                                        )}
                                      </td>
                                      <td>
                                        <span style={{ color: '#334155', fontSize: '0.78rem' }}>
                                          {inv.unit ? `${inv.unit.model_name} (${inv.unit.serial_number})` : '—'}
                                        </span>
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
                                          <span style={{ color: '#334155', fontSize: '0.8rem' }}>{inv.partner?.partner_name || '—'}</span>
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
                                          <span style={{ color: '#64748b', fontSize: '0.78rem' }}>{inv.notes || '—'}</span>
                                        )}
                                      </td>
                                      <td>
                                        {isRowEditing ? (
                                          <CustomSelect
                                            value={editRowStatus}
                                            options={[
                                              { value: 'PENDING', label: 'PENDING' },
                                              { value: 'SUBMITTED', label: 'SUBMITTED' },
                                              { value: 'CONFIRMED', label: 'CONFIRMED' },
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
                                              background: inv.status === 'CONFIRMED' ? 'rgba(16, 185, 129, 0.12)' : inv.status === 'SUBMITTED' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                                              color: inv.status === 'CONFIRMED' ? '#059669' : inv.status === 'SUBMITTED' ? '#2563eb' : '#d97706',
                                              border: `1px solid ${inv.status === 'CONFIRMED' ? 'rgba(16, 185, 129, 0.3)' : inv.status === 'SUBMITTED' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                                            }}
                                          >
                                            {inv.status}
                                          </span>
                                        )}
                                      </td>
                                      <td style={{ textAlign: 'center' }}>
                                        {isRowEditing ? (
                                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                            <button
                                              type="button"
                                              onClick={(e) => handleSaveRowEdit(e, inv)}
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
                                            onClick={(e) => handleStartRowEdit(e, inv)}
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
                                {addingToInvoiceNum === invNum && (
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
                                        placeholder="No. Faktur..."
                                        value={newRowInvoiceNum}
                                        onChange={(e) => setNewRowInvoiceNum(e.target.value)}
                                        style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #2E5BFF', fontSize: '0.8rem', fontFamily: 'inherit' }}
                                      />
                                    </td>
                                    <td>
                                      <textarea
                                        placeholder="Deskripsi barang..."
                                        value={newRowDescription}
                                        onChange={(e) => setNewRowDescription(e.target.value)}
                                        style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #f59e0b', fontSize: '0.8rem', minHeight: '40px', fontFamily: 'inherit' }}
                                      />
                                    </td>
                                    <td>
                                      <select
                                        value={newRowUnitId}
                                        onChange={(e) => setNewRowUnitId(e.target.value)}
                                        style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.78rem' }}
                                      >
                                        <option value="">— Unit (opsional)</option>
                                        {units.map((u: any) => (
                                          <option key={u.id} value={u.id}>{u.model_name} ({u.serial_number})</option>
                                        ))}
                                      </select>
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
                                          { value: 'PENDING', label: 'PENDING' },
                                          { value: 'SUBMITTED', label: 'SUBMITTED' },
                                          { value: 'CONFIRMED', label: 'CONFIRMED' },
                                        ]}
                                        showSearch={false}
                                        onChange={(val) => setNewRowStatus(val)}
                                      />
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                        <button
                                          type="button"
                                          onClick={(e) => handleSaveNewSubRow(e, mainInvoice)}
                                          className={styles.subRowBtn}
                                          style={{ background: '#2E5BFF', color: '#fff', border: 'none' }}
                                          title="Tambah"
                                        >
                                          <Check size={12} /> Tambah
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); setAddingToInvoiceNum(null); }}
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
