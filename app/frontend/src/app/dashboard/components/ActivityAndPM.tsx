'use client';

import { useRouter } from 'next/navigation';
import { Activity, Calendar, Users, ArrowRight } from 'lucide-react';
import { ScheduleItem, PMItem } from '../utils';
import styles from '../dashboard.module.css';

const TASK_COLOR: Record<string, string> = {
  CORRECTIVE: '#0D2B5E',
  PREVENTIVE: '#0D2B5E',
  INSTALLATION: '#0D2B5E',
};
const TASK_LABEL: Record<string, string> = {
  CORRECTIVE: 'Perbaikan',
  PREVENTIVE: 'Perawatan',
  INSTALLATION: 'Instalasi',
};

/* ── Timeline Column ── */
function TimelineColumn({ title, items, loading }: { title: string; items: ScheduleItem[]; loading: boolean }) {
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '20px', paddingLeft: '8px' }}>
      <div style={{ position: 'absolute', top: '8px', bottom: '8px', left: '15px', width: '3px', background: 'rgba(79, 70, 229, 0.2)', borderRadius: '2px' }} />
      <div style={{ marginLeft: '28px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-deep-navy)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {title}
      </div>
      {loading ? (
        [1, 2].map(i => (
          <div key={i} style={{ height: '40px', background: '#F1F5F9', borderRadius: '6px', animation: 'pulse 1.5s infinite', marginLeft: '24px' }}></div>
        ))
      ) : (
        items.map(act => {
          const taskType = (act as any).taskType;
          const dotColor = act.type === 'empty' ? 'var(--color-space-grey)' : (TASK_COLOR[taskType] || 'var(--color-cobalt-blue)');
          return (
            <div key={act.id} style={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
              <div style={{
                position: 'absolute', left: '8px', top: '4px', width: '16px', height: '16px',
                borderRadius: '50%', background: '#F6F7FC', /* card surface */
                border: `3px solid ${dotColor}`,
                boxShadow: `0 0 8px ${dotColor}40`, zIndex: 2,
              }} />
              <div style={{ marginLeft: '32px', display: 'flex', flexDirection: 'column', gap: '3px', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: act.type === 'empty' ? 'var(--color-space-grey)' : 'var(--color-deep-navy)' }}>
                    {act.title}
                  </span>
                  {taskType && (
                    <span style={{
                      fontSize: '0.63rem', fontWeight: 800, padding: '1px 6px', borderRadius: '4px',
                      background: `${TASK_COLOR[taskType]}20`,
                      color: TASK_COLOR[taskType],
                    }}>
                      {TASK_LABEL[taskType] || taskType}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--color-deep-navy)', lineHeight: 1.35, opacity: 0.75 }}>
                  {act.description}
                </span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

/* ── Recent Activity Section ── */
export function RecentActivity({ activities, loading }: { activities: ScheduleItem[]; loading: boolean }) {
  const router = useRouter();
  return (
    <div className={styles.listCard}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '12px', marginBottom: '16px' }}>
        <h3 className={styles.listTitle} style={{ margin: 0 }}>
          Aktivitas Terkini
        </h3>
        <button
          onClick={() => router.push('/service/planning')}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: 'var(--color-cobalt-blue)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
        >
          Kelola Jadwal <ArrowRight size={13} />
        </button>
      </div>
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
    <div className={styles.listCard} style={{ margin: 0 }}>
      <h3 className={styles.listTitle} style={{ borderBottom: '2px solid rgba(64,79,104,0.25)', paddingBottom: '12px', marginBottom: '16px' }}>
        Jadwal Pemeliharaan Preventif (PM) Terdekat
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {loading ? (
          [1, 2].map(i => (
            <div key={i} style={{ height: '65px', background: '#F1F5F9', borderRadius: '10px', animation: 'pulse 1.5s infinite' }}></div>
          ))
        ) : (
          pms.length === 0 ? (
            <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '24px 16px', color: 'var(--color-deep-navy)', fontSize: '0.8rem', fontWeight: 600, background: 'var(--color-bg-row)', border: 'none', borderRadius: '12px' }}>
              Tidak ada jadwal PM dalam 2 minggu ke depan
            </div>
          ) : (
            pms.map(pm => {
              const isLate = pm.relative.toLowerCase().includes('lewat');
              const isToday = pm.relative.toLowerCase().includes('hari ini');
              const isSoon = pm.relative.toLowerCase().includes('besok') || pm.relative.toLowerCase().includes('lusa');

              const badgeBg = isLate
                ? 'rgba(204, 85, 0, 0.12)'
                : isToday
                  ? 'rgba(79, 70, 229, 0.12)'
                  : isSoon
                    ? 'rgba(4, 80, 23, 0.1)'
                    : 'rgba(100, 116, 139, 0.1)';
              const badgeColor = isLate
                ? '#CC5500'
                : isToday
                  ? '#4F46E5'
                  : isSoon
                    ? '#045017'
                    : 'var(--color-space-grey)';
              const badgeBorder = isLate
                ? '1px solid rgba(204, 85, 0, 0.3)'
                : isToday
                  ? '1px solid rgba(79, 70, 229, 0.25)'
                  : isSoon
                    ? '1px solid rgba(4, 80, 23, 0.2)'
                    : '1px solid rgba(100, 116, 139, 0.15)';

              return (
                <div key={pm.id} style={{
                  background: 'var(--color-card-bg)',
                  border: '1.5px solid var(--color-border)',
                  boxShadow: '-3px -3px 8px rgba(255, 255, 255, 0.7), 3px 3px 8px rgba(79, 70, 229, 0.08)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '-4px -4px 10px rgba(255,255,255,0.8), 4px 4px 14px rgba(79, 70, 229, 0.15)';
                    e.currentTarget.style.borderColor = 'rgba(79, 70, 229, 0.4)';
                    e.currentTarget.style.background = '#ECEEFF';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '-3px -3px 8px rgba(255, 255, 255, 0.7), 3px 3px 8px rgba(79, 70, 229, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(79, 70, 229, 0.15)';
                    e.currentTarget.style.background = 'var(--color-card-bg)';
                  }}
                >
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '8px',
                    background: 'rgba(79, 70, 229, 0.08)',
                    color: 'var(--color-deep-navy)',
                    border: '1px solid rgba(79, 70, 229, 0.15)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', lineHeight: 1, flexShrink: 0,
                  }}>
                    <span style={{ fontSize: '1rem', fontWeight: 800 }}>{pm.day}</span>
                    <span style={{ fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase', marginTop: '2px', letterSpacing: '0.5px' }}>{pm.month}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden', width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-deep-navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {pm.sn}
                      </span>
                      <span style={{
                        fontSize: '0.6rem', background: badgeBg, color: badgeColor,
                        padding: '2px 6px', borderRadius: '4px', fontWeight: 800, flexShrink: 0,
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                        border: badgeBorder,
                      }}>
                        {pm.relative}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-space-grey)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {pm.model}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-deep-navy)', opacity: 0.65, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
                      {pm.partner}
                    </span>
                  </div>
                </div>
              );
            })
          )
        )}
      </div>
    </div>
  );
}
