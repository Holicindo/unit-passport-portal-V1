'use client';

import { Wrench, ChevronRight, Loader2 } from 'lucide-react';
import styles from '../partner-portal.module.css';

interface Ticket {
  id: string;
  status: string;
  issue_description: string;
  service_date: string;
  unit?: { id: string; model_name: string; serial_number: string; qr_token: string };
}

interface TicketCardProps {
  log: Ticket;
  onCloseTicket: (id: string) => void;
  onOpenNote: (log: Ticket) => void;
  onOpenUnit: (log: Ticket) => void;
}

export function TicketCard({ log, onCloseTicket, onOpenNote, onOpenUnit }: TicketCardProps) {
  return (
    <div className={styles.ticketCard} onClick={() => log.unit?.qr_token && onOpenUnit(log)}>
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
          {log.service_date ? new Date(log.service_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
        </span>
        <div className={styles.ticketActions}>
          <button className={styles.closeBtn} onClick={(e) => { e.stopPropagation(); onCloseTicket(log.id); }}>
            Selesaikan & Tutup Tiket
          </button>
          <button className={styles.noteBtn} onClick={(e) => { e.stopPropagation(); onOpenNote(log); }}>
            Tambah Catatan Servis
          </button>
          <button className={styles.openUnitBtn} onClick={(e) => { e.stopPropagation(); onOpenUnit(log); }}>
            Buka Unit <ChevronRight size={13} />
          </button>
        </div>
      </div>
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
