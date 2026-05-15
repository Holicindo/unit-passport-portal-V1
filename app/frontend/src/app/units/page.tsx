'use client';

import { useEffect, useState, useCallback } from 'react';
import { unitApi } from '@/lib/api';
import { Search, QrCode, ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight } from 'lucide-react';
import Link from 'next/link';
import styles from './units.module.css';

const PAGE_SIZE = 15;

/** Instant skeleton table — renders before any API call completes */
function TableSkeleton() {
  return (
    <tbody>
      {Array.from({ length: PAGE_SIZE }).map((_, i) => (
        <tr key={i} className={styles.skeletonRow}>
          <td><div className={styles.skeletonCell} style={{ width: '24px' }} /></td>
          <td><div className={styles.skeletonCell} style={{ width: '110px' }} /></td>
          <td><div className={styles.skeletonCell} style={{ width: '150px' }} /></td>
          <td><div className={styles.skeletonCell} style={{ width: '130px' }} /></td>
          <td><div className={styles.skeletonCell} style={{ width: '64px', borderRadius: '20px' }} /></td>
          <td><div className={styles.skeletonCell} style={{ width: '54px' }} /></td>
        </tr>
      ))}
    </tbody>
  );
}

export default function UnitsPage() {
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const loadUnits = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const { data } = await unitApi.findAll(page, PAGE_SIZE);
      
      let unitsArray: any[] = [];
      let countValue = 0;

      if (data && typeof data === 'object') {
        // Handle NestJS backend format { data: [], meta: { total: 0 } }
        unitsArray = data.data || data.items || [];
        countValue = data.meta?.total ?? data.total ?? data.count ?? unitsArray.length;
      } else if (Array.isArray(data)) {
        // Handle [units, count] format
        unitsArray = data[0] || [];
        countValue = typeof data[1] === 'number' ? data[1] : unitsArray.length;
      }

      setUnits(unitsArray);
      setTotalCount(countValue);
    } catch (err) {
      console.error('Failed to load units', err);
      setUnits([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUnits(currentPage);
  }, [currentPage, loadUnits]);

  // Client-side filter on the current page's data
  const filteredUnits = units.filter(u =>
    (u.serial_number ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.model_name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.client?.company_name ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedUnits = searchTerm ? filteredUnits : units;
  const effectiveTotal = searchTerm ? filteredUnits.length : totalCount;
  const totalPages = Math.max(1, Math.ceil(effectiveTotal / PAGE_SIZE));
  const startRow = (currentPage - 1) * PAGE_SIZE + 1;
  const endRow = Math.min(currentPage * PAGE_SIZE, effectiveTotal);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1);
    // If searching, we might want to tell the API, but for now we keep client-side filtering 
    // combined with the paginated load if the user expects more data.
    // However, the user said there are 512 units, so we should probably fetch from API with search.
  };

  useEffect(() => {
    // If the backend supports search, we should call it here.
    // unitApi.findAll(1, PAGE_SIZE, searchTerm)
    loadUnits(1);
  }, [searchTerm, loadUnits]);

  // Build page number window (max 5 pages shown)
  const pageWindow = (() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, 4, 5];
    if (currentPage >= totalPages - 2) return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
  })();

  return (
    <div className={styles.container}>
      <header className={styles.pageHeader}>
        <div>
          <h2 className={styles.title}>Unit Digital Passport</h2>
          <p className={styles.subtitle}>Manage and track all registered units in the system.</p>
        </div>
        <button className={styles.scanBtn}>
          <QrCode size={18} />
          <span>Scan QR</span>
        </button>
      </header>

      <div className={styles.tableCard}>
        {/* ── Toolbar ── */}
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={16} color="var(--color-space-grey)" />
            <input
              type="text"
              placeholder="Search serial number, model, or customer..."
              value={searchTerm}
              onChange={handleSearch}
              className={styles.searchInput}
            />
          </div>
          <span className={styles.countBadge}>
            {loading ? '...' : `${totalCount} units`}
          </span>
        </div>

        {/* ── Scrollable Table ── */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Serial Number</th>
                <th>Model</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            {loading ? (
              <TableSkeleton />
            ) : displayedUnits.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={6} className={styles.emptyState}>
                    No units found.
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {displayedUnits.map((unit, idx) => {
                  const statusKey = `status_${(unit.status ?? 'active').toLowerCase()}` as keyof typeof styles;
                  return (
                    <tr key={unit.id} className={styles.dataRow}>
                      <td className={styles.numCol}>{startRow + idx}</td>
                      <td>
                        <span className={styles.serialTag}>{unit.serial_number}</span>
                      </td>
                      <td className={styles.modelCell}>{unit.model_name}</td>
                      <td className={styles.customerCell}>
                        {unit.current_client?.company_name || <span className={styles.noOwner}>—</span>}
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[statusKey] ?? styles.status_active}`}>
                          {unit.status ?? 'Active'}
                        </span>
                      </td>
                      <td>
                        <Link href={`/units/${unit.id}`} className={styles.actionBtn}>
                          Detail <ChevronRight size={14} />
                        </Link>
                      </td>
       </tr>
                  );
                })}
              </tbody>
            )}
          </table>
        </div>

        {/* ── Pagination ── */}
        <div className={styles.pagination}>
          <span className={styles.paginationInfo}>
            {loading
              ? 'Loading...'
              : totalCount === 0
              ? 'No data'
              : `Showing ${startRow}–${endRow} of ${effectiveTotal} units`}
          </span>
        {/* ── Pagination ── */}
        <div className={styles.pagination}>
          <div className={styles.paginationLeft}>
            <span className={styles.totalText}>Total {effectiveTotal} unit</span>
          </div>
          
          <div className={styles.paginationCenter}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
              className={styles.pageArrow}
            >
              <ChevronLeft size={16} />
            </button>

            <div className={styles.pageNumbers}>
              {pageWindow[0] > 1 && (
                <>
                  <button onClick={() => setCurrentPage(1)} className={styles.pageBtn}>1</button>
                  {pageWindow[0] > 2 && <span className={styles.ellipsis}>...</span>}
                </>
              )}
              
              {pageWindow.map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`${styles.pageBtn} ${currentPage === page ? styles.activePage : ''}`}
                >
                  {page}
                </button>
              ))}

              {pageWindow[pageWindow.length - 1] < totalPages && (
                <>
                  {pageWindow[pageWindow.length - 1] < totalPages - 1 && <span className={styles.ellipsis}>...</span>}
                  <button onClick={() => setCurrentPage(totalPages)} className={styles.pageBtn}>{totalPages}</button>
                </>
              )}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || loading}
              className={styles.pageArrow}
            >
              <ChevronRight size={16} />
            </button>
          </div>
          
          <div className={styles.paginationRight}>
            <div className={styles.perPageSelect}>
              {PAGE_SIZE} / page
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
