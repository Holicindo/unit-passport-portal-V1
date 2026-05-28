'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { serviceLogApi, unitApi } from '@/lib/api';
import { Wrench, Search, LogOut, QrCode, AlertCircle, ChevronRight, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import styles from './partner-portal.module.css';

const QrScannerModal = dynamic(() => import('@/components/layout/QrScannerModal'), { ssr: false });

export default function PartnerPortalPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchSn, setSearchSn] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!token || !raw) { router.push('/login'); return; }
    try {
      const parsed = JSON.parse(raw);
      if (parsed.role !== 'PARTNER') { router.push('/login'); return; }
      setUser(parsed);
    } catch { router.push('/login'); }
  }, [router]);

  useEffect(() => {
    if (!user) return;
    const fetchTickets = async () => {
      setLoading(true);
      try {
        const res = await serviceLogApi.findAll(1, 100);
        const all: any[] = res.data?.data ?? res.data ?? [];
        // Filter: PENDING tickets assigned to this partner
        const mine = all.filter(
          (log: any) => log.status === 'PENDING' && log.partner?.id === user.partner_id
        );
        setTickets(mine);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    fetchTickets();
  }, [user]);

  const handleSearch = async () => {
    if (!searchSn.trim()) return;
    setSearching(true);
    setSearchError('');
    try {
      const { data } = await unitApi.findByQrToken(searchSn.trim());
      if (data?.qr_token) {
        router.push(`/id/${data.qr_token}`);
      } else {
        setSearchError('Unit tidak ditemukan. Periksa Serial Number.');
      }
    } catch {
      setSearchError('Unit tidak ditemukan. Periksa Serial Number.');
    } finally {
      setSearching(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) return null;

  return (
    <div className={styles.pageWrapper}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.brandRow}>
          <div className={styles.brandIcon}>
            <Wrench size={20} color="#ffffff" />
          </div>
          <div>
            <div className={styles.brandLabel}>PARTNER PORTAL</div>
            <div className={styles.brandSub}>Holicindo Service Network</div>
          </div>
        </div>
        <button className={styles.logoutBtn} onClick={handleLogout} aria-label="Logout">
          <LogOut size={16} />
          <span>Keluar</span>
        </button>
      </header>

      <div className={styles.container}>
        {/* Welcome */}
        <div className={styles.welcomeCard}>
          <div className={styles.welcomeAvatar}>{user.name?.charAt(0)?.toUpperCase() || 'T'}</div>
          <div>
            <div className={styles.welcomeName}>{user.name || 'Teknisi'}</div>
            <div className={styles.welcomeRole}>Teknisi Mitra Resmi Holicindo</div>
          </div>
        </div>

        {/* QR Scan Section */}
        <section className={styles.scanSection}>
          <div className={styles.sectionLabel}>Mulai Servis</div>
          <button className={styles.scanBtn} onClick={() => setShowScanner(true)}>
            <QrCode size={28} />
            <span>SCAN QR UNIT</span>
            <span className={styles.scanBtnSub}>Arahkan kamera ke QR code pada mesin</span>
          </button>

          <div className={styles.orDivider}>
            <div className={styles.orLine} />
            <span>atau cari manual</span>
            <div className={styles.orLine} />
          </div>

          <div className={styles.searchRow}>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Masukkan Serial Number..."
              value={searchSn}
              onChange={e => { setSearchSn(e.target.value); setSearchError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <button className={styles.searchBtn} onClick={handleSearch} disabled={searching}>
              {searching ? <Loader2 size={18} className={styles.spin} /> : <Search size={18} />}
            </button>
          </div>
          {searchError && (
            <div className={styles.searchError}>
              <AlertCircle size={14} /> {searchError}
            </div>
          )}
        </section>

        {/* Active Tickets */}
        <section className={styles.ticketsSection}>
          <div className={styles.sectionLabel}>
            Tiket Aktif Saya
            {tickets.length > 0 && (
              <span className={styles.ticketCount}>{tickets.length}</span>
            )}
          </div>

          {loading ? (
            <div className={styles.loadingRow}>
              <Loader2 size={24} className={styles.spin} />
              <span>Memuat tiket...</span>
            </div>
          ) : tickets.length === 0 ? (
            <div className={styles.emptyTickets}>
              <Wrench size={36} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <div>Tidak ada tiket aktif</div>
              <div className={styles.emptyTicketsSub}>Scan QR unit untuk memulai servis baru</div>
            </div>
          ) : (
            <div className={styles.ticketList}>
              {tickets.map(log => (
                <div
                  key={log.id}
                  className={styles.ticketCard}
                  onClick={() => log.unit?.qr_token && router.push(`/id/${log.unit.qr_token}`)}
                >
                  <div className={styles.ticketHeader}>
                    <span className={styles.callIdBadge}>{log.id}</span>
                    <span className={styles.pendingBadge}>PENDING</span>
                  </div>
                  <div className={styles.unitInfo}>
                    <span className={styles.unitModel}>{log.unit?.model_name || 'Unit'}</span>
                    <span className={styles.unitSn}>SN: {log.unit?.serial_number || '—'}</span>
                  </div>
                  <div className={styles.issueText}>
                    {(log.issue_description || 'Tidak ada deskripsi').slice(0, 90)}
                    {(log.issue_description || '').length > 90 ? '…' : ''}
                  </div>
                  <div className={styles.ticketFooter}>
                    <span className={styles.ticketDate}>
                      {log.service_date
                        ? new Date(log.service_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'}
                    </span>
                    <span className={styles.openBtn}>
                      Buka Unit <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* QR Scanner Modal */}
      <QrScannerModal isOpen={showScanner} onClose={() => setShowScanner(false)} />
    </div>
  );
}
