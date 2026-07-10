'use client';

import { Users, ShieldAlert, Activity, CheckCircle2 } from 'lucide-react';
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
          Tiket perbaikan atau komplain yang baru saja masuk (Otomatis refresh).
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

      {/* Keluhan Berulang */}
      <div className={styles.listCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <h3 className={styles.listTitle} style={{ marginBottom: 0 }}>
            <ShieldAlert size={16} style={{ color: 'var(--color-safety-orange)', marginRight: '6px', verticalAlign: 'middle' }} />
            Keluhan Berulang (Sulit)
          </h3>
        </div>
        <p style={{ fontSize: '0.7rem', color: 'var(--color-space-grey)', marginBottom: '16px' }}>
          Call ID / Komplain yang dikunjungi teknisi lebih dari 2 kali.
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
                <span style={{ fontSize: '0.68rem', color: 'var(--color-space-grey)' }}>Semua masalah terselesaikan dalam 1 kunjungan.</span>
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

      {/* Distribusi Masalah Garansi */}
      <div className={styles.listCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <h3 className={styles.listTitle} style={{ marginBottom: 0 }}>
            <ShieldAlert size={16} style={{ color: 'var(--color-cobalt-blue)', marginRight: '6px', verticalAlign: 'middle' }} />
            Distribusi Masalah Garansi
          </h3>
        </div>
        <p style={{ fontSize: '0.7rem', color: 'var(--color-space-grey)', marginBottom: '16px' }}>
          Berdasarkan klaim unit yang masih dalam masa garansi pabrik.
        </p>
        <div className={styles.listItems}>
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} style={{ height: '30px', background: '#F1F5F9', borderRadius: '6px', animation: 'pulse 1.5s infinite' }}></div>
            ))
          ) : (
            <>
              <div className={styles.listItem} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-deep-navy)', display: 'flex', alignItems: 'center' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-cobalt-blue)', marginRight: '8px' }}></span>
                  Refrigeration Issues
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>{warrantyCategories.refrigeration} Kasus</span>
              </div>
              <div className={styles.listItem} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-deep-navy)', display: 'flex', alignItems: 'center' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-space-grey)', marginRight: '8px' }}></span>
                  Electrical Issues
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>{warrantyCategories.electrical} Kasus</span>
              </div>
              <div className={styles.listItem} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-deep-navy)', display: 'flex', alignItems: 'center' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-deep-navy)', marginRight: '8px' }}></span>
                  Glass / Physical Issues
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>{warrantyCategories.glass} Kasus</span>
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
}
