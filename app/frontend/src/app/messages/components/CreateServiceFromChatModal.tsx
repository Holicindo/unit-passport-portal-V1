'use client';

import React, { useState, useEffect } from 'react';
import { unitApi, partnerApi, serviceLogApi } from '@/lib/api';
import { X, Wrench, Loader2, CheckCircle2 } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';

interface CreateServiceFromChatModalProps {
  chatPartner: any;
  lastMessage?: string;
  onClose: () => void;
  onSuccess: (createdLog: any) => void;
}

export default function CreateServiceFromChatModal({
  chatPartner,
  lastMessage,
  onClose,
  onSuccess,
}: CreateServiceFromChatModalProps) {
  const [units, setUnits] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successTicketId, setSuccessTicketId] = useState<string | null>(null);

  // Form states
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [issueDescription, setIssueDescription] = useState(
    lastMessage ? `[Pesan Chat] ${lastMessage}` : ''
  );
  const [contactName, setContactName] = useState(
    chatPartner?.full_name || chatPartner?.email?.split('@')[0] || ''
  );
  const [contactPhone, setContactPhone] = useState('');
  const [taskType, setTaskType] = useState('CORRECTIVE');
  const [scheduledDate, setScheduledDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const [unitsRes, partnersRes] = await Promise.all([
          unitApi.findAll(1, 1000),
          partnerApi.findAll(),
        ]);
        const allUnits = unitsRes.data?.data ?? (Array.isArray(unitsRes.data) ? unitsRes.data : []);
        setUnits(allUnits);

        if (Array.isArray(partnersRes.data)) {
          setPartners(partnersRes.data);
        }
      } catch (err) {
        console.error('Failed to load form options', err);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnitId) {
      setError('Silakan pilih unit terlebih dahulu.');
      return;
    }
    if (!issueDescription.trim()) {
      setError('Deskripsi kendala tidak boleh kosong.');
      return;
    }

    setSubmitting(true);
    setError(null);

    // Format issue description with contact details if provided
    let finalDesc = issueDescription.trim();
    if (contactName || contactPhone) {
      finalDesc += `\n[Pelapor: ${contactName || '-'} (${contactPhone || '-'})]`;
    }

    try {
      const payload = {
        unitId: selectedUnitId,
        partnerId: selectedPartnerId || undefined,
        issue_description: finalDesc,
        action_taken: 'Dalam proses peninjauan dari chat support.',
        status: 'PENDING',
        task_type: taskType,
        scheduled_date: scheduledDate || undefined,
      };

      const { data } = await serviceLogApi.create(payload);
      setSuccessTicketId(data?.call_id || data?.id || 'OK');
      setTimeout(() => {
        onSuccess(data);
      }, 1500);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(' | ') : (msg || 'Gagal merekam tiket servis.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '520px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeIn 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            color: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'rgba(255, 107, 0, 0.15)',
                color: '#FF6B00',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Wrench size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>
                Buat Tiket Servis dari Chat
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Pelapor: {chatPartner?.email || chatPartner?.id || 'Klien'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        {successTicketId ? (
          <div
            style={{
              padding: '40px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <CheckCircle2 size={48} color="#10B981" />
            <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
              Tiket Servis Berhasil Dibuat!
            </h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
              Call ID: <strong>{successTicketId}</strong>
            </p>
          </div>
        ) : loadingData ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <Loader2 size={32} className="spin" style={{ color: '#2E5BFF', marginBottom: '8px' }} />
            <div style={{ fontSize: '0.85rem' }}>Memuat daftar unit & mitra...</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && (
              <div
                style={{
                  padding: '10px 14px',
                  background: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  borderRadius: '8px',
                  color: '#991B1B',
                  fontSize: '0.82rem',
                }}
              >
                {error}
              </div>
            )}

            {/* Select Unit */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Pilih Unit / Mesin Klien *
              </label>
              <CustomSelect
                value={selectedUnitId}
                onChange={(val) => setSelectedUnitId(val)}
                options={[
                  { value: '', label: '-- Pilih Unit Terkait --' },
                  ...units.map((u) => ({
                    value: u.id,
                    label: `${u.model_name} (${u.serial_number}) - ${u.current_client?.company_name || 'Umum'}`,
                  })),
                ]}
                placeholder="-- Pilih Unit Terkait --"
              />
            </div>

            {/* Issue Description */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Deskripsi Keluhan / Kendala *
              </label>
              <textarea
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="Jelaskan masalah kerusakan dari chat..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.85rem',
                  fontFamily: 'inherit',
                  minHeight: '80px',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>

            {/* Row Contact Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Nama Kontak (PIC)
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Nama PIC Klien"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  No. Telepon / WA
                </label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="08xx-xxxx-xxxx"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Row Partner & Scheduled Date */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Alokasi Mitra Regional
                </label>
                <CustomSelect
                  value={selectedPartnerId}
                  onChange={(val) => setSelectedPartnerId(val)}
                  options={[
                    { value: '', label: 'HQ (Manual Routing)' },
                    ...partners.map((p) => ({
                      value: p.id,
                      label: `${p.partner_name} (${p.city})`,
                    })),
                  ]}
                  placeholder="HQ (Manual Routing)"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Tanggal Penjadwalan
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                style={{
                  padding: '9px 16px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '9px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #FF6B00 0%, #E05D00 100%)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="spin" /> Menyimpan...
                  </>
                ) : (
                  <>
                    <Wrench size={16} /> Buat Tiket Servis
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
