"use client";

import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Edit3, Trash2 } from 'lucide-react';
import styles from './partners.module.css';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { partnerApi } from '@/lib/api';
import PartnerFormModal from './components/PartnerFormModal';
import {
  overlayStyle,
  modalStyle,
  modalTitleStyle,
  modalFooterStyle,
  cancelBtnStyle,
  saveBtnStyle,
  toggleBtnStyle,
  toggleKnobStyle,
} from './modalStyles';

interface Partner {
  id: string;
  partner_name: string;
  city: string;
  is_active: boolean;
  contact_wa: string;
  created_at: string;
}

const WA_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.013 2.00195C6.49524 2.00195 2.01297 6.48423 2.01297 12.002C2.01297 13.7661 2.47464 15.4227 3.28445 16.8521L2 21.9961L7.26189 20.7302C8.70775 21.5034 10.3129 22.002 12.013 22.002C17.5307 22.002 22.013 17.5197 22.013 12.002C22.013 6.48423 17.5307 2.00195 12.013 2.00195Z" fill="#25D366"/>
    <path d="M17.4764 15.4227C17.2475 16.068 16.3262 16.611 15.6025 16.762C15.0116 16.8856 14.1504 16.9804 11.2334 15.7725C7.49842 14.2273 5.08488 10.4214 4.89885 10.1741C4.71283 9.92686 3.42435 8.21447 3.42435 6.44287C3.42435 4.67126 4.34563 3.80998 4.71714 3.42859C5.01428 3.12353 5.49755 2.9725 5.9255 2.9725C6.06493 2.9725 6.18576 2.97903 6.2973 2.98405C6.63189 2.99912 6.79925 3.01871 7.02237 3.55523C7.2919 4.20468 7.95171 5.81977 8.03525 5.99128C8.11879 6.16279 8.20235 6.39088 8.09081 6.61908C7.98857 6.83789 7.89565 6.95213 7.71905 7.16117C7.54245 7.37022 7.3751 7.50387 7.1985 7.73207C7.03117 7.94112 6.84514 8.16912 7.04961 8.52085C7.25407 8.86317 7.95115 10.0044 8.97356 10.9167C10.2929 12.0934 11.3616 12.4636 11.7519 12.6253C12.0491 12.7489 12.4021 12.72 12.6346 12.4727C12.9317 12.1489 13.3033 11.606 13.6841 11.0543C13.9536 10.6641 14.2882 10.6163 14.6321 10.7495C14.9851 10.8826 16.8533 11.8058 17.2253 11.9962C17.597 12.1866 17.8479 12.2816 17.9314 12.4243C18.015 12.5671 18.015 13.252 17.4764 15.4227Z" fill="white"/>
  </svg>
);

