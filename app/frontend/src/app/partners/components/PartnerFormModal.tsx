'use client';

import React from 'react';
import {
  overlayStyle,
  modalStyle,
  modalTitleStyle,
  modalFooterStyle,
  labelStyle,
  inputStyle,
  cancelBtnStyle,
  saveBtnStyle,
  toggleBtnStyle,
  toggleKnobStyle,
} from '../modalStyles';

interface PartnerForm {
  partner_name: string;
  city: string;
  contact_wa: string;
  is_active: boolean;
}

interface PartnerFormModalProps {
  title: string;
  form: PartnerForm;
  setForm: React.Dispatch<React.SetStateAction<PartnerForm>>;
  saving: boolean;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel: string;
}

export default function PartnerFormModal({
  title,
  form,
  setForm,
  saving,
  onClose,
  onSubmit,
  submitLabel,
}: PartnerFormModalProps) {
  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={modalTitleStyle}>{title}</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Nama Mitra <span style={{ color: '#E11D48' }}>*</span></label>
            <input
              style={inputStyle}
              value={form.partner_name}
              onChange={(e) => setForm({ ...form, partner_name: e.target.value })}
              placeholder="Contoh: PT Teknisi Handal"
            />
          </div>
          <div>
            <label style={labelStyle}>Kota <span style={{ color: '#E11D48' }}>*</span></label>
            <input
              style={inputStyle}
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="Contoh: Jakarta"
            />
          </div>
          <div>
            <label style={labelStyle}>Nomor WhatsApp</label>
            <input
              style={inputStyle}
              value={form.contact_wa}
              onChange={(e) => setForm({ ...form, contact_wa: e.target.value })}
              placeholder="Contoh: 6281234567890"
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f0f0f4' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-deep-navy)' }}>Smart Routing</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-space-grey)', marginTop: '2px' }}>
                {form.is_active ? 'Routing Aktif — pesan diteruskan ke mitra ini' : 'Routing Nonaktif — fallback ke WhatsApp HQ'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, is_active: !form.is_active })}
              style={toggleBtnStyle(form.is_active)}
              aria-label="Toggle routing aktif"
            >
              <span style={toggleKnobStyle(form.is_active)} />
            </button>
          </div>
        </div>

        <div style={modalFooterStyle}>
          <button style={cancelBtnStyle} onClick={onClose} disabled={saving}>
            Batal
          </button>
          <button
            style={saveBtnStyle}
            onClick={onSubmit}
            disabled={saving || !form.partner_name.trim() || !form.city.trim()}
          >
            {saving ? 'Menyimpan...' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
