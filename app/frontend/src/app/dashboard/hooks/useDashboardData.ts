'use client';

import { useEffect, useState } from 'react';
import { unitApi, serviceLogApi, reportApi, partnerApi } from '@/lib/api';
import {
  StatsData, ChartMonth, ScheduleItem, PMItem, WarrantyCategories,
  computeStats, filterOneYearLogs, buildChartData,
  computeActiveClients, computeFrequentUnits,
  computeSchedules, computeAnalytics, computeUpcomingPMs,
} from '../utils';

export function useDashboardData() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [liveTime, setLiveTime] = useState('');

  const [statsData, setStatsData] = useState<StatsData>({
    activeUnits: 0, underWarranty: 0, openReports: 0,
    issuesDetected: 0, activePartners: 0, fleetHealth: 0,
  });
  const [chartData, setChartData] = useState<ChartMonth[]>([]);
  const [activeClients, setActiveClients] = useState<any[]>([]);
  const [frequentUnits, setFrequentUnits] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<ScheduleItem[]>([]);
  const [upcomingPMs, setUpcomingPMs] = useState<PMItem[]>([]);
  const [frequentCallIds, setFrequentCallIds] = useState<any[]>([]);
  const [overdueCallIds, setOverdueCallIds] = useState<any[]>([]);
  const [warrantyCategories, setWarrantyCategories] = useState<WarrantyCategories>({
    glass: 0, electrical: 0, refrigeration: 0,
  });
  const [newServiceRequests, setNewServiceRequests] = useState<any[]>([]);

  // Live clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setLiveTime(now.toLocaleTimeString('id-ID', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      }) + ' WIB');
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async (isSync = false) => {
    if (isSync) setSyncing(true);
    else setLoading(true);

    try {
      let user = null;
      try {
        const userData = localStorage.getItem('user');
        if (userData && userData !== 'undefined' && userData !== 'null') {
          user = JSON.parse(userData);
        }
      } catch { }
      const isAdmin = user?.role === 'ADMIN';

      const [unitsRes, serviceLogsRes, reportsRes, partnersRes] = await Promise.all([
        (isAdmin ? unitApi.findAll(1, 1000) : unitApi.findMyFleet()).catch(() => ({ data: [] })),
        serviceLogApi.findAll(1, 1000).catch(() => ({ data: [] })),
        reportApi.findAll(1, 1000).catch(() => ({ data: [] })),
        partnerApi.findAll().catch(() => ({ data: [] })),
      ]);

      const rawUnits = unitsRes.data?.data || unitsRes.data || [];
      const rawLogs = serviceLogsRes.data?.data || serviceLogsRes.data || [];
      const rawReports = reportsRes.data?.data || reportsRes.data || [];
      const rawPartners = partnersRes.data?.data || partnersRes.data || [];

      setStatsData(computeStats(rawUnits, rawReports, rawPartners));

      const oneYearLogs = filterOneYearLogs(rawLogs);
      setChartData(buildChartData(oneYearLogs));
      setActiveClients(computeActiveClients(oneYearLogs));
      setFrequentUnits(computeFrequentUnits(oneYearLogs));
      setRecentActivities(computeSchedules(rawLogs));

      const analytics = computeAnalytics(rawLogs);
      setFrequentCallIds(analytics.frequentCallIds);
      setOverdueCallIds(analytics.overdueCallIds);
      setWarrantyCategories(analytics.warrantyCategories);

      setUpcomingPMs(computeUpcomingPMs(rawLogs));

      // Real-time new service requests (Pending / In Progress yang terbaru)
      const parseIssueSnippet = (rawDesc: string) => {
        if (!rawDesc) return 'Permintaan servis masuk.';
        const match = rawDesc.match(/(.*?)\s*\(Kontak:/i);
        return match ? match[1].trim() : rawDesc.slice(0, 90);
      };

      const formatTimeAgo = (dateStr: string) => {
        if (!dateStr) return 'Baru saja';
        const ms = new Date().getTime() - new Date(dateStr).getTime();
        const mins = Math.floor(ms / 60000);
        if (mins < 1) return 'Baru saja';
        if (mins < 60) return `${mins} menit lalu`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours} jam lalu`;
        const days = Math.floor(hours / 24);
        return `${days} hari lalu`;
      };

      const realNewRequests = rawLogs
        .filter((l: any) => l.status === 'PENDING' || l.status === 'IN PROGRESS')
        .sort((a: any, b: any) => new Date(b.created_at || b.service_date || 0).getTime() - new Date(a.created_at || a.service_date || 0).getTime())
        .slice(0, 5)
        .map((l: any) => ({
          id: l.id,
          call_id: l.call_id || l.id,
          client: l.unit?.current_client?.company_name || l.client?.company_name || 'Customer / Klien',
          model: l.unit?.model_name || 'Unit Holicindo',
          sn: l.unit?.serial_number || '',
          issue: parseIssueSnippet(l.issue_description),
          timeAgo: formatTimeAgo(l.created_at || l.service_date),
          status: l.status === 'PENDING' ? 'Baru' : l.status,
          task_type: l.task_type || 'CORRECTIVE',
        }));

      setNewServiceRequests(realNewRequests);
    } catch (error) {
      console.warn('Dashboard real-time sync loaded fallbacks:', error);
      setChartData([]);
      setActiveClients([]);
      setFrequentUnits([]);
      setRecentActivities([]);
      setUpcomingPMs([]);
      setFrequentCallIds([]);
      setOverdueCallIds([]);
      setWarrantyCategories({ glass: 0, electrical: 0, refrigeration: 0 });
      setNewServiceRequests([]);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    loading, syncing, liveTime, statsData, chartData,
    activeClients, frequentUnits, recentActivities, upcomingPMs,
    frequentCallIds, overdueCallIds, warrantyCategories,
    newServiceRequests,
    fetchDashboardData,
  };
}
