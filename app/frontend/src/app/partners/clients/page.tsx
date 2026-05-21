"use client";

import { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit3, Trash2 } from 'lucide-react';
import styles from '../partners.module.css';

import { CustomSelect } from '../../../components/ui/CustomSelect';

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - In real app, fetch from backend API
    setTimeout(() => {
      setClients([
        { id: 1, name: 'PT Holicindo Cabang Utama', bpCode: 'CLI-001', city: 'Jakarta', email: 'hq@holicindo.com', units: 45, status: 'ACTIVE' },
        { id: 2, name: 'Toko Roti Sejahtera', bpCode: 'CLI-002', city: 'Bandung', email: 'sejahtera@gmail.com', units: 12, status: 'ACTIVE' },
        { id: 3, name: 'Franchise Kopi ABC', bpCode: 'CLI-003', city: 'Surabaya', email: 'admin@kopiabc.com', units: 8, status: 'ACTIVE' },
      ]);
      setLoading(false);
    }, 800);
  }, []);

  return (
    <div className={styles.container}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Manajemen Klien</h1>
          <p className={styles.subtitle}>Kelola database klien pemilik armada unit showcase</p>
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
                { value: 'INACTIVE', label: 'Tidak Aktif' }
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
                placeholder="Cari nama klien atau BP Code..."
                className="dtToolbarSearchInput"
              />
              <Search size={16} className="dtToolbarSearchIcon" />
            </div>
            <button className="dtToolbarCreateBtn">
              <Plus size={16} strokeWidth={2.5} />
              Tambah Klien Baru
            </button>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nama Klien</th>
                <th>BP Code</th>
                <th>Lokasi Pusat</th>
                <th>Kontak / Email</th>
                <th>Total Unit</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className={styles.loadingCell}>Memuat data klien...</td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id} className={styles.dataRow}>
                    <td>
                      <span className={styles.partnerName}>{client.name}</span>
                    </td>
                    <td>{client.bpCode}</td>
                    <td>
                      <span>{client.city}</span>
                    </td>
                    <td>
                      <span>{client.email}</span>
                    </td>
                    <td><span className={styles.slaScore}>{client.units} Unit</span></td>
                    <td>
                      <div className={styles.actions}>
                        <button className={styles.actionIconBtn} title="Edit Klien">
                          <Edit3 size={16} />
                        </button>
                        <button className={`${styles.actionIconBtn} ${styles.actionIconBtnDanger}`} title="Hapus Klien">
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