const emptyForm = { partner_name: '', city: '', contact_wa: '', is_active: true };

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Partner | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Partner | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchPartners = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await partnerApi.findAll();
      setPartners(res.data);
    } catch {
      setError('Gagal memuat data mitra. Periksa koneksi ke server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPartners(); }, []);

  const filtered = useMemo(() => {
    return partners.filter((p) => {
      const matchSearch = !search ||
        p.partner_name.toLowerCase().includes(search.toLowerCase()) ||
        p.city.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !statusFilter ||
        (statusFilter === 'ACTIVE' && p.is_active) ||
        (statusFilter === 'INACTIVE' && !p.is_active);
      return matchSearch && matchStatus;
    });
  }, [partners, search, statusFilter]);

  const handleToggleActive = async (partner: Partner) => {
    const newVal = !partner.is_active;
    setPartners((prev) => prev.map((p) => (p.id === partner.id ? { ...p, is_active: newVal } : p)));
    try {
      await partnerApi.toggleActive(partner.id, newVal);
    } catch {
      setPartners((prev) => prev.map((p) => (p.id === partner.id ? { ...p, is_active: !newVal } : p)));
    }
  };

  const openAddModal = () => { setForm(emptyForm); setShowAddModal(true); };

  const handleAdd = async () => {
    if (!form.partner_name.trim() || !form.city.trim()) return;
    setSaving(true);
    try {
      await partnerApi.create(form);
      setShowAddModal(false);
      fetchPartners();
    } catch { alert('Gagal menambah mitra. Coba lagi.'); }
    finally { setSaving(false); }
  };

  const openEditModal = (partner: Partner) => {
    setEditTarget(partner);
    setForm({ partner_name: partner.partner_name, city: partner.city, contact_wa: partner.contact_wa, is_active: partner.is_active });
  };

  const handleEdit = async () => {
    if (!editTarget || !form.partner_name.trim() || !form.city.trim()) return;
    setSaving(true);
    try {
      await partnerApi.update(editTarget.id, form);
      setEditTarget(null);
      fetchPartners();
    } catch { alert('Gagal menyimpan perubahan. Coba lagi.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await partnerApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      fetchPartners();
    } catch { alert('Gagal menghapus mitra. Coba lagi.'); }
    finally { setDeleting(false); }
  };

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
            <CustomSelect
              options={[
                { value: '', label: 'Semua Status' },
                { value: 'ACTIVE', label: 'Routing Aktif' },
                { value: 'INACTIVE', label: 'Routing Nonaktif' },
              ]}
              value={statusFilter}
              onChange={(val: string) => setStatusFilter(val)}
              placeholder="Filter Status..."
            />
          </div>
          <div className="dtToolbarRight">
            <div className="dtToolbarSearch">
              <input type="text" placeholder="Cari nama mitra atau kota..." className="dtToolbarSearchInput" value={search} onChange={(e) => setSearch(e.target.value)} />
              <Search size={16} className="dtToolbarSearchIcon" />
            </div>
            <button className="dtToolbarCreateBtn" onClick={openAddModal}>
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
                <th>Kota</th>
                <th>Kontak WhatsApp</th>
                <th>Smart Routing</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className={styles.loadingCell}>Memuat data mitra...</td></tr>
              ) : error ? (
                <tr><td colSpan={5} className={styles.loadingCell} style={{ color: '#E11D48' }}>{error}</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className={styles.loadingCell}>Tidak ada mitra ditemukan.</td></tr>
              ) : (
                filtered.map((partner) => (
                  <tr key={partner.id} className={styles.dataRow}>
                    <td><span className={styles.partnerName}>{partner.partner_name}</span></td>
                    <td>{partner.city}</td>
                    <td>
                      {partner.contact_wa ? (
                        <a href={`https://wa.me/${partner.contact_wa.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-deep-navy)', textDecoration: 'none', fontWeight: 500 }}>
                          {WA_ICON}{partner.contact_wa}
                        </a>
                      ) : <span style={{ color: 'var(--color-space-grey)', fontSize: '0.85rem' }}>—</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button type="button" onClick={() => handleToggleActive(partner)}
                          style={toggleBtnStyle(partner.is_active)}
                          aria-label={partner.is_active ? 'Nonaktifkan routing' : 'Aktifkan routing'}
                          title={partner.is_active ? 'Klik untuk nonaktifkan routing' : 'Klik untuk aktifkan routing'}>
                          <span style={toggleKnobStyle(partner.is_active)} />
                        </button>
                        <span className={`${styles.statusBadge} ${partner.is_active ? styles.badgeSuccess : styles.badgeWarning}`} style={{ cursor: 'default' }}>
                          {partner.is_active ? 'Routing Aktif' : 'Routing Nonaktif'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button className={styles.actionIconBtn} title="Edit Mitra" onClick={() => openEditModal(partner)}><Edit3 size={16} /></button>
                        <button className={`${styles.actionIconBtn} ${styles.actionIconBtnDanger}`} title="Hapus Mitra" onClick={() => setDeleteTarget(partner)}><Trash2 size={16} /></button>
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
        <PartnerFormModal title="Tambah Mitra Baru" form={form} setForm={setForm} saving={saving}
          onClose={() => setShowAddModal(false)} onSubmit={handleAdd} submitLabel="Simpan" />
      )}

      {editTarget && (
        <PartnerFormModal title="Edit Mitra" form={form} setForm={setForm} saving={saving}
          onClose={() => setEditTarget(null)} onSubmit={handleEdit} submitLabel="Simpan Perubahan" />
      )}

      {deleteTarget && (
        <div style={overlayStyle} onClick={() => setDeleteTarget(null)}>
          <div style={{ ...modalStyle, maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ ...modalTitleStyle, color: '#E11D48' }}>Hapus Mitra</h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--color-deep-navy)', lineHeight: 1.6 }}>
              Yakin ingin menghapus <strong>{deleteTarget.partner_name}</strong>? Tindakan ini tidak dapat dibatalkan.
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
    </div>
  );
}
