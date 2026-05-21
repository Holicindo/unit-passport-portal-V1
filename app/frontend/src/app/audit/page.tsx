"use client";

import { useState, useEffect } from 'react';
import { Database, Search, Filter, ShieldAlert, CheckCircle2 } from 'lucide-react';
import styles from './audit.module.css';

import { CustomSelect } from '../../components/ui/CustomSelect';

export default function AuditTrailPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data for UI presentation - In real app, fetch from backend API
  useEffect(() => {
    setTimeout(() => {
      setLogs([
        { id: 1, action: 'CREATE_USER', user: 'Super Admin', details: 'Dibuat pengguna baru: Teknisi Budi', timestamp: '2026-05-21 14:30', status: 'SUCCESS' },
        { id: 2, action: 'DELETE_UNIT', user: 'Admin Gudang', details: 'Menghapus unit SN: HOLI-1234', timestamp: '2026-05-21 13:15', status: 'WARNING' },
        { id: 3, action: 'UPDATE_ROLE', user: 'Super Admin', details: 'Role diubah untuk: Klien PT ABC', timestamp: '2026-05-21 10:05', status: 'SUCCESS' },
        { id: 4, action: 'FAILED_LOGIN', user: 'Unknown', details: 'Percobaan login gagal (IP: 192.168.1.5)', timestamp: '2026-05-20 23:45', status: 'DANGER' },
        { id: 5, action: 'TRANSFER_UNIT', user: 'Admin Gudang', details: 'Transfer Unit HOLI-999 ke PT Sejahtera', timestamp: '2026-05-20 16:20', status: 'SUCCESS' },
      ]);
      setLoading(false);
    }, 800);
  }, []);

  return (
    <div className={styles.container}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Aktivitas Log</h1>
          <p className={styles.subtitle}>Log aktivitas dan keamanan sistem (Hanya Super Admin)</p>
        </div>
      </header>

      <div className={styles.tableCard}>
        <div className="dtToolbar">
          <div className="dtToolbarLeft">
            <div className="dtToolbarText">
              Show
              <CustomSelect
                options={[
                  { value: '15', label: '15' },
                  { value: '50', label: '50' }
                ]}
                value="15"
                onChange={() => {}}
              />
              entries
            </div>

            <CustomSelect
              options={[
                { value: '', label: 'Filter Status...' },
                { value: 'SUCCESS', label: 'Success' },
                { value: 'WARNING', label: 'Warning' },
                { value: 'DANGER', label: 'Danger' }
              ]}
              value=""
              onChange={() => {}}
              placeholder="Filter Status..."
            />
          </div>

          <div className="dtToolbarRight">
            <div className="dtToolbarSearch">
              <input 
                type="text" 
                placeholder="Cari log (User, Aksi, Detail)..."
                className="dtToolbarSearchInput"
              />
              <Search size={16} className="dtToolbarSearchIcon" />
            </div>
            <button className="dtToolbarCreateBtn">
              <Filter size={16} strokeWidth={2.5} />
              Filter Log
            </button>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Waktu (Timestamp)</th>
                <th>Pengguna</th>
                <th>Aksi / Modul</th>
                <th>Detail Aktivitas</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className={styles.loadingCell}>Memuat log sistem...</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className={styles.dataRow}>
                    <td className={styles.timestampCol}>{log.timestamp}</td>
                    <td className={styles.userCol}>{log.user}</td>
                    <td>{log.action}</td>
                    <td className={styles.detailsCol}>{log.details}</td>
                    <td>
                      {log.status === 'SUCCESS' && <span className={`${styles.statusBadge} ${styles.badgeSuccess}`}><CheckCircle2 size={12}/> Sukses</span>}
                      {log.status === 'WARNING' && <span className={`${styles.statusBadge} ${styles.badgeWarning}`}><ShieldAlert size={12}/> Warning</span>}
                      {log.status === 'DANGER' && <span className={`${styles.statusBadge} ${styles.badgeDanger}`}><ShieldAlert size={12}/> Danger</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
