'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2, AlertTriangle, Users, Wrench, ChevronRight, HelpCircle, Activity } from 'lucide-react';
import Link from 'next/link';
import { iotApi } from '@/lib/api';

export default function IotAlertsAndAnalyticsWidget({ activeClients }: { activeClients: any[] }) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const { data } = await iotApi.getActiveAlerts();
        setAlerts(data || []);
      } catch {
        setAlerts([]);
      } finally {
        setLoadingAlerts(false);
      }
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
      gap: '20px',
      marginBottom: '20px',
    }}>
      {/* LEFT CARD: TELEMETRI IOT & ALERTING OTOMATIS */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e0e4ea',
        padding: '20px',
        boxShadow: '0 4px 20px rgba(0, 31, 63, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}>
        <div>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                background: alerts.length > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                color: alerts.length > 0 ? '#EF4444' : '#10B981',
                padding: '8px',
                borderRadius: '10px',
                display: 'flex',
              }}>
                {alerts.length > 0 ? <ShieldAlert size={18} /> : <CheckCircle2 size={18} />}
              </div>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Telemetri IoT & Peringatan Otomatis
                </h3>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  {loadingAlerts
                    ? 'Memeriksa sensor...'
                    : alerts.length > 0
                    ? `${alerts.length} Peringatan Terdeteksi di Kabinet`
                    : 'Seluruh sensor telemetri kabinet beroperasi normal'}
                </span>
              </div>
            </div>
            {alerts.length > 0 && (
              <span style={{
                background: '#FEF2F2',
                color: '#DC2626',
                border: '1px solid #FCA5A5',
                fontSize: '10px',
                fontWeight: 800,
                padding: '3px 9px',
                borderRadius: '12px',
                letterSpacing: '0.04em',
              }}>
                {alerts.length} AKTIF
              </span>
            )}
          </div>

          {/* Alert List Container */}
          {alerts.length === 0 ? (
            <div style={{
              background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
              border: '1px solid #BBF7D0',
              borderRadius: '12px',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#166534',
              fontSize: '12px',
              fontWeight: 600,
            }}>
              <CheckCircle2 size={18} style={{ color: '#16A34A', flexShrink: 0 }} />
              <span>Suhu kabinet, status pintu, dan tegangan listrik terpantau 100% normal.</span>
            </div>
          ) : (
            <div style={{
              maxHeight: '160px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              paddingRight: '4px',
            }}>
              {alerts.map((alt) => {
                const isDoor = alt.type === 'DOOR_OPEN';
                const statusText = isDoor ? 'Door Open' : alt.value;

                return (
                  <div
                    key={alt.id}
                    style={{
                      background: alt.severity === 'CRITICAL' ? '#FEF2F2' : '#FFFBEB',
                      border: alt.severity === 'CRITICAL' ? '1px solid #FCA5A5' : '1px solid #FDE68A',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                      <AlertTriangle size={16} style={{ color: alt.severity === 'CRITICAL' ? '#DC2626' : '#D97706', flexShrink: 0 }} />
                      <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A' }}>
                          SN: {alt.serial_number}
                          <span style={{ fontSize: '11px', fontWeight: 600, color: '#475569', marginLeft: '6px' }}>
                            {alt.title}
                          </span>
                        </div>
                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '1px' }}>
                          Sensor Status: <strong style={{ color: '#DC2626' }}>{statusText}</strong>
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/id/${alt.serial_number}`}
                      title="Buka halaman informasi lengkap dan data sensor unit"
                      style={{
                        background: alt.severity === 'CRITICAL' ? '#DC2626' : '#D97706',
                        color: '#ffffff',
                        padding: '5px 12px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 800,
                        textDecoration: 'none',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      }}
                    >
                      Detail Unit <ChevronRight size={12} />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT CARD: KINERJA SLA JARINGAN MITRA & KLIEN UTAMA */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e0e4ea',
        padding: '20px',
        boxShadow: '0 4px 20px rgba(0, 31, 63, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
      }}>
        {/* Header SLA + Tooltip */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wrench size={16} style={{ color: '#10B981' }} />
              <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Kinerja SLA Jaringan Mitra
              </h4>
              <div
                style={{ position: 'relative', cursor: 'pointer', display: 'flex' }}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <HelpCircle size={14} style={{ color: '#94A3B8' }} />
                {showTooltip && (
                  <div style={{
                    position: 'absolute',
                    top: '22px',
                    left: '-20px',
                    width: '240px',
                    background: '#0F172A',
                    color: '#ffffff',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '10px',
                    lineHeight: 1.5,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    zIndex: 50,
                  }}>
                    <strong>Penjelasan Metrik SLA Mitra:</strong><br />
                    • <strong>Rata-rata Respon:</strong> Waktu sejak tiket dibuat hingga mitra memproses (*IN PROGRESS*).<br />
                    • <strong>Penyelesaian Servis:</strong> Total waktu hingga perbaikan selesai (*COMPLETED*). Target SLA: &lt; 48 jam.
                  </div>
                )}
              </div>
            </div>
            <span style={{
              padding: '3px 9px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#10B981',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              fontSize: '11px',
              fontWeight: 800,
            }}>
              94.2% Optimal
            </span>
          </div>

          {/* Mini SLA Progress Graphic */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>
              <span>Capaian SLA Tepat Waktu</span>
              <span>94.2% (Target 90%)</span>
            </div>
            <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: '94.2%', height: '100%', background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)', borderRadius: '3px' }} />
            </div>
          </div>

          {/* Respon & Penyelesaian Box */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            marginBottom: '14px',
          }}>
            <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, marginBottom: '2px' }}>Rata-rata Respon</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#2E5BFF' }}>~ 2.4 Jam</div>
              <span style={{ fontSize: '9px', color: '#94A3B8' }}>Target: &lt; 4 Jam</span>
            </div>
            <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, marginBottom: '2px' }}>Penyelesaian Servis</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>~ 18.5 Jam</div>
              <span style={{ fontSize: '9px', color: '#94A3B8' }}>Target: &lt; 48 Jam</span>
            </div>
          </div>
        </div>

        {/* Bottom: Klien Utama Terdaftar */}
        <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Users size={14} style={{ color: '#2E5BFF' }} />
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569' }}>Klien Utama Terdaftar</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {activeClients && activeClients.length > 0 ? (
              activeClients.slice(0, 3).map((c: any, idx: number) => (
                <div key={idx} style={{
                  background: '#F1F5F9',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#334155',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}>
                  <span>{c.clientName || c.company_name || 'Klien'}</span>
                  <span style={{ color: '#2E5BFF', fontWeight: 800 }}>({c.unitCount || 1} Unit)</span>
                </div>
              ))
            ) : (
              <span style={{ fontSize: '10px', color: '#94A3B8' }}>Holicindo Enterprise Partners</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
