"use client";

import { useState, useEffect } from 'react';
import { Search, Plus, Edit3, Trash2, Upload } from 'lucide-react';
import styles from '../partners.module.css';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import ClientFormModal from './components/ClientFormModal';
import ClientsBulkUploadModal from './components/ClientsBulkUploadModal';
import { clientApi } from '@/lib/api';
import {
  overlayStyle,
  modalStyle,
  modalTitleStyle,
  modalFooterStyle,
  cancelBtnStyle,
  saveBtnStyle,
} from '../modalStyles';

const emptyForm = { company_name: '', bp_code: '', city: '', email: '', total_unit: '0' };

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchClients = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await clientApi.findAll(200);
      const data = res.data;
      setClients(Array.isArray(data) ? data : data.data || []);
    } catch {
      setError('Gagal memuat data klien. Periksa koneksi ke server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const filtered = clients.filter(c =>
    !search ||
    c.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.bp_code?.toLowerCase().includes(search.toLowerCase()) ||
    c.city?.toLowerCase().includes(search.toLowerCase())
  );

  const openAddModal = () => {
    setForm(emptyForm);
    setShowAddModal(true);
  };

  const handleAdd = async () => {
    if (!form.company_name.trim()) return;
    setSaving(true);
    try {
      const { total_unit, ...payload } = form;
      await clientApi.create({ ...payload, unit_count: parseInt(total_unit) || 0 });
      setShowAddModal(false);
      fetchClients();
    } catch {
      alert('Gagal menambah klien. Coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (client: any) => {
    setEditTarget(client);
    setForm({
      company_name: client.company_name || client.name || '',
      bp_code: client.bp_code || client.bpCode || '',
      city: client.city || '',
      email: client.email || '',
      total_unit: String(client.units?.length ?? client.unit_count ?? 0)
    });
  };

  const handleEdit = async () => {
    if (!editTarget || !form.company_name.trim()) return;
    setSaving(true);
    try {
      const { total_unit, ...payload } = form;
      await clientApi.update(editTarget.id, { ...payload, unit_count: parseInt(total_unit) || 0 });
      setEditTarget(null);
      fetchClients();
    } catch {
      alert('Gagal menyimpan perubahan. Coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await clientApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      fetchClients();
    } catch {
      alert('Gagal menghapus klien. Coba lagi.');
    } finally {
      setDeleting(false);
    }
  };

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
            <button className="dtToolbarCreateBtn" onClick={() => setBulkModalOpen(true)} style={{ background: '#001F3F', marginRight: '8px' }}>
              <Upload size={15} strokeWidth={2.5} /> Bulk Upload
            </button>
            <button className="dtToolbarCreateBtn" onClick={openAddModal}>
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
                        <button className={styles.actionIconBtn} title="Edit Klien" onClick={() => openEditModal(client)}><Edit3 size={16} /></button>
                        <button className={`${styles.actionIconBtn} ${styles.actionIconBtnDanger}`} title="Hapus Klien" onClick={() => setDeleteTarget(client)}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <ClientFormModal
          title="Tambah Klien Baru"
          form={form}
          setForm={setForm}
          saving={saving}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAdd}
          submitLabel="Simpan"
        />
      )}

      {editTarget && (
        <ClientFormModal
          title="Edit Klien"
          form={form}
          setForm={setForm}
          saving={saving}
          onClose={() => setEditTarget(null)}
          onSubmit={handleEdit}
          submitLabel="Simpan Perubahan"
        />
      )}

      {deleteTarget && (
        <div style={overlayStyle} onClick={() => setDeleteTarget(null)}>
          <div style={{ ...modalStyle, maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ ...modalTitleStyle, color: '#E11D48' }}>Hapus Klien</h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--color-deep-navy)', lineHeight: 1.6 }}>
              Yakin ingin menghapus <strong>{deleteTarget.company_name || deleteTarget.name}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div style={modalFooterStyle}>
              <button style={cancelBtnStyle} onClick={() => setDeleteTarget(null)} disabled={deleting}>Batal</button>
              <button style={{ ...saveBtnStyle, background: '#E11D48' }} onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ClientsBulkUploadModal
        open={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        onSuccess={fetchClients}
      />
    </div>
  );
}
