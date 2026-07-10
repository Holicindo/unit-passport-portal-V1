'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { unitApi } from '@/lib/api';
import { ShieldCheck, ShieldAlert, AlertTriangle, ChevronRight, ChevronLeft, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import styles from '../ClientPortal.module.css';

const PAGE_SIZE = 10;

// ── Komponen Pagination dengan ellipsis — tidak tampil semua halaman ──
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

  // Bangun daftar halaman: selalu tampilkan 1, halaman sekitar current, dan last
  const pages: (number | 'el-left' | 'el-right')[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 4) pages.push('el-left');
    for (let i = Math.max(2, page - 2); i <= Math.min(totalPages - 1, page + 2); i++) {
      pages.push(i);
    }
    if (page < totalPages - 3) pages.push('el-right');
    pages.push(totalPages);
  }

  return (
    <div className={styles.pagination}>
      <span className={styles.paginationInfo}>
        {start}–{end} dari {totalItems} unit
      </span>
      <div className={styles.paginationBtns}>
        <button
          className={styles.pageBtn}
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          aria-label="Sebelumnya"
        >
          <ChevronLeft size={14} />
        </button>

        {pages.map((p) => {
          if (p === 'el-left' || p === 'el-right') {
            return (
              <span
                key={p}
                style={{
                  display: 'flex', alignItems: 'center',
                  padding: '0 6px', color: 'var(--brand-space-grey)',
                  fontSize: '0.85rem', userSelect: 'none',
                }}
              >
                ...
              </span>
            );
          }
          return (
            <button
              key={`pg-${p}`}
              className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ''}`}
              onClick={() => onPage(p)}
              aria-label={`Halaman ${p}`}
            >
              {p}
            </button>
          );
        })}

        <button
          className={styles.pageBtn}
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          aria-label="Berikutnya"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

function WarrantyBadge({ expiry }: { expiry: string | null }) {
  if (!expiry) return <span className={styles.badgeInactive}>Tidak Ada Data</span>;
  const today = new Date();
  const exp   = new Date(expiry);
  const in30  = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  if (exp < today)  return <span className={styles.badgeExpired}>Habis</span>;
  if (exp <= in30)  return <span className={styles.badgeMaintenance}>Segera Habis</span>;
  return <span className={styles.badgeActive}>Aktif</span>;
}

export default function ClientWarranty() {
  const router = useRouter();
  const [fleet, setFleet]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);

  useEffect(() => {
    unitApi.findMyFleet()
      .then(({ data }) => setFleet(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const today = new Date();
  const in30  = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  const activeCount   = fleet.filter(u => u.warranty_expiry && new Date(u.warranty_expiry) > in30).length;
  const expiringCount = fleet.filter(u => {
    if (!u.warranty_expiry) return false;
    const e = new Date(u.warranty_expiry);
    return e > today && e <= in30;
  }).length;
  const expiredCount  = fleet.filter(u => !u.warranty_expiry || new Date(u.warranty_expiry) <= today).length;

  const totalPages = Math.max(1, Math.ceil(fleet.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = fleet.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div>
      <button
        className={styles.pageBackBtn}
        onClick={() => router.push('/client-portal/dashboard')}
      >
        <ArrowLeft size={15} /> Dashboard
      </button>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Status Garansi</h1>
        <p className={styles.pageDescription}>
          Pantau masa berlaku garansi seluruh unit Anda dalam satu tampilan.
        </p>
      </div>

      {/* Summary Cards */}
      <div className={styles.statsGrid} style={{ marginBottom: 24 }}>
        <div className={`${styles.statCard} ${styles.statCardGreen}`}>
          <div className={styles.statCardLabel}>Garansi Aktif</div>
          <div className={styles.statCardValue}>{activeCount}</div>
          <div className={styles.statCardFooter}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(3,86,197,0.35)', color: '#93C5FD', padding: '2px 8px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
              <ShieldCheck size={11} /> Aman
            </span>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.statCardOrange}`}>
          <div className={styles.statCardLabel}>Segera Habis</div>
          <div className={styles.statCardValue}>{expiringCount}</div>
          <div className={styles.statCardFooter}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(255,107,0,0.25)', color: '#FCA5A5', padding: '2px 8px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
              <AlertTriangle size={11} /> Dalam 30 hari
            </span>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.statCardBlue}`}>
          <div className={styles.statCardLabel}>Garansi Habis</div>
          <div className={styles.statCardValue}>{expiredCount}</div>
          <div className={styles.statCardFooter}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(239,68,68,0.25)', color: '#FCA5A5', padding: '2px 8px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
              <ShieldAlert size={11} /> Perlu perhatian
            </span>
          </div>
        </div>
      </div>

      {/* Tabel — full width */}
      <div className={styles.card} style={{ width: '100%' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--brand-space-grey)', fontFamily: 'var(--font-body)' }}>
            Memuat data garansi...
          </div>
        ) : fleet.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}><ShieldCheck size={28} /></div>
            <div className={styles.emptyStateTitle}>Tidak ada data garansi</div>
            <div className={styles.emptyStateDesc}>Belum ada unit terdaftar atas nama perusahaan Anda.</div>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Serial Number</th>
                    <th>Model</th>
                    <th>Lokasi</th>
                    <th>Tgl. Produksi</th>
                    <th>Garansi Habis</th>
                    <th>Status Garansi</th>
                    <th style={{ textAlign: 'right' }}>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(unit => (
                    <tr key={unit.id}>
                      <td data-label="Serial Number">
                        <Link 
                          href={`/client-portal/units/${unit.id}`}
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
                      <td data-label="Lokasi" style={{ color: 'var(--brand-space-grey)' }}>
                        {unit.current_client?.city || unit.specs?.city || '-'}
                      </td>
                      <td data-label="Tgl. Produksi" style={{ color: 'var(--brand-space-grey)' }}>
                        {unit.production_date
                          ? new Date(unit.production_date).toLocaleDateString('id-ID', {
                              day: 'numeric', month: 'long', year: 'numeric',
                            })
                          : '-'}
                      </td>
                      <td data-label="Garansi Habis" style={{ fontWeight: 600, color: 'var(--brand-deep-navy)' }}>
                        {unit.warranty_expiry
                          ? new Date(unit.warranty_expiry).toLocaleDateString('id-ID', {
                              day: 'numeric', month: 'long', year: 'numeric',
                            })
                          : '-'}
                      </td>
                      <td data-label="Status Garansi">
                        <WarrantyBadge expiry={unit.warranty_expiry} />
                      </td>
                      <td data-label="Detail" style={{ textAlign: 'right' }}>
                        <Link href={`/client-portal/units/${unit.id}`} className={styles.cardAction}>
                          Lihat <ChevronRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination dengan ellipsis — tidak tampil semua halaman */}
            <Pagination
              page={safePage}
              totalPages={totalPages}
              totalItems={fleet.length}
              onPage={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
