"use client";

import { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit3, Trash2, MessageCircle } from 'lucide-react';
import styles from './partners.module.css';

import { CustomSelect } from '../../components/ui/CustomSelect';

export default function PartnersPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - In real app, fetch from backend API
    setTimeout(() => {
      setPartners([
        { id: 1, name: 'PT Teknisi Handal', city: 'Jakarta', coverage: 'Jabodetabek', phone: '081234567890', sla: '98%', status: 'ACTIVE' },
        { id: 2, name: 'CV Multi Servis', city: 'Surabaya', coverage: 'Jawa Timur', phone: '081298765432', sla: '95%', status: 'ACTIVE' },
        { id: 3, name: 'Bintang Teknik', city: 'Bandung', coverage: 'Jawa Barat', phone: '081255556666', sla: '92%', status: 'WARNING' },
      ]);
      setLoading(false);
    }, 800);
  }, []);

  return (
    <div className={styles.container}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Manajemen Mitra</h1>
          <p className={styles.subtitle}>Kelola daftar Service Partner resmi Holicindo</p>
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
                { value: 'ACTIVE', label: 'Aktif' },
                { value: 'WARNING', label: 'Perlu Tinjauan' }
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
                placeholder="Cari nama mitra atau kota..."
                className="dtToolbarSearchInput"
              />
              <Search size={16} className="dtToolbarSearchIcon" />
            </div>
            <button className="dtToolbarCreateBtn">
              <Plus size={16} strokeWidth={2.5} />
              Tambah Mitra Baru
            </button>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nama Mitra</th>
                <th>Wilayah Cakupan</th>
                <th>Kontak Utama</th>
                <th>SLA Score</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className={styles.loadingCell}>Memuat data mitra...</td>
                </tr>
              ) : (
                partners.map((partner) => (
                  <tr key={partner.id} className={styles.dataRow}>
                    <td>
                      <span className={styles.partnerName}>{partner.name}</span>
                    </td>
                    <td>
                      <span>{partner.coverage} ({partner.city})</span>
                    </td>
                    <td>
                      <a 
                        href={`https://wa.me/${partner.phone.replace(/\D/g, '')}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-deep-navy)', textDecoration: 'none', fontWeight: 500 }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12.013 2.00195C6.49524 2.00195 2.01297 6.48423 2.01297 12.002C2.01297 13.7661 2.47464 15.4227 3.28445 16.8521L2 21.9961L7.26189 20.7302C8.70775 21.5034 10.3129 22.002 12.013 22.002C17.5307 22.002 22.013 17.5197 22.013 12.002C22.013 6.48423 17.5307 2.00195 12.013 2.00195Z" fill="#25D366"/>
                          <path d="M17.4764 15.4227C17.2475 16.068 16.3262 16.611 15.6025 16.762C15.0116 16.8856 14.1504 16.9804 11.2334 15.7725C7.49842 14.2273 5.08488 10.4214 4.89885 10.1741C4.71283 9.92686 3.42435 8.21447 3.42435 6.44287C3.42435 4.67126 4.34563 3.80998 4.71714 3.42859C5.01428 3.12353 5.49755 2.9725 5.9255 2.9725C6.06493 2.9725 6.18576 2.97903 6.2973 2.98405C6.63189 2.99912 6.79925 3.01871 7.02237 3.55523C7.2919 4.20468 7.95171 5.81977 8.03525 5.99128C8.11879 6.16279 8.20235 6.39088 8.09081 6.61908C7.98857 6.83789 7.89565 6.95213 7.71905 7.16117C7.54245 7.37022 7.3751 7.50387 7.1985 7.73207C7.03117 7.94112 6.84514 8.16912 7.04961 8.52085C7.25407 8.86317 7.95115 10.0044 8.97356 10.9167C10.2929 12.0934 11.3616 12.4636 11.7519 12.6253C12.0491 12.7489 12.4021 12.72 12.6346 12.4727C12.9317 12.1489 13.3033 11.606 13.6841 11.0543C13.9536 10.6641 14.2882 10.6163 14.6321 10.7495C14.9851 10.8826 16.8533 11.8058 17.2253 11.9962C17.597 12.1866 17.8479 12.2816 17.9314 12.4243C18.015 12.5671 18.015 13.252 17.4764 15.4227Z" fill="white"/>
                        </svg>
                        {partner.phone}
                      </a>
                    </td>
                    <td><span className={styles.slaScore}>{partner.sla}</span></td>
                    <td>
                      <span className={`${styles.statusBadge} ${partner.status === 'ACTIVE' ? styles.badgeSuccess : styles.badgeWarning}`}>
                        {partner.status === 'ACTIVE' ? 'Aktif' : 'Perlu Tinjauan'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button className={styles.actionIconBtn} title="Edit Mitra">
                          <Edit3 size={16} />
                        </button>
                        <button className={`${styles.actionIconBtn} ${styles.actionIconBtnDanger}`} title="Hapus Mitra">
                          <Trash2 size={16} />
                        </button>
                      </div>
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
