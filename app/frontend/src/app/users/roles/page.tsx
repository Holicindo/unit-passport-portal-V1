'use client';

import React, { useState } from 'react';
import styles from '../users.module.css';
import { Shield, Save, CheckSquare, Square, LayoutDashboard, Package, Wrench, BarChart3, Users, Settings } from 'lucide-react';

type Permission = 'view' | 'create' | 'edit' | 'delete';

interface MenuPermission {
  id: string;
  label: string;
  icon: React.ReactNode;
  permissions: Record<Permission, boolean>;
}

interface RoleConfig {
  id: string;
  label: string;
  color: string;
  description: string;
  menus: MenuPermission[];
}

const permissionLabels: Record<Permission, string> = {
  view: 'Lihat',
  create: 'Tambah',
  edit: 'Edit',
  delete: 'Hapus',
};

const defaultMenus = [
  { id: 'dashboard', label: 'Ringkasan Armada', icon: <LayoutDashboard size={16} /> },
  { id: 'units', label: 'Manajemen Unit', icon: <Package size={16} /> },
  { id: 'service', label: 'Log & Rencana Servis', icon: <Wrench size={16} /> },
  { id: 'reports', label: 'Laporan & Digital Form', icon: <BarChart3 size={16} /> },
  { id: 'users', label: 'Pengaturan Akses', icon: <Users size={16} /> },
  { id: 'settings', label: 'Konfigurasi Sistem', icon: <Settings size={16} /> },
];

