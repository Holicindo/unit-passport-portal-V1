'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { unitApi, reportApi } from '@/lib/api';

export function usePassportData() {
  const params = useParams();
  const token = params?.token;

  const [unit, setUnit] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [unitReports, setUnitReports] = useState<any[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  const clearToast = () => setToast(null);

  // Load user from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('user');
        if (stored && stored !== 'undefined' && stored !== 'null') {
          setUser(JSON.parse(stored));
        }
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, []);

  // Fetch unit data — PUBLIC first, then enrich if logged in
  const loadUnitData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: publicUnit } = await unitApi.findByQrToken(token as string);
      if (!publicUnit) throw new Error('Unit tidak ditemukan');

      let storedUser = null;
      try {
        const raw = localStorage.getItem('user');
        if (raw && raw !== 'undefined' && raw !== 'null') storedUser = JSON.parse(raw);
      } catch { /* ignore */ }

      if (storedUser && localStorage.getItem('token')) {
        try {
          const { data: fullUnit } = await unitApi.findOne(publicUnit.id);
          setUnit(fullUnit);
        } catch {
          setUnit(publicUnit);
        }
      } else {
        setUnit(publicUnit);
      }
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK') {
        setError('Network Error: Gagal terhubung ke server backend.');
      } else {
        setError(err.response?.data?.message || 'Gagal memuat data Unit Passport.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token) loadUnitData(); }, [token]);

  // Load unit reports after unit loads
  useEffect(() => {
    if (unit?.id) {
      reportApi.findByUnit(unit.id)
        .then(({ data }) => {
          const list = Array.isArray(data) ? data : (data?.data || []);
          setUnitReports(list);
        })
        .catch(() => setUnitReports([]));
    }
  }, [unit?.id]);

  // Access control
  const isGuest = !user;
  const isClient = user?.role === 'CLIENT';
  const isPartner = user?.role === 'PARTNER';
  const isAdmin = user?.role === 'ADMIN';
  const belongsToClient = isClient && unit?.current_client?.id === user?.client_id;
  const hasClientRestriction = isClient && !belongsToClient;

  // Warranty status
  const today = new Date();
  const expiryDate = unit?.warranty_expiry ? new Date(unit.warranty_expiry) : null;
  const isWarrantyActive = expiryDate ? expiryDate > today : false;

  return {
    token, unit, user, loading, error,
    isDark, setIsDark, carouselRef, unitReports,
    toast, showToast, clearToast, loadUnitData,
    isGuest, isClient, isPartner, isAdmin,
    belongsToClient, hasClientRestriction,
    isWarrantyActive, expiryDate,
  };
}
