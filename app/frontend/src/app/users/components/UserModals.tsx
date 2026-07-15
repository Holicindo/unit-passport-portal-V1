'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus, X, Eye, EyeOff } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { clientApi, partnerApi } from '@/lib/api';
import styles from '../users.module.css';

type UserRole = 'SUPER_ADMIN' | 'PARTNER' | 'MECHANIC' | 'CLIENT';
type UserStatus = 'ACTIVE' | 'SUSPENDED';

interface UserFormModalProps {
  editingUser: { id: string; name: string; email: string; role: UserRole; status: UserStatus; client_id?: string; partner_id?: string } | null;
  onClose: () => void;
  onSave: (data: { name: string; email: string; role: UserRole; status: UserStatus; password: string; client_id?: string; partner_id?: string }) => void;
}

export function UserFormModal({ editingUser, onClose, onSave }: UserFormModalProps) {
  const [formName, setFormName] = useState(editingUser?.name || '');
  const [formEmail, setFormEmail] = useState(editingUser?.email || '');
  const [formRole, setFormRole] = useState<UserRole>(editingUser?.role || 'CLIENT');
  const [formStatus, setFormStatus] = useState<UserStatus>(editingUser?.status || 'ACTIVE');
  const [formPassword, setFormPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formClientId, setFormClientId] = useState(editingUser?.client_id || '');
  const [formPartnerId, setFormPartnerId] = useState(editingUser?.partner_id || '');

  const [clients, setClients] = useState<{id: string, company_name: string}[]>([]);
  const [partners, setPartners] = useState<{id: string, company_name: string}[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientRes, partnerRes] = await Promise.all([
          clientApi.findAll(200),
          partnerApi.findAll()
        ]);
        if (clientRes.data) setClients(clientRes.data.data || clientRes.data);
        if (partnerRes.data) setPartners(partnerRes.data);
      } catch (err) {
        console.error('Failed to fetch relations:', err);
      }
    };
    fetchData();
  }, []);

  const handleSave = () => {
    if (!formName || !formEmail) return;
    onSave({ 
      name: formName, 
      email: formEmail, 
      role: formRole, 
      status: formStatus, 
      password: formPassword,
      client_id: formRole === 'CLIENT' ? (formClientId || undefined) : undefined,
      partner_id: formRole === 'PARTNER' ? (formPartnerId || undefined) : undefined
    });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderTitle}>
            <UserPlus size={22} className={styles.modalHeaderIcon} />
            <h2 className={styles.modalTitle}>{editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</h2>
          </div>
          <button className={styles.modalClose} onClick={onClose}><X size={20} /></button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Nama Lengkap</label>
            <input type="text" className={styles.formInput} placeholder="Masukkan nama lengkap"
              value={formName} onChange={(e) => setFormName(e.target.value)} />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Email</label>
            <input type="email" className={styles.formInput} placeholder="contoh@email.com"
              value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
          </div>

          {!editingUser && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Password</label>
              <div className={styles.passwordWrapper}>
                <input type={showPassword ? 'text' : 'password'} className={styles.formInput}
                  placeholder="Minimal 8 karakter" value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className={styles.passwordToggleBtn}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Role</label>
              <CustomSelect value={formRole} onChange={(val) => setFormRole(val as UserRole)}
                options={[
                  { value: 'SUPER_ADMIN', label: 'Super Admin' },
                  { value: 'PARTNER', label: 'Partner' },
                  { value: 'MECHANIC', label: 'Mekanik' },
                  { value: 'CLIENT', label: 'Klien' },
                ]} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Status</label>
              <CustomSelect value={formStatus} onChange={(val) => setFormStatus(val as UserStatus)}
                options={[
                  { value: 'ACTIVE', label: 'Aktif' },
                  { value: 'SUSPENDED', label: 'Ditangguhkan' },
                ]} />
            </div>
          </div>

          {formRole === 'CLIENT' && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Hubungkan ke Klien (Opsional)</label>
              <CustomSelect 
                value={formClientId} 
                onChange={setFormClientId}
                placeholder="Pilih Klien (Otomatis buat baru jika kosong)"
                options={[
                  { value: '', label: 'Buat Klien Baru (Otomatis)' },
                  ...clients.map(c => ({ value: c.id, label: c.company_name }))
                ]} 
              />
            </div>
          )}

          {formRole === 'PARTNER' && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Hubungkan ke Mitra/Partner (Opsional)</label>
              <CustomSelect 
                value={formPartnerId} 
                onChange={setFormPartnerId}
                placeholder="Pilih Mitra/Partner"
                options={[
                  { value: '', label: 'Pilih Mitra/Partner...' },
                  ...partners.map(p => ({ value: p.id, label: p.company_name }))
                ]} 
              />
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.secondaryBtn} onClick={onClose}>Batal</button>
          <button className={styles.primaryBtn} onClick={handleSave} disabled={!formName || !formEmail}>
            {editingUser ? 'Simpan Perubahan' : 'Tambah Pengguna'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface DeleteConfirmModalProps {
  userName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmModal({ userName, onClose, onConfirm }: DeleteConfirmModalProps) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalSmall} onClick={(e) => e.stopPropagation()}>
        <div className={styles.deleteConfirmWrapper}>
          <div className={styles.deleteConfirmIconBg}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E11D48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </div>
          <h3 className={styles.deleteConfirmTitle}>Hapus Pengguna?</h3>
          <p className={styles.deleteConfirmMessage}>
            Tindakan ini tidak dapat dibatalkan. Pengguna <strong>{userName}</strong> akan dihapus permanen.
          </p>
          <div className={styles.deleteConfirmActions}>
            <button className={styles.secondaryBtn} onClick={onClose}>Batal</button>
            <button className={styles.dangerBtn} onClick={onConfirm}>Ya, Hapus</button>
          </div>
        </div>
      </div>
    </div>
  );
}
