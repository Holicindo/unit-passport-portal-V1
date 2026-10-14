'use client';

import React from 'react';
import {
  X,
  Package,
  FileText,
  Calendar,
  Wrench,
  CheckCircle2,
  Clock,
  UserCheck,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import styles from './LiveServiceTrackerModal.module.css';

interface LiveServiceTrackerModalProps {
  log: any;
  onClose: () => void;
}

export default function LiveServiceTrackerModal({ log, onClose }: LiveServiceTrackerModalProps) {
  if (!log) return null;

  const status = log.status || 'PENDING';
  const unit = log.unit || {};
  const sn = unit.serial_number || log.unit_serial_number || '-';
  const model = unit.model_name || log.unit_model_name || 'Unit Holicindo';
  const callId = log.call_id || log.id?.slice(0, 8) || 'SR-001';

  const isStage1Done = true;
  const isStage2Done = status === 'IN PROGRESS' || status === 'COMPLETED';
  const isStage2Current = status === 'PENDING';
  const isStage3Done = status === 'COMPLETED';
  const isStage3Current = status === 'IN PROGRESS';
  const isStage4Done = status === 'COMPLETED';

  const formatDate = (dateStr?: string | Date | null) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return null;
    }
  };

  const createdDate = formatDate(log.created_at) || formatDate(log.service_date) || 'Hari ini';
  const scheduledDate = formatDate(log.scheduled_date);
  const completedDate = formatDate(log.completed_at) || (status === 'COMPLETED' ? formatDate(log.service_date) : null);

  const techAssigned = log.technician_name &&
    !log.technician_name.toLowerCase().includes('pending') &&
    !log.technician_name.toLowerCase().includes('alokasi')
    ? log.technician_name
    : null;

  const waMessage = `Halo Tim Holicindo, saya ingin menanyakan status servis unit saya:\n- Unit: ${model}\n- Serial Number: ${sn}\n- ID Permintaan: #${callId}\n\nMohon update informasinya, terima kasih!`;
  const waUrl = `https://wa.me/6281287120358?text=${encodeURIComponent(waMessage)}`;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <header className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.liveBadgeRow}>
              <span className={styles.liveIndicator}>
                <span className={styles.pulseDot} />
                Live Service Tracker
              </span>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>
                Ticket #{callId}
              </span>
            </div>
            <h2 className={styles.modalTitle}>Pelacakan Servis Real-Time</h2>
            <p className={styles.modalSubtitle}>Pantau tahap penanganan kendala unit Anda dari pengajuan hingga selesai</p>
          </div>
          <button type="button" onClick={onClose} className={styles.closeBtn} title="Tutup">
            <X size={18} />
          </button>
        </header>

        {/* Body */}
        <div className={styles.modalBody}>
          {/* Unit Info Card */}
          <div className={styles.unitCard}>
            <div className={styles.unitCardLeft}>
              <div className={styles.unitCardIcon}>
                <Package size={22} />
              </div>
              <div>
                <div className={styles.unitModel}>{model}</div>
                <div className={styles.unitSn}>SN: {sn}</div>
              </div>
            </div>
            <span
              className={`${styles.statusPill} ${
                status === 'COMPLETED'
                  ? styles.statusCompleted
                  : status === 'IN PROGRESS'
                  ? styles.statusInProgress
                  : status === 'CANCELLED' || status === 'CANCELED'
                  ? styles.statusCancelled
                  : styles.statusPending
              }`}
            >
              {status === 'IN PROGRESS' ? 'Sedang Dikerjakan' : status === 'COMPLETED' ? 'Selesai' : status}
            </span>
          </div>

          {/* Stepper Progress */}
          <div className={styles.stepper}>
            {/* STAGE 1: Pengajuan Masuk */}
            <div className={`${styles.stepItem} ${styles.stepDone}`}>
              <div className={`${styles.stepConnector} ${isStage2Done ? styles.stepConnectorActive : ''}`} />
              <div className={styles.stepIconWrap}>
                <FileText size={18} />
              </div>
              <div className={styles.stepContent}>
                <div className={styles.stepHeader}>
                  <span className={styles.stepTitle}>1. Permintaan Servis Diajukan</span>
                  <span className={styles.stepTime}>{createdDate}</span>
                </div>
                <div className={styles.stepDesc}>
                  <strong>Catatan Kendala:</strong> {log.issue_description || 'Permintaan servis rutin dari klien.'}
                </div>
                <span className={`${styles.stepMetaTag} ${styles.tagGreen}`}>
                  <CheckCircle2 size={12} /> Permintaan Tercatat di Sistem HQ
                </span>
              </div>
            </div>

            {/* STAGE 2: Dikonfirmasi & Dijadwalkan */}
            <div className={`${styles.stepItem} ${isStage2Done ? styles.stepDone : isStage2Current ? styles.stepCurrent : ''}`}>
              <div className={`${styles.stepConnector} ${isStage3Done ? styles.stepConnectorActive : ''}`} />
              <div className={styles.stepIconWrap}>
                {isStage2Done ? <CheckCircle2 size={18} /> : <Calendar size={18} />}
              </div>
              <div className={styles.stepContent}>
                <div className={styles.stepHeader}>
                  <span className={styles.stepTitle}>2. Konfirmasi Jadwal & Penugasan Teknisi</span>
                  {scheduledDate && <span className={styles.stepTime}>Rencana: {scheduledDate}</span>}
                </div>
                {isStage2Done || techAssigned || scheduledDate ? (
                  <div className={styles.stepDesc}>
                    {techAssigned ? (
                      <div>Teknisi yang ditugaskan: <strong>{techAssigned}</strong></div>
                    ) : (
                      <div>Teknisi: Tim Teknisi Holicindo Regional</div>
                    )}
                    {scheduledDate && (
                      <div style={{ marginTop: '2px' }}>Tanggal Kunjungan: <strong>{scheduledDate}</strong></div>
                    )}
                    {log.partner?.partner_name && (
                      <div style={{ marginTop: '2px', fontSize: '0.8rem', color: '#64748b' }}>
                        Partner Regional: {log.partner.partner_name} ({log.partner.city || ''})
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={styles.stepDesc} style={{ color: '#d95d00', background: 'rgba(255, 107, 0, 0.05)' }}>
                    Tim Holicindo sedang mengalokasikan teknisi dan mengonfirmasi jadwal kunjungan ke lokasi Anda.
                  </div>
                )}
                {isStage2Done ? (
                  <span className={`${styles.stepMetaTag} ${styles.tagGreen}`}>
                    <UserCheck size={12} /> Teknisi & Jadwal Telah Ditetapkan
                  </span>
                ) : (
                  <span className={`${styles.stepMetaTag} ${styles.tagOrange}`}>
                    <Clock size={12} /> Menunggu Verifikasi Jadwal HQ
                  </span>
                )}
              </div>
            </div>

            {/* STAGE 3: Pengerjaan di Lapangan */}
            <div className={`${styles.stepItem} ${isStage3Done ? styles.stepDone : isStage3Current ? styles.stepCurrent : ''}`}>
              <div className={`${styles.stepConnector} ${isStage4Done ? styles.stepConnectorActive : ''}`} />
              <div className={styles.stepIconWrap}>
                {isStage3Done ? <CheckCircle2 size={18} /> : <Wrench size={18} />}
              </div>
              <div className={styles.stepContent}>
                <div className={styles.stepHeader}>
                  <span className={styles.stepTitle}>3. Penanganan & Servis Lapangan</span>
                </div>
                <div className={styles.stepDesc}>
                  {isStage3Current ? (
                    <div>Teknisi sedang melakukan pengecekan mendalam & penanganan unit di outlet. {log.action_taken ? `Tindakan: ${log.action_taken}` : ''}</div>
                  ) : isStage3Done ? (
                    <div>Tindakan: <strong>{log.action_taken || 'Pemeriksaan menyeluruh dan servis teknis selesai dilaksanakan.'}</strong></div>
                  ) : (
                    <div>Tahap pengerjaan unit oleh teknisi sesuai dengan tanggal yang disepakati.</div>
                  )}
                </div>
                {isStage3Current ? (
                  <span className={`${styles.stepMetaTag} ${styles.tagBlue}`}>
                    <Wrench size={12} /> Sedang Dikerjakan di Lokasi
                  </span>
                ) : isStage3Done ? (
                  <span className={`${styles.stepMetaTag} ${styles.tagGreen}`}>
                    <CheckCircle2 size={12} /> Pekerjaan Lapangan Selesai
                  </span>
                ) : null}
              </div>
            </div>

            {/* STAGE 4: Servis Selesai & Laporan */}
            <div className={`${styles.stepItem} ${isStage4Done ? styles.stepDone : ''}`}>
              <div className={styles.stepIconWrap}>
                <CheckCircle2 size={18} />
              </div>
              <div className={styles.stepContent}>
                <div className={styles.stepHeader}>
                  <span className={styles.stepTitle}>4. Verifikasi & Servis Selesai</span>
                  {completedDate && <span className={styles.stepTime}>{completedDate}</span>}
                </div>
                <div className={styles.stepDesc}>
                  {isStage4Done ? (
                    <>
                      <div>Unit telah kembali beroperasi normal dan diuji coba.</div>
                      {log.replaced_sparepart && (
                        <div style={{ marginTop: '3px' }}>Sparepart Diganti: <strong>{log.replaced_sparepart}</strong></div>
                      )}
                    </>
                  ) : (
                    <div>Laporan teknisi akan diunggah ke unit passport setelah seluruh perbaikan selesai dan diverifikasi normal.</div>
                  )}
                </div>
                {isStage4Done && (
                  <span className={`${styles.stepMetaTag} ${styles.tagGreen}`}>
                    <ShieldCheck size={12} /> Garansi & Log Passport Telah Diperbarui
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Help Box */}
          <div className={styles.contactBox}>
            <div className={styles.contactInfo}>
              <div className={styles.contactTitle}>Ada Pertanyaan Terkait Servis Ini?</div>
              <div className={styles.contactDesc}>Hubungi Customer Support Holicindo dengan ID Tiket #{callId}</div>
            </div>
            <div className={styles.contactActions}>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.waBtn}
              >
                <MessageCircle size={15} /> WhatsApp CS
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className={styles.modalFooter}>
          <button type="button" onClick={onClose} className={styles.closeActionBtn}>
            Tutup
          </button>
        </footer>
      </div>
    </div>
  );
}
