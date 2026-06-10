'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { reportApi } from '@/lib/api';
import { Search, Trash2, Plus } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { formTypes } from './constants';
import ReportTable from './components/ReportTable';
import styles from './history.module.css';

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
  const [typeFilter, setTypeFilter] = useState(() => searchParams.get('type') || '');
  const [unitFilter, setUnitFilter] = useState(() => searchParams.get('unit') || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

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

  useEffect(() => { loadReports(); }, [loadReports]);

  const toggleSelect = (id: string) => {
    setSelectedReports(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedReports(checked ? reports.map(r => r.id) : []);
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

      <div className="mobile-sub-tabs">
        <button className="mobile-sub-tab" onClick={() => router.push('/reports')}>Digital Form</button>
        <button className="mobile-sub-tab active" onClick={() => router.push('/reports/history')}>Riwayat Laporan</button>
      </div>

      {/* Toolbar */}
      <div className="dtToolbar">
        <div className="dtToolbarLeft">
          <div className="dtToolbarText">
            Show
            <CustomSelect options={[{ value: '10', label: '10' }, { value: '25', label: '25' }, { value: '50', label: '50' }]} value={pageSize.toString()} onChange={(val) => { setPageSize(parseInt(val, 10)); setPage(1); }} />
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
            <button onClick={handleDeleteBulk} disabled={isDeleting} style={{ background: '#FF4D4D', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <Trash2 size={16} /> Hapus ({selectedReports.length})
            </button>
          )}
          <div className="dtToolbarSearch">
            <input type="text" placeholder="Cari Laporan atau Unit..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="dtToolbarSearchInput" />
            <Search size={16} className="dtToolbarSearchIcon" />
          </div>
          <Link href="/reports/inspection" className="dtToolbarCreateBtn" style={{ textDecoration: 'none' }}>
            <Plus size={16} strokeWidth={2.5} /> Laporan Baru
          </Link>
        </div>
      </div>

      <ReportTable
        reports={reports} loading={loading}
        selectedReports={selectedReports}
        onToggleSelect={toggleSelect} onSelectAll={handleSelectAll}
        page={page} totalPages={totalPages} onPageChange={setPage}
      />
    </div>
  );
}
