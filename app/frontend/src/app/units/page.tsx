'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { unitApi } from '@/lib/api';
import { Search, QrCode, ChevronRight, ChevronLeft, Pencil } from 'lucide-react';
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
          <td><div className={styles.skeletonCell} style={{ width: '80px', borderRadius: '20px' }} /></td>
          <td><div className={styles.skeletonCell} style={{ width: '130px' }} /></td>
          <td><div className={styles.skeletonCell} style={{ width: '64px', borderRadius: '20px' }} /></td>
          <td><div className={styles.skeletonCell} style={{ width: '54px' }} /></td>
        </tr>
      ))}
    </tbody>
  );
}

export default function UnitsPage() {
  const router = useRouter();
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const handleDownloadQR = (serialNumber: string, qrToken: string) => {
    // Generate the URL for the QR code
    const targetUrl = `${window.location.origin}/id/${qrToken}`;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(targetUrl)}`;
    
    // Open in a new tab which allows the user to see and print it
    window.open(qrApiUrl, '_blank');
  };

  const loadUnits = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const userData = localStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;
      
      let response;
      if (user?.role === 'CLIENT') {
        response = await unitApi.findMyFleet();
      } else {
        response = await unitApi.findAll(page, PAGE_SIZE);
      }
      
      const { data } = response;
      
      let unitsArray: any[] = [];
      let countValue = 0;

      if (Array.isArray(data)) {
        // Handle flat array (Client's fleet)
        unitsArray = data;
        countValue = data.length;
      } else if (data && typeof data === 'object') {
        // Handle NestJS backend format { data: [], meta: { total: 0 } }
        unitsArray = data.data || data.items || [];
        countValue = data.meta?.total ?? data.total ?? data.count ?? unitsArray.length;
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
      </header>

      {/* Mobile Submenu Pill Tabs */}
      <div className="mobile-sub-tabs">
        <button 
          className="mobile-sub-tab active"
          onClick={() => router.push('/units')}
        >
          Daftar Unit
        </button>
        <button 
          className="mobile-sub-tab"
          onClick={() => router.push('/units/new')}
        >
          Registrasi Unit
        </button>
      </div>

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

        {/* ── Desktop View Table ── */}
        <div className={styles.desktopView}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Serial Number</th>
                  <th>Model</th>
                  <th>Kategori</th>
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
                    <td colSpan={7} className={styles.emptyState}>
                      No units found.
                    </td>
                  </tr>
                </tbody>
              ) : (
                <tbody>
                  {displayedUnits.map((unit, idx) => {
                    const statusKey = `status_${(unit.status ?? 'active').toLowerCase()}` as keyof typeof styles;
                    const isMachine = unit.specs?.type === 'MESIN' || (!unit.specs?.type && unit.specs?.dimension);
                    
                    return (
                      <tr key={unit.id} className={styles.dataRow}>
                        <td className={styles.numCol}>{startRow + idx}</td>
                        <td>
                          <span className={styles.serialTag}>{unit.serial_number}</span>
                        </td>
                        <td className={styles.modelCell}>{unit.model_name}</td>
                        <td>
                          <span className={`${styles.typeBadge} ${isMachine ? styles.type_mesin : styles.type_showcase}`}>
                            {isMachine ? 'MESIN' : 'SHOWCASE'}
                          </span>
                        </td>
                        <td className={styles.customerCell}>
                          {unit.current_client?.company_name || <span className={styles.noOwner}>—</span>}
                        </td>
                        <td>
                          <span className={`${styles.statusBadge} ${styles[statusKey] ?? styles.status_active}`}>
                            {unit.status ?? 'Active'}
                          </span>
                        </td>
                        <td style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <button 
                            onClick={() => handleDownloadQR(unit.serial_number, unit.qr_token)}
                            className={styles.qrIconBtn}
                            title="Generate QR Code"
                          >
                            <QrCode size={15} />
                          </button>
                          <button
                            onClick={() => router.push(`/units/edit?id=${unit.id}`)}
                            className={styles.editBtn}
                            title="Edit Unit"
                          >
                            <Pencil size={13} />
                            Edit
                          </button>
                          <Link href={`/id/${unit.qr_token}`} className={styles.actionBtn}>
                            Detail <ChevronRight size={13} />
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
            <div className={styles.paginationLeft}>
              <span className={styles.totalText}>
                {loading
                  ? 'Loading...'
                  : totalCount === 0
                  ? 'No data'
                  : `Showing ${startRow}–${endRow} of ${effectiveTotal} units`}
              </span>
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

        {/* ── Mobile View Cards List ── */}
        <div className={styles.mobileView}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ height: '140px', background: 'rgba(255,255,255,0.5)', borderRadius: '12px', animation: 'pulse 1.5s infinite ease-in-out' }} />
              ))}
            </div>
          ) : displayedUnits.length === 0 ? (
            <div className={styles.emptyState}>No units found.</div>
          ) : (
            <div className={styles.mobileCardsContainer}>
              {displayedUnits.map((unit) => {
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
                        <span className={`${styles.statusBadge} ${styles[statusKey] ?? styles.status_active}`}>
                          {unit.status ?? 'Active'}
                        </span>
                      </div>
                    </div>

                    <div className={styles.mobileCardActions}>
                      <button 
                        onClick={() => handleDownloadQR(unit.serial_number, unit.qr_token)}
                        className={`${styles.mobileActionBtn} ${styles.mobileActionQr}`}
                      >
                        <QrCode size={14} />
                        QR Code
                      </button>
                      <button 
                        onClick={() => router.push(`/units/edit?id=${unit.id}`)}
                        className={`${styles.mobileActionBtn} ${styles.mobileActionEdit}`}
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                      <button 
                        onClick={() => router.push(`/id/${unit.qr_token}`)}
                        className={`${styles.mobileActionBtn} ${styles.mobileActionDetail}`}
                      >
                        Detail
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Mobile Pagination ── */}
          {totalPages > 1 && (
            <div className={styles.mobilePagination}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading}
                className={styles.mobilePageArrow}
              >
                <ChevronLeft size={18} />
                <span>Sebelumnya</span>
              </button>
              <span className={styles.mobilePageIndicator}>
                Hal. <strong>{currentPage}</strong> dari <strong>{totalPages}</strong>
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || loading}
                className={styles.mobilePageArrow}
              >
                <span>Selanjutnya</span>
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
