'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { serviceLogApi, unitApi, partnerApi } from '@/lib/api';
import { 
  Wrench, ClipboardCheck, Calendar, ShieldAlert, Plus, Search, 
  X, Loader2, FileText, CheckCircle2, User, AlertTriangle, HelpCircle,
  MessageSquare
} from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import styles from './service.module.css';
import StatsGrid from '@/components/dashboard/StatsGrid';

const parseIssueDescription = (desc: string) => {
  if (!desc) return { issue: '-', contact: null };
  
  // Format 1: issue (Kontak: name - phone)
  const kontakMatch = desc.match(/(.*)\s*\(Kontak:\s*([^-]+)-\s*([^)]+)\)/i);
  if (kontakMatch) {
    return {
      issue: kontakMatch[1].trim(),
      contact: { name: kontakMatch[2].trim(), phone: kontakMatch[3].trim() }
    };
  }
  
  // Format 2: [Smart Routing Request] Contact: name (phone). Issue: notes
  const legacyMatch = desc.match(/\[Smart Routing Request\]\s*Contact:\s*([^(]+)\(([^)]+)\)\.\s*Issue:\s*(.*)/i);
  if (legacyMatch) {
    return {
      issue: legacyMatch[3].trim(),
      contact: { name: legacyMatch[1].trim(), phone: legacyMatch[2].trim() }
    };
  }
  
  // Fallback
  return { issue: desc, contact: null };
};

const parseDetailedIssue = (desc: string) => {
  const result = {
    category: '-',
    subcategory: '-',
    remark: '-',
    contactName: '-',
    contactPhone: '-'
  };
  if (!desc) return result;

  // Extract contact first
  const kontakMatch = desc.match(/(.*)\s*\(Kontak:\s*([^-]+)-\s*([^)]+)\)/i);
  let issuePart = desc;
  if (kontakMatch) {
    issuePart = kontakMatch[1].trim();
    result.contactName = kontakMatch[2].trim();
    result.contactPhone = kontakMatch[3].trim();
  } else {
    // Try legacy format
    const legacyMatch = desc.match(/\[Smart Routing Request\]\s*Contact:\s*([^(]+)\(([^)]+)\)\.\s*Issue:\s*(.*)/i);
    if (legacyMatch) {
      result.contactName = legacyMatch[1].trim();
      result.contactPhone = legacyMatch[2].trim();
      issuePart = legacyMatch[3].trim();
    }
  }

  // Parse issuePart: "[Main - Sub] Remarks"
  const bracketMatch = issuePart.match(/^\[([^\]-]+)(?:\s*-\s*([^\]]+))?\]\s*(.*)/);
  if (bracketMatch) {
    result.category = bracketMatch[1].trim();
    result.subcategory = bracketMatch[2] ? bracketMatch[2].trim() : '-';
    result.remark = bracketMatch[3] ? bracketMatch[3].trim() : '-';
  } else {
    result.remark = issuePart;
  }

  return result;
};

