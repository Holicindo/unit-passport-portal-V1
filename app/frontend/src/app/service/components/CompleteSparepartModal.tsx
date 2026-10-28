'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Wrench, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { HOLIC_SPAREPARTS_INVENTORY } from '@/lib/spareparts-inventory';
import { sparepartApi } from '@/lib/api';
import { CustomSelect } from '@/components/ui/CustomSelect';

interface CompleteSparepartModalProps {
  isOpen: boolean;
  ticketTitle?: string;
  unitModel?: string;
  initialSpareparts?: string;
  onConfirm: (spareparts: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function CompleteSparepartModal({
  isOpen,
  ticketTitle,
  unitModel,
  initialSpareparts = '',
  onConfirm,
  onCancel,
  loading = false,
}: CompleteSparepartModalProps) {
  // Step 1: 'ask' -> Step 2: 'input' (if yes)
  const [hasSpareparts, setHasSpareparts] = useState<boolean | null>(null);
  
  // Dynamic Catalog from DB
  const [catalogItems, setCatalogItems] = useState<any[]>(HOLIC_SPAREPARTS_INVENTORY);

  useEffect(() => {
    if (isOpen) {
      sparepartApi.getAll().then(res => {
        if (res.data && res.data.length > 0) {
          setCatalogItems(res.data);
        }
      }).catch(err => {
        console.error('Failed to fetch DB spareparts, using fallback', err);
      });
    }
  }, [isOpen]);
  
  // Selected spareparts list
  const [selectedItems, setSelectedItems] = useState<string[]>(() => {
    if (!initialSpareparts) return [];
    return initialSpareparts.split(';').map(s => s.trim()).filter(Boolean);
  });
  
  // Custom input state
  const [customInput, setCustomInput] = useState('');
  const [selectedCatalogId, setSelectedCatalogId] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectCatalog = (id: string) => {
    if (!id) return;
    const item = catalogItems.find((s: any) => (s.id?.toString() ?? '') === id);
    if (item && !selectedItems.includes(item.name)) {
      setSelectedItems(prev => [...prev, item.name]);
      setError(null);
    }
    // Reset so the same item can be re-selected next time
    setSelectedCatalogId('');
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
    // Jika No: Popup langsung konfirmasi status Complete tanpa sparepart
    onConfirm('');
  };

  const handleSubmitWithSpareparts = () => {
    if (selectedItems.length === 0) {
      setError('Wajib memilih atau mengisi minimal satu nama sparepart yang digunakan.');
      return;
    }
    onConfirm(selectedItems.join('; '));
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 15, 30, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2500,
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '520px',
          boxShadow: '0 20px 40px rgba(0, 31, 63, 0.2)',
          border: '1px solid rgba(0, 31, 63, 0.08)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: hasSpareparts ? '#f8fafc' : 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(46,91,255,0.04))',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: hasSpareparts ? 'rgba(46,91,255,0.1)' : 'rgba(16,185,129,0.15)',
              color: hasSpareparts ? '#2E5BFF' : '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {hasSpareparts ? <Wrench size={20} /> : <CheckCircle2 size={22} />}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
              {hasSpareparts ? 'Pencatatan Sparepart Diganti' : 'Konfirmasi Selesai (Complete)'}
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
              {ticketTitle ? `${ticketTitle} ${unitModel ? `â€¢ ${unitModel}` : ''}` : 'Kondisi servis akan diubah ke Complete'}
            </p>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {hasSpareparts === null || hasSpareparts === false ? (
            /* Pertanyaan Awal: Ada sparepart yang dipakai? */
            <div style={{ textAlign: 'center', padding: '12px 8px 8px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(255, 107, 0, 0.1)',
                  color: '#FF6B00',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <AlertCircle size={28} />
              </div>
              <h4 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                Apakah ada sparepart yang dipakai / diganti?
              </h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                Pilih <strong>Ada Sparepart</strong> jika ada penggantian komponen atau pengisian freon, atau <strong>Tidak Ada</strong> jika hanya perbaikan/pembersihan biasa.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={handleNo}
                  disabled={loading}
                  style={{
                    padding: '12px 18px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#FF6B00',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  Tidak Ada Sparepart
                </button>
                <button
                  type="button"
                  onClick={handleYes}
                  disabled={loading}
                  style={{
                    padding: '12px 18px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #2E5BFF, #1a3fd4)',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(46,91,255,0.25)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  Ada Sparepart
                </button>
              </div>
            </div>
          ) : (
            /* Form Pengisian Sparepart (Katalog Holic + Input Manual) */
            <>
              {error && (
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                  }}
                >
                  {error}
                </div>
              )}

              {/* Pilih dari Katalog Inventaris Holic */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                  Pilih Dari Inventaris Resmi Holic *
                </label>
                <CustomSelect
                  value={selectedCatalogId}
                  placeholder="— Ketik untuk cari suku cadang —"
                  showSearch={true}
                  fullWidth={true}
                  options={catalogItems.map((item: any) => ({
                    value: item.id?.toString() ?? '',
                    label: `[${item.category}] ${item.name} (${item.part_number || item.partNumber || '-'})`,
                  }))}
                  onChange={handleSelectCatalog}
                />
                <p style={{ margin: '5px 0 0', fontSize: '0.7rem', color: '#94a3b8' }}>
                  💡 Ketik nama / kategori untuk menyaring · klik item untuk langsung menambahkan
                </p>
              </div>

              {/* Atau Input Manual Suku Cadang Lainnya */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                  Atau Input Manual Nama Suku Cadang
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="Contoh: Freon R290 (150gr), Seal Kaca, dll"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustom();
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.88rem',
                      color: '#0f172a',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustom}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '9px 14px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#0f172a',
                      color: '#ffffff',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <Plus size={14} /> Tambah
                  </button>
                </div>
              </div>

              {/* Daftar Sparepart Terpilih */}
              <div>
                <span style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  Sparepart Yang Digunakan ({selectedItems.length}):
                </span>
                {selectedItems.length === 0 ? (
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px dashed #cbd5e1',
                      borderRadius: '8px',
                      padding: '16px',
                      textAlign: 'center',
                      fontSize: '0.82rem',
                      color: '#94a3b8',
                    }}
                  >
                    Belum ada sparepart yang ditambahkan. Silakan pilih dari dropdown di atas.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                    {selectedItems.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          background: '#f1f5f9',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          color: '#1e293b',
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>{item}</span>
                        <button
                          type="button"
                          onClick={() => handleRemove(item)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setHasSpareparts(null)}
                  disabled={loading}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Kembali
                </button>
                <button
                  type="button"
                  onClick={handleSubmitWithSpareparts}
                  disabled={loading}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(16,185,129,0.3)',
                  }}
                >
                  {loading ? 'Menyimpan...' : 'Simpan & Selesaikan Tiket'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

