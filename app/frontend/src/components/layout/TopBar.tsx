'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './TopBar.module.css';
import { Search, Mail, Bell, ChevronDown, Menu, LogOut, QrCode } from 'lucide-react';
import QrScannerModal from './QrScannerModal';

interface TopBarProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
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

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    const fetchNotifications = async () => {
      try {
        const { notificationApi, messageApi } = await import('@/lib/api');
        const [alertsRes, convsRes] = await Promise.all([
          notificationApi.getAlerts(),
          messageApi.getConversations(),
        ]);
        setAlerts(alertsRes.data || []);
        setMessages(convsRes.data || []); // Storing conversations as 'messages' state for simplicity right now
      } catch (e) {
        console.error('Failed to load notifications', e);
      }
    };
    fetchNotifications();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const markAsRead = async (id: string, type: 'ALERT' | 'MESSAGE') => {
    try {
      const { notificationApi } = await import('@/lib/api');
      await notificationApi.markAsRead(id);
      if (type === 'ALERT') {
        setAlerts(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      } else {
        setMessages(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getDisplayName = () => {
    if (!user) return 'Loading...';
    if (user.role === 'ADMIN') return 'Admin Holicindo';
    if (user.role === 'PARTNER') return 'Teknisi Holicindo';
    if (user.role === 'CLIENT') return 'Client IPC Fleet';
    return user.email;
  };

  const getRoleLabel = () => {
    if (!user) return '';
    if (user.role === 'ADMIN') return 'SUPER ADMIN';
    if (user.role === 'PARTNER') return 'TEKNISI MITRA';
    if (user.role === 'CLIENT') return 'CLIENT OWNER';
    return user.role;
  };

  const unreadMessagesCount = 0; // TODO: Implement unread count from conversations API
  const unreadAlertsCount = alerts.filter(a => !a.is_read).length;

  return (
    <header className={styles.topBar}>
      <div className={styles.leftSection}>
        <button className={styles.toggleBtn} onClick={onToggleSidebar}>
          <Menu size={24} />
        </button>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input type="text" placeholder="Cari..." className={styles.searchInput} />
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.topBarScanBtn} onClick={() => setIsScannerOpen(true)} title="Pindai QR Code Mesin">
          <QrCode size={16} />
          <span>Pindai QR</span>
        </button>

        <div className={styles.iconContainer}>
          <button className={styles.actionBtn} onClick={() => router.push('/messages')} title="Buka Live Chat (Inbox)">
            <Mail size={20} />
            {unreadMessagesCount > 0 && <span className={styles.badge}>{unreadMessagesCount}</span>}
          </button>
        </div>

        <div className={styles.iconContainer}>
          <button className={styles.actionBtn} onClick={() => { setBellOpen(!bellOpen); setMailOpen(false); setDropdownOpen(false); }}>
            <Bell size={20} />
            {unreadAlertsCount > 0 && <span className={styles.badge} style={{ background: '#f59e0b' }}>{unreadAlertsCount}</span>}
          </button>
          {bellOpen && (
            <div className={styles.notificationDropdown}>
              <div className={styles.notificationHeader}>Notifikasi Terbaru</div>
              {alerts.length === 0 ? (
                <div className={styles.notificationItem} style={{ color: 'var(--color-space-grey)' }}>
                  Belum ada notifikasi baru.
                </div>
              ) : (
                alerts.map(alert => (
                  <div 
                    key={alert.id} 
                    className={styles.notificationItem} 
                    style={{ background: alert.is_read ? 'transparent' : '#fffbeb' }}
                    onClick={() => markAsRead(alert.id, 'ALERT')}
                  >
                    <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{alert.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-space-grey)', marginTop: '2px' }}>{alert.content}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        
        <div className={styles.profileContainer}>
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
            <div className={styles.dropdownMenu}>
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
