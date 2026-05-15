import styles from './TopBar.module.css';
import { Search, Mail, Bell, ChevronDown, Menu } from 'lucide-react';

interface TopBarProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export default function TopBar({ onToggleSidebar, isSidebarOpen }: TopBarProps) {
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
        <button className={styles.actionBtn}>
          <Mail size={20} />
          <span className={styles.badge}>1</span>
        </button>
        <button className={styles.actionBtn}>
          <Bell size={20} />
        </button>
        <div className={styles.userProfile}>
          <div className={styles.avatar}>
            <img src="https://i.pravatar.cc/150?u=holicindo" alt="User" />
          </div>
          <span className={styles.userName}>Admin Holicindo</span>
          <ChevronDown size={14} className={styles.userArrow} />
        </div>
      </div>
    </header>
  );
}
