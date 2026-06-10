'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { serviceLogApi, unitApi, partnerApi } from '@/lib/api';
import {
  Wrench, Search, Plus, Loader2, FileText, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import StatsGrid from '@/components/dashboard/StatsGrid';
import { parseIssueDescription, formatDate } from './utils';
import ServiceFormModal, { ConfirmSubmitModal } from './components/ServiceFormModal';
import ServiceDetailModal from './components/ServiceDetailModal';
import styles from './service.module.css';

export default function ServicePage() {
  const router = useRouter();

  // Core data
  const [logs, setLogs] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [pageSize, setPageSize] = useState(20);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedDetailLog, setSelectedDetailLog] = useState<any | null>(null);

  // Form states
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [actionTaken, setActionTaken] = useState('Dalam proses pengecekan teknis.');
  const [technicianName, setTechnicianName] = useState('Menunggu Alokasi');
  const [status, setStatus] = useState('PENDING');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const logsRes = await serviceLogApi.findAll(1, 200);
      setLogs(logsRes.data?.data ?? (Array.isArray(logsRes.data) ? logsRes.data : []));
      const unitsRes = await unitApi.findAll(1, 1000);
      setUnits(unitsRes.data?.data ?? (Array.isArray(unitsRes.data) ? unitsRes.data : []));
      const partnersRes = await partnerApi.findAll();
      if (Array.isArray(partnersRes.data)) setPartners(partnersRes.data);
    } catch { setError('Gagal memuat data dashboard servis.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleActualSubmit = async () => {
    setIsConfirmOpen(false);
    setSubmitting(true);
    setFormError(null);
    try {
      await serviceLogApi.create({
        unitId: selectedUnitId, partnerId: selectedPartnerId || undefined,
        issue_description: issueDescription.trim(), action_taken: actionTaken.trim(),
        status, technician_name: technicianName.trim() || undefined,
      });
      setSelectedUnitId(''); setSelectedPartnerId(''); setIssueDescription('');
      setActionTaken('Dalam proses pengecekan teknis.'); setTechnicianName('Menunggu Alokasi');
      setStatus('PENDING'); setIsModalOpen(false);
      await fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setFormError(Array.isArray(msg) ? msg.join(' | ') : (msg || 'Gagal merekam log servis.'));
    } finally { setSubmitting(false); }
  };

  const filteredLogs = logs.filter(log => {
    const matchesStatus = statusFilter === 'ALL' || log.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = [log.unit?.serial_number, log.unit?.model_name, log.partner?.partner_name, log.issue_description, log.technician_name]
      .some(v => v?.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  }).slice(0, pageSize);

  const totalRequests = logs.length;
  const pendingRequests = logs.filter(l => l.status === 'PENDING').length;
  const completedRequests = logs.filter(l => l.status === 'COMPLETED').length;

  return (
    <div className={styles.container}>
      <header className={styles.pageHeader}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Daftar Permintaan Servis</h1>
          <p className={styles.subtitle}>Rekap permasalahan dan permintaan service masuk dari Customer.</p>
        </div>
      </header>

      <div className="mobile-sub-tabs">
        <button className="mobile-sub-tab active" onClick={() => router.push('/service')}>Log Servis</button>
        <button className="mobile-sub-tab" onClick={() => router.push('/service/planning')}>Rencana Servis</button>
      </div>

      <StatsGrid loading={loading} items={[
        { label: 'Total Permintaan', value: loading ? '...' : totalRequests, max: 1000, icon: FileText, accent: '#64748b' },
        { label: 'Antrean Pending', value: loading ? '...' : pendingRequests, max: 100, icon: AlertTriangle, accent: '#FF6B00' },
        { label: 'Selesai Ditangani', value: loading ? '...' : completedRequests, max: 1000, icon: CheckCircle2, accent: '#00C48C' },
      ]} />

      {/* Toolbar */}
      <div className="dtToolbar">
        <div className="dtToolbarLeft">
          <div className="dtToolbarText">Show
            <CustomSelect options={[{ value: '20', label: '20' }, { value: '50', label: '50' }, { value: '100', label: '100' }]} value={pageSize.toString()} onChange={(val) => setPageSize(parseInt(val, 10))} />
            entries
          </div>
          <CustomSelect options={[{ value: 'ALL', label: 'Semua Status' }, { value: 'PENDING', label: 'PENDING' }, { value: 'COMPLETED', label: 'COMPLETED' }, { value: 'CANCELLED', label: 'CANCELLED' }]} value={statusFilter} onChange={(val) => setStatusFilter(val)} />
        </div>
        <div className="dtToolbarRight">
          <div className="dtToolbarSearch">
            <input type="text" placeholder="Cari SN, model, partner..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="dtToolbarSearchInput" />
            <Search size={16} className="dtToolbarSearchIcon" />
          </div>
          <button className="dtToolbarCreateBtn" onClick={() => setIsModalOpen(true)}><Plus size={16} strokeWidth={2.5} />Catat Permintaan Baru</button>
        </div>
      </div>

      {/* Table / Cards */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><Loader2 size={36} className={styles.spin} style={{ color: 'var(--color-cobalt-blue)' }} /></div>
      ) : error ? (
        <div className={styles.errorAlert}>{error}</div>
      ) : filteredLogs.length === 0 ? (
        <div className={styles.tableContainer}><div className={styles.emptyState}><Wrench size={48} style={{ color: 'var(--color-space-grey)', opacity: 0.4 }} /><h3 className={styles.emptyTitle}>Belum Ada Log Servis</h3><p className={styles.emptyDesc}>Tidak ada permintaan servis yang sesuai.</p></div></div>
      ) : (<>
        {/* Desktop Table */}
        <div className={`${styles.tableContainer} ${styles.desktopView}`}>
          <table className={styles.table}>
            <thead><tr><th>LOG ID</th><th>Unit / Mesin</th><th>Mitra Regional</th><th>Deskripsi Kendala</th><th>Tindakan / Hasil</th><th>Tgl Servis</th><th>Status</th></tr></thead>
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
                  <td>{log.partner ? <div><span className={styles.partnerName}>{log.partner.partner_name}</span><span className={styles.partnerCity}> ({log.partner.city})</span></div> : <span style={{ fontStyle: 'italic', color: 'var(--color-space-grey)', fontSize: '0.85rem' }}>HQ (Manual)</span>}</td>
                  <td>{(() => { const { issue, contact } = parseIssueDescription(log.issue_description); return (<div className={styles.issueCell}><span className={styles.issueTextMain} title={issue}>{issue}</span>{contact && <span className={styles.issueContactSub}>{contact.name} ({contact.phone})</span>}</div>); })()}</td>
                  <td><span className={styles.issueText} title={log.action_taken}>{log.action_taken}</span></td>
                  <td><span style={{ fontWeight: 600, color: 'var(--color-deep-navy)' }}>{formatDate(log.service_date)}</span></td>
                  <td><span className={`${styles.badge} ${log.status === 'PENDING' ? styles.badgePending : log.status === 'COMPLETED' ? styles.badgeCompleted : styles.badgeCancelled}`}>{log.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className={styles.mobileView}>
          {filteredLogs.map((log) => (
            <div key={log.id} className={styles.mobileCard} onClick={() => setSelectedDetailLog(log)}>
              <div className={styles.mobileCardHeader}>
                <span className={styles.mobileLogId}>{log.id}</span>
                <span className={`${styles.badge} ${log.status === 'PENDING' ? styles.badgePending : log.status === 'COMPLETED' ? styles.badgeCompleted : styles.badgeCancelled}`}>{log.status}</span>
              </div>
              <div className={styles.mobileCardBody}>
                <div className={styles.mobileCardRow}><span className={styles.mobileLabel}>Unit / Mesin</span><div className={styles.mobileUnitInfo}><span className={styles.mobileUnitModel}>{log.unit?.model_name || 'Unit Tidak Diketahui'}</span><span className={styles.mobileUnitSn}>SN: {log.unit?.serial_number || '-'}</span></div></div>
                <div className={styles.mobileCardRow}><span className={styles.mobileLabel}>Mitra Regional</span><span className={styles.mobileValue}>{log.partner ? `${log.partner.partner_name} (${log.partner.city})` : 'HQ (Manual Routing)'}</span></div>
                <div className={styles.mobileCardRow}><span className={styles.mobileLabel}>Deskripsi Kendala</span><span className={styles.mobileValueIssue}>{parseIssueDescription(log.issue_description).issue}</span></div>
                <div className={styles.mobileCardRow}><span className={styles.mobileLabel}>Tanggal Servis</span><span className={styles.mobileValueDate}>{formatDate(log.service_date)}</span></div>
              </div>
            </div>
          ))}
        </div>
      </>)}

      {/* Modals */}
      <ServiceFormModal
        show={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={() => setIsConfirmOpen(true)}
        units={units} partners={partners} formError={formError} setFormError={setFormError}
        selectedUnitId={selectedUnitId} setSelectedUnitId={setSelectedUnitId}
        selectedPartnerId={selectedPartnerId} setSelectedPartnerId={setSelectedPartnerId}
        issueDescription={issueDescription} setIssueDescription={setIssueDescription}
        actionTaken={actionTaken} setActionTaken={setActionTaken}
        technicianName={technicianName} setTechnicianName={setTechnicianName}
        status={status} setStatus={setStatus} submitting={submitting}
      />
      <ConfirmSubmitModal show={isConfirmOpen} onConfirm={handleActualSubmit} onCancel={() => setIsConfirmOpen(false)} />
      {selectedDetailLog && (
        <ServiceDetailModal
          log={selectedDetailLog} partners={partners}
          onClose={() => setSelectedDetailLog(null)}
          onUpdate={(updated) => { setLogs(prev => prev.map(l => l.id === updated.id ? updated : l)); setSelectedDetailLog(updated); }}
          submitting={submitting} setSubmitting={setSubmitting}
        />
      )}
    </div>
  );
}
