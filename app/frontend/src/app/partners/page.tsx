"use client";

import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Edit3, Trash2 } from 'lucide-react';
import styles from './partners.module.css';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { partnerApi } from '@/lib/api';

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

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Partner | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Partner | null>(null);

  // Form state (shared for add/edit)
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
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

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return partners.filter((p) => {
      const matchSearch =
        !search ||
        p.partner_name.toLowerCase().includes(search.toLowerCase()) ||
        p.city.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        !statusFilter ||
        (statusFilter === 'ACTIVE' && p.is_active) ||
        (statusFilter === 'INACTIVE' && !p.is_active);
      return matchSearch && matchStatus;
    });
  }, [partners, search, statusFilter]);

  // ── Toggle is_active ───────────────────────────────────────────────────────
  const handleToggleActive = async (partner: Partner) => {
    const newVal = !partner.is_active;
    // Optimistic update
    setPartners((prev) =>
      prev.map((p) => (p.id === partner.id ? { ...p, is_active: newVal } : p))
    );
    try {
      await partnerApi.toggleActive(partner.id, newVal);
    } catch {
      // Revert on failure
      setPartners((prev) =>
        prev.map((p) => (p.id === partner.id ? { ...p, is_active: !newVal } : p))
      );
    }
  };

  // ── Add ────────────────────────────────────────────────────────────────────
  const openAddModal = () => {
    setForm(emptyForm);
    setShowAddModal(true);
  };

  const handleAdd = async () => {
    if (!form.partner_name.trim() || !form.city.trim()) return;
    setSaving(true);
    try {
      await partnerApi.create(form);
      setShowAddModal(false);
      fetchPartners();
    } catch {
      alert('Gagal menambah mitra. Coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  // ── Edit ───────────────────────────────────────────────────────────────────
  const openEditModal = (partner: Partner) => {
    setEditTarget(partner);
    setForm({
      partner_name: partner.partner_name,
      city: partner.city,
      contact_wa: partner.contact_wa,
      is_active: partner.is_active,
    });
  };

  const handleEdit = async () => {
    if (!editTarget || !form.partner_name.trim() || !form.city.trim()) return;
    setSaving(true);
    try {
      await partnerApi.update(editTarget.id, form);
      setEditTarget(null);
      fetchPartners();
    } catch {
      alert('Gagal menyimpan perubahan. Coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await partnerApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      fetchPartners();
    } catch {
      alert('Gagal menghapus mitra. Coba lagi.');
    } finally {
      setDeleting(false);
    }
  };

  // ── Shared form fields ─────────────────────────────────────────────────────
  const renderFormFields = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label style={labelStyle}>Nama Mitra <span style={{ color: '#E11D48' }}>*</span></label>
        <input
          style={inputStyle}
          value={form.partner_name}
          onChange={(e) => setForm({ ...form, partner_name: e.target.value })}
          placeholder="Contoh: PT Teknisi Handal"
        />
      </div>
      <div>
        <label style={labelStyle}>Kota <span style={{ color: '#E11D48' }}>*</span></label>
        <input
          style={inputStyle}
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
          placeholder="Contoh: Jakarta"
        />
      </div>
      <div>
        <label style={labelStyle}>Nomor WhatsApp</label>
        <input
          style={inputStyle}
          value={form.contact_wa}
          onChange={(e) => setForm({ ...form, contact_wa: e.target.value })}
          placeholder="Contoh: 6281234567890"
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f0f0f4' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-deep-navy)' }}>Smart Routing</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-space-grey)', marginTop: '2px' }}>
            {form.is_active ? 'Routing Aktif — pesan diteruskan ke mitra ini' : 'Routing Nonaktif — fallback ke WhatsApp HQ'}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setForm({ ...form, is_active: !form.is_active })}
          style={toggleBtnStyle(form.is_active)}
          aria-label="Toggle routing aktif"
        >
          <span style={toggleKnobStyle(form.is_active)} />
        </button>
      </div>
    </div>
  );

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
              <input
                type="text"
                placeholder="Cari nama mitra atau kota..."
                className="dtToolbarSearchInput"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
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
                <tr>
                  <td colSpan={5} className={styles.loadingCell}>Memuat data mitra...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className={styles.loadingCell} style={{ color: '#E11D48' }}>{error}</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.loadingCell}>Tidak ada mitra ditemukan.</td>
                </tr>
              ) : (
                filtered.map((partner) => (
                  <tr key={partner.id} className={styles.dataRow}>
                    <td>
                      <span className={styles.partnerName}>{partner.partner_name}</span>
                    </td>
                    <td>{partner.city}</td>
                    <td>
                      {partner.contact_wa ? (
                        <a
                          href={`https://wa.me/${partner.contact_wa.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-deep-navy)', textDecoration: 'none', fontWeight: 500 }}
                        >
                          {WA_ICON}
                          {partner.contact_wa}
                        </a>
                      ) : (
                        <span style={{ color: 'var(--color-space-grey)', fontSize: '0.85rem' }}>—</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(partner)}
                          style={toggleBtnStyle(partner.is_active)}
                          aria-label={partner.is_active ? 'Nonaktifkan routing' : 'Aktifkan routing'}
                          title={partner.is_active ? 'Klik untuk nonaktifkan routing' : 'Klik untuk aktifkan routing'}
                        >
                          <span style={toggleKnobStyle(partner.is_active)} />
                        </button>
                        <span
                          className={`${styles.statusBadge} ${partner.is_active ? styles.badgeSuccess : styles.badgeWarning}`}
                          style={{ cursor: 'default' }}
                        >
                          {partner.is_active ? 'Routing Aktif' : 'Routing Nonaktif'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={styles.actionIconBtn}
                          title="Edit Mitra"
                          onClick={() => openEditModal(partner)}
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          className={`${styles.actionIconBtn} ${styles.actionIconBtnDanger}`}
                          title="Hapus Mitra"
                          onClick={() => setDeleteTarget(partner)}
                        >
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

      {/* ── Add Modal ─────────────────────────────────────────────────────── */}
      {showAddModal && (
        <div style={overlayStyle} onClick={() => setShowAddModal(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={modalTitleStyle}>Tambah Mitra Baru</h2>
            {renderFormFields()}
            <div style={modalFooterStyle}>
              <button style={cancelBtnStyle} onClick={() => setShowAddModal(false)} disabled={saving}>
                Batal
              </button>
              <button style={saveBtnStyle} onClick={handleAdd} disabled={saving || !form.partner_name.trim() || !form.city.trim()}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ────────────────────────────────────────────────────── */}
      {editTarget && (
        <div style={overlayStyle} onClick={() => setEditTarget(null)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={modalTitleStyle}>Edit Mitra</h2>
            {renderFormFields()}
            <div style={modalFooterStyle}>
              <button style={cancelBtnStyle} onClick={() => setEditTarget(null)} disabled={saving}>
                Batal
              </button>
              <button style={saveBtnStyle} onClick={handleEdit} disabled={saving || !form.partner_name.trim() || !form.city.trim()}>
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ───────────────────────────────────────────── */}
      {deleteTarget && (
        <div style={overlayStyle} onClick={() => setDeleteTarget(null)}>
          <div style={{ ...modalStyle, maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ ...modalTitleStyle, color: '#E11D48' }}>Hapus Mitra</h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--color-deep-navy)', lineHeight: 1.6 }}>
              Yakin ingin menghapus <strong>{deleteTarget.partner_name}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div style={modalFooterStyle}>
              <button style={cancelBtnStyle} onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Batal
              </button>
              <button
                style={{ ...saveBtnStyle, background: '#E11D48' }}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Inline styles for modal & toggle ────────────────────────────────────────

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '16px',
};

const modalStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: '16px',
  padding: '32px',
  width: '100%',
  maxWidth: '480px',
  boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
};

const modalTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: '1.25rem',
  fontWeight: 800,
  color: 'var(--color-deep-navy)',
  margin: 0,
};

const modalFooterStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '12px',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.82rem',
  fontWeight: 700,
  color: 'var(--color-space-grey)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '6px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '10px',
  border: '1px solid rgba(0,31,63,0.12)',
  fontSize: '0.95rem',
  fontFamily: 'var(--font-body)',
  color: 'var(--color-deep-navy)',
  background: '#fff',
  boxSizing: 'border-box',
  outline: 'none',
};

const cancelBtnStyle: React.CSSProperties = {
  padding: '10px 20px',
  borderRadius: '10px',
  border: '1px solid rgba(0,31,63,0.12)',
  background: '#f8fafc',
  color: 'var(--color-deep-navy)',
  fontWeight: 600,
  fontSize: '0.9rem',
  cursor: 'pointer',
};

const saveBtnStyle: React.CSSProperties = {
  padding: '10px 24px',
  borderRadius: '10px',
  border: 'none',
  background: 'var(--color-deep-navy)',
  color: '#fff',
  fontWeight: 700,
  fontSize: '0.9rem',
  cursor: 'pointer',
};

const toggleBtnStyle = (active: boolean): React.CSSProperties => ({
  position: 'relative',
  width: '44px',
  height: '24px',
  borderRadius: '50px',
  border: 'none',
  background: active ? '#00C48C' : '#d1d5db',
  cursor: 'pointer',
  transition: 'background 0.25s ease',
  flexShrink: 0,
  padding: 0,
});

const toggleKnobStyle = (active: boolean): React.CSSProperties => ({
  position: 'absolute',
  top: '3px',
  left: active ? '23px' : '3px',
  width: '18px',
  height: '18px',
  borderRadius: '50%',
  background: '#fff',
  boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
  transition: 'left 0.25s ease',
  display: 'block',
});
