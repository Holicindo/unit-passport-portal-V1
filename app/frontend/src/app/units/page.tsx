'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { unitApi } from '@/lib/api';
import { Search, QrCode, ChevronRight, ChevronLeft, FileEdit, Eye, Plus, ShieldCheck, Upload, X, CheckCircle, AlertTriangle, Loader } from 'lucide-react';
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
  const [clientFilter, setClientFilter] = useState('');
  const [availableClients, setAvailableClients] = useState<{id: string, name: string}[]>([]);

  // Bulk upload state
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkMode, setBulkMode] = useState<'upsert' | 'replace'>('upsert');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<any>(null);

  // Read ?filter=warranty from URL
  const filterParam = searchParams.get('filter');
  const isWarrantyFilter = filterParam === 'warranty';

  const handleBulkUpload = async () => {
    if (!bulkFile) return;
    setBulkLoading(true);
    setBulkResult(null);
    try {
      const { unitApi } = await import('@/lib/api');
      const res = await unitApi.bulkUpload(bulkFile, bulkMode);
      setBulkResult(res.data);
      loadUnits(1);
    } catch (e: any) {
      setBulkResult({ success: false, message: e.response?.data?.message || e.message });
    } finally {
      setBulkLoading(false);
    }
  };

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
        response = await unitApi.findAll(page, pageSize, searchTerm, cityFilter, clientFilter);
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
  }, [pageSize, searchTerm, cityFilter, clientFilter, router]);

  useEffect(() => {
    loadUnits(currentPage);
  }, [currentPage, loadUnits]);

  // Extract available cities and clients from loaded units
  useEffect(() => {
    if (units.length > 0) {
      const cities = [...new Set(
        units
          .map((u: any) => u.city || u.current_client?.city)
          .filter(Boolean)
      )].sort() as string[];
      setAvailableCities(prev => {
        const merged = [...new Set([...prev, ...cities])].sort();
        return merged;
      });

      const clientsMap = new Map();
      units.forEach((u: any) => {
        if (u.current_client?.id && u.current_client?.company_name) {
          clientsMap.set(u.current_client.id, u.current_client.company_name);
        }
      });
      setAvailableClients(prev => {
        const merged = new Map(prev.map(p => [p.id, p.name]));
        clientsMap.forEach((name, id) => merged.set(id, name));
        return Array.from(merged.entries()).map(([id, name]) => ({id, name})).sort((a, b) => a.name.localeCompare(b.name));
      });
    }
  }, [units]);

  // Client-side filter on the current page's data (now mostly fallback/search)
  const today = new Date();
  const filteredUnits = units.filter(u => {
    const matchesSearch =
      (u.serial_number ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.model_name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.current_client?.company_name ?? '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesWarranty = !isWarrantyFilter ||
      (u.warranty_expiry && new Date(u.warranty_expiry) >= today);

    // cityFilter and clientFilter are handled by backend, but we keep this for flat array (client view)
    const matchesCity = !cityFilter ||
      (u.city || u.current_client?.city || '').toLowerCase() === cityFilter.toLowerCase();
    
    const matchesClient = !clientFilter ||
      (u.current_client?.id === clientFilter);

    return matchesSearch && matchesWarranty && matchesCity && matchesClient;
  });

  const displayedUnits = isWarrantyFilter ? filteredUnits.slice(0, pageSize) : units;
  const effectiveTotal = (isWarrantyFilter) ? filteredUnits.length : totalCount;
  const totalPages = Math.max(1, Math.ceil(effectiveTotal / pageSize));
  const startRow = (currentPage - 1) * pageSize + 1;
  const endRow = Math.min(currentPage * pageSize, effectiveTotal);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1);
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
        {(isWarrantyFilter || cityFilter || clientFilter) && (
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
                Hapus Filter Kota
              </button>
            )}
            {clientFilter && (
              <button
                onClick={() => setClientFilter('')}
                style={{
                  background: 'none', border: '1px solid #cbd5e1', borderRadius: '8px',
                  padding: '6px 14px', fontSize: '0.8rem', color: '#64748b',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                }}
              >
                Hapus Filter Customer
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
                ...availableClients.map(c => ({ value: c.id, label: c.name }))
              ]}
              value={clientFilter}
              onChange={(val) => { setClientFilter(val); setCurrentPage(1); }}
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
            <button
              className="dtToolbarCreateBtn"
              onClick={() => { setBulkModalOpen(true); setBulkResult(null); setBulkFile(null); }}
              style={{ background: '#001F3F', marginRight: '8px' }}
            >
              <Upload size={15} strokeWidth={2.5} />
              Bulk Upload
            </button>
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
                            {unit.outlet_branch || '—'}
                          </span>
                        </td>
                        <td className={styles.customerCell}>
                          {unit.current_client?.company_name || <span className={styles.noOwner}>—</span>}
                        </td>
                        <td>
                          <span style={{ color: 'var(--color-space-grey)', fontSize: '0.85rem' }}>
                            {unit.city || '—'}
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

      {/* ── Bulk Upload Modal ── */}
      {bulkModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
        }}>
          <div style={{
            background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '520px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.2)', overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 24px', borderBottom: '1px solid #f1f5f9',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: '#001F3F', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Upload size={18} color="#001F3F" />
                </div>
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>Bulk Upload Units</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Import data unit dari file CSV</div>
                </div>
              </div>
              <button
                onClick={() => { setBulkModalOpen(false); setBulkResult(null); setBulkFile(null); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              {!bulkResult ? (
                <>
                  <label style={{
                    display: 'block', border: '2px dashed #e2e8f0', borderRadius: '12px',
                    padding: '32px 20px', textAlign: 'center', cursor: 'pointer',
                    background: bulkFile ? '#f0fdf4' : '#fafafa',
                    borderColor: bulkFile ? '#22c55e' : '#e2e8f0',
                    transition: 'all 0.2s',
                  }}>
                    <input
                      type="file"
                      accept=".csv"
                      style={{ display: 'none' }}
                      onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                    />
                    {bulkFile ? (
                      <>
                        <CheckCircle size={32} color="#22c55e" style={{ margin: '0 auto 8px' }} />
                        <div style={{ fontWeight: 600, color: '#166534', fontSize: '0.9rem' }}>{bulkFile.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#16a34a' }}>
                          {(bulkFile.size / 1024).toFixed(1)} KB — Klik untuk ganti file
                        </div>
                      </>
                    ) : (
                      <>
                        <Upload size={32} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                        <div style={{ fontWeight: 600, color: '#475569', fontSize: '0.9rem' }}>Klik untuk pilih file CSV</div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>
                          Format kolom: Serial Number, Item Description, Item Code, Customer Code, ITR#, PRO#, Manufacture SN, SO#, DO#, Delivery Date, Branch, Delivery Address
                        </div>
                      </>
                    )}
                  </label>

                  <div style={{ marginTop: '16px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Mode Import</div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {(['upsert', 'replace'] as const).map(m => (
                        <label key={m} style={{
                          flex: 1, display: 'flex', alignItems: 'flex-start', gap: '10px',
                          padding: '12px', borderRadius: '10px', cursor: 'pointer',
                          border: `2px solid ${bulkMode === m ? '#001F3F' : '#e2e8f0'}`,
                          background: bulkMode === m ? '#f8fafc' : '#fff',
                          transition: 'all 0.2s',
                        }}>
                          <input
                            type="radio"
                            name="bulkMode"
                            value={m}
                            checked={bulkMode === m}
                            onChange={() => setBulkMode(m)}
                            style={{ marginTop: '2px', accentColor: '#001F3F' }}
                          />
                          <div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>
                              {m === 'upsert' ? 'Update & Tambah' : 'Replace (Ganti Semua)'}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '2px', lineHeight: 1.4 }}>
                              {m === 'upsert'
                                ? 'Update unit yang sudah ada, tambah yang baru. Unit lama tetap disimpan.'
                                : '⚠️ Update & tambah unit dari CSV, lalu HAPUS unit yang tidak ada di CSV.'}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button
                      onClick={() => { setBulkModalOpen(false); setBulkFile(null); }}
                      style={{
                        flex: 1, padding: '11px', borderRadius: '10px',
                        border: '1px solid #e2e8f0', background: '#fff',
                        fontSize: '0.875rem', fontWeight: 600, color: '#64748b', cursor: 'pointer',
                      }}
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleBulkUpload}
                      disabled={!bulkFile || bulkLoading}
                      style={{
                        flex: 2, padding: '11px', borderRadius: '10px', border: 'none',
                        background: !bulkFile || bulkLoading ? '#e2e8f0' : '#001F3F',
                        fontSize: '0.875rem', fontWeight: 700,
                        color: !bulkFile || bulkLoading ? '#94a3b8' : '#fff',
                        cursor: !bulkFile || bulkLoading ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        transition: 'all 0.2s',
                      }}
                    >
                      {bulkLoading ? (
                        <>
                          <Loader size={16} className={styles.spinIcon} />
                          Mengupload & memproses...
                        </>
                      ) : (
                        <><Upload size={16} /> Upload & Proses</>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  {bulkResult.success ? (
                    <>
                      <CheckCircle size={48} color="#22c55e" style={{ margin: '0 auto 12px' }} />
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#166534', marginBottom: '4px' }}>Upload Berhasil!</div>
                      <div style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px',
                        margin: '16px 0', textAlign: 'left',
                      }}>
                        {[
                          { label: 'Total Diproses', value: bulkResult.summary?.total_rows ?? 0, color: '#3b82f6' },
                          { label: 'Unit Baru', value: bulkResult.summary?.inserted ?? 0, color: '#22c55e' },
                          { label: 'Diperbarui', value: bulkResult.summary?.updated ?? 0, color: '#f59e0b' },
                          { label: 'Dihapus', value: bulkResult.summary?.deleted ?? 0, color: '#c30000ff' },
                        ].map(s => (
                          <div key={s.label} style={{
                            padding: '12px', borderRadius: '10px', background: '#f8fafc',
                            border: `1px solid ${s.color}30`,
                          }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>{s.label}</div>
                          </div>
                        ))}
                      </div>
                      {bulkResult.errors?.length > 0 && (
                        <div style={{
                          background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '10px',
                          padding: '12px', textAlign: 'left', marginTop: '8px',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#c2410c', fontSize: '0.8rem', marginBottom: '6px' }}>
                            <AlertTriangle size={14} /> {bulkResult.errors.length} Error
                          </div>
                          {bulkResult.errors.slice(0, 5).map((e: string, i: number) => (
                            <div key={i} style={{ fontSize: '0.72rem', color: '#92400e', marginBottom: '2px' }}>• {e}</div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={48} color="#ef4444" style={{ margin: '0 auto 12px' }} />
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#dc2626', marginBottom: '8px' }}>Upload Gagal</div>
                      <div style={{ fontSize: '0.82rem', color: '#64748b' }}>{bulkResult.message}</div>
                    </>
                  )}
                  <button
                    onClick={() => { setBulkModalOpen(false); setBulkResult(null); setBulkFile(null); }}
                    style={{
                      marginTop: '20px', padding: '10px 28px', borderRadius: '10px',
                      background: '#001F3F', border: 'none', color: '#fff',
                      fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    Tutup
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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
