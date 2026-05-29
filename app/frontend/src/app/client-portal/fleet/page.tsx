'use client';

import { useState, useEffect, useCallback } from 'react';
import { unitApi } from '@/lib/api';
import Link from 'next/link';
import { Search, Eye, Package, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from '../ClientPortal.module.css';

const PAGE_SIZE = 10;
// Jumlah tombol halaman yang ditampilkan di tengah
const WINDOW = 2;

function StatusBadge({ status }: { status: string }) {
  const s = status?.toUpperCase();
  if (s === 'ACTIVE')      return <span className={styles.badgeActive}>Aktif</span>;
  if (s === 'MAINTENANCE') return <span className={styles.badgeMaintenance}>Maintenance</span>;
  return <span className={styles.badgeInactive}>{status || 'Tidak Aktif'}</span>;
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
  const [fleet, setFleet]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(1);

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
    return (
      u.serial_number?.toLowerCase().includes(q) ||
      u.model_name?.toLowerCase().includes(q) ||
      u.current_client?.city?.toLowerCase().includes(q) ||
      u.specs?.city?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  // Pastikan page tidak melebihi totalPages setelah filter berubah
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>My Fleet</h1>
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
              placeholder="Cari serial number, model, atau kota..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
            />
          </div>
          <div className={styles.filterChips}>
            <button
              className={`${styles.filterChip} ${search === '' ? styles.filterChipActive : ''}`}
              onClick={() => handleSearch('')}
            >
              Semua ({fleet.length})
            </button>
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
                      <th>Lokasi / Kota</th>
                      <th>Tgl. Produksi</th>
                      <th>Garansi Habis</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map(unit => (
                      <tr key={unit.id}>
                        <td data-label="Serial Number">
                          <Link 
                            href={`/id/${unit.qr_token || unit.id}`}
                            style={{
                              fontWeight: 700,
                              color: 'var(--brand-ocean-blue)',
                              fontFamily: 'var(--font-heading)',
                              textDecoration: 'underline',
                              textUnderlineOffset: '2px',
                            }}>
                            {unit.serial_number}
                          </Link>
                        </td>
                        <td data-label="Model">{unit.model_name || '-'}</td>
                        <td data-label="Lokasi" style={{ color: 'var(--brand-space-grey)' }}>
                          {unit.current_client?.city || unit.specs?.city || '-'}
                        </td>
                        <td data-label="Tgl. Produksi" style={{ color: 'var(--brand-space-grey)' }}>
                          {unit.production_date
                            ? new Date(unit.production_date).toLocaleDateString('id-ID', {
                                day: 'numeric', month: 'short', year: 'numeric',
                              })
                            : '-'}
                        </td>
                        <td data-label="Garansi Habis" style={{ color: 'var(--brand-space-grey)' }}>
                          {unit.warranty_expiry
                            ? new Date(unit.warranty_expiry).toLocaleDateString('id-ID', {
                                day: 'numeric', month: 'short', year: 'numeric',
                              })
                            : '-'}
                        </td>
                        <td data-label="Status">
                          <StatusBadge status={unit.status} />
                        </td>
                        <td data-label="Aksi" style={{ textAlign: 'right' }}>
                          <Link
                            href={`/client-portal/units/${unit.id}`}
                            className={styles.cardAction}
                            style={{ gap: 4 }}
                          >
                            Lihat <Eye size={13} />
                          </Link>
                        </td>
                      </tr>
                    ))}
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
