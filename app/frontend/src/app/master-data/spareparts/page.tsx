'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Package, Plus, Upload, Search, Filter, Edit2, Trash2,
  CheckCircle2, AlertCircle, Wrench, RefreshCw, Download, FileText,
  ChevronDown, ChevronLeft, ChevronRight, ExternalLink, X, Eye,
  CheckCircle, AlertTriangle, FileCode2, Layers
} from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { sparepartApi } from '@/lib/api';
import styles from './spareparts.module.css';

interface Sparepart {
  id: string;
  part_number: string;
  name: string;
  category: string;
  default_price: number;
  description?: string;
  compatibility?: string;
  usage_count: number;
  last_used_at?: string | null;
}

interface UsageTicket {
  id: string;
  service_date?: string;
  complaint?: string;
  action_taken?: string;
  technician_name?: string;
  status?: string;
  created_at?: string;
}

const ROWS_PER_PAGE = 15;

// Wave SVG component - same as dashboard StatsGrid
function WaveBg({ idx, percentage }: { idx: number; percentage: number }) {
  const startY = 100 - (percentage * 60);
  const peakY  = 100 - (percentage * 85);
  const dipY   = 100 - (percentage * 40);
  const pathD  = `M0,${startY} C65,${peakY} 135,${dipY} 200,${startY} C265,${peakY} 335,${dipY} 400,${startY} L400,100 L0,100 Z`;

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 'inherit', zIndex: 0, pointerEvents: 'none' }}>
      <svg viewBox="0 0 400 100" style={{ position: 'absolute', bottom: 0, left: 0, width: '200%', height: '85%', opacity: 0.15, animation: `waveAnim ${7 + (idx % 3) * 2}s linear infinite reverse` }} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`sg-back-${idx}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.03" />
          </linearGradient>
        </defs>
        <path d={`M0,${startY + 6} C70,${dipY + 4} 130,${peakY + 6} 200,${startY + 6} C270,${dipY + 4} 330,${peakY + 6} 400,${startY + 6} L400,100 L0,100 Z`} fill={`url(#sg-back-${idx})`} />
      </svg>
      <svg viewBox="0 0 400 100" style={{ position: 'absolute', bottom: 0, left: 0, width: '200%', height: '95%', opacity: 0.22, animation: `waveAnim ${4.5 + (idx % 3) * 1.5}s linear infinite` }} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`sg-front-${idx}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path d={pathD} fill={`url(#sg-front-${idx})`} />
      </svg>
    </div>
  );
}

