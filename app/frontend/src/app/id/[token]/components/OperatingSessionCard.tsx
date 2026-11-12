'use client';

import React, { useMemo } from 'react';
import { Power, Clock, CheckCircle2, AlertOctagon, History } from 'lucide-react';

interface OperatingSessionCardProps {
  data: Array<{
    recorded_at: string;
    is_offline_gap?: boolean;
    [key: string]: any;
  }>;
  isLiveOffline?: boolean;
}

export default function OperatingSessionCard({ data, isLiveOffline }: OperatingSessionCardProps) {
  // Hitung sesi operasional berdasarkan timestamp data nyata
  const sessionInfo = useMemo(() => {
    // Ambil data asli yang bukan titik gap buatan
    const realPoints = data.filter(d => !d.is_offline_gap && d.recorded_at);
    if (realPoints.length === 0) return null;

    const GAP_MS = 15 * 60 * 1000; // Jeda > 15 menit tanpa data = unit mati
    let lastOffTime: Date | null = null;
    let lastOnTime: Date | null = null;

    // Scan data urut kronologis untuk menemukan transisi mati dan nyala
    for (let i = 0; i < realPoints.length - 1; i++) {
      const tCurr = new Date(realPoints[i].recorded_at).getTime();
      const tNext = new Date(realPoints[i + 1].recorded_at).getTime();

      if (tNext - tCurr > GAP_MS) {
        lastOffTime = new Date(tCurr); // Unit mati di titik ini
        lastOnTime = new Date(tNext);  // Unit nyala kembali di titik ini
      }
    }

    const latestPoint = realPoints[realPoints.length - 1];
    const latestDate = new Date(latestPoint.recorded_at);

    // Jika tidak ada jeda mati di riwayat, waktu nyala = titik pertama yang tercatat
    if (!lastOnTime && realPoints.length > 0) {
      lastOnTime = new Date(realPoints[0].recorded_at);
    }

    // Tentukan status saat ini:
    // PENTING: Gunakan latestDate (waktu data terbaru) vs sekarang,
    // tapi jika isLiveOffline diberikan secara eksplisit, prioritaskan isLiveOffline.
    const timeSinceLastDataMs = Date.now() - latestDate.getTime();
    // Jika data terbaru < 10 menit yang lalu, unit PASTI sedang menyala (tidak down)
    const isCurrentlyDown = isLiveOffline !== undefined 
      ? isLiveOffline 
      : (timeSinceLastDataMs > GAP_MS);

    if (isCurrentlyDown) {
      // Jika saat ini mati, waktu mati terakhir adalah titik data terakhir yang masuk
      lastOffTime = latestDate;
    } else {
      // Jika saat ini menyala kembali setelah sempat mati,
      // pastikan lastOnTime adalah titik awal nyala setelah jeda mati terakhir
      if (!lastOnTime || (lastOffTime && lastOnTime.getTime() < lastOffTime.getTime())) {
        lastOnTime = latestDate;
      }
    }

    // Hitung durasi:
    // - Jika SEDANG MATI: durasi mati dihitung sejak data terakhir mati s.d. sekarang
    // - Jika SEDANG MENYALA: durasi menyala dihitung sejak titik nyala sesi ini s.d. sekarang (atau latestDate)
    const activeDurationMs = isCurrentlyDown
      ? Math.max(0, Date.now() - latestDate.getTime())
      : (lastOnTime ? Math.max(0, Date.now() - lastOnTime.getTime()) : 0);

    const durHours = Math.floor(activeDurationMs / (1000 * 60 * 60));
    const durMins = Math.floor((activeDurationMs % (1000 * 60 * 60)) / (1000 * 60));

    // Jika unit baru menyala (< 1 menit / titik pertama), tampilkan 0 Menit
    let durationText = '';
    if (!isCurrentlyDown && durHours === 0 && durMins === 0) {
      durationText = '0 Menit (Baru Saja Aktif)';
    } else {
      durationText = `${durHours > 0 ? `${durHours} Jam ` : ''}${durMins} Menit`;
    }
    const formatWib = (d: Date | null) => {
      if (!d) return '—';
      return d.toLocaleTimeString('id-ID', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
      }).replace('.', ':') + ' WIB';
    };

    const formatDateWib = (d: Date | null) => {
      if (!d) return '';
      return d.toLocaleDateString('id-ID', {
        timeZone: 'Asia/Jakarta',
        day: '2-digit',
        month: 'short',
      });
    };

    return {
      isCurrentlyDown,
      lastOnTimeStr: formatWib(lastOnTime),
      lastOnDateStr: formatDateWib(lastOnTime),
      lastOffTimeStr: formatWib(lastOffTime),
      lastOffDateStr: formatDateWib(lastOffTime),
      durationText,
    };
  }, [data, isLiveOffline]);

  if (!sessionInfo) return null;

  return (
    <div style={{
      background: 'rgba(13, 35, 70, 0.75)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '13px',
      padding: '12px 16px',
      boxShadow: '-2px -2px 6px rgba(255,255,255,0.03), 3px 3px 10px rgba(0,0,0,0.4)',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '14px',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      {/* Status Sesi & Durasi */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '10px',
          background: sessionInfo.isCurrentlyDown ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
          border: `1px solid ${sessionInfo.isCurrentlyDown ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Power size={16} color={sessionInfo.isCurrentlyDown ? '#ef4444' : '#10b981'} />
        </div>
        <div>
          <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {sessionInfo.isCurrentlyDown ? 'Status Operasi Terputus' : 'Sesi Operasi Aktif'}
          </div>
          <div style={{ fontSize: '0.86rem', fontWeight: 900, color: sessionInfo.isCurrentlyDown ? '#ef4444' : '#10b981', display: 'flex', alignItems: 'center', gap: '5px' }}>
            {sessionInfo.isCurrentlyDown ? 'Akumulasi Offline Selama ' : 'Aktif Selama '}
            <span style={{ fontFamily: 'monospace', color: '#f1f5f9' }}>{sessionInfo.durationText}</span>
          </div>
        </div>
      </div>

      {/* Grid Waktu Nyala & Waktu Mati */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {/* Waktu Nyala */}
        <div style={{
          background: 'rgba(8, 18, 50, 0.85)',
          padding: '6px 12px', borderRadius: '9px',
          border: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <CheckCircle2 size={13} color="#10b981" />
          <div>
            <div style={{ fontSize: '0.55rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Waktu Nyala Terakhir
            </div>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f1f5f9', fontFamily: 'monospace' }}>
              {sessionInfo.lastOnTimeStr} {sessionInfo.lastOnDateStr && <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>({sessionInfo.lastOnDateStr})</span>}
            </div>
          </div>
        </div>

        {/* Waktu Mati */}
        <div style={{
          background: 'rgba(8, 18, 50, 0.85)',
          padding: '6px 12px', borderRadius: '9px',
          border: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <Clock size={13} color={sessionInfo.lastOffTimeStr !== '—' ? '#f59e0b' : '#64748b'} />
          <div>
            <div style={{ fontSize: '0.55rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Waktu Mati Terakhir
            </div>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: sessionInfo.lastOffTimeStr !== '—' ? '#f1f5f9' : '#64748b', fontFamily: 'monospace' }}>
              {sessionInfo.lastOffTimeStr} {sessionInfo.lastOffDateStr && <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>({sessionInfo.lastOffDateStr})</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

