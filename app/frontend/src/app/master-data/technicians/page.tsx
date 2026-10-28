'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Users, UserCheck, Shield, Phone, Mail, Search, RefreshCw,
  Plus, CheckCircle2, XCircle, ArrowUpRight, Wrench, Building2,
  Calendar, Layers, Filter, UserCog, ExternalLink
} from 'lucide-react';
import { userApi, partnerApi } from '@/lib/api';
import styles from './technicians.module.css';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: 'ACTIVE' | 'SUSPENDED';
  client_id?: string;
  partner_id?: string;
  last_login?: string;
  created_at?: string;
}

interface Partner {
  id: string;
  partner_name: string;
  city?: string;
}

// Wave SVG component for statistics cards
function WaveBg({ idx, percentage }: { idx: number; percentage: number }) {
  const startY = 100 - (percentage * 60);
  const peakY  = 100 - (percentage * 85);
  const dipY   = 100 - (percentage * 40);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 'inherit', zIndex: 0, pointerEvents: 'none' }}>
      <svg viewBox="0 0 400 100" style={{ position: 'absolute', bottom: 0, left: 0, width: '200%', height: '85%', opacity: 0.15, animation: `waveAnim ${7 + (idx % 3) * 2}s linear infinite reverse` }} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`sg-back-${idx}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.03" />
          </linearGradient>
        </defs>
        <path d={`M0,${startY + 6} C70,${dipY + 4} 130,${peakY + 6} 200,${startY + 6} C270,${dipY + 4} 330,${peakY + 6} 400,${startY + 6} L400,100 L0,100 Z`} fill={`url(#sg-back-${idx})`} />
      </svg>
      <svg viewBox="0 0 400 100" style={{ position: 'absolute', bottom: 0, left: 0, width: '200%', height: '95%', opacity: 0.22, animation: `waveAnim ${4.5 + (idx % 3) * 1.5}s linear infinite` }} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`sg-front-${idx}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={`M0,${startY} C65,${peakY} 135,${dipY} 200,${startY} C265,${peakY} 335,${dipY} 400,${startY} L400,100 L0,100 Z`} fill={`url(#sg-front-${idx})`} />
      </svg>
    </div>
  );
}

