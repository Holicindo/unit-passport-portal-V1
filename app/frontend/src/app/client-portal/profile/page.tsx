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

  // Sync form values whenever user data changes (preserves data when entering edit mode)
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
    if (!user) return;
    setSaving(true);
    setSaveError('');
    setSaved(false);
    try {
      // Kirim name, phone, dan city ke backend
      const { data } = await authApi.updateProfile({
        name: form.name,
        phone: form.phone,
        city: form.city,
      });
      // Merge response API dengan data lokal (company_name tetap dari localStorage)
      const updated = {
        ...user,
        ...form,
        name: data.name || form.name,
        phone: data.phone ?? form.phone,
        city: data.city ?? form.city,
      };
      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Gagal menyimpan perubahan. Silakan coba lagi.';
      setSaveError(errorMsg);
      setTimeout(() => setSaveError(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form to current user values without losing what was there
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
          background: 'rgba(16,185,129,0.10)',
          boxShadow: 'inset 2px 2px 5px rgba(0,31,63,0.05), inset -2px -2px 5px rgba(255,255,255,0.80)',
          color: '#059669', fontWeight: 600, fontSize: '0.875rem', fontFamily: 'var(--font-body)',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <ShieldCheck size={16} /> Perubahan berhasil disimpan.
        </div>
      )}

      {saveError && (
        <div style={{
          marginBottom: '16px', padding: '12px 16px', borderRadius: '12px',
          background: 'rgba(239,68,68,0.10)',
          boxShadow: 'inset 2px 2px 5px rgba(0,31,63,0.05), inset -2px -2px 5px rgba(255,255,255,0.80)',
          color: 'var(--brand-danger)', fontWeight: 600, fontSize: '0.875rem', fontFamily: 'var(--font-body)',
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
              background: 'var(--brand-deep-navy)', color: 'var(--brand-optic-white)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-heading)',
              flexShrink: 0,
              boxShadow: '-4px -4px 8px rgba(255,255,255,0.55), 4px 4px 8px rgba(0,31,63,0.35)',
            }}>
              {initial}
            </div>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--brand-deep-navy)', fontFamily: 'var(--font-heading)' }}>
                {user?.name || '—'}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--brand-space-grey)', marginTop: '3px', fontFamily: 'var(--font-body)' }}>
                {user?.company_name || 'Klien Holicindo'}
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                marginTop: '6px', padding: '2px 10px', borderRadius: '20px',
                background: 'rgba(46,91,255,0.1)', color: 'var(--brand-cobalt-blue)',
                fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-heading)',
              }}>
                <ShieldCheck size={11} /> CLIENT
              </div>
            </div>
          </div>

          {/* Info fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                  <Icon size={13} color="var(--brand-space-grey)" style={{ flexShrink: 0 }} />
                  <span style={{
                    fontSize: '0.72rem', fontWeight: 700,
                    color: 'var(--brand-space-grey)', textTransform: 'uppercase',
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
                      width: '100%', border: 'none', borderRadius: '10px',
                      padding: '9px 12px', fontSize: '0.875rem', fontFamily: 'var(--font-body)',
                      color: 'var(--brand-deep-navy)', outline: 'none',
                      background: 'var(--neu-base)',
                      boxShadow: 'inset 3px 3px 7px rgba(0,31,63,0.07), inset -3px -3px 7px rgba(255,255,255,0.92)',
                      boxSizing: 'border-box',
                      cursor: key === 'email' ? 'not-allowed' : 'text',
                      opacity: key === 'email' ? 0.6 : 1,
                    }}
                    disabled={key === 'email'}
                  />
                ) : (
                  <div style={{
                    padding: '9px 12px', borderRadius: '10px',
                    background: 'var(--neu-base)',
                    boxShadow: 'inset 2px 2px 5px rgba(0,31,63,0.06), inset -2px -2px 5px rgba(255,255,255,0.90)',
                    fontSize: '0.875rem', fontWeight: 600,
                    color: value ? 'var(--brand-deep-navy)' : 'var(--brand-space-grey)',
                    fontFamily: 'var(--font-body)',
                    minHeight: '38px', display: 'flex', alignItems: 'center',
                  }}>
                    {value || '—'}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
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
              <button onClick={() => setEditing(true)} className={styles.btnSecondary} style={{ flex: 1 }}>
                <Edit3 size={15} /> Edit Profil
              </button>
            )}
          </div>
        </div>

        {/* Logout card */}
        <div className={styles.card} style={{ padding: '20px 24px' }}>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--brand-deep-navy)', fontFamily: 'var(--font-heading)', marginBottom: '4px' }}>
              Keluar dari Akun
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--brand-space-grey)', fontFamily: 'var(--font-body)' }}>
              Sesi Anda akan diakhiri dan Anda akan diarahkan ke halaman login.
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 18px', borderRadius: '10px',
              border: 'none',
              background: 'var(--neu-base)',
              boxShadow: '-3px -3px 6px rgba(255,255,255,0.72), 3px 3px 6px rgba(0,31,63,0.14)',
              color: 'var(--brand-danger)', cursor: 'pointer',
              fontWeight: 700, fontFamily: 'var(--font-heading)', fontSize: '0.875rem',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '-4px -4px 8px rgba(255,255,255,0.80), 4px 4px 10px rgba(0,31,63,0.18)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = '-3px -3px 6px rgba(255,255,255,0.72), 3px 3px 6px rgba(0,31,63,0.14)')}
          >
            <LogOut size={15} /> Keluar
          </button>
        </div>

      </div>
    </div>
  );
}
