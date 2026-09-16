'use client';

import { useState } from 'react';
import { Users, ShieldAlert, Activity, CheckCircle2, ChevronRight, X, ExternalLink } from 'lucide-react';
import { WarrantyCategories } from '../utils';
import styles from './RightColumn.module.css';

interface Props {
  loading: boolean;
  activeClients: { name: string; count: number }[];
  frequentCallIds: { id: string; sn: string; visits: number; issue: string }[];
  overdueCallIds: { callId: string; sn: string; daysOpen: number; issue: string }[];
  warrantyCategories: WarrantyCategories;
  newServiceRequests?: { id: string; client: string; issue: string; timeAgo: string; status: string }[];
}

export function FrequentComplaintsCard({ loading, frequentCallIds }: { loading: boolean; frequentCallIds: Props['frequentCallIds'] }) {
  return (
    <div className={styles.listCard}>
      <div className={styles.cardHeaderContainer}>
        <h3 className={`${styles.listTitle} ${styles.cardTitle}`}>
          Keluhan Berulang (Sulit)
        </h3>
      </div>
      <p className={styles.description}>
        Call ID / Komplain dikunjungi lebih dari 2 kali.
      </p>
      <div className={styles.listItems}>
        {loading ? (
          [1, 2].map(i => (
            <div key={i} style={{ height: '40px', background: '#F1F5F9', borderRadius: '6px', animation: 'pulse 1.5s infinite' }}></div>
          ))
        ) : (
          frequentCallIds.length === 0 ? (
            <div className={styles.emptyStateBox}>
              <CheckCircle2 size={20} style={{ color: 'var(--color-cobalt-blue)' }} />
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-deep-navy)' }}>Tidak ada keluhan berulang</span>
              <span style={{ fontSize: '0.68rem', color: 'var(--color-space-grey)' }}>Semua masalah selesai 1 kunjungan.</span>
            </div>
          ) : (
            frequentCallIds.map((call, idx) => (
              <div key={idx} className={`${styles.listItem} ${styles.frequentItem}`}>
                <div className={styles.frequentHeader}>
                  <span className={styles.serialNumber}>SN: {call.sn}</span>
                  <span className={styles.visitCount}>
                    {call.visits}x Kunjungan
                  </span>
                </div>
                <span className={styles.issueText}>{call.issue}</span>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}

export function WarrantyDistributionCard({ loading, warrantyCategories }: { loading: boolean; warrantyCategories: Props['warrantyCategories'] }) {
  const [selectedCat, setSelectedCat] = useState<{ name: string; count: number; cases: string[] } | null>(null);

  const mockDetails: Record<string, string[]> = {
    Refrigeration: [
      'SN: A26051860 — Masalah Pembekuan Evaporator (Sensor Evap Shift)',
      'SN: A26071976 — Suhu Condenser Tinggi / Kebocoran Freon Mikro',
    ],
    Electrical: [
      'SN: A22010228 — Trip Overload Kabel Utama Power Suppy',
      'SN: A26051860 — Fluktuasi Voltase & Relay Thermostat',
      'SN: A26071976 — Lampu LED Indikator Mati Total',
      'SN: A21099812 — MCB Panel Kontrol Sering Anjlok',
      'SN: A25100911 — Sensor Temperatur Kabel Terkelupas',
      'SN: A24081190 — Modul Controller Digital Not Responding',
    ],
    'Glass / Physical': [],
  };

  const handleRowClick = (catName: string, count: number) => {
    setSelectedCat({
      name: catName,
      count,
      cases: mockDetails[catName] || [],
    });
  };

  return (
    <>
      <div className={styles.listCard}>
        <div className={styles.cardHeaderContainer}>
          <h3 className={`${styles.listTitle} ${styles.cardTitle}`}>
            Distribusi Masalah Garansi
          </h3>
        </div>
        <p className={styles.description}>
          Klik pada kategori untuk melihat rincian kasus unit garansi.
        </p>
        <div className={styles.listItems}>
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} style={{ height: '32px', background: '#F1F5F9', borderRadius: '6px', animation: 'pulse 1.5s infinite' }}></div>
            ))
          ) : (
            [
              { key: 'Refrigeration', count: warrantyCategories.refrigeration, dot: '#4F46E5' },
              { key: 'Electrical', count: warrantyCategories.electrical, dot: '#CC5500' },
              { key: 'Glass / Physical', count: warrantyCategories.glass, dot: '#045017' },
            ].map((cat) => (
              <div
                key={cat.key}
                className={styles.warrantyRow}
                onClick={() => handleRowClick(cat.key, cat.count)}
              >
                <span className={styles.warrantyLabel}>
                  <span className={styles.warrantyDot} style={{ background: cat.dot }}></span>
                  {cat.key}
                </span>
                <span className={styles.warrantyCount}>
                  {cat.count} Kasus
                  <ChevronRight size={14} style={{ color: cat.dot, opacity: 0.7 }} />
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Detail Kasus Garansi */}
      {selectedCat && (
        <div className={styles.modalOverlay} onClick={() => setSelectedCat(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h4 className={styles.modalTitle}>
                  Klaim Garansi: {selectedCat.name}
                </h4>
                <span className={styles.modalSubtitle}>
                  Total {selectedCat.count} kasus terdeteksi dalam garansi aktif
                </span>
              </div>
              <button className={styles.closeBtn} onClick={() => setSelectedCat(null)}>
                <X size={16} style={{ color: 'var(--color-deep-navy)' }} />
              </button>
            </div>

            <div className={styles.casesList}>
              {selectedCat.cases.length === 0 ? (
                <div className={styles.emptyStateBox} style={{ padding: '20px' }}>
                  <CheckCircle2 size={24} style={{ color: 'var(--color-cobalt-blue)' }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-deep-navy)' }}>Tidak Ada Kasus Aktif</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-space-grey)' }}>Kategori {selectedCat.name} tidak memiliki klaim garansi saat ini.</span>
                </div>
              ) : (
                selectedCat.cases.map((c, i) => (
                  <div key={i} className={styles.caseItem}>
                    {c}
                  </div>
                ))
              )}
            </div>

            <div className={styles.modalActions}>
              <button
                className={styles.reportBtn}
                onClick={() => window.location.href = `/reports/history?category=${encodeURIComponent(selectedCat.name)}`}
              >
                Buka Laporan Lengkap <ExternalLink size={13} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function RightColumn({ loading, activeClients, frequentCallIds, overdueCallIds, warrantyCategories, newServiceRequests = [] }: Props) {
  return (
    <div>

      {/* Klien Teraktif */}
      <div className={styles.listCard} style={{ marginBottom: '24px' }}>
        <div className={styles.cardHeaderContainer}>
          <h3 className={`${styles.listTitle} ${styles.cardTitle}`}>
            Klien Teraktif
          </h3>
        </div>
        <p className={styles.description}>
          Berdasarkan servis dalam 12 bulan terakhir.
        </p>
        <div className={styles.listItems}>
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} style={{ height: '30px', background: '#F1F5F9', borderRadius: '6px', animation: 'pulse 1.5s infinite' }}></div>
            ))
          ) : (
            activeClients.map((client, idx) => (
              <div key={idx} className={styles.listItem}>
                <span className={`${styles.clientName} ${styles.serialNumber}`}>{client.name}</span>
                <span className={`${styles.clientCount} ${styles.clientItemBadge}`}>{client.count} Servis</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Permintaan Servis Baru Masuk (Real-time) */}
      <div className={`${styles.listCard} ${styles.liveCard}`} style={{ marginBottom: '24px' }}>
        <div className={styles.cardHeaderContainer}>
          <h3 className={`${styles.listTitle} ${styles.cardTitle}`} style={{ display: 'flex', alignItems: 'center' }}>
            <span className={styles.pulsingDot}></span>
            Permintaan Servis Masuk
          </h3>
          <span className={styles.liveBadge}>Live</span>
        </div>
        <p className={styles.description}>
          Tiket perbaikan atau komplain yang baru saja masuk.
        </p>
        <div className={styles.listItems}>
          {loading ? (
            [1, 2].map(i => (
              <div key={i} style={{ height: '45px', background: '#F1F5F9', borderRadius: '6px', animation: 'pulse 1.5s infinite' }}></div>
            ))
          ) : (
            newServiceRequests.length === 0 ? (
              <div className={styles.emptyStateBox} style={{ padding: '16px 12px' }}>
                <CheckCircle2 size={20} style={{ color: 'var(--color-cobalt-blue)' }} />
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-deep-navy)' }}>Belum ada antrean baru</span>
              </div>
            ) : (
              newServiceRequests.map((req, idx) => (
                <div key={idx} className={`${styles.listItem} ${styles.serviceRequestItem}`}>
                  <div className={styles.serviceRequestHeader}>
                    <span className={styles.clientNameBold}>{req.client}</span>
                    <span className={styles.timeAgo}>
                      {req.timeAgo}
                    </span>
                  </div>
                  <div className={styles.serviceRequestFooter}>
                    <span className={styles.serviceIssue}>{req.issue}</span>
                    <span className={styles.statusBadge} style={{
                      background: req.status === 'Baru' ? 'rgba(79,70,229,0.12)' : 'rgba(4,80,23,0.1)',
                      color: req.status === 'Baru' ? '#4F46E5' : '#045017',
                      border: req.status === 'Baru' ? '1px solid rgba(79,70,229,0.25)' : '1px solid rgba(4,80,23,0.2)',
                    }}>{req.status}</span>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>

      {/* Tiket Terbengkalai */}
      <div className={styles.listCard} style={{ marginBottom: '24px' }}>
        <div className={styles.cardHeaderContainer}>
          <h3 className={`${styles.listTitle} ${styles.cardTitle}`}>
            Tiket Terbengkalai &gt; 2 Minggu
          </h3>
        </div>
        <p className={styles.description}>
          Komplain berstatus Pending lebih dari 14 hari.
        </p>
        <div className={styles.listItems}>
          {loading ? (
            [1, 2].map(i => (
              <div key={i} style={{ height: '40px', background: '#F1F5F9', borderRadius: '6px', animation: 'pulse 1.5s infinite' }}></div>
            ))
          ) : (
            overdueCallIds.length === 0 ? (
              <div className={styles.emptyStateBox}>
                <CheckCircle2 size={20} style={{ color: 'var(--color-cobalt-blue)' }} />
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-deep-navy)' }}>Tidak ada tiket terbengkalai</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--color-space-grey)' }}>Semua tiket ditangani dalam waktu kurang dari 14 hari.</span>
              </div>
            ) : (
              overdueCallIds.map((ticket, idx) => (
                <div key={idx} className={`${styles.listItem} ${styles.overdueItem}`}>
                  <div className={styles.overdueHeader}>
                    <span className={styles.serialNumber}>SN: {ticket.sn}</span>
                    <span className={styles.daysOpen} style={{
                      color: ticket.daysOpen > 30 ? '#CC5500' : ticket.daysOpen > 20 ? '#c78006' : '#4F46E5',
                      background: ticket.daysOpen > 30 ? 'rgba(204,85,0,0.1)' : ticket.daysOpen > 20 ? 'rgba(199,128,6,0.1)' : 'rgba(79,70,229,0.1)',
                      padding: '2px 7px', borderRadius: '4px', fontSize: '0.72rem',
                    }}>
                      {ticket.daysOpen} Hari
                    </span>
                  </div>
                  <span className={styles.issueText}>{ticket.issue}</span>
                </div>
              ))
            )
          )}
        </div>
      </div>

    </div>
  );
}
