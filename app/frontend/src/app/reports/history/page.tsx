'use client';

import { useState, useEffect, useCallback } from 'react';
import { reportApi } from '@/lib/api';
import { Search, Filter, Eye, Printer, FileEdit, Trash2, Plus } from 'lucide-react';
import Link from 'next/link';
import styles from './history.module.css';

const formTypes = [
  { id: 'INSPECTION',    label: 'Inspection Report (QC)' },
  { id: 'COOLING_1',     label: 'Cooling Report (1 Suhu)' },
  { id: 'COOLING_2',     label: 'Cooling Report (2 Suhu)' },
  { id: 'COOLING_3',     label: 'Cooling Report (3 Suhu)' },
  { id: 'ISSUE_ANALYSIS', label: 'Analisis Masalah' },
  { id: 'MAINTENANCE',  label: 'Maintenance Log' },
  { id: 'COMMISSIONING', label: 'Commissioning Report' },
  { id: 'QA_TEST',       label: 'Uji Kelayakan (QA)' },
  { id: 'INSTALLATION',  label: 'Installation Report' },
  { id: 'WARRANTY_CLAIM', label: 'Klaim Garansi' },
  { id: 'OTHER',         label: 'Laporan Lainnya' },
];

export default function ReportHistory() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Mock admin check (should come from auth context)
  const isAdmin = true;

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await reportApi.findAll(page, 10, typeFilter);
      setReports(data.data || []);
      setTotalPages(data.meta?.last_page || 1);
    } catch (err) {
      console.error('Failed to load reports history', err);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

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
        <div className={styles.headerActions}>
          {selectedReports.length > 0 && isAdmin && (
            <button 
              className={styles.deleteBulkBtn} 
              onClick={handleDeleteBulk}
              disabled={isDeleting}
            >
              <Trash2 size={18} /> Hapus ({selectedReports.length})
            </button>
          )}
          <Link href="/reports/inspection" className={styles.createBtn}>
            <Plus size={18} /> Laporan Baru
          </Link>
        </div>
      </header>

      {/* --- Filter Bar --- */}
      <div className={styles.filterBar}>
        <div className={styles.searchBox}>
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Cari Nomor Laporan atau Unit..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className={styles.filterGroup}>
          <Filter size={18} />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">Semua Jenis Laporan</option>
            {formTypes.map(t => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* --- Table --- */}
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
              <th>Tanggal</th>
              <th>Oleh</th>
              <th style={{ textAlign: 'right' }}>Action</th>
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
                      {report.id}
                      {report.id.includes('-REV-') && <span className={styles.revBadge}>REVISI</span>}
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
                  <td className={styles.dateCell}>
                    <span>{new Date(report.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                    <small>{new Date(report.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</small>
                  </td>
                  <td className={styles.userCell}>
                    <span>{report.created_by?.full_name || 'Admin'}</span>
                    <small>QC Staff</small>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className={styles.actions}>
                      <Link href={`/reports/inspection?editId=${report.id}`} title="Edit Laporan" className={styles.editBtn}>
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
  );
}
