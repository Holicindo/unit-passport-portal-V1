'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './TopBar.module.css';
import { Bell, ChevronDown, LogOut, QrCode, Menu, Wrench, Thermometer, AlertTriangle, CheckCircle2, Clock, ExternalLink } from 'lucide-react';
import QrScannerModal from './QrScannerModal';

interface TopBarProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

function formatTimeAgo(dateStr: string) {
  if (!dateStr) return '';
  const ms = new Date().getTime() - new Date(dateStr).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins} mnt lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

function getAlertIcon(title: string) {
  const t = (title || '').toLowerCase();
  if (t.includes('servis') || t.includes('request') || t.includes('permintaan')) return <Wrench size={14} style={{ color: '#2E5BFF', flexShrink: 0 }} />;
  if (t.includes('suhu') || t.includes('temp') || t.includes('iot')) return <Thermometer size={14} style={{ color: '#ef4444', flexShrink: 0 }} />;
  if (t.includes('alert') || t.includes('bahaya') || t.includes('darurat')) return <AlertTriangle size={14} style={{ color: '#f59e0b', flexShrink: 0 }} />;
  return <Bell size={14} style={{ color: '#64748b', flexShrink: 0 }} />;
}

function getAlertLink(alert: any): string | null {
  const t = (alert.title || '').toLowerCase();
  const c = (alert.content || '').toLowerCase();
  // Extract call_id or service log id from content (format: "... SN: A26... ...")
  if (t.includes('servis') || t.includes('permintaan')) {
    return '/service';
  }
  if (t.includes('iot') || t.includes('suhu') || t.includes('alert')) {
    return '/dashboard';
  }
  return null;
}

