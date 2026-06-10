'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { serviceLogApi, unitApi } from '@/lib/api';
import { Wrench, Search, LogOut, QrCode, AlertCircle, Loader2, ChevronDown, CheckCircle2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import styles from './partner-portal.module.css';
import { TicketCard, NoteModal } from './components/TicketComponents';

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
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

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
        // Filter: PENDING tickets for this partner AND only for UNTSTRBCKS123
        const mine = all.filter(
          (log: any) =>
            log.status === 'PENDING' &&
            log.partner?.id === user.partner_id &&
            log.unit?.serial_number === 'UNTSTRBCKS123'
        );
        if (mine.length === 0) {
          // Mock fallback for UNTSTRBCKS123
          setTickets([
            {
              id: 'MOCK-TKT-SBUX',
              status: 'PENDING',
              issue_description: 'Suhu chiller kurang dingin, hanya mencapai 10 derajat celcius. Mesin berbunyi agak kasar.',
              service_date: new Date().toISOString(),
              unit: {
                id: 'sbux-unit',
                model_name: 'SHOWCASE TESTING',
                serial_number: 'UNTSTRBCKS123',
                qr_token: 'holi-cp-untstrbcks123',
              },
              partner: { id: user.partner_id },
            },
          ]);
        } else {
          setTickets(mine);
        }
      } catch {
        setTickets([
          {
            id: 'MOCK-TKT-SBUX',
            status: 'PENDING',
            issue_description: 'Suhu chiller kurang dingin, hanya mencapai 10 derajat celcius. Mesin berbunyi agak kasar.',
            service_date: new Date().toISOString(),
            unit: {
              id: 'sbux-unit',
              model_name: 'SHOWCASE TESTING',
              serial_number: 'UNTSTRBCKS123',
              qr_token: 'holi-cp-untstrbcks123',
            },
            partner: { id: user.partner_id },
          },
        ]);
      } finally {
        setLoading(false);
      }
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

  // Open note modal for a ticket
  const openNoteModal = (log: any) => {
    setSelectedUnit(log.unit ?? null);
    setNoteText(log.action_taken || '');
    setNoteModalOpen(true);
  };

  // Close ticket directly (without note)
  const handleCloseTicket = async (logId: string) => {
    await serviceLogApi.update(logId, { status: 'COMPLETED', action_taken: noteText || 'Selesai' });
    setTickets(prev => prev.filter(t => t.id !== logId));
    setNoteModalOpen(false);
    setNoteText('');
  };

  // Save note and close ticket (used from modal)
  const saveNote = async () => {
    if (!selectedUnit) return;
    const log = tickets.find((t: any) => t.unit?.id === selectedUnit.id);
    if (!log) return;
    await serviceLogApi.update(log.id, { status: 'COMPLETED', action_taken: noteText });
    setTickets(prev => prev.filter(t => t.id !== log.id));
    setNoteModalOpen(false);
    setNoteText('');
  };



  if (!user) return null;

  return (
    <div className={styles.pageWrapper}>
      <header className={styles.header}>
        {/* Top row: brand + logout */}
        <div className={styles.headerMain}>
          <div className={styles.brandRow}>
            <div className={styles.brandIcon}>
              <Wrench size={22  } color="#ffffff" />
            </div>
            <div className={styles.brandText}>
              <div className={styles.brandLabel}>PARTNER PORTAL</div>
              <div className={styles.brandSub}>Holicindo Service Network</div>
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
          <span className={styles.levelBadge}>LEVEL 3: TECHNICAL PARTNER</span>
        </div>
      </header>

      <div className={styles.container}>
        <section className={styles.statsSection}>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{color: '#2E5BFF', background: 'rgba(46, 91, 255, 0.15)'}}><QrCode size={18}/></div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>3</div>
              <div className={styles.statLabel}>Tugas Hari Ini</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{color: '#FF6B00', background: 'rgba(255, 107, 0, 0.15)'}}><AlertCircle size={18}/></div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>1</div>
              <div className={styles.statLabel}>Pending</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{color: '#00d68f', background: 'rgba(0, 214, 143, 0.15)'}}><CheckCircle2 size={18}/></div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>2</div>
              <div className={styles.statLabel}>Selesai</div>
            </div>
          </div>
        </section>

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
                <TicketCard key={log.id} log={log}
                  onCloseTicket={(id) => handleCloseTicket(id)}
                  onOpenNote={(l) => openNoteModal(l)}
                  onOpenUnit={(l) => l.unit?.qr_token && router.push(`/id/${l.unit.qr_token}`)} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* QR Scanner Modal */}
      <QrScannerModal isOpen={showScanner} onClose={() => setShowScanner(false)} />

      {/* Modal for adding service note */}
      {noteModalOpen && (
        <NoteModal noteText={noteText} setNoteText={setNoteText} onSave={saveNote} onClose={() => setNoteModalOpen(false)} />
      )}

      {/* Technical Docs Section (shown after tickets) */}
      {selectedUnit && (
        <section className={styles.techDocs}>
          <h2>Dokumen Teknis</h2>
          <div className={styles.docGrid}>
            <a href={selectedUnit.exploded_view_url} className={styles.docCard}>Exploded View</a>
            <a href={selectedUnit.wiring_diagram_url} className={styles.docCard}>Wiring Diagram</a>
            <a href={selectedUnit.manual_url} className={styles.docCard}>Manual</a>
            <a href={selectedUnit.tutorial_url} className={styles.docCard}>Tutorial</a>
          </div>
        </section>
      )}

    </div>
  );
}