export default function MasterDataSparepartPage() {
  const [spareparts, setSpareparts] = useState<Sparepart[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Sparepart | null>(null);
  const [formData, setFormData] = useState({
    part_number: '',
    name: '',
    category: 'Refrigerasi',
    description: '',
    compatibility: '',
  });

  // Bulk Upload Modal
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkText, setBulkText] = useState('');
  const [bulkMode, setBulkMode] = useState<'upsert' | 'replace'>('upsert');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Usage Detail Modal
  const [usageModal, setUsageModal] = useState<{ sparepart: Sparepart; tickets: UsageTicket[] } | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [resParts, resCats] = await Promise.all([
        sparepartApi.getAll(selectedCategory, search),
        sparepartApi.getCategories(),
      ]);
      setSpareparts(resParts.data || []);
      setCategories(resCats.data || []);
      setCurrentPage(1);
    } catch (err: any) {
      console.error(err);
      showToast('Gagal memuat data sparepart', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      part_number: '',
      name: '',
      category: categories[0] || 'Refrigerasi',
      description: '',
      compatibility: '',
    });
    setShowModal(true);
  };

  const openEditModal = (item: Sparepart) => {
    setEditingItem(item);
    setFormData({
      part_number: item.part_number,
      name: item.name,
      category: item.category,
      description: item.description || '',
      compatibility: item.compatibility || '',
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await sparepartApi.update(editingItem.id, formData);
        showToast('Sparepart berhasil diperbarui');
      } else {
        await sparepartApi.create(formData);
        showToast('Sparepart baru berhasil ditambahkan');
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Gagal menyimpan sparepart', 'error');
    }
  };

  const handleDelete = async (item: Sparepart) => {
    if (!confirm(`Hapus sparepart "${item.name}" (${item.part_number})?`)) return;
    try {
      await sparepartApi.delete(item.id);
      showToast('Sparepart berhasil dihapus');
      loadData();
    } catch (err: any) {
      showToast('Gagal menghapus sparepart', 'error');
    }
  };

  const openUsageDetail = async (sp: Sparepart) => {
    if (sp.usage_count === 0) return;
    setUsageLoading(true);
    setUsageModal({ sparepart: sp, tickets: [] });
    try {
      const res = await sparepartApi.getUsageDetail(sp.id);
      setUsageModal({ sparepart: sp, tickets: res.data?.tickets || [] });
    } catch {
      showToast('Gagal memuat detail pemakaian', 'error');
      setUsageModal(null);
    } finally {
      setUsageLoading(false);
    }
  };

  const openBulkUploadModal = () => {
    setShowBulkModal(true);
    setBulkFile(null);
    setBulkText('');
    setBulkResult(null);
  };

  const handleFileSelected = (file: File) => {
    setBulkFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setBulkText((event.target?.result as string) || '');
    };
    reader.readAsText(file);
  };

  const handleProcessBulk = async () => {
    if (!bulkText.trim() && !bulkFile) {
      showToast('Pilih file CSV atau masukkan data terlebih dahulu', 'error');
      return;
    }
    setBulkLoading(true);
    setBulkResult(null);

    try {
      const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
      const items: any[] = [];

      lines.forEach((line, idx) => {
        if (idx === 0 && (line.toLowerCase().includes('part_number') || line.toLowerCase().includes('part number'))) return;
        const delimiter = line.includes(';') ? ';' : line.includes('\t') ? '\t' : ',';
        const cols = line.split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));

        if (cols.length >= 2) {
          items.push({
            part_number: cols[0],
            name: cols[1],
            category: cols[2] || 'Lain-lain',
            description: cols[3] || '',
          });
        }
      });

      if (items.length === 0) {
        setBulkResult({
          success: false,
          message: 'Format data tidak valid. Minimal harus terdapat kolom Part Number dan Nama Sparepart.',
        });
        setBulkLoading(false);
        return;
      }

      const res = await sparepartApi.bulkUpload(items);
      setBulkResult({
        success: true,
        summary: {
          total_rows: items.length,
          inserted: res.data?.createdCount ?? items.length,
          updated: res.data?.updatedCount ?? 0,
        },
        message: res.data?.message || `Berhasil mengunggah ${items.length} sparepart.`,
      });
      loadData();
    } catch (err: any) {
      setBulkResult({
        success: false,
        message: err.response?.data?.message || 'Gagal memproses bulk upload spareparts',
      });
    } finally {
      setBulkLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8," +
      "part_number,name,category,description\n" +
      "EBM-M4Q-10W,Motor Fan Kondensor EBM 10W,Fan & Blower,Motor fan 220V untuk kondensor showcase\n" +
      "EMB-R290-033,Kompresor Embraco 1/3 HP R290,Refrigerasi,Kompresor ramah lingkungan R290\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "template_master_sparepart.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pagination
  const totalPages = Math.ceil(spareparts.length / ROWS_PER_PAGE);
  const paginatedParts = spareparts.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  // Stats
  const totalParts = spareparts.length;
  const totalUsed = spareparts.reduce((acc, curr) => acc + (curr.usage_count || 0), 0);
  const mostUsed = [...spareparts].sort((a, b) => b.usage_count - a.usage_count)[0];

  const statsCards = [
    {
      label: 'Total Item Katalog',
      value: totalParts,
      icon: <Package size={22} />,
      max: 200,
    },
    {
      label: 'Total Terpasang di Servis',
      value: `${totalUsed}x`,
      rawValue: totalUsed,
      icon: <Wrench size={22} />,
      max: 100,
    },
    {
      label: 'Paling Sering Diganti',
      value: mostUsed && mostUsed.usage_count > 0 ? mostUsed.name : '—',
      rawValue: mostUsed?.usage_count || 0,
      icon: <CheckCircle2 size={22} />,
      max: 50,
      isText: true,
    },
  ];

  const formatDate = (d?: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className={styles.container}>
      <style>{`
        @keyframes waveAnim {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes spSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '24px',
          background: toast.type === 'success' ? '#059669' : '#dc2626',
          color: '#fff', padding: '12px 20px', borderRadius: '10px',
          zIndex: 3000, boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', gap: '8px',
          fontSize: '0.85rem', fontWeight: 600,
        }}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          <div>
            <h1 className={styles.title}>Master Data Sparepart</h1>
            <p className={styles.subtitle}>Katalog suku cadang resmi Holic &amp; pelacakan pemakaian di log servis</p>
          </div>
        </div>
      </div>

      {/* Stats Cards — dark navy + wave (same as dashboard) */}
      <div className={styles.statsBar}>
        {statsCards.map((sc, idx) => {
          const numVal = typeof sc.rawValue === 'number' ? sc.rawValue : (parseFloat(String(sc.value).replace(/[^0-9.]/g, '')) || 0);
          const rawRatio = sc.max > 0 ? numVal / sc.max : 0;
          const pct = 0.35 + Math.min(1, Math.max(0, rawRatio)) * 0.45;

          return (
            <div
              key={idx}
              className={styles.statCard}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '-4px -4px 12px rgba(255,255,255,0.06), 4px 4px 20px rgba(0,0,0,0.45)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '-4px -4px 10px rgba(255,255,255,0.04), 4px 4px 14px rgba(0,0,0,0.35)';
              }}
            >
              <WaveBg idx={idx} percentage={pct} />
              <div className={styles.statIcon}>{sc.icon}</div>
              <div className={styles.statInfo}>
                <h4>{sc.label}</h4>
                {sc.isText ? (
                  <p className={styles.statValueText}>{sc.value}</p>
                ) : (
                  <p>{sc.value}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Table Card with Toolbar (Image 2 theme) */}
      <div className={styles.tableCard}>
        <div className="dtToolbar dtToolbarDesktop" style={{ borderBottom: '1px solid rgba(79, 70, 229, 0.08)', padding: '16px 24px' }}>
          <div className="dtToolbarLeft" style={{ gap: '10px' }}>
            <div className="dtToolbarText">
              Show
              <CustomSelect
                options={[
                  { value: '15', label: '15' },
                  { value: '30', label: '30' },
                  { value: '50', label: '50' },
                ]}
                value={String(ROWS_PER_PAGE)}
                onChange={() => {}}
              />
              entries
            </div>

            <CustomSelect
              options={[
                { value: 'ALL', label: `Category (${totalParts})` },
                ...categories.map(c => ({ value: c, label: c })),
              ]}
              value={selectedCategory}
              onChange={(val) => setSelectedCategory(val)}
              placeholder="Category"
            />
          </div>

          <div className="dtToolbarRight" style={{ gap: '10px' }}>
            <form onSubmit={handleSearchSubmit} className="dtToolbarSearch">
              <input
                type="text"
                placeholder="Search sparepart or part number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="dtToolbarSearchInput"
              />
              <Search size={16} className="dtToolbarSearchIcon" />
            </form>

            <button
              type="button"
              className={styles.neuTemplateBtn}
              onClick={downloadTemplate}
              title="Download Template CSV"
            >
              <Download size={15} strokeWidth={2.2} />
              <span>Template CSV</span>
            </button>

            <button
              type="button"
              className={styles.neuBulkBtn}
              onClick={openBulkUploadModal}
              title="Bulk Upload Spareparts"
            >
              <Upload size={15} strokeWidth={2.2} />
              <span>Bulk Upload</span>
            </button>

            <button type="button" className="dtToolbarCreateBtn" onClick={openAddModal}>
              <Plus size={16} strokeWidth={2.5} />
              <span>Tambah Sparepart</span>
            </button>
          </div>
        </div>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
            <RefreshCw size={28} style={{ animation: 'waveAnim 1s linear infinite', marginBottom: '12px' }} />
            <p>Memuat katalog master sparepart...</p>
          </div>
        ) : spareparts.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
            <Package size={36} style={{ opacity: 0.5, marginBottom: '12px' }} />
            <p>Tidak ada sparepart ditemukan pada filter ini.</p>
          </div>
        ) : (
          <>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: '140px' }}>Part Number</th>
                  <th>Nama Sparepart</th>
                  <th style={{ width: '140px' }}>Kategori</th>
                  <th style={{ width: '140px' }}>Dipakai di Servis</th>
                  <th style={{ width: '90px', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedParts.map((sp) => (
                  <tr key={sp.id}>
                    <td>
                      <span className={styles.partBadge}>{sp.part_number}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--color-deep-navy)', fontSize: '0.85rem' }}>{sp.name}</div>
                      {sp.description && (
                        <div style={{ fontSize: '0.71rem', color: '#94a3b8', marginTop: '2px', lineHeight: 1.3 }}>{sp.description}</div>
                      )}
                    </td>
                    <td>
                      <span className={styles.categoryTag}>{sp.category}</span>
                    </td>
                    <td>
                      {sp.usage_count > 0 ? (
                        <button
                          className={styles.usageBtnActive}
                          onClick={() => openUsageDetail(sp)}
                          title="Klik untuk lihat detail tiket"
                        >
                          <Wrench size={11} />
                          <span>{sp.usage_count} Tiket</span>
                          <Eye size={11} style={{ opacity: 0.7 }} />
                        </button>
                      ) : (
                        <span className={styles.usageZero}>Belum Dipakai</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <button className={styles.actionBtn} onClick={() => openEditModal(sp)} title="Edit Sparepart">
                          <Edit2 size={13} />
                        </button>
                        <button className={`${styles.actionBtn} ${styles.actionBtnDelete}`} onClick={() => handleDelete(sp)} title="Hapus Sparepart">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Neumorphic Pagination — Identik Gambar 5 */}
            <div className={styles.neuPagination}>
              <div className={styles.paginationLeft}>
                <span className={styles.totalText}>
                  {loading ? 'Loading...' : totalParts === 0 ? 'No data' : `Showing ${((currentPage - 1) * ROWS_PER_PAGE) + 1}–${Math.min(currentPage * ROWS_PER_PAGE, totalParts)} of ${totalParts} spareparts`}
                </span>
              </div>
              <div className={styles.paginationCenter}>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || loading}
                  className={styles.pageArrow}
                  title="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className={styles.pageNumbers}>
                  {(() => {
                    const pageWindow = (() => {
                      if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
                      if (currentPage <= 3) return [1, 2, 3, 4, 5];
                      if (currentPage >= totalPages - 2) return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
                      return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
                    })();

                    return (
                      <>
                        {pageWindow[0] > 1 && (
                          <>
                            <button onClick={() => setCurrentPage(1)} className={styles.pageBtn}>1</button>
                            {pageWindow[0] > 2 && <span className={styles.ellipsis}>...</span>}
                          </>
                        )}
                        {pageWindow.map(page => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`${styles.pageBtn} ${currentPage === page ? styles.activePage : ''}`}
                          >
                            {page}
                          </button>
                        ))}
                        {pageWindow[pageWindow.length - 1] < totalPages && (
                          <>
                            {pageWindow[pageWindow.length - 1] < totalPages - 1 && <span className={styles.ellipsis}>...</span>}
                            <button onClick={() => setCurrentPage(totalPages)} className={styles.pageBtn}>{totalPages}</button>
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages || loading}
                  className={styles.pageArrow}
                  title="Next page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className={styles.paginationRight}>
                <div className={styles.perPageSelect}>{ROWS_PER_PAGE} / page</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal Add / Edit */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{editingItem ? 'Edit Master Sparepart' : 'Tambah Sparepart Baru'}</h3>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className={styles.formGroup}>
                <label>Kode Part Number *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: EBM-M4Q045-10W"
                  value={formData.part_number}
                  onChange={(e) => setFormData({ ...formData, part_number: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Nama Sparepart *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Motor Fan Kondensor EBM 10W"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Kategori *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="Refrigerasi">Refrigerasi</option>
                  <option value="Fan & Blower">Fan &amp; Blower</option>
                  <option value="Kelistrikan">Kelistrikan</option>
                  <option value="Kontroler">Kontroler</option>
                  <option value="Sensor">Sensor</option>
                  <option value="Hardware & Seal">Hardware &amp; Seal</option>
                  <option value="Pencahayaan">Pencahayaan</option>
                  <option value="Heater">Heater</option>
                  <option value="Lain-lain">Lain-lain</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Deskripsi / Spesifikasi</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan tambahan atau spek teknis..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.secondaryBtn} onClick={() => setShowModal(false)}>
                  Batal
                </button>
                <button type="submit" className={styles.primaryBtn}>
                  {editingItem ? 'Simpan Perubahan' : 'Tambah ke Katalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Bulk Upload — Neumorphic / Portal Theme (Matching Units & Clients) */}
      {showBulkModal && (
        <div className={styles.modalOverlay} onClick={() => { if (!bulkLoading) setShowBulkModal(false); }}>
          <div
            style={{
              background: '#fff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '540px',
              boxShadow: '0 24px 60px rgba(0, 31, 63, 0.25)',
              overflow: 'hidden',
              animation: 'spSlideUp 0.25s ease',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: '1px solid #f1f5f9',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: '#001F3F',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  boxShadow: '0 4px 10px rgba(0, 31, 63, 0.25)',
                }}>
                  <Package size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>Bulk Upload Spareparts</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Import katalog suku cadang dari file CSV</div>
                </div>
              </div>
              <button
                onClick={() => { if (!bulkLoading) setShowBulkModal(false); }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: '6px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              {!bulkResult ? (
                <>
                  {/* Dropzone File Upload */}
                  <label
                    style={{
                      display: 'block',
                      border: '2px dashed',
                      borderColor: bulkFile ? '#22c55e' : '#cbd5e1',
                      borderRadius: '14px',
                      padding: '26px 20px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: bulkFile ? '#f0fdf4' : '#f8fafc',
                      transition: 'all 0.25s ease',
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleFileSelected(file);
                    }}
                  >
                    <input
                      type="file"
                      accept=".csv,.txt"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelected(file);
                      }}
                    />
                    {bulkFile ? (
                      <>
                        <CheckCircle size={32} color="#22c55e" style={{ margin: '0 auto 8px' }} />
                        <div style={{ fontWeight: 700, color: '#166534', fontSize: '0.9rem' }}>{bulkFile.name}</div>
                        <div style={{ fontSize: '0.74rem', color: '#16a34a', marginTop: '2px' }}>
                          {(bulkFile.size / 1024).toFixed(1)} KB — Klik untuk ganti file CSV
                        </div>
                      </>
                    ) : (
                      <>
                        <Upload size={32} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                        <div style={{ fontWeight: 700, color: '#334155', fontSize: '0.9rem' }}>Klik untuk pilih file CSV</div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>
                          Format kolom: <code>part_number, name, category, description</code>
                        </div>
                      </>
                    )}
                  </label>

                  {/* Manual Paste Textarea Accordion */}
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                        Preview / Edit Isi CSV:
                      </span>
                      <button
                        type="button"
                        onClick={downloadTemplate}
                        style={{
                          background: 'none', border: 'none', color: '#2E5BFF',
                          fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer', padding: 0,
                          display: 'flex', alignItems: 'center', gap: '4px'
                        }}
                      >
                        <Download size={12} /> Unduh Template CSV
                      </button>
                    </div>

                    <textarea
                      rows={5}
                      style={{
                        width: '100%',
                        fontFamily: 'monospace',
                        fontSize: '0.76rem',
                        padding: '10px 12px',
                        border: '1.5px solid #e2e8f0',
                        borderRadius: '10px',
                        background: '#f8fafc',
                        color: 'var(--color-deep-navy)',
                        outline: 'none',
                        boxSizing: 'border-box',
                        resize: 'vertical',
                      }}
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                      placeholder="Atau tempel baris CSV langsung di sini..."
                    />
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button
                      type="button"
                      onClick={() => setShowBulkModal(false)}
                      style={{
                        flex: 1,
                        padding: '11px',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        background: '#fff',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: '#64748b',
                        cursor: 'pointer',
                      }}
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleProcessBulk}
                      disabled={bulkLoading || (!bulkFile && !bulkText.trim())}
                      style={{
                        flex: 2,
                        padding: '11px',
                        borderRadius: '10px',
                        border: 'none',
                        background: (!bulkFile && !bulkText.trim()) || bulkLoading ? '#e2e8f0' : '#001F3F',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: (!bulkFile && !bulkText.trim()) || bulkLoading ? '#94a3b8' : '#fff',
                        cursor: (!bulkFile && !bulkText.trim()) || bulkLoading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: (!bulkFile && !bulkText.trim()) || bulkLoading ? 'none' : '0 4px 12px rgba(0, 31, 63, 0.25)',
                        transition: 'all 0.2s',
                      }}
                    >
                      {bulkLoading ? (
                        <>
                          <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Memproses...
                        </>
                      ) : (
                        <>
                          <Upload size={15} /> Upload &amp; Proses
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                /* Result View (Same as Units Bulk Upload) */
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  {bulkResult.success ? (
                    <>
                      <CheckCircle size={46} color="#22c55e" style={{ margin: '0 auto 12px' }} />
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#166534', marginBottom: '4px' }}>
                        Upload Berhasil!
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 16px 0' }}>
                        {bulkResult.message}
                      </p>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '16px 0', textAlign: 'left' }}>
                        <div style={{ padding: '12px', borderRadius: '10px', background: '#f8fafc', border: '1px solid rgba(46,91,255,0.2)' }}>
                          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2E5BFF' }}>
                            {bulkResult.summary?.total_rows ?? 0}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>Total Item Terbaca</div>
                        </div>
                        <div style={{ padding: '12px', borderRadius: '10px', background: '#f8fafc', border: '1px solid rgba(34,197,94,0.2)' }}>
                          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#22c55e' }}>
                            {bulkResult.summary?.inserted ?? 0}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>Baru Ditambahkan</div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={46} color="#ef4444" style={{ margin: '0 auto 12px' }} />
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#dc2626', marginBottom: '6px' }}>
                        Upload Gagal
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '16px' }}>
                        {bulkResult.message}
                      </div>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => { setShowBulkModal(false); setBulkResult(null); }}
                    style={{
                      marginTop: '8px',
                      padding: '10px 32px',
                      borderRadius: '10px',
                      background: '#001F3F',
                      border: 'none',
                      color: '#fff',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Tutup
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Usage Detail */}
      {usageModal && (
        <div className={styles.modalOverlay} onClick={() => setUsageModal(null)}>
          <div className={styles.modalContent} style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 style={{ marginBottom: '2px' }}>Riwayat Pemakaian Sparepart</h3>
                <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className={styles.partBadge} style={{ fontSize: '0.72rem' }}>{usageModal.sparepart.part_number}</span>
                  <span>{usageModal.sparepart.name}</span>
                </div>
              </div>
              <button className={styles.closeBtn} onClick={() => setUsageModal(null)}>×</button>
            </div>

            {usageLoading ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
                <p style={{ margin: 0, fontSize: '0.85rem' }}>Memuat data tiket...</p>
              </div>
            ) : usageModal.tickets.length === 0 ? (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: '24px 0' }}>Tidak ada tiket ditemukan.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
                {usageModal.tickets.map((t, i) => (
                  <div key={t.id || i} style={{
                    background: '#f8fafc',
                    border: '1px solid rgba(0,31,63,0.07)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    animation: 'spSlideUp 0.2s ease',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontFamily: 'monospace', fontSize: '0.72rem', fontWeight: 700,
                          color: '#2E5BFF', background: 'rgba(46,91,255,0.08)',
                          padding: '2px 7px', borderRadius: '5px', border: '1px solid rgba(46,91,255,0.2)',
                        }}>
                          #{String(t.id).slice(0, 8).toUpperCase()}
                        </span>
                        {t.status && (
                          <span style={{
                            fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '10px',
                            background: t.status === 'SELESAI' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                            color: t.status === 'SELESAI' ? '#059669' : '#d97706',
                            border: `1px solid ${t.status === 'SELESAI' ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'}`,
                          }}>
                            {t.status}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{formatDate(t.service_date || t.created_at)}</span>
                    </div>
                    {t.complaint && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-deep-navy)', fontWeight: 600, marginBottom: '2px' }}>
                        {t.complaint}
                      </div>
                    )}
                    {t.technician_name && (
                      <div style={{ fontSize: '0.71rem', color: '#64748b' }}>
                        Teknisi: {t.technician_name}
                      </div>
                    )}
                    <button
                      style={{
                        marginTop: '8px', fontSize: '0.72rem', fontWeight: 700, color: '#2E5BFF',
                        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                        display: 'flex', alignItems: 'center', gap: '4px',
                      }}
                      onClick={() => window.open(`/service?ticket=${t.id}`, '_blank')}
                    >
                      <ExternalLink size={11} /> Lihat Tiket Servis
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
