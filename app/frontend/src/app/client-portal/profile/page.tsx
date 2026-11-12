'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Building2, MapPin, Phone, LogOut, ShieldCheck, Edit3, Save, X, AlertCircle, ArrowLeft } from 'lucide-react';
import styles from '../ClientPortal.module.css';
import { authApi } from '@/lib/api';

export default function ClientProfile() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', company_name: '', city: '' });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const parsed = JSON.parse(raw);
        setUser(parsed);
        setForm({
          name: parsed.name || '',
          email: parsed.email || '',
          phone: parsed.phone || '',
          company_name: parsed.company_name || '',
          city: parsed.city || '',
        });
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (user) {
      setForm(f => ({
        name: f.name || user.name || '',
        email: f.email || user.email || '',
        phone: f.phone || user.phone || '',
        company_name: f.company_name || user.company_name || '',
        city: f.city || user.city || '',
      }));
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const { data } = await authApi.updateProfile({
        name: form.name,
        phone: form.phone,
        city: form.city,
      });

      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Gagal menyimpan perubahan. Silakan coba lagi.';
      setSaveError(errorMsg);
      setTimeout(() => setSaveError(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        company_name: user.company_name || '',
        city: user.city || '',
      });
    }
    setEditing(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const initial = user?.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div>
      <button
        className={styles.pageBackBtn}
        onClick={() => router.push('/client-portal/dashboard')}
      >
        <ArrowLeft size={15} /> Dashboard
      </button>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Profil Saya</h1>
        <p className={styles.pageDescription}>Informasi akun dan perusahaan Anda.</p>
      </div>

      {saved && (
        <div style={{
          marginBottom: '16px', padding: '12px 16px', borderRadius: '12px',
          background: 'rgba(16,185,129,0.15)',
          border: '1px solid rgba(16,185,129,0.3)',
          color: '#10b981', fontWeight: 700, fontSize: '0.875rem', fontFamily: 'var(--font-body)',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <ShieldCheck size={16} /> Perubahan berhasil disimpan.
        </div>
      )}

      {saveError && (
        <div style={{
          marginBottom: '16px', padding: '12px 16px', borderRadius: '12px',
          background: 'rgba(239,68,68,0.15)',
          border: '1px solid rgba(239,68,68,0.3)',
          color: '#f87171', fontWeight: 700, fontSize: '0.875rem', fontFamily: 'var(--font-body)',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <AlertCircle size={16} /> {saveError}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: '20px', maxWidth: '600px' }}>

        {/* Avatar + name card */}
        <div className={styles.card} style={{ padding: '28px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-heading)',
              flexShrink: 0,
              boxShadow: '0 6px 20px rgba(2, 132, 199, 0.4)',
              border: '2px solid rgba(56, 189, 248, 0.4)'
            }}>
              {initial}
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-heading)' }}>
                {user?.name || '—'}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '3px', fontFamily: 'var(--font-body)' }}>
                {user?.company_name || 'Klien Holicindo'}
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                marginTop: '6px', padding: '3px 12px', borderRadius: '20px',
                background: 'rgba(56,189,248,0.15)', color: '#38bdf8',
                fontSize: '0.72rem', fontWeight: 800, fontFamily: 'var(--font-heading)',
                border: '1px solid rgba(56,189,248,0.3)'
              }}>
                <ShieldCheck size={12} /> CLIENT
              </div>
            </div>
          </div>

          {/* Info fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { icon: User, label: 'Nama Lengkap', key: 'name', value: user?.name },
              { icon: Mail, label: 'Email', key: 'email', value: user?.email },
              { icon: Phone, label: 'No. Telepon', key: 'phone', value: user?.phone },
              { icon: Building2, label: 'Perusahaan', key: 'company_name', value: user?.company_name },
              { icon: MapPin, label: 'Kota', key: 'city', value: user?.city },
            ].map(({ icon: Icon, label, key, value }) => (
              <div key={key}>
                {/* Label row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Icon size={14} color="#38bdf8" style={{ flexShrink: 0 }} />
                  <span style={{
                    fontSize: '0.74rem', fontWeight: 700,
                    color: '#94a3b8', textTransform: 'uppercase',
                    letterSpacing: '0.05em', fontFamily: 'var(--font-heading)',
                  }}>
                    {label}
                  </span>
                </div>
                {/* Value / Input row */}
                {editing ? (
                  <input
                    type={key === 'email' ? 'email' : 'text'}
                    value={form[key as keyof typeof form]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    style={{
                      width: '100%', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '12px',
                      padding: '10px 14px', fontSize: '0.875rem', fontFamily: 'var(--font-body)',
                      color: '#ffffff', outline: 'none',
                      background: 'rgba(7, 23, 41, 0.85)',
                      boxSizing: 'border-box',
                      cursor: key === 'email' ? 'not-allowed' : 'text',
                      opacity: key === 'email' ? 0.6 : 1,
                    }}
                    disabled={key === 'email'}
                  />
                ) : (
                  <div style={{
                    padding: '10px 14px', borderRadius: '12px',
                    background: 'rgba(7, 23, 41, 0.65)',
                    border: '1px solid rgba(56, 189, 248, 0.15)',
                    fontSize: '0.88rem', fontWeight: 600,
                    color: value ? '#ffffff' : '#94a3b8',
                    fontFamily: 'var(--font-body)',
                    minHeight: '40px', display: 'flex', alignItems: 'center',
                  }}>
                    {value || '—'}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ marginTop: '24px', display: 'flex', gap: '10px' }}>
            {editing ? (
              <>
                <button 
                  onClick={handleSave} 
                  className={styles.btnPrimary} 
                  style={{ 
                    flex: 1,
                    opacity: saving ? 0.6 : 1,
                    cursor: saving ? 'not-allowed' : 'pointer',
                  }}
                  disabled={saving}
                >
                  <Save size={15} /> {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
                <button 
                  onClick={handleCancel} 
                  className={styles.btnSecondary}
                  disabled={saving}
                  style={{
                    opacity: saving ? 0.6 : 1,
                    cursor: saving ? 'not-allowed' : 'pointer',
                  }}
                >
                  <X size={15} />
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} className={styles.btnSecondary} style={{ flex: 1, justifyContent: 'center' }}>
                <Edit3 size={15} /> Edit Profil
              </button>
            )}
          </div>
        </div>

        {/* Logout card */}
        <div className={styles.card} style={{ padding: '22px 24px' }}>
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-heading)', marginBottom: '4px' }}>
              Keluar dari Akun
            </div>
            <div style={{ fontSize: '0.82rem', color: '#94a3b8', fontFamily: 'var(--font-body)' }}>
              Sesi Anda akan diakhiri dan Anda akan diarahkan ke halaman login.
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px', borderRadius: '12px',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#f87171', cursor: 'pointer',
              fontWeight: 800, fontFamily: 'var(--font-heading)', fontSize: '0.875rem',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)')}
          >
            <LogOut size={16} /> Keluar
          </button>
        </div>

      </div>
    </div>
  );
}
