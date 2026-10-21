'use client';

import {
  Wrench, ChevronRight, ChevronLeft, Loader2, CheckCircle2, AlertCircle,
  Layers, Zap, BookOpen, PlayCircle, ExternalLink, X, FileText, Info, ArrowUpRight
} from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { HOLIC_SPAREPARTS_INVENTORY } from '@/lib/spareparts-inventory';
import styles from '../partner-portal.module.css';

export interface Ticket {
  id: string;
  call_id?: string;
  status: string;
  issue_description: string;
  action_taken?: string;
  replaced_sparepart?: string;
  service_date?: string;
  completed_at?: string;
  technician_name?: string;
  unit?: { id: string; model_name: string; serial_number: string; qr_token: string };
}

interface TicketCardProps {
  log: Ticket;
  onCloseTicket: (log: Ticket) => void;
  onOpenNote: (log: Ticket) => void;
}

export function TicketCard({ log, onCloseTicket, onOpenNote }: TicketCardProps) {
  return (
    <div className={styles.ticketCard}>
      <div className={styles.ticketHeader}>
        <span className={styles.callIdBadge}>{log.call_id || log.id}</span>
        <span className={styles.pendingBadge}>MENUNGGU</span>
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
        <div className={styles.ticketFooterMeta}>
          <span className={styles.ticketDate}>
            {log.service_date ? new Date(log.service_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
          </span>
        </div>

        <div className={styles.ticketActionGroup}>
          <button className={styles.noteBtn} onClick={(e) => { e.stopPropagation(); onOpenNote(log); }}>
            Tambah Catatan Servis
          </button>
          <button className={styles.closeBtn} onClick={(e) => { e.stopPropagation(); onCloseTicket(log); }}>
            Selesaikan &amp; Tutup Tiket
          </button>
        </div>
      </div>
    </div>
  );
}

export function CompletedTicketCard({ log }: { log: Ticket }) {
  return (
    <div className={styles.ticketCard}>
      <div className={styles.ticketHeader}>
        <span className={styles.callIdBadge}>{log.call_id || log.id}</span>
        <span className={styles.completedBadge}>
          <CheckCircle2 size={12} style={{ display: 'inline', marginRight: 4 }} />
          SELESAI
        </span>
      </div>
      <div className={styles.unitInfo}>
        <span className={styles.unitModel}>{log.unit?.model_name || 'Unit'}</span>
        <span className={styles.unitSn}>SN: {log.unit?.serial_number || '—'}</span>
      </div>
      <div className={styles.issueText}>
        <span style={{ color: '#8f9bb3', fontWeight: 600 }}>Kendala: </span>
        {log.issue_description || 'Servis pemeliharaan / perbaikan'}
      </div>
      {log.action_taken && (
        <div className={styles.actionTakenBox}>
          <span style={{ fontWeight: 700, color: '#00d68f' }}>Tindakan: </span>
          {log.action_taken}
        </div>
      )}
      {log.replaced_sparepart && (
        <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
          <span style={{ fontWeight: 600, color: '#94a3b8' }}>Sparepart: </span>
          {log.replaced_sparepart}
        </div>
      )}
      <div className={styles.ticketFooter}>
        <div className={styles.ticketFooterMeta}>
          <span className={styles.ticketDate}>
            Selesai: {log.completed_at ? new Date(log.completed_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : (log.service_date ? new Date(log.service_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—')}
          </span>
        </div>
      </div>
    </div>
  );
}

export interface TicketSliderProps {
  tickets: Ticket[];
  onCloseTicket: (log: Ticket) => void;
  onOpenNote: (log: Ticket) => void;
}

export function TicketSlider({
  tickets,
  onCloseTicket,
  onOpenNote
}: TicketSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Sync scroll position with activeIndex
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    if (clientWidth > 0) {
      const idx = Math.round(scrollLeft / clientWidth);
      setActiveIndex(Math.min(Math.max(0, idx), tickets.length - 1));
    }
  };

  const scrollToIndex = (idx: number) => {
    if (!scrollRef.current) return;
    const targetIdx = Math.min(Math.max(0, idx), tickets.length - 1);
    scrollRef.current.scrollTo({
      left: targetIdx * scrollRef.current.clientWidth,
      behavior: 'smooth'
    });
    setActiveIndex(targetIdx);
  };

  if (!tickets || tickets.length === 0) return null;

  return (
    <div className={styles.ticketSliderWrapper}>
      {/* Slider Controls & Counter */}
      {tickets.length > 1 && (
        <div className={styles.ticketSliderHeader}>
          <div className={styles.ticketSliderCounter}>
            <span>Tiket {activeIndex + 1} dari {tickets.length}</span>
          </div>

          <div className={styles.ticketSliderNav}>
            <button
              type="button"
              className={styles.ticketSliderNavBtn}
              onClick={() => scrollToIndex(activeIndex - 1)}
              disabled={activeIndex === 0}
              aria-label="Geser ke tiket sebelumnya"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              className={styles.ticketSliderNavBtn}
              onClick={() => scrollToIndex(activeIndex + 1)}
              disabled={activeIndex === tickets.length - 1}
              aria-label="Geser ke tiket berikutnya"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Horizontal Slider Track (1 card per view) */}
      <div
        ref={scrollRef}
        className={styles.ticketSliderTrack}
        onScroll={handleScroll}
      >
        {tickets.map((log) => (
          <div key={log.id} className={styles.ticketSlideItem}>
            {log.status === 'COMPLETED' ? (
              <CompletedTicketCard log={log} />
            ) : (
              <TicketCard
                log={log}
                onCloseTicket={onCloseTicket}
                onOpenNote={onOpenNote}
              />
            )}
          </div>
        ))}
      </div>

      {/* Indicator Dots */}
      {tickets.length > 1 && (
        <div className={styles.ticketSliderDots}>
          {tickets.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`${styles.ticketSliderDot} ${i === activeIndex ? styles.ticketSliderDotActive : ''}`}
              onClick={() => scrollToIndex(i)}
              aria-label={`Lihat tiket ke-${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface NoteModalProps {
  noteText: string;
  setNoteText: (v: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export function NoteModal({ noteText, setNoteText, onSave, onClose }: NoteModalProps) {
  return (
    <div className={styles.noteModalBackdrop} onClick={onClose}>
      <div className={styles.noteModal} onClick={e => e.stopPropagation()}>
        <h3>Tambah Catatan Servis</h3>
        <textarea rows={6} value={noteText} onChange={e => setNoteText(e.target.value)}
          placeholder="Masukkan detail tindakan, komponen diganti, dll." className={styles.noteTextarea} />
        <div className={styles.noteModalActions}>
          <button onClick={onClose} className={styles.cancelBtn}>Batal</button>
          <button onClick={onSave} className={styles.saveBtn}>Simpan & Tutup Tiket</button>
        </div>
      </div>
    </div>
  );
}

export interface ConfirmCloseModalProps {
  isOpen: boolean;
  ticket?: Ticket | null;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmCloseModal({ isOpen, ticket, loading, onConfirm, onCancel }: ConfirmCloseModalProps) {
  const [hasSpareparts, setHasSpareparts] = useState<boolean | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [selectedCatalogId, setSelectedCatalogId] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectCatalog = (id: string) => {
    setSelectedCatalogId(id);
    if (!id) return;
    const item = HOLIC_SPAREPARTS_INVENTORY.find(s => s.id === id);
    if (item && !selectedItems.includes(item.name)) {
      setSelectedItems(prev => [...prev, item.name]);
      setError(null);
    }
  };

  const handleAddCustom = () => {
    const val = customInput.trim();
    if (!val) return;
    if (!selectedItems.includes(val)) {
      setSelectedItems(prev => [...prev, val]);
      setError(null);
    }
    setCustomInput('');
  };

  const handleRemove = (name: string) => {
    setSelectedItems(prev => prev.filter(i => i !== name));
  };

  const handleYes = () => {
    setHasSpareparts(true);
    setError(null);
  };

  const handleNo = () => {
    onConfirm();
  };

  const handleFinalConfirm = () => {
    if (hasSpareparts && selectedItems.length === 0) {
      setError('Wajib memilih atau mengisi minimal satu nama sparepart yang digunakan.');
      return;
    }
    const sparepartsStr = selectedItems.join('; ');
    if (ticket && sparepartsStr) {
      ticket.replaced_sparepart = sparepartsStr;
    }
    onConfirm();
  };

  return (
    <div className={styles.noteModalBackdrop} onClick={onCancel}>
      <div className={styles.confirmModal} onClick={e => e.stopPropagation()} style={{ maxWidth: hasSpareparts ? '500px' : '420px' }}>
        <div className={styles.confirmIconWrap}>
          <AlertCircle size={32} color="#FF6B00" />
        </div>
        <h3 className={styles.confirmTitle}>Konfirmasi Tutup Tiket</h3>
        <p className={styles.confirmMessage}>
          {hasSpareparts
            ? 'Pilih atau input sparepart resmi yang dipakai:'
            : 'Yakin udah selesai? Apakah ada sparepart yang dipakai / diganti?'}
        </p>

        {ticket && (
          <div className={styles.confirmTicketBox} style={{ marginBottom: '16px' }}>
            <div className={styles.confirmTicketId}>{ticket.call_id || ticket.id}</div>
            <div className={styles.confirmUnitName}>{ticket.unit?.model_name || 'Unit Servis'}</div>
            <div className={styles.confirmUnitSn}>SN: {ticket.unit?.serial_number || '—'}</div>
          </div>
        )}

        {hasSpareparts === true ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left', marginBottom: '16px' }}>
            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                {error}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                Pilih Dari Inventaris Holic *
              </label>
              <select
                value={selectedCatalogId}
                onChange={(e) => handleSelectCatalog(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', background: '#fff' }}
              >
                <option value="">— Cari & Pilih Sparepart —</option>
                {HOLIC_SPAREPARTS_INVENTORY.map((s) => (
                  <option key={s.id} value={s.id}>
                    [{s.category}] {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>
                Atau Tambah Manual
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  placeholder="Ketik nama part..."
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustom(); } }}
                  style={{ flex: 1, padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                />
                <button
                  type="button"
                  onClick={handleAddCustom}
                  style={{ padding: '8px 12px', borderRadius: '6px', border: 'none', background: '#0f172a', color: '#fff', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Tambah
                </button>
              </div>
            </div>

            {selectedItems.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '120px', overflowY: 'auto' }}>
                {selectedItems.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', padding: '6px 10px', borderRadius: '4px', fontSize: '0.78rem' }}>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{item}</span>
                    <button type="button" onClick={() => handleRemove(item)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}>×</button>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.confirmActions}>
              <button type="button" onClick={() => setHasSpareparts(null)} className={styles.confirmBtnCancel} disabled={loading}>
                Kembali
              </button>
              <button type="button" onClick={handleFinalConfirm} className={styles.confirmBtnOk} disabled={loading}>
                {loading ? <Loader2 size={16} className={styles.spin} /> : 'Simpan & Tutup'}
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.confirmActions} style={{ gridTemplateColumns: '1fr 1fr' }}>
            <button type="button" onClick={handleNo} className={styles.confirmBtnCancel} disabled={loading}>
              Tidak (No)
            </button>
            <button type="button" onClick={handleYes} className={styles.confirmBtnOk} disabled={loading}>
              {loading ? <Loader2 size={16} className={styles.spin} /> : 'Ya, Ada Sparepart'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export type TechDocType = 'exploded_view' | 'wiring_diagram' | 'manual' | 'tutorial';

export interface TechDocDetail {
  title: string;
  shortTitle: string;
  tagline: string;
  iconType: 'layers' | 'zap' | 'book' | 'video';
  purpose: string;
  usageCases: string[];
  tips: string;
}

export const TECH_DOC_INFO: Record<TechDocType, TechDocDetail> = {
  exploded_view: {
    title: 'Skema Suku Cadang Terurai',
    shortTitle: 'Skema Suku Cadang',
    tagline: 'Katalog visual seluruh komponen mesin yang diurai beserta nomor suku cadang resmi pabrikan.',
    iconType: 'layers',
    purpose: 'Menampilkan gambaran terurai (dua/tiga dimensi) seluruh bagian mesin hingga komponen terkecil seperti baut, seal karet, katup solenoid, boiler, dan pipa dengan nomor part resmi dari pabrikan.',
    usageCases: [
      'Memastikan urutan pemasangan kembali komponen saat mesin dibongkar agar tidak ada baut atau seal yang tertukar atau salah posisi.',
      'Mengetahui nomor part (part number) yang tepat saat memesan suku cadang pengganti ke distributor resmi Holicindo.',
      'Melihat posisi seal, o-ring, dan bearing internal sebelum membongkar bagian mesin yang bertekanan tinggi.'
    ],
    tips: 'Selalu cocokkan nomor seri dan model mesin Anda dengan skema karena setiap tahun produksi dapat memiliki pembaruan suku cadang.'
  },
  wiring_diagram: {
    title: 'Diagram Jalur Kelistrikan',
    shortTitle: 'Diagram Kelistrikan',
    tagline: 'Skema alur kabel, modul kontrol (PCB), saklar, sensor, dan relay mesin.',
    iconType: 'zap',
    purpose: 'Memetakan jalur kelistrikan mesin arus bolak-balik (AC) dan arus searah (DC), posisi elemen pemanas, sensor suhu/tekanan, katup listrik, dan titik tegangan pada papan sirkuit utama.',
    usageCases: [
      'Pelacakan titik korsleting, MCB/sekring trip, atau mesin mati total dengan pengukuran multimeter (Ohm & Voltase).',
      'Memeriksa sinyal input/output dari sensor suhu atau saklar tekanan ke modul kontrol jika muncul kendala mesin.',
      'Memastikan kabel pembumian (grounding) dan instalasi pemanas terpasang aman sesuai standar pabrikan.'
    ],
    tips: 'Pastikan aliran listrik utama telah diputus (cabut kabel daya) sebelum melakukan pengetesan resistansi kabel.'
  },
  manual: {
    title: 'Buku Petunjuk & Panduan Servis',
    shortTitle: 'Buku Panduan Teknis',
    tagline: 'Buku pedoman pabrikan mengenai spesifikasi teknis, kalibrasi, dan tabel kode kerusakan.',
    iconType: 'book',
    purpose: 'Berisi dokumentasi resmi pabrikan mengenai spesifikasi teknis mesin, batasan tekanan kerja (bar), suhu boiler (°C), diagram hidrolik, dan tabel panduan pemecahan masalah (troubleshooting).',
    usageCases: [
      'Menerjemahkan arti kode kerusakan (error code) di layar mesin serta langkah penyelesaian bertahapnya.',
      'Panduan kalibrasi parameter mesin seperti pre-infusion, tekanan ekstraksi pompa, dan level pengisian air boiler.',
      'Rujukan jadwal dan prosedur pemeliharaan berkala (servis berkala 3 bulanan, penggantian filter, dan descaling).'
    ],
    tips: 'Gunakan tabel kode kerusakan sebagai acuan pertama sebelum memutuskan untuk mengganti komponen elektronik.'
  },
  tutorial: {
    title: 'Video Panduan & Tutorial Perbaikan',
    shortTitle: 'Video Panduan Servis',
    tagline: 'Video peragaan langsung langkah demi langkah dari teknisi ahli spesialis Holicindo.',
    iconType: 'video',
    purpose: 'Memberikan demonstrasi visual nyata cara membongkar, membersihkan, menyetel, dan memasang kembali suku cadang mesin di lapangan secara praktis.',
    usageCases: [
      'Mempelajari teknik membuka penutup bodi tanpa merusak klip atau klem pengunci tersembunyi.',
      'Demonstrasi overhaul group head, penggantian seal shower screen, dan servis katup uap dengan alat khusus.',
      'Panduan visual bagi teknisi saat menangani model mesin baru untuk pertama kalinya.'
    ],
    tips: 'Tonton video hingga selesai terlebih dahulu untuk memahami peralatan dan alat kerja khusus yang perlu disiapkan.'
  }
};

export interface TechnicalDocModalProps {
  isOpen: boolean;
  docType: TechDocType | null;
  unit: {
    id?: string;
    model_name?: string;
    serial_number?: string;
    qr_token?: string;
    exploded_view_url?: string;
    circuit_diagram_url?: string;
    diagram_image_url?: string;
    specs?: any;
  } | null;
  onClose: () => void;
  onOpenPassport: (qrToken: string) => void;
}

export function TechnicalDocModal({
  isOpen,
  docType,
  unit,
  onClose,
  onOpenPassport
}: TechnicalDocModalProps) {
  if (!isOpen || !docType) return null;

  const info = TECH_DOC_INFO[docType];

  // Resolve direct file URL if available on unit
  let directUrl: string | undefined = undefined;
  if (docType === 'exploded_view') {
    directUrl = unit?.exploded_view_url || unit?.diagram_image_url || unit?.specs?.exploded_view_url;
  } else if (docType === 'wiring_diagram') {
    directUrl = unit?.circuit_diagram_url || unit?.specs?.wiring_diagram_url || unit?.specs?.circuit_diagram_url;
  } else if (docType === 'manual') {
    directUrl = unit?.specs?.manual_url || unit?.specs?.manuals_urls;
  } else if (docType === 'tutorial') {
    directUrl = unit?.specs?.tutorial_url || unit?.specs?.video_url;
  }

  const renderIcon = () => {
    switch (info.iconType) {
      case 'layers': return <Layers size={24} color="#2E5BFF" />;
      case 'zap': return <Zap size={24} color="#FF6B00" />;
      case 'book': return <BookOpen size={24} color="#00d68f" />;
      case 'video': return <PlayCircle size={24} color="#00B4D8" />;
    }
  };

  return (
    <div className={styles.noteModalBackdrop} onClick={onClose}>
      <div className={styles.docModal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.docModalHeader}>
          <div className={styles.docModalIconWrap}>
            {renderIcon()}
          </div>
          <div className={styles.docModalTitleWrap}>
            <h3 className={styles.docModalTitle}>{info.title}</h3>
            <p className={styles.docModalSubtitle}>{info.tagline}</p>
          </div>
          <button type="button" className={styles.docModalCloseBtn} onClick={onClose} aria-label="Tutup">
            <X size={18} />
          </button>
        </div>

        {/* Unit Info Chip */}
        {unit && (
          <div className={styles.docModalUnitBox}>
            <div className={styles.docModalUnitLabel}>Unit Servis:</div>
            <div className={styles.docModalUnitName}>{unit.model_name || 'Unit Mesin'}</div>
            <div className={styles.docModalUnitSn}>Nomor Seri: {unit.serial_number || '—'}</div>
          </div>
        )}

        {/* Content Body */}
        <div className={styles.docModalBody}>
          <div className={styles.docSection}>
            <div className={styles.docSectionTitle}>Fungsi &amp; Tujuan Dokumen</div>
            <p className={styles.docSectionText}>{info.purpose}</p>
          </div>

          <div className={styles.docSection}>
            <div className={styles.docSectionTitle}>Kapan Dokumen Ini Digunakan?</div>
            <ul className={styles.docCaseList}>
              {info.usageCases.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>

          <div className={styles.docTipBox}>
            <Info size={16} color="#2E5BFF" style={{ flexShrink: 0, marginTop: 2 }} />
            <span><strong>Catatan Teknisi:</strong> {info.tips}</span>
          </div>

          {/* File Status Box */}
          {directUrl ? (
            <div className={styles.docAvailableBox}>
              <CheckCircle2 size={18} color="#00d68f" />
              <div className={styles.docAvailableText}>
                <strong>Berkas Resmi Tersedia</strong>
                <span>Tautan berkas resmi untuk tipe mesin ini sudah terlampir.</span>
              </div>
              <button
                type="button"
                className={styles.docOpenDirectBtn}
                onClick={() => window.open(directUrl, '_blank')}
              >
                {docType === 'tutorial' ? 'Tonton Video' : 'Buka Berkas'} <ExternalLink size={14} />
              </button>
            </div>
          ) : (
            <div className={styles.docNoticeBox}>
              <Info size={18} color="#FF6B00" />
              <div>
                <strong>Lampiran Berkas Belum Diunggah</strong>
                <p>
                  Berkas lampiran khusus untuk model ini belum diunggah oleh admin ke server.
                  Anda dapat membuka Paspor Digital Unit untuk memeriksa spesifikasi lengkap, log pengujian, dan riwayat perbaikan mesin ini.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className={styles.docModalFooter}>
          {unit?.qr_token ? (
            <button
              type="button"
              className={styles.docOpenPassportBtn}
              onClick={() => {
                onClose();
                onOpenPassport(unit.qr_token!);
              }}
            >
              <span>Buka Paspor Digital Unit</span>
              <ArrowUpRight size={16} />
            </button>
          ) : (
            <div />
          )}

          <button type="button" className={styles.docCloseBtn} onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

