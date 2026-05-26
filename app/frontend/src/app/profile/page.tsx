'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Shield, Building, LogOut } from 'lucide-react';
import styles from './profile.module.css';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.pageHeader}>
        <div>
          <h2 className={styles.title}>Profil Pengguna</h2>
          <p className={styles.subtitle}>Informasi akun Anda di ekosistem Holicindo.</p>
        </div>
      </header>

      <div className={styles.profileCard}>
        <div className={styles.avatarSection}>
          <div className={styles.avatar}>
            {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
          </div>
          <h3 className={styles.fullName}>{user.full_name || 'User'}</h3>
          <span className={styles.roleTag}>{user.role || 'CLIENT'}</span>
        </div>

        <div className={styles.detailsSection}>
          <div className={styles.detailRow}>
            <div className={styles.detailIcon}>
              <Mail size={18} />
            </div>
            <div className={styles.detailContent}>
              <span className={styles.detailLabel}>Email</span>
              <span className={styles.detailValue}>{user.email || '—'}</span>
            </div>
          </div>

          <div className={styles.detailRow}>
            <div className={styles.detailIcon}>
              <Shield size={18} />
            </div>
            <div className={styles.detailContent}>
              <span className={styles.detailLabel}>Role Akses</span>
              <span className={styles.detailValue}>{user.role || 'CLIENT'}</span>
            </div>
          </div>

          {user.company_name && (
            <div className={styles.detailRow}>
              <div className={styles.detailIcon}>
                <Building size={18} />
              </div>
              <div className={styles.detailContent}>
                <span className={styles.detailLabel}>Perusahaan</span>
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
    </div>
  );
}
