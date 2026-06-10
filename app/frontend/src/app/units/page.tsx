'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { unitApi } from '@/lib/api';
import { Search, ShieldCheck, Upload, Plus } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import BulkUploadModal from './components/BulkUploadModal';
import { DesktopTable, Pagination, MobileCards } from './components/UnitsTable';
import styles from './units.module.css';

function UnitsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalCount, setTotalCount] = useState(0);
  const [cityFilter, setCityFilter] = useState('');
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [clientFilter, setClientFilter] = useState('');
  const [availableClients, setAvailableClients] = useState<{id: string, name: string}[]>([]);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);

  const filterParam = searchParams.get('filter');
  const isWarrantyFilter = filterParam === 'warranty';

  const loadUnits = useCallback(async (page: number) => {
    setLoading(true);
    try {
      let user = null;
      try {
        const userData = localStorage.getItem('user');
        if (userData && userData !== 'undefined' && userData !== 'null') {
          user = JSON.parse(userData);
        }
      } catch { /* ignore */ }

      let response;
      if (user?.role === 'CLIENT') {
        response = await unitApi.findMyFleet();
      } else if (user?.role === 'PARTNER') {
        router.push('/partner-portal');
        return;
      } else {
        response = await unitApi.findAll(page, pageSize, searchTerm, cityFilter, clientFilter);
      }

      const { data } = response;
      let unitsArray: any[] = [];
      let countValue = 0;

      if (Array.isArray(data)) {
        unitsArray = data;
        countValue = data.length;
      } else if (data && typeof data === 'object') {
        unitsArray = data.data || data.items || [];
        countValue = data.meta?.total ?? data.total ?? data.count ?? unitsArray.length;
      }

      setUnits(unitsArray);
      setTotalCount(countValue);
    } catch (err: any) {
      console.error('Failed to load units', err);
      if (err?.response?.status === 403 || err?.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }
      setUnits([]);
    } finally {
      setLoading(false);
    }
  }, [pageSize, searchTerm, cityFilter, clientFilter, router]);

  useEffect(() => { loadUnits(currentPage); }, [currentPage, loadUnits]);

  // Extract available cities and clients
  useEffect(() => {
    if (units.length > 0) {
      const cities = [...new Set(
        units.map((u: any) => u.city || u.current_client?.city).filter(Boolean)
      )].sort() as string[];
      setAvailableCities(prev => [...new Set([...prev, ...cities])].sort());

      const clientsMap = new Map();
      units.forEach((u: any) => {
        if (u.current_client?.id && u.current_client?.company_name) {
          clientsMap.set(u.current_client.id, u.current_client.company_name);
        }
      });
      setAvailableClients(prev => {
        const merged = new Map(prev.map(p => [p.id, p.name]));
        clientsMap.forEach((name, id) => merged.set(id, name));
        return Array.from(merged.entries()).map(([id, name]) => ({id, name})).sort((a, b) => a.name.localeCompare(b.name));
      });
    }
  }, [units]);

  // Client-side filter for warranty view
  const today = new Date();
  const filteredUnits = units.filter(u => {
    const matchesSearch =
      (u.serial_number ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.model_name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.current_client?.company_name ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesWarranty = !isWarrantyFilter || (u.warranty_expiry && new Date(u.warranty_expiry) >= today);
    const matchesCity = !cityFilter || (u.city || u.current_client?.city || '').toLowerCase() === cityFilter.toLowerCase();
    const matchesClient = !clientFilter || (u.current_client?.id === clientFilter);
    return matchesSearch && matchesWarranty && matchesCity && matchesClient;
  });

  const displayedUnits = isWarrantyFilter ? filteredUnits.slice(0, pageSize) : units;
  const effectiveTotal = isWarrantyFilter ? filteredUnits.length : totalCount;
  const totalPages = Math.max(1, Math.ceil(effectiveTotal / pageSize));

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  useEffect(() => { loadUnits(1); }, [searchTerm, loadUnits]);

  return (
    <div className={styles.container}>
      <header className={styles.pageHeader}>
        <div>
          <h2 className={styles.title}>
            Unit Digital Passport
            {isWarrantyFilter && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                marginLeft: '12px', fontSize: '0.75rem', fontWeight: 600,
                background: '#00C48C20', color: '#00C48C',
                border: '1px solid #00C48C40', borderRadius: '20px',
                padding: '3px 10px', verticalAlign: 'middle',
              }}>
                <ShieldCheck size={13} /> Under Warranty
              </span>
            )}
          </h2>
          <p className={styles.subtitle}>
            {isWarrantyFilter
              ? 'Menampilkan unit yang masih dalam masa garansi.'
              : 'Manage and track all registered units in the system.'}
          </p>
        </div>
        {(isWarrantyFilter || cityFilter || clientFilter) && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {isWarrantyFilter && (
              <button onClick={() => router.push('/units')} style={{ background: 'none', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px 14px', fontSize: '0.8rem', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Hapus Filter Garansi
              </button>
            )}
            {cityFilter && (
              <button onClick={() => setCityFilter('')} style={{ background: 'none', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px 14px', fontSize: '0.8rem', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Hapus Filter Kota
              </button>
            )}
            {clientFilter && (
              <button onClick={() => setClientFilter('')} style={{ background: 'none', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px 14px', fontSize: '0.8rem', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Hapus Filter Customer
              </button>
            )}
          </div>
        )}
      </header>

      <div className="mobile-sub-tabs">
        <button className="mobile-sub-tab active" onClick={() => router.push('/units')}>Daftar Unit</button>
        <button className="mobile-sub-tab" onClick={() => router.push('/units/new')}>Registrasi Unit</button>
      </div>

      <div className={styles.tableCard}>
        {/* Toolbar */}
        <div className="dtToolbar">
          <div className="dtToolbarLeft">
            <div className="dtToolbarText">
              Show
              <CustomSelect options={[{ value: '15', label: '15' }, { value: '30', label: '30' }, { value: '50', label: '50' }]} value={pageSize.toString()} onChange={(val) => { setPageSize(parseInt(val, 10)); setCurrentPage(1); }} />
              entries
            </div>
            <CustomSelect options={[{ value: '', label: 'Category' }, { value: 'showcase', label: 'Showcase' }, { value: 'mesin', label: 'Mesin' }]} value="" onChange={() => {}} placeholder="Category" />
            <CustomSelect options={[{ value: '', label: 'Customer' }, ...availableClients.map(c => ({ value: c.id, label: c.name }))]} value={clientFilter} onChange={(val) => { setClientFilter(val); setCurrentPage(1); }} placeholder="Customer" />
            <CustomSelect options={[{ value: '', label: 'City' }, ...availableCities.map(c => ({ value: c, label: c }))]} value={cityFilter} onChange={(val) => { setCityFilter(val); setCurrentPage(1); }} placeholder="City" />
          </div>
          <div className="dtToolbarRight">
            <div className="dtToolbarSearch">
              <input type="text" placeholder="Search serial number..." value={searchTerm} onChange={handleSearch} className="dtToolbarSearchInput" />
              <Search size={16} className="dtToolbarSearchIcon" />
            </div>
            <button className="dtToolbarCreateBtn" onClick={() => setBulkModalOpen(true)} style={{ background: '#001F3F', marginRight: '8px' }}>
              <Upload size={15} strokeWidth={2.5} /> Bulk Upload
            </button>
            <button className="dtToolbarCreateBtn" onClick={() => router.push('/units/new')}>
              <Plus size={16} strokeWidth={2.5} /> Create New
            </button>
          </div>
        </div>

        <DesktopTable units={displayedUnits} loading={loading} pageSize={pageSize} />
        <Pagination currentPage={currentPage} totalPages={totalPages} loading={loading} effectiveTotal={effectiveTotal} pageSize={pageSize} onPageChange={setCurrentPage} />
        <MobileCards units={displayedUnits} loading={loading} currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      <BulkUploadModal open={bulkModalOpen} onClose={() => setBulkModalOpen(false)} onSuccess={() => loadUnits(1)} />
    </div>
  );
}

export default function UnitsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Memuat data unit...</div>}>
      <UnitsPageInner />
    </Suspense>
  );
}