const initialRoles: RoleConfig[] = [
  {
    id: 'SUPER_ADMIN',
    label: 'Super Admin',
    color: '#2E5BFF',
    description: 'Akses penuh ke seluruh sistem tanpa batasan.',
    menus: defaultMenus.map(m => ({ ...m, permissions: { view: true, create: true, edit: true, delete: true } })),
  },
  {
    id: 'PARTNER',
    label: 'Partner',
    color: '#00C48C',
    description: 'Mitra resmi yang menangani servis unit di lapangan.',
    menus: defaultMenus.map(m => ({
      ...m,
      permissions: {
        view: ['dashboard', 'service', 'reports'].includes(m.id),
        create: ['service', 'reports'].includes(m.id),
        edit: ['service'].includes(m.id),
        delete: false,
      },
    })),
  },
  {
    id: 'MECHANIC',
    label: 'Mekanik',
    color: '#FFB800',
    description: 'Teknisi lapangan yang melakukan eksekusi servis.',
    menus: defaultMenus.map(m => ({
      ...m,
      permissions: {
        view: ['dashboard', 'service'].includes(m.id),
        create: ['service'].includes(m.id),
        edit: ['service'].includes(m.id),
        delete: false,
      },
    })),
  },
  {
    id: 'CLIENT',
    label: 'Klien',
    color: '#9D4EDD',
    description: 'Pemilik unit yang hanya dapat melihat data unit miliknya.',
    menus: defaultMenus.map(m => ({
      ...m,
      permissions: {
        view: ['dashboard', 'units', 'reports'].includes(m.id),
        create: false,
        edit: false,
        delete: false,
      },
    })),
  },
];

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleConfig[]>(initialRoles);
  const [activeRole, setActiveRole] = useState<string>('SUPER_ADMIN');
  const [saved, setSaved] = useState(false);

  const currentRole = roles.find(r => r.id === activeRole)!;

  const togglePermission = (menuId: string, perm: Permission) => {
    setRoles(prev => prev.map(role => {
      if (role.id !== activeRole) return role;
      return {
        ...role,
        menus: role.menus.map(menu => {
          if (menu.id !== menuId) return menu;
          return {
            ...menu,
            permissions: {
              ...menu.permissions,
              [perm]: !menu.permissions[perm],
            },
          };
        }),
      };
    }));
    setSaved(false);
  };

  const toggleAllForMenu = (menuId: string) => {
    const menu = currentRole.menus.find(m => m.id === menuId);
    if (!menu) return;
    const allChecked = Object.values(menu.permissions).every(Boolean);

    setRoles(prev => prev.map(role => {
      if (role.id !== activeRole) return role;
      return {
        ...role,
        menus: role.menus.map(m => {
          if (m.id !== menuId) return m;
          return {
            ...m,
            permissions: { view: !allChecked, create: !allChecked, edit: !allChecked, delete: !allChecked },
          };
        }),
      };
    }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <div className={styles.titleWrapper}>
            <Shield size={28} style={{ color: 'var(--color-cobalt-blue)', strokeWidth: 2.5 }} />
            <h1 className={styles.title}>Matriks Hak Akses</h1>
          </div>
          <p className={styles.subtitle}>
            Atur hak akses menu dan aksi (CRUD) untuk setiap role pengguna.
          </p>
        </div>

        <button
          className={styles.primaryBtn}
          onClick={handleSave}
          style={saved ? { background: '#00C48C', boxShadow: '0 4px 14px rgba(0,196,140,0.3)' } : {}}
        >
          <Save size={18} strokeWidth={2.5} />
          {saved ? 'Tersimpan ✓' : 'Simpan Perubahan'}
        </button>
      </header>

      {/* Summary Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        {roles.map(role => {
          const activePerms = role.menus.reduce((total, menu) => total + Object.values(menu.permissions).filter(Boolean).length, 0);
          const totalPerms = role.menus.length * 4;
          return (
            <div
              key={role.id}
              onClick={() => setActiveRole(role.id)}
              style={{
                background: activeRole === role.id ? `${role.color}08` : 'var(--glass-bg)',
                border: activeRole === role.id ? `1.5px solid ${role.color}35` : '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px 28px',
                boxShadow: activeRole === role.id ? `0 6px 24px ${role.color}12` : 'var(--glass-shadow)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: role.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{role.label}</span>
              <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--color-deep-navy)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {activePerms}<span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-space-grey)' }}>/{totalPerms}</span>
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ flex: 1, height: '4px', borderRadius: '4px', background: 'rgba(0,31,63,0.06)', overflow: 'hidden' }}>
                  <div style={{ width: `${(activePerms / totalPerms) * 100}%`, height: '100%', background: role.color, borderRadius: '4px', transition: 'width 0.4s ease' }} />
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-space-grey)' }}>{Math.round((activePerms / totalPerms) * 100)}%</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-space-grey)', fontWeight: 500 }}>Izin aktif dari total</span>
            </div>
          );
        })}
      </div>

      {/* Role Description */}
      <div style={{
        background: `${currentRole.color}08`,
        border: `1px solid ${currentRole.color}20`,
        borderRadius: '16px',
        padding: '20px 28px',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '14px',
          background: `${currentRole.color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Shield size={22} style={{ color: currentRole.color }} />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-deep-navy)', marginBottom: '4px' }}>
            {currentRole.label}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-space-grey)', fontWeight: 500 }}>
            {currentRole.description}
          </div>
        </div>
      </div>

      {/* Permissions Matrix Table */}
      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: '320px', padding: '20px 28px' }}>Modul / Menu</th>
              {Object.entries(permissionLabels).map(([key, label]) => (
                <th key={key} style={{ textAlign: 'center', width: '140px', padding: '20px 16px' }}>{label}</th>
              ))}
              <th style={{ textAlign: 'center', width: '130px', padding: '20px 16px' }}>Semua</th>
            </tr>
          </thead>
          <tbody>
            {currentRole.menus.map((menu) => {
              const allChecked = Object.values(menu.permissions).every(Boolean);
              return (
                <tr key={menu.id}>
                <td style={{ padding: '28px 28px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: currentRole.color, display: 'flex', width: '24px', height: '24px' }}>{menu.icon}</span>
                    <span style={{ fontWeight: 700, fontSize: '1rem' }}>{menu.label}</span>
                  </div>
                </td>
                  {(Object.keys(permissionLabels) as Permission[]).map(perm => (
                    <td key={perm} style={{ textAlign: 'center', padding: '28px 16px' }}>
                      <button
                        onClick={() => togglePermission(menu.id, perm)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '8px',
                          borderRadius: '10px',
                          transition: 'all 0.15s ease',
                          display: 'inline-flex',
                          color: menu.permissions[perm] ? currentRole.color : '#CBD5E1',
                        }}
                        title={`${menu.permissions[perm] ? 'Nonaktifkan' : 'Aktifkan'} ${permissionLabels[perm]} untuk ${menu.label}`}
                      >
                        {menu.permissions[perm] ? (
                          <CheckSquare size={26} strokeWidth={2.5} />
                        ) : (
                          <Square size={26} strokeWidth={1.5} />
                        )}
                      </button>
                    </td>
                  ))}
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => toggleAllForMenu(menu.id)}
                      style={{
                        background: allChecked ? `${currentRole.color}12` : 'rgba(0,31,63,0.03)',
                        border: `1px solid ${allChecked ? `${currentRole.color}30` : 'rgba(0,31,63,0.08)'}`,
                        borderRadius: '8px',
                        padding: '6px 14px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: allChecked ? currentRole.color : 'var(--color-space-grey)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {allChecked ? 'Reset' : 'Pilih Semua'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
