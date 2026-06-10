'use client';

import { useState, useEffect } from 'react';
import { unitApi } from '@/lib/api';

export function useSmartRouting(
  unit: any,
  user: any,
  loadUnitData: () => void,
  showToast: (message: string, type: 'success' | 'error' | 'info') => void,
) {
  // Service Request modal
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [issueMainCategory, setIssueMainCategory] = useState('');
  const [issueSubCategory, setIssueSubCategory] = useState('');
  const [serviceNotes, setServiceNotes] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [servicePhone, setServicePhone] = useState('');
  const [storeName, setStoreName] = useState('');
  const [routingResult, setRoutingResult] = useState<any>(null);
  const [routingLoading, setRoutingLoading] = useState(false);

  // Partner Log modal
  const [showLogModal, setShowLogModal] = useState(false);
  const [techName, setTechName] = useState('');
  const [logType, setLogType] = useState('CORRECTIVE');
  const [logNotes, setLogNotes] = useState('');
  const [logStatus, setLogStatus] = useState('COMPLETED');
  const [logComponents, setLogComponents] = useState('');
  const [logLoading, setLogLoading] = useState(false);

  // Admin Transfer modal
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [targetClientId, setTargetClientId] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);

  // All Specs modal
  const [showAllSpecsModal, setShowAllSpecsModal] = useState(false);

  // Media viewer
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);

  // Load clients when Admin opens transfer modal
  useEffect(() => {
    if (user?.role === 'ADMIN' && showTransferModal) {
      const fetchClients = async () => {
        try {
          const storedToken = localStorage.getItem('token');
          if (storedToken) {
            const res = await fetch('/api/clients', { headers: { Authorization: `Bearer ${storedToken}` } });
            const data = await res.json();
            setClients(Array.isArray(data) ? data : (data?.data || []));
          }
        } catch { /* ignore */ }
      };
      fetchClients();
    }
  }, [user, showTransferModal]);

  // Pre-fill tech name when log modal opens
  useEffect(() => {
    if (showLogModal && user?.name && !techName) setTechName(user.name);
  }, [showLogModal]);

  // ── Handlers ──

  const closeServiceModal = () => {
    setShowServiceModal(false);
    setRoutingResult(null);
    setIssueMainCategory('');
    setIssueSubCategory('');
    setServiceNotes('');
    setStoreName('');
  };

  const closeLogModal = () => {
    setShowLogModal(false);
    setLogStatus('COMPLETED');
    setLogComponents('');
  };

  const handleServiceRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setRoutingLoading(true);
    try {
      const combinedNotes = `[${issueMainCategory}${issueSubCategory ? ` - ${issueSubCategory}` : ''}] ${serviceNotes}`.trim();
      const contactInfo = { city: unit.city || unit.current_client?.city || unit.specs?.city || 'Jakarta' };
      const { data } = await unitApi.requestService(unit.id, {
        city: contactInfo.city, notes: combinedNotes, contact_name: serviceName, contact_phone: servicePhone,
      });
      setRoutingResult(data);
      loadUnitData();
      if (data.routed_to === 'HQ_FALLBACK' && data.whatsapp_link) {
        setTimeout(() => window.open(data.whatsapp_link, '_blank'), 1500);
      }
    } catch { showToast('Gagal mengirim permintaan servis.', 'error'); }
    finally { setRoutingLoading(false); }
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogLoading(true);
    try {
      const storedToken = localStorage.getItem('token');
      const res = await fetch('/api/service-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${storedToken}` },
        body: JSON.stringify({
          unitId: unit.id, service_date: new Date().toISOString(),
          technician_name: techName || user?.name,
          issue_description: logType === 'PREVENTIVE' ? 'Perawatan Rutin (PM)' : 'Perbaikan Masalah / Kerusakan',
          action_taken: logNotes, status: logStatus || 'COMPLETED',
        }),
      });
      if (res.ok) {
        showToast('Log servis berhasil ditambahkan!', 'success');
        closeLogModal(); setTechName(''); setLogNotes('');
        loadUnitData();
      } else { showToast('Gagal menyimpan log servis.', 'error'); }
    } catch { showToast('Gagal menghubungi server.', 'error'); }
    finally { setLogLoading(false); }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetClientId) { showToast('Pilih klien tujuan terlebih dahulu!', 'info'); return; }
    setTransferLoading(true);
    try {
      const storedToken = localStorage.getItem('token');
      const res = await fetch(`/api/units/${unit.id}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${storedToken}` },
        body: JSON.stringify({ toClientId: targetClientId, reason: transferReason || 'Transfer kepemilikan rutin', notes: 'Dibuat otomatis dari dashboard transfer digital' }),
      });
      if (res.ok) {
        showToast('Kepemilikan unit berhasil dipindahkan!', 'success');
        setShowTransferModal(false); setTransferReason(''); loadUnitData();
      } else { showToast('Gagal melakukan transfer kepemilikan.', 'error'); }
    } catch { showToast('Gagal menghubungi server.', 'error'); }
    finally { setTransferLoading(false); }
  };

  return {
    showServiceModal, setShowServiceModal, closeServiceModal,
    issueMainCategory, setIssueMainCategory, issueSubCategory, setIssueSubCategory,
    serviceNotes, setServiceNotes, serviceName, setServiceName,
    servicePhone, setServicePhone, storeName, setStoreName,
    routingResult, routingLoading, handleServiceRequest,

    showLogModal, setShowLogModal, closeLogModal,
    techName, setTechName, logType, setLogType,
    logNotes, setLogNotes, logStatus, setLogStatus,
    logComponents, setLogComponents, logLoading, handleAddLog,

    showTransferModal, setShowTransferModal,
    clients, targetClientId, setTargetClientId,
    transferReason, setTransferReason, transferLoading, handleTransfer,

    showAllSpecsModal, setShowAllSpecsModal,
    selectedMedia, setSelectedMedia,
  };
}