export default function ServicePage() {
  const router = useRouter();

  // Detail Modal state
  const [selectedDetailLog, setSelectedDetailLog] = useState<any | null>(null);
  const [isEditingDetail, setIsEditingDetail] = useState(false);
  const [editPartnerId, setEditPartnerId] = useState('');
  const [editTechnician, setEditTechnician] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editActionTaken, setEditActionTaken] = useState('');

  const startEditingDetail = () => {
    if (!selectedDetailLog) return;
    setEditPartnerId(selectedDetailLog.partner?.id || '');
    setEditTechnician(selectedDetailLog.technician_name || '');
    setEditStatus(selectedDetailLog.status || 'PENDING');
    setEditDate(selectedDetailLog.service_date ? selectedDetailLog.service_date.split('T')[0] : '');
    setEditActionTaken(selectedDetailLog.action_taken || '');
    setIsEditingDetail(true);
  };

  const handleSaveDetailEdit = async () => {
    if (!selectedDetailLog) return;
    try {
      setSubmitting(true);
      const { data: updatedLog } = await serviceLogApi.update(selectedDetailLog.id, {
        partnerId: editPartnerId || null,
        technician_name: editTechnician,
        status: editStatus,
        service_date: editDate,
        action_taken: editActionTaken
      });

      // Update local logs list
      setLogs(prev => prev.map(log => log.id === updatedLog.id ? updatedLog : log));
      
      // Update selectedDetailLog
      setSelectedDetailLog(updatedLog);
      setIsEditingDetail(false);
    } catch (err: any) {
      console.error(err);
      alert('Gagal mengupdate detail log servis.');
    } finally {
      setSubmitting(false);
    }
  };

  // Core data states
  const [logs, setLogs] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [pageSize, setPageSize] = useState(20);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [actionTaken, setActionTaken] = useState('Dalam proses pengecekan teknis.');
  const [technicianName, setTechnicianName] = useState('Menunggu Alokasi');
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState('PENDING');

  // Load all logs, units, and partners on mount
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load logs
      const logsRes = await serviceLogApi.findAll(1, 200);
      if (logsRes.data && Array.isArray(logsRes.data.data)) {
        setLogs(logsRes.data.data);
      } else if (Array.isArray(logsRes.data)) {
        setLogs(logsRes.data);
      }

      // Load units for dropdown
      const unitsRes = await unitApi.findAll(1, 1000);
      if (unitsRes.data && Array.isArray(unitsRes.data.data)) {
        setUnits(unitsRes.data.data);
      } else if (Array.isArray(unitsRes.data)) {
        setUnits(unitsRes.data);
      }

      // Load partners for dropdown
      const partnersRes = await partnerApi.findAll();
      if (Array.isArray(partnersRes.data)) {
        setPartners(partnersRes.data);
      }
    } catch (e: any) {
      console.error('Failed to load service dashboard data:', e);
      setError('Gagal memuat data dashboard servis. Pastikan server backend Anda menyala.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Intercept submit for client-side validation & trigger custom confirmation modal
  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedUnitId) {
      setFormError('Pilih Unit yang bermasalah terlebih dahulu.');
      return;
    }
    if (!issueDescription.trim()) {
      setFormError('Tuliskan Deskripsi Kendala / Problem yang dikeluhkan.');
      return;
    }
    if (!actionTaken.trim()) {
      setFormError('Tuliskan Tindakan / Penanganan Awal yang dilakukan.');
      return;
    }

    setIsConfirmModalOpen(true);
  };

  // Perform actual API creation
  const handleActualSubmit = async () => {
    setIsConfirmModalOpen(false);
    setSubmitting(true);
    setFormError(null);

    const payload = {
      unitId: selectedUnitId,
      partnerId: selectedPartnerId || undefined,
      issue_description: issueDescription.trim(),
      action_taken: actionTaken.trim(),
      status: status,
      technician_name: technicianName.trim() || undefined,
    };

    try {
      await serviceLogApi.create(payload);
      
      // Reset form states
      setSelectedUnitId('');
      setSelectedPartnerId('');
      setIssueDescription('');
      setActionTaken('Dalam proses pengecekan teknis.');
      setTechnicianName('Menunggu Alokasi');
      setStatus('PENDING');
      setIsModalOpen(false);

      // Reload dashboard logs
      await fetchData();
    } catch (err: any) {
      console.error('Submit service log error:', err);
      const errMsg = err.response?.data?.message;
      if (Array.isArray(errMsg)) {
        setFormError(errMsg.join(' | '));
      } else {
        setFormError(errMsg || 'Gagal merekam log servis baru. Silakan coba lagi.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Filter logs based on search query & status filter
  const filteredLogs = logs.filter(log => {
    const matchesStatus = statusFilter === 'ALL' || log.status === statusFilter;
    
    const sn = log.unit?.serial_number?.toLowerCase() || '';
    const model = log.unit?.model_name?.toLowerCase() || '';
    const partner = log.partner?.partner_name?.toLowerCase() || '';
    const issue = log.issue_description?.toLowerCase() || '';
    const tech = log.technician_name?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();

    const matchesSearch = sn.includes(query) || 
                          model.includes(query) || 
                          partner.includes(query) || 
                          issue.includes(query) || 
                          tech.includes(query);

    return matchesStatus && matchesSearch;
  }).slice(0, pageSize);

  // Calculate statistics
  const totalRequests = logs.length;
  const pendingRequests = logs.filter(l => l.status === 'PENDING').length;
  const completedRequests = logs.filter(l => l.status === 'COMPLETED').length;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.pageHeader}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Daftar Permintaan Servis</h1>
          <p className={styles.subtitle}>Rekap permasalahan dan permintaan service masuk dari Customer.</p>
        </div>
      </header>

      {/* Mobile Submenu Pill Tabs */}
      <div className="mobile-sub-tabs">
        <button 
          className="mobile-sub-tab active"
          onClick={() => router.push('/service')}
        >
          Log Servis
        </button>
        <button 
          className="mobile-sub-tab"
          onClick={() => router.push('/service/planning')}
        >
          Rencana Servis
        </button>
      </div>

      {/* Stats Summary Grid */}
      <StatsGrid 
        loading={loading}
        items={[
          { label: 'Total Permintaan', value: loading ? '...' : totalRequests, max: 1000, icon: FileText, accent: '#64748b' },
          { label: 'Antrean Pending', value: loading ? '...' : pendingRequests, max: 100, icon: AlertTriangle, accent: '#FF6B00' },
          { label: 'Selesai Ditangani', value: loading ? '...' : completedRequests, max: 1000, icon: CheckCircle2, accent: '#00C48C' }
        ]} 
      />

      {/* Enterprise Datatable Toolbar */}
      <div className="dtToolbar">
        <div className="dtToolbarLeft">
          <div className="dtToolbarText">
            Show
            <CustomSelect
              options={[
                { value: '20', label: '20' },
                { value: '50', label: '50' },
                { value: '100', label: '100' }
              ]}
              value={pageSize.toString()}
              onChange={(val) => setPageSize(parseInt(val, 10))}
            />
            entries
          </div>

          <CustomSelect
            options={[
              { value: 'ALL', label: 'Semua Status' },
              { value: 'PENDING', label: 'PENDING' },
              { value: 'COMPLETED', label: 'COMPLETED' },
              { value: 'CANCELLED', label: 'CANCELLED' }
            ]}
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            placeholder="Filter Status..."
          />
        </div>

        <div className="dtToolbarRight">
          <div className="dtToolbarSearch">
            <input 
              type="text" 
              placeholder="Cari SN, model, partner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="dtToolbarSearchInput"
            />
            <Search size={16} className="dtToolbarSearchIcon" />
          </div>
          <button className="dtToolbarCreateBtn" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} strokeWidth={2.5} />
            Catat Permintaan Baru
          </button>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Loader2 size={36} className={styles.spin} style={{ color: 'var(--color-cobalt-blue)' }} />
        </div>
      ) : error ? (
        <div className={styles.errorAlert}>{error}</div>
      ) : filteredLogs.length === 0 ? (
        <div className={styles.tableContainer}>
          <div className={styles.emptyState}>
            <Wrench size={48} style={{ color: 'var(--color-space-grey)', opacity: 0.4 }} />
            <h3 className={styles.emptyTitle}>Belum Ada Log Servis</h3>
            <p className={styles.emptyDesc}>Tidak ada riwayat permintaan servis yang sesuai dengan filter pencarian Anda.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className={`${styles.tableContainer} ${styles.desktopView}`}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>LOG ID</th>
                  <th>Unit / Mesin</th>
                  <th>Mitra Regional</th>
                  <th>Deskripsi Kendala (Problem)</th>
                  <th>Tindakan / Hasil</th>
                  <th>Tgl Servis</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} onClick={() => setSelectedDetailLog(log)} style={{ cursor: 'pointer' }}>
                    <td className={styles.logId}>{log.id}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className={styles.unitLink} onClick={() => router.push(`/id/${log.unit?.qr_token}`)}>
                        <span className={styles.unitModel}>{log.unit?.model_name || 'Unit Tidak Diketahui'}</span>
                        <span className={styles.unitSn}>{log.unit?.serial_number}</span>
                      </div>
                    </td>
                    <td>
                      {log.partner ? (
                        <div>
                          <span className={styles.partnerName}>{log.partner.partner_name}</span>
                          <span className={styles.partnerCity}> ({log.partner.city})</span>
                        </div>
                      ) : (
                        <span style={{ fontStyle: 'italic', color: 'var(--color-space-grey)', fontSize: '0.85rem' }}>
                          HQ (Manual Routing)
                        </span>
                      )}
                    </td>
                    <td>
                      {(() => {
                        const { issue, contact } = parseIssueDescription(log.issue_description);
                        return (
                          <div className={styles.issueCell}>
                            <span className={styles.issueTextMain} title={issue}>
                              {issue}
                            </span>
                            {contact && (
                              <span className={styles.issueContactSub}>
                                {contact.name} ({contact.phone})
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td>
                      <span className={styles.issueText} title={log.action_taken}>
                        {log.action_taken}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--color-deep-navy)' }}>
                        {formatDate(log.service_date)}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${
                        log.status === 'PENDING' ? styles.badgePending :
                        log.status === 'COMPLETED' ? styles.badgeCompleted :
                        styles.badgeCancelled
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className={styles.mobileView}>
            {filteredLogs.map((log) => (
              <div key={log.id} className={styles.mobileCard} onClick={() => setSelectedDetailLog(log)}>
                <div className={styles.mobileCardHeader}>
                  <span className={styles.mobileLogId}>{log.id}</span>
                  <span className={`${styles.badge} ${
                    log.status === 'PENDING' ? styles.badgePending :
                    log.status === 'COMPLETED' ? styles.badgeCompleted :
                    styles.badgeCancelled
                  }`}>
                    {log.status}
                  </span>
                </div>
                
                <div className={styles.mobileCardBody}>
                  <div className={styles.mobileCardRow}>
                    <span className={styles.mobileLabel}>Unit / Mesin</span>
                    <div className={styles.mobileUnitInfo}>
                      <span className={styles.mobileUnitModel}>{log.unit?.model_name || 'Unit Tidak Diketahui'}</span>
                      <span className={styles.mobileUnitSn}>SN: {log.unit?.serial_number || '-'}</span>
                    </div>
                  </div>

                  <div className={styles.mobileCardRow}>
                    <span className={styles.mobileLabel}>Mitra Regional</span>
                    <span className={styles.mobileValue}>
                      {log.partner ? `${log.partner.partner_name} (${log.partner.city})` : 'HQ (Manual Routing)'}
                    </span>
                  </div>

                  <div className={styles.mobileCardRow}>
                    <span className={styles.mobileLabel}>Deskripsi Kendala</span>
                    <span className={styles.mobileValueIssue}>
                      {parseIssueDescription(log.issue_description).issue}
                    </span>
                  </div>

                  <div className={styles.mobileCardRow}>
                    <span className={styles.mobileLabel}>Tanggal Servis</span>
                    <span className={styles.mobileValueDate}>{formatDate(log.service_date)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Record New Call Modal Overlay */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <form onSubmit={handlePreSubmit} autoComplete="off" className={styles.modalCard}>
            <header className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Catat Permintaan Servis Baru</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className={styles.closeBtn}>
                <X size={20} />
              </button>
            </header>

            <div className={styles.modalBody}>
              {formError && <div className={styles.errorAlert}>{formError}</div>}

              <div className={styles.formGrid}>
                {/* Unit Selector */}
                <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                  <label>Pilih Unit / Mesin Bermasalah *</label>
                  <CustomSelect 
                    value={selectedUnitId} 
                    onChange={(val) => setSelectedUnitId(val)}
                    options={[
                      { value: '', label: '— Cari & Pilih Unit —' },
                      ...units.map((u) => ({
                        value: u.id,
                        label: `${u.model_name} (SN: ${u.serial_number}) - ${u.current_client?.company_name}`
                      }))
                    ]}
                    placeholder="— Cari & Pilih Unit —"
                  />
                </div>

                {/* Partner Selector */}
                <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                  <label>Mitra Regional / Teknisi Penanggungjawab</label>
                  <CustomSelect 
                    value={selectedPartnerId} 
                    onChange={(val) => setSelectedPartnerId(val)}
                    options={[
                      { value: '', label: '— Gunakan HQ (Manual Routing) —' },
                      ...partners.map((p) => ({
                        value: p.id,
                        label: `${p.partner_name} (${p.city})`
                      }))
                    ]}
                    placeholder="— Gunakan HQ (Manual Routing) —"
                  />
                </div>

                {/* Issue Description */}
                <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                  <label>Deskripsi Kendala (Problem dari Chat WA/Telp) *</label>
                  <textarea 
                    value={issueDescription} 
                    onChange={(e) => setIssueDescription(e.target.value)}
                    placeholder="Contoh: Lampu showcase kedip-kedip dan suhu tidak mau turun di bawah 12 derajat."
                    autoComplete="new-password"
                    required
                  />
                </div>

                {/* Action Taken */}
                <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                  <label>Tindakan Awal / Status Investigasi *</label>
                  <textarea 
                    value={actionTaken} 
                    onChange={(e) => setActionTaken(e.target.value)}
                    placeholder="Contoh: Menghubungi mitra regional terdekat untuk alokasi kunjungan teknisi."
                    autoComplete="new-password"
                    required
                  />
                </div>

                {/* Technician Name */}
                <div className={styles.formGroup}>
                  <label>Nama Teknisi</label>
                  <input 
                    type="text" 
                    value={technicianName} 
                    onChange={(e) => setTechnicianName(e.target.value)}
                    placeholder="Contoh: Ahmad"
                    autoComplete="new-password"
                  />
                </div>

                {/* Status */}
                <div className={styles.formGroup}>
                  <label>Status Awal</label>
                  <CustomSelect 
                    value={status} 
                    onChange={(val) => setStatus(val)}
                    options={[
                      { value: 'PENDING', label: 'PENDING (Antrean)' },
                      { value: 'COMPLETED', label: 'COMPLETED (Selesai)' },
                      { value: 'CANCELLED', label: 'CANCELLED (Batal)' }
                    ]}
                    placeholder="Status Awal"
                  />
                </div>
              </div>
            </div>

            <footer className={styles.modalFooter}>
              <button type="button" onClick={() => setIsModalOpen(false)} className={styles.cancelBtn}>
                Batal
              </button>
              <button type="submit" disabled={submitting} className={styles.saveBtn}>
                {submitting ? (
                  <>
                    <Loader2 size={16} className={styles.spin} style={{ marginRight: '8px', display: 'inline' }} />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <span>Simpan Permintaan</span>
                )}
              </button>
            </footer>
          </form>
        </div>
      )}

      {/* Elegant Custom Confirmation Modal for Service Log */}
      {isConfirmModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard} style={{ maxWidth: '440px', padding: '32px', textAlign: 'center', alignItems: 'center', gap: '20px' }}>
            <div className={styles.modalIcon} style={{ color: 'var(--color-cobalt-blue)', background: 'rgba(46, 91, 255, 0.08)', padding: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HelpCircle size={32} />
            </div>
            <h3 className={styles.modalTitle}>Simpan Permintaan Servis?</h3>
            <p className={styles.modalDescription} style={{ fontSize: '0.95rem', color: 'var(--color-space-grey)', lineHeight: 1.5, fontWeight: 500 }}>
              Apakah Anda yakin ingin merekam permintaan servis ini ke dalam database portal? Permintaan ini akan secara resmi menggantikan rekap Google Drive.
            </p>
            <div className={styles.modalActionRow} style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '8px' }}>
              <button 
                type="button" 
                onClick={() => setIsConfirmModalOpen(false)} 
                className={styles.cancelBtn}
                style={{ flex: 1 }}
              >
                Batal
              </button>
              <button 
                type="button" 
                onClick={handleActualSubmit} 
                className={styles.saveBtn}
                style={{ flex: 1 }}
              >
                Ya, Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedDetailLog && (
        <div className={styles.modalOverlay} onClick={() => { setSelectedDetailLog(null); setIsEditingDetail(false); }}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <header className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h3 className={styles.modalTitle}>Detail Permintaan Servis #{selectedDetailLog.id}</h3>
                <span className={`${styles.badge} ${
                  selectedDetailLog.status === 'PENDING' ? styles.badgePending :
                  selectedDetailLog.status === 'COMPLETED' ? styles.badgeCompleted :
                  styles.badgeCancelled
                }`}>
                  {selectedDetailLog.status}
                </span>
              </div>
              <button type="button" onClick={() => { setSelectedDetailLog(null); setIsEditingDetail(false); }} className={styles.closeBtn}>
                <X size={20} />
              </button>
            </header>

            <div className={styles.modalBody}>
              {/* Section 1: Unit & Mesin */}
              <div className={styles.detailSection}>
                <h4 className={styles.detailSectionTitle}>Unit / Mesin</h4>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Model Mesin</span>
                    <span className={styles.detailValue}>{selectedDetailLog.unit?.model_name || '-'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Serial Number</span>
                    <span className={styles.detailValuePrimary}>{selectedDetailLog.unit?.serial_number || '-'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Pemilik (Client)</span>
                    <span className={styles.detailValue}>{selectedDetailLog.unit?.current_client?.company_name || 'Umum / Belum Terikat'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Lokasi Kota Unit</span>
                    <span className={styles.detailValue}>
                      {selectedDetailLog.unit?.current_client?.city || selectedDetailLog.unit?.specs?.city || 'Jakarta'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Kendala & Pelapor */}
              {(() => {
                const parsed = parseDetailedIssue(selectedDetailLog.issue_description);
                return (
                  <div className={styles.detailSection}>
                    <h4 className={styles.detailSectionTitle}>Laporan Kendala & Pelapor</h4>
                    <div className={styles.detailGrid}>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Kategori Kendala</span>
                        <span className={styles.detailValue}>{parsed.category}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Sub-Kategori</span>
                        <span className={styles.detailValue}>{parsed.subcategory}</span>
                      </div>
                      <div className={styles.detailItemFull}>
                        <span className={styles.detailLabel}>Catatan Kerusakan (Remark)</span>
                        <span className={styles.detailValue}>{parsed.remark}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Nama Kontak Pelapor</span>
                        <span className={styles.detailValue}>{parsed.contactName}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>No. Handphone</span>
                        <span className={styles.detailValue}>{parsed.contactPhone}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Section 3: Smart Routing & Penanganan */}
              <div className={styles.detailSection}>
                <h4 className={styles.detailSectionTitle}>Rute Penugasan & Tindakan</h4>
                <div className={styles.detailGrid}>
                  {isEditingDetail ? (
                    <>
                      <div className={styles.detailItemFull}>
                        <span className={styles.detailLabel}>Mitra Regional Terpilih</span>
                        <CustomSelect 
                          value={editPartnerId} 
                          onChange={(val) => setEditPartnerId(val)}
                          options={[
                            { value: '', label: 'HQ (Manual Routing)' },
                            ...partners.map((p) => ({
                              value: p.id,
                              label: `${p.partner_name} (${p.city})`
                            }))
                          ]}
                          placeholder="Pilih Mitra"
                        />
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Nama Teknisi</span>
                        <input 
                          type="text"
                          value={editTechnician}
                          onChange={(e) => setEditTechnician(e.target.value)}
                          style={{ width: '100%', marginTop: '4px', padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '0.9rem', color: 'var(--color-deep-navy)', outline: 'none' }}
                          placeholder="Masukkan nama teknisi"
                        />
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Tanggal Servis</span>
                        <input 
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          style={{ width: '100%', marginTop: '4px', padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '0.9rem', color: 'var(--color-deep-navy)', outline: 'none' }}
                        />
                      </div>
                      <div className={styles.detailItemFull}>
                        <span className={styles.detailLabel}>Status Servis</span>
                        <CustomSelect 
                          value={editStatus} 
                          onChange={(val) => setEditStatus(val)}
                          options={[
                            { value: 'PENDING', label: 'PENDING (Antrean)' },
                            { value: 'COMPLETED', label: 'COMPLETED (Selesai)' },
                            { value: 'CANCELLED', label: 'CANCELLED (Batal)' }
                          ]}
                          placeholder="Pilih Status"
                        />
                      </div>
                      <div className={styles.detailItemFull}>
                        <span className={styles.detailLabel}>Tindakan / Hasil Servis</span>
                        <textarea 
                          value={editActionTaken}
                          onChange={(e) => setEditActionTaken(e.target.value)}
                          style={{ width: '100%', marginTop: '4px', padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '0.9rem', color: 'var(--color-deep-navy)', outline: 'none', minHeight: '80px', fontFamily: 'inherit', resize: 'vertical' }}
                          placeholder="Tulis tindakan atau hasil pemeriksaan teknis..."
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={styles.detailItemFull}>
                        <span className={styles.detailLabel}>Mitra Regional Terpilih</span>
                        {selectedDetailLog.partner ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span className={styles.detailValue}>
                              {selectedDetailLog.partner.partner_name} ({selectedDetailLog.partner.city})
                            </span>
                            {selectedDetailLog.partner.contact_wa && (
                              <a 
                                href={`https://wa.me/${selectedDetailLog.partner.contact_wa}`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className={styles.waBtn}
                              >
                                <MessageSquare size={14} />
                                <span>Hubungi WA Mitra: {selectedDetailLog.partner.contact_wa}</span>
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className={styles.detailValue} style={{ fontStyle: 'italic', color: 'var(--color-space-grey)' }}>
                            HQ (Manual Routing)
                          </span>
                        )}
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Nama Teknisi</span>
                        <span className={styles.detailValue}>{selectedDetailLog.technician_name || 'Menunggu Alokasi'}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Tanggal Servis</span>
                        <span className={styles.detailValue}>{formatDate(selectedDetailLog.service_date)}</span>
                      </div>
                      <div className={styles.detailItemFull}>
                        <span className={styles.detailLabel}>Tindakan / Hasil Servis</span>
                        <span className={styles.detailValue}>{selectedDetailLog.action_taken || 'Menunggu peninjauan teknisi.'}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <footer className={styles.modalFooter}>
              {isEditingDetail ? (
                <>
                  <button 
                    type="button" 
                    onClick={() => setIsEditingDetail(false)} 
                    className={styles.cancelBtn}
                    disabled={submitting}
                  >
                    Batal
                  </button>
                  <button 
                    type="button" 
                    onClick={handleSaveDetailEdit} 
                    className={styles.saveBtn}
                    disabled={submitting}
                  >
                    {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </>
              ) : (
                <>
                  <button 
                    type="button" 
                    onClick={startEditingDetail} 
                    className={styles.saveBtn}
                    style={{ marginRight: 'auto', background: 'var(--color-cobalt-blue)' }}
                  >
                    Tindak Lanjuti / Edit
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setSelectedDetailLog(null)} 
                    className={styles.cancelBtn}
                  >
                    Tutup
                  </button>
                </>
              )}
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
