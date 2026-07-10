'use client';

import { useState } from 'react';
import { Upload, X, CheckCircle, AlertTriangle, Loader } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ClientsBulkUploadModal({ open, onClose, onSuccess }: Props) {
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkMode, setBulkMode] = useState<'upsert' | 'replace'>('upsert');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<any>(null);

  const handleClose = () => {
    onClose();
    setBulkResult(null);
    setBulkFile(null);
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) return;
    setBulkLoading(true);
    setBulkResult(null);
    try {
      const { clientApi } = await import('@/lib/api');
      const res = await clientApi.bulkUpload(bulkFile, bulkMode);
      setBulkResult(res.data);
      onSuccess();
    } catch (e: any) {
      setBulkResult({ success: false, message: e.response?.data?.message || e.message });
    } finally {
      setBulkLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '520px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.2)', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid #f1f5f9',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: '#001F3F', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Upload size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>Bulk Upload Klien</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Import data klien dari file CSV</div>
            </div>
          </div>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {!bulkResult ? (
            <>
              <label style={{
                display: 'block', border: '2px dashed #e2e8f0', borderRadius: '12px',
                padding: '32px 20px', textAlign: 'center', cursor: 'pointer',
                background: bulkFile ? '#f0fdf4' : '#fafafa',
                borderColor: bulkFile ? '#22c55e' : '#e2e8f0',
                transition: 'all 0.2s',
              }}>
                <input
                  type="file" accept=".csv" style={{ display: 'none' }}
                  onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                />
                {bulkFile ? (
                  <>
                    <CheckCircle size={32} color="#22c55e" style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontWeight: 600, color: '#166534', fontSize: '0.9rem' }}>{bulkFile.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#16a34a' }}>
                      {(bulkFile.size / 1024).toFixed(1)} KB — Klik untuk ganti file
                    </div>
                  </>
                ) : (
                  <>
                    <Upload size={32} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontWeight: 600, color: '#475569', fontSize: '0.9rem' }}>Klik untuk pilih file CSV</div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>
                      Format kolom (sesuai tabel): Nama Klien, BP Code, Lokasi Pusat, Kontak / Email
                    </div>
                  </>
                )}
              </label>

              <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Mode Import</div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {(['upsert', 'replace'] as const).map(m => (
                    <label key={m} style={{
                      flex: 1, display: 'flex', alignItems: 'flex-start', gap: '10px',
                      padding: '12px', borderRadius: '10px', cursor: 'pointer',
                      border: `2px solid ${bulkMode === m ? '#001F3F' : '#e2e8f0'}`,
                      background: bulkMode === m ? '#f8fafc' : '#fff',
                      transition: 'all 0.2s',
                    }}>
                      <input
                        type="radio" name="bulkMode" value={m}
                        checked={bulkMode === m} onChange={() => setBulkMode(m)}
                        style={{ marginTop: '2px', accentColor: '#001F3F' }}
                      />
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>
                          {m === 'upsert' ? 'Update & Tambah' : 'Replace (Ganti Semua)'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '2px', lineHeight: 1.4 }}>
                          {m === 'upsert'
                            ? 'Update klien yang sudah ada, tambah yang baru. Data lama tetap disimpan.'
                            : '⚠️ Update & tambah klien dari CSV, lalu HAPUS klien yang tidak ada di CSV.'}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button onClick={handleClose} style={{
                  flex: 1, padding: '11px', borderRadius: '10px',
                  border: '1px solid #e2e8f0', background: '#fff',
                  fontSize: '0.875rem', fontWeight: 600, color: '#64748b', cursor: 'pointer',
                }}>
                  Batal
                </button>
                <button onClick={handleBulkUpload} disabled={!bulkFile || bulkLoading} style={{
                  flex: 2, padding: '11px', borderRadius: '10px', border: 'none',
                  background: !bulkFile || bulkLoading ? '#e2e8f0' : '#001F3F',
                  fontSize: '0.875rem', fontWeight: 700,
                  color: !bulkFile || bulkLoading ? '#94a3b8' : '#fff',
                  cursor: !bulkFile || bulkLoading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'all 0.2s',
                }}>
                  {bulkLoading ? (
                    <>Mengupload & memproses...</>
                  ) : (
                    <><Upload size={16} /> Upload & Proses</>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              {bulkResult.success ? (
                <>
                  <CheckCircle size={48} color="#22c55e" style={{ margin: '0 auto 12px' }} />
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#166534', marginBottom: '4px' }}>Upload Berhasil!</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '16px 0', textAlign: 'left' }}>
                    {[
                      { label: 'Total Diproses', value: bulkResult.summary?.total_rows ?? 0, color: '#3b82f6' },
                      { label: 'Klien Baru', value: bulkResult.summary?.inserted ?? 0, color: '#22c55e' },
                      { label: 'Diperbarui', value: bulkResult.summary?.updated ?? 0, color: '#f59e0b' },
                      { label: 'Dihapus', value: bulkResult.summary?.deleted ?? 0, color: '#c30000ff' },
                    ].map(s => (
                      <div key={s.label} style={{
                        padding: '12px', borderRadius: '10px', background: '#f8fafc',
                        border: `1px solid ${s.color}30`,
                      }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  {bulkResult.errors?.length > 0 && (
                    <div style={{
                      background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '10px',
                      padding: '12px', textAlign: 'left', marginTop: '8px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#c2410c', fontSize: '0.8rem', marginBottom: '6px' }}>
                        <AlertTriangle size={14} /> {bulkResult.errors.length} Error
                      </div>
                      {bulkResult.errors.slice(0, 5).map((e: string, i: number) => (
                        <div key={i} style={{ fontSize: '0.72rem', color: '#92400e', marginBottom: '2px' }}>• {e}</div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <AlertTriangle size={48} color="#ef4444" style={{ margin: '0 auto 12px' }} />
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#dc2626', marginBottom: '8px' }}>Upload Gagal</div>
                  <div style={{ fontSize: '0.82rem', color: '#64748b' }}>{bulkResult.message}</div>
                </>
              )}
              <button onClick={handleClose} style={{
                marginTop: '20px', padding: '10px 28px', borderRadius: '10px',
                background: '#001F3F', border: 'none', color: '#fff',
                fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer',
              }}>
                Tutup
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
