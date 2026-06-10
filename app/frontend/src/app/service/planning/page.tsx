'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { unitApi, partnerApi, serviceLogApi } from '@/lib/api';
import { Calendar, Search, Loader2, ArrowLeft, Clock, AlertCircle } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import styles from './planning.module.css';
import StatsGrid from '@/components/dashboard/StatsGrid';
import AssignPmModal from './components/AssignPmModal';
import PlanningCard from './components/PlanningCard';

export default function ServicePlanningPage() {
  const router = useRouter();
  const [units, setUnits] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [serviceLogs, setServiceLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [unitsRes, partnersRes, logsRes] = await Promise.all([
        unitApi.findAll(1, 1000), partnerApi.findAll(), serviceLogApi.findAll(1, 1000),
      ]);
      if (unitsRes.data && Array.isArray(unitsRes.data.data)) setUnits(unitsRes.data.data);
      else if (Array.isArray(unitsRes.data)) setUnits(unitsRes.data);
      if (Array.isArray(partnersRes.data)) setPartners(partnersRes.data);
      if (logsRes.data && Array.isArray(logsRes.data.data)) setServiceLogs(logsRes.data.data);
      else if (Array.isArray(logsRes.data)) setServiceLogs(logsRes.data);
    } catch (e: any) {
      console.error('Failed to load planning data:', e);
      setError('Gagal memuat data kalender rencana servis. Pastikan server backend Anda menyala.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const getPmSchedule = (unit: any) => {
    const registrationDate = unit.created_at ? new Date(unit.created_at) : new Date();
    const today = new Date();
    let nextPm = new Date(registrationDate);
    while (nextPm <= today) nextPm.setMonth(nextPm.getMonth() + 3);

    const diffDays = Math.ceil((nextPm.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    let statusLabel = 'SCHEDULED', statusText = 'Terjadwal';
    if (diffDays <= 15) { statusLabel = 'DUE'; statusText = 'Jatuh Tempo'; }
    else if (diffDays > 90) { statusLabel = 'OVERDUE'; statusText = 'Terlambat'; }

    const pmLogs = serviceLogs.filter(log => log.unit?.id === unit.id && log.status === 'COMPLETED');
    const lastPmDate = pmLogs.length > 0 ? new Date(pmLogs[0].service_date) : null;
    return { nextPmDate: nextPm, daysRemaining: diffDays, statusLabel, statusText, lastPmDate };
  };

  const handleOpenAssign = (unit: any) => {
    setSelectedUnit(unit);
    const schedule = getPmSchedule(unit);
    setScheduledDate(schedule.nextPmDate.toISOString().split('T')[0]);
    setSelectedPartnerId('');
    setNotes(`Perawatan berkala rutin (Preventive Maintenance) ke-${Math.floor(Math.random() * 4) + 1} untuk unit dengan nomor seri ${unit.serial_number}. Pembersihan kondensor, pengecekan gas refrigeran, dan kalibrasi suhu.`);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    const payload = {
      unitId: selectedUnit.id,
      partnerId: selectedPartnerId || undefined,
      issue_description: 'Siklus Pemeliharaan Berkala Terjadwal (Preventive Maintenance Schedule)',
      action_taken: `Menjalankan inspeksi berkala: ${notes.trim()}`,
      status: 'PENDING',
      service_date: new Date(scheduledDate),
      technician_name: 'Menunggu Alokasi Mitra',
    };
    try {
      await serviceLogApi.create(payload);
      setIsModalOpen(false);
      await fetchData();
    } catch (err: any) {
      console.error('Submit PM schedule error:', err);
      setFormError(err.response?.data?.message || 'Gagal mendelegasikan jadwal PM. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  const compiledSchedules = units.map(unit => ({ unit, ...getPmSchedule(unit) }));

  const filteredSchedules = compiledSchedules.filter(item => {
    const matchesPriority = priorityFilter === 'ALL' || item.statusLabel === priorityFilter;
    const sn = item.unit.serial_number?.toLowerCase() || '';
    const model = item.unit.model_name?.toLowerCase() || '';
    const client = item.unit.current_client?.company_name?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return matchesPriority && (sn.includes(query) || model.includes(query) || client.includes(query));
  });

  const totalScheduled = compiledSchedules.length;
  const dueThisMonth = compiledSchedules.filter(s => s.statusLabel === 'DUE').length;
  const overdueCount = compiledSchedules.filter(s => s.statusLabel === 'OVERDUE').length;

  return (
    <div className={styles.container}>
      <header className={styles.pageHeader}>
        <div className={styles.titleSection}>
          <button className={styles.backBtn} onClick={() => router.push('/service')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--color-space-grey)', cursor: 'pointer', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 700 }}>
            <ArrowLeft size={16} /><span>Kembali ke Log Servis</span>
          </button>
          <h2 className={styles.title}>Rencana &amp; Penjadwalan Servis</h2>
          <p className={styles.subtitle}>Sistem Kalender Pemeliharaan Berkala (Preventive Maintenance) Digital Twin.</p>
        </div>
      </header>

      <div className="mobile-sub-tabs">
        <button className="mobile-sub-tab" onClick={() => router.push('/service')}>Log Servis</button>
        <button className="mobile-sub-tab active" onClick={() => router.push('/service/planning')}>Rencana Servis</button>
      </div>

      <StatsGrid loading={loading} items={[
        { label: 'Total Unit Dipantau', value: loading ? '...' : totalScheduled, max: 1000, icon: Calendar, accent: '#2E5BFF' },
        { label: 'Jatuh Tempo Bulan Ini', value: loading ? '...' : dueThisMonth, max: 100, icon: Clock, accent: '#FF6B00' },
        { label: 'Terlambat Penjadwalan', value: loading ? '...' : overdueCount, max: 50, icon: AlertCircle, accent: '#FF4D4D' },
      ]} />

      <div className="dtToolbar">
        <div className="dtToolbarLeft">
          <div className="dtToolbarText">Urgensi PM:</div>
          <CustomSelect value={priorityFilter} onChange={(val) => setPriorityFilter(val)}
            options={[
              { value: 'ALL', label: 'Semua Unit' }, { value: 'DUE', label: 'Jatuh Tempo Bulan Ini' },
              { value: 'SCHEDULED', label: 'Terjadwal (Aman)' }, { value: 'OVERDUE', label: 'Terlambat Penjadwalan' },
            ]} placeholder="Urgensi PM..." />
        </div>
        <div className="dtToolbarRight">
          <div className="dtToolbarSearch">
            <input type="text" placeholder="Cari SN, model, atau klien..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} className="dtToolbarSearchInput" />
            <Search size={16} className="dtToolbarSearchIcon" />
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Loader2 size={36} className={styles.spin} style={{ color: 'var(--color-cobalt-blue)' }} />
        </div>
      ) : error ? (
        <div className={styles.errorAlert}>{error}</div>
      ) : filteredSchedules.length === 0 ? (
        <div className={styles.planningGrid}>
          <div className={styles.emptyState}>
            <Calendar size={48} style={{ color: 'var(--color-space-grey)', opacity: 0.4 }} />
            <h3 className={styles.emptyTitle}>Tidak Ada Jadwal Rencana Servis</h3>
            <p className={styles.emptyDesc}>Tidak ada data armada digital twin yang sesuai dengan filter pencarian Anda.</p>
          </div>
        </div>
      ) : (
        <div className={styles.planningGrid}>
          {filteredSchedules.map(({ unit, nextPmDate, daysRemaining, statusLabel, statusText, lastPmDate }) => (
            <PlanningCard key={unit.id} unit={unit} nextPmDate={nextPmDate} daysRemaining={daysRemaining}
              statusLabel={statusLabel} statusText={statusText} lastPmDate={lastPmDate}
              onAssign={() => handleOpenAssign(unit)} />
          ))}
        </div>
      )}

      {isModalOpen && selectedUnit && (
        <AssignPmModal
          unitModel={selectedUnit.model_name} unitSerial={selectedUnit.serial_number}
          partners={partners} selectedPartnerId={selectedPartnerId} setPartnerId={setSelectedPartnerId}
          scheduledDate={scheduledDate} setScheduledDate={setScheduledDate}
          notes={notes} setNotes={setNotes} formError={formError} submitting={submitting}
          onClose={() => setIsModalOpen(false)} onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
