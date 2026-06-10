'use client';

import { useRouter } from 'next/navigation';
import { QrCode, ChevronRight, ChevronLeft, FileEdit, Eye } from 'lucide-react';
import Link from 'next/link';
import styles from '../units.module.css';

/* ── Skeleton loader ── */
export function TableSkeleton({ pageSize }: { pageSize: number }) {
  return (
    <tbody>
      {Array.from({ length: pageSize }).map((_, i) => (
        <tr key={i} className={styles.skeletonRow}>
          <td><div className={styles.skeletonCell} style={{ width: '110px' }} /></td>
          <td><div className={styles.skeletonCell} style={{ width: '150px' }} /></td>
          <td><div className={styles.skeletonCell} style={{ width: '130px' }} /></td>
          <td><div className={styles.skeletonCell} style={{ width: '150px' }} /></td>
          <td><div className={styles.skeletonCell} style={{ width: '40px' }} /></td>
        </tr>
      ))}
    </tbody>
  );
}

/* ── Helpers ── */
function handleDownloadQR(serialNumber: string, qrToken: string) {
  const targetUrl = `${window.location.origin}/id/${qrToken}`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(targetUrl)}`;
  window.open(qrApiUrl, '_blank');
}

/* ── Desktop Table View ── */
interface TableProps {
  units: any[];
  loading: boolean;
  pageSize: number;
}

export function DesktopTable({ units, loading, pageSize }: TableProps) {
  return (
    <div className={styles.desktopView}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Serial Number</th>
              <th>Model</th>
              <th>Outlet Branch</th>
              <th>Customer</th>
              <th>City</th>
              <th>Action</th>
            </tr>
          </thead>
          {loading ? (
            <TableSkeleton pageSize={pageSize} />
          ) : units.length === 0 ? (
            <tbody><tr><td colSpan={6} className={styles.emptyState}>No units found.</td></tr></tbody>
          ) : (
            <tbody>
              {units.map((unit) => (
                <tr key={unit.id} className={styles.dataRow}>
                  <td><span style={{ fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--color-deep-navy)' }}>{unit.serial_number}</span></td>
                  <td className={styles.modelCell}>{unit.model_name}</td>
                  <td><span style={{ color: 'var(--color-space-grey)', fontSize: '0.85rem' }}>{unit.outlet_branch || '—'}</span></td>
                  <td className={styles.customerCell}>{unit.current_client?.company_name || <span className={styles.noOwner}>—</span>}</td>
                  <td><span style={{ color: 'var(--color-space-grey)', fontSize: '0.85rem' }}>{unit.city || '—'}</span></td>
                  <td>
                    <div className={styles.actions}>
                      <Link href={`/id/${unit.qr_token}`} title="Lihat Detail" className={styles.actionIconBtn}>
                        <Eye size={18} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
}

/* ── Pagination ── */
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  loading: boolean;
  effectiveTotal: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, loading, effectiveTotal, pageSize, onPageChange }: PaginationProps) {
  const startRow = (currentPage - 1) * pageSize + 1;
  const endRow = Math.min(currentPage * pageSize, effectiveTotal);

  const pageWindow = (() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, 4, 5];
    if (currentPage >= totalPages - 2) return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
  })();

  return (
    <div className={styles.pagination}>
      <div className={styles.paginationLeft}>
        <span className={styles.totalText}>
          {loading ? 'Loading...' : effectiveTotal === 0 ? 'No data' : `Showing ${startRow}–${endRow} of ${effectiveTotal} units`}
        </span>
      </div>
      <div className={styles.paginationCenter}>
        <button onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1 || loading} className={styles.pageArrow}>
          <ChevronLeft size={16} />
        </button>
        <div className={styles.pageNumbers}>
          {pageWindow[0] > 1 && (
            <>
              <button onClick={() => onPageChange(1)} className={styles.pageBtn}>1</button>
              {pageWindow[0] > 2 && <span className={styles.ellipsis}>...</span>}
            </>
          )}
          {pageWindow.map(page => (
            <button key={page} onClick={() => onPageChange(page)} className={`${styles.pageBtn} ${currentPage === page ? styles.activePage : ''}`}>
              {page}
            </button>
          ))}
          {pageWindow[pageWindow.length - 1] < totalPages && (
            <>
              {pageWindow[pageWindow.length - 1] < totalPages - 1 && <span className={styles.ellipsis}>...</span>}
              <button onClick={() => onPageChange(totalPages)} className={styles.pageBtn}>{totalPages}</button>
            </>
          )}
        </div>
        <button onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages || loading} className={styles.pageArrow}>
          <ChevronRight size={16} />
        </button>
      </div>
      <div className={styles.paginationRight}>
        <div className={styles.perPageSelect}>{pageSize} / page</div>
      </div>
    </div>
  );
}

/* ── Mobile Cards View ── */
interface MobileProps {
  units: any[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function MobileCards({ units, loading, currentPage, totalPages, onPageChange }: MobileProps) {
  const router = useRouter();

  return (
    <div className={styles.mobileView}>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: '140px', background: 'rgba(255,255,255,0.5)', borderRadius: '12px', animation: 'pulse 1.5s infinite ease-in-out' }} />
          ))}
        </div>
      ) : units.length === 0 ? (
        <div className={styles.emptyState}>No units found.</div>
      ) : (
        <div className={styles.mobileCardsContainer}>
          {units.map((unit) => {
            const statusKey = `status_${(unit.status ?? 'active').toLowerCase()}` as keyof typeof styles;
            const isMachine = unit.specs?.type === 'MESIN' || (!unit.specs?.type && unit.specs?.dimension);

            return (
              <div key={unit.id} className={styles.mobileCard}>
                <div className={styles.mobileCardHeader}>
                  <span className={styles.serialTag}>{unit.serial_number}</span>
                  <span className={`${styles.typeBadge} ${isMachine ? styles.type_mesin : styles.type_showcase}`}>
                    {isMachine ? 'MESIN' : 'SHOWCASE'}
                  </span>
                </div>
                <div className={styles.mobileCardMeta} onClick={() => router.push(`/id/${unit.qr_token}`)}>
                  <div className={styles.metaField}>
                    <span className={styles.metaLabel}>Model / Tipe:</span>
                    <span className={styles.metaValue}>{unit.model_name}</span>
                  </div>
                  <div className={styles.metaField}>
                    <span className={styles.metaLabel}>Customer:</span>
                    <span className={styles.metaValue}>{unit.current_client?.company_name || '—'}</span>
                  </div>
                  <div className={styles.metaField}>
                    <span className={styles.metaLabel}>Status Unit:</span>
                    <span className={`${styles.statusBadge} ${styles[statusKey] ?? styles.status_active}`}>{unit.status ?? 'Active'}</span>
                  </div>
                </div>
                <div className={styles.mobileCardActions}>
                  <button onClick={() => handleDownloadQR(unit.serial_number, unit.qr_token)} className={`${styles.mobileActionBtn} ${styles.mobileActionQr}`}>
                    <QrCode size={14} /> QR Code
                  </button>
                  <button onClick={() => router.push(`/units/edit?id=${unit.id}`)} className={`${styles.mobileActionBtn} ${styles.mobileActionEdit}`}>
                    <FileEdit size={14} /> Edit
                  </button>
                  <button onClick={() => router.push(`/id/${unit.qr_token}`)} className={`${styles.mobileActionBtn} ${styles.mobileActionDetail}`}>
                    Detail <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className={styles.mobilePagination}>
          <button onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1 || loading} className={styles.mobilePageArrow}>
            <ChevronLeft size={18} /><span>Sebelumnya</span>
          </button>
          <span className={styles.mobilePageIndicator}>
            Hal. <strong>{currentPage}</strong> dari <strong>{totalPages}</strong>
          </span>
          <button onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages || loading} className={styles.mobilePageArrow}>
            <span>Selanjutnya</span><ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
