'use client';

import { useState } from 'react';
import { Users, ShieldAlert, Activity, CheckCircle2, ChevronRight, X, ExternalLink } from 'lucide-react';
import { WarrantyCategories } from '../utils';
import styles from '../dashboard.module.css';

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
    <div className={styles.listCard} style={{ margin: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <h3 className={styles.listTitle} style={{ marginBottom: 0 }}>
          <ShieldAlert size={16} style={{ color: 'var(--color-safety-orange)', marginRight: '6px', verticalAlign: 'middle' }} />
          Keluhan Berulang (Sulit)
        </h3>
      </div>
      <p style={{ fontSize: '0.7rem', color: 'var(--color-space-grey)', marginBottom: '16px' }}>
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
              <div key={idx} className={styles.listItem} style={{ flexDirection: 'column', gap: '2px', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className={styles.unitName} style={{ fontWeight: 700, color: 'var(--color-deep-navy)' }}>SN: {call.sn}</span>
                  <span className={styles.unitCount} style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-safety-orange)', background: 'rgba(255,107,0,0.08)', padding: '2px 6px', borderRadius: '6px' }}>
                    {call.visits}x Kunjungan
                  </span>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--color-space-grey)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{call.issue}</span>
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
      <div className={styles.listCard} style={{ margin: 0, position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <h3 className={styles.listTitle} style={{ marginBottom: 0 }}>
            <ShieldAlert size={16} style={{ color: 'var(--color-cobalt-blue)', marginRight: '6px', verticalAlign: 'middle' }} />
            Distribusi Masalah Garansi
          </h3>
        </div>
        <p style={{ fontSize: '0.7rem', color: 'var(--color-space-grey)', marginBottom: '14px' }}>
          Klik pada kategori untuk melihat rincian kasus unit garansi.
        </p>
        <div className={styles.listItems}>
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} style={{ height: '32px', background: '#F1F5F9', borderRadius: '6px', animation: 'pulse 1.5s infinite' }}></div>
            ))
          ) : (
            [
              { key: 'Refrigeration', count: warrantyCategories.refrigeration, color: 'var(--color-cobalt-blue)' },
              { key: 'Electrical', count: warrantyCategories.electrical, color: 'var(--color-space-grey)' },
              { key: 'Glass / Physical', count: warrantyCategories.glass, color: 'var(--color-deep-navy)' },
            ].map((cat) => (
              <div
                key={cat.key}
                className={styles.listItem}
                onClick={() => handleRowClick(cat.key, cat.count)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  cursor: 'pointer', padding: '10px 12px', borderRadius: '8px',
                  transition: 'all 0.2s ease', border: '1px solid rgba(0,31,63,0.06)',
                  background: '#f8fafc',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.borderColor = 'rgba(46,91,255,0.2)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,31,63,0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.borderColor = 'rgba(0,31,63,0.06)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-deep-navy)', display: 'flex', alignItems: 'center' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: cat.color, marginRight: '8px' }}></span>
                  {cat.key}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {cat.count} Kasus
                  <ChevronRight size={14} style={{ color: 'var(--color-space-grey)', opacity: 0.7 }} />
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Detail Kasus Garansi */}
      {selectedCat && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0, 31, 63, 0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}
        onClick={() => setSelectedCat(null)}
        >
          <div style={{
            background: '#ffffff', borderRadius: '16px', maxWidth: '440px', width: '100%',
            padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', border: '1px solid rgba(0,31,63,0.1)',
            animation: 'fadeIn 0.2s ease', position: 'relative'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '12px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--color-deep-navy)' }}>
                  Klaim Garansi: {selectedCat.name}
                </h4>
                <span style={{ fontSize: '0.72rem', color: 'var(--color-space-grey)', fontWeight: 600 }}>
                  Total {selectedCat.count} kasus terdeteksi dalam garansi aktif
                </span>
              </div>
              <button
                onClick={() => setSelectedCat(null)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} style={{ color: 'var(--color-deep-navy)' }} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '260px', overflowY: 'auto', paddingRight: '4px' }}>
              {selectedCat.cases.length === 0 ? (
                <div className={styles.emptyStateBox} style={{ padding: '20px' }}>
                  <CheckCircle2 size={24} style={{ color: 'var(--color-cobalt-blue)' }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-deep-navy)' }}>Tidak Ada Kasus Aktif</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-space-grey)' }}>Kategori {selectedCat.name} tidak memiliki klaim garansi saat ini.</span>
                </div>
              ) : (
                selectedCat.cases.map((c, i) => (
                  <div key={i} style={{
                    padding: '10px 12px', background: '#f8fafc', borderRadius: '8px',
                    borderLeft: '3px solid var(--color-cobalt-blue)', fontSize: '0.75rem',
                    color: 'var(--color-deep-navy)', fontWeight: 600, lineHeight: 1.4
                  }}>
                    {c}
                  </div>
                ))
              )}
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => window.location.href = `/reports/history?category=${encodeURIComponent(selectedCat.name)}`}
                style={{
                  background: 'var(--color-cobalt-blue)', color: '#fff', border: 'none',
                  padding: '8px 16px', borderRadius: '8px', fontSize: '0.78rem',
                  fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                }}
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
    <div className={styles.listsSection}>

      {/* Klien Teraktif */}
      <div className={styles.listCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <h3 className={styles.listTitle} style={{ marginBottom: 0 }}>
            <Users size={16} style={{ color: 'var(--color-cobalt-blue)', marginRight: '6px', verticalAlign: 'middle' }} />
            Klien Teraktif
          </h3>
        </div>
        <p style={{ fontSize: '0.7rem', color: 'var(--color-space-grey)', marginBottom: '16px' }}>
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
                <span className={styles.clientName} style={{ fontWeight: 600 }}>{client.name}</span>
                <span className={styles.clientCount} style={{ background: 'rgba(46,91,255,0.06)', color: 'var(--color-cobalt-blue)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.78rem' }}>{client.count} Servis</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Permintaan Servis Baru Masuk (Real-time) */}
      <div className={styles.listCard} style={{ border: '2px solid rgba(46, 91, 255, 0.2)', background: 'linear-gradient(to bottom, #ffffff, #f8fafc)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <h3 className={styles.listTitle} style={{ marginBottom: 0, display: 'flex', alignItems: 'center', color: 'var(--color-cobalt-blue)' }}>
            <span style={{ width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%', marginRight: '8px', boxShadow: '0 0 8px #22c55e', animation: 'pulse 1.5s infinite' }}></span>
            Permintaan Servis Masuk
          </h3>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#fff', background: 'var(--color-cobalt-blue)', padding: '2px 8px', borderRadius: '12px' }}>Live</span>
        </div>
        <p style={{ fontSize: '0.7rem', color: 'var(--color-space-grey)', marginBottom: '16px' }}>
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
                <div key={idx} className={styles.listItem} style={{ flexDirection: 'column', gap: '4px', alignItems: 'stretch', borderLeft: '3px solid var(--color-cobalt-blue)', background: '#fff', padding: '10px 12px', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className={styles.unitName} style={{ fontWeight: 700, color: 'var(--color-deep-navy)', fontSize: '0.8rem' }}>{req.client}</span>
                    <span className={styles.unitCount} style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>
                      {req.timeAgo}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-space-grey)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{req.issue}</span>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#f59e0b', background: '#fef3c7', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px' }}>{req.status}</span>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>

      {/* Tiket Terbengkalai */}
      <div className={styles.listCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <h3 className={styles.listTitle} style={{ marginBottom: 0 }}>
            <Activity size={16} style={{ color: 'var(--color-safety-orange)', marginRight: '6px', verticalAlign: 'middle' }} />
            Tiket Terbengkalai {'>'} 2 Minggu
          </h3>
        </div>
        <p style={{ fontSize: '0.7rem', color: 'var(--color-space-grey)', marginBottom: '16px' }}>
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
                <div key={idx} className={styles.listItem} style={{ flexDirection: 'column', gap: '2px', alignItems: 'stretch', borderLeft: '3px solid var(--color-safety-orange)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className={styles.unitName} style={{ fontWeight: 700, color: 'var(--color-deep-navy)' }}>SN: {ticket.sn}</span>
                    <span className={styles.unitCount} style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-safety-orange)' }}>
                      {ticket.daysOpen} Hari
                    </span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-space-grey)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ticket.issue}</span>
                </div>
              ))
            )
          )}
        </div>
      </div>

    </div>
  );
}
