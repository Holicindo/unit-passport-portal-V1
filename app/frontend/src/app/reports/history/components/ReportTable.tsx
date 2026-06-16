'use client';

import { useRouter } from 'next/navigation';
import { Eye, Printer, FileEdit, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { formTypes, getEditUrl, parseDate } from '../constants';
import styles from '../history.module.css';

interface Props {
  reports: any[];
  loading: boolean;
  selectedReports: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: (checked: boolean) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function ReportTable({
  reports, loading, selectedReports, onToggleSelect, onSelectAll,
  page, totalPages, onPageChange,
}: Props) {
  const router = useRouter();

  return (
    <>
      {/* Desktop View */}
      <div className={styles.desktopView}>
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input type="checkbox" onChange={(e) => onSelectAll(e.target.checked)} checked={reports.length > 0 && selectedReports.length === reports.length} />
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
                <tr><td colSpan={7} className={styles.emptyState}>Tidak ada laporan ditemukan.</td></tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.id} className={styles.dataRow}>
                    <td>
                      <input type="checkbox" checked={selectedReports.includes(report.id)} onChange={() => onToggleSelect(report.id)} />
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
                        <span>{parseDate(report.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
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
                        <Link href={getEditUrl(report.form_type, report.id)} title="Edit Laporan" className={styles.editBtn}>
                          <FileEdit size={18} />
                        </Link>
                        <Link href={`/reports/view/${report.id}`} title="Lihat Form"><Eye size={18} /></Link>
                        <button title="Print / PDF" onClick={() => window.location.href = `/reports/view/${report.id}?print=true`}>
                          <Printer size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className={styles.pagination}>
            <button disabled={page === 1} onClick={() => onPageChange(page - 1)} className={styles.pageBtn}>Previous</button>
            <span>Page {page} of {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => onPageChange(page + 1)} className={styles.pageBtn}>Next</button>
          </div>
        </div>
      </div>

      {/* Mobile View */}
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
                      {parseDate(report.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} {parseDate(report.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                    </span>
                  </div>
                  <div className={styles.metaField}>
                    <span className={styles.metaLabel}>Oleh:</span>
                    <span className={styles.metaValue}>{report.created_by?.full_name || 'Admin'}</span>
                  </div>
                </div>
                <div className={styles.mobileCardActions}>
                  <button onClick={() => router.push(getEditUrl(report.form_type, report.id))} className={`${styles.mobileActionBtn} ${styles.mobileActionEdit}`}>
                    <FileEdit size={14} /> Edit
                  </button>
                  <button onClick={() => router.push(`/reports/view/${report.id}`)} className={`${styles.mobileActionBtn} ${styles.mobileActionView}`}>
                    <Eye size={14} /> Lihat
                  </button>
                  <button onClick={() => window.location.href = `/reports/view/${report.id}?print=true`} className={`${styles.mobileActionBtn} ${styles.mobileActionPrint}`}>
                    <Printer size={14} /> Print
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className={styles.mobilePagination}>
            <button disabled={page === 1 || loading} onClick={() => onPageChange(Math.max(1, page - 1))} className={styles.mobilePageArrow}>
              <ChevronLeft size={16} /><span>Sebelumnya</span>
            </button>
            <span className={styles.mobilePageIndicator}>
              Hal. <strong>{page}</strong> dari <strong>{totalPages}</strong>
            </span>
            <button disabled={page === totalPages || loading} onClick={() => onPageChange(Math.min(totalPages, page + 1))} className={styles.mobilePageArrow}>
              <span>Selanjutnya</span><ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
