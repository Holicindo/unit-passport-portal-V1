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
} from '../../modalStyles';

interface ClientForm {
  company_name: string;
  bp_code: string;
  city: string;
  email: string;
  total_unit: string;
}

interface ClientFormModalProps {
  title: string;
  form: ClientForm;
  setForm: React.Dispatch<React.SetStateAction<ClientForm>>;
  saving: boolean;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel: string;
}

export default function ClientFormModal({
  title,
  form,
  setForm,
  saving,
  onClose,
  onSubmit,
  submitLabel,
}: ClientFormModalProps) {
  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={modalTitleStyle}>{title}</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Nama Klien <span style={{ color: '#E11D48' }}>*</span></label>
            <input
              style={inputStyle}
              value={form.company_name}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              placeholder="Contoh: Starbucks Indonesia"
            />
          </div>
          <div>
            <label style={labelStyle}>BP Code</label>
            <input
              style={inputStyle}
              value={form.bp_code}
              onChange={(e) => setForm({ ...form, bp_code: e.target.value })}
              placeholder="Contoh: CLI-SBUX01"
            />
          </div>
          <div>
            <label style={labelStyle}>Lokasi Pusat</label>
            <input
              style={inputStyle}
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="Contoh: Jakarta"
            />
          </div>
          <div>
            <label style={labelStyle}>Kontak / Email</label>
            <input
              style={inputStyle}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Contoh: contact@starbucks.co.id"
            />
          </div>
          <div>
            <label style={labelStyle}>Total Unit</label>
            <input
              type="number"
              style={inputStyle}
              value={form.total_unit}
              onChange={(e) => setForm({ ...form, total_unit: e.target.value })}
              placeholder="0"
              min="0"
            />
          </div>
        </div>

        <div style={modalFooterStyle}>
          <button style={cancelBtnStyle} onClick={onClose} disabled={saving}>
            Batal
          </button>
          <button
            style={saveBtnStyle}
            onClick={onSubmit}
            disabled={saving || !form.company_name.trim()}
          >
            {saving ? 'Menyimpan...' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