export default function MasterDataTechniciansPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPartner, setFilterPartner] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, partnersRes] = await Promise.allSettled([
        userApi.findAll(),
        partnerApi.findAll(),
      ]);

      if (usersRes.status === 'fulfilled') {
        const raw = usersRes.value.data;
        const all = Array.isArray(raw) ? raw : raw?.data || [];
        setUsers(all);
      }
      if (partnersRes.status === 'fulfilled') {
        const raw = partnersRes.value.data;
        const all = Array.isArray(raw) ? raw : raw?.data || [];
        setPartners(all);
      }
    } catch (err) {
      console.error('Failed to load technician master data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter ONLY users with role MECHANIC / TEKNISI
  const technicians = useMemo(() => {
    return users.filter((u) => {
      const r = (u.role || '').toUpperCase();
      return r === 'MECHANIC' || r === 'TEKNISI';
    });
  }, [users]);

  // Partners map for quick lookup
  const partnerMap = useMemo(() => {
    const map = new Map<string, string>();
    partners.forEach((p) => {
      map.set(p.id, p.partner_name + (p.city ? ` (${p.city})` : ''));
    });
    return map;
  }, [partners]);

  // Filtered list
  const filteredList = useMemo(() => {
    return technicians.filter((t) => {
      if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
      if (filterPartner !== 'ALL') {
        if (filterPartner === 'HQ' && t.partner_id) return false;
        if (filterPartner !== 'HQ' && t.partner_id !== filterPartner) return false;
      }
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const pName = t.partner_id ? partnerMap.get(t.partner_id) || '' : 'HQ Internal';
      return (
        t.name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        (t.phone && t.phone.toLowerCase().includes(q)) ||
        pName.toLowerCase().includes(q)
      );
    });
  }, [technicians, filterStatus, filterPartner, search, partnerMap]);

  const activeCount = technicians.filter((t) => t.status === 'ACTIVE').length;
  const suspendedCount = technicians.filter((t) => t.status === 'SUSPENDED').length;
  const hqCount = technicians.filter((t) => !t.partner_id).length;
  const partnerTechCount = technicians.filter((t) => !!t.partner_id).length;

  return (
    <div className={styles.container}>
      {/* ─── Header ─── */}
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          <div className={styles.titleIcon}>
            <Wrench size={24} />
          </div>
          <div>
            <h1 className={styles.title}>Master Data Teknisi</h1>
            <p className={styles.subtitle}>
              Daftar seluruh personil teknisi aktif dari <strong>Manajemen Pengguna</strong> (Role: Teknisi). Digunakan untuk alokasi multi-teknisi saat servis dan instalasi.
            </p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            onClick={fetchData}
            className={styles.refreshBtn}
            title="Muat Ulang"
          >
            <RefreshCw size={15} className={loading ? styles.spinning : ''} />
            <span>Segarkan</span>
          </button>

          <Link href="/users" className={styles.primaryBtn}>
            <UserCog size={16} />
            <span>Kelola di Manajemen Pengguna</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>

      {/* ─── Stats Bar ─── */}
      <div className={styles.statsBar}>
        <div className={styles.statCard}>
          <WaveBg idx={0} percentage={0.8} />
          <div className={styles.statIcon}>
            <Users size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Total Teknisi</span>
            <div className={styles.statNumber}>{technicians.length}</div>
            <span className={styles.statSub}>Dari seluruh unit servis</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <WaveBg idx={1} percentage={0.7} />
          <div className={styles.statIcon} style={{ color: '#10b981' }}>
            <UserCheck size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Teknisi Aktif (Siap Tugas)</span>
            <div className={styles.statNumber} style={{ color: '#34d399' }}>{activeCount}</div>
            <span className={styles.statSub}>{suspendedCount} ditangguhkan</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <WaveBg idx={2} percentage={0.55} />
          <div className={styles.statIcon} style={{ color: '#38bdf8' }}>
            <Building2 size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Teknisi HQ vs Mitra</span>
            <div className={styles.statNumber} style={{ fontSize: '1.4rem' }}>
              {hqCount} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#94a3b8' }}>HQ</span> / {partnerTechCount} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#94a3b8' }}>Mitra</span>
            </div>
            <span className={styles.statSub}>Terdistribusi regional</span>
          </div>
        </div>
      </div>

      {/* ─── Info Alert Banner: Penjelasan Mitra vs Teknisi ─── */}
      <div className={styles.infoBanner}>
        <div className={styles.infoBannerIcon}>
          <Layers size={18} />
        </div>
        <div className={styles.infoBannerText}>
          <strong>Catatan Alokasi Penugasan:</strong>
          <span>
            <strong>Mitra</strong> mewakili badan usaha / workshop regional (contoh: CV Tri Tunggal, PT Mitra Abadi). Sedangkan <strong>Teknisi</strong> adalah individu/personil lapangan yang pergi langsung (bisa multi-select lebih dari 1 orang teknisi sekaligus per tiket kunjungan).
          </span>
        </div>
      </div>

      {/* ─── Search & Filter Bar ─── */}
      <div className={styles.filterCard}>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Cari nama teknisi, email, no telepon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} className={styles.clearBtn}>
              ×
            </button>
          )}
        </div>

        <div className={styles.filterGroup}>
          <div className={styles.selectWrapper}>
            <label>Afiliasi / Mitra:</label>
            <select
              value={filterPartner}
              onChange={(e) => setFilterPartner(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="ALL">Semua Afiliasi</option>
              <option value="HQ">Internal HQ Holicindo</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.partner_name} {p.city ? `(${p.city})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.selectWrapper}>
            <label>Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Aktif</option>
              <option value="SUSPENDED">Ditangguhkan</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── Table ─── */}
      <div className={styles.tableCard}>
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>#</th>
                <th style={{ width: '28%' }}>Nama Personil Teknisi</th>
                <th style={{ width: '22%' }}>Kontak (Email / Telepon)</th>
                <th style={{ width: '24%' }}>Afiliasi (HQ / Mitra)</th>
                <th style={{ width: '14%' }}>Status Akun</th>
                <th style={{ width: '12%', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className={styles.loadingCell}>
                    <RefreshCw size={20} className={styles.spinning} />
                    <span>Memuat master data teknisi...</span>
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.emptyCell}>
                    <div className={styles.emptyWrapper}>
                      <Users size={36} style={{ color: '#94a3b8', marginBottom: '8px' }} />
                      <p style={{ fontWeight: 600, color: 'var(--color-deep-navy)' }}>
                        {technicians.length === 0
                          ? 'Belum ada data Pengguna dengan Role Teknisi'
                          : 'Tidak ada teknisi yang cocok dengan pencarian / filter'}
                      </p>
                      <p style={{ fontSize: '0.82rem', color: '#64748b', maxWidth: '420px', margin: '4px auto 14px' }}>
                        {technicians.length === 0
                          ? 'Tambahkan pengguna baru di menu Manajemen Pengguna dan beri role "Teknisi" agar otomatis muncul di sini.'
                          : 'Coba ubah kata kunci pencarian atau filter status/afiliasi.'}
                      </p>
                      {technicians.length === 0 && (
                        <Link href="/users" className={styles.primaryBtn} style={{ margin: '0 auto' }}>
                          <Plus size={15} />
                          <span>Buat Pengguna Teknisi Baru</span>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((t, idx) => {
                  const partnerName = t.partner_id ? partnerMap.get(t.partner_id) : 'Internal HQ Holicindo';
                  const isHq = !t.partner_id;

                  return (
                    <tr key={t.id} className={styles.tableRow}>
                      <td style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>
                        {idx + 1}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className={styles.avatarCircle}>
                            {t.name
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')
                              .toUpperCase()}
                          </div>
                          <div>
                            <div className={styles.techName}>{t.name}</div>
                            <div className={styles.techRoleBadge}>
                              <Wrench size={11} /> Role: Teknisi (Mechanic)
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className={styles.contactItem}>
                          <Mail size={13} style={{ color: '#64748b' }} />
                          <span>{t.email}</span>
                        </div>
                        {t.phone ? (
                          <div className={styles.contactItem} style={{ marginTop: '3px' }}>
                            <Phone size={13} style={{ color: '#64748b' }} />
                            <span>{t.phone}</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#cbd5e1', fontStyle: 'italic' }}>
                            No. telp belum diisi
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            className={isHq ? styles.hqBadge : styles.partnerBadge}
                          >
                            {isHq ? 'HQ' : 'Mitra'}
                          </span>
                          <span style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--color-deep-navy)' }}>
                            {partnerName}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={
                            t.status === 'ACTIVE'
                              ? styles.statusActive
                              : styles.statusSuspended
                          }
                        >
                          {t.status === 'ACTIVE' ? (
                            <>
                              <CheckCircle2 size={13} /> Aktif (Siap Tugas)
                            </>
                          ) : (
                            <>
                              <XCircle size={13} /> Ditangguhkan
                            </>
                          )}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <Link
                          href="/users"
                          className={styles.actionBtn}
                          title="Buka & Edit Profil di Manajemen Pengguna"
                        >
                          <ExternalLink size={14} />
                          <span>Kelola</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.tableFooter}>
          <span>Menampilkan <strong>{filteredList.length}</strong> dari <strong>{technicians.length}</strong> total teknisi</span>
          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            Data tersinkronisasi otomatis dengan role pengguna di sistem.
          </span>
        </div>
      </div>
    </div>
  );
}
