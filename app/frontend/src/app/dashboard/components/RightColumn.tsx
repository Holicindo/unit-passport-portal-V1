'use client';

import { Users, ShieldAlert, Activity } from 'lucide-react';
import { WarrantyCategories } from '../utils';
import styles from '../dashboard.module.css';

interface Props {
  loading: boolean;
  activeClients: { name: string; count: number }[];
  frequentCallIds: { id: string; sn: string; visits: number; issue: string }[];
  overdueCallIds: { callId: string; sn: string; daysOpen: number; issue: string }[];
  warrantyCategories: WarrantyCategories;
}

export default function RightColumn({ loading, activeClients, frequentCallIds, overdueCallIds, warrantyCategories }: Props) {
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
              <div style={{ fontSize: '0.75rem', color: 'var(--color-space-grey)', textAlign: 'center', padding: '16px 0' }}>
                Tidak ada keluhan berulang terdeteksi.
              </div>
            ) : (
              frequentCallIds.map((call, idx) => (
                <div key={idx} className={styles.listItem} style={{ flexDirection: 'column', gap: '2px', alignItems: 'stretch' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className={styles.unitName} style={{ fontWeight: 700, color: 'var(--color-deep-navy)' }}>SN: {call.sn}</span>
                    <span className={styles.unitCount} style={{ fontSize: '0.75rem', fontWeight: 800, color: '#E11D48', background: 'rgba(225,29,72,0.08)', padding: '2px 6px', borderRadius: '6px' }}>
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

      {/* Tiket Terbengkalai */}
      <div className={styles.listCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <h3 className={styles.listTitle} style={{ marginBottom: 0 }}>
            <Activity size={16} style={{ color: '#E11D48', marginRight: '6px', verticalAlign: 'middle' }} />
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
              <div style={{ fontSize: '0.75rem', color: 'var(--color-space-grey)', textAlign: 'center', padding: '16px 0' }}>
                Tidak ada tiket terbengkalai.
              </div>
            ) : (
              overdueCallIds.map((ticket, idx) => (
                <div key={idx} className={styles.listItem} style={{ flexDirection: 'column', gap: '2px', alignItems: 'stretch', borderLeft: '3px solid #E11D48' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className={styles.unitName} style={{ fontWeight: 700, color: 'var(--color-deep-navy)' }}>SN: {ticket.sn}</span>
                    <span className={styles.unitCount} style={{ fontSize: '0.75rem', fontWeight: 800, color: '#E11D48' }}>
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
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-deep-navy)' }}>🔵 Refrigeration Issues</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>{warrantyCategories.refrigeration} Kasus</span>
              </div>
              <div className={styles.listItem} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-deep-navy)' }}>🟡 Electrical Issues</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>{warrantyCategories.electrical} Kasus</span>
              </div>
              <div className={styles.listItem} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-deep-navy)' }}>⚪ Glass / Physical Issues</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>{warrantyCategories.glass} Kasus</span>
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
}
