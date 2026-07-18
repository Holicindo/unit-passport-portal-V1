'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { unitApi } from '@/lib/api';
import Link from 'next/link';
import { Search, Eye, Package, RefreshCw, ChevronLeft, ChevronRight, Wrench, ArrowLeft } from 'lucide-react';
import styles from '../ClientPortal.module.css';

const PAGE_SIZE = 10;
const WINDOW = 2;

function StatusBadge({ status }: { status: string }) {
  const s = status?.toUpperCase();
  if (s === 'ACTIVE')      return <span className={styles.badgeActive}>Aktif</span>;
  if (s === 'MAINTENANCE') return <span className={styles.badgeMaintenance}>Dalam Perawatan</span>;
  return <span className={styles.badgeInactive}>{status || 'Tidak Aktif'}</span>;
}

// Hitung tanggal servis terakhir dari service_logs
function getLastServiceDate(unit: any): string | null {
  const logs: any[] = unit.service_logs || [];
  if (logs.length === 0) return null;
  const sorted = [...logs].sort((a, b) =>
    new Date(b.service_date || b.created_at || 0).getTime() -
    new Date(a.service_date || a.created_at || 0).getTime()
  );
  return sorted[0]?.service_date || sorted[0]?.created_at || null;
}

// ── Komponen Pagination yang bersih tanpa bug key ──
function Pagination({
  page,
  totalPages,
  totalItems,
  onPage,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  onPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const start = (page - 1) * PAGE_SIZE + 1;
  const end   = Math.min(page * PAGE_SIZE, totalItems);

  // Bangun daftar halaman dengan ellipsis
  const pages: (number | 'ellipsis-left' | 'ellipsis-right')[] = [];

  if (totalPages <= 7) {
    // Tampilkan semua jika sedikit
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > WINDOW + 2) pages.push('ellipsis-left');
    for (
      let i = Math.max(2, page - WINDOW);
      i <= Math.min(totalPages - 1, page + WINDOW);
      i++
    ) {
      pages.push(i);
    }
    if (page < totalPages - WINDOW - 1) pages.push('ellipsis-right');
    pages.push(totalPages);
  }

  return (
    <div className={styles.pagination}>
      <span className={styles.paginationInfo}>
        {start}–{end} dari {totalItems} unit
      </span>
      <div className={styles.paginationBtns}>
        {/* Tombol Prev */}
        <button
          className={styles.pageBtn}
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft size={14} />
        </button>

        {/* Nomor halaman */}
        {pages.map((p, idx) => {
          if (p === 'ellipsis-left' || p === 'ellipsis-right') {
            return (
              <span
                key={p}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 4px',
                  color: 'var(--brand-space-grey)',
                  fontSize: '0.85rem',
                }}
              >
                ...
              </span>
            );
          }
          return (
            <button
              key={`page-${p}`}
              className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ''}`}
              onClick={() => onPage(p)}
              aria-label={`Halaman ${p}`}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          );
        })}

        {/* Tombol Next */}
        <button
          className={styles.pageBtn}
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          aria-label="Halaman berikutnya"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

export default function ClientFleet() {
  const router = useRouter();
  const [fleet, setFleet]       = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cityFilter, setCityFilter]     = useState('');
  const [page, setPage]                 = useState(1);

  const fetchFleet = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await unitApi.findMyFleet();
      setFleet(data || []);
    } catch {
      setError('Gagal memuat data fleet. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFleet(); }, [fetchFleet]);

  // Filter client-side
  const filtered = fleet.filter(u => {
    const q = search.toLowerCase();
    const matchSearch =
      u.serial_number?.toLowerCase().includes(q) ||
      u.model_name?.toLowerCase().includes(q) ||
      u.current_client?.city?.toLowerCase().includes(q) ||
      u.specs?.city?.toLowerCase().includes(q) ||
      u.outlet_branch?.toLowerCase().includes(q);
    const matchStatus = statusFilter === '' || u.status?.toUpperCase() === statusFilter;
    
    // Determine city
    const unitCity = u.city || u.specs?.city || u.current_client?.city || '';
    const matchCity = cityFilter === '' || unitCity.toLowerCase() === cityFilter.toLowerCase();

    return matchSearch && matchStatus && matchCity;
  });

  // Unique cities for filter
  const uniqueCities = Array.from(new Set(fleet.map(u => u.city || u.specs?.city || u.current_client?.city || '').filter(Boolean))).sort();

  // Hitung per-status untuk chips
  const countActive      = fleet.filter(u => u.status?.toUpperCase() === 'ACTIVE').length;
  const countMaintenance = fleet.filter(u => u.status?.toUpperCase() === 'MAINTENANCE').length;
  const countInactive    = fleet.filter(u => !u.status || u.status?.toUpperCase() === 'INACTIVE').length;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSearch = (val: string) => { setSearch(val); setPage(1); };
  const handleStatus = (val: string) => { setStatusFilter(val); setPage(1); };

  return (
    <div>
      <button
        className={styles.pageBackBtn}
        onClick={() => router.push('/client-portal/dashboard')}
      >
        <ArrowLeft size={15} /> Beranda
      </button>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Fleet Saya</h1>
        <p className={styles.pageDescription}>
          Kelola dan pantau seluruh unit mesin di semua lokasi Anda.
        </p>
      </div>

      {/* Card utama — full width */}
      <div className={styles.card} style={{ width: '100%' }}>

        {/* Search Bar */}
        <div className={styles.searchBar}>
          <div className={styles.searchInputWrapper} style={{ maxWidth: 420 }}>
            <Search size={15} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Cari serial number, model, atau alamat..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
            />
          </div>
          
          <select 
            value={cityFilter}
            onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
            className={styles.filterSelect}
          >
            <option value="">Semua Kota</option>
            {uniqueCities.map(city => (
              <option key={city as string} value={city as string}>{city as string}</option>
            ))}
          </select>

          <div className={styles.filterChips}>
            <button
              className={`${styles.filterChip} ${statusFilter === '' ? styles.filterChipActive : ''}`}
              onClick={() => handleStatus('')}
            >
              Semua ({fleet.length})
            </button>
            <button
              className={`${styles.filterChip} ${statusFilter === 'ACTIVE' ? styles.filterChipActive : ''}`}
              onClick={() => handleStatus('ACTIVE')}
            >
              Aktif ({countActive})
            </button>
            <button
              className={`${styles.filterChip} ${statusFilter === 'MAINTENANCE' ? styles.filterChipActive : ''}`}
              onClick={() => handleStatus('MAINTENANCE')}
            >
              Dalam Perawatan ({countMaintenance})
            </button>
            {countInactive > 0 && (
              <button
                className={`${styles.filterChip} ${statusFilter === 'INACTIVE' ? styles.filterChipActive : ''}`}
                onClick={() => handleStatus('INACTIVE')}
              >
                Tidak Aktif ({countInactive})
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: '32px', textAlign: 'center' }}>
            <p style={{ color: 'var(--brand-safety-orange)', marginBottom: 12, fontFamily: 'var(--font-body)' }}>
              {error}
            </p>
            <button className={styles.btnSecondary} onClick={fetchFleet}>
              <RefreshCw size={14} /> Coba Lagi
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && !error && (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--brand-space-grey)', fontFamily: 'var(--font-body)' }}>
            Memuat data fleet...
          </div>
        )}

        {/* Tabel */}
        {!loading && !error && (
          <>
            {paginated.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyStateIcon}><Package size={28} /></div>
                <div className={styles.emptyStateTitle}>Tidak ada unit ditemukan</div>
                <div className={styles.emptyStateDesc}>
                  {search
                    ? 'Coba kata kunci yang berbeda.'
                    : 'Belum ada unit terdaftar atas nama perusahaan Anda.'}
                </div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Serial Number</th>
                      <th>Model</th>
                      <th>Lokasi</th>
                      <th>Kota</th>
                      <th>Garansi Habis</th>
                      <th>Servis Terakhir</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map(unit => {
                      const lastService = getLastServiceDate(unit);
                      const warrantyExp = unit.warranty_expiry;
                      const today = new Date();
                      const in30 = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
                      const isWarrantyExpiring = warrantyExp && new Date(warrantyExp) > today && new Date(warrantyExp) <= in30;
                      const isWarrantyExpired  = warrantyExp && new Date(warrantyExp) <= today;

                      return (
                        <tr key={unit.id}>
                          <td data-label="Serial Number">
                            <Link
                              href={`/client-portal/units/${encodeURIComponent(unit.id)}`}
                              style={{
                                fontWeight: 700,
                                color: 'var(--brand-cobalt-blue)',
                                fontFamily: 'var(--font-heading)',
                                textDecoration: 'none',
                              }}>
                              {unit.serial_number}
                            </Link>
                          </td>
                          <td data-label="Model">{unit.model_name || '-'}</td>
                          <td data-label="Lokasi" style={{ color: 'var(--brand-space-grey)', fontSize: '0.8rem', maxWidth: '250px', whiteSpace: 'normal', lineHeight: '1.4' }}>
                            {unit.outlet_branch || unit.current_client?.address || '-'}
                          </td>
                          <td data-label="Kota" style={{ color: 'var(--brand-space-grey)' }}>
                            {unit.city || unit.specs?.city || unit.current_client?.city || '-'}
                          </td>
                          <td data-label="Garansi Habis">
                            {warrantyExp ? (
                              <span style={{
                                color: isWarrantyExpired ? 'var(--brand-danger)'
                                  : isWarrantyExpiring ? 'var(--brand-safety-orange)'
                                  : 'var(--brand-space-grey)',
                                fontWeight: isWarrantyExpired || isWarrantyExpiring ? 700 : 400,
                                fontSize: '0.82rem',
                              }}>
                                {new Date(warrantyExp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                {isWarrantyExpiring && ' ⚠'}
                                {isWarrantyExpired && ' ✕'}
                              </span>
                            ) : <span style={{ color: 'var(--brand-space-grey)' }}>-</span>}
                          </td>
                          <td data-label="Servis Terakhir">
                            {lastService ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--brand-space-grey)', fontSize: '0.82rem' }}>
                                <Wrench size={12} style={{ flexShrink: 0 }} />
                                {new Date(lastService).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--brand-space-grey)', fontSize: '0.78rem', fontStyle: 'italic' }}>Belum ada</span>
                            )}
                          </td>
                          <td data-label="Status">
                            <StatusBadge status={unit.status} />
                          </td>
                          <td data-label="Aksi" style={{ textAlign: 'right' }}>
                            <Link
                              href={`/client-portal/units/${encodeURIComponent(unit.id)}`}
                              className={styles.cardAction}
                              style={{ gap: 4 }}
                            >
                              Lihat <Eye size={13} />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination — komponen terpisah, bebas bug key */}
            <Pagination
              page={safePage}
              totalPages={totalPages}
              totalItems={filtered.length}
              onPage={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
