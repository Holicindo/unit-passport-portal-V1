'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { serviceLogApi, unitApi } from '@/lib/api';
import { 
  Wrench, Search, LogOut, QrCode, AlertCircle, Loader2, ChevronDown, CheckCircle2,
  Layers, Zap, BookOpen, PlayCircle, FileText, ChevronRight
} from 'lucide-react';
import dynamic from 'next/dynamic';
import styles from './partner-portal.module.css';
import { 
  TicketCard, CompletedTicketCard, TicketSlider, NoteModal, ConfirmCloseModal,
  Ticket 
} from './components/TicketComponents';

const QrScannerModal = dynamic(() => import('@/components/layout/QrScannerModal'), { ssr: false });

export default function PartnerPortalPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [pendingTickets, setPendingTickets] = useState<Ticket[]>([]);
  const [completedTickets, setCompletedTickets] = useState<Ticket[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('PENDING');
  const [loading, setLoading] = useState(true);
  const [searchSn, setSearchSn] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  // Note Modal
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<any>(null);

  // Confirmation Modal (Yakin udah selesai? Belum / Udah)
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [ticketToClose, setTicketToClose] = useState<Ticket | null>(null);
  const [closingLoading, setClosingLoading] = useState(false);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [stats, setStats] = useState({ today: 0, pending: 0, completed: 0 });
  const ticketsSectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const raw = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!token || !raw) { router.push('/login'); return; }
    try {
      const parsed = JSON.parse(raw);
      if (parsed.role !== 'PARTNER' && parsed.role !== 'MECHANIC') { router.push('/login'); return; }
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
        
        // Filter tickets for this technician / partner
        const minePending = all.filter((log: any) => {
          if (log.status !== 'PENDING') return false;
          if (user.partner_id) {
            return log.partner?.id === user.partner_id || log.technician_name === user.name;
          }
          return !log.partner || log.technician_name === user.name || log.partner?.id;
        });

        const mineCompleted = all.filter((log: any) => {
          if (log.status !== 'COMPLETED') return false;
          if (user.partner_id) {
            return log.partner?.id === user.partner_id || log.technician_name === user.name;
          }
          return true;
        });

        setStats({
          today: minePending.length,
          pending: minePending.length,
          completed: mineCompleted.length,
        });

        setPendingTickets(minePending);
        setCompletedTickets(mineCompleted);
      } catch (err) {
        console.error('Failed to fetch tickets:', err);
        setPendingTickets([]);
        setCompletedTickets([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, [user]);

  const handleTabChange = (tab: 'ALL' | 'PENDING' | 'COMPLETED') => {
    setActiveTab(tab);
    ticketsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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

  // Open note modal for a ticket
  const openNoteModal = (log: Ticket) => {
    setSelectedUnit(log.unit ?? null);
    setNoteText(log.action_taken || '');
    setNoteModalOpen(true);
  };

  // Step 1: Initiate close ticket -> trigger confirmation modal
  const handleInitiateClose = (log: Ticket) => {
    setTicketToClose(log);
    setConfirmOpen(true);
  };

  // Step 2: Confirm close ticket (User clicks "Udah")
  const handleConfirmClose = async () => {
    if (!ticketToClose) return;
    setClosingLoading(true);
    const actionTakenText = ticketToClose.action_taken || noteText || 'Servis selesai dan tiket ditutup oleh teknisi.';
    
    try {
      if (!ticketToClose.id.startsWith('MOCK-')) {
        await serviceLogApi.update(ticketToClose.id, {
          status: 'COMPLETED',
          action_taken: actionTakenText,
        });
      }

      const closedTicket: Ticket = {
        ...ticketToClose,
        status: 'COMPLETED',
        action_taken: actionTakenText,
        completed_at: new Date().toISOString(),
      };

      // Move ticket from pending to completed list
      setPendingTickets(prev => prev.filter(t => t.id !== ticketToClose.id));
      setCompletedTickets(prev => [closedTicket, ...prev]);

      setStats(prev => ({
        today: Math.max(0, prev.today - 1),
        pending: Math.max(0, prev.pending - 1),
        completed: prev.completed + 1,
      }));

      setConfirmOpen(false);
      setTicketToClose(null);
      setNoteModalOpen(false);
      setNoteText('');
    } catch (err) {
      console.warn('Update service log failed:', err);
      setConfirmOpen(false);
    } finally {
      setClosingLoading(false);
    }
  };

  // Save note from modal -> opens confirmation modal
  const handleSaveNoteFromModal = () => {
    if (!selectedUnit) return;
    const log = pendingTickets.find((t: any) => t.unit?.id === selectedUnit.id || t.unit?.serial_number === selectedUnit.serial_number);
    if (!log) {
      setNoteModalOpen(false);
      setNoteText('');
      return;
    }
    setTicketToClose({ ...log, action_taken: noteText });
    setNoteModalOpen(false);
    setConfirmOpen(true);
  };

  if (!user) return null;

  // Determine tickets to display based on active tab
  // Tugas Hari Ini and Pending ONLY show active pending tasks, never completed tickets
  const displayedTickets = 
    activeTab === 'COMPLETED'
      ? completedTickets
      : pendingTickets;

  return (
    <div className={styles.pageWrapper}>
      <header className={styles.header}>
        {/* Top row: brand + logout */}
        <div className={styles.headerMain}>
          <div className={styles.brandRow}>
            <div className={styles.brandIcon}>
              <Wrench size={20} color="#ffffff" />
            </div>
            <div className={styles.brandText}>
              <div className={styles.brandLabel}>Holicindo Service Portal</div>
            </div>
          </div>

          <div className={styles.profileDropdownContainer}>
            <button className={styles.profileChip} onClick={() => setDropdownOpen(!dropdownOpen)}>
              <div className={styles.profileAvatar}>{user.name?.charAt(0)?.toUpperCase() || 'T'}</div>
              <div className={styles.profileText}>
                <div className={styles.profileName}>{user.name || 'Teknisi'}</div>
                <div className={styles.profileRole}>Teknisi Mitra Resmi Holicindo</div>
              </div>
              <ChevronDown size={14} className={`${styles.dropdownIcon} ${dropdownOpen ? styles.open : ''}`} />
            </button>
            {dropdownOpen && (
              <div className={styles.dropdownMenu}>
                <div className={styles.dropdownHeader}>
                  <div className={styles.dropdownFullName}>{user.name || 'Teknisi'}</div>
                  <div className={styles.dropdownFullRole}>Teknisi Mitra Resmi Holicindo</div>
                </div>
                <button className={styles.dropdownItem} onClick={handleLogout} aria-label="Logout">
                  <LogOut size={15} />
                  <span>Keluar</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Badge row */}
        <div className={styles.headerBadgeRow}>
          <span className={styles.levelBadge}>LEVEL 3: TEKNISI MITRA RESMI</span>
        </div>
      </header>

      <div className={styles.container}>
        {/* Clickable Quick Stats (Filter tabs) */}
        <section className={styles.statsSection}>
          <div
            className={`${styles.statCard} ${activeTab === 'ALL' ? styles.statCardAllActive : ''}`}
            onClick={() => handleTabChange('ALL')}
            title="Klik untuk melihat semua tugas"
          >
            <div className={styles.statHeader}>
              <div className={styles.statIcon} style={{ color: '#2E5BFF', background: 'rgba(46, 91, 255, 0.15)' }}>
                <QrCode size={14} />
              </div>
              <div className={styles.statValue}>{stats.today}</div>
            </div>
            <div className={styles.statLabel}>Tugas Hari Ini</div>
          </div>

          <div
            className={`${styles.statCard} ${activeTab === 'PENDING' ? styles.statCardPendingActive : ''}`}
            onClick={() => handleTabChange('PENDING')}
            title="Klik untuk melihat tiket menunggu"
          >
            <div className={styles.statHeader}>
              <div className={styles.statIcon} style={{ color: '#FF6B00', background: 'rgba(255, 107, 0, 0.15)' }}>
                <AlertCircle size={14} />
              </div>
              <div className={styles.statValue}>{stats.pending}</div>
            </div>
            <div className={styles.statLabel}>Menunggu</div>
          </div>

          <div
            className={`${styles.statCard} ${activeTab === 'COMPLETED' ? styles.statCardCompletedActive : ''}`}
            onClick={() => handleTabChange('COMPLETED')}
            title="Klik untuk melihat riwayat tiket selesai"
          >
            <div className={styles.statHeader}>
              <div className={styles.statIcon} style={{ color: '#00d68f', background: 'rgba(0, 214, 143, 0.15)' }}>
                <CheckCircle2 size={14} />
              </div>
              <div className={styles.statValue}>{stats.completed}</div>
            </div>
            <div className={styles.statLabel}>Selesai</div>
          </div>
        </section>

        <section className={styles.scanSection}>
          <div className={styles.sectionLabel}>Mulai Servis</div>
          <button className={styles.scanBtn} onClick={() => setShowScanner(true)}>
            <QrCode size={28} />
            <span>PINDAI QR UNIT</span>
            <span className={styles.scanBtnSub}>Arahkan kamera ke kode QR pada mesin</span>
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
              placeholder="Masukkan nomor seri mesin..."
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

        {/* Dynamic Ticket Section (Pending / Completed History) */}
        <section ref={ticketsSectionRef} className={styles.ticketsSection} id="ticketsSection">
          <div className={styles.sectionLabel}>
            {activeTab === 'COMPLETED'
              ? 'Riwayat Tiket Selesai'
              : activeTab === 'PENDING'
              ? 'Tiket Aktif / Pending'
              : 'Tugas Hari Ini'}
            {displayedTickets.length > 0 && (
              <span className={styles.ticketCount}>{displayedTickets.length}</span>
            )}
          </div>

          {loading ? (
            <div className={styles.loadingRow}>
              <Loader2 size={24} className={styles.spin} />
              <span>Memuat tiket...</span>
            </div>
          ) : displayedTickets.length === 0 ? (
            <div className={styles.emptyTickets}>
              <Wrench size={36} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <div>
                {activeTab === 'COMPLETED'
                  ? 'Belum ada tiket yang selesai'
                  : 'Tidak ada tugas aktif'}
              </div>
              <div className={styles.emptyTicketsSub}>
                {activeTab === 'COMPLETED'
                  ? 'Selesaikan tiket servis untuk melihat riwayat di sini'
                  : 'Scan QR unit untuk memulai servis baru'}
              </div>
            </div>
          ) : (
            <TicketSlider
              tickets={displayedTickets}
              onCloseTicket={(l) => handleInitiateClose(l)}
              onOpenNote={(l) => openNoteModal(l)}
            />
          )}
        </section>
      </div>

      {/* QR Scanner Modal */}
      <QrScannerModal isOpen={showScanner} onClose={() => setShowScanner(false)} />

      {/* Modal for adding service note */}
      {noteModalOpen && (
        <NoteModal
          noteText={noteText}
          setNoteText={setNoteText}
          onSave={handleSaveNoteFromModal}
          onClose={() => setNoteModalOpen(false)}
        />
      )}

      {/* Confirmation Modal: "Yakin udah selesai? Mau tutup tiket servis ini?" */}
      <ConfirmCloseModal
        isOpen={confirmOpen}
        ticket={ticketToClose}
        loading={closingLoading}
        onConfirm={handleConfirmClose}
        onCancel={() => {
          setConfirmOpen(false);
          setTicketToClose(null);
        }}
      />

    </div>
  );
}
