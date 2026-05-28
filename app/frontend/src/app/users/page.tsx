'use client';

import React, { useState, useEffect } from 'react';
import styles from './users.module.css';
import { Plus, Search, ShieldAlert, CheckCircle2, XCircle, Edit3, Trash2, X, UserPlus, Eye, EyeOff, Users, ShieldCheck } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import StatsGrid from '@/components/dashboard/StatsGrid';
import { userApi } from '@/lib/api';

type UserRole = 'SUPER_ADMIN' | 'PARTNER' | 'MECHANIC' | 'CLIENT';
type UserStatus = 'ACTIVE' | 'SUSPENDED';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastLogin?: string;
  created_at?: string;
}

const roleLabels: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  PARTNER: 'Partner',
  MECHANIC: 'Mekanik',
  CLIENT: 'Klien',
};

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await userApi.findAll();
      setUsers(res.data || []);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);
  const [showPassword, setShowPassword] = useState(false);
  const [pageSize, setPageSize] = useState(10);

  // Form state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('CLIENT');
  const [formStatus, setFormStatus] = useState<UserStatus>('ACTIVE');
  const [formPassword, setFormPassword] = useState('');



  const openAddModal = () => {
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormRole('CLIENT');
    setFormStatus('ACTIVE');
    setFormPassword('');
    setShowPassword(false);
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormRole(user.role);
    setFormStatus(user.status);
    setFormPassword('');
    setShowPassword(false);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formName || !formEmail) return;

    try {
      if (editingUser) {
        // For edit: just update local state (no edit endpoint yet)
        setUsers(prev => prev.map(u => u.id === editingUser.id ? {
          ...u, name: formName, email: formEmail, role: formRole, status: formStatus
        } : u));
      } else {
        // For create: hit real API
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            name: formName,
            email: formEmail,
            password: formPassword || 'password123',
            role: formRole,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          alert(`Gagal membuat user: ${err.message || 'Unknown error'}`);
          return;
        }
        // Refresh list
        await fetchUsers();
      }
      setShowModal(false);
    } catch (e) {
      alert('Gagal menyimpan. Periksa koneksi ke server.');
    }
  };

  const handleDelete = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    setShowDeleteConfirm(null);
  };

  const handleToggleStatus = (id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? {
      ...u, status: u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
    } as User : u));
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === '' || u.role === filterRole;
    return matchesSearch && matchesRole;
  }).slice(0, pageSize);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <div className={styles.titleWrapper}>
            <ShieldAlert size={28} className={styles.titleIcon} strokeWidth={2.5} />
            <h1 className={styles.title}>Manajemen Pengguna</h1>
          </div>
          <p className={styles.subtitle}>
            Kontrol akses, role, dan hak istimewa untuk seluruh pengguna sistem.
          </p>
        </div>
      </header>

      {/* Stats Summary */}
      <StatsGrid
        items={[
          { label: 'Total Pengguna', value: users.length, max: 100, icon: Users, accent: '#2E5BFF' },
          { label: 'Akun Aktif', value: users.filter(u => u.status === 'ACTIVE').length, max: 100, icon: CheckCircle2, accent: '#00C48C' },
          { label: 'Ditangguhkan', value: users.filter(u => u.status === 'SUSPENDED').length, max: 50, icon: ShieldCheck, accent: '#FF4D4D' },
        ]}
      />

      <div className={styles.card}>
        {/* Enterprise Datatable Toolbar */}
        <div className="dtToolbar">
          <div className="dtToolbarLeft">
            <div className="dtToolbarText">
              Show
              <CustomSelect
                options={[
                  { value: '10', label: '10' },
                  { value: '25', label: '25' },
                  { value: '50', label: '50' }
                ]}
                value={pageSize.toString()}
                onChange={(val) => setPageSize(parseInt(val, 10))}
              />
              entries
            </div>

            <CustomSelect
              options={[
                { value: '', label: 'Semua Role' },
                { value: 'SUPER_ADMIN', label: 'Super Admin' },
                { value: 'PARTNER', label: 'Partner' },
                { value: 'MECHANIC', label: 'Mekanik' },
                { value: 'CLIENT', label: 'Klien' }
              ]}
              value={filterRole}
              onChange={(val) => setFilterRole(val)}
              placeholder="Filter Role..."
            />
          </div>

          <div className="dtToolbarRight">
            <div className="dtToolbarSearch">
              <input
                type="text"
                placeholder="Search Admin..."
                className="dtToolbarSearchInput"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search size={16} className="dtToolbarSearchIcon" />
            </div>
            <button className="dtToolbarCreateBtn" onClick={openAddModal}>
              <Plus size={16} strokeWidth={2.5} />
              Create New
            </button>
          </div>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Pengguna</th>
              <th>Role / Hak Akses</th>
              <th>Status</th>
              <th>Terakhir Login</th>
              <th className={styles.tableThRight}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className={styles.userText}>
                    <span>{user.name}</span>
                    <span className={styles.userEmail}>{user.email}</span>
                  </div>
                </td>
                <td>
                  {roleLabels[user.role]}
                </td>
                <td>
                  <button
                    onClick={() => handleToggleStatus(user.id)}
                    className={styles.statusToggleBtn}
                    title="Klik untuk ubah status"
                  >
                    {user.status === 'ACTIVE' ? (
                      <span className={`${styles.badge} ${styles.badgeActive}`}>
                        <CheckCircle2 size={12} className={styles.badgeIcon} />
                        Aktif
                      </span>
                    ) : (
                      <span className={`${styles.badge} ${styles.badgeSuspend}`}>
                        <XCircle size={12} className={styles.badgeIcon} />
                        Ditangguhkan
                      </span>
                    )}
                  </button>
                </td>
                <td className={styles.lastLoginCell}>
                  {user.lastLogin || 'Belum pernah'}
                </td>
                <td className={styles.tableThRight}>
                  <div className={styles.actionsContainer}>
                    <button className={styles.actionBtn} title="Edit Pengguna" onClick={() => openEditModal(user)}>
                      <Edit3 size={16} />
                    </button>
                    <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} title="Hapus Pengguna" onClick={() => setShowDeleteConfirm(user.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {loading && (
              <tr>
                <td colSpan={5} className={styles.emptyCell}>
                  <div className={styles.emptyWrapper}>
                    Memuat data...
                  </div>
                </td>
              </tr>
            )}
            {!loading && filteredUsers.length === 0 && (
              <tr>
                <td colSpan={5} className={styles.emptyCell}>
                  <div className={styles.emptyWrapper}>
                    <span className={styles.emptyIcon}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    </span>
                    Tidak ada pengguna ditemukan.
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form Tambah/Edit Pengguna */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderTitle}>
                <UserPlus size={22} className={styles.modalHeaderIcon} />
                <h2 className={styles.modalTitle}>{editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</h2>
              </div>
              <button className={styles.modalClose} onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nama Lengkap</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="Masukkan nama lengkap"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email</label>
                <input
                  type="email"
                  className={styles.formInput}
                  placeholder="contoh@email.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                />
              </div>

              {!editingUser && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Password</label>
                  <div className={styles.passwordWrapper}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={styles.formInput}
                      placeholder="Minimal 8 karakter"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={styles.passwordToggleBtn}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Role</label>
                  <select
                    className={styles.formSelect}
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                  >
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="PARTNER">Partner</option>
                    <option value="MECHANIC">Mekanik</option>
                    <option value="CLIENT">Klien</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Status</label>
                  <select
                    className={styles.formSelect}
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as UserStatus)}
                  >
                    <option value="ACTIVE">Aktif</option>
                    <option value="SUSPENDED">Ditangguhkan</option>
                  </select>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.secondaryBtn} onClick={() => setShowModal(false)}>Batal</button>
              <button className={styles.primaryBtn} onClick={handleSave} disabled={!formName || !formEmail}>
                {editingUser ? 'Simpan Perubahan' : 'Tambah Pengguna'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteConfirm(null)}>
          <div className={styles.modalSmall} onClick={(e) => e.stopPropagation()}>
            <div className={styles.deleteConfirmWrapper}>
              <div className={styles.deleteConfirmIconBg}>
                <Trash2 size={22} className={styles.deleteIconColor} />
              </div>
              <h3 className={styles.deleteConfirmTitle}>Hapus Pengguna?</h3>
              <p className={styles.deleteConfirmMessage}>
                Tindakan ini tidak dapat dibatalkan. Pengguna <strong>{users.find(u => u.id === showDeleteConfirm)?.name}</strong> akan dihapus permanen.
              </p>
              <div className={styles.deleteConfirmActions}>
                <button className={styles.secondaryBtn} onClick={() => setShowDeleteConfirm(null)}>Batal</button>
                <button className={styles.dangerBtn} onClick={() => handleDelete(showDeleteConfirm)}>Ya, Hapus</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
