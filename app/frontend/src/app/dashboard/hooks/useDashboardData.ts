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
        isAdmin ? unitApi.findAll(1, 1000) : unitApi.findMyFleet(),
        serviceLogApi.findAll(1, 1000),
        reportApi.findAll(1, 1000),
        partnerApi.findAll(),
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
    fetchDashboardData,
  };
}
