'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User, Mail, Shield, Building, LogOut, Bell, CheckCircle2,
  Clock, ExternalLink, Wrench, Thermometer, AlertTriangle, ChevronRight
} from 'lucide-react';
import styles from './profile.module.css';

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
  if (t.includes('servis') || t.includes('request') || t.includes('permintaan')) {
    return <Wrench size={16} style={{ color: '#2E5BFF', flexShrink: 0 }} />;
  }
  if (t.includes('suhu') || t.includes('temp') || t.includes('iot')) {
    return <Thermometer size={16} style={{ color: '#ef4444', flexShrink: 0 }} />;
  }
  if (t.includes('alert') || t.includes('bahaya') || t.includes('darurat')) {
    return <AlertTriangle size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />;
  }
  return <Bell size={16} style={{ color: '#64748b', flexShrink: 0 }} />;
}

function getAlertLink(alert: any): string | null {
  const t = (alert.title || '').toLowerCase();
  if (t.includes('servis') || t.includes('permintaan')) {
    return '/service';
  }
  if (t.includes('iot') || t.includes('suhu') || t.includes('alert')) {
    return '/dashboard';
  }
  return null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications'>('profile');

  useEffect(() => {
    try {
      const userData = localStorage.getItem('user');
      if (userData && userData !== 'undefined' && userData !== 'null') {
        setUser(JSON.parse(userData));
      } else {
        router.push('/login');
      }
    } catch {
      router.push('/login');
    }
  }, [router]);

  const fetchNotifications = async () => {
    if (!localStorage.getItem('token')) return;
    try {
      setLoadingAlerts(true);
      const { notificationApi } = await import('@/lib/api');
      const alertsRes = await notificationApi.getAlerts().catch(() => ({ data: [] }));
      setAlerts(alertsRes.data || []);
    } catch (e) {
      console.error('Failed to load notifications in ProfilePage', e);
    } finally {
      setLoadingAlerts(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
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
    } catch { /* ignore */ }

    const link = getAlertLink(alert);
    if (link) {
      router.push(link);
    }
  };

  const markAllRead = async () => {
    const unread = alerts.filter(a => !a.is_read);
    try {
      const { notificationApi } = await import('@/lib/api');
      await Promise.all(unread.map(a => notificationApi.markAsRead(a.id).catch(() => {})));
      setAlerts(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch { /* ignore */ }
  };

  if (!user) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
      </div>
    );
  }

  const unreadCount = alerts.filter(a => !a.is_read).length;

  const getDisplayName = () => {
    return user.full_name || user.name || user.email?.split('@')[0] || 'User';
  };

  const getRoleLabel = () => {
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return 'SUPER ADMIN';
    if (user.role === 'PARTNER') return 'TEKNISI MITRA';
    if (user.role === 'CLIENT') return 'KLIEN ENTERPRISE';
    if (user.role === 'MECHANIC') return 'MEKANIK';
    return user.role || 'USER';
  };

  return (
    <div className={styles.container}>
      {/* Mobile-first Header Card */}
      <div className={styles.userHeroCard}>
        <div className={styles.avatarWrap}>
          <div className={styles.avatar}>
            {getDisplayName().charAt(0).toUpperCase()}
          </div>
          <span className={styles.avatarBadge} />
        </div>
        <div className={styles.userHeroInfo}>
          <h2 className={styles.userName}>{getDisplayName()}</h2>
          <span className={styles.userRoleBadge}>{getRoleLabel()}</span>
          <span className={styles.userEmailText}>{user.email}</span>
        </div>
      </div>

      {/* Pill Switcher */}
      <div className={styles.tabNav}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'profile' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <User size={16} />
          <span>Informasi Akun</span>
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'notifications' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          <Bell size={16} />
          <span>Notifikasi</span>
          {unreadCount > 0 && (
            <span className={styles.tabBadge}>{unreadCount}</span>
          )}
        </button>
      </div>

      {/* Tab 1: Profile Information */}
      {activeTab === 'profile' && (
        <div className={styles.cardSection}>
          <div className={styles.detailsList}>
            <div className={styles.detailRow}>
              <div className={styles.detailIcon}>
                <Mail size={18} />
              </div>
              <div className={styles.detailContent}>
                <span className={styles.detailLabel}>Alamat Email</span>
                <span className={styles.detailValue}>{user.email || '—'}</span>
              </div>
            </div>

            <div className={styles.detailRow}>
              <div className={styles.detailIcon}>
                <Shield size={18} />
              </div>
              <div className={styles.detailContent}>
                <span className={styles.detailLabel}>Tingkat Akses / Role</span>
                <span className={styles.detailValue}>{getRoleLabel()}</span>
              </div>
            </div>

            {user.company_name && (
              <div className={styles.detailRow}>
                <div className={styles.detailIcon}>
                  <Building size={18} />
                </div>
                <div className={styles.detailContent}>
                  <span className={styles.detailLabel}>Perusahaan / Entitas</span>
                  <span className={styles.detailValue}>{user.company_name}</span>
                </div>
              </div>
            )}
          </div>

          <button onClick={handleLogout} className={styles.logoutBtn}>
            <LogOut size={18} />
            <span>Keluar dari Akun</span>
          </button>
        </div>
      )}

      {/* Tab 2: Notifications Section (Relocated from TopBar bell) */}
      {activeTab === 'notifications' && (
        <div className={styles.cardSection}>
          <div className={styles.notifHeader}>
            <div className={styles.notifTitleWrap}>
              <h3 className={styles.notifTitle}>Kotak Notifikasi</h3>
              {unreadCount > 0 && (
                <span className={styles.notifCountBadge}>{unreadCount} Baru</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className={styles.markReadBtn}>
                Tandai Semua Dibaca
              </button>
            )}
          </div>

          <div className={styles.notifList}>
            {loadingAlerts ? (
              <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                <div className={styles.spinner} style={{ margin: '0 auto 12px' }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--color-space-grey)' }}>Memuat notifikasi...</span>
              </div>
            ) : alerts.length === 0 ? (
              <div className={styles.emptyNotifBox}>
                <CheckCircle2 size={36} style={{ color: '#10b981', margin: '0 auto 8px', display: 'block' }} />
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-deep-navy)' }}>Semua Beres!</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--color-space-grey)', marginTop: '4px' }}>
                  Tidak ada pemberitahuan atau permintaan servis baru.
                </div>
              </div>
            ) : (
              alerts.map(alert => {
                const link = getAlertLink(alert);
                const isServiceRequest = (alert.title || '').toLowerCase().includes('servis');
                return (
                  <div
                    key={alert.id}
                    className={`${styles.notifItem} ${!alert.is_read ? styles.notifItemUnread : ''}`}
                    onClick={() => markAsReadAndNavigate(alert)}
                  >
                    <div className={styles.notifIconBox} style={{
                      background: isServiceRequest ? 'rgba(46, 91, 255, 0.1)' : 'rgba(239, 68, 68, 0.1)'
                    }}>
                      {getAlertIcon(alert.title)}
                    </div>
                    <div className={styles.notifContentBox}>
                      <div className={styles.notifItemHeader}>
                        <span className={styles.notifItemTitle}>{alert.title || 'Notifikasi'}</span>
                        {!alert.is_read && <span className={styles.unreadDot} />}
                      </div>
                      <p className={styles.notifItemDesc}>
                        {alert.content || 'Tidak ada keterangan tambahan.'}
                      </p>
                      <div className={styles.notifItemFooter}>
                        <span className={styles.notifTime}>
                          <Clock size={11} /> {formatTimeAgo(alert.created_at)}
                        </span>
                        {link && (
                          <span className={styles.notifActionLink}>
                            Buka <ExternalLink size={11} />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
