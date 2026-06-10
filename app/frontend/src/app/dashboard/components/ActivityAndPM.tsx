'use client';

import { Activity, Calendar, Users } from 'lucide-react';
import { ScheduleItem, PMItem } from '../utils';
import styles from '../dashboard.module.css';

/* ── Timeline Column (reusable for Hari Ini / Besok) ── */
function TimelineColumn({ title, items, loading }: { title: string; items: ScheduleItem[]; loading: boolean }) {
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '20px', paddingLeft: '8px' }}>
      <div style={{ position: 'absolute', top: '8px', bottom: '8px', left: '15px', width: '2px', background: 'rgba(0,31,63,0.06)' }} />
      <div style={{ marginLeft: '28px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-space-grey)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {title}
      </div>
      {loading ? (
        [1, 2].map(i => (
          <div key={i} style={{ height: '40px', background: '#F1F5F9', borderRadius: '6px', animation: 'pulse 1.5s infinite', marginLeft: '24px' }}></div>
        ))
      ) : (
        items.map(act => (
          <div key={act.id} style={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
            <div style={{
              position: 'absolute', left: '8px', top: '4px', width: '16px', height: '16px',
              borderRadius: '50%', background: 'white',
              border: `3px solid ${act.type === 'empty' ? 'var(--color-space-grey)' : 'var(--color-cobalt-blue)'}`,
              boxShadow: '0 0 8px rgba(46,91,255,0.2)', zIndex: 2,
            }} />
            <div style={{ marginLeft: '32px', display: 'flex', flexDirection: 'column', gap: '2px', width: '100%' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: act.type === 'empty' ? 'var(--color-space-grey)' : 'var(--color-deep-navy)' }}>
                {act.title}
              </span>
              <span style={{ fontSize: '0.74rem', color: 'var(--color-space-grey)', lineHeight: 1.35 }}>
                {act.description}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/* ── Recent Activity Section ── */
export function RecentActivity({ activities, loading }: { activities: ScheduleItem[]; loading: boolean }) {
  return (
    <div className={styles.listCard} style={{ background: 'var(--color-optic-white)' }}>
      <h3 className={styles.listTitle} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '12px', marginBottom: '16px' }}>
        <Activity size={16} style={{ color: '#00C48C', marginRight: '6px', verticalAlign: 'middle' }} />
        Aktivitas Terkini
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        <TimelineColumn title="Hari Ini" items={activities.filter(a => a.section === 'Hari Ini')} loading={loading} />
        <TimelineColumn title="Besok" items={activities.filter(a => a.section === 'Besok')} loading={loading} />
      </div>
    </div>
  );
}

/* ── Upcoming PM Section ── */
export function UpcomingPM({ pms, loading }: { pms: PMItem[]; loading: boolean }) {
  return (
    <div className={styles.listCard} style={{ background: 'var(--color-optic-white)', flex: 1, display: 'flex', flexDirection: 'column', margin: 0 }}>
      <h3 className={styles.listTitle} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '12px', marginBottom: '16px' }}>
        <Calendar size={16} style={{ color: 'var(--color-cobalt-blue)', marginRight: '6px', verticalAlign: 'middle' }} />
        Jadwal Pemeliharaan Preventif (PM) Terdekat
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', flex: 1 }}>
        {loading ? (
          [1, 2].map(i => (
            <div key={i} style={{ height: '70px', background: '#F1F5F9', borderRadius: '12px', animation: 'pulse 1.5s infinite' }}></div>
          ))
        ) : (
          pms.map(pm => (
            <div key={pm.id} style={{
              background: 'rgba(46,91,255,0.02)', border: '1px solid rgba(46,91,255,0.06)',
              borderRadius: '12px', padding: '16px 14px', display: 'flex',
              alignItems: 'center', gap: '12px', transition: 'all 0.2s', height: '100%',
            }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '10px',
                background: 'rgba(46,91,255,0.08)', color: 'var(--color-cobalt-blue)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', lineHeight: 1, flexShrink: 0,
              }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 850 }}>{pm.day}</span>
                <span style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', marginTop: '2px' }}>{pm.month}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--color-deep-navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {pm.sn}
                  </span>
                  <span style={{
                    fontSize: '0.65rem', background: 'rgba(0,196,140,0.08)', color: '#00C48C',
                    padding: '2px 8px', borderRadius: '8px', fontWeight: 800, flexShrink: 0,
                  }}>
                    {pm.relative}
                  </span>
                </div>
                <span style={{ fontSize: '0.74rem', color: 'var(--color-space-grey)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {pm.model}
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--color-space-grey)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <Users size={12} style={{ color: 'var(--color-cobalt-blue)' }} /> {pm.partner}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