export default function TopBar({ onToggleSidebar, isSidebarOpen }: TopBarProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mailOpen, setMailOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const [alerts, setAlerts] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);

  // Refs for click-outside detection
  const profileRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const userData = localStorage.getItem('user');
      if (userData && userData !== 'undefined' && userData !== 'null') {
        setUser(JSON.parse(userData));
      }
    } catch (err) {
      console.error('Failed to parse user data in TopBar', err);
    }
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    if (!localStorage.getItem('token')) return;
    try {
      const { notificationApi } = await import('@/lib/api');
      const alertsRes = await notificationApi.getAlerts().catch(() => ({ data: [] }));
      setAlerts(alertsRes.data || []);
    } catch (e) {
      console.error('Failed to load notifications', e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Auto-refresh every 60s to catch new service requests
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('_tokenSetAt');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const markAsReadAndNavigate = async (alert: any) => {
    try {
      const { notificationApi } = await import('@/lib/api');
      await notificationApi.markAsRead(alert.id).catch(() => {});
      setAlerts(prev => prev.map(n => n.id === alert.id ? { ...n, is_read: true } : n));
    } catch (e) { /* ignore */ }

    const link = getAlertLink(alert);
    if (link) {
      setBellOpen(false);
      router.push(link);
    }
  };

  const markAllRead = async () => {
    const unread = alerts.filter(a => !a.is_read);
    try {
      const { notificationApi } = await import('@/lib/api');
      await Promise.all(unread.map(a => notificationApi.markAsRead(a.id).catch(() => {})));
      setAlerts(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (e) { /* ignore */ }
  };

  const getDisplayName = () => {
    if (!user) return 'Loading...';
    if (user.name && user.name !== 'Unknown User') return user.name;
    return user.email?.split('@')[0] || 'User';
  };

  const getRoleLabel = () => {
    if (!user) return '';
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return 'SUPER ADMIN';
    if (user.role === 'PARTNER') return 'TEKNISI MITRA';
    if (user.role === 'CLIENT') return 'KLIEN';
    if (user.role === 'MECHANIC') return 'MEKANIK';
    return user.role;
  };

  const unreadAlertsCount = alerts.filter(a => !a.is_read).length;

  return (
    <header className={styles.topBar}>
      <div className={styles.leftSection}>
        <button className={styles.toggleBtn} onClick={onToggleSidebar}>
          <Menu size={24} />
        </button>
      </div>

      <div className={styles.actions}>
        <button className={styles.topBarScanBtn} onClick={() => setIsScannerOpen(true)} title="Pindai QR Code Mesin">
          <QrCode size={16} />
          <span>Pindai QR</span>
        </button>

        {/* Notification Bell */}
        <div className={styles.iconContainer} ref={bellRef}>
          <button
            className={styles.actionBtn}
            onClick={() => { setBellOpen(!bellOpen); setMailOpen(false); setDropdownOpen(false); }}
            title="Notifikasi"
          >
            <Bell size={20} />
            {unreadAlertsCount > 0 && (
              <span className={styles.badge} style={{ background: unreadAlertsCount > 0 ? '#ef4444' : '#f59e0b' }}>
                {unreadAlertsCount > 9 ? '9+' : unreadAlertsCount}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className={styles.notificationDropdown} style={{ width: '340px' }}>
              {/* Header */}
              <div className={styles.notificationHeader} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.82rem', color: 'var(--color-deep-navy)' }}>
                  <Bell size={14} /> Notifikasi
                  {unreadAlertsCount > 0 && (
                    <span style={{ background: '#ef4444', color: '#fff', borderRadius: '20px', padding: '1px 7px', fontSize: '0.68rem', fontWeight: 800 }}>
                      {unreadAlertsCount} Baru
                    </span>
                  )}
                </span>
                {unreadAlertsCount > 0 && (
                  <button
                    onClick={markAllRead}
                    style={{ background: 'none', border: 'none', fontSize: '0.72rem', color: '#2E5BFF', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Baca Semua
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {alerts.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                    <CheckCircle2 size={28} style={{ color: '#10b981', margin: '0 auto 8px', display: 'block' }} />
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-deep-navy)' }}>Semua beres!</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-space-grey)', marginTop: '4px' }}>Belum ada notifikasi baru.</div>
                  </div>
                ) : (
                  alerts.map(alert => {
                    const link = getAlertLink(alert);
                    const isServiceRequest = (alert.title || '').toLowerCase().includes('servis');
                    return (
                      <div
                        key={alert.id}
                        className={styles.notificationItem}
                        style={{
                          background: alert.is_read ? 'transparent' : (isServiceRequest ? 'rgba(46, 91, 255, 0.04)' : 'rgba(239, 68, 68, 0.03)'),
                          borderLeft: alert.is_read ? 'none' : `3px solid ${isServiceRequest ? '#2E5BFF' : '#ef4444'}`,
                          cursor: link ? 'pointer' : 'default',
                          padding: '12px 16px',
                        }}
                        onClick={() => markAsReadAndNavigate(alert)}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                          <div style={{
                            width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                            background: isServiceRequest ? 'rgba(46, 91, 255, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {getAlertIcon(alert.title)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '4px' }}>
                              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-deep-navy)', lineHeight: 1.3 }}>
                                {alert.title || 'Notifikasi Baru'}
                              </div>
                              {!alert.is_read && (
                                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: isServiceRequest ? '#2E5BFF' : '#ef4444', flexShrink: 0, marginTop: '4px' }} />
                              )}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--color-space-grey)', marginTop: '3px', lineHeight: 1.4 }}>
                              {(alert.content || '').slice(0, 100)}{(alert.content || '').length > 100 ? '…' : ''}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '5px' }}>
                              <div style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <Clock size={10} /> {formatTimeAgo(alert.created_at)}
                              </div>
                              {link && (
                                <span style={{ fontSize: '0.68rem', color: '#2E5BFF', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  Lihat Detail <ExternalLink size={10} />
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              {alerts.length > 0 && (
                <div style={{
                  padding: '10px 16px', borderTop: '1px solid rgba(0,0,0,0.05)',
                  background: 'rgba(242,244,247,0.5)', textAlign: 'center'
                }}>
                  <button
                    onClick={() => { setBellOpen(false); router.push('/service'); }}
                    style={{
                      background: 'none', border: 'none', fontSize: '0.75rem',
                      color: '#2E5BFF', fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '4px', margin: '0 auto',
                    }}
                  >
                    Buka Log Servis <ExternalLink size={12} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.profileContainer} ref={profileRef}>
          <div className={styles.userProfile} onClick={() => { setDropdownOpen(!dropdownOpen); setMailOpen(false); setBellOpen(false); }}>
            <div className={styles.avatar}>
              <img
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(getDisplayName())}`}
                alt="User Initials Avatar"
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
              <span className={styles.userName}>{getDisplayName()}</span>
              {getRoleLabel() && <span className={styles.roleBadge}>{getRoleLabel()}</span>}
            </div>
            <ChevronDown size={14} className={styles.userArrow} />
          </div>

          {dropdownOpen && (
            <div className={styles.dropdownMenu} onClick={(e) => e.stopPropagation()}>
              <div className={styles.dropdownEmail}>
                {user?.email}
              </div>
              <button className={styles.dropdownItem} onClick={handleLogout}>
                <LogOut size={16} style={{ color: '#ef4444' }} />
                <span style={{ color: '#ef4444', fontWeight: 600 }}>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <QrScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} />
    </header>
  );
}
