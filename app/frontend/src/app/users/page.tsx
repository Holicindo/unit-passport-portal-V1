'use client';

import React, { useState, useEffect } from 'react';
import styles from './users.module.css';
import { Plus, Search, ShieldAlert, CheckCircle2, XCircle, Edit3, Trash2, Users, ShieldCheck } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import StatsGrid from '@/components/dashboard/StatsGrid';
import { userApi } from '@/lib/api';
import { UserFormModal, DeleteConfirmModal } from './components/UserModals';

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
  const [pageSize, setPageSize] = useState(10);

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

  useEffect(() => { fetchUsers(); }, []);

  const openAddModal = () => { setEditingUser(null); setShowModal(true); };
  const openEditModal = (user: User) => { setEditingUser(user); setShowModal(true); };

  const handleSave = async (data: { name: string; email: string; role: UserRole; status: UserStatus; password: string }) => {
    try {
      if (editingUser) {
        setUsers(prev => prev.map(u => u.id === editingUser.id ? {
          ...u, name: data.name, email: data.email, role: data.role, status: data.status
        } : u));
      } else {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ name: data.name, email: data.email, password: data.password || 'password123', role: data.role }),
        });
        if (!res.ok) {
          const err = await res.json();
          alert(`Gagal membuat user: ${err.message || 'Unknown error'}`);
          return;
        }
        await fetchUsers();
      }
      setShowModal(false);
    } catch {
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
          <p className={styles.subtitle}>Kontrol akses, role, dan hak istimewa untuk seluruh pengguna sistem.</p>
        </div>
      </header>

      <StatsGrid items={[
        { label: 'Total Pengguna', value: users.length, max: 100, icon: Users, accent: '#001F3F' },
        { label: 'Akun Aktif', value: users.filter(u => u.status === 'ACTIVE').length, max: 100, icon: CheckCircle2, accent: '#001F3F' },
        { label: 'Ditangguhkan', value: users.filter(u => u.status === 'SUSPENDED').length, max: 50, icon: ShieldCheck, accent: '#FF6B00' },
      ]} />

      <div className={styles.card}>
        <div className="dtToolbar">
          <div className="dtToolbarLeft">
            <div className="dtToolbarText">
              Show
              <CustomSelect options={[{ value: '10', label: '10' }, { value: '25', label: '25' }, { value: '50', label: '50' }]}
                value={pageSize.toString()} onChange={(val) => setPageSize(parseInt(val, 10))} />
              entries
            </div>
            <CustomSelect options={[
              { value: '', label: 'Semua Role' }, { value: 'SUPER_ADMIN', label: 'Super Admin' },
              { value: 'PARTNER', label: 'Partner' }, { value: 'MECHANIC', label: 'Mekanik' }, { value: 'CLIENT', label: 'Klien' },
            ]} value={filterRole} onChange={(val) => setFilterRole(val)} placeholder="Filter Role..." />
          </div>
          <div className="dtToolbarRight">
            <div className="dtToolbarSearch">
              <input type="text" placeholder="Search Admin..." className="dtToolbarSearchInput"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <Search size={16} className="dtToolbarSearchIcon" />
            </div>
            <button className="dtToolbarCreateBtn" onClick={openAddModal}>
              <Plus size={16} strokeWidth={2.5} /> Create New
            </button>
          </div>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Pengguna</th><th>Role / Hak Akses</th><th>Status</th><th>Terakhir Login</th><th className={styles.tableThRight}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td><div className={styles.userText}><span>{user.name}</span><span className={styles.userEmail}>{user.email}</span></div></td>
                <td>{roleLabels[user.role]}</td>
                <td>
                  <button onClick={() => handleToggleStatus(user.id)} className={styles.statusToggleBtn} title="Klik untuk ubah status">
                    {user.status === 'ACTIVE' ? (
                      <span className={`${styles.badge} ${styles.badgeActive}`}><CheckCircle2 size={12} className={styles.badgeIcon} /> Aktif</span>
                    ) : (
                      <span className={`${styles.badge} ${styles.badgeSuspend}`}><XCircle size={12} className={styles.badgeIcon} /> Ditangguhkan</span>
                    )}
                  </button>
                </td>
                <td className={styles.lastLoginCell}>{user.lastLogin || 'Belum pernah'}</td>
                <td className={styles.tableThRight}>
                  <div className={styles.actionsContainer}>
                    <button className={styles.actionBtn} title="Edit Pengguna" onClick={() => openEditModal(user)}><Edit3 size={16} /></button>
                    <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} title="Hapus Pengguna" onClick={() => setShowDeleteConfirm(user.id)}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {loading && (
              <tr><td colSpan={5} className={styles.emptyCell}><div className={styles.emptyWrapper}>Memuat data...</div></td></tr>
            )}
            {!loading && filteredUsers.length === 0 && (
              <tr><td colSpan={5} className={styles.emptyCell}><div className={styles.emptyWrapper}>
                <span className={styles.emptyIcon}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
                Tidak ada pengguna ditemukan.
              </div></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <UserFormModal editingUser={editingUser} onClose={() => setShowModal(false)} onSave={handleSave} />
      )}

      {showDeleteConfirm && (
        <DeleteConfirmModal
          userName={users.find(u => u.id === showDeleteConfirm)?.name || ''}
          onClose={() => setShowDeleteConfirm(null)}
          onConfirm={() => handleDelete(showDeleteConfirm)}
        />
      )}
    </div>
  );
}
