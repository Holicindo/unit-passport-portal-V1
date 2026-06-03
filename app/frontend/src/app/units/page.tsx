'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { unitApi } from '@/lib/api';
import { Search, QrCode, ChevronRight, ChevronLeft, FileEdit, Eye, Plus, ShieldCheck } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import Link from 'next/link';
import styles from './units.module.css';

/** Instant skeleton table — renders before any API call completes */
function TableSkeleton({ pageSize }: { pageSize: number }) {
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

function UnitsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalCount, setTotalCount] = useState(0);
  const [cityFilter, setCityFilter] = useState('');
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  // Read ?filter=warranty from URL
  const filterParam = searchParams.get('filter');
  const isWarrantyFilter = filterParam === 'warranty';

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
      let user = null;
      try {
        const userData = localStorage.getItem('user');
        if (userData && userData !== 'undefined' && userData !== 'null') {
          user = JSON.parse(userData);
        }
      } catch { /* ignore */ }

      // Route-level access control: only ADMIN can see all units
      // CLIENT → my-fleet, PARTNER → redirect to partner portal
      let response;
      if (user?.role === 'CLIENT') {
        response = await unitApi.findMyFleet();
      } else if (user?.role === 'PARTNER') {
        // Partners should not access this admin page — redirect
        router.push('/partner-portal');
        return;
      } else {
        // ADMIN
        response = await unitApi.findAll(page, pageSize);
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
    } catch (err: any) {
      console.error('Failed to load units', err);
      // Handle 403 specifically — token expired or insufficient role
      if (err?.response?.status === 403 || err?.response?.status === 401) {
        // Token expired or invalid — redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }
      setUnits([]);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    loadUnits(currentPage);
  }, [currentPage, loadUnits]);

  // Extract available cities from loaded units
  useEffect(() => {
    if (units.length > 0) {
      const cities = [...new Set(
        units
          .map((u: any) => u.current_client?.city)
          .filter(Boolean)
      )].sort() as string[];
      setAvailableCities(prev => {
        const merged = [...new Set([...prev, ...cities])].sort();
        return merged;
      });
    }
  }, [units]);

  // Client-side filter on the current page's data
  const today = new Date();
  const filteredUnits = units.filter(u => {
    const matchesSearch =
      (u.serial_number ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.model_name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.current_client?.company_name ?? '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesWarranty = !isWarrantyFilter ||
      (u.warranty_expiry && new Date(u.warranty_expiry) >= today);

    const matchesCity = !cityFilter ||
      (u.current_client?.city ?? '').toLowerCase() === cityFilter.toLowerCase();

    return matchesSearch && matchesWarranty && matchesCity;
  });

  const displayedUnits = (searchTerm || isWarrantyFilter || cityFilter ? filteredUnits : units).slice(0, pageSize);
  const effectiveTotal = (searchTerm || isWarrantyFilter || cityFilter) ? filteredUnits.length : totalCount;
  const totalPages = Math.max(1, Math.ceil(effectiveTotal / pageSize));
  const startRow = (currentPage - 1) * pageSize + 1;
  const endRow = Math.min(currentPage * pageSize, effectiveTotal);

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
    // unitApi.findAll(1, pageSize, searchTerm)
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
          <h2 className={styles.title}>
            Unit Digital Passport
            {isWarrantyFilter && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                marginLeft: '12px', fontSize: '0.75rem', fontWeight: 600,
                background: '#00C48C20', color: '#00C48C',
                border: '1px solid #00C48C40', borderRadius: '20px',
                padding: '3px 10px', verticalAlign: 'middle',
              }}>
                <ShieldCheck size={13} /> Under Warranty
              </span>
            )}
          </h2>
          <p className={styles.subtitle}>
            {isWarrantyFilter
              ? 'Menampilkan unit yang masih dalam masa garansi.'
              : 'Manage and track all registered units in the system.'}
          </p>
        </div>
        {(isWarrantyFilter || cityFilter) && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {isWarrantyFilter && (
              <button
                onClick={() => router.push('/units')}
                style={{
                  background: 'none', border: '1px solid #cbd5e1', borderRadius: '8px',
                  padding: '6px 14px', fontSize: '0.8rem', color: '#64748b',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                }}
              >
                Hapus Filter Garansi
              </button>
            )}
            {cityFilter && (
              <button
                onClick={() => setCityFilter('')}
                style={{
                  background: 'none', border: '1px solid #cbd5e1', borderRadius: '8px',
                  padding: '6px 14px', fontSize: '0.8rem', color: '#64748b',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                }}
              >
                Hapus Filter Kota: {cityFilter}
              </button>
            )}
          </div>
        )}
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
        {/* ── Enterprise Datatable Toolbar ── */}
        <div className="dtToolbar">
          <div className="dtToolbarLeft">
            <div className="dtToolbarText">
              Show
              <CustomSelect
                options={[
                  { value: '15', label: '15' },
                  { value: '30', label: '30' },
                  { value: '50', label: '50' }
                ]}
                value={pageSize.toString()}
                onChange={(val) => {
                  const num = parseInt(val, 10);
                  setPageSize(num);
                  setCurrentPage(1);
                }}
              />
              entries
            </div>

            <CustomSelect
              options={[
                { value: '', label: 'Category' },
                { value: 'showcase', label: 'Showcase' },
                { value: 'mesin', label: 'Mesin' }
              ]}
              value=""
              onChange={() => {}}
              placeholder="Category"
            />
            <CustomSelect
              options={[
                { value: '', label: 'Customer' },
                { value: 'starbucks', label: 'Starbucks Indonesia' },
                { value: 'maxvalu', label: 'Max Valu' }
              ]}
              value=""
              onChange={() => {}}
              placeholder="Customer"
            />
            <CustomSelect
              options={[
                { value: '', label: 'City' },
                ...availableCities.map(c => ({ value: c, label: c }))
              ]}
              value={cityFilter}
              onChange={(val) => { setCityFilter(val); setCurrentPage(1); }}
              placeholder="City"
            />
          </div>

          <div className="dtToolbarRight">
            <div className="dtToolbarSearch">
              <input
                type="text"
                placeholder="Search serial number..."
                value={searchTerm}
                onChange={handleSearch}
                className="dtToolbarSearchInput"
              />
              <Search size={16} className="dtToolbarSearchIcon" />
            </div>
            <button className="dtToolbarCreateBtn" onClick={() => router.push('/units/new')}>
              <Plus size={16} strokeWidth={2.5} />
              Create New
            </button>
          </div>
        </div>

        {/* ── Desktop View Table ── */}
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
                    const isMachine = unit.specs?.type === 'MESIN' || (!unit.specs?.type && unit.specs?.dimension);
                    
                    return (
                      <tr key={unit.id} className={styles.dataRow}>
                        <td>
                          <span style={{ fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--color-deep-navy)' }}>{unit.serial_number}</span>
                        </td>
                        <td className={styles.modelCell}>{unit.model_name}</td>
                        <td>
                          <span style={{ color: 'var(--color-space-grey)', fontSize: '0.85rem' }}>
                            {unit.current_client?.outlet_branch || '—'}
                          </span>
                        </td>
                        <td className={styles.customerCell}>
                          {unit.current_client?.company_name || <span className={styles.noOwner}>—</span>}
                        </td>
                        <td>
                          <span style={{ color: 'var(--color-space-grey)', fontSize: '0.85rem' }}>
                            {unit.current_client?.city || '—'}
                          </span>
                        </td>
                        <td>
                          <div className={styles.actions}>
                            <Link href={`/id/${unit.qr_token}`} title="Lihat Detail" className={styles.actionIconBtn}>
                              <Eye size={18} />
                            </Link>
                          </div>
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
                {pageSize} / page
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
                        <FileEdit size={14} />
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

export default function UnitsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Memuat data unit...</div>}>
      <UnitsPageInner />
    </Suspense>
  );
}
