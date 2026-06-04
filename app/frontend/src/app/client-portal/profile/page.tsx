'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Building2, MapPin, Phone, LogOut, ShieldCheck, Edit3, Save, X } from 'lucide-react';
import styles from '../ClientPortal.module.css';

export default function ClientProfile() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', company_name: '', city: '' });
  const [saved, setSaved] = useState(false);

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

  const handleSave = () => {
    if (!user) return;
    const updated = { ...user, ...form };
    localStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const initial = user?.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Profil Saya</h1>
        <p className={styles.pageDescription}>Informasi akun dan perusahaan Anda.</p>
      </div>

      {saved && (
        <div style={{
          marginBottom: '16px', padding: '12px 16px', borderRadius: '10px',
          background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
          color: '#059669', fontWeight: 600, fontSize: '0.875rem', fontFamily: 'var(--font-body)',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <ShieldCheck size={16} /> Perubahan berhasil disimpan.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: '20px', maxWidth: '600px' }}>

        {/* Avatar + name card */}
        <div className={styles.card} style={{ padding: '28px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: 'var(--brand-deep-navy)', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-heading)',
              flexShrink: 0,
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {[
              { icon: User, label: 'Nama Lengkap', key: 'name', value: user?.name },
              { icon: Mail, label: 'Email', key: 'email', value: user?.email },
              { icon: Phone, label: 'No. Telepon', key: 'phone', value: user?.phone },
              { icon: Building2, label: 'Perusahaan', key: 'company_name', value: user?.company_name },
              { icon: MapPin, label: 'Kota', key: 'city', value: user?.city },
            ].map(({ icon: Icon, label, key, value }) => (
              <div key={key} className={styles.infoRow}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '130px' }}>
                  <Icon size={15} color="var(--brand-space-grey)" style={{ flexShrink: 0 }} />
                  <span className={styles.infoLabel}>{label}</span>
                </div>
                {editing ? (
                  <input
                    type={key === 'email' ? 'email' : 'text'}
                    value={form[key as keyof typeof form]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    style={{
                      flex: 1, border: '1px solid var(--brand-border)', borderRadius: '6px',
                      padding: '6px 10px', fontSize: '0.875rem', fontFamily: 'var(--font-body)',
                      color: 'var(--brand-deep-navy)', outline: 'none',
                      background: 'var(--brand-light-grey)',
                    }}
                    disabled={key === 'email'}
                  />
                ) : (
                  <span className={styles.infoValue} style={{ textAlign: 'right' }}>
                    {value || <span style={{ color: 'var(--brand-space-grey)', fontWeight: 400 }}>—</span>}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            {editing ? (
              <>
                <button onClick={handleSave} className={styles.btnPrimary} style={{ flex: 1 }}>
                  <Save size={15} /> Simpan Perubahan
                </button>
                <button onClick={() => setEditing(false)} className={styles.btnSecondary}>
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
              padding: '10px 18px', borderRadius: '8px',
              border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)',
              color: 'var(--brand-danger)', cursor: 'pointer',
              fontWeight: 700, fontFamily: 'var(--font-heading)', fontSize: '0.875rem',
            }}
          >
            <LogOut size={15} /> Keluar
          </button>
        </div>

      </div>
    </div>
  );
}
