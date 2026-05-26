'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { unitApi, partnerApi, serviceLogApi } from '@/lib/api';
import { 
  Calendar, Wrench, Search, ChevronRight, MapPin, Building, 
  User, CheckCircle, Clock, AlertCircle, X, Loader2, ArrowLeft,
  HelpCircle, ShieldCheck
} from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import styles from './planning.module.css';
import StatsGrid from '@/components/dashboard/StatsGrid';

export default function ServicePlanningPage() {
  const router = useRouter();

  // Core data states
  const [units, setUnits] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [serviceLogs, setServiceLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Modal State for Assigning PM
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('Perawatan berkala rutin (Preventive Maintenance). Pembersihan condenser coils, pengecekan refrigeran, kelistrikan, dan pembersihan filter.');
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch all necessary data on mount
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [unitsRes, partnersRes, logsRes] = await Promise.all([
        unitApi.findAll(1, 1000),
        partnerApi.findAll(),
        serviceLogApi.findAll(1, 1000)
      ]);

      if (unitsRes.data && Array.isArray(unitsRes.data.data)) {
        setUnits(unitsRes.data.data);
      } else if (Array.isArray(unitsRes.data)) {
        setUnits(unitsRes.data);
      }

      if (Array.isArray(partnersRes.data)) {
        setPartners(partnersRes.data);
      }

      if (logsRes.data && Array.isArray(logsRes.data.data)) {
        setServiceLogs(logsRes.data.data);
      } else if (Array.isArray(logsRes.data)) {
        setServiceLogs(logsRes.data);
      }
    } catch (e: any) {
      console.error('Failed to load planning data:', e);
      setError('Gagal memuat data kalender rencana servis. Pastikan server backend Anda menyala.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Helper: Calculate next PM date based on 3-month recurring cycle from unit creation
  const getPmSchedule = (unit: any) => {
    const registrationDate = unit.created_at ? new Date(unit.created_at) : new Date();
    const today = new Date();
    
    // Cycle starts from registrationDate, recurring every 3 months
    let nextPm = new Date(registrationDate);
    
    // Increment by 3 months until nextPm is in the future
    while (nextPm <= today) {
      nextPm.setMonth(nextPm.getMonth() + 3);
    }

    // Determine status priority
    const diffTime = nextPm.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let statusLabel = 'SCHEDULED';
    let statusText = 'Terjadwal';
    
    if (diffDays <= 15) {
      statusLabel = 'DUE';
      statusText = 'Jatuh Tempo';
    } else if (diffDays > 90) {
      // Out of sync or long past
      statusLabel = 'OVERDUE';
      statusText = 'Terlambat';
    }

    // Find last PM done date if any
    const pmLogs = serviceLogs.filter(
      log => log.unit?.id === unit.id && log.status === 'COMPLETED'
    );
    const lastPm = pmLogs.length > 0 ? new Date(pmLogs[0].service_date) : null;

    return {
      nextPmDate: nextPm,
      daysRemaining: diffDays,
      statusLabel,
      statusText,
      lastPmDate: lastPm
    };
  };

  const handleOpenAssign = (unit: any) => {
    setSelectedUnit(unit);
    const schedule = getPmSchedule(unit);
    
    // Default to the calculated next PM date
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
      
      // Reload everything
      await fetchData();
    } catch (err: any) {
      console.error('Submit PM schedule error:', err);
      const errMsg = err.response?.data?.message;
      setFormError(errMsg || 'Gagal mendelegasikan jadwal PM. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Belum Pernah';
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Compile full schedule for each unit
  const compiledSchedules = units.map(unit => {
    const schedule = getPmSchedule(unit);
    return {
      unit,
      ...schedule
    };
  });

  // Filter schedules based on Search & Status Priority
  const filteredSchedules = compiledSchedules.filter(item => {
    const matchesPriority = priorityFilter === 'ALL' || item.statusLabel === priorityFilter;

    const sn = item.unit.serial_number?.toLowerCase() || '';
    const model = item.unit.model_name?.toLowerCase() || '';
    const client = item.unit.current_client?.company_name?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();

    const matchesSearch = sn.includes(query) || model.includes(query) || client.includes(query);

    return matchesPriority && matchesSearch;
  });

  // Statistics
  const totalScheduled = compiledSchedules.length;
  const dueThisMonth = compiledSchedules.filter(s => s.statusLabel === 'DUE').length;
  const overdueCount = compiledSchedules.filter(s => s.statusLabel === 'OVERDUE').length;

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.pageHeader}>
        <div className={styles.titleSection}>
          <button className={styles.backBtn} onClick={() => router.push('/service')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--color-space-grey)', cursor: 'pointer', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 700 }}>
            <ArrowLeft size={16} />
            <span>Kembali ke Log Servis</span>
          </button>
          <h2 className={styles.title}>Rencana &amp; Penjadwalan Servis</h2>
          <p className={styles.subtitle}>Sistem Kalender Pemeliharaan Berkala (Preventive Maintenance) Digital Twin.</p>
        </div>
      </header>

      {/* Mobile Submenu Pill Tabs */}
      <div className="mobile-sub-tabs">
        <button 
          className="mobile-sub-tab"
          onClick={() => router.push('/service')}
        >
          Log Servis
        </button>
        <button 
          className="mobile-sub-tab active"
          onClick={() => router.push('/service/planning')}
        >
          Rencana Servis
        </button>
      </div>

      {/* Stats Cards */}
      <StatsGrid
        loading={loading}
        items={[
          { label: 'Total Unit Dipantau', value: loading ? '...' : totalScheduled, max: 1000, icon: Calendar, accent: '#2E5BFF' },
          { label: 'Jatuh Tempo Bulan Ini', value: loading ? '...' : dueThisMonth, max: 100, icon: Clock, accent: '#FF6B00' },
          { label: 'Terlambat Penjadwalan', value: loading ? '...' : overdueCount, max: 50, icon: AlertCircle, accent: '#FF4D4D' }
        ]}
      />

      {/* Enterprise Datatable Toolbar */}
      <div className="dtToolbar">
        <div className="dtToolbarLeft">
          <div className="dtToolbarText">
            Urgensi PM:
          </div>
          
          <CustomSelect 
            value={priorityFilter} 
            onChange={(val) => setPriorityFilter(val)}
            options={[
              { value: 'ALL', label: 'Semua Unit' },
              { value: 'DUE', label: 'Jatuh Tempo Bulan Ini' },
              { value: 'SCHEDULED', label: 'Terjadwal (Aman)' },
              { value: 'OVERDUE', label: 'Terlambat Penjadwalan' }
            ]}
            placeholder="Urgensi PM..."
          />
        </div>

        <div className="dtToolbarRight">
          <div className="dtToolbarSearch">
            <input 
              type="text" 
              placeholder="Cari SN, model, atau klien..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="dtToolbarSearchInput"
            />
            <Search size={16} className="dtToolbarSearchIcon" />
          </div>
        </div>
      </div>

      {/* Main Schedules Layout */}
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
            <div key={unit.id} className={styles.planningCard}>
              {/* Card Header */}
              <div className={styles.cardHeader}>
                <div className={styles.unitInfo}>
                  <h3 className={styles.modelName}>{unit.model_name}</h3>
                  <span className={styles.serialNumber}>SN: {unit.serial_number}</span>
                </div>
                <span className={`${styles.statusBadge} ${
                  statusLabel === 'DUE' ? styles.statusDue :
                  statusLabel === 'OVERDUE' ? styles.statusOverdue :
                  styles.statusScheduled
                }`}>
                  {statusText}
                </span>
              </div>

              {/* Card Body */}
              <div className={styles.cardBody}>
                <div className={styles.metaRow}>
                  <Building size={16} className={styles.metaIcon} />
                  <span className={styles.metaLabel}>Pemilik Resmi:</span>
                  <span>{unit.current_client?.company_name || 'Internal Stock'}</span>
                </div>
                <div className={styles.metaRow}>
                  <MapPin size={16} className={styles.metaIcon} />
                  <span className={styles.metaLabel}>Kota Lokasi:</span>
                  <span>{unit.current_client?.city || 'Jakarta (HQ)'}</span>
                </div>
                <div className={styles.metaRow}>
                  <CheckCircle size={16} className={styles.metaIcon} />
                  <span className={styles.metaLabel}>PM Terakhir:</span>
                  <span>{formatDate(lastPmDate)}</span>
                </div>

                {/* Forecast Box */}
                <div className={styles.forecastBox}>
                  <span className={styles.forecastTitle}>Inspeksi PM Terdekat</span>
                  <span className={styles.forecastDate}>{formatDate(nextPmDate)}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: statusLabel === 'DUE' ? 'var(--color-safety-orange)' : 'var(--color-space-grey)' }}>
                    ({daysRemaining} hari lagi)
                  </span>
                </div>
              </div>

              {/* Card Footer: Action button */}
              <div className={styles.cardFooter}>
                <button className={styles.assignBtn} onClick={() => handleOpenAssign(unit)}>
                  <Wrench size={16} />
                  <span>Tugaskan Inspeksi PM</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assign PM Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <form onSubmit={handleSubmit} autoComplete="off" className={styles.modalCard}>
            <header className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Tugaskan Jadwal PM Rutin</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className={styles.closeBtn}>
                <X size={20} />
              </button>
            </header>

            <div className={styles.modalBody}>
              {formError && <div className={styles.errorAlert}>{formError}</div>}

              <div style={{ background: 'rgba(46, 91, 255, 0.05)', padding: '14px', borderRadius: '10px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '4px', border: '1px solid rgba(46, 91, 255, 0.1)' }}>
                <span style={{ fontWeight: 800, color: 'var(--color-cobalt-blue)', textTransform: 'uppercase', fontSize: '0.75rem' }}>Unit Yang Ditugaskan</span>
                <span style={{ fontWeight: 700, color: 'var(--color-deep-navy)' }}>{selectedUnit?.model_name}</span>
                <span style={{ color: 'var(--color-space-grey)' }}>Serial Number: <strong>{selectedUnit?.serial_number}</strong></span>
              </div>

              {/* Partner Dropdown */}
              <div className={styles.formGroup}>
                <label>Pilih Mitra Regional Penanggungjawab *</label>
                <select 
                  value={selectedPartnerId} 
                  onChange={(e) => setSelectedPartnerId(e.target.value)}
                  required
                >
                  <option value="">— Pilih Partner Regional —</option>
                  {partners.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.partner_name} ({p.city})
                    </option>
                  ))}
                </select>
              </div>

              {/* Scheduled Date */}
              <div className={styles.formGroup}>
                <label>Tanggal Rencana Kunjungan PM *</label>
                <input 
                  type="date" 
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  required
                />
              </div>

              {/* Notes */}
              <div className={styles.formGroup}>
                <label>Cakupan Pekerjaan PM (Notes) *</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Instruksi checklist perawatan mesin..."
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            <footer className={styles.modalFooter}>
              <button type="button" onClick={() => setIsModalOpen(false)} className={styles.cancelBtn}>
                Batal
              </button>
              <button type="submit" className={styles.saveBtn} disabled={submitting}>
                {submitting ? 'Menugaskan...' : 'Tugaskan Sekarang'}
              </button>
            </footer>
          </form>
        </div>
      )}
    </div>
  );
}
