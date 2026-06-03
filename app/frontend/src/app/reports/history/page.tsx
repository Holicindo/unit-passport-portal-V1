'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { reportApi } from '@/lib/api';
import { Search, Filter, Eye, Printer, FileEdit, Trash2, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './history.module.css';

const formTypes = [
  { id: 'INSPECTION',    label: 'Inspection Report (QC)' },
  { id: 'COOLING_1',     label: 'Cooling System Report 1 Suhu' },
  { id: 'COOLING_2',     label: 'Cooling System Report 2 Suhu' },
  { id: 'COOLING_3',     label: 'Cooling System Report 3 Suhu' },
  { id: 'COOLING_WARM',  label: 'Cooling System Report Warm' },
  { id: 'ISSUE_ANALYSIS', label: 'Inspeksi & Analisis Masalah' },
  { id: 'REWORK',        label: 'Pengecekan Rework' },
  { id: 'COMMISSIONING', label: 'Graphic Record' },
  { id: 'QC_SERVICE',    label: 'Checklist QC Service' },
];

export default function ReportHistory() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Memuat riwayat laporan...</div>}>
      <ReportHistoryInner />
    </Suspense>
  );
}

function ReportHistoryInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  
  // Initialize typeFilter & unitFilter directly from URL query params
  const [typeFilter, setTypeFilter] = useState(() => searchParams.get('type') || '');
  const [unitFilter, setUnitFilter] = useState(() => searchParams.get('unit') || '');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Mock admin check (should come from auth context)
  const isAdmin = true;

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await reportApi.findAll(page, pageSize, typeFilter, unitFilter);
      setReports(data.data || []);
      setTotalPages(data.meta?.last_page || 1);
    } catch (err) {
      console.error('Failed to load reports history', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, typeFilter, unitFilter]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const parseDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    const d = new Date(dateStr);
    // Compensate for backend TypeORM timezone shift (+7 hours)
    return new Date(d.getTime() + 7 * 60 * 60 * 1000);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedReports(reports.map(r => r.id));
    } else {
      setSelectedReports([]);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedReports(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleDeleteBulk = async () => {
    if (!selectedReports.length) return;
    if (!window.confirm(`Yakin ingin menghapus ${selectedReports.length} laporan terpilih? Tindakan ini tidak dapat dibatalkan.`)) return;

    try {
      setIsDeleting(true);
      await reportApi.deleteBulk(selectedReports);
      setSelectedReports([]);
      loadReports();
      alert('Laporan berhasil dihapus');
    } catch (err) {
      console.error('Delete error', err);
      alert('Gagal menghapus laporan');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Riwayat Laporan</h2>
          <p className={styles.subtitle}>Daftar seluruh laporan digital yang telah diserahkan.</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
          {unitFilter && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: '#2E5BFF15', color: '#2E5BFF',
              border: '1px solid #2E5BFF40', borderRadius: '20px',
              padding: '4px 12px', fontSize: '0.78rem', fontWeight: 600,
            }}>
              Unit: {unitFilter}
            </span>
          )}
          {typeFilter && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: '#FF6B0015', color: '#FF6B00',
              border: '1px solid #FF6B0040', borderRadius: '20px',
              padding: '4px 12px', fontSize: '0.78rem', fontWeight: 600,
            }}>
              Filter: {formTypes.find(f => f.id === typeFilter)?.label || typeFilter}
            </span>
          )}
          {(typeFilter || unitFilter) && (
            <button
              onClick={() => { setTypeFilter(''); setUnitFilter(''); router.push('/reports/history'); }}
              style={{
                background: 'none', border: '1px solid #cbd5e1', borderRadius: '8px',
                padding: '4px 12px', fontSize: '0.78rem', color: '#64748b', cursor: 'pointer',
              }}
            >
              Hapus Semua Filter
            </button>
          )}
        </div>
      </header>

      {/* Mobile Submenu Pill Tabs */}
      <div className="mobile-sub-tabs">
        <button 
          className="mobile-sub-tab"
          onClick={() => router.push('/reports')}
        >
          Digital Form
        </button>
        <button 
          className="mobile-sub-tab active"
          onClick={() => router.push('/reports/history')}
        >
          Riwayat Laporan
        </button>
      </div>

      {/* --- Enterprise Datatable Toolbar --- */}
      <div className="dtToolbar">
        <div className="dtToolbarLeft">
          <div className="dtToolbarText">
            Show
            <CustomSelect
              options={[
                { value: '10', label: '10' },
                { value: '25', label: '25' },
                { value: '50', label: '50' }
              ]}
              value={pageSize.toString()}
              onChange={(val) => {
                setPageSize(parseInt(val, 10));
                setPage(1);
              }}
            />
            entries
          </div>
          
          <CustomSelect 
            value={typeFilter} 
            onChange={(val) => setTypeFilter(val)}
            options={[
              { value: '', label: 'Semua Jenis Laporan' },
              { value: 'REVISED', label: 'Tampilkan Hanya Laporan Revisi' },
              ...formTypes.map(t => ({ value: t.id, label: t.label }))
            ]}
            placeholder="Semua Jenis Laporan"
          />
        </div>

        <div className="dtToolbarRight">
          {selectedReports.length > 0 && isAdmin && (
            <button 
              onClick={handleDeleteBulk}
              disabled={isDeleting}
              style={{ background: '#FF4D4D', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            >
              <Trash2 size={16} /> Hapus ({selectedReports.length})
            </button>
          )}
          <div className="dtToolbarSearch">
            <input 
              type="text" 
              placeholder="Cari Laporan atau Unit..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="dtToolbarSearchInput"
            />
            <Search size={16} className="dtToolbarSearchIcon" />
          </div>
          <Link href="/reports/inspection" className="dtToolbarCreateBtn" style={{ textDecoration: 'none' }}>
            <Plus size={16} strokeWidth={2.5} /> Laporan Baru
          </Link>
        </div>
      </div>

      {/* --- Desktop View Table --- */}
      <div className={styles.desktopView}>
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll} 
                    checked={reports.length > 0 && selectedReports.length === reports.length} 
                  />
                </th>
                <th>Nomor Laporan</th>
                <th>Nama Unit</th>
                <th>Tipe Laporan</th>
                <th>Waktu & Tanggal</th>
                <th>Dilaporkan Oleh</th>
                <th style={{ textAlign: 'right', minWidth: '120px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className={styles.skeletonRow}>
                    <td colSpan={7}><div className={styles.skeletonCell} /></td>
                  </tr>
                ))
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.emptyState}>Tidak ada laporan ditemukan.</td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.id} className={styles.dataRow}>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={selectedReports.includes(report.id)}
                        onChange={() => toggleSelect(report.id)}
                      />
                    </td>
                    <td className={styles.reportId}>
                      <Link href={`/reports/view/${report.id}`}>
                        {report.id.replace(/-REV\d*-/, '-')}
                        {report.id.includes('-REV') && <span className={styles.revBadge}>REVISI</span>}
                      </Link>
                    </td>
                    <td>
                      <div className={styles.unitInfo}>
                        <strong>{report.unit?.model_name || 'Unit'}</strong>
                        <span>SN: {report.unit?.serial_number || '—'}</span>
                      </div>
                    </td>
                    <td>
                      <span className={styles.typeBadge}>
                        {formTypes.find(t => t.id === report.form_type)?.label || report.form_type}
                      </span>
                    </td>
                    <td>
                      <div className={styles.dateCell}>
                        <span>{parseDate(report.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                        <small>{parseDate(report.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</small>
                      </div>
                    </td>
                    <td>
                      <div className={styles.userCell}>
                        <span>{report.created_by?.full_name || 'Admin'}</span>
                        <small>QC Staff</small>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className={styles.actions}>
                        <Link
                          href={report.form_type === 'COOLING_1'
                            ? `/reports/cooling?editId=${report.id}`
                            : report.form_type === 'COOLING_2'
                            ? `/reports/cooling2?editId=${report.id}`
                            : report.form_type === 'COOLING_3'
                            ? `/reports/cooling3?editId=${report.id}`
                            : report.form_type === 'COOLING_WARM'
                            ? `/reports/reportwarm?editId=${report.id}`
                            : report.form_type === 'REWORK'
                            ? `/reports/rework?editId=${report.id}`
                            : report.form_type === 'COMMISSIONING'
                            ? `/reports/graphic-record?editId=${report.id}`
                            : report.form_type === 'QC_SERVICE'
                            ? `/reports/qc-service?editId=${report.id}`
                            : `/reports/inspection?editId=${report.id}`}
                          title="Edit Laporan"
                          className={styles.editBtn}
                        >
                          <FileEdit size={18} />
                        </Link>
                        <Link href={`/reports/view/${report.id}`} title="Lihat Form">
                          <Eye size={18} />
                        </Link>
                        <button 
                          title="Print / PDF" 
                          onClick={() => window.location.href = `/reports/view/${report.id}?print=true`}
                        >
                          <Printer size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* --- Pagination --- */}
          <div className={styles.pagination}>
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
              className={styles.pageBtn}
            >
              Previous
            </button>
            <span>Page {page} of {totalPages}</span>
            <button 
              disabled={page === totalPages} 
              onClick={() => setPage(p => p + 1)}
              className={styles.pageBtn}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* --- Mobile View Cards List --- */}
      <div className={styles.mobileView}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: '150px', background: 'rgba(255,255,255,0.5)', borderRadius: '12px', animation: 'pulse 1.5s infinite ease-in-out' }} />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className={styles.emptyState}>Tidak ada laporan ditemukan.</div>
        ) : (
          <div className={styles.mobileCardsContainer}>
            {reports.map((report) => (
              <div key={report.id} className={styles.mobileCard}>
                <div className={styles.mobileCardHeader}>
                  <span className={styles.reportId} style={{ fontSize: '0.85rem' }}>
                    {report.id.replace(/-REV\d*-/, '-')}
                    {report.id.includes('-REV') && <span className={styles.revBadge} style={{ fontSize: '0.6rem' }}>REVISI</span>}
                  </span>
                  <span className={styles.typeBadge} style={{ fontSize: '0.65rem', padding: '3px 8px' }}>
                    {formTypes.find(t => t.id === report.form_type)?.label.split(' ')[0] || report.form_type}
                  </span>
                </div>

                <div className={styles.mobileCardMeta} onClick={() => router.push(`/reports/view/${report.id}`)}>
                  <div className={styles.metaField}>
                    <span className={styles.metaLabel}>Unit:</span>
                    <span className={styles.metaValue}>{report.unit?.model_name || 'Unit'}</span>
                  </div>
                  <div className={styles.metaField}>
                    <span className={styles.metaLabel}>Serial Number:</span>
                    <span className={styles.metaValue} style={{ color: 'var(--color-cobalt-blue)' }}>{report.unit?.serial_number || '—'}</span>
                  </div>
                  <div className={styles.metaField}>
                    <span className={styles.metaLabel}>Tanggal:</span>
                    <span className={styles.metaValue}>
                      {parseDate(report.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} {parseDate(report.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                    </span>
                  </div>
                  <div className={styles.metaField}>
                    <span className={styles.metaLabel}>Oleh:</span>
                    <span className={styles.metaValue}>{report.created_by?.full_name || 'Admin'}</span>
                  </div>
                </div>

                <div className={styles.mobileCardActions}>
                  <button 
                    onClick={() => router.push(
                      report.form_type === 'COOLING_1'
                        ? `/reports/cooling?editId=${report.id}`
                        : report.form_type === 'COOLING_2'
                        ? `/reports/cooling2?editId=${report.id}`
                        : report.form_type === 'COOLING_3'
                        ? `/reports/cooling3?editId=${report.id}`
                        : report.form_type === 'COOLING_WARM'
                        ? `/reports/reportwarm?editId=${report.id}`
                        : report.form_type === 'REWORK'
                        ? `/reports/rework?editId=${report.id}`
                        : report.form_type === 'COMMISSIONING'
                        ? `/reports/graphic-record?editId=${report.id}`
                        : report.form_type === 'QC_SERVICE'
                        ? `/reports/qc-service?editId=${report.id}`
                        : `/reports/inspection?editId=${report.id}`
                    )}
                    className={`${styles.mobileActionBtn} ${styles.mobileActionEdit}`}
                  >
                    <FileEdit size={14} />
                    Edit
                  </button>
                  <button 
                    onClick={() => router.push(`/reports/view/${report.id}`)}
                    className={`${styles.mobileActionBtn} ${styles.mobileActionView}`}
                  >
                    <Eye size={14} />
                    Lihat
                  </button>
                  <button 
                    onClick={() => window.location.href = `/reports/view/${report.id}?print=true`}
                    className={`${styles.mobileActionBtn} ${styles.mobileActionPrint}`}
                  >
                    <Printer size={14} />
                    Print
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- Mobile Pagination --- */}
        {totalPages > 1 && (
          <div className={styles.mobilePagination}>
            <button
              disabled={page === 1 || loading}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className={styles.mobilePageArrow}
            >
              <ChevronLeft size={16} />
              <span>Sebelumnya</span>
            </button>
            <span className={styles.mobilePageIndicator}>
              Hal. <strong>{page}</strong> dari <strong>{totalPages}</strong>
            </span>
            <button
              disabled={page === totalPages || loading}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className={styles.mobilePageArrow}
            >
              <span>Selanjutnya</span>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
