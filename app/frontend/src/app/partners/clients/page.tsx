"use client";

import { useState, useEffect } from 'react';
import { Search, Plus, Edit3, Trash2 } from 'lucide-react';
import styles from '../partners.module.css';
import { CustomSelect } from '../../../components/ui/CustomSelect';

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      setError('');
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/clients?limit=200`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error('Gagal memuat data');
        const data = await res.json();
        setClients(Array.isArray(data) ? data : data.data || []);
      } catch {
        setError('Gagal memuat data klien. Periksa koneksi ke server.');
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  const filtered = clients.filter(c =>
    !search ||
    c.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.bp_code?.toLowerCase().includes(search.toLowerCase()) ||
    c.city?.toLowerCase().includes(search.toLowerCase())
  );

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
              Total: <strong>{filtered.length}</strong> klien
            </div>
          </div>

          <div className="dtToolbarRight">
            <div className="dtToolbarSearch">
              <input
                type="text"
                placeholder="Cari nama klien atau BP Code..."
                className="dtToolbarSearchInput"
                value={search}
                onChange={e => setSearch(e.target.value)}
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
                <tr><td colSpan={6} className={styles.loadingCell}>Memuat data klien...</td></tr>
              ) : error ? (
                <tr><td colSpan={6} className={styles.loadingCell} style={{ color: '#E11D48' }}>{error}</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className={styles.loadingCell}>Tidak ada klien ditemukan.</td></tr>
              ) : (
                filtered.map((client) => (
                  <tr key={client.id} className={styles.dataRow}>
                    <td><span className={styles.partnerName}>{client.company_name || client.name || '—'}</span></td>
                    <td>{client.bp_code || client.bpCode || '—'}</td>
                    <td>{client.city || '—'}</td>
                    <td>{client.email || '—'}</td>
                    <td><span className={styles.slaScore}>{client.units?.length ?? client.unit_count ?? '—'} Unit</span></td>
                    <td>
                      <div className={styles.actions}>
                        <button className={styles.actionIconBtn} title="Edit Klien"><Edit3 size={16} /></button>
                        <button className={`${styles.actionIconBtn} ${styles.actionIconBtnDanger}`} title="Hapus Klien"><Trash2 size={16} /></button>
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
