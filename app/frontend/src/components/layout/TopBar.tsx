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

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
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
          <button className={styles.actionBtn} onClick={() => { setMailOpen(!mailOpen); setBellOpen(false); setDropdownOpen(false); }}>
            <Mail size={20} />
            <span className={styles.badge}>1</span>
          </button>
          {mailOpen && (
            <div className={styles.notificationDropdown}>
              <div className={styles.notificationHeader}>Pesan Masuk</div>
              <div className={styles.notificationItem}>
                <strong>Sistem</strong><br/>
                Selamat datang di Portal Armada.
              </div>
            </div>
          )}
        </div>

        <div className={styles.iconContainer}>
          <button className={styles.actionBtn} onClick={() => { setBellOpen(!bellOpen); setMailOpen(false); setDropdownOpen(false); }}>
            <Bell size={20} />
          </button>
          {bellOpen && (
            <div className={styles.notificationDropdown}>
              <div className={styles.notificationHeader}>Notifikasi Terbaru</div>
              <div className={styles.notificationItem} style={{ color: 'var(--color-space-grey)' }}>
                Belum ada notifikasi baru.
              </div>
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
